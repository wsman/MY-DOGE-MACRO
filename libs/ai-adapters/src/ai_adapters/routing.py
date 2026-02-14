"""
AI Adapters Routing Module

Intelligent routing for multi-model collaboration.
Following CDD principles:
- §193: Model Selector Axiom - Dynamic model selection based on task complexity
- §302: Multi-Model Collaboration - Support for multiple AI models working together
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Callable
import random

from ai_adapters.base import (
    BaseLLMAdapter,
    TaskType,
    LLMResponse,
)

logger = logging.getLogger(__name__)


# ==================== Enums ====================

class RoutingStrategy(str, Enum):
    """Routing strategies for model selection"""
    ROUND_ROBIN = "round_robin"          # 轮询
    LEAST_LATENCY = "least_latency"       # 最低延迟
    COST_OPTIMIZED = "cost_optimized"     # 成本优化
    TASK_BASED = "task_based"             # 任务类型
    FALLBACK = "fallback"                 # 故障转移
    SMART = "smart"                       # 智能综合


# ==================== Data Classes ====================

@dataclass
class ModelMetrics:
    """Performance metrics for a model"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_latency_ms: float = 0.0
    total_tokens: int = 0
    total_cost: float = 0.0
    last_success: Optional[datetime] = None
    last_failure: Optional[datetime] = None
    
    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 1.0
        return self.successful_requests / self.total_requests
    
    @property
    def avg_latency_ms(self) -> float:
        if self.successful_requests == 0:
            return 0.0
        return self.total_latency_ms / self.successful_requests
    
    @property
    def cost_per_1k_tokens(self) -> float:
        if self.total_tokens == 0:
            return 0.0
        return (self.total_cost / self.total_tokens) * 1000


@dataclass
class ModelConfig:
    """Configuration for a model in the routing pool"""
    name: str
    adapter: BaseLLMAdapter
    priority: int = 1                    # 优先级 (1-10)
    cost_per_1k_tokens: float = 0.0      # 每1k token成本
    max_tokens_per_min: int = 100000     # 每分钟最大token数
    supports_vision: bool = False        # 是否支持视觉
    supports_tools: bool = False         # 是否支持工具调用
    task_weights: Dict[TaskType, float] = field(default_factory=dict)
    metrics: ModelMetrics = field(default_factory=ModelMetrics)
    is_healthy: bool = True
    
    def get_task_weight(self, task_type: TaskType) -> float:
        """Get weight for a specific task type"""
        return self.task_weights.get(task_type, 1.0)


@dataclass
class RoutingDecision:
    """Result of a routing decision"""
    selected_model: str
    strategy: RoutingStrategy
    reason: str
    alternatives: List[str] = field(default_factory=list)
    estimated_latency_ms: Optional[float] = None
    estimated_cost: Optional[float] = None


# ==================== Routing Strategies ====================

class BaseRoutingStrategy(ABC):
    """Base class for routing strategies"""
    
    @abstractmethod
    def select(
        self,
        models: Dict[str, ModelConfig],
        task_type: Optional[TaskType] = None,
        **kwargs
    ) -> RoutingDecision:
        """Select the best model based on strategy"""
        pass


class RoundRobinStrategy(BaseRoutingStrategy):
    """Round-robin load balancing"""
    
    def __init__(self):
        self._current_index = 0
    
    def select(
        self,
        models: Dict[str, ModelConfig],
        task_type: Optional[TaskType] = None,
        **kwargs
    ) -> RoutingDecision:
        healthy_models = {k: v for k, v in models.items() if v.is_healthy}
        if not healthy_models:
            raise ValueError("No healthy models available")
        
        model_names = list(healthy_models.keys())
        self._current_index = self._current_index % len(model_names)
        selected = model_names[self._current_index]
        self._current_index += 1
        
        return RoutingDecision(
            selected_model=selected,
            strategy=RoutingStrategy.ROUND_ROBIN,
            reason=f"Round-robin selection (index {self._current_index - 1})",
            alternatives=[n for n in model_names if n != selected]
        )


