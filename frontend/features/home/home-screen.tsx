import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { appTools, featuredBanner, popularGames, recentActivities } from '@/mocks/app-data';
import { MobileScreen } from '@/shared/ui/mobile-screen';
import type { AppTool, GameId, GameItem, RecentActivity } from '@/types/app';

export function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const quickTools = appTools.slice(0, 4);
  const featuredTools = appTools.slice(0, 2);
  const featuredGame = popularGames[0];

  function openGame(gameId: GameId) {
    router.push({
      pathname: '/games/[gameId]',
      params: { gameId },
    });
  }

  function openRecentActivity(item: RecentActivity) {
    if (item.toolId) {
      router.push(`/tools/${item.toolId}`);
      return;
    }

    if (item.gameId) {
      openGame(item.gameId);
    }
  }

  return (
    <MobileScreen contentContainerStyle={styles.pageContent}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View style={[styles.backgroundOrbLarge, { backgroundColor: '#d8e4ff' }]} />
        <View style={[styles.backgroundOrbSmall, { backgroundColor: '#ffd8e8' }]} />
      </View>

      <View style={styles.topBar}>
        <View>
          <ThemedText style={styles.brandTitle}>FunBox</ThemedText>
          <ThemedText style={[styles.brandSubtitle, { color: colors.mutedText }]}>
            工具 / 游戏 / 发现
          </ThemedText>
        </View>
        <View style={styles.topActions}>
          <View style={[styles.topActionButton, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.text} />
          </View>
          <View style={[styles.topActionButton, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="wallet-outline" size={20} color={colors.text} />
          </View>
        </View>
      </View>

      <Pressable
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.line,
          },
        ]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.mutedText} />
        <ThemedText style={[styles.searchText, { color: colors.mutedText }]}>
          搜索工具、游戏、玩法
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={() => openGame(featuredGame.id)}
        style={[styles.bannerCard, { backgroundColor: colors.hero }]}>
        <View style={styles.bannerBubblePink} />
        <View style={styles.bannerBubbleBlue} />
        <ThemedText style={styles.bannerEyebrow}>{featuredBanner.eyebrow}</ThemedText>
        <ThemedText style={styles.bannerTitle}>{featuredBanner.title}</ThemedText>
        <ThemedText style={styles.bannerDescription}>
          {featuredBanner.description}
        </ThemedText>
        <View style={styles.bannerActionRow}>
          <View style={styles.bannerAction}>
            <ThemedText style={styles.bannerActionText}>{featuredBanner.actionLabel}</ThemedText>
          </View>
          <View style={[styles.bannerGameTag, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
            <ThemedText style={styles.bannerGameTagText}>{featuredGame.name}</ThemedText>
          </View>
        </View>
      </Pressable>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>快捷入口</ThemedText>
          <ThemedText style={[styles.sectionAction, { color: colors.mutedText }]}>全部</ThemedText>
        </View>
        <View style={styles.quickGrid}>
          {quickTools.map((tool) => (
            <Pressable
              key={tool.id}
              onPress={() => router.push(tool.route)}
              style={[
                styles.quickItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.line,
                },
              ]}>
              <View style={[styles.quickIconWrap, { backgroundColor: `${tool.accentColor}18` }]}>
                <MaterialCommunityIcons name={tool.icon} size={24} color={tool.accentColor} />
              </View>
              <ThemedText numberOfLines={1} style={styles.quickLabel}>
                {tool.name}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>最近使用</ThemedText>
        <View style={styles.listGroup}>
          {recentActivities.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => openRecentActivity(item)}
              style={[
                styles.listRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.line,
                },
              ]}>
              <View>
                <ThemedText style={styles.listTitle}>{item.title}</ThemedText>
                <ThemedText style={[styles.listSubtitle, { color: colors.mutedText }]}>
                  {item.type}
                </ThemedText>
              </View>
              <View style={[styles.listAction, { backgroundColor: colors.hero }]}>
                <ThemedText style={styles.listActionText}>{item.actionLabel}</ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>热门工具</ThemedText>
          <ThemedText style={[styles.sectionAction, { color: colors.mutedText }]}>
            查看更多
          </ThemedText>
        </View>
        <View style={styles.featuredGrid}>
          {featuredTools.map((tool, index) => (
            <FeaturedToolCard
              key={tool.id}
              tool={tool}
              mutedTextColor={colors.mutedText}
              onPress={() => router.push(tool.route)}
              variant={index === 0 ? 'dark' : 'light'}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>热门游戏</ThemedText>
          <ThemedText style={[styles.sectionAction, { color: colors.mutedText }]}>
            即点即玩
          </ThemedText>
        </View>
        <View style={styles.gameGroup}>
          {popularGames.map((game) => (
            <GameCard key={game.id} game={game} onPress={() => openGame(game.id)} />
          ))}
        </View>
      </View>
    </MobileScreen>
  );
}

function FeaturedToolCard({
  tool,
  mutedTextColor,
  onPress,
  variant,
}: {
  tool: AppTool;
  mutedTextColor: string;
  onPress: () => void;
  variant: 'dark' | 'light';
}) {
  const isDark = variant === 'dark';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.featuredCard,
        isDark ? styles.featuredCardDark : styles.featuredCardLight,
      ]}>
      <ThemedText style={[styles.featuredKicker, isDark ? styles.featuredTextOnDark : undefined]}>
        {tool.category} 工具
      </ThemedText>
      <ThemedText style={[styles.featuredName, isDark ? styles.featuredTextOnDark : undefined]}>
        {tool.name}
      </ThemedText>
      <ThemedText
        style={[
          styles.featuredUsage,
          isDark ? styles.featuredMutedOnDark : { color: mutedTextColor },
        ]}>
        {tool.usageLabel}
      </ThemedText>
    </Pressable>
  );
}

function GameCard({ game, onPress }: { game: GameItem; onPress: () => void }) {
  const { colors } = useAppTheme();
  const isPlayable = game.status === 'playable';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.gameCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
        },
      ]}>
      <View style={styles.gameCardContent}>
        <View style={[styles.gameIconWrap, { backgroundColor: `${game.accentColor}18` }]}>
          <MaterialCommunityIcons
            color={game.accentColor}
            name={isPlayable ? 'gamepad-variant-outline' : 'controller-classic-outline'}
            size={22}
          />
        </View>
        <View style={styles.gameCopy}>
          <View style={styles.gameTitleRow}>
            <ThemedText style={styles.listTitle}>{game.name}</ThemedText>
            <View style={[styles.gamePill, { backgroundColor: `${game.accentColor}16` }]}>
              <ThemedText style={[styles.gamePillText, { color: game.accentColor }]}>
                {game.tag}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.listSubtitle, { color: colors.mutedText }]}>
            {game.genre}
          </ThemedText>
          <ThemedText style={[styles.gameDescription, { color: colors.mutedText }]}>
            {game.description}
          </ThemedText>
        </View>
      </View>
      <View
        style={[
          styles.playButton,
          {
            backgroundColor: isPlayable ? colors.hero : colors.surfaceMuted,
          },
        ]}>
        <ThemedText
          style={[
            styles.playButtonText,
            {
              color: isPlayable ? '#ffffff' : colors.mutedText,
            },
          ]}>
          {isPlayable ? '开玩' : '查看'}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingTop: 14,
  },
  backgroundLayer: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backgroundOrbLarge: {
    borderRadius: 999,
    height: 220,
    opacity: 0.5,
    position: 'absolute',
    right: -90,
    top: -70,
    width: 220,
  },
  backgroundOrbSmall: {
    borderRadius: 999,
    height: 140,
    left: -54,
    opacity: 0.7,
    position: 'absolute',
    top: 220,
    width: 140,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  brandSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
  },
  topActionButton: {
    alignItems: 'center',
    borderRadius: 18,
    elevation: 1,
    height: 38,
    justifyContent: 'center',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    width: 38,
  },
  searchBar: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchText: {
    fontSize: 14,
  },
  bannerCard: {
    borderRadius: 30,
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
  },
  bannerBubblePink: {
    backgroundColor: 'rgba(255,107,143,0.28)',
    borderRadius: 999,
    height: 132,
    position: 'absolute',
    right: -18,
    top: -36,
    width: 132,
  },
  bannerBubbleBlue: {
    backgroundColor: 'rgba(98,154,255,0.24)',
    borderRadius: 999,
    bottom: -42,
    height: 126,
    left: -12,
    position: 'absolute',
    width: 126,
  },
  bannerEyebrow: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    fontWeight: '700',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 31,
    marginTop: 6,
    width: '84%',
  },
  bannerDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    width: '82%',
  },
  bannerActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  bannerAction: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bannerActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerGameTag: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bannerGameTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickItem: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 14,
    width: '22.9%',
  },
  quickIconWrap: {
    alignItems: 'center',
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    marginBottom: 10,
    width: 48,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  listGroup: {
    gap: 10,
  },
  listRow: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  listSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  listAction: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  featuredGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  featuredCard: {
    borderRadius: 24,
    minHeight: 138,
    overflow: 'hidden',
    padding: 16,
    width: '48.5%',
  },
  featuredCardDark: {
    backgroundColor: '#151b3b',
  },
  featuredCardLight: {
    backgroundColor: '#f4f7ff',
  },
  featuredKicker: {
    fontSize: 13,
  },
  featuredName: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  featuredUsage: {
    fontSize: 12,
    marginTop: 26,
  },
  featuredTextOnDark: {
    color: '#ffffff',
  },
  featuredMutedOnDark: {
    color: 'rgba(255,255,255,0.7)',
  },
  gameGroup: {
    gap: 10,
  },
  gameCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  gameCardContent: {
    flexDirection: 'row',
    gap: 14,
  },
  gameIconWrap: {
    alignItems: 'center',
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  gameCopy: {
    flex: 1,
  },
  gameTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gameDescription: {
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },
  gamePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  gamePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  playButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  playButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
