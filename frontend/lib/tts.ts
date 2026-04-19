import { Platform } from 'react-native';

import type { SynthesisPayload, SynthesisResult } from '@/types/tts';

const DEV_SERVER_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://127.0.0.1:3000';
const CONFIGURED_SERVER_URL = process.env.EXPO_PUBLIC_VOICE_SERVER_URL?.trim();

export function getVoiceServerUrl() {
  return CONFIGURED_SERVER_URL || DEV_SERVER_URL;
}

export function isVoiceServerLocked() {
  return Boolean(CONFIGURED_SERVER_URL);
}

function joinUrl(baseUrl: string, maybeRelativeUrl: string) {
  if (/^https?:\/\//i.test(maybeRelativeUrl)) {
    return maybeRelativeUrl;
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = maybeRelativeUrl.startsWith('/')
    ? maybeRelativeUrl
    : `/${maybeRelativeUrl}`;

  return `${normalizedBase}${normalizedPath}`;
}

export async function synthesizeSpeech(
  payload: SynthesisPayload,
  serverUrl: string
): Promise<SynthesisResult> {
  const response = await fetch(`${serverUrl}/api/synthesize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as {
    audioUrl?: string;
    detail?: string;
    error?: string;
    fileName?: string;
    filePath?: string;
    resourceId?: string;
  };

  if (!response.ok || !data.audioUrl || !data.fileName || !data.filePath || !data.resourceId) {
    throw new Error(data.detail || data.error || '语音合成失败，请稍后重试。');
  }

  return {
    audioUrl: joinUrl(serverUrl, data.audioUrl),
    fileName: data.fileName,
    filePath: data.filePath,
    resourceId: data.resourceId,
  };
}
