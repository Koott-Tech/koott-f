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
    // Cards are populated at runtime from /api/public/psychologists.
    placeholderCount: 3,
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
    title: '4.9 in Google reviews, touched more than a million human lives.',
    items: [
      { quote: 'Placeholder client review. Two or three sentences in the client’s own words about what changed for them.', name: 'Client A' },
      { quote: 'Placeholder client review. Two or three sentences in the client’s own words about what changed for them.', name: 'Client B' },
      { quote: 'Placeholder client review. Two or three sentences in the client’s own words about what changed for them.', name: 'Client C' },
      { quote: 'Placeholder client review. Two or three sentences in the client’s own words about what changed for them.', name: 'Client D' },
    ],
  },

  ctaBand: {
    text: 'Placeholder call to action encouraging the reader to take the first step today.',
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
