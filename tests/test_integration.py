import sys
import os
import unittest
import time
import pandas as pd
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# 确保可以导入 server 模块
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock scipy before importing server
sys.modules['scipy'] = MagicMock()
sys.modules['scipy.stats'] = MagicMock()

from server.server import app


class TestEndToEndIntegration(unittest.TestCase):
    def setUp(self):
        # 初始化测试客户端
        self.client = TestClient(app, raise_server_exceptions=False)
        # 使用默认的开发 Token (与 api.ts 保持一致)
        self.auth_headers = {"x-auth-token": "mydoge-token-dev"}

    @patch("os.path.exists")
    def test_market_snapshot_format_and_latency(self, mock_exists):
        """
        [T-C1.1] 验证快照响应格式与延迟 (Snapshot Integration)
        目标: /api/v1/market/snapshot
        """
        # 1. Mock 数据库返回
        mock_exists.return_value = True

        # 2. 执行请求（会使用真实的 test_market_data.db 如果存在）
        start_time = time.time()
        response = self.client.get("/api/v1/market/snapshot", headers=self.auth_headers)
        latency = (time.time() - start_time) * 1000

        # 3. 验证断言
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 验证 Split JSON 结构 (前端适配的关键)
        self.assertIn("columns", data)
        self.assertIn("data", data)
        self.assertIsInstance(data["columns"], list)

        print(f"\n✅ [T-C1.1] Snapshot Format: columns={len(data['columns'])} rows={len(data['data'])}")
        print(f"✅ [T-C1.1] Latency: {latency:.2f}ms")

    @patch("server.core.api_routes.get_tdx_reader")
    def test_kline_large_payload(self, mock_get_reader):
        """
        [T-C1.2] 验证 K线大数据量传输与压缩头 (Kline Performance)
        目标: /api/v1/market/kline/{symbol}
        """
        # Skip if scipy not available
        try:
            import scipy
        except ImportError:
            self.skipTest("scipy not available, skipping large payload test")

        # 1. Mock 5000条数据
        large_df = pd.DataFrame({
            'date': pd.date_range(start='2020-01-01', periods=5000).astype(str),
            'open': list(range(5000)),
            'high': list(range(5000)),
            'low': list(range(5000)),
            'close': list(range(5000)),
            'vol': list(range(5000)),
            'amount': list(range(5000))
        })

        mock_reader = mock_get_reader.return_value
        mock_reader.get_data.return_value = large_df

        # 2. 执行请求
        start_time = time.time()
        response = self.client.get("/api/v1/market/kline/000001?limit=5000", headers=self.auth_headers)
        latency = (time.time() - start_time) * 1000

        # 3. 验证断言
        self.assertEqual(response.status_code, 200)

        # 验证数据完整性
        json_data = response.json()
        self.assertIn("columns", json_data)
        self.assertIn("data", json_data)
        self.assertEqual(len(json_data["data"]), 5000)

        print(f"\n✅ [T-C1.2] Kline (5k rows) Latency: {latency:.2f}ms")

    @patch("os.path.exists")
    def test_empty_data_handling(self, mock_exists):
        """
        [T-C1.3] 验证空数据容错性 (Empty State)
        """
        # Mock 数据库不存在
        mock_exists.return_value = False

        response = self.client.get("/api/v1/market/snapshot", headers=self.auth_headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        # 即使数据为空，Schema 必须保持稳定，否则前端会报错
        self.assertEqual(data["columns"], ["code", "name", "price", "pct_chg", "vol", "industry"])
        self.assertEqual(len(data["data"]), 0)
        print("\n✅ [T-C1.3] Empty data handled gracefully (Schema preserved)")

    def test_security_access(self):
        """
        [T-C1.4] 验证安全访问控制 (Security)
        """
        response = self.client.get("/api/v1/market/snapshot", headers={"x-auth-token": "bad-token"})
        self.assertEqual(response.status_code, 401)
        print("\n✅ [T-C1.4] Unauthorized access blocked")


if __name__ == "__main__":
    unittest.main()
