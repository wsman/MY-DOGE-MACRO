// MarketTable - Migrated to Atomic Design (T-C5.19)
// Uses: Design System colors and styling
// Virtual List: react-virtuoso
// Last Updated: 2026-02-03

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { TableVirtuoso } from 'react-virtuoso';
import { Card, CardTitle, CardContent } from '../../atoms/Card';
import { Badge } from '../../atoms/Badge';
import { StockData } from '../../../hooks/useMarketScanner';
import './MarketTable.css';

const columnHelper = createColumnHelper<StockData>();

// Columns with Design System styling
const columns = [
  columnHelper.accessor('code', {
    header: '代码',
    cell: (info) => <span className="market-table-code">{info.getValue()}</span>,
    size: 90,
  }),
  columnHelper.accessor('name', {
    header: '名称',
    cell: (info) => <span className="market-table-name">{info.getValue()}</span>,
    size: 120,
  }),
  columnHelper.accessor('price', {
    header: '价格',
    cell: (info) => {
      const price = info.getValue();
      return <span className="market-table-price">{price.toFixed(2)}</span>;
    },
    size: 90,
  }),
  columnHelper.accessor('change', {
    header: '涨跌幅',
    cell: (info) => {
      const val = info.getValue();
      const variant = val > 0 ? 'success' : val < 0 ? 'danger' : 'neutral';
      const sign = val > 0 ? '+' : '';
      return (
        <Badge variant={variant} size="sm">
          {sign}
          {val.toFixed(2)}%
        </Badge>
      );
    },
    size: 100,
  }),
  columnHelper.accessor('volume', {
    header: '成交量',
    cell: (info) => {
      const vol = info.getValue();
      const formatted =
        vol >= 1000000
          ? `${(vol / 1000000).toFixed(2)}M`
          : vol >= 1000
            ? `${(vol / 1000).toFixed(2)}K`
            : vol.toString();
      return <span className="market-table-volume">{formatted}</span>;
    },
    size: 100,
  }),
  columnHelper.accessor('industry', {
    header: '行业',
    cell: (info) => <span className="market-table-industry">{info.getValue()}</span>,
    size: 140,
  }),
];

interface MarketTableProps {
  data: StockData[];
  title?: string;
  compact?: boolean;
}

export const MarketTable: React.FC<MarketTableProps> = ({
  data,
  title = '市场数据',
  compact = false,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  // Table container style
  const containerStyle = compact ? { height: '100%' } : { height: '400px' };

  return (
    <Card elevation="low" padding="none" className="market-table-card">
      {title && (
        <CardTitle className="market-table-header">
          {title}
          <span className="market-table-count">{data.length} 条数据</span>
        </CardTitle>
      )}
      <CardContent padding="none" className="market-table-content">
        <div className="market-table-container" style={containerStyle}>
          <TableVirtuoso
            totalCount={rows.length}
            style={{ height: '100%', width: '100%' }}
            fixedHeaderContent={() => (
              <tr className="market-table-header-row">
                {table.getFlatHeaders().map((header) => (
                  <th
                    key={header.id}
                    className="market-table-header-cell"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="market-table-header-content">
                      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                      <span className="market-table-sort-icon">
                        {{
                          asc: '▲',
                          desc: '▼',
                        }[header.column.getIsSorted() as string] ?? null}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            )}
            itemContent={(index) => {
              const row = rows[index];
              return row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="market-table-cell"
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ));
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Empty state component
export const MarketTableEmpty: React.FC = () => (
  <Card elevation="low" padding="lg" className="market-table-empty">
    <div className="empty--content">
      <span className="empty--icon">📊</span>
      <p>暂无市场数据</p>
      <small>请启动市场扫描或检查服务器连接</small>
    </div>
  </Card>
);

export default MarketTable;
