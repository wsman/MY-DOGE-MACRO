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

from fastapi import FastAPI, Header, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, Field

# 确保当前目录在Python路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入新的API路由
from server.core.api_routes import router as quant_router
from server.core.macro_api_routes import router as macro_router

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

# --- 2. 核心服务 ---
app = FastAPI(title="MY-DOGE Quant API", version="1.0.0")
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

# 内存存储扫描任务状态
scan_tasks = {}

# 注册新的量化API路由
app.include_router(quant_router)
app.include_router(macro_router)

# --- 3. 认证中间件 ---
async def verify_token(x_auth_token: str = Header(...)):
    if x_auth_token != AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid API Token")

# --- 4. API端点 ---
@app.get("/health", dependencies=[Depends(verify_token)])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "python_version": sys.version,
        "service": "MY-DOGE Quant API"
    }

@app.get("/market/price/{symbol}", dependencies=[Depends(verify_token)])
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

@app.post("/scan/market", dependencies=[Depends(verify_token)], response_model=ScanResponse)
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
