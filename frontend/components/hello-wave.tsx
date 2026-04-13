// 使用 reanimated 提供的 Animated 组件来写动画版本的 Text。
import Animated from 'react-native-reanimated';

/**
 * 一个非常小的“挥手”动画组件。
 *
 * 它没有复杂状态，只是渲染一个文字版的手势图标，
 * 再通过动画样式让它轻轻左右旋转。
 */
export function HelloWave() {
  return (
    <Animated.Text
      style={{
        // 基础文字大小。
        fontSize: 28,
        // 行高略大一点，避免裁切。
        lineHeight: 32,
        // 让它在视觉上和标题更贴合一点。
        marginTop: -6,
        // 关键帧动画：到 50% 时旋转 25 度。
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        // 重复 4 次，避免一直晃动太吵。
        animationIterationCount: 4,
        // 每次动画时长 300 毫秒。
        animationDuration: '300ms',
      }}>
      {'👋'}
    </Animated.Text>
  );
}
