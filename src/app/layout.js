import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import HeaderWrapper from "@/components/HeaderWrapper";
import FooterWrapper from "@/components/FooterWrapper";
import ConditionalProviders from "@/components/ConditionalProviders";
import ConditionalPadding from "@/components/ConditionalPadding";
import WhatsAppWidgetWrapper from "@/components/WhatsAppWidgetWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PostHogProvider } from "@/components/PostHogProvider";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import ThirdPartyAnalytics from "@/components/analytics/ThirdPartyAnalytics";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://www.koott.in"
).replace(/\/+$/, "");

const SITE_TITLE = "Online Counselling in Malayalam | Koott";
const SITE_DESCRIPTION =
  "Struggling with stress, anxiety, relationship issues, or low mood? Talk to experienced Malayali psychologists at Koott. Private online counselling in Malayalam.";

// Search indexing stays off until launch — set NEXT_PUBLIC_ALLOW_INDEXING=true
// on the production deploy (app/robots.js reads the same flag).
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export const metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: {
    default: SITE_TITLE,
    template: "%s | Koott"
  },
  description: SITE_DESCRIPTION,
  icons: {
    /* Sized from public/favicon.png (4500px, 605KB — far too heavy to serve as
       a tab icon). The 512 is for Android home screens and PWA installs. */
    icon: [
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/favicon-180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: "Koott",
    url: "/",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Koott",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [`${siteUrl}/logo.png`],
  },
  robots: {
    index: allowIndexing,
    follow: allowIndexing,
    googleBot: {
      index: allowIndexing,
      follow: allowIndexing,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }) {
  return (
    /* The inline script below marks <html> with `splash-done` before React
       hydrates, which React would otherwise report as an attribute the server
       did not send. */
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/favicon-180.png" sizes="180x180" />
        {/* DNS Prefetch and Preconnect for faster API connections (especially for international users) */}
        {process.env.NEXT_PUBLIC_BACKEND_URL && (
          <>
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_BACKEND_URL.replace('/api', '')} />
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_BACKEND_URL.replace('/api', '')} crossOrigin="anonymous" />
          </>
        )}
        {/* Preconnect to critical third-party origins for better performance */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        {/* Clarity and PostHog preconnect removed - using proxies (/clarity/* and /posthog/*) which don't need preconnect */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
        {/* Font preloading to prevent CLS */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Load fonts - Varela Round loaded first as it's render-blocking, others can load async */}
        <link href="https://fonts.googleapis.com/css2?family=Varela+Round&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        {/* Home is set in Work Sans per the Sep-26 design; Inter stands in for
            TT Interphases (licensed) on the nav, buttons and captions. */}
        <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        {/* Figtree is the Koott 2.0 type (home page). */}
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Preload logo for instant loading screen display */}
        <link rel="preload" as="image" href="/loader-mark.webp" type="image/webp" />
        {/* CRITICAL: Script to manage loader - runs only on client side to prevent hydration mismatch */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Only run on client side (not during SSR)
                if (typeof window === 'undefined') return;
                
                const LOADER_ID = 'initial-loader';
                /* The preloader belongs to arriving at Koott, not to moving around
                   inside it. It plays once per browser session: every visit after
                   the first marks <html> before anything paints, so there is no
                   flash of it on a second page. */
                var SPLASH_KEY = 'koott_splash_seen';
                var firstVisit = true;
                try { firstVisit = sessionStorage.getItem(SPLASH_KEY) !== '1'; } catch (e) { /* private mode */ }
                if (!firstVisit) {
                  document.documentElement.classList.add('splash-done');
                } else {
                  try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch (e) { /* private mode */ }
                }
                // This runs in <head>, before <body> and the loader exist — both are
                // looked up again when the loader is hidden.
                let body = document.body;
                let loader = document.getElementById(LOADER_ID);
                // No minimum: the loader only covers the time the page really needs.
                // Long enough for the wipe to finish when the preloader does play;
                // nothing at all on every later page, where it is already hidden.
                const MIN_DISPLAY_TIME = firstVisit ? 1500 : 0;
                let showTime = null; // Track when loader was shown
                
                // Show loader immediately on every page load/refresh with smooth fade in
                function showLoader() {
                  if (loader && body && body.classList) {
                    // Reset opacity to 0 first for smooth fade in
                    loader.style.opacity = '0';
                    loader.style.visibility = 'visible';
                    loader.style.pointerEvents = 'auto';
                    body.classList.remove('loaded');
                    // Trigger fade in by setting opacity to 1 after a brief moment
                    requestAnimationFrame(() => {
                      if (loader) {
                      loader.style.opacity = '1';
                      }
                    });
                    showTime = Date.now(); // Record when loader was shown
                  }
                }
                
                // Function to hide loader with smooth fade out (respects minimum display time)
                function hideLoader() {
                  body = document.body;
                  loader = document.getElementById(LOADER_ID);
                  if (!showTime) {
                    // If showTime wasn't set, wait full minimum time
                    showTime = Date.now();
                    setTimeout(hideLoader, MIN_DISPLAY_TIME);
                    return;
                  }
                  
                  const elapsed = Date.now() - showTime;
                  const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);
                  
                  setTimeout(function() {
                    // The 'loaded' class fades the loader out (CSS, 300 ms). No inline
                    // styles: they'd differ from the server HTML and trip hydration.
                    if (body && body.classList) {
                      body.classList.add('loaded');
                    }
                  }, remaining);
                }
                
                // Show loader immediately
                showLoader();
                
                // Hide as soon as the page's HTML is ready — the server-rendered content
                // is already there. (Waiting for window 'load' held the loader until every
                // image and font had downloaded.)
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', hideLoader, { once: true });
                  // Fallback in case DOMContentLoaded never reaches us
                  setTimeout(function() {
                    if (body && body.classList && !body.classList.contains('loaded')) {
                      hideLoader();
                    }
                  }, 3000);
                } else {
                  hideLoader();
                }

                // Back/forward from the browser cache is instant — never show the loader there.
                window.addEventListener('pageshow', function(event) {
                  if (event.persisted && document.body) {
                    document.body.classList.add('loaded');
                  }
                });
              })();
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* Critical CSS for immediate mobile styling */
            @media (max-width: 767px) {
              .hero-title, .hero-description {
                text-align: center !important;
              }
              .hero-title {
                line-height: 0.95 !important;
              }
            }
            /* Instant loading screen - renders with HTML, no hydration needed */
            /* CRITICAL: Loader is position:fixed overlay - NEVER affects layout flow */
            /* Content renders immediately for FCP/LCP metrics */
            body:not(.loaded) {
              overflow: hidden !important;
            }
            /* Prevent interaction during initial load, but allow rendering */
            body:not(.loaded) > *:not(#initial-loader) {
              pointer-events: none !important;
            }
            body.loaded > *:not(#initial-loader) {
              pointer-events: auto !important;
            }
            /* Prevent layout shifts during font loading */
            body {
              font-display: swap;
            }
            /* Reserve space for images to prevent CLS */
            img {
              max-width: 100%;
              height: auto;
            }
            img[width][height] {
              aspect-ratio: attr(width) / attr(height);
            }
            /* Loader must be visible and on top */
            #initial-loader {
              position: fixed !important;
              inset: 0 !important;
              width: 100% !important;
              height: 100% !important;
              background: #ffffff !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              z-index: 999999 !important;
              font-family: Arial, Helvetica, sans-serif !important;
              overflow: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
              transition: opacity 150ms ease-in-out !important;
              pointer-events: auto !important;
              opacity: 1 !important;
              visibility: visible !important;
            }
            body.loaded #initial-loader {
              opacity: 0 !important;
              pointer-events: none !important;
              visibility: hidden !important;
              transition: opacity 300ms ease-out !important;
            }
            /* ── the loader these pages share (unchanged) ── */
             #initial-loader .loading-logo {
              /* The tab icon itself — one square mark, so it is the same thing
                 people see in the browser tab and on a home screen. */
              width: 180px;
              height: 180px;
              margin: 0 auto;
              background-image: url('/loader-mark.webp'); /* 360 px copy of favicon-512.png (14 KB, was 57 KB) */
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              animation: pulseScale 2s ease-in-out infinite;
            }
            @keyframes pulseScale {
              0% { transform: scale(1); opacity: 0.9; }
              50% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 0.9; }
            }
            @media (max-width: 767px) {
              #initial-loader .loading-logo {
                width: 128px !important;
                height: 128px !important;
              }
            }

            /* ── the preloader (Figma "Preloader" 7858:79501) ──
               Over the loader, on the first visit of a session only. */
            html.splash-done #koott-splash { display: none !important; }
            #koott-splash {
              position: fixed;
              inset: 0;
              z-index: 1000000;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: #083226;
              overflow: hidden;
              opacity: 1;
              transition: opacity 400ms ease-out, transform 400ms ease-out;
            }
            #koott-splash .kl-glow {
              position: absolute;
              left: 50%;
              bottom: -60px;
              width: 140%;
              height: 190px;
              transform: translateX(-50%);
              background: #39AC71;
              filter: blur(120px);
              opacity: .85;
              pointer-events: none;
            }
            #koott-splash .kl-mark {
              position: relative;
              width: 153px;
              height: 51px;
              /* Figma sits the wordmark a little above the middle of the screen. */
              margin-top: -34px;
            }
            #koott-splash .kl-mark img { display: block; width: 153px; height: 51px; }
            #koott-splash .kl-mark-base { opacity: .2; }
            /* The wipe: a window over the finished wordmark that opens left to right. */
            #koott-splash .kl-mark-wipe {
              position: absolute;
              inset: 0;
              width: 0;
              overflow: hidden;
              animation: klWipe 1100ms cubic-bezier(.22,.61,.36,1) 120ms forwards;
            }
            @keyframes klWipe { to { width: 153px; } }
            #koott-splash .kl-badge {
              position: absolute;
              left: 50%;
              bottom: 60px;
              width: 160px;
              transform: translateX(-50%);
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 5px;
              opacity: 0;
              animation: klFade 600ms ease-out 900ms forwards;
            }
            @keyframes klFade { to { opacity: .4; } }
            #koott-splash .kl-badge-i {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              border-radius: 9999px;
              background: rgba(255,255,255,.08);
            }
            #koott-splash .kl-badge-i svg { width: 20px; height: 20px; }
            #koott-splash .kl-badge-t {
              font-family: 'Figtree', ui-sans-serif, system-ui, sans-serif;
              font-size: 14px;
              font-weight: 600;
              line-height: 18px;
              text-align: center;
              color: #C9FFDB;
            }
            /* It lifts away rather than only fading, as the design shows the page
               arriving from underneath it. */
            body.loaded #koott-splash {
              opacity: 0;
              transform: translateY(-24px);
              pointer-events: none;
              visibility: hidden;
            }
            @media (prefers-reduced-motion: reduce) {
              #koott-splash .kl-mark-wipe { animation: none; width: 153px; }
              #koott-splash .kl-badge { animation: none; opacity: .4; }
              body.loaded #koott-splash { transform: none; }
            }
          `,
          }}
        />
        {/* Organization / MedicalBusiness structured data for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              name: "Koott",
              description: SITE_DESCRIPTION,
              url: siteUrl,
              logo: {
                "@type": "ImageObject",
                "url": `${siteUrl}/logo.png`,
                "width": 1200,
                "height": 400
              },
              image: `${siteUrl}/logo.png`,
              telephone: "+91 95390 07766",
              email: "hello@koott.in",
              address: {
                "@type": "PostalAddress",
                addressCountry: "IN",
              },
              medicalSpecialty: [
                "Psychology",
                "Counselling",
                "Psychotherapy",
              ],
              availableLanguage: ["Malayalam", "English"],
              serviceType: "Online Therapy",
              areaServed: "Worldwide",
            }),
          }}
        />
      </head>
      <body className="antialiased bg-gray-50" suppressHydrationWarning>
        {/* INSTANT - Server-rendered loader (appears at 0ms, no hydration needed) */}
        {/* Position:fixed overlay - NEVER affects layout flow, prevents CLS */}
        {/* The loader these pages share: the inline script above holds it over
            the first paint, and LogoLoader holds it while a client page fetches
            what it needs (/profile, /dashboard, the service pages). */}
        <div id="initial-loader">
          <div className="loading-logo"></div>
        </div>
        {/* The Koott 2.0 preloader (Figma "Preloader", 7858:79501), over the top
            of it: the wordmark wipes in left to right, its two dots land in
            #4FE18B, and a soft green glow sits along the bottom. Shown once per
            browser session — the script above adds `splash-done` to <html> on
            every visit after the first, which keeps this out of the page
            entirely, so moving between pages never brings it back. */}
        <div id="koott-splash">
          <div className="kl-glow" aria-hidden="true"></div>
          <div className="kl-mark" role="img" aria-label="Koott">
            <img className="kl-mark-base" src="/design/home/logo-white.svg" alt="" width={153} height={51} />
            <span className="kl-mark-wipe">
              <img src="/design/home/logo-splash.svg" alt="" width={153} height={51} />
            </span>
          </div>
          <div className="kl-badge" aria-hidden="true">
            <span className="kl-badge-i">
              <svg viewBox="0 0 20 20"><path d="M2.5 4.6h7.1M6 3v1.6m2 0c0 3.1-2.4 5.7-5.5 5.7m5.5-5.7c0 1.7-.9 3.3-2.3 4.4M7.3 9.1 5 6.9m5.4 8.2h6.1m-7.3 2.3 4.2-9.1 4.1 9.1" fill="none" stroke="#C9FFDB" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="kl-badge-t">India&rsquo;s trusted Therapy App</span>
          </div>
        </div>
        {/* No page-wide <Suspense> here: it made every notFound() page stream a
            200. PostHogProvider keeps its own small boundary for useSearchParams. */}
        <ErrorBoundary>
          <PostHogProvider>
            <ConditionalProviders>
              <HeaderWrapper />
              <ConditionalPadding>
                {children}
              </ConditionalPadding>
              <FooterWrapper />
              <WhatsAppWidgetWrapper />
              <AnalyticsProvider />
            </ConditionalProviders>
          </PostHogProvider>
        </ErrorBoundary>
        <SpeedInsights />
        {/* GA4 + Vercel Analytics: consent-gated, redacted URLs (components/analytics/ThirdPartyAnalytics) */}
        <ThirdPartyAnalytics />
      </body>
    </html>
  );
}
