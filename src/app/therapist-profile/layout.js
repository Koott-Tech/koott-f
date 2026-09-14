import React from 'react';

// Default metadata for therapist profile page
// Note: Dynamic metadata based on ?doctor= query param will be handled client-side
// since Next.js layouts don't have access to searchParams
export const metadata = {
  title: "Psychologist Profile | Koott",
  description:
    "View a Koott psychologist’s experience, specialisation and available online counselling slots.",
  openGraph: {
    title: "Psychologist Profile | Koott",
    description:
      "View a Koott psychologist’s experience, specialisation and available online counselling slots.",
    type: "profile",
    url: "https://www.koott.in/therapist-profile",
    images: [
      {
        url: "https://www.koott.in/logo.png",
        width: 1200,
        height: 630,
        alt: "Koott logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Psychologist Profile | Koott",
    description:
      "View a Koott psychologist’s experience, specialisation and available online counselling slots.",
    images: ["https://www.koott.in/logo.png"],
  },
  alternates: {
    canonical: "https://www.koott.in/therapist-profile",
  },
};

export default function TherapistProfileLayout({ children }) {
  return children;
}
