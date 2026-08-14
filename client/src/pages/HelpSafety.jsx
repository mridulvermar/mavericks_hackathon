import React, { useState } from 'react'
import { Phone, Shield, AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

const faqs = [
  { q: 'How do I get my first booking?', a: 'Complete your profile, add your skills, and apply to opportunities near you. Clients will contact you through our safe messaging system.' },
  { q: 'Is it safe to work with strangers?', a: 'All clients go through phone verification. Always meet in public first, share your schedule with family, and use our in-app chat. Never share your home address until you trust the client.' },
  { q: 'How do I get paid?', a: 'Payments go directly to your bank account after each completed booking. We use secure payment systems. Estimated payout time is 2-3 business days.' },
  { q: 'What if a client is rude or dishonest?', a: 'Block them immediately and use the "Report" button on their profile. Our safety team will review within 24 hours. You will never be penalized for reporting.' },
  { q: 'Can I work from home?', a: 'Yes! Many opportunities are remote — teaching, writing, data entry, and more. Filter by "Remote" in the Opportunities section.' },
  { q: 'What are the fees?', a: 'SilverHands charges a small 10% service fee on completed bookings. There are no monthly fees or signup costs. Selling products in the Marketplace is free.' },
]

export default function HelpSafety() {
  const [openFAQ, setOpenFAQ] = useState(null)
  const [reportSent, setReportSent] = useState(false)

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">🛡️ Help & Safety</h1>

      {/* Emergency Contact */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
        <h2 className="font-bold text-lg text-error flex items-center gap-2 mb-3">
          <AlertTriangle size={24} /> Emergency / Safety Issue?
        </h2>
        <p className="text-base text-foreground mb-4">
          If you feel unsafe or are being harassed, call our safety helpline immediately — it's free and available 24/7.
        </p>
        <a
          href="tel:1800000000"
          className="btn-primary bg-red-600 hover:bg-red-700 w-full text-lg py-4 flex items-center justify-center gap-2"
          id="btn-safety-call"
        >
          <Phone size={22} /> Call Safety Helpline — 1800-XXX-XXXX
        </a>
        <p className="text-sm text-muted text-center mt-2">Toll-free · Available 24/7 · Hindi & English</p>
      </div>

      {/* Quick Help */}
      <div className="card">
        <h2 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2"><Shield size={20} className="text-primary" /> Safety Tips</h2>
        <ul className="space-y-3">
          {[
            '🔒 Never share your bank details or OTP with anyone',
            '📍 For first meetings, always choose a public place',
            '👨‍👩‍👧 Tell a family member before meeting a new client',
            '✓ Only work with Verified clients when possible',
            '🚫 Report any rude or suspicious behaviour immediately',
            '💬 Always communicate through SilverHands chat — not WhatsApp',
          ].map(tip => (
            <li key={tip} className="flex items-start gap-3 text-base text-foreground">
              <span className="text-xl shrink-0">{tip.slice(0, 2)}</span>
              <span>{tip.slice(2).trim()}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Report a Problem */}
      <div className="card">
        <h2 className="font-bold text-lg text-foreground mb-3">🚩 Report a Problem</h2>
        {reportSent ? (
          <div className="text-center py-6">
            <span className="text-5xl">✅</span>
            <p className="font-bold text-lg text-foreground mt-3">Report Submitted</p>
            <p className="text-muted">Our safety team will review within 24 hours. Thank you for keeping SilverHands safe.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <select className="input text-base" defaultValue="" aria-label="Type of issue" id="report-type">
              <option value="" disabled>Select type of issue...</option>
              <option>Harassment or rude behaviour</option>
              <option>Fake job posting</option>
              <option>Payment not received</option>
              <option>Suspicious profile</option>
              <option>Other</option>
            </select>
            <textarea
              className="input resize-none text-base"
              rows={3}
              placeholder="Describe what happened..."
              aria-label="Report description"
              id="report-description"
            />
            <button
              onClick={() => setReportSent(true)}
              className="btn-primary w-full text-lg py-4"
              id="btn-submit-report"
            >
              Submit Report
            </button>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="card">
        <h2 className="font-bold text-lg text-foreground mb-4">❓ Frequently Asked Questions</h2>
        <div className="divide-y divide-border">
          {faqs.map((faq, i) => (
            <div key={i} className="py-3">
              <button
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 text-left min-h-touch"
                aria-expanded={openFAQ === i}
                id={`faq-${i}`}
              >
                <span className="font-semibold text-foreground text-base">{faq.q}</span>
                {openFAQ === i
                  ? <ChevronUp size={22} className="text-primary shrink-0" />
                  : <ChevronDown size={22} className="text-muted shrink-0" />
                }
              </button>
              {openFAQ === i && (
                <p className="mt-2 text-base text-foreground leading-relaxed animate-fadeIn">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="card text-center space-y-3">
        <p className="font-semibold text-foreground text-lg">Still need help?</p>
        <p className="text-muted">Our support team speaks Hindi, English, and regional languages</p>
        <a href="mailto:help@silverhands.in" className="btn-secondary w-full text-base" id="btn-email-support">
          ✉️ Email Support
        </a>
      </div>
    </div>
  )
}
