/**
 * Copy for the home page, transcribed from the two design files:
 *
 *   laptop  figma-ref/Home_Final.pdf           (1920 frame "Home_Final")
 *   phone   figma-ref/Home mobile Updated.pdf  (390 frame "Home mobile Updated")
 *
 * The page is static: this file is its only source of copy and nothing is
 * fetched for it. Where the two frames word something differently, the phone's
 * wording sits beside the laptop's under a `phone…` key and each size shows its
 * own.
 *
 * Changes made to what the frames show, all deliberate:
 *
 *  1. The FAQ answers are Koott's own. Both frames carry lorem ipsum there.
 *  2. Only the first two service panels are drawn; the other five tabs keep the
 *     copy and photos this page already had for them.
 *  3. The phone frame names two therapist chips "Consultant Psychologist"; the
 *     second is the laptop's "Clinical", which is what is used.
 *  4. "100% confidential, HIPAA-secure protection-" loses its stray hyphen.
 */

export const HERO = {
  /**
   * The first line cycles through these; the second line stays put. The first
   * one is the line both frames draw. Each must fit one line on a 320px phone.
   */
  rotatingTitles: [
    'Feel less anxious',
    'Feel understood',
    'Heal relationships',
    'Manage stress',
    'Gain better sleep',
  ],
  titleTail: 'all with Koott',
  // Whatever follows the last comma is set in green.
  subtitle: 'Online Therapy with Malayali Psychologists, 24/7',
  searchPlaceholder: "Type in what's on your mind. We'll help you find the right therapist for you.",
  concernCta: 'Find therapist by concern',
  bookCta: 'Book a slot now',
  /**
   * The stat card under the headline cycles through these. The first is the
   * card both frames draw; the phone words its line differently.
   */
  badges: [
    {
      title: '30,000+ Sessions',
      body: 'Delivered to Malayalees living across 97 countries.',
      phoneBody: 'Across 97 countries, where ever you are.',
    },
    // The rest are not drawn; each line fits the card on one line at both sizes.
    { title: '9 out of 10 Clients', body: 'Felt heard and understood from session one.', phoneBody: 'Felt heard from the very first session.' },
    { title: '60+ Therapists', body: 'Licensed, experienced and culturally sensitive.', phoneBody: 'Licensed and culturally sensitive.' },
    { title: '4.9 Google Rating', body: 'From clients who found the right person.', phoneBody: 'From clients who found their person.' },
    { title: 'Sessions from ₹749', body: 'With packages of 3, 6 and 9 sessions.', phoneBody: 'Packages of 3, 6 and 9 sessions.' },
  ],
};

export const THERAPISTS_SECTION = {
  title: "Kerala's best Malayali counsellors and therapists are your Koott now.",
  searchPlaceholder: 'Search',
  // The dropdown inside the search field: the language a session is held in.
  languageLabel: 'Online',
  languages: ['English', 'Malayalam'],
  // One-tap filters. `kind` says what a chip matches: 'role' the therapist's
  // title, 'need' what they work with or a title that names it. `match` is
  // one or more words, any of which counts.
  // `icon` is a file in public/design/home.
  quickFilters: [
    { label: 'Consultant Psychologist', kind: 'role', match: 'consultant', icon: 'tab-consultant' },
    { label: 'Psychiatrist', kind: 'role', match: 'psychiatr', icon: 'tab-psychiatrist' },
    { label: 'Clinical', kind: 'role', match: 'clinical', icon: 'tab-clinical' },
    { label: 'Sexual Health', kind: 'need', match: ['sex', 'intimacy', 'vaginismus', 'erectile', 'ejaculation', 'libido'], icon: 'tab-sexual' },
  ],
  moreLabel: 'View more therapists',
};

export const HOW_IT_WORKS = {
  eyebrow: 'How it works',
  phoneEyebrow: 'How Koott works',
  title: 'Koott is easy, simple & confidential',
  subtitle: 'At Koott, we believe feeling understood is where healing begins. Our experienced',
  cta: 'Find the therapist',
  phoneCta: 'Find your therapist',
  steps: [
    { n: 1, title: 'Choose your therapist', body: 'Browse and select your ideal psychologist easily and quickly.' },
    { n: 2, title: 'Book a session', body: 'Choose your slot & day Browse and choose your psychologist' },
    { n: 3, title: 'Start getting better', body: 'Start healing to a better life. Browse and choose your psychologist' },
  ],
};

