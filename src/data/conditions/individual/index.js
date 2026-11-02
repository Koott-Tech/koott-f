/** Every INDIVIDUAL page, in menu order. */
import anxietyTreatment from './anxiety-treatment.js';
import depressionTreatment from './depression-treatment.js';
import counsellingForTrauma from './counselling-for-trauma.js';
import panicAttackTreatment from './panic-attack-treatment.js';
import burnoutRecovery from './burnout-recovery.js';
import griefCounselling from './grief-counselling.js';
import addictionTreatment from './addiction-treatment.js';
import sleepDisorderTreatment from './sleep-disorder-treatment.js';
import ocdTreatment from './ocd-treatment.js';
import adhdTreatment from './adhd-treatment.js';
import abuseCounselling from './abuse-counselling.js';
import personalityDisorderManagement from './personality-disorder-management.js';
import otherDisorders from './other-disorders/index.js';
import otherCrisis from './other-crisis/index.js';
import otherBehaviour from './other-behaviour/index.js';

export default [
  anxietyTreatment,
  depressionTreatment,
  counsellingForTrauma,
  panicAttackTreatment,
  burnoutRecovery,
  griefCounselling,
  addictionTreatment,
  sleepDisorderTreatment,
  ocdTreatment,
  adhdTreatment,
  abuseCounselling,
  personalityDisorderManagement,
  ...otherDisorders,
  ...otherCrisis,
  ...otherBehaviour,
];
