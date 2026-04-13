# 阿里云 Ubuntu 22.04 一键上线版

这套模板适合当前仓库的部署方式：

- `frontend/` 作为 Expo Web 静态站点
- `backend/` 作为 Go API 服务
- 一台阿里云 ECS 同时部署前端和后端
- 用 Nginx 对外提供站点和反向代理

## 目录说明

- `bootstrap-server.sh`
  初始化服务器环境，安装 Nginx、Node.js、Go、Certbot 等依赖。
- `deploy-project.sh`
  拉代码、写环境变量、构建前端和后端、安装 `systemd` 与 Nginx 配置。
- `templates/my-first-expo-app-backend.service`
  后端 `systemd` 模板。
- `templates/app.example.com.conf`
  前端 Nginx 站点模板。
- `templates/api.example.com.conf`
  后端 Nginx 站点模板。

## 最短使用路径

### 1. 初始化服务器

```bash
sudo bash deploy/alicloud/ubuntu-22.04/bootstrap-server.sh
```

### 2. 一键部署项目

把下面的值替换成你自己的：

```bash
sudo \
REPO_URL='https://your.git.repo.git' \
BRANCH='main' \
APP_ROOT='/srv/my-first-expo-app' \
APP_DOMAIN='app.example.com' \
API_DOMAIN='api.example.com' \
VOLC_APP_ID='your_app_id' \
VOLC_ACCESS_TOKEN='your_access_token' \
bash deploy/alicloud/ubuntu-22.04/deploy-project.sh
```

如果你需要覆盖更多配置，还可以额外传这些变量：

- `VOLC_RESOURCE_ID`
- `VOLC_ENDPOINT`
- `SERVER_PORT`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `MAX_REQUEST_BODY_BYTES`
- `TTS_MAX_TEXT_LENGTH`
- `TTS_MAX_CONTEXT_LENGTH`
- `TTS_REQUEST_TIMEOUT_MS`
- `STORAGE_AUDIO_DIR`
- `APP_USER`
- `APP_GROUP`
- `GOPROXY`

### 3. 开 HTTPS

先把域名解析到 ECS 公网 IP，然后执行：

```bash
sudo certbot --nginx -d app.example.com -d api.example.com
```

## 部署完成后检查

后端服务状态：

```bash
sudo systemctl status my-first-expo-app-backend
```

查看后端日志：

```bash
sudo journalctl -u my-first-expo-app-backend -f
```

检查 Nginx：

```bash
sudo nginx -t
sudo systemctl status nginx
```

检查接口：

```bash
curl http://127.0.0.1:3000/healthz
curl https://api.example.com/healthz
```
