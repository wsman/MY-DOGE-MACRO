// MultiAssetPanel - 多资产联动面板 (T-05c)
// Created: 2026-02-06
// 功能：展示多资产相关性分析、热力图和异动检测的综合面板

import React, { useState, useEffect } from 'react';
import { Card, CardTitle, CardContent } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { correlationApi } from '../../services/api';
import { CorrelationHeatmap, CorrelationMatrix, HeatmapDataItem } from './CorrelationHeatmap';
import './MultiAssetPanel.css';

// 资产配置接口
export interface AssetConfig {
  ticker: string;
  name: string;
  color: string;
  weight?: number;
}

// 相关性异动接口
export interface CorrelationDivergence {
  ticker1: string;
  ticker2: string;
  current_corr: number;
  historical_mean: number;
  historical_std: number;
  z_score: number;
  divergence_score: number;
  change_direction: 'increased' | 'decreased';
  significance: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
}

// 资产聚类接口
export interface AssetCluster {
  id: number;
  assets: string[];
  avg_correlation: number;
  description?: string;
}

// 多资产面板Props
export interface MultiAssetPanelProps {
  /** 标题 */
  title?: string;
  /** 默认资产列表 */
  defaultAssets?: AssetConfig[];
  /** 默认计算周期（天） */
  defaultPeriod?: number;
  /** 是否显示热力图 */
  showHeatmap?: boolean;
  /** 是否显示异动检测 */
  showDivergences?: boolean;
  /** 是否显示资产聚类 */
  showClusters?: boolean;
  /** 是否显示市场状态 */
  showMarketRegime?: boolean;
  /** 自动刷新间隔（秒） */
  autoRefresh?: number;
}

// 默认资产配置
const DEFAULT_ASSETS: AssetConfig[] = [
  { ticker: 'QQQ', name: '纳斯达克100指数', color: '#3b82f6' },
  { ticker: 'GLD', name: 'SPDR黄金ETF', color: '#fbbf24' },
  { ticker: 'BTC-USD', name: '比特币', color: '#8b5cf6' },
  { ticker: '000300.SS', name: '沪深300指数', color: '#ef4444' },
  { ticker: 'TLT', name: '20年期国债ETF', color: '#22c55e' },
  { ticker: 'DXY', name: '美元指数', color: '#6366f1' },
];

