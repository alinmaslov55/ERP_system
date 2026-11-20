import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  Users,
  UserPlus,
  Edit2,
  UserX,
  UserCheck,
  Loader2,
  KeyRound,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import axios from '../../lib/axios';
import { DataTable, type ColumnDef } from '../../components/data-table/DataTable';
import { TableToolbar } from '../../components/data-table/TableToolbar';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import type { User, Role } from '../auth/types';

interface PaginatedUsersResponse {
  data: User[];
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Search, filter & pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRoleIds, setCreateRoleIds] = useState<number[]>([]);
  const [createIsActive, setCreateIsActive] = useState(true);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRoleIds, setEditRoleIds] = useState<number[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);

  // Fetch available roles
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await axios.get<{ data: Role[] }>('/roles');
      return response.data.data;
    },
    staleTime: 60 * 1000,
  });

  // Fetch paginated users
  const {
    data: usersData,
    isLoading,
  } = useQuery<PaginatedUsersResponse>({
    queryKey: ['admin', 'users', searchTerm, selectedRole, page, pageSize],
    queryFn: async () => {
      const response = await axios.get<PaginatedUsersResponse>('/users', {
        params: {
          search: searchTerm.trim() || undefined,
          role: selectedRole || undefined,
          page,
          per_page: pageSize,
        },
      });
      return response.data;
    },
  });

  const users = usersData?.data ?? [];
  const meta = usersData?.meta;

  // Reset page when filter changes
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setPage(1);
  };

  // Helper to get initials
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: createName,
        email: createEmail,
        password: createPassword,
        role_ids: createRoleIds,
        is_active: createIsActive,
      };
      const response = await axios.post('/users', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(
        `Staff user ${createName} has been created successfully.`,
        'User Created'
      );
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
    onError: (err: unknown) => {
      const msg = isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(err)
        ? err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message || 'Failed to create user.'
        : 'Failed to create user.';
      toast.error(msg, 'Creation Failed');
    },
  });

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!userToEdit) return;
      const payload: Record<string, unknown> = {
        name: editName,
        email: editEmail,
        role_ids: editRoleIds,
        is_active: editIsActive,
      };
      if (editPassword.trim()) {
        payload.password = editPassword;
      }
      const response = await axios.patch(`/users/${userToEdit.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(`User profile updated successfully.`, 'Changes Saved');
      setUserToEdit(null);
    },
    onError: (err: unknown) => {
      const msg = isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(err)
        ? err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message || 'Failed to update user.'
        : 'Failed to update user.';
      toast.error(msg, 'Update Failed');
    },
  });

  // Toggle Active Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (user: User) => {
      const response = await axios.patch(`/users/${user.id}`, {
        is_active: !user.is_active,
      });
      return response.data;
    },
    onSuccess: (_, user) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(
        `User ${user.name} has been ${user.is_active ? 'deactivated' : 'reactivated'}.`,
        'Status Changed'
      );
      setUserToToggleStatus(null);
    },
    onError: (err: unknown) => {
      const msg = isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(err)
        ? err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message || 'Failed to update user status.'
        : 'Failed to update user status.';
      toast.error(msg, 'Operation Blocked');
    },
  });

  const resetCreateForm = () => {
    setCreateName('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateRoleIds(roles.length > 0 ? [roles[0].id] : []);
    setCreateIsActive(true);
  };

  const handleOpenEdit = (user: User) => {
    setUserToEdit(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword('');
    // Use role_ids or match role slugs to roles IDs
    const currentRoleIds =
      user.role_ids && user.role_ids.length > 0
        ? user.role_ids
        : roles.filter((r) => user.roles.includes(r.slug)).map((r) => r.id);
    setEditRoleIds(currentRoleIds);
    setEditIsActive(user.is_active);
  };

  const getRoleBadgeVariant = (slug: string): 'red' | 'blue' | 'amber' | 'emerald' | 'slate' => {
    switch (slug) {
      case 'admin':
        return 'red';
      case 'manager':
        return 'blue';
      case 'warehouse_operator':
        return 'amber';
      case 'sales_operator':
        return 'emerald';
      default:
        return 'slate';
    }
  };

  const formatRoleName = (slug: string): string => {
    switch (slug) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Operations Manager';
      case 'warehouse_operator':
        return 'Warehouse Operator';
      case 'sales_operator':
        return 'Sales Operator';
      default:
        return slug.replace(/_/g, ' ');
    }
  };

  // Columns definition
  const columns: ColumnDef<User>[] = [
    {
      key: 'user',
      header: 'Staff Member',
      sortable: true,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 ring-2 ring-slate-200">
            {getInitials(u.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-900 truncate">{u.name}</span>
            <span className="text-xs text-slate-500 truncate">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Assigned Roles',
      cell: (u) => (
        <div className="flex flex-wrap gap-1.5">
          {u.roles.length > 0 ? (
            u.roles.map((r) => (
              <Badge key={r} variant={getRoleBadgeVariant(r)} size="sm">
                {formatRoleName(r)}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No role assigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Account Status',
      cell: (u) => (
        <Badge variant={u.is_active ? 'emerald' : 'slate'} dot>
          {u.is_active ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      key: 'last_login',
      header: 'Last Login',
      cell: (u) => (
        <span className="text-xs text-slate-600">
          {u.last_login_at
            ? new Date(u.last_login_at).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : 'Never'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined',
      cell: (u) => (
        <span className="text-xs text-slate-500">
          {new Date(u.created_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (u) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleOpenEdit(u)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-50"
            title="Edit staff profile"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setUserToToggleStatus(u)}
            className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors p-1 rounded ${
              u.is_active
                ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
            }`}
            title={u.is_active ? 'Deactivate account' : 'Reactivate account'}
          >
            {u.is_active ? (
              <>
                <UserX className="h-3.5 w-3.5" />
                <span>Deactivate</span>
              </>
            ) : (
              <>
                <UserCheck className="h-3.5 w-3.5" />
                <span>Activate</span>
              </>
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Staff & User Management
            </h1>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              Administration
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Administer staff accounts, assign granular role permissions, and control access states.
          </p>
        </div>
      </div>

      {/* Toolbar: Search, Role Filter & Primary Action */}
      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Filter staff by name or email..."
        onClearFilters={() => {
          setSearchTerm('');
          setSelectedRole('');
          setPage(1);
        }}
        filterChips={
          selectedRole
            ? [
                {
                  key: 'role',
                  label: 'Role',
                  value: formatRoleName(selectedRole),
                  onRemove: () => {
                    setSelectedRole('');
                    setPage(1);
                  },
                },
              ]
            : []
        }
        filtersSlot={
          <div className="flex items-center gap-2">
            <label htmlFor="role-filter" className="text-xs font-medium text-slate-600">
              Role:
            </label>
            <select
              id="role-filter"
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="manager">Operations Manager</option>
              <option value="warehouse_operator">Warehouse Operator</option>
              <option value="sales_operator">Sales Operator</option>
            </select>
          </div>
        }
        actionsSlot={
          <button
            type="button"
            onClick={() => {
              resetCreateForm();
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Staff Member</span>
          </button>
        }
      />

      {/* Data Table */}
      <DataTable<User>
        data={users}
        columns={columns}
        isLoading={isLoading}
        pagination={
          meta
            ? {
                pageIndex: meta.current_page,
                pageSize: meta.per_page,
                totalCount: meta.total,
              }
            : undefined
        }
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(ps) => {
          setPageSize(ps);
          setPage(1);
        }}
        emptyTitle="No staff users found"
        emptyDescription={
          searchTerm || selectedRole
            ? 'No staff members match the selected filters. Try clearing your search or role filter.'
            : 'No user accounts are currently configured.'
        }
        emptyIcon={Users}
        emptyAction={
          searchTerm || selectedRole ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedRole('');
                setPage(1);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Reset active filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add First Staff Member</span>
            </button>
          )
        }
      />

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Staff Member"
        description="Provision a new staff account with assigned role privileges."
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Samuel Green"
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="samuel@stockpilot.io"
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Temporary Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Assigned ERP Roles
            </label>
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              {roles.map((r) => (
                <label key={r.id} className="flex items-start gap-2.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createRoleIds.includes(r.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCreateRoleIds([...createRoleIds, r.id]);
                      } else {
                        setCreateRoleIds(createRoleIds.filter((id) => id !== r.id));
                      }
                    }}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-800">{r.name}</div>
                    <div className="text-slate-500 text-[11px]">{r.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="create-is-active"
              checked={createIsActive}
              onChange={(e) => setCreateIsActive(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="create-is-active" className="text-xs font-medium text-slate-700">
              Account is Active and permitted to sign in immediately
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || createRoleIds.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!userToEdit}
        onClose={() => setUserToEdit(null)}
        title="Edit Staff Member"
        description="Update profile details, role permissions, or password."
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reset Password <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                minLength={8}
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Leave blank to retain current password"
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Assigned ERP Roles
            </label>
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              {roles.map((r) => (
                <label key={r.id} className="flex items-start gap-2.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editRoleIds.includes(r.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditRoleIds([...editRoleIds, r.id]);
                      } else {
                        setEditRoleIds(editRoleIds.filter((id) => id !== r.id));
                      }
                    }}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-800">{r.name}</div>
                    <div className="text-slate-500 text-[11px]">{r.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="edit-is-active"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="edit-is-active" className="text-xs font-medium text-slate-700">
              Account is Active
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setUserToEdit(null)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || editRoleIds.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deactivation / Activation Dialog */}
      <ConfirmDialog
        isOpen={!!userToToggleStatus}
        onClose={() => setUserToToggleStatus(null)}
        onConfirm={() => {
          if (userToToggleStatus) {
            toggleStatusMutation.mutate(userToToggleStatus);
          }
        }}
        title={userToToggleStatus?.is_active ? 'Deactivate Staff Account' : 'Reactivate Staff Account'}
        description={
          userToToggleStatus?.is_active ? (
            <>
              Are you sure you want to deactivate{' '}
              <strong className="text-slate-900">{userToToggleStatus?.name}</strong> (
              <span className="font-mono text-xs">{userToToggleStatus?.email}</span>)? The user
              will be immediately locked out of the ERP system.
            </>
          ) : (
            <>
              Are you sure you want to reactivate{' '}
              <strong className="text-slate-900">{userToToggleStatus?.name}</strong> (
              <span className="font-mono text-xs">{userToToggleStatus?.email}</span>)? The user
              will regain sign-in privileges and role capabilities.
            </>
          )
        }
        confirmLabel={userToToggleStatus?.is_active ? 'Deactivate Account' : 'Reactivate Account'}
        cancelLabel="Cancel"
        variant={userToToggleStatus?.is_active ? 'danger' : 'info'}
        isLoading={toggleStatusMutation.isPending}
      />
    </div>
  );
};

export default UsersPage;
