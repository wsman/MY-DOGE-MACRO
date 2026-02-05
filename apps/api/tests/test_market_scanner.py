"""
Unit tests for Market Scanner Module
Increases server/core test coverage with Mock-based isolation

T-I3: Test Coverage Expansion
"""

import unittest
import pandas as pd
import os
from unittest.mock import MagicMock, patch, PropertyMock
from typing import List

# Import the module under test
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.core.market_scanner import MarketScanner, MAX_CONCURRENCY
from server.core.tdx_loader import TDXReader


class TestMarketScanner(unittest.TestCase):
    """Test MarketScanner with mocked dependencies"""
    
    def setUp(self):
        """Set up test fixtures with mocked dependencies"""
        # Mock TDXReader to avoid filesystem access
        self.mock_tdx_reader = MagicMock(spec=TDXReader)
        
        # Mock database functions
        self.mock_db_path = ":memory:"
        
        # Create scanner with mocked TDXReader
        with patch('server.core.market_scanner.TDXReader', return_value=self.mock_tdx_reader):
            self.scanner = MarketScanner(tdx_root="/fake/tdx/path")
        
        # Store the mocked reader instance
        self.scanner.reader = self.mock_tdx_reader
    
    def test_scanner_initialization(self):
        """Test MarketScanner initialization"""
        self.assertEqual(self.scanner.tdx_root, "/fake/tdx/path")
        self.assertEqual(self.scanner.max_workers, MAX_CONCURRENCY)
        self.assertIsNotNone(self.scanner.reader)
    
    def test_collect_cn_tasks_with_mock_files(self):
        """Test A-share task collection with mocked filesystem"""
        # Mock filesystem operations
        with patch('os.path.exists') as mock_exists, \
             patch('glob.glob') as mock_glob:
            
            # Setup mock to return test data
            mock_exists.return_value = True
            mock_glob.return_value = [
                '/fake/tdx/path/sh/lday/sh600000.day',
                '/fake/tdx/path/sh/lday/sh000001.day',
                '/fake/tdx/path/sz/lday/sz000001.day',
            ]
            
            tasks = self.scanner._collect_cn_tasks()
            
            # Verify only valid codes are collected
            # Valid: 00, 30, 60, 68 prefixes, 6 digits
            expected = ['000001.SZ', '600000.SH']  # 000001, 600000 are valid
            self.assertEqual(sorted(tasks), sorted(expected))
    
    def test_collect_cn_tasks_empty(self):
        """Test A-share task collection with no files"""
        with patch('os.path.exists') as mock_exists, \
             patch('glob.glob') as mock_glob:
            
            mock_exists.return_value = False
            mock_glob.return_value = []
            
            tasks = self.scanner._collect_cn_tasks()
            
            self.assertEqual(tasks, [])
    
    def test_collect_us_tasks_with_mock_files(self):
        """Test US stock task collection with mocked filesystem"""
        with patch('os.path.exists') as mock_exists, \
             patch('glob.glob') as mock_glob:
            
            mock_exists.return_value = True
            mock_glob.return_value = [
                '/fake/tdx/path/ds/lday/#AAPL.day',
                '/fake/tdx/path/ds/lday/#NVDA.day',
            ]
            
            tasks = self.scanner._collect_us_tasks()
            
            self.assertEqual(tasks, ['AAPL', 'NVDA'])
    
    def test_collect_us_tasks_empty(self):
        """Test US stock task collection with no files"""
        with patch('os.path.exists') as mock_exists, \
             patch('glob.glob') as mock_glob:
            
            mock_exists.return_value = False
            mock_glob.return_value = []
            
            tasks = self.scanner._collect_us_tasks()
            
            self.assertEqual(tasks, [])
    
    def test_process_ticker_with_valid_data(self):
        """Test single ticker processing with valid data"""
        # Create mock DataFrame
        mock_df = pd.DataFrame({
            'date': ['2024-01-01', '2024-01-02'],
            'open': [10.0, 10.5],
            'high': [10.5, 11.0],
            'low': [9.8, 10.2],
            'close': [10.2, 10.8],
            'volume': [1000000, 1200000],
            'amount': [10000000.0, 12000000.0]
        })
        
        self.mock_tdx_reader.get_data.return_value = mock_df
        
        with patch('server.core.market_scanner.save_stock_data_custom') as mock_save:
            mock_save.return_value = None
            
            # Should not raise exception
            self.scanner._process_ticker('000001.SZ', ':memory:', 'cn')
            
            # Verify data was saved
            mock_save.assert_called_once()
            saved_df = mock_save.call_args[0][0]
            self.assertIn('ticker', saved_df.columns)
    
    def test_process_ticker_empty_data(self):
        """Test single ticker processing with empty data"""
        self.mock_tdx_reader.get_data.return_value = pd.DataFrame()
        
        with patch('server.core.market_scanner.save_stock_data_custom') as mock_save:
            self.scanner._process_ticker('000001.SZ', ':memory:', 'cn')
            
            # Should not save empty data
            mock_save.assert_not_called()
    
    def test_process_ticker_exception(self):
        """Test single ticker processing with exception"""
        self.mock_tdx_reader.get_data.side_effect = Exception("Read error")
        
        with self.assertRaises(Exception):
            self.scanner._process_ticker('INVALID.SZ', ':memory:', 'cn')
    
    def test_scan_cn_market_no_symbols(self):
        """Test A-share scan with no symbols"""
        with patch.object(self.scanner, '_collect_cn_tasks', return_value=[]):
            with patch('server.core.market_scanner.init_db_custom') as mock_init:
                progress_calls = []
                
                def progress(pct, msg):
                    progress_calls.append((pct, msg))
                
                self.scanner.scan_cn_market(':memory:', progress)
                
                # Should return early with 100% progress
                self.assertEqual(progress_calls[-1][0], 100)
                self.assertIn("No symbols", progress_calls[-1][1])
    
    def test_scan_us_market_no_symbols(self):
        """Test US stock scan with no symbols"""
        with patch.object(self.scanner, '_collect_us_tasks', return_value=[]):
            with patch('server.core.market_scanner.init_db_custom') as mock_init:
                progress_calls = []
                
                def progress(pct, msg):
                    progress_calls.append((pct, msg))
                
                self.scanner.scan_us_market(':memory:', progress)
                
                self.assertEqual(progress_calls[-1][0], 100)
                self.assertIn("No symbols", progress_calls[-1][1])
    
    def test_path_correction(self):
        """Test automatic path correction"""
        # Test that non-vipdoc paths are corrected
        with patch('os.path.exists') as mock_exists:
            mock_exists.return_value = True
            
            with patch('server.core.market_scanner.TDXReader') as mock_reader:
                mock_reader.return_value = MagicMock()
                
                scanner = MarketScanner(tdx_root="/some/path/vipdoc")
                
                # Should use the path as-is if it ends with vipdoc
                mock_reader.assert_called_once_with("/some/path/vipdoc")


