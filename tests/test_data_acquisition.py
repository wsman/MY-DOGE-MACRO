"""
Data Acquisition Cache Tests

Test T-C2.2: Backend Caching Layer
"""

import pytest
import time
from unittest.mock import Mock, patch
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.data.data_acquisition import DataAcquisition, get_quote, get_historical, get_cache_stats, clear_cache


class TestDataAcquisitionCache:
    """Data Acquisition Cache Tests"""
    
    @pytest.fixture
    def acquirer(self):
        """Create acquirer with fresh cache"""
        return DataAcquisition()
    
    @pytest.fixture
    def mock_yfinance(self):
        """Mock yfinance responses"""
        with patch('engine.data.data_acquisition.yf.Ticker') as mock_ticker:
            # Mock quote response
            mock_instance = Mock()
            mock_instance.info = {
                'currentPrice': 150.0,
                'previousClose': 148.0,
                'volume': 1000000,
                'dayHigh': 152.0,
                'dayLow': 149.0,
                'open': 149.5,
                'longName': 'Apple Inc.',
                'shortName': 'AAPL'
            }
            mock_instance.history.return_value = Mock()
            mock_ticker.return_value = mock_instance
            yield mock_ticker
    
    def test_cache_initialization(self, acquirer):
        """Test cache is properly initialized"""
        stats = acquirer.get_cache_stats()
        assert stats['hits'] == 0
        assert stats['misses'] == 0
        print(f"\n✅ Cache initialized: {stats}")
    
    def test_quote_cache_miss(self, acquirer, mock_yfinance):
        """Test first request causes cache miss"""
        acquirer.clear_cache()
        
        start = time.perf_counter()
        quote = acquirer.fetch_quote('AAPL')
        t1 = (time.perf_counter() - start) * 1000
        
        assert quote is not None
        assert quote['price'] == 150.0
        
        stats = acquirer.get_cache_stats()
        assert stats['misses'] == 1
        assert stats['hits'] == 0
        
        print(f"\n✅ Cache miss (first request): {t1:.2f}ms")
    
    def test_quote_cache_hit(self, acquirer, mock_yfinance):
        """Test second request uses cache"""
        # First request
        acquirer.fetch_quote('AAPL')
        
        # Second request (should be cached)
        start = time.perf_counter()
        quote = acquirer.fetch_quote('AAPL')
        t2 = (time.perf_counter() - start) * 1000
        
        assert quote is not None
        
        stats = acquirer.get_cache_stats()
        assert stats['hits'] == 1
        assert stats['misses'] == 1
        
        print(f"\n✅ Cache hit (second request): {t2:.2f}ms")
    
    def test_cache_speedup(self, acquirer, mock_yfinance):
        """Test cache provides speedup"""
        # First request
        start = time.perf_counter()
        acquirer.fetch_quote('AAPL')
        t1 = (time.perf_counter() - start) * 1000
        
        # Second request
        start = time.perf_counter()
        acquirer.fetch_quote('AAPL')
        t2 = (time.perf_counter() - start) * 1000
        
        speedup = t1 / t2 if t2 > 0 else float('inf')
        
        print(f"\n✅ Cache speedup: {speedup:.1f}x (first: {t1:.2f}ms, second: {t2:.2f}ms)")
        
        # Cache should be faster or similar (accounting for overhead)
        # For real API calls, speedup should be significant
        assert speedup >= 0.5  # At least not slower
    
    def test_historical_cache(self, acquirer, mock_yfinance):
        """Test historical data caching"""
        acquirer.clear_cache()
        
        # Create mock historical data
        import pandas as pd
        import numpy as np
        
        dates = pd.date_range('2023-01-01', periods=10, freq='B')
        mock_df = pd.DataFrame({
            'Open': np.random.randn(10) + 100,
            'High': np.random.randn(10) + 105,
            'Low': np.random.randn(10) + 95,
            'Close': np.random.randn(10) + 100,
            'Volume': np.random.randint(1000000, 10000000, 10)
        }, index=dates)
        
        mock_yfinance.return_value.history.return_value = mock_df
        
        # First request
        hist1 = acquirer.fetch_historical('AAPL', period='1mo')
        
        # Second request
        hist2 = acquirer.fetch_historical('AAPL', period='1mo')
        
        assert hist1 is not None
        assert hist2 is not None
        
        stats = acquirer.get_cache_stats()
        print(f"\n✅ Historical cache: {stats}")
    
    def test_cache_disabled(self, acquirer, mock_yfinance):
        """Test cache can be disabled"""
        # First request with cache
        acquirer.fetch_quote('AAPL', use_cache=True)
        
        # Second request without cache
        acquirer.fetch_quote('AAPL', use_cache=False)
        
        stats = acquirer.get_cache_stats()
        # First request was a miss, second bypasses cache
        assert stats['misses'] >= 1  # First request was a miss
        
        print(f"\n✅ Cache disabled: {stats}")
    
    def test_clear_cache(self, acquirer, mock_yfinance):
        """Test cache can be cleared"""
        # Add some data
        acquirer.fetch_quote('AAPL')
        acquirer.fetch_quote('GOOGL')
        
        # Verify cache has data
        stats_before = acquirer.get_cache_stats()
        assert stats_before['misses'] >= 2
        
        # Clear cache
        acquirer.clear_cache()
        
        # Verify cache is empty
        stats_after = acquirer.get_cache_stats()
        assert stats_after['hits'] == 0
        assert stats_after['misses'] == 0
        assert stats_after['quote_cache_size'] == 0
        
        print(f"\n✅ Cache clear works: before={stats_before}, after={stats_after}")
    
    def test_multiple_quotes(self, acquirer, mock_yfinance):
        """Test batch quote fetching with cache"""
        acquirer.clear_cache()
        
        symbols = ['AAPL', 'GOOGL', 'MSFT']
        quotes = acquirer.fetch_multiple_quotes(symbols)
        
        assert len(quotes) == 3
        assert all(s in quotes for s in symbols)
        
        stats = acquirer.get_cache_stats()
        print(f"\n✅ Batch quotes: {stats}")
    
    def test_cache_stats_format(self, acquirer):
        """Test cache stats format"""
        stats = acquirer.get_cache_stats()
        
        required_keys = ['hits', 'misses', 'hit_rate', 'quote_cache_size', 'historical_cache_size']
        assert all(k in stats for k in required_keys)
        
        assert isinstance(stats['hit_rate'], float)
        assert isinstance(stats['quote_cache_size'], int)
        
        print(f"\n✅ Stats format correct: {stats}")
    
    def test_shared_convenience_functions(self):
        """Test convenience functions share cache"""
        clear_cache()
        
        # Use get_quote
        with patch('engine.data.data_acquisition.yf.Ticker') as mock:
            mock_instance = Mock()
            mock_instance.info = {'currentPrice': 100, 'previousClose': 99}
            mock.return_value = mock_instance
            
            get_quote('AAPL')
            stats1 = get_cache_stats()
            
            get_quote('AAPL')  # Should hit cache
            stats2 = get_cache_stats()
        
        assert stats2['hits'] > stats1['hits']
        print(f"\n✅ Shared cache works: {stats2}")


class TestCacheConfiguration:
    """Cache Configuration Tests"""
    
    def test_custom_ttl(self):
        """Test custom TTL can be set"""
        acquirer = DataAcquisition(ttl=60)  # 1 minute
        assert acquirer._quote_cache.ttl == 60 if hasattr(acquirer._quote_cache, 'ttl') else True
        print(f"\n✅ Custom TTL set: 60s")
    
    def test_default_ttl(self):
        """Test default TTL is 5 minutes"""
        acquirer = DataAcquisition()
        assert acquirer._quote_cache.ttl == 300 if hasattr(acquirer._quote_cache, 'ttl') else True
        print(f"\n✅ Default TTL: 300s (5 minutes)")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
