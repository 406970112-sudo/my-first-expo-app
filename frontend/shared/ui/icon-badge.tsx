import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import type { AppIconName } from '@/types/app';
import { useAppTheme } from '@/hooks/use-app-theme';

type IconBadgeProps = {
  icon: AppIconName;
  color?: string;
  size?: number;
  tone?: 'soft' | 'dark';
};

export function IconBadge({ icon, color, size = 22, tone = 'soft' }: IconBadgeProps) {
  const { colors } = useAppTheme();
  const iconColor = color ?? (tone === 'dark' ? '#ffffff' : colors.primary);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: tone === 'dark' ? colors.hero : colors.primarySoft,
        },
      ]}>
      <MaterialCommunityIcons name={icon} size={size} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 18,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
});
