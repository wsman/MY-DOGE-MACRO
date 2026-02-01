# MY-DOGE-MICRO

> 量化交易分析系统 | React 19 + Tauri v2 + FastAPI + DeepSeek

## 📊 项目概述

MY-DOGE-MICRO 是一个基于 CDD (Constitution-Driven Development) v1.5.0 架构开发的量化交易分析系统。

## 🛠 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端 UI** | React 19 + TypeScript | Tauri 桌面应用 |
| **App Shell** | Tauri v2 (Rust) | 跨平台桌面框架 |
| **后端 API** | Python FastAPI | RESTful API 服务 |
| **数据分析** | pandas, numpy, scipy | 量化算法 |
| **数据源** | yfinance, 通达信 DB | 市场数据获取 |
| **AI 引擎** | DeepSeek API | 智能分析与报告 |

## 🎯 核心功能

- **市场数据分析**: 实时股票/加密货币行情
- **RSRS 指标计算**: 阻力支撑相对强度评分
- **波动率偏度分析**: 市场情绪检测
- **AI 投资报告**: DeepSeek 驱动的策略报告生成
- **局域网访问**: 支持团队协作访问

## 📁 项目结构

```
MY-DOGE-MICRO/
├── client/                 # 前端 (React 19 + Tauri v2)
│   ├── docs/              # 设计文档
│   ├── src/               # React 组件和页面
│   ├── src-tauri/         # Tauri 桌面壳
│   ├── index.html         # HTML 入口
│   ├── package.json       # npm 依赖
│   ├── vite.config.ts     # Vite 配置
│   ├── tailwind.config.js # Tailwind 配置
│   ├── postcss.config.js  # PostCSS 配置
│   ├── tsconfig.json      # TypeScript 配置
│   └── tsconfig.node.json # Node TypeScript 配置
│
├── server/                 # 后端 (FastAPI)
│   ├── core/              # API 路由
│   ├── macro/             # 宏观分析 API
│   ├── micro/             # 微观分析 API
│   ├── utils/             # 工具函数
│   └── server.py          # 服务入口
│
├── engine/                 # 量化引擎 (算法模块)
│   ├── analysis/          # RSRS, Volatility Skew
│   ├── data/              # 数据采集 (yfinance)
│   └── ai/                # DeepSeek 报告生成
│
├── memory_bank/           # CDD 文档体系
│   ├── core/              # T0 核心文档
│   ├── axioms/            # T1 系统公理
│   ├── protocols/         # T2 协议
│   └── standards/         # T2 标准
│
├── config/               # 配置文件
├── data/                 # 数据和报告
│   └── reports/
│       ├── macro/        # 宏观分析报告
│       └── micro/        # 动量分析报告
│
├── specs/                # 功能规格文档
└── README.md             # 本文档
```

## 🚀 快速启动

### 后端服务

```bash
cd server
pip install -r requirements.txt
python server.py --host 0.0.0.0 --port 8765
```

### 前端开发

```bash
cd client
npm install
npm run tauri dev
```

## 📖 CDD 工作流

项目遵循 CDD v1.5.0 五状态工作流:

```
State A → State B → State C → State D → State E
  加载      规划      实现      验证      收敛
```

## 📄 文档体系

| 级别 | 目录 | 说明 |
|------|------|------|
| **T0** | `memory_bank/core/` | 核心意识文档 |
| **T1** | `memory_bank/axioms/` | 系统公理 |
| **T2** | `memory_bank/protocols/` | 工作流协议 |
| **T2** | `memory_bank/standards/` | 实现标准 |

## 🔗 相关链接

- **GitHub**: https://github.com/wsman/MY-DOGE-MACRO
- **CDD Framework**: [OpenClaw CDD Skill](../openclaw/skills/cdd/)

## 📝 许可证

Apache License 2.0
