# T-1.9.0-03: 实时数据流 - 技术架构规划

**版本**: v1.0.0  
**创建日期**: 2026-02-06  
**规划者**: Clawd 🦞 (架构师)  
**预计工时**: 3-4 小时

---

## 📊 现状分析

### 已有组件

| 层级 | 组件 | 状态 | 位置 |
|------|------|------|------|
| **后端** | `ConnectionManager` | ✅ 完整实现 | `apps/api/core/websocket.py` |
| **后端** | WebSocket 端点 | ✅ 已注册 | `main.py` → `/ws/{client_id}` |
| **后端** | `price_push_loop` | ⚠️ 仅示例 | `websocket.py` (未启动) |
| **前端** | `useWebSocket` Hook | ✅ 完整实现 | `src/hooks/useWebSocket.ts` |
| **前端** | `apiClient` | ✅ 完整实现 | `src/services/api.ts` |
| **前端** | `analysis.store` | ✅ 结构完整 | `src/stores/analysis.store.ts` |

### 核心问题

```
┌─────────────────────────────────────────────────────────────────┐
│                      问题诊断图                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [后端]                           [前端]                        │
│                                                                 │
│  price_push_loop ──────X────────► useWebSocket                  │
│  (未启动)              │          (已实现但无数据)               │
│                        │                                        │
│  broadcast_ticker ◄────┘          subscribe() ────► 发送成功    │
│  (无真实数据源)                    但无推送返回                  │
│                                                                 │
│  TDX Reader ──────────────────────────────X                     │
│  (数据存在，未接入推送循环)                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**问题 1**: `price_push_loop` 从未在 `main.py` 启动 (`asyncio.create_task` 未调用)  
**问题 2**: 推送循环使用硬编码假数据，未接入真实 TDX 数据源  
**问题 3**: 前端 `useWebSocket` 未在任何组件中实际调用

---

## 🎯 目标架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        目标架构图                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐    │
│  │  TDX Reader  │────►│  DataPusher  │────►│  ConnectionManager   │    │
│  │  (quant-engine)    │  (新组件)     │     │  (已有)              │    │
│  └──────────────┘     └──────────────┘     └──────────┬───────────┘    │
│                                                        │                │
│                            WebSocket /ws/{client_id}   │                │
│  ════════════════════════════════════════════════════════════════════  │
│                                                        ▼                │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐    │
│  │  Dashboard   │◄────│ analysis.store│◄────│   useWebSocket      │    │
│  │  (已有)      │     │  (已有)       │     │   (已有)             │    │
│  └──────────────┘     └──────────────┘     └──────────────────────┘    │
│                                                                         │
│  ┌──────────────┐                          ┌──────────────────────┐    │
│  │ MarketOverview│◄─────────────────────────│ WebSocketProvider   │    │
│  │  (已有)       │                          │ (新组件)             │    │
│  └──────────────┘                          └──────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 子任务分解

### T-03a: 后端推送循环启动与数据源接入 (45min)

#### 目标
1. 在 FastAPI 启动时启动 `price_push_loop`
2. 将假数据替换为 TDX 实时/模拟数据

#### 技术方案

**文件**: `apps/api/main.py`

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时：启动价格推送任务
    push_task = asyncio.create_task(price_push_loop())
    print("[Lifespan] Price push loop started")
    
    yield  # 应用运行中
    
    # 关闭时：取消推送任务
    push_task.cancel()
    try:
        await push_task
    except asyncio.CancelledError:
        print("[Lifespan] Price push loop stopped")

app = FastAPI(
    title="MY-DOGE Quant API", 
    version="1.0.0",
    lifespan=lifespan  # 注册生命周期
)
```

**文件**: `apps/api/core/websocket.py` - 改造 `price_push_loop`

