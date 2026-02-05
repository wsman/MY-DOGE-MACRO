# DS-052: Atomic Tasks Collection

> **Version**: v1.8.0  
> **Last Updated**: 2026-02-05  
> **Type**: Task Collection  
> **Status**: Active

## 📋 概述

本文档包含了 MY-DOGE-MACRO 项目的所有原子任务，按任务类型和优先级分类。

---

## ⚡ 1. 性能优化原子任务

**Feature ID**: T-C2  
**Feature Name**: Performance Optimization  
**Parent Plan**: DS-051_performance_opt  
**Version**: v1.0.0  
**Date**: 2026-02-01  

### Task List

#### Task T-C2.1: RSRS Algorithm Vectorization

| 属性 | 值 |
|------|-----|
| **Description** | 优化 `analysis_rsrs.py` 中的 `calculate_rsRS` 函数，移除所有行级遍历，完全使用 Pandas 滚动窗口 (Rolling Window) 和 OLS 向量化计算 |
| **Target File** | `engine/analysis/rsrs.py` |
| **Dependencies** | None |
| **Est. Time** | 2h |
| **Verification** | 运行 `pytest tests/test_performance.py` 对比优化前后耗时 |

#### Task T-C2.2: Backend Caching Layer

| 属性 | 值 |
|------|-----|
| **Description** | 在 `data_acquisition.py` 中为 `fetch_historical` 添加内存缓存 (TTL 5分钟)，避免频繁请求上游 API |
| **Target File** | `engine/data/acquisition.py` |
| **Dependencies** | T-C2.1 |
| **Est. Time** | 1h |
| **Verification** | 连续调用两次接口，第二次应瞬间返回 |

#### Task T-C2.3: Frontend Chart Memoization

| 属性 | 值 |
|------|-----|
| **Description** | 使用 `React.memo` 包裹 `PriceChart` 和 `ServiceStatus` 组件，并配置自定义对比函数，防止父组件更新时的无效重绘 |
| **Target File** | `client/src/components/charts/PriceChart.tsx`, `client/src/components/ServiceStatus.tsx` |
| **Dependencies** | T-C2.2 |
| **Est. Time** | 2h |
| **Verification** | React Profiler 显示 "Did not render" 当无关状态变更时 |

#### Task T-C2.4: Market Scanner Concurrency

| 属性 | 值 |
|------|-----|
| **Description** | 重构 `market_scanner.py`，使用 `asyncio` 并行处理股票列表的指标计算，而非串行处理 |
| **Target File** | `server/core/market_scanner.py` |
| **Dependencies** | T-C2.1 |
| **Est. Time** | 2h |
| **Verification** | 全市场扫描耗时减少 40% 以上 |

### Execution Order

```
T-C2.1 (Core Algo) 
    ↓
T-C2.4 (Scanner) 
    ↓
T-C2.2 (Caching) 
    ↓
T-C2.3 (UI)
```

### Progress Tracking

| Task ID | Status | Progress | Owner |
|---------|--------|----------|-------|
| T-C2.1 | ⏳ Pending | 0% | - |
| T-C2.2 | ⏳ Pending | 0% | - |
| T-C2.3 | ⏳ Pending | 0% | - |
| T-C2.4 | ⏳ Pending | 0% | - |

### Verification Checklist

- [ ] `pytest tests/test_performance.py` passes
- [ ] RSRS calculation < 0.1s
- [ ] Market scanner < 5s for 100 stocks
- [ ] Dashboard FPS >= 60
- [ ] Memory usage < 200MB

---

## 🎨 2. 前端架构现代化原子任务

**Feature ID**: T-C5  
**Related Spec**: DS-057, DS-051  
**Status**: Pending  
**Date**: 2026-02-03

### Task Summary

| Category | Count | Total Effort |
|----------|-------|--------------|
| Phase 1: Foundation | 3 tasks | ~9 hours |
| Phase 2: Components | 12 tasks | ~40 hours |
| Phase 3: Migration | 7 tasks | ~60 hours |
| **Total** | **22 tasks** | **~109 hours** |

