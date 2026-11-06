import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

export interface FilterChip {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export interface TableToolbarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filterChips?: FilterChip[];
  onClearFilters?: () => void;
  filtersSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  totalCount?: number;
  className?: string;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterChips = [],
  onClearFilters,
  filtersSlot,
  actionsSlot,
  className = '',
}) => {
  const [localSearch, setLocalSearch] = useState(searchValue);

  // Sync external search value
  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  // Debounce search update (300ms)
  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => {
      if (localSearch !== searchValue) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchValue, onSearchChange]);

  const hasActiveFilters = (searchValue && searchValue.trim() !== '') || filterChips.length > 0;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Top Bar: Search, Filters & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Search input & custom filter controls */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5 max-w-2xl">
          {onSearchChange && (
            <div className="relative w-full sm:w-72">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch('');
                    onSearchChange('');
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {filtersSlot && <div className="flex items-center gap-2">{filtersSlot}</div>}
        </div>

        {/* Right: Actions slot (e.g. Primary "Add" button, exports) */}
        {actionsSlot && <div className="flex items-center gap-2.5 shrink-0">{actionsSlot}</div>}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span className="font-medium text-slate-400">Active filters:</span>

          {searchValue && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <span>Query: "{searchValue}"</span>
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  if (onSearchChange) onSearchChange('');
                }}
                className="hover:text-red-600 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filterChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
            >
              <span>
                {chip.label}: {chip.value}
              </span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="hover:text-red-600 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 ml-1 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset all</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TableToolbar;
