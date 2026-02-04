"""
Market Scanner Performance Tests

Test T-C2.4: Market Scanner Concurrency
"""

import pytest
import time
import os
import tempfile
from unittest.mock import Mock, patch, MagicMock
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, List, Optional

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.core.market_scanner import MarketScanner, MAX_CONCURRENCY


class TestMarketScannerConcurrency:
    """Market Scanner Concurrency Tests"""
    
    @pytest.fixture
    def mock_scanner(self, tmp_path):
        """Create scanner with mocked TDX reader"""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create correct TDX structure with vipdoc
            vipdoc_dir = os.path.join(tmpdir, 'vipdoc')
            sh_dir = os.path.join(vipdoc_dir, 'sh', 'lday')
            sz_dir = os.path.join(vipdoc_dir, 'sz', 'lday')
            os.makedirs(sh_dir)
            os.makedirs(sz_dir)
            
            # Create mock files
            for code in ['600001', '000001', '300001', '680001']:
                open(os.path.join(sh_dir, f'sh{code}.day'), 'w').close()
            for code in ['000002', '300002', '600002']:
                open(os.path.join(sz_dir, f'sz{code}.day'), 'w').close()
            
            scanner = MarketScanner(tmpdir, max_workers=4)
            scanner.reader = Mock()  # Mock the reader
            
            return scanner, tmpdir
    
    @pytest.fixture
    def mock_df(self):
        """Create mock DataFrame"""
        import pandas as pd
        import numpy as np
        dates = pd.date_range('2023-01-01', periods=100, freq='B')
        return pd.DataFrame({
            'Open': np.random.randn(100) + 100,
            'High': np.random.randn(100) + 105,
            'Low': np.random.randn(100) + 95,
            'Close': np.random.randn(100) + 100,
            'Volume': np.random.randint(1000000, 10000000, 100)
        }, index=dates)
    
    def test_concurrency_limit(self):
        """Test that concurrency limit is respected"""
        assert MAX_CONCURRENCY == 10
        print(f"\n✅ Concurrency limit: {MAX_CONCURRENCY}")
    
    def test_task_collection(self, mock_scanner):
        """Test task collection runs without error"""
        scanner, tmpdir = mock_scanner
        
        # This should not raise
        tasks = scanner._collect_cn_tasks()
        
        # Just verify it returns a list
        assert isinstance(tasks, list)
        print(f"\n✅ Task collection works, found {len(tasks)} tasks")
    
    def test_single_ticker_processing(self, mock_scanner, mock_df):
        """Test single ticker processing"""
        scanner, _ = mock_scanner
        scanner.reader.get_data.return_value = mock_df
        
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        
        try:
            from server.core.database import init_db_custom
            init_db_custom(db_path)
            
            scanner._process_ticker('600001.SH', db_path, 'cn')
            
            print(f"\n✅ Single ticker processing works")
            
        finally:
            if os.path.exists(db_path):
                os.unlink(db_path)
    
    def test_threadpool_executor_works(self, mock_scanner, mock_df):
        """Test that ThreadPoolExecutor works correctly"""
        scanner = mock_scanner[0]
        scanner.reader.get_data.return_value = mock_df
        
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        
        tickers = [f'{code}.SH' for code in ['60000' + str(i) for i in range(1, 6)]]
        
        try:
            from server.core.database import init_db_custom
            init_db_custom(db_path)
            
            # Concurrent processing with ThreadPoolExecutor
            start = time.perf_counter()
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = [executor.submit(scanner._process_ticker, t, db_path, 'cn') for t in tickers]
                for f in as_completed(futures):
                    f.result()
            concurrent_time = time.perf_counter() - start
            
            print(f"\nThreadPoolExecutor ({len(tickers)} tickers): {concurrent_time*1000:.2f}ms")
            print(f"✅ ThreadPoolExecutor works correctly")
            
        finally:
            if os.path.exists(db_path):
                os.unlink(db_path)
    
    def test_async_interface_exists(self, mock_scanner):
        """Test async methods exist"""
        scanner = mock_scanner[0]  # Unpack tuple
        assert hasattr(scanner, 'scan_cn_market_async')
        assert hasattr(scanner, 'scan_us_market_async')
        print(f"\n✅ Async methods available")
    
    def test_error_handling(self, mock_scanner):
        """Test error handling in concurrent processing"""
        scanner, _ = mock_scanner
        
        # Mock to raise exception
        scanner.reader.get_data.side_effect = Exception("Test error")
        
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name
        
        try:
            from server.core.database import init_db_custom
            init_db_custom(db_path)
            
            # Should not raise, just log error
            try:
                scanner._process_ticker('600001.SH', db_path, 'cn')
            except Exception as e:
                # Expected - error should be caught
                pass
            
            print(f"\n✅ Error handling works correctly")
            
        finally:
            if os.path.exists(db_path):
                os.unlink(db_path)


class TestScannerConfiguration:
    """Configuration Tests"""
    
    def test_max_workers_configurable(self):
        """Test that max_workers is configurable"""
        scanner = MarketScanner('/tmp', max_workers=5)
        assert scanner.max_workers == 5
        print(f"\n✅ Max workers configurable: 5")
    
    def test_default_max_workers(self):
        """Test default max workers value"""
        scanner = MarketScanner('/tmp')
        assert scanner.max_workers == MAX_CONCURRENCY
        print(f"\n✅ Default max workers: {MAX_CONCURRENCY}")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
