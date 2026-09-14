// Crawling stays blocked until launch. On the production deploy set
// NEXT_PUBLIC_ALLOW_INDEXING=true (the root layout reads the same flag for its
// robots meta tag).
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export default function robots() {
  return {
    rules: allowIndexing
      ? [
          {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin", "/superadmin", "/finance", "/psychologist", "/profile", "/event-organizer", "/dev", "/api"],
          },
        ]
      : [
          {
            userAgent: "*",
            disallow: "/",
          },
        ],
    // While blocked, do not advertise any URLs.
    ...(allowIndexing ? { sitemap: "https://www.koott.in/sitemap.xml" } : {}),
  };
}
