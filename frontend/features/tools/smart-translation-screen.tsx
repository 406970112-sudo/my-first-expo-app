import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import {
  createInitialTranslationHistory,
  formatHistoryTime,
  getSceneLabel,
  getToneLabel,
  getTranslationLanguageLabel,
  LANGUAGE_OPTIONS,
  MAX_TRANSLATION_LENGTH,
  SAMPLE_TRANSLATION_TEXT,
  SCENE_OPTIONS,
  summarizeSource,
  TARGET_LANGUAGE_OPTIONS,
  TONE_OPTIONS,
  TRANSLATION_MODE_OPTIONS,
  VERSION_OPTIONS,
} from '@/lib/smart-translation';
import { translateText } from '@/lib/translation-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { MobileScreen } from '@/shared/ui/mobile-screen';
import { PageHeader } from '@/shared/ui/page-header';
import { SectionHeading } from '@/shared/ui/section-heading';
import { SurfaceCard } from '@/shared/ui/surface-card';
import type {
  ResolvedTranslationLanguage,
  TranslationDraft,
  TranslationHistoryItem,
  TranslationLanguage,
  TranslationModeId,
  TranslationScene,
  TranslationTone,
  TranslationVersionId,
} from '@/types/translation';

const QUICK_TOGGLE_OPTIONS = [
  { key: 'preserveFormat', label: '保留格式' },
  { key: 'bilingual', label: '双语对照' },
  { key: 'prioritizeTerms', label: '术语优先' },
] as const;

