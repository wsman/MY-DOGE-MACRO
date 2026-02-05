# 部署指南

> **Version**: v1.8.0  
> **Last Updated**: 2026-02-05  
> **Category**: Deployment  
> **Audience**: DevOps, System Administrators, Developers  
> **Status**: ✅ Current  

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

## 部署架构概述

### 部署组件
- **桌面应用**: Tauri 跨平台桌面应用（Windows, macOS, Linux）
- **API 服务**: FastAPI 后端服务（可独立部署）
- **部署环境**: 开发、测试、生产

### 桌面应用部署
- **系统要求**: Windows 10+, macOS 10.13+, Linux 主流发行版
- **构建环境**: Rust 工具链, Node.js 18+
- **构建配置**: Tauri 配置和应用设置
- **构建过程**: 开发构建和优化生产构建
- **构建产物**: 平台特定可执行文件、安装程序、软件包
- **代码签名**: 可选但推荐用于生产分发
- **分发方法**: 手动分发和自动更新

### API 服务部署
- **环境准备**: Python 虚拟环境，数据库设置
- **配置管理**: 环境变量，配置文件
- **部署方法**:
  - 直接执行（简单部署）
  - Gunicorn + Uvicorn workers（推荐用于生产）
  - Docker 容器（容器化部署）
  - Docker Compose（完整系统部署）
- **反向代理配置**: Nginx 和 Caddy 示例
- **服务管理**: Linux 系统的 Systemd 服务文件

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

## 快速参考命令

### 桌面应用构建
```bash
# 开发构建
cd apps/desktop && npm run tauri build

# 生产构建（优化）
npm run tauri build -- --release

# 平台特定构建
npm run tauri build -- --target x86_64-pc-windows-msvc   # Windows
npm run tauri build -- --target x86_64-apple-darwin      # macOS Intel
npm run tauri build -- --target aarch64-apple-darwin     # macOS Apple Silicon
npm run tauri build -- --target x86_64-unknown-linux-gnu # Linux
```

### API 服务部署
```bash
# 直接执行
cd server && python server.py --host 0.0.0.0 --port 8765 --token your-token

# Gunicorn 生产部署
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8765

# Docker 部署
docker build -t my-doge-api:v1.8.0 -f Dockerfile.api .
docker run -d -p 8765:8765 -v ./data:/app/data --name my-doge-api my-doge-api:v1.8.0
```

### 服务管理
```bash
# Systemd 服务控制
sudo systemctl daemon-reload
sudo systemctl enable mydoge-api
sudo systemctl start mydoge-api
sudo systemctl status mydoge-api

# 日志监控
sudo journalctl -u mydoge-api -f
```

## 安全配置

### 身份验证与授权
- 强 API 令牌生成
- 端口管理和访问控制
- Let's Encrypt 集成 HTTPS
- 适当的用户权限和服务隔离

## 生产部署检查清单

### 部署前
- [ ] 验证系统要求满足
- [ ] 设置安全身份验证令牌
- [ ] 配置环境变量
- [ ] 准备备份策略
- [ ] 设置监控和告警

### 部署
- [ ] 构建应用制品
- [ ] 部署到目标环境
- [ ] 配置反向代理（如果需要）
- [ ] 设置服务管理
- [ ] 配置防火墙和安全

### 部署后
- [ ] 验证服务健康
- [ ] 测试关键功能
- [ ] 监控性能指标
- [ ] 记录部署详情
- [ ] 安排定期维护

---

**文档状态**: ✅ 当前 (v1.8.0)  
**维护者**: Negentropy Lab AI Agent System  
**CDD 框架**: v1.6.1  
**部署版本**: v1.8.0  
**最后验证**: 2026-02-05