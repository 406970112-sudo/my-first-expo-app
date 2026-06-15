import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import {
  createLocalAudioTrack,
  createLocalVideoTrack,
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

type CaptureEnvironment = {
  cameraAllowed: boolean;
  getUserMediaApi: 'legacy' | 'none' | 'standard';
  hasGetUserMedia: boolean;
  isEmbedded: boolean;
  isSecureContext: boolean;
  isWeChat: boolean;
  isX5: boolean;
  microphoneAllowed: boolean;
  protocol: string;
};

type BrowserPermissionsPolicy = {
  allowsFeature(feature: string): boolean;
};

type LegacyGetUserMedia = (
  constraints: MediaStreamConstraints,
  onSuccess: (stream: MediaStream) => void,
  onError: (error: DOMException) => void
) => void;

type LegacyNavigator = Navigator & {
  getUserMedia?: LegacyGetUserMedia;
  mozGetUserMedia?: LegacyGetUserMedia;
  webkitGetUserMedia?: LegacyGetUserMedia;
};

const PERMISSION_TIMEOUT_MS = 15_000;

function installLegacyGetUserMediaAdapter() {
  const legacyNavigator = navigator as LegacyNavigator;

  if (legacyNavigator.mediaDevices?.getUserMedia) return 'standard' as const;

  const legacyGetUserMedia =
    legacyNavigator.getUserMedia ??
    legacyNavigator.webkitGetUserMedia ??
    legacyNavigator.mozGetUserMedia;

  if (!legacyGetUserMedia) return 'none' as const;

  const mediaDevices = legacyNavigator.mediaDevices ?? {};
  const getUserMedia = (constraints: MediaStreamConstraints) =>
    new Promise<MediaStream>((resolve, reject) => {
      legacyGetUserMedia.call(legacyNavigator, constraints, resolve, reject);
    });

  try {
    if (!legacyNavigator.mediaDevices) {
      Object.defineProperty(legacyNavigator, 'mediaDevices', {
        configurable: true,
        value: mediaDevices,
      });
    }
    Object.defineProperty(mediaDevices, 'getUserMedia', {
      configurable: true,
      value: getUserMedia,
    });
  } catch {
    return 'none' as const;
  }

  return 'legacy' as const;
}

async function withPermissionTimeout<T>(promise: Promise<T>, source: 'camera' | 'microphone') {
  let timeoutId: number | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(new DOMException(`${source} permission request timed out`, 'PermissionRequestTimeout'));
        }, PERMISSION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
}

function getCaptureEnvironment() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      cameraAllowed: false,
      getUserMediaApi: 'none',
      hasGetUserMedia: false,
      isEmbedded: false,
      isSecureContext: false,
      isWeChat: false,
      isX5: false,
      microphoneAllowed: false,
      protocol: '',
    } satisfies CaptureEnvironment;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const getUserMediaApi = installLegacyGetUserMediaAdapter();
  const policyDocument = document as Document & {
    featurePolicy?: BrowserPermissionsPolicy;
    permissionsPolicy?: BrowserPermissionsPolicy;
  };
  const policy = policyDocument.permissionsPolicy ?? policyDocument.featurePolicy;
  const isWeChat = userAgent.includes('micromessenger');
  const isX5 = userAgent.includes('tbs/') || userAgent.includes('mqqbrowser');
  const isSecureContext = window.isSecureContext;
  const hasGetUserMedia = getUserMediaApi !== 'none';

  return {
    cameraAllowed: policy?.allowsFeature('camera') ?? true,
    getUserMediaApi,
    hasGetUserMedia,
    isEmbedded: window.self !== window.top,
    isSecureContext,
    isWeChat,
    isX5,
    microphoneAllowed: policy?.allowsFeature('microphone') ?? true,
    protocol: window.location.protocol,
  } satisfies CaptureEnvironment;
}

function getUnavailableMessage(mode: CaptureMode) {
  const environment = getCaptureEnvironment();

  if (!environment.isSecureContext && environment.getUserMediaApi !== 'legacy') {
    return '当前页面不是 HTTPS 安全上下文，无法申请摄像头和麦克风权限。';
  }

  if (!environment.hasGetUserMedia) {
    return environment.isWeChat
      ? '当前微信 WebView 未开放标准 WebRTC 音视频采集能力，LiveKit 无法创建本地轨道。'
      : '当前浏览器不支持网页音视频采集。';
  }

  if (!environment.microphoneAllowed) {
    return '当前 WebView 的 Permissions Policy 禁止麦克风访问，需要宿主允许 microphone。';
  }

  if (mode === 'audio-video' && !environment.cameraAllowed) {
    return '当前 WebView 的 Permissions Policy 禁止摄像头访问，需要宿主允许 camera。';
  }

  return null;
}

