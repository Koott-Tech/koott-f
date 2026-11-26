"use client";

/**
 * The client's account page — the Koott 2.0 "Account · A · One page" screen.
 *
 * It used to redirect straight to /profile/sessions. The ?tab= links that other pages
 * still send (tab=receipts, tab=contact…) keep working and redirect as before; only the
 * plain /profile now shows the account screen.
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Account2 from "@/components/account2/Account2";

function ProfileHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(() => !!searchParams.get("tab"));

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab) { setRedirecting(false); return; }
    // Legacy tab=contact pointed at what is now /profile/profile.
    const path = tab === "contact" ? "profile" : tab;
    setRedirecting(true);
    router.replace(`/profile/${path}`);
  }, [router, searchParams]);

  // While a ?tab= link redirects, the profile shell's loader is already on screen.
  if (redirecting) return null;
  return <Account2 />;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileHome />
    </Suspense>
  );
}
