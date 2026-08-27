import ConditionPageTemplate from '@/components/ConditionPageTemplate';
import conditionPageTemplateSample from '@/data/conditionPageTemplateSample';

export const metadata = {
  title: 'Condition page template — preview',
  robots: { index: false, follow: false },
};

/**
 * Preview route for the condition landing page template.
 *
 * Renders ConditionPageTemplate with dummy data so the layout can be reviewed
 * without touching a live page. The CMS will pass a real content object of the
 * same shape; nothing here is user-facing.
 */
export default function ConditionTemplatePreviewPage() {
  return <ConditionPageTemplate data={conditionPageTemplateSample} />;
}
