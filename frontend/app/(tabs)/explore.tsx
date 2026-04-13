import { ScrollView, StyleSheet, View } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function GuideScreen() {
  const cardBackground = useThemeColor({ light: '#fff7ef', dark: '#1e1b18' }, 'background');
  const borderColor = useThemeColor({ light: '#e4cdb7', dark: '#3a3028' }, 'text');
  const mutedColor = useThemeColor({ light: '#7a6758', dark: '#b8a18e' }, 'text');

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <ThemedView
        style={[
          styles.heroCard,
          {
            backgroundColor: cardBackground,
            borderColor,
          },
        ]}>
        <ThemedText type="title">生产部署说明</ThemedText>
        <ThemedText style={[styles.heroText, { color: mutedColor }]}>
          这套项目现在采用“Expo 前端 + Node 语音服务”的结构，更适合部署到正式环境。
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
        <ThemedText type="subtitle">部署顺序</ThemedText>

        <View style={styles.step}>
          <ThemedText type="defaultSemiBold">1. 配置服务端环境变量</ThemedText>
          <ThemedText style={{ color: mutedColor }}>
            至少需要配置 `VOLC_APP_ID`、`VOLC_ACCESS_TOKEN` 和 `EXPO_PUBLIC_VOICE_SERVER_URL`。
          </ThemedText>
        </View>

        <View style={styles.step}>
          <ThemedText type="defaultSemiBold">2. 先部署 Node 服务</ThemedText>
          <ThemedText style={{ color: mutedColor }}>
            服务入口是 `server/voice/server.js`，启动命令是 `npm run voice-server`。
          </ThemedText>
        </View>

        <View style={styles.step}>
          <ThemedText type="defaultSemiBold">3. 再构建 Expo 前端</ThemedText>
          <ThemedText style={{ color: mutedColor }}>
            Expo 前端会读取 `EXPO_PUBLIC_VOICE_SERVER_URL`，并把请求发到你的正式 API 域名。
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView
        style={[
          styles.sectionCard,
          {
            backgroundColor: cardBackground,
            borderColor,
          },
        ]}>
        <Collapsible title="这次生产化改造做了什么">
          <ThemedText style={[styles.bodyText, { color: mutedColor }]}>
            前端不再填写 App ID、Access Token 和 Endpoint，敏感配置统一迁到服务端。
          </ThemedText>
          <ThemedText style={[styles.bodyText, { color: mutedColor }]}>
            服务端新增了基础限流、请求大小限制、文本长度限制、健康检查和可选跨域白名单。
          </ThemedText>
          <ThemedText style={[styles.bodyText, { color: mutedColor }]}>
            生成的音频地址现在支持通过 `VOICE_PUBLIC_BASE_URL` 返回正式公网域名。
          </ThemedText>
        </Collapsible>

        <Collapsible title="关键环境变量">
          <ThemedText style={[styles.bodyText, { color: mutedColor }]}>
            `VOLC_APP_ID`：火山引擎应用 ID。
          </ThemedText>
          <ThemedText style={[styles.bodyText, { color: mutedColor }]}>
            `VOLC_ACCESS_TOKEN`：火山引擎访问密钥。
          </ThemedText>
          <ThemedText style={[styles.bodyText, { color: mutedColor }]}>
            `VOLC_RESOURCE_ID`：可选，默认由服务端统一配置。
          </ThemedText>
          <ThemedText style={[styles.bodyText, { color: mutedColor }]}>
            `VOICE_ALLOWED_ORIGINS`：可选，多个域名用逗号分隔。
          </ThemedText>
          <ThemedText style={[styles.bodyText, { color: mutedColor }]}>
            `EXPO_PUBLIC_VOICE_SERVER_URL`：前端调用的正式服务地址，例如 `https://api.example.com`。
          </ThemedText>
        </Collapsible>

        <Collapsible title="建议的生产架构">
          <ThemedText style={[styles.bodyText, { color: mutedColor }]}>
            前端部署到 Expo Web、移动端应用或者你的 App 容器里。
          </ThemedText>
          <ThemedText style={[styles.bodyText, { color: mutedColor }]}>
            后端单独部署成一个 Node 服务，再由 Nginx、Caddy 或云负载均衡做 HTTPS 反向代理。
          </ThemedText>
          <ThemedText style={[styles.bodyText, { color: mutedColor }]}>
            如果后续访问量变大，建议把音频文件改存对象存储，而不是长期只放本地磁盘。
          </ThemedText>
        </Collapsible>
      </ThemedView>
    </ScrollView>
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
  step: {
    gap: 6,
  },
  bodyText: {
    lineHeight: 22,
    marginBottom: 8,
  },
});
