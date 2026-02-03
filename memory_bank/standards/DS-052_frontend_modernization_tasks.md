# DS-052: Frontend Architecture Modernization - Atomic Tasks

**Feature ID**: T-C5  
**Related Spec**: DS-057, DS-051  
**Status**: Pending  
**Date**: 2026-02-03

---

## Task Summary

| Category | Count | Total Effort |
|----------|-------|--------------|
| Phase 1: Foundation | 3 tasks | ~9 hours |
| Phase 2: Components | 12 tasks | ~40 hours |
| Phase 3: Migration | 7 tasks | ~60 hours |
| **Total** | **22 tasks** | **~109 hours** |

---

## Phase 1: Foundation

### T-C5.1: Directory Structure Setup
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

### T-C5.2: Design Tokens - Colors
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

### T-C5.3: Design Tokens - Typography & Spacing
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

### T-C5.4: Storybook Configuration
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

---

## Phase 2: Core Components

### Atoms

### T-C5.5: Button Component
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

### T-C5.6: Icon Component
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

### T-C5.7: Badge Component
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

### T-C5.8: Card Component
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

### T-C5.9: Input Component
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

### T-C5.10: StatusDot Component
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

### Molecules

### T-C5.11: StatusIndicator Molecule
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

### T-C5.12: DataCard Molecule
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

### T-C5.13: SearchBar Molecule
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

### T-C5.14: FormGroup Molecule
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

---

## Phase 3: Migration

### T-C5.15: Migrate ConnectionStatus
- **Description**: Replace with new StatusDot component
- **Target**: `client/src/components/ConnectionStatus.tsx`
- **Changes**: Import and use StatusDot from atoms
- **Status**: ⏳ Pending
- **Effort**: 1 hour

### T-C5.16: Migrate ServerSettings
- **Description**: Refactor to use molecules
- **Target**: `client/src/components/ServerSettings.tsx`
- **Changes**: Use FormGroup, Button, Card
- **Status**: ⏳ Pending
- **Effort**: 3 hours

### T-C5.17: Migrate ServiceStatus
- **Description**: Refactor using StatusIndicator
- **Target**: `client/src/components/ServiceStatus.tsx`
- **Changes**: Use StatusIndicator molecule
- **Status**: ⏳ Pending
- **Effort**: 3 hours

### T-C5.18: Migrate Dashboard
- **Description**: Full refactor using DataCard molecules
- **Target**: `client/src/components/dashboard/Dashboard.tsx`
- **Changes**: Use DataCard, reorganize layout
- **Status**: ⏳ Pending
- **Effort**: 8 hours

### T-C5.19: Migrate MarketTable
- **Description**: Refactor to use atomic components
- **Target**: `client/src/components/layout/panels/MarketTable.tsx`
- **Changes**: Use Card, Badge, StatusDot
- **Status**: ⏳ Pending
- **Effort**: 8 hours

### T-C5.20: Migrate PriceChart
- **Description**: Integrate with Design System
- **Target**: `client/src/components/charts/PriceChart.tsx`
- **Changes**: Use Card wrapper, consistent styling
- **Status**: ⏳ Pending
- **Effort**: 8 hours

### T-C5.21: Migrate CommandPalette
- **Description**: Refactor with new component library
- **Target**: `client/src/components/commands/CommandPalette.tsx`
- **Changes**: Use Input, Button, Card from atoms
- **Status**: ⏳ Pending
- **Effort**: 12 hours

### T-C5.22: Migrate MainLayout
- **Description**: Final refactor to templates
- **Target**: `client/src/components/layout/MainLayout.tsx`
- **Changes**: Move to templates/, use full component library
- **Status**: ⏳ Pending
- **Effort**: 16 hours

---

## Task Dependencies

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

---

## Effort Summary

| Phase | Tasks | Hours |
|-------|-------|-------|
| Phase 1 | 4 | 9 |
| Phase 2 | 10 | 40 |
| Phase 3 | 8 | 60 |
| **Total** | **22** | **~109** |
