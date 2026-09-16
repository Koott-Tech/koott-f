'use client';

import CustomSelect from '@/components/CustomSelect';

/** Default follow-up tier shown on child specialist profile booking UI */
export const DEFAULT_CHILD_SPEC_FU_TIER = '3';

/**
 * Themed session-count select for child specialist follow-up rows.
 * @param {boolean} [compact] — tighter padding/height for dense follow-up rows
 */
export default function ChildSpecSessionSelect({ value, onChange, ariaLabel, options, compact = false }) {
  const triggerClass = compact
    ? 'w-full rounded-md border border-[#025545]/40 bg-gradient-to-b from-[#f2fff1] to-[#f2ecff] py-0.5 pl-1.5 pr-1.5 text-[11px] font-semibold leading-tight tracking-tight text-[#025545] shadow-sm transition-all hover:border-[#025545]'
    : 'w-full rounded-lg border border-[#025545]/40 bg-gradient-to-b from-[#f2fff1] to-[#f2ecff] py-2 pl-3 pr-2.5 text-xs font-semibold tracking-tight text-[#025545] shadow-[0_1px_3px_rgba(63,46,115,0.1)] transition-all hover:border-[#025545] hover:shadow-[0_2px_8px_rgba(63,46,115,0.14)]';

  return (
    <div className={compact ? 'relative w-[7.75rem] shrink-0' : 'relative min-w-[10rem] shrink-0'}>
      <CustomSelect
        aria-label={ariaLabel}
        value={value}
        onChange={onChange}
        onClick={(e) => e.stopPropagation()}
        className={triggerClass}
        options={options}
      />
    </div>
  );
}
