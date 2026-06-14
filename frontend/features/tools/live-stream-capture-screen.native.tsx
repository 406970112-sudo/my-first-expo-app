import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { registerGlobals } from '@livekit/react-native';
import { RTCView } from '@livekit/react-native-webrtc';
import { useRouter } from 'expo-router';
import {
  createLocalTracks,
  LocalAudioTrack,
  LocalVideoTrack,
  type LocalTrack,
} from 'livekit-client';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { MobileScreen } from '@/shared/ui/mobile-screen';
import { PageHeader } from '@/shared/ui/page-header';
import { SurfaceCard } from '@/shared/ui/surface-card';

registerGlobals();

type CaptureMode = 'audio-video' | 'audio-only';

export function LiveStreamCaptureScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const tracksRef = useRef<LocalTrack[]>([]);
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
    setBusy(true);
    setMessage('正在请求设备权限并创建 LiveKit 本地轨道...');
    stopTracks();

    try {
      const tracks = await createLocalTracks({
        audio: true,
        video: nextMode === 'audio-video' ? { facingMode: 'user' } : false,
      });
      tracksRef.current = tracks;
      setVideoTrack(
        tracks.find((track): track is LocalVideoTrack => track instanceof LocalVideoTrack) ?? null
      );
      setAudioActive(tracks.some((track) => track instanceof LocalAudioTrack));
      setCapturing(true);
      setMessage(
        nextMode === 'audio-video'
          ? '正在采集摄像头与麦克风，本地轨道尚未发布。'
          : '正在仅采集麦克风，本地轨道尚未发布。'
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : '无法访问摄像头或麦克风';
      setMessage(`采集失败：${detail}`);
    } finally {
      setBusy(false);
    }
  }

  async function selectMode(nextMode: CaptureMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    if (capturing) await startCapture(nextMode);
  }

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
        {videoTrack ? (
          <RTCView
            mirror
            objectFit="cover"
            streamURL={
              (videoTrack.mediaStream as unknown as { toURL(): string } | undefined)?.toURL() ?? ''
            }
            style={styles.video}
          />
        ) : (
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
        <View style={styles.liveBadge}>
          <View style={[styles.dot, { backgroundColor: capturing ? '#32d296' : '#ffffff66' }]} />
          <ThemedText style={styles.liveBadgeText}>{capturing ? '采集中' : '未开始'}</ThemedText>
        </View>
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
          <StatusRow active={audioActive} icon="microphone" label="麦克风轨道" />
          <StatusRow active={Boolean(videoTrack)} icon="video" label="摄像头轨道" />
          <ThemedText style={[styles.message, { color: colors.mutedText }]}>{message}</ThemedText>
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

function StatusRow({
  active,
  icon,
  label,
}: {
  active: boolean;
  icon: 'video' | 'microphone';
  label: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.statusRow}>
      <MaterialCommunityIcons name={icon} size={18} color={active ? colors.success : colors.mutedText} />
      <ThemedText style={styles.statusLabel}>{label}</ThemedText>
      <ThemedText style={{ color: active ? colors.success : colors.mutedText }}>
        {active ? '已采集' : '未采集'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: { borderRadius: 999, padding: 8 },
  preview: { aspectRatio: 9 / 13, borderRadius: 28, overflow: 'hidden', position: 'relative' },
  video: { height: '100%', width: '100%' },
  previewPlaceholder: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  previewTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  liveBadge: {
    alignItems: 'center',
    backgroundColor: '#00000088',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 7,
    left: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
    position: 'absolute',
    top: 14,
  },
  dot: { borderRadius: 999, height: 8, width: 8 },
  liveBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
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
  statusBox: { borderRadius: 18, gap: 12, padding: 14 },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  statusLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  message: { fontSize: 12, lineHeight: 18 },
  primaryButton: { alignItems: 'center', borderRadius: 999, padding: 16 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});
