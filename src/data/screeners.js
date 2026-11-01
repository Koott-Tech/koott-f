/**
 * Validated screening instruments for the condition pages.
 *
 * These are the real, published questionnaires, reproduced verbatim -- not a
 * symptom tick-list dressed up as a score. Both are free to use:
 *
 *   PHQ-9  Spitzer, Williams, Kroenke and colleagues, with an educational
 *          grant from Pfizer. The form itself states that no permission is
 *          required to reproduce, translate, display or distribute it.
 *   GAD-7  Spitzer RL, Kroenke K, Williams JBW, Lowe B. A brief measure for
 *          assessing generalized anxiety disorder. Arch Intern Med.
 *          2006;166:1092-1097.
 *
 * Both score every item 0-3 on how often it has bothered the person over the
 * last two weeks, and both read the total against published cut points. A
 * score is a screening result and a severity measure. It is not a diagnosis,
 * and nothing here should be presented as one.
 *
 * `riskItem` marks an item that needs acting on whatever the total comes to:
 * PHQ-9 item 9 asks about thoughts of being better off dead or of self-harm,
 * and published guidance is that any positive answer needs follow-up by
 * someone competent to assess that risk, regardless of the total score.
 */

/** The four frequency answers both instruments use, and their points. */
export const FREQUENCY = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

const LEAD_IN =
  'Over the last 2 weeks, how often have you been bothered by any of the following problems?';

export const PHQ9 = {
  id: 'phq-9',
  name: 'PHQ-9',
  fullName: 'Patient Health Questionnaire-9',
  leadIn: LEAD_IN,
  max: 27,
  /** A total at or above this is where published guidance suggests a further look. */
  referAt: 10,
  riskItem: 8, // zero-based: item 9
  credit:
    'PHQ-9, developed by Drs Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues.',
  items: [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    'Trouble concentrating on things, such as reading the newspaper or watching television',
    'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
    'Thoughts that you would be better off dead or of hurting yourself in some way',
  ],
  bands: [
    { min: 0, max: 4, label: 'Minimal', tone: 'ok' },
    { min: 5, max: 9, label: 'Mild', tone: 'ok' },
    { min: 10, max: 14, label: 'Moderate', tone: 'warn' },
    { min: 15, max: 19, label: 'Moderately severe', tone: 'high' },
    { min: 20, max: 27, label: 'Severe', tone: 'high' },
  ],
};

export const GAD7 = {
  id: 'gad-7',
  name: 'GAD-7',
  fullName: 'Generalized Anxiety Disorder 7-item scale',
  leadIn: LEAD_IN,
  max: 21,
  referAt: 10,
  riskItem: -1,
  credit:
    'GAD-7, Spitzer RL, Kroenke K, Williams JBW, Lowe B, Arch Intern Med 2006;166:1092-1097.',
  items: [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    "Being so restless that it's hard to sit still",
    'Becoming easily annoyed or irritable',
    'Feeling afraid as if something awful might happen',
  ],
  bands: [
    { min: 0, max: 4, label: 'Minimal', tone: 'ok' },
    { min: 5, max: 9, label: 'Mild', tone: 'ok' },
    { min: 10, max: 14, label: 'Moderate', tone: 'warn' },
    { min: 15, max: 21, label: 'Severe', tone: 'high' },
  ],
};

/**
 * Which pages carry a screener.
 *
 * Only the conditions with a genuinely validated, freely usable instrument are
 * listed. Every other page keeps the plain symptom checklist, which counts
 * what someone recognises and is never shown as a score. Candidates that could
 * be added once their licensing is confirmed: PCL-5 for PTSD (US VA, public
 * domain), AUDIT for addiction (WHO), ASRS v1.1 for ADHD (WHO), OCI-R for OCD.
 *
 * counselling-for-suicidal-tendencies is deliberately absent: a self-scored
 * questionnaire is the wrong front door for that page.
 */
export const SCREENER_BY_SLUG = {
  'depression-treatment': PHQ9,
  'anxiety-treatment': GAD7,
};

export const screenerFor = (slug) => SCREENER_BY_SLUG[slug] || null;

/**
 * Crisis lines, shown whenever the risk item is answered positively.
 * Both are national, toll-free and run around the clock. KIRAN publishes a
 * Malayalam menu; Tele-MANAS asks the caller to choose a language.
 */
export const CRISIS_LINES = [
  { name: 'Tele-MANAS', number: '14416', note: 'Ministry of Health, 24x7' },
  { name: 'KIRAN', number: '1800-599-0019', note: '24x7, Malayalam available' },
];

/**
 * Score a set of answers.
 *
 * `answers` is a sparse array of 0-3 by item index. Returns the running total,
 * the band it falls in, whether every item has been answered, and whether the
 * risk item was answered positively. `tone` drives the colour the card takes:
 * ok -> green, warn -> amber, high -> red.
 */
export function scoreScreener(screener, answers = []) {
  const answered = screener.items.filter((_, i) => Number.isInteger(answers[i])).length;
  const total = screener.items.reduce((sum, _, i) => sum + (answers[i] || 0), 0);
  const complete = answered === screener.items.length;
  const atRisk =
    screener.riskItem >= 0 && (answers[screener.riskItem] || 0) > 0;

  const band =
    screener.bands.find((b) => total >= b.min && total <= b.max) ||
    screener.bands[screener.bands.length - 1];

  // A positive risk answer outranks the total: it is acted on either way.
  const tone = atRisk ? 'high' : band.tone;

  return {
    answered,
    total,
    complete,
    atRisk,
    band,
    tone,
    /** Published guidance suggests a further look at or above this total. */
    refer: total >= screener.referAt,
    /** Only offer a booking once there is a complete answer to offer it on. */
    offerBooking: atRisk || (complete && total >= screener.referAt),
  };
}
