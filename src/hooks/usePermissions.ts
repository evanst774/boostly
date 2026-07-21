// hooks/usePermissions.ts
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SystemRoles } from '@/modules/rbac/roles';

export function usePermissions() {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPermissions = async () => {
            if (!user) {
                setPermissions([]);
                setIsLoading(false);
                return;
            }

            // Super Admin has all permissions
            if (user.roles?.includes(SystemRoles.SUPER_ADMIN)) {
                setPermissions(['*']);
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/auth/permissions', {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    setPermissions(data.permissions || []);
                }
            } catch (error) {
                console.error('Failed to fetch permissions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPermissions();
    }, [user]);

    // Check single permission
    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        if (user.roles?.includes(SystemRoles.SUPER_ADMIN)) return true;
        return permissions.includes(permission);
    };

    // Check any of the permissions
    const hasAnyPermission = (permissionList: string[]): boolean => {
        return permissionList.some(p => hasPermission(p));
    };

    // Check all permissions
    const hasAllPermissions = (permissionList: string[]): boolean => {
        return permissionList.every(p => hasPermission(p));
    };

    // For UI - returns 'visible' | 'disabled' | 'hidden'
    const getUIAccess = (permission: string): 'visible' | 'disabled' | 'hidden' => {
        if (!user) return 'hidden';
        if (user.roles?.includes(SystemRoles.SUPER_ADMIN)) return 'visible';
        if (permissions.includes(permission)) return 'visible';
        return 'hidden';
    };

    return {
        permissions,
        isLoading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        getUIAccess,
    };
}