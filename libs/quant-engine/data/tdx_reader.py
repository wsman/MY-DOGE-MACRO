# 通达信数据库集成模块
# Created: 2026-02-05 (v1.8.0)

import os
import struct
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
from dataclasses import dataclass
import numpy as np

@dataclass
class TDXStockData:
    """通达信股票数据结构"""
    date: date
    open: float
    high: float
    low: float
    close: float
    amount: float  # 成交额
    volume: int    # 成交量


class TDXDataReader:
    """
    通达信数据读取器
    
    支持读取通达信本地数据文件:
    - 日线数据 (.day)
    - 5分钟线数据 (.5)
    - 1分钟线数据 (.1)
    """
    
    # 默认通达信安装路径
    DEFAULT_TDX_PATHS = [
        r"C:\new_tdx",
        r"C:\tdx",
        r"D:\new_tdx",
        r"D:\tdx",
        r"/opt/tdx",  # Linux
    ]
    
    # 市场代码映射
    MARKET_MAP = {
        "sh": "sh",
        "sz": "sz",
        "0": "sz",  # 深圳
        "1": "sh",  # 上海
        "6": "sh",  # 上海 (60xxxx)
        "3": "sz",  # 深圳 (300xxx)
    }
    
    def __init__(self, tdx_path: Optional[str] = None):
        """
        初始化读取器
        
        Args:
            tdx_path: 通达信安装路径，None 则自动检测
        """
        self.tdx_path = tdx_path or self._find_tdx_path()
        if self.tdx_path:
            self.vipdoc_path = Path(self.tdx_path) / "vipdoc"
        else:
            self.vipdoc_path = None
    
    def _find_tdx_path(self) -> Optional[str]:
        """自动查找通达信安装路径"""
        for path in self.DEFAULT_TDX_PATHS:
            if os.path.exists(path):
                vipdoc = os.path.join(path, "vipdoc")
                if os.path.exists(vipdoc):
                    return path
        return None
    
    def _get_market(self, code: str) -> str:
        """根据股票代码判断市场"""
        if code.startswith(("sh", "sz")):
            return code[:2]
        
        first_char = code[0]
        if first_char in ("6", "5"):
            return "sh"
        elif first_char in ("0", "3"):
            return "sz"
        else:
            # 默认深圳
            return "sz"
    
    def _get_stock_code(self, code: str) -> str:
        """提取纯股票代码"""
        if code.startswith(("sh", "sz")):
            return code[2:]
        return code
    
    def _get_day_file_path(self, code: str) -> Optional[Path]:
        """获取日线数据文件路径"""
        if not self.vipdoc_path:
            return None
        
        market = self._get_market(code)
        stock_code = self._get_stock_code(code)
        
        # 日线文件路径: vipdoc/{market}/lday/{market}{code}.day
        day_path = self.vipdoc_path / market / "lday" / f"{market}{stock_code}.day"
        
        if day_path.exists():
            return day_path
        return None
    
    def _parse_day_data(self, data: bytes) -> List[TDXStockData]:
        """
        解析日线数据
        
        通达信日线数据格式 (每条记录 32 字节):
        - 日期 (4 bytes, int)
        - 开盘价 (4 bytes, int, 需除以 100)
        - 最高价 (4 bytes, int, 需除以 100)
        - 最低价 (4 bytes, int, 需除以 100)
        - 收盘价 (4 bytes, int, 需除以 100)
        - 成交额 (4 bytes, float)
        - 成交量 (4 bytes, int)
        - 保留 (4 bytes)
        """
        result = []
        record_size = 32
        num_records = len(data) // record_size
        
        for i in range(num_records):
            offset = i * record_size
            record = data[offset:offset + record_size]
            
            if len(record) < record_size:
                break
            
            # 解析数据
            date_int = struct.unpack('i', record[0:4])[0]
            open_price = struct.unpack('i', record[4:8])[0] / 100.0
            high_price = struct.unpack('i', record[8:12])[0] / 100.0
            low_price = struct.unpack('i', record[12:16])[0] / 100.0
            close_price = struct.unpack('i', record[16:20])[0] / 100.0
            amount = struct.unpack('f', record[20:24])[0]
            volume = struct.unpack('i', record[24:28])[0]
            
            # 解析日期 (格式: YYYYMMDD)
            year = date_int // 10000
            month = (date_int % 10000) // 100
            day = date_int % 100
            
            try:
                stock_date = date(year, month, day)
            except ValueError:
                continue
            
            result.append(TDXStockData(
                date=stock_date,
                open=open_price,
                high=high_price,
                low=low_price,
                close=close_price,
                amount=amount,
                volume=volume
            ))
        
        return result
    
    def read_day_data(
        self,
        code: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[TDXStockData]:
        """
        读取日线数据
        
        Args:
            code: 股票代码 (如 "600000" 或 "sh600000")
            start_date: 开始日期
            end_date: 结束日期
        
        Returns:
            日线数据列表
        """
        file_path = self._get_day_file_path(code)
        
        if not file_path:
            print(f"[TDX] 未找到股票 {code} 的日线数据文件")
            return []
        
        try:
            with open(file_path, 'rb') as f:
                data = f.read()
            
            all_data = self._parse_day_data(data)
            
            # 日期过滤
            if start_date:
                all_data = [d for d in all_data if d.date >= start_date]
            if end_date:
                all_data = [d for d in all_data if d.date <= end_date]
            
            return all_data
        
        except Exception as e:
            print(f"[TDX] 读取数据失败: {e}")
            return []
    
    def read_day_data_as_dict(
        self,
        code: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict]:
        """读取日线数据并返回字典列表"""
        data = self.read_day_data(code, start_date, end_date)
        return [
            {
                "date": d.date.isoformat(),
                "open": d.open,
                "high": d.high,
                "low": d.low,
                "close": d.close,
                "volume": d.volume,
                "amount": d.amount
            }
            for d in data
        ]
    
    def get_stock_list(self, market: str = "all") -> List[str]:
        """
        获取股票列表
        
        Args:
            market: "sh", "sz", 或 "all"
        
        Returns:
            股票代码列表
        """
        if not self.vipdoc_path:
            return []
        
        stocks = []
        markets = ["sh", "sz"] if market == "all" else [market]
        
        for m in markets:
            lday_path = self.vipdoc_path / m / "lday"
            if lday_path.exists():
                for file in lday_path.glob("*.day"):
                    # 文件名格式: {market}{code}.day
                    stock_code = file.stem  # e.g., "sh600000"
                    stocks.append(stock_code)
        
        return stocks
    
    def is_available(self) -> bool:
        """检查通达信数据是否可用"""
        return self.vipdoc_path is not None and self.vipdoc_path.exists()
    
    def get_status(self) -> Dict:
        """获取数据源状态"""
        if not self.is_available():
            return {
                "available": False,
                "message": "通达信数据目录未找到",
                "path": None
            }
        
        sh_count = len(list((self.vipdoc_path / "sh" / "lday").glob("*.day"))) if (self.vipdoc_path / "sh" / "lday").exists() else 0
        sz_count = len(list((self.vipdoc_path / "sz" / "lday").glob("*.day"))) if (self.vipdoc_path / "sz" / "lday").exists() else 0
        
        return {
            "available": True,
            "path": str(self.tdx_path),
            "sh_stocks": sh_count,
            "sz_stocks": sz_count,
            "total_stocks": sh_count + sz_count
        }


# 便捷函数
def get_tdx_reader(tdx_path: Optional[str] = None) -> TDXDataReader:
    """获取通达信数据读取器实例"""
    return TDXDataReader(tdx_path)


def read_a_share_data(
    code: str,
    days: int = 250,
    tdx_path: Optional[str] = None
) -> List[Dict]:
    """
    读取 A 股历史数据的便捷函数
    
    Args:
        code: 股票代码
        days: 获取最近多少天的数据
        tdx_path: 通达信路径
    
    Returns:
        OHLCV 数据列表
    """
    reader = get_tdx_reader(tdx_path)
    
    if not reader.is_available():
        print("[TDX] 通达信数据不可用，尝试使用 yfinance 作为备用")
        return []
    
    from datetime import timedelta
    end_date = date.today()
    start_date = end_date - timedelta(days=days * 2)  # 扩大范围以确保足够数据
    
    data = reader.read_day_data_as_dict(code, start_date, end_date)
    
    # 返回最近 N 天
    return data[-days:] if len(data) > days else data
