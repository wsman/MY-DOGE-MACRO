# {{feature_name}} 特性

**特性ID**: {{feature_id}}  
**创建时间**: {{timestamp}}  
**状态**: Draft → Review → Approved → Implemented  
**分支**: `{{git_branch}}`

## 特性概述

{{feature_description}}

## 相关文档

| 文档 | 用途 | 状态 |
|------|------|------|
| [DS-050_{{feature_id}}_spec.md](DS-050_{{feature_id}}_spec.md) | 特性规范 | Draft |
| [DS-051_{{feature_id}}_plan.md](DS-051_{{feature_id}}_plan.md) | 实施计划 | Draft |
| [DS-052_{{feature_id}}_tasks.md](DS-052_{{feature_id}}_tasks.md) | 原子任务 | Draft |

## CDD合规性检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 架构一致性 (`system_patterns.md`) | ☐ | 符合目录结构约束 |
| 接口兼容性 (`tech_context.md`) | ☐ | 复用现有接口或定义新接口 |
| 行为约束 (`behavior_context.md`) | ☐ | 不违反业务不变量 |
| 熵值影响预估 (`active_context.md`) | ☐ | 预计对系统熵值的影响 |

## 下一步行动

1. **填写特性规范** (DS-050_{{feature_id}}_spec.md)
2. **制定实施计划** (DS-051_{{feature_id}}_plan.md)
3. **创建原子任务** (DS-052_{{feature_id}}_tasks.md)
4. **开始开发** (遵循 CDD 五状态工作流)

## 版本信息

- **项目版本**: {{project_version}}
- **活跃上下文版本**: {{active_context_version}}
- **系统模式版本**: {{system_patterns_version}}
- **创建者**: {{author}}

---

*遵循 CDD 宪法驱动开发工作流*
