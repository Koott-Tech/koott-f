/**
 * Per-therapist extras the database has no columns for yet.
 *
 * The profile design carries an FAQ block and a Reels strip. `psychologists`
 * has neither (there are no faq_question_* columns in this database, and no
 * reels table), so they live here, keyed by the same slug the profile route
 * uses, until the schema catches up.
 *
 * DEFAULT_FAQS are true of every Koott therapist — how a session runs, what it
 * costs, how rescheduling works — so a profile with nothing of its own still
 * answers the questions people actually ask. Anything therapist-specific has to
 * be written per slug; nothing here is invented about a named practitioner.
 *
 * Reels are only shown for slugs listed below, so a profile without them simply
 * has no Reels section rather than a row of empty frames.
 */

export const DEFAULT_FAQS = [
  {
    q: 'How does a session work?',
    a: 'Sessions run over a private video call. You pick a date and time here, and '
      + 'the link plus a reminder reach you by email before the session.',
  },
  {
    q: 'How long is a session?',
    a: 'An individual session is 50 minutes. A couple session runs 1 hour 20 minutes.',
  },
  {
    q: 'Can I reschedule?',
    a: 'Yes — up to 24 hours before the session, from the link in your confirmation email.',
  },
];

/** slug -> { faqs?, reels? } */
export const THERAPIST_EXTRAS = {
  // DEMO profiles. Removed alongside the rows themselves; see
  // backend/scripts/seedDemoTherapists.js.
  'anjali-menon': {
    faqs: [
      {
        q: 'What does Anjali specialise in?',
        a: 'Anxiety, depression and stress — with an emphasis on the pressure that '
          + 'builds up at work and inside families.',
      },
      {
        q: 'Which languages can I have my session in?',
        a: 'English and Malayalam.',
      },
    ],
    reels: [
      { href: 'https://www.instagram.com/koott.in/', caption: 'Naming what you feel' },
      { href: 'https://www.instagram.com/koott.in/', caption: 'A 2-minute reset' },
      { href: 'https://www.instagram.com/koott.in/', caption: 'When sleep will not come' },
    ],
  },
  'rahul-nair': {
    reels: [
      { href: 'https://www.instagram.com/koott.in/', caption: 'Talking to your partner' },
      { href: 'https://www.instagram.com/koott.in/', caption: 'Sunday night dread' },
      { href: 'https://www.instagram.com/koott.in/', caption: 'Small steps that hold' },
    ],
  },
};

export const extrasFor = (slug) => THERAPIST_EXTRAS[slug] || {};

export default THERAPIST_EXTRAS;
