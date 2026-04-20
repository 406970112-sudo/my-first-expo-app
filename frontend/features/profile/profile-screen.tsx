import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { profile } from '@/mocks/app-data';
import { useAppTheme } from '@/hooks/use-app-theme';
import { MobileScreen } from '@/shared/ui/mobile-screen';

const benefitPalettes = [
  { backgroundColor: '#ffffff' },
  { backgroundColor: '#eef3ff' },
  { backgroundColor: '#fff0f5' },
] as const;

export function ProfileScreen() {
  const { colors } = useAppTheme();

  return (
    <MobileScreen contentContainerStyle={styles.pageContent}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View style={[styles.backgroundOrbTop, { backgroundColor: '#dce7ff' }]} />
        <View style={[styles.backgroundOrbBottom, { backgroundColor: '#ffddeb' }]} />
      </View>

      <View style={styles.topBar}>
        <ThemedText style={styles.pageTitle}>个人中心</ThemedText>
        <View style={styles.topActions}>
          <View style={[styles.topActionButton, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="gift-outline" size={20} color={colors.text} />
          </View>
          <View style={[styles.topActionButton, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="cog-outline" size={20} color={colors.text} />
          </View>
        </View>
      </View>

      <View style={[styles.profileHero, { backgroundColor: colors.hero }]}>
        <View style={styles.heroBubblePink} />
        <View style={styles.heroBubbleBlue} />
        <View style={styles.profileHeaderRow}>
          <View style={styles.avatarWrap}>
            <MaterialCommunityIcons name="account" size={28} color="#ffffff" />
          </View>
          <View style={styles.profileCopy}>
            <ThemedText style={styles.profileName}>{profile.user.name}</ThemedText>
            <ThemedText style={styles.profileMeta}>
              ID: {profile.user.id} · {profile.user.membership}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricGrid}>
          {profile.metrics.map((metric) => (
            <View key={metric.id} style={styles.metricCard}>
              <ThemedText style={styles.metricValue}>{metric.value}</ThemedText>
              <ThemedText style={styles.metricLabel}>{metric.label}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>我的权益</ThemedText>
        <View style={styles.benefitsGrid}>
          {profile.benefits.map((benefit, index) => (
            <View
              key={benefit.id}
              style={[
                styles.benefitCard,
                benefitPalettes[index],
                {
                  borderColor: colors.line,
                },
              ]}>
              <ThemedText style={styles.benefitValue}>{benefit.value}</ThemedText>
              <ThemedText style={[styles.benefitLabel, { color: colors.mutedText }]}>
                {benefit.label}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>常用功能</ThemedText>
        <View style={styles.menuGroup}>
          {profile.menus.map((menu) => (
            <Pressable
              key={menu.id}
              style={[
                styles.menuRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.line,
                },
              ]}>
              <ThemedText style={styles.menuTitle}>{menu.title}</ThemedText>
              {menu.badge ? (
                <View style={[styles.menuBadge, { backgroundColor: colors.primary }]}>
                  <ThemedText style={styles.menuBadgeText}>{menu.badge}</ThemedText>
                </View>
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.mutedText} />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.growthCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.line,
          },
        ]}>
        <ThemedText style={styles.growthTitle}>{profile.growthTask.title}</ThemedText>
        <ThemedText style={[styles.growthDescription, { color: colors.mutedText }]}>
          {profile.growthTask.description}
        </ThemedText>
        <View style={[styles.growthAction, { backgroundColor: colors.hero }]}>
          <ThemedText style={styles.growthActionText}>{profile.growthTask.actionLabel}</ThemedText>
        </View>
      </View>
    </MobileScreen>
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
  backgroundOrbTop: {
    borderRadius: 999,
    height: 220,
    opacity: 0.48,
    position: 'absolute',
    right: -88,
    top: -88,
    width: 220,
  },
  backgroundOrbBottom: {
    borderRadius: 999,
    height: 150,
    left: -44,
    opacity: 0.58,
    position: 'absolute',
    top: 310,
    width: 150,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
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
  profileHero: {
    borderRadius: 30,
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
  },
  heroBubblePink: {
    backgroundColor: 'rgba(255,107,143,0.28)',
    borderRadius: 999,
    height: 132,
    position: 'absolute',
    right: -20,
    top: -34,
    width: 132,
  },
  heroBubbleBlue: {
    backgroundColor: 'rgba(98,154,255,0.22)',
    borderRadius: 999,
    bottom: -46,
    height: 128,
    left: -8,
    width: 128,
    position: 'absolute',
  },
  profileHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  avatarWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  profileCopy: {
    gap: 4,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  profileMeta: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  metricCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 6,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  benefitsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  benefitCard: {
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  benefitValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  benefitLabel: {
    fontSize: 12,
    marginTop: 6,
  },
  menuGroup: {
    gap: 10,
  },
  menuRow: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  menuBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  growthCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  growthTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  growthDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  growthAction: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  growthActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