class LeastLatencyStrategy(BaseRoutingStrategy):
    """Select model with lowest average latency"""
    
    def select(
        self,
        models: Dict[str, ModelConfig],
        task_type: Optional[TaskType] = None,
        **kwargs
    ) -> RoutingDecision:
        healthy_models = {k: v for k, v in models.items() if v.is_healthy}
        if not healthy_models:
            raise ValueError("No healthy models available")
        
        # Sort by average latency
        sorted_models = sorted(
            healthy_models.items(),
            key=lambda x: x[1].metrics.avg_latency_ms
        )
        
        selected = sorted_models[0][0]
        
        return RoutingDecision(
            selected_model=selected,
            strategy=RoutingStrategy.LEAST_LATENCY,
            reason=f"Lowest latency: {sorted_models[0][1].metrics.avg_latency_ms:.1f}ms",
            alternatives=[m[0] for m in sorted_models[1:3]],
            estimated_latency_ms=sorted_models[0][1].metrics.avg_latency_ms
        )


class CostOptimizedStrategy(BaseRoutingStrategy):
    """Select model with best cost-effectiveness"""
    
    def select(
        self,
        models: Dict[str, ModelConfig],
        task_type: Optional[TaskType] = None,
        max_cost: Optional[float] = None,
        **kwargs
    ) -> RoutingDecision:
        healthy_models = {k: v for k, v in models.items() if v.is_healthy}
        if not healthy_models:
            raise ValueError("No healthy models available")
        
        # Filter by max cost if specified
        if max_cost is not None:
            healthy_models = {
                k: v for k, v in healthy_models.items()
                if v.cost_per_1k_tokens <= max_cost
            }
        
        # Sort by cost
        sorted_models = sorted(
            healthy_models.items(),
            key=lambda x: x[1].cost_per_1k_tokens
        )
        
        selected = sorted_models[0][0]
        
        return RoutingDecision(
            selected_model=selected,
            strategy=RoutingStrategy.COST_OPTIMIZED,
            reason=f"Lowest cost: ${sorted_models[0][1].cost_per_1k_tokens:.4f}/1k tokens",
            alternatives=[m[0] for m in sorted_models[1:3]],
            estimated_cost=sorted_models[0][1].cost_per_1k_tokens
        )


class TaskBasedStrategy(BaseRoutingStrategy):
    """Select model based on task type"""
    
    # Default task-to-model type mappings
    TASK_MODEL_PREFERENCES: Dict[TaskType, List[str]] = {
        TaskType.CREATIVE_WRITING: ["gpt-4", "claude", "gemini-pro"],
        TaskType.ANALYSIS: ["gpt-4", "deepseek-reasoner", "claude"],
        TaskType.SUMMARIZATION: ["gpt-4o-mini", "deepseek-chat", "haiku"],
        TaskType.CODE_GENERATION: ["gpt-4", "deepseek-coder", "claude"],
        TaskType.TRANSLATION: ["gpt-4", "deepseek-chat", "gemini-pro"],
        TaskType.REASONING: ["deepseek-reasoner", "o1", "claude"],
        TaskType.CHAT: ["gpt-4o-mini", "deepseek-chat", "llama"],
    }
    
    def select(
        self,
        models: Dict[str, ModelConfig],
        task_type: Optional[TaskType] = None,
        **kwargs
    ) -> RoutingDecision:
        healthy_models = {k: v for k, v in models.items() if v.is_healthy}
        if not healthy_models:
            raise ValueError("No healthy models available")
        
        if task_type is None:
            task_type = TaskType.CHAT
        
        # Get preferred models for this task
        preferences = self.TASK_MODEL_PREFERENCES.get(task_type, [])
        
        # Find best match
        selected = None
        for pref in preferences:
            for model_name in healthy_models:
                if pref.lower() in model_name.lower():
                    selected = model_name
                    break
            if selected:
                break
        
        # Fallback to priority-based selection
        if not selected:
            sorted_models = sorted(
                healthy_models.items(),
                key=lambda x: (x[1].get_task_weight(task_type), -x[1].priority),
                reverse=True
            )
            selected = sorted_models[0][0]
        
        return RoutingDecision(
            selected_model=selected,
            strategy=RoutingStrategy.TASK_BASED,
            reason=f"Task type: {task_type.value}",
            alternatives=[n for n in healthy_models if n != selected][:3]
        )


