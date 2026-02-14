"""
WebSocket Hub - Progress Tracker

Progress tracking for long-running tasks with real-time updates.
Following CDD §116: Real-time Communication Axiom
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional
from uuid import uuid4

from websocket_hub.models import (
    MessageType,
    ProgressUpdate,
    ProgressStart,
    ProgressComplete,
    ProgressError,
)

logger = logging.getLogger(__name__)


class TaskStatus(str, Enum):
    """Task status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class ProgressMessage:
    """A progress update message"""
    task_id: str
    progress: float
    message: str
    current_step: Optional[int] = None
    total_steps: Optional[int] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class Task:
    """Represents a tracked task"""
    task_id: str
    task_name: str
    status: TaskStatus = TaskStatus.PENDING
    progress: float = 0.0
    message: str = ""
    current_step: int = 0
    total_steps: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    client_id: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def duration_seconds(self) -> Optional[float]:
        """Get task duration in seconds"""
        if not self.started_at:
            return None
        end = self.completed_at or datetime.now()
        return (end - self.started_at).total_seconds()
    
    @property
    def percentage(self) -> int:
        """Get progress as percentage"""
        return int(self.progress * 100)


class ProgressTracker:
    """
    Progress tracking for long-running tasks.
    
    Features:
    - Task lifecycle management
    - Real-time progress updates
    - Step-based progress
    - Task history
    - Callbacks on completion
    
    Example:
        >>> tracker = ProgressTracker()
        >>> 
        >>> # Start a task
        >>> task = tracker.start_task(
        ...     task_name="Generate Novel Chapter",
        ...     client_id="user-123",
        ...     total_steps=5
        ... )
        >>> 
        >>> # Update progress
        >>> tracker.update(task.task_id, 0.2, "Generating outline...")
        >>> tracker.step(task.task_id, "Generating characters...")
        >>> 
        >>> # Complete
        >>> tracker.complete(task.task_id, result={"word_count": 2500})
        >>> 
        >>> # In WebSocket handler
        >>> async def progress_callback(client_id, message):
        ...     await hub.send_to(client_id, message)
    """
    
    def __init__(
        self,
        max_history: int = 1000,
        progress_callback: Optional[Callable] = None
    ):
        self.tasks: Dict[str, Task] = {}
        self.max_history = max_history
        self.progress_callback = progress_callback
        self._history: List[Task] = []
    
    def start_task(
        self,
        task_name: str,
        client_id: Optional[str] = None,
        total_steps: int = 0,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Task:
        """
        Start a new task.
        
        Args:
            task_name: Human-readable task name
            client_id: Associated client ID for notifications
            total_steps: Total number of steps (0 for unknown)
            metadata: Additional task metadata
            
        Returns:
            The created task
        """
        task_id = str(uuid4())
        
        task = Task(
            task_id=task_id,
            task_name=task_name,
            client_id=client_id,
            total_steps=total_steps,
            status=TaskStatus.RUNNING,
            started_at=datetime.now(),
            metadata=metadata or {}
        )
        
        self.tasks[task_id] = task
        logger.info(f"Started task: {task_name} ({task_id})")
        
        # Send start notification
        if self.progress_callback and client_id:
            asyncio.create_task(self._send_start_notification(task))
        
        return task
    
    def update(
        self,
        task_id: str,
        progress: float,
        message: str = "",
        data: Optional[Dict[str, Any]] = None
    ) -> Optional[Task]:
        """
        Update task progress.
        
        Args:
            task_id: Task to update
            progress: Progress value (0.0 to 1.0)
            message: Status message
            data: Additional data
            
        Returns:
            Updated task or None if not found
        """
        task = self.tasks.get(task_id)
        if not task:
            logger.warning(f"Task not found: {task_id}")
            return None
        
        task.progress = max(0.0, min(1.0, progress))
        task.message = message
        
        if data:
            task.metadata.update(data)
        
        # Send progress update
        if self.progress_callback and task.client_id:
            asyncio.create_task(self._send_progress_update(task))
        
        return task
    
    def step(
        self,
        task_id: str,
        message: str = "",
        data: Optional[Dict[str, Any]] = None
    ) -> Optional[Task]:
        """
        Advance task by one step.
        
        Args:
            task_id: Task to update
            message: Step description
            data: Additional data
            
        Returns:
            Updated task or None if not found
        """
        task = self.tasks.get(task_id)
        if not task:
            return None
        
        task.current_step += 1
        
        if task.total_steps > 0:
            task.progress = task.current_step / task.total_steps
        
        task.message = message
        
        if data:
            task.metadata.update(data)
        
        # Send progress update
        if self.progress_callback and task.client_id:
            asyncio.create_task(self._send_progress_update(task))
        
        return task
    
    def complete(
        self,
        task_id: str,
        message: str = "Task completed",
        result: Optional[Dict[str, Any]] = None
    ) -> Optional[Task]:
        """
        Mark task as completed.
        
        Args:
            task_id: Task to complete
            message: Completion message
            result: Task result data
            
        Returns:
            Completed task or None if not found
        """
        task = self.tasks.get(task_id)
        if not task:
            return None
        
        task.status = TaskStatus.COMPLETED
        task.progress = 1.0
        task.message = message
        task.result = result
        task.completed_at = datetime.now()
        
        logger.info(f"Completed task: {task.task_name} ({task_id})")
        
        # Send completion notification
        if self.progress_callback and task.client_id:
            asyncio.create_task(self._send_completion_notification(task))
        
        # Move to history
        self._add_to_history(task)
        
        return task
    
    def fail(
        self,
        task_id: str,
        error_message: str,
        error_code: Optional[str] = None
    ) -> Optional[Task]:
        """
        Mark task as failed.
        
        Args:
            task_id: Task that failed
            error_message: Error description
            error_code: Optional error code
            
        Returns:
            Failed task or None if not found
        """
        task = self.tasks.get(task_id)
        if not task:
            return None
        
        task.status = TaskStatus.FAILED
        task.error = error_message
        task.completed_at = datetime.now()
        
        logger.error(f"Task failed: {task.task_name} ({task_id}) - {error_message}")
        
        # Send error notification
        if self.progress_callback and task.client_id:
            asyncio.create_task(self._send_error_notification(task, error_message, error_code))
        
        # Move to history
        self._add_to_history(task)
        
        return task
    
    def cancel(self, task_id: str) -> Optional[Task]:
        """Cancel a task"""
        task = self.tasks.get(task_id)
        if not task:
            return None
        
        task.status = TaskStatus.CANCELLED
        task.completed_at = datetime.now()
        
        logger.info(f"Cancelled task: {task.task_name} ({task_id})")
        
        self._add_to_history(task)
        
        return task
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get a task by ID"""
        return self.tasks.get(task_id)
    
    def get_active_tasks(self, client_id: Optional[str] = None) -> List[Task]:
        """Get all active (running/pending) tasks"""
        tasks = [
            t for t in self.tasks.values()
            if t.status in (TaskStatus.PENDING, TaskStatus.RUNNING)
        ]
        if client_id:
            tasks = [t for t in tasks if t.client_id == client_id]
        return tasks
    
    def get_task_info(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task information as dict"""
        task = self.tasks.get(task_id)
        if not task:
            return None
        
        return {
            "task_id": task.task_id,
            "task_name": task.task_name,
            "status": task.status.value,
            "progress": task.progress,
            "percentage": task.percentage,
            "message": task.message,
            "current_step": task.current_step,
            "total_steps": task.total_steps,
            "started_at": task.started_at.isoformat() if task.started_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            "duration_seconds": task.duration_seconds,
        }
    
    def _add_to_history(self, task: Task) -> None:
        """Add completed task to history"""
        # Remove from active tasks
        if task.task_id in self.tasks:
            del self.tasks[task.task_id]
        
        # Add to history
        self._history.append(task)
        
        # Trim history
        if len(self._history) > self.max_history:
            self._history = self._history[-self.max_history:]
    
    async def _send_start_notification(self, task: Task) -> None:
        """Send task start notification"""
        message = {
            "type": MessageType.PROGRESS_START,
            "task_id": task.task_id,
            "task_name": task.task_name,
            "total_steps": task.total_steps,
            "timestamp": datetime.now().isoformat(),
        }
        await self.progress_callback(task.client_id, message)
    
    async def _send_progress_update(self, task: Task) -> None:
        """Send progress update notification"""
        message = {
            "type": MessageType.PROGRESS_UPDATE,
            "task_id": task.task_id,
            "progress": task.progress,
            "percentage": task.percentage,
            "message": task.message,
            "current_step": task.current_step,
            "total_steps": task.total_steps,
            "timestamp": datetime.now().isoformat(),
        }
        await self.progress_callback(task.client_id, message)
    
    async def _send_completion_notification(self, task: Task) -> None:
        """Send completion notification"""
        message = {
            "type": MessageType.PROGRESS_COMPLETE,
            "task_id": task.task_id,
            "message": task.message,
            "result": task.result,
            "duration_seconds": task.duration_seconds,
            "timestamp": datetime.now().isoformat(),
        }
        await self.progress_callback(task.client_id, message)
    
    async def _send_error_notification(
        self,
        task: Task,
        error_message: str,
        error_code: Optional[str]
    ) -> None:
        """Send error notification"""
        message = {
            "type": MessageType.PROGRESS_ERROR,
            "task_id": task.task_id,
            "error_message": error_message,
            "error_code": error_code,
            "timestamp": datetime.now().isoformat(),
        }
        await self.progress_callback(task.client_id, message)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get tracker statistics"""
        active_tasks = self.get_active_tasks()
        return {
            "active_tasks": len(active_tasks),
            "history_size": len(self._history),
            "tasks": [self.get_task_info(t.task_id) for t in active_tasks],
        }