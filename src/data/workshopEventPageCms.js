import { SUMMER_WORKSHOP_2026_HERO_IMAGE } from "@/data/summerWorkshop2026Assets";

/**
 * Default CMS tree for workshop-style event pages (/events/[slug]).
 * Stored in Supabase `event_pages.cms_data`; merged on read so partial JSON is safe.
 *
 * Two stored shapes exist:
 *   - the workshop shape this file describes (written by the admin event editor);
 *   - the shape the Wix import wrote for the live events — { title, summary,
 *     body, date, schedule, venue, image }. mergeWorkshopEventCms() maps that
 *     onto the workshop shape and drops the default sample sections (speakers,
 *     reviews, prices…) so an imported event never shows another event's copy.
 */

function deepMerge(base, over) {
  if (over === undefined || over === null) return base;
  if (Array.isArray(over)) return over;
  if (typeof over !== "object") return over;
  const b = base && typeof base === "object" && !Array.isArray(base) ? base : {};
  const out = { ...b };
  for (const k of Object.keys(over)) {
    out[k] = deepMerge(b[k], over[k]);
  }
  return out;
}

export function getWorkshopEventPageDefaults() {
  return {
    // Registration API key — functional, not display copy; do not rename.
    registerEventSlug: "MyKoott-summer-workshops-2026",
    /** Single join link for this event (e.g. Google Meet). Sent in registration email + WhatsApp; set in admin CMS. */
    sessionJoinUrl: "",

    // Core event details
    topic: "",
    speaker: "",
    date: "",
    time: "",
    method: "Online", // Online, Offline, Hybrid
    posterUrl: "",

    heroImageUrl: SUMMER_WORKSHOP_2026_HERO_IMAGE,
    heroImageAlt:
      "Children and family learning together at home — Koott Summer Workshops",
    hero: {
      eyebrow: "Koott Summer Workshops 2026",
      title: "Not just workshops — spaces where children and parents learn, feel, and grow together.",
      body: "Join our first interactive session on expressing emotions at home. Free for this edition; register to save your spot.",
    },
    /** Controls card content on /events listing page. */
    eventListCard: {
      category: "Family Workshop",
      title: "Koott Summer Workshop 2026",
      description:
        "Interactive parent-child session focused on expressing emotions at home, communication tools, and practical weekly habits.",
      organizer: "Koott",
      scheduleText: "Sat, 18 April 2026 at 11:00 AM IST",
      imageUrl: SUMMER_WORKSHOP_2026_HERO_IMAGE,
    },
    ticketCard: {
      admitLabel: "ADMIT ONE",
      seriesLine: "Koott · Summer 2026",
      sessionTitle: "Expressing Big Emotions at Home",
      datetimeLine: "Sat, 18 April 2026 · 11:00 AM IST · Online",
      sessionPassLabel: "Session pass",
      priceLabel: "FREE",
      registerCta: "Register free",
      helperText:
        "Tap to open the registration form. You'll get a confirmation on WhatsApp and email.",
    },
    whatIsThis: {
      eyebrow: "Workshop Format",
      title: "What is this?",
      body: "This is a 1-hour interactive online workshop designed for parents and children to participate together. It is not a lecture; it is a practical space where families engage, share, and learn through games, role-plays, and guided activities.",
      bullets: [
        { iconKey: "LineChart", text: "Understand what emotions really are and why they can feel intense." },
        { iconKey: "MessageCircle", text: "Learn how to express feelings without hurting each other." },
        { iconKey: "Clock", text: "Explore simple ways to improve communication at home." },
      ],
    },
    speakers: {
      eyebrow: "Meet the speakers",
      heading: "Panelists for this session",
      autoAdvanceMs: 6000,
      items: [
        {
          name: "Irene Cherian",
          designation: "Child Psychologist",
          experience: "8+ years experience",
          image: "https://www.koott.in/api/images/profile-pictures/irene-1761805889946.webp",
          details:
            "Focuses on child emotional wellbeing, parent guidance, and practical communication tools for everyday family life.",
          languages: "English, Malayalam, Hindi",
          focus: "Emotional regulation, parent-child communication, anxiety support",
          style: "Warm, structured, and activity-based",
        },
        {
          name: "Sreerag Babu",
          designation: "Workshop panelist",
          experience: "Workshop facilitation",
          image:
            "https://iylutfwntoqcnqnjdnnp.supabase.co/storage/v1/object/sign/static-files/Sreerag.webp?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzNiMzNkZC0wYWM1LTRhN2UtYTE3NC04MDU2NTQ4MjE0YjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdGF0aWMtZmlsZXMvU3JlZXJhZy53ZWJwIiwiaWF0IjoxNzc1NTgzMjg5LCJleHAiOjE3NTQzNTgzMjg5fQ.ztMDN_5ZweAxTcUArCOAYAyHhz8tJmzDEkkdfqg1h00",
          details:
            "Supports interactive parent–child sessions with clear structure, warm facilitation, and space for families to practice new skills together.",
          languages: "English, Malayalam",
          focus: "Group facilitation, parent–child engagement, session flow",
          style: "Clear, encouraging, and collaborative",
        },
      ],
    },
    whyItMatters: {
      eyebrow: "Why it matters",
      heading: "Why this workshop matters for families",
      body: "Many challenges do not begin outside the home, they begin in small moments where feelings are left unspoken. Children may not know how to express emotions, and parents may not always know how to respond in the moment. This workshop helps bridge that gap.",
      outcomeCards: [
        {
          iconKey: "Clock",
          title: "Children feel safer expressing emotions",
          body: "Kids learn words and simple tools to share big feelings instead of shutting down or reacting in frustration.",
        },
        {
          iconKey: "LineChart",
          title: "Parents respond with more confidence",
          body: "You practice calm, practical responses that improve communication and reduce emotional conflict at home.",
        },
        {
          iconKey: "MessageCircle",
          title: "Families build healthier patterns",
          body: "Parents and children learn together, creating shared emotional language that continues after the session.",
        },
        {
          iconKey: "Layers",
          title: "A small step creates real change",
          body: "A single guided session can strengthen trust, reduce misunderstandings, and improve day-to-day connection.",
        },
      ],
      ctaLabel: "Learn more",
    },
    whoCanJoin: {
      heading: "Who can join?",
      badge: "Age 9-14",
      columns: [
        {
          label: "Primary attendees",
          body: "Parents with their children (best suited for ages 9-14 years)",
        },
        {
          label: "Best suited for",
          body: "Families building emotional communication at home",
        },
      ],
    },
    sessionBanner: {
      passLabel: "Session pass",
      strikePrice: "₹700",
      priceLarge: "FREE",
      badgeText: "Free for this event",
      title: "Expressing Big Emotions at Home",
      subtitle: "One-session parent-child workshop ticket.",
      details: [
        { label: "Date", value: "Sat, 18 April 2026" },
        { label: "Time", value: "11:00 AM - 12:00 PM IST" },
        { label: "Format", value: "Online (Google Meet)" },
      ],
      ctaText: "Register Now — It's Free",
    },
    takeBack: {
      title: "What You'll Take Back",
      body: "By the end of the workshop, families leave with practical tools they can use right away.",
      items: [
        { iconKey: "Heart", text: "Better understanding of emotions" },
        { iconKey: "MessageCircle", text: "Simple tools to express feelings" },
        { iconKey: "Users", text: "Improved parent-child communication" },
        { iconKey: "LineChart", text: "A stronger emotional connection at home" },
      ],
    },
    reviews: {
      title: "What families said after this event",
      items: [
        {
          author: "Aparna",
          text: "The session gave us simple steps we could apply the same day. My child opened up more than usual after the workshop.",
          avatarUrl: "/testimonialgirl.png",
        },
        {
          author: "Nikhil",
          text: "Very practical and easy to follow. We now have a calm routine for talking about big emotions at home.",
          avatarUrl: "/testimonial5.PNG",
        },
        {
          author: "Farah",
          text: "Loved the parent-child activities. It felt supportive, clear, and realistic for everyday family life.",
          avatarUrl: "/TESTIMONIALS 4.webp",
        },
      ],
    },
    registerModal: {
      title: "Reserve your spot",
      subtitle: "",
    },
  };
}

