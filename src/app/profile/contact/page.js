"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContactRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile/profile');
  }, [router]);

  // Don't render a loading spinner here: the profile shell already holds the loader.
  return null;
}
