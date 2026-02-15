import sys
import os
import argparse
import asyncio
import signal
import psutil
import json
import uuid
from decimal import Decimal
from typing import Optional, List
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException, Depends, BackgroundTasks, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from collections import defaultdict
import time

# 确保当前目录在Python路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入新的API路由
from .core.api_routes import router as quant_router
from .core.macro_api_routes import router as macro_router
from .core.sync_routes import router as sync_router
# 导入认证路由
from .routes.auth import router as auth_router
# 导入统一的WebSocket模块
from .core.websocket_hub_integration import websocket_endpoint, manager, price_push_loop

# --- 1. 数据模型严谨性 ---
class StockPrice(BaseModel):
    symbol: str
    price: Decimal  # Python端保持高精度
    change: Decimal
    volume: int
    
    # 自定义序列化：转为字符串给前端
    class Config:
        json_encoders = {
            Decimal: lambda v: f"{v:.4f}"
        }

class ScanRequest(BaseModel):
    mode: str  # "CN" 或 "US"
    tdx_path: str

class ScanResponse(BaseModel):
    task_id: str
    status: str
    progress: int = 0
    message: str = ""
    result: Optional[dict] = None

# --- 生命周期管理 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时：启动价格推送任务
    push_task = asyncio.create_task(price_push_loop())
    print("[Lifespan] Price push loop started")
    
    yield  # 应用运行中
    
    # 关闭时：取消推送任务
    push_task.cancel()
    try:
        await push_task
    except asyncio.CancelledError:
        print("[Lifespan] Price push loop stopped")

# --- 2. 核心服务 ---
app = FastAPI(
    title="MY-DOGE Quant API", 
    version="1.0.0",
    lifespan=lifespan  # 注册生命周期
)
AUTH_TOKEN = None  # 启动时注入

# CORS配置（允许Tauri前端直连和开发服务器）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for LAN access
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZIP压缩中间件（提高数据传输性能）
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 安全响应头中间件 (T-C5.4)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """添加安全响应头"""
    response = await call_next(request)

    # 安全相关响应头
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

    # 移除指纹识别头 (兼容 Starlette MutableHeaders)
    if "Server" in response.headers:
        del response.headers["Server"]
    if "X-Powered-By" in response.headers:
        del response.headers["X-Powered-By"]

    return response

# --- 内存存储扫描任务状态 ---
scan_tasks = {}

# --- 速率限制配置 (T-C5.2) ---
RATE_LIMIT_WINDOW = 60  # 60秒窗口
RATE_LIMIT_REQUESTS = 100  # 每个IP最多100请求/分钟

# 简单的内存速率限制器
rate_limit_storage = defaultdict(list)

def check_rate_limit(client_ip: str) -> tuple[bool, int]:
    """
    检查速率限制
    返回: (是否通过, 剩余请求数)
    """
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    
    # 清理过期记录
    rate_limit_storage[client_ip] = [
        t for t in rate_limit_storage[client_ip] if t > window_start
    ]
    
    request_count = len(rate_limit_storage[client_ip])
    remaining = RATE_LIMIT_REQUESTS - request_count
    
    if request_count >= RATE_LIMIT_REQUESTS:
        return False, 0
    
    # 记录请求
    rate_limit_storage[client_ip].append(now)
    return True, remaining

# --- 速率限制依赖 ---
async def rate_limit_dependency(request: Request):
    """速率限制依赖注入"""
    client_ip = request.client.host if request.client else "unknown"
    
    # 对于本地开发环境，放宽限制
    if client_ip in ["127.0.0.1", "localhost", "::1"]:
        return
    
    is_allowed, remaining = check_rate_limit(client_ip)
    
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again later.",
                "retry_after": RATE_LIMIT_WINDOW
            }
        )

# 注册新的量化API路由
app.include_router(quant_router)
app.include_router(macro_router)
app.include_router(sync_router)
# 注册认证路由
app.include_router(auth_router)

# --- 3. 认证中间件 ---
async def verify_token(x_auth_token: str = Header(...)):
    if x_auth_token != AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid API Token")

# --- 4. API端点 ---
@app.get("/health", dependencies=[Depends(rate_limit_dependency)])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "python_version": sys.version,
        "service": "MY-DOGE Quant API"
    }

