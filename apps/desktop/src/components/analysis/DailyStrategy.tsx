import React, { useState, useEffect, useRef } from 'react';
import { invoke, Channel } from '@tauri-apps/api/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brain, Play, RotateCcw, ShieldAlert, TrendingUp, BarChart3, Cloud, Server } from 'lucide-react';
import { useAnalysisStore } from '../../stores/analysis.store';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import './DailyStrategy.css';

interface DailyStrategyProps {
  ticker?: string;
}

export const DailyStrategy: React.FC<DailyStrategyProps> = ({ ticker = 'BTCUSDT' }) => {
  const [strategy, setStrategy] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'local' | 'cloud'>('local');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { marketData, rsrsIndicators, volatilitySkews } = useAnalysisStore();

  const currentData = marketData[ticker];
  const currentRsrs = rsrsIndicators[ticker];
  const currentVolatility = volatilitySkews[ticker];

  useEffect(() => {
    if (scrollRef.current && isGenerating) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [strategy, isGenerating]);

  const handleGenerate = async () => {
    if (!currentData) {
      setError('未找到当前标的市场数据，请先刷新行情。');
      return;
    }

    setStrategy('');
    setIsGenerating(true);
    setError(null);

    try {
      // 1. 获取模板
      let template = '';
      try {
        template = await invoke('get_ai_template', { name: '1. Market Analysis Prompt' });
      } catch (e) {
        console.warn('Failed to load template from backend, using fallback.', e);
        template = `请分析以下市场数据并给出专业意见:

## 市场概况
{{market_data_json}}

## 技术指标

### RSRS (阻力支撑相对强度)
{{rsrs_data_json}}

### 波动率偏度
{{volatility_data_json}}

请提供:
1. 市场趋势判断
2. 关键风险提示
3. 投资建议`;
      }

      // 2. 注入上下文
      const prompt = template
        .replace('{{market_data_json}}', JSON.stringify(currentData, null, 2))
        .replace('{{rsrs_data_json}}', currentRsrs ? JSON.stringify(currentRsrs, null, 2) : '暂无数据')
        .replace('{{volatility_data_json}}', currentVolatility ? JSON.stringify(currentVolatility, null, 2) : '暂无数据');

      // 3. 调用 AI 生成
      const onEvent = new Channel<string>();
      onEvent.onmessage((msg) => {
        setStrategy((prev) => prev + msg);
      });

      await invoke('generate_strategy', { prompt, source, onEvent });
    } catch (err: any) {
      console.error('AI Strategy Error:', err);
      setError(err.toString() || '生成策略时出错，请检查 Ollama 服务。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setStrategy('');
    setError(null);
  };

  return (
    <div className="daily-strategy-container">
      <div className="strategy-header">
        <div className="header-left">
          <div className="icon-wrapper">
            <Brain className="ai-icon" />
          </div>
          <div className="title-group">
            <h3>AI 智能策略建议</h3>
            <p className="subtitle">基于 RSRS 与波动率偏度的深度量化分析</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="source-toggle">
            <Button
              variant={source === 'local' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSource('local')}
              disabled={isGenerating}
              className={`toggle-btn ${source === 'local' ? 'active' : ''}`}
            >
              <Server size={14} />
              <span>Local</span>
            </Button>
            <Button
              variant={source === 'cloud' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSource('cloud')}
              disabled={isGenerating}
              className={`toggle-btn ${source === 'cloud' ? 'active' : ''}`}
            >
              <Cloud size={14} />
              <span>Cloud</span>
            </Button>
          </div>
          <Badge variant={isGenerating ? 'warning' : 'success'}>
            {isGenerating ? '正在思考...' : 'AI 助手就绪'}
          </Badge>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="generate-btn"
          >
            {isGenerating ? <RotateCcw className="animate-spin" /> : <Play />}
            {isGenerating ? '停止生成' : '开始分析'}
          </Button>
          <Button variant="secondary" onClick={handleReset} disabled={isGenerating}>
            重置
          </Button>
        </div>
      </div>

      <div className="strategy-content-grid">
        <Card className="data-preview-card">
          <h4>分析上下文: {ticker}</h4>
          <div className="data-items">
            <div className="data-item">
              <BarChart3 size={16} />
              <span>当前价格: {currentData?.price || '--'}</span>
            </div>
            <div className="data-item">
              <TrendingUp size={16} />
              <span>RSRS Score: {currentRsrs?.z_score?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="data-item">
              <ShieldAlert size={16} />
              <span>波动率偏度: {currentVolatility?.skew_value?.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
        </Card>

        <Card className="strategy-output-card">
          <div className="output-scroll-area" ref={scrollRef}>
            {strategy ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                className="prose prose-sm dark:prose-invert max-w-none"
              >
                {strategy}
              </ReactMarkdown>
            ) : (
              <div className="empty-state">
                <Brain size={48} className="empty-icon" />
                <p>点击“开始分析”按钮，获取由深度学习模型生成的量化交易建议。</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
