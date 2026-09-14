import styles from "./refund-policy.module.css";

/**
 * Refund & Cancellation Policy.
 *
 * Copy is the text published at koott.in/refundpolicy; the layout and type scale
 * are this page's existing design. Regenerate with scripts rather than editing
 * the prose here by hand, so the two stay in step.
 */

export const metadata = {
    title: { absolute: "Refund Policy | Koott Wellness PVT. LTD." },
    description: "Koott Wellness: Get clear on refund options for online therapy sessions. Know cancellation deadlines and exceptions.",
    alternates: { canonical: "https://www.koott.in/refund-policy" },
    openGraph: {
        title: "Refund Policy | Koott Wellness PVT. LTD.",
        description: "Koott Wellness: Get clear on refund options for online therapy sessions. Know cancellation deadlines and exceptions.",
        type: "website",
        url: "https://www.koott.in/refund-policy",
        siteName: "Koott",
        images: [
            { url: "https://www.koott.in/logo.png", width: 1200, height: 630, alt: "Koott logo" },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Refund Policy | Koott Wellness PVT. LTD.",
        description: "Koott Wellness: Get clear on refund options for online therapy sessions. Know cancellation deadlines and exceptions.",
        images: ["https://www.koott.in/logo.png"],
    },
};

export const dynamic = 'force-static';

export default function RefundPolicyPage() {
    // Header.jsx is position:fixed and reserves no space of its own.
    return (
        <div className={`bg-white text-gray-900 ${styles.page}`} style={{ paddingTop: 64 }}>
            <div className="max-w-5xl mx-auto px-6 py-16 lg:px-8 lg:py-24">
                <h1 className={`${styles.title} mt-2 text-gray-900`}>{"Refund & Cancellation Policy"}</h1>
                <h3 className={`${styles.sectionHeading} mt-10 text-gray-900`}>{"1. Refunds and Rescheduling"}</h3>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"​Our policy is based on two simple rules:"}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Refunds"}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Any payment, whether for a single session or a package, may be refunded within 30 days from the date of payment, provided that the session has not been booked less than 24 hours before the scheduled session. After 30 days, the payment is no longer eligible for a refund."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Rescheduling"}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"A booked session can be rescheduled at no additional cost if the request is made at least 24 hours before the scheduled session time. Requests made less than 24 hours before the session cannot be rescheduled, and the session will not be eligible for a refund."}</p>
                <h3 className={`${styles.sectionHeading} mt-10 text-gray-900`}>{"If you have already used part of a package"}</h3>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"If you have purchased a package and have already attended some of the sessions, the sessions you have completed will be charged at the applicable standard session price. The remaining eligible balance will then be refunded to the original payment method."}</p>
                <h3 className={`${styles.sectionHeading} mt-10 text-gray-900`}>{"How your refund is processed"}</h3>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Once a refund is approved, Koott will process the refund within 7 days of the approved refund request. The time taken for the amount to appear in your account may vary depending on your bank, card issuer, payment gateway, or other payment provider."}</p>
                <h3 className={`${styles.sectionHeading} mt-10 text-gray-900`}>{"What if you missed the cancellation or rescheduling deadline?"}</h3>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"If you were unable to cancel or reschedule at least 24 hours before your scheduled session, the session will be treated according to our no-show/late cancellation policy."}</p>
            </div>
        </div>
    );
}
