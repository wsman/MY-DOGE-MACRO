// MarketOverview - 市场概览 Organism
// Created: 2026-02-05 (v1.8.0)

import React, { useMemo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { Card, CardTitle, CardContent } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { StatusDot } from '../atoms/StatusDot';
import { DataCard, DataCardGrid } from '../molecules/DataCard';
import './MarketOverview.css';

export interface MarketItem {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
}

interface MarketOverviewProps {
  markets: MarketItem[];
  title?: string;
  onSelectTicker?: (ticker: string) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  markets,
  title = '市场概览',
  onSelectTicker,
}) => {
  const summary = useMemo(() => {
    const risers = markets.filter(m => m.changePercent > 0).length;
    const fallers = markets.filter(m => m.changePercent < 0).length;
    const unchanged = markets.length - risers - fallers;
    const avgChange = markets.reduce((sum, m) => sum + m.changePercent, 0) / (markets.length || 1);
    
    return { risers, fallers, unchanged, avgChange };
  }, [markets]);

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  return (
    <Card className="market-overview">
      <CardTitle className="market-overview__title">
        <span>{title}</span>
        <div className="market-overview__summary">
          <Badge variant="success" size="sm">↑ {summary.risers}</Badge>
          <Badge variant="danger" size="sm">↓ {summary.fallers}</Badge>
          <Badge variant="secondary" size="sm">— {summary.unchanged}</Badge>
        </div>
      </CardTitle>
      
      <CardContent className="market-overview__content">
        <VirtuosoGrid
          data={markets}
          totalCount={markets.length}
          listClassName="market-overview__grid"
          itemContent={(index) => {
            const market = markets[index];
            return (
              <div
                key={market.ticker}
                className="market-overview__item"
                onClick={() => onSelectTicker?.(market.ticker)}
              >
                <div className="market-overview__item-header">
                  <span className="market-overview__ticker">{market.ticker}</span>
                  <StatusDot 
                    status={market.changePercent > 0 ? 'online' : market.changePercent < 0 ? 'error' : 'idle'}
                  />
                </div>
                <div className="market-overview__item-name">{market.name}</div>
                <div className="market-overview__item-price">
                  ${formatNumber(market.price)}
                </div>
                <div className={`market-overview__item-change ${market.changePercent >= 0 ? 'positive' : 'negative'}`}>
                  {market.changePercent >= 0 ? '+' : ''}{market.changePercent.toFixed(2)}%
                </div>
                <div className="market-overview__item-volume">
                  Vol: {formatNumber(market.volume, 0)}
                </div>
              </div>
            );
          }}
        />
      </CardContent>
    </Card>
  );
};

export default MarketOverview;
