'use client';

/**
 * Admin → Therapist groups. Create groups (A, B, C …), put each therapist in one,
 * and watch sales, sessions and open slots per group. Internal only — finance sees
 * the same report read-only at /finance/groups; clients never see groups.
 */

import { useState } from 'react';
import { Users } from 'lucide-react';
import TherapistGroupsManager from '@/components/admin/TherapistGroupsManager';
import TherapistGroupsReport from '@/components/admin/TherapistGroupsReport';
import ListingPatternEditor from '@/components/admin/ListingPatternEditor';

export default function TherapistGroupsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="mx-auto max-w-[1280px] space-y-5 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-[#025545]" />
        <div>
          <div className="text-xl font-semibold text-gray-900">Therapist groups</div>
          <p className="mt-0.5 max-w-2xl text-xs text-slate-500">
            Group therapists (A, B, C …) to follow sales, sessions and slots per group. Only admin and finance see groups.
          </p>
        </div>
      </div>
      <TherapistGroupsManager onChanged={() => setRefreshKey((k) => k + 1)} />
      <ListingPatternEditor refreshKey={refreshKey} />
      <TherapistGroupsReport refreshKey={refreshKey} />
    </div>
  );
}
