# DS-057: Frontend Architecture Modernization

**Feature ID**: T-C5  
**Target**: Modernize frontend architecture with Atomic Design & Design System  
**Status**: Pending (Backlog)  
**Priority**: P1  
**Date**: 2026-02-03  
**Owner**: @1467503152080359464

---

## 1. Overview

### Problem Statement
Current frontend architecture lacks systematic component organization and Design System, leading to:
- Inconsistent UI patterns across components
- Low component reusability
- Fragmented styling approach
- Missing design documentation

### Proposed Solution
Implement Atomic Design methodology with comprehensive Design System:
- **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
- **Design Tokens**: Unified design decisions (colors, spacing, typography)
- **Component Library**: Standardized, documented components

---

## 2. Scope

### In Scope
- [ ] Atomic Design component hierarchy implementation
- [ ] Design System tokens foundation
- [ ] Component refactoring (MarketTable, Dashboard, Charts...)
- [ ] Storybook documentation setup
- [ ] Design System website/generator

### Out of Scope
- Backend API changes
- New feature development (pure refactoring)
- Legacy browser support

---

## 3. Requirements

### Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Establish Atomic Design directory structure | P0 | Pending |
| FR-02 | Define Design Tokens (colors, spacing, typography) | P0 | Pending |
| FR-03 | Create atomic components (Button, Input, Badge, Icon...) | P0 | Pending |
| FR-04 | Refactor existing components to use atomic building blocks | P1 | Pending |
| FR-05 | Integrate Storybook for component documentation | P1 | Pending |
| FR-06 | Create Design System website/dashboard | P2 | Pending |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Component reusability | ≥ 80% |
| NFR-02 | Design consistency | 100% tokens |
| NFR-03 | Documentation coverage | All components |
| NFR-04 | Performance impact | Zero regression |

---

## 4. Design

### Atomic Design Structure

```
client/src/
├── components/
│   ├── atoms/              # 原子组件 (不可再分)
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Icon/
│   │   ├── Badge/
│   │   ├── Card/
│   │   ├── Avatar/
│   │   └── index.ts
│   ├── molecules/          # 分子组件 (原子组合)
│   │   ├── SearchBar/
│   │   ├── FormGroup/
│   │   ├── DataCard/
│   │   ├── StatusIndicator/
│   │   └── index.ts
│   ├── organisms/          # 有机体 (功能模块)
│   │   ├── MarketTable/
│   │   ├── DashboardGrid/
│   │   ├── CommandPalette/
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   └── index.ts
│   ├── templates/          # 页面模板
│   │   ├── MainLayout/
│   │   ├── DashboardTemplate/
│   │   └── index.ts
│   └── pages/              # 页面路由
│       ├── DashboardPage/
│       ├── MarketPage/
│       └── index.ts
├── design-system/           # Design System 核心
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   ├── foundations/
│   │   ├── colors.css
│   │   ├── reset.css
│   │   └── index.css
│   ├── components/
│   │   ├── Button/
│   │   ├── Input/
│   │   └── ...
│   └── index.ts
└── ...
```

### Design Tokens Architecture

```typescript
// design-system/tokens/colors.ts
export const colors = {
  // Semantic Colors
  primary: {
    DEFAULT: '#0f1419',
    hover: '#1a1f26',
  },
  secondary: {
    DEFAULT: '#1a1f26',
    hover: '#242b33',
  },
  accent: {
    DEFAULT: '#00d4aa',
    hover: '#00b894',
    muted: 'rgba(0, 212, 170, 0.1)',
  },
  // ...
} as const;

// design-system/tokens/typography.ts
export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'source-code-pro, Menlo, Monaco, monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  },
  // ...
} as const;
```

### Component Migration Map

| Existing Component | New Location | Complexity |
|--------------------|--------------|------------|
| ConnectionStatus.tsx | atoms/StatusDot | Low |
| ServerSettings.tsx | organisms/SettingsPanel | Medium |
| ServiceStatus.tsx | organisms/ServiceStatus | Medium |
| CommandPalette.tsx | organisms/CommandPalette | High |
| PriceChart.tsx | organisms/MarketChart | High |
| Dashboard.tsx | organisms/DashboardGrid | High |
| MainLayout.tsx | templates/MainLayout | High |

---

## 5. Dependencies

### External Dependencies
- React 19 (already in use)
- TailwindCSS (already in use)
- Storybook (new installation)

### Internal Dependencies
- DS-055 (Frontend UI Standardization) - must be reviewed
- Existing component implementations

---

## 6. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration time exceeds estimate | High | Phase-by-phase rollout |
| Component regression | High | Comprehensive test coverage |
| Design tokens inconsistency | Medium | Strict token validation |
| Developer adoption | Medium | Documentation + training |

---

## 7. Acceptance Criteria

- [ ] Atomic Design structure implemented
- [ ] Design Tokens fully defined and used
- [ ] At least 20 atomic components created
- [ ] All migrated components pass visual regression tests
- [ ] Storybook configured with 80%+ component coverage
- [ ] $H_{sys} \leq 0.3$ after convergence

---

**References**:
- Frontend-Layout.html
- DS-055_frontend_ui_standard.md
- CDD v1.6.1 templates
