# 部署指南

> **Version**: v1.6.0
> **Last Updated**: 2026-02-05

## 开发环境

### 前提条件

- Node.js 20+
- Python 3.12+
- Rust (for Tauri)
- pnpm

### 安装依赖

```bash
# 前端依赖
cd apps/desktop
pnpm install

# 后端依赖
cd apps/api
pip install -r requirements.txt
```

### 启动服务

```bash
# 启动后端 API
cd apps/api
uvicorn server:app --reload --port 8000

# 启动前端开发服务器
cd apps/desktop
pnpm dev

# 启动 Tauri 桌面应用
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
```

### 环境变量

创建 `.env` 文件：

```env
DEEPSEEK_API_KEY=your_api_key
YAHOO_FINANCE_API_KEY=your_api_key
DATABASE_URL=your_database_url
```

## CI/CD

项目使用 GitHub Actions 进行持续集成：

- `.github/workflows/ci-cd.yml`: 主要 CI/CD 流水线
- 自动运行 CDD 审计、测试和构建

---

*文档版本: v1.6.0 | 更新日期: 2026-02-05*
