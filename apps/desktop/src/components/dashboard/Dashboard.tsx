// Dashboard - Migrated to Atomic Design (T-C5.18)
// Uses: DataCard, Card, Badge, StatusDot
// Last Updated: 2026-02-03

import React, { useMemo } from 'react';
import {
  useAnalysisStore,
  selectMarketData,
  selectRiskSignals,
  selectPortfolio,
} from '../../stores/analysis.store';
import { DataCardGrid } from '@components/molecules/DataCard';
import { Card, CardTitle, CardContent } from '@components/atoms/Card';
import { Badge } from '@components/atoms/Badge';
import { StatusDot } from '@components/atoms/StatusDot';
import './Dashboard.css';

// ============ 子组件：指标卡片 (使用 Card) ============
const IndicatorCard: React.FC<{
  ticker: string;
  value: string;
  signal: string;
  type: 'rsrs' | 'volatility';
}> = ({ ticker, value, signal, type }) => {
  const signalVariant =
    signal === 'long' || signal === 'low'
      ? 'success'
      : signal === 'short' || signal === 'high'
        ? 'danger'
        : 'warning';

  return (
    <Card padding="sm" elevation="none">
      <div className="indicator--card">
        <div className="indicator--card-header">
          <span className="indicator--card-ticker">{ticker}</span>
          <Badge variant={signalVariant} size="sm">
            {signal.toUpperCase()}
          </Badge>
        </div>
        <div className="indicator--card-value">{value}</div>
        <div className="indicator--card-type">{type === 'rsrs' ? 'RSRS' : 'VOL'}</div>
      </div>
    </Card>
  );
};

// ============ 子组件：风险警报卡片 ============
const RiskAlertCard: React.FC<{
  level: string;
  message: string;
  recommendation: string;
  timestamp: string;
}> = ({ level, message, recommendation, timestamp }) => {
  const levelVariant = level === 'high' ? 'danger' : level === 'medium' ? 'warning' : 'success';

  return (
    <Card padding="sm" elevation="none">
      <div className={`risk-alert-card risk-alert-${level}`}>
        <div className="risk-alert-header">
          <Badge variant={levelVariant} size="sm">
            {level.toUpperCase()}
          </Badge>
          <span className="risk-alert-time">{timestamp}</span>
        </div>
        <p className="risk-alert-message">{message}</p>
        <p className="risk-alert-recommendation">建议: {recommendation}</p>
      </div>
    </Card>
  );
};

// ============ 主组件：Dashboard (迁移后) ============
export const Dashboard: React.FC = () => {
  // 使用优化后的 Selector
  const marketData = useAnalysisStore(selectMarketData);
  const riskSignals = useAnalysisStore(selectRiskSignals);
  const portfolio = useAnalysisStore(selectPortfolio);

  // 获取指标数据
  const rsrsIndicators = useAnalysisStore((state) => state.rsrsIndicators);
  const volatilitySkews = useAnalysisStore((state) => state.volatilitySkews);

  // 计算派生数据 (memoized)
  const stats = useMemo(() => {
    const marketList = Object.values(marketData);
    const totalMarketValue = marketList.reduce((sum, m) => sum + m.price * m.volume, 0);
    const avgChange =
      marketList.reduce((sum, m) => sum + m.changePercent, 0) / (marketList.length || 1);
    const highRiskCount = riskSignals.filter((s) => s.level === 'high').length;

    return {
      count: marketList.length,
      totalValue: totalMarketValue,
      avgChange,
      highRiskCount,
      portfolioValue: portfolio?.totalValue || '--',
      portfolioChange: portfolio?.dailyChangePercent || 0,
    };
  }, [marketData, riskSignals, portfolio]);

  // 格式化时间
  const formatTime = () => new Date().toLocaleString('zh-CN');

  // 指标列表
  const indicators = useMemo(() => {
    const list = [
      ...Object.values(rsrsIndicators)
        .slice(0, 8)
        .map((r) => ({
          ticker: r.ticker,
          value: r.value.toFixed(3),
          signal: r.signal,
          type: 'rsrs' as const,
        })),
      ...Object.values(volatilitySkews)
        .slice(0, 8)
        .map((s) => ({
          ticker: s.ticker,
          value: s.ratio.toFixed(2),
          signal: s.signal,
          type: 'volatility' as const,
        })),
    ];
    return list;
  }, [rsrsIndicators, volatilitySkews]);

  return (
    <div className="dashboard">
      {/* Header */}
      <Card elevation="low" padding="md" className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-header-title">
            <span className="dashboard-icon">📊</span>
            <div>
              <h2>市场全景概览</h2>
              <p>System Status: Online | Real-time Data</p>
            </div>
          </div>
          <div className="dashboard-timestamp">{formatTime()}</div>
        </div>
      </Card>

      {/* Overview Cards Grid */}
      <DataCardGrid
        items={[
          {
            title: '市场总成交额 (Est.)',
            value: stats.totalValue.toLocaleString('zh-CN', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }),
            trend: stats.avgChange > 0 ? 'up' : stats.avgChange < 0 ? 'down' : 'neutral',
            trendValue: `${stats.avgChange >= 0 ? '+' : ''}${stats.avgChange.toFixed(2)}%`,
            icon: '📈',
            subtitle: `覆盖 ${stats.count} 个活跃标的`,
          },
          {
            title: '高风险警报',
            value: stats.highRiskCount.toString(),
            trend: stats.highRiskCount > 0 ? 'down' : 'up',
            trendValue: stats.highRiskCount > 0 ? '需要关注' : '正常运行',
            icon: '⚠️',
            highlighted: stats.highRiskCount > 0,
          },
          {
            title: '模拟持仓净值',
            value:
              typeof stats.portfolioValue === 'number'
                ? stats.portfolioValue.toLocaleString('zh-CN', {
                    style: 'currency',
                    currency: 'USD',
                  })
                : stats.portfolioValue,
            trend: stats.portfolioChange >= 0 ? 'up' : 'down',
            trendValue: `${stats.portfolioChange >= 0 ? '+' : ''}${stats.portfolioChange.toFixed(2)}%`,
            icon: '💼',
          },
        ]}
        columns={3}
      />

      {/* Main Content Grid */}
      <div className="dashboard-main">
        {/* Left Column: Indicators */}
        <Card elevation="low" padding="md" className="dashboard-section">
          <CardTitle>关键技术指标监控</CardTitle>
          <CardContent>
            <div className="indicator--grid">
              {indicators.length > 0 ? (
                indicators.map((ind) => <IndicatorCard key={ind.ticker} {...ind} />)
              ) : (
                <div className="empty--state">
                  <StatusDot status="loading" label="暂无指标数据" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Risk Alerts */}
        <Card elevation="low" padding="md" className="dashboard-section">
          <CardTitle>实时风控日志</CardTitle>
          <CardContent>
            <div className="risk-alerts">
              {riskSignals.length > 0 ? (
                riskSignals.map((signal, idx) => (
                  <RiskAlertCard
                    key={idx}
                    level={signal.level}
                    message={signal.message}
                    recommendation={signal.recommendation}
                    timestamp={new Date().toLocaleTimeString()}
                  />
                ))
              ) : (
                <div className="empty--state">
                  <StatusDot status="connected" label="系统运行正常" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
