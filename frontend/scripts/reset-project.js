#!/usr/bin/env node

/**
 * 这是一个“重置项目模板”的脚本。
 *
 * 它的作用是：
 * 1. 询问你要不要保留当前模板代码；
 * 2. 如果保留，就把旧的 `app / components / hooks / constants / scripts`
 *    移动到 `app-example` 目录；
 * 3. 如果不保留，就直接删除这些目录；
 * 4. 最后重新生成一个最精简的 `app` 目录，方便你从空白项目开始。
 */

// fs：文件系统模块，用来创建、移动、删除文件和目录。
const fs = require('fs');
// path：路径处理模块，用来安全拼接路径。
const path = require('path');
// readline：命令行交互模块，用来在终端里问问题。
const readline = require('readline');

// 当前命令执行所在目录，也就是项目根目录。
const root = process.cwd();
// 这些目录会被移动或删除。
const oldDirs = ['app', 'components', 'hooks', 'constants', 'scripts'];
// 存放旧模板代码的新目录名。
const exampleDir = 'app-example';
// 重建后的新 app 目录名。
const newAppDir = 'app';
// 旧代码备份目录的完整路径。
const exampleDirPath = path.join(root, exampleDir);

// 这是脚本会新建出来的 app/index.tsx 内容。
const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>编辑 app/index.tsx 来修改这个页面。</Text>
    </View>
  );
}
`;

// 这是脚本会新建出来的 app/_layout.tsx 内容。
const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

// 创建一个命令行交互实例。
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * 根据用户输入，决定“移动旧目录”还是“删除旧目录”，
 * 然后再创建一个新的极简 app 目录。
 */
const moveDirectories = async (userInput) => {
  try {
    // 如果用户输入 y，表示要保留旧模板代码。
    if (userInput === 'y') {
      // 先创建 app-example 目录。
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      console.log(`已创建 /${exampleDir} 目录。`);
    }

    // 逐个处理旧目录。
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);

      // 如果目录存在，才继续处理。
      if (fs.existsSync(oldDirPath)) {
        if (userInput === 'y') {
          // 用户选择保留：把目录移动到 app-example 里。
          const newDirPath = path.join(root, exampleDir, dir);
          await fs.promises.rename(oldDirPath, newDirPath);
          console.log(`已将 /${dir} 移动到 /${exampleDir}/${dir}。`);
        } else {
          // 用户选择不保留：递归删除目录。
          await fs.promises.rm(oldDirPath, { recursive: true, force: true });
          console.log(`已删除 /${dir}。`);
        }
      } else {
        // 如果目录本来就不存在，打印一条提示并跳过。
        console.log(`/${dir} 不存在，已跳过。`);
      }
    }

    // 创建新的 /app 目录。
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log('\n已创建新的 /app 目录。');

    // 生成新的 index.tsx 文件。
    const indexPath = path.join(newAppDirPath, 'index.tsx');
    await fs.promises.writeFile(indexPath, indexContent);
    console.log('已创建 app/index.tsx。');

    // 生成新的 _layout.tsx 文件。
    const layoutPath = path.join(newAppDirPath, '_layout.tsx');
    await fs.promises.writeFile(layoutPath, layoutContent);
    console.log('已创建 app/_layout.tsx。');

    // 打印完成提示。
    console.log('\n项目重置完成。接下来你可以：');
    console.log(
      `1. 运行 \`npx expo start\` 启动开发服务器。\n2. 编辑 app/index.tsx 来修改主页面。${
        userInput === 'y'
          ? `\n3. 当你不再需要参考旧代码时，可以删除 /${exampleDir} 目录。`
          : ''
      }`
    );
  } catch (error) {
    // 如果脚本中途出错，就在终端里打印错误信息。
    console.error(`脚本执行出错：${error.message}`);
  }
};

// 在终端中提问，让用户决定是“移动旧文件”还是“直接删除旧文件”。
rl.question(
  '你想把现有文件移动到 /app-example，而不是直接删除吗？(Y/n): ',
  (answer) => {
    // 去掉首尾空格，转成小写；如果用户直接回车，就默认按 y 处理。
    const userInput = answer.trim().toLowerCase() || 'y';

    // 只接受 y 或 n 两种输入。
    if (userInput === 'y' || userInput === 'n') {
      moveDirectories(userInput).finally(() => rl.close());
    } else {
      console.log("输入无效，请输入 'Y' 或 'N'。");
      rl.close();
    }
  }
);
