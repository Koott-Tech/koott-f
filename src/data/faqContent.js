/**
 * Copy for /faq. Built-in content; the admin "Pages → FAQ" editor stores
 * changes under site-config `site_faq` (merged per section, lib/siteContent.js).
 *
 * The questions are the home page FAQ (data/koottHomeContent.js → FAQ), listed
 * in its tab order, so the two pages never disagree. The old MyKoott
 * child-counselling answers are gone.
 */

import { FAQ } from './koottHomeContent';

export const FAQ_DEFAULTS = {
  intro: {
    title: 'Frequently Asked Questions',
    lead: 'Answers to common questions about Koott — booking, sessions, payments and privacy.',
  },
  items: Object.values(FAQ.groups)
    .flat()
    .map(({ q, a }) => ({ q, a })),
};

export default FAQ_DEFAULTS;
