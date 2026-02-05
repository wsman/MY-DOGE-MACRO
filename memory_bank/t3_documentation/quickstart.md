# 快速入门指南

> **Version**: v1.8.0
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

需要配置的密钥:
- `DEEPSEEK_API_KEY`: DeepSeek API 密钥
- `TDX_PATH`: 通达信安装路径 (可选，自动检测)

### 3. 安装依赖

```bash
# 后端
cd apps/api
pip install -r requirements.txt

# 量化引擎
cd ../../libs/quant-engine
pip install -r requirements.txt

# 前端
cd ../../apps/desktop
pnpm install
```

### 4. 启动服务

```bash
# 终端 1: 启动后端
cd apps/api
uvicorn main:app --reload --port 8000

# 终端 2: 启动前端
cd apps/desktop
pnpm tauri dev
```

## 项目结构

```
MY-DOGE-MACRO/
├── apps/
│   ├── desktop/            # 桌面应用 (React 19 + Tauri v2)
│   │   └── src/components/
│   │       ├── atoms/      # 原子组件
│   │       ├── molecules/  # 分子组件
│   │       ├── organisms/  # 有机体组件
│   │       └── charts/     # 图表组件
│   └── api/                # 后端 API (FastAPI)
│       └── core/           # WebSocket 实时推送
├── libs/
│   ├── quant-engine/       # 量化引擎
│   │   ├── analysis/       # 技术指标 (MACD/RSI/KDJ...)
│   │   └── data/           # 数据源 (yfinance/通达信)
│   └── design-system/      # 设计系统
└── memory_bank/t3_documentation/                   # 文档
```

## 功能特性

### v1.8.0 新增功能

- **图表可视化**: K 线图 + MACD/RSI/KDJ/Bollinger 技术指标
- **Dashboard 组件**: 市场概览、分析面板、AI 研报展示
- **WebSocket 实时推送**: 实时价格更新
- **通达信集成**: 本地 A 股数据读取

### 核心功能

- **宏观分析**: 全球市场联动分析 (科技股/黄金/数字货币/A股)
- **AI 研报**: DeepSeek 驱动的自动报告生成
- **量化指标**: RSRS、波动率偏度、MACD、RSI、KDJ 等
- **实时扫描**: 多市场并行扫描和动量分析

## 技术指标

系统支持以下技术指标:

| 指标 | 描述 | 用途 |
|------|------|------|
| **MA** | 简单移动平均 | 趋势方向 |
| **EMA** | 指数移动平均 | 快速趋势 |
| **MACD** | 指数平滑异同移动平均 | 金叉/死叉信号 |
| **RSI** | 相对强弱指数 | 超买/超卖判断 |
| **KDJ** | 随机指标 | K/D 交叉信号 |
| **Bollinger** | 布林带 | 波动区间 |
| **RSRS** | 阻力支撑相对强度 | 择时信号 |

## 下一步

- 查看 [架构文档](../architecture/overview.md)
- 查看 [API 参考](./api-reference.md)
- 查看 [技术指标文档](./indicators.md)
- 查看 [部署指南](./deployment.md)

---

*文档版本: v1.8.0 | 更新日期: 2026-02-05*