### Phase 1: Foundation

#### T-C5.1: Directory Structure Setup
- **Description**: Create Atomic Design directory structure
- **Commands**:
  ```bash
  cd client/src/components
  mkdir -p atoms molecules organisms templates pages
  mkdir -p design-system/{tokens,foundations,components}
  ```
- **Deliverables**:
  - [ ] `client/src/components/atoms/`
  - [ ] `client/src/components/molecules/`
  - [ ] `client/src/components/organisms/`
  - [ ] `client/src/components/templates/`
  - [ ] `client/src/components/pages/`
  - [ ] `client/src/design-system/tokens/`
  - [ ] `client/src/design-system/foundations/`
- **Status**: ⏳ Pending
- **Effort**: 2 hours
- **Verification**: Directory listing matches spec

#### T-C5.2: Design Tokens - Colors
- **Description**: Define color tokens in TypeScript
- **File**: `client/src/design-system/tokens/colors.ts`
- **Content**:
  - Semantic colors (primary, secondary, accent...)
  - Functional colors (success, warning, danger...)
  - Neutrals (gray-100 through gray-900)
  - Exports as `readonly const` object
- **Status**: ⏳ Pending
- **Effort**: 2 hours
- **Verification**: `tsc --noEmit` passes

#### T-C5.3: Design Tokens - Typography & Spacing
- **Description**: Define typography and spacing tokens
- **Files**:
  - `client/src/design-system/tokens/typography.ts`
  - `client/src/design-system/tokens/spacing.ts`
- **Content** (Typography):
  - Font families (sans, mono)
  - Font sizes (xs, sm, base, lg, xl, 2xl...)
  - Font weights (normal, medium, semibold, bold)
- **Content** (Spacing):
  - Spacing scale (0, 0.25rem, 0.5rem, 0.75rem, 1rem...)
  - Layout spacing (4, 8, 12, 16, 24, 32px)
- **Status**: ⏳ Pending
- **Effort**: 2 hours
- **Verification**: Token exports valid

#### T-C5.4: Storybook Configuration
- **Description**: Initialize and configure Storybook
- **Commands**:
  ```bash
  cd client
  npx storybook@latest init --type react --yes
  ```
- **Configuration**:
  - Add TailwindCSS support
  - Configure theme for dark mode
  - Add component auto-generation
- **Status**: ⏳ Pending
- **Effort**: 3 hours
- **Verification**: `npm run storybook` runs successfully

### Phase 2: Core Components

#### Atoms

##### T-C5.5: Button Component
- **Description**: Create Button atom with variants
- **Files**:
  - `client/src/components/atoms/Button/Button.tsx`
  - `client/src/components/atoms/Button/Button.module.css`
  - `client/src/components/atoms/Button/Button.stories.tsx`
  - `client/src/components/atoms/Button/index.ts`
- **Props**:
  - `variant`: 'primary' | 'secondary' | 'ghost'
  - `size`: 'sm' | 'md' | 'lg'
  - `disabled`: boolean
  - `onClick`: () => void
- **Variants**: Primary (accent bg), Secondary (gray bg), Ghost (transparent)
- **Status**: ⏳ Pending
- **Effort**: 3 hours
- **Verification**: Storybook + unit tests

##### T-C5.6: Icon Component
- **Description**: Create Icon atom with icon system
- **Files**:
  - `client/src/components/atoms/Icon/Icon.tsx`
  - `client/src/components/atoms/Icon/icons/*.svg`
  - `client/src/components/atoms/Icon/Icon.stories.tsx`
  - `client/src/components/atoms/Icon/index.ts`
- **Icons Needed**: Settings, Status, Chart, Market, Dashboard, etc.
- **Status**: ⏳ Pending
- **Effort**: 4 hours
- **Verification**: All icons render correctly

##### T-C5.7: Badge Component
- **Description**: Create Badge atom for status labels
- **Files**:
  - `client/src/components/atoms/Badge/Badge.tsx`
  - `client/src/components/atoms/Badge/Badge.stories.tsx`
  - `client/src/components/atoms/Badge/index.ts`
