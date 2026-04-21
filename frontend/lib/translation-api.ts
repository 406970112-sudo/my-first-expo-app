import { Platform } from 'react-native';

import type { TranslationDraft, TranslationJobInput } from '@/types/translation';

const DEV_SERVER_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://127.0.0.1:3000';
const CONFIGURED_SERVER_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || process.env.EXPO_PUBLIC_VOICE_SERVER_URL?.trim();

export function getApiBaseUrl() {
  return CONFIGURED_SERVER_URL || DEV_SERVER_URL;
}

export async function translateText(payload: TranslationJobInput): Promise<TranslationDraft> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/translation/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | (TranslationDraft & { detail?: string; error?: string })
    | { detail?: string; error?: string };

  if (!response.ok || !('versions' in data) || !Array.isArray(data.versions)) {
    throw new Error(data.detail || data.error || '翻译请求失败，请稍后重试。');
  }

  return {
    detectedLanguage: data.detectedLanguage,
    targetLanguage: data.targetLanguage,
    summary: data.summary,
    versions: data.versions,
    explanation: data.explanation,
  };
}
