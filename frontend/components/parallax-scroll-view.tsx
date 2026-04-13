// PropsWithChildren 表示这个组件除了自己定义的 props 外，还会接收 children；
// ReactElement 表示一个 React 元素类型。
import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
// 这里导入了 Reanimated 的几个核心能力，用来监听滚动并生成动画样式。
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';

// 主题容器组件。
import { ThemedView } from '@/components/themed-view';
// 读取当前主题。
import { useColorScheme } from '@/hooks/use-color-scheme';
// 根据主题拿颜色值。
import { useThemeColor } from '@/hooks/use-theme-color';

// 头部区域的固定高度。
// 后面视差动画插值也会围绕这个高度来计算。
const HEADER_HEIGHT = 250;

// 这个组件需要外部传入：
// 1. children：正文内容
// 2. headerImage：头部放什么元素
// 3. headerBackgroundColor：浅色/深色下分别是什么背景色
type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

/**
 * 视差滚动容器组件。
 *
 * 这个组件把页面拆成两部分：
 * - 上面是一个会随着滚动产生位移和缩放的头部区域
 * - 下面是正常滚动的正文内容
 */
export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  // 正文容器背景色跟随主题。
  const backgroundColor = useThemeColor({}, 'background');
  // 当前主题，如果拿不到就默认使用 light。
  const colorScheme = useColorScheme() ?? 'light';

  // 创建一个可被动画系统引用的 ScrollView ref。
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  // 实时获取当前滚动偏移量（scrollY）。
  const scrollOffset = useScrollOffset(scrollRef);

  /**
   * 头部动画样式。
   *
   * 这里用了 interpolate（插值）：
   * 给它一个输入区间和输出区间，它会自动帮你算中间值。
   */
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            // 输入区间：下拉很多、正常位置、上推很多
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            // 输出区间：下拉时移动一半距离，正常时不动，上推时往上移动更多
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            // 下拉时放大，正常和上推时保持原始大小
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      // 把 ref 交给动画系统，方便监听滚动。
      ref={scrollRef}
      // 整个页面背景色跟随主题。
      style={{ backgroundColor, flex: 1 }}
      // 16ms 大约对应 60fps，一般能兼顾流畅度和性能。
      scrollEventThrottle={16}>
      <Animated.View
        style={[
          styles.header,
          // 头部背景色按主题切换。
          { backgroundColor: headerBackgroundColor[colorScheme] },
          // 再叠加滚动动画样式。
          headerAnimatedStyle,
        ]}>
        {headerImage}
      </Animated.View>

      {/* 下方正文区域 */}
      <ThemedView style={styles.content}>{children}</ThemedView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    // 头部高度固定，才能形成稳定的视差区域。
    height: HEADER_HEIGHT,
    // 超出头部区域的内容隐藏，避免图片缩放时溢出难看。
    overflow: 'hidden',
  },
  content: {
    // 让正文内容尽量铺满剩余空间。
    flex: 1,
    // 给正文留足够的阅读边距。
    padding: 32,
    // children 之间统一间距。
    gap: 16,
    overflow: 'hidden',
  },
});
