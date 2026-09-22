/**
 * Fixtures for the dashboard's state switch — the prototype's preview switch
 * ("koott-client-dashboard (2).html"), kept so each state can be looked at
 * without an account that happens to be in it.
 *
 * Add ?preview to /dashboard or /profile/sessions to bring up the switch; the
 * page then draws itself from these instead of the client's own data.
 */

const inDays = (n, hh = 12, mm = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return { date: d.toISOString().slice(0, 10), time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00` };
};
const SHOW = { id: 'p1', first_name: 'Sneha', last_name: 'Thomas', designation: 'Child & Adolescent Psychologist' };
const session = (id, day, hh, extra = {}) => {
  const { date, time } = inDays(day, hh);
  return {
    id, scheduled_date: date, scheduled_time: time, status: 'booked', price: 1350,
    session_type: 'individual', duration_minutes: 50, psychologist: SHOW,
    google_meet_link: 'https://meet.google.com/abc-defg-hij', ...extra,
  };
};
const doneSession = (id, day, extra = {}) => {
  const { date, time } = inDays(-day, 12);
  return {
    id, scheduled_date: date, scheduled_time: time, status: 'completed', price: 1350,
    session_type: 'individual', duration_minutes: 50, psychologist: SHOW, ...extra,
  };
};
export const PREVIEWS = {
  new: { upcoming: [], past: [], packages: [] },
  awaiting: {
    upcoming: [], past: [], packages: [],
    draft: {
      slug: 'sneha-thomas', kind: 'individual', price: 1350, planLabel: 'Single session',
      therapist: { name: 'Sneha Thomas', role: 'Child & Adolescent Psychologist' },
      slot: { startsAt: new Date(Date.now() + 3 * 86400000).toISOString() },
    },
  },
  paid: { upcoming: [session('s1', 0, 12)], past: [], packages: [] },
  package: {
    upcoming: [session('s1', 0, 12, { package_id: 'pk1', package: { session_number: 1, total_sessions: 3 } })],
    past: [],
    packages: [{
      id: 'cp1', package_id: 'pk1', total_sessions: 3, remaining_sessions_for_booking: 2,
      validity_months: 6, psychologist: SHOW,
      expires_at: new Date(Date.now() + 180 * 86400000).toISOString(),
    }],
  },
  multi: { upcoming: [session('s1', 0, 12), session('s2', 7, 12), session('s3', 14, 16)], past: [], packages: [] },
  history: {
    upcoming: [],
    packages: [],
    past: [
      doneSession('h1', 7, { psychologist_notes: 'We looked at how work pressure is affecting your sleep, and practised box breathing.' }),
      doneSession('h2', 14, { psychologist_notes: 'You described the situations that bring on tightness in your chest.', client_rating: 5 }),
      doneSession('h3', 21, { status: 'cancelled', price: 0 }),
    ],
  },
};


/** The state named in ?preview, or '' for the client's own data. */
export const previewFromParams = (params) => {
  const asked = params?.get('preview');
  if (!asked || asked === '0' || asked === 'live') return '';
  return PREVIEWS[asked] ? asked : 'new';
};

/**
 * Whether to show the switch. While developing it is simply always there, so the
 * states can be flipped through without knowing the URL; in production it takes
 * ?preview to bring it up, and ?preview=0 or the "Live data" pill puts it away.
 */
export const showSwitch = (params) => process.env.NODE_ENV !== 'production'
  || params?.get('preview') !== null;
