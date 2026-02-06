// NotificationCenter - 警报通知中心组件
// Created: 2026-02-06 (T-06e)
// 功能：显示和管理警报事件，支持过滤、标记已读等操作

import React, { useState, useMemo } from 'react'
import { Button } from '../../atoms/Button'
import { Card, CardTitle, CardContent } from '../../atoms/Card'
import { Badge } from '../../atoms/Badge'
import { Input } from '../../atoms/Input'
import { AlertEvent, AlertPriority } from '../../../types/alerts'
import { useAlertStore } from '../../../stores/alert.store'
import './NotificationCenter.css'

interface NotificationCenterProps {
  /** 是否显示面板 */
  isOpen: boolean
  /** 关闭面板回调 */
  onClose: () => void
  /** 初始过滤类型 */
  initialFilter?: 'all' | 'unread' | 'critical' | 'by_ticker'
  /** 自定义标题 */
  title?: string
  /** 最大显示事件数量 */
  maxEvents?: number
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  initialFilter = 'all',
  title = '警报通知中心',
  maxEvents = 100,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'by_ticker'>(initialFilter)
  const [tickerFilter, setTickerFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // 获取警报状态
  const events = useAlertStore((state) => state.events)
  const acknowledgeEvent = useAlertStore((state) => state.acknowledgeEvent)
  const acknowledgeAll = useAlertStore((state) => state.acknowledgeAll)
  const removeEvent = useAlertStore((state) => state.removeEvent)
  const clearEvents = useAlertStore((state) => state.clearEvents)
  const getStats = useAlertStore((state) => state.getStats)
  
  const stats = getStats()
  
  // 过滤和排序事件
  const filteredEvents = useMemo(() => {
    let filtered = [...events]
    
    // 应用类型过滤
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(e => !e.acknowledged)
        break
      case 'critical':
        filtered = filtered.filter(e => e.priority === 'critical' || e.priority === 'high')
        break
      case 'by_ticker':
        if (tickerFilter.trim()) {
          filtered = filtered.filter(e => 
            e.ticker.toLowerCase().includes(tickerFilter.toLowerCase().trim())
          )
        }
        break
      case 'all':
      default:
        // 不进行额外过滤
        break
    }
    
    // 应用搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(e => 
        e.message.toLowerCase().includes(query) ||
        e.ruleName.toLowerCase().includes(query) ||
        e.ticker.toLowerCase().includes(query)
      )
    }
    
    // 按时间倒序排序（最新的在前面）
    filtered.sort((a, b) => 
      new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    )
    
