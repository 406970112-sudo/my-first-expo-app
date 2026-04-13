// Text 是原生文本组件；TextProps 是它对应的属性类型。
import { StyleSheet, Text, type TextProps } from 'react-native';

// 根据当前主题自动返回对应颜色。
import { useThemeColor } from '@/hooks/use-theme-color';

// 这个组件除了支持 Text 原本所有属性外，
// 还额外支持浅色/深色自定义颜色，以及几种预设文字类型。
export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

/**
 * 带主题能力的文本组件。
 *
 * 为什么要封装它？
 * 因为我们不想在每个页面里都手动判断浅色/深色、设置文字颜色和常用字号。
 * 把这些共性逻辑集中在这里，页面代码会更干净。
 */
export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  // 先根据主题拿到最终文字颜色。
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        // 所有类型的文本都先应用当前主题颜色。
        { color },
        // 然后根据 type 决定具体字号、字重等。
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        // 最后把外部传进来的 style 叠加上去，方便局部微调。
        style,
      ]}
      // 其余所有 Text 属性（比如 numberOfLines、onPress 等）继续透传。
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
