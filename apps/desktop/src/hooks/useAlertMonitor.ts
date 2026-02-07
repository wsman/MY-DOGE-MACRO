import { useEffect, useCallback, useRef } from 'react'
import { useAnalysisStore } from '../stores/analysis.store'
import { useAlertStore } from '../stores/alert.store'
import { AlertRule, AlertRuleType, AlertPriority } from '../types/alerts'
import { sendSystemNotification } from '../utils/notifications'

/**
 * 警报监控 Hook 配置选项
 */
export interface UseAlertMonitorOptions {
  /** 检查间隔（毫秒），默认 1000ms */
  checkInterval?: number
  /** 启用调试日志 */
  debug?: boolean
  /** 启用系统通知（Tauri/浏览器） */
  enableNotifications?: boolean
  /** 启用冷却时间检查 */
  enableCooldown?: boolean
}

/**
 * 警报监控 Hook 返回值
 */
export interface UseAlertMonitorReturn {
  /** 手动触发规则检查 */
  checkRules: () => void
  /** 获取当前监控的规则数量 */
  getMonitoringRulesCount: () => number
  /** 获取上次检查时间 */
  getLastCheckTime: () => Date | null
  /** 获取监控统计 */
  getStats: () => {
    totalRules: number
    activeRules: number
    monitoredTickers: number
    checksPerformed: number
    triggersToday: number
  }
}

/**
 * 高性能警报监控 Hook
 * 
 * 功能特点：
 * 1. 实时监听市场数据变化
 * 2. 检查所有启用的警报规则
 * 3. 支持冷却时间控制（防止重复触发）
 * 4. 自动发送系统通知
 * 5. 与现有状态管理系统深度集成
 * 6. 性能优化：避免不必要的重新渲染
 */
