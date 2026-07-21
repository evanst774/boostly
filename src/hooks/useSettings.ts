// src/hooks/useSettings.ts
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsData {
  preferences: {
    darkMode: boolean;
    notifications: boolean;
    emailNotifications: boolean;
    soundEffects: boolean;
    language: string;
    showOnLeaderboard: boolean;
    analytics: boolean;
  };
  totalEarned: number;
}

export function useSettings() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/user/settings');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch settings'),
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const updateProfile = async (profileData: {
    name: string;
    email: string;
    phone: string;
  }) => {
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  };

  const updatePassword = async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await fetch('/api/user/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordData),
    });
    if (!response.ok) throw new Error('Failed to update password');
    return response.json();
  };

  const updatePreferences = async (preferences: Record<string, unknown>) => {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });
    if (!response.ok) throw new Error('Failed to update preferences');
    return response.json();
  };

  return {
    data,
    isLoading,
    error,
    updateProfile,
    updatePassword,
    updatePreferences,
  };
}
