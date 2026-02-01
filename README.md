# My Doge Macro 🐶📈

> 基于 AI Agent 的全栈量化情报与研报生成系统。  
> **Current Version**: v1.2.0-performance

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.12-blue)
![React](https://img.shields.io/badge/react-19-blue)
![Status](https://img.shields.io/badge/status-stable-green)

## 🚀 v1.2.0 性能更新 (New!)

本次更新专注于系统核心性能的深度优化：

- **极速计算**: 重构 RSRS 核心算法，使用向量化运算替代循环，速度提升 **50 倍**。
- **流畅体验**: 前端图表渲染优化，彻底消除卡顿，FPS 稳定在 **60+**。
- **并发扫描**: 市场扫描器现在支持 **10 路并行** I/O，大幅缩短数据同步时间。

## ✨ Core Features

- **Macro Analysis**: 全球宏观资产联动分析 (Gold, Bitcoin, NASDAQ, A-Shares)
- **AI Reporting**: 基于 LLM (Claude 3.5/DeepSeek) 的自动化研报生成
- **Smart Indicators**: 内置 RSRS、波动率偏度等高阶量化指标
- **Constitution-Driven**: 遵循 CDD (Constitution-Driven Development) 开发范式，高稳定性

## 🛠 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端 UI** | React 19 + TypeScript | Tauri 桌面应用 |
| **App Shell** | Tauri v2 (Rust) | 跨平台桌面框架 |
| **后端 API** | Python FastAPI | RESTful API 服务 |
| **数据分析** | pandas, numpy, scipy | 量化算法 |
| **数据源** | yfinance, 通达信 DB | 市场数据获取 |
| **AI 引擎** | DeepSeek API | 智能分析与报告 |

## 📁 项目结构

```
MY-DOGE-MACRO/
├── client/                 # 前端 (React 19 + Tauri v2)
│   ├── docs/              # 设计文档
│   ├── src/               # React 组件和页面
│   └── src-tauri/         # Tauri 桌面壳
│
├── server/                 # 后端 (FastAPI)
│   ├── core/              # API 路由
│   ├── macro/             # 宏观分析 API
│   ├── micro/             # 微观分析 API
│   └── utils/             # 工具函数
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

---

Built with ❤️ by Negentropy Lab
