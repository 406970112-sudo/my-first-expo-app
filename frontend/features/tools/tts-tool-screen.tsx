import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { DEFAULT_TTS_VOICE, TTS_VOICE_GROUPS, TTS_VOICE_OPTIONS } from '@/constants/tts-voices';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getVoiceServerUrl, isVoiceServerLocked, synthesizeSpeech } from '@/lib/tts';
import { MobileScreen } from '@/shared/ui/mobile-screen';
import { PageHeader } from '@/shared/ui/page-header';
import { SectionHeading } from '@/shared/ui/section-heading';
import { SurfaceCard } from '@/shared/ui/surface-card';
import { TTS_ENCODINGS, type SynthesisResult, type TTSEncoding } from '@/types/tts';

export function TextToSpeechToolScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [serverUrl, setServerUrl] = useState(getVoiceServerUrl());
  const [voiceType, setVoiceType] = useState(DEFAULT_TTS_VOICE);
  const [encoding, setEncoding] = useState<TTSEncoding>('wav');
  const [contextText, setContextText] = useState('');
  const [text, setText] = useState('欢迎来到 FunBox，这里可以把内容工具和轻量能力统一装进移动端。');
  const [useTagParser, setUseTagParser] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('等待生成');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<SynthesisResult | null>(null);

  const selectedVoice =
    TTS_VOICE_OPTIONS.find((voice) => voice.value === voiceType) ?? TTS_VOICE_OPTIONS[0];

  async function handleSubmit() {
    const trimmedServerUrl = serverUrl.trim();

    if (!trimmedServerUrl) {
      setStatus('请先填写服务地址');
      return;
    }

    setSubmitting(true);
    setStatus('正在生成音频...');
    setErrorMessage('');
    setResult(null);

    try {
      const synthesisResult = await synthesizeSpeech(
        {
          context_text: contextText,
          encoding,
          text,
          use_tag_parser: useTagParser,
          voice_type: voiceType,
        },
        trimmedServerUrl
      );

      setResult(synthesisResult);
      setStatus('生成完成');
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败';
      setErrorMessage(message);
      setStatus('生成失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <MobileScreen>
        <PageHeader
          eyebrow="Tool Detail"
          title="文字转语音"
          subtitle="现有文字转语音能力已迁入工具详情页，首页与工具列表都从这里进入。"
          rightSlot={
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
            </Pressable>
          }
        />

        <View style={[styles.heroCard, { backgroundColor: colors.hero }]}>
          <ThemedText style={styles.heroTitle}>移动端配音工作台</ThemedText>
          <ThemedText style={styles.heroDescription}>
            表单结构已经和工具页路由打通，后续可以继续补权限、音频播放器、历史记录和收藏能力。
          </ThemedText>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaChip}>
              <ThemedText style={styles.heroMetaText}>接口已接入</ThemedText>
            </View>
            <View style={styles.heroMetaChip}>
              <ThemedText style={styles.heroMetaText}>{selectedVoice.label}</ThemedText>
            </View>
          </View>
        </View>

        <SurfaceCard style={styles.formCard}>
          <SectionHeading title="基础配置" />
          <View style={styles.field}>
            <ThemedText style={styles.label}>服务地址</ThemedText>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isVoiceServerLocked()}
              onChangeText={setServerUrl}
              placeholder="例如：https://api.example.com"
              placeholderTextColor={colors.mutedText}
              style={[
                styles.input,
                {
                  borderColor: colors.line,
                  color: colors.text,
                  opacity: isVoiceServerLocked() ? 0.7 : 1,
                },
              ]}
              value={serverUrl}
            />
            <ThemedText style={[styles.helpText, { color: colors.mutedText }]}>
              {isVoiceServerLocked()
                ? '当前地址来自 EXPO_PUBLIC_VOICE_SERVER_URL，构建后无需在客户端再次修改。'
                : '开发环境可填本地地址，生产环境建议通过 EXPO_PUBLIC_VOICE_SERVER_URL 注入。'}
            </ThemedText>
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>音色</ThemedText>
            <Pressable
              onPress={() => setPickerVisible(true)}
              style={[
                styles.selector,
                {
                  borderColor: colors.line,
                },
              ]}>
              <View style={styles.selectorText}>
                <ThemedText style={styles.selectorTitle}>{selectedVoice.label}</ThemedText>
                <ThemedText style={[styles.selectorSubtitle, { color: colors.mutedText }]}>
                  {selectedVoice.group} · {selectedVoice.language}
                </ThemedText>
              </View>
              <ThemedText style={{ color: colors.accent }}>选择</ThemedText>
            </Pressable>
          </View>

          <View
            style={[
              styles.metaCard,
              {
                borderColor: colors.line,
                backgroundColor: colors.surfaceMuted,
              },
            ]}>
            <ThemedText style={styles.metaTitle}>当前音色信息</ThemedText>
            <ThemedText style={[styles.metaText, { color: colors.mutedText }]}>
              语言：{selectedVoice.language}
            </ThemedText>
            <ThemedText style={[styles.metaText, { color: colors.mutedText }]}>
              能力：{selectedVoice.capabilities}
            </ThemedText>
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>输出格式</ThemedText>
            <View style={styles.chipRow}>
              {TTS_ENCODINGS.map((item) => {
                const selected = item === encoding;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setEncoding(item)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : 'transparent',
                        borderColor: selected ? colors.primary : colors.line,
                      },
                    ]}>
                    <ThemedText style={{ color: selected ? '#ffffff' : colors.text }}>
                      {item.toUpperCase()}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>语气提示词</ThemedText>
            <TextInput
              multiline
              onChangeText={setContextText}
              placeholder="例如：请用亲和、清晰、适合产品介绍的语气播报。"
              placeholderTextColor={colors.mutedText}
              style={[styles.textareaCompact, { borderColor: colors.line, color: colors.text }]}
              textAlignVertical="top"
              value={contextText}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>合成文本</ThemedText>
            <TextInput
              multiline
              onChangeText={setText}
              placeholder="请输入要合成的文本"
              placeholderTextColor={colors.mutedText}
              style={[styles.textareaLarge, { borderColor: colors.line, color: colors.text }]}
              textAlignVertical="top"
              value={text}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>高级参数</ThemedText>
            <View style={styles.chipRow}>
              {[false, true].map((value) => {
                const selected = value === useTagParser;
                return (
                  <Pressable
                    key={String(value)}
                    onPress={() => setUseTagParser(value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.accent : 'transparent',
                        borderColor: selected ? colors.accent : colors.line,
                      },
                    ]}>
                    <ThemedText style={{ color: selected ? '#ffffff' : colors.text }}>
                      use_tag_parser = {String(value)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            disabled={submitting}
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              {
                backgroundColor: colors.hero,
                opacity: submitting ? 0.72 : 1,
              },
            ]}>
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.submitText}>生成音频</ThemedText>
            )}
          </Pressable>
        </SurfaceCard>

        <SurfaceCard style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <ThemedText style={styles.resultTitle}>生成结果</ThemedText>
            <ThemedText style={{ color: colors.mutedText }}>{status}</ThemedText>
          </View>

          {!result && !errorMessage ? (
            <ThemedText style={[styles.resultHint, { color: colors.mutedText }]}>
              提交参数后，这里会展示音频访问地址、文件路径和资源 ID。
            </ThemedText>
          ) : null}

          {errorMessage ? (
            <View style={[styles.errorCard, { borderColor: '#d86f5b' }]}>
              <ThemedText style={styles.errorTitle}>生成失败</ThemedText>
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            </View>
          ) : null}

          {result ? (
            <View style={[styles.resultMetaCard, { borderColor: colors.line }]}>
              <ThemedText style={styles.resultLine}>文件名：{result.fileName}</ThemedText>
              <ThemedText style={styles.resultLine}>保存位置：{result.filePath}</ThemedText>
              <ThemedText style={styles.resultLine}>Resource ID：{result.resourceId}</ThemedText>
              <ThemedText style={styles.resultLine}>音频地址：{result.audioUrl}</ThemedText>
              <Pressable
                onPress={() => Linking.openURL(result.audioUrl)}
                style={[styles.openButton, { borderColor: colors.line }]}>
                <ThemedText style={{ color: colors.primary }}>打开音频</ThemedText>
              </Pressable>
            </View>
          ) : null}
        </SurfaceCard>
      </MobileScreen>

      <Modal animationType="slide" transparent visible={pickerVisible}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.line,
              },
            ]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>选择音色</ThemedText>
              <Pressable onPress={() => setPickerVisible(false)}>
                <ThemedText style={{ color: colors.accent }}>关闭</ThemedText>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
              {TTS_VOICE_GROUPS.map((group) => (
                <View key={group} style={styles.voiceGroup}>
                  <ThemedText style={styles.voiceGroupTitle}>{group}</ThemedText>
                  {TTS_VOICE_OPTIONS.filter((voice) => voice.group === group).map((voice) => {
                    const selected = voice.value === voiceType;

                    return (
                      <Pressable
                        key={voice.value}
                        onPress={() => {
                          setVoiceType(voice.value);
                          setPickerVisible(false);
                        }}
                        style={[
                          styles.voiceOption,
                          {
                            backgroundColor: selected ? colors.primarySoft : colors.card,
                            borderColor: selected ? colors.primary : colors.line,
                          },
                        ]}>
                        <ThemedText style={styles.voiceOptionTitle}>{voice.label}</ThemedText>
                        <ThemedText style={[styles.voiceOptionText, { color: colors.mutedText }]}>
                          {voice.language} · {voice.capabilities}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    borderRadius: 999,
    padding: 8,
  },
  heroCard: {
    borderRadius: 30,
    gap: 12,
    padding: 20,
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
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroMetaChip: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroMetaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    gap: 16,
    padding: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  helpText: {
    fontSize: 12,
    lineHeight: 18,
  },
  selector: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectorText: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  selectorTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  selectorSubtitle: {
    fontSize: 12,
  },
  metaCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  metaTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textareaCompact: {
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 96,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textareaLarge: {
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 180,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 999,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    gap: 14,
    padding: 18,
  },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  resultHint: {
    fontSize: 14,
    lineHeight: 22,
  },
  errorCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#d86f5b',
    fontSize: 13,
    lineHeight: 20,
  },
  resultMetaCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  resultLine: {
    fontSize: 13,
    lineHeight: 20,
  },
  openButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  modalCard: {
    borderRadius: 28,
    borderWidth: 1,
    gap: 16,
    maxHeight: '86%',
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalContent: {
    gap: 16,
    paddingBottom: 12,
  },
  voiceGroup: {
    gap: 10,
  },
  voiceGroupTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  voiceOption: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  voiceOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  voiceOptionText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
