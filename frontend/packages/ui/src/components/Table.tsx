import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T extends object>({
  columns,
  data,
  keyField,
  emptyMessage = 'No data',
  onRowClick,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-elevated px-4 py-12 text-center text-text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-elevated">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-semibold text-text ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={String(row[keyField])}
              className={`border-b border-border last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-surface-elevated' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-text ${col.className ?? ''}`}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
