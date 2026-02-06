# MY-DOGE-MACRO API 参考文档

**版本**: v1.8.1  
**更新日期**: 2026-02-07

## 概述

MY-DOGE-MACRO 后端 API 基于 FastAPI 构建，采用模块化架构(v1.8.1)，提供以下功能：

- 市场数据获取
- 技术指标计算
- AI 研报生成
- WebSocket 实时推送

## 基础信息

| 项目 | 值 |
|------|-----|
| 基础 URL | `http://localhost:8000` |
| API 版本 | v1 |
| 认证方式 | Bearer Token (可选) |
| 数据格式 | JSON |

---

## REST API 端点

### 市场数据

#### GET /api/v1/market/{ticker}

获取单个资产的市场数据。

**参数**:
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| ticker | string | 是 | 资产代码 (如 AAPL, BTC-USD) |
| period | string | 否 | 周期 (1d, 1w, 1mo) |
| days | int | 否 | 获取天数 (默认 100) |

**响应**:
```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "data": [
    {
      "date": "2026-02-05",
      "open": 173.50,
      "high": 175.20,
      "low": 172.80,
      "close": 174.90,
      "volume": 50000000
    }
  ],
  "meta": {
    "source": "yfinance",
    "updated_at": "2026-02-05T10:00:00Z"
  }
}
```

#### GET /api/v1/market/batch

批量获取多个资产数据。

**参数**:
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| tickers | string | 是 | 逗号分隔的资产代码 |

---

### 技术指标

#### GET /api/v1/indicators/{ticker}

计算技术指标。

**参数**:
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| ticker | string | 是 | 资产代码 |
| indicators | string | 否 | 指标列表 (ma,ema,macd,rsi,kdj,bollinger) |
| ma_periods | string | 否 | MA 周期 (如 5,10,20) |

**响应**:
```json
{
  "ticker": "AAPL",
  "indicators": {
    "ma": {
      "ma5": [null, null, null, null, 173.5, ...],
      "ma10": [...]
    },
    "macd": {
      "macd": [...],
      "signal": [...],
      "histogram": [...]
    },
    "rsi": {
      "rsi14": [...]
    },
    "kdj": {
      "k": [...],
      "d": [...],
      "j": [...]
    }
  },
  "signals": {
    "overall": "bullish",
    "bullish_count": 2,
    "bearish_count": 1,
    "details": [
      {"indicator": "MACD", "signal": "bullish", "reason": "MACD > Signal"}
    ]
  }
}
```

---

### RSRS 分析

#### GET /api/v1/analysis/rsrs/{ticker}

计算 RSRS 指标。

**响应**:
```json
{
  "ticker": "AAPL",
  "rsrs": {
    "value": 0.85,
    "z_score": 1.2,
    "signal": "long",
    "percentile": 75
  }
}
```

---

### 波动率分析

#### GET /api/v1/analysis/volatility/{ticker}

计算波动率偏度。

**响应**:
```json
{
  "ticker": "AAPL",
  "volatility": {
    "value": 0.25,
    "skew": -0.15,
    "signal": "medium",
    "regime": "normal"
  }
}
```

---

### AI 研报

#### POST /api/v1/ai/report

生成 AI 研报。

**请求体**:
```json
{
  "tickers": ["AAPL", "GOOGL", "BTC-USD"],
  "analysis_type": "macro",
  "language": "zh"
}
```

**响应**:
```json
{
  "id": "report-001",
  "title": "全球科技股与数字货币联动分析",
  "summary": "当前市场呈现...",
  "content": "详细分析内容...",
  "sentiment": "bullish",
  "confidence": 0.85,
  "tickers": ["AAPL", "GOOGL", "BTC-USD"],
  "generated_at": "2026-02-05T10:00:00Z",
  "model": "deepseek-chat"
}
```

---

## WebSocket API

### 连接

```
ws://localhost:8000/ws/{client_id}
```

### 消息格式

#### 订阅
```json
{
  "action": "subscribe",
  "ticker": "AAPL"
}
```

#### 取消订阅
```json
{
  "action": "unsubscribe",
  "ticker": "AAPL"
}
```

#### 心跳
```json
{
  "action": "ping"
}
```

### 推送消息

#### 价格更新
```json
{
  "type": "price_update",
  "ticker": "AAPL",
  "data": {
    "price": 174.90,
    "change": 0.5,
    "volume": 1000000
  },
  "timestamp": "2026-02-05T10:00:00Z"
}
```

---

## 错误处理

### 错误响应格式
```json
{
  "error": {
    "code": "INVALID_TICKER",
    "message": "无效的资产代码",
    "details": {}
  }
}
```

### 错误代码

| 代码 | 描述 |
|------|------|
| INVALID_TICKER | 无效的资产代码 |
| DATA_NOT_FOUND | 数据未找到 |
| RATE_LIMITED | 请求频率过高 |
| AI_ERROR | AI 服务错误 |
| INTERNAL_ERROR | 内部服务器错误 |

---

## 速率限制

| 端点 | 限制 |
|------|------|
| 市场数据 | 100 次/分钟 |
| 技术指标 | 60 次/分钟 |
| AI 研报 | 10 次/分钟 |
| WebSocket | 无限制 |