    // 限制显示数量
    return filtered.slice(0, maxEvents)
  }, [events, filter, tickerFilter, searchQuery, maxEvents])
  
  // 如果没有打开，不渲染任何内容
  if (!isOpen) return null
  
  // 优先级配置
  const priorityConfig: Record<AlertPriority, { 
    variant: 'secondary' | 'danger' | 'warning' | 'success' | 'info' | 'neutral'
    icon: string
    label: string
  }> = {
    low: { variant: 'secondary', icon: 'ℹ️', label: '低' },
    medium: { variant: 'warning', icon: '⚠️', label: '中' },
    high: { variant: 'danger', icon: '🔴', label: '高' },
    critical: { variant: 'danger', icon: '🚨', label: '紧急' },
  }
  
  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffMins < 24 * 60) return `${Math.floor(diffMins / 60)}小时前`
    
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return (
    <div className="notification-center">
      {/* 遮罩层 */}
      <div className="notification-center__overlay" onClick={onClose} />
      
      {/* 面板 */}
      <div className="notification-center__panel">
        {/* 头部 */}
        <div className="notification-center__header">
          <div className="notification-center__title-group">
            <h2 className="notification-center__title">{title}</h2>
            <div className="notification-center__stats">
              <Badge variant="secondary">总数: {events.length}</Badge>
              <Badge variant={(stats.triggeredToday - stats.acknowledgedToday) > 0 ? 'danger' : 'success'}>
                今日: {stats.triggeredToday}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="notification-center__close-btn">
            ✕
          </Button>
        </div>
        
        {/* 过滤和搜索 */}
        <div className="notification-center__filters">
          <div className="notification-center__filter-buttons">
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
            <Button
              variant={filter === 'critical' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('critical')}
            >
              重要 ({events.filter(e => e.priority === 'critical' || e.priority === 'high').length})
            </Button>
          </div>
          
          <div className="notification-center__search">
            <Input
              placeholder="搜索警报..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
              className="notification-center__search-input"
            />
          </div>
          
          {filter === 'by_ticker' && (
            <div className="notification-center__ticker-filter">
              <Input
                placeholder="输入标的代码..."
                value={tickerFilter}
                onChange={(e) => setTickerFilter(e.target.value)}
                size="sm"
              />
            </div>
          )}
        </div>
        
        {/* 批量操作 */}
        <div className="notification-center__batch-actions">
          <Button variant="ghost" size="sm" onClick={acknowledgeAll} disabled={stats.triggeredToday === 0}>
            全部已读
          </Button>
          <Button variant="ghost" size="sm" onClick={() => clearEvents(30)}>
            清理30天前
          </Button>
          <div className="notification-center__batch-actions-right">
            <Button variant="ghost" size="sm" onClick={() => setFilter('by_ticker')}>
              按标的筛选
            </Button>
          </div>
        </div>
        
        {/* 事件列表 */}
        <div className="notification-center__content">
          {filteredEvents.length === 0 ? (
            <div className="notification-center__empty">
              {filter === 'unread' ? '暂无未读警报' : '暂无警报事件'}
              {searchQuery && <p className="notification-center__empty-hint">尝试调整搜索条件</p>}
            </div>
          ) : (
            <div className="notification-center__events">
              {filteredEvents.map((event) => {
                const priority = priorityConfig[event.priority]
                
                return (
                  <div
                    key={event.id}
                    className={`notification-center__event ${
                      event.acknowledged 
                        ? 'notification-center__event--acknowledged'
                        : 'notification-center__event--unread'
                    }`}
                    onClick={() => acknowledgeEvent(event.id)}
                  >
                    <div className="notification-center__event-header">
                      <div className="notification-center__event-priority">
                        <span className="notification-center__event-icon">{priority.icon}</span>
                        <Badge variant={priority.variant} size="sm">
                          {priority.label}
                        </Badge>
                        <Badge variant="secondary" size="sm">
                          {event.ticker}
                        </Badge>
                      </div>
                      <div className="notification-center__event-time">
                        {formatTime(event.triggeredAt)}
                        {!event.acknowledged && (
                          <div className="notification-center__event-unread-dot" />
                        )}
                      </div>
                    </div>
                    
                    <div className="notification-center__event-body">
                      <h4 className="notification-center__event-title">{event.ruleName}</h4>
                      <p className="notification-center__event-message">{event.message}</p>
                      
                      <div className="notification-center__event-details">
                        <div className="notification-center__event-detail">
                          <span className="notification-center__event-detail-label">阈值:</span>
                          <span className="notification-center__event-detail-value">{event.threshold.toFixed(2)}</span>
                        </div>
                        <div className="notification-center__event-detail">
                          <span className="notification-center__event-detail-label">当前值:</span>
                          <span className={`notification-center__event-detail-value ${
                            event.currentValue > event.threshold ? 'notification-center__event-value--above' :
                            event.currentValue < event.threshold ? 'notification-center__event-value--below' :
                            'notification-center__event-value--equal'
                          }`}>
                            {event.currentValue.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="notification-center__event-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acknowledgeEvent(event.id)}
                      >
                        {event.acknowledged ? '已读 ✓' : '标记已读'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEvent(event.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {/* 底部统计 */}
        <div className="notification-center__footer">
          <div className="notification-center__footer-stats">
            <span>今日触发: <strong>{stats.triggeredToday}</strong></span>
            <span>已确认: <strong>{stats.acknowledgedToday}</strong></span>
            <span>显示: <strong>{filteredEvents.length}</strong> / {events.length}</span>
          </div>
          <div className="notification-center__footer-actions">
            <Button variant="ghost" size="sm" onClick={() => clearEvents(7)}>
              清理一周前
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export type { NotificationCenterProps }
export default NotificationCenter
