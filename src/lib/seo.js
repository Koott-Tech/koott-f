/**
 * Per-page SEO metadata for the pages ported from koott.in.
 *
 * Titles and descriptions are the ones the live site serves, so search equity
 * carries over when DNS moves. Titles are `absolute` on purpose — the root
 * layout applies a "%s | Koott" template, and these already carry their own
 * brand suffix.
 *
 * Canonicals point at the URL the live site canonicalises to, so our alias
 * routes (/about, /career, /contact-us) consolidate rather than compete:
 *   /about        -> /about-us
 *   /career       -> /jobs
 *   /contact-us   -> /get-in-touch
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://www.koott.in'
).replace(/\/+$/, '');

const OG_IMAGE = '/logo.png';

/**
 * Build a Next.js metadata object.
 * @param {{title:string, description:string, canonical:string, image?:string,
 *          type?:string, publishedTime?:string, noIndex?:boolean}} opts
 */
export function buildMetadata({
  title, description, canonical, image = OG_IMAGE, type = 'website',
  publishedTime, noIndex = false,
}) {
  const meta = {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type,
      siteName: 'Koott',
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.startsWith('http') ? image : `${SITE_URL}${image}`],
    },
  };
  if (noIndex) meta.robots = { index: false, follow: false };
  return meta;
}

/** Copy taken from the equivalent live koott.in pages. */
export const PAGE_SEO = {
  home: {
    title: 'Online Counselling in Malayalam | Koott',
    description:
      'Struggling with stress, anxiety, relationship issues, or low mood? Talk to experienced Malayali psychologists at Koott. Private online counselling in Malayalam.',
    canonical: '/',
  },
  about: {
    title: 'About Us | Mental Health Kerala',
    description:
      'Meet the team behind Koott — Kerala’s first online counselling platform built for Malayalis, rooted in empathy and real human connection.',
    canonical: '/about-us',
  },
  blog: {
    title: 'Blog | കൂട്ടക്ഷരങ്ങൾ | Mental Health Updates for Kerala | Koott',
    description:
      "Koott calls our blogs 'കൂട്ടക്ഷരങ്ങൾ' — our goal is to bring constant updates on mental health from Kerala, for Kerala.",
    canonical: '/blog',
  },
  contact: {
    title: 'Talk to Koott | No. 1 platform for Malayalee mental health care | Jobs | Partnerships',
    description:
      'Talk to Koott, the #1 platform for Malayalee mental health. Get confidential support in Malayalam from psychologists & counsellors, or reach us about jobs and partnerships.',
    canonical: '/get-in-touch',
  },
  careers: {
    title: 'Hiring Psychologists, Psychiatrists | Internship with Koott',
    description:
      "Join Koott's mental health team. We're hiring qualified psychologists and psychiatrists in Kerala, and run an internship programme too. Make a difference in Malayali mental health.",
    canonical: '/jobs',
  },
  therapists: {
    title: 'Malayali Psychologist (List) | Koott',
    description:
      'Meet certified Malayali psychologists at Koott. Get private, online counselling in Malayalam with care and understanding.',
    canonical: '/book-malayali-psychologists',
  },
};

/** Organization + WebSite JSON-LD for the home page. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Koott',
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        description:
          'Online counselling in Malayalam with licensed Malayali psychologists and psychiatrists.',
        areaServed: 'Worldwide',
        contactPoint: [{
          '@type': 'ContactPoint',
          telephone: '+91-95671-61611',
          contactType: 'customer service',
          email: 'admin@koott.in',
          availableLanguage: ['Malayalam', 'English'],
        }],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Koott',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };
}

/** Article JSON-LD for a blog post. */
export function articleJsonLd(post, canonical) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.featured_image_url ? [post.featured_image_url] : undefined,
    datePublished: post.created_at || undefined,
    dateModified: post.updated_at || post.created_at || undefined,
    author: { '@type': 'Person', name: post.author_name || 'Koott' },
    publisher: {
      '@type': 'Organization',
      name: 'Koott',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${canonical}` },
  };
}

/** JobPosting JSON-LD for a career detail page. */
export function jobPostingJsonLd(job, canonical) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || '',
    datePosted: job.created_at || undefined,
    employmentType: (job.employment_type || '').toUpperCase().replace(/[^A-Z]/g, '_') || undefined,
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Koott',
      sameAs: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
    jobLocationType: /remote/i.test(job.location || '') ? 'TELECOMMUTE' : undefined,
    applicantLocationRequirements: /remote/i.test(job.location || '')
      ? { '@type': 'Country', name: 'India' } : undefined,
    jobLocation: /remote/i.test(job.location || '') ? undefined : {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'IN' },
    },
    url: `${SITE_URL}${canonical}`,
  };
}

/** Renders a JSON-LD block. Server-safe. */
export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