```python
import sys
sys.path.insert(0, '/path/to/libs/quant-engine')
from data.tdx_reader import TDXReader

async def price_push_loop():
    """真实价格推送循环"""
    tdx = TDXReader()  # 初始化 TDX 读取器
    
    # 监控的核心标的
    CORE_TICKERS = [
        "000001",  # 上证指数
        "399001",  # 深证成指
        "399006",  # 创业板指
        "GC=F",    # 黄金期货 (如已接入)
        "BTC-USD", # 比特币 (如已接入)
    ]
    
    while True:
        await asyncio.sleep(5)  # 5秒推送间隔
        
        for ticker in CORE_TICKERS:
            # 检查是否有订阅者
            if ticker not in manager.subscriptions or not manager.subscriptions[ticker]:
                continue
            
            try:
                # 从 TDX 获取最新数据
                quote = tdx.get_realtime_quote(ticker)
                if quote:
                    await manager.broadcast_ticker(ticker, {
                        "price": quote.price,
                        "change": quote.change,
                        "changePercent": quote.pct_chg,
                        "volume": quote.volume,
                        "high": quote.high,
                        "low": quote.low,
                        "timestamp": quote.timestamp.isoformat()
                    })
            except Exception as e:
                print(f"[WS] Error fetching {ticker}: {e}")
```

#### 验收标准
- [ ] 服务器启动日志显示 "Price push loop started"
- [ ] 订阅后每 5 秒收到 `price_update` 消息
- [ ] 关闭服务器时推送任务正常取消

---

### T-03b: 前端 WebSocket 集成组件 (45min)

#### 目标
1. 创建 `WebSocketProvider` 上下文组件
2. 在 Dashboard 和关键页面启用实时数据

#### 技术方案

**新文件**: `apps/desktop/src/contexts/WebSocketContext.tsx`

```tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useWebSocket, UseWebSocketReturn } from '../hooks/useWebSocket';

const WebSocketContext = createContext<UseWebSocketReturn | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  debug?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  debug = false 
}) => {
  const ws = useWebSocket({ debug });
  
  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): UseWebSocketReturn => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};

export default WebSocketProvider;
```

**修改**: `apps/desktop/src/App.tsx`

```tsx
import Router from './routes';
import { WebSocketProvider } from './contexts/WebSocketContext';

function App() {
  return (
    <WebSocketProvider debug={import.meta.env.DEV}>
      <Router />
    </WebSocketProvider>
  );
}

export default App;
```

**修改**: `apps/desktop/src/components/dashboard/Dashboard.tsx` (增加订阅逻辑)

```tsx
import { useWebSocketContext } from '../../contexts/WebSocketContext';

export const Dashboard: React.FC = () => {
  const { status, subscribe, unsubscribe, subscriptions } = useWebSocketContext();
  
  // 核心监控标的
  const CORE_TICKERS = ['000001', '399001', '399006', 'GC=F', 'BTC-USD'];
  
  // 组件挂载时订阅，卸载时取消
  useEffect(() => {
    CORE_TICKERS.forEach(ticker => subscribe(ticker));
    
    return () => {
      CORE_TICKERS.forEach(ticker => unsubscribe(ticker));
    };
  }, [subscribe, unsubscribe]);
  
  // ... 其余代码
};
```

#### 验收标准
- [ ] `WebSocketProvider` 在应用根部挂载
- [ ] Dashboard 挂载后自动订阅 5 个核心标的
- [ ] DevTools Console 显示 WebSocket 连接日志

---

### T-03c: 断线重连与状态指示 (30min)

#### 目标
1. 优化重连策略（指数退避）
2. 在 UI 显示连接状态

#### 技术方案

**现状**: `useWebSocket.ts` 已实现指数退避，需确认参数合理

```typescript
// 当前参数 (已在 useWebSocket.ts 中)
reconnectInterval = 3000,      // 初始 3 秒
maxReconnectAttempts = 10,     // 最多 10 次
// 退避公式: min(3000 * 1.5^n, 30000)
// 即: 3s → 4.5s → 6.75s → 10s → 15s → 22.5s → 30s → 30s → 30s → 30s
```

**新组件**: `apps/desktop/src/components/molecules/ConnectionIndicator.tsx`

```tsx
import React from 'react';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { Badge } from '../atoms/Badge';
import { StatusDot } from '../atoms/StatusDot';

export const ConnectionIndicator: React.FC = () => {
  const { status, error, stats } = useWebSocketContext();
  
  const statusConfig = {
    connected: { variant: 'success', label: '已连接', dot: 'connected' },
    connecting: { variant: 'warning', label: '连接中', dot: 'loading' },
    reconnecting: { variant: 'warning', label: '重连中', dot: 'loading' },
    disconnected: { variant: 'neutral', label: '未连接', dot: 'disconnected' },
    error: { variant: 'danger', label: '连接错误', dot: 'error' },
  } as const;
  
  const config = statusConfig[status];
  
  return (
    <div className="connection-indicator">
      <StatusDot status={config.dot} />
      <Badge variant={config.variant} size="sm">
        WS: {config.label}
      </Badge>
      {stats.reconnectAttempts > 0 && status === 'reconnecting' && (
        <span className="reconnect-count">
          ({stats.reconnectAttempts}/10)
        </span>
      )}
    </div>
  );
};
```

