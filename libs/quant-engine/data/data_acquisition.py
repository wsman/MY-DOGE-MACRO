"""
数据采集模块 - yfinance 集成

迁移自 legacy_quarantine/
优化: T-C2.2 Backend Caching Layer

新增功能:
- 内存缓存 (TTL 5分钟)
- 避免频繁请求上游 API
- 缓存命中统计
"""

import yfinance as yf
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from functools import lru_cache
import logging
import os

# 尝试导入 TTL 缓存
try:
    from cachetools import TTLCache
    HAS_CACHETOOLS = True
except ImportError:
    HAS_CACHETOOLS = False
    logger.warning("cachetools not available, using lru_cache only")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 缓存配置
DEFAULT_TTL = 300  # 5 minutes in seconds
CACHE_MAXSIZE = 1000  # Max number of entries


class DataAcquisition:
    """数据采集器 with caching support"""
    
    # 常用标的映射
    TICKER_MAP = {
        'QQQ': 'QQQ',
        'SPY': 'SPY',
        'GLD': 'GLD',
        'BTC': 'BTC-USD',
        'ETH': 'ETH-USD',
        'AAPL': 'AAPL',
        'GOOGL': 'GOOGL',
        'MSFT': 'MSFT',
        'NVDA': 'NVDA',
        'TSLA': 'TSLA',
        'META': 'META',
        'AMZN': 'AMZN',
    }
    
    def __init__(self, cache_dir: str = 'data/cache', ttl: int = DEFAULT_TTL):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
        
        # 内存缓存 (TTL 5分钟)
        if HAS_CACHETOOLS:
            self._quote_cache = TTLCache(maxsize=CACHE_MAXSIZE, ttl=ttl)
            self._historical_cache = TTLCache(maxsize=CACHE_MAXSIZE, ttl=ttl * 2)  # Historical cache longer
            logger.info("Using TTLCache for time-based cache expiration")
        else:
            # 回退到 lru_cache
            self._quote_cache = {}
            self._historical_cache = {}
            logger.info("Using lru_cache (no TTL support)")
        
        # 缓存统计
        self._cache_hits = 0
        self._cache_misses = 0
    
    def get_ticker(self, symbol: str) -> str:
        """获取完整 ticker 符号"""
        return self.TICKER_MAP.get(symbol.upper(), symbol)
    
    def _get_cached_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """获取缓存的报价"""
        if symbol.upper() in self._quote_cache:
            self._cache_hits += 1
            return self._quote_cache[symbol.upper()]
        self._cache_misses += 1
        return None
    
    def _set_cached_quote(self, symbol: str, quote: Dict[str, Any]):
        """设置缓存的报价"""
        self._quote_cache[symbol.upper()] = quote
    
    def _get_cached_historical(self, key: str) -> Optional[List[Dict[str, Any]]]:
        """获取缓存的历史数据"""
        if key in self._historical_cache:
            self._cache_hits += 1
            return self._historical_cache[key]
        self._cache_misses += 1
        return None
    
    def _set_cached_historical(self, key: str, data: List[Dict[str, Any]]):
        """设置缓存的历史数据"""
        self._historical_cache[key] = data
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """获取缓存统计"""
        total = self._cache_hits + self._cache_misses
        hit_rate = (self._cache_hits / total * 100) if total > 0 else 0.0
        return {
            'hits': self._cache_hits,
            'misses': self._cache_misses,
            'hit_rate': float(round(hit_rate, 2)),
            'quote_cache_size': len(self._quote_cache),
            'historical_cache_size': len(self._historical_cache)
        }
    
    def clear_cache(self):
        """清空缓存"""
        if HAS_CACHETOOLS:
            self._quote_cache.clear()
            self._historical_cache.clear()
        else:
            self._quote_cache.clear()
            self._historical_cache.clear()
        self._cache_hits = 0
        self._cache_misses = 0
        logger.info("Cache cleared")
    
    def fetch_quote(
        self, 
        symbol: str, 
        use_cache: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        获取实时报价 (带缓存)
        
        Args:
            symbol: 股票代码
            use_cache: 是否使用缓存
        
        Returns:
            {
                'ticker': str,
                'name': str,
                'price': float,
                'change': float,
                'change_percent': float,
                'volume': int,
                'high': float,
                'low': float,
                'open': float,
                'previous_close': float,
                'timestamp': datetime
            }
        """
        # 检查缓存
        if use_cache:
            cached = self._get_cached_quote(symbol)
            if cached:
                logger.debug(f"Cache hit for {symbol}")
                return cached
        
        try:
            ticker_symbol = self.get_ticker(symbol)
            ticker = yf.Ticker(ticker_symbol)
            
            # 获取实时信息
            info = ticker.info
            
            # 计算涨跌
            current_price = info.get('currentPrice', 0)
            previous_close = info.get('previousClose', current_price)
            change = current_price - previous_close
            change_percent = (change / previous_close * 100) if previous_close else 0
            
            result = {
                'ticker': symbol.upper(),
                'name': info.get('longName', info.get('shortName', symbol)),
                'price': current_price,
                'change': round(change, 2),
                'change_percent': round(change_percent, 2),
                'volume': info.get('volume', 0),
                'high': info.get('dayHigh', 0),
                'low': info.get('dayLow', 0),
                'open': info.get('open', 0),
                'previous_close': previous_close,
                'timestamp': datetime.now()
            }
            
            # 存入缓存
            if use_cache:
                self._set_cached_quote(symbol, result)
            
            return result
            
        except Exception as e:
            logger.error(f"获取报价失败 {symbol}: {e}")
            return None
    
    def fetch_historical(
        self, 
        symbol: str, 
        period: str = '1mo',
        interval: str = '1d',
        use_cache: bool = True
    ) -> Optional[List[Dict[str, Any]]]:
        """
        获取历史K线数据 (带缓存)
        
        Args:
            symbol: 股票代码
            period: 时间周期
            interval: 数据间隔
            use_cache: 是否使用缓存
        
        Returns:
            K线数据列表
        """
        # 缓存 key
        cache_key = f"{symbol.upper()}_{period}_{interval}"
        
        # 检查缓存
        if use_cache:
            cached = self._get_cached_historical(cache_key)
            if cached:
                logger.debug(f"Cache hit for historical: {cache_key}")
                return cached
        
        try:
            ticker_symbol = self.get_ticker(symbol)
            ticker = yf.Ticker(ticker_symbol)
            
            hist = ticker.history(period=period, interval=interval)
            
            if hist.empty:
                logger.warning(f"无历史数据: {symbol}")
                return []
            
            data = []
            for idx, row in hist.iterrows():
                data.append({
                    'date': idx.to_pydatetime(),
                    'open': round(row['Open'], 2),
                    'high': round(row['High'], 2),
                    'low': round(row['Low'], 2),
                    'close': round(row['Close'], 2),
                    'volume': int(row['Volume'])
                })
            
            logger.info(f"获取 {symbol} 历史数据: {len(data)} 条")
            
            # 存入缓存
            if use_cache:
                self._set_cached_historical(cache_key, data)
            
            return data
            
        except Exception as e:
            logger.error(f"获取历史数据失败 {symbol}: {e}")
            return None
    
    def fetch_multiple_quotes(
        self, 
        symbols: List[str], 
        use_cache: bool = True
    ) -> Dict[str, Dict[str, Any]]:
        """
        批量获取报价 (带缓存)
        """
        quotes = {}
        for symbol in symbols:
            quote = self.fetch_quote(symbol, use_cache=use_cache)
            if quote:
                quotes[symbol.upper()] = quote
        return quotes
    
    def search_symbol(self, query: str) -> List[Dict[str, str]]:
        """
        搜索股票代码 (不使用缓存)
        """
        try:
            ticker = yf.Ticker(query)
            info = ticker.info
            
            return [{
                'symbol': info.get('symbol', query),
                'name': info.get('longName', info.get('shortName', '')),
                'type': info.get('quoteType', 'UNKNOWN'),
                'exchange': info.get('exchange', '')
            }]
            
        except Exception as e:
            logger.warning(f"搜索失败 {query}: {e}")
            return []
    
    def get_market_indices(self) -> Dict[str, Dict[str, Any]]:
        """
        获取主要市场指数 (带缓存)
        """
        indices = ['^GSPC', '^DJI', '^IXIC', '^VIX']
        result = {}
        
        for idx in indices:
            # 检查缓存
            cached = self._get_cached_quote(idx)
            if cached:
                result[idx] = cached
                continue
            
            try:
                ticker = yf.Ticker(idx)
                info = ticker.info
                hist = ticker.history(period='1d')
                
                if not hist.empty:
                    current = hist['Close'].iloc[-1]
                    prev_close = info.get('previousClose', current)
                    change = current - prev_close
                    change_percent = (change / prev_close * 100) if prev_close else 0
                    
                    result[idx] = {
                        'ticker': idx,
                        'price': round(current, 2),
                        'change': round(change, 2),
                        'change_percent': round(change_percent, 2)
                    }
                    
                    # 缓存
                    self._set_cached_quote(idx, result[idx])
            except Exception as e:
                logger.error(f"获取指数失败 {idx}: {e}")
        
        return result


# 便捷函数 (带缓存)
_cached_acquirer = None

def _get_acquirer() -> DataAcquisition:
    """获取共享的 DataAcquisition 实例"""
    global _cached_acquirer
    if _cached_acquirer is None:
        _cached_acquirer = DataAcquisition()
    return _cached_acquirer

def get_quote(symbol: str, use_cache: bool = True) -> Optional[Dict[str, Any]]:
    """获取单个股票报价"""
    acquirer = _get_acquirer()
    return acquirer.fetch_quote(symbol, use_cache=use_cache)

def get_historical(symbol: str, period: str = '1mo', use_cache: bool = True) -> Optional[List[Dict[str, Any]]]:
    """获取历史数据"""
    acquirer = _get_acquirer()
    return acquirer.fetch_historical(symbol, period, use_cache=use_cache)

def get_cache_stats() -> Dict[str, Any]:
    """获取缓存统计"""
    return _get_acquirer().get_cache_stats()

def clear_cache():
    """清空缓存"""
    _get_acquirer().clear_cache()


if __name__ == '__main__':
    acquirer = DataAcquisition()
    
    print("=== 测试缓存 ===\n")
    
    # 测试报价缓存
    print("1. 首次获取 (缓存miss)")
    import time
    start = time.perf_counter()
    quote1 = acquirer.fetch_quote('AAPL')
    t1 = (time.perf_counter() - start) * 1000
    print(f"  AAPL: ${quote1['price'] if quote1 else 'N/A'} ({t1:.2f}ms)")
    
    print("\n2. 二次获取 (缓存hit)")
    start = time.perf_counter()
    quote2 = acquirer.fetch_quote('AAPL')
    t2 = (time.perf_counter() - start) * 1000
    print(f"  AAPL: ${quote2['price'] if quote2 else 'N/A'} ({t2:.2f}ms)")
    
    print(f"\n缓存加速: {t1/t2:.1f}x" if t2 > 0 else "\n缓存工作正常")
    
    # 缓存统计
    print(f"\n缓存统计: {acquirer.get_cache_stats()}")
