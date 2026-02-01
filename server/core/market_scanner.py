"""
Market Scanner with Concurrent Processing

Optimized for T-C2.4: Market Scanner Concurrency
Uses asyncio + ThreadPoolExecutor for parallel processing
"""

import os
import sys
import sqlite3
import glob
import re
import asyncio
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, List, Optional

from .tdx_loader import TDXReader
from .database import init_db_custom, save_stock_data_custom

# 最大并发数
MAX_CONCURRENCY = 10


class MarketScanner:
    """
    Market Scanner with Concurrent Processing Support
    
    Optimizations:
    - asyncio + ThreadPoolExecutor for parallel I/O
    - Semaphore-based concurrency control
    - Progress reporting for async operations
    """
    
    def __init__(self, tdx_root, max_workers: int = MAX_CONCURRENCY):
        # Smart path correction
        if not os.path.basename(tdx_root) == 'vipdoc':
            potential_vipdoc = os.path.join(tdx_root, 'vipdoc')
            if os.path.exists(potential_vipdoc):
                tdx_root = potential_vipdoc
                print(f"✅ Auto-corrected TDX path: {tdx_root}")
        
        self.tdx_root = tdx_root
        self.reader = TDXReader(tdx_root)
        self.max_workers = max_workers
    
    def scan_cn_market(self, db_path, progress_callback: Callable[[int, str], None] = None):
        """Scan A-shares (sh/sz) - Concurrent version"""
        print(f"🚀 Starting A-share scan -> {db_path}")
        init_db_custom(db_path)
        
        # Collect tasks
        tasks = self._collect_cn_tasks()
        total = len(tasks)
        print(f"📊 Filtered {total} A-share symbols")
        
        if total == 0:
            if progress_callback:
                progress_callback(100, "✅ No symbols found")
            return
        
        # Process concurrently
        completed = 0
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(self._process_ticker, ticker, db_path, 'cn'): ticker 
                for ticker in tasks
            }
            
            for future in as_completed(futures):
                ticker = futures[future]
                try:
                    future.result()
                except Exception as e:
                    print(f"Error processing {ticker}: {e}")
                
                completed += 1
                if progress_callback and completed % 50 == 0:
                    progress_callback(
                        int(completed / total * 100), 
                        f"Processed {ticker}"
                    )
        
        if progress_callback:
            progress_callback(100, "✅ A-share scan complete")
    
    async def scan_cn_market_async(self, db_path, progress_callback: Callable[[int, str], None] = None):
        """Async version for A-share scanning"""
        print(f"🚀 Starting A-share scan (async) -> {db_path}")
        init_db_custom(db_path)
        
        tasks = self._collect_cn_tasks()
        total = len(tasks)
        print(f"📊 Filtered {total} A-share symbols (async)")
        
        if total == 0:
            if progress_callback:
                progress_callback(100, "✅ No symbols found")
            return
        
        semaphore = asyncio.Semaphore(self.max_workers)
        completed = 0
        
        async def process_with_semaphore(ticker):
            async with semaphore:
                await asyncio.to_thread(self._process_ticker, ticker, db_path, 'cn')
                nonlocal completed
                completed += 1
                if progress_callback and completed % 50 == 0:
                    progress_callback(
                        int(completed / total * 100),
                        f"Processed {ticker}"
                    )
        
        await asyncio.gather(*(process_with_semaphore(t) for t in tasks))
        
        if progress_callback:
            progress_callback(100, "✅ A-share scan complete")
    
    def scan_us_market(self, db_path, progress_callback: Callable[[int, str], None] = None):
        """Scan US stocks (ds) - Concurrent version"""
        print(f"🚀 Starting US scan -> {db_path}")
        init_db_custom(db_path)
        
        tasks = self._collect_us_tasks()
        total = len(tasks)
        print(f"📊 Found {total} US symbols")
        
        if total == 0:
            if progress_callback:
                progress_callback(100, "✅ No symbols found")
            return
        
        completed = 0
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(self._process_ticker, ticker, db_path, 'us'): ticker 
                for ticker in tasks
            }
            
            for future in as_completed(futures):
                ticker = futures[future]
                try:
                    future.result()
                except Exception as e:
                    print(f"Error processing {ticker}: {e}")
                
                completed += 1
                if progress_callback and completed % 50 == 0:
                    progress_callback(
                        int(completed / total * 100),
                        f"Processed {ticker}"
                    )
        
        if progress_callback:
            progress_callback(100, "✅ US scan complete")
    
    async def scan_us_market_async(self, db_path, progress_callback: Callable[[int, str], None] = None):
        """Async version for US stock scanning"""
        print(f"🚀 Starting US scan (async) -> {db_path}")
        init_db_custom(db_path)
        
        tasks = self._collect_us_tasks()
        total = len(tasks)
        print(f"📊 Found {total} US symbols (async)")
        
        if total == 0:
            if progress_callback:
                progress_callback(100, "✅ No symbols found")
            return
        
        semaphore = asyncio.Semaphore(self.max_workers)
        completed = 0
        
        async def process_with_semaphore(ticker):
            async with semaphore:
                await asyncio.to_thread(self._process_ticker, ticker, db_path, 'us')
                nonlocal completed
                completed += 1
                if progress_callback and completed % 50 == 0:
                    progress_callback(
                        int(completed / total * 100),
                        f"Processed {ticker}"
                    )
        
        await asyncio.gather(*(process_with_semaphore(t) for t in tasks))
        
        if progress_callback:
            progress_callback(100, "✅ US scan complete")
    
    def _collect_cn_tasks(self) -> List[str]:
        """Collect A-share tasks"""
        tasks = []
        for market in ['sh', 'sz']:
            lday_dir = os.path.join(self.tdx_root, market, 'lday')
            if not os.path.exists(lday_dir):
                continue
            
            files = glob.glob(os.path.join(lday_dir, f'{market}*.day'))
            for f in files:
                fname = os.path.basename(f)
                code = fname[2:-4]
                # Strict whitelist: 00 (SZ main), 30 (ChiNext), 60 (SH main), 68 (STAR)
                if code.startswith(('00', '30', '60', '68')) and len(code) == 6:
                    ticker = f"{code}.{market.upper()}"
                    tasks.append(ticker)
        return tasks
    
    def _collect_us_tasks(self) -> List[str]:
        """Collect US stock tasks"""
        tasks = []
        ds_dir = os.path.join(self.tdx_root, 'ds', 'lday')
        
        if os.path.exists(ds_dir):
            files = glob.glob(os.path.join(ds_dir, '*.day'))
            for f in files:
                fname = os.path.basename(f)
                raw_code = fname.replace('.day', '')
                if '#' in raw_code:
                    raw_code = raw_code.split('#')[-1]
                
                if re.match(r'^[A-Z]+$', raw_code) and 'HK' not in raw_code:
                    tasks.append(raw_code)
        return tasks
    
    def _process_ticker(self, ticker: str, db_path: str, market_type: str):
        """Process single ticker (thread-safe)"""
        try:
            df = self.reader.get_data(ticker, market_type=market_type)
            
            if not df.empty:
                df['ticker'] = ticker
                save_stock_data_custom(df, db_path)
        except Exception as e:
            print(f"Error reading {ticker}: {e}")
            raise


def run_concurrent_scan(tdx_root: str, db_path: str, market: str = 'cn'):
    """Convenience function for concurrent scanning"""
    scanner = MarketScanner(tdx_root)
    
    def progress(pct, msg):
        print(f"Progress: {pct}% - {msg}")
    
    if market == 'cn':
        scanner.scan_cn_market(db_path, progress)
    else:
        scanner.scan_us_market(db_path, progress)


if __name__ == '__main__':
    import time
    
    print("=== Market Scanner Concurrency Test ===\n")
    
    # Example usage
    tdx_root = "/path/to/tdx/vipdoc"
    db_path = "/tmp/market_data.db"
    
    # Note: This is just the implementation, actual usage requires valid paths
    print("Implementation ready for concurrent market scanning")
    print(f"Max concurrency: {MAX_CONCURRENCY}")
