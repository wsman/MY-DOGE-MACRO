// Dashboard - Complete Page Implementation (T-1.9.0-02)
// Integrates: MarketOverview, AnalysisPanel, AIReportPanel Organisms
// Last Updated: 2026-02-06

import React, { useEffect, useState, useMemo } from 'react';
import { useAnalysisStore } from '../../stores/analysis.store';
import { useLayoutStore } from '../../stores/layout.store';
import { Card, CardTitle, CardContent } from '../atoms/Card';
import { StatusDot } from '../atoms/StatusDot';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { DataCardGrid } from '../molecules/DataCard';

// Import Organisms
import MarketOverview, { MarketItem } from '../organisms/MarketOverview';
import AnalysisPanel from '../organisms/AnalysisPanel';
import AIReportPanel, { AIReport } from '../organisms/AIReportPanel';

import './Dashboard.css';

// ============ 主组件：Dashboard (完整页面) ============
export const Dashboard: React.FC = () => {
  // Store hooks
  const {
    marketData,
    isLoading,
    error,
    fetchMarketSnapshot,
    rsrsIndicators,
    volatilitySkews,
    riskSignals,
    portfolio,
  } = useAnalysisStore();

  // Local state
  const [selectedTicker, setSelectedTicker] = useState<string>('600000');
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Load market data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchMarketSnapshot();
      } catch (err) {
        console.error('Failed to load market data:', err);
      }
    };
    
    loadData();
  }, [fetchMarketSnapshot]);

  // Format market data for MarketOverview
  const marketItems: MarketItem[] = useMemo(() => {
    return Object.values(marketData).map(item => ({
      ticker: item.ticker,
      name: item.name || item.ticker,
      price: item.price,
      change: item.change || 0,
      changePercent: item.changePercent,
      volume: item.volume,
      high: item.high || item.price * 1.05,
      low: item.low || item.price * 0.95,
    }));
  }, [marketData]);

  // Get selected stock data
  const selectedStock = marketData[selectedTicker];
  const selectedRSRS = rsrsIndicators[selectedTicker];
  const selectedVolatility = volatilitySkews[selectedTicker];

  // Calculate summary stats
  const stats = useMemo(() => {
    const marketList = Object.values(marketData);
    const totalMarketValue = marketList.reduce((sum, m) => sum + m.price * m.volume, 0);
    const avgChange = marketList.reduce((sum, m) => sum + m.changePercent, 0) / (marketList.length || 1);
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

  // Handle stock selection
  const handleSelectTicker = (ticker: string) => {
    setSelectedTicker(ticker);
  };

  // Handle AI report generation
  const handleGenerateReport = async () => {
    setAiLoading(true);
    setAiError(null);
    
    try {
      // Simulate API call - replace with actual API integration later
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockReport: AIReport = {
        id: 'report_' + Date.now(),
        title: `${selectedTicker} AI分析报告`,
        summary: `基于当前市场数据，${selectedTicker}呈现${selectedStock?.changePercent >= 0 ? '上涨' : '下跌'}趋势。RSRS指标显示${selectedRSRS?.signal === 'long' ? '多头' : selectedRSRS?.signal === 'short' ? '空头' : '中性'}信号，波动率偏度${selectedVolatility?.signal === 'low' ? '较低' : selectedVolatility?.signal === 'high' ? '较高' : '适中'}。`,
        content: `
          <h3>技术分析</h3>
          <p>当前价格：$${selectedStock?.price?.toFixed(2) || 'N/A'}</p>
          <p>日涨跌幅：${selectedStock?.changePercent?.toFixed(2) || '0.00'}%</p>
          <p>RSRS值：${selectedRSRS?.value?.toFixed(4) || 'N/A'}</p>
          <p>波动率偏度：${selectedVolatility?.ratio?.toFixed(2) || 'N/A'}</p>
          
          <h3>市场情绪</h3>
          <p>市场整体情绪${stats.avgChange >= 0 ? '积极' : '谨慎'}，平均涨跌幅${stats.avgChange.toFixed(2)}%。</p>
          
          <h3>风险提示</h3>
          <p>当前高风险警报数量：${stats.highRiskCount}个</p>
          <p>建议${stats.highRiskCount > 0 ? '密切关注风险控制' : '正常持仓'}</p>
        `,
        sentiment: selectedStock?.changePercent >= 0 ? 'bullish' : 
                  selectedStock?.changePercent < 0 ? 'bearish' : 'neutral',
        confidence: 0.85,
        tickers: [selectedTicker],
        generatedAt: new Date(),
        model: 'DeepSeek-分析模型 v1.0',
      };
      
      setAiReport(mockReport);
    } catch (err) {
      setAiError('生成研报失败，请稍后重试');
      console.error('AI report generation failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Format time
  const formatTime = () => new Date().toLocaleString('zh-CN');

  // Loading skeleton
  if (isLoading && marketItems.length === 0) {
    return (
      <div className="dashboard dashboard-loading">
        <div className="dashboard-header skeleton"></div>
        <div className="dashboard-cards skeleton"></div>
        <div className="dashboard-main">
          <div className="dashboard-section skeleton"></div>
          <div className="dashboard-section skeleton"></div>
          <div className="dashboard-section skeleton"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && marketItems.length === 0) {
    return (
      <div className="dashboard dashboard-error">
        <Card elevation="low" padding="md">
          <CardTitle>数据加载失败</CardTitle>
          <CardContent>
            <p>无法加载市场数据：{error}</p>
            <Button variant="primary" onClick={() => fetchMarketSnapshot()}>
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <Card elevation="low" padding="md" className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-header-title">
            <span className="dashboard-icon">📊</span>
            <div>
              <h2>市场全景概览</h2>
              <p>System Status: {isLoading ? 'Loading...' : 'Online | Real-time Data'}</p>
            </div>
          </div>
          <div className="dashboard-header-stats">
            <Badge variant="success" size="sm">
              活跃标的: {stats.count}
            </Badge>
            <Badge variant={stats.avgChange >= 0 ? 'success' : 'danger'} size="sm">
              平均涨跌: {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange.toFixed(2)}%
            </Badge>
            <div className="dashboard-timestamp">{formatTime()}</div>
          </div>
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

      {/* Main Content Grid - Three Organisms */}
      <div className="dashboard-main">
        {/* Left Column: Market Overview */}
        <div className="dashboard-section">
          <MarketOverview
            markets={marketItems}
            title="市场概览"
            onSelectTicker={handleSelectTicker}
          />
        </div>

        {/* Middle Column: Analysis Panel */}
        <div className="dashboard-section">
          <AnalysisPanel
            ticker={selectedTicker}
            name={selectedStock?.name}
            data={[]} // TODO: Add actual OHLC data
            rsrsValue={selectedRSRS?.value}
            rsrsSignal={selectedRSRS?.signal}
            volatilityValue={selectedVolatility?.ratio}
            volatilitySignal={selectedVolatility?.signal}
            onRefresh={() => console.log('Refresh analysis')}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column: AI Report Panel */}
        <div className="dashboard-section">
          <AIReportPanel
            report={aiReport}
            onGenerate={handleGenerateReport}
            isLoading={aiLoading}
            error={aiError}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
