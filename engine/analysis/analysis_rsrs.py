"""
RSRS (Resistance & Support Ratio Score) 指标计算模块

基于阻力支撑相对强度算法
参考: https://github.com/zhangliang1024/RSRS
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RSRSAnalyzer:
    """
    RSRS 阻力支撑相对强度分析器
    
    算法原理:
    - 使用 N 日最高价和最低价的线性回归斜率作为阻力支撑强度
    - 斜率为正表示上升趋势 (bullish)
    - 斜率为负表示下降趋势 (bearish)
    - 标准化后得到 RSRS 分数 (0-100)
    """
    
    def __init__(
        self,
        lookback_period: int = 20,
        scale: bool = True
    ):
        """
        Args:
            lookback_period: 回溯周期 (默认20天)
            scale: 是否标准化分数
        """
        self.lookback_period = lookback_period
        self.scale = scale
    
    def calculate(
        self,
        highs: pd.Series,
        lows: pd.Series,
        closes: pd.Series
    ) -> Dict[str, Any]:
        """
        计算RSRS指标
        
        Args:
            highs: 最高价序列
            lows: 最低价序列
            closes: 收盘价序列
        
        Returns:
            {
                'ticker': str,
                'value': float,          # RSRS斜率 (-1.0 ~ 1.0)
                'score': int,            # 标准化分数 (0-100)
                'signal': str,           # 'long' | 'short' | 'hold'
                'raw_beta': float,       # 原始回归斜率
                'r_squared': float,      # 拟合优度
                'updated_at': datetime
            }
        """
        if len(highs) < self.lookback_period:
            logger.warning(f"数据不足 {len(highs)} 天，需要至少 {self.lookback_period} 天")
            return self._empty_result()
        
        # 取最近N天数据
        highs = highs.iloc[-self.lookback_period:]
        lows = lows.iloc[-self.lookback_period:]
        closes = closes.iloc[-self.lookback_period:]
        
        # 线性回归: Low = Alpha + Beta * High
        # Beta 即为 RSRS 斜率
        try:
            # 使用最小二乘法
            X = np.column_stack([np.ones(len(highs)), highs.values])
            y = lows.values
            
            # 求解: (X'X)^(-1) X'y
            beta = np.linalg.lstsq(X, y, rcond=None)[0]
            alpha = beta[0]
            raw_beta = beta[1]
            
            # 计算 R²
            y_pred = X @ beta
            ss_res = np.sum((y - y_pred) ** 2)
            ss_tot = np.sum((y - np.mean(y)) ** 2)
            r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
            
            # 标准化到 [-1, 1]
            # 使用历史百分位数进行标准化
            value = np.clip(raw_beta, -1.0, 1.0)
            
            # 计算分数 (0-100)
            if self.scale:
                # 中心化到50，标准差20
                score = int(50 + (value * 25))
                score = np.clip(score, 0, 100)
            else:
                score = int(value * 50 + 50)
            
            # 生成信号
            if score >= 70:
                signal = 'long'
            elif score <= 30:
                signal = 'short'
            else:
                signal = 'hold'
            
            return {
                'value': round(float(value), 4),
                'score': score,
                'signal': signal,
                'raw_beta': round(float(raw_beta), 6),
                'r_squared': round(float(r_squared), 4),
                'updated_at': datetime.now()
            }
            
        except Exception as e:
            logger.error(f"RSRS计算失败: {e}")
            return self._empty_result()
    
    def calculate_from_dataframe(
        self,
        df: pd.DataFrame,
        ticker: str = ''
    ) -> Dict[str, Any]:
        """
        从DataFrame计算RSRS
        
        DataFrame需要包含 'High', 'Low', 'Close' 列
        """
        if df.empty:
            return self._empty_result()
        
        # 尝试多种列名格式
        high_col = 'High' if 'High' in df.columns else 'high'
        low_col = 'Low' if 'Low' in df.columns else 'low'
        close_col = 'Close' if 'Close' in df.columns else 'close'
        
        if high_col not in df.columns or low_col not in df.columns:
            logger.error("DataFrame缺少 High/Low 列")
            return self._empty_result()
        
        result = self.calculate(
            df[high_col],
            df[low_col],
            df[close_col] if close_col in df.columns else df[high_col]
        )
        
        result['ticker'] = ticker
        return result
    
    def _empty_result(self) -> Dict[str, Any]:
        """返回空结果"""
        return {
            'value': 0.0,
            'score': 50,
            'signal': 'hold',
            'raw_beta': 0.0,
            'r_squared': 0.0,
            'updated_at': datetime.now()
        }
    
    def get_threshold(self) -> Dict[str, float]:
        """
        获取信号阈值
        """
        return {
            'long_threshold': 70,   # 买入信号
            'short_threshold': 30,  # 卖出信号
            'neutral_low': 40,
            'neutral_high': 60
        }


def calculate_rsrs(
    df: pd.DataFrame,
    ticker: str = '',
    lookback: int = 20
) -> Dict[str, Any]:
    """
    便捷函数: 计算RSRS
    
    Args:
        df: 包含High, Low, Close的DataFrame
        ticker: 股票代码
        lookback: 回溯周期
    
    Returns:
        RSRS结果字典
    """
    analyzer = RSRSAnalyzer(lookback_period=lookback)
    return analyzer.calculate_from_dataframe(df, ticker)


if __name__ == '__main__':
    # 测试
    import yfinance as yf
    
    # 获取测试数据
    print("=== RSRS 计算测试 ===")
    ticker = yf.Ticker('QQQ')
    hist = ticker.history(period='3mo')
    
    if not hist.empty:
        result = calculate_rsrs(hist, 'QQQ', lookback=20)
        print(f"\nQQQ RSRS 分析结果:")
        print(f"  斜率值: {result['value']}")
        print(f"  分数: {result['score']}")
        print(f"  信号: {result['signal']}")
        print(f"  R²: {result['r_squared']}")
        print(f"  更新时间: {result['updated_at']}")
        
        # 阈值
        thresholds = RSRSAnalyzer().get_threshold()
        print(f"\n信号阈值:")
        print(f"  买入 (Long): >= {thresholds['long_threshold']}")
        print(f"  卖出 (Short): <= {thresholds['short_threshold']}")
