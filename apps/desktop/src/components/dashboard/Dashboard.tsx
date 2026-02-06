// Dashboard - Complete Page Implementation (T-1.9.0-02)
// Integrates: MarketOverview, AnalysisPanel, AIReportPanel Organisms
// Last Updated: 2026-02-06

import React, { useEffect, useState, useMemo } from 'react';
import { useAnalysisStore } from '../../stores/analysis.store';
import { useLayoutStore } from '../../stores/layout.store';
import { reportApi } from '../../services/api';
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
  const [aiReport, setAiReport] = useState<AIReport | undefined>(undefined);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | undefined>(undefined);

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

  // Map RSRS signal to AnalysisPanel expected type
  const mapRSRSSignal = (signal?: string) => {
    if (!signal) return 'neutral';
    if (signal === 'hold') return 'neutral';
    return signal as 'long' | 'short' | 'neutral';
  };

  // Map Volatility signal to AnalysisPanel expected type
  const mapVolatilitySignal = (signal?: string) => {
    if (!signal) return 'medium';
    if (signal === 'normal') return 'medium';
    return signal as 'low' | 'medium' | 'high';
  };

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
    setAiError(undefined);
    
    try {
      // 调用真实的API
      const result = await reportApi.generateReport(selectedTicker, {
        marketData: selectedStock,
        rsrsData: selectedRSRS,
        volatilityData: selectedVolatility,
        timestamp: new Date().toISOString()
      });

      // 检测情感
      const detectSentiment = (content: string) => {
        const bullishKeywords = ['上涨', '看涨', '多头', '买入', 'positive', 'bullish'];
        const bearishKeywords = ['下跌', '看跌', '空头', '卖出', 'negative', 'bearish'];
        
        const contentLower = content.toLowerCase();
        const bullishCount = bullishKeywords.filter(kw => contentLower.includes(kw)).length;
        const bearishCount = bearishKeywords.filter(kw => contentLower.includes(kw)).length;
        
        if (bullishCount > bearishCount) return 'bullish';
        if (bearishCount > bullishCount) return 'bearish';
        return 'neutral';
      };

      const newReport: AIReport = {
        id: 'report_' + Date.now(),
        title: `${selectedTicker} AI分析报告`,
        summary: result.report?.slice(0, 200) + '...' || `基于当前市场数据生成的专业分析报告`,
        content: result.report || '# 报告生成中...\n请稍后再试',
        sentiment: detectSentiment(result.report || ''),
        confidence: result.metrics ? 0.85 : 0.75,
        tickers: [selectedTicker],
        generatedAt: new Date(result.generated_at || new Date()),
        model: result.model || 'DeepSeek-分析模型',
      };
      
      setAiReport(newReport);
    } catch (err: any) {
      console.error('AI report generation failed:', err);
      setAiError(err.message || '生成研报失败，请检查API连接');
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
            rsrsSignal={mapRSRSSignal(selectedRSRS?.signal)}
            volatilityValue={selectedVolatility?.ratio}
            volatilitySignal={mapVolatilitySignal(selectedVolatility?.signal)}
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