"""
WebSocket Hub - Connection Manager

Central WebSocket connection management with:
- Connection lifecycle handling
- Message broadcasting
- Heartbeat/ping-pong
- Graceful shutdown

Following CDD §191: Real-time Communication Axiom
"""

import asyncio
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Set
from uuid import uuid4

from fastapi import WebSocket, WebSocketDisconnect

from websocket_hub.models import (
    MessageType,
    BaseMessage,
    Heartbeat,
)

logger = logging.getLogger(__name__)


@dataclass
class Connection:
    """Represents a WebSocket connection"""
    client_id: str
    websocket: WebSocket
    connected_at: datetime = field(default_factory=datetime.now)
    last_heartbeat: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)
    subscriptions: Set[str] = field(default_factory=set)
    
    async def send_json(self, data: dict) -> None:
        """Send JSON data to this connection"""
        try:
            await self.websocket.send_json(data)
        except Exception as e:
            logger.warning(f"Failed to send to {self.client_id}: {e}")
            raise
    
    async def send_text(self, text: str) -> None:
        """Send text data to this connection"""
        try:
            await self.websocket.send_text(text)
        except Exception as e:
            logger.warning(f"Failed to send to {self.client_id}: {e}")
            raise


class WebSocketHub:
    """
    Central WebSocket connection manager.
    
    Features:
    - Connection management with unique client IDs
    - Heartbeat monitoring
    - Broadcast and targeted messaging
    - Channel subscriptions
    - Message handlers
    
    Example:
        >>> hub = WebSocketHub()
        >>> 
        >>> # In FastAPI endpoint
        >>> @app.websocket("/ws/{client_id}")
        >>> async def ws_endpoint(websocket: WebSocket, client_id: str):
        ...     await hub.connect(client_id, websocket)
        ...     await hub.listen(client_id)
        ...     hub.disconnect(client_id)
        >>> 
        >>> # Broadcast to all
        >>> await hub.broadcast({"type": "notification", "message": "Hello!"})
        >>> 
        >>> # Send to specific client
        >>> await hub.send_to(client_id, {"type": "progress", "value": 0.5})
    """
    
    def __init__(
        self,
        heartbeat_interval: float = 30.0,
        heartbeat_timeout: float = 60.0,
        max_connections: int = 1000,
    ):
        self.connections: Dict[str, Connection] = {}
        self.heartbeat_interval = heartbeat_interval
        self.heartbeat_timeout = heartbeat_timeout
        self.max_connections = max_connections
        self._message_handlers: Dict[MessageType, Callable] = {}
        self._background_tasks: List[asyncio.Task] = []
        self._running = False
        
        # Register default handlers
        self.register_handler(MessageType.HEARTBEAT, self._handle_heartbeat)
    
    async def connect(
        self,
        client_id: str,
        websocket: WebSocket,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Register a new WebSocket connection.
        
        Args:
            client_id: Unique client identifier
            websocket: The WebSocket connection
            metadata: Optional client metadata
            
        Returns:
            True if connected successfully
        """
        if len(self.connections) >= self.max_connections:
            logger.warning(f"Max connections reached, rejecting {client_id}")
            await websocket.close(code=1013, reason="Server busy")
            return False
        
        # Accept the connection
        await websocket.accept()
        
        # Create connection object
        connection = Connection(
            client_id=client_id,
            websocket=websocket,
            metadata=metadata or {},
        )
        
        self.connections[client_id] = connection
        logger.info(f"Client {client_id} connected. Total: {len(self.connections)}")
        
        # Send welcome message
        await connection.send_json({
            "type": MessageType.CONNECT,
            "client_id": client_id,
            "timestamp": datetime.now().isoformat(),
        })
        
        return True
    
    def disconnect(self, client_id: str) -> None:
        """Remove a client connection"""
        if client_id in self.connections:
            del self.connections[client_id]
            logger.info(f"Client {client_id} disconnected. Total: {len(self.connections)}")
    
    async def listen(self, client_id: str) -> None:
        """
        Listen for messages from a client.
        
        This is a blocking call that runs until the client disconnects.
        """
        connection = self.connections.get(client_id)
        if not connection:
            return
        
        try:
            while True:
                # Receive raw message
                data = await connection.websocket.receive_text()
                
                # Parse and handle
                try:
                    message = json.loads(data)
                    await self._handle_message(client_id, message)
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON from {client_id}: {data[:100]}")
                    
        except WebSocketDisconnect:
            logger.info(f"Client {client_id} disconnected")
        except Exception as e:
            logger.error(f"Error listening to {client_id}: {e}")
        finally:
            self.disconnect(client_id)
    
    async def _handle_message(self, client_id: str, message: dict) -> None:
        """Route message to appropriate handler"""
        msg_type_str = message.get("type", "unknown")
        
        try:
            msg_type = MessageType(msg_type_str)
        except ValueError:
            logger.warning(f"Unknown message type: {msg_type_str}")
            return
        
        handler = self._message_handlers.get(msg_type)
        if handler:
            await handler(client_id, message)
        else:
            logger.debug(f"No handler for {msg_type}")
    
    async def _handle_heartbeat(self, client_id: str, message: dict) -> None:
        """Handle heartbeat message"""
        connection = self.connections.get(client_id)
        if connection:
            connection.last_heartbeat = datetime.now()
            # Send pong
            await connection.send_json({
                "type": MessageType.HEARTBEAT,
                "timestamp": datetime.now().isoformat(),
            })
    
    def register_handler(
        self,
        message_type: MessageType,
        handler: Callable[[str, dict], None]
    ) -> None:
        """Register a handler for a message type"""
        self._message_handlers[message_type] = handler
    
    # ==================== Sending Methods ====================
    
    async def send_to(self, client_id: str, message: dict) -> bool:
        """Send a message to a specific client"""
        connection = self.connections.get(client_id)
        if not connection:
            logger.warning(f"Client {client_id} not found")
            return False
        
        try:
            await connection.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Failed to send to {client_id}: {e}")
            return False
    
    async def broadcast(
        self,
        message: dict,
        exclude: Optional[Set[str]] = None
    ) -> int:
        """
        Broadcast a message to all connected clients.
        
        Args:
            message: The message to send
            exclude: Set of client IDs to exclude
            
        Returns:
            Number of clients that received the message
        """
        exclude = exclude or set()
        sent_count = 0
        
        for client_id, connection in list(self.connections.items()):
            if client_id in exclude:
                continue
            
            try:
                await connection.send_json(message)
                sent_count += 1
            except Exception as e:
                logger.warning(f"Failed to broadcast to {client_id}: {e}")
        
        return sent_count
    
    async def broadcast_to_channel(
        self,
        channel: str,
        message: dict
    ) -> int:
        """Broadcast to all clients subscribed to a channel"""
        sent_count = 0
        
        for client_id, connection in self.connections.items():
            if channel in connection.subscriptions:
                try:
                    await connection.send_json(message)
                    sent_count += 1
                except Exception as e:
                    logger.warning(f"Failed to send to {client_id}: {e}")
        
        return sent_count
    
    # ==================== Progress Helpers ====================
    
    async def send_progress(
        self,
        client_id: str,
        task_id: str,
        progress: float,
        message: str,
        **kwargs
    ) -> bool:
        """Send a progress update to a client"""
        return await self.send_to(client_id, {
            "type": MessageType.PROGRESS_UPDATE,
            "task_id": task_id,
            "progress": progress,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            **kwargs
        })
    
    async def send_notification(
        self,
        client_id: str,
        title: str,
        content: str,
        level: str = "info"
    ) -> bool:
        """Send a notification to a client"""
        return await self.send_to(client_id, {
            "type": MessageType.NOTIFICATION,
            "title": title,
            "content": content,
            "level": level,
            "timestamp": datetime.now().isoformat(),
        })
    
    # ==================== Lifecycle ====================
    
    def start_background_tasks(self) -> None:
        """Start background maintenance tasks"""
        self._running = True
        self._background_tasks.append(
            asyncio.create_task(self._heartbeat_monitor())
        )
        logger.info("WebSocket Hub background tasks started")
    
    async def stop(self) -> None:
        """Gracefully shutdown the hub"""
        self._running = False
        
        # Cancel background tasks
        for task in self._background_tasks:
            task.cancel()
        
        # Close all connections
        for client_id, connection in list(self.connections.items()):
            try:
                await connection.websocket.close(code=1001, reason="Server shutting down")
            except Exception:
                pass
        
        self.connections.clear()
        logger.info("WebSocket Hub stopped")
    
    async def _heartbeat_monitor(self) -> None:
        """Monitor connections for heartbeat timeouts"""
        while self._running:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                
                now = datetime.now()
                timeout_clients = []
                
                for client_id, connection in self.connections.items():
                    elapsed = (now - connection.last_heartbeat).total_seconds()
                    if elapsed > self.heartbeat_timeout:
                        timeout_clients.append(client_id)
                
                # Remove timed out clients
                for client_id in timeout_clients:
                    logger.warning(f"Client {client_id} timed out")
                    self.disconnect(client_id)
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat monitor error: {e}")
    
    # ==================== Stats ====================
    
    def get_stats(self) -> Dict[str, Any]:
        """Get hub statistics"""
        return {
            "total_connections": len(self.connections),
            "max_connections": self.max_connections,
            "clients": [
                {
                    "client_id": c.client_id,
                    "connected_at": c.connected_at.isoformat(),
                    "subscriptions": list(c.subscriptions),
                }
                for c in self.connections.values()
            ]
        }