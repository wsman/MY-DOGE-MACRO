# MY-DOGE-MACRO T3 Documentation

> **Version**: v2.0.0-alpha  
> **Last Updated**: 2026-02-13  
> **Location**: `memory_bank/t3_documentation/`  
> **Level**: T3 (User Documentation)

## 📚 文档体系概述

MY-DOGE-MACRO 采用 **CDD (Constitution-Driven Development)** 文档体系，所有文档统一存放在 `memory_bank/` 目录下。

### CDD 文档层级

| 层级 | 目录 | 用途 | 主要受众 |
|------|------|------|----------|
| **T0** | `../core/` | 核心宪法文档 (每次会话加载) | AI Agents, 系统架构师 |
| **T1** | `../t1_axioms/` | 公理层 (技术上下文、行为模式) | AI Agents, 高级开发者 |
| **T2** | `../t2_protocols/`, `../t2_standards/` | 工作流协议、实现标准 | 开发者, 技术负责人 |
| **T3** | `./` | 用户和开发者文档 (本层级) | 用户, 开发者, DevOps |

## 📖 文档索引

### 入门指南

| 文档 | 描述 | 状态 |
|------|------|------|
| [快速入门](./quickstart.md) | 安装、配置和启动项目 | ✅ v1.8.0 |
| [开发入门](./getting-started.md) | 开发环境配置 | ✅ v1.8.0 |

### 架构文档

| 文档 | 描述 | 状态 |
|------|------|------|
| [架构概览](./overview.md) | 系统架构和技术栈 (v1.8.0) | ✅ v1.8.0 |
| [模块化架构](./modular-architecture.md) | 模块化设计详情 | ✅ v1.6.0 |

### API 文档

| 文档 | 描述 | 状态 |
|------|------|------|
| [API 参考](./api-reference.md) | REST 和 WebSocket API 完整参考 | ✅ v1.8.0 |
| [后端 API](./backend-api.md) | 后端接口详情 | ✅ v1.6.0 |
| [技术指标](./indicators.md) | 技术指标公式和使用说明 | ✅ v1.8.0 |

### 部署运维

| 文档 | 描述 | 状态 |
|------|------|------|
| [部署指南](./deployment.md) | 开发、生产环境部署指南 | ✅ v1.8.0 |
| [Docker部署](./docker-deployment.md) | Docker容器化部署指南 (v2.0.0) | ✅ v2.0.0-alpha |

### 模板

| 文档 | 描述 | 状态 |
|------|------|------|
| [文档模板](./document-template.md) | 创建新 T3 文档的模板 | ✅ v1.6.0 |

## 🏗️ 项目结构

```
MY-DOGE-MACRO/
├── apps/                    # 应用层
│   ├── desktop/            # 桌面应用 (React 19 + Tauri v2)
│   └── api/                # 后端 API (FastAPI + WebSocket)
├── libs/                    # 共享库
│   ├── quant-engine/       # 量化引擎 (技术指标 + 数据源)
│   └── design-system/      # 设计系统 (原子设计 + BEM)
├── infrastructure/          # 基础设施
│   └── cdd/                # CDD 工具链
└── memory_bank/            # 📚 统一文档体系
    ├── core/               # T0 核心宪法
    ├── t1_axioms/             # T1 公理层
    ├── t2_standards/       # T2 标准层
    ├── t2_protocols/       # 工作流协议
    └── t3_documentation/   # T3 用户/开发者文档 (本目录)
```

## 📊 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| **v2.0.0-alpha** | 2026-02-13 | Docker容器化 + Nginx反向代理 |
| **v1.9.0** | 2026-02-07 | 用户体验升级 + 动画系统 |
| **v1.8.0** | 2026-02-05 | 核心功能完成 + 文档合并至 memory_bank |
| v1.7.0 | 2026-02-05 | 完整模块化迁移 |
| v1.6.0 | 2026-02-04 | 模块化架构启动 |
| v1.5.0 | 2026-02-03 | 前端架构现代化 |

## 🔗 相关链接

- **GitHub**: https://github.com/wsman/MY-DOGE-MACRO/tree/main/memory_bank/t3_documentation
- **CDD 规范**: Constitution-Driven Development v1.6.1
- **项目 README**: `../../README.md`
- **变更日志**: `../../CHANGELOG.md`
- **设计系统**: `../../apps/desktop/DESIGN_SYSTEM.md`

## 📋 T3 文档标准

### 格式要求
- **Markdown**: 标准 Markdown 语法，清晰的层级结构
- **结构**: 逻辑组织，包含目录表
- **示例**: 实用、可运行的代码示例
- **链接**: 有效的相对链接，包含描述性锚文本
- **图片**: 必要时添加，包含替代文本和标题

### 内容标准
- **用户导向**: 实用指导优先于理论概念
- **可操作**: 明确的步骤和预期结果
- **及时**: 版本特定的信息，定期更新
- **完整**: 主题的全面覆盖
- **易访问**: 清晰语言，避免不必要术语

### 元数据要求
每个 T3 文档应包含：
- 版本和最后更新日期
- 文档类别和目标受众
- 源位置（指向 `memory_bank/t3_documentation/` 目录）
- 状态指示器（当前、已弃用、进行中）

## 🔧 维护流程

### 更新流程
1. **源更新**: 更新 `memory_bank/t3_documentation/` 目录中的主文档
2. **链接验证**: 验证所有内部和外部链接
3. **版本更新**: 更新版本和最后更新信息
4. **一致性检查**: 确保 T3 文档准确反映源内容

### 版本控制策略
- **真相源**: `memory_bank/t3_documentation/` 目录包含权威内容
- **向后兼容**: 注明破坏性变更和迁移路径
- **弃用策略**: 明确标记已弃用文档并提供替代方案

### 质量控制
- **技术准确性**: 确保所有技术信息正确
- **链接有效性**: 定期检查所有链接
- **用户测试**: 从用户角度测试文档可用性
- **AI 代理测试**: 确保文档对 AI 系统可访问

## 🤝 贡献指南

### 添加新 T3 文档
1. **创建文档**: 在 `memory_bank/t3_documentation/` 目录中添加新文档
2. **更新索引**: 在本索引表中添加条目
3. **更新链接**: 确保所有相关文档链接正确

### 文档标准执行
- 遵循既定模板和格式
- 包含所有必需的元数据
- 使用一致的术语和命名约定
- 测试所有代码示例和命令

---

**T3 文档状态**: ✅ 活跃 (v2.0.0-alpha)  
**维护者**: Negentropy Lab AI Agent System  
**CDD 框架**: v1.6.1  
**最后系统审计**: 8.75/10 (通过)  
**文档数量**: 11 个核心文档

*文档版本: v2.0.0-alpha | 更新日期: 2026-02-13*
