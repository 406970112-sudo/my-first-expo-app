// PropsWithChildren 让组件可以接收 children；
// useState 用来记录展开/收起状态。
import { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

// 项目里统一的主题文本和容器组件。
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
// 图标组件。
import { IconSymbol } from '@/components/ui/icon-symbol';
// 颜色常量。
import { Colors } from '@/constants/theme';
// 当前主题 hook。
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * 可折叠面板组件。
 *
 * 用法上很像：
 * <Collapsible title="标题">
 *   这里放可展开的内容
 * </Collapsible>
 */
export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  // isOpen 决定当前是否展开。
  const [isOpen, setIsOpen] = useState(false);
  // 当前主题，用于切换图标颜色。
  const theme = useColorScheme() ?? 'light';

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        // 每点一次就把 true / false 互相切换。
        onPress={() => setIsOpen((value) => !value)}
        // activeOpacity 越小，按下时透明度变化越明显。
        activeOpacity={0.8}>
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          // 展开时把箭头旋转 90 度，看起来更符合“已展开”的直觉。
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>

      {/* 只有在展开时才真正渲染内容。 */}
      {isOpen && <ThemedView style={styles.content}>{children}</ThemedView>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    // 标题行横向排列：箭头 + 标题文字。
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    // 展开内容和标题行之间留一点距离。
    marginTop: 6,
    // 向右缩进，让视觉层级更清晰。
    marginLeft: 24,
  },
});
