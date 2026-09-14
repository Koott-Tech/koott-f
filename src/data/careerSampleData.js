/**
 * Dummy job openings, shaped exactly like a row from the `careers` table so the
 * listing and detail pages can be built and reviewed before the CMS has content.
 * Both pages call /api/careers first and fall back to this only when the API
 * returns nothing.
 *
 * Columns mirrored from supabase/migrations/0001_initial_schema.sql:
 *   slug · title · description · location · employment_type
 *   min_experience_years · max_experience_years · status · content
 *
 * `description` is the markdown-ish shape the detail page renders:
 *   "## " section heading, "1. " / "- " list items, blank line between blocks.
 */

export const CAREER_SAMPLE_JOBS = [
  {
    id: 'job-1',
    slug: 'consultant-psychologist-full-time',
    title: 'Consultant Psychologist — Full-time',
    location: 'Remote',
    employment_type: 'Full-time',
    min_experience_years: 1,
    max_experience_years: 5,
    status: 'published',
    description: `## About the Role

As a Consultant Psychologist at Koott, you will focus on delivering high-quality therapeutic consultations while contributing to the overall clinical experience of our clients. This role is ideal for someone who enjoys focused clinical work and wants to be part of a collaborative mental health team.

This is a full-time remote role with structured training and shift-based scheduling.

## Responsibilities

1. Conduct 1:1 therapy and consultation sessions with clients across concerns like stress, anxiety, depression, and emotional difficulties
2. Understand client concerns and offer structured, evidence-based psychological support
3. Support case understanding and contribute to basic treatment planning when needed
4. Maintain clear and professional session notes
5. Participate in supervision, case discussions, and internal learning sessions
6. Work closely with senior psychologists to ensure quality and continuity of care

## Requirements

- Master's degree in Psychology (Clinical or Counselling)
- Comfortable conducting sessions in Malayalam and English
- Reliable internet connection and a private space for sessions`,
  },
  {
    id: 'job-2',
    slug: 'consultant-psychologist-part-time',
    title: 'Consultant Psychologist — Part-Time',
    location: 'Remote',
    employment_type: 'Part-time',
    status: 'published',
    description: `## About the Role

A part-time consulting role for psychologists who want steady clinical work alongside their existing practice or studies.

## Responsibilities

1. Conduct scheduled 1:1 sessions within your chosen availability
2. Maintain clear session notes
3. Join monthly supervision and case discussions

## Requirements

- Master's degree in Psychology
- A minimum of 8 available session hours per week`,
  },
  {
    id: 'job-3',
    slug: 'psychosexual-counsellor-part-time',
    title: 'Psychosexual Counsellor — Part-Time',
    location: 'Remote',
    employment_type: 'Part-time',
    status: 'published',
    description: `## About the Role

Support clients through sexual and intimacy concerns in a confidential, non-judgemental setting.

## Requirements

- Certification or supervised training in psychosexual counselling
- Comfort discussing sexual health openly and sensitively`,
  },
  {
    id: 'job-4',
    slug: 'client-care-executive-full-time',
    title: 'Client Care Executive — Full-time',
    location: 'Remote',
    employment_type: 'Full-time',
    status: 'published',
    description: `## About the Role

The first person a client speaks to. You will guide people to the right therapist and stay with them through booking.

## Responsibilities

1. Respond to enquiries across WhatsApp, phone and email
2. Match clients to a suitable therapist and slot
3. Follow up on bookings and reschedules

## Requirements

- Fluent Malayalam and English
- Calm, patient communication under pressure`,
  },
  {
    id: 'job-5',
    slug: 'child-behavioural-therapist-remote',
    title: 'Child Behavioural Therapist – Remote',
    location: 'Remote',
    employment_type: 'Full-time',
    status: 'published',
    description: `## About the Role

Work with children and their families on behavioural concerns, using structured, play-informed approaches.

## Requirements

- Training in child psychology or behavioural therapy
- Experience working with parents as part of the plan`,
  },
  {
    id: 'job-6',
    slug: 'seo-executive-intern',
    title: 'SEO Executive Intern',
    location: 'Remote',
    employment_type: 'Internship',
    status: 'published',
    description: `## About the Role

Help more Malayalees find mental health support by improving how our content is discovered.

## Responsibilities

1. Keyword research for condition and city pages
2. On-page optimisation of blog and landing pages
3. Reporting on traffic and ranking changes

## Requirements

- Familiarity with search fundamentals
- Willingness to learn quickly and work with the content team`,
  },
];
