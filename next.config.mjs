// Search engines are kept out until launch. Set NEXT_PUBLIC_ALLOW_INDEXING=true on the
// production deploy to let them in (app/robots.js, the root metadata, event pages and
// BlogMetaTags read the same flag).
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // While indexing is off, every response — pages, images, PDFs, API proxies — carries
  // a noindex header, so nothing gets indexed even if a crawler ignores robots.txt.
  async headers() {
    if (allowIndexing) return [];
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' }],
      },
    ];
  },
  // Strip console.* in production (logs only on localhost/dev)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // SWC is now enabled (Babel config moved to Jest-only configuration)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // NOTE: Supabase storage URLs are NOT included here because we use a proxy route
      // All Supabase images should go through /api/images/... proxy route which handles
      // authentication and signed URLs properly. Including Supabase here causes Next.js
      // Image Optimization to try fetching directly from Supabase, which fails with 400 errors
      // for private buckets or invalid URLs.
      // Allow images from same domain (for proxy)
      {
        protocol: 'https',
        hostname: 'www.little.care',
      },
      {
        protocol: 'https',
        hostname: 'little.care',
      },
      {
        protocol: 'https',
        hostname: 'www.koott.in',
      },
      {
        protocol: 'https',
        hostname: 'koott.in',
      },
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'iylutfwntoqcnqnjdnnp.supabase.co',
      },
      // Development
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
    // Also allow unoptimized images if needed (fallback)
    unoptimized: false,
  },
  // Force cache busting
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  // Optimize bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Redirect old URLs to canonical psychologist listing
  async redirects() {
    return [
      {
        source: '/online-child-psycologist/:path*',
        destination: '/online-child-psychologist/:path*',
        permanent: true,
      },
      {
        source: '/psychologists',
        destination: '/online-child-psychologist',
        permanent: true,
      },
      {
        source: '/psychologists/',
        destination: '/online-child-psychologist',
        permanent: true,
      },

      // ----- koott.in URLs that this app serves under a different path -------
      // All of these are live, indexed URLs on the Wix site. Keeping them alive
      // preserves inbound links and the SEO already earned against them.
      { source: '/agreement', destination: '/therapy-agreement', permanent: true },
      { source: '/refundpolicy', destination: '/refund-policy', permanent: true },
      { source: '/koottaksharangal', destination: '/blog', permanent: true },

      // Wix serves blog posts from /post/<slug>.
      { source: '/post/:slug', destination: '/blog/:slug', permanent: true },

      // /service-page/:slug is served natively now (app/service-page/[slug]) with
      // the same layout koott.in uses, so it is no longer redirected away.

      // Wix event pages.
      { source: '/event-details/:slug', destination: '/events/:slug', permanent: true },

      // The old MyKoott child-therapy template resolves the same CMS rows as the
      // new top-level condition pages, so it renders the right content in the
      // wrong design. Send it to the canonical URL.
      { source: '/counselling/:slug', destination: '/:slug', permanent: true },

      // ----- live URLs with no page behind them -----------------------------
      // Each of these is a Wix app on koott.in rather than a content page, so
      // there is nothing to port: a forum Wix has discontinued, a workshops
      // widget, a quiz, and three "How can we help you?" concern pickers. They
      // are indexed and linked, so they point at the nearest real page instead
      // of dying. Replace a redirect with a route when the feature gets built.
      { source: '/community', destination: '/blog', permanent: false },
      { source: '/workshops', destination: '/event-list', permanent: false },
      { source: '/depression-test', destination: '/depression-treatment', permanent: false },
      { source: '/feedback', destination: '/get-in-touch', permanent: false },
      { source: '/teens-feelings', destination: '/book-malayali-psychologists', permanent: false },
      { source: '/couple-feelings', destination: '/book-malayali-psychologists', permanent: false },
      { source: '/indvidual-feelings', destination: '/book-malayali-psychologists', permanent: false },

      // Wix editor leftovers that are still in the sitemap.
      { source: '/copy-of-kerala', destination: '/online-counseling-in-kerala', permanent: true },
      { source: '/copy-of-business', destination: '/business', permanent: true },
      { source: '/copy-of-better-you', destination: '/', permanent: true },
    ];
  },
  // Rewrite analytics requests to bypass ad blockers
  // These proxies make analytics requests appear as first-party requests (bypasses ad blockers)
  async rewrites() {
    // Proxy /api/images to Express so next/image and relative /api/images/* URLs work in dev/prod
    const backendOrigin = (
      process.env.BACKEND_INTERNAL_URL ||
      (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api').replace(
        /\/api\/?$/,
        ''
      )
    ).replace(/\/$/, '');

    return [
      {
        source: '/api/images/:path*',
        destination: `${backendOrigin}/api/images/:path*`,
      },
      {
        source: '/posthog/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
};

export default nextConfig;
