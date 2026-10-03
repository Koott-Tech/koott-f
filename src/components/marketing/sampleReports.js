/**
 * Sample answers for /dev/marketing-preview — the same shapes the API returns.
 *
 * The content is deliberately awkward: long page paths, a campaign name nobody
 * would shorten, a therapist with a long name, a country that is not India.
 * A layout that survives these survives the real data. Dev only; nothing here
 * is served to anyone.
 */

const day = (n) => new Date(Date.UTC(2026, 8, 23 - n)).toISOString().slice(0, 10);
const LONG_PATH = '/online-child-psychologist/anxiety-and-panic-attacks-in-teenagers-kerala';

export const SAMPLES = {
  'traffic-over-time': {
    grain: 'day',
    summary: { pageViews: 52796, sessions: 30080, visitors: 24146, bounceRate: 0.76, avgDuration: 192 },
    rows: Array.from({ length: 30 }, (_, i) => ({
      period: day(i), pageViews: 1900 + i * 7, sessions: 1000 + i * 4, visitors: 900 + i * 3,
      bounceRate: 0.73 + (i % 5) / 100, avgDuration: 180 + i, pagesPerSession: 1.8,
    })),
  },

  'traffic-sources': {
    model: 'last_non_direct', split: null,
    summary: { sessions: 29155, visitors: 23406 },
    categories: [{ category: 'Paid social', sessions: 17218 }, { category: 'Direct', sessions: 5202 }, { category: 'Organic search', sessions: 4396 }],
    rows: [
      { source: 'Facebook', category: 'Paid social', sessions: 9963, visitors: 9283 },
      { source: 'Instagram', category: 'Paid social', sessions: 7148, visitors: 6465 },
      { source: 'Direct', category: 'Direct', sessions: 5202, visitors: 3611 },
      { source: 'Google', category: 'Organic search', sessions: 4342, visitors: 2558 },
    ],
    splits: [],
  },

  location: {
    summary: { pageViews: 51391, sessions: 29155, visitors: 23371 },
    countries: [
      { country: 'India', label: 'India', sessions: 23594, visitors: 19000, pageViews: 41000 },
      { country: 'United Arab Emirates', label: 'United Arab Emirates', sessions: 1648, visitors: 1200, pageViews: 3000 },
    ],
    rows: [
      { city: 'Kochi', country: 'India', pageViews: 11699, sessions: 7034, visitors: 5863 },
      { city: 'Thiruvananthapuram', country: 'India', pageViews: 3079, sessions: 2001, visitors: 1733 },
      { city: 'Abu Dhabi', country: 'United Arab Emirates', pageViews: 1028, sessions: 449, visitors: 335 },
    ],
  },

  'page-visits': {
    group: 'page', split: null,
    summary: { pageViews: 51391, sessions: 29155, visitors: 23371, pagesPerSession: 1.8, avgDuration: 192, bounceRate: 0.76 },
    top: [{ path: LONG_PATH, pageViews: 19567, sessions: 18301, visitors: 16696 }],
    rows: [
      { path: LONG_PATH, pageViews: 19567, sessions: 18301, visitors: 16696 },
      { path: '/book-malayali-psychologists', pageViews: 7024, sessions: 5308, visitors: 3123 },
      { path: '/', pageViews: 4123, sessions: 3454, visitors: 2766 },
    ],
    splits: [],
  },

  'button-clicks': {
    split: null,
    summary: { visitors: 22715, uniqueClicks: 4865, clicks: 6100 },
    buttons: [{ element: 'book_now', uniqueClicks: 1685, clicks: 2100 }, { element: 'view_profile', uniqueClicks: 633, clicks: 790 }],
    rows: [
      { element: 'book_now', path: '/book-malayali-psychologists', target: '/book/sneha-thomas', visitors: 22715, uniqueClicks: 685, clicks: 800 },
      { element: 'view_profile', path: LONG_PATH, target: '/service-page/anjali-menon', visitors: 22715, uniqueClicks: 541, clicks: 610 },
    ],
    splits: [],
  },

  'blog-posts': {
    split: null,
    summary: { views: 458, visitors: 409 },
    rows: [
      { title: 'Having Feelings for Your Therapist: Psychology, Signs and What You Can Do About It', path: '/blog/feelings-for-your-therapist', publishedAt: '2026-01-23', views: 136, visitors: 124, avgReadSeconds: 214 },
      { title: 'We Malayalees on Sex', path: '/blog/we-malayalees-on-sex', publishedAt: '2022-09-09', views: 44, visitors: 43, avgReadSeconds: 180 },
    ],
  },

  'blog-time': {
    summary: { avgSessions: 84, avgVisitors: 81, clicks: 1 },
    cells: [
      { dow: 4, hour: 23, avgSessions: 6, avgVisitors: 6, clicks: 1 },
      { dow: 6, hour: 22, avgSessions: 2, avgVisitors: 2, clicks: 0 },
      { dow: 1, hour: 10, avgSessions: 1, avgVisitors: 1, clicks: 0 },
    ],
    rows: [
      { dow: 4, hour: 23, avgSessions: 6, avgVisitors: 6, clicks: 1 },
      { dow: 6, hour: 22, avgSessions: 2, avgVisitors: 2, clicks: 0 },
      { dow: 1, hour: 10, avgSessions: 1, avgVisitors: 1, clicks: 0 },
    ],
  },

  'search-queries': {
    configured: true,
    summary: { impressions: 64743, clicks: 2517, ctr: 0.039, position: 11.7 },
    rows: [
      { query: 'koott', impressions: 1047, clicks: 671, ctr: 0.641, position: 1.1 },
      { query: 'online counselling kerala malayalam therapist', impressions: 420, clicks: 33, ctr: 0.079, position: 12.6 },
    ],
  },

  'booking-funnel': {
    filters: { channel: null, device: null, therapist: null },
    summary: { entered: 1240, completed: 214, conversion: 0.1726, abandoned: 1026, abandonRate: 0.8274 },
    rows: [
      { step: 'counsellor_list_view', label: 'Viewed the therapist list', order: 1, sessions: 5300, visitors: 4400, prevSessions: 4800, toPrevious: null, ofEntry: 1, dropped: null },
      { step: 'counsellor_profile_view', label: 'Viewed a therapist profile', order: 2, sessions: 2980, visitors: 2500, prevSessions: 2700, toPrevious: 0.562, ofEntry: 0.562, dropped: 2320 },
      { step: 'booking_started', label: 'Started booking', order: 3, sessions: 1240, visitors: 1100, prevSessions: 1180, toPrevious: 0.416, ofEntry: 0.234, dropped: 1740 },
      { step: 'phone_verified', label: 'Verified their number', order: 4, sessions: 890, visitors: 820, prevSessions: 800, toPrevious: 0.718, ofEntry: 0.168, dropped: 350 },
      { step: 'slot_selected', label: 'Chose a date and time', order: 5, sessions: 640, visitors: 600, prevSessions: 610, toPrevious: 0.719, ofEntry: 0.121, dropped: 250 },
      { step: 'plan_selected', label: 'Chose a plan', order: 6, sessions: 520, visitors: 500, prevSessions: 480, toPrevious: 0.813, ofEntry: 0.098, dropped: 120 },
      { step: 'details_completed', label: 'Filled in their details', order: 7, sessions: 410, visitors: 400, prevSessions: 390, toPrevious: 0.788, ofEntry: 0.077, dropped: 110 },
      { step: 'checkout_started', label: 'Reached checkout', order: 8, sessions: 330, visitors: 320, prevSessions: 300, toPrevious: 0.805, ofEntry: 0.062, dropped: 80 },
      { step: 'payment_opened', label: 'Opened payment', order: 9, sessions: 290, visitors: 280, prevSessions: 260, toPrevious: 0.879, ofEntry: 0.055, dropped: 40 },
      { step: 'booking_completed', label: 'Paid — booking confirmed', order: 10, sessions: 214, visitors: 210, prevSessions: 190, toPrevious: 0.738, ofEntry: 0.040, dropped: 76 },
    ],
    stopped: [
      { step: 'slot_selected', label: 'Chose a date and time', order: 5, sessions: 250 },
      { step: 'booking_started', label: 'Started booking', order: 3, sessions: 350 },
      { step: 'checkout_started', label: 'Reached checkout', order: 8, sessions: 80 },
    ],
  },

  'therapist-performance': {
    summary: { profileViews: 4200, bookingStarted: 980, bookings: 214, revenue: 396000 },
    rows: [
      { id: '1', name: 'Dr. Thaniya K Leela Ramachandran', role: 'Clinical Psychologist', profileViews: 1360, visitors: 1200, bookingStarted: 320, checkoutStarted: 210, bookings: 74, revenue: 136027, startRate: 0.235, prevBookings: 61, prevRevenue: 118000 },
      { id: '2', name: 'Anjali Menon', role: 'Clinical Psychologist', profileViews: 980, visitors: 900, bookingStarted: 240, checkoutStarted: 160, bookings: 41, revenue: 120660, startRate: 0.245, prevBookings: 44, prevRevenue: 129000 },
    ],
  },

  journeys: {
    page: 0, limit: 50, total: 312,
    filters: { channel: null, device: null, stage: null, booked: null },
    rows: [
      {
        session: 'c0ffee00-1111-4222-8333-444455556666', visitor: 'aaaabbbb-1111-4222-8333-444455556666',
        startedAt: '2026-09-23T04:12:00Z', endedAt: '2026-09-23T04:31:00Z', seconds: 1140, events: 22, pageViews: 9,
        landing: LONG_PATH, last: '/book/sneha-thomas', channel: 'paid_social', source: 'facebook',
        campaign: 'sept_malayali_therapists_retargeting', device: 'mobile', region: 'India', furthest: 8,
        stage: 'Reached checkout', booked: false,
      },
      {
        session: 'deadbeef-2222-4333-8444-555566667777', visitor: 'ccccdddd-2222-4333-8444-555566667777',
        startedAt: '2026-09-23T03:02:00Z', endedAt: '2026-09-23T03:24:00Z', seconds: 1320, events: 31, pageViews: 12,
        landing: '/', last: '/payment/success', channel: 'organic_search', source: 'google',
        campaign: null, device: 'desktop', region: 'United Arab Emirates', furthest: 10,
        stage: 'Paid — booking confirmed', booked: true,
      },
    ],
  },

  campaigns: {
    summary: { sessions: 17218, visitors: 14200, bookingStarted: 820, bookings: 140, revenue: 252000 },
    untagged: 9200,
    rows: [
      { campaign: 'sept_malayali_therapists_retargeting', source: 'Facebook', category: 'Paid social', sessions: 9963, visitors: 9283, prevSessions: 8400, bookingStarted: 480, checkoutStarted: 210, bookings: 84, revenue: 151000, conversion: 0.0084, landing: 'listing' },
      { campaign: 'couples_counselling_oct', source: 'Instagram', category: 'Paid social', sessions: 7148, visitors: 6465, prevSessions: 7600, bookingStarted: 340, checkoutStarted: 160, bookings: 56, revenue: 101000, conversion: 0.0078, landing: 'topic' },
    ],
  },

  technical: {
    note: 'Field data from real visits, only from visitors who accepted analytics. INP is approximated by the slowest interaction.',
    metrics: [
      { metric: 'LCP', samples: 4200, good: 3100, needsImprovement: 700, poor: 400, p75: 2840, goodRate: 0.738 },
      { metric: 'INP', samples: 3900, good: 3500, needsImprovement: 300, poor: 100, p75: 168, goodRate: 0.897 },
      { metric: 'CLS', samples: 4100, good: 3900, needsImprovement: 150, poor: 50, p75: 0.04, goodRate: 0.951 },
    ],
    rows: [
      { metric: 'LCP', pageGroup: 'listing', device: 'mobile', samples: 1800, p50: 2100, p75: 3100, p95: 5200, good: 1200, poor: 260 },
      { metric: 'LCP', pageGroup: 'home', device: 'desktop', samples: 900, p50: 1400, p75: 1900, p95: 3100, good: 800, poor: 20 },
    ],
    errors: [
      { event: 'api_error', code: 'slots_unavailable', events: 42, sessions: 31 },
      { event: 'booking_step_error', code: 'phone_invalid', events: 28, sessions: 26 },
    ],
    errorPages: [{ pageGroup: 'booking', events: 52, sessions: 40 }],
    apiErrors: [{ code: 'slots_unavailable', events: 42 }],
  },

  realtime: {
    minutes: 15,
    generatedAt: '2026-09-23T05:55:00Z',
    summary: { sessions: 18, visitors: 17, inBooking: 4, booked: 1 },
    byPage: [{ key: LONG_PATH, sessions: 6 }, { key: '/book-malayali-psychologists', sessions: 4 }],
    byChannel: [{ key: 'paid_social', sessions: 9 }, { key: 'direct', sessions: 5 }],
    rows: [
      {
        session: 'c0ffee00-1111-4222-8333-444455556666', startedAt: '2026-09-23T05:44:00Z', lastAt: '2026-09-23T05:54:30Z',
        seconds: 630, landing: LONG_PATH, current: '/book/sneha-thomas', previous: '/service-page/sneha-thomas',
        pages: 5, events: 14, lastEvent: 'slot_selected', stage: 'Chose a date and time', furthest: 5,
        channel: 'paid_social', campaign: 'sept_malayali_therapists_retargeting', device: 'mobile', region: 'India',
      },
    ],
  },

  custom: {
    dims: ['page_group', 'device_class'],
    events: ['page_view'],
    available: {
      dimensions: ['day', 'dow', 'hour', 'channel', 'utm_source', 'utm_medium', 'utm_campaign', 'device_class', 'region', 'city', 'page_path', 'page_group', 'page_topic', 'landing_group', 'landing_topic', 'element', 'target', 'psychologist_id'],
      events: ['page_view', 'ui_click', 'booking_started', 'checkout_started', 'booking_completed', 'web_vital'],
    },
    summary: { events: 51391, sessions: 29155, visitors: 23371, value: 0 },
    rows: [
      { page_group: 'listing', device_class: 'mobile', events: 19567, sessions: 18301, visitors: 16696, value: 0 },
      { page_group: 'home', device_class: 'desktop', events: 4123, sessions: 3454, visitors: 2766, value: 0 },
    ],
  },

  saved: { reports: [{ id: 'r1', name: 'Mobile listing traffic', config: { dims: ['page_group', 'device_class'], events: ['page_view'] }, updated_at: '2026-09-20T10:00:00Z' }] },
};

export default SAMPLES;
