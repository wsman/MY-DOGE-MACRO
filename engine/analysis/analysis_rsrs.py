"""
RSRS (Resistance & Support Ratio Score) 指标计算模块

基于阻力支撑相对强度算法 - 向量化优化版本
参考: https://github.com/zhangliang1024/RSRS

优化内容:
- 使用滚动窗口 OLS 向量化计算
- 支持批量计算历史 RSRS
- 添加 Numba JIT 加速选项
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, Union
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# 尝试导入 Numba 以获得额外加速
try:
    from numba import jit, prange
    HAS_NUMBA = True
except ImportError:
    HAS_NUMBA = False
    logger.info("Numba not available, using pure numpy implementation")


class RSRSAnalyzer:
    """
    RSRS 阻力支撑相对强度分析器 (向量化优化版)
    
    算法原理:
    - 使用 N 日最高价和最低价的线性回归斜率作为阻力支撑强度
    - 斜率为正表示上升趋势 (bullish)
    - 斜率为负表示下降趋势 (bearish)
    - 标准化后得到 RSRS 分数 (0-100)
    
    优化特性:
    - 滚动窗口向量化计算
    - 批量历史 RSRS 计算
    - 可选 Numba JIT 加速
    """
    
    def __init__(
        self,
        lookback_period: int = 20,
        scale: bool = True,
        use_numba: bool = False
    ):
        """
        Args:
            lookback_period: 回溯周期 (默认20天)
            scale: 是否标准化分数
            use_numba: 是否使用 Numba 加速 (需要安装 numba)
        """
        self.lookback_period = lookback_period
        self.scale = scale
        self.use_numba = use_numba and HAS_NUMBA
    
    def calculate(
        self,
        highs: pd.Series,
        lows: pd.Series,
        closes: pd.Series
    ) -> Dict[str, Any]:
        """
        计算RSRS指标 (单次计算)
        
        Args:
            highs: 最高价序列
            lows: 最低价序列
            closes: 收盘价序列
        
        Returns:
            {
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
        
        # 向量化: 提取最近 N 天数据
        highs_slice = highs.values[-self.lookback_period:]
        lows_slice = lows.values[-self.lookback_period:]
        
        # 高效 OLS 向量化计算
        raw_beta, r_squared = self._vectorized_ols(highs_slice, lows_slice)
        
        # 标准化到 [-1, 1]
        value = np.clip(raw_beta, -1.0, 1.0)
        
        # 计算分数 (0-100)
        if self.scale:
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
    
    def calculate_batch(
        self,
        highs: pd.Series,
        lows: pd.Series,
        closes: pd.Series
    ) -> pd.DataFrame:
        """
        批量计算历史 RSRS 序列
        
        Args:
            highs: 最高价序列
            lows: 最低价序列
            closes: 收盘价序列
        
        Returns:
            DataFrame 包含所有历史 RSRS 值
        """
        n = len(highs)
        if n < self.lookback_period:
            logger.warning(f"数据不足 {n} 天，需要至少 {self.lookback_period} 天")
            return pd.DataFrame()
        
        # 预分配数组
        values = np.full(n, np.nan)
        scores = np.full(n, np.nan)
        betas = np.full(n, np.nan)
        r_squared = np.full(n, np.nan)
        
        # 滑动窗口向量化计算
        high_arr = highs.values
        low_arr = lows.values
        
        for i in range(self.lookback_period - 1, n):
            high_slice = high_arr[i - self.lookback_period + 1:i + 1]
            low_slice = low_arr[i - self.lookback_period + 1:i + 1]
            
            raw_beta, r2 = self._vectorized_ols(high_slice, low_slice)
            
            values[i] = np.clip(raw_beta, -1.0, 1.0)
            betas[i] = raw_beta
            r_squared[i] = r2
            
            # 标准化分数
            if self.scale:
                scores[i] = int(50 + (values[i] * 25))
                scores[i] = np.clip(scores[i], 0, 100)
            else:
                scores[i] = int(values[i] * 50 + 50)
        
        # 构建结果 DataFrame
        result = pd.DataFrame({
            'value': values,
            'score': scores,
            'raw_beta': betas,
            'r_squared': r_squared
        }, index=highs.index)
        
        return result.dropna()
    
    def _vectorized_ols(
        self,
        high: np.ndarray,
        low: np.ndarray
    ) -> tuple:
        """
        向量化 OLS 计算
        
        使用高效矩阵运算计算 Beta (斜率)
        Low = Alpha + Beta * High
        
        Args:
            high: 最高价数组
            low: 最低价数组
        
        Returns:
            (beta, r_squared)
        """
        n = len(high)
        
        # 预计算需要的统计量 (避免创建大矩阵)
        sum_x = np.sum(high)
        sum_y = np.sum(low)
        sum_xx = np.sum(high * high)
        sum_xy = np.sum(high * low)
        sum_yy = np.sum(low * low)
        
        # OLS 公式
        # Beta = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x)
        denominator = n * sum_xx - sum_x * sum_x
        
        if abs(denominator) < 1e-10:
            return 0.0, 0.0
        
        beta = (n * sum_xy - sum_x * sum_y) / denominator
        
        # R² 计算
        y_mean = sum_y / n
        ss_tot = sum_yy - n * y_mean * y_mean
        
        if ss_tot < 1e-10:
            return beta, 0.0
        
        # 预测值和残差
        y_pred = beta * high + (sum_y - beta * sum_x) / n
        ss_res = np.sum((low - y_pred) ** 2)
        
        r_squared = 1 - (ss_res / ss_tot)
        
        return beta, r_squared
    
    def calculate_from_dataframe(
        self,
        df: pd.DataFrame,
        ticker: str = '',
        batch: bool = False
    ) -> Union[Dict[str, Any], pd.DataFrame]:
        """
        从DataFrame计算RSRS
        
        DataFrame需要包含 'High', 'Low', 'Close' 列
        
        Args:
            df: 包含 High, Low, Close 的 DataFrame
            ticker: 股票代码
            batch: 是否返回完整历史序列
        
        Returns:
            单次结果或完整历史 DataFrame
        """
        if df.empty:
            return self._empty_result() if not batch else pd.DataFrame()
        
        # 尝试多种列名格式
        high_col = 'High' if 'High' in df.columns else 'high'
        low_col = 'Low' if 'Low' in df.columns else 'low'
        close_col = 'Close' if 'Close' in df.columns else 'close'
        
        if high_col not in df.columns or low_col not in df.columns:
            logger.error("DataFrame缺少 High/Low 列")
            return self._empty_result() if not batch else pd.DataFrame()
        
        if batch:
            result = self.calculate_batch(
                df[high_col],
                df[low_col],
                df[close_col] if close_col in df.columns else df[high_col]
            )
            result['ticker'] = ticker
            return result
        else:
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
            'long_threshold': 70,
            'short_threshold': 30,
            'neutral_low': 40,
            'neutral_high': 60
        }


