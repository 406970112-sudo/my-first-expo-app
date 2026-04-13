// View 是最基础的布局容器组件；ViewProps 是它的属性类型。
import { View, type ViewProps } from 'react-native';

// 根据当前主题返回颜色值。
import { useThemeColor } from '@/hooks/use-theme-color';

// 这个组件比普通 View 多了两个可选属性：
// lightColor 和 darkColor，用来按主题覆盖背景色。
export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

/**
 * 带主题能力的容器组件。
 *
 * 它的核心作用非常简单：
 * 自动给 View 套上适合当前主题的背景色。
 */
export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  // 先求出最终背景色。
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  // 返回一个普通 View，只是多帮你处理了主题背景色。
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