**集成位置**: `MainLayout.tsx` Footer 状态栏

```tsx
// 在 footer--status 区域添加
<ConnectionIndicator />
```

#### 验收标准
- [ ] 断网后 3 秒内开始重连
- [ ] 重连间隔逐步增加到 30 秒封顶
- [ ] UI 显示 "重连中 (3/10)" 样式
- [ ] 网络恢复后自动重连成功

---

### T-03d: 价格实时更新 UI (30min)

#### 目标
1. 价格变动动画（闪烁高亮）
2. 涨跌颜色即时切换

#### 技术方案

**新组件**: `apps/desktop/src/components/atoms/PriceDisplay/PriceDisplay.tsx`

```tsx
import React, { useEffect, useRef, useState } from 'react';
import './PriceDisplay.css';

interface PriceDisplayProps {
  value: number;
  previousValue?: number;
  currency?: string;
  decimals?: number;
  showChange?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  value,
  previousValue,
  currency = '',
  decimals = 2,
  showChange = true,
}) => {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(value);
  
  useEffect(() => {
    if (value !== prevRef.current) {
      const direction = value > prevRef.current ? 'up' : 'down';
      setFlash(direction);
      prevRef.current = value;
      
      // 300ms 后移除闪烁
      const timer = setTimeout(() => setFlash(null), 300);
      return () => clearTimeout(timer);
    }
  }, [value]);
  
  const changePercent = previousValue 
    ? ((value - previousValue) / previousValue) * 100 
    : 0;
  
  const colorClass = changePercent >= 0 ? 'price--up' : 'price--down';
  const flashClass = flash ? `price--flash-${flash}` : '';
  
  return (
    <span className={`price-display ${colorClass} ${flashClass}`}>
      {currency}{value.toFixed(decimals)}
      {showChange && previousValue && (
        <span className="price-change">
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      )}
    </span>
  );
};
```

**CSS**: `apps/desktop/src/components/atoms/PriceDisplay/PriceDisplay.css`

```css
.price-display {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
  transition: color 0.2s ease;
}

.price--up { color: var(--color-success, #22c55e); }
.price--down { color: var(--color-danger, #ef4444); }

.price--flash-up {
  animation: flash-up 0.3s ease;
}

.price--flash-down {
  animation: flash-down 0.3s ease;
}

@keyframes flash-up {
  0%, 100% { background: transparent; }
  50% { background: rgba(34, 197, 94, 0.3); }
}

@keyframes flash-down {
  0%, 100% { background: transparent; }
  50% { background: rgba(239, 68, 68, 0.3); }
}

.price-change {
  margin-left: 0.5em;
  font-size: 0.85em;
  opacity: 0.8;
}
```

#### 验收标准
- [ ] 价格上涨时显示绿色 + 上闪动画
- [ ] 价格下跌时显示红色 + 下闪动画
- [ ] 闪烁持续 300ms 后恢复
- [ ] 数字使用等宽字体避免抖动

---

### T-03e: 心跳检测与连接健康度 (20min)

#### 目标
1. 确保心跳正常工作（已实现，需验证）
2. 添加连接延迟监控

#### 技术方案

**修改**: `useWebSocket.ts` 添加 RTT 测量

```typescript
// 在 stats 中添加
interface WebSocketStats {
  messagesReceived: number;
  messagesSent: number;
  lastMessageTime: Date | null;
  reconnectAttempts: number;
  latencyMs: number | null;  // 新增
}

// 在 sendPing 时记录发送时间
const lastPingTimeRef = useRef<number>(0);

const sendPing = useCallback(() => {
  lastPingTimeRef.current = Date.now();
  sendMessage({
    action: 'ping',
    timestamp: new Date().toISOString(),
  });
}, [sendMessage]);

// 在 handleMessage 的 pong 分支
case 'pong':
  const rtt = Date.now() - lastPingTimeRef.current;
  setLatency(rtt);
  log(`Received pong, RTT: ${rtt}ms`);
  break;
```

