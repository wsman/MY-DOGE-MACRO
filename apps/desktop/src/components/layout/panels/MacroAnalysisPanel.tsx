import React, { useState, useCallback } from 'react';
import { IDockviewPanelProps } from 'dockview';
import {
  TrendingUp,
  RefreshCw,
  FileText,
  Download,
  Settings,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Activity,
  DollarSign,
  Globe,
} from 'lucide-react';

interface MacroAssetData {
  ticker: string;
  name: string;
  price: number;
  trendMedium: number;
  momentumShort: number;
  rsrs: number;
  volatility: number;
}

interface MacroMetrics {
  riskOnSignal: boolean;
  techVolatility: number;
  assets: Record<string, any>;
  metadata_days: number;
  vol_skew?: number;
  ratio_z_score?: number;
  gold_btc_ratio?: number;
}

interface MacroReport {
  title: string;
  content: string;
  generated_at: string;
  model: string;
}

export const MacroAnalysisPanel: React.FC<IDockviewPanelProps> = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'metrics' | 'report' | 'assets'>(
    'dashboard'
  );
  const [macroData, setMacroData] = useState<MacroAssetData[]>([]);
  const [metrics, setMetrics] = useState<MacroMetrics | null>(null);
  const [reports, setReports] = useState<MacroReport[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // 模拟数据 - 在实际项目中替换为API调用
  const mockAssets: MacroAssetData[] = [
    {
      ticker: 'QQQ',
      name: '纳指ETF',
      price: 428.15,
      trendMedium: 12.3,
      momentumShort: 2.1,
      rsrs: 0.85,
      volatility: 18.2,
    },
    {
      ticker: 'GLD',
      name: '黄金ETF',
      price: 178.92,
      trendMedium: 5.6,
      momentumShort: -0.3,
      rsrs: 0.42,
      volatility: 12.7,
    },
    {
      ticker: 'BTC-USD',
      name: '比特币',
      price: 68500,
      trendMedium: 28.9,
      momentumShort: 8.7,
      rsrs: 0.91,
      volatility: 64.5,
    },
    {
      ticker: '000300.SS',
      name: '沪深300',
      price: 3542.18,
      trendMedium: 8.7,
      momentumShort: 1.4,
      rsrs: 0.63,
      volatility: 22.3,
    },
  ];

  const mockMetrics: MacroMetrics = {
    riskOnSignal: true,
    techVolatility: 18.2,
    metadata_days: 120,
    vol_skew: 1.3,
    ratio_z_score: 0.85,
    gold_btc_ratio: 0.0026,
    assets: {
      QQQ_trend_medium: 12.3,
      GLD_trend_medium: 5.6,
      'BTC-USD_trend_medium': 28.9,
      '000300.SS_trend_medium': 8.7,
    },
  };

  // API 基础地址
  const API_BASE = '/api/v1';

  const handleFetchMacroData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 调用 API 获取宏观数据
      const [metricsRes, assetsRes] = await Promise.all([
        fetch(`${API_BASE}/macro/market/data`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        }),
        fetch(`${API_BASE}/macro/assets`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        }),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }

      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setMacroData(data.data || []);
      }
    } catch (error) {
      console.error('获取宏观数据失败:', error);
      // Fallback to mock data
      setMacroData(mockAssets);
      setMetrics(mockMetrics);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGenerateReport = useCallback(async () => {
    setIsGeneratingReport(true);
    try {
      // 调用 API 生成宏观分析报告
      const res = await fetch(`${API_BASE}/macro/analysis/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const newReport: MacroReport = await res.json();
        setReports((prev) => [newReport, ...prev]);
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      // Fallback
      const newReport: MacroReport = {
        title: '深度宏观分析报告',
        content: '基于最新市场数据生成的专业分析...',
        generated_at: new Date().toISOString(),
        model: 'deepseek-chat',
      };
      setReports((prev) => [newReport, ...prev]);
    } finally {
      setIsGeneratingReport(false);
    }
  }, []);

  const handleFetchLatestReports = useCallback(async () => {
    try {
      // 调用 API 获取报告列表
      const res = await fetch(`${API_BASE}/industry/reports/latest`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });

      if (res.ok) {
        const data = await res.json();
        setReports(data.data || []);
      }
    } catch (error) {
      console.error('获取报告列表失败:', error);
    }
  }, []);

  // 计算RSRS趋势强度标签
  const getRSRSTag = (rsrs: number) => {
    if (rsrs > 0.8) {
      return { label: '极强趋势', color: 'text-[var(--status-success)]', bg: 'bg-[var(--status-success)]/20' };
    }
    if (rsrs > 0.5) {
      return { label: '中等趋势', color: 'text-[var(--status-success)]', bg: 'bg-[var(--status-success)]/20' };
    }
    if (rsrs < -0.8) {
      return { label: '极强下跌', color: 'text-[var(--status-error)]', bg: 'bg-[var(--status-error)]/20' };
    }
    if (rsrs < -0.5) {
      return { label: '中等下跌', color: 'text-[var(--status-error)]', bg: 'bg-[var(--status-error)]/20' };
    }
    return { label: '震荡趋势', color: 'text-[var(--status-warning)]', bg: 'bg-[var(--status-warning)]/20' };
  };

  // 计算VolSkew风险等级
  const getVolSkewLevel = (volSkew?: number) => {
    if (!volSkew) {
      return { level: '正常', color: 'text-[var(--text-secondary)]' };
    }
    if (volSkew < 0.8) {
      return { level: '极度平静', color: 'text-[var(--status-info)]' };
    }
    if (volSkew > 1.5) {
      return { level: '风险释放', color: 'text-[var(--status-warning)]' };
    }
    return { level: '正常波动', color: 'text-[var(--text-secondary)]' };
  };

  // 初始化加载数据
  React.useEffect(() => {
    handleFetchMacroData();
  }, [handleFetchMacroData]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-wide text-[var(--text-secondary)]">MACRO ANALYTICS</span>

          {/* 风险状态指示器 */}
          <div className="flex items-center gap-1 text-[10px]">
            <Activity
              size={10}
              className={metrics?.riskOnSignal ? 'text-[var(--status-success)]' : 'text-[var(--status-error)]'}
            />
            <span className={metrics?.riskOnSignal ? 'text-[var(--status-success)]' : 'text-[var(--status-error)]'}>
              {metrics?.riskOnSignal ? 'RISK-ON' : 'RISK-OFF'}
            </span>
          </div>
        </div>

        {/* 操作按钮组 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleFetchMacroData}
            disabled={isLoading}
            className="p-1.5 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)] rounded disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="p-1.5 text-[var(--status-success)] hover:text-white hover:bg-[var(--bg-tertiary)] rounded disabled:opacity-50"
            title="Generate Analysis Report"
          >
            <FileText size={14} className={isGeneratingReport ? 'animate-pulse' : ''} />
          </button>

          <button className="p-1.5 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)] rounded">
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="flex border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        {['dashboard', 'metrics', 'report', 'assets'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab as any)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              selectedTab === tab
                ? 'text-white border-b-2 border-[var(--accent-primary)] bg-[var(--bg-tertiary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedTab === 'dashboard' && (
          <div className="space-y-4">
            {/* 关键指标卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--text-secondary)]">趋势强度</span>
                  <TrendingUp size={14} className="text-[var(--status-success)]" />
                </div>
                <div className="text-lg font-bold text-white">
                  {metrics?.riskOnSignal ? '多头主导' : '空头主导'}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">基于RSRS指标</div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--text-secondary)]">波动率偏度</span>
                  <AlertTriangle size={14} className="text-[var(--status-warning)]" />
                </div>
                <div className="text-lg font-bold text-white">
                  {getVolSkewLevel(metrics?.vol_skew).level}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  VolSkew: {metrics?.vol_skew?.toFixed(2) || 'N/A'}
                </div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--text-secondary)]">金/币比值</span>
                  <DollarSign size={14} className="text-[var(--status-warning)]" />
                </div>
                <div className="text-lg font-bold text-white">
                  {(metrics?.gold_btc_ratio || 0).toFixed(4)}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  Z-Score: {(metrics?.ratio_z_score || 0).toFixed(2)}
                </div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--text-secondary)]">交易周期</span>
                  <Globe size={14} className="text-[var(--status-info)]" />
                </div>
                <div className="text-lg font-bold text-white">{metrics?.metadata_days || 0}天</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">数据覆盖周期</div>
              </div>
            </div>

            {/* 资产表现表格 */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">核心资产表现</h3>
                  <span className="text-xs text-[var(--text-secondary)]">基于RSRS趋势强度排序</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)]">
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
                        资产
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
                        价格
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
                        60日趋势
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
                        5日动量
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
                        RSRS强度
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">
                        波动率
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)]">
                    {macroData.map((asset) => {
                      const rsrsTag = getRSRSTag(asset.rsrs);
                      return (
                        <tr key={asset.ticker} className="hover:bg-[var(--bg-tertiary)]">
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{asset.ticker}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{asset.name}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-white">
                            {typeof asset.price === 'number' ? asset.price.toFixed(2) : asset.price}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              {asset.trendMedium > 0 ? (
                                <ChevronUp size={12} className="text-[var(--status-success)] mr-1" />
                              ) : (
                                <ChevronDown size={12} className="text-[var(--status-error)] mr-1" />
                              )}
                              <span
                                className={
                                  asset.trendMedium > 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-error)]'
                                }
                              >
                                {asset.trendMedium.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div
                              className={`font-medium ${asset.momentumShort >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-error)]'}`}
                            >
                              {asset.momentumShort >= 0 ? '+' : ''}
                              {asset.momentumShort.toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${rsrsTag.bg} ${rsrsTag.color}`}
                            >
                              {rsrsTag.label} ({asset.rsrs.toFixed(2)})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)]">
                            {asset.volatility.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 数据分析说明 */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded p-4">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">指标说明</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[var(--text-secondary)]">
                <div>
                  <span className="text-[var(--status-success)] font-medium">RSRS (趋势强度):</span>
                  <p className="mt-1">
                    范围 -1.0 到 1.0，绝对值越大趋势越强。RSRS {'>'} 0.8 表示极强上涨趋势，RSRS{' '}
                    {'<'} -0.8 表示极强下跌趋势。
                  </p>
                </div>
                <div>
                  <span className="text-[var(--status-warning)] font-medium">VolSkew (波动率偏度):</span>
                  <p className="mt-1">
                    短期波动率(5日)/长期波动率(20日)。{'<'}0.8 市场极度平静，{'>'}1.5 风险释放中。
                  </p>
                </div>
                <div>
                  <span className="text-[var(--status-info)] font-medium">金/币比值:</span>
                  <p className="mt-1">黄金价格/比特币价格，反映避险资产与风险资产的相对价值。</p>
                </div>
                <div>
                  <span className="text-[var(--status-info)] font-medium">Z-Score:</span>
                  <p className="mt-1">金/币比值相对于历史均值的标准差倍数，用于识别极端值。</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'metrics' && (
          <div className="space-y-4">
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 详细指标卡片 */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded p-4">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">宏观指标详情</h4>
                  <div className="space-y-2">
                    {Object.entries(metrics.assets || {}).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center py-1 border-b border-[var(--border-primary)]/50 last:border-0"
                      >
                        <span className="text-xs text-[var(--text-secondary)]">
                          {key.replace('_trend_medium', ' 趋势')}
                        </span>
                        <span
                          className={`text-sm font-medium ${Number(value) >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-error)]'}`}
                        >
                          {Number(value).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 风险指标卡片 */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded p-4">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">风险指标</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-secondary)]">市场状态</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${metrics.riskOnSignal ? 'bg-[var(--status-success)]/20 text-[var(--status-success)]' : 'bg-[var(--status-error)]/20 text-[var(--status-error)]'}`}
                      >
                        {metrics.riskOnSignal ? '风险偏好' : '风险规避'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-secondary)]">科技股波动率</span>
                      <span className="text-sm font-medium text-[var(--status-warning)]">
                        {metrics.techVolatility.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-secondary)]">波动率偏度</span>
                      <span className="text-sm font-medium text-[var(--status-warning)]">
                        {metrics.vol_skew?.toFixed(2) || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-secondary)]">数据周期</span>
                      <span className="text-sm font-medium text-[var(--status-info)]">
                        {metrics.metadata_days} 交易日
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'report' && (
          <div className="space-y-4">
            {/* 报告生成按钮 */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={14} />
                {isGeneratingReport ? '正在生成报告...' : '生成宏观分析报告'}
              </button>

              <button
                onClick={handleFetchLatestReports}
                className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)] rounded flex items-center gap-1"
              >
                <RefreshCw size={12} />
                刷新报告列表
              </button>
            </div>

            {/* 报告列表 */}
            <div className="space-y-3">
              {reports.length > 0 ? (
                reports.map((report, index) => (
                  <div key={index} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-semibold text-white">{report.title}</h4>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {new Date(report.generated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">{report.content}</p>
                    <div className="flex justify-between items-center text-xs text-[var(--text-secondary)]">
                      <span>模型: {report.model}</span>
                      <button className="text-[var(--status-info)] hover:text-[var(--status-info)]/80">
                        <Download size={12} className="inline mr-1" />
                        下载完整报告
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[var(--text-secondary)]">
                  <FileText size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">暂无分析报告</p>
                  <p className="text-xs mt-1">点击上方按钮生成宏观分析报告</p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'assets' && (
          <div className="space-y-4">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded p-4">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">资产配置说明</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded bg-[var(--status-success)]/20 flex items-center justify-center">
                      <TrendingUp size={16} className="text-[var(--status-success)]" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-white">科技股代理 (QQQ)</h5>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        代表纳斯达克指数表现，反映科技行业趋势和风险偏好。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded bg-[var(--status-warning)]/20 flex items-center justify-center">
                      <DollarSign size={16} className="text-[var(--status-warning)]" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-white">黄金代理 (GLD)</h5>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        传统避险资产，反映市场避险情绪和通胀预期。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded bg-[var(--status-info)]/20 flex items-center justify-center">
                      <Activity size={16} className="text-[var(--status-info)]" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-white">数字货币代理 (BTC-USD)</h5>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        新兴风险资产，反映市场投机情绪和流动性变化。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded bg-[var(--status-error)]/20 flex items-center justify-center">
                      <Globe size={16} className="text-[var(--status-error)]" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-white">A股代理 (000300.SS)</h5>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        沪深300指数，代表中国A股市场整体表现。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
                <h5 className="text-sm font-medium text-[var(--text-primary)] mb-2">配置原则</h5>
                <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                  <li className="flex items-start">
                    <span className="text-[var(--status-success)] mr-2">•</span>
                    <span>RSRS {'>'} 0.8 时，增加对应资产的配置权重</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[var(--status-warning)] mr-2">•</span>
                    <span>VolSkew {'<'} 0.8 时，警惕市场变盘风险</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[var(--status-info)] mr-2">•</span>
                    <span>Risk-On 信号时，增加风险资产暴露</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[var(--status-info)] mr-2">•</span>
                    <span>
                      Z-Score {'>'} 2 或 {'<'} -2 时，关注均值回归机会
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="px-4 py-2 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>数据更新: {new Date().toLocaleTimeString()}</span>
            <span>
              API状态: <span className="text-[var(--status-success)]">正常</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[var(--status-success)]"></div>
              <span>运行中</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
