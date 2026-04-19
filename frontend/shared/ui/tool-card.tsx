import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { IconBadge } from '@/shared/ui/icon-badge';
import { SurfaceCard } from '@/shared/ui/surface-card';
import type { AppTool } from '@/types/app';

type ToolCardProps = {
  tool: AppTool;
  compact?: boolean;
  onPress?: () => void;
};

export function ToolCard({ tool, compact = false, onPress }: ToolCardProps) {
  const { colors } = useAppTheme();
  const content = compact ? (
    <View style={styles.compactContent}>
      <IconBadge icon={tool.icon} color={tool.accentColor} />
      <ThemedText numberOfLines={1} style={styles.compactTitle}>
        {tool.name}
      </ThemedText>
      <ThemedText numberOfLines={1} style={[styles.compactSubtitle, { color: colors.mutedText }]}>
        {tool.tagline}
      </ThemedText>
    </View>
  ) : (
    <View style={styles.featureContent}>
      <View style={styles.featureTopRow}>
        <IconBadge icon={tool.icon} color={tool.accentColor} />
        <View style={styles.badgeRow}>
          {tool.badges.map((badge) => (
            <View
              key={badge}
              style={[
                styles.badge,
                {
                  backgroundColor: colors.surfaceMuted,
                },
              ]}>
              <ThemedText style={[styles.badgeText, { color: tool.accentColor }]}>{badge}</ThemedText>
            </View>
          ))}
        </View>
      </View>
      <ThemedText style={styles.featureTitle}>{tool.name}</ThemedText>
      <ThemedText style={[styles.featureTagline, { color: colors.mutedText }]}>
        {tool.tagline}
      </ThemedText>
      <ThemedText style={[styles.featureDescription, { color: colors.mutedText }]}>
        {tool.description}
      </ThemedText>
      <ThemedText style={[styles.featureAction, { color: tool.accentColor }]}>
        {tool.usageLabel}
      </ThemedText>
    </View>
  );

  return (
    <Pressable onPress={onPress}>
      <SurfaceCard style={compact ? styles.compactCard : styles.featureCard}>{content}</SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    padding: 12,
  },
  compactContent: {
    gap: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  compactSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  featureCard: {
    padding: 16,
  },
  featureContent: {
    gap: 8,
  },
  featureTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
    marginLeft: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  featureTagline: {
    fontSize: 13,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  featureAction: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
});
