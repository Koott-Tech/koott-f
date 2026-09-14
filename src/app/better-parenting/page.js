/**
 * /better-parenting — index for the parent coaching service.
 *
 * Only /better-parenting/<slug> existed, so the header, footer and services
 * links landed on a 404. Individual programme pages are listed here as soon as
 * the CMS publishes any.
 */

import ServiceLanding from '@/components/ServiceLanding';

export const metadata = {
  title: 'Better Parenting', // root layout appends "| Koott"
  description: 'Online parenting support from Malayali child psychologists — behaviour, boundaries, routines and connection.',
};

export default function BetterParentingIndex() {
  return (
    <ServiceLanding
      eyebrow="Better Parenting"
      title="Support for the part of parenting nobody hands you a manual for"
      lead="Practical, judgement-free guidance from Malayali child psychologists — for one parent or both, online, at a time that works around your family."
      points={[
        { title: 'Behaviour and boundaries', body: 'Ways to respond to tantrums, defiance and screen battles that hold up in real life.' },
        { title: 'Routines that stick', body: 'Sleep, study and daily rhythms built around your child rather than against them.' },
        { title: 'Connection', body: 'Understanding what your child is feeling, and building a home where they can say it.' },
      ]}
      steps={[
        'Tell us what is happening at home and how old your child is.',
        'Meet a child psychologist who works with families like yours.',
        'Leave each session with something concrete to try that week.',
        'Come back to see what worked and adjust together.',
      ]}
      cta={{ label: 'Start parent coaching', href: '/book-malayali-psychologists' }}
      listPath="better-parenting"
      listLabel="Parenting programmes"
    />
  );
}
