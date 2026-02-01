# DS-055: Frontend UI Standardization Plan

**Feature ID**: T-C4  
**Target**: Implement design from `Frontend-Layout.html`  
**Status**: In Progress  
**Date**: 2026-02-02

## 1. Design System Tokens

Extracted from `client/docs/Frontend-Layout.html`:

| Variable | Value | Tailwind Name | Usage |
|----------|-------|---------------|-------|
| --bg-primary | `#0f1419` | `bg-app-primary` | Main background |
| --bg-secondary | `#1a1f26` | `bg-app-secondary` | Sidebar/Header |
| --bg-tertiary | `#242b33` | `bg-app-tertiary` | Cards/Inputs |
| --text-primary | `#e7e9ea` | `text-app-primary` | Headings/Body |
| --text-secondary | `#8b98a5` | `text-app-secondary` | Secondary info |
| --accent | `#00d4aa` | `text-accent`/`bg-accent` | Selected/Buttons/Logo |
| --border | `#38444d` | `border-app-border` | Dividers |
| --success | `#00c853` | `text-app-success` | Gain/Status |
| --danger | `#f44336` | `text-app-danger` | Loss/Alerts |

## 2. Implementation Tasks

### T-C4.1: Design Token Injection
- **Target**: `client/tailwind.config.js`, `client/src/index.css`
- **Status**: ⏳ Pending

### T-C4.2: Global Layout Refactor  
- **Target**: `client/src/components/layout/MainLayout.tsx`
- **Status**: ⏳ Pending

### T-C4.3: Component Styling
- **Target**: MarketTable.tsx, ServiceStatus.tsx, Dashboard.tsx
- **Status**: ⏳ Pending

## 3. Layout Structure

```css
/* Grid Layout */
grid-template-rows: 48px 1fr 32px;  /* Header, Content, Footer */
grid-template-columns: 220px 1fr 320px;  /* Sidebar, Main, Detail */
```

## 4. Verification
- Visual check against `Frontend-Layout.html`
- Responsive grid behavior
