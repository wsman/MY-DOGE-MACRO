// ChartPanel - 完整图表面板 (K线 + 技术指标 + 子图)
// Created: 2026-02-05 (v1.8.0)

import React, { useState, useRef, useEffect, memo } from 'react';
import { Card, CardContent } from '../atoms/Card';
import PriceChart from './PriceChart';
import { TechnicalIndicators, IndicatorConfig, OHLCData } from './TechnicalIndicators';
import { SubChart, SubChartType } from './SubChart';
import './ChartPanel.css';

export interface ChartPanelProps {
  ticker: string;
  data: OHLCData[];
  title?: string;
  showVolume?: boolean;
  showMACD?: boolean;
  showRSI?: boolean;
  showKDJ?: boolean;
  indicators?: IndicatorConfig[];
  height?: number;
}

export const ChartPanel: React.FC<ChartPanelProps> = memo(({
  ticker,
  data,
  title,
  showVolume = true,
  showMACD = false,
  showRSI = false,
  showKDJ = false,
  indicators = [
    { type: 'ma', period: 5, color: '#ffa726' },
    { type: 'ma', period: 10, color: '#42a5f5' },
    { type: 'ma', period: 20, color: '#66bb6a' },
  ],
  height = 400,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.getBoundingClientRect().width);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate heights
  const subChartCount = [showVolume, showMACD, showRSI, showKDJ].filter(Boolean).length;
  const mainChartHeight = height - subChartCount * 100 - 20;
  const subChartHeight = 80;

  const enabledSubCharts: SubChartType[] = [];
  if (showVolume) enabledSubCharts.push('volume');
  if (showMACD) enabledSubCharts.push('macd');
  if (showRSI) enabledSubCharts.push('rsi');
  if (showKDJ) enabledSubCharts.push('kdj');

  return (
    <Card className="chart-panel" ref={containerRef}>
      <CardContent padding="sm" className="chart-panel__content">
        {/* Main Price Chart */}
        <div className="chart-panel__main">
          <PriceChart
            ticker={ticker}
            data={data}
            title={title}
            width={width - 32}
            height={mainChartHeight}
            showVolume={false}
          />
          
          {/* Overlay Technical Indicators (MA lines on price chart) */}
          {indicators.length > 0 && (
            <div className="chart-panel__overlay">
              <TechnicalIndicators
                data={data}
                indicators={indicators}
                width={width - 32}
                height={mainChartHeight}
              />
            </div>
          )}
        </div>

        {/* Sub Charts */}
        <div className="chart-panel__subcharts">
          {enabledSubCharts.map((type) => (
            <SubChart
              key={type}
              type={type}
              data={data}
              width={width - 32}
              height={subChartHeight}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

export default ChartPanel;
