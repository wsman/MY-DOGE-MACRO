# v1.4.0 Infrastructure & Quality - Implementation Plan

> **Version**: v1.4.0
> **Parent Spec**: DS-050_v140_infrastructure.md
> **Type**: Implementation Plan
> **Status**: 🔄 Draft (State B)

---

## 📊 Task Breakdown

### T-I1: Fix Pre-commit Portability (P0) 🟠

**Objective**: Replace absolute paths with relative paths in `.pre-commit-config.yaml`

**Steps**:
1.1 Update `cdd-version-check` entry point
1.2 Update `cdd-entropy-check` entry point  
1.3 Update `cdd-test-runner` entry point
1.4 Verify hooks work in local environment
1.5 Test on clean checkout (simulate new user)

**Estimated Effort**: 2 hours

**Verification Criteria**:
- ✅ `pre-commit run --all-files` passes
- ✅ Hooks execute from project root
- ✅ No hardcoded `/home/wsman/` paths remain

**Dependencies**: None

---

### T-I2: Enable CI/CD Checks (P1) 🟡

**Objective**: Remove skip flags and ensure CDD checks run in GitHub Actions

**Steps**:
2.1 Review current `.github/workflows/ci-cd.yml`
2.2 Remove `ci.skip` directive
2.3 Add environment setup for CDD tools
2.4 Configure conditional execution (skip if tools missing)
2.5 Verify CI passes with CDD checks

**Estimated Effort**: 4 hours

**Verification Criteria**:
- ✅ CI pipeline includes version check
- ✅ CI pipeline includes entropy check
- ✅ CI fails if version drift detected
- ✅ CI passes when system entropy ≤ 0.7

**Dependencies**: T-I1

---

### T-I3: Test Coverage Expansion (P1) 🟡

**Objective**: Increase backend test coverage to ≥80%

**Steps**:
3.1 Audit current coverage (run `pytest --cov`)
3.2 Identify gaps in `server/core/` modules
3.3 Add unit tests for `market_scanner.py`
3.4 Add unit tests for data processing modules
3.5 Add integration tests for API endpoints
3.6 Configure coverage reporting

**Estimated Effort**: 6 hours

**Verification Criteria**:
- ✅ Backend coverage ≥ 80%
- ✅ All critical paths tested
- ✅ Coverage report generated in CI

**Dependencies**: None

---

### T-I4: Documentation Update (P2) 🔵

**Objective**: Update project documentation for new infrastructure

**Steps**:
4.1 Update `README.md` with new setup instructions
4.2 Update `.pre-commit-config.yaml` comments
4.3 Add `CONTRIBUTING.md` for infrastructure guidelines
4.4 Update `memory_bank/core/project_readme.md`

**Estimated Effort**: 2 hours

**Verification Criteria**:
- ✅ New developers can set up in <10 minutes
- ✅ Pre-commit installation documented
- ✅ CI/CD pipeline documented

**Dependencies**: T-I1, T-I2

---

## 📅 Timeline

```
Week 1:
├── Mon: T-I1 (2h)
├── Tue: T-I2 (4h)
├── Wed: T-I3 (4h)
└── Thu: T-I3 (2h) + Review

Week 2:
├── Mon: T-I4 (2h)
├── Tue: State D (Verification)
└── Wed: State E (Convergence)
```

---

## 🔧 Resource Requirements

| Resource | Amount | Notes |
|----------|--------|-------|
| Developer Time | ~16 hours | Single developer |
| CI Compute | ~30 min/run | GitHub Actions |
| Storage | +2 MB | scripts/ directory |

---

## 📈 Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Pre-commit portability | 0% | 100% | Works on clean checkout |
| CI CDD coverage | 0% | 100% | Checks run in CI |
| Backend coverage | ~60% | ≥80% | pytest --cov |
| Setup time | ~30 min | <10 min | New developer onboarding |

---

## ⚠️ Rollback Plan

If T-I1 or T-I2 introduces issues:

1. **Revert** to previous `.pre-commit-config.yaml`
2. **Restore** `ci.skip` in CI configuration
3. **Deploy** hotfix release v1.4.1

---

## ✅ Approval Checklist

- [ ] Technical approach approved
- [ ] Timeline accepted
- [ ] Resource allocation confirmed
- [ ] Risk mitigation reviewed

---

*Generated via CDD v1.6.1 Workflow*
