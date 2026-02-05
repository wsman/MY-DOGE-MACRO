# Technical Law Index - Standards Pointers

> **Version**: v1.8.0  
> **Last Updated**: 2026-02-05  
> **Architecture**: Modular v1.8.0 (Complete)

## Standard Files

| Category | File | Purpose | Status |
|----------|------|---------|--------|
| Context Management | `t2_standards/DS-007_context_management.md` | T0 document management | ✅ |
| Feature Spec | `t2_standards/DS-050_feature_specification.md` | Feature definition | ✅ |
| Implementation Plan | `t2_standards/DS-051_implementation_plan.md` | Task planning | ✅ |
| Atomic Tasks | `t2_standards/DS-052_atomic_tasks.md` | Execution units | ✅ |
| Code Review | `t2_standards/DS-060_code_review.md` | Automated code review | ✅ |
| Architecture Modernization | `t2_standards/DS-057_frontend_architecture_modernization.md` | Modular architecture | ✅ Complete |
| v1.8.0 Roadmap | `t2_standards/DS-058_v180_roadmap.md` | Core features roadmap | ✅ Complete |

## Modular Architecture Reference (v1.8.0)

| Layer | Directory | Purpose | Status |
|-------|-----------|---------|--------|
| **Applications** | `apps/` | Runnable applications | ✅ |
| └─ Desktop App | `apps/desktop/` | Tauri desktop application | ✅ Complete |
| └─ API Service | `apps/api/` | FastAPI backend service | ✅ Complete |
| **Libraries** | `libs/` | Shared libraries | ✅ |
| └─ Quant Engine | `libs/quant-engine/` | Quantitative analysis algorithms | ✅ Complete |
| └─ Design System | `libs/design-system/` | UI components and tokens | ✅ Complete |
| **Infrastructure** | `infrastructure/` | Development infrastructure | ✅ |
| └─ CDD Framework | `infrastructure/cdd/` | CDD tools | ✅ Complete |
| **Documentation** | `memory_bank/t3_documentation/` | Project documentation | ✅ Updated |

## Component Implementation Status

### Frontend (apps/desktop/)

| Component Type | Count | Examples |
|----------------|-------|----------|
| **Atoms** | 7 | Button, Badge, Card, Icon, Input, Avatar, StatusDot |
| **Molecules** | 4 | DataCard, SearchBar, FormGroup, StatusIndicator |
| **Organisms** | 3 | MarketOverview, AnalysisPanel, AIReportPanel |
| **Charts** | 4 | PriceChart, TechnicalIndicators, SubChart, ChartPanel |

### Backend (apps/api/)

| Module | Purpose | Status |
|--------|---------|--------|
| `t0_core/websocket.py` | Real-time price push | ✅ |
| `routes/` | REST API endpoints | ✅ |
| `services/` | Business logic | ✅ |

### Quant Engine (libs/quant-engine/)

| Module | Purpose | Status |
|--------|---------|--------|
| `analysis/technical_indicators.py` | MA/EMA/MACD/RSI/KDJ/Bollinger | ✅ |
| `analysis/rsrs.py` | RSRS indicator | ✅ |
| `analysis/volatility.py` | Volatility skew | ✅ |
| `data/tdx_reader.py` | 通达信 data reader | ✅ |
| `ai/` | DeepSeek integration | ✅ |

## Technology Stack Reference

| Layer | Technology | Primary Location | Standards |
|-------|------------|------------------|-----------|
| Frontend UI | React 19 + TypeScript | `apps/desktop/src/` | BEM + CSS Variables |
| Desktop Shell | Tauri v2 (Rust) | `apps/desktop/src-tauri/` | Tauri conventions |
| Backend API | Python FastAPI | `apps/api/` | REST + WebSocket |
| Quant Engine | pandas, numpy, scipy | `libs/quant-engine/` | NumPy style |
| AI Integration | DeepSeek API | `libs/quant-engine/ai/` | Async patterns |
| CDD Tools | Python | `infrastructure/cdd/tools/` | CDD v1.6.1 |

## Version Info

| Component | Version |
|-----------|---------|
| CDD Framework | v1.6.1 |
| Project | MY-DOGE-MACRO v1.8.0 |
| Technical Law | v1.8.0 |

---

*Technical Law Version: v1.8.0 | Updated: 2026-02-05*