export const OFFERS = {
  title: 'What Koott offers',
  subtitle: 'At Koott, we believe feeling understood is where healing begins. Our experienced',
  // Laptop order, two by two. The phone puts psychiatry second (`phoneOrder`).
  items: [
    {
      key: 'individuals',
      title: 'Counselling & Therapy for Individuals',
      short: ['Individuals', 'Therapy'],
      phoneOrder: 1,
      note: 'For any individual from age 16 onwards',
      icon: 'offer-1',
      panel: {
        heading: ['Counselling &', 'Therapy for Individuals'],
        lead: 'A 50-minute clinical & counselling session.',
        bullets: [
          'Experienced psychologists',
          'Evidence-based therapies',
          'Emotional & mental health concerns',
          'Complex cases',
          'Safe, judgement-free space',
        ],
        packages: 'Packages: 3, 6 & 9 sessions',
        link: { label: 'Explore Individual Conditions', href: '/anxiety-treatment' },
        price: 'Starting from ₹749',
      },
    },
    {
      key: 'couples',
      title: 'Couple Counselling for Relationships',
      short: ['Couple', 'Therapy'],
      phoneOrder: 3,
      note: 'For any individual from age 16 onwards',
      icon: 'offer-2',
      panel: {
        heading: ['Couple Counselling', 'for Relationships'],
        lead: 'An 80-minute session for you and your partner.',
        bullets: [
          'Communication and conflict',
          'Trust and intimacy',
          'Pre-marital and newlywed support',
          'Separation and divorce',
          'Safe, judgement-free space',
        ],
        packages: 'Packages: 3, 6 & 9 sessions',
        link: { label: 'Explore Relationship Conditions', href: '/marital-counseling' },
        price: 'Starting from ₹749',
      },
    },
    {
      key: 'sexual',
      title: 'Sexual & Intimacy Concerns',
      short: ['Sexual', 'Health'],
      phoneOrder: 4,
      note: 'For any individual from age 16 onwards',
      icon: 'offer-3',
      panel: {
        heading: ['Sexual & Intimacy', 'Concerns'],
        lead: 'A private, 50-minute session with a specialist.',
        bullets: [
          'Desire and arousal concerns',
          'Performance anxiety',
          'Painful intimacy and vaginismus',
          'Sexual trauma and healing',
          'Confidential, judgement-free space',
        ],
        packages: 'Packages: 3, 6 & 9 sessions',
        link: { label: 'Explore Sexual & Intimacy Concerns', href: '/sexual-intimacy-issues' },
        price: 'Starting from ₹749',
      },
    },
    {
      key: 'psychiatry',
      title: 'Psychiatry/Medicine support',
      short: ['Psychiatry', 'support'],
      phoneOrder: 2,
      note: 'For any individual from age 16 onwards',
      icon: 'offer-4',
      panel: {
        heading: ['Psychiatry &', 'Medicine support'],
        lead: 'Consultation with a qualified psychiatrist.',
        bullets: [
          'Diagnosis and medical review',
          'Prescription and follow-up',
          'Works alongside your therapy',
          'Complex and long-standing conditions',
          'Confidential clinical care',
        ],
        packages: 'Follow-up consultations available',
        link: { label: 'Explore Psychiatry support', href: '/mood-disorder-treatment' },
        price: 'Starting from ₹1699',
      },
    },
  ],
};

export const CARE = {
  title: ['Care that', 'understands you.'],
  paragraphs: [
    'At Koott, we believe feeling understood is where healing begins. Our experienced and qualified mental health professionals provide personalised, quality care for what you’re going through with a genuine understanding of Malayalee culture, families, relationships, and everyday life.',
    'Because getting help should feel safe, comfortable, and human.',
  ],
  // Line breaks are the laptop frame's own; the phone ignores them.
  stats: [
    { value: '60+', label: 'Qualified therapists across diverse\nspecialties' },
    { value: '₹749', label: 'Starting price for a full counselling\nsession' },
    { value: '30,000+', label: 'Sessions delivered by touching 97\ncountries' },
    { value: '9 in 10', label: 'Clients say they felt heard, understood,\nand supported' },
  ],
  cta: { label: 'Our Story & Team', href: '/about-us' },
};

