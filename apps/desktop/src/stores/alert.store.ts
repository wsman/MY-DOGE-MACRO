import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  AlertRule, 
  AlertEvent, 
  AlertStats, 
  AlertRuleType, 
  AlertPriority,
  AlertCondition,
  ConditionOperator
} from '../types/alerts'

interface AlertStore {
  // ==================== 状态 ====================
  rules: AlertRule[]
  events: AlertEvent[]
  
  // ==================== 规则操作 ====================
  addRule: (rule: Omit<AlertRule, 'id' | 'createdAt' | 'triggerCount'>) => string
  updateRule: (ruleId: string, updates: Partial<AlertRule>) => void
  removeRule: (ruleId: string) => void
  toggleRule: (ruleId: string) => void
  duplicateRule: (ruleId: string, newName?: string) => string
  importRules: (rules: AlertRule[]) => void
  exportRules: () => AlertRule[]
  
  // ==================== 事件操作 ====================
  triggerAlert: (event: Omit<AlertEvent, 'id' | 'triggeredAt'>) => string
  acknowledgeEvent: (eventId: string) => void
  acknowledgeAll: () => void
  clearEvents: (olderThanDays?: number) => void
  removeEvent: (eventId: string) => void
  
  // ==================== 查询方法 ====================
  getActiveRules: () => AlertRule[]
  getUnacknowledgedEvents: () => AlertEvent[]
  getEventsByRule: (ruleId: string) => AlertEvent[]
  getEventsByTicker: (ticker: string) => AlertEvent[]
  getStats: () => AlertStats
  
  // ==================== 规则检查 ====================
  checkRule: (rule: AlertRule, currentValue: number) => boolean
  isInCooldown: (rule: AlertRule) => boolean
  
  // ==================== 工具方法 ====================
  validateRule: (rule: Partial<AlertRule>) => { valid: boolean; errors: string[] }
  getDefaultRule: (type: AlertRuleType, ticker: string) => Omit<AlertRule, 'id' | 'createdAt' | 'triggerCount'>
}

const generateId = () => crypto.randomUUID()

export const useAlertStore = create<AlertStore>()(
  persist(
    (set, get) => ({
      rules: [],
      events: [],

      // ==================== 规则操作实现 ====================
      addRule: (ruleData) => {
        const id = generateId()
        const rule: AlertRule = {
          ...ruleData,
          id,
          createdAt: new Date().toISOString(),
          triggerCount: 0,
        }
        
        set((state) => ({
          rules: [...state.rules, rule]
        }))
        
        return id
      },

      updateRule: (ruleId, updates) => {
        set((state) => ({
          rules: state.rules.map(r => 
            r.id === ruleId ? { ...r, ...updates } : r
          )
        }))
      },

      removeRule: (ruleId) => {
        set((state) => ({
          rules: state.rules.filter(r => r.id !== ruleId),
          events: state.events.filter(e => e.ruleId !== ruleId)
        }))
      },

      toggleRule: (ruleId) => {
        set((state) => ({
          rules: state.rules.map(r =>
            r.id === ruleId ? { ...r, enabled: !r.enabled } : r
          )
        }))
      },

      duplicateRule: (ruleId, newName) => {
        const original = get().rules.find(r => r.id === ruleId)
        if (!original) return ''
        
        const newId = generateId()
        const rule: AlertRule = {
          ...original,
          id: newId,
          name: newName || `${original.name} (副本)`,
          createdAt: new Date().toISOString(),
          triggerCount: 0,
        }
        
        set((state) => ({
          rules: [...state.rules, rule]
        }))
        
        return newId
      },

      importRules: (newRules) => {
        // 为新规则生成ID和时间戳
        const processedRules = newRules.map(rule => ({
          ...rule,
          id: rule.id || generateId(),
          createdAt: rule.createdAt || new Date().toISOString(),
          triggerCount: rule.triggerCount || 0,
        }))
        
        set((state) => ({
          rules: [...state.rules, ...processedRules]
        }))
      },

      exportRules: () => {
        return get().rules
      },

      // ==================== 事件操作实现 ====================
      triggerAlert: (eventData) => {
        const id = generateId()
        const event: AlertEvent = {
          ...eventData,
          id,
          triggeredAt: new Date().toISOString(),
        }
        
        // 更新规则触发计数
        const rule = get().rules.find(r => r.id === eventData.ruleId)
        
        set((state) => ({
          events: [event, ...state.events].slice(0, 500), // 保留最近500条
          rules: state.rules.map(r =>
            r.id === eventData.ruleId
              ? { 
                  ...r, 
                  lastTriggeredAt: event.triggeredAt,
                  triggerCount: r.triggerCount + 1 
                }
              : r
          )
        }))
        
        return id
      },

      acknowledgeEvent: (eventId) => {
        set((state) => ({
          events: state.events.map(e =>
            e.id === eventId ? { ...e, acknowledged: true } : e
          )
        }))
      },

      acknowledgeAll: () => {
        set((state) => ({
          events: state.events.map(e => ({ ...e, acknowledged: true }))
        }))
      },

      clearEvents: (olderThanDays = 7) => {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
        cutoffDate.setHours(0, 0, 0, 0)
        
        set((state) => ({
          events: state.events.filter(e => 
            new Date(e.triggeredAt) >= cutoffDate
          )
        }))
      },

      removeEvent: (eventId) => {
        set((state) => ({
          events: state.events.filter(e => e.id !== eventId)
        }))
      },

      // ==================== 查询方法实现 ====================
      getActiveRules: () => {
        return get().rules.filter(r => r.enabled)
      },

      getUnacknowledgedEvents: () => {
        return get().events.filter(e => !e.acknowledged)
      },

      getEventsByRule: (ruleId) => {
        return get().events.filter(e => e.ruleId === ruleId)
      },

      getEventsByTicker: (ticker) => {
        return get().events.filter(e => e.ticker === ticker)
      },

      getStats: () => {
        const { rules, events } = get()
        const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
        const todayEvents = events.filter(e => e.triggeredAt.startsWith(today))
        
        return {
          totalRules: rules.length,
          activeRules: rules.filter(r => r.enabled).length,
          triggeredToday: todayEvents.length,
          acknowledgedToday: todayEvents.filter(e => e.acknowledged).length,
        }
      },

      // ==================== 规则检查实现 ====================
      checkRule: (rule, currentValue) => {
        const { operator, value, value2 } = rule.condition
        
        switch (operator) {
          case 'gt': return currentValue > value
          case 'lt': return currentValue < value
          case 'gte': return currentValue >= value
          case 'lte': return currentValue <= value
          case 'eq': return Math.abs(currentValue - value) < 0.0001
          case 'between': 
            if (value2 === undefined) return false
            return currentValue >= value && currentValue <= value2
          default: return false
        }
      },

      isInCooldown: (rule) => {
        if (!rule.lastTriggeredAt || rule.cooldownMinutes <= 0) return false
        
        const lastTrigger = new Date(rule.lastTriggeredAt).getTime()
        const cooldownMs = rule.cooldownMinutes * 60 * 1000
        return Date.now() - lastTrigger < cooldownMs
      },

      // ==================== 工具方法实现 ====================
      validateRule: (rule) => {
        const errors: string[] = []
        
        if (!rule.name?.trim()) {
          errors.push('规则名称不能为空')
        }
        
        if (!rule.ticker?.trim()) {
          errors.push('标的代码不能为空')
        }
        
        if (rule.condition?.value === undefined) {
          errors.push('阈值不能为空')
        }
        
        // 检查 between 操作符是否需要 value2
        if (rule.condition?.operator === 'between' && rule.condition?.value2 === undefined) {
          errors.push('范围上限不能为空（between操作符需要两个值）')
        }
        
        return {
          valid: errors.length === 0,
          errors
        }
      },

      getDefaultRule: (type, ticker) => {
        const defaults: Record<AlertRuleType, Partial<AlertCondition>> = {
          price_above: { operator: 'gt', value: 100 },
          price_below: { operator: 'lt', value: 50 },
          change_percent: { operator: 'gte', value: 5 },
          volume_spike: { operator: 'gt', value: 1000000 },
          rsrs_signal: { operator: 'gt', value: 0.8 },
          volatility_high: { operator: 'gt', value: 2.0 },
          correlation_break: { operator: 'lt', value: -0.5 }
        }
        
        const defaultCondition = defaults[type] || { operator: 'gt', value: 0 }
        const needsValue2 = defaultCondition.operator === 'between'
        
        return {
          name: `${ticker} ${type} 警报`,
          description: '',
          enabled: true,
          type,
          ticker,
          condition: {
            operator: defaultCondition.operator || 'gt',
            value: defaultCondition.value || 0,
            ...(needsValue2 ? { value2: 100 } : {})
          },
          priority: 'medium',
          cooldownMinutes: 30,
        }
      },
    }),
    {
      name: 'my-doge-alerts-storage',
      version: 1,
      // 只存储规则，不存储事件（避免存储过大）
      partialize: (state) => ({
        rules: state.rules,
      }),
      // 迁移函数，处理版本升级
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // 从版本0迁移到版本1
          return {
            ...persistedState,
            events: [],
          }
        }
        return persistedState
      },
    }
  )
)

