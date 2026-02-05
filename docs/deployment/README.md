# 部署指南

> **Version**: v1.8.0
> **Last Updated**: 2026-02-05

## 开发环境

### 前提条件

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | 20+ | 前端构建 |
| pnpm | 8+ | 包管理器 |
| Python | 3.12+ | 后端运行 |
| Rust | Latest | Tauri 桌面框架 |

### 安装依赖

```bash
# 1. 克隆仓库
git clone https://github.com/wsman/MY-DOGE-MACRO.git
cd MY-DOGE-MACRO

# 2. 前端依赖
cd apps/desktop
pnpm install

# 3. 后端依赖
cd ../api
pip install -r requirements.txt

# 4. 量化引擎依赖
cd ../../libs/quant-engine
pip install -r requirements.txt
```

### 启动服务

```bash
# 终端 1: 启动后端 API
cd apps/api
uvicorn main:app --reload --port 8000

# 终端 2: 启动前端开发服务器
cd apps/desktop
pnpm dev

# 或者启动 Tauri 桌面应用
pnpm tauri dev
```

## 生产部署

### 构建

```bash
# 构建前端
cd apps/desktop
pnpm build

# 构建 Tauri 应用
pnpm tauri build

# 产出位置
# - Windows: apps/desktop/src-tauri/target/release/bundle/msi/
# - macOS: apps/desktop/src-tauri/target/release/bundle/dmg/
# - Linux: apps/desktop/src-tauri/target/release/bundle/deb/
```

### 后端部署

```bash
# 使用 Gunicorn + Uvicorn
cd apps/api
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# 或者使用 Docker
docker build -t my-doge-macro-api .
docker run -p 8000:8000 my-doge-macro-api
```

### 环境变量

创建 `.env` 文件：

```env
# API Keys
DEEPSEEK_API_KEY=sk-xxxxx

# 可选: 通达信路径 (自动检测)
TDX_PATH=/opt/tdx

# 服务器配置
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=info

# WebSocket
WS_HEARTBEAT_INTERVAL=30
```

## Docker 部署

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
    volumes:
      - ./data:/app/data

  # 可选: 前端静态文件服务
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./apps/desktop/dist:/usr/share/nginx/html
```

## CI/CD

项目使用 GitHub Actions 进行持续集成：

### 工作流

| 工作流 | 触发条件 | 任务 |
|--------|----------|------|
| `ci.yml` | Push/PR | 测试、Lint、CDD 审计 |
| `release.yml` | Tag | 构建和发布 |

### CDD 审计

每次 PR 自动运行 CDD 审计:

```bash
# 本地运行
cd infrastructure/cdd/tools
python cdd_audit.py

# 熵值检查
python measure_entropy.py
```

## 监控

### 健康检查端点

```bash
# API 健康检查
curl http://localhost:8000/health

# WebSocket 状态
curl http://localhost:8000/ws/stats
```

### 日志

日志位置:
- API: `apps/api/logs/`
- Desktop: 系统日志目录

---

*文档版本: v1.8.0 | 更新日期: 2026-02-05*