/** Strip legacy register modal subtitle (event title + date line) still stored in older `cms_data`. */
function scrubRegisterModalSubtitle(registerModal) {
  if (!registerModal || typeof registerModal.subtitle !== "string") return registerModal;
  const t = registerModal.subtitle.replace(/\s+/g, " ").trim();
  if (!t) return { ...registerModal, subtitle: "" };
  const legacy =
    "Expressing Big Emotions at Home — Sat, 18 April 2026, 11:00 AM IST";
  const legacyHyphen = legacy.replace(/—/g, "-");
  if (
    t === legacy ||
    t === legacyHyphen ||
    /^Expressing Big Emotions at Home\s*[—-]\s*.+2026/i.test(t)
  ) {
    return { ...registerModal, subtitle: "" };
  }
  return registerModal;
}

/** Is this the { title, summary, body, date, schedule, venue, image } shape the Wix import wrote? */
export function isImportedEventShape(stored) {
  if (!stored || typeof stored !== "object") return false;
  const workshopKeys = ["topic", "hero", "sessionBanner", "ticketCard", "whatIsThis"];
  return Boolean(stored.title || stored.summary || stored.schedule)
    && !workshopKeys.some((k) => k in stored);
}

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/**
 * True once the event's day is over (end of that day, IST). Reads the first dated
 * value in `text`: "07 Mar 2025, 7:00 pm – 8:00 pm", "Apr 12, 2025", "2025-04-12".
 * Text without a year ("Sat, 12 Apr") is treated as not ended.
 */
