import React from 'react';
import { useAnalysisStore } from '../../stores/analysis.store';
import { useUIStore } from '../../stores/ui.store';
import { RSRSIndicator, VolatilitySkew } from '../../types/market';

interface DashboardProps {
  className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const { marketData, rsrsIndicators, volatilitySkews, riskSignals, portfolio } = useAnalysisStore();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';
  
  // 计算汇总数据
  const totalMarketValue = Object.values(marketData).reduce((sum, m) => sum + m.price * m.volume, 0);
  const avgChange = Object.values(marketData).reduce((sum, m) => sum + m.changePercent, 0) / Object.values(marketData).length || 0;
  const highRiskCount = riskSignals.filter(s => s.level === 'high').length;
  
  return (
    <div className={`dashboard ${className}`}>
      {/* 标题栏 */}
      <div className={`dashboard-header ${isDark ? 'dark' : 'light'}`}>
        <h2>📊 市场仪表盘</h2>
        <span className="timestamp">
          {new Date().toLocaleString('zh-CN')}
        </span>
      </div>
      
      {/* 概览卡片 */}
      <div className="overview-cards">
        <OverviewCard
          title="市场总览"
          value={totalMarketValue.toLocaleString('zh-CN', { style: 'currency', currency: 'USD' })}
          subtitle={`${Object.keys(marketData).length} 个标的`}
          trend={avgChange > 0 ? 'up' : avgChange < 0 ? 'down' : 'neutral'}
        />
        
        <OverviewCard
          title="风险信号"
          value={highRiskCount.toString()}
          subtitle="高风险警报"
          trend={highRiskCount > 0 ? 'warning' : 'safe'}
          color={highRiskCount > 0 ? 'red' : 'green'}
        />
        
        <OverviewCard
          title="持仓价值"
          value={portfolio?.totalValue.toLocaleString('zh-CN', { style: 'currency', currency: 'USD' }) || '--'}
          subtitle={portfolio ? `${portfolio.dailyChangePercent >= 0 ? '+' : ''}${portfolio.dailyChangePercent.toFixed(2)}%` : '未加载'}
          trend={portfolio && portfolio.dailyChangePercent >= 0 ? 'up' : 'down'}
        />
      </div>
      
      {/* 技术指标面板 */}
      <div className="indicators-panel">
        <h3>📈 技术指标</h3>
        <div className="indicators-grid">
          {Object.values(rsrsIndicators).map((rsrs: RSRSIndicator) => (
            <IndicatorCard key={rsrs.ticker} indicator={rsrs} type="rsrs" />
          ))}
          
          {Object.values(volatilitySkews).map((skew: VolatilitySkew) => (
            <IndicatorCard key={skew.ticker} indicator={skew} type="volatility" />
          ))}
        </div>
      </div>
      
      {/* 风险信号面板 */}
      {riskSignals.length > 0 && (
        <div className="risk-panel">
          <h3>⚠️ 风险信号</h3>
          <div className="risk-list">
            {riskSignals.map((signal, idx) => (
              <div key={idx} className={`risk-item ${signal.level}`}>
                <span className="risk-level">{signal.level.toUpperCase()}</span>
                <span className="risk-message">{signal.message}</span>
                <span className="risk-recommendation">{signal.recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 市场数据表格 */}
      <div className="market-table-panel">
        <h3>📋 市场数据</h3>
        <table className="market-table">
          <thead>
            <tr>
              <th>代码</th>
              <th>名称</th>
              <th>价格</th>
              <th>涨跌</th>
              <th>成交量</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(marketData).map((market) => (
              <tr key={market.ticker}>
                <td className="ticker">{market.ticker}</td>
                <td>{market.name}</td>
                <td className="price">{market.price.toFixed(2)}</td>
                <td className={market.change >= 0 ? 'positive' : 'negative'}>
                  {market.change >= 0 ? '+' : ''}{market.changePercent.toFixed(2)}%
                </td>
                <td className="volume">{(market.volume / 1000000).toFixed(2)}M</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <style>{`
        .dashboard {
          padding: 16px;
          background: ${isDark ? '#1a1a2e' : '#f5f5f5'};
          border-radius: 8px;
          color: ${isDark ? '#e0e0e0' : '#333'};
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        
        .dashboard-header.dark {
          background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
        }
        
        .dashboard-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }
        
        .overview-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .indicators-panel, .risk-panel, .market-table-panel {
          background: ${isDark ? '#16213e' : '#fff'};
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .indicators-panel h3, .risk-panel h3, .market-table-panel h3 {
          margin: 0 0 12px 0;
          font-size: 1rem;
        }
        
        .indicators-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }
        
        .risk-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .risk-item {
          display: flex;
          gap: 12px;
          padding: 10px;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        .risk-item.high {
          background: rgba(255, 82, 82, 0.2);
          border-left: 3px solid #ff5252;
        }
        
        .risk-item.medium {
          background: rgba(255, 179, 0, 0.2);
          border-left: 3px solid #ffb300;
        }
        
        .risk-item.low {
          background: rgba(76, 175, 80, 0.2);
          border-left: 3px solid #4caf50;
        }
        
        .market-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .market-table th, .market-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid ${isDark ? '#333' : '#eee'};
        }
        
        .market-table th {
          font-weight: 600;
          color: ${isDark ? '#888' : '#666'};
        }
        
        .ticker {
          font-weight: 600;
          color: #2196f3;
        }
        
        .positive { color: #4caf50; }
        .negative { color: #ff5252; }
      `}</style>
    </div>
  );
};

// 概览卡片组件
interface OverviewCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: 'up' | 'down' | 'neutral' | 'warning' | 'safe';
  color?: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, subtitle, trend, color }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'warning': return '⚠️';
      case 'safe': return '✅';
      default: return '➡️';
    }
  };
  
  return (
    <div className="overview-card" style={{ borderColor: color || 'transparent' }}>
      <div className="card-header">
        <span className="title">{title}</span>
        <span className="trend">{getTrendIcon()}</span>
      </div>
      <div className="card-value">{value}</div>
      <div className="card-subtitle">{subtitle}</div>
    </div>
  );
};

// 指标卡片组件
interface IndicatorCardProps {
  indicator: RSRSIndicator | VolatilitySkew;
  type: 'rsrs' | 'volatility';
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({ indicator, type }) => {
  const isDark = useUIStore(state => state.theme) === 'dark';
  
  const getValue = () => {
    if (type === 'rsrs') {
      const rsrs = indicator as RSRSIndicator;
      return `${rsrs.value.toFixed(3)} (${rsrs.signal.toUpperCase()})`;
    } else {
      const skew = indicator as VolatilitySkew;
      return `${skew.ratio.toFixed(2)} (${skew.signal.toUpperCase()})`;
    }
  };
  
  const getColor = () => {
    if (type === 'rsrs') {
      const rsrs = indicator as RSRSIndicator;
      if (rsrs.signal === 'long') return '#4caf50';
      if (rsrs.signal === 'short') return '#ff5252';
      return '#ffb300';
    } else {
      const skew = indicator as VolatilitySkew;
      if (skew.signal === 'high') return '#ff5252';
      if (skew.signal === 'low') return '#4caf50';
      return '#ffb300';
    }
  };
  
  return (
    <div className="indicator-card" style={{ borderColor: getColor() }}>
      <div className="indicator-ticker">{indicator.ticker}</div>
      <div className="indicator-value">{getValue()}</div>
    </div>
  );
};

export default Dashboard;
