export const TTS_ENCODINGS = ['wav', 'mp3', 'ogg'] as const;

export type TTSEncoding = (typeof TTS_ENCODINGS)[number];

export type VoiceOption = {
  capabilities: string;
  group: string;
  label: string;
  language: string;
  value: string;
};

export type SynthesisPayload = {
  context_text: string;
  encoding: TTSEncoding;
  text: string;
  use_tag_parser: boolean;
  voice_type: string;
};

export type SynthesisResult = {
  audioUrl: string;
  fileName: string;
  filePath: string;
  resourceId: string;
};
