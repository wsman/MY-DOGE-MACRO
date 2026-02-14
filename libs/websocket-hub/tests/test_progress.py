"""Tests for Progress Tracker."""

import pytest
from unittest.mock import MagicMock, AsyncMock


class TestProgressTracker:
    """Tests for ProgressTracker class."""
    
    def test_tracker_initialization(self):
        """Test tracker can be initialized."""
        from websocket_hub import ProgressTracker
        
        tracker = ProgressTracker()
        assert tracker is not None
        assert tracker._tasks == {}
    
    def test_start_task(self):
        """Test starting a new task."""
        from websocket_hub import ProgressTracker
        
        tracker = ProgressTracker()
        task = tracker.start_task("Generate chapter", total_steps=5)
        
        assert task.task_id in tracker._tasks
        assert task.name == "Generate chapter"
        assert task.total_steps == 5
        assert task.current_step == 0
        assert task.progress == 0.0
    
    def test_start_task_with_client_id(self):
        """Test starting task with client ID for notifications."""
        from websocket_hub import ProgressTracker
        
        mock_callback = MagicMock()
        tracker = ProgressTracker(progress_callback=mock_callback)
        
        task = tracker.start_task("Task", client_id="client-1", total_steps=3)
        
        assert task.client_id == "client-1"
    
    def test_update_task_progress(self):
        """Test updating task progress."""
        from websocket_hub import ProgressTracker
        
        tracker = ProgressTracker()
        task = tracker.start_task("Task", total_steps=10)
        
        tracker.update(task.task_id, 0.5, "Halfway done")
        
        assert tracker._tasks[task.task_id].progress == 0.5
        assert tracker._tasks[task.task_id].message == "Halfway done"
    
    def test_update_task_step(self):
        """Test updating task by step."""
        from websocket_hub import ProgressTracker
        
        tracker = ProgressTracker()
        task = tracker.start_task("Task", total_steps=5)
        
        tracker.update_step(task.task_id, 3, "Step 3 done")
        
        assert tracker._tasks[task.task_id].current_step == 3
        assert tracker._tasks[task.task_id].progress == 0.6  # 3/5
    
    def test_complete_task(self):
        """Test completing a task."""
        from websocket_hub import ProgressTracker
        
        tracker = ProgressTracker()
        task = tracker.start_task("Task", total_steps=5)
        
        tracker.complete(task.task_id, result={"word_count": 2500})
        
        assert tracker._tasks[task.task_id].progress == 1.0
        assert tracker._tasks[task.task_id].status == "completed"
        assert tracker._tasks[task.task_id].result == {"word_count": 2500}
    
    def test_fail_task(self):
        """Test failing a task."""
        from websocket_hub import ProgressTracker
        
        tracker = ProgressTracker()
        task = tracker.start_task("Task")
        
        tracker.fail(task.task_id, error="Something went wrong")
        
        assert tracker._tasks[task.task_id].status == "failed"
        assert tracker._tasks[task.task_id].error == "Something went wrong"
    
    def test_get_task(self):
        """Test getting task by ID."""
        from websocket_hub import ProgressTracker
        
        tracker = ProgressTracker()
        task = tracker.start_task("Task")
        
        retrieved = tracker.get_task(task.task_id)
        
        assert retrieved == task
    
    def test_get_nonexistent_task(self):
        """Test getting nonexistent task returns None."""
        from websocket_hub import ProgressTracker
        
        tracker = ProgressTracker()
        retrieved = tracker.get_task("nonexistent")
        
        assert retrieved is None
    
    def test_cleanup_old_tasks(self):
        """Test cleaning up old completed tasks."""
        from websocket_hub import ProgressTracker
        import time
        
        tracker = ProgressTracker()
        task = tracker.start_task("Task")
        tracker.complete(task.task_id)
        
        # Should not raise error
        tracker.cleanup_old_tasks(max_age_seconds=0)


class TestChannelManager:
    """Tests for ChannelManager class."""
    
    def test_manager_initialization(self):
        """Test channel manager can be initialized."""
        from websocket_hub import ChannelManager
        
        manager = ChannelManager()
        assert manager is not None
        assert manager._channels == {}
    
    def test_subscribe_client_to_channel(self):
        """Test subscribing a client to a channel."""
        from websocket_hub import ChannelManager
        
        manager = ChannelManager()
        manager.subscribe("market-data", "client-1")
        
        assert "client-1" in manager._channels["market-data"]
    
    def test_unsubscribe_client_from_channel(self):
        """Test unsubscribing a client from a channel."""
        from websocket_hub import ChannelManager
        
        manager = ChannelManager()
        manager.subscribe("market-data", "client-1")
        manager.unsubscribe("market-data", "client-1")
        
        assert "client-1" not in manager._channels.get("market-data", set())
    
    def test_get_channel_subscribers(self):
        """Test getting subscribers of a channel."""
        from websocket_hub import ChannelManager
        
        manager = ChannelManager()
        manager.subscribe("news", "client-1")
        manager.subscribe("news", "client-2")
        
        subscribers = manager.get_subscribers("news")
        
        assert len(subscribers) == 2
        assert "client-1" in subscribers
        assert "client-2" in subscribers
    
    def test_get_client_channels(self):
        """Test getting all channels a client is subscribed to."""
        from websocket_hub import ChannelManager
        
        manager = ChannelManager()
        manager.subscribe("news", "client-1")
        manager.subscribe("market", "client-1")
        
        channels = manager.get_client_channels("client-1")
        
        assert len(channels) == 2
        assert "news" in channels
        assert "market" in channels