# Design System Documentation

**Version**: v1.0.0  
**Last Updated**: 2026-02-03  
**Based On**: DS-051, DS-057

---

## 1. Overview

MY-DOGE-MICRO Design System provides a comprehensive set of UI components, design tokens, and guidelines for building consistent user interfaces.

### Core Principles

- **Atomic Design**: Components organized from atoms to templates
- **BEM Naming**: Block Element Modifier CSS convention
- **CSS Variables**: Design tokens for consistent theming
- **TypeScript**: Full type safety for all components

---

## 2. Design Tokens

### Colors

```typescript
// client/src/design-system/tokens/colors.ts

// Semantic Colors
export const colors = {
  primary: { DEFAULT: '#0f1419', hover: '#1a1f26' },
  secondary: { DEFAULT: '#1a1f26', hover: '#242b33' },
  accent: { DEFAULT: '#00d4aa', hover: '#00b894' },
};

// Functional Colors
export const functionalColors = {
  success: { DEFAULT: '#4caf50', light: '#81c784' },
  warning: { DEFAULT: '#ff9800', light: '#ffb74d' },
  danger: { DEFAULT: '#f44336', light: '#e57373' },
  info: { DEFAULT: '#2196f3', light: '#64b5f6' },
};
```

### Typography

```typescript
// client/src/design-system/tokens/typography.ts

export const typography = {
  fontSizes: {
    xs: '0.75rem',  // 12px
    sm: '0.875rem', // 14px
    base: '1rem',    // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem',  // 20px
    '2xl': '1.5rem', // 24px
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};
```

### Spacing

```typescript
// client/src/design-system/tokens/spacing.ts

export const spacing = {
  base: 4, // 4px baseline
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
};
```

---

## 3. Components

### Atoms

| Component | Status | Location |
|-----------|--------|----------|
| Button | ✅ | `atoms/Button/` |
| Icon | ✅ | `atoms/Icon/` |
| Badge | ✅ | `atoms/Badge/` |
| Card | ✅ | `atoms/Card/` |
| Input | ✅ | `atoms/Input/` |
| Avatar | ✅ | `atoms/Avatar/` |
| StatusDot | ✅ | `atoms/StatusDot/` |

### Molecules

| Component | Status | Location |
|-----------|--------|----------|
| StatusIndicator | ✅ | `molecules/StatusIndicator/` |
| DataCard | ✅ | `molecules/DataCard/` |
| SearchBar | ✅ | `molecules/SearchBar/` |
| FormGroup | ✅ | `molecules/FormGroup/` |

### Templates

| Component | Status | Location |
|-----------|--------|----------|
| MainLayout | ✅ | `layout/MainLayout.tsx` |

---

## 4. CSS Naming Convention

### BEM Pattern

```css
/* Block */
.btn { }

/* Element */
.btn__icon { }
.btn__text { }

/* Modifier */
.btn--primary { }
.btn--lg { }
.btn--disabled { }
```

### Example Component

```tsx
// atoms/Button/Button.tsx
import React from 'react';
import './Button.css';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
}) => {
  const className = `btn btn--${variant} btn--${size}`;
  
  return (
    <button className={className}>
      <span className="btn__text">{children}</span>
    </button>
  );
};
```

```css
/* atoms/Button/Button.css */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn--primary {
  background: var(--color-primary);
  color: #ffffff;
}

.btn--md {
  height: 40px;
  padding: 0 16px;
  font-size: 1rem;
}

.btn__text {
  /* Element styles */
}
```

---

## 5. Usage Examples

### Basic Button

```tsx
import { Button } from '../components/atoms/Button';

<Button variant="primary" onClick={handleClick}>
  Submit
</Button>
```

### DataCard Grid

```tsx
import { DataCardGrid } from '../components/molecules/DataCard';

<DataCardGrid
  items={[
    { title: 'Total', value: '$1,234', trend: 'up', trendValue: '+5%' },
    { title: 'Today', value: '$456', trend: 'down', trendValue: '-2%' },
  ]}
  columns={2}
/>
```

### Avatar with Status

```tsx
import { Avatar } from '../components/atoms/Avatar';

<Avatar
  src="https://example.com/avatar.jpg"
  alt="User avatar"
  size="md"
  status="online"
/>
```

---

## 6. Storybook

Storybook is configured for component development and documentation.

```bash
# Start Storybook
cd client
npm run storybook

# Build Storybook
npm run build-storybook
```

### Available Stories

- `Atoms/Avatar` - Avatar component variants
- `Atoms/Button` - Button variants
- `Molecules/DataCard` - DataCard examples
- `Molecules/ConnectionStatus` - Connection status examples
- `Organisms/Dashboard` - Dashboard layout

---

## 7. Theming

### CSS Variables

```css
:root {
  /* Colors */
  --color-primary: #0f1419;
  --color-accent: #00d4aa;
  --color-success: #4caf50;
  --color-warning: #ff9800;
  --color-danger: #f44336;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  /* Typography */
  --font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'SF Mono', Monaco, Consolas, monospace;
}
```

### Dark Mode

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #ffffff;
    --color-background: #0f1419;
  }
}
```

---

## 8. Migration Guide

### Adding New Components

1. Create component folder in appropriate directory (atoms/molecules/templates)
2. Add TypeScript interface
3. Create BEM-styled CSS
4. Export from index.ts
5. Create Storybook story
6. Add to component library documentation

### File Structure

```
components/
├── atoms/
│   └── NewComponent/
│       ├── NewComponent.tsx
│       ├── NewComponent.css
│       ├── index.ts
│       └── NewComponent.stories.tsx
```

---

## 9. Resources

- [Storybook](https://storybook.js.org/)
- [BEM Naming](http://getbem.com/)
- [Atomic Design](https://atomicdesign.bradfrost.com/)

---

**Design System Version**: v1.0.0  
**Last Updated**: 2026-02-03  
**Maintained By**: @wsman
