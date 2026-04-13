// 这个文件是 iOS 专用实现。
// React Native / Metro 会优先识别 `.ios.tsx`，所以在 iOS 上会自动用这个版本。

import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

/**
 * 跨平台图标组件（iOS 版本）。
 *
 * 在 iOS 上我们直接使用原生的 SF Symbols，
 * 显示效果会更贴近系统风格。
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <SymbolView
      // 图标粗细。
      weight={weight}
      // 图标颜色。
      tintColor={color}
      // 保持图标缩放比例。
      resizeMode="scaleAspectFit"
      // SF Symbol 的名字。
      name={name}
      style={[
        {
          // 直接用 size 同时控制宽和高。
          width: size,
          height: size,
        },
        // 允许外部继续叠加样式。
        style,
      ]}
    />
  );
}
