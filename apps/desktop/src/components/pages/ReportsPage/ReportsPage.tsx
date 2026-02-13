// ReportsPage - 研报中心页面
// Last Updated: 2026-02-06

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../atoms/Button';
import { Input } from '../../atoms/Input';
import { ReportCardGrid, ReportSummary } from '../../molecules/ReportCard';
import { ReportDetailModal } from '../../organisms/ReportDetailModal';
import { exportService } from '../../../services/export';
import { apiClient } from '../../../services/api';

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
  const navigate = useNavigate();

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
      
      // 使用 sync 路由获取研报
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
      setError(err.message || '加载研报失败');
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

  // 导出研报
  const handleExport = async (reportId: string) => {
    try {
      const report = await apiClient.get(`/api/v1/sync/reports/${reportId}`);
      await exportService.exportMarkdown(report);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 查看详情
  const handleView = (reportId: string) => {
    setSelectedReport(reportId);
    setModalOpen(true);
  };

  // 初始化加载
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">📋 研报中心</h1>
            <p className="text-[var(--text-secondary)]">查看和管理所有 AI 生成的研报</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="搜索研报标题、标的或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 md:flex-none md:w-64"
            />
            <Button onClick={handleSearch}>搜索</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-[var(--bg-secondary)] rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[var(--text-primary)]">情感:</span>
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
          
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-primary)]">排序:</span>
            <select 
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(f => ({ ...f, sortBy: sortBy as any, sortOrder: sortOrder as any }));
              }}
              className="px-3 py-1.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-md border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            >
              <option value="created_at-desc">最新优先</option>
              <option value="created_at-asc">最早优先</option>
              <option value="confidence-desc">置信度高→低</option>
              <option value="confidence-asc">置信度低→高</option>
              <option value="ticker-asc">标的 A→Z</option>
              <option value="ticker-desc">标的 Z→A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-[var(--status-error)]/10 border border-[var(--status-error)]/50 rounded-lg">
          <div className="flex items-center gap-2 text-[var(--status-error)]">
            <span>❌</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Reports Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
            <p className="mt-2 text-[var(--text-secondary)]">加载中...</p>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">暂无研报</h3>
          <p className="text-[var(--text-secondary)]">在 Dashboard 中生成第一份 AI 研报吧！</p>
          <Button 
            variant="primary" 
            className="mt-4"
            onClick={() => navigate('/')}
          >
            返回 Dashboard
          </Button>
        </div>
      ) : (
        <>
          <ReportCardGrid
            reports={reports}
            onView={handleView}
            onDelete={handleDelete}
            onExport={handleExport}
            columns={3}
          />
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-primary)]">
            <div className="text-sm text-[var(--text-secondary)]">
              显示第 {(pagination.page - 1) * pagination.limit + 1} 到 {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共 {pagination.total} 份研报
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                上一页
              </Button>
              <span className="px-3 py-1 bg-[var(--bg-tertiary)] rounded-md text-[var(--text-primary)]">
                第 {pagination.page} 页
              </span>
              <Button
                variant="ghost"
                disabled={reports.length < pagination.limit}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                下一页
              </Button>
            </div>
          </div>
        </>
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