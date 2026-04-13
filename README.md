# 项目结构说明

这个仓库现在按“一个仓库，前后端分目录”的方式整理好了：

- `frontend/`
  Expo 前端项目。页面、组件、静态资源、前端环境变量都在这里。
- `backend/`
  Go 后端项目。统一 API、TTS、后续用户系统和业务接口都建议继续放这里。
- `server/`
  旧的 Node 语音服务代码，当前更适合作为迁移参考，不建议继续扩展。
- `PRODUCTION_DEPLOY.md`
  生产部署说明。

## 推荐开发方式

前端开发：

```bash
cd frontend
npm install
npm run web
```

后端开发：

```bash
cd backend
cp .env.example .env
go mod tidy
go run ./cmd/api
```

## 为什么这样整理

这样做有几个实际好处：

- 前端和后端职责清楚，但还是一个仓库，联调方便。
- 后端以后继续扩展用户、订单、任务、日志时，不会和前端文件混在一起。
- 部署时可以分开构建、分开启动，但不需要拆成两个 Git 仓库。

## 你现在最该关注的目录

- 前端入口：[frontend/app](c:/Users/Administrator/Desktop/my-first-expo-app/frontend/app)
- 后端入口：[backend/cmd/api/main.go](c:/Users/Administrator/Desktop/my-first-expo-app/backend/cmd/api/main.go)
- 后端 HTTP 层：[backend/internal/httpapi/server.go](c:/Users/Administrator/Desktop/my-first-expo-app/backend/internal/httpapi/server.go)
- 后端 TTS 模块：[backend/internal/tts/service.go](c:/Users/Administrator/Desktop/my-first-expo-app/backend/internal/tts/service.go)

## 阿里云部署模板

如果你准备直接部署到阿里云 Ubuntu 22.04，可以直接看这套模板：

- [deploy/alicloud/ubuntu-22.04/README.md](c:/Users/Administrator/Desktop/my-first-expo-app/deploy/alicloud/ubuntu-22.04/README.md)
- [deploy/alicloud/ubuntu-22.04/bootstrap-server.sh](c:/Users/Administrator/Desktop/my-first-expo-app/deploy/alicloud/ubuntu-22.04/bootstrap-server.sh)
- [deploy/alicloud/ubuntu-22.04/deploy-project.sh](c:/Users/Administrator/Desktop/my-first-expo-app/deploy/alicloud/ubuntu-22.04/deploy-project.sh)