- **Props**:
  - `variant`: 'success' | 'warning' | 'danger' | 'info'
  - `children`: React.ReactNode
- **Status**: ⏳ Pending
- **Effort**: 2 hours

##### T-C5.8: Card Component
- **Description**: Create Card atom for content containers
- **Files**:
  - `client/src/components/atoms/Card/Card.tsx`
  - `client/src/components/atoms/Card/Card.stories.tsx`
  - `client/src/components/atoms/Card/index.ts`
- **Props**:
  - `children`: React.ReactNode
  - `padding`: 'none' | 'sm' | 'md' | 'lg'
  - `hoverable`: boolean
- **Status**: ⏳ Pending
- **Effort**: 2 hours

##### T-C5.9: Input Component
- **Description**: Create Input atom for forms
- **Files**:
  - `client/src/components/atoms/Input/Input.tsx`
  - `client/src/components/atoms/Input/Input.stories.tsx`
  - `client/src/components/atoms/Input/index.ts`
- **Props**:
  - `value`: string
  - `onChange`: (value: string) => void
  - `placeholder`: string
  - `error`: string | undefined
  - `disabled`: boolean
- **Status**: ⏳ Pending
- **Effort**: 3 hours

##### T-C5.10: StatusDot Component
- **Description**: Create StatusDot for connection/status indicators
- **Files**:
  - `client/src/components/atoms/StatusDot/StatusDot.tsx`
  - `client/src/components/atoms/StatusDot/StatusDot.stories.tsx`
  - `client/src/components/atoms/StatusDot/index.ts`
- **Props**:
  - `status`: 'connected' | 'disconnected' | 'loading'
  - `size`: 'sm' | 'md'
- **Status**: ⏳ Pending
- **Effort**: 2 hours

#### Molecules

##### T-C5.11: StatusIndicator Molecule
- **Description**: Combine Icon + Badge + Text for status display
- **Files**:
  - `client/src/components/molecules/StatusIndicator/StatusIndicator.tsx`
  - `client/src/components/molecules/StatusIndicator/StatusIndicator.stories.tsx`
  - `client/src/components/molecules/StatusIndicator/index.ts`
- **Props**:
  - `status`: 'online' | 'offline' | 'error'
  - `label`: string
- **Status**: ⏳ Pending
- **Effort**: 3 hours

##### T-C5.12: DataCard Molecule
- **Description**: Card with title, value, and trend indicator
- **Files**:
  - `client/src/components/molecules/DataCard/DataCard.tsx`
  - `client/src/components/molecules/DataCard/DataCard.stories.tsx`
  - `client/src/components/molecules/DataCard/index.ts`
- **Props**:
  - `title`: string
  - `value`: string | number
  - `trend`: 'up' | 'down' | 'neutral'
  - `trendValue`: string
- **Status**: ⏳ Pending
- **Effort**: 4 hours

##### T-C5.13: SearchBar Molecule
- **Description**: Input with search icon and clear button
- **Files**:
  - `client/src/components/molecules/SearchBar/SearchBar.tsx`
  - `client/src/components/molecules/SearchBar/SearchBar.stories.tsx`
  - `client/src/components/molecules/SearchBar/index.ts`
- **Props**:
  - `value`: string
  - `onChange`: (value: string) => void
  - `placeholder`: string
- **Status**: ⏳ Pending
- **Effort**: 3 hours

##### T-C5.14: FormGroup Molecule
- **Description**: Label + Input + Error message container
- **Files**:
  - `client/src/components/molecules/FormGroup/FormGroup.tsx`
  - `client/src/components/molecules/FormGroup/FormGroup.stories.tsx`
  - `client/src/components/molecules/FormGroup/index.ts`
- **Props**:
  - `label`: string
  - `error`: string | undefined
  - `children`: React.ReactNode
- **Status**: ⏳ Pending
- **Effort**: 2 hours

### Phase 3: Migration

