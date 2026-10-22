'use client';

/**
 * Admin: block one therapist's time on their behalf.
 *
 * The panel inside is the same one the therapist sees in their own settings —
 * a specific date, or every week for the next six months, and within either the
 * whole day, a range, or individual hours. Passing psychologistId points it at
 * the /admin endpoints so it acts for that therapist rather than the signed-in
 * user.
 *
 * Working hours are not editable here. An admin sets those in the Working hours
 * modal, and the hours on offer for blocking are cut from them.
 */

import { useEffect } from 'react';
import { CalendarOff, X } from 'lucide-react';
import TherapistTimeBlocking from '@/components/TherapistTimeBlocking';

export default function BlockedTimeModal({ psychologistId, name, onClose }) {
  // Escape closes, as it does in the working-hours modal next to it.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Blocked time for ${name || 'therapist'}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <CalendarOff className="h-4 w-4 text-[#025545]" /> Blocked time — {name || 'Therapist'}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Time this therapist is not available. Blocked hours disappear from their
              booking page and are marked in their Google Calendar when it is connected.
              The hours on offer come from their working hours.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <TherapistTimeBlocking psychologistId={psychologistId} calendarConnected />
      </div>
    </div>
  );
}
