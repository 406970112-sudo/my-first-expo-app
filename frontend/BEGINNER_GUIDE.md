# 项目初学者说明

这份说明是给你配合代码注释一起看的。

原因很简单：
- `.tsx`、`.ts`、`.js` 文件里可以直接写注释
- 但 `package.json`、`app.json`、`tsconfig.json` 这类 JSON 配置文件不能随便加注释
- 所以这些配置我放到这份文档里解释

## 1. 这个项目的整体结构

`app/`
- 页面目录。Expo Router 会根据这里的文件自动生成路由。

`app/_layout.tsx`
- 整个应用的最外层布局。
- 负责主题、导航、状态栏等全局配置。

`app/(tabs)/`
- 一个“分组目录”。
- 这里的页面共用一个底部 Tab 导航。

`components/`
- 可复用组件目录。
- 比如主题文本、主题容器、外链组件、视差滚动组件。

`components/ui/`
- 更偏基础 UI 的小组件。
- 比如折叠面板、图标组件。

`hooks/`
- 自定义 Hook。
- 主要负责主题判断、颜色选择这类逻辑复用。

`constants/`
- 常量目录。
- 当前主要是主题颜色和字体配置。

`assets/`
- 静态资源目录。
- 图片、图标、启动图都放这里。

`scripts/`
- 项目脚本目录。
- 当前有一个重置模板项目的脚本。

## 2. `package.json` 是干什么的

它可以理解成“这个项目的身份证 + 依赖清单 + 常用命令清单”。

你现在最需要看这几个部分：

`name`
- 项目名称。

`main`
- 应用入口。
- 这里写的是 `expo-router/entry`，表示项目由 Expo Router 接管启动入口。

`scripts`
- 终端快捷命令。
- 常用的有：
- `npm run start`：启动开发服务器
- `npm run android`：在 Android 上运行
- `npm run ios`：在 iOS 上运行
- `npm run web`：在浏览器里运行
- `npm run lint`：检查代码规范
- `npm run reset-project`：把模板项目重置成一个更空白的起点

`dependencies`
- 运行项目必须要用到的库。
- 比如：
- `expo`：Expo 核心
- `expo-router`：文件路由系统
- `react` / `react-native`：React 和 React Native 本体
- `react-native-reanimated`：动画库
- `expo-image`：图片组件
- `expo-haptics`：触觉反馈

`devDependencies`
- 开发时需要，但打包运行时不一定需要的工具。
- 比如：
- `typescript`：TypeScript 支持
- `eslint`：代码规范检查

## 3. `app.json` 是干什么的

它是 Expo 项目的应用配置文件。

你可以把它理解成：
- App 叫什么名字
- 图标是什么
- 启动图是什么
- 安卓和 iOS 的一些平台设置是什么

常见字段：

`expo.name`
- App 的显示名称。

`expo.slug`
- Expo 项目标识名。

`expo.icon`
- App 图标路径。

`expo.scheme`
- 深链接协议名。
- 用于 App 被某种自定义链接唤起时识别。

`expo.userInterfaceStyle`
- 主题模式。
- `automatic` 表示跟系统走。

`expo.android.adaptiveIcon`
- Android 自适应图标配置。

`expo.web.favicon`
- Web 页面标签页图标。

`expo.plugins`
- Expo 插件配置。
- 当前项目里有：
- `expo-router`
- `expo-splash-screen`

`expo.experiments.typedRoutes`
- 开启 Expo Router 的类型化路由支持。
- 好处是写错路由时，TypeScript 更容易报出来。

## 4. `tsconfig.json` 是干什么的

这是 TypeScript 配置文件。

你可以先重点看这几个：

`extends: "expo/tsconfig.base"`
- 继承 Expo 官方推荐的 TypeScript 基础配置。

`compilerOptions.strict: true`
- 开启严格模式。
- 对初学者来说，虽然一开始会更容易报错，但长远看能帮你更早发现问题。

`compilerOptions.paths`
- 路径别名配置。
- 这里的 `@/* -> ./*` 表示：
- 你可以写 `@/components/themed-text`
- 不用写很长的相对路径 `../../components/themed-text`

`include`
- 告诉 TypeScript 需要扫描哪些文件。

## 5. `expo-env.d.ts` 是什么

这是 Expo 生成的类型声明文件。

它的作用是：
- 给 Expo 相关环境补充 TypeScript 类型支持
- 一般不需要手动修改

文件里也写了：
- `This file should not be edited`

所以这类文件你现在先知道用途就可以，不用动它。

## 6. 你接下来最建议先看哪几个文件

如果你是初学者，我建议你按这个顺序看：

1. `app/_layout.tsx`
- 先理解整个 App 的“外壳”怎么搭起来。

2. `app/(tabs)/_layout.tsx`
- 再理解底部 Tab 是怎么配置的。

3. `app/(tabs)/index.tsx`
- 再看首页页面结构。

4. `components/themed-text.tsx`
- 理解为什么要封装主题文本组件。

5. `components/themed-view.tsx`
- 理解为什么要封装主题容器组件。

6. `hooks/use-theme-color.ts`
- 理解主题颜色到底是怎么被选出来的。

7. `components/parallax-scroll-view.tsx`
- 最后再看稍微难一点的动画和滚动逻辑。

## 7. 你现在可以怎么练

建议你先做这几个最安全的小练习：

1. 把首页标题 `Welcome!` 改成你自己的文字。
2. 把 `constants/theme.ts` 里的 `tintColorLight` 改成你喜欢的颜色。
3. 在 `app/(tabs)/index.tsx` 里新增一段 `ThemedText`。
4. 在 `app/(tabs)/explore.tsx` 里新增一个 `Collapsible` 区块。
5. 把 `app/modal.tsx` 的标题改成中文，看看跳转效果。

如果你愿意，我下一步可以继续帮你做两件事中的任意一种：
- 把整个项目再“逐文件口语化讲解”一遍
- 带你从这个模板开始改成一个你自己的小应用
