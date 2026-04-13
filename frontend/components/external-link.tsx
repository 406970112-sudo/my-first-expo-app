// Href 是 Expo Router 对路由地址的类型描述；
// Link 是跳转组件。
import { Href, Link } from 'expo-router';
// expo-web-browser 可以在原生端打开 App 内浏览器，而不是直接跳出到系统浏览器。
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
// ComponentProps 可以直接复用某个组件已有的 props 类型。
import { type ComponentProps } from 'react';

// 这里的意思是：
// 1. 先拿到 Link 原本所有的 props；
// 2. 去掉 href（因为我们想自己重新定义它的类型）；
// 3. 然后要求新的 href 同时满足 Href 和 string。
type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

/**
 * 外链组件。
 *
 * 设计目的：
 * - Web 端：像普通网页链接一样新开标签页。
 * - Android / iOS：不要直接跳到系统浏览器，而是在 App 内弹一个浏览器页面。
 */
export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      // Web 端打开新标签页。
      target="_blank"
      // 其余属性原样透传，这样这个封装不会限制原生 Link 的用法。
      {...rest}
      href={href}
      onPress={async (event) => {
        // 只有在原生平台才拦截默认行为。
        if (process.env.EXPO_OS !== 'web') {
          // 阻止默认跳转，否则系统可能直接把链接交给外部浏览器。
          event.preventDefault();

          // 改为在 App 内浏览器打开链接。
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
