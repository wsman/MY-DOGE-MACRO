# DS-051: Implementation Plans

> **Version**: v1.8.0  
> **Last Updated**: 2026-02-05  
> **Type**: Implementation Plan Collection  
> **Status**: Active

## 📋 概述

本文档包含了 MY-DOGE-MACRO 项目的所有实施计划，按计划类型分类。

---

## 🔧 1. 通用实施计划模板

**Feature ID**: {{FEATURE_ID}}  
**Feature Name**: {{FEATURE_NAME}}  
**Version**: v1.0.0  
**Last Updated**: {{DATE}}

### Implementation Strategy
[High-level approach to implementing the feature]

### Architecture Changes
#### Modified Components
- [Component 1]
- [Component 2]

#### New Components
- [Component 1]
- [Component 2]

### Milestones
| Milestone | Deliverable | Status |
|-----------|-------------|--------|
| 1 | [Deliverable] | ⏳ Pending |
| 2 | [Deliverable] | ⏳ Pending |
| 3 | [Deliverable] | ⏳ Pending |

### Timeline
- **Start**: [Date]
- **End**: [Date]
- **Duration**: [X days]

---

## 🎨 2. 前端架构现代化计划

**Feature ID**: T-C5  
**Related Spec**: DS-057  
**Status**: Pending  
**Date**: 2026-02-03

### 实施策略
采用 **Phase-by-Phase** 渐进式重构策略，确保：
- 每次变更可控可验证
- 最小化对现有功能的影响
- 持续集成，持续交付

### Three-Phase Approach
| Phase | Focus | Duration | Deliverables |
|-------|-------|----------|--------------|
| **Phase 1** | Foundation | Week 1 | Atomic structure + Design Tokens |
| **Phase 2** | Core Components | Week 2 | Atoms + Molecules library |
| **Phase 3** | Migration | Week 3-4 | Full component migration |

### Phase 1: Foundation (Week 1)
#### Objectives
1. Establish directory structure
2. Define Design Tokens
3. Configure build tools (Storybook)

#### Tasks
##### T-C5.1: Directory Structure Setup
```bash
# Create atomic design directories
mkdir -p client/src/components/{atoms,molecules,organisms,templates,pages}
mkdir -p client/src/design-system/{tokens,foundations,components}
mkdir -p client/src/components/atoms/{Button,Input,Icon,Badge,Card,Avatar,StatusDot}
mkdir -p client/src/components/molecules/{SearchBar,FormGroup,DataCard,StatusIndicator}

# Create index files
touch client/src/components/atoms/index.ts
touch client/src/components/molecules/index.ts
touch client/src/components/organisms/index.ts
touch client/src/components/templates/index.ts
touch client/src/components/pages/index.ts
```

**Effort**: 2 hours

##### T-C5.2: Design Tokens Definition
**Target**: `client/src/design-system/tokens/`

| Token File | Content | Priority |
|------------|---------|----------|
| `colors.ts` | Semantic + functional colors | P0 |
| `spacing.ts` | Spacing scale (4px baseline) | P0 |
| `typography.ts` | Font sizes, weights, families | P0 |
| `radius.ts` | Border radius scale | P1 |
| `shadows.ts` | Elevation shadows | P2 |
| `animations.ts` | Transition timings | P2 |

**Effort**: 4 hours

##### T-C5.3: Storybook Configuration
**Commands**:
```bash
cd client
npx storybook@latest init --type react --yes
# Configure for TailwindCSS
```

**Effort**: 3 hours

