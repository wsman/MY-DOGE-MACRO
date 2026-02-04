"""
波动率偏度 (Volatility Skew) 分析模块

用于识别市场情绪和波动率结构
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class VolatilitySkewAnalyzer:
    """
    波动率偏度分析器
    
    原理:
    - 短期波动率 vs 长期波动率 的比率
    - 比率 > 1: 短期波动率更高，市场波动加剧
    - 比率 < 1: 长期波动率更高，市场相对平稳
    - 高偏度通常预示市场不确定性增加
    """
    
    def __init__(
        self,
        short_period: int = 5,
        long_period: int = 20,
        threshold_high: float = 1.5,
        threshold_low: float = 0.7
    ):
        """
        Args:
            short_period: 短期周期 (默认5天)
            long_period: 长期周期 (默认20天)
            threshold_high: 高波动阈值 (默认1.5)
            threshold_low: 低波动阈值 (默认0.7)
        """
        self.short_period = short_period
        self.long_period = long_period
        self.threshold_high = threshold_high
        self.threshold_low = threshold_low
    
    def calculate(
        self,
        closes: pd.Series
    ) -> Dict[str, Any]:
        """
        计算波动率偏度
        
        Args:
            closes: 收盘价序列
        
        Returns:
            {
                'ticker': str,
                'short_vol': float,    # 短期波动率 (年化)
                'long_vol': float,     # 长期波动率 (年化)
                'ratio': float,        # 偏度比率
                'signal': str,         # 'high' | 'normal' | 'low'
                'updated_at': datetime
            }
        """
        if len(closes) < self.long_period:
            logger.warning(f"数据不足 {len(closes)} 天，需要至少 {self.long_period} 天")
            return self._empty_result()
        
        # 计算日收益率
        returns = closes.pct_change().dropna()
        
        if len(returns) < self.long_period:
            return self._empty_result()
        
        # 计算滚动波动率 (标准差)
        short_vol = returns.iloc[-self.short_period:].std()
        long_vol = returns.iloc[-self.long_period:].std()
        
        # 年化波动率 (假设252个交易日)
        annualization_factor = np.sqrt(252)
        short_vol_annual = short_vol * annualization_factor
        long_vol_annual = long_vol * annualization_factor
        
        # 计算比率
        ratio = short_vol_annual / long_vol_annual if long_vol_annual > 0 else 1.0
        
        # 生成信号
        if ratio >= self.threshold_high:
            signal = 'high'
        elif ratio <= self.threshold_low:
            signal = 'low'
        else:
            signal = 'normal'
        
        return {
            'short_vol': round(float(short_vol_annual) * 100, 2),  # 转为百分比
            'long_vol': round(float(long_vol_annual) * 100, 2),
            'ratio': round(float(ratio), 4),
            'signal': signal,
            'updated_at': datetime.now()
        }
    
    def calculate_from_dataframe(
        self,
        df: pd.DataFrame,
        ticker: str = ''
    ) -> Dict[str, Any]:
        """
        从DataFrame计算波动率偏度
        """
        if df.empty:
            return self._empty_result()
        
        # 尝试多种列名格式
        close_col = 'Close' if 'Close' in df.columns else 'close'
        
        if close_col not in df.columns:
            logger.error("DataFrame缺少 Close 列")
            return self._empty_result()
        
        result = self.calculate(df[close_col])
        result['ticker'] = ticker
        return result
    
    def analyze_market_sentiment(
        self,
        volatility_data: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        分析市场情绪
        
        Args:
            volatility_data: 多个标的的波动率数据
                {
                    'QQQ': {'ratio': 1.2, 'signal': 'high'},
                    ...
                }
        
        Returns:
            市场情绪分析结果
        """
        if not volatility_data:
            return {'sentiment': 'unknown', 'confidence': 0}
        
        # 计算平均偏度
        ratios = [d['ratio'] for d in volatility_data.values()]
        avg_ratio = np.mean(ratios)
        
        # 计算高波动标的比例
        high_vol_count = sum(1 for d in volatility_data.values() if d['signal'] == 'high')
        high_vol_ratio = high_vol_count / len(volatility_data)
        
        # 综合判断
        if high_vol_ratio > 0.5:
            sentiment = 'fear'
            confidence = min(0.9, 0.5 + high_vol_ratio * 0.4)
        elif avg_ratio > 1.2:
            sentiment = 'caution'
            confidence = 0.6
        elif avg_ratio < 0.8:
            sentiment = 'complacent'
            confidence = 0.6
        else:
            sentiment = 'neutral'
            confidence = 0.5
        
        return {
            'sentiment': sentiment,
            'confidence': round(confidence, 2),
            'avg_ratio': round(avg_ratio, 4),
            'high_vol_ratio': round(high_vol_ratio, 2),
            'analyzed_symbols': len(volatility_data)
        }
    
    def _empty_result(self) -> Dict[str, Any]:
        """返回空结果"""
        return {
            'short_vol': 0.0,
            'long_vol': 0.0,
            'ratio': 1.0,
            'signal': 'normal',
            'updated_at': datetime.now()
        }
    
    def get_thresholds(self) -> Dict[str, float]:
        """
        获取阈值配置
        """
        return {
            'high_threshold': self.threshold_high,
            'low_threshold': self.threshold_low,
            'short_period': self.short_period,
            'long_period': self.long_period
        }


def calculate_volatility_skew(
    df: pd.DataFrame,
    ticker: str = '',
    short_period: int = 5,
    long_period: int = 20
) -> Dict[str, Any]:
    """
    便捷函数: 计算波动率偏度
    """
    analyzer = VolatilitySkewAnalyzer(
        short_period=short_period,
        long_period=long_period
    )
    return analyzer.calculate_from_dataframe(df, ticker)


if __name__ == '__main__':
    # 测试
    import yfinance as yf
    
    print("=== Volatility Skew 计算测试 ===")
    ticker = yf.Ticker('QQQ')
    hist = ticker.history(period='2mo')
    
    if not hist.empty:
        result = calculate_volatility_skew(hist, 'QQQ', short_period=5, long_period=20)
        print(f"\nQQQ 波动率偏度分析:")
        print(f"  短期波动率: {result['short_vol']}%")
        print(f"  长期波动率: {result['long_vol']}%")
        print(f"  偏度比率: {result['ratio']}")
        print(f"  信号: {result['signal'].upper()}")
        print(f"  更新时间: {result['updated_at']}")
        
        # 市场情绪分析
        analyzer = VolatilitySkewAnalyzer()
        sentiment = analyzer.analyze_market_sentiment({
            'QQQ': result,
            'SPY': calculate_volatility_skew(
                yf.Ticker('SPY').history(period='2mo'), 'SPY'
            )
        })
        print(f"\n市场情绪: {sentiment['sentiment']} (置信度: {sentiment['confidence']})")
