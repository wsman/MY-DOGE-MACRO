// AnalysisPanel - 资产分析面板 Organism
// Created: 2026-02-05 (v1.8.0)

import React, { useState } from 'react';
import { Card, CardTitle, CardContent } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { ChartPanel, OHLCData } from '../charts';
import './AnalysisPanel.css';

interface AnalysisPanelProps {
  ticker: string;
  name?: string;
  data: OHLCData[];
  rsrsValue?: number;
  rsrsSignal?: 'long' | 'short' | 'neutral';
  volatilityValue?: number;
  volatilitySignal?: 'low' | 'medium' | 'high';
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  ticker,
  name,
  data,
  rsrsValue,
  rsrsSignal = 'neutral',
  volatilityValue,
  volatilitySignal = 'medium',
  onRefresh,
  isLoading = false,
}) => {
  const [showMACD, setShowMACD] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showKDJ, setShowKDJ] = useState(false);

  const getSignalVariant = (signal: string) => {
    if (signal === 'long' || signal === 'low') return 'success';
    if (signal === 'short' || signal === 'high') return 'danger';
    return 'warning';
  };

  const latestPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const prevPrice = data.length > 1 ? data[data.length - 2].close : latestPrice;
  const priceChange = latestPrice - prevPrice;
  const priceChangePercent = prevPrice ? (priceChange / prevPrice) * 100 : 0;

  return (
    <Card className="analysis-panel">
      <CardTitle className="analysis-panel__header">
        <div className="analysis-panel__title-group">
          <span className="analysis-panel__ticker">{ticker}</span>
          {name && <span className="analysis-panel__name">{name}</span>}
        </div>
        <div className="analysis-panel__actions">
          <Button
            variant={showMACD ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowMACD(!showMACD)}
          >
            MACD
          </Button>
          <Button
            variant={showRSI ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowRSI(!showRSI)}
          >
            RSI
          </Button>
          <Button
            variant={showKDJ ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowKDJ(!showKDJ)}
          >
            KDJ
          </Button>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
              {isLoading ? '加载中...' : '刷新'}
            </Button>
          )}
        </div>
      </CardTitle>

      <CardContent className="analysis-panel__content">
        {/* Price Summary */}
        <div className="analysis-panel__summary">
          <div className="analysis-panel__price">
            <span className="analysis-panel__price-value">${latestPrice.toFixed(2)}</span>
            <span className={`analysis-panel__price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </span>
          </div>

          <div className="analysis-panel__indicators">
            {rsrsValue !== undefined && (
              <div className="analysis-panel__indicator">
                <span className="analysis-panel__indicator-label">RSRS</span>
                <span className="analysis-panel__indicator-value">{rsrsValue.toFixed(4)}</span>
                <Badge variant={getSignalVariant(rsrsSignal)} size="sm">
                  {rsrsSignal.toUpperCase()}
                </Badge>
              </div>
            )}
            {volatilityValue !== undefined && (
              <div className="analysis-panel__indicator">
                <span className="analysis-panel__indicator-label">波动率</span>
                <span className="analysis-panel__indicator-value">{(volatilityValue * 100).toFixed(2)}%</span>
                <Badge variant={getSignalVariant(volatilitySignal)} size="sm">
                  {volatilitySignal.toUpperCase()}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        {data.length > 0 ? (
          <ChartPanel
            ticker={ticker}
            data={data}
            showVolume={true}
            showMACD={showMACD}
            showRSI={showRSI}
            showKDJ={showKDJ}
            height={500}
          />
        ) : (
          <div className="analysis-panel__empty">
            暂无数据
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalysisPanel;
