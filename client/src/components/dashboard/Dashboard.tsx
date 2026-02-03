import React from 'react';
import { useAnalysisStore, selectMarketData, selectRiskSignals, selectPortfolio } from '../../stores/analysis.store';
import { RSRSIndicator, VolatilitySkew } from '../../types/market';

// ============ 子组件：概览卡片 (纯展示) ============
interface OverviewCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: 'up' | 'down' | 'neutral' | 'warning' | 'safe';
  accentColor?: 'red' | 'green' | 'default';
}

const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, subtitle, trend, accentColor = 'default' }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <span className="text-app-success">📈</span>;
      case 'down': return <span className="text-app-danger">📉</span>;
      case 'warning': return <span className="text-app-warning">⚠️</span>;
      case 'safe': return <span className="text-app-success">✅</span>;
      default: return <span className="text-text-secondary">➡️</span>;
    }
  };

  const borderColor = accentColor === 'red' ? 'border-l-4 border-l-app-danger' :
                      accentColor === 'green' ? 'border-l-4 border-l-app-success' :
                      'border-app-border';

  return (
    <div className={`bg-app-tertiary p-4 rounded-lg border border-app-border ${accentColor !== 'default' ? borderColor : ''} shadow-sm hover:bg-app-secondary transition-colors`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</span>
        {getTrendIcon()}
      </div>
      <div className="text-2xl font-bold text-text-primary mb-1 font-mono">{value}</div>
      <div className="text-xs text-text-secondary">{subtitle}</div>
    </div>
  );
};

// ============ 子组件：指标卡片 (纯展示) ============
const IndicatorCard: React.FC<{ indicator: RSRSIndicator | VolatilitySkew; type: 'rsrs' | 'volatility' }> = ({ indicator, type }) => {
  const isRsrs = type === 'rsrs';
  const data = isRsrs ? (indicator as RSRSIndicator) : (indicator as VolatilitySkew);

  // 颜色逻辑
  let statusColor = 'text-app-warning';
  if (isRsrs) {
    if (data.signal === 'long') statusColor = 'text-app-success';
    if (data.signal === 'short') statusColor = 'text-app-danger';
  } else {
    if (data.signal === 'low') statusColor = 'text-app-success';
    if (data.signal === 'high') statusColor = 'text-app-danger';
  }

  const valueDisplay = isRsrs
    ? (data as RSRSIndicator).value.toFixed(3)
    : (data as VolatilitySkew).ratio.toFixed(2);

  return (
    <div className="bg-app-tertiary p-3 rounded border border-app-border flex justify-between items-center">
      <div className="flex flex-col">
        <span className="text-xs text-text-secondary font-mono">{data.ticker}</span>
        <span className={`text-sm font-bold ${statusColor}`}>{data.signal.toUpperCase()}</span>
      </div>
      <div className="text-lg font-mono text-text-primary">{valueDisplay}</div>
    </div>
  );
};

