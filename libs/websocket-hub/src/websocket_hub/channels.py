"""
WebSocket Hub - Channel Manager

Pub/Sub channel management for WebSocket connections.
Following CDD §191: Real-time Communication Axiom
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Callable
from enum import Enum

from websocket_hub.models import MessageType

logger = logging.getLogger(__name__)


class ChannelPermission(str, Enum):
    """Channel access permissions"""
    PUBLIC = "public"        # Anyone can subscribe
    PROTECTED = "protected"  # Requires authorization
    PRIVATE = "private"      # Invite only


@dataclass
class Channel:
    """Represents a pub/sub channel"""
    name: str
    permission: ChannelPermission = ChannelPermission.PUBLIC
    created_at: datetime = field(default_factory=datetime.now)
    subscribers: Set[str] = field(default_factory=set)
    metadata: Dict[str, Any] = field(default_factory=dict)
    max_subscribers: int = 10000
    message_count: int = 0
    
    def can_subscribe(self, client_id: str) -> bool:
        """Check if client can subscribe"""
        if len(self.subscribers) >= self.max_subscribers:
            return False
        return True
    
    def add_subscriber(self, client_id: str) -> bool:
        """Add a subscriber"""
        if not self.can_subscribe(client_id):
            return False
        self.subscribers.add(client_id)
        return True
    
    def remove_subscriber(self, client_id: str) -> None:
        """Remove a subscriber"""
        self.subscribers.discard(client_id)


class ChannelManager:
    """
    Channel-based pub/sub management.
    
    Features:
    - Create and destroy channels
    - Subscribe/unsubscribe clients
    - Access control
    - Channel metadata
    
    Example:
        >>> manager = ChannelManager()
        >>> 
        >>> # Create a channel
        >>> manager.create_channel("market-updates", permission=ChannelPermission.PUBLIC)
        >>> 
        >>> # Subscribe a client
        >>> manager.subscribe("market-updates", client_id)
        >>> 
        >>> # Get subscribers
        >>> subscribers = manager.get_subscribers("market-updates")
        >>> 
        >>> # Broadcast to channel
        >>> for client_id in subscribers:
        ...     await hub.send_to(client_id, message)
    """
    
    def __init__(self):
        self.channels: Dict[str, Channel] = {}
        self._client_channels: Dict[str, Set[str]] = {}  # client_id -> channels
        self._authorization_handlers: Dict[str, Callable] = {}
    
    def create_channel(
        self,
        name: str,
        permission: ChannelPermission = ChannelPermission.PUBLIC,
        metadata: Optional[Dict[str, Any]] = None,
        max_subscribers: int = 10000
    ) -> Channel:
        """
        Create a new channel.
        
        Args:
            name: Channel name
            permission: Access permission level
            metadata: Optional channel metadata
            max_subscribers: Maximum subscribers
            
        Returns:
            The created channel
        """
        if name in self.channels:
            logger.warning(f"Channel {name} already exists")
            return self.channels[name]
        
        channel = Channel(
            name=name,
            permission=permission,
            metadata=metadata or {},
            max_subscribers=max_subscribers
        )
        self.channels[name] = channel
        logger.info(f"Created channel: {name}")
        return channel
    
    def destroy_channel(self, name: str) -> bool:
        """Destroy a channel and unsubscribe all clients"""
        if name not in self.channels:
            return False
        
        channel = self.channels[name]
        
        # Remove channel from all client subscriptions
        for client_id in channel.subscribers:
            if client_id in self._client_channels:
                self._client_channels[client_id].discard(name)
        
        del self.channels[name]
        logger.info(f"Destroyed channel: {name}")
        return True
    
    def subscribe(
        self,
        channel_name: str,
        client_id: str,
        authorize: bool = False
    ) -> bool:
        """
        Subscribe a client to a channel.
        
        Args:
            channel_name: Channel to subscribe to
            client_id: Client ID
            authorize: Skip authorization check
            
        Returns:
            True if subscribed successfully
        """
        # Create channel if doesn't exist
        if channel_name not in self.channels:
            self.create_channel(channel_name)
        
        channel = self.channels[channel_name]
        
        # Check authorization for protected channels
        if channel.permission == ChannelPermission.PROTECTED and not authorize:
            handler = self._authorization_handlers.get(channel_name)
            if handler and not handler(client_id):
                logger.warning(f"Client {client_id} not authorized for {channel_name}")
                return False
        
        # Add to channel
        if not channel.add_subscriber(client_id):
            logger.warning(f"Channel {channel_name} full")
            return False
        
        # Track client subscriptions
        if client_id not in self._client_channels:
            self._client_channels[client_id] = set()
        self._client_channels[client_id].add(channel_name)
        
        logger.debug(f"Client {client_id} subscribed to {channel_name}")
        return True
    
    def unsubscribe(self, channel_name: str, client_id: str) -> bool:
        """Unsubscribe a client from a channel"""
        if channel_name not in self.channels:
            return False
        
        channel = self.channels[channel_name]
        channel.remove_subscriber(client_id)
        
        if client_id in self._client_channels:
            self._client_channels[client_id].discard(channel_name)
        
        logger.debug(f"Client {client_id} unsubscribed from {channel_name}")
        return True
    
    def unsubscribe_all(self, client_id: str) -> List[str]:
        """Unsubscribe a client from all channels"""
        unsubscribed = []
        
        if client_id in self._client_channels:
            for channel_name in list(self._client_channels[client_id]):
                self.unsubscribe(channel_name, client_id)
                unsubscribed.append(channel_name)
        
        return unsubscribed
    
    def get_subscribers(self, channel_name: str) -> Set[str]:
        """Get all subscribers of a channel"""
        if channel_name not in self.channels:
            return set()
        return self.channels[channel_name].subscribers.copy()
    
    def get_client_channels(self, client_id: str) -> Set[str]:
        """Get all channels a client is subscribed to"""
        return self._client_channels.get(client_id, set()).copy()
    
    def set_authorization_handler(
        self,
        channel_name: str,
        handler: Callable[[str], bool]
    ) -> None:
        """Set an authorization handler for a protected channel"""
        self._authorization_handlers[channel_name] = handler
    
    def get_channel_info(self, channel_name: str) -> Optional[Dict[str, Any]]:
        """Get channel information"""
        if channel_name not in self.channels:
            return None
        
        channel = self.channels[channel_name]
        return {
            "name": channel.name,
            "permission": channel.permission.value,
            "subscribers": len(channel.subscribers),
            "max_subscribers": channel.max_subscribers,
            "message_count": channel.message_count,
            "created_at": channel.created_at.isoformat(),
        }
    
    def list_channels(self) -> List[Dict[str, Any]]:
        """List all channels"""
        return [
            self.get_channel_info(name)
            for name in self.channels
        ]
    
    def record_message(self, channel_name: str) -> None:
        """Record that a message was sent to a channel"""
        if channel_name in self.channels:
            self.channels[channel_name].message_count += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get channel manager statistics"""
        return {
            "total_channels": len(self.channels),
            "total_subscriptions": sum(
                len(c.subscribers) for c in self.channels.values()
            ),
            "channels": self.list_channels(),
        }