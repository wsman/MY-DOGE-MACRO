# T-04d & T-04e: 研报导出与列表页 - 技术架构规划

**版本**: v1.0.0  
**创建日期**: 2026-02-06 13:05  
**规划者**: Clawd 🦞 (架构师)  
**关联任务**: T-1.9.0-04d, T-1.9.0-04e

---

## 📊 现状分析

### 已有组件

| 组件 | 状态 | 位置 | 说明 |
|------|------|------|------|
| `DataRepository` | ✅ | `apps/api/core/data_repository.py` | 研报 CRUD 完整 |
| `sync_routes` | ✅ | `apps/api/core/sync_routes.py` | API 端点完整 |
| `AIReportPanel` | ✅ | `organisms/AIReportPanel.tsx` | 研报展示组件 |
| `MarkdownRenderer` | ✅ | `atoms/MarkdownRenderer/` | Markdown 渲染 |
| `ResearchEditor` | ✅ | `panels/ResearchEditor.tsx` | CodeMirror 编辑器 |
| 路由 `/research` | ✅ | `routes/index.tsx` | 已注册 |

### 缺失组件

| 组件 | 需求 |
|------|------|
| `ReportsPage` | 研报列表页面 |
| `ReportCard` | 研报卡片组件 |
| `ReportDetailModal` | 研报详情弹窗 |
| `ExportService` | 导出服务 (MD/PDF) |
| 路由 `/reports` | 列表页路由 |
| 路由 `/reports/:id` | 详情页路由 |

---

## 🎯 T-04e: 研报列表页

### 页面架构

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 研报中心                                      🔍 搜索  ⚙️   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ 筛选栏 ─────────────────────────────────────────────────┐  │
│  │  [全部] [看涨] [看跌] [中性]    按标的: [______▼]         │  │
│  │  排序: [最新优先▼]              时间范围: [近一周▼]       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ 研报网格 (3列) ─────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │  │
│  │  │ 📈 QQQ  │  │ 📉 BTC  │  │ 📊 AAPL │                   │  │
│  │  │ 策略分析 │  │ 风险评估 │  │ 技术报告 │                   │  │
│  │  │         │  │         │  │         │                   │  │
│  │  │ 看涨 85%│  │ 看跌 72%│  │ 中性 68%│                   │  │
│  │  │ 02-06   │  │ 02-05   │  │ 02-05   │                   │  │
│  │  │ [查看] [导出]│ [查看]   │ [查看] [删除]│                │  │
│  │  └─────────┘  └─────────┘  └─────────┘                   │  │
│  │                                                           │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │  │
│  │  │ ...     │  │ ...     │  │ ...     │                   │  │
│  │  └─────────┘  └─────────┘  └─────────┘                   │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ 分页 ───────────────────────────────────────────────────┐  │
│  │        [<] 1 2 3 4 5 ... 12 [>]     共 120 份研报         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 组件结构

```
src/components/
├── pages/
│   └── ReportsPage/
│       ├── ReportsPage.tsx       # 主页面
│       ├── ReportsPage.css       # 样式
│       └── index.ts              # 导出
├── molecules/
│   └── ReportCard/
│       ├── ReportCard.tsx        # 研报卡片
│       ├── ReportCard.css
│       └── index.ts
└── organisms/
    └── ReportDetailModal/
        ├── ReportDetailModal.tsx  # 详情弹窗
        ├── ReportDetailModal.css
        └── index.ts
```

### 技术方案

#### 1. ReportsPage 主页面

**文件**: `src/components/pages/ReportsPage/ReportsPage.tsx`

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardTitle, CardContent } from '../../atoms/Card';
import { Button } from '../../atoms/Button';
import { Input } from '../../atoms/Input';
import { Badge } from '../../atoms/Badge';
import { ReportCard } from '../../molecules/ReportCard';
import { ReportDetailModal } from '../../organisms/ReportDetailModal';
import { apiClient } from '../../../services/api';
import './ReportsPage.css';

interface ReportSummary {
  id: string;
  ticker: string;
  title: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  model: string;
  created_at: string;
  file_path: string;
}

