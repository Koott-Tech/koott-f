"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/backendApi';
import ConditionPageEditor from '@/components/ConditionPageEditor';

export default function EditCounsellingServicePage() {
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated()) { router.push('/'); return; }
    if (!hasRole('admin') && !hasRole('superadmin')) { router.push('/profile'); return; }
    fetchService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, params.id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminApi.getCounsellingService(params.id);
      if (response?.success) setService(response.data || response.message || response);
      else setError(response?.message || 'Failed to load the page');
    } catch (err) {
      setError(err?.message || 'Failed to load the page');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);
      setError('');
      const response = await adminApi.updateCounsellingService(params.id, payload);
      if (response?.success) router.push('/admin/counselling');
      else setError(response?.message || response?.error || 'Failed to save the page');
    } catch (err) {
      setError(err?.message || 'Failed to save the page');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen text-sm text-gray-500">Loading page…</div>;
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error || 'Page not found'}</div>
        <button onClick={() => router.push('/admin/counselling')} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Back to pages
        </button>
      </div>
    );
  }

  return (
    <ConditionPageEditor
      mode="edit"
      initialData={service}
      onSubmit={handleSubmit}
      onCancel={() => router.push('/admin/counselling')}
      saving={saving}
      error={error}
    />
  );
}
