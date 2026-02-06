# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.8.1] - 2026-02-07

### Added
- **宪法融合与精简 (v1.8.1)**:
  - 知识图谱融合：更新`memory_bank/t0_core/knowledge_graph.md`为v1.8.1融合版本
  - 创建核心索引：创建`.clinerules`作为宪法入口索引
  - 架构同构性验证：执行Tier 1架构同构性验证，合规率99%

### Changed
- **单一真理源架构**:
  - 所有宪法文件集中存储到`memory_bank/t0_core/`目录
  - 删除`.clinerules/`目录中的4个重复宪法文件
  - `.clinerules`文件仅作为项目根目录下的宪法入口索引
  - 系统熵值降低至0.28，系统有序度显著提升

### Fixed
- **文档体系一致性**:
  - 统一所有宪法文件的版本引用为v1.8.1
  - 更新所有内部链接指向单一真理源
  - 验证T0-T3分层架构的完整性

## [v1.8.0] - 2026-02-05

### Added
- **图表可视化组件**:
  - 完整的K线图组件，支持多种时间周期
  - 技术指标叠加：MA/EMA/MACD/RSI/KDJ/布林带
  - 子图系统：MACD、RSI、KDJ、Volume独立子图
  - 响应式图表面板，支持桌面/移动端适配

- **Dashboard页面组装**:
  - MarketOverview Organism：多资产市场概览
  - AnalysisPanel Organism：资产详情与技术指标分析
  - AIReportPanel Organism：DeepSeek驱动的研报展示
  - 完整的Dashboard Template，集成所有组件

- **后端WebSocket实时推送**:
  - FastAPI WebSocket端点 (`/ws/{client_id}`)
  - 前端WebSocket客户端连接管理
  - 实时价格更新推送机制
  - 连接状态监控与断线重连

- **完整技术指标库**:
  - MACD指标计算与可视化
  - 布林带指标计算
  - KDJ指标计算
  - 通达信数据库集成，支持A股历史数据读取

### Changed
- **项目清理与标准化**:
  - 删除`engine/`遗留目录
  - 删除`server/`遗留目录，迁移到`apps/api/`
  - 创建标准入口`apps/api/main.py`
  - 更新项目目录结构文档

- **模块化架构完成**:
  - 前端应用：`apps/desktop/` (Tauri + React 19)
  - 后端API：`apps/api/` (FastAPI)
  - 量化引擎：`libs/quant-engine/` (Python算法)
  - 设计系统：`libs/design-system/` (React组件库)
  - 基础设施：`infrastructure/` (CDD工具、CI/CD)

### Fixed
- **API服务稳定性**:
  - 速率限制中间件优化
  - 安全响应头配置
  - 错误处理与日志记录
  - 数据模型序列化一致性

## [v1.7.0] - 2026-02-05

### Added
- **完整模块化架构迁移 (v1.7.0)**:
  - 前端应用完全迁移到`apps/desktop/`目录
  - 后端API完全迁移到`apps/api/`目录
  - 量化引擎完全迁移到`libs/quant-engine/`目录
  - 基础设施工具迁移到`infrastructure/`目录
  - 统一的模块依赖管理配置

### Changed
- **架构标准化**:
  - 建立清晰的应用层(`apps/`)、库层(`libs/`)、基础设施层(`infrastructure/`)分离
  - 更新所有TypeScript和Python的导入路径
  - 重构CI/CD流水线以支持新架构
  - 更新所有开发文档和快速启动指南

### Fixed
- **路径映射与导入**:
  - TypeScript路径别名配置 (`@design-system/*`, `@libs/*`)
  - Python模块导入路径修正
  - 测试框架配置更新
  - 构建脚本适配新架构

## [v1.6.0] - 2026-02-05

### Added
- **Modular Architecture Migration (v1.6.0)**:
  - New monorepo structure with `apps/`, `libs/`, `infrastructure/` directories
  - Design System migration to `libs/design-system/` (completed)
  - Path mapping configuration (`@design-system/*`, `@libs/*` aliases)
  - Modular architecture documentation in `memory_bank/t3_documentation/architecture/`
  - Enhanced README.md with consolidated documentation

### Changed
- **Documentation Consolidation**:
  - Merged `memory_bank/t3_documentation/README.md` content into root `README.md`
  - Created streamlined documentation center in `memory_bank/t3_documentation/README.md`
  - Updated all references to maintain consistency
  - Enhanced version history section with detailed information

### Fixed
- **Documentation Links**:
  - Verified all internal links between README and CHANGELOG
  - Updated references in `memory_bank/core/project_readme.md`

