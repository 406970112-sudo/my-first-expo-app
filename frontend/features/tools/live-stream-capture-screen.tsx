import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import {
  createLocalTracks,
  LocalAudioTrack,
  LocalVideoTrack,
  type LocalTrack,
} from 'livekit-client';
import { createElement, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { MobileScreen } from '@/shared/ui/mobile-screen';
import { PageHeader } from '@/shared/ui/page-header';
import { SurfaceCard } from '@/shared/ui/surface-card';

type CaptureMode = 'audio-video' | 'audio-only';

function getCaptureEnvironment() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { hasGetUserMedia: false, isSecureContext: false, isWeChat: false };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isWeChat = userAgent.includes('micromessenger');
  const isSecureContext = window.isSecureContext;
  const hasGetUserMedia = Boolean(navigator.mediaDevices?.getUserMedia);

  return { hasGetUserMedia, isSecureContext, isWeChat };
}

function getUnavailableMessage() {
  const environment = getCaptureEnvironment();

  if (!environment.isSecureContext) {
    return '当前页面不是 HTTPS 安全上下文，无法申请摄像头和麦克风权限。';
  }

  if (!environment.hasGetUserMedia) {
    return environment.isWeChat
      ? '当前微信 WebView 未开放标准 WebRTC 音视频采集能力，LiveKit 无法创建本地轨道。'
      : '当前浏览器不支持网页音视频采集。';
  }

  return null;
}

export function LiveStreamCaptureScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const tracksRef = useRef<LocalTrack[]>([]);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [mode, setMode] = useState<CaptureMode>('audio-video');
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [audioActive, setAudioActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('尚未采集，不会连接房间或向服务器推流。');

  function stopTracks() {
    tracksRef.current.forEach((track) => track.stop());
    tracksRef.current = [];
    setVideoTrack(null);
    setAudioActive(false);
    setCapturing(false);
  }

  async function startCapture(nextMode = mode) {
    const unavailableMessage = getUnavailableMessage();
    if (unavailableMessage) {
      setMessage(unavailableMessage);
      return;
    }

    setBusy(true);
    setMessage('正在请求设备权限并创建 LiveKit 本地轨道...');
    stopTracks();
    try {
      const tracks = await createLocalTracks({ audio: true, video: nextMode === 'audio-video' });
      const nextVideo =
        tracks.find((track): track is LocalVideoTrack => track instanceof LocalVideoTrack) ?? null;
      tracksRef.current = tracks;
      setVideoTrack(nextVideo);
      setAudioActive(tracks.some((track) => track instanceof LocalAudioTrack));
      setCapturing(true);
      setMessage(nextMode === 'audio-video' ? '正在采集摄像头与麦克风。' : '正在仅采集麦克风。');
    } catch (error) {
      const errorName = error instanceof DOMException ? error.name : '';
      const detail = error instanceof Error ? error.message : '无法访问摄像头或麦克风';
      const isWeChat = getCaptureEnvironment().isWeChat;

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setMessage(
          isWeChat
            ? '微信或系统拒绝了摄像头/麦克风权限。请在系统设置中允许微信访问；若仍失败，当前微信 WebView 不支持 LiveKit WebRTC 采集。'
            : '摄像头或麦克风权限被拒绝，请在浏览器设置中允许后重试。'
        );
      } else {
        setMessage(`采集失败：${detail}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function selectMode(nextMode: CaptureMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    if (capturing) await startCapture(nextMode);
  }

  useEffect(() => {
    if (!videoTrack || !videoElementRef.current) return;
    const element = videoElementRef.current;
    videoTrack.attach(element);
    return () => {
      videoTrack.detach(element);
    };
  }, [videoTrack]);

  useEffect(() => () => stopTracks(), []);

  return (
    <MobileScreen>
      <PageHeader
        eyebrow="LiveKit Capture"
        title="音视频推流工具"
        subtitle="当前阶段只创建本地采集轨道，不连接 LiveKit 房间，也不会真正推流。"
        rightSlot={
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </Pressable>
        }
      />

      <View style={[styles.preview, { backgroundColor: colors.hero }]}>
        {videoTrack
          ? createElement('video', {
              autoPlay: true,
              muted: true,
              playsInline: true,
              ref: videoElementRef,
              style: { height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', width: '100%' },
            })
          : (
              <View style={styles.previewPlaceholder}>
                <MaterialCommunityIcons
                  name={mode === 'audio-only' ? 'microphone' : 'video-outline'}
                  size={54}
                  color="#ffffff"
                />
                <ThemedText style={styles.previewTitle}>
                  {mode === 'audio-only' ? '仅音频采集' : '等待摄像头画面'}
                </ThemedText>
              </View>
            )}
      </View>

      <SurfaceCard style={styles.card}>
        <ThemedText style={styles.sectionTitle}>采集模式</ThemedText>
        <View style={styles.modeRow}>
          <ModeButton
            active={mode === 'audio-video'}
            icon="video"
            label="音视频"
            onPress={() => selectMode('audio-video')}
          />
          <ModeButton
            active={mode === 'audio-only'}
            icon="microphone"
            label="仅音频"
            onPress={() => selectMode('audio-only')}
          />
        </View>
        <View style={[styles.statusBox, { backgroundColor: colors.surfaceMuted }]}>
          <ThemedText>麦克风：{audioActive ? '已采集' : '未采集'}</ThemedText>
          <ThemedText>摄像头：{videoTrack ? '已采集' : '未采集'}</ThemedText>
          <ThemedText style={{ color: colors.mutedText, fontSize: 12, lineHeight: 18 }}>{message}</ThemedText>
          {getCaptureEnvironment().isWeChat ? (
            <ThemedText style={{ color: colors.accent, fontSize: 12, lineHeight: 18 }}>
              已识别微信 WebView。权限由微信与系统共同控制，页面无法直接调用 X5 原生授权接口。
            </ThemedText>
          ) : null}
        </View>
        <Pressable
          disabled={busy}
          onPress={() => (capturing ? stopTracks() : startCapture())}
          style={[
            styles.primaryButton,
            { backgroundColor: capturing ? '#c94c61' : colors.primary, opacity: busy ? 0.7 : 1 },
          ]}>
          {busy ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>
              {capturing ? '停止采集' : '开始采集'}
            </ThemedText>
          )}
        </Pressable>
      </SurfaceCard>
    </MobileScreen>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: 'video' | 'microphone';
  label: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.modeButton,
        {
          backgroundColor: active ? colors.primary : colors.surfaceMuted,
          borderColor: active ? colors.primary : colors.line,
        },
      ]}>
      <MaterialCommunityIcons name={icon} size={22} color={active ? '#ffffff' : colors.text} />
      <ThemedText style={{ color: active ? '#ffffff' : colors.text, fontWeight: '700' }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: { borderRadius: 999, padding: 8 },
  preview: { aspectRatio: 9 / 13, borderRadius: 28, overflow: 'hidden' },
  previewPlaceholder: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  previewTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  card: { gap: 16, padding: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    padding: 14,
  },
  statusBox: { borderRadius: 18, gap: 10, padding: 14 },
  primaryButton: { alignItems: 'center', borderRadius: 999, padding: 16 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});
