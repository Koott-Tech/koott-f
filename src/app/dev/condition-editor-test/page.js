'use client';

/**
 * Dev-only page to exercise ConditionPageEditor without admin auth.
 * Loads a real condition page (?slug=, default depression-treatment) from the
 * public API; "Save" only shows the payload it would send — nothing is written.
 * Access at /dev/condition-editor-test
 */
import { useEffect, useState } from 'react';
import ConditionPageEditor from '@/components/ConditionPageEditor';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function DevConditionEditorTest() {
  const [row, setRow] = useState(undefined);
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('slug') || 'depression-treatment';
    fetch(`${API}/counselling/${slug}`).then((r) => r.json())
      .then((j) => setRow(j?.data || null))
      .catch(() => setRow(null));
  }, []);

  if (row === undefined) return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <>
      <ConditionPageEditor
        mode={row ? 'edit' : 'create'}
        initialData={row}
        onSubmit={(p) => { setPayload(p); window.__lastPayload = p; }}
        onCancel={() => setPayload(null)}
      />
      {payload && (
        <pre id="dev-payload" style={{ position: 'fixed', bottom: 0, right: 0, width: 420, maxHeight: '40vh', overflow: 'auto', background: '#111', color: '#9f9', fontSize: 11, padding: 12, zIndex: 50 }}>
          {JSON.stringify({ ...payload, content: '(object)' }, null, 2)}
        </pre>
      )}
    </>
  );
}
