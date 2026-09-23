'use client';

/**
 * What every number on this dashboard means — in plain words first, then how it
 * is actually counted. One definition per metric, used everywhere, so "sessions"
 * on the funnel and "sessions" on Traffic over Time are the same thing.
 *
 * Where a number cannot mean what people assume, the definition says so rather
 * than letting the dashboard imply it.
 */

export const DEFINITIONS = [
  {
    term: 'Page view',
    plain: 'Someone opened a page.',
    how: 'One page_view event. A route change inside the site counts as a new page view; a re-render does not.',
  },
  {
    term: 'Session',
    plain: 'One visit — everything a person did before leaving.',
    how: 'Events sharing a session id, which the browser renews after 30 minutes of inactivity. Counted as distinct ids, so sessions never add up across rows of a table.',
  },
  {
    term: 'Unique visitor',
    plain: 'One browser, however many times it came back in the period.',
    how: 'Distinct anonymous ids. The same person on a phone and a laptop is two visitors, and clearing cookies makes a third. Only visitors who accepted analytics cookies are counted at all.',
  },
  {
    term: 'Bounce rate',
    plain: 'Visits where nothing but the landing page was seen.',
    how: 'Sessions with a single page view ÷ all sessions. A long read on one page still counts as a bounce.',
  },
  {
    term: 'Avg. session duration',
    plain: 'How long a visit lasted.',
    how: 'Last event minus first event, averaged. A session with one event has no duration and pulls the average down.',
  },
  {
    term: 'Engaged time',
    plain: 'How long the page was actually open and being looked at.',
    how: 'page_engaged events, which stop counting when the tab is hidden. Not the same as session duration.',
  },
  {
    term: 'Unique clicks',
    plain: 'How many different people clicked a button.',
    how: 'Distinct visitors with a ui_click on that element. Clicking five times counts once. CTR divides this by every visitor in the period, including those who never saw the button — the same way Wix counted it.',
  },
  {
    term: 'Booking start',
    plain: 'Someone opened the booking flow.',
    how: 'A booking_started event, per session. It does not mean a slot was held or anything was owed.',
  },
  {
    term: 'Booking / confirmed booking',
    plain: 'A session that was paid for.',
    how: 'booking_completed, written by the database trigger on payments once Razorpay verifies the payment — never from a browser reaching a success page. This is the only number on the dashboard that counts money changing hands.',
  },
  {
    term: 'Abandoned booking',
    plain: 'Someone started booking and did not pay.',
    how: 'Sessions that reached booking_started but never booking_completed inside the period. A booking finished the next day counts as abandoned in yesterday’s report and as a booking in today’s — the window is the rule, not a judgement about the person.',
  },
  {
    term: 'Conversion rate',
    plain: 'Of the people who got this far, how many went on.',
    how: 'Stated per report: the funnel divides each step by the one above; campaigns divide bookings by sessions. The numerator and denominator are named in every table header.',
  },
  {
    term: 'Attribution model',
    plain: 'Which visit gets the credit when someone came more than once.',
    how: 'Last non-direct (the default) credits the most recent visit that was not direct. First and last interaction credit exactly that. The lookback is the reporting window only — a visit before the start date cannot be seen, so a long-considered booking may look direct.',
  },
  {
    term: 'Core Web Vitals',
    plain: 'How fast and steady the site felt to real visitors.',
    how: 'Measured in the visitor’s own browser and reported once per page load. The 75th percentile is the number Google grades on. These are field measurements, so they will not match a PageSpeed test, and INP is approximated by the slowest interaction.',
  },
  {
    term: 'Search queries',
    plain: 'What people typed into Google before arriving.',
    how: 'Imported from Google Search Console, not measured here. Google withholds rare queries and reports on its own delay, so its clicks will not equal sessions in this dashboard.',
  },
  {
    term: 'Country and city',
    plain: 'Roughly where the visitor was.',
    how: 'Derived from the network the request came from. A VPN, a corporate network or a mobile carrier can place someone in the wrong city entirely, so read it as a pattern, not an address.',
  },
];

/** Which definitions matter on which report, so each page shows its own. */
export const FOR_REPORT = {
  'traffic-over-time': ['Page view', 'Session', 'Unique visitor', 'Bounce rate', 'Avg. session duration'],
  'traffic-sources': ['Session', 'Unique visitor', 'Attribution model'],
  location: ['Session', 'Unique visitor', 'Country and city'],
  'page-visits': ['Page view', 'Session', 'Engaged time', 'Bounce rate'],
  'button-clicks': ['Unique clicks', 'Session'],
  'blog-posts': ['Page view', 'Unique visitor', 'Engaged time'],
  'blog-time': ['Session', 'Unique visitor'],
  'search-queries': ['Search queries'],
  'booking-funnel': ['Session', 'Booking start', 'Booking / confirmed booking', 'Abandoned booking', 'Conversion rate'],
  'therapist-performance': ['Page view', 'Booking start', 'Booking / confirmed booking', 'Unique visitor'],
  journeys: ['Session', 'Unique visitor', 'Booking start', 'Booking / confirmed booking'],
  campaigns: ['Session', 'Attribution model', 'Booking / confirmed booking', 'Conversion rate'],
  technical: ['Core Web Vitals'],
  realtime: ['Session', 'Booking start'],
  custom: ['Session', 'Unique visitor', 'Page view'],
};
