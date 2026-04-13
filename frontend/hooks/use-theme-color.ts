/**
 * 关于浅色/深色模式，可以参考：
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * 读取“当前主题下的最终颜色值”。
 *
 * 这是一个非常常用的小工具 hook。
 * 它的思路是：
 * 1. 如果当前组件自己传了 light / dark 颜色，就优先使用组件自己的。
 * 2. 如果没传，再回退到全局 Colors 常量里的颜色。
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // 当前主题，拿不到时默认浅色。
  const theme = useColorScheme() ?? 'light';
  // 先尝试读取组件级覆盖颜色。
  const colorFromProps = props[theme];

  if (colorFromProps) {
    // 有局部覆盖时，优先返回局部颜色。
    return colorFromProps;
  } else {
    // 没有局部覆盖时，回退到全局主题颜色表。
    return Colors[theme][colorName];
  }
}
