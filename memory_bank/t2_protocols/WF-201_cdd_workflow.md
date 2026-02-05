# WF-201: CDD Main Workflow

**Version**: v1.0.0  
**Last Updated**: 2026-02-01

## Five-State Workflow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ State A  │ ──→ │ State B  │ ──→ │ State C  │ ──→ │ State D  │ ──→ │ State E  │
│ 基准摄入 │     │ 文档规划 │     │ 受控执行 │     │ 三级验证 │     │ 收敛纠错 │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
```

## State A: Context Ingestion
- Load all T0 documents from `core/`
- Load relevant T1 documents from `t1_axioms/`
- Calculate $H_{sys}$

## State B: Documentation First
- Draft DS-050 (Feature Specification)
- Draft DS-051 (Implementation Plan)
- Wait for user approval (YES)

## State C: Safe Implementation
- Execute according to DS-052 (Atomic Tasks)
- Follow behavior_context.md constraints
- Use parameterized queries

## State D: Three-Tier Verification
- **Tier 1**: Structure check (system_patterns.md)
- **Tier 2**: Signature check (tech_context.md)
- **Tier 3**: Behavior check (behavior_context.md)

## State E: Converge & Calibrate
- Update active_context.md
- Verify $H_{sys} \leq 0.3$
- Complete task
