"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car, MapPin, Clock, Users, DollarSign, ArrowRight, CheckCircle,
  ChevronDown, AlertCircle, Zap, Shield, Phone, FileText, Clock3, Repeat,
} from "lucide-react";
import Navbar from "@/components/Navbar"; // adjust path to match your project
import { supabase } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "details" | "vehicle" | "review" | "published";

interface FormData {
  from: string; to: string; date: string; time: string;
  seats: number; fare: string; recurring: boolean; recurringDays: string[];
  car: string; plateNo: string; carColor: string;
  driverName: string; driverPhone: string; notes: string;
  femaleOnly: boolean;
  acAvailable: boolean;
}

interface StoredUser {
  id?: string;
  name: string; email: string;
  cnicVerified: boolean; faceVerified: boolean; faceMatched: boolean;
  verificationStatus: "unverified" | "pending" | "approved" | "rejected";
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const origins = [
  "Bahria Town Karachi","North Nazimabad","Gulshan-e-Iqbal","Gulistan-e-Johar",
  "Surjani Town","Orangi Town","Korangi","Landhi","Malir","Saddar","PECHS",
  "DHA Phase 5","Clifton",
];
const destinations = [
  "DHA Phase 5","Clifton","Gulshan-e-Iqbal","Shahrah-e-Faisal","PECHS",
  "I.I. Chundrigar Road","Tariq Road","Saddar","North Nazimabad",
  "Bahria Town Karachi","Korangi","Landhi",
];
const cars = [
  "Honda City","Honda Civic","Toyota Corolla","Toyota Yaris","Toyota Vitz",
  "Suzuki Swift","Suzuki Alto","Suzuki Cultus","Suzuki Wagon R","Suzuki Jimny",
  "Hyundai Tucson","KIA Sportage","Other",
];
const timeSlots = [
  "6:00 AM","6:30 AM","7:00 AM","7:15 AM","7:30 AM","7:45 AM","8:00 AM",
  "8:15 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","12:00 PM","1:00 PM",
  "2:00 PM","4:00 PM","5:00 PM","5:30 PM","6:00 PM","7:00 PM",
];
const carColors = ["White","Black","Silver","Grey","Red","Blue","Green","Other"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri"];
const benefits = [
  { icon: DollarSign, title: "Earn back fuel costs", desc: "Cover your daily petrol with passengers splitting the fare." },
  { icon: Users,      title: "Trusted community",    desc: "Only verified Movento members can book your seats." },
  { icon: Shield,     title: "You're in control",    desc: "Set your own price, route, and departure time." },
];
const todayISO = new Date().toISOString().split("T")[0];

// Turns a set of selected days into the same short label used on Find a Ride
function recurringLabel(days: string[]): string {
  if (!days.length) return "";
  const sorted = [...days].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
  const key = sorted.join(",");
  if (sorted.length === 7) return "Daily";
  if (key === WEEKDAYS.join(",")) return "Mon–Fri";
  if (key === "Sat,Sun") return "Weekends";
  return sorted.join(", ");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1.5 font-medium">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

function Select({ value, onChange, children, placeholder, icon: Icon }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
  placeholder?: string; icon?: React.ElementType;
}) {
  return (
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none z-10" />}
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full h-12 border border-gray-200 focus:border-black rounded-xl text-[14px] font-semibold bg-white text-black appearance-none outline-none transition-colors ${Icon ? "pl-9 pr-10" : "px-4 pr-10"}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

function Input({ type = "text", value, onChange, placeholder, icon: Icon, prefix }: {
  type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon?: React.ElementType; prefix?: string;
}) {
  return (
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />}
      {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-gray-400 pointer-events-none">{prefix}</span>}
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full h-12 border border-gray-200 focus:border-black rounded-xl text-[14px] font-semibold bg-white text-black outline-none transition-colors placeholder:font-normal placeholder:text-gray-300 ${Icon ? "pl-9 pr-4" : prefix ? "pl-9 pr-4" : "px-4"}`}
      />
    </div>
  );
}

function StepBar({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "details", label: "Route & Time" },
    { id: "vehicle", label: "Vehicle & You" },
    { id: "review",  label: "Review" },
  ];
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center mb-8">
      {steps.map((step, i) => {
        const done = i < idx; const active = i === idx;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0 transition-colors ${done ? "bg-green-500 text-white" : active ? "bg-black text-white" : "bg-gray-100 text-gray-400"}`}>
                {done ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-[12px] font-bold hidden sm:block ${active ? "text-black" : done ? "text-green-600" : "text-gray-400"}`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px mx-3 ${i < idx ? "bg-green-400" : "bg-gray-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function PublishedScreen({ form }: { form: FormData }) {
  const ref = useRef("MV-" + Math.random().toString(36).substring(2, 7).toUpperCase());
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <CheckCircle size={32} className="text-white" />
      </div>
      <h2 className="text-2xl font-black tracking-tight mb-2">Ride Published!</h2>
      <p className="text-gray-500 text-[14px] mb-6">Passengers can now find and book your ride.</p>
      <div className="bg-[#f9f9f8] border border-gray-200 rounded-2xl p-6 text-left mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Ride Reference</p>
            <p className="text-xl font-black tracking-widest">{ref.current}</p>
          </div>
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Car size={18} className="text-green-400" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { label: "From",      value: form.from },
            { label: "To",        value: form.to },
            { label: "Departure", value: form.time },
            { label: "Date",      value: form.date || todayISO },
            { label: "Seats",     value: String(form.seats) },
            { label: "Fare/seat", value: `Rs ${form.fare}` },
          ].map((row) => (
            <div key={row.label}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{row.label}</p>
              <p className="text-[13px] font-black">{row.value}</p>
            </div>
          ))}
        </div>
        {form.recurring && form.recurringDays.length > 0 && (
          <div className="pt-4 border-t border-gray-200 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Repeats</p>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Repeat size={11} /> {recurringLabel(form.recurringDays)}
            </span>
          </div>
        )}
        {form.car && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Vehicle</p>
            <p className="text-[13px] font-black">
              {form.car}{form.carColor ? ` · ${form.carColor}` : ""}{form.plateNo ? ` · ${form.plateNo}` : ""}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/my-rides" className="flex items-center justify-center gap-2 w-full h-12 bg-black hover:bg-gray-900 text-white font-black text-[14px] rounded-xl transition-colors no-underline">
          View My Published Rides
        </Link>
        <Link href="/" className="flex items-center justify-center w-full h-12 border border-gray-200 hover:border-black font-semibold text-[14px] rounded-xl transition-colors no-underline text-black">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

// ─── Verification gate banners ────────────────────────────────────────────────

function VerificationGate({ status }: { status: StoredUser["verificationStatus"] }) {
  if (status === "pending") {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock3 size={26} className="text-white" />
        </div>
        <h2 className="text-xl font-black tracking-tight mb-2">Verification Under Review</h2>
        <p className="text-gray-500 text-[14px] max-w-sm mx-auto leading-relaxed">
          Your documents and selfie have been submitted. We'll notify you once your identity is confirmed — usually within 24 hours.
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={26} className="text-white" />
        </div>
        <h2 className="text-xl font-black tracking-tight mb-2">Verification Failed</h2>
        <p className="text-gray-500 text-[14px] max-w-sm mx-auto leading-relaxed mb-6">
          We couldn't verify your identity with the documents provided. Please try again with clearer photos.
        </p>
        <Link href="/verify" className="inline-flex items-center gap-2 px-6 h-11 bg-black text-white text-[13px] font-black rounded-xl hover:bg-gray-900 transition-colors no-underline">
          Retry Verification
        </Link>
      </div>
    );
  }

  // unverified
  return (
    <div className="bg-[#f9f9f8] border-2 border-black rounded-2xl p-8 text-center">
      <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Shield size={26} className="text-green-400" />
      </div>
      <h2 className="text-xl font-black tracking-tight mb-2">Verify your identity first</h2>
      <p className="text-gray-500 text-[14px] max-w-sm mx-auto leading-relaxed mb-6">
        To keep Movento safe for everyone, drivers need to verify their identity with a CNIC and selfie before offering rides.
      </p>
      <Link href="/verify" className="inline-flex items-center gap-2 px-6 h-11 bg-black text-white text-[13px] font-black rounded-xl hover:bg-gray-900 transition-colors no-underline">
        <Shield size={14} /> Start Verification <ArrowRight size={14} />
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfferRidePage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser]                 = useState<StoredUser | null>(null);
  const [step, setStep]                 = useState<Step>("details");
  const [errors, setErrors]             = useState<Partial<Record<keyof FormData, string>>>({});
  const [publishing, setPublishing]     = useState(false);
  const [form, setForm]                 = useState<FormData>({
    from: "", to: "", date: todayISO, time: "", seats: 1, fare: "",
    recurring: false, recurringDays: [], car: "", plateNo: "",
    carColor: "", driverName: "", driverPhone: "", notes: "",
    femaleOnly: false,
    acAvailable: false,
  });

  // ── fetch LIVE verification_status from Supabase, not just stale localStorage ──
  useEffect(() => {
    const loadUser = async () => {
      const raw = localStorage.getItem("user");
      if (!raw) { router.push("/login"); return; }

      let stored: StoredUser;
      try {
        stored = JSON.parse(raw);
      } catch {
        router.push("/login");
        return;
      }

      // If we have a Supabase user id, check the live status in the profiles table
      if (stored.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("verification_status")
          .eq("id", stored.id)
          .single();

        if (!error && data && stored.verificationStatus !== data.verification_status) {
          stored = {
            ...stored,
            verificationStatus: data.verification_status as StoredUser["verificationStatus"],
          };
          localStorage.setItem("user", JSON.stringify(stored));
        }
      }

      setUser(stored);
      setCheckingAuth(false);
    };

    loadUser();
  }, [router]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleDay = (day: string) =>
    set("recurringDays", form.recurringDays.includes(day)
      ? form.recurringDays.filter((d) => d !== day)
      : [...form.recurringDays, day]);

  // Quick presets so drivers don't have to tap every weekday individually
  const applyPreset = (preset: "daily" | "weekdays" | "weekends") => {
    set("recurring", true);
    if (preset === "daily") set("recurringDays", [...DAYS]);
    if (preset === "weekdays") set("recurringDays", [...WEEKDAYS]);
    if (preset === "weekends") set("recurringDays", ["Sat", "Sun"]);
  };

  const validateDetails = (): boolean => {
    const e: typeof errors = {};
    if (!form.from) e.from = "Select pickup location";
    if (!form.to)   e.to   = "Select destination";
    if (form.from && form.to && form.from === form.to) e.to = "From and To can't be the same";
    if (!form.time) e.time = "Select departure time";
    if (!form.fare || isNaN(Number(form.fare)) || Number(form.fare) < 50)
      e.fare = "Enter a valid fare (min Rs 50)";
    if (form.recurring && form.recurringDays.length === 0)
      e.recurring = "Pick at least one day, or turn recurring off" as any;
    setErrors(e); return Object.keys(e).length === 0;
  };

  const validateVehicle = (): boolean => {
    const e: typeof errors = {};
    if (!form.car) e.car = "Select your car";
    if (!form.plateNo.trim()) e.plateNo = "Enter plate number";
    if (!form.driverName.trim()) e.driverName = "Enter your name";
    if (!form.driverPhone.trim() || form.driverPhone.replace(/\D/g, "").length < 10)
      e.driverPhone = "Enter a valid phone number";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === "details" && validateDetails()) { setErrors({}); setStep("vehicle"); }
    else if (step === "vehicle" && validateVehicle()) { setErrors({}); setStep("review"); }
  };

  const handleBack = () => {
    if (step === "vehicle") setStep("details");
    else if (step === "review") setStep("vehicle");
  };

  // ── save directly to Supabase "rides" table, including recurring info ──
  const handlePublish = async () => {
    if (!user?.id) {
      alert("Session expired. Please log in again.");
      router.push("/login");
      return;
    }
    setPublishing(true);
    try {
      const { error } = await supabase.from("rides").insert({
        driver_id:      user.id,
        driver_name:    form.driverName,
        driver_phone:   form.driverPhone,
        from_location:  form.from,
        to_location:    form.to,
        date:           form.date || todayISO,
        time:           form.time,
        seats:          form.seats,
        fare:           Number(form.fare),
        car:            form.car,
        plate_no:       form.plateNo,
        car_color:      form.carColor,
        notes:          form.notes,
        female_only:    form.femaleOnly,
        ac_available:   form.acAvailable,
        recurring:      form.recurring,
        recurring_days: form.recurring ? form.recurringDays : [],
        status:         "active",
      });

      if (error) throw new Error(error.message);
      setStep("published");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </main>
    );
  }
  if (!user) return null;

  const fareNum   = Number(form.fare);
  const fareValid = form.fare !== "" && !isNaN(fareNum) && fareNum > 0;
  const isVerified = user.verificationStatus === "approved";

  return (
    <main className="min-h-screen bg-white text-black antialiased">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">

          {/* ── LEFT ── */}
          <div>
            {step !== "published" && (
              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Driver</p>
                <h1 className="text-4xl font-black tracking-tight leading-tight mb-2">Offer a Ride</h1>
                <p className="text-gray-500 text-[14px]">Share your empty seats. Earn back your fuel. Help Karachi commute better.</p>
              </div>
            )}

            {/* ── VERIFICATION GATE ── */}
            {!isVerified ? (
              <VerificationGate status={user.verificationStatus} />
            ) : (
              <>
                {step !== "published" && <StepBar current={step} />}

                <div className="bg-white border-2 border-black rounded-2xl overflow-hidden">
                  {/* Card header */}
                  <div className="bg-black px-6 py-4 flex items-center gap-2">
                    {step === "details"   && <><MapPin size={14} className="text-green-400" /><p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Route & Schedule</p></>}
                    {step === "vehicle"   && <><Car size={14} className="text-green-400" /><p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Vehicle & Driver Details</p></>}
                    {step === "review"    && <><FileText size={14} className="text-green-400" /><p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Review & Publish</p></>}
                    {step === "published" && <><CheckCircle size={14} className="text-green-400" /><p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Published</p></>}
                  </div>

                  <div className="p-6 space-y-5">

                    {/* ── STEP 1 ── */}
                    {step === "details" && (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Field label="From" error={errors.from}>
                            <Select value={form.from} onChange={(v) => set("from", v)} placeholder="Select pickup" icon={MapPin}>
                              {origins.map((o) => <option key={o}>{o}</option>)}
                            </Select>
                          </Field>
                          <Field label="To" error={errors.to}>
                            <Select value={form.to} onChange={(v) => set("to", v)} placeholder="Select destination">
                              {destinations.map((d) => <option key={d}>{d}</option>)}
                            </Select>
                          </Field>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Field label="Date">
                            <Input type="date" value={form.date} onChange={(v) => set("date", v)} />
                          </Field>
                          <Field label="Departure Time" error={errors.time}>
                            <Select value={form.time} onChange={(v) => set("time", v)} placeholder="Select time" icon={Clock}>
                              {timeSlots.map((t) => <option key={t}>{t}</option>)}
                            </Select>
                          </Field>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Field label="Available Seats">
                            <div className="flex items-center gap-3">
                              <button type="button" onClick={() => set("seats", Math.max(1, form.seats - 1))}
                                className="w-12 h-12 rounded-xl border border-gray-200 hover:border-black flex items-center justify-center text-lg font-bold transition-colors flex-shrink-0">−</button>
                              <div className="flex-1 h-12 border border-gray-200 rounded-xl flex items-center justify-center">
                                <span className="text-xl font-black tabular-nums">{form.seats}</span>
                              </div>
                              <button type="button" onClick={() => set("seats", Math.min(6, form.seats + 1))}
                                className="w-12 h-12 rounded-xl border border-gray-200 hover:border-black flex items-center justify-center text-lg font-bold transition-colors flex-shrink-0">+</button>
                            </div>
                          </Field>
                          <Field label="Fare Per Seat (Rs)" error={errors.fare}>
                            <Input type="number" value={form.fare} onChange={(v) => set("fare", v)} placeholder="e.g. 350" prefix="Rs" />
                          </Field>
                        </div>

                        {/* Recurring ride */}
                        <div className={`rounded-xl p-4 border transition-colors ${form.recurring ? "bg-indigo-50/60 border-indigo-200" : "bg-[#f9f9f8] border-transparent"}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${form.recurring ? "bg-indigo-500" : "bg-gray-200"}`}>
                                <Repeat size={15} className="text-white" />
                              </div>
                              <div>
                                <p className="text-[13px] font-black">Recurring ride?</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">Offer this same ride on multiple days</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => set("recurring", !form.recurring)} aria-pressed={form.recurring}
                              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.recurring ? "bg-indigo-500" : "bg-gray-200"}`}>
                              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.recurring ? "translate-x-5" : "translate-x-0.5"}`} />
                            </button>
                          </div>

                          {form.recurring && (
                            <div className="space-y-3">
                              {/* Presets */}
                              <div className="flex gap-1.5 flex-wrap">
                                {[
                                  { id: "daily" as const,    label: "Daily" },
                                  { id: "weekdays" as const, label: "Mon–Fri" },
                                  { id: "weekends" as const, label: "Weekends" },
                                ].map((p) => (
                                  <button key={p.id} type="button" onClick={() => applyPreset(p.id)}
                                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-colors">
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                              {/* Individual day toggles */}
                              <div className="flex gap-2 flex-wrap">
                                {DAYS.map((day) => (
                                  <button key={day} type="button" onClick={() => toggleDay(day)}
                                    className={`text-[12px] font-bold w-11 py-1.5 rounded-lg border transition-colors ${form.recurringDays.includes(day) ? "bg-indigo-500 text-white border-indigo-500" : "border-gray-200 text-gray-600 hover:border-indigo-300 bg-white"}`}>
                                    {day}
                                  </button>
                                ))}
                              </div>
                              {form.recurringDays.length > 0 && (
                                <p className="text-[11px] text-indigo-600 font-bold">
                                  Repeats: {recurringLabel(form.recurringDays)}
                                </p>
                              )}
                              {errors.recurring && (
                                <p className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                                  <AlertCircle size={11} /> {errors.recurring as string}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <Field label="Notes for passengers (optional)">
                          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                            placeholder="e.g. Meeting point: Bahria Town Gate 1. AC available. Ladies welcome."
                            rows={3}
                            className="w-full border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-[14px] font-medium bg-white text-black outline-none transition-colors resize-none placeholder:font-normal placeholder:text-gray-300" />
                        </Field>
                      </>
                    )}

                    {/* ── STEP 2 ── */}
                    {step === "vehicle" && (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Field label="Your Name" error={errors.driverName}>
                            <Input value={form.driverName} onChange={(v) => set("driverName", v)} placeholder="Full name" />
                          </Field>
                          <Field label="Phone Number" error={errors.driverPhone}>
                            <Input type="tel" value={form.driverPhone} onChange={(v) => set("driverPhone", v)} placeholder="03XX-XXXXXXX" icon={Phone} />
                          </Field>
                        </div>
                        <Field label="Car Model" error={errors.car}>
                          <Select value={form.car} onChange={(v) => set("car", v)} placeholder="Select your car" icon={Car}>
                            {cars.map((c) => <option key={c}>{c}</option>)}
                          </Select>
                        </Field>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Field label="Plate Number" error={errors.plateNo}>
                            <Input value={form.plateNo} onChange={(v) => set("plateNo", v.toUpperCase())} placeholder="e.g. KHI-786" />
                          </Field>
                          <Field label="Car Color">
                            <Select value={form.carColor} onChange={(v) => set("carColor", v)} placeholder="Select color">
                              {carColors.map((c) => <option key={c}>{c}</option>)}
                            </Select>
                          </Field>
                        </div>
                        {/* Ride options */}
                        <div className="grid sm:grid-cols-2 gap-3">
                          {/* AC Available */}
                          <button
                            type="button"
                            onClick={() => set("acAvailable", !form.acAvailable)}
                            className={`flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-colors ${
                              form.acAvailable
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="text-left">
                              <p className={`text-[13px] font-black ${form.acAvailable ? "text-blue-700" : "text-black"}`}>
                                AC Available
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5">Air conditioning on</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              form.acAvailable ? "border-blue-500 bg-blue-500" : "border-gray-300"
                            }`}>
                              {form.acAvailable && <CheckCircle size={12} className="text-white" />}
                            </div>
                          </button>

                          {/* Female Only */}
                          <button
                            type="button"
                            onClick={() => set("femaleOnly", !form.femaleOnly)}
                            className={`flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-colors ${
                              form.femaleOnly
                                ? "border-pink-400 bg-pink-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="text-left">
                              <p className={`text-[13px] font-black ${form.femaleOnly ? "text-pink-700" : "text-black"}`}>
                                Female Only
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5">Female passengers only</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              form.femaleOnly ? "border-pink-400 bg-pink-400" : "border-gray-300"
                            }`}>
                              {form.femaleOnly && <CheckCircle size={12} className="text-white" />}
                            </div>
                          </button>
                        </div>
                        <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
                          <Shield size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[13px] font-bold text-green-800">Your info stays private</p>
                            <p className="text-[11px] text-green-600 mt-0.5 leading-relaxed">
                              Your phone number is only shared with confirmed passengers. Your plate number helps them identify your car.
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── STEP 3 ── */}
                    {step === "review" && (
                      <>
                        <div className="bg-[#f9f9f8] rounded-xl p-5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Route & Schedule</p>
                          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                            {[
                              { label: "From",      value: form.from },
                              { label: "To",        value: form.to },
                              { label: "Date",      value: form.date || todayISO },
                              { label: "Departure", value: form.time },
                              { label: "Seats",     value: String(form.seats) },
                              { label: "Fare/seat", value: fareValid ? `Rs ${form.fare}` : "—" },
                            ].map((row) => (
                              <div key={row.label}>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{row.label}</p>
                                <p className="text-[14px] font-black">{row.value}</p>
                              </div>
                            ))}
                          </div>
                          {form.recurring && form.recurringDays.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Repeats</p>
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-black bg-indigo-500 text-white px-2.5 py-1 rounded-lg">
                                <Repeat size={11} /> {recurringLabel(form.recurringDays)}
                              </span>
                              <div className="flex gap-1.5 flex-wrap mt-2">
                                {form.recurringDays.map((d) => (
                                  <span key={d} className="text-[11px] font-bold bg-black text-white px-2.5 py-1 rounded-lg">{d}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="bg-[#f9f9f8] rounded-xl p-5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Vehicle & Driver</p>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-black text-white">{form.driverName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-[15px] font-black">{form.driverName}</p>
                              <p className="text-[12px] text-gray-500 mt-0.5">{form.driverPhone}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                            {[
                              { label: "Car",   value: form.car },
                              { label: "Plate", value: form.plateNo },
                              { label: "Color", value: form.carColor || "—" },
                            ].map((row) => (
                              <div key={row.label}>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{row.label}</p>
                                <p className="text-[13px] font-black">{row.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {(form.femaleOnly || form.acAvailable) && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                            {form.acAvailable && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                                AC Available
                              </span>
                            )}
                            {form.femaleOnly && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-pink-50 text-pink-600 border border-pink-200">
                                Female Only
                              </span>
                            )}
                          </div>
                        )}
                        {form.notes && (
                          <div className="bg-[#f9f9f8] rounded-xl p-5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Notes</p>
                            <p className="text-[13px] text-gray-700 leading-relaxed">{form.notes}</p>
                          </div>
                        )}
                        <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <AlertCircle size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            By publishing, you agree to show up on time and notify passengers at least 30 minutes before departure if you need to cancel.
                          </p>
                        </div>
                      </>
                    )}

                    {step === "published" && <PublishedScreen form={form} />}
                  </div>

                  {/* Footer */}
                  {step !== "published" && (
                    <div className={`px-6 pb-6 flex gap-3 ${step !== "details" ? "justify-between" : "justify-end"}`}>
                      {step !== "details" && (
                        <button type="button" onClick={handleBack}
                          className="px-6 h-12 border border-gray-200 hover:border-black font-bold text-[14px] rounded-xl transition-colors">
                          ← Back
                        </button>
                      )}
                      {step !== "review" ? (
                        <button type="button" onClick={handleNext}
                          className="flex items-center gap-2 px-8 h-12 bg-black hover:bg-gray-900 text-white font-black text-[14px] rounded-xl transition-colors ml-auto">
                          Continue <ArrowRight size={16} />
                        </button>
                      ) : (
                        <button type="button" onClick={handlePublish} disabled={publishing}
                          className="flex items-center gap-2 px-8 h-12 bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-black text-[14px] rounded-xl transition-colors ml-auto">
                          {publishing
                            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing…</>
                            : <><Zap size={16} /> Publish Ride</>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="hidden lg:flex flex-col gap-5 sticky top-24">
            <div className="border-2 border-black rounded-2xl overflow-hidden">
              <div className="bg-black px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Earnings Estimate</p>
              </div>
              <div className="p-5">
                <div className="text-center py-4">
                  <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-wider font-bold">Per day</p>
                  <p className="text-5xl font-black tracking-tight tabular-nums">
                    {fareValid ? `Rs ${fareNum * form.seats}` : "—"}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {form.seats} seat{form.seats !== 1 ? "s" : ""} × Rs {form.fare || "0"}/seat
                  </p>
                </div>
                {fareValid && (
                  <>
                    <div className="h-px bg-gray-100 my-4" />
                    <div className="space-y-2">
                      {[
                        { label: "Weekly (5 days)",    value: fareNum * form.seats * 5 },
                        { label: "Monthly (22 days)",  value: fareNum * form.seats * 22 },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between items-center">
                          <span className="text-[12px] text-gray-500 font-medium">{row.label}</span>
                          <span className="text-[14px] font-black tabular-nums">Rs {row.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {form.recurring && form.recurringDays.length > 0 && (
                  <>
                    <div className="h-px bg-gray-100 my-4" />
                    <div className="flex items-center gap-2">
                      <Repeat size={13} className="text-indigo-500 flex-shrink-0" />
                      <span className="text-[12px] font-bold text-indigo-600">
                        Repeats {recurringLabel(form.recurringDays)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="border-2 border-black rounded-2xl overflow-hidden">
              <div className="bg-black px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Why offer a ride?</p>
              </div>
              <div className="divide-y divide-gray-100">
                {benefits.map((b) => {
                  const Icon = b.icon;
                  return (
                    <div key={b.title} className="flex items-start gap-3 px-5 py-4">
                      <div className="w-8 h-8 bg-[#f9f9f8] border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={15} className="text-black" />
                      </div>
                      <div>
                        <p className="text-[13px] font-black mb-0.5">{b.title}</p>
                        <p className="text-[11px] text-gray-500 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#f9f9f8] border border-gray-200 rounded-2xl p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Quick Tips</p>
              <ul className="space-y-2.5">
                {[
                  "Set a fair price — Rs 300–500 works best for most routes",
                  "Add a pickup note so passengers find you easily",
                  "Recurring rides get 3× more bookings",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[12px] text-gray-600 leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
