"""
RSRS (Resistance & Support Ratio Score) 指标计算模块

基于阻力支撑相对强度算法
参考: https://github.com/zhangliang1024/RSRS
优化: T-C2.1 Vectorization with Pandas Rolling & Numpy

优化内容:
- 完全向量化: 使用 Pandas rolling 窗口
- 单点计算: 使用协方差/方差公式
- 批量计算: calculate_series 返回完整序列
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, Union
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
        计算最新的单点 RSRS 指标 (优化版)
        
        Args:
            highs: 最高价序列
            lows: 最低价序列
            closes: 收盘价序列
        
        Returns:
            Dict[str, Any]: 包含 value, score, signal 等
        """
        if len(highs) < self.lookback_period:
            logger.warning(f"数据不足 {len(highs)} 天，需要至少 {self.lookback_period} 天")
            return self._empty_result()
        
        # 提取窗口数据 (使用 numpy 加速)
        h_win = highs.values[-self.lookback_period:]
        l_win = lows.values[-self.lookback_period:]
        
        try:
            # 快速单点 OLS (y = alpha + beta * x) -> Low = alpha + beta * High
            # Beta = Cov(H, L) / Var(H)
            
            # 计算均值
            h_mean = np.mean(h_win)
            l_mean = np.mean(l_win)
            
            # 计算协方差和方差
            cov = np.sum((h_win - h_mean) * (l_win - l_mean))
            var_h = np.sum((h_win - h_mean) ** 2)
            
            # 计算 Beta
            if var_h == 0:
                raw_beta = 0.0
            else:
                raw_beta = cov / var_h
                
            # 计算 R² = Corr(H, L)^2
            var_l = np.sum((l_win - l_mean) ** 2)
            if var_h > 0 and var_l > 0:
                corr = cov / np.sqrt(var_h * var_l)
                r_squared = corr ** 2
            else:
                r_squared = 0.0
            
            # 生成结果
            return self._format_result(raw_beta, r_squared)
            
        except Exception as e:
            logger.error(f"RSRS计算失败: {e}")
            return self._empty_result()

    def calculate_series(
        self, 
        df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        计算完整的 RSRS 指标序列 (向量化版本)
        
        Args:
            df: 包含 High, Low 的 DataFrame
            
        Returns:
            pd.DataFrame: 新增 rsrs_beta, rsrs_score, rsrs_r2 列
        """
        if df.empty or 'High' not in df.columns or 'Low' not in df.columns:
            return df
            
        highs = df['High']
        lows = df['Low']
        N = self.lookback_period
        
        # 1. 计算 Rolling Covariance 和 Variance (完全向量化)
        rolling_cov = highs.rolling(window=N).cov(lows)
        rolling_var = highs.rolling(window=N).var()
        
        # 2. 计算 Beta
        beta_series = rolling_cov / rolling_var
        
        # 3. 计算 R2 (Correlation ^ 2)
        rolling_corr = highs.rolling(window=N).corr(lows)
        r2_series = rolling_corr ** 2
        
        # 4. 构造结果 DataFrame
        result_df = df.copy()
        result_df['rsrs_beta'] = beta_series.fillna(0.0)
        result_df['rsrs_r2'] = r2_series.fillna(0.0)
        
        # 5. 计算分数 (向量化)
        clipped_beta = beta_series.clip(-1.0, 1.0)
        if self.scale:
            scores = 50 + (clipped_beta * 25)
            scores = scores.clip(0, 100)
        else:
            scores = clipped_beta * 50 + 50
            
        result_df['rsrs_score'] = scores.fillna(50).astype(int)
        
        return result_df
    
    def calculate_from_dataframe(
        self,
        df: pd.DataFrame,
        ticker: str = ''
    ) -> Dict[str, Any]:
        """
        从DataFrame计算最新 RSRS (使用向量化引擎)
        """
        if df.empty:
            return self._empty_result()
        
        # 规范化列名
        df_norm = df.rename(columns={
            'high': 'High', 'low': 'Low', 'close': 'Close',
            'HIGH': 'High', 'LOW': 'Low', 'CLOSE': 'Close'
        })
        
        if 'High' not in df_norm.columns or 'Low' not in df_norm.columns:
            logger.error("DataFrame缺少 High/Low 列")
            return self._empty_result()
            
        return self.calculate(
            df_norm['High'],
            df_norm['Low'],
            df_norm['Close'] if 'Close' in df_norm.columns else df_norm['High']
        )
    
    def _format_result(self, raw_beta: float, r_squared: float) -> Dict[str, Any]:
        """格式化输出结果"""
        # 标准化到 [-1, 1]
        value = np.clip(raw_beta, -1.0, 1.0)
        
        # 计算分数 (0-100)
        if self.scale:
            score = int(50 + (value * 25))
            score = int(np.clip(score, 0, 100))
        else:
            score = int(value * 50 + 50)
        
        # 生成信号
        thresholds = self.get_threshold()
        if score >= thresholds['long_threshold']:
            signal = 'long'
        elif score <= thresholds['short_threshold']:
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
        """获取信号阈值"""
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
    """
    analyzer = RSRSAnalyzer(lookback_period=lookback)
    return analyzer.calculate_from_dataframe(df, ticker)


if __name__ == '__main__':
    # 性能与正确性测试
    import yfinance as yf
    import time
    
    print("=== RSRS Vectorization Test ===")
    try:
        ticker = yf.Ticker('BTC-USD')
        hist = ticker.history(period='1y')
        
        if not hist.empty:
            analyzer = RSRSAnalyzer(lookback_period=20)
            
            # 测试 1: 单点计算性能
            start_time = time.time()
            res_single = analyzer.calculate_from_dataframe(hist, 'BTC-USD')
            end_time = time.time()
            print(f"Single Point Calculation:")
            print(f"  Result: {res_single}")
            print(f"  Time: {(end_time - start_time)*1000:.4f} ms")
            
            # 测试 2: 序列计算性能 (Vectorized)
            start_time = time.time()
            df_series = analyzer.calculate_series(hist)
            end_time = time.time()
            print(f"Series Calculation (Vectorized):")
            print(f"  Last Beta: {df_series['rsrs_beta'].iloc[-1]:.6f}")
            print(f"  Time: {(end_time - start_time)*1000:.4f} ms")
            
            # 验证一致性
            diff = abs(res_single['raw_beta'] - df_series['rsrs_beta'].iloc[-1])
            print(f"Consistency Check (Diff): {diff:.8f}")
            assert diff < 1e-5, "Mismatch!"
            print("✅ Consistency Verified")

    except Exception as e:
        print(f"Test failed: {e}")
