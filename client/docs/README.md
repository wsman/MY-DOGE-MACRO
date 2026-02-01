# Design Documentation - MY-DOGE-MICRO

This directory contains design documents and specifications for the frontend.

## Documents

| File | Description |
|------|-------------|
| `Frontend-Layout.html` | Main application layout design with dashboard, charts, and settings panels |
| `Knowledge-Graph.html` | Knowledge graph visualization design for market analysis |

## Layout Components

### Frontend Layout

```
┌─────────────────────────────────────────────────────────┐
│ Header: Logo + Nav + Search + User                      │
├───────┬─────────────────────────────────┬───────────────┤
│       │                                 │               │
│ Side- │     Main Content Area           │   Right Panel │
│ bar   │   (Dashboard/Charts/Settings)   │   (Details)   │
│       │                                 │               │
│       │                                 │               │
├───────┴─────────────────────────────────┴───────────────┤
│ Footer: Status + Connection + Version                   │
└─────────────────────────────────────────────────────────┘
```

### Knowledge Graph

```
┌─────────────────────────────────────────────────────────┐
│ Header: Logo + Graph Title + Search                     │
├───────────┬─────────────────────────────────────────────┤
│           │                                             │
│  Control  │           D3.js Visualization               │
│  Panel    │         (Nodes + Links + Labels)           │
│           │                                             │
├───────────┴─────────────────────────────────────────────┤
│ Footer: Statistics + Export                             │
└─────────────────────────────────────────────────────────┘
```

## Color Scheme

| Variable | Color | Usage |
|----------|-------|-------|
| `--bg-primary` | #0f1419 | Main background |
| `--bg-secondary` | #1a1f26 | Panel background |
| `--accent` | #00d4aa | Primary accent |
| `--text-primary` | #e7e9ea | Main text |
| `--border` | #38444d | Border color |

## Related

- Implementation: `client/src/components/`
- Layout components: `client/src/components/layout/`
- Charts: `client/src/components/charts/`