function getCaptureErrorMessage(error: unknown, source: 'camera' | 'microphone') {
  const environment = getCaptureEnvironment();
  const name = error instanceof DOMException ? error.name : '';
  const sourceLabel = source === 'camera' ? '摄像头' : '麦克风';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return environment.isWeChat
      ? `${sourceLabel}权限被微信 WebView 或系统拒绝。请确认页面使用 HTTPS，并在系统设置中允许微信访问${sourceLabel}。`
      : `${sourceLabel}权限被拒绝，请在浏览器设置中允许后重试。`;
  }

  if (name === 'PermissionRequestTimeout') {
    return `${sourceLabel}权限请求超过 15 秒未响应。微信 WebView 没有向 H5 返回授权结果，请检查微信的系统权限后重试。`;
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return `没有检测到可用的${sourceLabel}设备。`;
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return `${sourceLabel}可能正被其它页面或应用占用，请关闭占用后重试。`;
  }

  if (name === 'OverconstrainedError') {
    return `${sourceLabel}不支持当前采集参数，请更换设备后重试。`;
  }

  const detail = error instanceof Error ? error.message : `无法访问${sourceLabel}`;
  return `${sourceLabel}采集失败：${detail}`;
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
  const environment = getCaptureEnvironment();

  async function createCameraTrack() {
    try {
      return await withPermissionTimeout(createLocalVideoTrack({ facingMode: 'user' }), 'camera');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'OverconstrainedError') {
        return withPermissionTimeout(createLocalVideoTrack(), 'camera');
      }
      throw error;
    }
  }

  async function createMicrophoneTrack() {
    return withPermissionTimeout(createLocalAudioTrack(), 'microphone');
  }

  function stopTracks() {
    tracksRef.current.forEach((track) => track.stop());
    tracksRef.current = [];
    setVideoTrack(null);
    setAudioActive(false);
    setCapturing(false);
  }

  async function startCapture(nextMode = mode) {
    const unavailableMessage = getUnavailableMessage(nextMode);
    if (unavailableMessage) {
      setMessage(unavailableMessage);
      return;
    }

    setBusy(true);
    setMessage('正在请求设备权限并创建 LiveKit 本地轨道...');
    stopTracks();

    const nextTracks: LocalTrack[] = [];
    const captureMessages: string[] = [];

    try {
      if (nextMode === 'audio-video') {
        try {
          setMessage('正在请求摄像头权限...');
          nextTracks.push(await createCameraTrack());
          captureMessages.push('摄像头已就绪');
        } catch (error) {
          captureMessages.push(getCaptureErrorMessage(error, 'camera'));
        }
      }

      try {
        setMessage(
          nextMode === 'audio-video'
            ? '摄像头权限请求已完成，正在请求麦克风权限...'
            : '正在请求麦克风权限...'
        );
        nextTracks.push(await createMicrophoneTrack());
        captureMessages.push('麦克风已就绪');
      } catch (error) {
        captureMessages.push(getCaptureErrorMessage(error, 'microphone'));
      }

      if (nextTracks.length === 0) {
        throw new Error(captureMessages.join('；'));
      }

      tracksRef.current = nextTracks;
      setVideoTrack(
        nextTracks.find((track): track is LocalVideoTrack => track instanceof LocalVideoTrack) ?? null
      );
      setAudioActive(nextTracks.some((track) => track instanceof LocalAudioTrack));
      setCapturing(true);
      setMessage(captureMessages.join('；'));
    } catch (error) {
      nextTracks.forEach((track) => track.stop());
      setMessage(error instanceof Error ? error.message : '音视频采集失败。');
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
          <ThemedText>
            页面环境：{environment.protocol || '未知协议'} / {environment.isSecureContext ? '安全上下文' : '非安全上下文'}
          </ThemedText>
          <ThemedText>
            WebRTC 接口：
            {environment.getUserMediaApi === 'standard'
              ? '标准 mediaDevices.getUserMedia'
              : environment.getUserMediaApi === 'legacy'
                ? 'X5/旧 WebView 兼容接口'
                : '不可用'}
          </ThemedText>
          <ThemedText>
            宿主识别：{environment.isWeChat ? '微信 WebView' : '普通浏览器'}
            {environment.isX5 ? ' / X5 内核' : ''}
          </ThemedText>
          <ThemedText style={{ color: colors.mutedText, fontSize: 12, lineHeight: 18 }}>{message}</ThemedText>
          {environment.isWeChat ? (
            <ThemedText style={{ color: colors.accent, fontSize: 12, lineHeight: 18 }}>
              已识别微信 WebView。点击开始采集后，H5 会先通过 LiveKit 单独申请摄像头，再申请麦克风。
            </ThemedText>
          ) : null}
          {environment.isEmbedded ? (
            <ThemedText style={{ color: colors.accent, fontSize: 12, lineHeight: 18 }}>
              当前页面处于嵌入式 WebView；宿主必须允许 camera 和 microphone 权限策略。
            </ThemedText>
          ) : null}
          {!environment.isSecureContext && environment.getUserMediaApi === 'legacy' ? (
            <ThemedText style={{ color: colors.accent, fontSize: 12, lineHeight: 18 }}>
              检测到旧 X5 WebRTC 接口，将尝试申请权限；该兼容路径能否弹窗由当前微信/X5 版本决定。
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
