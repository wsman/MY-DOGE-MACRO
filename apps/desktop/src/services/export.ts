/**
 * 研报导出服务
 * 支持 Markdown 和 PDF 导出
 * Last Updated: 2026-02-06
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
  file_path?: string;
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
    try {
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
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('PDF导出失败，请稍后重试');
    }
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
    <span class="sentiment">${this.getSentimentLabel(report.sentiment)}</span>
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
   * 获取情感标签
   */
  private getSentimentLabel(sentiment: string): string {
    const labels: Record<string, string> = {
      bullish: '看涨',
      bearish: '看跌',
      neutral: '中性'
    };
    return labels[sentiment] || sentiment;
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
export type { ReportData };