export function SmartTranslationToolScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [activeMode, setActiveMode] = useState<TranslationModeId>('text');
  const [sourceText, setSourceText] = useState(SAMPLE_TRANSLATION_TEXT);
  const [sourceLanguage, setSourceLanguage] = useState<TranslationLanguage>('auto');
  const [targetLanguage, setTargetLanguage] = useState<ResolvedTranslationLanguage>('en');
  const [scene, setScene] = useState<TranslationScene>('business');
  const [tone, setTone] = useState<TranslationTone>('formal');
  const [preserveFormat, setPreserveFormat] = useState(true);
  const [bilingual, setBilingual] = useState(true);
  const [prioritizeTerms, setPrioritizeTerms] = useState(true);
  const [activeVersionId, setActiveVersionId] = useState<TranslationVersionId>('standard');
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('已加载翻译工作台，可以直接开始翻译。');
  const [draft, setDraft] = useState<TranslationDraft | null>(null);
  const [history, setHistory] = useState<TranslationHistoryItem[]>(createInitialTranslationHistory);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);

  const activeVersion = draft?.versions.find((version) => version.id === activeVersionId) ?? null;
  const currentRecord = history.find((item) => item.id === currentRecordId) ?? null;
  const currentLength = sourceText.trim().length;
  const detectedLanguage =
    sourceLanguage === 'auto' ? draft?.detectedLanguage ?? inferLanguage(sourceText) : sourceLanguage;

  async function handleTranslate(regenerate = false) {
    const trimmed = sourceText.trim();

    if (!trimmed) {
      setStatusMessage('请先输入需要翻译的文本。');
      return;
    }

    if (trimmed.length > MAX_TRANSLATION_LENGTH) {
      setStatusMessage(`当前文本超过 ${MAX_TRANSLATION_LENGTH} 字，请先分段翻译。`);
      return;
    }

    setSubmitting(true);
    setShowExplanation(false);
    setStatusMessage('正在理解语境并生成多版本译文...');

    await wait(250);

    let nextDraft: TranslationDraft;
    try {
      nextDraft = await translateText({
        sourceText: trimmed,
        sourceLanguage,
        targetLanguage,
        scene,
        tone,
        preserveFormat,
        bilingual,
        prioritizeTerms,
      });
    } catch (error) {
      setSubmitting(false);
      setStatusMessage(error instanceof Error ? error.message : '翻译失败，请稍后重试。');
      return;
    }

    const nextRecord: TranslationHistoryItem = {
      id: `translation-${Date.now()}`,
      sourcePreview: summarizeSource(trimmed),
      sourceText: trimmed,
      sourceLanguage,
      targetLanguage,
      scene,
      tone,
      createdAt: new Date().toISOString(),
      favorite: currentRecord?.favorite ?? false,
      draft: nextDraft,
    };

    setDraft(nextDraft);
    setActiveVersionId('standard');
    setCurrentRecordId(nextRecord.id);
    setHistory((previous) => [nextRecord, ...previous.filter((item) => item.id !== currentRecordId)].slice(0, 6));
    setSubmitting(false);
    setStatusMessage(regenerate ? '已基于当前设置重新生成译文。' : '翻译完成，可切换不同版本继续比较。');
  }

  function handleSwapLanguages() {
    if (sourceLanguage === 'auto') {
      setSourceLanguage(targetLanguage);
      setTargetLanguage((detectedLanguage === 'auto' ? 'zh' : detectedLanguage) as ResolvedTranslationLanguage);
      setStatusMessage('已将自动检测改为当前目标语言，方便继续反向翻译。');
      return;
    }

    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setStatusMessage('已交换源语言和目标语言。');
  }

  function handleClear() {
    setSourceText('');
    setDraft(null);
    setShowExplanation(false);
    setCurrentRecordId(null);
    setStatusMessage('输入区已清空。');
  }

  function handleLoadSample() {
    setSourceText(SAMPLE_TRANSLATION_TEXT);
    setStatusMessage('已填充一段商务邮件示例，可直接体验多版本输出。');
  }

  async function handlePaste() {
    const clipboard = getClipboardApi();

    if (!clipboard?.readText) {
      setStatusMessage('当前平台没有可用的系统剪贴板读取能力。');
      return;
    }

    try {
      const text = await clipboard.readText();

      if (!text.trim()) {
        setStatusMessage('剪贴板为空。');
        return;
      }

      setSourceText(text);
      setStatusMessage('已从剪贴板粘贴文本。');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '读取剪贴板失败。');
    }
  }

  async function handleCopy() {
    if (!activeVersion?.text) {
      setStatusMessage('当前还没有可复制的译文。');
      return;
    }

    const clipboard = getClipboardApi();

    if (!clipboard?.writeText) {
      if (Platform.OS !== 'web') {
        Alert.alert('当前平台提示', '当前运行环境没有注入系统剪贴板，请长按结果区文本手动复制。');
      }

      setStatusMessage('当前环境不支持按钮直接复制，请长按文本复制。');
      return;
    }

    try {
      await clipboard.writeText(activeVersion.text);
      setStatusMessage('译文已复制到剪贴板。');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '复制失败。');
    }
  }

  function handleModePress(mode: TranslationModeId) {
    setActiveMode(mode);

    if (mode !== 'text') {
      setStatusMessage(`${getModeLabel(mode)} 属于下一阶段能力，当前先保留导航入口。`);
    } else {
      setStatusMessage('已切换回文本翻译模式。');
    }
  }

  function handleToggleFavorite(recordId: string | null) {
    if (!recordId) {
      setStatusMessage('请先生成一条翻译结果，再执行收藏。');
      return;
    }

    setHistory((previous) =>
      previous.map((item) => (item.id === recordId ? { ...item, favorite: !item.favorite } : item))
    );
    setStatusMessage('已更新收藏状态。');
  }

  function handleReuseHistory(record: TranslationHistoryItem) {
    setSourceText(record.sourceText);
    setSourceLanguage(record.sourceLanguage);
    setTargetLanguage(record.targetLanguage);
    setScene(record.scene);
    setTone(record.tone);
    setDraft(record.draft);
    setActiveVersionId('standard');
    setShowExplanation(false);
    setCurrentRecordId(record.id);
    setStatusMessage('已加载历史翻译记录，可继续修改后重新生成。');
  }

  function handleDeleteHistory(recordId: string) {
    setHistory((previous) => previous.filter((item) => item.id !== recordId));

    if (currentRecordId === recordId) {
      setCurrentRecordId(null);
    }

    setStatusMessage('已删除该条历史记录。');
  }

  return (
    <MobileScreen>
      <PageHeader
        eyebrow="AI Translation"
        title="智能翻译工作台"
        subtitle="把文本翻译升级成可调场景、风格、版本和解释的 AI 工作区，先完成 MVP 的主流程。"
        rightSlot={
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </Pressable>
        }
      />

      <View style={[styles.heroCard, { backgroundColor: colors.hero }]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <ThemedText style={styles.heroTitle}>多版本翻译 + 可解释输出</ThemedText>
            <ThemedText style={styles.heroDescription}>
              当前版本支持文本翻译、自动识别、场景/风格控制、翻译解释、历史记录和复制。
            </ThemedText>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
            <ThemedText style={styles.heroBadgeText}>MVP</ThemedText>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeRow}>
          {TRANSLATION_MODE_OPTIONS.map((mode) => {
            const selected = mode.id === activeMode;

            return (
              <Pressable
                key={mode.id}
                onPress={() => handleModePress(mode.id)}
                style={[
                  styles.modeChip,
                  {
                    backgroundColor: selected ? '#ffffff' : 'rgba(255,255,255,0.1)',
                    borderColor: selected ? '#ffffff' : 'rgba(255,255,255,0.22)',
                  },
                ]}>
                <ThemedText style={{ color: selected ? colors.hero : '#ffffff', fontWeight: '700' }}>
                  {mode.label}
                </ThemedText>
                <ThemedText style={{ color: selected ? colors.mutedText : 'rgba(255,255,255,0.68)', fontSize: 11 }}>
                  {mode.hint}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <SurfaceCard style={[styles.statusCard, { backgroundColor: colors.surfaceMuted }]}>
        <View style={styles.statusHeader}>
          <ThemedText style={styles.statusTitle}>当前状态</ThemedText>
          <ThemedText style={[styles.statusMeta, { color: colors.accent }]}>
            {getTranslationLanguageLabel(detectedLanguage)} → {getTranslationLanguageLabel(targetLanguage)}
          </ThemedText>
        </View>
        <ThemedText style={[styles.statusBody, { color: colors.mutedText }]}>{statusMessage}</ThemedText>
      </SurfaceCard>

      <SurfaceCard style={styles.workspaceCard}>
        <SectionHeading title="原文输入区" actionLabel={`${currentLength}/${MAX_TRANSLATION_LENGTH}`} />

        <View style={styles.inlineRow}>
          <ThemedText style={styles.fieldLabel}>源语言</ThemedText>
          <Pressable onPress={handleSwapLanguages} style={[styles.swapButton, { borderColor: colors.line }]}>
            <MaterialCommunityIcons name="swap-horizontal" size={18} color={colors.primary} />
            <ThemedText style={[styles.swapLabel, { color: colors.primary }]}>互换</ThemedText>
          </Pressable>
          <ThemedText style={styles.fieldLabel}>目标语言</ThemedText>
        </View>

        <View style={styles.languageColumns}>
          <View style={styles.languageColumn}>
            {LANGUAGE_OPTIONS.map((language) => (
              <SelectorChip
                key={language.id}
                label={language.label}
                selected={sourceLanguage === language.id}
                onPress={() => setSourceLanguage(language.id)}
              />
            ))}
          </View>
          <View style={styles.languageColumn}>
            {TARGET_LANGUAGE_OPTIONS.map((language) => (
              <SelectorChip
                key={language.id}
                label={language.label}
                selected={targetLanguage === language.id}
                onPress={() => setTargetLanguage(language.id)}
              />
            ))}
          </View>
        </View>

        <TextInput
          multiline
          onChangeText={setSourceText}
          placeholder="输入、粘贴或加载示例文本，系统会自动识别语言并生成多个版本。"
          placeholderTextColor={colors.mutedText}
          style={[styles.input, { borderColor: colors.line, color: colors.text }]}
          textAlignVertical="top"
          value={sourceText}
        />

        <View style={styles.actionRow}>
          <ActionButton icon="content-paste" label="粘贴" onPress={handlePaste} />
          <ActionButton icon="lightbulb-on-outline" label="示例" onPress={handleLoadSample} />
          <ActionButton icon="delete-outline" label="清空" onPress={handleClear} />
        </View>

        <View style={[styles.detectCard, { borderColor: colors.line, backgroundColor: colors.surfaceMuted }]}>
          <ThemedText style={styles.detectTitle}>自动识别</ThemedText>
          <ThemedText style={[styles.detectBody, { color: colors.mutedText }]}>
            当前输入看起来更接近 {getTranslationLanguageLabel(detectedLanguage)}，适合 {getSceneLabel(scene)} 场景，
            已按 {getToneLabel(tone)} 风格准备生成。
          </ThemedText>
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.workspaceCard}>
        <SectionHeading title="高级设置" actionLabel="场景决定方向，风格决定语气" />

        <View style={styles.settingBlock}>
          <ThemedText style={styles.settingTitle}>翻译场景</ThemedText>
          <View style={styles.wrapRow}>
            {SCENE_OPTIONS.map((item) => (
              <SelectorChip
                key={item.id}
                label={item.label}
                selected={scene === item.id}
                onPress={() => setScene(item.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.settingBlock}>
          <ThemedText style={styles.settingTitle}>表达风格</ThemedText>
          <View style={styles.wrapRow}>
            {TONE_OPTIONS.map((item) => (
              <SelectorChip
                key={item.id}
                label={item.label}
                selected={tone === item.id}
                onPress={() => setTone(item.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.toggleGrid}>
          {QUICK_TOGGLE_OPTIONS.map((option) => (
            <ToggleCard
              key={option.key}
              label={option.label}
              value={
                option.key === 'preserveFormat'
                  ? preserveFormat
                  : option.key === 'bilingual'
                    ? bilingual
                    : prioritizeTerms
              }
              onPress={() => {
                if (option.key === 'preserveFormat') {
                  setPreserveFormat((value) => !value);
                }

                if (option.key === 'bilingual') {
                  setBilingual((value) => !value);
                }

                if (option.key === 'prioritizeTerms') {
                  setPrioritizeTerms((value) => !value);
                }
              }}
            />
          ))}
        </View>

        <Pressable
          disabled={submitting || activeMode !== 'text'}
          onPress={() => void handleTranslate(false)}
          style={[
            styles.primaryButton,
            {
              backgroundColor: activeMode === 'text' ? colors.hero : colors.surfaceMuted,
              opacity: submitting ? 0.72 : 1,
            },
          ]}>
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>开始翻译</ThemedText>
          )}
        </Pressable>
      </SurfaceCard>

      <SurfaceCard style={styles.workspaceCard}>
        <SectionHeading title="译文输出区" actionLabel={draft?.summary ?? '等待生成译文'} />

        {submitting ? (
          <View style={styles.loadingState}>
            <ThemedText style={[styles.loadingTitle, { color: colors.mutedText }]}>
              正在理解语境并生成翻译
            </ThemedText>
            <View style={[styles.skeleton, { backgroundColor: colors.surfaceMuted }]} />
            <View style={[styles.skeletonShort, { backgroundColor: colors.surfaceMuted }]} />
            <View style={[styles.skeletonTall, { backgroundColor: colors.surfaceMuted }]} />
          </View>
        ) : null}

        {!submitting && !draft ? (
          <View style={[styles.emptyState, { borderColor: colors.line, backgroundColor: colors.surfaceMuted }]}>
            <ThemedText style={styles.emptyTitle}>等待翻译</ThemedText>
            <ThemedText style={[styles.emptyBody, { color: colors.mutedText }]}>
              输入文本后点击“开始翻译”，这里会展示主译文、多版本切换和翻译解释。
            </ThemedText>
          </View>
        ) : null}

        {!submitting && draft ? (
          <>
            <View style={styles.versionRow}>
              {VERSION_OPTIONS.map((version) => (
                <Pressable
                  key={version.id}
                  onPress={() => setActiveVersionId(version.id)}
                  style={[
                    styles.versionChip,
                    {
                      backgroundColor: activeVersionId === version.id ? colors.primarySoft : colors.surfaceMuted,
                      borderColor: activeVersionId === version.id ? colors.primary : colors.line,
                    },
                  ]}>
                  <ThemedText style={styles.versionTitle}>{version.label}</ThemedText>
                  <ThemedText style={[styles.versionSummary, { color: colors.mutedText }]}>
                    {version.summary}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {bilingual ? (
              <View style={styles.parallelBlock}>
                <View style={[styles.parallelColumn, { borderColor: colors.line }]}>
                  <ThemedText style={styles.parallelLabel}>原文</ThemedText>
                  <ThemedText style={[styles.parallelText, { color: colors.mutedText }]}>{sourceText.trim()}</ThemedText>
                </View>
                <View style={[styles.parallelColumn, { borderColor: colors.line }]}>
                  <ThemedText style={styles.parallelLabel}>译文</ThemedText>
                  <ThemedText style={styles.parallelText}>{activeVersion?.text}</ThemedText>
                </View>
              </View>
            ) : (
              <View style={[styles.translationCard, { borderColor: colors.line }]}>
                <ThemedText style={styles.translationText}>{activeVersion?.text}</ThemedText>
              </View>
            )}

            <View style={styles.actionRow}>
              <ActionButton icon="content-copy" label="复制" onPress={handleCopy} />
              <ActionButton
                icon={currentRecord?.favorite ? 'star' : 'star-outline'}
                label={currentRecord?.favorite ? '已收藏' : '收藏'}
                onPress={() => handleToggleFavorite(currentRecordId)}
              />
              <ActionButton icon="refresh" label="重新生成" onPress={() => void handleTranslate(true)} />
              <ActionButton
                icon={showExplanation ? 'chevron-up' : 'chevron-down'}
                label={showExplanation ? '收起解释' : '翻译解释'}
                onPress={() => setShowExplanation((value) => !value)}
              />
            </View>

            {showExplanation ? (
              <View style={[styles.explanationCard, { borderColor: colors.line, backgroundColor: colors.surfaceMuted }]}>
                <ThemedText style={styles.explanationTitle}>翻译解释</ThemedText>
                {draft.explanation.rationale.map((item) => (
                  <ThemedText key={item} style={[styles.explanationText, { color: colors.mutedText }]}>
                    • {item}
                  </ThemedText>
                ))}

                {draft.explanation.terminology.length ? (
                  <View style={styles.glossaryBlock}>
                    <ThemedText style={styles.glossaryTitle}>术语提示</ThemedText>
                    {draft.explanation.terminology.map((item) => (
                      <View key={`${item.source}-${item.target}`} style={styles.glossaryItem}>
                        <ThemedText style={styles.glossaryPair}>
                          {item.source} → {item.target}
                        </ThemedText>
                        <ThemedText style={[styles.glossaryReason, { color: colors.mutedText }]}>
                          {item.reason}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.glossaryBlock}>
                  <ThemedText style={styles.glossaryTitle}>版本建议</ThemedText>
                  {draft.explanation.alternatives.map((item) => (
                    <ThemedText key={item} style={[styles.explanationText, { color: colors.mutedText }]}>
                      • {item}
                    </ThemedText>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </SurfaceCard>

      <SurfaceCard style={styles.workspaceCard}>
        <SectionHeading title="历史记录" actionLabel={`${history.length} 条`} />
        <View style={styles.historyList}>
          {history.map((item) => (
            <View
              key={item.id}
              style={[
                styles.historyCard,
                {
                  borderColor: currentRecordId === item.id ? colors.primary : colors.line,
                  backgroundColor: currentRecordId === item.id ? colors.primarySoft : colors.surface,
                },
              ]}>
              <View style={styles.historyHeader}>
                <View style={styles.historyCopy}>
                  <ThemedText style={styles.historyTitle}>{item.sourcePreview}</ThemedText>
                  <ThemedText style={[styles.historyMeta, { color: colors.mutedText }]}>
                    {getTranslationLanguageLabel(item.draft.detectedLanguage)} →{' '}
                    {getTranslationLanguageLabel(item.targetLanguage)} · {getSceneLabel(item.scene)} ·{' '}
                    {formatHistoryTime(item.createdAt)}
                  </ThemedText>
                </View>
                {item.favorite ? (
                  <MaterialCommunityIcons name="star" size={18} color={colors.accent} />
                ) : null}
              </View>

              <View style={styles.actionRow}>
                <ActionButton icon="history" label="再次翻译" onPress={() => handleReuseHistory(item)} />
                <ActionButton
                  icon={item.favorite ? 'star-off-outline' : 'star-outline'}
                  label={item.favorite ? '取消收藏' : '收藏'}
                  onPress={() => handleToggleFavorite(item.id)}
                />
                <ActionButton icon="trash-can-outline" label="删除" onPress={() => handleDeleteHistory(item.id)} />
              </View>
            </View>
          ))}
        </View>
      </SurfaceCard>
    </MobileScreen>
  );
}

type SelectorChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function SelectorChip({ label, selected, onPress }: SelectorChipProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.selectorChip,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.line,
        },
      ]}>
      <ThemedText style={{ color: selected ? colors.primary : colors.text, fontWeight: '700' }}>{label}</ThemedText>
    </Pressable>
  );
}

type ToggleCardProps = {
  label: string;
  value: boolean;
  onPress: () => void;
};

function ToggleCard({ label, value, onPress }: ToggleCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.toggleCard,
        {
          backgroundColor: value ? colors.hero : colors.surfaceMuted,
          borderColor: value ? colors.hero : colors.line,
        },
      ]}>
      <ThemedText style={{ color: value ? '#ffffff' : colors.text, fontWeight: '700' }}>{label}</ThemedText>
      <ThemedText style={{ color: value ? 'rgba(255,255,255,0.7)' : colors.mutedText, fontSize: 12 }}>
        {value ? '已开启' : '未开启'}
      </ThemedText>
    </Pressable>
  );
}

type ActionButtonProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
};

function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress} style={[styles.actionButton, { borderColor: colors.line }]}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.primary} />
      <ThemedText style={[styles.actionButtonText, { color: colors.text }]}>{label}</ThemedText>
    </Pressable>
  );
}

function getModeLabel(mode: TranslationModeId) {
  return TRANSLATION_MODE_OPTIONS.find((item) => item.id === mode)?.label ?? mode;
}

function inferLanguage(text: string): ResolvedTranslationLanguage | 'auto' {
  const trimmed = text.trim();

  if (!trimmed) {
    return 'auto';
  }

  if (/[\u4e00-\u9fff]/.test(trimmed)) {
    return 'zh';
  }

  if (/[ぁ-んァ-ヶ]/.test(trimmed)) {
    return 'ja';
  }

  if (/[가-힣]/.test(trimmed)) {
    return 'ko';
  }

  return 'en';
}

function getClipboardApi() {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  const maybeNavigator = (globalThis as { navigator?: { clipboard?: ClipboardLike } }).navigator;
  return maybeNavigator?.clipboard ?? null;
}

function wait(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

type ClipboardLike = {
  readText?: () => Promise<string>;
  writeText?: (text: string) => Promise<void>;
};

const styles = StyleSheet.create({
  closeButton: {
    borderRadius: 999,
    padding: 8,
  },
  heroCard: {
    borderRadius: 30,
    gap: 16,
    padding: 20,
  },
  heroHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 21,
  },
  heroBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  modeRow: {
    gap: 10,
  },
  modeChip: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusCard: {
    borderRadius: 24,
    gap: 10,
    padding: 18,
  },
  statusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  statusMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  workspaceCard: {
    gap: 16,
    padding: 18,
  },
  inlineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  swapButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  swapLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  languageColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  languageColumn: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    borderRadius: 24,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 188,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  detectCard: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  detectTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  detectBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  settingBlock: {
    gap: 10,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleGrid: {
    gap: 10,
  },
  toggleCard: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  loadingState: {
    gap: 10,
  },
  loadingTitle: {
    fontSize: 14,
  },
  skeleton: {
    borderRadius: 14,
    height: 14,
    width: '82%',
  },
  skeletonShort: {
    borderRadius: 14,
    height: 14,
    width: '56%',
  },
  skeletonTall: {
    borderRadius: 22,
    height: 120,
    width: '100%',
  },
  emptyState: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  versionRow: {
    gap: 10,
  },
  versionChip: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  versionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  versionSummary: {
    fontSize: 12,
    lineHeight: 18,
  },
  translationCard: {
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 180,
    padding: 16,
  },
  translationText: {
    fontSize: 15,
    lineHeight: 24,
  },
  parallelBlock: {
    gap: 10,
  },
  parallelColumn: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    minHeight: 130,
    padding: 16,
  },
  parallelLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  parallelText: {
    fontSize: 14,
    lineHeight: 22,
  },
  explanationCard: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 20,
  },
  glossaryBlock: {
    gap: 8,
    marginTop: 4,
  },
  glossaryTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  glossaryItem: {
    gap: 4,
  },
  glossaryPair: {
    fontSize: 13,
    fontWeight: '700',
  },
  glossaryReason: {
    fontSize: 12,
    lineHeight: 18,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  historyHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  historyCopy: {
    flex: 1,
    gap: 4,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  historyMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
});