class FallbackStrategy(BaseRoutingStrategy):
    """Use primary model with fallback chain"""
    
    def __init__(self, fallback_chain: Optional[List[str]] = None):
        self.fallback_chain = fallback_chain or []
    
    def select(
        self,
        models: Dict[str, ModelConfig],
        task_type: Optional[TaskType] = None,
        **kwargs
    ) -> RoutingDecision:
        healthy_models = {k: v for k, v in models.items() if v.is_healthy}
        if not healthy_models:
            raise ValueError("No healthy models available")
        
        # Try fallback chain first
        for model_name in self.fallback_chain:
            if model_name in healthy_models:
                return RoutingDecision(
                    selected_model=model_name,
                    strategy=RoutingStrategy.FALLBACK,
                    reason="From fallback chain",
                    alternatives=[m for m in self.fallback_chain if m != model_name and m in healthy_models]
                )
        
        # Fallback to highest priority healthy model
        sorted_models = sorted(
            healthy_models.items(),
            key=lambda x: x[1].priority,
            reverse=True
        )
        selected = sorted_models[0][0]
        
        return RoutingDecision(
            selected_model=selected,
            strategy=RoutingStrategy.FALLBACK,
            reason="Highest priority healthy model",
            alternatives=[m[0] for m in sorted_models[1:3]]
        )


class SmartStrategy(BaseRoutingStrategy):
    """Smart routing combining multiple factors"""
    
    def __init__(
        self,
        latency_weight: float = 0.3,
        cost_weight: float = 0.3,
        success_rate_weight: float = 0.2,
        task_weight: float = 0.2
    ):
        self.latency_weight = latency_weight
        self.cost_weight = cost_weight
        self.success_rate_weight = success_rate_weight
        self.task_weight = task_weight
        self._task_strategy = TaskBasedStrategy()
    
    def select(
        self,
        models: Dict[str, ModelConfig],
        task_type: Optional[TaskType] = None,
        **kwargs
    ) -> RoutingDecision:
        healthy_models = {k: v for k, v in models.items() if v.is_healthy}
        if not healthy_models:
            raise ValueError("No healthy models available")
        
        # Normalize factors
        max_latency = max(m.metrics.avg_latency_ms for m in healthy_models.values()) or 1
        max_cost = max(m.cost_per_1k_tokens for m in healthy_models.values()) or 1
        
        scores: Dict[str, float] = {}
        
        for name, config in healthy_models.items():
            # Latency score (lower is better, so invert)
            latency_score = 1 - (config.metrics.avg_latency_ms / max_latency)
            
            # Cost score (lower is better, so invert)
            cost_score = 1 - (config.cost_per_1k_tokens / max_cost)
            
            # Success rate score
            success_score = config.metrics.success_rate
            
            # Task affinity score
            task_score = config.get_task_weight(task_type or TaskType.CHAT)
            
            # Combine scores
            total_score = (
                latency_score * self.latency_weight +
                cost_score * self.cost_weight +
                success_score * self.success_rate_weight +
                task_score * self.task_weight
            )
            
            scores[name] = total_score
        
        # Sort by score
        sorted_models = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        selected = sorted_models[0][0]
        selected_config = healthy_models[selected]
        
        return RoutingDecision(
            selected_model=selected,
            strategy=RoutingStrategy.SMART,
            reason=f"Smart score: {sorted_models[0][1]:.3f}",
            alternatives=[m[0] for m in sorted_models[1:3]],
            estimated_latency_ms=selected_config.metrics.avg_latency_ms,
            estimated_cost=selected_config.cost_per_1k_tokens
        )


# ==================== Task Router ====================

