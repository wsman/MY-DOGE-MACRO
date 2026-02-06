/**
 * 警报系统类型定义
 * 
 * 注意: 这些类型独立于现有的 Notification 类型
 * 现有 Notification 用于系统消息，Alert 用于市场警报
 */

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
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * 条件操作符
 */
export type ConditionOperator = 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between'

/**
 * 警报规则条件
 */
export interface AlertCondition {
  operator: ConditionOperator
  value: number
  value2?: number  // 用于 between 操作符
}

/**
 * 警报规则
 */
export interface AlertRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  type: AlertRuleType
  ticker: string  // 监控标的 (* 表示全部)
  condition: AlertCondition
  priority: AlertPriority
  cooldownMinutes: number  // 冷却时间 (防止重复触发)
  createdAt: string
  lastTriggeredAt?: string
  triggerCount: number
}

/**
 * 警报事件
 */
export interface AlertEvent {
  id: string
  ruleId: string
  ruleName: string
  ruleType: AlertRuleType
  ticker: string
  message: string
  priority: AlertPriority
  currentValue: number
  threshold: number
  triggeredAt: string
  acknowledged: boolean
}

/**
 * 警报统计
 */
export interface AlertStats {
  totalRules: number
  activeRules: number
  triggeredToday: number
  acknowledgedToday: number
}

/**
 * 规则模板 (用于快速创建常见规则)
 */
export interface RuleTemplate {
  id: string
  name: string
  type: AlertRuleType
  description: string
  defaultCondition: Partial<AlertCondition>
  defaultPriority: AlertPriority
  defaultCooldown: number
}

/**
 * 警报系统配置
 */
export interface AlertSystemConfig {
  enabled: boolean
  maxRules: number
  maxEvents: number
  notificationSound: boolean
  desktopNotification: boolean
  notificationDuration: number  // 秒
}