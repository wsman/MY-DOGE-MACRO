// AIReportPanel - AI 研报展示 Organism
// Created: 2026-02-05 (v1.8.0)

import React, { useState } from 'react';
import { Card, CardTitle, CardContent } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { MarkdownRenderer } from '../atoms/MarkdownRenderer';
import './AIReportPanel.css';

export interface AIReport {
  id: string;
  title: string;
  summary: string;
  content: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  tickers: string[];
  generatedAt: Date;
  model: string;
}

interface AIReportPanelProps {
  report?: AIReport;
  onGenerate?: () => void;
  isLoading?: boolean;
  error?: string;
}

export const AIReportPanel: React.FC<AIReportPanelProps> = ({
  report,
  onGenerate,
  isLoading = false,
  error,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSentimentVariant = (sentiment: string) => {
    if (sentiment === 'bullish') return 'success';
    if (sentiment === 'bearish') return 'danger';
    return 'warning';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="ai-report-panel">
      <CardTitle className="ai-report-panel__header">
        <div className="ai-report-panel__title">
          <span>AI 研报分析</span>
          {report && (
            <Badge variant={getSentimentVariant(report.sentiment)} size="sm">
              {report.sentiment === 'bullish' ? '看涨' : report.sentiment === 'bearish' ? '看跌' : '中性'}
            </Badge>
          )}
        </div>
        <div className="ai-report-panel__actions">
          {onGenerate && (
            <Button
              variant="primary"
              size="sm"
              onClick={onGenerate}
              disabled={isLoading}
            >
              {isLoading ? '生成中...' : '生成研报'}
            </Button>
          )}
        </div>
      </CardTitle>

      <CardContent className="ai-report-panel__content">
        {error && (
          <div className="ai-report-panel__error">
            <span>❌ {error}</span>
          </div>
        )}

        {isLoading && (
          <div className="ai-report-panel__loading">
            <div className="ai-report-panel__spinner"></div>
            <span>AI 正在分析市场数据...</span>
          </div>
        )}

        {!isLoading && !report && !error && (
          <div className="ai-report-panel__empty">
            <p>点击"生成研报"按钮，AI 将基于当前市场数据生成分析报告</p>
          </div>
        )}

        {report && !isLoading && (
          <div className="ai-report-panel__report">
            <div className="ai-report-panel__report-header">
              <h3 className="ai-report-panel__report-title">{report.title}</h3>
              <div className="ai-report-panel__report-meta">
                <span className="ai-report-panel__report-time">
                  {formatDate(report.generatedAt)}
                </span>
                <span className="ai-report-panel__report-model">
                  Model: {report.model}
                </span>
                <span className="ai-report-panel__report-confidence">
                  置信度: {(report.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="ai-report-panel__report-tickers">
              {report.tickers.map((ticker) => (
                <Badge key={ticker} variant="info" size="sm">
                  {ticker}
                </Badge>
              ))}
            </div>

            <div className="ai-report-panel__report-summary">
              <strong>摘要：</strong>
              <p>{report.summary}</p>
            </div>

            {isExpanded && (
              <div className="ai-report-panel__report-content">
                <strong>详细分析：</strong>
                <MarkdownRenderer content={report.content} />
              </div>
            )}

            <div className="ai-report-panel__expand-btn">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? '收起详情' : '展开详情'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIReportPanel;
