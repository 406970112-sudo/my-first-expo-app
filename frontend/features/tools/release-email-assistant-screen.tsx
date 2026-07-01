import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { MobileScreen } from '@/shared/ui/mobile-screen';
import { PageHeader } from '@/shared/ui/page-header';
import { SurfaceCard } from '@/shared/ui/surface-card';

type ChatRole = 'assistant' | 'user';

type ChatMessage = {
  content: string;
  id: string;
  role: ChatRole;
};

type AgentResponse = {
  content: string;
  tools?: Array<{ desc: string; name: string }>;
};

type EmailRenderPayload = {
  function_list: Array<{ desc: string; name: string }>;
  message?: string;
  relation: Array<{ address: string[]; function_index: number[]; name: string }>;
  type: 'email-render';
  update_time: string;
};

type EmailTemplateGroup = {
  function_index: number[];
  recipients: EmailRenderPayload['relation'];
};

const INITIAL_ASSISTANT_MESSAGE =
  '告诉我本次发版时间、更新点，以及哪些银行或收件人需要通知。我会按旧邮件助手逻辑生成邮件预览。';

const SAMPLE_PROMPT =
  '变更时间 2026-06-21 21:00:00-2026-06-22 06:30:00，小程序新增提现拦截提示通知东吴村镇银行，后台审批流程优化通知所有人。';

export function ReleaseEmailAssistantScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [input, setInput] = useState(SAMPLE_PROMPT);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('旧版 agent 已迁入，等待发送需求。');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      content: INITIAL_ASSISTANT_MESSAGE,
      id: 'assistant-initial',
      role: 'assistant',
    },
  ]);
  const apiUrl = useMemo(getEmailAgentApiUrl, []);

  async function handleSubmit() {
    const trimmed = input.trim();

    if (!trimmed || isLoading) {
      return;
    }

    const nextUserMessage: ChatMessage = {
      content: trimmed,
      id: `user-${Date.now()}`,
      role: 'user',
    };
    const nextMessages = [...messages, nextUserMessage];

    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    setStatus('正在调用旧版邮件 agent...');

    try {
      const response = await fetch(apiUrl, {
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.role === 'user' || message.role === 'assistant')
            .map((message) => ({
              content: message.content,
              role: message.role,
            })),
          user_id: '123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`);
      }

      const text = await response.text();
      const agentResponse = parseAgentResponse(text);

      setMessages((previous) => [
        ...previous,
        {
          content: agentResponse.content,
          id: `assistant-${Date.now()}`,
          role: 'assistant',
        },
      ]);
      setStatus(agentResponse.tools?.length ? `已使用工具：${agentResponse.tools.map((tool) => tool.name).join(', ')}` : '已生成回复。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '调用邮件 agent 失败';
      setStatus(message);
      setMessages((previous) => [
        ...previous,
        {
          content: `调用失败：${message}`,
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <MobileScreen>
      <PageHeader
        eyebrow="Release Email"
        title="发版邮件助手"
        subtitle="照搬旧 email agent 的聊天生成逻辑：由 agent 解析发版内容并生成邮件预览。"
        rightSlot={
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </Pressable>
        }
      />

      <View style={[styles.heroCard, { backgroundColor: colors.hero }]}>
        <ThemedText style={styles.heroTitle}>聊天生成发版邮件</ThemedText>
        <ThemedText style={styles.heroDescription}>
          直接描述本次发版内容、时间和通知对象，旧 agent 会解析功能点、匹配收件人，并返回邮件模板预览。
        </ThemedText>
      </View>

      <SurfaceCard style={[styles.statusCard, { backgroundColor: colors.surfaceMuted }]}>
        <ThemedText style={styles.statusTitle}>当前状态</ThemedText>
        <ThemedText style={[styles.statusText, { color: colors.mutedText }]}>{status}</ThemedText>
        <ThemedText style={[styles.statusText, { color: colors.mutedText }]}>接口：{apiUrl}</ThemedText>
      </SurfaceCard>

      <SurfaceCard style={styles.chatCard}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </SurfaceCard>

      <SurfaceCard style={styles.inputCard}>
        <TextInput
          multiline
          onChangeText={setInput}
          placeholder="输入发版需求..."
          placeholderTextColor={colors.mutedText}
          style={[styles.input, { borderColor: colors.line, color: colors.text }]}
          textAlignVertical="top"
          value={input}
        />
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => setInput(SAMPLE_PROMPT)}
            style={[styles.secondaryButton, { borderColor: colors.line }]}>
            <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>填入示例</ThemedText>
          </Pressable>
          <Pressable
            disabled={isLoading}
            onPress={handleSubmit}
            style={[styles.primaryButton, { backgroundColor: colors.hero, opacity: isLoading ? 0.72 : 1 }]}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>发送</ThemedText>
            )}
          </Pressable>
        </View>
      </SurfaceCard>
    </MobileScreen>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const { colors } = useAppTheme();
  const isUser = message.role === 'user';
  const emailPayload = !isUser ? parseEmailRenderPayload(message.content) : null;

  return (
    <View
      style={[
        styles.messageBubble,
        {
          alignSelf: isUser ? 'flex-end' : 'stretch',
          backgroundColor: isUser ? colors.primarySoft : colors.surface,
          borderColor: colors.line,
        },
      ]}>
      <View style={styles.messageHeader}>
        <ThemedText style={styles.messageRole}>{isUser ? 'ME' : 'AI'}</ThemedText>
      </View>

      {emailPayload ? (
        <EmailRenderResult payload={emailPayload} />
      ) : (
        <ThemedText selectable style={[styles.messageText, { color: colors.text }]}>
          {formatAssistantText(message.content)}
        </ThemedText>
      )}
    </View>
  );
}

function EmailRenderResult({ payload }: { payload: EmailRenderPayload }) {
  const { colors } = useAppTheme();
  const [copyStatus, setCopyStatus] = useState<Record<string, string>>({});
  const groups = groupRelations(payload.relation);
  const groupKeys = Object.keys(groups);

  async function handleCopyForTemplate(key: string) {
    const template = groups[key];
    const textBody = createEmailTextBody(template, payload.function_list, payload.update_time);

    await copyText(textBody);
    setCopyStatus((previous) => ({ ...previous, [key]: '已复制正文' }));
    setTimeout(() => {
      setCopyStatus((previous) => ({ ...previous, [key]: '' }));
    }, 2000);
  }

  async function handleCopyRecipients(key: string) {
    const template = groups[key];
    const emails = template.recipients.flatMap((recipient) => recipient.address).join(',');

    await copyText(emails);
    setCopyStatus((previous) => ({ ...previous, [`email_${key}`]: '已复制收件人' }));
    setTimeout(() => {
      setCopyStatus((previous) => ({ ...previous, [`email_${key}`]: '' }));
    }, 2000);
  }

  return (
    <View style={styles.emailResult}>
      <ThemedText style={styles.emailTitle}>邮件发送预览</ThemedText>
      <ThemedText style={[styles.statusText, { color: colors.mutedText }]}>
        变更时间：{payload.update_time}，共 {groupKeys.length} 组邮件模板
      </ThemedText>

      {groupKeys.map((key, index) => {
        const template = groups[key];
        const recipientNames = template.recipients.map((recipient) => recipient.name).join('、');

        return (
          <View key={key} style={[styles.templateCard, { borderColor: colors.line }]}>
            <ThemedText style={styles.templateTitle}>模板 {index + 1}</ThemedText>
            <View style={styles.templateSection}>
              <ThemedText style={styles.templateLabel}>功能列表</ThemedText>
              {template.function_index.map((functionIndex) => {
                const item = payload.function_list[functionIndex];

                return (
                  <ThemedText key={functionIndex} style={[styles.messageText, { color: colors.text }]}>
                    {functionIndex + 1}. {item?.name}：{item?.desc}
                  </ThemedText>
                );
              })}
            </View>
            <View style={styles.templateSection}>
              <ThemedText style={styles.templateLabel}>收件人</ThemedText>
              <ThemedText selectable style={[styles.messageText, { color: colors.text }]}>
                {recipientNames}
              </ThemedText>
            </View>
            <View style={styles.actionRow}>
              <CopyButton
                label={copyStatus[key] || '复制正文'}
                onPress={() => void handleCopyForTemplate(key)}
              />
              <CopyButton
                label={copyStatus[`email_${key}`] || '复制收件人'}
                onPress={() => void handleCopyRecipients(key)}
              />
            </View>
          </View>
        );
      })}

      {payload.message ? (
        <ThemedText selectable style={[styles.messageText, { color: colors.text }]}>
          {payload.message}
        </ThemedText>
      ) : null}
    </View>
  );
}

function CopyButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress} style={[styles.copyButton, { borderColor: colors.line }]}>
      <MaterialCommunityIcons name="content-copy" size={15} color={colors.primary} />
      <ThemedText style={[styles.copyButtonText, { color: colors.primary }]}>{label}</ThemedText>
    </Pressable>
  );
}

