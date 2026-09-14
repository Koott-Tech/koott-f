'use client';

/**
 * Finance → Groups. Read-only sales, sessions and slots per therapist group.
 * Groups are created and filled by admins (Admin → Therapist groups).
 */

import { Users } from 'lucide-react';
import TherapistGroupsReport from '@/components/admin/TherapistGroupsReport';

export default function FinanceGroupsPage() {
  return (
    <div className="mx-auto max-w-[1280px] space-y-5 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-[#025545]" />
        <div>
          <div className="text-xl font-semibold text-gray-900">Therapist groups</div>
          <p className="mt-0.5 max-w-2xl text-xs text-slate-500">
            Sales, sessions and slots per group. Groups are set up by admins under Admin → Therapist groups.
          </p>
        </div>
      </div>
      <TherapistGroupsReport />
    </div>
  );
}
