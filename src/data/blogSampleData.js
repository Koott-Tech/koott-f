/**
 * Dummy blog posts, shaped exactly like a row from the `blogs` table so the
 * listing and article pages can be built and reviewed before the CMS has
 * content. Both pages call /api/blogs first and only fall back to this when the
 * API returns nothing — so the moment real posts are published, these disappear.
 *
 * Columns mirrored from supabase/migrations/0001_initial_schema.sql:
 *   slug · title · excerpt · content · featured_image_url · author_name
 *   status · categories · read_time_minutes · created_at
 *
 * `content` is markdown-ish: "## " for a section heading, "### " for a
 * sub-heading, "> " for the italic lede, "- " for list items, blank line
 * between paragraphs. BlogArticle renders that shape.
 */

export const BLOG_SAMPLE_POSTS = [
  {
    id: 'sample-1',
    slug: 'teen-depression-signs-causes-and-how-parents-can-help',
    title: 'Teen Depression: Signs, Causes, and How Parents Can Help',
    excerpt:
      'Is your teen more withdrawn, irritable, or losing interest in things they once enjoyed? Learn the signs of teen depression, common causes, and how parents can help.',
    featured_image_url:
      'https://static.wixstatic.com/media/624142_51575981577f408091beb9c550244f54~mv2.webp',
    author_name: 'Ann Maria Thomson',
    status: 'published',
    categories: ['Health Psychology'],
    read_time_minutes: 5,
    created_at: '2026-09-01T09:00:00.000Z',
    content: `> Does depression occur only in adults?

Most of the time, we think of adults, often in young and middle adulthood, as suffering from depression. We often forget to highlight a relevant portion of our society — the teens — as a significant population suffering from teen depression.

### Why exactly are teens ignored when it comes to the discussion of depression?

Adolescence is a unique period in lifespan development, often described as a period of 'storm and stress'. During adolescence, they undergo several emotional changes like intense mood fluctuations, hypersensitivity, confusion, anxiety, identity crisis, peer pressure, increased self-consciousness, and more.

## How Does Teen Depression Manifest in Teens and Adolescents?

As mentioned above, depression in adolescents is more than just "typical teen moodiness." It is a clinical disorder, involving a cluster of emotional, cognitive, behavioral, and physical changes that persist and impair daily functioning.

### Emotional and Cognitive Signs of Teen Depression

- Persistent sadness, emptiness, or tearfulness most of the day, nearly every day.
- Irritability, anger outbursts, or being restless/"on edge".
- Hopelessness, worthlessness, or excessive guilt.
- Negative self-talk and harsh self-criticism.
- Reduced concentration, impaired decision-making ability, or increased forgetfulness.

### Behavioral and Functional Signs of Depression in Teens

- Loss of interest or pleasure in hobbies, sports, friends, or activities they used to enjoy.
- Social withdrawal from family and friends; spending much more time alone.
- Reduced academic performance, increased absenteeism, or losing motivation.
- Neglecting hygiene or appearance.

## When Should Parents Seek Help?

If several of these symptoms are present most days for at least two weeks and are affecting school, relationships, or self-care, it is a cry for help. Immediate professional evaluation is required in such cases.`,
  },
  {
    id: 'sample-2',
    slug: 'postpartum-depression-signs-causes-symptoms-and-treatment',
    title: 'Postpartum Depression: Signs, Causes, Symptoms, and Treatment for New Mothers',
    excerpt:
      'Postpartum depression is more than just baby blues. Learn the symptoms, causes, treatment options, and warning signs of postpartum depression, and discover support.',
    featured_image_url:
      'https://static.wixstatic.com/media/624142_a52077a2920044ff826cf38ecc2a5761~mv2.webp',
    author_name: 'Ann Maria Thomson',
    status: 'published',
    categories: ['Health Psychology'],
    read_time_minutes: 4,
    created_at: '2026-08-07T09:00:00.000Z',
    content: `> Is it baby blues, or something more?

Many new mothers feel tearful and overwhelmed in the first days after birth. That usually passes. Postpartum depression lasts longer and reaches deeper.

## What Postpartum Depression Feels Like

- Persistent low mood that does not lift after a good night's sleep.
- Difficulty bonding with the baby, or guilt about not feeling "enough".
- Appetite and sleep changes beyond what the baby's routine explains.

## Getting Support

Postpartum depression responds well to treatment. Talking to a therapist early shortens the road considerably.`,
  },
  {
    id: 'sample-3',
    slug: 'how-to-stop-a-panic-attack-in-the-moment',
    title: 'How to Stop a Panic Attack in the Moment: What to Do When It Hits',
    excerpt:
      'Learn how to stop a panic attack with practical techniques like deep breathing, grounding exercises, mindfulness, and progressive muscle relaxation.',
    featured_image_url:
      'https://static.wixstatic.com/media/624142_51575981577f408091beb9c550244f54~mv2.webp',
    author_name: 'Ann Maria Thomson',
    status: 'published',
    categories: ['Counseling Psychology'],
    read_time_minutes: 3,
    created_at: '2026-07-20T09:00:00.000Z',
    content: `> A panic attack peaks fast and passes. Knowing that helps.

## Grounding Techniques That Work

- Name five things you can see, four you can hear, three you can touch.
- Breathe out for longer than you breathe in.
- Put your feet flat on the floor and press down.

## After the Attack

Rest. Panic attacks are exhausting even though they are not dangerous.`,
  },
  {
    id: 'sample-4',
    slug: 'what-is-a-panic-attack-symptoms-causes',
    title: 'What Is a Panic Attack? Symptoms, Causes, and What It Really Feels Like',
    excerpt:
      'What is a panic attack? Learn the common symptoms, causes, and warning signs of a panic attack, how it differs from a heart attack, and when to seek help.',
    featured_image_url:
      'https://static.wixstatic.com/media/624142_a52077a2920044ff826cf38ecc2a5761~mv2.webp',
    author_name: 'Ann Maria Thomson',
    status: 'published',
    categories: ['Counseling Psychology'],
    read_time_minutes: 3,
    created_at: '2026-07-15T09:00:00.000Z',
    content: `> Many people reach an emergency room before they learn the word for it.

## Common Symptoms

- Racing heart, chest tightness, shortness of breath.
- Dizziness, tingling hands, a sense of unreality.
- A strong fear that something terrible is about to happen.

## Panic Attack or Heart Attack?

If you are unsure, get medical help. Once a physical cause is ruled out, therapy is highly effective.`,
  },
  {
    id: 'sample-5',
    slug: 'what-is-burnout-signs-symptoms',
    title: 'What Is Burnout? Signs, Symptoms, and How It Affects Mental Health',
    excerpt:
      'What is burnout? Burnout is more than everyday stress. Learn the common signs and symptoms of burnout, how it affects mental health, and when to seek help.',
    featured_image_url:
      'https://static.wixstatic.com/media/624142_51575981577f408091beb9c550244f54~mv2.webp',
    author_name: 'Ann Maria Thomson',
    status: 'published',
    categories: ['Health Psychology'],
    read_time_minutes: 3,
    created_at: '2026-07-09T09:00:00.000Z',
    content: `> Burnout builds quietly, then all at once.

## The Three Parts of Burnout

- Exhaustion that rest does not fix.
- Cynicism or detachment from work you used to care about.
- A sense that nothing you do makes a difference.

## What Helps

Boundaries, recovery time, and often a conversation with someone outside the situation.`,
  },
  {
    id: 'sample-6',
    slug: 'signs-of-a-toxic-relationship',
    title: 'Signs of a Toxic Relationship: How to Know If Your Relationship Is Unhealthy',
    excerpt:
      'Learn the signs of a toxic relationship, including emotional manipulation, controlling behavior, and relationship red flags. Discover how unhealthy patterns form.',
    featured_image_url:
      'https://static.wixstatic.com/media/624142_a52077a2920044ff826cf38ecc2a5761~mv2.webp',
    author_name: 'Ann Maria Thomson',
    status: 'published',
    categories: ['Interpersonal Psychology'],
    read_time_minutes: 4,
    created_at: '2026-07-04T09:00:00.000Z',
    content: `> Unhealthy patterns rarely look dramatic from the inside.

## Patterns Worth Noticing

- You edit yourself constantly to avoid a reaction.
- Apologies arrive without any change in behaviour.
- Your world has quietly narrowed to one person.

## Where to Start

Naming the pattern out loud, to someone safe, is often the first step.`,
  },
];

export const BLOG_CATEGORIES = [
  'All Posts',
  'Sex Education',
  'Health Psychology',
  'Interpersonal Psychology',
  'Counseling Psychology',
];