function parseAgentResponse(text: string): AgentResponse {
  try {
    const parsed = JSON.parse(text) as AgentResponse;
    return {
      content: typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content),
      tools: parsed.tools,
    };
  } catch {
    return {
      content: text,
      tools: [],
    };
  }
}

function parseEmailRenderPayload(content: string): EmailRenderPayload | null {
  try {
    const parsed = JSON.parse(content) as Partial<EmailRenderPayload>;

    if (parsed.type === 'email-render' && Array.isArray(parsed.function_list) && Array.isArray(parsed.relation)) {
      return parsed as EmailRenderPayload;
    }
  } catch {
    return null;
  }

  return null;
}

function groupRelations(relations: EmailRenderPayload['relation']) {
  return relations.reduce<Record<string, EmailTemplateGroup>>((acc, relation) => {
    const key = JSON.stringify(relation.function_index.slice().sort());

    if (!acc[key]) {
      acc[key] = {
        function_index: relation.function_index,
        recipients: [],
      };
    }

    acc[key].recipients.push(relation);
    return acc;
  }, {});
}

function createEmailTextBody(
  template: EmailTemplateGroup,
  functions: EmailRenderPayload['function_list'],
  updateTime: string
) {
  const userFunctions = template.function_index.map((index) => functions[index]).filter(Boolean);

  return `您好：

天翼CROS智慧信贷平台计划于${updateTime}进行版本发布，以下是与您相关的更新点：

${userFunctions.map((func) => `${func.name}:\n${func.desc}\n`).join('\n')}
应急回退方案：回退到上一个稳定版本。
变更时间：${updateTime}
是否停服：是

如有疑问，请随时联系。

Best regards,
XWFITECH AI 助手`;
}

function formatAssistantText(content: string) {
  try {
    const parsed = JSON.parse(content) as { content?: unknown };

    if (typeof parsed.content === 'string') {
      return parsed.content;
    }
  } catch {
    return content;
  }

  return content;
}

async function copyText(text: string) {
  const clipboard = getClipboardApi();

  if (!clipboard?.writeText) {
    if (Platform.OS !== 'web') {
      Alert.alert('复制提示', '当前运行环境不支持按钮复制，请长按文本手动复制。');
    }
    return;
  }

  await clipboard.writeText(text);
}

function getEmailAgentApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_EMAIL_AGENT_URL?.trim();

  if (fromEnv) {
    return fromEnv;
  }

  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'http://localhost:1234/api/agent';
  }

  return '/api/agent';
}

function getClipboardApi() {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  const maybeNavigator = (globalThis as { navigator?: { clipboard?: ClipboardLike } }).navigator;
  return maybeNavigator?.clipboard ?? null;
}

type ClipboardLike = {
  writeText?: (text: string) => Promise<void>;
};

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chatCard: {
    gap: 12,
    padding: 14,
  },
  closeButton: {
    borderRadius: 999,
    padding: 8,
  },
  copyButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emailResult: {
    gap: 12,
  },
  emailTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: 30,
    gap: 10,
    padding: 20,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 21,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputCard: {
    gap: 12,
    padding: 16,
  },
  messageBubble: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    maxWidth: '100%',
    padding: 12,
  },
  messageHeader: {
    flexDirection: 'row',
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '800',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    minWidth: 96,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  statusCard: {
    borderRadius: 24,
    gap: 8,
    padding: 16,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 18,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  templateCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  templateLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  templateSection: {
    gap: 6,
  },
  templateTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
});