## [v1.5.0] - 2026-02-04

### Added
- **Frontend Architecture (T-C5)**:
  - Atomic Design directory structure (atoms, molecules, organisms, templates)
  - Design System tokens (colors, typography, spacing)
  - 7 atomic components: Button, Icon, Badge, Card, Input, Avatar, StatusDot
  - 4 molecular components: StatusIndicator, DataCard, SearchBar, FormGroup
  - BEM naming convention with CSS Variables
  - Storybook configuration with component stories
  - DESIGN_SYSTEM.md documentation

### Changed
- **Component Migration**:
  - MainLayout → Uses new atomic components
  - ServerSettings → Migrated to FormGroup, Button, Card
  - ServiceStatus → Migrated to StatusIndicator, Badge
  - ConnectionStatus → Migrated to StatusDot
  - Dashboard → Modernized with Tailwind tokens
  - CommandPalette → Refactored with new component library

### Fixed
- **Infrastructure**:
  - CDD hooks portability (relative paths)
  - CI/CD integration with CDD checks
  - Pre-commit configuration

### Removed
- Default Storybook template files (Button.stories, Header.stories, etc.)
- Hardcoded absolute paths in pre-commit config

## [v1.4.0] - 2026-02-03

### Added
- **Infrastructure & Quality**:
  - CDD (Constitution-Driven Development) toolchain
  - Scripts directory (24 files, 3.3KB)
  - Unit tests for server/core modules
  - GitHub Actions CI/CD pipeline

### Changed
- **CI/CD**:
  - Enabled CDD checks in GitHub Actions
  - Removed ci.skip directive
  - Added environment setup for CDD tools

### Fixed
- **Portability**:
  - Pre-commit hooks now use relative paths
  - CDD version check script path
  - Entropy measurement script path

## [v1.3.0] - 2026-01-XX

### Added
- **Macro Analytics Panel**:
  - Risk-on/off signal indicator
  - RSRS trend strength visualization
  - Volatility skew monitoring
  - Gold/BTC ratio analysis
  - Core asset performance table
  - Macro analysis report generation

### Changed
- **API Routes**:
  - Added `/api/v1/macro/market/data`
  - Added `/api/v1/macro/assets`
  - Added `/api/v1/macro/analysis/generate`
  - Added `/api/v1/industry/reports/latest`

## [v1.2.0] - 2026-01-XX

### Added
- **Performance Optimization**:
  - React.memo on PixiGraph components
  - useCallback for expensive computations
  - TailwindCSS v4 configuration

### Changed
- **Dashboard Modernization**:
  - Zustand selectors for state management
  - Tailwind design tokens integration

## [v1.1.0] - 2026-01-XX

### Added
- **T-C3 Integration**:
  - Port configuration fix
  - Route handling improvements
  - Data format standardization

## [v1.0.0] - 2026-01-XX

### Added
- Initial release
- MY-DOGE QUANT SYSTEM core functionality
- Frontend with React 19 + Tauri v2
- Backend with FastAPI
- Market scanner and analysis tools
- CDD (Constitution-Driven Development) framework

---

## Project Statistics (v1.8.1)

| Metric | Value | Status |
|--------|-------|--------|
| Current Version | v1.8.1 | ✅ 稳定 |
| System Entropy ($H_{sys}$) | 0.28 | 🟢 Excellent |
| 宪法合规率 | 99% | 🟢 优秀 |
| 模块化架构完成度 | 100% | ✅ 完成 |
| 前端组件数量 | 12+ (atoms/molecules/organisms) | ✅ 良好 |
| 后端API端点 | 30+ | ✅ 完善 |
| CDD框架版本 | v1.6.1 | ✅ 最新 |

## Version History

```
v1.8.1 ─── 宪法融合与精简 (单一真理源架构)
v1.8.0 ─── 核心功能完成 (图表可视化 + WebSocket + 技术指标库)
v1.7.0 ─── 完整模块化架构迁移
v1.6.0 ─── 模块化架构设计 (应用/库/基础设施分层)
v1.5.0 ─── 前端架构现代化 (原子设计 + BEM)
v1.4.0 ─── 基础设施与质量 (CDD工具链 + CI/CD)
v1.3.0 ─── 宏观分析面板 (风险信号 + RSRS + 波动率)
v1.2.0 ─── 性能优化 (React.memo + useCallback)
v1.1.0 ─── T-C3集成 (端口配置 + 路由改进)
v1.0.0 ─── 初始版本发布
```

---

*Generated by CDD v1.6.1*
