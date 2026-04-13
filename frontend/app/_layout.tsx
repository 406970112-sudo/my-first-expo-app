// 这里的主题对象来自 React Navigation。
// Expo Router 底层也是基于 React Navigation，所以全局导航外观要在这里配置。
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// Stack 用来声明“堆栈式”页面结构。
// 你可以把它理解为：页面一层层往上叠，加一个页面就是 push，返回就是 pop。
import { Stack } from 'expo-router';
// StatusBar 用来控制手机顶部状态栏（时间、电量那一条）的颜色风格。
import { StatusBar } from 'expo-status-bar';
// 引入 reanimated 是官方模板要求的初始化方式之一。
// 这个导入通常不直接使用变量，但必须尽早加载，动画库才能正常工作。
import 'react-native-reanimated';

// 这是我们自己封装的主题 hook。
// 它会根据系统当前是浅色模式还是深色模式，返回 'light' 或 'dark'。
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Expo Router 的额外路由设置。
 *
 * `anchor: '(tabs)'` 的意思可以简单理解成：
 * 当我们从 Tab 页面打开一个“模态页”（比如 `/modal`）时，
 * Router 会把 `(tabs)` 这组页面当成主要锚点，
 * 这样返回时行为会更符合我们直觉。
 */
export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * 整个 App 的根布局。
 *
 * 在 Expo Router 里，`app/_layout.tsx` 很重要，
 * 因为它相当于“所有页面最外层的公共壳子”。
 *
 * 这里主要做了 3 件事：
 * 1. 根据系统主题，给导航系统套上浅色或深色主题。
 * 2. 注册顶层页面结构：一个 tabs 区域 + 一个 modal 页面。
 * 3. 统一设置状态栏样式。
 */
export default function RootLayout() {
  // 读取当前系统主题，结果通常是 'light'、'dark' 或 null。
  const colorScheme = useColorScheme();

  return (
    // ThemeProvider 会把主题对象传给整个导航系统。
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Stack 表示当前根级路由采用“堆栈导航”结构。 */}
      <Stack>
        {/* `(tabs)` 是一个分组目录，不会直接出现在 URL 里。
            headerShown: false 表示不显示这个外层页面的默认顶部导航栏。 */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* `modal` 对应 app/modal.tsx。
            presentation: 'modal' 表示把它当成模态页弹出。 */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: '弹窗' }} />
      </Stack>

      {/* style="auto" 表示状态栏风格自动跟随当前背景环境调整。 */}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
