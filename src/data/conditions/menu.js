/**
 * The header's condition menu, in koott.in's order and with its labels, less the
 * four spelling mistakes the live site has (MANAGMENT, COUNCELLING, &HEALING,
 * VAGINISUMS).
 *
 * Kept apart from the pages because the header loads on every page of the site
 * and must not pull in the copy of all 45. To add a condition: put its file in
 * the matching category folder, add it to that folder's index.js, and list it here.
 */
export const CONDITION_MENU = [
  {
    key: "individual",
    label: "INDIVIDUAL",
    items: [
      { slug: "anxiety-treatment", label: "ANXIETY" },
      { slug: "depression-treatment", label: "DEPRESSION" },
      { slug: "counselling-for-trauma", label: "TRAUMA" },
      { slug: "panic-attack-treatment", label: "PANIC ATTACKS" },
      { slug: "burnout-recovery", label: "BURNOUT RECOVERY" },
      { slug: "grief-counselling", label: "GRIEF" },
      { slug: "addiction-treatment", label: "ADDICTIONS" },
      { slug: "sleep-disorder-treatment", label: "SLEEP DISORDER" },
      { slug: "ocd-treatment", label: "OCD" },
      { slug: "adhd-treatment", label: "ADHD" },
      { slug: "abuse-counselling", label: "ABUSE" },
      { slug: "personality-disorder-management", label: "PERSONALITY DISORDER MANAGEMENT" },
    ],
    groups: [
      {
        label: "OTHER DISORDERS",
        items: [
          { slug: "ptsd-treatment", label: "PTSD" },
          { slug: "mood-disorder-treatment", label: "MOOD DISORDER" },
          { slug: "schizophrenia-treatment", label: "SCHIZOPHRENIA" },
          { slug: "autistic-spectrum-treatment", label: "AUTISTIC SPECTRUM" },
          { slug: "boost-productivity-counselling", label: "BOOSTING PRODUCTIVITY" },
          { slug: "eating-disorder-treatment", label: "EATING DISORDERS" },
          { slug: "career-coaching-in-kerala", label: "CAREER COACH" },
        ],
      },
      {
        label: "OTHER CRISIS",
        items: [
          { slug: "counselling-for-suicidal-tendencies", label: "SUICIDAL TENDENCIES" },
          { slug: "crisis-intervention-counselling", label: "CRISIS INTERVENTION" },
          { slug: "counselling-for-existential-crisis", label: "EXISTENTIAL CRISIS" },
          { slug: "chronic-illness-counseling", label: "CHRONIC ILLNESS" },
        ],
      },
      {
        label: "OTHER BEHAVIOUR",
        items: [
          { slug: "behavioral-health-therapist", label: "BEHAVIORAL HEALTH" },
          { slug: "emotional-self-regulation", label: "EMOTIONAL SELF-REGULATION" },
          { slug: "phobias-counselling", label: "PHOBIAS" },
          { slug: "improve-communication-skills", label: "IMPROVING COMMUNICATION SKILL" },
        ],
      },
    ],
  },
  {
    key: "relationship",
    label: "RELATIONSHIP",
    items: [
      { slug: "pre-marital-counselling", label: "PREMARITAL COUNSELING" },
      { slug: "marital-counseling", label: "MARITAL COUNSELING" },
      { slug: "online-couples-therapy", label: "COUPLES COUNSELLING" },
      { slug: "divorce-counselling", label: "DIVORCE COUNSELLING" },
      { slug: "family-counselling", label: "FAMILY COUNSELLING" },
      { slug: "improve-communication-in-relationship", label: "IMPROVING COMMUNICATION" },
      { slug: "postpartum-depression-treatment", label: "POSTPARTUM DEPRESSION" },
      { slug: "parental-counselling", label: "PARENTAL COUNSELLING" },
      { slug: "infertility-counselling", label: "INFERTILITY COUNSELLING" },
    ],
    groups: [],
  },
  {
    key: "sexual",
    label: "SEXUAL & INTIMACY",
    items: [
      { slug: "female-sexual-concerns", label: "FEMALE SEXUAL CONCERNS" },
      { slug: "male-sexual-concerns", label: "MALE SEXUAL CONCERNS" },
      { slug: "intimacy-counselling", label: "INTIMACY COUNSELLING" },
      { slug: "newlywed-counseling", label: "NEWLYWED COUNSELLING" },
      { slug: "sexual-trauma", label: "SEXUAL TRAUMA & HEALING" },
      { slug: "emotional-connection", label: "EMOTIONAL CONNECTION" },
      { slug: "vaginismus", label: "VAGINISMUS" },
      { slug: "lgbtq-counselling", label: "LGBTQ+ COUNSELLING" },
      { slug: "sexual-intimacy-issues", label: "SEXUAL INTIMACY ISSUES" },
    ],
    groups: [],
  },
];
