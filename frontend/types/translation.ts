export type TranslationModeId = 'text' | 'document' | 'image' | 'voice';

export type TranslationLanguage = 'auto' | 'zh' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es';
export type ResolvedTranslationLanguage = Exclude<TranslationLanguage, 'auto'>;

export type TranslationScene =
  | 'general'
  | 'daily'
  | 'business'
  | 'academic'
  | 'social'
  | 'ecommerce'
  | 'technical'
  | 'travel';

export type TranslationTone =
  | 'natural'
  | 'formal'
  | 'polite'
  | 'concise'
  | 'professional'
  | 'casual'
  | 'marketing';

export type TranslationVersionId = 'standard' | 'natural' | 'formal';

export type TranslationVersion = {
  id: TranslationVersionId;
  label: string;
  summary: string;
  text: string;
};

export type TranslationGlossaryItem = {
  source: string;
  target: string;
  reason: string;
};

export type TranslationExplanation = {
  rationale: string[];
  alternatives: string[];
  terminology: TranslationGlossaryItem[];
};

export type TranslationDraft = {
  detectedLanguage: ResolvedTranslationLanguage;
  targetLanguage: ResolvedTranslationLanguage;
  versions: TranslationVersion[];
  explanation: TranslationExplanation;
  summary: string;
};

export type TranslationJobInput = {
  sourceText: string;
  sourceLanguage: TranslationLanguage;
  targetLanguage: ResolvedTranslationLanguage;
  scene: TranslationScene;
  tone: TranslationTone;
  preserveFormat: boolean;
  bilingual: boolean;
  prioritizeTerms: boolean;
};

export type TranslationHistoryItem = {
  id: string;
  sourcePreview: string;
  sourceText: string;
  sourceLanguage: TranslationLanguage;
  targetLanguage: ResolvedTranslationLanguage;
  scene: TranslationScene;
  tone: TranslationTone;
  createdAt: string;
  favorite: boolean;
  draft: TranslationDraft;
};
