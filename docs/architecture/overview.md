# Architecture Overview

> **Version**: v1.8.0 (Core Features Complete)
> **Last Updated**: 2026-02-05

## 目录结构

```
MY-DOGE-MACRO/
├── apps/                    # 应用层
│   ├── desktop/            # Tauri + React 19 桌面应用 ✅
│   │   └── src/components/
│   │       ├── atoms/      # 原子组件 (Button, Badge, Card...)
│   │       ├── molecules/  # 分子组件 (DataCard, SearchBar...)
│   │       ├── organisms/  # 有机体 (MarketOverview, AnalysisPanel...)
│   │       └── charts/     # 图表组件 (PriceChart, SubChart, ChartPanel)
│   └── api/                # FastAPI 后端服务 ✅
│       ├── core/           # 核心模块 (WebSocket, 配置)
│       ├── routes/         # API 路由
│       └── services/       # 业务逻辑
│
├── libs/                    # 共享库
│   ├── quant-engine/       # 量化分析算法 ✅
│   │   ├── analysis/       # 技术指标 (MA/MACD/RSI/KDJ/Bollinger)
│   │   ├── data/           # 数据读取 (yfinance, 通达信)
│   │   └── ai/             # AI 分析模块
│   ├── design-system/      # UI 组件和设计令牌 ✅
│   └── common/             # 通用工具
│
├── infrastructure/          # 基础设施
│   └── cdd/                # CDD 工具链
│       └── tools/          # 审计、熵值计算、版本验证
│
├── config/                  # 配置管理
├── data/                    # 数据存储
├── docs/                    # 项目文档
│   ├── architecture/       # 架构文档
│   ├── api/                # API 文档
│   ├── deployment/         # 部署指南
│   └── guides/             # 使用指南
│
└── memory_bank/             # CDD 文档体系
    ├── core/               # T0 核心层
    ├── axioms/             # T1 公理层
    ├── standards/          # T2 标准层
    └── protocols/          # 工作流协议
```

## 系统拓扑

```
┌─────────────────────────────────────────────────────────────┐
│                        Data Sources                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│   DeepSeek API  │  Yahoo Finance  │      通达信 DB          │
└────────┬────────┴────────┬────────┴────────────┬────────────┘
         │                 │                      │
         ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                libs/quant-engine/                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │    ai/   │  │ analysis/│  │   data/  │                   │
│  │ DeepSeek │  │ RSRS/VOL │  │ yfinance │                   │
│  │  Report  │  │ MACD/RSI │  │   TDX    │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     apps/api/                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │   core/  │  │  routes/ │  │ services/│                   │
│  │WebSocket │  │   REST   │  │  Logic   │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/WS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   apps/desktop/                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 React 19 + TypeScript                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │ components │  │  services  │  │   stores   │     │   │
│  │  │ atoms/mol/ │  │   API call │  │  Zustand   │     │   │
│  │  │ organisms  │  │            │  │            │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Tauri v2 (Rust)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 技术栈

| 层级 | 技术 | 用途 | 状态 |
|------|------|------|------|
| **前端 UI** | React 19 + TypeScript | 用户界面 | ✅ |
| **桌面框架** | Tauri v2 (Rust) | 跨平台桌面应用 | ✅ |
| **后端 API** | Python FastAPI | RESTful + WebSocket | ✅ |
| **量化引擎** | pandas, numpy, scipy | 量化算法 | ✅ |
| **AI 引擎** | DeepSeek API | 智能分析 | ✅ |
| **数据源** | yfinance, 通达信 DB | 市场数据 | ✅ |

## 前端组件架构

### Atomic Design 层次

```
atoms/          # 原子 (不可再分)
├── Button      # 按钮
├── Badge       # 徽章
├── Card        # 卡片
├── Icon        # 图标
├── Input       # 输入框
├── Avatar      # 头像
└── StatusDot   # 状态点

molecules/      # 分子 (原子组合)
├── DataCard    # 数据卡片
├── SearchBar   # 搜索栏
├── FormGroup   # 表单组
└── StatusIndicator

organisms/      # 有机体 (分子组合)
├── MarketOverview   # 市场概览
├── AnalysisPanel    # 分析面板
└── AIReportPanel    # AI 研报

charts/         # 图表组件
├── PriceChart       # K 线图
├── TechnicalIndicators  # 技术指标
├── SubChart         # 子图 (MACD/RSI/KDJ)
└── ChartPanel       # 完整图表面板
```

## CDD 集成

项目遵循 **Constitution-Driven Development (CDD) v1.6.1** 规范：

- **熵值监控**: $H_{sys}$ 控制在 0.5 以下 (当前 0.30 🟢)
- **三级验证**: 结构/签名/行为验证
- **工作流**: 5 状态工作流 (Intake → Plan → Execute → Verify → Close)

## 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| v1.8.0 | 2026-02-05 | 核心功能完成 (图表/Dashboard/WebSocket/指标) |
| v1.7.0 | 2026-02-05 | 完整模块化迁移 |
| v1.6.0 | 2026-02-04 | 模块化架构启动 |
| v1.5.0 | 2026-02-03 | 前端架构现代化 |

---

*文档版本: v1.8.0 | 更新日期: 2026-02-05*
