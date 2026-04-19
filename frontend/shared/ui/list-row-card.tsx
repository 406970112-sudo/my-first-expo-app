import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { SurfaceCard } from '@/shared/ui/surface-card';

type ListRowCardProps = {
  title: string;
  subtitle?: string;
  renderRight?: ReactNode;
  onPress?: () => void;
};

export function ListRowCard({ title, subtitle, renderRight, onPress }: ListRowCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <SurfaceCard style={styles.card}>
        <View style={styles.copy}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          {subtitle ? (
            <ThemedText style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</ThemedText>
          ) : null}
        </View>
        {renderRight ? <View style={styles.right}>{renderRight}</View> : null}
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  copy: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  right: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
