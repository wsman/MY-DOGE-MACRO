"""
WebSocket Hub Models

Type-safe message models for WebSocket communication.
Following CDD §114: Type-first principle.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MessageType(str, Enum):
    """WebSocket message types"""
    # Connection
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    HEARTBEAT = "heartbeat"
    
    # Progress
    PROGRESS_START = "progress_start"
    PROGRESS_UPDATE = "progress_update"
    PROGRESS_COMPLETE = "progress_complete"
    PROGRESS_ERROR = "progress_error"
    
    # Data
    DATA_STREAM = "data_stream"
    DATA_BATCH = "data_batch"
    
    # Notifications
    NOTIFICATION = "notification"
    ALERT = "alert"
    
    # Channel
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    BROADCAST = "broadcast"


class BaseMessage(BaseModel):
    """Base message structure"""
    type: MessageType
    timestamp: datetime = Field(default_factory=datetime.now)
    message_id: Optional[str] = None
    
    class Config:
        use_enum_values = True


class ProgressUpdate(BaseMessage):
    """Progress update message for long-running tasks"""
    type: MessageType = MessageType.PROGRESS_UPDATE
    task_id: str
    progress: float = Field(ge=0, le=1)  # 0.0 to 1.0
    message: str
    current_step: Optional[int] = None
    total_steps: Optional[int] = None
    data: Optional[Dict[str, Any]] = None
    
    @property
    def percentage(self) -> int:
        """Get progress as percentage"""
        return int(self.progress * 100)


class ProgressStart(BaseMessage):
    """Signal that a task has started"""
    type: MessageType = MessageType.PROGRESS_START
    task_id: str
    task_name: str
    total_steps: Optional[int] = None
    estimated_time_seconds: Optional[float] = None


class ProgressComplete(BaseMessage):
    """Signal that a task has completed"""
    type: MessageType = MessageType.PROGRESS_COMPLETE
    task_id: str
    message: str = "Task completed"
    result: Optional[Dict[str, Any]] = None


class ProgressError(BaseMessage):
    """Signal that a task has errored"""
    type: MessageType = MessageType.PROGRESS_ERROR
    task_id: str
    error_message: str
    error_code: Optional[str] = None


class Notification(BaseMessage):
    """User notification message"""
    type: MessageType = MessageType.NOTIFICATION
    title: str
    content: str
    level: str = "info"  # info, success, warning, error
    actions: Optional[List[Dict[str, str]]] = None


class Alert(BaseMessage):
    """System alert message"""
    type: MessageType = MessageType.ALERT
    title: str
    content: str
    severity: str = "medium"  # low, medium, high, critical
    expires_at: Optional[datetime] = None


class DataStream(BaseMessage):
    """Streaming data message"""
    type: MessageType = MessageType.DATA_STREAM
    stream_id: str
    sequence: int
    data: Dict[str, Any]
    is_final: bool = False


class DataBatch(BaseMessage):
    """Batch data message"""
    type: MessageType = MessageType.DATA_BATCH
    batch_id: str
    items: List[Dict[str, Any]]
    total_items: Optional[int] = None


class ChannelMessage(BaseMessage):
    """Channel pub/sub message"""
    type: MessageType = MessageType.BROADCAST
    channel: str
    payload: Dict[str, Any]
    sender: Optional[str] = None


class Heartbeat(BaseMessage):
    """Heartbeat message"""
    type: MessageType = MessageType.HEARTBEAT
    server_time: datetime = Field(default_factory=datetime.now)