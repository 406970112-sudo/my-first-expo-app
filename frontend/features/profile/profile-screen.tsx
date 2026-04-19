import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { profile } from '@/mocks/app-data';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ListRowCard } from '@/shared/ui/list-row-card';
import { MobileScreen } from '@/shared/ui/mobile-screen';
import { PageHeader } from '@/shared/ui/page-header';
import { SectionHeading } from '@/shared/ui/section-heading';
import { SurfaceCard } from '@/shared/ui/surface-card';

export function ProfileScreen() {
  const { colors } = useAppTheme();

  return (
    <MobileScreen>
      <PageHeader
        eyebrow="Profile"
        title="个人中心"
        subtitle="用统一的视觉容器承接用户资产、权益、任务和设置，方便后续继续接业务。"
      />

      <View style={[styles.heroCard, { backgroundColor: colors.hero }]}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={28} color="#ffffff" />
          </View>
          <View style={styles.profileCopy}>
            <ThemedText style={styles.profileName}>{profile.user.name}</ThemedText>
            <ThemedText style={styles.profileMeta}>
              ID: {profile.user.id} · {profile.user.membership}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.signature}>{profile.user.signature}</ThemedText>
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
        <SectionHeading title="我的权益" />
        <View style={styles.benefitGrid}>
          {profile.benefits.map((benefit) => (
            <SurfaceCard key={benefit.id} style={styles.benefitCard}>
              <ThemedText style={styles.benefitValue}>{benefit.value}</ThemedText>
              <ThemedText style={[styles.benefitLabel, { color: colors.mutedText }]}>
                {benefit.label}
              </ThemedText>
            </SurfaceCard>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeading title="常用功能" />
        {profile.menus.map((menu) => (
          <ListRowCard
            key={menu.id}
            title={menu.title}
            renderRight={
              menu.badge ? (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <ThemedText style={styles.badgeText}>{menu.badge}</ThemedText>
                </View>
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.mutedText} />
              )
            }
          />
        ))}
      </View>

      <SurfaceCard style={styles.taskCard}>
        <ThemedText style={styles.taskTitle}>{profile.growthTask.title}</ThemedText>
        <ThemedText style={[styles.taskDescription, { color: colors.mutedText }]}>
          {profile.growthTask.description}
        </ThemedText>
        <View style={[styles.taskAction, { backgroundColor: colors.hero }]}>
          <ThemedText style={styles.taskActionText}>{profile.growthTask.actionLabel}</ThemedText>
        </View>
      </SurfaceCard>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 30,
    gap: 18,
    padding: 20,
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  avatar: {
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
  signature: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 21,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
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
  benefitGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  benefitCard: {
    flex: 1,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  benefitValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  benefitLabel: {
    fontSize: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  taskCard: {
    gap: 8,
    padding: 18,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  taskAction: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  taskActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
