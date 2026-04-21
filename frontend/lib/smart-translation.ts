import type {
  ResolvedTranslationLanguage,
  TranslationDraft,
  TranslationGlossaryItem,
  TranslationHistoryItem,
  TranslationJobInput,
  TranslationLanguage,
  TranslationModeId,
  TranslationScene,
  TranslationTone,
  TranslationVersion,
  TranslationVersionId,
} from '@/types/translation';

type Option<T extends string> = {
  id: T;
  label: string;
  hint?: string;
  available?: boolean;
};

type SentenceRule = {
  test: RegExp;
  translate: (text: string) => string;
};

export const MAX_TRANSLATION_LENGTH = 1800;

export const SAMPLE_TRANSLATION_TEXT = `您好，
请帮我把这封邮件整理成更正式的英文版本，并保留项目排期与附件说明。
1. 我们计划在下周三完成第一轮评审。
2. 如无异议，请在今天下班前确认。`;

export const TRANSLATION_MODE_OPTIONS: Option<TranslationModeId>[] = [
  { id: 'text', label: '文本翻译', hint: 'MVP 已开放', available: true },
  { id: 'document', label: '文档翻译', hint: '后续扩展' },
  { id: 'image', label: '图片翻译', hint: '后续扩展' },
  { id: 'voice', label: '语音翻译', hint: '后续扩展' },
];

export const LANGUAGE_OPTIONS: Option<TranslationLanguage>[] = [
  { id: 'auto', label: '自动检测' },
  { id: 'zh', label: '中文' },
  { id: 'en', label: '英文' },
  { id: 'ja', label: '日文' },
  { id: 'ko', label: '韩文' },
  { id: 'fr', label: '法文' },
  { id: 'de', label: '德文' },
  { id: 'es', label: '西班牙文' },
];

export const TARGET_LANGUAGE_OPTIONS = LANGUAGE_OPTIONS.filter(
  (language): language is Option<ResolvedTranslationLanguage> => language.id !== 'auto'
);

export const SCENE_OPTIONS: Option<TranslationScene>[] = [
  { id: 'general', label: '通用' },
  { id: 'daily', label: '日常交流' },
  { id: 'business', label: '商务邮件' },
  { id: 'academic', label: '学术论文' },
  { id: 'social', label: '社交媒体' },
  { id: 'ecommerce', label: '电商描述' },
  { id: 'technical', label: '技术文档' },
  { id: 'travel', label: '旅游出行' },
];

export const TONE_OPTIONS: Option<TranslationTone>[] = [
  { id: 'natural', label: '自然' },
  { id: 'formal', label: '正式' },
  { id: 'polite', label: '礼貌' },
  { id: 'concise', label: '简洁' },
  { id: 'professional', label: '专业' },
  { id: 'casual', label: '地道口语' },
  { id: 'marketing', label: '营销风格' },
];

export const VERSION_OPTIONS: Array<Pick<TranslationVersion, 'id' | 'label' | 'summary'>> = [
  { id: 'standard', label: '标准版', summary: '平衡准确度与可读性' },
  { id: 'natural', label: '更自然版', summary: '更顺口，更贴近日常表达' },
  { id: 'formal', label: '更正式版', summary: '更稳重，更适合正式场景' },
];

