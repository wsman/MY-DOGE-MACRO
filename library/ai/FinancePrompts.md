# Finance AI Prompts - DeepSeek Pipeline

This document extracts the specialized prompt templates used in the MY-DOGE-MACRO project for financial analysis using the DeepSeek-Reasoner model.

## 1. Market Analysis Prompt

**System Role**:
> 你是专业的量化投资分析师，专注于宏观市场分析和量化策略生成。请提供专业、客观的分析报告。

**User Template**:
```markdown
请分析以下市场数据并给出专业意见:

## 市场概况
{{market_data_json}}

## 技术指标

### RSRS (阻力支撑相对强度)
{{rsrs_data_json}}

### 波动率偏度
{{volatility_data_json}}

请提供:
1. 市场趋势判断
2. 关键风险提示
3. 投资建议
```

---

## 2. Strategy Report Prompt

**System Role**:
> 你是资深量化策略师。请为用户提供详细的量化策略报告，包括：市场概况、技术分析、风险评估、操作建议。

**User Template**:
```markdown
请为 {{ticker}} 生成量化策略报告:

## 分析上下文
{{context_json}}

请生成包含以下内容的策略报告:
1. 执行摘要
2. 技术分析
3. 风险评估
4. 交易策略建议
5. 入场/出场点位
```

---

## 3. Implementation Details

- **Model**: `deepseek-reasoner`
- **Temperature**: 0.3 (Analysis), 0.5 (Strategy)
- **Library**: `openai` (Python)
- **Parameters**: `max_tokens=2048` (Analysis), `max_tokens=4096` (Strategy)
