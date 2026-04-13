import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  DEFAULT_TTS_VOICE,
  TTS_VOICE_GROUPS,
  TTS_VOICE_OPTIONS,
} from '@/constants/tts-voices';
import { useThemeColor } from '@/hooks/use-theme-color';

const DEV_SERVER_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://127.0.0.1:3000';
const CONFIGURED_SERVER_URL = process.env.EXPO_PUBLIC_VOICE_SERVER_URL?.trim();
const ENCODINGS = ['wav', 'mp3', 'ogg'] as const;

type Encoding = (typeof ENCODINGS)[number];

type SynthesisResult = {
  audioUrl: string;
  fileName: string;
  filePath: string;
  resourceId: string;
};

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

export default function VoiceConsoleScreen() {
  const cardBackground = useThemeColor({ light: '#fff7ef', dark: '#1e1b18' }, 'background');
  const borderColor = useThemeColor({ light: '#e4cdb7', dark: '#3a3028' }, 'text');
  const mutedColor = useThemeColor({ light: '#7a6758', dark: '#b8a18e' }, 'text');
  const accentColor = useThemeColor({ light: '#a6542d', dark: '#f0ad7a' }, 'tint');

  const [serverUrl, setServerUrl] = useState(CONFIGURED_SERVER_URL || DEV_SERVER_URL);
  const [voiceType, setVoiceType] = useState(DEFAULT_TTS_VOICE);
  const [encoding, setEncoding] = useState<Encoding>('wav');
  const [contextText, setContextText] = useState('');
  const [text, setText] = useState('你是谁');
  const [useTagParser, setUseTagParser] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('等待生成');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<SynthesisResult | null>(null);

  const selectedVoice = useMemo(() => {
    return TTS_VOICE_OPTIONS.find((voice) => voice.value === voiceType) ?? TTS_VOICE_OPTIONS[0];
  }, [voiceType]);

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
      const response = await fetch(`${trimmedServerUrl}/api/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_text: contextText,
          encoding,
          text,
          use_tag_parser: String(useTagParser),
          voice_type: voiceType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || '生成失败');
      }

      setResult({
        audioUrl: joinUrl(trimmedServerUrl, data.audioUrl),
        fileName: data.fileName,
        filePath: data.filePath,
        resourceId: data.resourceId,
      });
      setStatus('生成完成');
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败';
      setErrorMessage(message);
      setStatus('生成失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenAudio() {
    if (!result?.audioUrl) {
      return;
    }

    await Linking.openURL(result.audioUrl);
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.page}>
        <ThemedView
          style={[
            styles.heroCard,
            {
              backgroundColor: cardBackground,
              borderColor,
            },
          ]}>
          <ThemedText type="title">语音合成控制台</ThemedText>
          <ThemedText style={[styles.heroText, { color: mutedColor }]}>
            前端只负责提交业务参数。火山引擎相关密钥已经迁到服务端环境变量里，不会再暴露给客户端。
          </ThemedText>
        </ThemedView>

        <ThemedView
          style={[
            styles.sectionCard,
            {
              backgroundColor: cardBackground,
              borderColor,
            },
          ]}>
          <ThemedText type="subtitle">基础配置</ThemedText>

          <View style={styles.field}>
            <ThemedText style={styles.label}>服务地址</ThemedText>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!CONFIGURED_SERVER_URL}
              onChangeText={setServerUrl}
              placeholder="例如：https://api.example.com"
              placeholderTextColor={mutedColor}
              style={[
                styles.input,
                {
                  borderColor,
                  color: accentColor,
                  opacity: CONFIGURED_SERVER_URL ? 0.7 : 1,
                },
              ]}
              value={serverUrl}
            />
            <ThemedText style={[styles.helpText, { color: mutedColor }]}>
              {CONFIGURED_SERVER_URL
                ? '当前服务地址来自 EXPO_PUBLIC_VOICE_SERVER_URL，构建后通常不需要让用户再修改。'
                : '开发环境可以填本地地址；生产环境建议通过 EXPO_PUBLIC_VOICE_SERVER_URL 在构建时注入。'}
            </ThemedText>
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>音色</ThemedText>
            <Pressable
              onPress={() => setPickerVisible(true)}
              style={[styles.selector, { borderColor }]}>
              <View style={styles.selectorTextWrap}>
                <ThemedText type="defaultSemiBold">{selectedVoice.label}</ThemedText>
                <ThemedText style={[styles.selectorSubtext, { color: mutedColor }]}>
                  {selectedVoice.group} · {selectedVoice.language}
                </ThemedText>
              </View>
              <ThemedText style={{ color: accentColor }}>选择</ThemedText>
            </Pressable>
          </View>

          <View style={[styles.metaCard, { borderColor }]}>
            <ThemedText type="defaultSemiBold">当前音色信息</ThemedText>
            <ThemedText style={[styles.metaText, { color: mutedColor }]}>
              语种：{selectedVoice.language}
            </ThemedText>
            <ThemedText style={[styles.metaText, { color: mutedColor }]}>
              能力：{selectedVoice.capabilities}
            </ThemedText>
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>输出格式</ThemedText>
            <View style={styles.chipRow}>
              {ENCODINGS.map((item) => {
                const selected = item === encoding;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setEncoding(item)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? accentColor : 'transparent',
                        borderColor: selected ? accentColor : borderColor,
                      },
                    ]}>
                    <ThemedText style={{ color: selected ? '#fff7ef' : accentColor }}>
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
              placeholder="例如：请用温柔、慢一点的语气来读。"
              placeholderTextColor={mutedColor}
              style={[styles.textareaCompact, { borderColor, color: accentColor }]}
              textAlignVertical="top"
              value={contextText}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>要合成的文本</ThemedText>
            <TextInput
              multiline
              onChangeText={setText}
              placeholder="请输入要合成的文本"
              placeholderTextColor={mutedColor}
              style={[styles.textareaLarge, { borderColor, color: accentColor }]}
              textAlignVertical="top"
              value={text}
            />
          </View>

          <Collapsible title="高级参数">
            <View style={styles.advancedFields}>
              <View style={styles.field}>
                <ThemedText style={styles.label}>是否开启 COT 标签解析</ThemedText>
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
                            backgroundColor: selected ? accentColor : 'transparent',
                            borderColor: selected ? accentColor : borderColor,
                          },
                        ]}>
                        <ThemedText style={{ color: selected ? '#fff7ef' : accentColor }}>
                          {String(value)}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
                <ThemedText style={[styles.helpText, { color: mutedColor }]}>
                  这个开关会把 `use_tag_parser` 传给服务端，用来辅助控制标签解析、语速和情感。
                </ThemedText>
              </View>
            </View>
          </Collapsible>

          <Pressable
            disabled={submitting}
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              {
                backgroundColor: accentColor,
                opacity: submitting ? 0.7 : 1,
              },
            ]}>
            {submitting ? (
              <ActivityIndicator color="#fff7ef" />
            ) : (
              <ThemedText style={styles.submitButtonText}>生成音频</ThemedText>
            )}
          </Pressable>
        </ThemedView>

        <ThemedView
          style={[
            styles.sectionCard,
            {
              backgroundColor: cardBackground,
              borderColor,
            },
          ]}>
          <View style={styles.resultHeader}>
            <ThemedText type="subtitle">生成结果</ThemedText>
            <ThemedText style={{ color: mutedColor }}>{status}</ThemedText>
          </View>

          {!result && !errorMessage ? (
            <ThemedText style={{ color: mutedColor }}>
              提交参数后，这里会显示生成出的音频文件、保存位置和音频访问地址。
            </ThemedText>
          ) : null}

          {errorMessage ? (
            <ThemedView style={[styles.errorCard, { borderColor: '#d86f5b' }]}>
              <ThemedText type="defaultSemiBold">生成失败</ThemedText>
              <ThemedText style={{ color: '#d86f5b' }}>{errorMessage}</ThemedText>
            </ThemedView>
          ) : null}

          {result ? (
            <ThemedView style={[styles.resultCard, { borderColor }]}>
              <ThemedText style={styles.resultLine}>
                <ThemedText type="defaultSemiBold">文件名：</ThemedText>
                {result.fileName}
              </ThemedText>
              <ThemedText style={styles.resultLine}>
                <ThemedText type="defaultSemiBold">保存位置：</ThemedText>
                {result.filePath}
              </ThemedText>
              <ThemedText style={styles.resultLine}>
                <ThemedText type="defaultSemiBold">Resource ID：</ThemedText>
                {result.resourceId}
              </ThemedText>
              <ThemedText style={styles.resultLine}>
                <ThemedText type="defaultSemiBold">音频地址：</ThemedText>
                {result.audioUrl}
              </ThemedText>

              <Pressable onPress={handleOpenAudio} style={[styles.linkButton, { borderColor }]}>
                <ThemedText style={{ color: accentColor }}>打开音频</ThemedText>
              </Pressable>
            </ThemedView>
          ) : null}
        </ThemedView>
      </ScrollView>

      <Modal animationType="slide" transparent visible={pickerVisible}>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalCard, { backgroundColor: cardBackground, borderColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">选择音色</ThemedText>
              <Pressable onPress={() => setPickerVisible(false)}>
                <ThemedText style={{ color: accentColor }}>关闭</ThemedText>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {TTS_VOICE_GROUPS.map((group) => (
                <View key={group} style={styles.voiceGroup}>
                  <ThemedText type="defaultSemiBold">{group}</ThemedText>
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
                            backgroundColor: selected ? accentColor : 'transparent',
                            borderColor: selected ? accentColor : borderColor,
                          },
                        ]}>
                        <ThemedText style={{ color: selected ? '#fff7ef' : accentColor }}>
                          {voice.label}
                        </ThemedText>
                        <ThemedText
                          style={{
                            color: selected ? '#fff1e4' : mutedColor,
                            marginTop: 4,
                          }}>
                          {voice.language} · {voice.capabilities}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  heroText: {
    fontSize: 16,
    lineHeight: 24,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  selectorTextWrap: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  selectorSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  metaText: {
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
    minHeight: 92,
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
  advancedFields: {
    gap: 16,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 19,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  submitButtonText: {
    color: '#fff7ef',
    fontSize: 16,
    fontWeight: '700',
  },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  resultCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  resultLine: {
    lineHeight: 22,
  },
  linkButton: {
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
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '88%',
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalContent: {
    gap: 16,
    paddingBottom: 12,
  },
  voiceGroup: {
    gap: 10,
  },
  voiceOption: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
