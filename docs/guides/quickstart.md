# 快速入门指南

> **Version**: v1.6.0
> **Last Updated**: 2026-02-05

## 概述

MY-DOGE-MACRO 是一个基于 AI Agent 的全栈量化情报与研报生成系统。

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/wsman/MY-DOGE-MACRO.git
cd MY-DOGE-MACRO
```

### 2. 配置环境

```bash
cp .env.example .env
# 编辑 .env 填入你的 API 密钥
```

### 3. 安装依赖

```bash
# 后端
cd apps/api
pip install -r requirements.txt

# 前端
cd apps/desktop
pnpm install
```

### 4. 启动服务

```bash
# 终端 1: 启动后端
cd apps/api
uvicorn server:app --reload

# 终端 2: 启动前端
cd apps/desktop
pnpm tauri dev
```

## 项目结构

```
MY-DOGE-MACRO/
├── apps/desktop/       # 桌面应用 (React + Tauri)
├── apps/api/           # 后端 API (FastAPI)
├── libs/quant-engine/  # 量化引擎
├── libs/design-system/ # 设计系统
└── docs/               # 文档
```

## 功能特性

- **宏观分析**: 全球市场联动分析
- **AI 研报**: DeepSeek 驱动的自动报告生成
- **量化指标**: RSRS、波动率偏度等专业指标
- **实时扫描**: 多市场并行扫描

## 下一步

- 查看 [架构文档](../architecture/overview.md)
- 查看 [API 参考](../api/README.md)
- 查看 [部署指南](../deployment/README.md)

---

*文档版本: v1.6.0 | 更新日期: 2026-02-05*
