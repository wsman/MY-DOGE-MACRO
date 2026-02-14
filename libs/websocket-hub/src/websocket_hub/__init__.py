"""
WebSocket Hub - Unified Real-time Communication Library

A unified interface for WebSocket communication, supporting:
- Connection management with automatic heartbeat
- Channel-based pub/sub messaging
- Progress updates for long-running tasks
- Type-safe message handling

Usage:
    from websocket_hub import WebSocketHub, ProgressTracker
    
    # Create hub
    hub = WebSocketHub()
    
    # In FastAPI app
    @app.websocket("/ws/{client_id}")
    async def websocket_endpoint(websocket: WebSocket, client_id: str):
        await hub.connect(client_id, websocket)
        try:
            while True:
                message = await websocket.receive_text()
                await hub.handle_message(client_id, message)
        except WebSocketDisconnect:
            hub.disconnect(client_id)
    
    # Send progress update
    await hub.send_progress(client_id, task_id, progress=0.5, message="Processing...")
"""

__version__ = "1.0.0"
__author__ = "Auto-Pen & MY-DOGE-MACRO Team"

from websocket_hub.hub import WebSocketHub
from websocket_hub.channels import ChannelManager
from websocket_hub.progress import ProgressTracker, ProgressMessage
from websocket_hub.models import (
    MessageType,
    BaseMessage,
    ProgressUpdate,
    Notification,
    DataStream,
)

__all__ = [
    # Version
    "__version__",
    "__author__",
    # Core
    "WebSocketHub",
    "ChannelManager",
    "ProgressTracker",
    "ProgressMessage",
    # Models
    "MessageType",
    "BaseMessage",
    "ProgressUpdate",
    "Notification",
    "DataStream",
]