#### T-C5.15: Migrate ConnectionStatus
- **Description**: Replace with new StatusDot component
- **Target**: `client/src/components/ConnectionStatus.tsx`
- **Changes**: Import and use StatusDot from atoms
- **Status**: ⏳ Pending
- **Effort**: 1 hour

#### T-C5.16: Migrate ServerSettings
- **Description**: Refactor to use molecules
- **Target**: `client/src/components/ServerSettings.tsx`
- **Changes**: Use FormGroup, Button, Card
- **Status**: ⏳ Pending
- **Effort**: 3 hours

#### T-C5.17: Migrate ServiceStatus
- **Description**: Refactor using StatusIndicator
- **Target**: `client/src/components/ServiceStatus.tsx`
- **Changes**: Use StatusIndicator molecule
- **Status**: ⏳ Pending
- **Effort**: 3 hours

#### T-C5.18: Migrate Dashboard
- **Description**: Full refactor using DataCard molecules
- **Target**: `client/src/components/dashboard/Dashboard.tsx`
- **Changes**: Use DataCard, reorganize layout
- **Status**: ⏳ Pending
- **Effort**: 8 hours

#### T-C5.19: Migrate MarketTable
- **Description**: Refactor to use atomic components
- **Target**: `client/src/components/layout/panels/MarketTable.tsx`
- **Changes**: Use Card, Badge, StatusDot
- **Status**: ⏳ Pending
- **Effort**: 8 hours

#### T-C5.20: Migrate PriceChart
- **Description**: Integrate with Design System
- **Target**: `client/src/components/charts/PriceChart.tsx`
- **Changes**: Use Card wrapper, consistent styling
- **Status**: ⏳ Pending
- **Effort**: 8 hours

#### T-C5.21: Migrate CommandPalette
- **Description**: Refactor with new component library
- **Target**: `client/src/components/commands/CommandPalette.tsx`
- **Changes**: Use Input, Button, Card from atoms
- **Status**: ⏳ Pending
- **Effort**: 12 hours

#### T-C5.22: Migrate MainLayout
- **Description**: Final refactor to templates
- **Target**: `client/src/components/layout/MainLayout.tsx`
- **Changes**: Move to templates/, use full component library
- **Status**: ⏳ Pending
- **Effort**: 16 hours

### Task Dependencies

```
Phase 1
├── T-C5.1 (Structure) ──┬── T-C5.2 (Colors)
│                      ├── T-C5.3 (Typography)
│                      └── T-C5.4 (Storybook)
│
Phase 2
├── Atoms
│   ├── T-C5.5 (Button) ──┬── T-C5.11 (StatusIndicator)
│   ├── T-C5.6 (Icon)    ├── T-C5.12 (DataCard)
│   ├── T-C5.7 (Badge)   └── T-C5.14 (FormGroup)
│   ├── T-C5.8 (Card)
│   ├── T-C5.9 (Input)
│   └── T-C5.10 (StatusDot)
│
└── Molecules
    ├── T-C5.11 (StatusIndicator) ──┐
    ├── T-C5.12 (DataCard)         │
    ├── T-C5.13 (SearchBar)        │
    └── T-C5.14 (FormGroup)       │
    
Phase 3 (Depends on Phase 2 complete)
└── T-C5.15 ── T-C5.16 ── T-C5.17 ── T-C5.18 ── T-C5.19 ── T-C5.20 ── T-C5.21 ── T-C5.22
```

### Effort Summary

| Phase | Tasks | Hours |
|-------|-------|-------|
| Phase 1 | 4 | 9 |
| Phase 2 | 10 | 40 |
| Phase 3 | 8 | 60 |
| **Total** | **22** | **~109** |

---

## 🏗️ 3. v1.4.0 基础设施原子任务

> **Version**: v1.4.0
> **Parent Plan**: DS-051_v140_implementation.md
> **Type**: Atomic Task List
> **Status**: 🔄 Draft (State B)

### Master Task List

#### Phase 1: Pre-commit Portability (T-I1)

