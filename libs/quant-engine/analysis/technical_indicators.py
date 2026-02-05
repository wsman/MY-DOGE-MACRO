# 技术指标计算模块
# Created: 2026-02-05 (v1.8.0)
# Indicators: MA, EMA, MACD, RSI, Bollinger, KDJ

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class OHLCData:
    """OHLC 数据结构"""
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


def calculate_ma(closes: np.ndarray, period: int) -> np.ndarray:
    """简单移动平均线"""
    result = np.full(len(closes), np.nan)
    for i in range(period - 1, len(closes)):
        result[i] = np.mean(closes[i - period + 1:i + 1])
    return result


def calculate_ema(closes: np.ndarray, period: int) -> np.ndarray:
    """指数移动平均线"""
    result = np.full(len(closes), np.nan)
    multiplier = 2 / (period + 1)
    
    # 第一个 EMA 值使用 SMA
    result[period - 1] = np.mean(closes[:period])
    
    # 后续使用 EMA 公式
    for i in range(period, len(closes)):
        result[i] = (closes[i] - result[i - 1]) * multiplier + result[i - 1]
    
    return result


def calculate_macd(
    closes: np.ndarray,
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    MACD 指标
    Returns: (macd, signal, histogram)
    """
    ema_fast = calculate_ema(closes, fast_period)
    ema_slow = calculate_ema(closes, slow_period)
    
    macd = ema_fast - ema_slow
    
    # Signal line (EMA of MACD)
    valid_macd = macd[~np.isnan(macd)]
    signal_values = calculate_ema(valid_macd, signal_period)
    
    signal = np.full(len(closes), np.nan)
    signal_start = len(closes) - len(signal_values)
    signal[signal_start:] = signal_values
    
    histogram = macd - signal
    
    return macd, signal, histogram


def calculate_rsi(closes: np.ndarray, period: int = 14) -> np.ndarray:
    """RSI 相对强弱指数"""
    result = np.full(len(closes), np.nan)
    
    # 计算价格变化
    deltas = np.diff(closes)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    
    for i in range(period, len(closes)):
        avg_gain = np.mean(gains[i - period:i])
        avg_loss = np.mean(losses[i - period:i])
        
        if avg_loss == 0:
            result[i] = 100
        else:
            rs = avg_gain / avg_loss
            result[i] = 100 - (100 / (1 + rs))
    
    return result


def calculate_bollinger(
    closes: np.ndarray,
    period: int = 20,
    std_dev: float = 2.0
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    布林带
    Returns: (upper, middle, lower)
    """
    middle = calculate_ma(closes, period)
    upper = np.full(len(closes), np.nan)
    lower = np.full(len(closes), np.nan)
    
    for i in range(period - 1, len(closes)):
        std = np.std(closes[i - period + 1:i + 1])
        upper[i] = middle[i] + std_dev * std
        lower[i] = middle[i] - std_dev * std
    
    return upper, middle, lower


def calculate_kdj(
    highs: np.ndarray,
    lows: np.ndarray,
    closes: np.ndarray,
    period: int = 9
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    KDJ 随机指标
    Returns: (K, D, J)
    """
    k = np.full(len(closes), np.nan)
    d = np.full(len(closes), np.nan)
    j = np.full(len(closes), np.nan)
    
    for i in range(period - 1, len(closes)):
        highest_high = np.max(highs[i - period + 1:i + 1])
        lowest_low = np.min(lows[i - period + 1:i + 1])
        close = closes[i]
        
        if highest_high == lowest_low:
            rsv = 50
        else:
            rsv = (close - lowest_low) / (highest_high - lowest_low) * 100
        
        if i == period - 1:
            k[i] = 50
            d[i] = 50
        else:
            k[i] = (2 / 3) * k[i - 1] + (1 / 3) * rsv
            d[i] = (2 / 3) * d[i - 1] + (1 / 3) * k[i]
        
        j[i] = 3 * k[i] - 2 * d[i]
    
    return k, d, j


def calculate_atr(
    highs: np.ndarray,
    lows: np.ndarray,
    closes: np.ndarray,
    period: int = 14
) -> np.ndarray:
    """平均真实波幅 ATR"""
    result = np.full(len(closes), np.nan)
    
    # True Range
    tr = np.zeros(len(closes))
    tr[0] = highs[0] - lows[0]
    
    for i in range(1, len(closes)):
        tr1 = highs[i] - lows[i]
        tr2 = abs(highs[i] - closes[i - 1])
        tr3 = abs(lows[i] - closes[i - 1])
        tr[i] = max(tr1, tr2, tr3)
    
    # ATR (SMA of TR)
    for i in range(period - 1, len(closes)):
        result[i] = np.mean(tr[i - period + 1:i + 1])
    
    return result


def calculate_all_indicators(
    ohlc_data: List[Dict],
    ma_periods: List[int] = [5, 10, 20, 60],
    include_macd: bool = True,
    include_rsi: bool = True,
    include_bollinger: bool = True,
    include_kdj: bool = True
) -> Dict:
    """
    计算所有技术指标
    
    Args:
        ohlc_data: OHLC 数据列表
        ma_periods: 移动平均线周期列表
        include_macd: 是否包含 MACD
        include_rsi: 是否包含 RSI
        include_bollinger: 是否包含布林带
        include_kdj: 是否包含 KDJ
    
    Returns:
        包含所有指标的字典
    """
    df = pd.DataFrame(ohlc_data)
    closes = df['close'].values
    highs = df['high'].values
    lows = df['low'].values
    
    result = {
        "dates": df['date'].tolist() if 'date' in df.columns else list(range(len(df))),
        "ma": {},
        "ema": {}
    }
    
    # 移动平均线
    for period in ma_periods:
        result["ma"][f"ma{period}"] = calculate_ma(closes, period).tolist()
        result["ema"][f"ema{period}"] = calculate_ema(closes, period).tolist()
    
    # MACD
    if include_macd:
        macd, signal, histogram = calculate_macd(closes)
        result["macd"] = {
            "macd": macd.tolist(),
            "signal": signal.tolist(),
            "histogram": histogram.tolist()
        }
    
    # RSI
    if include_rsi:
        result["rsi"] = {
            "rsi14": calculate_rsi(closes, 14).tolist(),
            "rsi6": calculate_rsi(closes, 6).tolist()
        }
    
    # 布林带
    if include_bollinger:
        upper, middle, lower = calculate_bollinger(closes)
        result["bollinger"] = {
            "upper": upper.tolist(),
            "middle": middle.tolist(),
            "lower": lower.tolist()
        }
    
    # KDJ
    if include_kdj:
        k, d, j = calculate_kdj(highs, lows, closes)
        result["kdj"] = {
            "k": k.tolist(),
            "d": d.tolist(),
            "j": j.tolist()
        }
    
    # ATR
    result["atr"] = calculate_atr(highs, lows, closes).tolist()
    
    return result


# 信号生成函数
def generate_trading_signals(indicators: Dict) -> Dict:
    """根据指标生成交易信号"""
    signals = {
        "overall": "neutral",
        "details": []
    }
    
    bullish_count = 0
    bearish_count = 0
    
    # MACD 信号
    if "macd" in indicators:
        macd = indicators["macd"]["macd"]
        signal = indicators["macd"]["signal"]
        
        # 取最后有效值
        valid_macd = [v for v in macd if v is not None and not np.isnan(v)]
        valid_signal = [v for v in signal if v is not None and not np.isnan(v)]
        
        if valid_macd and valid_signal:
            if valid_macd[-1] > valid_signal[-1]:
                signals["details"].append({"indicator": "MACD", "signal": "bullish", "reason": "MACD > Signal"})
                bullish_count += 1
            else:
                signals["details"].append({"indicator": "MACD", "signal": "bearish", "reason": "MACD < Signal"})
                bearish_count += 1
    
    # RSI 信号
    if "rsi" in indicators:
        rsi = indicators["rsi"]["rsi14"]
        valid_rsi = [v for v in rsi if v is not None and not np.isnan(v)]
        
        if valid_rsi:
            last_rsi = valid_rsi[-1]
            if last_rsi > 70:
                signals["details"].append({"indicator": "RSI", "signal": "bearish", "reason": f"RSI={last_rsi:.1f} (超买)"})
                bearish_count += 1
            elif last_rsi < 30:
                signals["details"].append({"indicator": "RSI", "signal": "bullish", "reason": f"RSI={last_rsi:.1f} (超卖)"})
                bullish_count += 1
            else:
                signals["details"].append({"indicator": "RSI", "signal": "neutral", "reason": f"RSI={last_rsi:.1f}"})
    
    # KDJ 信号
    if "kdj" in indicators:
        k = indicators["kdj"]["k"]
        d = indicators["kdj"]["d"]
        
        valid_k = [v for v in k if v is not None and not np.isnan(v)]
        valid_d = [v for v in d if v is not None and not np.isnan(v)]
        
        if valid_k and valid_d:
            if valid_k[-1] > valid_d[-1]:
                signals["details"].append({"indicator": "KDJ", "signal": "bullish", "reason": "K > D"})
                bullish_count += 1
            else:
                signals["details"].append({"indicator": "KDJ", "signal": "bearish", "reason": "K < D"})
                bearish_count += 1
    
    # 综合信号
    if bullish_count > bearish_count:
        signals["overall"] = "bullish"
    elif bearish_count > bullish_count:
        signals["overall"] = "bearish"
    else:
        signals["overall"] = "neutral"
    
    signals["bullish_count"] = bullish_count
    signals["bearish_count"] = bearish_count
    
    return signals
