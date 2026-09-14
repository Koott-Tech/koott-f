/**
 * Copy for /about-us (AboutPage). This is the page's built-in content; the
 * admin "Pages → About" editor stores changes under site-config `site_about`,
 * merged over this one top-level section at a time (lib/siteContent.js).
 *
 * Images still come from static.wixstatic.com (an allowed host in
 * next.config.mjs) — open migration task #4 is to move them to our own storage.
 */

export const ABOUT_DEFAULTS = {
  mission: {
    title: 'Our mission is to make mental health care feel closer, calmer, and more human',
    photo: 'https://static.wixstatic.com/media/624142_e774005a6b4e444b8b253409df95f5a9~mv2.webp',
  },

  story: {
    title: '‘Story of a Passion Project’',
    paragraphs: [
      'Koott didn’t begin as a mere business idea; it started as a deep feeling.\nA feeling that couldn’t be ignored.',
      'A feeling that people deserve more than just a quick solution, they deserve to be understood.\nWe gathered a group of people around one simple question.',
      'What if seeking mental health support felt different, more personal and more comfortable?\nThat question led us to build Koott, with the help of science, technology and empathy. A space designed to make online counselling more accessible and more human for Malayalis around the world.',
      'As India’s first online counselling platform dedicated specifically to Malayalis, our mission has always been simple. To make people feel seen, heard and understood in their own language and cultural context.',
      'Koott is not just a name which means "companion"; it is an enduring promise we made to our people to walk beside them through life’s challenges, no matter where they are in the world. And it continues to grow with each person who trusts us with their personal story.',
      'Today, Koott has evolved beyond a digital platform. It is a community connecting Malayalis around the world with compassionate mental health care, with a core belief that human connection remains one of the most powerful forces for healing.',
    ],
  },

  trust: {
    title: 'Trusted by Malayalees',
    lead: 'Each number here reflects a story of trust, care, and healing that has quietly reached a little further.',
    stats: [
      { mark: '✨', value: '32,000+', caption: 'Session hours completed with care' },
      { mark: '⚡', value: '4.8 Stars', caption: 'Happy clients leads to faster growth' },
      { mark: '⚡', value: '45+ Members', caption: 'A team that goes beyond to ensure healing' },
      { mark: '🌱', value: '103 Countries', caption: 'We aim to reach where we are.' },
    ],
    secondaryCta: { label: 'Join the team', href: '/career' },
    primaryCta: { label: 'Find your therapist', href: '/book-malayali-psychologists' },
    photo: 'https://static.wixstatic.com/media/nsplsh_3c34a47f60dc41b898698903b266e882~mv2.jpg',
  },

  advisors: {
    title: 'Guided by Our Advisory Board',
    lead: 'Each number here reflects a story of trust, care, and healing that has quietly reached a little further.',
    role: 'Advisory Board Member',
    people: [
      {
        name: 'Aswathy Sambath',
        photo: 'https://static.wixstatic.com/media/624142_9e59420cbfbe4d6b8a46816aa6f57e74~mv2.webp',
        bio: 'A registered Clinical Psychologist with an M.Phil. and over 8 years of experience, working across individual, relationship, and family therapy. Their focus is on helping people make sense of emotional struggles, understand themselves more clearly, and find healthier ways of relating to others. The approach is collaborative and empathetic, creating a steady space where clients can explore what they feel, why it matters, and how they can gradually move toward meaningful change in their lives and relationships.',
      },
      {
        name: 'Dr. Aswathy Balan',
        photo: 'https://static.wixstatic.com/media/624142_81608fd0589e49aba78411f9b5621243~mv2.webp',
        bio: 'A certified psychiatrist with over 7 years of clinical experience, bringing a thoughtful and evidence-based approach to mental health care. Their work focuses on supporting people through mood, anxiety, and personality-related challenges, while also helping create greater awareness around mental health through community initiatives and public conversations, education, advocacy, and compassionate support.',
      },
      {
        name: 'Dr. Thaniya K Leela',
        photo: 'https://static.wixstatic.com/media/624142_deb7902b1c41494a908f8abecd599452~mv2.webp',
        bio: 'With a Ph.D. in Psychology and an M.Phil. from UiB, Norway, backed by 7+ years of experience. The work supports adolescents, women, parents, and couples as they navigate the moments in life that feel confusing, overwhelming, or heavy. Using a trauma-informed approach, the focus is on creating a space that feels safe enough for people to open up, heal, build resilience, and grow at their own pace.',
      },
    ],
  },

  leadership: {
    title: 'Leadership Team',
    lead: 'At Koott, care is a shared responsibility. Each of us holds a part of the journey — supporting therapists, shaping experiences, and staying close to the people we serve.',
    people: [
      {
        name: 'Dr. Aswathy Usha Raman',
        role: 'Chief of Therapy Operations',
        photo: 'https://static.wixstatic.com/media/624142_139b2bb4b9d4404db3062c1fa4bff3d6~mv2.webp',
        bio: 'Leads therapist training and quality assurance at Koott, ensuring every therapist is well-prepared, supported, and consistently delivering high standards of care.',
      },
      {
        name: 'Shuhaima Hanna Katti',
        role: 'Head of Experience & Quality',
        photo: 'https://static.wixstatic.com/media/624142_303b22d14a38437485b281d8045478ce~mv2.webp',
        bio: 'Oversees the overall client journey at Koott, ensuring every touchpoint feels smooth, caring, and consistent—from first contact to ongoing therapy experience.',
      },
      {
        name: 'Athulya O',
        role: 'Head of Client Care',
        photo: 'https://static.wixstatic.com/media/624142_770c616ee8b04b02a2c6849a25a3722f~mv2.webp',
        bio: 'Supports all client-facing needs at Koott, ensuring every client feels heard, guided, and cared for throughout their journey.',
      },
    ],
    founder: {
      name: 'Faisal Vysam Purath',
      role: 'CEO, Founder',
      quote: 'I started Koott with a simple hope: to create the kind of support I wish more of us had when life felt heavy, and words were hard to find.',
      photo: 'https://static.wixstatic.com/media/624142_51092bc349e24362872e738e85e51b58~mv2.webp',
    },
  },

  closing: {
    title: 'Start now for a better tomorrow.',
    cta: { label: 'Book Now', href: '/book-malayali-psychologists' },
  },
};

export default ABOUT_DEFAULTS;
