# MY-DOGE-MACRO 技术指标文档

**版本**: v1.8.0  
**更新日期**: 2026-02-05

## 概述

MY-DOGE-MACRO 支持多种技术指标，用于量化分析和交易信号生成。

---

## 趋势指标

### MA (简单移动平均线)

**公式**:
$$MA_n = \frac{1}{n} \sum_{i=0}^{n-1} P_{t-i}$$

**参数**:
- n: 周期 (常用 5, 10, 20, 60, 250)

**用途**: 判断趋势方向，支撑/阻力位

---

### EMA (指数移动平均线)

**公式**:
$$EMA_t = P_t \cdot k + EMA_{t-1} \cdot (1-k)$$
$$k = \frac{2}{n+1}$$

**参数**:
- n: 周期 (常用 12, 26)

**用途**: 对近期价格更敏感，常用于 MACD 计算

---

### MACD (指数平滑异同移动平均线)

**公式**:
$$DIF = EMA_{12} - EMA_{26}$$
$$DEA = EMA_9(DIF)$$
$$MACD = 2 \cdot (DIF - DEA)$$

**信号**:
- DIF 上穿 DEA → 金叉 (买入)
- DIF 下穿 DEA → 死叉 (卖出)
- 柱状图由负转正 → 多头增强

---

## 震荡指标

### RSI (相对强弱指数)

**公式**:
$$RSI = 100 - \frac{100}{1 + RS}$$
$$RS = \frac{平均上涨幅度}{平均下跌幅度}$$

**参数**:
- 周期: 14 (默认), 6 (短期)

**信号**:
- RSI > 70 → 超买
- RSI < 30 → 超卖
- 背离信号

---

### KDJ (随机指标)

**公式**:
$$RSV = \frac{C - L_n}{H_n - L_n} \times 100$$
$$K = \frac{2}{3} K_{t-1} + \frac{1}{3} RSV$$
$$D = \frac{2}{3} D_{t-1} + \frac{1}{3} K$$
$$J = 3K - 2D$$

**参数**:
- n: RSV 周期 (默认 9)

**信号**:
- K 上穿 D → 金叉 (买入)
- K 下穿 D → 死叉 (卖出)
- J > 100 → 超买
- J < 0 → 超卖

---

## 波动率指标

### 布林带 (Bollinger Bands)

**公式**:
$$中轨 = MA_{20}$$
$$上轨 = MA_{20} + 2\sigma$$
$$下轨 = MA_{20} - 2\sigma$$

**参数**:
- 周期: 20
- 标准差倍数: 2

**信号**:
- 价格触及上轨 → 可能回调
- 价格触及下轨 → 可能反弹
- 带宽收窄 → 即将突破

---

### ATR (平均真实波幅)

**公式**:
$$TR = max(H-L, |H-C_{prev}|, |L-C_{prev}|)$$
$$ATR = MA_{14}(TR)$$

**用途**: 止损设置、仓位管理

---

## RSRS (阻力支撑相对强度)

**公式**:
$$RSRS = \beta (回归斜率)$$

使用 OLS 回归: $High = \alpha + \beta \cdot Low$

**参数**:
- 回归周期: 18
- 标准化周期: 600

**信号**:
- RSRS z-score > 0.7 → 看多
- RSRS z-score < -0.7 → 看空

---

## 波动率偏度

**公式**:
$$Skew = \frac{E[(R-\mu)^3]}{\sigma^3}$$

**信号**:
- 正偏度 → 上涨风险
- 负偏度 → 下跌风险

---

## 信号综合

系统根据多个指标生成综合信号:

| 看涨信号数 | 看跌信号数 | 综合判断 |
|------------|------------|----------|
| > 看跌 | < 看涨 | 看涨 |
| < 看跌 | > 看涨 | 看跌 |
| = 看跌 | = 看涨 | 中性 |

---

## 代码示例

### Python (后端)

```python
from libs.quant_engine.analysis.technical_indicators import (
    calculate_macd,
    calculate_rsi,
    calculate_kdj,
    calculate_all_indicators
)

# 计算所有指标
indicators = calculate_all_indicators(ohlc_data)

# 单独计算 MACD
macd, signal, histogram = calculate_macd(closes)
```

### TypeScript (前端)

```typescript
import { calculateMACD, calculateRSI, calculateKDJ } from '@components/charts';

const macd = calculateMACD(closes);
const rsi = calculateRSI(closes, 14);
const kdj = calculateKDJ(ohlcData);
```