@app.get("/health_check")
async def simple_health_check():
    """
    简化的健康检查端点，用于前端连接测试
    无需认证，无速率限制
    """
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/market/price/{symbol}", dependencies=[Depends(rate_limit_dependency), Depends(verify_token)])
async def get_price(symbol: str):
    # 模拟计算延迟
    await asyncio.sleep(0.01)
    
    # 返回高精度数据，自动序列化为字符串
    return StockPrice(
        symbol=symbol,
        price=Decimal("123.4567"),
        change=Decimal("+1.2345"),
        volume=1000000
    )

@app.post("/scan/market", dependencies=[Depends(rate_limit_dependency), Depends(verify_token)], response_model=ScanResponse)
async def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    
    # 初始化任务状态
    scan_tasks[task_id] = {
        "status": "running",
        "progress": 0,
        "message": "初始化扫描...",
        "result": None
    }
    
    # 启动后台扫描任务
    background_tasks.add_task(run_scan_task, task_id, request.mode, request.tdx_path)
    
    return ScanResponse(
        task_id=task_id,
        status="started",
        progress=0,
        message=f"开始{request.mode}市场扫描"
    )

@app.get("/scan/status/{task_id}", dependencies=[Depends(verify_token)], response_model=ScanResponse)
async def get_scan_status(task_id: str):
    if task_id not in scan_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = scan_tasks[task_id]
    return ScanResponse(
        task_id=task_id,
        status=task["status"],
        progress=task["progress"],
        message=task["message"],
        result=task["result"]
    )

# --- WebSocket 端点 ---
@app.websocket("/ws/{client_id}")
async def websocket_route(websocket: WebSocket, client_id: str):
    """WebSocket 实时数据推送端点"""
    await websocket_endpoint(websocket, client_id)

# --- 5. 后台任务实现 ---
async def run_scan_task(task_id: str, mode: str, tdx_path: str):
    """模拟市场扫描任务"""
    try:
        # 模拟进度更新
        for i in range(1, 11):
            await asyncio.sleep(0.5)  # 模拟处理时间
            progress = i * 10
            
            scan_tasks[task_id].update({
                "progress": progress,
                "message": f"扫描进度 {progress}% - 处理文件中..."
            })
        
        # 模拟完成
        scan_tasks[task_id].update({
            "status": "completed",
            "progress": 100,
            "message": f"{mode}市场扫描完成",
            "result": {
                "total_stocks": 3500 if mode == "CN" else 8000,
                "scanned_files": 125,
                "filtered_count": 200,
                "execution_time": "5.2秒"
            }
        })
        
    except Exception as e:
        scan_tasks[task_id].update({
            "status": "failed",
            "message": f"扫描失败: {str(e)}"
        })

# --- 6. 僵尸进程防护 (Suicide Mechanism) ---
def monitor_parent(parent_pid: int):
    """如果父进程不存在，则自杀"""
    while True:
        try:
            if not psutil.pid_exists(parent_pid):
                print(f"Parent process {parent_pid} died. Shutting down...")
                os.kill(os.getpid(), signal.SIGTERM)
                break
        except Exception:
            break
        # 非阻塞检查，避免干扰FastAPI
        import threading
        threading.Timer(3.0, lambda: monitor_parent(parent_pid)).start()
        break

# --- 7. 启动入口 ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MY-DOGE Quant API Server")
    parser.add_argument("--port", type=int, default=8765, help="服务端口")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="绑定地址 (0.0.0.0 for LAN access)")
    parser.add_argument("--token", type=str, default="mydoge-token-123456", help="认证令牌")
    parser.add_argument("--parent-pid", type=int, default=None, help="父进程PID（可选）")
    args = parser.parse_args()

    AUTH_TOKEN = args.token
    
    # 将token设置为环境变量，供api_routes使用
    import os
    os.environ["MYDOGE_API_TOKEN"] = AUTH_TOKEN
    
    # 启动守护线程（简化版本）
    if args.parent_pid:
        import threading
        threading.Thread(target=monitor_parent, args=(args.parent_pid,), daemon=True).start()
        print(f"*** Monitoring parent PID: {args.parent_pid}")
    else:
        print("*** Running in standalone mode (no parent monitoring)")

    print(f"*** Starting MY-DOGE Quant API on {args.host}:{args.port}")
    print(f"*** Authentication token: {args.token[:8]}...")
    print(f"*** LAN Access URL: http://{args.host}:{args.port}")
    
    import uvicorn
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")