export function eventHasEnded(text, now = new Date()) {
  const s = String(text || "");
  let y;
  let m;
  let d;
  let hit = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (hit) {
    [y, m, d] = [+hit[1], +hit[2] - 1, +hit[3]];
  } else if ((hit = s.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?,?\s+(\d{4})/))) {
    [d, m, y] = [+hit[1], MONTHS[hit[2].toLowerCase()], +hit[3]];
  } else if ((hit = s.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/))) {
    [m, d, y] = [MONTHS[hit[1].toLowerCase()], +hit[2], +hit[3]];
  }
  if (y == null || m == null || !d) return false;
  const endOfDayIst = Date.UTC(y, m, d, 23, 59, 59) - 330 * 60000;
  return now.getTime() > endOfDayIst;
}

/** Wix image URLs carry a resize/blur suffix (…/v1/fill/w_49,…blur_2…); keep the original. */
export function wixOriginal(url) {
  if (!url || typeof url !== "string") return "";
  return url.replace(/(\/media\/[^/]+~mv2\.\w+)\/v1\/.*$/i, "$1");
}

/** The "## About the event" part of an imported markdown body, as plain paragraphs. */
function aboutFromBody(body) {
  const text = String(body || "");
  const m = text.match(/##\s*About the event\s*\n([\s\S]*?)(\n##\s|$)/i);
  const chunk = (m ? m[1] : "").trim();
  return chunk.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).join("\n\n");
}

/**
 * Map an imported event onto the workshop shape: its own title, summary, date,
 * time, venue and image everywhere they show, and none of the default sample
 * content (speakers, reviews, prices, age badge, outcomes).
 */
