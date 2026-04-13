// Link 是 Expo Router 提供的跳转组件。
import { Link } from 'expo-router';
// StyleSheet 是 React Native 推荐的样式组织方式。
import { StyleSheet } from 'react-native';

// 这两个是我们自己封装的“带主题能力”的基础组件。
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/**
 * 模态页面。
 *
 * 这个页面对应的路由文件是 `app/modal.tsx`，
 * 会被 `app/_layout.tsx` 注册成一个 modal 弹层页面。
 */
export default function ModalScreen() {
  return (
    // 最外层容器：垂直居中 + 水平居中。
    <ThemedView style={styles.container}>
      {/* 页面主标题 */}
      <ThemedText type="title">这是一个弹窗页面</ThemedText>

      {/* href="/" 表示跳回首页。
          dismissTo 可以理解为“关闭当前模态页并回到目标页面”。 */}
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">返回首页</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    // 占满整屏。
    flex: 1,
    // 子元素水平方向居中。
    alignItems: 'center',
    // 子元素垂直方向居中。
    justifyContent: 'center',
    // 给内容一些内边距，避免贴边。
    padding: 20,
  },
  link: {
    // 让链接和标题拉开一点距离。
    marginTop: 15,
    // 提高可点击区域，手指更容易点中。
    paddingVertical: 15,
  },
});