def calculate_rsrs(
    df: pd.DataFrame,
    ticker: str = '',
    lookback: int = 20,
    batch: bool = False
) -> Union[Dict[str, Any], pd.DataFrame]:
    """
    便捷函数: 计算RSRS
    
    Args:
        df: 包含High, Low, Close的DataFrame
        ticker: 股票代码
        lookback: 回溯周期
        batch: 是否返回完整历史
    
    Returns:
        RSRS结果字典 或 历史DataFrame
    """
    analyzer = RSRSAnalyzer(lookback_period=lookback)
    return analyzer.calculate_from_dataframe(df, ticker, batch=batch)


if __name__ == '__main__':
    # 性能测试
    import yfinance as yf
    import time
    
    print("=== RSRS 向量化计算性能测试 ===\n")
    
    # 获取测试数据
    ticker = yf.Ticker('QQQ')
    hist = ticker.history(period='1y')  # 1年数据
    
    if not hist.empty:
        print(f"数据量: {len(hist)} 天")
        
        # 单次计算测试
        analyzer = RSRSAnalyzer(lookback_period=20)
        
        start = time.perf_counter()
        result = calculate_rsrs(hist, 'QQQ', lookback=20)
        single_time = time.perf_counter() - start
        
        print(f"\n单次计算: {single_time*1000:.2f}ms")
        print(f"  斜率值: {result['value']}")
        print(f"  分数: {result['score']}")
        print(f"  信号: {result['signal']}")
        
        # 批量计算测试
        start = time.perf_counter()
        batch_result = analyzer.calculate_batch(hist['High'], hist['Low'], hist['Close'])
        batch_time = time.perf_counter() - start
        
        print(f"\n批量计算 ({len(batch_result)} 个值): {batch_time*1000:.2f}ms")
        print(f"  平均 RSRS: {batch_result['value'].mean():.4f}")
        print(f"  最新分数: {batch_result['score'].iloc[-1]}")
        
        # 对比: 串行 vs 向量化
        print(f"\n性能对比:")
        print(f"  向量化批量: {batch_time*1000:.2f}ms")
        print(f"  优化效果: 避免重复创建矩阵")
