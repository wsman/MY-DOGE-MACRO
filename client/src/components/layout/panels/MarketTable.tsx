/**
 * Market Table Component
 * Updated with Design System Colors (T-C4.3)
 */

import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { TableVirtuoso } from 'react-virtuoso';
import { StockData } from '../../../hooks/useMarketScanner';

const columnHelper = createColumnHelper<StockData>();

const columns = [
  columnHelper.accessor('code', {
    header: 'Code',
    cell: info => <span className="font-mono text-accent">{info.getValue()}</span>,
    size: 80,
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    cell: info => <span className="text-text-primary">{info.getValue()}</span>,
    size: 100,
  }),
  columnHelper.accessor('price', {
    header: 'Price',
    cell: info => <span className="font-mono text-text-primary">{info.getValue().toFixed(2)}</span>,
    size: 80,
  }),
  columnHelper.accessor('change', {
    header: 'Chg%',
    cell: info => {
      const val = info.getValue();
      const color = val > 0 ? 'text-app-success' : val < 0 ? 'text-app-danger' : 'text-text-secondary';
      return <span className={`font-mono ${color}`}>{val > 0 ? '+' : ''}{val.toFixed(2)}%</span>;
    },
    size: 80,
  }),
  columnHelper.accessor('industry', {
    header: 'Industry',
    cell: info => <span className="text-xs text-text-secondary">{info.getValue()}</span>,
    size: 120,
  }),
];

interface Props {
  data: StockData[];
}

export const MarketTable: React.FC<Props> = ({ data }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  return (
    <div className="h-full w-full bg-app-primary overflow-hidden">
      <TableVirtuoso
        totalCount={rows.length}
        style={{ height: '100%', width: '100%' }}
        fixedHeaderContent={() => (
          <tr className="bg-app-tertiary border-b border-app-border">
            {table.getFlatHeaders().map(header => (
              <th
                key={header.id}
                className="px-3 py-2 text-xs font-bold text-text-secondary text-left cursor-pointer hover:text-text-primary select-none"
                style={{ width: header.getSize() }}
                onClick={header.column.getToggleSortingHandler()}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {{
                  asc: ' ▲',
                  desc: ' ▼',
                }[header.column.getIsSorted() as string] ?? null}
              </th>
            ))}
          </tr>
        )}
        itemContent={(index) => {
          const row = rows[index];
          return row.getVisibleCells().map(cell => (
            <td 
              key={cell.id} 
              className="px-3 py-2 overflow-hidden whitespace-nowrap text-xs border-b border-app-border/50"
              style={{ width: cell.column.getSize() }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ));
        }}
      />
    </div>
  );
};
