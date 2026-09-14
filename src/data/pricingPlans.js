/**
 * Pricing plans shown on /plans-pricing.
 *
 * Ported from the live koott.in pricing widget. Two things about the source are
 * worth knowing, because they are deliberately not reproduced here:
 *
 *   1. The live "Single Session" card carries placeholder bullets left over from
 *      editing — "dsasdasdadasd", "asdasdas" and similar. They are dropped.
 *   2. The live "3 Session Pack" is priced at ₹280, which cannot be right next to
 *      ₹749 for one session. Rather than publish a price that would under-charge
 *      on a real booking, that plan is listed with `price: null` and marked
 *      `needsPrice`, so the page renders it as "Contact us" until the real figure
 *      is confirmed.
 *
 * Everything else — names, prices, validity, seniority — is exactly as published.
 */

export const PRICING_PLANS = [
  {
    id: 'single-session',
    name: 'Single Session',
    price: 749,
    unit: 'per session',
    note: '50 minute session',
    features: ['Counselling or Psychotherapy', 'One 50-minute session', 'Choose your own therapist'],
    highlight: false,
  },
  {
    id: 'three-session-pack',
    name: '3 Session Pack',
    price: null,
    needsPrice: true,
    unit: '',
    note: 'Three sessions',
    features: ['Three counselling sessions', 'Use them at your own pace'],
    highlight: false,
  },
  {
    id: 'well-being',
    name: 'Well being',
    price: 4999,
    unit: '',
    note: 'Valid for 45 days',
    features: ['With a junior psychologist', 'Valid for 45 days', 'Koottukaari'],
    highlight: false,
  },
  {
    id: 'well-being-plus',
    name: 'Well Being +',
    price: 7499,
    unit: '',
    note: 'Valid for 90 days',
    features: ['Valid for 90 days', 'Koottukaari'],
    highlight: false,
  },
  {
    id: 'wellbeing',
    name: 'Wellbeing',
    price: 6999,
    unit: '',
    note: 'Valid for 45 days',
    features: ['With a junior psychologist', 'Valid for 45 days', 'Koottukaari +'],
    highlight: true,
  },
  {
    id: 'wellbeing-plus',
    name: 'Wellbeing +',
    price: 9999,
    unit: '',
    note: 'Valid for 90 days',
    features: ['With a senior psychologist', 'Valid for 90 days', 'Koottukaari +'],
    highlight: false,
  },
];

/**
 * The whole /plans-pricing page's built-in content. The admin "Pages → Pricing"
 * editor stores changes under site-config `site_pricing`, merged over this one
 * top-level section at a time (lib/siteContent.js). A plan with `price: null`
 * shows "Contact us".
 */
export const PRICING_DEFAULTS = {
  intro: {
    title: 'Choose your pricing plan',
    lead: 'Pay for one session at a time, or take a package and keep the same therapist through it. Every plan is with a licensed Malayali psychologist.',
  },
  plans: PRICING_PLANS,
  fine: 'Prices are per person and include GST where applicable. Sessions can be rescheduled free of charge up to 24 hours before the appointment — see our refund policy.',
};

export default PRICING_PLANS;
