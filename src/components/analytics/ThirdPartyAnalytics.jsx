'use client';

/**
 * Google Analytics 4 and Vercel Analytics, privacy-safe.
 *
 *   · GA4 loads only after the visitor accepts analytics cookies.
 *   · Every page it sees is redacted: condition pages → /topic, blog posts → /blog,
 *     no query strings except campaign parameters, and a generic page title
 *     (document titles name conditions).
 *   · Google signals and ad personalisation are off (mental health is a
 *     restricted category for Google ads).
 *   · Vercel Analytics gets the same redacted URL.
 *
 * GA4 admin: turn OFF Enhanced measurement → "Page changes based on browser
 * history events", so only these redacted page_views are counted.
 */

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import { getConsent, onConsent } from '@/analytics/consent';
import { redactPath, redactUrl } from '@/analytics/redact';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-K7Z8F94Z80';
const STAFF_AREA = /^\/(admin|superadmin|finance|psychologist|event-organizer|marketing|dev)(\/|$)/;

const TITLES = { '/': 'Home', '/topic': 'Topic page', '/blog': 'Blog', '/book': 'Booking', '/therapist-profile': 'Therapist profile' };
const titleFor = (path) => `${TITLES[path] || 'Page'} | Koott`;

export default function ThirdPartyAnalytics() {
  const pathname = usePathname();
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    setAnalytics(!!getConsent()?.analytics);
    return onConsent((c) => setAnalytics(!!c.analytics));
  }, []);

  // One redacted page_view per route (automatic page views are disabled in config).
  useEffect(() => {
    if (!analytics || !pathname || STAFF_AREA.test(pathname) || typeof window.gtag !== 'function') return;
    const path = redactPath(pathname);
    const location = redactUrl(window.location.href);
    window.gtag('set', { page_location: location, page_title: titleFor(path), page_referrer: '' });
    window.gtag('event', 'page_view', { page_location: location, page_path: path, page_title: titleFor(path) });
  }, [analytics, pathname]);

  const beforeSend = (event) => ({ ...event, url: redactUrl(event.url) });

  return (
    <>
      <Analytics beforeSend={beforeSend} />
      {analytics && pathname && !STAFF_AREA.test(pathname) && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              send_page_view: false,
              allow_google_signals: false,
              allow_ad_personalization_signals: false
            });
            window.dispatchEvent(new Event('koott:ga-ready'));
          `}</Script>
          <GaFirstPage />
        </>
      )}
    </>
  );
}

/** The first page_view fires once gtag exists (the route effect above may run before the script). */
function GaFirstPage() {
  const pathname = usePathname();
  useEffect(() => {
    const send = () => {
      if (typeof window.gtag !== 'function') return;
      const path = redactPath(window.location.pathname);
      const location = redactUrl(window.location.href);
      window.gtag('set', { page_location: location, page_title: titleFor(path), page_referrer: '' });
      window.gtag('event', 'page_view', { page_location: location, page_path: path, page_title: titleFor(path) });
    };
    window.addEventListener('koott:ga-ready', send, { once: true });
    return () => window.removeEventListener('koott:ga-ready', send);
  }, [pathname]);
  return null;
}
