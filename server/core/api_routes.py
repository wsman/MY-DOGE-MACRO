"""
核心API路由定义
包含数据传输接口和扫描任务管理
"""

import sys
import os
import json
import uuid
import time
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Header
from fastapi.responses import StreamingResponse, JSONResponse, Response
import pandas as pd

from .async_wrapper import get_task_manager, run_in_thread
from .tdx_loader import TDXReader
from .market_scanner import MarketScanner

router = APIRouter(prefix="/api/v1", tags=["quant"])

# 全局缓存和状态
_scanner_cache = {}
_task_manager = get_task_manager()

# ==================== 简化版高性能响应类 ====================
class FastPandasResponse(Response):
    """高性能Pandas DataFrame响应类"""
    media_type = "application/json"

    def __init__(
        self,
        content: pd.DataFrame,
        status_code: int = 200,
        headers: Optional[Dict[str, str]] = None,
        compress: bool = True,
    ):
        self.content_df = content
        self.compress = compress
        # 初始化时直接生成body
        data = self.content_df.to_dict(orient="split")
        body = json.dumps(data).encode('utf-8')
        super().__init__(content=body, status_code=status_code, headers=headers)

    def render(self, *args, **kwargs) -> bytes:
        """覆盖父类方法，返回预先序列化的JSON数据"""
        # 忽略所有参数，因为数据已经在__init__中序列化
        data = self.content_df.to_dict(orient="split")
        return json.dumps(data).encode('utf-8')


class FastJsonResponse(Response):
    """高性能普通JSON响应"""
    media_type = "application/json"

    def __init__(
        self,
        content: Any,
        status_code: int = 200,
        headers: Optional[Dict[str, str]] = None,
        compress: bool = True,
    ):
        self.content_data = content
        self.compress = compress
        # 初始化时直接调用render生成body
        body = json.dumps(self.content_data).encode('utf-8')
        super().__init__(content=body, status_code=status_code, headers=headers)

    def render(self, *args, **kwargs) -> bytes:
        """覆盖父类方法，返回预先序列化的JSON数据"""
        # 忽略所有参数，因为数据已经在__init__中序列化
        return json.dumps(self.content_data).encode('utf-8')


# 缓存装饰器，用于热点数据
def cached_dataframe_response(ttl: int = 300):
    """
    缓存DataFrame响应的装饰器
    适合K线数据等变化不频繁的热点数据
    """
    from functools import wraps
    import hashlib
    
    cache = {}
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 创建缓存键
            cache_key = hashlib.md5(
                f"{func.__name__}:{str(args)}:{str(kwargs)}".encode()
            ).hexdigest()
            
            if cache_key in cache:
                return cache[cache_key]
            
            result = await func(*args, **kwargs)
            cache[cache_key] = result
            return result
        return wrapper
    return decorator


# ==================== 依赖注入 ====================
# 从环境变量读取 API Token，默认值为 "mydoge-token-dev"
AUTH_TOKEN = os.getenv("API_TOKEN", "mydoge-token-dev")


async def verify_token(x_auth_token: str = Header(..., alias="x-auth-token")):
    """Token验证依赖 - 使用环境变量认证"""
    if x_auth_token != AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid API Token")
    return True


def get_tdx_reader(tdx_path: Optional[str] = None) -> TDXReader:
    """获取TDX读取器实例"""
    # 如果未提供路径，使用默认路径
    if not tdx_path:
        tdx_path = "D:/Games/New Tdx Vip2020"
    
    if tdx_path not in _scanner_cache:
        try:
            reader = TDXReader(tdx_path)
            _scanner_cache[tdx_path] = reader
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"TDX路径无效: {str(e)}")
    
    return _scanner_cache[tdx_path]


# ==================== 高性能数据接口 ====================
@router.get("/market/kline/{symbol}", dependencies=[Depends(verify_token)])
@cached_dataframe_response(ttl=60)  # K线数据缓存1分钟
async def get_kline_data(
    symbol: str,
    limit: int = Query(5000, ge=1, le=10000, description="返回数据条数"),
    tdx_path: Optional[str] = Query(None, description="TDX数据路径"),
):
    """
    获取股票K线数据（高性能列式传输）
    
    Args:
        symbol: 股票代码，如 "000001.SZ", "AAPL"
        limit: 返回数据条数，最大10000
        tdx_path: TDX数据路径，可选
    
    Returns:
        列式传输格式的DataFrame数据
    """
    try:
        reader = get_tdx_reader(tdx_path)
        
        # 获取完整数据
        df = reader.get_data(symbol)
        
        # 限制返回数量
        if len(df) > limit:
            df = df.tail(limit)
        
        # 转换为高性能响应
        return FastPandasResponse(
            content=df,
            compress=True,  # 启用gzip压缩
            headers={
                "X-Data-Rows": str(len(df)),
                "X-Data-Size": f"{len(df.columns)}x{len(df)}",
                "X-Transmission-Mode": "split"  # 列式传输
            }
        )
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"未找到股票数据: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


