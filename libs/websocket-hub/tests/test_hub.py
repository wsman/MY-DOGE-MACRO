"""Tests for WebSocket Hub."""

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
import asyncio


class TestWebSocketHub:
    """Tests for WebSocketHub class."""
    
    def test_hub_initialization(self):
        """Test hub can be initialized."""
        from websocket_hub import WebSocketHub
        
        hub = WebSocketHub()
        assert hub is not None
        assert hub._connections == {}
    
    def test_register_connection(self):
        """Test registering a WebSocket connection."""
        from websocket_hub import WebSocketHub
        
        hub = WebSocketHub()
        mock_ws = MagicMock()
        
        hub.register("client-1", mock_ws)
        
        assert "client-1" in hub._connections
        assert hub._connections["client-1"] == mock_ws
    
    def test_unregister_connection(self):
        """Test unregistering a WebSocket connection."""
        from websocket_hub import WebSocketHub
        
        hub = WebSocketHub()
        mock_ws = MagicMock()
        
        hub.register("client-1", mock_ws)
        hub.unregister("client-1")
        
        assert "client-1" not in hub._connections
    
    def test_get_connection(self):
        """Test getting a connection by ID."""
        from websocket_hub import WebSocketHub
        
        hub = WebSocketHub()
        mock_ws = MagicMock()
        
        hub.register("client-1", mock_ws)
        connection = hub.get_connection("client-1")
        
        assert connection == mock_ws
    
    def test_get_nonexistent_connection(self):
        """Test getting a nonexistent connection returns None."""
        from websocket_hub import WebSocketHub
        
        hub = WebSocketHub()
        connection = hub.get_connection("nonexistent")
        
        assert connection is None
    
    @pytest.mark.asyncio
    async def test_send_to_client(self):
        """Test sending message to specific client."""
        from websocket_hub import WebSocketHub
        
        hub = WebSocketHub()
        mock_ws = AsyncMock()
        
        hub.register("client-1", mock_ws)
        await hub.send_to("client-1", {"type": "test", "data": "hello"})
        
        mock_ws.send_json.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_broadcast(self):
        """Test broadcasting message to all clients."""
        from websocket_hub import WebSocketHub
        
        hub = WebSocketHub()
        mock_ws1 = AsyncMock()
        mock_ws2 = AsyncMock()
        
        hub.register("client-1", mock_ws1)
        hub.register("client-2", mock_ws2)
        
        await hub.broadcast({"type": "broadcast", "data": "hello all"})
        
        mock_ws1.send_json.assert_called_once()
        mock_ws2.send_json.assert_called_once()
    
    def test_get_connection_count(self):
        """Test getting number of active connections."""
        from websocket_hub import WebSocketHub
        
        hub = WebSocketHub()
        
        assert hub.get_connection_count() == 0
        
        hub.register("client-1", MagicMock())
        hub.register("client-2", MagicMock())
        
        assert hub.get_connection_count() == 2
    
    def test_get_all_client_ids(self):
        """Test getting all client IDs."""
        from websocket_hub import WebSocketHub
        
        hub = WebSocketHub()
        hub.register("client-1", MagicMock())
        hub.register("client-2", MagicMock())
        
        client_ids = hub.get_all_client_ids()
        
        assert len(client_ids) == 2
        assert "client-1" in client_ids
        assert "client-2" in client_ids