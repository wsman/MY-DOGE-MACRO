# DS-060: Code Review Standard

**Feature ID**: TOOL-REV-001  
**Category**: Spec-Kit Tool Integration  
**Version**: v1.0.0  
**Date**: 2026-02-02

## 1. Purpose

This standard defines the Code Review tool integration in the spec-kit framework, providing automated code review workflows for the CDD development process.

## 2. Scope

- Code Review template definition
- Review command specification
- Automation script integration
- CDD framework registration

## 3. Template Definition

### File: `spec-kit/templates/review-template.md`

```markdown
# Code Review Report

**Target**: {{TARGET_FILES}}
**Reviewer**: AI Agent
**Date**: {{DATE}}

## 1. Summary
{{SUMMARY}}

## 2. Critical Issues (Blockers)
| Severity | File | Line | Issue | Recommendation |
|----------|------|------|-------|----------------|
| 🔴 Critical | | | | |
| 🟠 Major | | | | |

## 3. Suggestions (Non-blocking)
| Category | File | Line | Issue | Recommendation |
|----------|------|------|-------|----------------|
| 🟡 Style | | | | |
| 🟢 Perf | | | | |
| 🔵 Docs | | | | |

## 4. Refactoring Recommendations
{{REFACTORING_NOTES}}

## 5. Security Analysis
{{SECURITY_NOTES}}

## 6. Test Coverage Assessment
{{TEST_COVERAGE_NOTES}}

**Review Score**: {{SCORE}}/100  
**Overall Assessment**: {{ASSESSMENT}}
```

## 4. Command Specification

### File: `spec-kit/templates/commands/review.md`

**Command**: Review

**Goal**: Conduct a comprehensive code review for the provided code context.

**Instructions**:
1. Analyze code against Clean Code, SOLID, OWASP guidelines
2. Identify security vulnerabilities, logic errors, performance issues
3. Prioritize findings by severity (Critical/Major/Minor)
4. Use template for consistent output

**Constraints**:
- Quote specific line numbers
- Prioritize security over style
- Provide actionable recommendations

## 5. Automation Script

### File: `spec-kit/scripts/bash/run-review.sh`

**Usage**:
```bash
./spec-kit/scripts/bash/run-review.sh [target]
```

**Functionality**:
- Validates git repository
- Loads review template and command
- Generates review prompt
- Outputs for AI agent

## 6. CDD Integration

### Register in `cdd_config.yaml`:

```yaml
spec_kit:
  templates:
    review: "spec-kit/templates/review-template.md"
  commands:
    review: "spec-kit/templates/commands/review.md"
  scripts:
    review: "spec-kit/scripts/bash/run-review.sh"
```

## 7. Usage in CDD Workflow

### State D (Verification) Integration

During State D, the Code Review tool can be invoked as a secondary validation step:

```bash
# Run code review on changed files
./spec-kit/scripts/bash/run-review.sh

# Copy output to AI agent context
```

## 8. Quality Criteria

| Criterion | Requirement |
|-----------|-------------|
| Issue Identification | All critical issues must be flagged |
| Line References | Specific line numbers for all issues |
| Recommendations | Actionable fixes for each issue |
| Scoring | 0-100 scale with clear justification |

## 9. Related Documents

- DS-007: Context Management
- DS-050: Feature Specification
- DS-052: Atomic Tasks
- WF-201: CDD Workflow

---

*This standard follows CDD v1.5.0 specifications.*