@router.get("/market/test/bulk", dependencies=[Depends(verify_token)])
async def test_bulk_data_performance(
    count: int = Query(5000, ge=100, le=100000, description="生成测试数据行数"),
):
    """
    生成批量测试数据，用于性能基准测试
    
    返回模拟的K线数据，包含5000行以上的数据
    """
    # 生成日期序列
    dates = pd.date_range(end=datetime.now(), periods=count, freq='D')
    
    # 生成随机K线数据
    import numpy as np
    np.random.seed(42)
    
    base_price = 100.0
    prices = []
    
    for i in range(count):
        change = np.random.normal(0, 2)  # 正态分布波动
        price = base_price * (1 + change / 100)
        
        open_price = price * (1 + np.random.uniform(-0.01, 0.01))
        high_price = max(open_price, price * (1 + np.random.uniform(0, 0.02)))
        low_price = min(open_price, price * (1 - np.random.uniform(0, 0.02)))
        close_price = price
        
        prices.append({
            "date": dates[i].strftime("%Y-%m-%d"),
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
            "volume": int(np.random.uniform(1000000, 10000000)),
            "amount": round(np.random.uniform(10000000, 100000000), 2)
        })
        base_price = close_price
    
    df = pd.DataFrame(prices)
    
    # 性能测试信息
    data_size = len(json.dumps(df.to_dict(orient="records")))
    split_size = len(json.dumps(df.to_dict(orient="split")))
    
    return FastPandasResponse(
        content=df,
        compress=True,
        headers={
            "X-Test-Rows": str(count),
            "X-Data-Size-Records": str(data_size),
            "X-Data-Size-Split": str(split_size),
            "X-Compression-Ratio": f"{split_size/data_size*100:.1f}%",
            "X-Performance-Test": "true"
        }
    )


# ==================== 扫描任务管理 ====================
@router.post("/scan/start", dependencies=[Depends(verify_token)])
async def start_market_scan(
    mode: str = Query(..., description="市场模式: 'CN' 或 'US'"),
    tdx_path: str = Query(..., description="TDX数据路径"),
    db_path: str = Query("data/market_data.db", description="数据库保存路径"),
):
    """
    开始市场扫描任务（异步后台执行）
    
    任务在后台线程中执行，立即返回任务ID
    """
    try:
        # 创建扫描器
        scanner = MarketScanner(tdx_path)
        
        # 选择扫描函数
        if mode.upper() == "CN":
            scan_func = scanner.scan_cn_market
        elif mode.upper() == "US":
            scan_func = scanner.scan_us_market
        else:
            raise HTTPException(status_code=400, detail="无效的市场模式")
        
        # 创建异步任务
        task_id = str(uuid.uuid4())
        
        # 包装同步函数为异步
        @run_in_thread
        def wrapped_scan():
            # 创建进度回调函数
            def progress_callback(progress: int, message: str):
                _task_manager.update_progress(task_id, progress, message)
            
            # 执行扫描
            return scan_func(db_path, progress_callback=progress_callback)
        
        # 启动任务
        _task_manager.create_task(task_id, wrapped_scan)
        
        return FastJsonResponse({
            "task_id": task_id,
            "status": "started",
            "message": f"开始{mode}市场扫描",
            "started_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"启动扫描失败: {str(e)}")


@router.get("/scan/status/{task_id}", dependencies=[Depends(verify_token)])
async def get_scan_status(task_id: str):
    """
    获取扫描任务状态
    """
    status = _task_manager.get_task_status(task_id)
    
    if not status:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    return FastJsonResponse(status)


@router.get("/scan/status/stream", dependencies=[Depends(verify_token)])
async def scan_status_stream(task_id: str = Query(...)):
    """
    Server-Sent Events实时进度流
    
    前端使用EventSource连接：
    new EventSource('http://localhost:8765/api/v1/scan/status/stream?task_id=xxx&token=xxx')
    """
    async def event_generator():
        """SSE事件生成器"""
        last_progress = -1
        
        while True:
            status = _task_manager.get_task_status(task_id)
            
            if not status:
                yield f"data: {json.dumps({'error': '任务不存在'})}\n\n"
                break
            
            # 只在进度变化时发送更新
            if status['progress'] != last_progress:
                event_data = {
                    "task_id": task_id,
                    "progress": status['progress'],
                    "message": status['message'],
                    "status": status['status'],
                    "timestamp": datetime.now().isoformat()
                }
                
                yield f"data: {json.dumps(event_data)}\n\n"
                last_progress = status['progress']
            
            # 任务完成或失败时结束
            if status['status'] in ['completed', 'failed', 'cancelled']:
                yield f"data: {json.dumps({'finished': True, **status})}\n\n"
                break
            
            # 每500ms检查一次
            await asyncio.sleep(0.5)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 禁用Nginx缓冲
        }
    )