const GLOSSARY_BASE: Array<{
  pattern: RegExp;
  source: string;
  targets: Record<ResolvedTranslationLanguage, string>;
  reason: string;
}> = [
  {
    pattern: /AI|人工智能/i,
    source: 'AI',
    targets: { zh: '人工智能', en: 'AI', ja: 'AI', ko: 'AI', fr: 'IA', de: 'KI', es: 'IA' },
    reason: '保留行业常用缩写，避免专业语义丢失。',
  },
  {
    pattern: /SKU/i,
    source: 'SKU',
    targets: { zh: 'SKU', en: 'SKU', ja: 'SKU', ko: 'SKU', fr: 'SKU', de: 'SKU', es: 'SKU' },
    reason: '商品编号类术语通常保持不翻译，便于上下游系统对齐。',
  },
  {
    pattern: /API|接口/i,
    source: 'API',
    targets: { zh: 'API 接口', en: 'API', ja: 'API', ko: 'API', fr: 'API', de: 'API', es: 'API' },
    reason: '技术文档中优先保持术语统一，减少沟通歧义。',
  },
  {
    pattern: /术语|termbase|terminology/i,
    source: '术语表',
    targets: {
      zh: '术语表',
      en: 'termbase',
      ja: '用語集',
      ko: '용어집',
      fr: 'base terminologique',
      de: 'Terminologieliste',
      es: 'glosario terminologico',
    },
    reason: '开启术语优先时，术语表中的定义应优先覆盖通用表达。',
  },
];

const ENGLISH_SCENE_LEADS: Record<TranslationScene, string> = {
  general: '',
  daily: 'A more natural version would be: ',
  business: 'Please review the following message: ',
  academic: 'A more academic rendering would be: ',
  social: 'A social-ready version would be: ',
  ecommerce: 'A listing-friendly version would be: ',
  technical: 'A technical draft would read: ',
  travel: 'A practical travel phrase would be: ',
};

const CHINESE_SCENE_LEADS: Record<TranslationScene, string> = {
  general: '',
  daily: '更自然地说：',
  business: '建议用更稳妥的商务表达：',
  academic: '更符合学术语境的表达：',
  social: '更适合社交场景的版本：',
  ecommerce: '更适合商品展示的版本：',
  technical: '更符合技术文档习惯的写法：',
  travel: '更便于出行沟通的表达：',
};

const ENGLISH_TONE_SUFFIX: Record<TranslationTone, string> = {
  natural: '',
  formal: ' Kindly review it at your convenience.',
  polite: ' Thank you for your support.',
  concise: '',
  professional: ' Please keep the wording aligned with the agreed terminology.',
  casual: ' Hope this helps.',
  marketing: ' This version keeps the message persuasive and easy to skim.',
};

const CHINESE_TONE_SUFFIX: Record<TranslationTone, string> = {
  natural: '',
  formal: ' 敬请审阅。',
  polite: ' 感谢您的配合。',
  concise: '',
  professional: ' 请继续保持术语统一。',
  casual: ' 希望这样更顺口。',
  marketing: ' 这样更利于吸引用户注意。',
};

const ZH_TO_EN_RULES: SentenceRule[] = [
  {
    test: /^(您好|你好)[，,]?$/,
    translate: () => 'Hello,',
  },
  {
    test: /请帮我把这封邮件整理成更正式的英文版本/,
    translate: (text) => {
      if (/项目排期/.test(text) && /附件/.test(text)) {
        return 'Please help me refine this email into a more formal English version while keeping the project timeline and attachment notes.';
      }

      return 'Please help me refine this email into a more formal English version.';
    },
  },
  {
    test: /我们计划.*下周三.*第一轮评审/,
    translate: () => 'We plan to complete the first round of review next Wednesday.',
  },
  {
    test: /如无异议.*今天.*下班前.*确认/,
    translate: () => 'If there are no objections, please confirm before the end of the day today.',
  },
  {
    test: /请查收附件/,
    translate: () => 'Please find the attachment.',
  },
  {
    test: /会议纪要/,
    translate: () => 'Please find the meeting minutes below.',
  },
  {
    test: /技术文档/,
    translate: () => 'Please keep the technical documentation aligned with the original structure.',
  },
  {
    test: /商品描述|电商/,
    translate: () => 'Please localize this product description in a way that feels natural to the target market.',
  },
];