// ============ 主组件：Dashboard ============
export const Dashboard: React.FC = () => {
  // 优化：使用 Selector 细粒度订阅，避免无关更新导致的重渲染
  const marketData = useAnalysisStore(selectMarketData);
  const riskSignals = useAnalysisStore(selectRiskSignals);
  const portfolio = useAnalysisStore(selectPortfolio);

  // RSRS 指标目前没有单独的 Selector，直接获取
  const rsrsIndicators = useAnalysisStore(state => state.rsrsIndicators);
  const volatilitySkews = useAnalysisStore(state => state.volatilitySkews);

  // 计算逻辑
  const marketList = Object.values(marketData);
  const totalMarketValue = marketList.reduce((sum, m) => sum + m.price * m.volume, 0);
  const avgChange = marketList.reduce((sum, m) => sum + m.changePercent, 0) / (marketList.length || 1);
  const highRiskCount = riskSignals.filter(s => s.level === 'high').length;

  return (
    <div className="p-6 h-full overflow-y-auto bg-app-primary text-text-primary font-sans">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-app-secondary p-4 rounded-lg border border-app-border shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <h2 className="text-xl font-bold text-text-primary">市场全景概览</h2>
            <p className="text-xs text-text-secondary">System Status: Online | Real-time Data</p>
          </div>
        </div>
        <div className="font-mono text-xs text-accent bg-app-tertiary px-3 py-1 rounded border border-accent/20">
          {new Date().toLocaleString('zh-CN')}
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <OverviewCard
          title="市场总成交额 (Est.)"
          value={totalMarketValue.toLocaleString('zh-CN', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          subtitle={`覆盖 ${marketList.length} 个活跃标的`}
          trend={avgChange > 0 ? 'up' : avgChange < 0 ? 'down' : 'neutral'}
        />
        <OverviewCard
          title="高风险警报"
          value={highRiskCount.toString()}
          subtitle="基于波动率偏度与RSRS背离"
          trend={highRiskCount > 0 ? 'warning' : 'safe'}
          accentColor={highRiskCount > 0 ? 'red' : 'green'}
        />
        <OverviewCard
          title="模拟持仓净值"
          value={portfolio?.totalValue.toLocaleString('zh-CN', { style: 'currency', currency: 'USD' }) || '--'}
          subtitle={`日收益: ${portfolio ? (portfolio.dailyChangePercent >= 0 ? '+' : '') + portfolio.dailyChangePercent.toFixed(2) + '%' : 'N/A'}`}
          trend={portfolio && portfolio.dailyChangePercent >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Indicators & Risks */}
        <div className="lg:col-span-2 space-y-6">

          {/* Technical Indicators Panel */}
          <div className="bg-app-secondary p-4 rounded-lg border border-app-border">
            <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
              <span className="text-accent">📈</span> 关键技术指标监控
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.values(rsrsIndicators).slice(0, 8).map((rsrs) => (
                <IndicatorCard key={rsrs.ticker} indicator={rsrs} type="rsrs" />
              ))}
              {Object.values(volatilitySkews).slice(0, 8).map((skew) => (
                <IndicatorCard key={skew.ticker} indicator={skew} type="volatility" />
              ))}
            </div>
            {Object.keys(rsrsIndicators).length === 0 && (
              <div className="text-center py-8 text-text-secondary text-sm">暂无指标数据，请启动市场扫描</div>
            )}
          </div>

          {/* Market Data Table (Simple View) */}
          <div className="bg-app-secondary rounded-lg border border-app-border overflow-hidden">
            <div className="p-4 border-b border-app-border flex justify-between items-center">
              <h3 className="text-sm font-bold text-text-primary">活跃异动列表</h3>
              <button className="text-xs text-accent hover:text-white transition-colors">查看全部 →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-app-tertiary">
                  <tr>
                    <th className="px-4 py-3">代码</th>
                    <th className="px-4 py-3">名称</th>
                    <th className="px-4 py-3 text-right">价格</th>
                    <th className="px-4 py-3 text-right">涨跌幅</th>
                    <th className="px-4 py-3 text-right">成交量</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {marketList.slice(0, 10).map((market) => (
                    <tr key={market.ticker} className="hover:bg-app-tertiary/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-accent">{market.ticker}</td>
                      <td className="px-4 py-3 text-text-primary">{market.name}</td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">{market.price.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-medium ${market.change >= 0 ? 'text-app-success' : 'text-app-danger'}`}>
                        {market.change >= 0 ? '+' : ''}{market.changePercent.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary font-mono">{(market.volume / 1000000).toFixed(2)}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Risk Alerts */}
        <div className="lg:col-span-1">
          <div className="bg-app-secondary p-4 rounded-lg border border-app-border h-full">
            <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
              <span className="text-app-warning">⚠️</span> 实时风控日志
            </h3>

            <div className="space-y-3">
              {riskSignals.length > 0 ? (
                riskSignals.map((signal, idx) => (
                  <div key={idx} className={`p-3 rounded border-l-4 ${
                    signal.level === 'high' ? 'bg-app-danger/10 border-l-app-danger' :
                    signal.level === 'medium' ? 'bg-app-warning/10 border-l-app-warning' :
                    'bg-app-success/10 border-l-app-success'
                  }`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        signal.level === 'high' ? 'bg-app-danger text-white' :
                        signal.level === 'medium' ? 'bg-app-warning text-black' :
                        'bg-app-success text-black'
                      }`}>
                        {signal.level.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-text-secondary">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-text-primary font-medium mt-2">{signal.message}</p>
                    <p className="text-[10px] text-text-secondary mt-1 border-t border-app-border/30 pt-1">
                      建议: {signal.recommendation}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-text-secondary">
                  <span className="text-2xl mb-2">🛡️</span>
                  <span className="text-xs">系统运行正常，无风险信号</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
