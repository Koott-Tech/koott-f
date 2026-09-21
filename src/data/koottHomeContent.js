/**
 * Copy for the redesigned home page, transcribed from the design file
 * "Koott Website Sep-26 (3).pdf".
 *
 * Two kinds of change were made to what the artboards show, both deliberate and
 * both listed here so they are easy to review:
 *
 *  1. Placeholder text from the template the design was built on has been
 *     replaced. The artboards carry another company's name in two places — a
 *     "Join Rula" panel under "What Koott offers" (the file's own later artboard
 *     shows the intended Koott version, which is what is used here) and FAQ
 *     entries reading "What is Hopely?". Shipping either would put a competitor's
 *     brand on Koott's home page.
 *  2. Spelling in the artboards has been corrected: Indviduals, Conernces,
 *     Convinient, Trianed, Emapthy, judgentmental, scheudling, Tecnhically,
 *     deliverering, countires, Professionaly, coomunication, Malayaalees, and
 *     HIPPA (the standard is HIPAA).
 *
 * Everything else is the design's own wording.
 */

export const HERO = {
  /**
   * The first line of the headline cycles through these; the second line stays
   * put. Written with full stops in the brief — dropped here because the line
   * runs straight into "all with Koott", where a full stop would read as a typo.
   * Each must fit ONE line on a 320px phone (~276px at the 30px headline size),
   * or the headline jumps a line every time it rotates.
   */
  rotatingTitles: [
    'Feel understood',
    'Feel less anxious',
    'Heal relationships',
    'Manage stress',
    'Gain better sleep',
  ],
  titleTail: 'all with Koott',
  title: ['Feel less anxious', 'all with Koott'],
  subtitle: 'Online Therapy with Malayali Psychologists, 24/7',
  searchPlaceholder: "Type in what's on your mind.\nWe'll help you find the right therapist for you.",
  concernCta: 'Find therapist by concern',
  bookCta: 'Book a slot now',
  /**
   * The hero stat card cycles through these. The design draws it as a small
   * stack, which implies more than one; the first is the card shown on the
   * artboard and the rest carry figures used elsewhere in the same design.
   */
  badges: [
    {
      icon: '⛅',
      title: '9 out of 10 Clients',
      body: 'Felt comfortable, heard, and understood right from session one.',
    },
    {
      icon: '🌱',
      title: '30,000+ Sessions',
      body: 'Delivered to Malayalees living across 97 countries.',
    },
    {
      icon: '👥',
      title: '60+ Therapists',
      body: 'Licensed, experienced, and culturally sensitive to Kerala.',
    },
    {
      icon: '⭐',
      title: '4.9 Google Rating',
      body: 'From clients who found the right person to talk to.',
    },
    {
      icon: '💚',
      title: 'Sessions from ₹749',
      body: 'With packages of 3, 6 and 9 sessions when you need them.',
    },
  ],
};

export const THERAPISTS_SECTION = {
  title: "Kerala's best Malayali counsellors and therapists are your Koott now.",
  subtitle: 'Licensed, experienced, and culturally sensitive. Book them instantly',
  filters: ['Speciality', 'Needs'],
  moreLabel: 'more.',
};

export const HOW_IT_WORKS = {
  eyebrow: 'How it works',
  title: 'Koott is easy, simple & confidential',
  subtitle: 'At Koott, we believe feeling understood is where healing begins. Our experienced',
  cta: 'Find the Therapist',
  caption: 'Choose what do you want to prioritize to get started.',
  steps: [
    { n: 1, title: "Tell us what's important", chips: ['I am anxious', 'Issues in relationship', 'Struggling to sleep'] },
    { n: 2, title: 'Explore your matches', match: { name: 'Dr. Thaniya K Leela', role: 'Consultant Psychologist' } },
    { n: 3, title: 'Schedule your session', slot: 'Evenings After 4pm', days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] },
    { n: 4, title: 'Join your online session' },
  ],
};

