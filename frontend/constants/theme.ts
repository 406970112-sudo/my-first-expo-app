/**
 * 这个文件是项目的“主题常量中心”。
 *
 * 你可以把它理解成一个统一的设计令牌（design tokens）文件：
 * - 颜色放这里
 * - 字体放这里
 * 这样后面如果要全局改风格，就不用到处翻页面代码。
 */

import { Platform } from 'react-native';

// 浅色模式下的强调色。
// 一般会用于按钮高亮、链接、tab 激活态等场景。
const tintColorLight = '#0a7ea4';

// 深色模式下的强调色。
// 这里用白色，让深色背景上的高亮足够明显。
const tintColorDark = '#fff';

/**
 * 全局颜色配置。
 *
 * light 和 dark 分别对应两套主题。
 * 每个字段表示一种“语义颜色”，而不是某个具体组件的专属颜色。
 */
export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

/**
 * 跨平台字体映射。
 *
 * 同样的“语义字体名”，在不同平台可能会映射到不同真实字体，
 * 目的是尽量让显示效果更协调。
 */
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
