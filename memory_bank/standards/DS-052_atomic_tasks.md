# DS-052: Atomic Tasks (Performance Tuning)

**Feature ID**: T-C2  
**Feature Name**: Performance Optimization  
**Parent Plan**: DS-051_performance_opt  
**Version**: v1.0.0  
**Date**: 2026-02-01  

## Task List

### Task T-C2.1: RSRS Algorithm Vectorization

| 属性 | 值 |
|------|-----|
| **Description** | 优化 `analysis_rsrs.py` 中的 `calculate_rsRS` 函数，移除所有行级遍历，完全使用 Pandas 滚动窗口 (Rolling Window) 和 OLS 向量化计算 |
| **Target File** | `engine/analysis/rsrs.py` |
| **Dependencies** | None |
| **Est. Time** | 2h |
| **Verification** | 运行 `pytest tests/test_performance.py` 对比优化前后耗时 |

### Task T-C2.2: Backend Caching Layer

| 属性 | 值 |
|------|-----|
| **Description** | 在 `data_acquisition.py` 中为 `fetch_historical` 添加内存缓存 (TTL 5分钟)，避免频繁请求上游 API |
| **Target File** | `engine/data/acquisition.py` |
| **Dependencies** | T-C2.1 |
| **Est. Time** | 1h |
| **Verification** | 连续调用两次接口，第二次应瞬间返回 |

### Task T-C2.3: Frontend Chart Memoization

| 属性 | 值 |
|------|-----|
| **Description** | 使用 `React.memo` 包裹 `PriceChart` 和 `ServiceStatus` 组件，并配置自定义对比函数，防止父组件更新时的无效重绘 |
| **Target File** | `client/src/components/charts/PriceChart.tsx`, `client/src/components/ServiceStatus.tsx` |
| **Dependencies** | T-C2.2 |
| **Est. Time** | 2h |
| **Verification** | React Profiler 显示 "Did not render" 当无关状态变更时 |

### Task T-C2.4: Market Scanner Concurrency

| 属性 | 值 |
|------|-----|
| **Description** | 重构 `market_scanner.py`，使用 `asyncio` 并行处理股票列表的指标计算，而非串行处理 |
| **Target File** | `server/core/market_scanner.py` |
| **Dependencies** | T-C2.1 |
| **Est. Time** | 2h |
| **Verification** | 全市场扫描耗时减少 40% 以上 |

## Execution Order

```
T-C2.1 (Core Algo) 
    ↓
T-C2.4 (Scanner) 
    ↓
T-C2.2 (Caching) 
    ↓
T-C2.3 (UI)
```

## Progress Tracking

| Task ID | Status | Progress | Owner |
|---------|--------|----------|-------|
| T-C2.1 | ⏳ Pending | 0% | - |
| T-C2.2 | ⏳ Pending | 0% | - |
| T-C2.3 | ⏳ Pending | 0% | - |
| T-C2.4 | ⏳ Pending | 0% | - |

## Verification Checklist

- [ ] `pytest tests/test_performance.py` passes
- [ ] RSRS calculation < 0.1s
- [ ] Market scanner < 5s for 100 stocks
- [ ] Dashboard FPS >= 60
- [ ] Memory usage < 200MB
