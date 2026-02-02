# Technical Law Index - Standards Pointers

> **Version**: v1.0.0  
> **Last Updated**: 2026-02-01

## Standard Files

| Category | File | Purpose |
|----------|------|---------|
| Context Management | `standards/DS-007_context_management.md` | T0 document management |
| Feature Spec | `standards/DS-050_feature_specification.md` | Feature definition |
| Implementation Plan | `standards/DS-051_implementation_plan.md` | Task planning |
| Atomic Tasks | `standards/DS-052_atomic_tasks.md` | Execution units |
| Code Review | `standards/DS-060_code_review.md` | Automated code review |

## Technology Stack Reference

| Layer | Technology | Docs |
|-------|------------|------|
| Frontend UI | React 19 + TypeScript | `src/` |
| App Shell | Tauri v2 (Rust) | `src-tauri/` |
| Backend | Python FastAPI | `python_service/` |
| AI | DeepSeek API | `python_service/ai_*.py` |
| Data | Yahoo Finance, 通达信 DB | `python_service/data_*.py` |

## Version Info

| Component | Version |
|-----------|---------|
| CDD Framework | v1.5.0 |
| Project | MY-DOGE-MICRO |
| Technical Law | v1.0.0 |
