// AlertRulePanel - 警报规则配置面板组件
// Created: 2026-02-06 (T-06f)
// 功能：创建、编辑、管理警报规则

import React, { useState, useMemo } from 'react'
import { Button } from '../../atoms/Button'
import { Card, CardTitle, CardContent } from '../../atoms/Card'
import { Badge } from '../../atoms/Badge'
import { Input } from '../../atoms/Input'
import { AlertRule, AlertRuleType, AlertPriority, AlertCondition, ConditionOperator } from '../../../types/alerts'
import { useAlertStore } from '../../../stores/alert.store'
import { useAnalysisStore } from '../../../stores/analysis.store'
import './AlertRulePanel.css'

interface AlertRulePanelProps {
  /** 标题 */
  title?: string
  /** 是否显示详情视图 */
  showDetails?: boolean
  /** 默认选中的规则ID */
  defaultSelectedRuleId?: string
  /** 创建规则后的回调 */
  onRuleCreated?: (ruleId: string) => void
  /** 删除规则后的回调 */
  onRuleDeleted?: (ruleId: string) => void
}

export const AlertRulePanel: React.FC<AlertRulePanelProps> = ({
  title = '警报规则配置',
  showDetails = true,
  defaultSelectedRuleId,
  onRuleCreated,
  onRuleDeleted,
}) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(defaultSelectedRuleId || null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // 获取警报状态
  const rules = useAlertStore((state) => state.rules)
  const addRule = useAlertStore((state) => state.addRule)
  const updateRule = useAlertStore((state) => state.updateRule)
  const removeRule = useAlertStore((state) => state.removeRule)
  const toggleRule = useAlertStore((state) => state.toggleRule)
  const duplicateRule = useAlertStore((state) => state.duplicateRule)
  const getDefaultRule = useAlertStore((state) => state.getDefaultRule)
  const validateRule = useAlertStore((state) => state.validateRule)
  
  // 获取市场数据用于当前值显示
  const marketData = useAnalysisStore((state) => state.marketData)
  const rsrsIndicators = useAnalysisStore((state) => state.rsrsIndicators)
  const volatilitySkews = useAnalysisStore((state) => state.volatilitySkews)
  
  // 表单状态
  const [formData, setFormData] = useState<Partial<AlertRule>>({
    name: '',
    description: '',
    enabled: true,
    type: 'price_above' as AlertRuleType,
    ticker: '000001.SS',
    condition: {
      operator: 'gt' as ConditionOperator,
      value: 0,
      value2: undefined,
    },
    priority: 'medium' as AlertPriority,
    cooldownMinutes: 30,
  })
  
  // 表单错误
  const [formErrors, setFormErrors] = useState<string[]>([])
  
  // 获取选中的规则
  const selectedRule = useMemo(() => {
    if (!selectedRuleId) return null
    return rules.find(r => r.id === selectedRuleId) || null
  }, [selectedRuleId, rules])
  
  // 过滤规则
  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return rules
    
    const query = searchQuery.toLowerCase().trim()
    return rules.filter(rule => 
      rule.name.toLowerCase().includes(query) ||
      rule.ticker.toLowerCase().includes(query) ||
      rule.description?.toLowerCase().includes(query)
    )
  }, [rules, searchQuery])
  
  // 获取规则的当前值
  const getCurrentValueForRule = (rule: AlertRule): number | null => {
    const ticker = rule.ticker
    
    if (!marketData[ticker]) return null
    
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
        // 相关性突变需要特殊处理
        return null
      
      default:
        return null
    }
  }
  
  // 检查规则是否触发
  const isRuleTriggered = (rule: AlertRule): boolean => {
    const currentValue = getCurrentValueForRule(rule)
    if (currentValue === null) return false
    
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
  }
  
  // 处理表单字段变化
  const handleFormChange = (field: string, value: any) => {
    if (field === 'ticker') {
      // 切换标的时更新规则类型默认值
      const defaultRule = getDefaultRule(formData.type || 'price_above', value)
      setFormData(prev => ({
        ...prev,
        ticker: value,
        condition: defaultRule.condition,
      }))
    } else if (field === 'type') {
      // 切换类型时更新默认值
      const defaultRule = getDefaultRule(value, formData.ticker || '000001.SS')
      setFormData(prev => ({
        ...prev,
        type: value,
        condition: defaultRule.condition,
        cooldownMinutes: defaultRule.cooldownMinutes,
      }))
    } else if (field.startsWith('condition.')) {
      const conditionField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        condition: {
          ...prev.condition!,
          [conditionField]: value,
        },
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }))
    }
    
    // 清除错误
    if (formErrors.length > 0) {
      setFormErrors([])
    }
  }
  
  // 验证并提交表单
  const handleSubmit = () => {
    const validation = validateRule(formData)
    
    if (!validation.valid) {
      setFormErrors(validation.errors)
      return
    }
    
    try {
      const ruleId = addRule(formData as any)
      setFormErrors([])
      
      // 重置表单
      setFormData({
        name: '',
        description: '',
        enabled: true,
        type: 'price_above',
        ticker: '000001.SS',
        condition: {
          operator: 'gt',
          value: 0,
          value2: undefined,
        },
        priority: 'medium',
        cooldownMinutes: 30,
      })
      
      setIsEditing(false)
      setSelectedRuleId(ruleId)
      
      // 回调
      onRuleCreated?.(ruleId)
    } catch (error) {
      console.error('创建规则失败:', error)
      setFormErrors(['创建规则时发生错误'])
    }
  }
  
  // 选择规则进行编辑
  const handleSelectRule = (rule: AlertRule) => {
    setSelectedRuleId(rule.id)
    setIsEditing(false)
  }
  
  // 编辑规则
  const handleEditRule = () => {
    if (!selectedRule) return
    
    setFormData({
      name: selectedRule.name,
      description: selectedRule.description || '',
      enabled: selectedRule.enabled,
      type: selectedRule.type,
      ticker: selectedRule.ticker,
      condition: { ...selectedRule.condition },
      priority: selectedRule.priority,
      cooldownMinutes: selectedRule.cooldownMinutes,
    })
    
    setIsEditing(true)
  }
  
  // 保存编辑
  const handleSaveEdit = () => {
    if (!selectedRuleId) return
    
    const validation = validateRule(formData)
    
    if (!validation.valid) {
      setFormErrors(validation.errors)
      return
    }
    
    try {
      updateRule(selectedRuleId, formData)
      setFormErrors([])
      setIsEditing(false)
    } catch (error) {
      console.error('更新规则失败:', error)
      setFormErrors(['更新规则时发生错误'])
    }
  }
  
  // 删除规则
  const handleDeleteRule = () => {
    if (!selectedRuleId) return
    
    if (window.confirm(`确定要删除规则 "${selectedRule?.name}" 吗？`)) {
      removeRule(selectedRuleId)
      setSelectedRuleId(null)
      setIsEditing(false)
      onRuleDeleted?.(selectedRuleId)
    }
  }
  
  // 复制规则
  const handleDuplicateRule = () => {
    if (!selectedRuleId) return
    
    const newRuleId = duplicateRule(selectedRuleId)
    setSelectedRuleId(newRuleId)
  }
  
  // 规则类型配置
  const ruleTypeConfig: Record<AlertRuleType, { label: string; description: string }> = {
    price_above: { label: '价格突破', description: '当价格高于设定值时触发' },
    price_below: { label: '价格跌破', description: '当价格低于设定值时触发' },
    change_percent: { label: '涨跌幅阈值', description: '当日涨跌幅超过阈值时触发' },
    volume_spike: { label: '成交量异动', description: '当日成交量异常放大时触发' },
    rsrs_signal: { label: 'RSRS信号', description: 'RSRS指标发出买卖信号时触发' },
    volatility_high: { label: '波动率过高', description: '波动率超过阈值时触发' },
    correlation_break: { label: '相关性突变', description: '资产间相关性发生突变时触发' },
  }
  
  // 优先级配置
  const priorityConfig: Record<AlertPriority, { label: string; variant: string }> = {
    low: { label: '低', variant: 'secondary' },
    medium: { label: '中', variant: 'warning' },
    high: { label: '高', variant: 'danger' },
    critical: { label: '紧急', variant: 'danger' },
  }
  
  // 操作符配置
  const operatorConfig: Record<ConditionOperator, { label: string; needsValue2: boolean }> = {
    gt: { label: '大于', needsValue2: false },
    lt: { label: '小于', needsValue2: false },
    eq: { label: '等于', needsValue2: false },
    gte: { label: '大于等于', needsValue2: false },
    lte: { label: '小于等于', needsValue2: false },
    between: { label: '在范围内', needsValue2: true },
  }
  
  return (
    <div className="alert-rule-panel">
      <Card className="alert-rule-panel__card">
        <CardTitle className="alert-rule-panel__title">
          <span>{title}</span>
          <div className="alert-rule-panel__stats">
            <Badge variant="secondary">总数: {rules.length}</Badge>
            <Badge variant="success">启用: {rules.filter(r => r.enabled).length}</Badge>
          </div>
        </CardTitle>
        
        <CardContent className="alert-rule-panel__content">
          <div className="alert-rule-panel__layout">
            {/* 左侧：规则列表 */}
            <div className="alert-rule-panel__list">
              <div className="alert-rule-panel__list-header">
                <Input
                  placeholder="搜索规则..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="sm"
                  className="alert-rule-panel__search"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedRuleId(null)
                    setIsEditing(true)
                    setFormData({
                      name: '',
                      description: '',
                      enabled: true,
                      type: 'price_above',
                      ticker: '000001.SS',
                      condition: {
                        operator: 'gt',
                        value: 0,
                        value2: undefined,
                      },
                      priority: 'medium',
                      cooldownMinutes: 30,
                    })
                  }}
                >
                  新建规则
                </Button>
              </div>
              
              <div className="alert-rule-panel__rules">
                {filteredRules.length === 0 ? (
                  <div className="alert-rule-panel__empty-list">
                    {searchQuery ? '未找到匹配的规则' : '暂无规则，点击"新建规则"开始创建'}
                  </div>
                ) : (
                  filteredRules.map(rule => {
                    const isActive = rule.enabled
                    const isTriggered = isRuleTriggered(rule)
                    const currentValue = getCurrentValueForRule(rule)
                    
                    return (
                      <div
                        key={rule.id}
                        className={`alert-rule-panel__rule-item ${
                          selectedRuleId === rule.id ? 'alert-rule-panel__rule-item--selected' : ''
                        }`}
                        onClick={() => handleSelectRule(rule)}
                      >
                        <div className="alert-rule-panel__rule-item-header">
                          <div className="alert-rule-panel__rule-item-title">
                            <span className="alert-rule-panel__rule-item-name">{rule.name}</span>
                            <Badge 
                              variant={isActive ? 'success' : 'secondary'} 
                              size="sm"
                            >
                              {isActive ? '启用' : '禁用'}
                            </Badge>
                            {isTriggered && currentValue !== null && (
                              <Badge variant="danger" size="sm">
                                {rule.condition.operator === 'gt' ? '>' : '<'} 
                                {currentValue.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                          <Badge 
                            variant={priorityConfig[rule.priority].variant as any} 
                            size="sm"
                          >
                            {priorityConfig[rule.priority].label}
                          </Badge>
                        </div>
                        
                        <div className="alert-rule-panel__rule-item-details">
                          <span className="alert-rule-panel__rule-item-ticker">{rule.ticker}</span>
                          <span className="alert-rule-panel__rule-item-type">
                            {ruleTypeConfig[rule.type].label}
                          </span>
                          <span className="alert-rule-panel__rule-item-condition">
                            {operatorConfig[rule.condition.operator].label} {rule.condition.value}
                            {rule.condition.value2 !== undefined && ` ~ ${rule.condition.value2}`}
                          </span>
                        </div>
                        
                        {rule.description && (
                          <div className="alert-rule-panel__rule-item-description">
                            {rule.description}
                          </div>
                        )}
                        
                        <div className="alert-rule-panel__rule-item-footer">
                          <span className="alert-rule-panel__rule-item-triggers">
                            触发: {rule.triggerCount}次
                          </span>
                          {rule.lastTriggeredAt && (
                            <span className="alert-rule-panel__rule-item-last-trigger">
                              最后: {new Date(rule.lastTriggeredAt).toLocaleDateString('zh-CN')}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            
            {/* 右侧：规则详情/编辑 */}
            {showDetails && (
              <div className="alert-rule-panel__detail">
                {isEditing ? (
                  // 编辑/创建表单
                  <div className="alert-rule-panel__form">
                    <h3 className="alert-rule-panel__form-title">
                      {selectedRule ? '编辑规则' : '新建规则'}
                    </h3>
                    
                    {formErrors.length > 0 && (
                      <div className="alert-rule-panel__form-errors">
                        {formErrors.map((error, index) => (
                          <div key={index} className="alert-rule-panel__form-error">
                            {error}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="alert-rule-panel__form-grid">
                      {/* 规则名称 */}
                      <div className="alert-rule-panel__form-group">
                        <label className="alert-rule-panel__form-label">
                          规则名称 *
                        </label>
                        <Input
                          value={formData.name || ''}
                          onChange={(e) => handleFormChange('name', e.target.value)}
                          placeholder="例如: 突破买入警报"
                          size="sm"
                        />
                      </div>
                      
                      {/* 标的代码 */}
                      <div className="alert-rule-panel__form-group">
                        <label className="alert-rule-panel__form-label">
                          标的代码 *
                        </label>
                        <Input
                          value={formData.ticker || ''}
                          onChange={(e) => handleFormChange('ticker', e.target.value)}
                          placeholder="例如: 000001.SS"
                          size="sm"
                        />
                      </div>
                      
                      {/* 规则类型 */}
                      <div className="alert-rule-panel__form-group">
                        <label className="alert-rule-panel__form-label">
                          警报类型
                        </label>
                        <div className="alert-rule-panel__form-select">
                          <select
                            value={formData.type || 'price_above'}
                            onChange={(e) => handleFormChange('type', e.target.value as AlertRuleType)}
                            className="alert-rule-panel__select"
                          >
                            {Object.entries(ruleTypeConfig).map(([type, config]) => (
                              <option key={type} value={type}>
                                {config.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="alert-rule-panel__form-hint">
                          {ruleTypeConfig[formData.type || 'price_above'].description}
                        </div>
                      </div>
                      
                      {/* 操作符 */}
                      <div className="alert-rule-panel__form-group">
                        <label className="alert-rule-panel__form-label">
                          条件操作符
                        </label>
                        <div className="alert-rule-panel__form-select">
                          <select
                            value={formData.condition?.operator || 'gt'}
                            onChange={(e) => handleFormChange('condition.operator', e.target.value as ConditionOperator)}
                            className="alert-rule-panel__select"
                          >
                            {Object.entries(operatorConfig).map(([op, config]) => (
                              <option key={op} value={op}>
                                {config.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* 阈值1 */}
                      <div className="alert-rule-panel__form-group">
                        <label className="alert-rule-panel__form-label">
                          阈值 {operatorConfig[formData.condition?.operator || 'gt'].needsValue2 ? '下限' : ''} *
                        </label>
                        <Input
                          type="number"
                          value={formData.condition?.value || ''}
                          onChange={(e) => handleFormChange('condition.value', parseFloat(e.target.value) || 0)}
                          size="sm"
                        />
                      </div>
                      
                      {/* 阈值2 (仅between操作符需要) */}
                      {operatorConfig[formData.condition?.operator || 'gt'].needsValue2 && (
                        <div className="alert-rule-panel__form-group">
                          <label className="alert-rule-panel__form-label">
                            阈值上限 *
                          </label>
                          <Input
                            type="number"
                            value={formData.condition?.value2 || ''}
                            onChange={(e) => handleFormChange('condition.value2', parseFloat(e.target.value) || 0)}
                            size="sm"
                          />
                        </div>
                      )}
                      
                      {/* 优先级 */}
                      <div className="alert-rule-panel__form-group">
                        <label className="alert-rule-panel__form-label">
                          警报优先级
                        </label>
                        <div className="alert-rule-panel__form-priorities">
                          {Object.entries(priorityConfig).map(([priority, config]) => (
                            <div
                              key={priority}
                              className={`alert-rule-panel__priority-option ${
                                formData.priority === priority ? 'alert-rule-panel__priority-option--selected' : ''
                              }`}
                              onClick={() => handleFormChange('priority', priority as AlertPriority)}
                            >
                              <Badge variant={config.variant as any} size="sm">
                                {config.label}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* 冷却时间 */}
                      <div className="alert-rule-panel__form-group">
                        <label className="alert-rule-panel__form-label">
                          冷却时间 (分钟)
                        </label>
                        <Input
                          type="number"
                          value={formData.cooldownMinutes || 30}
                          onChange={(e) => handleFormChange('cooldownMinutes', parseInt(e.target.value) || 30)}
                          size="sm"
                        />
                        <div className="alert-rule-panel__form-hint">
                          防止短时间内重复触发
                        </div>
                      </div>
                      
                      {/* 描述 */}
                      <div className="alert-rule-panel__form-group alert-rule-panel__form-group--full">
                        <label className="alert-rule-panel__form-label">
                          规则描述
                        </label>
                        <textarea
                          value={formData.description || ''}
                          onChange={(e) => handleFormChange('description', e.target.value)}
                          className="alert-rule-panel__textarea"
                          placeholder="可选，描述此规则的作用..."
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="alert-rule-panel__form-actions">
                      <Button
                        variant="primary"
                        onClick={selectedRule ? handleSaveEdit : handleSubmit}
                      >
                        {selectedRule ? '保存修改' : '创建规则'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsEditing(false)
                          setFormErrors([])
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : selectedRule ? (
                  // 规则详情视图
                  <div className="alert-rule-panel__detail-view">
                    <div className="alert-rule-panel__detail-header">
                      <h3 className="alert-rule-panel__detail-title">{selectedRule.name}</h3>
                      <div className="alert-rule-panel__detail-badges">
                        <Badge 
                          variant={selectedRule.enabled ? 'success' : 'secondary'} 
                          size="sm"
                        >
                          {selectedRule.enabled ? '启用' : '禁用'}
                        </Badge>
                        <Badge 
                          variant={priorityConfig[selectedRule.priority].variant as any} 
                          size="sm"
                        >
                          {priorityConfig[selectedRule.priority].label}
                        </Badge>
                      </div>
                    </div>
                    
                    {selectedRule.description && (
                      <div className="alert-rule-panel__detail-description">
                        {selectedRule.description}
                      </div>
                    )}
                    
                    <div className="alert-rule-panel__detail-info">
                      <div className="alert-rule-panel__detail-row">
                        <span className="alert-rule-panel__detail-label">标的:</span>
                        <span className="alert-rule-panel__detail-value">{selectedRule.ticker}</span>
                      </div>
                      <div className="alert-rule-panel__detail-row">
                        <span className="alert-rule-panel__detail-label">类型:</span>
                        <span className="alert-rule-panel__detail-value">
                          {ruleTypeConfig[selectedRule.type].label}
                        </span>
                      </div>
                      <div className="alert-rule-panel__detail-row">
                        <span className="alert-rule-panel__detail-label">条件:</span>
                        <span className="alert-rule-panel__detail-value">
                          {operatorConfig[selectedRule.condition.operator].label} {selectedRule.condition.value}
                          {selectedRule.condition.value2 !== undefined && ` ~ ${selectedRule.condition.value2}`}
                        </span>
                      </div>
                      <div className="alert-rule-panel__detail-row">
                        <span className="alert-rule-panel__detail-label">冷却:</span>
                        <span className="alert-rule-panel__detail-value">
                          {selectedRule.cooldownMinutes} 分钟
                        </span>
                      </div>
                      <div className="alert-rule-panel__detail-row">
                        <span className="alert-rule-panel__detail-label">触发次数:</span>
                        <span className="alert-rule-panel__detail-value">{selectedRule.triggerCount}</span>
                      </div>
                      {selectedRule.lastTriggeredAt && (
                        <div className="alert-rule-panel__detail-row">
                          <span className="alert-rule-panel__detail-label">最后触发:</span>
                          <span className="alert-rule-panel__detail-value">
                            {new Date(selectedRule.lastTriggeredAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      )}
                      <div className="alert-rule-panel__detail-row">
                        <span className="alert-rule-panel__detail-label">创建时间:</span>
                        <span className="alert-rule-panel__detail-value">
                          {new Date(selectedRule.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                    
                    {/* 当前值显示 */}
                    <div className="alert-rule-panel__current-value">
                      <h4 className="alert-rule-panel__current-value-title">当前状态</h4>
                      {(() => {
                        const currentValue = getCurrentValueForRule(selectedRule)
                        const isTriggered = isRuleTriggered(selectedRule)
                        
                        if (currentValue === null) {
                          return (
                            <div className="alert-rule-panel__current-value-info">
                              <span className="alert-rule-panel__current-value-label">当前值:</span>
                              <span className="alert-rule-panel__current-value-missing">无法获取</span>
                            </div>
                          )
                        }
                        
                        return (
                          <>
                            <div className="alert-rule-panel__current-value-info">
                              <span className="alert-rule-panel__current-value-label">当前值:</span>
                              <span className={`alert-rule-panel__current-value-number ${
                                isTriggered ? 'alert-rule-panel__current-value--triggered' : ''
                              }`}>
                                {currentValue.toFixed(2)}
                              </span>
                            </div>
                            <div className="alert-rule-panel__current-value-info">
                              <span className="alert-rule-panel__current-value-label">状态:</span>
                              <Badge variant={isTriggered ? 'danger' : 'success'} size="sm">
                                {isTriggered ? '已触发' : '未触发'}
                              </Badge>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                    
                    <div className="alert-rule-panel__detail-actions">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleEditRule}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDuplicateRule}
                      >
                        复制
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRule(selectedRule.id)}
                      >
                        {selectedRule.enabled ? '禁用' : '启用'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteRule}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 无选中规则时的提示
                  <div className="alert-rule-panel__empty-detail">
                    <div className="alert-rule-panel__empty-detail-icon">📋</div>
                    <h3 className="alert-rule-panel__empty-detail-title">选择规则</h3>
                    <p className="alert-rule-panel__empty-detail-message">
                      从左侧列表中选择一个规则以查看详情，或点击"新建规则"创建新规则
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export type { AlertRulePanelProps }
export default AlertRulePanel
