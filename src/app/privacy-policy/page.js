import styles from "./privacy-policy.module.css";

/**
 * Privacy Policy.
 *
 * Copy is the text published at koott.in/privacy-policy; the layout and type scale
 * are this page's existing design. Regenerate with scripts rather than editing
 * the prose here by hand, so the two stay in step.
 */

export const metadata = {
    title: { absolute: "Privacy Policy | Koott Wellness PVT. LTD." },
    description: "Confidentiality assured at Koott Wellness. Discover how your online therapy sessions stay private. Explore data practices for peace of mind.",
    alternates: { canonical: "https://www.koott.in/privacy-policy" },
    openGraph: {
        title: "Privacy Policy | Koott Wellness PVT. LTD.",
        description: "Confidentiality assured at Koott Wellness. Discover how your online therapy sessions stay private. Explore data practices for peace of mind.",
        type: "website",
        url: "https://www.koott.in/privacy-policy",
        siteName: "Koott",
        images: [
            { url: "https://www.koott.in/logo.png", width: 1200, height: 630, alt: "Koott logo" },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Privacy Policy | Koott Wellness PVT. LTD.",
        description: "Confidentiality assured at Koott Wellness. Discover how your online therapy sessions stay private. Explore data practices for peace of mind.",
        images: ["https://www.koott.in/logo.png"],
    },
};

export const dynamic = 'force-static';

export default function PrivacyPolicyPage() {
    // Header.jsx is position:fixed and reserves no space of its own.
    return (
        <div className={`bg-white text-gray-900 ${styles.page}`} style={{ paddingTop: 64 }}>
            <div className="max-w-5xl mx-auto px-6 py-16 lg:px-8 lg:py-24">
                <h1 className={`${styles.title} mt-2 text-gray-900`}>{"Privacy Policy"}</h1>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott Care Pvt. Ltd. (\"Koott\") is the owner and operator of [https://www.koott.in]. Koott is committed to safeguarding your privacy."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"This policy (hereinafter “Privacy Policy”) discloses Koott’s practices for its website and subscriber-based services (“Services”), including the type of information collected, the method of such collection, the use of such information, and circumstances under which such information may be shared with third parties."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"This document comprises Koott’s Privacy Policy and is accessible on https://www.koott.in."}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Sensitive Personal Data or Information (“SPDI”) means Personal Information consisting of: (a) Password; (b) Financial information such as bank account, credit card, debit card, or other payment instrument details; (c) Physical, physiological, and mental health condition; (d) Sexual orientation; (e) Medical records and history; (f) Biometric information; (g) Any detail relating to the above provided by an individual to Koott for providing Services; (h) Any of the above information received by Koott under a lawful contract or otherwise. Exclusion: Information that is freely available in the public domain, or furnished under the Right to Information Act, 2005, or under any other applicable law, shall not be regarded as SPDI."}</li>
                    <li key={1}>{"Personal Information means any information relating to a natural person that, directly or indirectly, in combination with other information available or likely to be available with Koott, is capable of identifying such person."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Any person, including Koott and its representatives, who collects, receives, stores, processes, or handles SPDI or Personal Information shall be governed by this Privacy Policy."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott’s Privacy Policy is guided by principles of transparency, lawful purpose, necessity, accountability, and security when handling Personal Information and SPDI."}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"By using our website or Services, you consent to Koott’s collection and processing of your Personal Information."}</li>
                    <li key={1}>{"If SPDI is required, Koott shall seek your express consent before collection."}</li>
                    <li key={2}>{"Clicking on the “I Accept” tick box on the website constitutes valid consent."}</li>
                    <li key={3}>{"By accepting this Privacy Policy, you represent that you are at least 18 years of age."}</li>
                    <li key={4}>{"If under 18 years, a parent or legal guardian must accept on your behalf."}</li>
                    <li key={5}>{"If you refuse to provide required information, Koott may be unable to deliver Services or customize your user experience."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott may collect Personal Information and SPDI where reasonable and necessary, including:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Information you provide: Name, email address, address, telephone number, financial details, health records, etc."}</li>
                    <li key={1}>{"Information from usage of Services: Device details, IP address, browser type, operating system, location data, activity logs, passwords used within Services."}</li>
                    <li key={2}>{"Other information capable of identifying you."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"You may be required to provide information during:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Account registration and identification;"}</li>
                    <li key={1}>{"Subscribing to paid Services;"}</li>
                    <li key={2}>{"Providing health-related documents;"}</li>
                    <li key={3}>{"Participating in surveys and reviews;"}</li>
                    <li key={4}>{"Communicating with Koott via email, calls, or otherwise."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott also collects aggregated user behavior data (cookies, pixel tags, analytics) to improve Services."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott collects and uses Personal Information and SPDI:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"For delivering Services and maintaining records;"}</li>
                    <li key={1}>{"For customer support, training, and quality assurance (including recording sessions where lawful);"}</li>
                    <li key={2}>{"For surveys, analytics, and service improvement;"}</li>
                    <li key={3}>{"For legal compliance and business continuity."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott shall:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Use data only on lawful basis and for legitimate business purposes;"}</li>
                    <li key={1}>{"Inform users of intended use;"}</li>
                    <li key={2}>{"Retain records only for as long as legally required;"}</li>
                    <li key={3}>{"Ensure secure disposal after retention."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott shall not publish, trade, or disclose your SPDI or Personal Information without consent, except:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"With affiliates, trusted business partners, and technology vendors bound by confidentiality;"}</li>
                    <li key={1}>{"With third parties strictly for purposes authorized by Koott and in compliance with this Policy;"}</li>
                    <li key={2}>{"With government or law enforcement, if required by law."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott ensures all third parties receiving data maintain the same level of protection required under Indian law."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"You may withdraw your consent for collection, storage, use, or disclosure of SPDI or Personal Information at any time by writing to the Grievance Officer (details below). Withdrawal may affect Koott’s ability to provide Services."}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Users are responsible for ensuring data accuracy."}</li>
                    <li key={1}>{"Updates should be sent to hello@koott.in. Verification may be required."}</li>
                    <li key={2}>{"Koott shall update its records upon request but is not responsible for authenticity of data provided."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott Care Pvt. Ltd. shall:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Retain information only as long as necessary or legally required;"}</li>
                    <li key={1}>{"Securely dispose of information after retention expiry."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"You have the right to:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Access information held about you;"}</li>
                    <li key={1}>{"Request correction of inaccuracies;"}</li>
                    <li key={2}>{"Withdraw consent or opt-out of communications;"}</li>
                    <li key={3}>{"Restrict processing in certain cases;"}</li>
                    <li key={4}>{"Have grievances addressed promptly."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott maintains appropriate technical and organizational security measures, including:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Encryption, access controls, and secure data transmission;"}</li>
                    <li key={1}>{"Confidentiality training for staff and contractual obligations for third-party processors;"}</li>
                    <li key={2}>{"Periodic security reviews and audits;"}</li>
                    <li key={3}>{"Restricting access to authorized personnel only."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Where Personal Information is transferred outside India, Koott ensures equivalent data protection in the recipient jurisdiction."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Transmission of data over the Internet cannot be guaranteed to be completely secure. While Koott adopts commercially reasonable security practices, transmission is at the user’s risk."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott shall not be liable for any loss, damage, or misuse of information resulting from events beyond its reasonable control (“Force Majeure”), including but not limited to natural disasters, cyberattacks, government actions, strikes, riots, or system failures."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"As required by the Information Technology Act, 2000 and rules thereunder, the details of Koott’s Grievance Officer are:"}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Ms. Athullya O Grievance Officer, Koott Care Pvt. Ltd. Email: hello@koott.in"}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Only communications addressed to this official email will be treated as valid for Privacy Policy purposes."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"This document is an electronic record under the Information Technology Act, 2000. It does not require physical or digital signatures."}</p>
            </div>
        </div>
    );
}