function fromImportedEvent(stored) {
  const title = stored.title || "";
  const image = wixOriginal(stored.image);
  const venue = stored.venue || "Online";
  const about = aboutFromBody(stored.body);
  const d = getWorkshopEventPageDefaults();
  return {
    topic: title,
    speaker: "",
    date: stored.date || "",
    time: stored.schedule || "",
    method: venue,
    posterUrl: "",
    heroImageUrl: image || d.heroImageUrl,
    heroImageAlt: title,
    hero: { eyebrow: "Koott Workshop", title, body: stored.summary || "" },
    eventListCard: {
      category: "Workshop",
      title,
      description: stored.summary || "",
      organizer: "Koott",
      scheduleText: stored.schedule || stored.date || "",
      imageUrl: image || d.eventListCard.imageUrl,
    },
    ticketCard: {
      ...d.ticketCard,
      seriesLine: "Koott Workshop",
      sessionTitle: title,
      datetimeLine: [stored.schedule || stored.date, venue].filter(Boolean).join(" · "),
      priceLabel: "",
      registerCta: "Register",
    },
    whatIsThis: { eyebrow: "About the event", title: "What is this?", body: about || stored.summary || "", bullets: [] },
    speakers: { ...d.speakers, items: [] },
    whyItMatters: { ...d.whyItMatters, body: "", outcomeCards: [] },
    whoCanJoin: { ...d.whoCanJoin, badge: "", columns: [] },
    sessionBanner: {
      passLabel: "Session pass",
      strikePrice: "",
      priceLarge: "",
      badgeText: "",
      title,
      subtitle: stored.summary || "",
      details: [
        { label: "Date", value: stored.date || "" },
        { label: "Time", value: stored.schedule || "" },
        { label: "Format", value: venue },
      ].filter((x) => x.value),
      ctaText: "Register",
    },
    takeBack: { ...d.takeBack, body: "", items: [] },
    reviews: { ...d.reviews, items: [] },
  };
}

export function mergeWorkshopEventCms(partial) {
  const source = isImportedEventShape(partial) ? fromImportedEvent(partial) : (partial || {});
  const merged = deepMerge(getWorkshopEventPageDefaults(), source);
  if (merged.registerModal) {
    merged.registerModal = scrubRegisterModalSubtitle(merged.registerModal);
  }

  // Sync Core Details to everywhere else so we only need to edit them once in the CMS
  if (merged.topic) {
    if (merged.hero) merged.hero.title = merged.topic;
    if (merged.sessionBanner) merged.sessionBanner.title = merged.topic;
    if (merged.eventListCard) merged.eventListCard.title = merged.topic;
  }

  if (merged.date || merged.time) {
    if (merged.sessionBanner && merged.sessionBanner.details) {
      const details = [...merged.sessionBanner.details];
      const dIdx = details.findIndex(d => String(d.label).toLowerCase().includes('date'));
      if (dIdx !== -1 && merged.date) details[dIdx].value = merged.date;

      const tIdx = details.findIndex(d => String(d.label).toLowerCase().includes('time'));
      if (tIdx !== -1 && merged.time) details[tIdx].value = merged.time;

      const fIdx = details.findIndex(d => String(d.label).toLowerCase().includes('format'));
      if (fIdx !== -1 && merged.method) details[fIdx].value = merged.method;

      merged.sessionBanner.details = details;
    }
    if (merged.eventListCard) {
      merged.eventListCard.scheduleText = [merged.date, merged.time].filter(Boolean).join(" at ");
    }
  }

  if (merged.posterUrl) {
    const defaultHero = getWorkshopEventPageDefaults().heroImageUrl;
    if (!merged.heroImageUrl || merged.heroImageUrl === defaultHero) {
      merged.heroImageUrl = merged.posterUrl;
    }

    const defaultCard = getWorkshopEventPageDefaults().eventListCard.imageUrl;
    if (merged.eventListCard && (!merged.eventListCard.imageUrl || merged.eventListCard.imageUrl === defaultCard)) {
      merged.eventListCard.imageUrl = merged.posterUrl;
    }
  }

  if (merged.speaker) {
    if (merged.hero) merged.hero.body = `Speaker: ${merged.speaker}`;
    if (merged.eventListCard) merged.eventListCard.description = `Speaker: ${merged.speaker}`;
  }

  return merged;
}
