"use client";

/**
 * /faq. Copy lives in data/faqContent.js; the admin "Pages → FAQ" editor
 * stores changes under site-config `site_faq`. `content` (the editor's live
 * preview) replaces the stored copy.
 */

import { useState } from "react";
import { useSiteContent } from "@/lib/useSiteContent";
import FAQ_DEFAULTS from "@/data/faqContent";

export default function FaqPage({ content: override } = {}) {
  const { intro, items } = useSiteContent("site_faq", FAQ_DEFAULTS, override);
  const [openId, setOpenId] = useState("");

  return (
    <div className="w-full min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 767px) {
          .faq-main-heading {
            line-height: 1.4 !important;
          }
        }
      `}} />
      {/* Hero Section */}
      <section className="w-full py-16 md:py-20 px-4 md:px-6 lg:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="faq-main-heading text-[2.5rem] md:text-4xl lg:text-5xl font-medium leading-[1.0] md:leading-tight mb-4 md:mb-6 mt-8 md:mt-0 tracking-[-0.195rem]" style={{ color: '#012f23' }}>
            {intro.title}
          </h1>
          {intro.lead && (
            <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
              {intro.lead}
            </p>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full px-4 md:px-6 lg:px-6 pb-16 md:pb-24">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 767px) {
            .faq-heading {
              font-size: 16px !important;
              font-weight: 600;
              line-height: 1.4;
            }
            .faq-answer {
              font-size: 14px !important;
              line-height: 1.5;
            }
          }
        `}} />
        <div className="mx-auto max-w-4xl">
          <div className="space-y-0">
            {(items || []).map((item, index) => {
              const id = `${index}`;
              const open = openId === id;
              return (
                <div key={id} className="border-b border-gray-200 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? "" : id)}
                    className="flex w-full items-center justify-between py-3 md:py-4 text-left hover:bg-white transition-colors px-2 md:px-0 cursor-pointer"
                  >
                    <span className="faq-heading text-xs md:text-sm lg:text-base text-gray-900 w-full md:w-auto pr-2 md:pr-3 lg:pr-0">
                      {item.q}
                    </span>
                    <Chevron className={`h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-gray-800 transition-transform flex-shrink-0 ${open ? "rotate-180" : "rotate-0"}`} />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      open ? "max-h-96 md:max-h-64 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-2 pb-3 md:px-0 md:pb-4">
                      <p className="faq-answer md:text-sm leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function Chevron({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.19l3.71-2.96a.75.75 0 11.94 1.17l-4.24 3.38a.75.75 0 01-.94 0L5.27 8.34a.75.75 0 01-.04-1.13z"
        clipRule="evenodd"
      />
    </svg>
  );
}