**显示**: 在 `ConnectionIndicator` 添加延迟

```tsx
{status === 'connected' && stats.latencyMs !== null && (
  <span className="latency">
    {stats.latencyMs}ms
  </span>
)}
```

#### 验收标准
- [ ] 每 15 秒发送一次心跳 ping
- [ ] UI 显示实时 RTT 延迟
- [ ] 延迟 > 1000ms 显示警告色

---

## 🔧 技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 推送频率 | 5 秒 | 平衡实时性与服务器负载 |
| 重连策略 | 指数退避 | 避免雪崩式重连 |
| 重连上限 | 10 次 / 30 秒封顶 | 避免无限重试 |
| 心跳间隔 | 15 秒 | 保持连接活跃，低开销 |
| 价格动画 | CSS Animation | GPU 加速，性能好 |
| 状态管理 | Context + Zustand | Context 管理连接，Zustand 管理数据 |

---

## 📊 数据流详图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           数据流时序图                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [TDXReader]        [DataPusher]      [WS Server]      [WS Client]      │
│       │                  │                 │                │           │
│       │                  │                 │   connect()    │           │
│       │                  │                 │◄───────────────│           │
│       │                  │                 │                │           │
│       │                  │                 │   subscribe    │           │
│       │                  │                 │   ("000001")   │           │
│       │                  │                 │◄───────────────│           │
│       │                  │                 │                │           │
│       │    [每 5 秒]      │                 │                │           │
│       │◄─────────────────│                 │                │           │
│       │   get_quote()    │                 │                │           │
│       │─────────────────►│                 │                │           │
│       │   {price, vol}   │                 │                │           │
│       │                  │  broadcast()    │                │           │
│       │                  │────────────────►│                │           │
│       │                  │                 │  price_update  │           │
│       │                  │                 │───────────────►│           │
│       │                  │                 │                │           │
│       │                  │                 │                │   setMarketData()
│       │                  │                 │                │───────►[Store]
│       │                  │                 │                │           │
│       │                  │                 │                │   UI更新   │
│       │                  │                 │                │◄──────────│
│       │                  │                 │                │           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 文件变更清单

| 操作 | 文件 | 描述 |
|------|------|------|
| **修改** | `apps/api/main.py` | 添加 lifespan 启动推送循环 |
| **修改** | `apps/api/core/websocket.py` | 接入真实 TDX 数据源 |
| **新增** | `apps/desktop/src/contexts/WebSocketContext.tsx` | WebSocket 上下文 |
| **修改** | `apps/desktop/src/App.tsx` | 挂载 WebSocketProvider |
| **修改** | `apps/desktop/src/components/dashboard/Dashboard.tsx` | 添加订阅逻辑 |
| **新增** | `apps/desktop/src/components/molecules/ConnectionIndicator.tsx` | 连接状态指示器 |
| **新增** | `apps/desktop/src/components/atoms/PriceDisplay/` | 价格显示组件 |
| **修改** | `apps/desktop/src/hooks/useWebSocket.ts` | 添加 RTT 测量 |
| **修改** | `apps/desktop/src/components/layout/MainLayout.tsx` | Footer 集成指示器 |

---

## ✅ 总验收标准

### 功能验收

- [ ] 服务器启动后自动开始价格推送循环
- [ ] 前端连接 WebSocket 后自动订阅核心标的
- [ ] 价格变动在 Dashboard 实时反映（≤5 秒延迟）
- [ ] 断网后自动重连，重连成功后恢复订阅
- [ ] UI 显示连接状态（已连接/重连中/断开）

### 性能验收

- [ ] 单个 WebSocket 连接内存增长 < 1MB/小时
- [ ] 价格更新 CPU 占用 < 5%
- [ ] 心跳 RTT < 100ms (本地)

### 边界情况

- [ ] 服务器重启后前端自动重连
- [ ] 多标签页共享连接状态（可选优化）
- [ ] 无订阅者时不发送推送（节省资源）

---

## 📅 执行顺序

```
T-03a (后端推送启动) ─────┐
                          ├──► T-03b (前端集成) ──► T-03c (断线重连)
T-03d (价格动画)    ──────┘                              │
                                                         ▼
                                                   T-03e (心跳监控)
```

**建议**: T-03a 和 T-03d 可并行开发（后端 / 前端分工）

---

*规划基于 CDD v1.6.1 架构标准 | 2026-02-06*