interface Filters {
  sentiment: string | null;
  ticker: string | null;
  sortBy: 'created_at' | 'confidence' | 'ticker';
  sortOrder: 'desc' | 'asc';
}

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    sentiment: null,
    ticker: null,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0
  });
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 加载研报列表
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString()
      });
      
      if (filters.ticker) {
        params.append('ticker', filters.ticker);
      }
      
      const data = await apiClient.get(`/api/v1/sync/reports?${params}`);
      
      let filteredReports = data.reports || [];
      
      // 前端筛选 (sentiment)
      if (filters.sentiment) {
        filteredReports = filteredReports.filter(
          (r: ReportSummary) => r.sentiment === filters.sentiment
        );
      }
      
      // 前端排序
      filteredReports.sort((a: ReportSummary, b: ReportSummary) => {
        const aVal = a[filters.sortBy];
        const bVal = b[filters.sortBy];
        const order = filters.sortOrder === 'desc' ? -1 : 1;
        return aVal > bVal ? order : -order;
      });
      
      setReports(filteredReports);
      setPagination(prev => ({ ...prev, total: data.count || 0 }));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // 搜索
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      loadReports();
      return;
    }
    
    setLoading(true);
    try {
      const data = await apiClient.get(
        `/api/v1/sync/reports/search/${encodeURIComponent(searchQuery)}`
      );
      setReports(data.reports || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, loadReports]);

  // 删除研报
  const handleDelete = async (reportId: string) => {
    if (!confirm('确定要删除这份研报吗？')) return;
    
    try {
      await apiClient.delete(`/api/v1/sync/reports/${reportId}`);
      loadReports();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 查看详情
  const handleView = (reportId: string) => {
    setSelectedReport(reportId);
    setModalOpen(true);
  };

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-page__header">
        <h1>📋 研报中心</h1>
        <div className="reports-page__search">
          <Input
            placeholder="搜索研报..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>搜索</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="reports-page__filters">
        <div className="reports-page__filter-group">
          <span>情感:</span>
          {['all', 'bullish', 'bearish', 'neutral'].map(s => (
            <Button
              key={s}
              variant={filters.sentiment === (s === 'all' ? null : s) ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilters(f => ({ 
                ...f, 
                sentiment: s === 'all' ? null : s 
              }))}
            >
              {s === 'all' ? '全部' : s === 'bullish' ? '看涨' : s === 'bearish' ? '看跌' : '中性'}
            </Button>
          ))}
        </div>
        
        <div className="reports-page__filter-group">
          <span>排序:</span>
          <select 
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters(f => ({ ...f, sortBy: sortBy as any, sortOrder: sortOrder as any }));
            }}
          >
            <option value="created_at-desc">最新优先</option>
            <option value="created_at-asc">最早优先</option>
            <option value="confidence-desc">置信度高→低</option>
            <option value="ticker-asc">标的 A→Z</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="reports-page__error">
          ❌ {error}
        </div>
      )}

      {/* Reports Grid */}
      {loading ? (
        <div className="reports-page__loading">加载中...</div>
      ) : reports.length === 0 ? (
        <div className="reports-page__empty">
          <p>暂无研报</p>
          <p>在 Dashboard 中生成第一份 AI 研报吧！</p>
        </div>
      ) : (
        <div className="reports-page__grid">
          {reports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onView={() => handleView(report.id)}
              onDelete={() => handleDelete(report.id)}
              onExport={() => handleExport(report.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && reports.length > 0 && (
        <div className="reports-page__pagination">
          <Button
            variant="ghost"
            disabled={pagination.page <= 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          >
            上一页
          </Button>
          <span>第 {pagination.page} 页</span>
          <Button
            variant="ghost"
            disabled={reports.length < pagination.limit}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
          >
            下一页
          </Button>
          <span className="reports-page__total">共 {pagination.total} 份研报</span>
        </div>
      )}

      {/* Detail Modal */}
      {modalOpen && selectedReport && (
        <ReportDetailModal
          reportId={selectedReport}
          onClose={() => setModalOpen(false)}
          onExport={() => handleExport(selectedReport)}
        />
      )}
    </div>
  );
};
```

#### 2. ReportCard 卡片组件

**文件**: `src/components/molecules/ReportCard/ReportCard.tsx`

```tsx
import React from 'react';
import { Card, CardContent } from '../../atoms/Card';
import { Badge } from '../../atoms/Badge';
import { Button } from '../../atoms/Button';
import './ReportCard.css';

interface ReportSummary {
  id: string;
  ticker: string;
  title: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  model: string;
  created_at: string;
}

interface ReportCardProps {
  report: ReportSummary;
  onView: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onView,
  onDelete,
  onExport
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
    <Card className="report-card" onClick={onView}>
      <CardContent className="report-card__content">
        {/* Header */}
        <div className="report-card__header">
          <span className="report-card__icon">{config.icon}</span>
          <span className="report-card__ticker">{report.ticker}</span>
          <Badge variant={config.variant} size="sm">
            {config.label}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="report-card__title">{report.title}</h3>

        {/* Summary */}
        <p className="report-card__summary">
          {report.summary?.slice(0, 100)}
          {report.summary?.length > 100 ? '...' : ''}
        </p>

        {/* Meta */}
        <div className="report-card__meta">
          <span className="report-card__confidence">
            置信度: {confidencePercent}%
          </span>
          <span className="report-card__date">
            {formatDate(report.created_at)}
          </span>
        </div>

        {/* Actions */}
        <div className="report-card__actions" onClick={(e) => e.stopPropagation()}>
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
```

#### 3. ReportDetailModal 详情弹窗

**文件**: `src/components/organisms/ReportDetailModal/ReportDetailModal.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { Card, CardTitle, CardContent } from '../../atoms/Card';
import { Button } from '../../atoms/Button';
import { Badge } from '../../atoms/Badge';
import { MarkdownRenderer } from '../../atoms/MarkdownRenderer';
import { apiClient } from '../../../services/api';
import { exportService } from '../../../services/export';
import './ReportDetailModal.css';

interface ReportDetailModalProps {
  reportId: string;
  onClose: () => void;
  onExport?: () => void;
}

interface ReportDetail {
  id: string;
  ticker: string;
  title: string;
  summary: string;
  content: string;
  sentiment: string;
  confidence: number;
  model: string;
  created_at: string;
  file_path: string;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  reportId,
  onClose,
  onExport
}) => {
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleExportMarkdown = () => {
    if (!report) return;
    exportService.exportMarkdown(report);
  };

  const handleExportPDF = () => {
    if (!report) return;
    exportService.exportPDF(report);
  };

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const sentimentLabel = {
    bullish: '看涨',
    bearish: '看跌',
    neutral: '中性'
  }[report?.sentiment || 'neutral'];

  return (
    <div className="report-modal__backdrop" onClick={handleBackdropClick}>
      <div className="report-modal__container">
        {loading ? (
          <div className="report-modal__loading">加载中...</div>
        ) : error ? (
          <div className="report-modal__error">
            <p>❌ {error}</p>
            <Button onClick={onClose}>关闭</Button>
          </div>
        ) : report ? (
          <>
            {/* Header */}
            <div className="report-modal__header">
              <div className="report-modal__title-group">
                <h2>{report.title}</h2>
                <div className="report-modal__meta">
                  <Badge variant="secondary">{report.ticker}</Badge>
                  <Badge 
                    variant={
                      report.sentiment === 'bullish' ? 'success' :
                      report.sentiment === 'bearish' ? 'danger' : 'warning'
                    }
                  >
                    {sentimentLabel}
                  </Badge>
                  <span>置信度: {Math.round((report.confidence || 0) * 100)}%</span>
                  <span>模型: {report.model}</span>
                </div>
              </div>
              <div className="report-modal__actions">
                <Button variant="secondary" size="sm" onClick={handleExportMarkdown}>
                  📄 导出 MD
                </Button>
                <Button variant="secondary" size="sm" onClick={handleExportPDF}>
                  📑 导出 PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ✕
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="report-modal__content">
              <MarkdownRenderer content={report.content} />
            </div>

            {/* Footer */}
            <div className="report-modal__footer">
              <span>生成时间: {new Date(report.created_at).toLocaleString('zh-CN')}</span>
              <span>文件: {report.file_path}</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
```

---

## 🎯 T-04d: 研报导出

### 导出格式

| 格式 | 实现方式 | 优先级 |
|------|----------|--------|
| **Markdown** | 直接下载 MD 文件 | P0 |
| **PDF** | html2pdf.js / Tauri Plugin | P1 |
| **Word** | 可选 (docx 库) | P2 |

### 技术方案

#### 1. ExportService

**文件**: `src/services/export.ts`

```typescript
/**
 * 研报导出服务
 */

interface ReportData {
  id: string;
  ticker: string;
  title: string;
  summary: string;
  content: string;
  sentiment: string;
  confidence: number;
  model: string;
  created_at: string;
}

class ExportService {
  /**
   * 导出为 Markdown 文件
   */
  exportMarkdown(report: ReportData): void {
    const content = this.formatMarkdown(report);
    const filename = this.generateFilename(report, 'md');
    this.downloadFile(content, filename, 'text/markdown');
  }

  /**
   * 导出为 PDF
   */
  async exportPDF(report: ReportData): Promise<void> {
    // 方案 1: 使用 html2pdf.js (前端纯 JS)
    const html2pdf = await import('html2pdf.js');
    
    const htmlContent = this.formatHTML(report);
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.cssText = 'padding: 40px; font-family: system-ui, sans-serif; max-width: 800px;';
    
    const filename = this.generateFilename(report, 'pdf');
    
    await html2pdf.default()
      .set({
        margin: [10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
      .from(container)
      .save();
  }

  /**
   * 使用 Tauri 原生打印 (可选)
   */
  async exportPDFNative(report: ReportData): Promise<void> {
    // 检查是否在 Tauri 环境
    if (!('__TAURI_INTERNALS__' in window)) {
      // 回退到 html2pdf
      return this.exportPDF(report);
    }

    try {
      // Tauri 方式: 使用 webview print
      const { invoke } = await import('@tauri-apps/api/core');
      
      const htmlContent = this.formatHTML(report);
      const filename = this.generateFilename(report, 'pdf');
      
      // 调用 Rust 端生成 PDF (需要实现)
      await invoke('export_pdf', { 
        html: htmlContent, 
        filename 
      });
    } catch (err) {
      console.error('Native PDF export failed, falling back:', err);
      return this.exportPDF(report);
    }
  }

  /**
   * 格式化为 Markdown
   */
  private formatMarkdown(report: ReportData): string {
    const sentimentLabel = {
      bullish: '看涨 📈',
      bearish: '看跌 📉',
      neutral: '中性 📊'
    }[report.sentiment] || report.sentiment;

    return `# ${report.title}

**标的**: ${report.ticker}  
**生成时间**: ${new Date(report.created_at).toLocaleString('zh-CN')}  
**模型**: ${report.model}  
**情感**: ${sentimentLabel}  
**置信度**: ${Math.round((report.confidence || 0) * 100)}%

---

## 摘要

${report.summary}

---

## 详细分析

${report.content}

---

*本报告由 MY-DOGE-MACRO 量化分析系统自动生成*
`;
  }

  /**
   * 格式化为 HTML (用于 PDF 生成)
   */
  private formatHTML(report: ReportData): string {
    // 使用 marked 或简单替换转换 MD -> HTML
    const contentHtml = this.markdownToHtml(report.content);
    const summaryHtml = this.markdownToHtml(report.summary);
    
    const sentimentColor = {
      bullish: '#22c55e',
      bearish: '#ef4444',
      neutral: '#f59e0b'
    }[report.sentiment] || '#6b7280';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
      line-height: 1.8;
      color: #1f2937;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 { color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; }
    h2 { color: #374151; margin-top: 32px; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .meta span { margin-right: 16px; }
    .sentiment { 
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      color: white;
      background: ${sentimentColor};
    }
    .summary { 
      background: #f3f4f6; 
      padding: 16px; 
      border-radius: 8px; 
      margin: 16px 0;
    }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
    th { background: #f9fafb; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
    pre { background: #1f2937; color: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  
  <div class="meta">
    <span><strong>标的:</strong> ${report.ticker}</span>
    <span><strong>时间:</strong> ${new Date(report.created_at).toLocaleString('zh-CN')}</span>
    <span><strong>模型:</strong> ${report.model}</span>
    <span class="sentiment">${report.sentiment}</span>
    <span><strong>置信度:</strong> ${Math.round((report.confidence || 0) * 100)}%</span>
  </div>
  
  <h2>摘要</h2>
  <div class="summary">${summaryHtml}</div>
  
  <hr>
  
  <h2>详细分析</h2>
  ${contentHtml}
  
  <div class="footer">
    本报告由 MY-DOGE-MACRO 量化分析系统自动生成 | ${new Date().toLocaleDateString('zh-CN')}
  </div>
</body>
</html>
`;
  }

  /**
   * 简单的 Markdown -> HTML 转换
   */
  private markdownToHtml(md: string): string {
    if (!md) return '';
    
    return md
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // Bold & Italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Lists
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
      // Clean up
      .replace(/<p><\/p>/g, '')
      .replace(/<p><h/g, '<h')
      .replace(/<\/h(\d)><\/p>/g, '</h$1>')
      .replace(/<p><li>/g, '<ul><li>')
      .replace(/<\/li><\/p>/g, '</li></ul>');
  }

  /**
   * 生成文件名
   */
  private generateFilename(report: ReportData, ext: string): string {
    const date = new Date(report.created_at).toISOString().slice(0, 10).replace(/-/g, '');
    const safeTitle = report.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').slice(0, 30);
    return `${date}_${report.ticker}_${safeTitle}.${ext}`;
  }

  /**
   * 下载文件
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();
```

---

## 📁 文件创建清单

| 操作 | 文件 | 说明 |
|------|------|------|
| **新增** | `src/components/pages/ReportsPage/ReportsPage.tsx` | 列表页主组件 |
| **新增** | `src/components/pages/ReportsPage/ReportsPage.css` | 样式 |
| **新增** | `src/components/pages/ReportsPage/index.ts` | 导出 |
| **新增** | `src/components/molecules/ReportCard/ReportCard.tsx` | 卡片组件 |
| **新增** | `src/components/molecules/ReportCard/ReportCard.css` | 样式 |
| **新增** | `src/components/molecules/ReportCard/index.ts` | 导出 |
| **新增** | `src/components/organisms/ReportDetailModal/ReportDetailModal.tsx` | 详情弹窗 |
| **新增** | `src/components/organisms/ReportDetailModal/ReportDetailModal.css` | 样式 |
| **新增** | `src/components/organisms/ReportDetailModal/index.ts` | 导出 |
| **新增** | `src/services/export.ts` | 导出服务 |
| **修改** | `src/routes/index.tsx` | 添加 `/reports` 路由 |

---

## 📅 执行顺序

```
Phase 1: 基础组件 (45min)
├── ReportCard 组件 + 样式
├── export.ts 服务 (Markdown 导出)
└── 安装 html2pdf.js (npm install html2pdf.js)

Phase 2: 页面与路由 (45min)
├── ReportsPage 主页面 + 样式
├── ReportDetailModal 弹窗 + 样式
└── 更新路由配置

Phase 3: 集成与测试 (30min)
├── Dashboard 中添加「查看全部研报」入口
├── PDF 导出测试
└── 响应式布局调整
```

---

## ✅ 验收标准

### T-04e 研报列表页

- [ ] `/reports` 路由可访问
- [ ] 研报卡片网格正确展示
- [ ] 支持按情感/标的筛选
- [ ] 支持搜索
- [ ] 点击卡片打开详情弹窗
- [ ] 分页正常工作

### T-04d 研报导出

- [ ] Markdown 导出下载成功
- [ ] PDF 导出下载成功
- [ ] 文件名格式正确 (日期_标的_标题)
- [ ] 内容格式完整美观

---

*规划基于 CDD v1.6.1 架构标准 | 2026-02-06 13:05*
