// ReportDetailModal - 研报详情弹窗
// Last Updated: 2026-02-06

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../atoms/Card';
import { Button } from '../../atoms/Button';
import { Badge } from '../../atoms/Badge';
import { MarkdownRenderer } from '../../atoms/MarkdownRenderer';
import { exportService, ReportData } from '../../../services/export';
import { apiClient } from '../../../services/api';

interface ReportDetailModalProps {
  /** 研报 ID */
  reportId: string;
  /** 关闭回调 */
  onClose: () => void;
  /** 导出回调 (可选) */
  onExport?: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  reportId,
  onClose,
  onExport
}) => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await apiClient.get(`/api/v1/sync/reports/${reportId}`);
        setReport(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [reportId]);

  const handleExportMarkdown = async () => {
    if (!report) return;
    
    setExporting(true);
    try {
      exportService.exportMarkdown(report);
      onExport?.();
    } catch (err: any) {
      setError('导出失败: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!report) return;
    
    setExporting(true);
    try {
      await exportService.exportPDF(report);
      onExport?.();
    } catch (err: any) {
      setError('PDF导出失败: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 按键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const sentimentConfig = {
    bullish: { label: '看涨', variant: 'success' as const, icon: '📈' },
    bearish: { label: '看跌', variant: 'danger' as const, icon: '📉' },
    neutral: { label: '中性', variant: 'warning' as const, icon: '📊' }
  };

  const config = report ? sentimentConfig[report.sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral : null;

  if (loading) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="nordic-card p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
            <span className="text-[var(--text-secondary)]">加载研报详情...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="nordic-card p-6 max-w-md w-full">
          <div className="text-center">
            <div className="text-[var(--status-error)] text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">加载失败</h3>
            <p className="text-[var(--text-secondary)] mb-4">{error || '研报不存在'}</p>
            <div className="flex justify-center gap-2">
              <Button variant="primary" onClick={() => window.location.reload()}>
                重试
              </Button>
              <Button variant="ghost" onClick={onClose}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div 
        className="nordic-modal w-full max-w-4xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 md:p-6 border-b border-[var(--border-primary)]">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">
              {report.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{report.ticker}</Badge>
              {config && (
                <Badge variant={config.variant}>
                  <span className="mr-1">{config.icon}</span>
                  {config.label}
                </Badge>
              )}
              <span className="text-sm text-[var(--text-secondary)]">
                置信度: <span className="font-bold">{Math.round((report.confidence || 0) * 100)}%</span>
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                模型: <span className="font-medium">{report.model}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleExportMarkdown}
              disabled={exporting}
            >
              📄 {exporting ? '导出中...' : 'Markdown'}
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleExportPDF}
              disabled={exporting}
            >
              📑 {exporting ? '导出中...' : 'PDF'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="p-2"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
          {/* Summary */}
          {report.summary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">摘要</h3>
              <Card className="bg-[var(--bg-tertiary)]">
                <CardContent className="p-4">
                  <p className="text-[var(--text-secondary)] whitespace-pre-wrap">
                    {report.summary}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Full Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">详细分析</h3>
            <div className="prose prose-[var(--text-secondary)] dark:prose-invert max-w-none">
              <MarkdownRenderer content={report.content} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-[var(--border-primary)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div>
              <span>生成时间: {new Date(report.created_at).toLocaleString('zh-CN')}</span>
              {report.file_path && (
                <span className="ml-4">文件: {report.file_path}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};