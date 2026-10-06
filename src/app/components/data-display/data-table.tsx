import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { EmptyState } from '../feedback/empty-state';
import { cn } from '@/core/lib/utils';

export interface DataColumn<T> { key: string; header: string; cell: (row: T) => ReactNode; searchable?: boolean; className?: string; }
export function DataTable<T extends { id: string }>({ rows, columns, searchPlaceholder = 'Search records', emptyTitle = 'No records yet', emptyDescription = 'New records will appear here.', pageSize = 8, rowClassName }: { rows: T[]; columns: DataColumn<T>[]; searchPlaceholder?: string; emptyTitle?: string; emptyDescription?: string; pageSize?: number; rowClassName?: (row: T) => string }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => { const lowered = query.toLowerCase().trim(); if (!lowered) return rows; return rows.filter((row) => columns.filter((column) => column.searchable !== false).some((column) => String(column.cell(row)).toLowerCase().includes(lowered))); }, [columns, query, rows]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return <div className="space-y-4"><div className="relative max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={searchPlaceholder} className="pl-9" /></div>{pageRows.length === 0 ? <EmptyState title={emptyTitle} description={emptyDescription} /> : <div className="overflow-hidden rounded-xl border border-border"><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-surface-muted/70 text-xs uppercase tracking-[0.08em] text-muted-foreground"><tr>{columns.map((column) => <th key={column.key} className={cn('px-4 py-3 font-semibold', column.className)}>{column.header}</th>)}</tr></thead><tbody className="divide-y divide-border">{pageRows.map((row) => <tr key={row.id} className={cn('transition-colors hover:bg-surface-muted/50', rowClassName?.(row))}>{columns.map((column) => <td key={column.key} className={cn('px-4 py-4 align-middle', column.className)}>{column.cell(row)}</td>)}</tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground"><span>{filtered.length} record{filtered.length === 1 ? '' : 's'}</span><div className="flex items-center gap-2"><span>Page {currentPage} of {pageCount}</span><Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon-sm" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><ChevronRight className="h-4 w-4" /></Button></div></div></div>}</div>;
}
