# Procedural Law Index - Workflow Pointers

> **Version**: v1.8.0  
> **Last Updated**: 2026-02-05

## CDD Workflow Reference

### Five-State Workflow (v1.6.1)

```
State A: Context Ingestion (T0 Loading)
    ↓
State B: Documentation First (Planning)
    ↓
State C: Safe Implementation (Execution)
    ↓
State D: Three-Tier Verification
    ↓
State E: Converge & Calibrate
```

## Workflow Files

| Workflow | File | Purpose |
|----------|------|---------|
| Clarify | `protocols/WF-001_clarify_workflow.md` | Problem clarification |
| Main CDD | `protocols/WF-201_cdd_workflow.md` | Core workflow |

## State Transitions

| From | To | Trigger |
|------|-----|---------|
| A | B | T0 documents loaded |
| B | C | User approval (YES) |
| C | D | Code execution complete |
| D | C | Verification failed |
| D | E | All tiers passed |
| E | A | New task or continue |

## Project-Specific Workflows

| Workflow | Purpose | Last Executed |
|----------|---------|---------------|
| v1.5.0 Frontend Modernization | Atomic Design + BEM | ✅ 2026-02-03 |
| v1.7.0 Architecture Migration | Modular structure | ✅ 2026-02-05 |
| v1.8.0 Core Features | Charts + Dashboard + WebSocket | ✅ 2026-02-05 |

## Version Info

| Component | Version |
|-----------|---------|
| CDD Framework | v1.6.1 |
| Project | MY-DOGE-MACRO v1.8.0 |
| Procedural Law | v1.8.0 |
