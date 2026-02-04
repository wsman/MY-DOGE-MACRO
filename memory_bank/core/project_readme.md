# My Doge Macro - Project Seed Document (CDD T0)

> **创建**: 2026-02-03  
> **最后更新**: 2026-02-05  
> **版本**: v1.6.0 (模块化架构)  
> **类型**: AI驱动的量化分析系统  
> **主要文档**: [README.md](../../README.md)

## 🔗 主要文档

**完整项目文档请查看根目录的README.md**：
- [📖 完整项目README](../../README.md) - 包含完整项目概述、架构、快速启动、文档体系等

## 🎯 核心目的（简要）

- 全球宏观资产联动分析 (Gold, Bitcoin, NASDAQ, A-Shares)
- 基于 LLM 的自动化研报生成
- 内置高级量化指标 (RSRS, 波动率偏度)

## 🛠 技术栈（简要）

- **前端**: React 19 + TypeScript + Tauri v2 (Rust)
- **后端**: Python FastAPI
- **数据**: pandas, numpy, scipy, yfinance, 通达信 DB
- **AI**: DeepSeek API
- **架构**: 模块化 (apps/libs/infrastructure)

## 📊 关键指标

| 指标 | 值 | 状态 |
|------|-----|------|
| **版本** | v1.6.0 (模块化) | 🚀 新 |
| **系统熵** | 0.50 | 🟡 健康 |
| **最新审计** | 8.75/10 | ✅ 通过 |
| **设计系统迁移** | ✅ 完成 | 已迁移到 `libs/design-system/` |
| **路径映射配置** | ✅ 完成 | `@design-system/*`, `@libs/*` |

## 🚀 架构现代化进展

| 组件 | 迁移状态 | 详情 |
|------|----------|------|
| **设计系统** | ✅ 完成 | 已迁移到 `libs/design-system/` |
| **前端应用** | ⏳ 进行中 | 目标: `apps/desktop/` |
| **后端 API** | ⏳ 计划中 | 目标: `apps/api/` |
| **量化引擎** | ⏳ 计划中 | 目标: `libs/quant-engine/` |
| **文档** | ✅ 部分完成 | 文档体系已建立 |

## 📁 在CDD体系中的角色

- **T0文档**: 项目种子文档
- **作用**: 项目核心意识和基础定义
- **关联文档**: 查看[完整README](../../README.md)获取详细信息
- **CDD版本**: v1.6.1

## 🔗 相关链接

- **GitHub仓库**: https://github.com/wsman/MY-DOGE-MACRO
- **完整README**: [../../README.md](../../README.md)
- **文档中心**: [../../docs/README.md](../../docs/README.md)
- **API文档**: [../../docs/api/backend-api.md](../../docs/api/backend-api.md)
- **架构文档**: [../../docs/architecture/v1.6.0-modular-architecture.md](../../docs/architecture/v1.6.0-modular-architecture.md)
- **设计系统**: [../../apps/desktop/DESIGN_SYSTEM.md](../../apps/desktop/DESIGN_SYSTEM.md)
- **许可证**: Apache 2.0

---

*此文档为CDD体系中的T0种子文档。完整项目信息、详细架构说明、开发指南和部署文档请参阅根目录的README.md。*

> **AI Agent 友好提示**: 项目采用模块化架构设计，为AI Agent提供清晰的模块边界和标准化接口，便于理解和开发。