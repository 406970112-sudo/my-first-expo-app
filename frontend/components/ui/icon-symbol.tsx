// 这个文件是 Android 和 Web 的图标实现。
// 因为 SF Symbols 是 iOS 原生图标系统，其他平台不能直接用，
// 所以这里做一层“名称映射”，用 MaterialIcons 来替代。

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// 这个类型表示：
// key 是 SF Symbols 的名字，
// value 是 MaterialIcons 对应的名字。
type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
// 只允许使用 MAPPING 里已经映射过的图标名称。
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols 到 Material Icons 的映射表。
 *
 * 这样页面里就可以统一写 iOS 风格的名字，
 * 到 Android / Web 时再自动换成对应图标。
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} as IconMapping;

/**
 * 跨平台图标组件（Android / Web 版本）。
 *
 * 使用方式和 iOS 保持一致，但内部实现换成 Material Icons。
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  // 在当前平台上，真正渲染的是 MaterialIcons。
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
