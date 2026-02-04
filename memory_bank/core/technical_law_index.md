# Technical Law Index - Standards Pointers

> **Version**: v1.1.0  
> **Last Updated**: 2026-02-04  
> **Architecture**: Modular v1.6.0

## Standard Files

| Category | File | Purpose |
|----------|------|---------|
| Context Management | `standards/DS-007_context_management.md` | T0 document management |
| Feature Spec | `standards/DS-050_feature_specification.md` | Feature definition |
| Implementation Plan | `standards/DS-051_implementation_plan.md` | Task planning |
| Atomic Tasks | `standards/DS-052_atomic_tasks.md` | Execution units |
| Code Review | `standards/DS-060_code_review.md` | Automated code review |
| Architecture Modernization | `standards/DS-057_frontend_architecture_modernization.md` | Modular architecture design |

## Modular Architecture Reference (v1.6.0+)

| Layer | Directory | Purpose | Technology |
|-------|-----------|---------|------------|
| **Applications** | `apps/` | Runnable applications | Mixed |
| └─ Desktop App | `apps/desktop/` | Tauri desktop application | React 19 + Tauri v2 |
| └─ API Service | `apps/api/` | FastAPI backend service | Python FastAPI |
| **Libraries** | `libs/` | Shared libraries | Mixed |
| └─ Quant Engine | `libs/quant-engine/` | Quantitative analysis algorithms | Python (pandas, numpy) |
| └─ Design System | `libs/design-system/` | UI components and tokens | React + TypeScript |
| └─ Common Utils | `libs/common/` | Shared utilities | TypeScript + Python |
| **Infrastructure** | `infrastructure/` | Development infrastructure | Mixed |
| └─ CDD Framework | `infrastructure/cdd/` | Constitution-Driven Development tools | Python |
| └─ CI/CD | `infrastructure/ci-cd/` | Continuous integration/deployment | GitHub Actions |
| **Data & Config** | `data/`, `config/` | Data storage and configuration | JSON, YAML, Parquet |
| **Documentation** | `docs/` | Project documentation | Markdown |
| **T3 Documentation** | `memory_bank/t3_documentation/` | User & developer guides (T3) | Markdown |

## Legacy Structure (v1.5.0 and earlier)

| Directory | New Location | Migration Status |
|-----------|--------------|------------------|
| `client/` | `apps/desktop/` | ⏳ Planned |
| `server/` | `apps/api/` | ⏳ Planned |
| `engine/` | `libs/quant-engine/` | ⏳ Planned |
| `scripts/` | `infrastructure/cdd/tools/` | ⏳ Planned |
| `tests/` | Co-located with source | ⏳ Planned |

## Technology Stack Reference

| Layer | Technology | Primary Location | Standards |
|-------|------------|------------------|-----------|
| Frontend UI | React 19 + TypeScript | `apps/desktop/src/` | BEM + CSS Variables |
| App Shell | Tauri v2 (Rust) | `apps/desktop/src-tauri/` | - |
| Backend API | Python FastAPI | `apps/api/src/` | PEP 8 |
| AI Engine | DeepSeek API | `libs/quant-engine/src/ai/` | - |
| Data Analysis | pandas, numpy, scipy | `libs/quant-engine/src/analysis/` | - |
| Data Acquisition | yfinance, 通达信 DB | `libs/quant-engine/src/data/` | - |
| Design System | Atomic Design + BEM | `libs/design-system/` | `Block--Element--Modifier` |

## Frontend Standards (T-C5 Completion)

### CSS & Styling Standards
- **Naming Convention**: BEM (Block--Element--Modifier)
- **CSS Variables**: Centralized in `design-system/tokens/variables.css`
- **File Organization**: Co-located CSS with components
- **Reference**: `standards/DS-051_frontend_modernization_plan.md`

### Component Library (Completed 2026-02-03)

| Category | Count | Components | Status |
|----------|-------|------------|--------|
| **Atoms** | 7/7 | Button, Icon, Badge, Card, Input, Avatar, StatusDot | ✅ Complete |
| **Molecules** | 4/4 | StatusIndicator, DataCard, SearchBar, FormGroup | ✅ Complete |

### Design System Documentation
- **Main Doc**: `client/DESIGN_SYSTEM.md`
- **Tokens**: `libs/design-system/tokens/` (colors, typography, spacing, etc.)
- **Storybook**: 4 story files with 80%+ coverage

### Bug Fixes Applied
- **BEM Naming**: Corrected multiple hyphen issues (`.btn----sm` → `.btn--sm`)
- **Files**: Button.tsx/css, Avatar.tsx/css, and related documentation

## Path Mapping (Development)

| Alias | Target | Purpose |
|-------|--------|---------|
| `@/*` | `./client/src/*` | Legacy compatibility |
| `@apps/*` | `./apps/desktop/src/*` | New desktop app imports |
| `@libs/*` | `./libs/*` | Shared library imports |
| `@design-system/*` | `./libs/design-system/*` | Design system imports |

## Version Info

| Component | Version |
|-----------|---------|
| CDD Framework | v1.6.0 |
| Project | MY-DOGE-MACRO v1.6.0 |
| Technical Law | v1.1.0 |
| Modular Architecture | v1.0.0 |
