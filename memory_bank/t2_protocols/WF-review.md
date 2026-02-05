# WF-REVIEW: 代码审查协议

**ID**: WF-REVIEW  
**版本**: v1.6.0  
**触发**: 开发者请求 `/review` 或 State C 结束时  
**输入**: 变更的文件 (Git Diff) 或指定文件列表

---

## 1. 目标

利用 AI 对代码变更进行自动化、标准化的深度审查，确保代码不仅"能运行"，而且"符合宪法"。

## 2. 执行流程

### Step 1: 上下文加载
加载 T1 文档作为审查基准：
- `memory_bank/t1_axioms/system_patterns.md` (架构约束)
- `memory_bank/t1_axioms/tech_context.md` (技术栈约束)
- `memory_bank/t2_standards/DS-060_code_review.md` (输出标准)

### Step 2: 静态分析
1. **Diff 分析**: 识别新增/修改的逻辑
2. **模式匹配**: 检查是否违反 T1 约束
3. **漏洞扫描**: 检查常见安全漏洞模式

### Step 3: 报告生成
基于 DS-060 模板生成审查报告。

**规则**: 如果发现 Blocker，必须在报告顶部醒目提示

## 3. 交互示例

**User**: `/review src/auth/login.py`

**AI Action**:
1. Read `src/auth/login.py`
2. Load T1 Axioms
3. Generate Code Review Report

## 4. 评分标准

| Score | Assessment |
|-------|------------|
| 90-100 | Excellent |
| 75-89 | Good |
| 60-74 | Needs Improvement |
| <60 | Critical |

---

**版本**: v1.6.0
