import "./globals.css";
import { Suspense } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import HeaderWrapper from "@/components/HeaderWrapper";
import { fetchConditionMenu } from "@/lib/conditionMenu";
import FooterWrapper from "@/components/FooterWrapper";
import ConditionalProviders from "@/components/ConditionalProviders";
import ConditionalPadding from "@/components/ConditionalPadding";
import WhatsAppWidgetWrapper from "@/components/WhatsAppWidgetWrapper";
import PageLoadingOverlay from "@/components/PageLoadingOverlay";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PostHogProvider } from "@/components/PostHogProvider";

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
  // Header condition menu in the first HTML, so its headings show before any script
  // runs (cached 5 min; [] if the API is slow or down — the browser then fills it in).
  const conditionMenu = await fetchConditionMenu();
  return (
    <html lang="en">
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
        {/* Preload logo for instant loading screen display */}
        <link rel="preload" as="image" href="/main-logo.png" />
        {/* CRITICAL: Script to manage loader - runs only on client side to prevent hydration mismatch */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Only run on client side (not during SSR)
                if (typeof window === 'undefined') return;
                
                const LOADER_ID = 'initial-loader';
                // This runs in <head>, before <body> and the loader exist — both are
                // looked up again when the loader is hidden.
                let body = document.body;
                let loader = document.getElementById(LOADER_ID);
                // No minimum: the loader only covers the time the page really needs.
                const MIN_DISPLAY_TIME = 0;
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
             #initial-loader .loading-logo {
              width: 720px;
              height: 237px;
              margin: 0 auto;
              /* The file is a 500px square with the wordmark inset; these
                 numbers scale and offset it so the wordmark itself fills the
                 720x237 box instead of sitting small inside all that padding. */
              background-image: url('/main-logo.png');
              background-size: 968px 971px;
              background-repeat: no-repeat;
              background-position: -151px -365px;
              animation: pulseScale 2s ease-in-out infinite;
            }
            @keyframes pulseScale {
              0% { transform: scale(1); opacity: 0.9; }
              50% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 0.9; }
            }
            @media (max-width: 767px) {
              #initial-loader .loading-logo {
                width: 500px !important;
                height: 165px !important;
              }
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
        <div id="initial-loader">
          <div className="loading-logo"></div>
        </div>
        {/* Client-side PageLoadingOverlay - handles navigation transitions */}
        <Suspense fallback={null}>
          <PageLoadingOverlay />
        </Suspense>
        {/* No page-wide <Suspense> here: it made every notFound() page stream a
            200. PostHogProvider keeps its own small boundary for useSearchParams. */}
        <ErrorBoundary>
          <PostHogProvider>
            <ConditionalProviders>
              <HeaderWrapper conditionMenu={conditionMenu} />
              <ConditionalPadding>
                {children}
              </ConditionalPadding>
              <FooterWrapper />
              <WhatsAppWidgetWrapper />
            </ConditionalProviders>
          </PostHogProvider>
        </ErrorBoundary>
        <SpeedInsights />
        <Analytics />
        {/* Google Analytics - Load after interactive to prevent forced reflows */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-K7Z8F94Z80"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-K7Z8F94Z80');
          `}
        </Script>
      </body>
    </html>
  );
}