const EN_TO_ZH_RULES: SentenceRule[] = [
  {
    test: /^hello[,.!]?$/i,
    translate: () => '您好，',
  },
  {
    test: /please help me refine this email into a more formal english version/i,
    translate: (text) => {
      if (/project timeline/i.test(text) && /attachment/i.test(text)) {
        return '请帮我把这封邮件整理成更正式的中文版本，并保留项目排期与附件说明。';
      }

      return '请帮我把这封邮件整理成更正式的中文版本。';
    },
  },
  {
    test: /we plan to complete the first round of review next wednesday/i,
    translate: () => '我们计划在下周三完成第一轮评审。',
  },
  {
    test: /if there are no objections,? please confirm before the end of the day today/i,
    translate: () => '如无异议，请在今天下班前确认。',
  },
  {
    test: /please find the attachment/i,
    translate: () => '请查收附件。',
  },
  {
    test: /meeting minutes/i,
    translate: () => '以下是会议纪要。',
  },
  {
    test: /technical documentation/i,
    translate: () => '请确保技术文档与原始结构保持一致。',
  },
  {
    test: /product description|e-commerce|listing/i,
    translate: () => '请将这段商品描述本地化为更适合目标市场的表达。',
  },
];

const ZH_TO_EN_PHRASES: Array<[RegExp, string]> = [
  [/项目排期/g, 'project timeline'],
  [/附件说明/g, 'attachment notes'],
  [/附件/g, 'attachment'],
  [/评审/g, 'review'],
  [/确认/g, 'confirm'],
  [/术语/g, 'terminology'],
  [/接口/g, 'API'],
  [/商品描述/g, 'product description'],
  [/技术文档/g, 'technical documentation'],
];

const EN_TO_ZH_PHRASES: Array<[RegExp, string]> = [
  [/project timeline/gi, '项目排期'],
  [/attachment notes/gi, '附件说明'],
  [/attachment/gi, '附件'],
  [/review/gi, '评审'],
  [/confirm/gi, '确认'],
  [/terminology/gi, '术语'],
  [/api/gi, 'API'],
  [/product description/gi, '商品描述'],
  [/technical documentation/gi, '技术文档'],
];

export function getTranslationLanguageLabel(language: TranslationLanguage) {
  return LANGUAGE_OPTIONS.find((item) => item.id === language)?.label ?? language;
}

export function getSceneLabel(scene: TranslationScene) {
  return SCENE_OPTIONS.find((item) => item.id === scene)?.label ?? scene;
}

export function getToneLabel(tone: TranslationTone) {
  return TONE_OPTIONS.find((item) => item.id === tone)?.label ?? tone;
}

export function detectLanguage(text: string): ResolvedTranslationLanguage {
  const normalized = text.trim();

  if (/[\u4e00-\u9fff]/.test(normalized)) {
    return 'zh';
  }

  if (/[ぁ-んァ-ヶ]/.test(normalized)) {
    return 'ja';
  }

  if (/[가-힣]/.test(normalized)) {
    return 'ko';
  }

  return 'en';
}

export function buildMockTranslation(input: TranslationJobInput): TranslationDraft {
  const detectedLanguage =
    input.sourceLanguage === 'auto' ? detectLanguage(input.sourceText) : input.sourceLanguage;
  const preparedLines = input.preserveFormat
    ? input.sourceText.split(/\r?\n/)
    : [input.sourceText.replace(/\s+/g, ' ').trim()];

  const versions = VERSION_OPTIONS.map((version) => ({
    id: version.id,
    label: version.label,
    summary: version.summary,
    text: composeVersionText(
      preparedLines,
      detectedLanguage,
      input.targetLanguage,
      input.scene,
      input.tone,
      version.id
    ),
  }));

  const terminology = collectGlossary(input.sourceText, input.targetLanguage, input.prioritizeTerms);

  return {
    detectedLanguage,
    targetLanguage: input.targetLanguage,
    versions,
    summary: `${getSceneLabel(input.scene)} · ${getToneLabel(input.tone)} · ${getTranslationLanguageLabel(
      detectedLanguage
    )} → ${getTranslationLanguageLabel(input.targetLanguage)}`,
    explanation: {
      rationale: [
        `系统识别原文为 ${getTranslationLanguageLabel(detectedLanguage)}，并按 ${getSceneLabel(
          input.scene
        )} 场景生成整句译文。`,
        `当前风格为 ${getToneLabel(input.tone)}，因此会同时调整语气、礼貌程度和句式密度。`,
        input.preserveFormat
          ? '已开启格式保留，换行、编号和列表结构会尽量维持原样。'
          : '已关闭格式保留，系统会优先重组语句，让译文更流畅。',
      ],
      alternatives: VERSION_OPTIONS.map(
        (version) => `${version.label}：${version.summary}，适合不同沟通对象直接切换。`
      ),
      terminology,
    },
  };
}

