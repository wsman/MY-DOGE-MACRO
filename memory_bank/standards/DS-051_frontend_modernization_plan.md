# DS-051: Frontend Architecture Modernization - Implementation Plan

**Feature ID**: T-C5  
**Related Spec**: DS-057  
**Status**: Pending  
**Date**: 2026-02-03

---

## 1. Implementation Strategy

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

---

## 2. Phase 1: Foundation (Week 1)

### Objectives
1. Establish directory structure
2. Define Design Tokens
3. Configure build tools (Storybook)

### Tasks

#### T-C5.1: Directory Structure Setup
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

**Owner**: @1467503152080359464  
**Status**: ⏳ Pending  
**Effort**: 2 hours

#### T-C5.2: Design Tokens Definition
**Target**: `client/src/design-system/tokens/`

| Token File | Content | Priority |
|------------|---------|----------|
| `colors.ts` | Semantic + functional colors | P0 |
| `spacing.ts` | Spacing scale (4px baseline) | P0 |
| `typography.ts` | Font sizes, weights, families | P0 |
| `radius.ts` | Border radius scale | P1 |
| `shadows.ts` | Elevation shadows | P2 |
| `animations.ts` | Transition timings | P2 |

**Owner**: @1467503152080359464  
**Status**: ⏳ Pending  
**Effort**: 4 hours

#### T-C5.3: Storybook Configuration
**Commands**:
```bash
cd client
npx storybook@latest init --type react --yes
# Configure for TypeScript + TailwindCSS
```

**Owner**: @1467503152080359464  
**Status**: ⏳ Pending  
**Effort**: 3 hours

---

## 3. Phase 2: Core Components (Week 2)

### Objectives
1. Build atomic component library
2. Establish component patterns
3. Document all components

### Atoms (Priority Order)

| Component | Files | Complexity | Status |
|-----------|-------|------------|--------|
| **Button** | Button.tsx, Button.module.css, stories | Low | ⏳ |
| **Icon** | Icon.tsx, icons/*.svg | Low | ⏳ |
| **Badge** | Badge.tsx | Low | ⏳ |
| **Card** | Card.tsx | Low | ⏳ |
| **Input** | Input.tsx | Low | ⏳ |
| **Avatar** | Avatar.tsx | Low | ⏳ |
| **StatusDot** | StatusDot.tsx | Low | ⏳ |

### Molecules (Priority Order)

| Component | Composition | Complexity | Status |
|-----------|-------------|------------|--------|
| **StatusIndicator** | Icon + Badge + Text | Low | ⏳ |
| **FormGroup** | Label + Input + Error | Low | ⏳ |
| **DataCard** | Card + Title + Content + Action | Medium | ⏳ |
| **SearchBar** | Input + Icon + Button | Medium | ⏳ |

### Component Template

```tsx
// atoms/Button/Button.tsx
import React from 'react';
import './Button.module.css';

export interface ButtonProps {
  /** Button content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

---

## 4. Phase 3: Migration (Week 3-4)

### Migration Strategy

1. **Parallel Development**: Build new components alongside old
2. **Incremental Replacement**: Replace one component at a time
3. **Visual Regression Testing**: Percy/screenshot comparison
4. **Feature Flag**: Rollout control

### Component Migration Order

| Order | Component | Effort | Risk |
|-------|-----------|--------|------|
| 1 | StatusDot (ConnectionStatus) | 2h | Low |
| 2 | ServiceStatus | 4h | Low |
| 3 | Dashboard | 8h | Medium |
| 4 | MarketTable | 8h | Medium |
| 5 | PriceChart | 8h | Medium |
| 6 | CommandPalette | 12h | High |
| 7 | MainLayout | 16h | High |

### Migration Checklist

```markdown
## Component Migration Checklist

- [ ] New component built with atomic parts
- [ ] All props documented (TypeScript)
- [ ] Story created in Storybook
- [ ] Visual regression test passed
- [ ] A11y audit passed (axe-core)
- [ ] Old component deprecated (not deleted)
- [ ] Import paths updated
- [ ] Test coverage maintained
```

---

## 5. Verification Gates

### Phase 1 Gate
- [ ] Directory structure matches DS-057
- [ ] Design Tokens TypeScript exports valid
- [ ] Storybook builds successfully

### Phase 2 Gate
- [ ] All atoms created and documented
- [ ] All molecules created and documented
- [ ] Component tests passing (≥80%)

### Phase 3 Gate
- [ ] All migrated components working
- [ ] Visual regression: 0 new failures
- [ ] Performance: No regression
- [ ] $H_{sys} \leq 0.3$

---

## 6. Rollback Plan

| Trigger | Action |
|---------|--------|
| Visual regression > 5% | Revert to previous component |
| Performance regression | Revert, profile, optimize |
| $H_{sys} > 0.5$ | Halt, audit, fix |

---

**Estimated Total Effort**: 4-6 weeks  
**Resources Required**: 1 developer  
**Dependencies**: None (pure refactoring)
