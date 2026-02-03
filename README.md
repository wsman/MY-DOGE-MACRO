# My Doge Macro 🐶📈

> 基于 AI Agent 的全栈量化情报与研报生成系统。  
> **Current Version**: v1.4.0

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.12-blue)
![React](https://img.shields.io/badge/react-19-blue)
![Status](https://img.shields.io/badge/status-stable-green)

## 🚀 v1.4.0 基础设施更新 ✅

本次更新专注于开发流程标准化和代码质量提升：

- **可移植工具链**: CDD 工具链现在使用相对路径，支持任何开发环境
- **CI/CD 集成**: GitHub Actions 现在运行完整的 CDD 检查
- **测试覆盖率**: 新增 15 个单元测试，提升后端代码质量
- **零依赖冲突**: 移除所有硬编码路径

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

## 🎉 v1.2.0 性能优化周期总结

| 指标 | 详情 |
|------|------|
| **版本** | v1.2.0-performance |
| **审计评分** | 8.5/10 ✅ |
| **审计ID** | `cc002951-b4e4-4715-910b-ac652eb8104f` |
| **CDD 周期** | T-C2 Performance Optimization |
| **状态** | ✅ Cycle Complete |

### 性能提升

| 优化项 | 优化前 | 优化后 | 提升 |
|--------|--------|--------|------|
| RSRS 计算 | 50ms | <1ms | **50x** |
| 数据缓存命中 | 200ms | <1ms | **200x** |
| 前端渲染 | <30 FPS | ≥60 FPS | **2x+** |
| 市场扫描并发 | 串行 | 10路并行 | **10x** |

### 开发任务完成

| 任务 | 描述 | 状态 |
|------|------|------|
| T-C2.1 | RSRS 算法向量化 | ✅ |
| T-C2.2 | 后端缓存层 | ✅ |
| T-C2.3 | 前端图表 Memoization | ✅ |
| T-C2.4 | 市场扫描并发 | ✅ |

### v1.3.0 路线图

基于外部审计建议，下一版本将聚焦：

1. **🔐 安全性强化**: 环境变量管理 API Key，添加速率限制
2. **🏗️ 基础设施**: CI/CD Pipeline，Pre-commit hooks
3. **🧪 测试增强**: 目标覆盖率 80%

## 🔗 相关链接

- **GitHub**: https://github.com/wsman/MY-DOGE-MACRO
- **CDD Framework**: [OpenClaw CDD Skill](../openclaw/skills/cdd/)
- **审计报告**: `data/audits/EXTERNAL_AUDIT_2026-02-02.md`

## 📝 许可证

Apache License 2.0

---

Built with ❤️ by Negentropy Lab
