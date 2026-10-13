import React from 'react';

interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--surface-muted)] text-[12px] uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-4 font-semibold whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {data.map((row, i) => (
            <tr 
              key={i} 
              onClick={() => onRowClick?.(row)}
              className={`${onRowClick ? 'cursor-pointer hover:bg-[var(--surface-muted)]' : ''} transition-colors bg-[var(--surface)]`}
            >
              {columns.map((col, j) => (
                <td key={j} className="px-6 py-4 whitespace-nowrap text-[14px] text-[var(--text-secondary)]">
                  {col.cell ? col.cell(row) : (row as any)[col.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-[var(--text-muted)]">
                No results found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
