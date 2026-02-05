# API Reference

> **Version**: v1.6.0
> **Base URL**: `http://localhost:8000`

## 概述

MY-DOGE-MACRO 后端 API 基于 FastAPI 构建，提供量化分析和 AI 研报生成服务。

## 端点列表

### 健康检查

```
GET /health
```

返回服务健康状态。

### 宏观分析

```
POST /api/macro/analyze
```

执行宏观市场分析。

**请求体**:
```json
{
  "symbols": ["AAPL", "GOOGL", "MSFT"],
  "period": "1y",
  "indicators": ["rsi", "macd", "rsrs"]
}
```

**响应**:
```json
{
  "status": "success",
  "data": {
    "analysis": {...},
    "timestamp": "2026-02-05T22:00:00Z"
  }
}
```

### 微观分析

```
POST /api/micro/scan
```

执行个股扫描和分析。

### AI 研报生成

```
POST /api/report/generate
```

生成 AI 驱动的研究报告。

## 认证

当前版本不需要认证。生产环境将添加 API Key 认证。

## 错误处理

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |

---

*文档版本: v1.6.0 | 更新日期: 2026-02-05*