class TaskRouter:
    """
    Main routing class for multi-model task distribution.
    
    Example:
        >>> router = TaskRouter()
        >>> router.add_model("gpt-4", gpt4_adapter, cost_per_1k_tokens=0.03)
        >>> router.add_model("deepseek", ds_adapter, cost_per_1k_tokens=0.001)
        >>> 
        >>> # Route a task
        >>> decision = router.route(TaskType.ANALYSIS)
        >>> response = router.invoke(decision.selected_model, "Analyze this...")
    """
    
    STRATEGY_MAP: Dict[RoutingStrategy, type] = {
        RoutingStrategy.ROUND_ROBIN: RoundRobinStrategy,
        RoutingStrategy.LEAST_LATENCY: LeastLatencyStrategy,
        RoutingStrategy.COST_OPTIMIZED: CostOptimizedStrategy,
        RoutingStrategy.TASK_BASED: TaskBasedStrategy,
        RoutingStrategy.FALLBACK: FallbackStrategy,
        RoutingStrategy.SMART: SmartStrategy,
    }
    
    def __init__(
        self,
        default_strategy: RoutingStrategy = RoutingStrategy.SMART,
        fallback_chain: Optional[List[str]] = None
    ):
        self.models: Dict[str, ModelConfig] = {}
        self.default_strategy = default_strategy
        self.fallback_chain = fallback_chain or []
        self._strategies: Dict[RoutingStrategy, BaseRoutingStrategy] = {}
    
    def _get_strategy(self, strategy: RoutingStrategy) -> BaseRoutingStrategy:
        """Get or create strategy instance"""
        if strategy not in self._strategies:
            strategy_class = self.STRATEGY_MAP.get(strategy, SmartStrategy)
            if strategy == RoutingStrategy.FALLBACK:
                self._strategies[strategy] = strategy_class(self.fallback_chain)
            else:
                self._strategies[strategy] = strategy_class()
        return self._strategies[strategy]
    
    def add_model(
        self,
        name: str,
        adapter: BaseLLMAdapter,
        priority: int = 1,
        cost_per_1k_tokens: float = 0.0,
        task_weights: Optional[Dict[TaskType, float]] = None,
        **kwargs
    ) -> None:
        """Add a model to the routing pool"""
        self.models[name] = ModelConfig(
            name=name,
            adapter=adapter,
            priority=priority,
            cost_per_1k_tokens=cost_per_1k_tokens,
            task_weights=task_weights or {},
            **kwargs
        )
        logger.info(f"Added model '{name}' to routing pool")
    
    def remove_model(self, name: str) -> None:
        """Remove a model from the routing pool"""
        if name in self.models:
            del self.models[name]
            logger.info(f"Removed model '{name}' from routing pool")
    
    def set_model_health(self, name: str, is_healthy: bool) -> None:
        """Set model health status"""
        if name in self.models:
            self.models[name].is_healthy = is_healthy
            status = "healthy" if is_healthy else "unhealthy"
            logger.info(f"Model '{name}' marked as {status}")
    
    def route(
        self,
        task_type: Optional[TaskType] = None,
        strategy: Optional[RoutingStrategy] = None,
        **kwargs
    ) -> RoutingDecision:
        """Route to the best model for the given task"""
        use_strategy = strategy or self.default_strategy
        strategy_instance = self._get_strategy(use_strategy)
        return strategy_instance.select(self.models, task_type, **kwargs)
    
    def invoke(
        self,
        model_name: str,
        prompt: str,
        **kwargs
    ) -> LLMResponse:
        """Invoke a specific model"""
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not found in routing pool")
        
        config = self.models[model_name]
        return config.adapter.invoke_with_metadata(prompt, **kwargs)
    
    def invoke_with_routing(
        self,
        prompt: str,
        task_type: Optional[TaskType] = None,
        strategy: Optional[RoutingStrategy] = None,
        fallback_on_failure: bool = True,
        **kwargs
    ) -> LLMResponse:
        """
        Route and invoke in one step.
        
        Args:
            prompt: The prompt to send
            task_type: Type of task for routing
            strategy: Routing strategy to use
            fallback_on_failure: Whether to fallback on failure
            **kwargs: Additional arguments for the model
        
        Returns:
            LLMResponse from the selected model
        """
        decision = self.route(task_type, strategy, **kwargs)
        
        try:
            return self.invoke(decision.selected_model, prompt, **kwargs)
        except Exception as e:
            logger.error(f"Model '{decision.selected_model}' failed: {e}")
            
            if fallback_on_failure and decision.alternatives:
                for alt_model in decision.alternatives:
                    try:
                        logger.info(f"Falling back to '{alt_model}'")
                        return self.invoke(alt_model, prompt, **kwargs)
                    except Exception as alt_e:
                        logger.error(f"Fallback model '{alt_model}' also failed: {alt_e}")
            
            raise
    
    def get_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get metrics for all models"""
        return {
            name: {
                "success_rate": config.metrics.success_rate,
                "avg_latency_ms": config.metrics.avg_latency_ms,
                "total_requests": config.metrics.total_requests,
                "cost_per_1k_tokens": config.cost_per_1k_tokens,
                "is_healthy": config.is_healthy,
            }
            for name, config in self.models.items()
        }