"""
RSRS 性能测试用例

测试 T-C2.1: RSRS Algorithm Vectorization
"""

import pytest
import pandas as pd
import numpy as np
import time
from engine.analysis.analysis_rsrs import RSRSAnalyzer, calculate_rsrs


class TestRSRSPerformance:
    """RSRS 性能测试"""
    
    @pytest.fixture
    def sample_data(self):
        """生成测试数据"""
        np.random.seed(42)
        dates = pd.date_range('2023-01-01', periods=252, freq='B')
        
        # 模拟股价数据
        base_price = 100
        returns = np.random.randn(252) * 0.02
        closes = base_price * (1 + returns).cumprod()
        
        highs = closes * (1 + np.random.rand(252) * 0.02)
        lows = closes * (1 - np.random.rand(252) * 0.02)
        
        return pd.DataFrame({
            'High': highs,
            'Low': lows,
            'Close': closes
        }, index=dates)
    
    def test_single_calculation_speed(self, sample_data):
        """测试单次计算速度"""
        analyzer = RSRSAnalyzer(lookback_period=20)
        
        start = time.perf_counter()
        result = analyzer.calculate(
            sample_data['High'],
            sample_data['Low'],
            sample_data['Close']
        )
        elapsed = (time.perf_counter() - start) * 1000  # ms
        
        print(f"\n单次计算耗时: {elapsed:.2f}ms")
        
        # 性能要求: < 10ms
        assert elapsed < 10, f"单次计算超过 10ms: {elapsed:.2f}ms"
        
        # 验证结果
        assert 'value' in result
        assert 'score' in result
        assert 'signal' in result
    
    def test_batch_calculation_speed(self, sample_data):
        """测试批量计算速度"""
        analyzer = RSRSAnalyzer(lookback_period=20)
        
        start = time.perf_counter()
        result = analyzer.calculate_series(sample_data)
        elapsed = (time.perf_counter() - start) * 1000
        
        print(f"\n批量计算 ({len(result)} 条) 耗时: {elapsed:.2f}ms")
        
        # 性能要求: < 50ms
        assert elapsed < 50, f"批量计算超过 50ms: {elapsed:.2f}ms"
        
        # 验证结果
        assert len(result) > 0
        assert 'rsrs_beta' in result.columns
        assert 'rsrs_score' in result.columns
    
    def test_large_dataset_performance(self):
        """测试大数据集性能"""
        # 生成 1000 天数据
        np.random.seed(42)
        dates = pd.date_range('2020-01-01', periods=1000, freq='B')
        
        base_price = 100
        returns = np.random.randn(1000) * 0.02
        closes = base_price * (1 + returns).cumprod()
        
        highs = closes * (1 + np.random.rand(1000) * 0.02)
        lows = closes * (1 - np.random.rand(1000) * 0.02)
        
        df = pd.DataFrame({
            'High': highs,
            'Low': lows,
            'Close': closes
        }, index=dates)
        
        analyzer = RSRSAnalyzer(lookback_period=20)
        
        start = time.perf_counter()
        result = analyzer.calculate_series(df)
        elapsed = (time.perf_counter() - start) * 1000
        
        print(f"\n1000天数据批量计算耗时: {elapsed:.2f}ms")
        
        # 性能要求: < 100ms
        assert elapsed < 100, f"1000天计算超过 100ms: {elapsed:.2f}ms"
        
        # 验证所有计算都完成
        assert len(result) >= 1000 - 20
    
    def test_vectorization_correctness(self, sample_data):
        """验证向量化计算的正确性"""
        analyzer = RSRSAnalyzer(lookback_period=20)
        
        # 单次计算
        single_result = analyzer.calculate(
            sample_data['High'],
            sample_data['Low'],
            sample_data['Close']
        )
        
        # 批量计算的最新一条应该与单次计算一致
        batch_result = analyzer.calculate_series(sample_data)
        
        latest_batch = batch_result.iloc[-1]
        
        print(f"\n正确性验证:")
        print(f"  单次计算 raw_beta: {single_result['raw_beta']}")
        print(f"  批量最新 rsrs_beta: {latest_batch['rsrs_beta']}")
        
        # 差异应该很小
        assert abs(single_result['raw_beta'] - latest_batch['rsrs_beta']) < 0.0001
    
    def test_edge_cases(self):
        """测试边界情况"""
        analyzer = RSRSAnalyzer(lookback_period=20)
        
        # 数据不足
        short_data = pd.Series([1, 2, 3, 4, 5])
        result = analyzer.calculate(short_data, short_data, short_data)
        assert result['score'] == 50  # 应该返回默认值
        
        # 空数据
        empty_result = analyzer.calculate(
            pd.Series([]),
            pd.Series([]),
            pd.Series([])
        )
        assert empty_result['signal'] == 'hold'
    
    def test_signal_generation(self):
        """测试信号生成"""
        analyzer = RSRSAnalyzer(lookback_period=20)
        
        # 模拟上升趋势数据
        dates = pd.date_range('2023-01-01', periods=252, freq='B')
        highs = np.linspace(100, 150, 252)
        lows = np.linspace(95, 145, 252)
        closes = np.linspace(98, 148, 252)
        
        df = pd.DataFrame({
            'High': highs,
            'Low': lows,
            'Close': closes
        }, index=dates)
        
        result = analyzer.calculate(df['High'], df['Low'], df['Close'])
        
        print(f"\n上升趋势信号测试:")
        print(f"  斜率: {result['value']:.4f}")
        print(f"  分数: {result['score']}")
        print(f"  信号: {result['signal']}")
        
        # 上升趋势应该是 long
        assert result['signal'] in ['long', 'hold']


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