| ID | Task | Status | Effort | Owner |
|:---|:---|:---:|:---:|:---:|
| **T-I1.1** | Update `cdd-version-check` entry to relative path | ✅ Complete | 30min | @agent |
| **T-I1.2** | Update `cdd-entropy-check` entry to relative path | ✅ Complete | 30min | @agent |
| **T-I1.3** | Update `cdd-test-runner` entry to relative path | ✅ Complete | 30min | @agent |
| **T-I1.4** | Verify hooks execute from project root | ✅ Complete | 30min | @agent |
| **T-I1.5** | Test on simulated clean checkout | ✅ Complete | 30min | @agent |

**Subtotal**: 2.5 hours

#### Phase 2: CI/CD Integration (T-I2)

| ID | Task | Status | Effort | Owner |
|:---|:---|:---:|:---:|:---:|
| **T-I2.1** | Review current `.github/workflows/ci-cd.yml` | ✅ Complete | 30min | @agent |
| **T-I2.2** | Remove `ci.skip` directive | ✅ Complete | 15min | @agent |
| **T-I2.3** | Add environment setup for CDD tools | ✅ Complete | 1h | @agent |
| **T-I2.4** | Configure conditional execution | ✅ Complete | 1h | @agent |
| **T-I2.5** | Verify CI passes with CDD checks | ✅ Complete | 1h | @agent |

**Subtotal**: 3.75 hours

#### Phase 3: Test Coverage (T-I3)

| ID | Task | Status | Effort | Owner |
|:---|:---|:---:|:---:|:---:|
| **T-I3.1** | Run `pytest --cov` to audit baseline | ✅ Complete | 15min | @agent |
| **T-I3.2** | Identify coverage gaps in `server/core/` | ✅ Complete | 1h | @agent |
| **T-I3.3** | Add tests for `market_scanner.py` | ✅ Complete | 2h | @agent |
| **T-I3.4** | Add tests for data processing modules | ⏳ Pending | 2h | @agent |
| **T-I3.5** | Add integration tests for API endpoints | ⏳ Pending | 2h | @agent |
| **T-I3.6** | Configure coverage reporting | ✅ Complete | 30min | @agent |

**Subtotal**: 7.75 hours

#### Phase 4: Documentation (T-I4)

| ID | Task | Status | Effort | Owner |
|:---|:---|:---:|:---:|:---:|
| **T-I4.1** | Update `README.md` setup instructions | ✅ Complete | 30min | @agent |
| **T-I4.2** | Update `.pre-commit-config.yaml` comments | ✅ Complete | 15min | @agent |
| **T-I4.3** | Create `CONTRIBUTING.md` | ⏳ Pending | 1h | @agent |
| **T-I4.4** | Update `memory_bank/t0_core/project_readme.md` | ✅ Complete | 15min | @agent |

**Subtotal**: 2 hours

### Effort Summary

| Phase | Tasks | Total Effort |
|-------|-------|--------------|
| T-I1: Pre-commit | 5 | 2.5h |
| T-I2: CI/CD | 5 | 3.75h |
| T-I3: Testing | 6 | 7.75h |
| T-I4: Docs | 4 | 2h |
| **Total** | **20** | **~16 hours** |

### State Transitions

```
State B (Planning)
    ↓ [Approval]
State C (Execute)
    ├── T-I1.x (Pre-commit)
    ├── T-I2.x (CI/CD)
    ├── T-I3.x (Testing)
    └── T-I4.x (Docs)
    ↓ [All Complete]
State D (Verify) → cdd_audit.py
    ↓ [Pass]
State E (Close) → Update active_context.md
```

### Start Conditions

- [x] DS-050 (Feature Spec) approved
- [x] DS-051 (Implementation Plan) drafted
- [x] DS-052 (Atomic Tasks) created
- [ ] **This document approved** ← Current State

---

## 📋 4. 前端现代化与核心功能迁移原子任务

**Feature ID**: 001  
**Feature Name**: Frontend Modernization & Core Function Migration  
**Version**: v1.0.0  
**Last Updated**: 2026-02-01 20:54

