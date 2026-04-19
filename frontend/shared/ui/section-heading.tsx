import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';

type SectionHeadingProps = {
  title: string;
  actionLabel?: string;
};

export function SectionHeading({ title, actionLabel }: SectionHeadingProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {actionLabel ? (
        <ThemedText style={[styles.action, { color: colors.mutedText }]}>{actionLabel}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  action: {
    fontSize: 12,
    fontWeight: '600',
  },
});
