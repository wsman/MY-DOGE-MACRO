# T-06 警报系统 & T-05 多资产联动分析 - 技术架构规划

**版本**: v1.0.0  
**创建日期**: 2026-02-06 14:07  
**规划者**: Clawd 🦞 (架构师)  
**关联任务**: T-1.9.0-05, T-1.9.0-06

---

## 📊 架构总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         T-05 & T-06 系统架构图                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        数据层 (已有)                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │  WebSocket   │  │  TDX Reader  │  │  GlobalMacroLoader       │   │   │
│  │  │  实时价格推送 │  │  A股数据源   │  │  全球资产 (QQQ/GLD/BTC)  │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘   │   │
│  └─────────┼─────────────────┼───────────────────────┼─────────────────┘   │
│            │                 │                       │                     │
│            ▼                 ▼                       ▼                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      分析层 (新增 + 扩展)                           │   │
│  │                                                                     │   │
│  │  ┌───────────────────┐       ┌───────────────────────────────────┐ │   │
│  │  │   T-06 AlertEngine │       │     T-05 CorrelationAnalyzer      │ │   │
│  │  │   ─────────────── │       │     ─────────────────────────────  │ │   │
│  │  │   • 规则引擎       │       │     • 相关性矩阵计算               │ │   │
│  │  │   • 阈值监控       │       │     • 滚动窗口分析                 │ │   │
│  │  │   • 信号检测       │       │     • 异动检测                     │ │   │
│  │  │   • 冷却控制       │       │     • 趋势分析                     │ │   │
│  │  └─────────┬─────────┘       └─────────────────┬─────────────────┘ │   │
│  └────────────┼───────────────────────────────────┼─────────────────────┘   │
│               │                                   │                         │
│               ▼                                   ▼                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        表现层 (新增)                                │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │   │
│  │  │ AlertRulePanel  │  │ NotificationCenter│  │ CorrelationPanel   │ │   │
│  │  │ 规则配置界面    │  │ 通知中心          │  │ 相关性热力图       │ │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────────────────┐ │   │
│  │  │ SystemTray      │  │        MultiAssetDashboard               │ │   │
│  │  │ Tauri 系统通知  │  │        多资产联动面板                    │ │   │
│  │  └─────────────────┘  └─────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 🔔 T-06: 警报系统

## 现状分析

| 组件 | 状态 | 位置 |
|------|------|------|
| `Notification` 类型 | ✅ | `types/index.ts` |
| `ui.store` 通知管理 | ✅ | `stores/ui.store.ts` (已有 addNotification) |
| `useWebSocket` | ✅ | `hooks/useWebSocket.ts` (实时数据) |
| `analysis.store` | ✅ | `stores/analysis.store.ts` (市场数据) |
| Tauri 通知插件 | ❌ | 需要添加 `tauri-plugin-notification` |

## 子任务分解

| ID | 任务 | 描述 | 预计 |
|----|------|------|------|
| **T-06a** | 警报规则引擎 | AlertRule 类型 + Zustand store | 45min |
| **T-06b** | 价格阈值监控 | useAlertMonitor hook | 45min |
| **T-06c** | 技术指标信号 | RSRS/VolSkew 信号触发 | 30min |
| **T-06d** | Tauri 系统通知 | tauri-plugin-notification | 30min |
| **T-06e** | 通知中心 UI | NotificationCenter 组件 | 30min |
| **T-06f** | 警报规则配置 | AlertRulePanel 组件 | 30min |

**总预计**: 3.5h

---

## 技术方案

### T-06a: 警报规则引擎

#### 类型定义

**文件**: `src/types/alerts.ts`

```typescript
/**
 * 警报规则类型
 */
export type AlertRuleType = 
  | 'price_above'       // 价格突破上限
  | 'price_below'       // 价格跌破下限
  | 'change_percent'    // 涨跌幅超过阈值
  | 'volume_spike'      // 成交量异动
  | 'rsrs_signal'       // RSRS 信号
  | 'volatility_high'   // 波动率过高
  | 'correlation_break' // 相关性突变

/**
 * 警报优先级
 */
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * 警报规则
 */
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  type: AlertRuleType;
  ticker: string;           // 监控标的 (* 表示全部)
  condition: {
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
    value: number;
    value2?: number;        // 用于 between
  };
  priority: AlertPriority;
  cooldownMinutes: number;  // 冷却时间 (防止重复触发)
  createdAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
}

/**
 * 警报事件
 */
export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  ruleType: AlertRuleType;
  ticker: string;
  message: string;
  priority: AlertPriority;
  currentValue: number;
  threshold: number;
  triggeredAt: string;
  acknowledged: boolean;
}

/**
 * 警报统计
 */
export interface AlertStats {
  totalRules: number;
  activeRules: number;
  triggeredToday: number;
  acknowledgedToday: number;
}
```

