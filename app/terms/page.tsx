"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  FileText, Users, Shield, CreditCard, AlertTriangle, Scale,
  XCircle, RefreshCw, Mail, Car,
} from "lucide-react";

const sections = [
  {
    id: "acceptance",
    icon: FileText,
    title: "1. Acceptance of Terms",
    body: [
      "By creating an account or using Movento, you agree to these Terms of Service. If you don't agree with any part of these terms, please don't use the platform.",
      "We may update these terms from time to time. If we make material changes, we'll notify you through the app or by email. Continuing to use Movento after changes take effect means you accept the updated terms.",
    ],
  },
  {
    id: "what-we-are",
    icon: Users,
    title: "2. What Movento Is — and Isn't",
    body: [
      "Movento is a platform that connects commuters who want to share rides across Karachi. We help drivers offer empty seats and help passengers find and book those seats.",
      "Movento is not a transportation company, taxi service, or employer of drivers. Drivers using Movento are independent individuals sharing their own vehicles — not Movento employees, contractors, or agents. We don't own, operate, or control any vehicle listed on the platform.",
      "Rides arranged through Movento are private arrangements between the driver and passenger. Movento facilitates the connection but is not a party to the ride itself.",
    ],
  },
  {
    id: "eligibility",
    icon: Shield,
    title: "3. Eligibility & Account Responsibilities",
    body: [
      "You must be at least 18 years old to create a Movento account. Drivers must hold a valid CNIC, a valid driving license, and a roadworthy vehicle with valid registration.",
      "You're responsible for keeping your account credentials secure and for everything that happens under your account. If you suspect unauthorized access, contact us immediately.",
      "The information you provide — including your name, phone number, CNIC, and vehicle details — must be accurate and kept up to date. Providing false information may result in account suspension.",
    ],
  },
  {
    id: "verification",
    icon: Shield,
    title: "4. Identity Verification",
    body: [
      "To offer rides as a driver, you must complete identity verification by submitting a CNIC photo and a selfie. This helps build trust and safety across the community.",
      "Verification review typically takes up to 24 hours. We may approve, reject, or flag a submission. If rejected, you'll see the reason and can resubmit with corrected documents.",
      "Movento reserves the right to request re-verification at any time, suspend accounts with suspicious documents, or report suspected fraudulent activity to relevant authorities.",
    ],
  },
  {
    id: "bookings-fares",
    icon: CreditCard,
    title: "5. Bookings, Fares & Payments",
    body: [
      "Drivers set their own fares per seat. Movento does not set, control, or take a commission on fares at this time — payments for rides are made directly between passenger and driver, typically in cash at pickup or drop-off, as agreed between them.",
      "When you book a seat, you're entering into a direct arrangement with that driver. Movento does not process ride payments and is not responsible for disputes over fare amounts, change, or payment methods.",
      "Cancellations should be made as early as possible. Repeated last-minute cancellations or no-shows — by either drivers or passengers — may result in reduced visibility on the platform or account suspension.",
    ],
  },
  {
    id: "conduct",
    icon: AlertTriangle,
    title: "6. Community Conduct",
    body: [
      "Treat every driver and passenger with respect. Movento has zero tolerance for harassment, discrimination, threats, or abusive behavior of any kind.",
      "Don't use Movento for any unlawful purpose, to transport illegal goods, or to circumvent the platform's safety features (such as sharing contact details to arrange rides outside the app while still presenting as verified on Movento).",
      "Female-only rides marked by a driver must be respected — male passengers should not attempt to book these seats. Misuse of this feature may result in account suspension.",
      "We may suspend or terminate accounts that violate these standards, with or without notice, depending on severity.",
    ],
  },
  {
    id: "safety",
    icon: Shield,
    title: "7. Safety & Liability",
    body: [
      "Movento performs identity verification and encourages safe practices, but we cannot guarantee the conduct, driving ability, or vehicle condition of any user. You use the platform and accept rides at your own discretion.",
      "Movento is not liable for accidents, injuries, property damage, theft, or disputes arising from rides arranged through the platform. Any such matters are between the individuals involved, and where applicable, their insurance providers or local authorities.",
      "If you feel unsafe at any point during a ride, end it as soon as safely possible and report the incident to us. We take safety reports seriously and will investigate and act on credible concerns.",
    ],
  },
  {
    id: "termination",
    icon: XCircle,
    title: "8. Suspension & Termination",
    body: [
      "We may suspend or permanently remove any account that violates these terms, provides false information, receives repeated safety complaints, or engages in fraudulent verification attempts.",
      "You can delete your account at any time by contacting us. Some data may be retained as required by law or for fraud-prevention purposes — see our Privacy Policy for details.",
    ],
  },
  {
    id: "changes",
    icon: RefreshCw,
    title: "9. Changes to the Service",
    body: [
      "Movento is an evolving platform. We may add, change, or remove features at any time, including fare structures, verification requirements, or supported routes and cities.",
      "We'll do our best to communicate significant changes in advance, but some changes may take effect immediately where needed for safety or legal compliance.",
    ],
  },
  {
    id: "law",
    icon: Scale,
    title: "10. Governing Law",
    body: [
      "These terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes arising from use of Movento will be subject to the exclusive jurisdiction of the courts of Karachi, Sindh.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f9f9f8] text-black antialiased">
      <Navbar />

      {/* ── HERO STRIP ── */}
      <div className="pt-[76px] bg-black">
        <div className="max-w-[800px] mx-auto px-6 py-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Legal</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-3">Terms of Service</h1>
          <p className="text-gray-400 text-[14px] leading-relaxed max-w-lg">
            Please read these terms carefully. They explain what Movento does, what's expected of you,
            and what happens if something goes wrong.
          </p>
          <p className="text-[12px] text-gray-500 mt-4">Last updated: June 2026</p>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-[800px] mx-auto px-6 py-12">

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

        {/* Contact footer card */}
        <div className="bg-black rounded-2xl p-7 mt-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-green-400 flex-shrink-0" />
            <div>
              <p className="text-[14px] font-black text-white">Questions about these terms?</p>
              <p className="text-[12px] text-gray-400 mt-0.5">We're happy to clarify anything.</p>
            </div>
          </div>
          <a
            href="mailto:support@movento.app"
            className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-[13px] font-black rounded-xl transition-colors flex-shrink-0"
          >
            Contact Support
          </a>
        </div>

        {/* Related links */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <Link href="/privacy" className="text-[13px] font-bold text-gray-500 hover:text-black transition-colors">
            Privacy Policy
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