// ============================================================================
// 便捷选择器 (与 analysis.store.ts 模式保持一致)
// ============================================================================

export const selectRules = (state: AlertStore) => state.rules
export const selectEvents = (state: AlertStore) => state.events
export const selectActiveRules = (state: AlertStore) => state.getActiveRules()
export const selectUnacknowledgedEvents = (state: AlertStore) => state.getUnacknowledgedEvents()
export const selectAlertStats = (state: AlertStore) => state.getStats()

// 单个规则选择器
export const selectRuleById = (ruleId: string) => (state: AlertStore) =>
  state.rules.find(r => r.id === ruleId)

// 单个事件选择器
export const selectEventById = (eventId: string) => (state: AlertStore) =>
  state.events.find(e => e.id === eventId)

// 批量数据选择器
export const selectRulesBatch = (state: AlertStore) => state.rules
export const selectEventsBatch = (state: AlertStore) => state.events

// ============================================================================
// 便捷 Hook (与 analysis.store.ts 模式保持一致)
// ============================================================================

/**
 * Hook: useAlertRules
 * 获取所有警报规则
 */
export function useAlertRules(): AlertRule[] {
  return useAlertStore(selectRules)
}

/**
 * Hook: useAlertEvents
 * 获取所有警报事件
 */
export function useAlertEvents(): AlertEvent[] {
  return useAlertStore(selectEvents)
}

/**
 * Hook: useAlertRule
 * 获取单个警报规则
 */
export function useAlertRule(ruleId: string): AlertRule | undefined {
  return useAlertStore(selectRuleById(ruleId))
}

/**
 * Hook: useActiveAlertRules
 * 获取所有启用的警报规则
 */
export function useActiveAlertRules(): AlertRule[] {
  return useAlertStore(selectActiveRules)
}

/**
 * Hook: useUnacknowledgedAlertEvents
 * 获取所有未读警报事件
 */
export function useUnacknowledgedAlertEvents(): AlertEvent[] {
  return useAlertStore(selectUnacknowledgedEvents)
}

/**
 * Hook: useAlertStats
 * 获取警报统计
 */
export function useAlertStats(): AlertStats {
  return useAlertStore(selectAlertStats)
}