#### Zustand Store

**文件**: `src/stores/alert.store.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AlertRule, AlertEvent, AlertStats } from '../types/alerts';

interface AlertStore {
  // 状态
  rules: AlertRule[];
  events: AlertEvent[];
  
  // 规则操作
  addRule: (rule: Omit<AlertRule, 'id' | 'createdAt' | 'triggerCount'>) => void;
  updateRule: (ruleId: string, updates: Partial<AlertRule>) => void;
  removeRule: (ruleId: string) => void;
  toggleRule: (ruleId: string) => void;
  
  // 事件操作
  triggerAlert: (event: Omit<AlertEvent, 'id' | 'triggeredAt'>) => void;
  acknowledgeEvent: (eventId: string) => void;
  acknowledgeAll: () => void;
  clearEvents: () => void;
  
  // 查询
  getActiveRules: () => AlertRule[];
  getUnacknowledgedEvents: () => AlertEvent[];
  getStats: () => AlertStats;
  
  // 规则检查 (核心逻辑)
  checkRule: (rule: AlertRule, currentValue: number) => boolean;
  isInCooldown: (rule: AlertRule) => boolean;
}

export const useAlertStore = create<AlertStore>()(
  persist(
    (set, get) => ({
      rules: [],
      events: [],

      addRule: (ruleData) => {
        const rule: AlertRule = {
          ...ruleData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          triggerCount: 0,
        };
        set((state) => ({
          rules: [...state.rules, rule]
        }));
      },

      updateRule: (ruleId, updates) => {
        set((state) => ({
          rules: state.rules.map(r => 
            r.id === ruleId ? { ...r, ...updates } : r
          )
        }));
      },

      removeRule: (ruleId) => {
        set((state) => ({
          rules: state.rules.filter(r => r.id !== ruleId)
        }));
      },

      toggleRule: (ruleId) => {
        set((state) => ({
          rules: state.rules.map(r =>
            r.id === ruleId ? { ...r, enabled: !r.enabled } : r
          )
        }));
      },

      triggerAlert: (eventData) => {
        const event: AlertEvent = {
          ...eventData,
          id: crypto.randomUUID(),
          triggeredAt: new Date().toISOString(),
        };
        
        set((state) => ({
          events: [event, ...state.events].slice(0, 500), // 保留最近 500 条
          rules: state.rules.map(r =>
            r.id === eventData.ruleId
              ? { 
                  ...r, 
                  lastTriggeredAt: event.triggeredAt,
                  triggerCount: r.triggerCount + 1 
                }
              : r
          )
        }));
      },

      acknowledgeEvent: (eventId) => {
        set((state) => ({
          events: state.events.map(e =>
            e.id === eventId ? { ...e, acknowledged: true } : e
          )
        }));
      },

      acknowledgeAll: () => {
        set((state) => ({
          events: state.events.map(e => ({ ...e, acknowledged: true }))
        }));
      },

      clearEvents: () => {
        set({ events: [] });
      },

      getActiveRules: () => {
        return get().rules.filter(r => r.enabled);
      },

      getUnacknowledgedEvents: () => {
        return get().events.filter(e => !e.acknowledged);
      },

      getStats: () => {
        const { rules, events } = get();
        const today = new Date().toISOString().slice(0, 10);
        const todayEvents = events.filter(e => e.triggeredAt.startsWith(today));
        
        return {
          totalRules: rules.length,
          activeRules: rules.filter(r => r.enabled).length,
          triggeredToday: todayEvents.length,
          acknowledgedToday: todayEvents.filter(e => e.acknowledged).length,
        };
      },

      checkRule: (rule, currentValue) => {
        const { operator, value, value2 } = rule.condition;
        
        switch (operator) {
          case 'gt': return currentValue > value;
          case 'lt': return currentValue < value;
          case 'gte': return currentValue >= value;
          case 'lte': return currentValue <= value;
          case 'eq': return Math.abs(currentValue - value) < 0.0001;
          case 'between': return value2 !== undefined && currentValue >= value && currentValue <= value2;
          default: return false;
        }
      },

      isInCooldown: (rule) => {
        if (!rule.lastTriggeredAt || rule.cooldownMinutes <= 0) return false;
        
        const lastTrigger = new Date(rule.lastTriggeredAt).getTime();
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        return Date.now() - lastTrigger < cooldownMs;
      },
    }),
    {
      name: 'my-doge-alerts',
      version: 1,
    }
  )
);
```

### T-06b: 价格阈值监控

**文件**: `src/hooks/useAlertMonitor.ts`

