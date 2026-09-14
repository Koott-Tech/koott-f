/**
 * Sample (dummy) data for ConditionPageTemplate.
 *
 * This is the SHAPE the CMS should store for a condition / counselling landing
 * page. Every string here is placeholder copy — swap it per condition (anxiety,
 * depression, OCD…) without touching the layout component.
 *
 * When wiring this to the CMS, `counselling_services.content` should hold this
 * object; the columns benefits / info_cards / faqs / types / reviews already
 * exist on that table and map onto the sections below.
 */
export const conditionPageTemplateSample = {
  slug: 'sample-condition',

  seo: {
    title: 'Sample Condition Treatment | Koott',
    description: 'Placeholder meta description for the sample condition landing page template.',
  },

  hero: {
    eyebrow: '⚡️ Trusted by millions of Malayalees worldwide.',
    title: 'Best online counselling for Sample Condition in Malayalam',
    subtitle:
      'Placeholder subtitle. One or two lines describing who this page is for and what they can expect from a session.',
    verifiedBy: 'All the content below is verified by experienced health psychologist, Dr. Placeholder Name.',
    primaryCta: { label: 'Book Now', href: '/counselling' },
    secondaryCta: { label: 'Whatsapp Us', href: '#' },
    mediaLabel: 'Hero video / image',
  },

  stats: [
    { value: '9 out of 10', label: 'Placeholder stat description explaining what this number represents for clients.' },
    { value: '92%', label: 'Placeholder stat description explaining what this number represents for clients.' },
    { value: '2x better', label: 'Placeholder stat description explaining what this number represents for clients.' },
    { value: '33,400+', label: 'Placeholder stat description explaining what this number represents for clients.' },
  ],

  therapists: {
    eyebrow: 'We made it easy for you to choose.',
    title: 'Experienced Malayali Therapists for Sample Condition.',
    filters: ['Specialist', 'Concern'],
    // In production these come from /api/public/psychologists; the shape below is
    // what the card expects. `photo` may be null — the card falls back to a tinted
    // block so a missing image never breaks the layout.
    items: [
      {
        name: 'Sreelakshmi N',
        role: 'Consultant Psychologist',
        experience: '3+ years of experience',
        languages: 'English and Malayalam',
        priceFrom: 'Starting from INR999',
        bio: 'A Consultant Psychologist with a Master’s in Psychology, she supports emotional, behavioral, academic, and family concerns through a compassionate, client-centered approach, helping individuals build resilience and improve overall well-being.',
        availabilityLabel: 'Next Availability',
        availability: 'Available in 47 min',
        modes: ['audio', 'video'],
        photo: null,
        profileHref: '#',
        bookHref: '#',
      },
      {
        name: 'Dr. Thaniya K Leela',
        role: 'Consultant Psychologist | PhD',
        experience: '7+ years of experience',
        languages: 'Malayalam & English',
        priceFrom: 'Starting from INR2299',
        bio: 'With a Ph.D. in Psychology and M.Phil. (UiB, Norway), she supports adolescents, women, parents, and couples through life’s challenges. Using a trauma-informed approach, she fosters healing, resilience, and growth in a safe, supportive space.',
        availabilityLabel: 'Next Availability',
        availability: 'Available in 2 hr 15 min',
        modes: ['audio', 'video'],
        photo: null,
        profileHref: '#',
        bookHref: '#',
      },
      {
        name: 'Aparna Menon',
        role: 'Clinical Psychologist | M.Phil',
        experience: '5+ years of experience',
        languages: 'Malayalam, English & Tamil',
        priceFrom: 'Starting from INR1499',
        bio: 'A Clinical Psychologist working with anxiety, depression and burnout, she blends CBT with mindfulness-based practice to help clients understand their patterns and build steadier day-to-day routines.',
        availabilityLabel: 'Next Availability',
        availability: 'Available tomorrow, 10:00',
        modes: ['audio', 'video'],
        photo: null,
        profileHref: '#',
        bookHref: '#',
      },
      {
        name: 'Rahul Varghese',
        role: 'Psychotherapist',
        experience: '4+ years of experience',
        languages: 'English and Malayalam',
        priceFrom: 'Starting from INR899',
        bio: 'A Psychotherapist focused on men’s mental health, relationships and work stress, offering a direct, practical style of therapy with clear goals agreed session by session.',
        availabilityLabel: 'Next Availability',
        availability: 'Available in 25 min',
        modes: ['audio', 'video'],
        photo: null,
        profileHref: '#',
        bookHref: '#',
      },
    ],
  },

  howItWorks: {
    title: 'How Online Counselling Works at Koott',
    subtitle: 'Placeholder line describing how simple it is to get started.',
    steps: [
      { title: 'Choose a Therapist', body: 'Placeholder description of step one.' },
      { title: 'Book a Session', body: 'Placeholder description of step two.' },
      { title: 'Attend Online Session', body: 'Placeholder description of step three.' },
      { title: 'Continuous Support', body: 'Placeholder description of step four.' },
    ],
  },

  why: {
    title: 'Why Koott for Sample Condition?',
    subtitle: 'Placeholder line on why choosing the right support matters.',
    items: [
      { title: 'Experienced Therapist', body: 'Placeholder benefit description.' },
      { title: 'Practical Techniques', body: 'Placeholder benefit description.' },
      { title: 'Personalized Support', body: 'Placeholder benefit description.' },
      { title: 'Continuous Guidance', body: 'Placeholder benefit description.' },
    ],
  },

  plans: {
    title: 'Affordable Online Therapy Plans',
    subtitle: 'Placeholder line about flexible and affordable plans.',
    items: [
      { name: 'Counselling / Psychotherapy', body: 'Placeholder plan description.', from: 749 },
      { name: 'Psychiatry', body: 'Placeholder plan description.', from: 1699 },
      { name: 'Package Sessions', body: 'Placeholder plan description.', from: 2499 },
      { name: 'Support Group', body: 'Placeholder plan description.', from: 599 },
    ],
  },

  reviews: {
    eyebrow: 'Reviews',
    title: '4.9 in Google reviews, Touched more than a million human lives.',
    // `source` drives the badge top-right: google | whatsapp | zoho. Supply
    // `sourceLogo` / `avatar` image URLs to replace the text mark and tint block.
    items: [
      {
        quote: 'Being in a new country was not easy. Our relationship felt distant, and we struggled to express what we were struggling with. But we finally open up, at our own pace, in online counselling by Koott.',
        name: 'Divya Menon', age: '37 years', source: 'zoho', sourceLogo: null, avatar: null,
      },
      {
        quote: 'Things had been really stressful lately… we were constantly misunderstanding each other. I was holding back what I actually felt. Counselling helped us learn to express things better.',
        name: 'Jithin Mohan', age: '36 years', source: 'whatsapp', sourceLogo: null, avatar: null,
      },
      {
        quote: 'There were a lot of unresolved issues, and we struggled to understand what we felt. Counselling was the best decision we made, we understand each other much better and resolve issues.',
        name: 'Fathima Noora', age: '26 years', source: 'google', sourceLogo: null, avatar: null,
      },
      {
        quote: 'There were constant misunderstandings and it gets even messier when family interferes to fix it. Counselling by a professional therapist helped us resolve issues and hear each other out.',
        name: 'Praveen', age: '32 years', source: 'zoho', sourceLogo: null, avatar: null,
      },
      {
        quote: 'Online counselling helped me regain control when everything felt overwhelming. My therapist helped me track small improvements week by week.',
        name: 'Anjali R', age: '29 years', source: 'google', sourceLogo: null, avatar: null,
      },
    ],
  },

  ctaBand: {
    text: 'Take the first step today—connect with a licensed therapist in Kerala to improve your wellbeing and build a stronger, healthier life.',
    cta: { label: 'Book Now', href: '/counselling' },
  },

  about: {
    title: 'What is Sample Condition?',
    paragraphs: [
      'Placeholder explanatory paragraph one. Define the condition in plain language, and separate it from everyday stress or worry.',
      'Placeholder explanatory paragraph two. Mention how it presents locally, note that it is a recognised condition rather than a personal weakness, and end on the fact that it is treatable.',
    ],
    pillars: [
      { title: 'Mind', body: 'Placeholder description of how the condition affects thinking.' },
      { title: 'Emotions', body: 'Placeholder description of how the condition affects feelings.' },
      { title: 'Energy', body: 'Placeholder description of how the condition affects energy levels.' },
      { title: 'Life', body: 'Placeholder description of how the condition affects daily life.' },
    ],
  },

  symptoms: {
    title: 'Common Signs and Symptoms',
    subtitle: 'Placeholder line about recognising signs early.',
    items: Array.from({ length: 9 }, (_, i) => ({
      title: `Symptom ${i + 1}`,
      body: 'Placeholder description of this sign, written in second person.',
    })),
  },

  midCta: {
    text: 'Placeholder supportive line reminding the reader they are not alone.',
    cta: { label: 'Book a Session', href: '/counselling' },
  },

  seekHelp: {
    title: 'When should you seek help?',
    subtitle: 'Placeholder line about when professional support becomes worthwhile.',
    items: Array.from({ length: 6 }, (_, i) => ({
      title: `Signal ${i + 1}`,
      body: 'Placeholder description of a situation where professional help is advisable.',
    })),
  },

  bookBand: {
    title: 'Book a session with our psychologist.',
    text: 'Placeholder line about what the reader will gain from a session.',
    cta: { label: 'Talk to a Psychologist', href: '/counselling' },
  },

  types: {
    title: 'Types We Treat',
    subtitle: 'Placeholder line about the different forms this condition takes.',
    items: Array.from({ length: 6 }, (_, i) => ({
      title: `Type ${i + 1}`,
      body: 'Placeholder description of this variant of the condition.',
    })),
  },

  therapyHelps: {
    title: 'How Does Therapy Help?',
    subtitle: 'Placeholder line on what therapy actually does.',
    items: Array.from({ length: 6 }, (_, i) => ({
      title: `Benefit ${i + 1}`,
      body: 'Placeholder description of one way therapy helps.',
    })),
  },

  finalCta: {
    text: 'Placeholder closing call to action.',
    cta: { label: 'View Therapists', href: '/counselling' },
  },

  faqs: Array.from({ length: 5 }, (_, i) => ({
    q: `Placeholder frequently asked question ${i + 1}?`,
    a: 'Placeholder answer. Two or three sentences, plain language, no jargon.',
  })),
};

export default conditionPageTemplateSample;