class TestTDXReader(unittest.TestCase):
    """Test TDXReader with mocked file I/O"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.reader = TDXReader("/fake/tdx/root")
    
    def test_tdx_reader_initialization(self):
        """Test TDXReader initialization"""
        self.assertEqual(self.reader.root_dir, "/fake/tdx/root")
    
    @patch('builtins.open', create=True)
    def test_parse_file_returns_dataframe(self, mock_open):
        """Test file parsing returns valid DataFrame"""
        # Create minimal binary data for one record
        # A股格式: II I I I f I I (32 bytes)
        import struct
        
        # One valid A股 record
        data = struct.pack('<II I I I f I I', 
            20240101,   # date_int
            1000,       # open * 100
            1010,       # high * 100
            990,        # low * 100
            1005,       # close * 100
            1000000.0,  # amount
            1000000,    # volume
            0           # unused
        )
        
        mock_file = MagicMock()
        mock_file.read.side_effect = [data, b'']  # First read returns data, second returns empty
        mock_file.__enter__.return_value = mock_file
        mock_file.__exit__.return_value = False
        mock_open.return_value = mock_file
        
        df = self.reader._parse_file("/fake/path.day", 'cn')
        
        self.assertFalse(df.empty)
        self.assertEqual(len(df), 1)
        self.assertIn('date', df.columns)
        self.assertIn('close', df.columns)
    
    @patch('builtins.open', create=True)
    def test_parse_file_empty_on_short_data(self, mock_open):
        """Test empty DataFrame when file is too short"""
        mock_file = MagicMock()
        mock_file.read.return_value = b'short'  # Less than 32 bytes
        mock_file.__enter__.return_value = mock_file
        mock_file.__exit__.return_value = False
        mock_open.return_value = mock_file
        
        df = self.reader._parse_file("/fake/path.day", 'cn')
        
        self.assertTrue(df.empty)


class TestConcurrencyControl(unittest.TestCase):
    """Test concurrency-related functionality"""
    
    def test_max_concurrency_constant(self):
        """Test MAX_CONCURRENCY is valid"""
        self.assertIsInstance(MAX_CONCURRENCY, int)
        self.assertGreater(MAX_CONCURRENCY, 0)
        self.assertLessEqual(MAX_CONCURRENCY, 20)  # Reasonable upper bound
    
    def test_scanner_max_workers_configurable(self):
        """Test scanner accepts custom max_workers"""
        with patch('server.core.market_scanner.TDXReader'):
            scanner = MarketScanner(tdx_root="/fake", max_workers=5)
            self.assertEqual(scanner.max_workers, 5)


if __name__ == '__main__':
    unittest.main()