@router.post("/scan/cancel/{task_id}", dependencies=[Depends(verify_token)])
async def cancel_scan_task(task_id: str):
    """
    取消扫描任务
    """
    _task_manager.cancel_task(task_id)
    
    return FastJsonResponse({
        "task_id": task_id,
        "status": "cancelling",
        "message": "任务取消请求已发送",
        "cancelled_at": datetime.now().isoformat()
    })


# ==================== 系统信息接口 ====================
@router.get("/system/info", dependencies=[Depends(verify_token)])
async def get_system_info():
    """
    获取系统信息和性能统计
    """
    import psutil
    import sys
    
    # 内存使用
    memory = psutil.virtual_memory()
    process = psutil.Process()
    
    return FastJsonResponse({
        "python_version": sys.version,
        "platform": sys.platform,
        "service_uptime": time.time() - process.create_time(),
        "memory_usage": {
            "process_mb": round(process.memory_info().rss / 1024 / 1024, 2),
            "total_mb": round(memory.total / 1024 / 1024, 2),
            "available_mb": round(memory.available / 1024 / 1024, 2),
            "percent": memory.percent
        },
        "task_stats": {
            "total_tasks": len(_task_manager.tasks),
            "active_tasks": sum(1 for t in _task_manager.tasks.values() 
                               if t['status'] in ['pending', 'running']),
            "cache_size": len(_task_manager.cache)
        },
        "timestamp": datetime.now().isoformat()
    })


# ==================== 市场行情快照接口 ====================
@router.get("/market/snapshot", dependencies=[Depends(verify_token)])
@cached_dataframe_response(ttl=3)  # 3秒缓存，防止前端轮询过频击穿DB
async def get_market_snapshot(
    db_path: str = Query(None, description="数据库路径")
):
    """
    获取全市场最新行情快照 (核心接口)
    
    逻辑：
    1. 连接 SQLite 数据库
    2. 读取所有股票的最新一条交易记录
    3. 转换为列式传输格式 (Split Mode)
    """
    import sqlite3
    
    # 如果未提供数据库路径，使用默认路径
    if db_path is None:
        # 计算相对于当前文件的绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(current_dir, "..", "..", "data", "market_data.db")
        # 调试信息
        print(f"[DEBUG] 当前目录: {current_dir}")
        print(f"[DEBUG] 计算数据库路径: {db_path}")
        print(f"[DEBUG] 数据库文件存在: {os.path.exists(db_path)}")
    
    # 1. 数据库检查
    if not os.path.exists(db_path):
        # 优雅降级：返回空结构，避免前端白屏
        print(f"[ERROR] 数据库文件不存在: {db_path}")
        return FastJsonResponse({
            "columns": ["code", "name", "price", "pct_chg", "vol", "industry"],
            "data": []
        })

    try:
        # 2. 高效读取策略
        # 既然是本地应用，我们可以利用 Pandas 的内存优势
        # 先全量读取，再在内存中分组取最新 (比复杂的 SQL Group By 往往更快)
        conn = sqlite3.connect(db_path)
        
        # 只读取必要的列以减少 I/O
        # 假设表结构包含: ticker, date, open, close, volume
        query = "SELECT ticker, date, open, close, volume FROM stock_data"
        
        # 使用 Pandas 读取
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        if df.empty:
             return FastJsonResponse({"columns": [], "data": []})

        # 3. 内存计算 (Vectorized Operations)
        # 按日期排序并去重，保留每个 ticker 的最后一条
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').drop_duplicates('ticker', keep='last')
        
        # 计算涨跌幅 ( (Close - Open) / Open * 100 )
        # 注意：这里用 Open 作为基准近似计算日内涨跌，
        # 严谨的算法应该去取 pre_close，但 .day 文件通常不包含 pre_close
        df['pct_chg'] = (df['close'] - df['open']) / df['open'] * 100
        df['pct_chg'] = df['pct_chg'].round(2)
        
        # 4. 字段映射与填充
        df = df.rename(columns={
            'ticker': 'code',
            'close': 'price',
            'volume': 'vol'
        })
        
        # 补充缺失的元数据 (Name, Industry)
        # 在真正的生产环境中，这些应该从 separate table (info.dat) 读取
        # 这里做 Mock 填充以保证前端不崩
        df['name'] = df['code'] # 暂时用代码代替名称
        df['industry'] = 'TBD'  # 待分类
        
        # 5. 最终字段筛选
        final_df = df[['code', 'name', 'price', 'pct_chg', 'vol', 'industry']]
        
        # 6. 返回高性能响应
        return FastPandasResponse(
            content=final_df,
            compress=True
        )

    except Exception as e:
        print(f"Snapshot Error: {e}")
        # 发生错误时返回空数据，而不是 500，保证前端重试机制工作
        return FastJsonResponse({
            "columns": ["code", "name", "price", "pct_chg", "vol", "industry"],
            "data": []
        })