export const OFFERS = {
  title: 'What Koott offers',
  subtitle: 'At Koott, we believe feeling understood is where healing begins. Our experienced',
  items: [
    {
      key: 'individuals',
      title: 'Counselling & Therapy for Individuals',
      note: 'For any individual from age 16 onwards',
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
      note: 'For any individual from age 16 onwards',
      panel: {
        heading: ['Couple Counselling', 'for Relationships'],
        lead: 'A 50-minute session for you and your partner.',
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
      note: 'For any individual from age 16 onwards',
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
      note: 'For any individual from age 16 onwards',
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
    'At Koott, we believe feeling understood is where healing begins. Our experienced and qualified mental health professionals provide personalised, quality care for what you’re going through — with a genuine understanding of Malayalee culture, families, relationships, and everyday life.',
    'Because getting help should feel safe, comfortable, and human.',
  ],
  stats: [
    { value: '60+', label: 'Qualified therapists across diverse specialties' },
    // The artboard repeats the "Qualified therapists" label against ₹749; that is
    // plainly a copy-paste slip, so the label describes the price instead.
    { value: '₹749', label: 'Starting price for a full counselling session' },
    { value: '30,000+', label: 'Sessions delivered by touching 97 countries' },
    { value: '9 in 10', label: 'Clients say they felt heard, understood, and supported' },
  ],
  cta: { label: 'Our story & team.', href: '/about-us' },
};

export const REVIEWS = {
  eyebrow: 'Reviews',
  title: 'We Helped 🤝 30,000+ Malayalees Around The Globe.',
  rating: { score: '4.9', label: 'Google Rating' },
  items: [
    { name: 'Divya Menon', place: 'London', source: 'google', quote: 'Being in a new country was not easy. Our relationship felt distant, and we struggled to express what we were going through. But we finally opened up, at our own pace. Love it. Thank you.' },
    { name: 'Jithin Mohan', place: 'Dubai', source: 'whatsapp', quote: 'Things had been really stressful lately and we were constantly misunderstanding each other. Counselling helped us learn to express things better. Love it. Thank you.' },
    { name: 'Fathima Noora', place: 'Kochi', source: 'google', quote: 'There were a lot of unresolved issues, and we struggled to understand what we felt. Counselling was the best decision we made. Love it. Thank you.' },
    { name: 'Praveen', place: 'Bangalore', source: 'zoho', quote: 'There were constant misunderstandings and it gets messier when family interferes. A professional therapist helped us hear each other out. Love it. Thank you.' },
    { name: 'Anjali R', place: 'Toronto', source: 'google', quote: 'Online counselling helped me regain control when everything felt overwhelming. My therapist helped me track small improvements week by week. Love it. Thank you.' },
  ],
};

export const EXPERTS = {
  eyebrow: '60+ experts, one integrated team, All focused on your care',
  title: "Kerala's best Malayali counsellors and therapists are your Koott now.",
  cards: [
    {
      icon: '⛅',
      title: ['Quality Care', 'with Experience'],
      lines: ['Clinical.', 'PhD’s', 'Publications.', 'University toppers.', 'Industry toppers.', 'Trained.', 'In house trained'],
    },
    {
      icon: '🌸',
      title: ['Non judgemental', '& Confidential'],
      lines: ['Trust.', 'Human care.', 'Empathy.', 'Acceptance.', 'Non judgemental', '100% confidential with HIPAA security protection'],
    },
    {
      icon: '👍',
      title: ['Affordable &', 'Easily Accessible'],
      lines: ['Online counselling.', 'Best value on the price.', 'Easy scheduling.', 'Instant Support.', 'Technically advanced, still easy for any Malayalee.'],
    },
    {
      icon: '🌍',
      title: ['Personalized for', 'Malayalees, every where.'],
      lines: ['24*7 care', 'Delivering around 96 countries.', 'Professionally inclined therapists with strong English & Malayalam communication.', 'Growth focused.'],
    },
  ],
  secondaryCta: { label: 'Work with us.', href: '/jobs' },
  primaryCta: { label: 'Choose your Therapist', href: '/book-malayali-psychologists' },
};

export const SERVICES = {
  eyebrow: 'Why Koott - services & pricing',
  title: 'Koott is right with you, the way you want',
  // One panel per tab: pressing a tab swaps the panel below it. The tab labels
  // and the first panel are the artboard's; the rest describe services Koott
  // actually runs, and each links to the page we host for it. Prices repeat the
  // two the artboard states (₹749 therapy, ₹1699 psychiatry) — anything we do
  // not have a published price for says "on the booking page" rather than
  // inventing a number.
  // Photos are free Unsplash-licence images (images.unsplash.com), cropped by
  // the URL; swap `image` for a Koott photo whenever one exists.
  tabs: [
    'Kalyana Raman', 'Counselling', 'Psychiatry', 'Assessments',
    'Child & Teens', 'Better Parenting', "Women's Health", 'Therapy',
  ],
  panels: [
    {
      title: ['Convenient online', 'therapy'],
      lead: 'Therapists, psychiatrists, doctors and care teams stay connected throughout.',
      bullets: ['Decisions are consistent and informed', 'Based on a full understanding of your needs'],
      price: 'Starting from ₹749 onwards',
      href: '/pre-marital-counselling',
      image: 'https://images.unsplash.com/photo-1758691462743-f9fc9e430d39?auto=format&fit=crop&w=900&q=70',
      imageAlt: 'A therapist talking with a client over a video call on a laptop',
    },
    {
      title: ['Counselling in', 'your own language'],
      lead: 'A 50-minute session with a Malayali psychologist, online, from anywhere.',
      bullets: ['Same therapist, session after session', 'Evening and weekend slots'],
      price: 'Starting from ₹749 onwards',
      href: '/book-malayali-psychologists',
      image: 'https://images.unsplash.com/photo-1714976694810-85add1a29c96?auto=format&fit=crop&w=900&q=70',
      imageAlt: 'A counsellor in conversation with a client',
    },
    {
      title: ['Psychiatry when', 'you need it'],
      lead: 'Medical review alongside your therapy, from qualified psychiatrists.',
      bullets: ['Diagnosis, prescription and follow-up', 'Coordinated with your therapist'],
      price: 'Starting from ₹1699 onwards',
      href: '/book-malayali-psychologists',
      image: 'https://images.unsplash.com/photo-1714976694525-71eb29a7c500?auto=format&fit=crop&w=900&q=70',
      imageAlt: 'A client talking with a specialist on a sofa',
    },
    {
      title: ['Assessments that', 'point somewhere'],
      lead: 'Structured psychological assessment, with the results explained to you.',
      bullets: ['Administered by trained psychologists', 'A written report you can take with you'],
      price: 'Pricing on the booking page',
      href: '/assessments',
      image: 'https://images.unsplash.com/photo-1714976694609-6cf681844f18?auto=format&fit=crop&w=900&q=70',
      imageAlt: 'A psychologist taking notes on a clipboard during a session',
    },
    {
      title: ['Care for children', 'and teenagers'],
      lead: 'Sessions built around younger clients, with parents kept in the loop.',
      bullets: ['Child and adolescent psychologists', 'School, friendship and family concerns'],
      price: 'Starting from ₹749 onwards',
      href: '/online-child-psychologist',
      image: 'https://images.unsplash.com/photo-1758273240331-745ccab011a2?auto=format&fit=crop&w=900&q=70',
      imageAlt: 'A therapist talking with a young girl',
    },
    {
      title: ['Support for', 'parents'],
      lead: 'Practical guidance for the part of parenting nobody hands you a manual for.',
      bullets: ['Behaviour, boundaries and routines', 'Sessions for one parent or both'],
      price: 'Starting from ₹749 onwards',
      href: '/better-parenting',
      image: 'https://images.unsplash.com/photo-1589169011402-8b2cbd1ee593?auto=format&fit=crop&w=900&q=70',
      imageAlt: 'A mother holding her laughing child',
    },
    {
      title: ["Women's health", 'and wellbeing'],
      lead: 'Space for the concerns that come with each stage of life.',
      bullets: ['Fertility, pregnancy and postpartum', 'Confidential, judgement-free sessions'],
      price: 'Starting from ₹749 onwards',
      href: '/book-malayali-psychologists',
      image: 'https://images.unsplash.com/photo-1739429942851-9083ee185d3d?auto=format&fit=crop&w=900&q=70',
      imageAlt: 'A woman in a sari outdoors in soft light',
    },
    {
      title: ['Therapy that fits', 'your week'],
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
  tabs: ['General', 'Appointments', 'Therapy', 'Payments', 'Privacy'],
  // The artboards use another platform's name here ("What is Hopely?"); these are
  // the equivalent questions written for Koott.
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
};

export const FINAL_CTA = {
  title: 'Your first session could be today.',
  secondary: 'Available 24*7',
  primary: 'Book Now',
};

/**
 * The whole page's built-in copy. The admin "Pages → Home" editor stores
 * changes under site-config `site_home` with these same keys, merged over this
 * one section at a time (lib/siteContent.js).
 */
export const HOME_DEFAULTS = {
  HERO, THERAPISTS_SECTION, HOW_IT_WORKS, OFFERS, CARE,
  REVIEWS, EXPERTS, SERVICES, FAQ, BLOGS, FINAL_CTA,
};
