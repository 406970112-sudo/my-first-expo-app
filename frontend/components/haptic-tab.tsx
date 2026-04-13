// BottomTabBarButtonProps 是底部 tab 按钮的 props 类型。
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
// PlatformPressable 是 React Navigation 提供的跨平台可点击组件。
import { PlatformPressable } from '@react-navigation/elements';
// expo-haptics 用来触发手机震动/触觉反馈。
import * as Haptics from 'expo-haptics';

/**
 * 自定义 Tab 按钮。
 *
 * 功能很简单：
 * 当用户按下底部 tab 时，在 iOS 上给一个轻微震动反馈，
 * 然后再执行系统原本的点击逻辑。
 */
export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      // 先把原始按钮需要的属性都传进去。
      {...props}
      onPressIn={(ev) => {
        // 只在 iOS 上启用轻触觉反馈。
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // 最后别忘了继续执行外部原本传进来的 onPressIn。
        props.onPressIn?.(ev);
      }}
    />
  );
}