```typescript
import { useEffect, useCallback, useRef } from 'react';
import { useAnalysisStore } from '../stores/analysis.store';
import { useAlertStore } from '../stores/alert.store';
import { AlertRule, AlertRuleType } from '../types/alerts';
import { sendSystemNotification } from '../utils/notifications';

/**
 * 警报监控 Hook
 * 
 * 功能:
 * - 监听市场数据变化
 * - 检查所有启用的警报规则
 * - 触发警报并发送系统通知
 */
export const useAlertMonitor = () => {
  const marketData = useAnalysisStore((state) => state.marketData);
  const rsrsIndicators = useAnalysisStore((state) => state.rsrsIndicators);
  const volatilitySkews = useAnalysisStore((state) => state.volatilitySkews);
  
  const rules = useAlertStore((state) => state.rules);
  const triggerAlert = useAlertStore((state) => state.triggerAlert);
  const checkRule = useAlertStore((state) => state.checkRule);
  const isInCooldown = useAlertStore((state) => state.isInCooldown);
  
  // 防止重复检查
  const lastCheckRef = useRef<number>(0);
  const CHECK_INTERVAL = 1000; // 最小检查间隔 1 秒

  /**
   * 获取规则对应的当前值
   */
  const getCurrentValue = useCallback((rule: AlertRule): number | null => {
    const ticker = rule.ticker;
    
    switch (rule.type) {
      case 'price_above':
      case 'price_below':
        return marketData[ticker]?.price ?? null;
      
      case 'change_percent':
        return marketData[ticker]?.changePercent ?? null;
      
      case 'volume_spike':
        return marketData[ticker]?.volume ?? null;
      
      case 'rsrs_signal':
        return rsrsIndicators[ticker]?.value ?? null;
      
      case 'volatility_high':
        return volatilitySkews[ticker]?.ratio ?? null;
      
      default:
        return null;
    }
  }, [marketData, rsrsIndicators, volatilitySkews]);

  /**
   * 生成警报消息
   */
  const generateMessage = useCallback((rule: AlertRule, currentValue: number): string => {
    const typeLabels: Record<AlertRuleType, string> = {
      price_above: '价格突破',
      price_below: '价格跌破',
      change_percent: '涨跌幅超过',
      volume_spike: '成交量异动',
      rsrs_signal: 'RSRS 信号',
      volatility_high: '波动率过高',
      correlation_break: '相关性突变',
    };
    
    return `${rule.ticker} ${typeLabels[rule.type]} ${rule.condition.value} (当前: ${currentValue.toFixed(2)})`;
  }, []);

  /**
   * 检查所有规则
   */
  const checkAllRules = useCallback(() => {
    const now = Date.now();
    if (now - lastCheckRef.current < CHECK_INTERVAL) return;
    lastCheckRef.current = now;

    const activeRules = rules.filter(r => r.enabled);
    
    for (const rule of activeRules) {
      // 冷却检查
      if (isInCooldown(rule)) continue;
      
      // 获取当前值
      const currentValue = getCurrentValue(rule);
      if (currentValue === null) continue;
      
      // 规则匹配检查
      const triggered = checkRule(rule, currentValue);
      
      if (triggered) {
        const message = generateMessage(rule, currentValue);
        
        // 触发警报
        triggerAlert({
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          ticker: rule.ticker,
          message,
          priority: rule.priority,
          currentValue,
          threshold: rule.condition.value,
          acknowledged: false,
        });
        
        // 发送系统通知
        sendSystemNotification({
          title: `🔔 ${rule.name}`,
          body: message,
          priority: rule.priority,
        });
        
        console.log(`[AlertMonitor] Triggered: ${rule.name}`);
      }
    }
  }, [rules, getCurrentValue, checkRule, isInCooldown, triggerAlert, generateMessage]);

  // 监听数据变化
  useEffect(() => {
    checkAllRules();
  }, [marketData, rsrsIndicators, volatilitySkews, checkAllRules]);

  return {
    checkAllRules,
  };
};
```

### T-06d: Tauri 系统通知

**依赖安装**:

```bash
# Rust 端
cd apps/desktop/src-tauri
cargo add tauri-plugin-notification
```

**Cargo.toml 更新**:
```toml
[dependencies]
tauri-plugin-notification = "2"
```

**Rust 端注册** (`src/lib.rs`):
```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**前端工具函数**: `src/utils/notifications.ts`

```typescript
import { AlertPriority } from '../types/alerts';

interface NotificationOptions {
  title: string;
  body: string;
  priority: AlertPriority;
}

/**
 * 发送系统通知
 */
export async function sendSystemNotification(options: NotificationOptions): Promise<void> {
  const { title, body, priority } = options;
  
  // 检查是否在 Tauri 环境
  if ('__TAURI_INTERNALS__' in window) {
    try {
      const { isPermissionGranted, requestPermission, sendNotification } = 
        await import('@tauri-apps/plugin-notification');
      
      // 检查权限
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      
      if (permissionGranted) {
        await sendNotification({
          title,
          body,
          // 高优先级警报添加声音
          sound: priority === 'high' || priority === 'critical' ? 'default' : undefined,
        });
      }
    } catch (err) {
      console.error('Tauri notification failed:', err);
      fallbackNotification(title, body);
    }
  } else {
    // Web 环境回退到浏览器通知
    fallbackNotification(title, body);
  }
}