### Phase A: Frontend Tasks

#### T-A1: Complete Dashboard Components
- **Description**: Implement remaining Dashboard components
- **Target File**: `src/components/dashboard/`
- **Status**: ⏳ Pending
- **Verification**: 
  - Components render without errors
  - Integration with Zustand store verified
  - Unit tests pass

#### T-A2: Implement Chart Components
- **Description**: Complete Chart components for data visualization
- **Target File**: `src/components/charts/`
- **Status**: ⏳ Pending
- **Verification**:
  - Charts display data correctly
  - Responsive behavior verified
  - Performance <200ms render time

#### T-A3: Complete Settings Page
- **Description**: Finish Settings page implementation
- **Target File**: `src/components/settings/`
- **Status**: ⏳ Pending
- **Verification**:
  - All settings save correctly
  - Theme persistence works

#### T-A4: Theme System Implementation
- **Description**: Implement dark/light theme switching
- **Target File**: `src/services/theme.ts`
- **Status**: ⏳ Pending
- **Verification**:
  - Theme toggles without page reload
  - Local storage persistence

#### T-A5: API Service Integration
- **Description**: Connect frontend to FastAPI backend
- **Target File**: `src/services/api.ts`
- **Status**: ⏳ Pending
- **Verification**:
  - All API endpoints accessible
  - Error handling works

### Phase B: Backend Tasks

#### T-B1: Migrate yfinance Module
- **Description**: Migrate yfinance data acquisition to new structure
- **Target File**: `python_service/data_acquisition.py`
- **Status**: ⏳ Pending
- **Verification**:
  - Data retrieval works for QQQ, GLD, BTC-USD
  - Error handling for rate limits

#### T-B2: Migrate RSRS Algorithm
- **Description**: Migrate RSRS (Resistance Support Ratio) calculation
- **Target File**: `python_service/analysis_rsrs.py`
- **Status**: ⏳ Pending
- **Verification**:
  - Returns value in [-1.0, 1.0]
  - Matches legacy algorithm output

#### T-B3: Migrate Volatility Skew
- **Description**: Migrate Volatility Skew calculation
- **Target File**: `python_service/analysis_volatility.py`
- **Status**: ⏳ Pending
- **Verification**:
  - Short-term/long-term ratio calculated
  - Ratio bounds [0, 3.0]

#### T-B4: Migrate DeepSeek Integration
- **Description**: Migrate DeepSeek API for report generation
- **Target File**: `python_service/report_generator.py`
- **Status**: ⏳ Pending
- **Verification**:
  - Markdown reports generated
  - Archived to `macro_report/`

### Phase C: Integration Tasks

#### T-C1: Integration Testing
- **Description**: End-to-end integration testing
- **Target File**: `tests/test_integration.py`
- **Status**: ⏳ Pending
- **Verification**:
  - All components work together
  - Data flow verified

#### T-C2: Performance Tuning
- **Description**: Optimize performance bottlenecks
- **Target File**: `python_service/server.py`
- **Status**: ⏳ Pending
- **Verification**:
  - Response time <500ms
  - Memory usage <200MB

#### T-C3: Bug Fixes
- **Description**: Fix identified bugs and issues
- **Target File**: Various
- **Status**: ⏳ Pending
- **Verification**:
  - No critical bugs
  - All tests pass

### Execution Order

```
Phase A (Frontend): T-A1 → T-A2 → T-A3 → T-A4 → T-A5
Phase B (Backend): T-B1 → T-B2 → T-B3 → T-B4
Phase C (Integration): T-C1 → T-C2 → T-C3
```

Note: Phase A and Phase B can execute in parallel if resources allow.

### Total Effort Estimate

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| A | 5 | 38 hours |
| B | 4 | 32 hours |
| C | 3 | 24 hours |
| **Total** | **12** | **94 hours** |

---

**文档状态**: ✅ 活跃 (v1.8.0)  
**维护者**: Negentropy Lab AI Agent System  
**CDD 框架**: v1.6.1