export const REVIEWS = {
  title: 'We Helped 🤝 30,000+ Malayalees Around The Globe.',
  phoneTitle: ['We Helped 🤝 30,000+', 'Malayalees Around', 'The Globe.'],
  rating: { score: '4.9', label: 'Google Rating' },
  // Run in threes: the first of each three is the tall card, the other two
  // stack beside it, so the longest quotes go first in a three.
  items: [
    { name: 'Divya Menon', place: 'London', quote: 'Being in a new country was not easy. Our relationship felt distant, and we struggled to express what we were going through. But we finally opened up, at our own pace. Love it. Thank you.' },
    { name: 'Praveen', place: 'Bangalore', quote: 'There were constant misunderstandings and it gets messier when family interferes. A professional therapist helped us hear each other out. Love it. Thank you.' },
    { name: 'Anjali R', place: 'Toronto', pill: true, quote: 'Online counselling helped me regain control when everything felt overwhelming. My therapist helped me track small improvements week by week. Love it. Thank you.' },
    { name: 'Fathima Noora', place: 'Kochi', quote: 'There were a lot of unresolved issues, and we struggled to understand what we felt. Counselling was the best decision we made. Love it. Thank you.' },
    { name: 'Jithin Mohan', place: 'Dubai', quote: 'Things had been really stressful lately and we were constantly misunderstanding each other. Counselling helped us learn to express things better. Love it. Thank you.' },
  ],
};

export const EXPERTS = {
  title: "Kerala's best Malayali counsellors and therapists are your Koott now.",
  cards: [
    {
      title: 'Quality Care with Experience',
      lines: ['Clinical PhDs & Published Researchers', 'Top-ranked graduates and industry experts', 'Professionally trained & in-house experts'],
    },
    {
      title: 'Non judgemental & Confidential',
      lines: ['Trust, empathy & human-centered care', 'A safe space built on acceptance, not judgement', '100% confidential, HIPAA-secure protection'],
    },
    {
      title: 'Affordable & Easily Accessible',
      lines: ['Online counselling at the best value', 'Easy scheduling with instant support', 'Simple, accessible technology for every Malayalee'],
    },
    {
      title: 'Personalized for Malayalees, Everywhere.',
      lines: ['24/7 care, delivered to 96+ countries', 'Growth-focused, personalized support', 'Therapists fluent in English & Malayalam'],
    },
  ],
  secondaryCta: { label: 'Work with us', href: '/jobs' },
  primaryCta: { label: 'Choose your therapist', href: '/book-malayali-psychologists' },
};

export const SERVICES = {
  title: 'Koott is right with you, the way you want',
  // One panel per tab. The first two panels are the design's own; the frames
  // draw the rest as empty cards, so they keep the copy this page had.
  tabs: ['Counselling', 'Psychiatry', 'Assessments', 'Child & Teens', 'Better Parenting', 'Women’s Health', 'Therapy'],
  panels: [
    {
      title: 'Convenient online therapy',
      lead: 'Therapists, psychiatrists, doctors and care teams stay connected throughout.',
      bullets: ['Decisions are consistent and informed', 'Based on a full understanding of your needs'],
      price: 'Starting from ₹749 onwards',
      href: '/book-malayali-psychologists',
      image: '/design/home/service-1.webp',
      imageAlt: 'A therapist talking with a client over a video call on a laptop',
    },
    {
      title: 'Psychiatry when you need it',
      lead: 'Medical review alongside your therapy, from qualified psychiatrists.',
      bullets: ['Diagnosis, prescription and follow-up', 'Coordinated with your therapist'],
      price: 'Starting from ₹1699 onwards',
      href: '/book-malayali-psychologists',
      image: '/design/home/service-2.webp',
      imageAlt: 'A counsellor in conversation with a client',
    },
    {
      title: 'Assessments that point somewhere',
      lead: 'Structured psychological assessment, with the results explained to you.',
      bullets: ['Administered by trained psychologists', 'A written report you can take with you'],
      price: 'Pricing on the booking page',
      href: '/assessments',
      image: 'https://images.unsplash.com/photo-1714976694609-6cf681844f18?auto=format&fit=crop&w=900&q=70',
      imageAlt: 'A psychologist taking notes on a clipboard during a session',
    },
    {
      title: 'Care for children and teenagers',
      lead: 'Sessions built around younger clients, with parents kept in the loop.',
      bullets: ['Child and adolescent psychologists', 'School, friendship and family concerns'],
      price: 'Starting from ₹749 onwards',
      href: '/online-child-psychologist',
      image: 'https://images.unsplash.com/photo-1758273240331-745ccab011a2?auto=format&fit=crop&w=900&q=70',
      imageAlt: 'A therapist talking with a young girl',
    },
    {
      title: 'Support for parents',
      lead: 'Practical guidance for the part of parenting nobody hands you a manual for.',
      bullets: ['Behaviour, boundaries and routines', 'Sessions for one parent or both'],
      price: 'Starting from ₹749 onwards',
      href: '/better-parenting',
      image: 'https://images.unsplash.com/photo-1589169011402-8b2cbd1ee593?auto=format&fit=crop&w=900&q=70',
      imageAlt: 'A mother holding her laughing child',
    },
    {
      title: 'Women’s health and wellbeing',
      lead: 'Space for the concerns that come with each stage of life.',
      bullets: ['Fertility, pregnancy and postpartum', 'Confidential, judgement-free sessions'],
      price: 'Starting from ₹749 onwards',
      href: '/book-malayali-psychologists',
      image: 'https://images.unsplash.com/photo-1739429942851-9083ee185d3d?auto=format&fit=crop&w=900&q=70',
      imageAlt: 'A woman in a sari outdoors in soft light',
    },
    {
      title: 'Therapy that fits your week',
      lead: 'Evidence-based therapy, rescheduled up to 24 hours before your session.',
      bullets: ['Sessions on Google Meet, from anywhere', 'Packages of 3, 6 and 9 sessions'],
      price: 'Starting from ₹749 onwards',
      href: '/book-malayali-psychologists',
      image: 'https://images.unsplash.com/photo-1600194992699-40f82661a55d?auto=format&fit=crop&w=900&q=70',
      imageAlt: 'A woman smiling at her laptop at home',
    },
  ],
};