/**
 * 浏览器通知回退
 */
async function fallbackNotification(title: string, body: string): Promise<void> {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, { body });
    }
  }
}
```

### T-06e: 通知中心 UI

**文件**: `src/components/organisms/NotificationCenter/NotificationCenter.tsx`

```tsx
import React, { useState } from 'react';
import { useAlertStore } from '../../../stores/alert.store';
import { useUIStore } from '../../../stores/ui.store';
import { Card, CardTitle, CardContent } from '../../atoms/Card';
import { Button } from '../../atoms/Button';
import { Badge } from '../../atoms/Badge';
import { AlertEvent, AlertPriority } from '../../../types/alerts';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose
}) => {
  const events = useAlertStore((state) => state.events);
  const acknowledgeEvent = useAlertStore((state) => state.acknowledgeEvent);
  const acknowledgeAll = useAlertStore((state) => state.acknowledgeAll);
  const clearEvents = useAlertStore((state) => state.clearEvents);
  const getStats = useAlertStore((state) => state.getStats);
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const stats = getStats();
  const filteredEvents = filter === 'unread' 
    ? events.filter(e => !e.acknowledged)
    : events;

  const priorityConfig: Record<AlertPriority, { color: string; icon: string }> = {
    low: { color: 'secondary', icon: 'ℹ️' },
    medium: { color: 'warning', icon: '⚠️' },
    high: { color: 'danger', icon: '🔴' },
    critical: { color: 'danger', icon: '🚨' },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-96 h-full bg-gray-900 border-l border-gray-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">通知中心</h2>
            <p className="text-sm text-gray-400">
              今日: {stats.triggeredToday} 条警报
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        
        {/* Filter */}
        <div className="p-3 border-b border-gray-800 flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            全部 ({events.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            未读 ({events.filter(e => !e.acknowledged).length})
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={acknowledgeAll}>
            全部已读
          </Button>
        </div>
        
        {/* Events List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              暂无通知
            </div>
          ) : (
            filteredEvents.map(event => (
              <NotificationItem
                key={event.id}
                event={event}
                onAcknowledge={() => acknowledgeEvent(event.id)}
              />
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <Button variant="ghost" size="sm" onClick={clearEvents} className="w-full">
            清空所有通知
          </Button>
        </div>
      </div>
    </div>
  );
};

// 单个通知项
const NotificationItem: React.FC<{
  event: AlertEvent;
  onAcknowledge: () => void;
}> = ({ event, onAcknowledge }) => {
  const priorityConfig: Record<AlertPriority, { variant: string; icon: string }> = {
    low: { variant: 'secondary', icon: 'ℹ️' },
    medium: { variant: 'warning', icon: '⚠️' },
    high: { variant: 'danger', icon: '🔴' },
    critical: { variant: 'danger', icon: '🚨' },
  };
  
  const config = priorityConfig[event.priority];
  const time = new Date(event.triggeredAt).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      className={`p-3 rounded-lg border ${
        event.acknowledged 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-gray-800 border-gray-600'
      }`}
      onClick={onAcknowledge}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">{event.ruleName}</span>
            <Badge variant={config.variant as any} size="sm">{event.ticker}</Badge>
          </div>
          <p className="text-sm text-gray-400 mt-1">{event.message}</p>
          <p className="text-xs text-gray-500 mt-1">{time}</p>
        </div>
        {!event.acknowledged && (
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        )}
      </div>
    </div>
  );
};
```

### T-06f: 警报规则配置

**文件**: `src/components/organisms/AlertRulePanel/AlertRulePanel.tsx`

```tsx
import React, { useState } from 'react';
import { useAlertStore } from '../../../stores/alert.store';
import { AlertRule, AlertRuleType, AlertPriority } from '../../../types/alerts';
import { Card, CardTitle, CardContent } from '../../atoms/Card';
import { Button } from '../../atoms/Button';
import { Input } from '../../atoms/Input';
import { Badge } from '../../atoms/Badge';

export const AlertRulePanel: React.FC = () => {
  const rules = useAlertStore((state) => state.rules);
  const addRule = useAlertStore((state) => state.addRule);
  const removeRule = useAlertStore((state) => state.removeRule);
  const toggleRule = useAlertStore((state) => state.toggleRule);
  const getStats = useAlertStore((state) => state.getStats);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'price_above' as AlertRuleType,
    ticker: '',
    operator: 'gt' as const,
    value: 0,
    priority: 'medium' as AlertPriority,
    cooldownMinutes: 30,
  });

  const stats = getStats();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRule({
      name: formData.name,
      type: formData.type,
      ticker: formData.ticker.toUpperCase(),
      condition: {
        operator: formData.operator,
        value: formData.value,
      },
      priority: formData.priority,
      cooldownMinutes: formData.cooldownMinutes,
      enabled: true,
    });
    setShowForm(false);
    setFormData({
      name: '',
      type: 'price_above',
      ticker: '',
      operator: 'gt',
      value: 0,
      priority: 'medium',
      cooldownMinutes: 30,
    });
  };

  const ruleTypeLabels: Record<AlertRuleType, string> = {
    price_above: '价格突破',
    price_below: '价格跌破',
    change_percent: '涨跌幅',
    volume_spike: '成交量',
    rsrs_signal: 'RSRS 信号',
    volatility_high: '波动率',
    correlation_break: '相关性',
  };

  return (
    <Card className="w-full">
      <CardTitle className="flex items-center justify-between">
        <span>🔔 警报规则</span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{stats.activeRules}/{stats.totalRules} 启用</Badge>
          <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? '取消' : '+ 添加规则'}
          </Button>
        </div>
      </CardTitle>

      <CardContent>
        {/* 添加规则表单 */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-800 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">规则名称</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如: QQQ 价格突破 500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">标的代码</label>
                <Input
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
                  placeholder="如: QQQ, AAPL, 000001"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">规则类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AlertRuleType })}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
                >
                  {Object.entries(ruleTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">阈值</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">优先级</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as AlertPriority })}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">紧急</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                取消
              </Button>
              <Button type="submit" variant="primary">
                创建规则
              </Button>
            </div>
          </form>
        )}

        {/* 规则列表 */}
        <div className="space-y-2">
          {rules.length === 0 ? (
            <p className="text-center text-gray-500 py-4">暂无警报规则</p>
          ) : (
            rules.map(rule => (
              <div
                key={rule.id}
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  rule.enabled 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-800/50 border-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`w-4 h-4 rounded-full border-2 ${
                      rule.enabled ? 'bg-green-500 border-green-500' : 'border-gray-500'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{rule.name}</span>
                      <Badge variant="secondary" size="sm">{rule.ticker}</Badge>
                      <Badge 
                        variant={rule.priority === 'high' || rule.priority === 'critical' ? 'danger' : 'warning'} 
                        size="sm"
                      >
                        {ruleTypeLabels[rule.type]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">
                      阈值: {rule.condition.value} | 触发: {rule.triggerCount} 次
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeRule(rule.id)}>
                  删除
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

---

# 📊 T-05: 多资产联动分析

## 现状分析

| 组件 | 状态 | 位置 |
|------|------|------|
| `GlobalMacroLoader` | ✅ | 后端已实现 |
| `/macro/market/data` | ✅ | API 已有 |
| `/macro/metrics` | ✅ | API 已有 |
| `MacroAnalysisPanel` | ✅ | 前端已有 |
| 相关性计算 | ❌ | 需新增 |
| 热力图组件 | ❌ | 需新增 |

## 子任务分解

| ID | 任务 | 描述 | 预计 |
|----|------|------|------|
| **T-05a** | 相关性矩阵计算 | 后端 CorrelationAnalyzer | 60min |
| **T-05b** | 相关性热力图 | ECharts 可视化 | 60min |
| **T-05c** | 资产联动面板 | MultiAssetPanel 组件 | 60min |
| **T-05d** | 异动检测 | 相关性突变警报 | 45min |

**总预计**: 4h

---

## 技术方案

### T-05a: 相关性矩阵计算

**文件**: `apps/api/core/correlation.py`

```python
"""
相关性分析模块
计算多资产相关性矩阵和异动检测
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class CorrelationAnalyzer:
    """
    资产相关性分析器
    
    功能:
    - 计算相关性矩阵
    - 滚动相关性分析
    - 相关性突变检测
    """
    
    def __init__(
        self,
        short_window: int = 20,
        long_window: int = 60,
        divergence_threshold: float = 0.3
    ):
        """
        Args:
            short_window: 短期窗口 (天)
            long_window: 长期窗口 (天)
            divergence_threshold: 相关性突变阈值
        """
        self.short_window = short_window
        self.long_window = long_window
        self.divergence_threshold = divergence_threshold
    
    def calculate_matrix(
        self, 
        prices: pd.DataFrame,
        window: Optional[int] = None
    ) -> Dict:
        """
        计算相关性矩阵
        
        Args:
            prices: 价格数据 (列为资产)
            window: 可选窗口大小
        
        Returns:
            { matrix, assets, period }
        """
        if prices.empty or len(prices.columns) < 2:
            return {"matrix": {}, "assets": [], "period": None}
        
        # 计算收益率
        returns = prices.pct_change().dropna()
        
        if window:
            returns = returns.tail(window)
        
        # 相关性矩阵
        corr_matrix = returns.corr()
        
        return {
            "matrix": corr_matrix.round(4).to_dict(),
            "assets": list(corr_matrix.columns),
            "period": {
                "start": str(returns.index[0]),
                "end": str(returns.index[-1]),
                "days": len(returns)
            }
        }
    
    def calculate_rolling_correlation(
        self,
        prices: pd.DataFrame,
        asset1: str,
        asset2: str,
        window: int = 20
    ) -> pd.Series:
        """
        计算滚动相关性
        """
        returns = prices.pct_change().dropna()
        
        if asset1 not in returns.columns or asset2 not in returns.columns:
            return pd.Series()
        
        rolling_corr = returns[asset1].rolling(window).corr(returns[asset2])
        return rolling_corr.dropna()
    
    def detect_divergence(
        self,
        prices: pd.DataFrame
    ) -> List[Dict]:
        """
        检测相关性异动
        
        对比短期和长期相关性，发现显著变化
        """
        returns = prices.pct_change().dropna()
        
        if len(returns) < self.long_window:
            return []
        
        # 计算长期和短期相关性
        long_corr = returns.tail(self.long_window).corr()
        short_corr = returns.tail(self.short_window).corr()
        
        divergences = []
        assets = list(returns.columns)
        
        for i, asset1 in enumerate(assets):
            for j, asset2 in enumerate(assets):
                if i >= j:
                    continue
                
                long_val = long_corr.loc[asset1, asset2]
                short_val = short_corr.loc[asset1, asset2]
                diff = abs(short_val - long_val)
                
                if diff > self.divergence_threshold:
                    divergences.append({
                        "asset1": asset1,
                        "asset2": asset2,
                        "long_term": round(float(long_val), 4),
                        "short_term": round(float(short_val), 4),
                        "change": round(float(diff), 4),
                        "direction": "decorrelation" if short_val < long_val else "convergence",
                        "severity": "high" if diff > 0.5 else "medium"
                    })
        
        # 按变化幅度排序
        divergences.sort(key=lambda x: x['change'], reverse=True)
        
        return divergences
    
    def calculate_beta(
        self,
        prices: pd.DataFrame,
        asset: str,
        benchmark: str = "SPY",
        window: int = 60
    ) -> Dict:
        """
        计算资产相对基准的 Beta
        """
        returns = prices.pct_change().dropna().tail(window)
        
        if asset not in returns.columns or benchmark not in returns.columns:
            return {"beta": None, "error": "Asset not found"}
        
        cov = returns[asset].cov(returns[benchmark])
        var = returns[benchmark].var()
        
        beta = cov / var if var > 0 else 0
        
        return {
            "asset": asset,
            "benchmark": benchmark,
            "beta": round(float(beta), 4),
            "window": window
        }
    
    def get_correlation_heatmap_data(
        self,
        prices: pd.DataFrame
    ) -> Dict:
        """
        获取热力图数据格式
        """
        result = self.calculate_matrix(prices)
        
        if not result["matrix"]:
            return {"data": [], "assets": []}
        
        assets = result["assets"]
        matrix = result["matrix"]
        
        # 转换为 ECharts 格式: [[x, y, value], ...]
        data = []
        for i, asset1 in enumerate(assets):
            for j, asset2 in enumerate(assets):
                value = matrix[asset1][asset2]
                data.append([i, j, round(value, 2)])
        
        return {
            "data": data,
            "assets": assets,
            "period": result["period"]
        }


# 便捷实例
_analyzer: Optional[CorrelationAnalyzer] = None

def get_analyzer() -> CorrelationAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = CorrelationAnalyzer()
    return _analyzer
```

**API 端点** (添加到 `macro_api_routes.py`):

```python
from .correlation import get_analyzer as get_correlation_analyzer

@router.get("/macro/correlation", dependencies=[Depends(verify_token)])
async def get_correlation_matrix(
    window: int = Query(default=60, ge=20, le=250, description="计算窗口")
):
    """
    获取多资产相关性矩阵
    """
    try:
        config = MacroConfig()
        loader = GlobalMacroLoader(config)
        data = loader.fetch_combined_data()
        
        if data is None or data.empty:
            raise HTTPException(status_code=500, detail="获取市场数据失败")
        
        analyzer = get_correlation_analyzer()
        result = analyzer.calculate_matrix(data, window=window)
        
        return FastJsonResponse({
            "correlation": result,
            "updated_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"计算相关性失败: {str(e)}")


@router.get("/macro/correlation/heatmap", dependencies=[Depends(verify_token)])
async def get_correlation_heatmap():
    """
    获取相关性热力图数据 (ECharts 格式)
    """
    try:
        config = MacroConfig()
        loader = GlobalMacroLoader(config)
        data = loader.fetch_combined_data()
        
        analyzer = get_correlation_analyzer()
        result = analyzer.get_correlation_heatmap_data(data)
        
        return FastJsonResponse(result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取热力图数据失败: {str(e)}")


@router.get("/macro/correlation/divergence", dependencies=[Depends(verify_token)])
async def get_correlation_divergence():
    """
    获取相关性异动检测结果
    """
    try:
        config = MacroConfig()
        loader = GlobalMacroLoader(config)
        data = loader.fetch_combined_data()
        
        analyzer = get_correlation_analyzer()
        divergences = analyzer.detect_divergence(data)
        
        return FastJsonResponse({
            "divergences": divergences,
            "count": len(divergences),
            "threshold": analyzer.divergence_threshold,
            "updated_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"检测相关性异动失败: {str(e)}")
```

### T-05b: 相关性热力图

**文件**: `src/components/charts/CorrelationHeatmap.tsx`

```tsx
import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface HeatmapData {
  data: [number, number, number][];  // [x, y, value]
  assets: string[];
  period?: {
    start: string;
    end: string;
    days: number;
  };
}

interface CorrelationHeatmapProps {
  data: HeatmapData;
  height?: number;
  onCellClick?: (asset1: string, asset2: string, value: number) => void;
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  data,
  height = 400,
  onCellClick
}) => {
  const option: EChartsOption = useMemo(() => ({
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const [x, y, value] = params.data;
        return `${data.assets[x]} ↔ ${data.assets[y]}<br/>相关性: <strong>${value}</strong>`;
      }
    },
    grid: {
      top: 60,
      left: 80,
      right: 40,
      bottom: 60
    },
    xAxis: {
      type: 'category',
      data: data.assets,
      splitArea: { show: true },
      axisLabel: {
        color: '#a1a1aa',
        rotate: 45
      }
    },
    yAxis: {
      type: 'category',
      data: data.assets,
      splitArea: { show: true },
      axisLabel: {
        color: '#a1a1aa'
      }
    },
    visualMap: {
      min: -1,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      top: 10,
      inRange: {
        color: ['#ef4444', '#fbbf24', '#f5f5f5', '#86efac', '#22c55e']
      },
      textStyle: {
        color: '#a1a1aa'
      }
    },
    series: [{
      name: 'Correlation',
      type: 'heatmap',
      data: data.data,
      label: {
        show: true,
        formatter: (params: any) => params.data[2].toFixed(2),
        color: '#fff',
        fontSize: 11
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }), [data]);

  const handleClick = (params: any) => {
    if (onCellClick && params.data) {
      const [x, y, value] = params.data;
      onCellClick(data.assets[x], data.assets[y], value);
    }
  };

  if (!data.data?.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        暂无相关性数据
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      onEvents={{ click: handleClick }}
      opts={{ renderer: 'canvas' }}
    />
  );
};
```

### T-05c: 多资产联动面板

**文件**: `src/components/organisms/MultiAssetPanel/MultiAssetPanel.tsx`

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardTitle, CardContent } from '../../atoms/Card';
import { Button } from '../../atoms/Button';
import { Badge } from '../../atoms/Badge';
import { CorrelationHeatmap } from '../../charts/CorrelationHeatmap';
import { apiClient } from '../../../services/api';

interface DivergenceItem {
  asset1: string;
  asset2: string;
  long_term: number;
  short_term: number;
  change: number;
  direction: 'decorrelation' | 'convergence';
  severity: 'high' | 'medium';
}

interface HeatmapData {
  data: [number, number, number][];
  assets: string[];
  period?: { start: string; end: string; days: number };
}

export const MultiAssetPanel: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [divergences, setDivergences] = useState<DivergenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<{
    asset1: string;
    asset2: string;
    value: number;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [heatmap, divergence] = await Promise.all([
        apiClient.get('/api/v1/macro/correlation/heatmap'),
        apiClient.get('/api/v1/macro/correlation/divergence')
      ]);
      
      setHeatmapData(heatmap);
      setDivergences(divergence.divergences || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load correlation data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCellClick = (asset1: string, asset2: string, value: number) => {
    setSelectedPair({ asset1, asset2, value });
  };

  return (
    <div className="space-y-4">
      {/* 相关性热力图 */}
      <Card>
        <CardTitle className="flex items-center justify-between">
          <span>📊 资产相关性矩阵</span>
          <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
            {loading ? '刷新中...' : '刷新'}
          </Button>
        </CardTitle>
        <CardContent>
          {error ? (
            <div className="text-center text-red-400 py-4">{error}</div>
          ) : loading ? (
            <div className="text-center text-gray-400 py-8">加载中...</div>
          ) : heatmapData ? (
            <>
              <CorrelationHeatmap
                data={heatmapData}
                height={400}
                onCellClick={handleCellClick}
              />
              {heatmapData.period && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  数据范围: {heatmapData.period.start} ~ {heatmapData.period.end} ({heatmapData.period.days} 天)
                </p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* 相关性异动 */}
      <Card>
        <CardTitle className="flex items-center justify-between">
          <span>⚡ 相关性异动检测</span>
          <Badge variant={divergences.length > 0 ? 'warning' : 'success'}>
            {divergences.length} 个异动
          </Badge>
        </CardTitle>
        <CardContent>
          {divergences.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              未检测到显著相关性变化
            </p>
          ) : (
            <div className="space-y-2">
              {divergences.map((div, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    div.severity === 'high' 
                      ? 'bg-red-900/20 border-red-800' 
                      : 'bg-yellow-900/20 border-yellow-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {div.asset1} ↔ {div.asset2}
                      </span>
                      <Badge 
                        variant={div.direction === 'decorrelation' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {div.direction === 'decorrelation' ? '去相关' : '趋同'}
                      </Badge>
                    </div>
                    <span className={`font-mono ${
                      div.severity === 'high' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      Δ {(div.change * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    长期: {div.long_term.toFixed(2)} → 短期: {div.short_term.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 选中的资产对详情 */}
      {selectedPair && (
        <Card>
          <CardTitle>
            {selectedPair.asset1} ↔ {selectedPair.asset2}
          </CardTitle>
          <CardContent>
            <p className="text-lg font-mono">
              相关性: <span className={
                selectedPair.value > 0.5 ? 'text-green-400' :
                selectedPair.value < -0.5 ? 'text-red-400' : 'text-yellow-400'
              }>{selectedPair.value.toFixed(4)}</span>
            </p>
            {/* TODO: 添加滚动相关性图表 */}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

---

## 📁 文件创建清单

### T-06 警报系统

| 操作 | 文件 | 说明 |
|------|------|------|
| **新增** | `src/types/alerts.ts` | 警报类型定义 |
| **新增** | `src/stores/alert.store.ts` | Zustand 警报状态 |
| **新增** | `src/hooks/useAlertMonitor.ts` | 警报监控 Hook |
| **新增** | `src/utils/notifications.ts` | 系统通知工具 |
| **新增** | `src/components/organisms/NotificationCenter/` | 通知中心 |
| **新增** | `src/components/organisms/AlertRulePanel/` | 规则配置 |
| **修改** | `src-tauri/Cargo.toml` | 添加 notification 插件 |
| **修改** | `src-tauri/src/lib.rs` | 注册插件 |

### T-05 多资产联动

| 操作 | 文件 | 说明 |
|------|------|------|
| **新增** | `apps/api/core/correlation.py` | 相关性分析器 |
| **修改** | `apps/api/core/macro_api_routes.py` | 添加 API 端点 |
| **新增** | `src/components/charts/CorrelationHeatmap.tsx` | 热力图组件 |
| **新增** | `src/components/organisms/MultiAssetPanel/` | 多资产面板 |

---

## 📅 执行顺序

```
┌─────────────────────────────────────────────────────────────────┐
│                    T-06 & T-05 执行计划                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Day 1 (下午):                                                  │
│  ├── T-06a 警报规则引擎 (45min)                                │
│  ├── T-06b 价格阈值监控 (45min)                                │
│  └── T-06d Tauri 系统通知 (30min)                              │
│                                                                 │
│  Day 2 (上午):                                                  │
│  ├── T-06c 技术指标信号 (30min)                                │
│  ├── T-06e 通知中心 UI (30min)                                 │
│  └── T-06f 警报规则配置 (30min)                                │
│      → T-06 完成                                                │
│                                                                 │
│  Day 2 (下午):                                                  │
│  ├── T-05a 相关性矩阵计算 (60min)                              │
│  └── T-05b 相关性热力图 (60min)                                │
│                                                                 │
│  Day 3 (上午):                                                  │
│  ├── T-05c 资产联动面板 (60min)                                │
│  └── T-05d 异动检测 (45min)                                    │
│      → T-05 完成                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

总预计: ~7.5h (2 个工作日)
```

---

## ✅ 验收标准

### T-06 警报系统

- [ ] 可创建/编辑/删除/启用/禁用警报规则
- [ ] 价格突破阈值时触发警报
- [ ] 系统托盘弹出原生通知 (Tauri)
- [ ] 通知中心显示历史警报
- [ ] 冷却机制正常工作

### T-05 多资产联动

- [ ] API 返回相关性矩阵
- [ ] 热力图正确渲染 (红负绿正)
- [ ] 异动检测返回显著变化
- [ ] 多资产面板集成完整

---

*规划基于 CDD v1.6.1 架构标准 | 2026-02-06 14:07*
