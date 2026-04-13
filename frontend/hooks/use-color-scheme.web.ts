import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Web 端专用的主题 hook。
 *
 * 为什么不直接复用 React Native 的 useColorScheme？
 * 因为 Web 端有一个常见问题叫“水合不一致”（hydration mismatch）：
 * 服务器渲染阶段拿到的主题信息，和浏览器真正运行时拿到的主题信息，可能不一样。
 *
 * 为了避免页面初次渲染时闪烁或报 hydration warning，
 * 这里在“完成水合之前”先固定返回 'light'，
 * 等组件挂载完成后，再返回真实主题。
 */
export function useColorScheme() {
  // 标记当前组件是否已经完成浏览器端挂载。
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // useEffect 只会在客户端运行。
    // 所以一旦执行到这里，我们就知道浏览器端已经接管页面了。
    setHasHydrated(true);
  }, []);

  // React Native 原生提供的主题值。
  const colorScheme = useRNColorScheme();

  // 完成水合后，返回真实主题。
  if (hasHydrated) {
    return colorScheme;
  }

  // 水合前统一返回浅色主题，保证服务端和客户端首帧一致。
  return 'light';
}
