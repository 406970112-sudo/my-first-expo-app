# Go 通用后端骨架

这是当前项目推荐使用的后端基础结构。它不是只为 TTS 临时写的一层转发，而是一个可以继续承载更多业务模块的 Go 服务。

当前已经把 TTS 做成了其中一个模块，后面你可以继续往里加用户、鉴权、订单、任务、文件、日志等能力。

## 目录结构

- `cmd/api`
  服务启动入口。后面如果你要拆后台任务、定时任务、消费者，也可以继续增加 `cmd/worker`、`cmd/cron` 之类的入口。
- `internal/config`
  统一管理环境变量和服务配置。
- `internal/httpapi`
  放 HTTP 服务相关的通用能力，例如路由装配、跨域、限流、错误返回。
- `internal/tts`
  当前的 TTS 模块，包括请求结构、业务服务和火山引擎 provider。

## 当前接口

- `GET /healthz`
  健康检查。
- `GET /api/v1/system/ping`
  系统探活示例接口。
- `POST /api/v1/tts/synthesize`
  新版 TTS 接口。
- `POST /api/synthesize`
  兼容当前前端的旧接口别名。
- `GET /voice/{fileName}`
  读取生成后的音频文件。

## 设计思路

这套结构的目标是把“通用服务能力”和“具体业务模块”分开：

- `config` 负责配置
- `httpapi` 负责对外提供 HTTP 服务
- `tts` 负责语音业务

以后继续加业务时，推荐每个业务一个目录，例如：

- `internal/auth`
- `internal/user`
- `internal/order`
- `internal/task`

这样会比把所有逻辑都堆到一个 `server.go` 文件里更容易维护。

## 启动方式

```bash
cd backend
cp .env.example .env
go mod tidy
go run ./cmd/api
```

服务会自动尝试读取：

- `backend/.env`
- 当前工作目录下的 `.env`

所以你既可以在 `backend/` 目录里启动，也可以从仓库根目录启动。

## 环境变量

至少需要配置：

- `VOLC_APP_ID`
- `VOLC_ACCESS_TOKEN`

常用配置还有：

- `SERVER_HOST`
- `SERVER_PORT`
- `SERVER_PUBLIC_BASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `TTS_MAX_TEXT_LENGTH`
- `TTS_MAX_CONTEXT_LENGTH`
- `TTS_REQUEST_TIMEOUT_MS`
- `STORAGE_AUDIO_DIR`
- `VOLC_RESOURCE_ID`
- `VOLC_ENDPOINT`

完整示例见 [backend/.env.example](c:/Users/Administrator/Desktop/my-first-expo-app/backend/.env.example)。

## 扩展建议

如果你准备把它继续做成正式后端，推荐下一步优先补：

1. 鉴权中间件
2. 数据库层
3. 统一日志
4. 配置分环境管理
5. 对象存储
6. 任务队列
7. 单元测试和集成测试
