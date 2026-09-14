import styles from "./therapy-agreement.module.css";

/**
 * Therapy Agreement.
 *
 * Copy is the text published at koott.in/agreement; the layout and type scale
 * are this page's existing design. Regenerate with scripts rather than editing
 * the prose here by hand, so the two stay in step.
 */

export const metadata = {
    title: { absolute: "Therapy Agreement | Koott Wellness PVT. LTD." },
    description: "Understand our therapy agreement before booking your appointment with a Koott therapist. Learn about session fees, cancellation policies, and patient confidentiality",
    alternates: { canonical: "https://www.koott.in/therapy-agreement" },
    openGraph: {
        title: "Therapy Agreement | Koott Wellness PVT. LTD.",
        description: "Understand our therapy agreement before booking your appointment with a Koott therapist. Learn about session fees, cancellation policies, and patient confidentiality",
        type: "website",
        url: "https://www.koott.in/therapy-agreement",
        siteName: "Koott",
        images: [
            { url: "https://www.koott.in/logo.png", width: 1200, height: 630, alt: "Koott logo" },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Therapy Agreement | Koott Wellness PVT. LTD.",
        description: "Understand our therapy agreement before booking your appointment with a Koott therapist. Learn about session fees, cancellation policies, and patient confidentiality",
        images: ["https://www.koott.in/logo.png"],
    },
};

export const dynamic = 'force-static';

export default function TherapyAgreementPage() {
    // Header.jsx is position:fixed and reserves no space of its own.
    return (
        <div className={`bg-white text-gray-900 ${styles.page}`} style={{ paddingTop: 64 }}>
            <div className="max-w-5xl mx-auto px-6 py-16 lg:px-8 lg:py-24">
                <h1 className={`${styles.title} mt-2 text-gray-900`}>{"Therapy Agreement"}</h1>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Company: Koott Care Pvt. Ltd. Services Covered: Individual Therapy, Couple Therapy, Child Therapy, Corporate Wellness Sessions, and Psychiatry Consultations (delivered exclusively through online/tele-therapy platforms)."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Psychological therapy is not easily described in general statements. The process varies depending on the personalities of both the therapist and the client, as well as the particular concerns you bring forward."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Therapy is not like a medical consultation. It requires active participation from you. To maximize effectiveness, you may be expected to apply strategies, exercises, or reflective practices outside of the sessions."}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Sessions are generally 50 minutes in length, scheduled once a week, and typically run for 4–5 sessions depending on therapeutic need."}</li>
                    <li key={1}>{"Fees are determined by the therapist you select and are to be paid before each session."}</li>
                    <li key={2}>{"Professional services outside scheduled sessions (e.g., assessments, reports, written summaries, or extended communication) are also chargeable."}</li>
                    <li key={3}>{"Cancellations/Rescheduling: Clients must provide at least 24 hours’ prior notice. Sessions canceled without such notice will be fully charged."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Therapy may involve discussing distressing aspects of life, which can evoke difficult emotions such as sadness, guilt, anger, frustration, or loneliness. These experiences are a normal part of the process."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"At the same time, therapy has shown substantial benefits, including improved coping, better emotional balance, personal growth, and enhanced relationships."}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Koott Care maintains professional clinical records in compliance with legal and ethical standards."}</li>
                    <li key={1}>{"Clients are not automatically entitled to full records. If a report or summary is required (for example, for medical, educational, or organizational purposes), this must be formally discussed with the therapist. Charges may apply depending on the nature of the request and assessments involved."}</li>
                    <li key={2}>{"Reports and psychological assessments may carry additional charges based on the tests or tools used."}</li>
                    <li key={3}>{"Parents/guardians may legally have access to a minor’s records. However, it is our practice to request that parents/guardians waive this right to ensure confidentiality."}</li>
                    <li key={4}>{"Only general progress updates will be provided unless there is a serious risk of harm to the child or others. In such cases, specific information may be shared with parents/guardians."}</li>
                    <li key={5}>{"A treatment summary may be provided at the conclusion of therapy. Where possible, discussions with the minor will precede the sharing of any information."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"All communications between client and therapist are confidential, with the following legal and ethical exceptions:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Risk of Harm: If the client poses a threat of serious harm to themselves or others, protective action may be taken (e.g., contacting family, police, or hospitalization)."}</li>
                    <li key={1}>{"Abuse or Neglect: Therapists are legally obligated to report suspected abuse or neglect of a child, elderly person, or dependent adult."}</li>
                    <li key={2}>{"Court Orders: Confidentiality may be breached if mandated by a valid court order in medicolegal cases."}</li>
                    <li key={3}>{"Professional Consultation: Therapists may occasionally consult with other professionals for supervision. Client identities are protected in such cases."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott Care does not provide 24-hour emergency or crisis services. If you experience suicidal thoughts or a mental health crisis:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Contact your local emergency services immediately,"}</li>
                    <li key={1}>{"Or go to the nearest hospital emergency department."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Suicidal Contract (Commitment to Safety): By signing this agreement, you confirm that:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"You will inform your therapist if you are experiencing suicidal thoughts."}</li>
                    <li key={1}>{"You agree to use emergency resources when necessary."}</li>
                    <li key={2}>{"You acknowledge that online therapy is not a substitute for crisis intervention."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Since services are delivered online, clients acknowledge and accept the following limitations:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Privacy: Clients should ensure they attend sessions from a private, quiet location where they will not be interrupted."}</li>
                    <li key={1}>{"Technical Issues: Despite secure technology, risks such as poor connectivity, disruption, or unauthorized interception cannot be fully eliminated."}</li>
                    <li key={2}>{"Rescheduling: If sessions are disrupted due to technical failure, the remaining time may be added to a subsequent session, or a fresh appointment will be scheduled."}</li>
                    <li key={3}>{"Limitations: Online therapy may not be appropriate for severe psychiatric conditions (e.g., active psychosis, high suicide risk). Such cases may be referred for in-person or hospital care."}</li>
                    <li key={4}>{"The therapist acts as a neutral facilitator and does not guarantee resolution or continuation of the relationship."}</li>
                    <li key={5}>{"A copy of this agreement will be emailed to both parties, and both must consent."}</li>
                    <li key={6}>{"Any disputes regarding the agreement should be communicated to Koott Care in writing."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott Care and its therapists are not intended to participate in legal disputes. However, if a therapist is required by subpoena, request, or order to provide records, reports, or court testimony, the client is responsible for all professional fees, preparation time, travel, and documentation costs."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Please note: a subpoena does not automatically permit release of records. A valid client consent or court order is required, and therapists remain bound by ethical and legal standards."}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Fees are discussed with you prior to commencing therapy."}</li>
                    <li key={1}>{"Payment must be made before each session, in the mode agreed upon (UPI, card, bank transfer, etc.)."}</li>
                    <li key={2}>{"Missed or late-canceled sessions (less than 24 hours’ notice) are fully chargeable."}</li>
                    <li key={3}>{"Therapy is a voluntary process. You confirm that you are entering into therapy of your own free will."}</li>
                    <li key={4}>{"You retain the right to discontinue therapy at any point without penalty."}</li>
                    <li key={5}>{"Discontinuation does not create liability for Koott Care or its therapists."}</li>
                    <li key={6}>{"All personal data and clinical records are stored securely with limited access."}</li>
                    <li key={7}>{"Koott Care complies with Indian privacy laws, and where relevant, international standards such as GDPR."}</li>
                    <li key={8}>{"Sessions are not recorded unless explicit prior written consent is given by the client."}</li>
                    <li key={9}>{"Clients are not permitted to record sessions without written consent from Koott Care."}</li>
                    <li key={10}>{"Therapists are not available for therapy via calls, messages, or email outside scheduled sessions."}</li>
                    <li key={11}>{"Communication outside sessions is strictly for scheduling or administrative purposes."}</li>
                    <li key={12}>{"Responses may take 24–48 business hours."}</li>
                    <li key={13}>{"You may end therapy at any time."}</li>
                    <li key={14}>{"Your therapist may also terminate therapy under certain circumstances, including: Non-payment of fees, Abusive or threatening behavior, Persistent non-compliance, If therapy is deemed ineffective."}</li>
                    <li key={15}>{"Non-payment of fees,"}</li>
                    <li key={16}>{"Abusive or threatening behavior,"}</li>
                    <li key={17}>{"Persistent non-compliance,"}</li>
                    <li key={18}>{"If therapy is deemed ineffective."}</li>
                    <li key={19}>{"Where appropriate, referral options will be provided."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott Care provides services in an inclusive and professional manner, without discrimination based on religion, caste, gender, marital status, sexual orientation, disability, or background. Mutual respect is expected at all times."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"All therapy-related materials (worksheets, assessments, tests, handouts) are for personal use only. They remain the intellectual property of Koott Care and must not be shared, copied, or distributed without written consent."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Koott Care Pvt. Ltd. does not accept or process insurance claims. Clients are fully responsible for all payments."}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"In corporate wellness services, client confidentiality is fully maintained."}</li>
                    <li key={1}>{"Employers will never receive individual session details."}</li>
                    <li key={2}>{"Only anonymized or aggregated reports (e.g., number of sessions attended) may be shared with organizations."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"This Agreement shall be governed by the laws of India. Any dispute arising shall fall under the exclusive jurisdiction of the courts in Calicut, Kerala."}</p>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"By electronically ticking the acceptance box while booking, you confirm that you:"}</p>
                <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-700 list-disc list-inside">
                    <li key={0}>{"Have read and understood the terms of this agreement,"}</li>
                    <li key={1}>{"Enter therapy voluntarily and with informed consent,"}</li>
                    <li key={2}>{"Understand the risks, benefits, and limitations of therapy,"}</li>
                    <li key={3}>{"Consent to participate in services provided by Koott Care Pvt. Ltd."}</li>
                </ul>
                <p className="mt-4 text-base leading-relaxed text-gray-700">{"Client(s) Email for Records: ________________________ Signature (Electronic Acceptance): ___________________"}</p>
            </div>
        </div>
    );
}