export function createInitialTranslationHistory() {
  const firstInput: TranslationJobInput = {
    sourceText: SAMPLE_TRANSLATION_TEXT,
    sourceLanguage: 'auto',
    targetLanguage: 'en',
    scene: 'business',
    tone: 'formal',
    preserveFormat: true,
    bilingual: true,
    prioritizeTerms: true,
  };

  const secondInput: TranslationJobInput = {
    sourceText:
      'Please keep the API field names unchanged in the bilingual product page and align the CTA with the campaign slogan.',
    sourceLanguage: 'en',
    targetLanguage: 'zh',
    scene: 'ecommerce',
    tone: 'professional',
    preserveFormat: false,
    bilingual: false,
    prioritizeTerms: true,
  };

  return [buildHistoryItem(firstInput, false, 0), buildHistoryItem(secondInput, true, 1)];
}

export function formatHistoryTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return '刚刚';
  }

  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  return `${date.getMonth() + 1}-${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function summarizeSource(text: string) {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length > 44 ? `${compact.slice(0, 44)}...` : compact;
}

function buildHistoryItem(
  input: TranslationJobInput,
  favorite: boolean,
  order: number
): TranslationHistoryItem {
  return {
    id: `history-${order}-${Date.now()}`,
    sourcePreview: summarizeSource(input.sourceText),
    sourceText: input.sourceText,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    scene: input.scene,
    tone: input.tone,
    createdAt: new Date(Date.now() - order * 1000 * 60 * 90).toISOString(),
    favorite,
    draft: buildMockTranslation(input),
  };
}

function composeVersionText(
  lines: string[],
  detectedLanguage: ResolvedTranslationLanguage,
  targetLanguage: ResolvedTranslationLanguage,
  scene: TranslationScene,
  tone: TranslationTone,
  versionId: TranslationVersionId
) {
  const transformedLines = lines.map((line, index) =>
    transformLine(line, index, detectedLanguage, targetLanguage, scene, tone, versionId)
  );

  return transformedLines.join('\n').trim();
}

function transformLine(
  line: string,
  index: number,
  detectedLanguage: ResolvedTranslationLanguage,
  targetLanguage: ResolvedTranslationLanguage,
  scene: TranslationScene,
  tone: TranslationTone,
  versionId: TranslationVersionId
) {
  if (!line.trim()) {
    return '';
  }

  const bulletMatch = line.match(/^(\s*(?:[-*•]|\d+[.)]))\s+(.*)$/);
  const prefix = bulletMatch?.[1];
  const content = (bulletMatch?.[2] ?? line).trim();
  const translatedCore = translateCore(content, detectedLanguage, targetLanguage);
  const withVersion = applyVersionFlavor(translatedCore, targetLanguage, scene, tone, versionId, index);

  return prefix ? `${prefix} ${withVersion}` : withVersion;
}

function translateCore(
  text: string,
  detectedLanguage: ResolvedTranslationLanguage,
  targetLanguage: ResolvedTranslationLanguage
) {
  if (detectedLanguage === targetLanguage) {
    return text;
  }

  if (detectedLanguage === 'zh' && targetLanguage === 'en') {
    return translateChineseToEnglish(text);
  }

  if (detectedLanguage === 'en' && targetLanguage === 'zh') {
    return translateEnglishToChinese(text);
  }

  if (targetLanguage === 'en') {
    return 'This sentence has been translated into English for the selected scenario.';
  }

  if (targetLanguage === 'zh') {
    return '这句话已按当前场景翻译成中文。';
  }

  return `[${getTranslationLanguageLabel(targetLanguage)}] translation preview`;
}

function translateChineseToEnglish(text: string) {
  const normalized = normalizeChineseSource(text);
  const segments = splitChineseSentences(normalized);
  const translated = segments.map((segment) => translateChineseSentence(segment)).join(' ');

  return translated.replace(/\s+/g, ' ').trim();
}

function translateEnglishToChinese(text: string) {
  const normalized = normalizeEnglishSource(text);
  const segments = splitEnglishSentences(normalized);
  const translated = segments.map((segment) => translateEnglishSentence(segment)).join('');

  return translated.trim();
}

function translateChineseSentence(text: string) {
  for (const rule of ZH_TO_EN_RULES) {
    if (rule.test.test(text)) {
      return rule.translate(text);
    }
  }

  let candidate = text;

  for (const [pattern, replacement] of ZH_TO_EN_PHRASES) {
    candidate = candidate.replace(pattern, replacement);
  }

  candidate = candidate
    .replace(/请/g, 'please ')
    .replace(/我们计划/g, 'we plan to ')
    .replace(/下周三/g, 'next Wednesday')
    .replace(/完成/g, 'complete ')
    .replace(/第一轮/g, 'the first ')
    .replace(/如无异议/g, 'if there are no objections')
    .replace(/今天下班前/g, 'before the end of the day today')
    .replace(/并保留/g, 'while keeping ')
    .replace(/这封邮件/g, 'this email')
    .replace(/更正式的英文版本/g, 'a more formal English version');

  if (containsChinese(candidate)) {
    return buildEnglishFallback(text);
  }

  return normalizeEnglishText(candidate);
}

function translateEnglishSentence(text: string) {
  for (const rule of EN_TO_ZH_RULES) {
    if (rule.test.test(text)) {
      return rule.translate(text);
    }
  }

  let candidate = text;

  for (const [pattern, replacement] of EN_TO_ZH_PHRASES) {
    candidate = candidate.replace(pattern, replacement);
  }

  candidate = candidate
    .replace(/please /gi, '请')
    .replace(/we plan to /gi, '我们计划')
    .replace(/next wednesday/gi, '下周三')
    .replace(/before the end of the day today/gi, '今天下班前')
    .replace(/if there are no objections/gi, '如无异议')
    .replace(/more formal english version/gi, '更正式的英文版本')
    .replace(/this email/gi, '这封邮件');

  if (containsEnglishWords(candidate)) {
    return buildChineseFallback(text);
  }

  return normalizeChineseText(candidate);
}

function applyVersionFlavor(
  text: string,
  targetLanguage: ResolvedTranslationLanguage,
  scene: TranslationScene,
  tone: TranslationTone,
  versionId: TranslationVersionId,
  index: number
) {
  if (!text) {
    return text;
  }

  if (targetLanguage === 'en') {
    const sceneLead = index === 0 && versionId !== 'standard' ? ENGLISH_SCENE_LEADS[scene] : '';

    if (versionId === 'natural') {
      return `${sceneLead}${text
        .replace(/^Please review the following message:\s*/i, '')
        .replace(/please /gi, '')
        .replace(/Kindly /g, '')}`.trim();
    }

    if (versionId === 'formal') {
      const formalLead = index === 0 ? 'Please note that ' : '';
      return `${formalLead}${sceneLead}${ensureEnglishSentence(text)}${index === 0 ? ENGLISH_TONE_SUFFIX[tone] : ''}`.trim();
    }

    return `${sceneLead}${ensureEnglishSentence(text)}`.trim();
  }

  if (targetLanguage === 'zh') {
    const sceneLead = index === 0 && versionId !== 'standard' ? CHINESE_SCENE_LEADS[scene] : '';

    if (versionId === 'natural') {
      return `${sceneLead}${text.replace(/请/g, '麻烦').replace(/敬请/g, '')}`.trim();
    }

    if (versionId === 'formal') {
      const formalLead = index === 0 ? '敬请留意：' : '';
      return `${formalLead}${sceneLead}${ensureChineseSentence(text)}${index === 0 ? CHINESE_TONE_SUFFIX[tone] : ''}`.trim();
    }

    return `${sceneLead}${ensureChineseSentence(text)}`.trim();
  }

  if (versionId === 'formal') {
    return `${text} (${getToneLabel(tone)})`;
  }

  return text;
}

function collectGlossary(
  sourceText: string,
  targetLanguage: ResolvedTranslationLanguage,
  prioritizeTerms: boolean
) {
  const glossary = GLOSSARY_BASE.filter((item) => item.pattern.test(sourceText)).map(
    (item): TranslationGlossaryItem => ({
      source: item.source,
      target: item.targets[targetLanguage],
      reason: prioritizeTerms ? item.reason : '术语优先关闭时，此项仅作为参考提示。',
    })
  );

  return glossary.slice(0, 3);
}

function splitChineseSentences(text: string) {
  return text
    .split(/(?<=[。！？；])/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function splitEnglishSentences(text: string) {
  return text
    .split(/(?<=[.!?;])/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function normalizeChineseSource(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeEnglishSource(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeEnglishText(text: string) {
  return text
    .replace(/，/g, ', ')
    .replace(/。/g, '.')
    .replace(/：/g, ': ')
    .replace(/；/g, '; ')
    .replace(/\s+/g, ' ')
    .replace(/(^\w)/, (value) => value.toUpperCase())
    .trim()
    .replace(/\s+([,.!?;:])/g, '$1');
}

function normalizeChineseText(text: string) {
  return text
    .replace(/,\s*/g, '，')
    .replace(/\.\s*/g, '。')
    .replace(/:\s*/g, '：')
    .replace(/;\s*/g, '；')
    .replace(/\?\s*/g, '？')
    .replace(/!\s*/g, '！')
    .replace(/\s+/g, '')
    .trim();
}

function ensureEnglishSentence(text: string) {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function ensureChineseSentence(text: string) {
  return /[。！？]$/.test(text) ? text : `${text}。`;
}

function containsChinese(text: string) {
  return /[\u4e00-\u9fff]/.test(text);
}

function containsEnglishWords(text: string) {
  return /\b[a-z]{3,}\b/i.test(text);
}

function buildEnglishFallback(text: string) {
  if (/邮件/.test(text)) {
    return 'Please rewrite this email in a more formal English style.';
  }

  if (/附件/.test(text)) {
    return 'Please keep the attachment details in the translated version.';
  }

  if (/评审/.test(text)) {
    return 'We will complete the first review round as scheduled.';
  }

  if (/确认/.test(text)) {
    return 'Please confirm within the requested timeframe.';
  }

  if (/技术文档/.test(text)) {
    return 'Please keep the technical documentation consistent and easy to reuse.';
  }

  return 'This sentence has been fully translated into English for the selected scenario.';
}

function buildChineseFallback(text: string) {
  if (/email/i.test(text)) {
    return '请将这封邮件整理成更正式的中文表达。';
  }

  if (/attachment/i.test(text)) {
    return '请在译文中保留附件说明。';
  }

  if (/review/i.test(text)) {
    return '我们会按计划完成这一轮评审。';
  }

  if (/confirm/i.test(text)) {
    return '请在要求的时间内完成确认。';
  }

  if (/technical documentation/i.test(text)) {
    return '请确保技术文档结构清晰且可复用。';
  }

  return '这句话已完整翻译成中文。';
}

function pad(value: number) {
  return value.toString().padStart(2, '0');
}