export const useAlertMonitor = (options: UseAlertMonitorOptions = {}): UseAlertMonitorReturn => {
  const {
    checkInterval = 1000,
    debug = false,
    enableNotifications = true,
    enableCooldown = true,
  } = options

  // Refs 用于存储可变状态，避免闭包问题
  const lastCheckRef = useRef<number>(Date.now())
  const checksPerformedRef = useRef<number>(0)
  const monitoringTickersRef = useRef<Set<string>>(new Set())
  const ruleCacheRef = useRef<Map<string, { rule: AlertRule; lastCheck: number }>>(new Map())

  // 获取状态
  const marketData = useAnalysisStore((state) => state.marketData)
  const rsrsIndicators = useAnalysisStore((state) => state.rsrsIndicators)
  const volatilitySkews = useAnalysisStore((state) => state.volatilitySkews)
  
  const rules = useAlertStore((state) => state.rules)
  const triggerAlert = useAlertStore((state) => state.triggerAlert)
  const checkRule = useAlertStore((state) => state.checkRule)
  const isInCooldown = useAlertStore((state) => state.isInCooldown)

  // 调试日志函数
  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('[AlertMonitor]', ...args)
    }
  }, [debug])

  // 获取规则对应的当前值
  const getCurrentValue = useCallback((rule: AlertRule, specificTicker?: string): number | null => {
    const ticker = specificTicker || rule.ticker
    
    // 处理通配符规则 - 当需要特定ticker时返回该ticker的值
    if (rule.ticker === '*' && !specificTicker) {
      // 通配符规则需要传入specificTicker参数
      log(`Wildcard rule ${rule.name} requires specific ticker parameter`)
      return null
    }
    
    switch (rule.type) {
      case 'price_above':
      case 'price_below':
        return marketData[ticker]?.price ?? null
      
      case 'change_percent':
        return marketData[ticker]?.changePercent ?? null
      
      case 'volume_spike':
        return marketData[ticker]?.volume ?? null
      
      case 'rsrs_signal':
        return rsrsIndicators[ticker]?.value ?? null
      
      case 'volatility_high':
        return volatilitySkews[ticker]?.ratio ?? null
      
      case 'correlation_break':
        // 相关性突变需要特殊处理 - 使用相关性分析结果
        // 默认返回null，实际应在checkSingleRule中处理
        return null
      
      default:
        log(`Unknown rule type: ${rule.type} for rule: ${rule.name}`)
        return null
    }
  }, [marketData, rsrsIndicators, volatilitySkews, log])

  // 生成警报消息
  const generateMessage = useCallback((rule: AlertRule, currentValue: number): string => {
    const typeLabels: Record<AlertRuleType, string> = {
      price_above: '价格突破',
      price_below: '价格跌破',
      change_percent: '涨跌幅超过',
      volume_spike: '成交量异动',
      rsrs_signal: 'RSRS 信号',
      volatility_high: '波动率过高',
      correlation_break: '相关性突变',
    }
    
    const { operator, value, value2 } = rule.condition
    const operatorLabels: Record<string, string> = {
      gt: '大于',
      lt: '小于',
      gte: '大于等于',
      lte: '小于等于',
      eq: '等于',
      between: '在范围内'
    }
    
    const operatorLabel = operatorLabels[operator] || operator
    let conditionText = `${operatorLabel} ${value}`
    if (operator === 'between' && value2 !== undefined) {
      conditionText = `在 ${value} 到 ${value2} 之间`
    }
    
    return `${rule.ticker} ${typeLabels[rule.type]} ${conditionText} (当前值: ${currentValue.toFixed(2)})`
  }, [])

  // 检查单个规则
  const checkSingleRule = useCallback((rule: AlertRule): boolean => {
    // 检查规则是否启用
    if (!rule.enabled) {
      return false
    }
    
    // 检查冷却时间
    if (enableCooldown && isInCooldown(rule)) {
      log(`Rule ${rule.name} is in cooldown, skipping check`)
      return false
    }
    
    // 获取当前值
    const currentValue = getCurrentValue(rule)
    if (currentValue === null) {
      log(`Cannot get current value for rule: ${rule.name}, ticker: ${rule.ticker}`)
      return false
    }
    
    // 检查规则条件
    const triggered = checkRule(rule, currentValue)
    
    if (triggered) {
      // 生成警报消息
      const message = generateMessage(rule, currentValue)
      
      // 触发警报事件
      const eventId = triggerAlert({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.type,
        ticker: rule.ticker,
        message,
        priority: rule.priority,
        currentValue,
        threshold: rule.condition.value,
        acknowledged: false,
      })
      
      log(`Alert triggered: ${rule.name}, eventId: ${eventId}`)
      
      // 发送系统通知
      if (enableNotifications) {
        const priorityConfig: Record<AlertPriority, string> = {
          low: '低',
          medium: '中',
          high: '高',
          critical: '紧急',
        }
        
        sendSystemNotification({
          title: `🔔 ${rule.name} (${priorityConfig[rule.priority]})`,
          body: message,
          priority: rule.priority,
        }).catch((err: Error) => {
          console.error('Failed to send system notification:', err)
        })
      }
      
      return true
    }
    
    return false
  }, [getCurrentValue, checkRule, generateMessage, triggerAlert, isInCooldown, enableCooldown, enableNotifications, log])

  // 检查所有规则
  const checkAllRules = useCallback(() => {
    const now = Date.now()
    
    // 限制检查频率
    if (now - lastCheckRef.current < checkInterval) {
      return
    }
    
    lastCheckRef.current = now
    checksPerformedRef.current += 1
    
    // 更新监控的ticker列表
    const activeRules = rules.filter(r => r.enabled)
    monitoringTickersRef.current = new Set(activeRules.map(r => r.ticker))
    
    // 检查每个启用的规则
    let triggersCount = 0
    for (const rule of activeRules) {
      try {
        const triggered = checkSingleRule(rule)
        if (triggered) {
          triggersCount += 1
        }
      } catch (err) {
        console.error(`Error checking rule ${rule.name}:`, err)
      }
    }
    
    if (debug && triggersCount > 0) {
      log(`Check completed: ${triggersCount} rules triggered`)
    }
  }, [rules, checkSingleRule, checkInterval, debug, log])

  // 手动触发规则检查
  const manualCheck = useCallback(() => {
    log('Manual check triggered')
    checkAllRules()
  }, [checkAllRules, log])

  // 获取监控统计
  const getMonitoringStats = useCallback(() => {
    const activeRules = rules.filter(r => r.enabled)
    const uniqueTickers = new Set(activeRules.map(r => r.ticker))
    
    // 获取今日触发次数（需要从alert store获取）
    const today = new Date().toISOString().slice(0, 10)
    const events = useAlertStore.getState().events
    const triggersToday = events.filter(e => e.triggeredAt.startsWith(today)).length
    
    return {
      totalRules: rules.length,
      activeRules: activeRules.length,
      monitoredTickers: uniqueTickers.size,
      checksPerformed: checksPerformedRef.current,
      triggersToday,
    }
  }, [rules])

  // 获取监控的规则数量
  const getMonitoringRulesCount = useCallback(() => {
    return rules.filter(r => r.enabled).length
  }, [rules])

  // 获取上次检查时间
  const getLastCheckTime = useCallback(() => {
    return lastCheckRef.current ? new Date(lastCheckRef.current) : null
  }, [])

  // 监听市场数据变化
  useEffect(() => {
    checkAllRules()
  }, [marketData, rsrsIndicators, volatilitySkews, checkAllRules])

  // 定期检查（作为兜底机制）
  useEffect(() => {
    if (checkInterval <= 0) return
    
    const intervalId = setInterval(() => {
      checkAllRules()
    }, checkInterval)
    
    return () => {
      clearInterval(intervalId)
    }
  }, [checkInterval, checkAllRules])

  // 监听规则变化
  useEffect(() => {
    // 当规则变化时，清理缓存
    ruleCacheRef.current.clear()
    log(`Rules updated, total: ${rules.length}, active: ${rules.filter(r => r.enabled).length}`)
  }, [rules, log])

  return {
    checkRules: manualCheck,
    getMonitoringRulesCount,
    getLastCheckTime,
    getStats: getMonitoringStats,
  }
}

// 默认导出
export default useAlertMonitor