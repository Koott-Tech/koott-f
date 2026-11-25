'use client';

/**
 * /profile/refunds/[id] — the Koott 2.0 "Refund details" screen.
 *
 * On Next 14 route params are a plain object, so they are read with useParams.
 */

import { useParams } from 'next/navigation';
import { RefundDetails2 } from '@/components/sessions2/Refunds2';

export default function RefundDetailsPage() {
  const { id } = useParams();
  return <RefundDetails2 refundId={String(id || '')} />;
}
