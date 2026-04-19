import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type SurfaceCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function SurfaceCard({ children, style }: SurfaceCardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
          shadowColor: colors.shadow,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: {
      height: 12,
      width: 0,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
});
