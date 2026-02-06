// ReportCard Molecule - Composed of: Card + Badge + Button
// For displaying research report summaries
// Last Updated: 2026-02-06

import React from 'react';
import { Card, CardContent } from '../../atoms/Card';
import { Badge } from '../../atoms/Badge';
import { Button } from '../../atoms/Button';

export interface ReportSummary {
  id: string;
  ticker: string;
  title: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  model: string;
  created_at: string;
  file_path?: string;
}

export interface ReportCardProps {
  /** Report data */
  report: ReportSummary;
  /** View handler */
  onView: () => void;
  /** Delete handler (optional) */
  onDelete?: () => void;
  /** Export handler (optional) */
  onExport?: () => void;
  /** Highlighted state */
  highlighted?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onView,
  onDelete,
  onExport,
  highlighted = false,
}) => {
  const sentimentConfig = {
    bullish: { label: '看涨', variant: 'success' as const, icon: '📈' },
    bearish: { label: '看跌', variant: 'danger' as const, icon: '📉' },
    neutral: { label: '中性', variant: 'warning' as const, icon: '📊' }
  };

  const config = sentimentConfig[report.sentiment] || sentimentConfig.neutral;
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  const confidencePercent = Math.round((report.confidence || 0) * 100);

  return (
    <Card 
      onClick={onView} 
      hoverable={true} 
      elevation={highlighted ? 'medium' : 'low'}
      className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <span className="font-bold text-gray-900 dark:text-white">{report.ticker}</span>
            <Badge variant={config.variant} size="sm">
              {config.label}
            </Badge>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(report.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {report.title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
          {report.summary?.slice(0, 120)}
          {report.summary?.length > 120 ? '...' : ''}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              置信度: <span className="font-bold">{confidencePercent}%</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              模型: <span className="font-medium">{report.model}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="primary" size="sm" onClick={onView}>
            查看
          </Button>
          {onExport && (
            <Button variant="secondary" size="sm" onClick={onExport}>
              导出
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete}>
              删除
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Grid container for ReportCards
export const ReportCardGrid: React.FC<{
  reports: ReportSummary[];
  onView: (reportId: string) => void;
  onDelete?: (reportId: string) => void;
  onExport?: (reportId: string) => void;
  columns?: 2 | 3 | 4;
}> = ({ reports, onView, onDelete, onExport, columns = 3 }) => {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid gap-4 ${gridClasses[columns]}`}>
      {reports.map(report => (
        <ReportCard
          key={report.id}
          report={report}
          onView={() => onView(report.id)}
          onDelete={onDelete ? () => onDelete(report.id) : undefined}
          onExport={onExport ? () => onExport(report.id) : undefined}
        />
      ))}
    </div>
  );
};

export default ReportCard;