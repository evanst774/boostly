// src/components/admin/users/UsersTable.tsx
'use client';

import { Sparkles } from 'lucide-react';
import { UsersTableRow } from './UsersTableRow';
import { UserRecord } from '@/app/admin/types';

interface UsersTableProps {
  users: UserRecord[];
  loading: boolean;
  page: number;
  pageSize: number;
  isCurrentUser: (userId: string) => boolean;
  onSelectUser: (user: UserRecord) => void;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  formatDate: (date: string | null) => string;
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-white/5">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div
            className="h-4 bg-white/5 rounded animate-pulse"
            style={{ width: i === 0 ? '24px' : i === 1 ? '120px' : '80px' }}
          />
        </td>
      ))}
    </tr>
  );
}

export function UsersTable({
  users,
  loading,
  page,
  pageSize,
  isCurrentUser,
  onSelectUser,
  onToggleStatus,
  formatDate,
}: UsersTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-white/[0.03]">
            <tr className="border-b border-white/10">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 w-10">
                #
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
                User
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 hidden sm:table-cell">
                Role
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 hidden lg:table-cell">
                Last Login
              </th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-20">
        <Sparkles className="w-12 h-12 text-blue-400/30 mx-auto mb-3" />
        <p className="text-gray-400 text-lg">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead className="bg-white/[0.03]">
          <tr className="border-b border-white/10">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 w-10">
              #
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
              User
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 hidden sm:table-cell">
              Role
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
              Status
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 hidden lg:table-cell">
              Last Login
            </th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 w-20">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <UsersTableRow
              key={user.id}
              user={user}
              index={index}
              page={page}
              pageSize={pageSize}
              isCurrentUser={isCurrentUser(user.id)}
              onSelectUser={onSelectUser}
              onToggleStatus={onToggleStatus}
              formatDate={formatDate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
