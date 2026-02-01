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
    cell: info => <span className="font-mono text-blue-400">{info.getValue()}</span>,
    size: 80,
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    cell: info => <span className="text-gray-300">{info.getValue()}</span>,
    size: 100,
  }),
  columnHelper.accessor('price', {
    header: 'Price',
    cell: info => <span className="font-mono text-yellow-400">{info.getValue().toFixed(2)}</span>,
    size: 80,
  }),
  columnHelper.accessor('change', {
    header: 'Chg%',
    cell: info => {
      const val = info.getValue();
      const color = val > 0 ? 'text-red-500' : val < 0 ? 'text-green-500' : 'text-gray-500';
      return <span className={`font-mono ${color}`}>{val > 0 ? '+' : ''}{val.toFixed(2)}%</span>;
    },
    size: 80,
  }),
  columnHelper.accessor('industry', {
    header: 'Industry',
    cell: info => <span className="text-xs text-gray-500">{info.getValue()}</span>,
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

  // 计算列总宽度，确保表格布局一致
  const totalWidth = columns.reduce((sum, col) => sum + (col.size || 100), 0);

  return (
    <div className="h-full w-full bg-[#1e1e1e] overflow-hidden">
      <TableVirtuoso
        totalCount={rows.length}
        style={{ height: '100%', width: '100%' }}
        fixedHeaderContent={() => (
          <tr className="bg-[#252526] border-b border-gray-700">
            {table.getFlatHeaders().map(header => (
              <th
                key={header.id}
                className="px-2 py-2 text-xs font-bold text-gray-400 text-left cursor-pointer hover:text-white select-none"
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
              className="px-2 py-1 overflow-hidden whitespace-nowrap text-xs"
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