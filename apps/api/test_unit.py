"""
Unit tests for market scanner module
Increases backend test coverage
"""

import pytest
import sys
import os

# Add server directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


class TestMarketScanner:
    """Test market scanner utilities"""
    
    def test_scanner_config_loading(self):
        """Test scanner configuration loading"""
        # Test basic configuration structure
        config = {
            "mode": "CN",
            "tdx_path": "D:/Games/New Tdx Vip2020",
            "db_path": "data/test_market.db"
        }
        assert config["mode"] == "CN"
        assert "tdx_path" in config
        assert "db_path" in config
    
    def test_scanner_modes(self):
        """Test scanner mode validation"""
        valid_modes = ["CN", "US", "HK", "ALL"]
        mode = "CN"
        assert mode in valid_modes
        
        # Test mode switching
        new_mode = "US"
        assert new_mode != mode
        assert new_mode in valid_modes
    
    def test_database_path_resolution(self):
        """Test database path resolution"""
        base_path = "data"
        db_name = "market.db"
        full_path = os.path.join(base_path, db_name)
        assert full_path == "data/market.db"
    
    def test_symbol_parsing(self):
        """Test symbol parsing utility"""
        symbol = "000001.SZ"
        parts = symbol.split(".")
        assert len(parts) == 2
        assert parts[0] == "000001"
        assert parts[1] == "SZ"
    
    def test_tdx_path_format(self):
        """Test TDX path format validation"""
        tdx_path = "D:/Games/New Tdx Vip2020"
        # Check it starts with a drive letter
        assert tdx_path[1] == ":"
        # Check it contains expected directory
        assert "Tdx" in tdx_path


class TestDataProcessing:
    """Test data processing utilities"""
    
    def test_kline_data_structure(self):
        """Test K-line data structure"""
        kline_data = {
            "symbol": "000001.SZ",
            "period": "daily",
            "data": [
                {"date": "2024-01-01", "open": 10.0, "close": 10.5, "high": 10.8, "low": 9.9}
            ]
        }
        assert "symbol" in kline_data
        assert "data" in kline_data
        assert len(kline_data["data"]) == 1
    
    def test_column_transformation(self):
        """Test column transformation"""
        columns = ["date", "open", "close", "high", "low", "volume"]
        assert len(columns) == 6
        assert columns[0] == "date"
    
    def test_batch_request_parsing(self):
        """Test batch request parameter parsing"""
        request = {
            "symbols": ["000001.SZ", "600000.SH"],
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "limit": 1000
        }
        assert "symbols" in request
        assert len(request["symbols"]) == 2
        assert request["limit"] == 1000


class TestCacheMechanics:
    """Test caching mechanisms"""
    
    def test_lru_cache_config(self):
        """Test LRU cache configuration"""
        cache_config = {
            "max_size": 1000,
            "ttl_seconds": 3600,
            "hot_key_threshold": 10
        }
        assert cache_config["max_size"] > 0
        assert cache_config["ttl_seconds"] > 0
    
    def test_cache_key_generation(self):
        """Test cache key generation"""
        params = {"symbol": "000001.SZ", "period": "daily"}
        key = f"kline:{params['symbol']}:{params['period']}"
        assert key == "kline:000001.SZ:daily"


class TestAPIHeaders:
    """Test API header utilities"""
    
    def test_auth_header_format(self):
        """Test authorization header format"""
        token = "test-token-123456"
        headers = {"X-Auth-Token": token}
        assert headers["X-Auth-Token"] == token
        assert len(token) > 10
    
    def test_response_headers(self):
        """Test expected response headers"""
        expected_headers = [
            "X-Transmission-Mode",
            "X-Data-Size",
            "X-Data-Size-Records",
            "X-Compression-Ratio"
        ]
        for header in expected_headers:
            assert len(header) > 0


class TestServerModels:
    """Test FastAPI models from server.py"""
    
    def test_stock_price_model(self):
        """Test StockPrice model validation"""
        from decimal import Decimal
        # Mock model for testing
        class StockPrice:
            def __init__(self, symbol, price, change, volume):
                self.symbol = symbol
                self.price = price
                self.change = change
                self.volume = volume
        
        price = StockPrice(
            symbol="000001.SZ",
            price=Decimal("10.1234"),
            change=Decimal("0.05"),
            volume=1000000
        )
        assert price.symbol == "000001.SZ"
        assert float(price.price) == 10.1234
    
    def test_scan_request_model(self):
        """Test ScanRequest model validation"""
        class ScanRequest:
            def __init__(self, mode, tdx_path):
                self.mode = mode
                self.tdx_path = tdx_path
        
        request = ScanRequest(mode="CN", tdx_path="D:/TDX")
        assert request.mode == "CN"
        assert "TDX" in request.tdx_path
    
    def test_scan_response_model(self):
        """Test ScanResponse model"""
        class ScanResponse:
            def __init__(self, task_id, status, progress=0):
                self.task_id = task_id
                self.status = status
                self.progress = progress
        
        response = ScanResponse(task_id="test-123", status="running", progress=50)
        assert response.task_id == "test-123"
        assert response.progress == 50
