# Docker 部署指南

## 快速开始

### 开发模式 (热重载)

```bash
# 启动开发环境 (端口 3000)
docker-compose -f docker-compose.dev.yml up --build

# 后台运行
docker-compose -f docker-compose.dev.yml up -d --build

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f
```

**访问地址**:
- 前端: http://localhost:3000
- API: http://localhost:3000/api/
- WebSocket: ws://localhost:3000/ws/
- 健康检查: http://localhost:3000/health

**热重载说明**:
- 前端代码修改会自动触发热重载 (Vite HMR)
- 后端代码修改会自动触发热重载 (Uvicorn --reload)

### 生产模式

```bash
# 构建并启动生产环境 (端口 80)
docker-compose up -d --build

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

**访问地址**:
- 前端: http://localhost
- API: http://localhost/api/
- WebSocket: ws://localhost/ws/

---

## 环境变量

创建 `.env` 文件配置环境变量:

```bash
# API认证令牌
API_TOKEN=your-secure-token

# DeepSeek AI密钥
DEEPSEEK_API_KEY=your-deepseek-api-key
```

---

## 架构说明

```
┌─────────────────────────────────────────────────┐
│              Nginx (端口 80/3000)               │
│  ┌─────────────┬─────────────┬───────────────┐  │
│  │ 静态文件 /  │ API /api/   │ WS /ws/       │  │
│  └──────┬──────┴──────┬──────┴───────┬───────┘  │
└─────────┼─────────────┼──────────────┼──────────┘
          │             │              │
    ┌─────▼─────┐ ┌─────▼─────┐ ┌──────▼──────┐
    │  前端     │ │  后端API  │ │  WebSocket  │
    │  1420     │ │  8765     │ │  8765       │
    └───────────┘ └───────────┘ └─────────────┘
```

---

## 服务说明

| 服务 | 容器名 | 内部端口 | 说明 |
|------|--------|----------|------|
| nginx | mydoge-nginx-dev | 80 | 反向代理 |
| web | mydoge-web-dev | 1420 | Vite开发服务器 |
| api | mydoge-api-dev | 8765 | FastAPI后端 |

---

## 常用命令

```bash
# 重新构建镜像
docker-compose -f docker-compose.dev.yml build --no-cache

# 进入容器调试
docker exec -it mydoge-api-dev /bin/bash
docker exec -it mydoge-web-dev /bin/sh

# 查看容器资源使用
docker stats

# 清理未使用的资源
docker system prune -a
```

---

## 故障排查

### 端口冲突
如果端口被占用，修改 `docker-compose.dev.yml` 中的端口映射:
```yaml
nginx:
  ports:
    - "3001:80"  # 改为其他端口
```

### 容器无法启动
1. 检查日志: `docker-compose logs <service>`
2. 检查健康状态: `docker inspect <container>`
3. 重建镜像: `docker-compose build --no-cache`

### 热重载不生效
1. 确认volume挂载正确
2. 检查文件修改是否在挂载目录内
3. 重启容器: `docker-compose restart <service>`

---

## 生产部署建议

1. **使用 HTTPS**: 配置 SSL 证书
2. **限制资源**: 设置 CPU 和内存限制
3. **日志管理**: 配置日志驱动
4. **备份策略**: 定期备份数据卷
5. **监控告警**: 集成监控系统

---

*最后更新: 2026-02-13*