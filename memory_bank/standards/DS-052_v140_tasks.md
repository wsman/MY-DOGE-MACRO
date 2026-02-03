# v1.4.0 Infrastructure & Quality - Atomic Tasks

> **Version**: v1.4.0
> **Parent Plan**: DS-051_v140_implementation.md
> **Type**: Atomic Task List
> **Status**: 🔄 Draft (State B)

---

## 🎯 Master Task List

### **Phase 1: Pre-commit Portability (T-I1)**

| ID | Task | Status | Effort | Owner |
|:---|:---|:---:|:---:|:---:|
| **T-I1.1** | Update `cdd-version-check` entry to relative path | ⏳ Pending | 30min | @agent |
| **T-I1.2** | Update `cdd-entropy-check` entry to relative path | ⏳ Pending | 30min | @agent |
| **T-I1.3** | Update `cdd-test-runner` entry to relative path | ⏳ Pending | 30min | @agent |
| **T-I1.4** | Verify hooks execute from project root | ⏳ Pending | 30min | @agent |
| **T-I1.5** | Test on simulated clean checkout | ⏳ Pending | 30min | @agent |

**Subtotal**: 2.5 hours

---

### **Phase 2: CI/CD Integration (T-I2)**

| ID | Task | Status | Effort | Owner |
|:---|:---|:---:|:---:|:---:|
| **T-I2.1** | Review current `.github/workflows/ci-cd.yml` | ⏳ Pending | 30min | @agent |
| **T-I2.2** | Remove `ci.skip` directive | ⏳ Pending | 15min | @agent |
| **T-I2.3** | Add environment setup for CDD tools | ⏳ Pending | 1h | @agent |
| **T-I2.4** | Configure conditional execution | ⏳ Pending | 1h | @agent |
| **T-I2.5** | Verify CI passes with CDD checks | ⏳ Pending | 1h | @agent |

**Subtotal**: 3.75 hours

---

### **Phase 3: Test Coverage (T-I3)**

| ID | Task | Status | Effort | Owner |
|:---|:---|:---:|:---:|:---:|
| **T-I3.1** | Run `pytest --cov` to audit baseline | ⏳ Pending | 15min | @agent |
| **T-I3.2** | Identify coverage gaps in `server/core/` | ⏳ Pending | 1h | @agent |
| **T-I3.3** | Add tests for `market_scanner.py` | ⏳ Pending | 2h | @agent |
| **T-I3.4** | Add tests for data processing modules | ⏳ Pending | 2h | @agent |
| **T-I3.5** | Add integration tests for API endpoints | ⏳ Pending | 2h | @agent |
| **T-I3.6** | Configure coverage reporting | ⏳ Pending | 30min | @agent |

**Subtotal**: 7.75 hours

---

### **Phase 4: Documentation (T-I4)**

| ID | Task | Status | Effort | Owner |
|:---|:---|:---:|:---:|:---:|
| **T-I4.1** | Update `README.md` setup instructions | ⏳ Pending | 30min | @agent |
| **T-I4.2** | Update `.pre-commit-config.yaml` comments | ⏳ Pending | 15min | @agent |
| **T-I4.3** | Create `CONTRIBUTING.md` | ⏳ Pending | 1h | @agent |
| **T-I4.4** | Update `memory_bank/core/project_readme.md` | ⏳ Pending | 15min | @agent |

**Subtotal**: 2 hours

---

## 📊 Effort Summary

| Phase | Tasks | Total Effort |
|-------|-------|--------------|
| T-I1: Pre-commit | 5 | 2.5h |
| T-I2: CI/CD | 5 | 3.75h |
| T-I3: Testing | 6 | 7.75h |
| T-I4: Docs | 4 | 2h |
| **Total** | **20** | **~16 hours** |

---

## 🔄 State Transitions

```
State B (Planning)
    ↓ [Approval]
State C (Execute)
    ├── T-I1.x (Pre-commit)
    ├── T-I2.x (CI/CD)
    ├── T-I3.x (Testing)
    └── T-I4.x (Docs)
    ↓ [All Complete]
State D (Verify) → cdd_audit.py
    ↓ [Pass]
State E (Close) → Update active_context.md
```

---

## 🚦 Start Conditions

- [x] DS-050 (Feature Spec) approved
- [x] DS-051 (Implementation Plan) drafted
- [x] DS-052 (Atomic Tasks) created
- [ ] **This document approved** ← Current State

---

## 📝 Approval

| Role | Name | Signature | Date |
|------|------|----------|------|
| Owner | @wsman | ⏳ | - |
| Architect | CDD Agent | ✅ | 2026-02-03 |

---

*Generated via CDD v1.6.1 Workflow*
