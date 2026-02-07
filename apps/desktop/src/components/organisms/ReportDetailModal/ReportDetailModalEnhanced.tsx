// ReportDetailModalEnhanced - Framer Motion增强版研报详情弹窗
// 依据: FE-014 Framer Motion深度应用实施方案
// 创建: 2026-02-07 (Phase 3: P1视觉与体验增强)

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../../atoms/Card';
import { Button } from '../../atoms/Button';
import { Badge } from '../../atoms/Badge';
import { MarkdownRenderer } from '../../atoms/MarkdownRenderer';
import { exportService, ReportData } from '../../../services/export';
import { apiClient } from '../../../services/api';
import { animationPresets, createSpringAnimation } from '../../motion/animations';

interface ReportDetailModalEnhancedProps {
  /** 研报 ID */
  reportId: string;
  /** 关闭回调 */
  onClose: () => void;
  /** 导出回调 (可选) */
  onExport?: () => void;
  /** 是否显示 */
  open?: boolean;
}

export const ReportDetailModalEnhanced: React.FC<ReportDetailModalEnhancedProps> = ({
  reportId,
  onClose,
  onExport,
  open = true,
}) => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!reportId || !open) return;
    
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
  }, [reportId, open]);

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

  // 动画配置
  const backdropVariants = {
    visible: {
      opacity: 1,
      backdropFilter: 'blur(4px)',
      transition: {
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1],
      },
    },
    hidden: {
      opacity: 0,
      backdropFilter: 'blur(0px)',
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
  };

  const modalVariants = {
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 35,
        mass: 1,
      },
    },
    hidden: {
      y: 50,
      opacity: 0,
      scale: 0.95,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 35,
      },
    },
  };

  const contentVariants = {
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        delay: 0.1,
        staggerChildren: 0.05,
      },
    },
    hidden: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const itemVariants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1],
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const loadingVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  // 渲染加载状态
  const renderLoading = () => (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8"
            variants={modalVariants}
          >
            <div className="flex items-center justify-center gap-3">
              <motion.div
                className="rounded-full h-8 w-8 border-b-2 border-blue-600"
                variants={loadingVariants}
                animate="animate"
              />
              <motion.span
                className="text-gray-700 dark:text-gray-300"
                variants={itemVariants}
              >
                加载研报详情...
              </motion.span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 渲染错误状态
  const renderError = () => (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full"
        variants={modalVariants}
      >
        <motion.div
          className="text-center"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="text-red-500 text-4xl mb-4"
            variants={itemVariants}
          >
            ❌
          </motion.div>
          <motion.h3
            className="text-lg font-medium text-gray-900 dark:text-white mb-2"
            variants={itemVariants}
          >
            加载失败
          </motion.h3>
          <motion.p
            className="text-gray-600 dark:text-gray-400 mb-4"
            variants={itemVariants}
          >
            {error || '研报不存在'}
          </motion.p>
          <motion.div
            className="flex justify-center gap-2"
            variants={itemVariants}
          >
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              重试
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              关闭
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  // 渲染成功状态
  const renderContent = () => (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdropClick}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl my-8"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
        whileHover={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}
        transition={createSpringAnimation(400, 30)}
      >
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 md:p-6 border-b border-gray-200 dark:border-gray-700"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex-1">
            <motion.h2
              className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2"
              variants={itemVariants}
            >
              {report!.title}
            </motion.h2>
            <motion.div
              className="flex flex-wrap items-center gap-2"
              variants={itemVariants}
            >
              <Badge variant="secondary">{report!.ticker}</Badge>
              {config && (
                <Badge variant={config.variant}>
                  <motion.span
                    className="mr-1 inline-block"
                    animate={{
                      y: config.icon === '📈' ? [0, -2, 0] : 0,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {config.icon}
                  </motion.span>
                  {config.label}
                </Badge>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                置信度: <span className="font-bold">{Math.round((report!.confidence || 0) * 100)}%</span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                模型: <span className="font-medium">{report!.model}</span>
              </span>
            </motion.div>
          </div>
          <motion.div
            className="flex items-center gap-2"
            variants={itemVariants}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={createSpringAnimation(300, 20)}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportMarkdown}
                disabled={exporting}
              >
                <motion.span
                  animate={{
                    rotate: exporting ? [0, 360] : 0,
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  📄
                </motion.span>
                {exporting ? '导出中...' : 'Markdown'}
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={createSpringAnimation(300, 20)}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportPDF}
                disabled={exporting}
              >
                📑 {exporting ? '导出中...' : 'PDF'}
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={createSpringAnimation(300, 20)}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                ✕
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          className="p-4 md:p-6 max-h-[70vh] overflow-y-auto"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Summary */}
          {report!.summary && (
            <motion.div
              className="mb-6"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">摘要</h3>
              <Card
                className="bg-gray-50 dark:bg-gray-700/50"
                whileHover={{
                  scale: 1.01,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                }}
                transition={createSpringAnimation(300, 20)}
              >
                <CardContent className="p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {report!.summary}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Full Content */}
          <motion.div
            className="mb-6"
            variants={itemVariants}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">详细分析</h3>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <MarkdownRenderer content={report!.content} />
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <motion.div variants={itemVariants}>
              <span>生成时间: {new Date(report!.created_at).toLocaleString('zh-CN')}</span>
              {report!.file_path && (
                <span className="ml-4">文件: {report!.file_path}</span>
              )}
            </motion.div>
            <motion.div
              className="flex items-center gap-2"
              variants={itemVariants}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                关闭
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  if (!open) return null;

  if (loading) return renderLoading();
  if (error || !report) return renderError();
  
  return (
    <AnimatePresence>
      {open && renderContent()}
    </AnimatePresence>
  );
};

// 动画增强版Modal包装器
export const AnimatedModalWrapper: React.FC<{
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  backdropClass?: string;
}> = ({ children, open, onClose, backdropClass = '' }) => {
  const backdropVariants = {
    visible: {
      opacity: 1,
      backdropFilter: 'blur(4px)',
      transition: {
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1],
      },
    },
    hidden: {
      opacity: 0,
      backdropFilter: 'blur(0px)',
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
  };

  const contentVariants = {
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 35,
        mass: 1,
      },
    },
    hidden: {
      y: 50,
      opacity: 0,
      scale: 0.95,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 35,
      },
    },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${backdropClass}`}
          onClick={onClose}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            variants={contentVariants}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportDetailModalEnhanced;