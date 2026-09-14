import styles from "../privacy-policy/privacy-policy.module.css";

/**
 * Terms and Conditions of Service.
 *
 * Copy is the text published at koott.in/terms-and-conditions; the layout and type scale
 * are this page's existing design. Regenerate with scripts rather than editing
 * the prose here by hand, so the two stay in step.
 */

export const metadata = {
    title: { absolute: "Terms & Conditions | Koott Wellness PVT. LTD." },
    description: "Koott Wellness PVT. LTD.'s Terms & Conditions outline expectations for users of their platform, including confidentiality, appointment scheduling, and limitations of liability.",
    alternates: { canonical: "https://www.koott.in/terms-and-conditions" },
    openGraph: {
        title: "Terms & Conditions | Koott Wellness PVT. LTD.",
        description: "Koott Wellness PVT. LTD.'s Terms & Conditions outline expectations for users of their platform, including confidentiality, appointment scheduling, and limitations of liability.",
        type: "website",
        url: "https://www.koott.in/terms-and-conditions",
        siteName: "Koott",
        images: [
            { url: "https://www.koott.in/logo.png", width: 1200, height: 630, alt: "Koott logo" },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Terms & Conditions | Koott Wellness PVT. LTD.",
        description: "Koott Wellness PVT. LTD.'s Terms & Conditions outline expectations for users of their platform, including confidentiality, appointment scheduling, and limitations of liability.",
        images: ["https://www.koott.in/logo.png"],
    },
};

export const dynamic = 'force-static';

export default function TermsAndConditionsPage() {
    // Header.jsx is position:fixed and reserves no space of its own.
    return (
        <div className={`bg-white text-gray-900 ${styles.page}`} style={{ paddingTop: 64 }}>
            <div className="max-w-5xl mx-auto px-6 py-16 lg:px-8 lg:py-24">
                <h1 className={`${styles.title} mt-2 text-gray-900`}>{"Terms and Conditions of Service"}</h1>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"PLEASE READ THE FOLLOWING TERMS AND CONDITIONS OF SERVICE (“TOS”) CAREFULLY BEFORE USING THE WEBSITE."}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Client / You / User: Any natural person using the Services as defined below."}</li>
                    <li key={1}>{"Client Data: Information provided by You at the time of creating a Website user account, including compliance documents (e.g., scanned forms, statutory filings, reports, applications, notices)."}</li>
                    <li key={2}>{"Privacy Policy: The privacy policy available at https://www.koott.in/privacy-policy."}</li>
                    <li key={3}>{"Website: www.koott.in, a proprietary service platform owned and operated by Koott."}</li>
                    <li key={4}>{"Koott / We / Us / Company: Koott Care Pvt. Ltd., registered at Office 101, Vp’s Building, Mukkam, Calicut, Kerala, India, 673602, including its authorized employees and affiliates."}</li>
                    <li key={5}>{"Services: Provision of psychological counselling services for challenges or issues Clients may face in their lives. Services exclude counselling for psychotic disorders or Clients with suicidal tendencies."}</li>
                    <li key={6}>{"Counsellors: Professionals registered on the Website who provide emotional wellness support."}</li>
                    <li key={7}>{"This TOS, the Privacy Policy, Refund Policy, and any other Website policies together form the Agreement."}</li>
                    <li key={8}>{"Accessing Koott via mobile application is governed by this Agreement, plus any additional terms imposed by app stores."}</li>
                    <li key={9}>{"References to “Website” also include Koott’s mobile application."}</li>
                    <li key={10}>{"Services under this Agreement are offered within India unless specified otherwise."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"1.1 Users"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Registered Users: Those who register and create an account (with user ID and password) to access Services."}</li>
                    <li key={1}>{"Non-Registered Users: Those who access general information without registering."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"1.2 Features"}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"For Registered Users"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Obtain general information and guidance from Counsellors."}</li>
                    <li key={1}>{"View responses to questions asked by other Users."}</li>
                    <li key={2}>{"Schedule in-person appointments at Counsellors’ premises."}</li>
                    <li key={3}>{"Interact privately with Counsellors via chat or phone."}</li>
                    <li key={4}>{"Pay consultation fees (including Koott’s internet handling fee)."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"For Non-Registered Users"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Access Counsellor profiles (name, qualifications, fees, experience, memberships)."}</li>
                    <li key={1}>{"View indicative Counsellor appointment availability."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"For Counsellors"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Publish profiles visible to Users."}</li>
                    <li key={1}>{"Interact privately with Registered Users via Website features."}</li>
                    <li key={2}>{"Receive fees for offline sessions facilitated through Koott."}</li>
                    <li key={3}>{"Respond to general User questions."}</li>
                    <li key={4}>{"Contribute articles or materials on emotional wellness."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"1.3 Content Types"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"User Content: Questions, data, and interactions submitted by Users."}</li>
                    <li key={1}>{"Counsellor Content: Responses, articles, and educational materials from Counsellors."}</li>
                    <li key={2}>{"Koott Content: Proprietary content generated or procured by Koott."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"2.1 Obligations of All Users"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Use only in compliance with Indian laws."}</li>
                    <li key={1}>{"Ensure all information provided is accurate, complete, and not misleading."}</li>
                    <li key={2}>{"Do not upload malware, spyware, viruses, or malicious software."}</li>
                    <li key={3}>{"No use of bots, scrapers, or automated tools without written consent."}</li>
                    <li key={4}>{"Do not copy, sell, sub-license, or commercially exploit Website materials without authorization."}</li>
                    <li key={5}>{"Koott reserves the right to restrict access to certain Website areas."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"2.2 Registered Users"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Koott is not a psychiatric care provider and does not treat suicidal ideation or severe mental illness."}</li>
                    <li key={1}>{"Verify any information received from Counsellors independently."}</li>
                    <li key={2}>{"Appointment scheduling is facilitated but Koott does not endorse or guarantee any Counsellor."}</li>
                    <li key={3}>{"Consent must be obtained before posting User Content."}</li>
                    <li key={4}>{"Users are responsible for activities conducted on their account (including for family or friends)."}</li>
                    <li key={5}>{"Fees for sessions are payable in advance to Koott (including handling charges)."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"2.3 Non-Registered Users"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"May view Counsellor profiles and availability but Koott does not endorse any Counsellor."}</li>
                    <li key={1}>{"Koott acts as a technology intermediary under the Information Technology Act, 2000."}</li>
                    <li key={2}>{"Provides a platform for hosting User Content, Counsellor Content, scheduling, payments, and preliminary interactions."}</li>
                    <li key={3}>{"Not liable for: Service outcomes between Counsellors and Users. Business or consequential losses. Events outside its reasonable control."}</li>
                    <li key={4}>{"Service outcomes between Counsellors and Users."}</li>
                    <li key={5}>{"Business or consequential losses."}</li>
                    <li key={6}>{"Events outside its reasonable control."}</li>
                    <li key={7}>{"Koott may monitor and remove inappropriate content but is not obligated to pre-screen."}</li>
                    <li key={8}>{"Illegal or fraudulent activity may be reported to authorities."}</li>
                    <li key={9}>{"Website may contain links to third-party websites."}</li>
                    <li key={10}>{"Koott does not endorse or control third-party sites."}</li>
                    <li key={11}>{"Users visit such sites at their own risk and are bound by third-party terms of use."}</li>
                    <li key={12}>{"All Website software, design, and content belong to Koott or its licensors."}</li>
                    <li key={13}>{"“Koott” is a registered trademark."}</li>
                    <li key={14}>{"Users are granted a limited, non-commercial, personal use license."}</li>
                    <li key={15}>{"Unauthorized reproduction, sale, framing, or derivative works are prohibited."}</li>
                    <li key={16}>{"Users retain ownership of their content but grant Koott a worldwide, royalty-free license to use for promotional or educational purposes."}</li>
                    <li key={17}>{"Koott may collect personal data during registration and use."}</li>
                    <li key={18}>{"Use of data is governed by the Privacy Policy."}</li>
                    <li key={19}>{"By registering, You consent to such use."}</li>
                    <li key={20}>{"Interactions with Counsellors are strictly between Users and Counsellors."}</li>
                    <li key={21}>{"Koott does not provide medical advice, diagnosis, or treatment."}</li>
                    <li key={22}>{"Counsellor information is self-reported and may change; Users should verify independently."}</li>
                    <li key={23}>{"No professional relationship exists between Koott and Users."}</li>
                    <li key={24}>{"The Website is provided “as is” and “as available.”"}</li>
                    <li key={25}>{"Koott disclaims liability for: Counsellor performance or qualifications. Accuracy of information. Technical disruptions, data loss, or delayed notifications. Security breaches beyond its control."}</li>
                    <li key={26}>{"Counsellor performance or qualifications."}</li>
                    <li key={27}>{"Accuracy of information."}</li>
                    <li key={28}>{"Technical disruptions, data loss, or delayed notifications."}</li>
                    <li key={29}>{"Security breaches beyond its control."}</li>
                    <li key={30}>{"Koott’s liability is limited to the amount actually paid by the User for Services."}</li>
                    <li key={31}>{"No liability for indirect, special, incidental, or consequential damages."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"By using the Website, You warrant that:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"You are at least 18 years old."}</li>
                    <li key={1}>{"Registration details are accurate and updated."}</li>
                    <li key={2}>{"You will use the Website for personal, lawful purposes only."}</li>
                    <li key={3}>{"You will not: Modify or delete Website legal notices. Reverse engineer Website code. Upload unlawful, obscene, defamatory, or harmful content. Upload viruses or impersonate others."}</li>
                    <li key={4}>{"Modify or delete Website legal notices."}</li>
                    <li key={5}>{"Reverse engineer Website code."}</li>
                    <li key={6}>{"Upload unlawful, obscene, defamatory, or harmful content."}</li>
                    <li key={7}>{"Upload viruses or impersonate others."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"You agree to indemnify and hold harmless Koott, its affiliates, employees, Counsellors, and service providers from any claims, damages, or losses arising from:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Your use of the Website."}</li>
                    <li key={1}>{"Your breach of this Agreement."}</li>
                    <li key={2}>{"Your negligence or misconduct."}</li>
                    <li key={3}>{"Koott may suspend or terminate accounts for breach, fraud, or misuse."}</li>
                    <li key={4}>{"Upon termination, all rights to access the Website cease immediately."}</li>
                    <li key={5}>{"Koott may delete related information without liability."}</li>
                    <li key={6}>{"This Agreement is governed by the laws of India."}</li>
                    <li key={7}>{"Exclusive jurisdiction lies with the courts in Kerala, India."}</li>
                    <li key={8}>{"Koott may amend this Agreement at any time without prior notice."}</li>
                    <li key={9}>{"Users will be notified via the Website or email. Continued use constitutes acceptance."}</li>
                    <li key={10}>{"Disputes will be resolved by binding arbitration under the Arbitration and Conciliation Act, 1996."}</li>
                    <li key={11}>{"Arbitration shall be conducted in English, seated in Kerala."}</li>
                    <li key={12}>{"Koott will appoint a sole arbitrator."}</li>
                    <li key={13}>{"Interim relief may be sought from courts."}</li>
                    <li key={14}>{"Severability: Invalid provisions will not affect the remainder."}</li>
                    <li key={15}>{"Notices: Communications to Koott must be in writing to: Koott Care Pvt. Ltd., Office 101, Vp’s Building, Mukkam, Calicut, Kerala, 673602. Communications to Users will be via their registered email."}</li>
                    <li key={16}>{"Waiver: Must be in writing; no implied waivers."}</li>
                    <li key={17}>{"Entire Agreement: This Agreement is the full understanding between parties."}</li>
                    <li key={18}>{"Force Majeure: Koott is not liable for delays beyond its control."}</li>
                    <li key={19}>{"Advertisement: Koott may place advertisements on the Website."}</li>
                    <li key={20}>{"Assignment: Users may not assign rights without Koott’s consent."}</li>
                    <li key={21}>{"Conflict of Terms: Order of precedence: Privacy Policy → TOS → Refund Policy → Other Policies."}</li>
                    <li key={22}>{"Complaints: Users may contact support at care@koott.in or call +91 95671 61611."}</li>
                    <li key={23}>{"If a video session is scheduled within 1 hour of the appointment, the Google Meet link will be sent at least 5 minutes prior to the appointment."}</li>
                </ul>
            </div>
        </div>
    );
}
