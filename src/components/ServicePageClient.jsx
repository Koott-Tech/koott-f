'use client';

/**
 * /service-page/<slug> — the therapist profile, at the same URL koott.in uses.
 *
 * The layout is a clone of https://www.koott.in/service-page/irene-mariam; the
 * measurements live in TherapistProfile.jsx. The record is matched out of
 * /api/public/psychologists on a slug derived from the name, so no new backend
 * route is needed. "Book Now" hands off to the app's existing booking flow.
 * (app/service-page/[slug]/page.js 404s unknown slugs before this renders.)
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TherapistProfile, { therapistSlug } from '@/components/TherapistProfile';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function ServicePageClient() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: 'loading', therapist: null });

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`${API}/public/psychologists`);
        if (!res.ok) throw new Error(`api ${res.status}`);
        const json = await res.json();
        const d = json?.data ?? json?.message ?? json;
        const list = d?.psychologists || (Array.isArray(d) ? d : []);
        const found = list.find((t) => therapistSlug(t) === slug)
          // Wix slugs sometimes carry a middle name the record does not.
          || list.find((t) => therapistSlug(t).startsWith(String(slug).split('-')[0]));
        if (!off) setState({ status: found ? 'ready' : 'missing', therapist: found || null });
      } catch (_) {
        if (!off) setState({ status: 'error', therapist: null });
      }
    })();
    return () => { off = true; };
  }, [slug]);

  if (state.status === 'ready') {
    return (
      // Header.jsx is fixed and reserves no space of its own.
      <div style={{ paddingTop: 63 }}>
        <TherapistProfile
          therapist={state.therapist}
          bookHref={`/book/${slug}`}
        />
      </div>
    );
  }

  return (
    // While loading, stay taller than the screen so the footer never shows and then
    // jumps down when the profile arrives.
    <div style={{
      paddingTop: 63, boxSizing: 'border-box',
      minHeight: state.status === 'loading' ? 'calc(100vh + 160px)' : '100vh',
    }}>
      <div style={{
        maxWidth: 720, margin: '0 auto', padding: '120px 24px', textAlign: 'center',
        fontFamily: 'Mulish, system-ui, sans-serif', color: '#100E0E',
      }}
      >
        {state.status === 'loading' && <p>Loading profile…</p>}
        {state.status === 'missing' && <p>We could not find that therapist.</p>}
        {state.status === 'error' && <p>We could not load this profile just now. Please try again.</p>}
      </div>
    </div>
  );
}