### Phase 2: Core Components (Week 2)
#### Atoms (Priority Order)
| Component | Files | Complexity | Status |
|-----------|-------|------------|--------|
| **Button** | Button.tsx, Button.css, stories | Low | ⏳ |
| **Icon** | Icon.tsx, icons/*.svg | Low | ⏳ |
| **Badge** | Badge.tsx | Low | ⏳ |
| **Card** | Card.tsx | Low | ⏳ |
| **Input** | Input.tsx | Low | ⏳ |
| **Avatar** | Avatar.tsx | Low | ⏳ |
| **StatusDot** | StatusDot.tsx | Low | ⏳ |

#### Molecules (Priority Order)
| Component | Composition | Complexity | Status |
|-----------|-------------|------------|--------|
| **StatusIndicator** | Icon + Badge + Text | Low | ⏳ |
| **FormGroup** | Label + Input + Error | Low | ⏳ |
| **DataCard** | Card + Title + Content + Action | Medium | ⏳ |
| **SearchBar** | Input + Icon + Button | Medium | ⏳ |

### Phase 3: Migration (Week 3-4)
#### Migration Strategy
1. **Parallel Development**: Build new components alongside old
2. **Incremental Replacement**: Replace one component at a time
3. **Visual Regression Testing**: Percy/screenshot comparison
4. **Feature Flag**: Rollout control

#### Component Migration Order
| Order | Component | Effort | Risk |
|-------|-----------|--------|------|
| 1 | StatusDot (ConnectionStatus) | 2h | Low |
| 2 | ServiceStatus | 4h | Low |
| 3 | Dashboard | 8h | Medium |
| 4 | MarketTable | 8h | Medium |
| 5 | PriceChart | 8h | Medium |
| 6 | CommandPalette | 12h | High |
| 7 | MainLayout | 16h | High |

### Verification Gates
#### Phase 1 Gate
- [ ] Directory structure matches DS-057
- [ ] Design Tokens TypeScript exports valid
- [ ] Storybook builds successfully

#### Phase 2 Gate
- [ ] All atoms created and documented
- [ ] All molecules created and documented
- [ ] Component tests passing (≥80%)

#### Phase 3 Gate
- [ ] All migrated components working
- [ ] Visual regression: 0 new failures
- [ ] Performance: No regression
- [ ] $H_{sys} \leq 0.3$

### Effort Summary
| Phase | Tasks | Hours |
|-------|-------|-------|
| Phase 1 | 3 | 9 |
| Phase 2 | 12 | 40 |
| Phase 3 | 7 | 60 |
| **Total** | **22** | **~109** |

---

## ⚡ 3. 性能优化计划

**Feature ID**: T-C2  
**Target**: System-wide Performance Tuning  
**Version**: v1.0.0  
**Date**: 2026-02-01

### 优化目标
1. **后端计算性能**: 将 RSRS 指标计算 (20日回溯) 的延迟降低 50% 以上。
2. **前端渲染性能**: 优化 Dashboard 和 K线图表的重渲染问题，确保 FPS >= 60。
3. **启动速度**: 优化 Tauri 应用启动流程，减少白屏时间。

### 实施策略
#### 后端优化 (Python/FastAPI)
| 优化项 | 目标文件 | 预期效果 |
|--------|----------|----------|
| 向量化计算 | `analysis_rsrs.py`, `analysis_volatility.py` | 减少 50% 计算时间 |
| 数据缓存 | `data_acquisition.py` | 减少 80% 重复 IO |
| 异步并发 | `market_scanner.py` | 减少 40% 扫描耗时 |

#### 前端优化 (React 19)
| 优化项 | 目标文件 | 预期效果 |
|--------|----------|----------|
| React.memo | `PriceChart.tsx`, `PixiGraph.tsx` | 减少无效重绘 |
| Zustand Selectors | `analysis.store.ts` | 减少组件更新 |
| 虚拟列表 | `MarketTable.tsx` | 提升大数据渲染 |

#### 架构调整
| 配置项 | 文件 | 状态 |
|--------|------|------|
| LAN 访问 | `vite.config.ts` | ✅ 已配置 |
| Host 配置 | `server.py` | ✅ 已配置 |

### 验证标准
| 层级 | 检查项 | 阈值 |
|------|--------|------|
| Tier 3 | RSRS 计算测试 | < 0.1s |
| Tier 3 | Dashboard FPS | >= 60 |
| Tier 2 | 内存占用 | < 200MB |

### 依赖关系
```
T-C2.1 (算法向量化)
    ↓
T-C2.4 (扫描器并发)
    ↓
T-C2.2 (后端缓存)
    ↓
T-C2.3 (前端优化)
```

---

## 🏗️ 4. v1.4.0 基础设施实施计划

**Version**: v1.4.0  
**Parent Spec**: DS-050_feature_specification.md (Section 3: v1.4.0 Infrastructure & Quality)  
**Type**: Infrastructure Implementation Plan  
**Status**: 🔄 Draft (State B)

### Task Breakdown
#### T-I1: Fix Pre-commit Portability (P0) 🟠
**Objective**: Replace absolute paths with relative paths in `.pre-commit-config.yaml`

**Steps**:
1.1 Update `cdd-version-check` entry point  
1.2 Update `cdd-entropy-check` entry point  
1.3 Update `cdd-test-runner` entry point  
1.4 Verify hooks work in local environment  
1.5 Test on clean checkout (simulate new user)

**Estimated Effort**: 2 hours

#### T-I2: Enable CI/CD Checks (P1) 🟡
**Objective**: Remove skip flags and ensure CDD checks run in GitHub Actions

**Steps**:
2.1 Review current `.github/workflows/ci-cd.yml`  
2.2 Remove `ci.skip` directive  
2.3 Add environment setup for CDD tools  
2.4 Configure conditional execution (skip if tools missing)  
2.5 Verify CI passes with CDD checks

**Estimated Effort**: 4 hours

#### T-I3: Test Coverage Expansion (P1) 🟡
**Objective**: Increase backend test coverage to ≥80%

**Steps**:
3.1 Audit current coverage (run `pytest --cov`)  
3.2 Identify gaps in `server/core/` modules  
3.3 Add unit tests for `market_scanner.py`  
3.4 Add unit tests for data processing modules  
3.5 Add integration tests for API endpoints  
3.6 Configure coverage reporting

**Estimated Effort**: 6 hours

#### T-I4: Documentation Update (P2) 🔵
**Objective**: Update project documentation for new infrastructure

**Steps**:
4.1 Update `README.md` with new setup instructions  
4.2 Update `.pre-commit-config.yaml` comments  
4.3 Add `CONTRIBUTING.md` for infrastructure guidelines  
4.4 Update `memory_bank/t0_core/project_readme.md`

**Estimated Effort**: 2 hours

### Timeline
```
Week 1:
├── Mon: T-I1 (2h)
├── Tue: T-I2 (4h)
├── Wed: T-I3 (4h)
└── Thu: T-I3 (2h) + Review

Week 2:
├── Mon: T-I4 (2h)
├── Tue: State D (Verification)
└── Wed: State E (Convergence)
```

### Success Metrics
| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Pre-commit portability | 0% | 100% | Works on clean checkout |
| CI CDD coverage | 0% | 100% | Checks run in CI |
| Backend coverage | ~60% | ≥80% | pytest --cov |
| Setup time | ~30 min | <10 min | New developer onboarding |

---

## 📅 5. 前端现代化与核心功能迁移计划

**Feature ID**: 001  
**Feature Name**: Frontend Modernization & Core Function Migration  
**Version**: v1.0.0  
**Last Updated**: 2026-02-01 20:54

### Implementation Strategy
采用并行开发方法：
- **Phase A**: 完成前端组件 (UI优先)
- **Phase B**: 迁移核心后端功能 (并行)
- **Phase C**: 集成测试和Bug修复

### Architecture Changes
#### Modified Components
| Component | Change Type | Description |
|-----------|-------------|-------------|
| `src/components/` | Modify | Complete remaining React components |
| `src/stores/` | Modify | Enhance Zustand state management |
| `src/services/` | Modify | API integration services |
| `python_service/data_*.py` | New | Migrated data modules |
| `python_service/ai_*.py` | New | Migrated AI modules |

#### New Components
| Component | Purpose |
|-----------|---------|
| `python_service/data_acquisition.py` | Unified data layer |
| `python_service/analysis_engine.py` | RSRS & Volatility Skew |
| `python_service/report_generator.py` | DeepSeek integration |
| `tests/test_data_acquisition.py` | Data layer tests |
| `tests/test_analysis.py` | Analysis engine tests |

### Milestones
#### Milestone 1: Frontend Completion (Week 1)
| Deliverable | Status | Description |
|-------------|--------|-------------|
| M1.1 | ⏳ Pending | Complete remaining 6 React components |
| M1.2 | ⏳ Pending | Implement theme switching |
| M1.3 | ⏳ Pending | Connect API services |
| M1.4 | ⏳ Pending | Cross-browser testing |

#### Milestone 2: Backend Migration (Week 2)
| Deliverable | Status | Description |
|-------------|--------|-------------|
| M2.1 | ⏳ Pending | Migrate yfinance integration |
| M2.2 | ⏳ Pending | Migrate RSRS algorithm |
| M2.3 | ⏳ Pending | Migrate Volatility Skew |
| M2.4 | ⏳ Pending | Migrate DeepSeek integration |

#### Milestone 3: Integration (Week 3)
| Deliverable | Status | Description |
|-------------|--------|-------------|
| M3.1 | ⏳ Pending | End-to-end testing |
| M3.2 | ⏳ Pending | Performance optimization |
| M3.3 | ⏳ Pending | Bug fixes and validation |

### Resource Allocation
| Resource | Allocation |
|----------|------------|
| Frontend Developer | 1 (100%) |
| Backend Developer | 1 (100%) |
| QA Resource | 0.5 (50%) |

---

**文档状态**: ✅ 活跃 (v1.8.0)  
**维护者**: Negentropy Lab AI Agent System  
**CDD 框架**: v1.6.1