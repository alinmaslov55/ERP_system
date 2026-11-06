import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
}

export interface PaginationState {
  pageIndex: number; // 1-based index
  pageSize: number;
  totalCount: number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  skeletonRowCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ElementType;
  emptyAction?: React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  onRowClick?: (item: T) => void;
  // Sorting (controlled or uncontrolled fallback)
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  // Pagination (controlled server-side or automatic client-side)
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  enableClientPagination?: boolean;
  defaultPageSize?: number;
  className?: string;
}

export function DataTable<T extends object>({
  data,
  columns,
  isLoading = false,
  skeletonRowCount = 5,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display matching your criteria.',
  emptyIcon: EmptyIcon = Inbox,
  emptyAction,
  keyExtractor,
  onRowClick,
  sortBy: controlledSortBy,
  sortDirection: controlledSortDirection,
  onSort,
  pagination: controlledPagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  enableClientPagination = true,
  defaultPageSize = 10,
  className = '',
}: DataTableProps<T>) {
  // Uncontrolled client-side sorting state
  const [internalSortBy, setInternalSortBy] = useState<string | null>(null);
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');

  // Uncontrolled client-side pagination state
  const [internalPage, setInternalPage] = useState<number>(1);
  const [internalPageSize, setInternalPageSize] = useState<number>(defaultPageSize);

  const isControlledSort = controlledSortBy !== undefined;
  const currentSortBy = isControlledSort ? controlledSortBy : internalSortBy;
  const currentSortDirection = isControlledSort
    ? controlledSortDirection ?? 'asc'
    : internalSortDirection;

  const isControlledPagination = controlledPagination !== undefined;
  const currentPage = isControlledPagination ? controlledPagination.pageIndex : internalPage;
  const currentPageSize = isControlledPagination
    ? controlledPagination.pageSize
    : internalPageSize;

  const handleHeaderClick = (col: ColumnDef<T>) => {
    if (!col.sortable) return;

    const nextDirection =
      currentSortBy === col.key && currentSortDirection === 'asc' ? 'desc' : 'asc';

    if (onSort) {
      onSort(col.key, nextDirection);
    } else {
      setInternalSortBy(col.key);
      setInternalSortDirection(nextDirection);
    }
  };

  // Process sorting client-side if not handled externally
  const sortedData = useMemo(() => {
    if (onSort || !currentSortBy) return data;

    const activeCol = columns.find((c) => c.key === currentSortBy);
    if (!activeCol || !activeCol.accessorKey) return data;

    const key = activeCol.accessorKey;
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Handle numbers or numeric strings
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return currentSortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Handle strings
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return currentSortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, columns, currentSortBy, currentSortDirection, onSort]);

  // Total count
  const totalCount = isControlledPagination
    ? controlledPagination.totalCount
    : data.length;

  // Process client-side pagination if not controlled
  const paginatedData = useMemo(() => {
    if (isControlledPagination || !enableClientPagination) {
      return sortedData;
    }
    const startIndex = (currentPage - 1) * currentPageSize;
    return sortedData.slice(startIndex, startIndex + currentPageSize);
  }, [sortedData, isControlledPagination, enableClientPagination, currentPage, currentPageSize]);

  const totalPages = Math.max(1, Math.ceil(totalCount / currentPageSize));

  const handlePageChange = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    if (onPageChange) {
      onPageChange(targetPage);
    } else {
      setInternalPage(targetPage);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    } else {
      setInternalPageSize(newSize);
      setInternalPage(1);
    }
  };

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'left':
      default:
        return 'text-left';
    }
  };

  const fromRecord = totalCount === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const toRecord = Math.min(currentPage * currentPageSize, totalCount);

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {columns.map((col) => {
                const isSorted = currentSortBy === col.key;
                const alignClass = getAlignmentClass(col.align);

                return (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col)}
                    className={`p-3.5 sm:px-4 ${alignClass} ${
                      col.sortable ? 'cursor-pointer select-none hover:text-slate-900 group' : ''
                    } ${col.headerClassName || ''}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right' ? 'justify-end w-full' : col.align === 'center' ? 'justify-center w-full' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400 group-hover:text-slate-700 transition-colors">
                          {isSorted ? (
                            currentSortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? (
              // Skeleton Loading Rows
              Array.from({ length: skeletonRowCount }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={`skeleton-col-${col.key}`} className="p-3.5 sm:px-4">
                      <div className="h-4 w-3/4 rounded-md bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="p-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <EmptyIcon className="h-6 w-6" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-800">{emptyTitle}</h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    {emptyDescription}
                  </p>
                  {emptyAction && <div className="mt-4">{emptyAction}</div>}
                </td>
              </tr>
            ) : (
              // Data Rows
              paginatedData.map((item, rowIdx) => {
                const rowKey = keyExtractor
                  ? keyExtractor(item, rowIdx)
                  : (item as Record<string, unknown>).id?.toString() || rowIdx;

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition-colors hover:bg-slate-50/75 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map((col) => {
                      const alignClass = getAlignmentClass(col.align);
                      return (
                        <td
                          key={col.key}
                          className={`p-3.5 sm:px-4 ${alignClass} ${col.className || ''}`}
                        >
                          {col.cell
                            ? col.cell(item, rowIdx)
                            : col.accessorKey
                            ? String(item[col.accessorKey] ?? '')
                            : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {!isLoading && totalCount > 0 && (enableClientPagination || isControlledPagination) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              Showing <strong className="font-semibold text-slate-800">{fromRecord}</strong> to{' '}
              <strong className="font-semibold text-slate-800">{toRecord}</strong> of{' '}
              <strong className="font-semibold text-slate-800">{totalCount}</strong> results
            </span>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 ml-3 border-l border-slate-200 pl-3">
              <span>Show:</span>
              <select
                value={currentPageSize}
                onChange={handlePageSizeChange}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(1)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-2.5 text-xs font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(totalPages)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
