"""Tests for AI task routing."""

import pytest
from unittest.mock import MagicMock, patch


class TestTaskRouter:
    """Tests for TaskRouter class."""
    
    def test_router_initialization(self):
        """Test router can be initialized."""
        from ai_adapters.routing import TaskRouter
        
        router = TaskRouter()
        assert router is not None
        assert router._models == {}
    
    def test_add_model(self):
        """Test adding a model to router."""
        from ai_adapters.routing import TaskRouter
        
        router = TaskRouter()
        mock_adapter = MagicMock()
        
        router.add_model("gpt-4", mock_adapter, cost_tier=3)
        
        assert "gpt-4" in router._models
        assert router._models["gpt-4"]["adapter"] == mock_adapter
        assert router._models["gpt-4"]["cost_tier"] == 3
    
    def test_invoke_with_routing_by_task_type(self):
        """Test routing based on task type."""
        from ai_adapters.routing import TaskRouter, TaskType
        
        router = TaskRouter()
        
        # Add mock adapters
        fast_adapter = MagicMock()
        fast_adapter.invoke.return_value = "Fast response"
        
        smart_adapter = MagicMock()
        smart_adapter.invoke.return_value = "Smart response"
        
        router.add_model("fast-model", fast_adapter, cost_tier=1, capabilities=[TaskType.SIMPLE])
        router.add_model("smart-model", smart_adapter, cost_tier=3, capabilities=[TaskType.COMPLEX])
        
        # Route simple task
        response = router.invoke_with_routing(
            "Simple question",
            task_type=TaskType.SIMPLE
        )
        
        assert response == "Fast response"
        fast_adapter.invoke.assert_called_once()
    
    def test_invoke_with_routing_by_cost(self):
        """Test routing based on cost preference."""
        from ai_adapters.routing import TaskRouter
        
        router = TaskRouter()
        
        cheap_adapter = MagicMock()
        cheap_adapter.invoke.return_value = "Cheap response"
        
        expensive_adapter = MagicMock()
        expensive_adapter.invoke.return_value = "Expensive response"
        
        router.add_model("cheap", cheap_adapter, cost_tier=1)
        router.add_model("expensive", expensive_adapter, cost_tier=3)
        
        # Route with cost preference
        response = router.invoke_with_routing(
            "Question",
            prefer_low_cost=True
        )
        
        assert response == "Cheap response"
    
    def test_get_available_models(self):
        """Test getting list of available models."""
        from ai_adapters.routing import TaskRouter
        
        router = TaskRouter()
        router.add_model("model-a", MagicMock(), cost_tier=1)
        router.add_model("model-b", MagicMock(), cost_tier=2)
        
        models = router.get_available_models()
        
        assert len(models) == 2
        assert "model-a" in models
        assert "model-b" in models
    
    def test_fallback_on_failure(self):
        """Test fallback to another model on failure."""
        from ai_adapters.routing import TaskRouter
        
        router = TaskRouter()
        
        failing_adapter = MagicMock()
        failing_adapter.invoke.side_effect = Exception("API Error")
        
        working_adapter = MagicMock()
        working_adapter.invoke.return_value = "Fallback response"
        
        router.add_model("failing", failing_adapter, cost_tier=1, priority=1)
        router.add_model("working", working_adapter, cost_tier=2, priority=2)
        
        response = router.invoke_with_fallback("Test question")
        
        assert response == "Fallback response"


class TestTaskType:
    """Tests for TaskType enum."""
    
    def test_task_types_exist(self):
        """Test that expected task types exist."""
        from ai_adapters.routing import TaskType
        
        assert hasattr(TaskType, 'SIMPLE')
        assert hasattr(TaskType, 'COMPLEX')
        assert hasattr(TaskType, 'CREATIVE')
        assert hasattr(TaskType, 'ANALYSIS')
        assert hasattr(TaskType, 'CODING')