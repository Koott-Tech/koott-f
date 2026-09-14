import { notFound } from "next/navigation";

// Editor test pages (/dev/*) — local development only. They 404 on a production
// build unless NEXT_PUBLIC_ENABLE_DEV_PAGES=true.
export default function DevLayout({ children }) {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ENABLE_DEV_PAGES !== "true") {
    notFound();
  }
  return children;
}
