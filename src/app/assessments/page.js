/**
 * /assessments — index for the psychometric assessments service.
 *
 * Only /assessments/<slug> existed, so every "Assessments" link in the header,
 * footer and services tabs landed on a 404. The individual assessment pages are
 * listed here as soon as the CMS publishes any.
 */

import ServiceLanding from '@/components/ServiceLanding';

export const metadata = {
  title: 'Psychometric Assessments', // root layout appends "| Koott"
  description: 'Structured psychological assessments with Malayali psychologists, online, with the results explained to you.',
};

export default function AssessmentsIndex() {
  return (
    <ServiceLanding
      eyebrow="Assessments"
      title="Psychological assessments that point somewhere"
      lead="Structured assessments, administered online by trained Malayali psychologists, with the results walked through with you — not just handed over as a score."
      points={[
        { title: 'Done with a psychologist', body: 'Every assessment is run and scored by a trained psychologist, in English or Malayalam.' },
        { title: 'Explained, not just reported', body: 'You get time to go through what the results mean and what could help next.' },
        { title: 'A report you keep', body: 'A written summary you can take to a doctor, a school or your own therapist.' },
      ]}
      steps={[
        'Tell us what you want to understand — attention, mood, learning, or something else.',
        'Book a session with a psychologist who runs that assessment.',
        'Complete the assessment online, in one or more sittings.',
        'Go through the results together and decide on next steps.',
      ]}
      cta={{ label: 'Book an assessment', href: '/book-malayali-psychologists' }}
      listPath="assessments"
      listLabel="Available assessments"
    />
  );
}