export const MultiAssetPanel: React.FC<MultiAssetPanelProps> = ({
  title = '多资产联动分析',
  defaultAssets = DEFAULT_ASSETS,
  defaultPeriod = 30,
  showHeatmap = true,
  showDivergences = true,
  showClusters = true,
  showMarketRegime = true,
  autoRefresh = 300, // 5分钟
}) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<string>('heatmap');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 数据状态
  const [correlationData, setCorrelationData] = useState<CorrelationMatrix | null>(null);
  const [divergences, setDivergences] = useState<CorrelationDivergence[]>([]);
  const [clusters, setClusters] = useState<AssetCluster[]>([]);
  const [marketRegime, setMarketRegime] = useState<any>(null);
  
  // 配置状态
  const [selectedAssets, setSelectedAssets] = useState<AssetConfig[]>(defaultAssets);
  const [period, setPeriod] = useState<number>(defaultPeriod);
  const [divergenceThreshold, setDivergenceThreshold] = useState<number>(2.0);
  const [clusterThreshold, setClusterThreshold] = useState<number>(0.7);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  // 加载相关性数据
  const loadCorrelationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tickers = selectedAssets.map(asset => asset.ticker);
      const result = await correlationApi.getCorrelationMatrix(period, tickers);
      
      if (result?.correlation) {
        setCorrelationData(result.correlation);
        
        if (showMarketRegime && result.regime_analysis) {
          setMarketRegime(result.regime_analysis);
        }
        
        setLastUpdated(new Date().toISOString());
      } else {
        throw new Error('无法获取相关性数据');
      }
    } catch (err: any) {
      console.error('加载相关性数据失败:', err);
      setError(err.message || '加载相关性数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载异动检测数据
  const loadDivergences = async () => {
    if (!showDivergences) return;
    
    try {
      const result = await correlationApi.getDivergences(period, divergenceThreshold);
      if (result?.divergences) {
        setDivergences(result.divergences);
      }
    } catch (err) {
      console.error('加载异动数据失败:', err);
    }
  };

  // 加载资产聚类数据
  const loadClusters = async () => {
    if (!showClusters) return;
    
    try {
      const result = await correlationApi.getAssetClusters(period, clusterThreshold);
      if (result?.clusters) {
        const formattedClusters: AssetCluster[] = result.clusters.map((cluster: string[], index: number) => ({
          id: index + 1,
          assets: cluster,
          avg_correlation: 0.8, // 这里应该从API获取实际的平均相关性
          description: `相关性强的一组资产 (${cluster.length}个)`
        }));
        setClusters(formattedClusters);
      }
    } catch (err) {
      console.error('加载资产聚类数据失败:', err);
    }
  };

  // 初始加载
  useEffect(() => {
    loadCorrelationData();
    loadDivergences();
    loadClusters();
  }, [period, JSON.stringify(selectedAssets), divergenceThreshold, clusterThreshold]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadCorrelationData();
      loadDivergences();
      loadClusters();
    }, autoRefresh * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // 处理资产选择
  const toggleAssetSelection = (ticker: string) => {
    setSelectedAssets(prev => {
      const isSelected = prev.some(asset => asset.ticker === ticker);
      if (isSelected) {
        return prev.filter(asset => asset.ticker !== ticker);
      } else {
        const asset = defaultAssets.find(a => a.ticker === ticker);
        return asset ? [...prev, asset] : prev;
      }
    });
  };

  // 处理单元格点击
  const handleCellClick = (item: HeatmapDataItem) => {
    console.log('点击相关性单元格:', item);
    // 可以在这里实现详细查看功能
  };

  // 渲染资产选择器
  const renderAssetSelector = () => (
    <div className="multi-asset-panel-assets">
      <h4 className="multi-asset-panel-assets-title">资产选择</h4>
      <div className="multi-asset-panel-assets-grid">
        {defaultAssets.map(asset => {
          const isSelected = selectedAssets.some(a => a.ticker === asset.ticker);
          return (
            <Button
              key={asset.ticker}
              variant={isSelected ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => toggleAssetSelection(asset.ticker)}
              style={{ '--button-color': asset.color } as any}
            >
              {asset.ticker}
              <span className="multi-asset-panel-asset-name">{asset.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );

  // 渲染控制面板
  const renderControls = () => (
    <div className="multi-asset-panel-controls">
      <div className="multi-asset-panel-controls-group">
        <label className="multi-asset-panel-controls-label">计算周期</label>
        <div className="multi-asset-panel-controls-buttons">
          {[7, 30, 90, 180].map(days => (
            <Button
              key={days}
              variant={period === days ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(days)}
            >
              {days}天
            </Button>
          ))}
        </div>
      </div>
      
      {showDivergences && (
        <div className="multi-asset-panel-controls-group">
          <label className="multi-asset-panel-controls-label">异动阈值 (Z-score)</label>
          <div className="multi-asset-panel-controls-slider">
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.5"
              value={divergenceThreshold}
              onChange={(e) => setDivergenceThreshold(parseFloat(e.target.value))}
              className="multi-asset-panel-controls-slider-input"
            />
            <span className="multi-asset-panel-controls-slider-value">{divergenceThreshold.toFixed(1)}</span>
          </div>
        </div>
      )}
      
      {showClusters && (
        <div className="multi-asset-panel-controls-group">
          <label className="multi-asset-panel-controls-label">聚类阈值 (相关性)</label>
          <div className="multi-asset-panel-controls-slider">
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              value={clusterThreshold}
              onChange={(e) => setClusterThreshold(parseFloat(e.target.value))}
              className="multi-asset-panel-controls-slider-input"
            />
            <span className="multi-asset-panel-controls-slider-value">{clusterThreshold.toFixed(1)}</span>
          </div>
        </div>
      )}
      
      <div className="multi-asset-panel-controls-group">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            loadCorrelationData();
            loadDivergences();
            loadClusters();
          }}
        >
          刷新数据
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedAssets(defaultAssets);
            setPeriod(defaultPeriod);
          }}
        >
          重置配置
        </Button>
      </div>
    </div>
  );

  // 渲染异动检测面板
  const renderDivergencesPanel = () => {
    if (!showDivergences || divergences.length === 0) {
      return (
        <div className="multi-asset-panel-divergences-empty">
          <p>未检测到显著相关性异动</p>
          <span className="multi-asset-panel-divergences-empty-note">
            当相关性变化超过 {divergenceThreshold} 倍标准差时会显示
          </span>
        </div>
      );
    }

    const criticalDivergences = divergences.filter(d => d.significance === 'critical');
    const highDivergences = divergences.filter(d => d.significance === 'high');
    const otherDivergences = divergences.filter(d => d.significance === 'medium' || d.significance === 'low');

    return (
      <div className="multi-asset-panel-divergences">
        {criticalDivergences.length > 0 && (
          <div className="multi-asset-panel-divergences-section">
            <h5 className="multi-asset-panel-divergences-section-title">
              ⚠️ 关键异动 ({criticalDivergences.length})
            </h5>
            {criticalDivergences.map((div, index) => (
              <div key={index} className="multi-asset-panel-divergence critical">
                <div className="multi-asset-panel-divergence-header">
                  <span className="multi-asset-panel-divergence-pair">
                    {div.ticker1} ↔ {div.ticker2}
                  </span>
                  <Badge variant="danger">Z-score: {div.z_score.toFixed(2)}</Badge>
                </div>
                <div className="multi-asset-panel-divergence-body">
                  <span className="multi-asset-panel-divergence-info">
                    当前相关性: {div.current_corr.toFixed(3)}
                  </span>
                  <span className="multi-asset-panel-divergence-info">
                    历史均值: {div.historical_mean.toFixed(3)}
                  </span>
                  <span className="multi-asset-panel-divergence-info">
                    变化方向: {div.change_direction === 'increased' ? '增加' : '减少'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {highDivergences.length > 0 && (
          <div className="multi-asset-panel-divergences-section">
            <h5 className="multi-asset-panel-divergences-section-title">
              🔥 高异动 ({highDivergences.length})
            </h5>
            {highDivergences.map((div, index) => (
              <div key={index} className="multi-asset-panel-divergence high">
                <div className="multi-asset-panel-divergence-header">
                  <span className="multi-asset-panel-divergence-pair">
                    {div.ticker1} ↔ {div.ticker2}
                  </span>
                  <Badge variant="warning">Z-score: {div.z_score.toFixed(2)}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {otherDivergences.length > 0 && (
          <div className="multi-asset-panel-divergences-section">
            <h5 className="multi-asset-panel-divergences-section-title">
              📊 其他异动 ({otherDivergences.length})
            </h5>
            <div className="multi-asset-panel-divergences-grid">
              {otherDivergences.slice(0, 10).map((div, index) => (
                <div key={index} className="multi-asset-panel-divergence-item">
                  <span className="multi-asset-panel-divergence-item-pair">
                    {div.ticker1}-{div.ticker2}
                  </span>
                  <Badge variant={div.significance === 'medium' ? 'info' : 'secondary'}>
                    {div.significance === 'medium' ? '中等' : '低'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染资产聚类面板
  const renderClustersPanel = () => {
    if (!showClusters || clusters.length === 0) {
      return (
        <div className="multi-asset-panel-clusters-empty">
          <p>未检测到显著资产聚类</p>
          <span className="multi-asset-panel-clusters-empty-note">
            当资产间相关性高于 {clusterThreshold} 时会聚类显示
          </span>
        </div>
      );
    }

    return (
      <div className="multi-asset-panel-clusters">
        <div className="multi-asset-panel-clusters-summary">
          <h5 className="multi-asset-panel-clusters-summary-title">
            检测到 {clusters.length} 个资产组合
          </h5>
          <p className="multi-asset-panel-clusters-summary-note">
            以下资产组合内部相关性较高，可考虑进行组合投资或对冲
          </p>
        </div>
        
        <div className="multi-asset-panel-clusters-grid">
          {clusters.map(cluster => (
            <div key={cluster.id} className="multi-asset-panel-cluster">
              <div className="multi-asset-panel-cluster-header">
                <h6 className="multi-asset-panel-cluster-title">资产组合 #{cluster.id}</h6>
                <Badge variant="success">{cluster.assets.length} 个资产</Badge>
              </div>
              <div className="multi-asset-panel-cluster-body">
                <div className="multi-asset-panel-cluster-assets">
                  {cluster.assets.map((asset, idx) => {
                    const assetConfig = selectedAssets.find(a => a.ticker === asset);
                    return (
                      <span
                        key={idx}
                        className="multi-asset-panel-cluster-asset"
                        style={{ '--asset-color': assetConfig?.color || '#666' } as any}
                      >
                        {asset}
                      </span>
                    );
                  })}
                </div>
                {cluster.description && (
                  <p className="multi-asset-panel-cluster-description">{cluster.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染市场状态面板
  const renderMarketRegimePanel = () => {
    if (!showMarketRegime || !marketRegime) {
      return (
        <div className="multi-asset-panel-regime-empty">
          <p>市场状态分析数据加载中...</p>
        </div>
      );
    }

    const { regime, description, avg_correlation, regime_score, assessment } = marketRegime;

    return (
      <div className="multi-asset-panel-regime">
        <div className="multi-asset-panel-regime-header">
          <h5 className="multi-asset-panel-regime-title">当前市场状态</h5>
          <Badge variant={assessment.color as any}>{regime}</Badge>
        </div>
        
        <div className="multi-asset-panel-regime-body">
          <p className="multi-asset-panel-regime-description">{description}</p>
          
          <div className="multi-asset-panel-regime-stats">
            <div className="multi-asset-panel-regime-stat">
              <span className="multi-asset-panel-regime-stat-label">平均相关性</span>
              <span className="multi-asset-panel-regime-stat-value">
                {avg_correlation.toFixed(3)}
              </span>
            </div>
            <div className="multi-asset-panel-regime-stat">
              <span className="multi-asset-panel-regime-stat-label">市场状态指数</span>
              <span className="multi-asset-panel-regime-stat-value">
                {regime_score.toFixed(3)}
              </span>
            </div>
          </div>
          
          <div className="multi-asset-panel-regime-assessment">
            <div className="multi-asset-panel-regime-assessment-item">
              <span className="multi-asset-panel-regime-assessment-label">风险评估:</span>
              <Badge variant={assessment.risk === 'high' ? 'danger' : assessment.risk === 'medium' ? 'warning' : 'success'}>
                {assessment.risk}
              </Badge>
            </div>
            <div className="multi-asset-panel-regime-assessment-item">
              <span className="multi-asset-panel-regime-assessment-label">分散化程度:</span>
              <span className="multi-asset-panel-regime-assessment-value">{assessment.diversification}</span>
            </div>
            <div className="multi-asset-panel-regime-assessment-item">
              <span className="multi-asset-panel-regime-assessment-label">投资建议:</span>
              <span className="multi-asset-panel-regime-assessment-value">{assessment.recommendation}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card elevation="low" padding="none" className="multi-asset-panel">
      <CardTitle className="multi-asset-panel-title">
        <span>{title}</span>
        <div className="multi-asset-panel-subtitle">
          <span>资产: {selectedAssets.length} 个</span>
          <span>周期: {period} 天</span>
          {lastUpdated && (
            <span className="multi-asset-panel-updated">
              更新: {new Date(lastUpdated).toLocaleTimeString('zh-CN')}
            </span>
          )}
        </div>
      </CardTitle>

      <CardContent className="multi-asset-panel-content">
        {/* 资产选择器 */}
        {renderAssetSelector()}
        
        {/* 控制面板 */}
        {renderControls()}
        
        {/* 主内容区域 */}
        <div className="multi-asset-panel-main">
          {/* 左侧：热力图 */}
          {showHeatmap && (
            <div className="multi-asset-panel-heatmap">
              <h4 className="multi-asset-panel-section-title">相关性热力图</h4>
              <CorrelationHeatmap
                data={correlationData || undefined}
                tickers={selectedAssets.map(a => a.ticker)}
                period={period}
                showMarketRegime={false}
                showControls={false}
                onCellClick={handleCellClick}
              />
            </div>
          )}
          
          {/* 右侧：多标签内容 */}
          <div className="multi-asset-panel-sidebar">
            {/* 自定义选项卡实现 */}
            <div className="multi-asset-panel-tabs">
              <div className="multi-asset-panel-tabs-list">
                {showDivergences && (
                  <button
                    className={`multi-asset-panel-tabs-trigger ${activeTab === 'divergences' ? 'active' : ''}`}
                    onClick={() => setActiveTab('divergences')}
                  >
                    异动检测
                  </button>
                )}
                {showClusters && (
                  <button
                    className={`multi-asset-panel-tabs-trigger ${activeTab === 'clusters' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clusters')}
                  >
                    资产聚类
                  </button>
                )}
                {showMarketRegime && (
                  <button
                    className={`multi-asset-panel-tabs-trigger ${activeTab === 'regime' ? 'active' : ''}`}
                    onClick={() => setActiveTab('regime')}
                  >
                    市场状态
                  </button>
                )}
              </div>
              
              <div className="multi-asset-panel-tabs-content">
                {showDivergences && activeTab === 'divergences' && (
                  <div className="multi-asset-panel-tabs-panel">
                    {renderDivergencesPanel()}
                  </div>
                )}
                
                {showClusters && activeTab === 'clusters' && (
                  <div className="multi-asset-panel-tabs-panel">
                    {renderClustersPanel()}
                  </div>
                )}
                
                {showMarketRegime && activeTab === 'regime' && (
                  <div className="multi-asset-panel-tabs-panel">
                    {renderMarketRegimePanel()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 状态提示 */}
        {error && (
          <div className="multi-asset-panel-error">
            <p className="multi-asset-panel-error-message">{error}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                loadCorrelationData();
                loadDivergences();
                loadClusters();
              }}
            >
              重试
            </Button>
          </div>
        )}
        
        {loading && (
          <div className="multi-asset-panel-loading">
            <p>正在加载多资产联动数据...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiAssetPanel;