import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  Calendar,
  Filter,
  User as UserIcon,
  FileCode,
  RefreshCw,
} from 'lucide-react';
import axios from '../../lib/axios';
import { DataTable, type ColumnDef } from '../../components/data-table/DataTable';
import { TableToolbar, type FilterChip } from '../../components/data-table/TableToolbar';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type { AuditLog, PaginatedAuditLogsResponse } from '../../types/audit';

export const AuditLogsPage: React.FC = () => {
  // Query parameters state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Diff inspection modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [viewMode, setViewMode] = useState<'diff' | 'raw'>('diff');

  // Fetch paginated audit logs
  const { data, isLoading, refetch } = useQuery<PaginatedAuditLogsResponse>({
    queryKey: ['audit-logs', page, pageSize, selectedEntity, selectedAction, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', pageSize.toString());
      if (selectedEntity) params.append('auditable_type', selectedEntity);
      if (selectedAction) params.append('action', selectedAction);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await axios.get<PaginatedAuditLogsResponse>(`/api/v1/audit-logs?${params.toString()}`);
      return response.data;
    },
  });

  // Action Badge styling helper
  const getActionBadgeVariant = (action: string): BadgeVariant => {
    if (action.endsWith('.created') || action.endsWith('.received') || action.endsWith('.fulfilled')) {
      return 'emerald';
    }
    if (action.endsWith('.updated')) {
      return 'blue';
    }
    if (action.endsWith('.deleted') || action.endsWith('.cancelled')) {
      return 'red';
    }
    if (action.endsWith('.submitted') || action.endsWith('.reserved')) {
      return 'amber';
    }
    return 'slate';
  };

  // Table columns definition
  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        key: 'created_at',
        header: 'Timestamp',
        sortable: true,
        cell: (row) => {
          const date = new Date(row.created_at);
          return (
            <div className="flex flex-col text-xs font-mono text-slate-700">
              <span className="font-semibold text-slate-900">{date.toLocaleDateString()}</span>
              <span className="text-slate-500">{date.toLocaleTimeString()}</span>
            </div>
          );
        },
      },
      {
        key: 'actor',
        header: 'Actor',
        cell: (row) => (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <UserIcon className="h-3.5 w-3.5" />
            </div>
            <div className="text-sm">
              <span className="font-medium text-slate-900">
                {row.actor?.name || 'System / Automated'}
              </span>
              {row.actor && (
                <span className="block text-xs text-slate-400">ID #{row.actor.id}</span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'action',
        header: 'Action',
        cell: (row) => (
          <Badge variant={getActionBadgeVariant(row.action)} size="sm">
            {row.action}
          </Badge>
        ),
      },
      {
        key: 'target',
        header: 'Target Entity',
        cell: (row) => (
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-800 text-sm">{row.target_label}</span>
          </div>
        ),
      },
      {
        key: 'ip_address',
        header: 'IP Address',
        cell: (row) => (
          <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            {row.ip_address || '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (row) => (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSelectedLog(row);
                setViewMode('diff');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              title="Inspect field mutations"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Inspect</span>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Active filter chips for toolbar
  const filterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (selectedEntity) {
      chips.push({
        key: 'entity',
        label: 'Entity',
        value: selectedEntity,
        onRemove: () => setSelectedEntity(''),
      });
    }
    if (selectedAction) {
      chips.push({
        key: 'action',
        label: 'Action',
        value: selectedAction,
        onRemove: () => setSelectedAction(''),
      });
    }
    if (dateFrom) {
      chips.push({
        key: 'dateFrom',
        label: 'From',
        value: dateFrom,
        onRemove: () => setDateFrom(''),
      });
    }
    if (dateTo) {
      chips.push({
        key: 'dateTo',
        label: 'To',
        value: dateTo,
        onRemove: () => setDateTo(''),
      });
    }
    return chips;
  }, [selectedEntity, selectedAction, dateFrom, dateTo]);

  const handleClearFilters = () => {
    setSelectedEntity('');
    setSelectedAction('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // Diff rows generator for modal
  const diffEntries = useMemo(() => {
    if (!selectedLog) return [];
    const oldVals = selectedLog.old_values || {};
    const newVals = selectedLog.new_values || {};

    const allKeys = Array.from(new Set([...Object.keys(oldVals), ...Object.keys(newVals)]));

    return allKeys.map((key) => {
      const oldV = oldVals[key];
      const newV = newVals[key];
      const isChanged = JSON.stringify(oldV) !== JSON.stringify(newV);

      const formatVal = (v: unknown): string => {
        if (v === undefined) return '(not set)';
        if (v === null) return 'null';
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v);
      };

      return {
        key,
        oldValue: formatVal(oldV),
        newValue: formatVal(newV),
        isChanged,
      };
    });
  }, [selectedLog]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Trail Explorer</h1>
            <Badge variant="purple" size="sm">
              Immutable
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Search and inspect operational history, state transitions, and attribute-level diffs.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <TableToolbar
        filterChips={filterChips}
        onClearFilters={handleClearFilters}
        filtersSlot={
          <div className="flex flex-wrap items-center gap-3">
            {/* Entity Type Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                aria-label="Filter by Entity Type"
                value={selectedEntity}
                onChange={(e) => {
                  setSelectedEntity(e.target.value);
                  setPage(1);
                }}
                className="text-xs rounded-lg border-slate-300 bg-white py-1.5 pl-2.5 pr-8 text-slate-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Entities</option>
                <option value="Product">Product</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Category">Category</option>
                <option value="User">User</option>
                <option value="PurchaseOrder">Purchase Order</option>
                <option value="SalesOrder">Sales Order</option>
              </select>
            </div>

            {/* Action Filter */}
            <select
              aria-label="Filter by Action"
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-lg border-slate-300 bg-white py-1.5 pl-2.5 pr-8 text-slate-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="*.created">Created (*.created)</option>
              <option value="*.updated">Updated (*.updated)</option>
              <option value="*.deleted">Deleted (*.deleted)</option>
              <option value="po.submitted">PO Submitted</option>
              <option value="so.confirmed">SO Confirmed</option>
            </select>

            {/* Date Range Filters */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                aria-label="Date From"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="text-xs rounded-lg border-slate-300 bg-white py-1.5 px-2 text-slate-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                aria-label="Date To"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="text-xs rounded-lg border-slate-300 bg-white py-1.5 px-2 text-slate-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        }
      />

      {/* Main DataTable */}
      <DataTable<AuditLog>
        data={data?.data || []}
        columns={columns}
        isLoading={isLoading}
        emptyTitle="No audit records found"
        emptyDescription="No events match your current filter parameters."
        pagination={
          data?.meta
            ? {
                pageIndex: data.meta.current_page,
                pageSize: data.meta.per_page,
                totalCount: data.meta.total,
              }
            : undefined
        }
        onPageChange={(newPage: number) => setPage(newPage)}
        onPageSizeChange={(newSize: number) => {
          setPageSize(newSize);
          setPage(1);
        }}
      />

      {/* Diff Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={`Audit Log #${selectedLog?.id} — ${selectedLog?.action}`}
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-5">
            {/* Metadata Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block">Actor</span>
                <span className="font-semibold text-slate-800">
                  {selectedLog.actor?.name || 'System / Auto'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Entity</span>
                <span className="font-semibold text-slate-800">{selectedLog.target_label}</span>
              </div>
              <div>
                <span className="text-slate-400 block">IP Address</span>
                <span className="font-mono text-slate-800">{selectedLog.ip_address || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Recorded At</span>
                <span className="text-slate-800 font-mono">
                  {new Date(selectedLog.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('diff')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === 'diff'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Side-by-Side Diff
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('raw')}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === 'raw'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode className="h-3 w-3" />
                  <span>Raw JSON</span>
                </button>
              </div>

              {selectedLog.user_agent && (
                <div className="text-[11px] text-slate-400 truncate max-w-xs" title={selectedLog.user_agent}>
                  {selectedLog.user_agent}
                </div>
              )}
            </div>

            {/* Diff View Content */}
            {viewMode === 'diff' ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {diffEntries.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No attribute changes recorded in this transaction.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-4 py-2 text-left w-1/4">Field</th>
                        <th className="px-4 py-2 text-left w-3/8">Previous Value</th>
                        <th className="px-4 py-2 text-left w-3/8">New Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {diffEntries.map((row) => (
                        <tr
                          key={row.key}
                          className={row.isChanged ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'}
                        >
                          <td className="px-4 py-2.5 font-mono font-medium text-slate-800">
                            {row.key}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-600">
                            {row.oldValue !== '(not set)' ? (
                              <span className="line-through text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                                {row.oldValue}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-900">
                            {row.newValue !== '(not set)' ? (
                              <span
                                className={`px-1.5 py-0.5 rounded font-semibold ${
                                  row.isChanged
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'text-slate-700'
                                }`}
                              >
                                {row.newValue}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Deleted</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              /* Raw JSON View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">old_values</span>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto max-h-72">
                    {JSON.stringify(selectedLog.old_values, null, 2) || 'null'}
                  </pre>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">new_values</span>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto max-h-72">
                    {JSON.stringify(selectedLog.new_values, null, 2) || 'null'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogsPage;
