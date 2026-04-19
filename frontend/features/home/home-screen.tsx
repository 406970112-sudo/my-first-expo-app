import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { featuredBanner, appTools, popularGames, recentActivities } from '@/mocks/app-data';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ListRowCard } from '@/shared/ui/list-row-card';
import { MobileScreen } from '@/shared/ui/mobile-screen';
import { PageHeader } from '@/shared/ui/page-header';
import { SectionHeading } from '@/shared/ui/section-heading';
import { ToolCard } from '@/shared/ui/tool-card';

export function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const quickTools = appTools.slice(0, 4);
  const featuredTools = appTools.filter((tool) => tool.featured);

  return (
    <MobileScreen>
      <PageHeader
        eyebrow="FunBox"
        title="移动端工具聚合首页"
        subtitle="把原型拆成可持续开发的首页模块，保留轻量、偏产品化的浏览节奏。"
      />

      <Pressable
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.line,
          },
        ]}>
        <ThemedText style={{ color: colors.mutedText }}>
          搜索工具、游戏或最近使用的能力
        </ThemedText>
      </Pressable>

      <View style={[styles.heroCard, { backgroundColor: colors.hero }]}>
        <View style={styles.heroDecorPrimary} />
        <View style={styles.heroDecorSecondary} />
        <ThemedText style={styles.heroEyebrow}>{featuredBanner.eyebrow}</ThemedText>
        <ThemedText style={styles.heroTitle}>{featuredBanner.title}</ThemedText>
        <ThemedText style={styles.heroDescription}>{featuredBanner.description}</ThemedText>
        <View style={styles.heroAction}>
          <ThemedText style={styles.heroActionText}>{featuredBanner.actionLabel}</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeading title="快捷入口" actionLabel="全部工具" />
        <View style={styles.toolGrid}>
          {quickTools.map((tool) => (
            <View key={tool.id} style={styles.toolGridItem}>
              <ToolCard tool={tool} compact onPress={() => router.push(tool.route)} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeading title="最近使用" />
        {recentActivities.map((item) => (
          <ListRowCard
            key={item.id}
            title={item.title}
            subtitle={item.type}
            onPress={() => {
              if (item.toolId) {
                router.push(`/tools/${item.toolId}`);
              }
            }}
            renderRight={
              <View style={[styles.inlineAction, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.inlineActionText}>{item.actionLabel}</ThemedText>
              </View>
            }
          />
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeading title="热门工具" actionLabel="持续上新" />
        <View style={styles.hotToolGrid}>
          {featuredTools.map((tool) => (
            <View key={tool.id} style={styles.hotToolItem}>
              <ToolCard tool={tool} onPress={() => router.push(tool.route)} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeading title="热门游戏" actionLabel="排行榜" />
        {popularGames.map((game) => (
          <ListRowCard
            key={game.id}
            title={game.name}
            subtitle={`${game.genre} · 即点即玩`}
            renderRight={
              <View style={[styles.gameTag, { backgroundColor: colors.hero }]}>
                <ThemedText style={styles.gameTagText}>{game.tag}</ThemedText>
              </View>
            }
          />
        ))}
      </View>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  heroCard: {
    borderRadius: 30,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  heroDecorPrimary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    height: 130,
    position: 'absolute',
    right: -12,
    top: -24,
    width: 130,
  },
  heroDecorSecondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    bottom: -32,
    height: 120,
    left: -24,
    position: 'absolute',
    width: 120,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginTop: 8,
    maxWidth: '78%',
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: '82%',
  },
  heroAction: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolGridItem: {
    width: '22.6%',
  },
  hotToolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hotToolItem: {
    width: '47%',
  },
  inlineAction: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  gameTag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  gameTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
