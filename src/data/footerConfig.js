/**
 * Default footer configuration — the footer from "Koott Website Sep-26 (3).pdf".
 *
 * Read off the artboard (design-08/09 at 2x): a dark green band (#012F23) with
 * a brand column plus EXPERTS / CONDITIONS / SERVICES, a second row of
 * ABOUT KOOTT / OUR TERMS beside a JOIN US photo card, then a rule, the socials,
 * the copyright and sitemap, the crisis notice and the Tele-MANAS line, with
 * the HIPAA and certification marks on the right.
 *
 * Every link points at a route this app actually serves — the condition links
 * use the slugs imported from koott.in, not the artboard's display names.
 *
 * This is the shape stored in the CMS under `cms.key = 'site_footer'`. The
 * component prefers whatever the CMS returns and falls back to this, so the
 * footer is correct before the fetch resolves, when the backend is unreachable,
 * and before anyone has saved a config at all.
 *
 * Re-seed the CMS after changing this file:
 *   node backend/scripts/seedFooterConfig.js --force
 */

export const DEFAULT_FOOTER = {
  brand: {
    company: 'Koott Care Pvt. Ltd.',
    address: ['Mini Bypass Road, Puthiyara', 'Kozhikode, Kerala 673004'],
    email: 'care@koott.in',
    phone: '+91 8606 040400',
    // Wired to the same number the floating WhatsApp button uses.
    whatsapp: 'https://wa.me/918606040400',
  },

  columns: [
    {
      heading: 'EXPERTS',
      links: [
        { label: 'Therapists', href: '/book-malayali-psychologists' },
        { label: 'Clinical Psychologists', href: '/book-malayali-psychologists' },
        { label: 'Psychiatrists', href: '/book-malayali-psychologists' },
        { label: 'Senior Psychologists', href: '/book-malayali-psychologists' },
        { label: 'Couples Therapists', href: '/online-couples-therapy' },
        { label: 'Child and Youth Experts', href: '/online-child-psychologist' },
      ],
    },
    {
      heading: 'CONDITIONS',
      links: [
        { label: 'All Conditions', href: '/counselling' },
        { label: 'Anxiety', href: '/anxiety-treatment' },
        { label: 'Adult ADHD', href: '/adhd-treatment' },
        { label: 'Depression', href: '/depression-treatment' },
        { label: 'Panic Attacks', href: '/panic-attack-treatment' },
        { label: "Women's Health", href: '/postpartum-depression-treatment' },
        { label: 'Bipolar Disorder', href: '/mood-disorder-treatment' },
        { label: 'Social Anxiety', href: '/phobias-counselling' },
        { label: 'Personality Disorders', href: '/personality-disorder-management' },
        { label: 'Obsessive Compulsive Disorder (OCD)', href: '/ocd-treatment' },
        // The artboard prints "+10 more" three times; one honest link instead.
        { label: '+35 more conditions', href: '/counselling' },
      ],
    },
    {
      heading: 'SERVICES',
      links: [
        { label: 'Adult Therapy', href: '/book-malayali-psychologists' },
        { label: 'Adult Psychiatry', href: '/book-malayali-psychologists' },
        { label: 'Couples Therapy', href: '/online-couples-therapy' },
        { label: 'Sex Therapy', href: '/sexual-intimacy-issues' },
        { label: 'Child & Teen Counselling', href: '/online-child-psychologist' },
        { label: 'Better Parenting', href: '/better-parenting' },
        { label: 'Psychometric Assessments', href: '/assessments' },
      ],
    },
  ],

  lowerColumns: [
    {
      heading: 'ABOUT KOOTT',
      links: [
        { label: 'ABOUT US', href: '/about-us' },
        { label: 'CAREERS', href: '/jobs' },
        { label: 'CONTACT US', href: '/get-in-touch' },
        { label: 'BLOGS', href: '/blog' },
        { label: "HELP – FAQ'S", href: '/faq' },
        { label: 'FOR THERAPISTS', href: '/jobs' },
      ],
    },
    {
      heading: 'OUR TERMS',
      links: [
        { label: 'TERMS & CONDITIONS', href: '/terms-and-conditions' },
        { label: 'CLINICAL REPORT RELEASE POLICY', href: '/privacy-policy' },
        { label: 'PRIVACY POLICY', href: '/privacy-policy' },
        { label: 'THERAPY AGREEMENT', href: '/therapy-agreement' },
        { label: 'REFUND POLICY', href: '/refund-policy' },
        { label: 'MINOR REPORTING POLICY', href: '/therapy-agreement' },
        { label: 'INFORMATION & SECURITY POLICY', href: '/privacy-policy' },
      ],
    },
  ],

  join: { label: 'JOIN US', href: '/jobs' },

  socials: [
    { icon: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/koott.in/' },
    { icon: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/koott.in/' },
    { icon: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@koott' },
    { icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/koott/' },
  ],

  copyright: '© Koott 2026',
  sitemap: { label: 'SITEMAP', href: '/sitemap.xml' },

  crisis:
    'If you or someone you know is in immediate danger or facing a serious mental health crisis, '
    + "please don't face it alone. Reach out to a trusted person and contact a helpline or visit "
    + 'the nearest hospital for immediate support.',

  helpline: 'For urgent mental health support, call Tele-MANAS: 1-800-891-4416.',

  marks: [
    { icon: 'hipaa', label: 'HIPAA' },
    { icon: 'certified', label: 'CERTIFIED' },
  ],
};

/**
 * Merge a stored config over the defaults. Only whole top-level sections are
 * replaced, so a CMS entry that sets just `columns` keeps the shipped brand
 * block, legal text and marks rather than blanking them.
 */
export function mergeFooterConfig(stored) {
  if (!stored || typeof stored !== 'object') return DEFAULT_FOOTER;
  const out = { ...DEFAULT_FOOTER };
  for (const key of Object.keys(DEFAULT_FOOTER)) {
    const v = stored[key];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;   // never blank a section
    out[key] = v;
  }
  return out;
}

export default DEFAULT_FOOTER;