export const FAQ = {
  title: 'Frequently Asked Questions',
  phoneTitle: 'FAQ’s',
  tabs: ['General', 'Appointments', 'Therapy', 'Payments', 'Privacy'],
  groups: {
    General: [
      { q: 'What is Koott?', a: 'Koott is an online therapy platform built for Malayalees. You book a licensed Malayali psychologist and meet them over a secure video or audio call, from anywhere in the world.' },
      { q: 'Who are the psychologists on Koott?', a: 'Every therapist on Koott is a qualified, RCI-licensed mental health professional. Most hold an M.Phil or PhD, and all of them speak Malayalam and English.' },
      { q: 'Is Koott available worldwide?', a: 'Yes. Sessions are online, so you can book from Kerala, the Gulf, Europe, North America or anywhere else. Slots are offered in your local time.' },
    ],
    Appointments: [
      { q: 'How do I book a session?', a: 'Choose a therapist, pick a slot that suits you, and pay online. You receive a confirmation and a meeting link straight away.' },
      { q: 'Can I reschedule or cancel?', a: 'Yes. A session can be rescheduled at no cost up to 24 hours before it starts. Inside 24 hours the session cannot be rescheduled or refunded.' },
      { q: 'How soon can I get an appointment?', a: 'Many of our therapists have slots the same day or the next. Availability is shown on each therapist card before you book.' },
    ],
    Therapy: [
      { q: 'How long is a session?', a: 'An individual counselling or psychotherapy session runs for 50 minutes; a couple session runs for 1 hour 20 minutes.' },
      { q: 'How many sessions will I need?', a: 'That depends on what you are working through. Many people start to feel a difference within three to four sessions, and your therapist will discuss a plan with you.' },
      { q: 'Can I stay with the same therapist?', a: 'Yes, and we encourage it. Continuity is a large part of what makes therapy work.' },
    ],
    Payments: [
      { q: 'What does a session cost?', a: 'Sessions start from ₹749. The exact fee depends on the therapist you choose and is shown on their profile before you book.' },
      { q: 'Do you offer packages?', a: 'Yes — packages of 3, 6 and 9 sessions are available, and they work out cheaper than booking one at a time.' },
      { q: 'How do refunds work?', a: 'Any payment can be refunded within 30 days, provided the session has not been booked within 24 hours of its start time. See our refund policy for the detail.' },
    ],
    Privacy: [
      { q: 'Is what I say confidential?', a: 'Yes. What you discuss stays between you and your therapist, and our platform is HIPAA compliant.' },
      { q: 'Who can see my records?', a: 'Only you and your therapist. Clinical notes are never shared without your written consent, except where the law requires it.' },
      { q: 'Can I book without telling my family?', a: 'Yes. You can register with a nickname, and nothing is sent to anyone but you.' },
    ],
  },
};

export const BLOGS = {
  eyebrow: 'Blogs & Events',
  title: 'We touch millions of life every year',
  phoneTitle: ['Understand more', 'and become better.'],
  readMore: 'Read more',
};

export const FINAL_CTA = {
  eyebrow: 'Available 24x7',
  title: 'Your first session could be today.',
  primary: 'Book Now',
};

/** The whole page's copy, as one object (the admin preview merges over it). */
export const HOME_DEFAULTS = {
  HERO, THERAPISTS_SECTION, HOW_IT_WORKS, OFFERS, CARE,
  REVIEWS, EXPERTS, SERVICES, FAQ, BLOGS, FINAL_CTA,
};
