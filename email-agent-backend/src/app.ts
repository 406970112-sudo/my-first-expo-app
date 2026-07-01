import Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import router from './routes';
import './types'; // 加载类型扩展
import 'dotenv/config'

const app = new Koa();

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  ctx.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (ctx.method === 'OPTIONS') {
    ctx.status = 204
    return
  }

  await next()
})

// 中间件
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
const PORT = process.env.PORT || 1234;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
