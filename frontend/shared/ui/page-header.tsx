import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';

type PageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  rightSlot?: ReactNode;
};

export function PageHeader({ title, subtitle, eyebrow, rightSlot }: PageHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {eyebrow ? (
          <ThemedText style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</ThemedText>
        ) : null}
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</ThemedText>
      </View>
      {rightSlot ? <View>{rightSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
  },
});
