"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/backendApi';
import ConditionPageEditor from '@/components/ConditionPageEditor';

export default function CreateCounsellingServicePage() {
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated()) { router.push('/'); return; }
    if (!hasRole('admin') && !hasRole('superadmin')) router.push('/profile');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);
      setError('');
      const response = await adminApi.createCounsellingService(payload);
      if (response?.success) router.push('/admin/counselling');
      else setError(response?.message || 'Failed to create the page');
    } catch (err) {
      setError(err?.message || 'Failed to create the page');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen text-sm text-gray-500">Loading…</div>;
  }

  return (
    <ConditionPageEditor
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => router.push('/admin/counselling')}
      saving={saving}
      error={error}
    />
  );
}
