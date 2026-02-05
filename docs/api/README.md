# API 文档中心

> **Version**: v1.8.0
> **Last Updated**: 2026-02-05

## 概述

MY-DOGE-MACRO 后端 API 基于 FastAPI 构建，提供量化分析和 AI 研报生成服务。

## 文档索引

| 文档 | 描述 |
|------|------|
| [API 参考](./api-reference.md) | 完整的 REST 和 WebSocket API 文档 |
| [技术指标](./indicators.md) | 技术指标公式和使用说明 |

## 快速入门

### 基础信息

| 项目 | 值 |
|------|-----|
| **基础 URL** | `http://localhost:8000` |
| **API 版本** | v1 |
| **数据格式** | JSON |
| **WebSocket** | `ws://localhost:8000/ws/{client_id}` |

### 核心端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/v1/market/{ticker}` | GET | 获取市场数据 |
| `/api/v1/indicators/{ticker}` | GET | 计算技术指标 |
| `/api/v1/analysis/rsrs/{ticker}` | GET | RSRS 分析 |
| `/api/v1/ai/report` | POST | 生成 AI 研报 |
| `/ws/{client_id}` | WS | 实时价格推送 |

### 示例请求

```bash
# 获取市场数据
curl http://localhost:8000/api/v1/market/AAPL?days=100

# 计算技术指标
curl http://localhost:8000/api/v1/indicators/AAPL?indicators=macd,rsi,kdj

# 生成 AI 研报
curl -X POST http://localhost:8000/api/v1/ai/report \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["AAPL", "BTC-USD"], "language": "zh"}'
```

## v1.8.0 新增功能

### WebSocket 实时推送

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/client-001');

// 订阅 ticker
ws.send(JSON.stringify({ action: 'subscribe', ticker: 'AAPL' }));

// 接收价格更新
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data); // { type: 'price_update', ticker: 'AAPL', data: {...} }
};
```

### 技术指标 API

支持的指标:
- **MA**: 简单移动平均
- **EMA**: 指数移动平均
- **MACD**: 指数平滑异同移动平均
- **RSI**: 相对强弱指数
- **KDJ**: 随机指标
- **Bollinger**: 布林带
- **ATR**: 平均真实波幅

### 通达信数据源

当本地安装了通达信软件时，API 可自动读取 A 股历史数据:

```bash
# 自动检测通达信路径
GET /api/v1/tdx/status

# 读取 A 股数据
GET /api/v1/tdx/data/600000?days=250
```

## 详细文档

- [完整 API 参考](./api-reference.md) - 所有端点的详细说明
- [技术指标文档](./indicators.md) - 指标公式和信号解释

---

*文档版本: v1.8.0 | 更新日期: 2026-02-05*
