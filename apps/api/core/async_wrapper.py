"""
异步包装器和任务管理器
用于将同步的阻塞函数转换为异步任务
"""

import asyncio
from typing import Callable, Any, Dict, Optional
from cachetools import TTLCache
import hashlib
import time


def run_in_thread(func: Callable) -> Callable:
    """
    装饰器：将同步阻塞函数包装为异步函数，在单独的线程中执行
    
    示例：
        @run_in_thread
        def blocking_function(x, y):
            time.sleep(5)  # 阻塞操作
            return x + y
        
        # 在异步代码中使用
        result = await blocking_function(1, 2)
    """
    async def wrapper(*args, **kwargs):
        return await asyncio.to_thread(func, *args, **kwargs)
    return wrapper


class AsyncTaskManager:
    """
    异步任务管理器
    
    管理长时间运行的扫描任务，支持：
    1. 任务状态跟踪
    2. 进度更新
    3. 任务取消
    4. 结果缓存
    """
    
    def __init__(self):
        self.tasks: Dict[str, Dict] = {}
        self.cache = TTLCache(maxsize=100, ttl=3600)  # 1小时缓存
    
    def create_task(self, task_id: str, func: Callable, *args, **kwargs) -> str:
        """
        创建异步任务
        
        Args:
            task_id: 任务标识符
            func: 要执行的函数
            *args, **kwargs: 函数参数
            
        Returns:
            task_id: 任务ID
        """
        self.tasks[task_id] = {
            "status": "pending",
            "progress": 0,
            "message": "等待启动",
            "result": None,
            "created_at": time.time(),
            "error": None
        }
        
        # 在后台启动任务
        asyncio.create_task(self._run_task(task_id, func, *args, **kwargs))
        
        return task_id
    
    async def _run_task(self, task_id: str, func: Callable, *args, **kwargs):
        """在后台运行任务并更新状态"""
        try:
            self.tasks[task_id]["status"] = "running"
            self.tasks[task_id]["message"] = "任务开始执行"
            
            # 执行函数
            result = await func(*args, **kwargs)
            
            self.tasks[task_id].update({
                "status": "completed",
                "progress": 100,
                "message": "任务完成",
                "result": result
            })
            
            # 缓存结果
            cache_key = f"task_result_{task_id}"
            self.cache[cache_key] = result
            
        except Exception as e:
            self.tasks[task_id].update({
                "status": "failed",
                "message": f"任务失败: {str(e)}",
                "error": str(e)
            })
    
    def update_progress(self, task_id: str, progress: int, message: str = ""):
        """更新任务进度"""
        if task_id in self.tasks:
            self.tasks[task_id]["progress"] = progress
            if message:
                self.tasks[task_id]["message"] = message
    
    def get_task_status(self, task_id: str) -> Optional[Dict]:
        """获取任务状态"""
        return self.tasks.get(task_id)
    
    def cancel_task(self, task_id: str):
        """取消任务（标记为取消状态）"""
        if task_id in self.tasks and self.tasks[task_id]["status"] in ["pending", "running"]:
            self.tasks[task_id].update({
                "status": "cancelled",
                "message": "任务已取消",
                "progress": self.tasks[task_id]["progress"]
            })
    
    def cleanup_old_tasks(self, max_age_hours: int = 24):
        """清理旧任务"""
        current_time = time.time()
        expired_tasks = []
        
        for task_id, task_info in self.tasks.items():
            age_hours = (current_time - task_info["created_at"]) / 3600
            if age_hours > max_age_hours:
                expired_tasks.append(task_id)
        
        for task_id in expired_tasks:
            del self.tasks[task_id]


class ProgressReporter:
    """
    进度报告器
    
    用于在长时间运行的函数中报告进度
    """
    
    def __init__(self, task_manager: AsyncTaskManager, task_id: str, total_steps: int = 100):
        self.task_manager = task_manager
        self.task_id = task_id
        self.total_steps = total_steps
        self.current_step = 0
    
    def update(self, step: Optional[int] = None, message: str = ""):
        """
        更新进度
        
        Args:
            step: 当前步骤（0-total_steps），如果为None则自动递增
            message: 进度消息
        """
        if step is not None:
            self.current_step = step
        else:
            self.current_step += 1
        
        progress = int((self.current_step / self.total_steps) * 100)
        self.task_manager.update_progress(self.task_id, progress, message)


# 全局任务管理器实例
task_manager = AsyncTaskManager()


def get_task_manager() -> AsyncTaskManager:
    """获取全局任务管理器实例"""
    return task_manager