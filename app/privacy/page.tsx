"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Lock, Database, Eye, Share2, Clock, UserCheck,
  Cookie, Mail, ShieldCheck, Trash2,
} from "lucide-react";

const sections = [
  {
    id: "what-we-collect",
    icon: Database,
    title: "1. What Information We Collect",
    body: [
      "Account information: your full name, phone number, email address, and password (stored securely, never in plain text).",
      "Identity verification: a photo of your CNIC (front and back) and a selfie, submitted when you verify your identity to offer rides.",
      "Ride information: routes, fares, dates, times, and seat counts for rides you offer or book, along with vehicle details like car model, color, and plate number for drivers.",
      "Usage information: how you interact with the app, such as searches performed and pages visited, used to improve the experience.",
    ],
  },
  {
    id: "how-we-use",
    icon: Eye,
    title: "2. How We Use Your Information",
    body: [
      "To create and manage your account, and to connect you with relevant rides based on your routes and preferences.",
      "To verify driver identity through CNIC and selfie review, helping keep the community safe.",
      "To show other users the information needed to make a booking decision — for example, a driver's name, rating, and vehicle details are visible to passengers considering their ride.",
      "To communicate with you about your account, bookings, or verification status, and to respond to support requests.",
      "To detect and prevent fraud, abuse, or violations of our Terms of Service.",
    ],
  },
  {
    id: "what-we-dont",
    icon: ShieldCheck,
    title: "3. What We Don't Do",
    body: [
      "We don't sell your personal information to advertisers or data brokers.",
      "We don't share your CNIC images or selfie with other users — these are only visible to Movento's verification team.",
      "Your phone number is only shared with a driver or passenger once a booking is confirmed between you, so you can coordinate pickup.",
    ],
  },
  {
    id: "storage-security",
    icon: Lock,
    title: "4. How We Store & Protect Your Data",
    body: [
      "Your data is stored on Supabase, a secure cloud infrastructure provider, with industry-standard encryption in transit and at rest.",
      "CNIC and selfie images are stored in access-controlled storage and are only viewable by our verification team during the review process.",
      "Passwords are hashed and never stored or visible in readable form, including to Movento staff.",
      "While we take reasonable steps to protect your data, no system is完全 immune to risk. We encourage you to use a strong, unique password for your account.",
    ],
  },
  {
    id: "sharing",
    icon: Share2,
    title: "5. When We Share Information",
    body: [
      "With other users, limited to what's needed for a ride: name, profile photo (if added), rating, vehicle details, and — once a booking is confirmed — phone number.",
      "With service providers who help us run Movento, such as our cloud hosting provider, strictly for the purpose of operating the platform.",
      "With law enforcement or regulators, only when required by law, to investigate fraud, or to protect the safety of our users.",
      "We do not share your information with third parties for their own marketing purposes.",
    ],
  },
  {
    id: "retention",
    icon: Clock,
    title: "6. How Long We Keep Your Data",
    body: [
      "We retain your account information for as long as your account is active, plus a reasonable period afterward in case you wish to reactivate it.",
      "Verification documents (CNIC, selfie) are retained for as long as needed to maintain platform safety records, and may be retained longer where required for fraud investigation or legal compliance.",
      "If you delete your account, we'll remove or anonymize your personal data within a reasonable timeframe, except where retention is required by law.",
    ],
  },
  {
    id: "your-rights",
    icon: UserCheck,
    title: "7. Your Rights & Choices",
    body: [
      "You can view and update most of your account information directly from your Profile page at any time.",
      "You can request a copy of the personal data we hold about you by contacting our support team.",
      "You can request that we delete your account and associated data. We'll process this request promptly, subject to any legal retention requirements.",
      "If your verification was rejected, you have the right to know the reason and to resubmit corrected documents.",
    ],
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "8. Cookies & Local Storage",
    body: [
      "Movento uses your browser's local storage to keep you logged in and to remember basic preferences — this stays on your device and isn't shared with third parties.",
      "We don't use third-party advertising trackers or sell browsing data to ad networks.",
    ],
  },
  {
    id: "children",
    icon: ShieldCheck,
    title: "9. Children's Privacy",
    body: [
      "Movento is intended for users 18 years and older. We don't knowingly collect personal information from anyone under 18. If we learn that we've collected data from a minor, we'll delete it promptly.",
    ],
  },
  {
    id: "changes",
    icon: Clock,
    title: "10. Changes to This Policy",
    body: [
      "We may update this Privacy Policy as Movento grows or as regulations change. If we make material changes, we'll notify you through the app. Continued use after changes take effect means you accept the updated policy.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f9f9f8] text-black antialiased">
      <Navbar />

      {/* ── HERO STRIP ── */}
      <div className="pt-[76px] bg-black">
        <div className="max-w-[800px] mx-auto px-6 py-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Legal</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-gray-400 text-[14px] leading-relaxed max-w-lg">
            Your trust matters to us. This explains exactly what we collect, why we collect it,
            and how it's protected.
          </p>
          <p className="text-[12px] text-gray-500 mt-4">Last updated: June 2026</p>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-[800px] mx-auto px-6 py-12">

        {/* Trust banner */}
        <div className="bg-white border-2 border-green-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lock size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-[14px] font-black mb-1">Your CNIC and selfie are never shown to other users</p>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              These are only used internally for identity verification by our review team, then kept secure in access-controlled storage.
            </p>
          </div>
        </div>

        {/* Quick nav */}
        <div className="bg-white border-2 border-black rounded-2xl overflow-hidden mb-8">
          <div className="bg-black px-5 py-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">On this page</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-1 p-3">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-[13px] font-semibold text-gray-600 hover:text-black hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} id={s.id} className="bg-white border border-gray-100 rounded-2xl p-7 scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-green-400" />
                  </div>
                  <h2 className="text-[18px] font-black tracking-tight">{s.title}</h2>
                </div>
                <div className="space-y-3 pl-12">
                  {s.body.map((p, i) => (
                    <p key={i} className="text-[14px] text-gray-600 leading-relaxed">{p}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Data deletion CTA */}
        <div className="bg-white border-2 border-black rounded-2xl p-7 mt-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-black mb-1">Want to delete your data?</p>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-4">
                You can request full account and data deletion at any time. We'll process it promptly,
                except where we're legally required to retain certain records.
              </p>
              <a
                href="mailto:privacy@movento.app?subject=Data%20Deletion%20Request"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-900 text-white text-[13px] font-black rounded-xl transition-colors"
              >
                Request Deletion
              </a>
            </div>
          </div>
        </div>

        {/* Contact footer card */}
        <div className="bg-black rounded-2xl p-7 mt-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-green-400 flex-shrink-0" />
            <div>
              <p className="text-[14px] font-black text-white">Questions about your privacy?</p>
              <p className="text-[12px] text-gray-400 mt-0.5">Reach out anytime — we're happy to explain.</p>
            </div>
          </div>
          <a
            href="mailto:privacy@movento.app"
            className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-[13px] font-black rounded-xl transition-colors flex-shrink-0"
          >
            Contact Us
          </a>
        </div>

        {/* Related links */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <Link href="/terms" className="text-[13px] font-bold text-gray-500 hover:text-black transition-colors">
            Terms of Service
          </Link>
          <div className="w-px h-4 bg-gray-200" />
          <Link href="/" className="text-[13px] font-bold text-gray-500 hover:text-black transition-colors">
            Back to Home
          </Link>
        </div>

      </div>
    </main>
  );
}
