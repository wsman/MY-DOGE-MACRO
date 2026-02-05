# MY-DOGE-MACRO 文档中心

> **Version**: v1.8.0
> **Last Updated**: 2026-02-05

## 📚 文档索引

### 入门指南

| 文档 | 描述 |
|------|------|
| [快速入门](./guides/quickstart.md) | 安装、配置和启动项目 |
| [架构概览](./architecture/overview.md) | 系统架构和技术栈 |

### API 文档

| 文档 | 描述 |
|------|------|
| [API 中心](./api/README.md) | API 文档入口 |
| [API 参考](./api/api-reference.md) | REST 和 WebSocket 完整参考 |
| [技术指标](./api/indicators.md) | 技术指标公式和用法 |

### 部署运维

| 文档 | 描述 |
|------|------|
| [部署指南](./deployment/README.md) | 开发、生产环境部署 |

## 🏗️ 项目结构

```
MY-DOGE-MACRO/
├── apps/
│   ├── desktop/     # 桌面应用 (React 19 + Tauri v2)
│   └── api/         # 后端 API (FastAPI + WebSocket)
├── libs/
│   ├── quant-engine/   # 量化引擎 (技术指标 + 数据源)
│   └── design-system/  # 设计系统 (原子设计 + BEM)
├── infrastructure/
│   └── cdd/         # CDD 工具链
├── docs/            # 项目文档 (本目录)
└── memory_bank/     # CDD 文档体系
```

## 📊 技术栈

| 层级 | 技术 | 状态 |
|------|------|------|
| 前端 UI | React 19 + TypeScript | ✅ |
| 桌面框架 | Tauri v2 (Rust) | ✅ |
| 后端 API | Python FastAPI | ✅ |
| 量化引擎 | pandas, numpy, scipy | ✅ |
| AI 引擎 | DeepSeek API | ✅ |
| 数据源 | yfinance, 通达信 DB | ✅ |

## 🚀 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| **v1.8.0** | 2026-02-05 | 核心功能完成 (图表/Dashboard/WebSocket/指标) |
| v1.7.0 | 2026-02-05 | 完整模块化迁移 |
| v1.6.0 | 2026-02-04 | 模块化架构启动 |
| v1.5.0 | 2026-02-03 | 前端架构现代化 (Atomic Design + BEM) |

## 🔗 相关链接

- **GitHub**: https://github.com/wsman/MY-DOGE-MACRO
- **CDD 规范**: Constitution-Driven Development v1.6.1

---

*文档版本: v1.8.0 | 更新日期: 2026-02-05*
