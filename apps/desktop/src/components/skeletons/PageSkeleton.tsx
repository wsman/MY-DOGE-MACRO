// PageSkeleton Component - 页面级骨架屏
// Created: 2026-02-07
// Purpose: 提供路由切换时的统一加载体验

import React from 'react';
import { Card } from '../atoms/Card';
import './PageSkeleton.css';

interface PageSkeletonProps {
  /** 页面类型 */
  type?: 'dashboard' | 'market' | 'macro' | 'research' | 'terminal' | 'reports' | 'default';
  /** 是否显示头部 */
  showHeader?: boolean;
  /** 是否显示侧边栏 */
  showSidebar?: boolean;
  /** 是否显示主要内容 */
  showMainContent?: boolean;
  /** 自定义内容 */
  customContent?: React.ReactNode;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  type = 'default',
  showHeader = true,
  showSidebar = true,
  showMainContent = true,
  customContent,
}) => {
  if (customContent) {
    return <div className="page-skeleton">{customContent}</div>;
  }

  const renderSkeletonForType = () => {
    switch (type) {
      case 'dashboard':
        return (
          <>
            {showHeader && (
              <div className="page-skeleton__header">
                <div className="page-skeleton__title skeleton-pulse" style={{ width: '200px', height: '32px' }} />
                <div className="page-skeleton__actions skeleton-pulse" style={{ width: '100px', height: '32px' }} />
              </div>
            )}
            
            {showMainContent && (
              <div className="page-skeleton__content">
                {/* 数据卡片区域 */}
                <div className="page-skeleton__cards-grid">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} padding="md" hoverable={false}>
                      <div className="skeleton-pulse" style={{ height: '80px' }} />
                    </Card>
                  ))}
                </div>
                
                {/* 主内容区域 */}
                <div className="page-skeleton__main-grid">
                  <Card padding="md" hoverable={false}>
                    <div className="skeleton-pulse" style={{ height: '400px' }} />
                  </Card>
                  <Card padding="md" hoverable={false}>
                    <div className="skeleton-pulse" style={{ height: '400px' }} />
                  </Card>
                  <Card padding="md" hoverable={false}>
                    <div className="skeleton-pulse" style={{ height: '400px' }} />
                  </Card>
                </div>
              </div>
            )}
          </>
        );
        
      case 'market':
        return (
          <>
            {showHeader && (
              <div className="page-skeleton__header">
                <div className="page-skeleton__title skeleton-pulse" style={{ width: '150px', height: '28px' }} />
                <div className="page-skeleton__actions">
                  <div className="skeleton-pulse" style={{ width: '80px', height: '32px' }} />
                  <div className="skeleton-pulse" style={{ width: '80px', height: '32px' }} />
                </div>
              </div>
            )}
            
            {showMainContent && (
              <div className="page-skeleton__content">
                {/* 市场表格骨架 */}
                <div className="page-skeleton__market-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <div key={i} className="market-item-skeleton skeleton-pulse" style={{ height: '120px' }} />
                  ))}
                </div>
              </div>
            )}
          </>
        );
        
      default:
        // 通用骨架屏
        return (
          <>
            {showHeader && (
              <div className="page-skeleton__header skeleton-pulse" style={{ height: '64px' }} />
            )}
            
            {showSidebar && (
              <div className="page-skeleton__sidebar skeleton-pulse" style={{ width: '200px', height: '100%' }} />
            )}
            
            {showMainContent && (
              <div className="page-skeleton__main skeleton-pulse" style={{ height: '600px' }} />
            )}
          </>
        );
    }
  };

  return (
    <div className="page-skeleton">
      {renderSkeletonForType()}
    </div>
  );
};

export default PageSkeleton;