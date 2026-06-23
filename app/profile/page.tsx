"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import {
  User,
  Phone,
  Mail,
  Car,
  Shield,
  Star,
  MapPin,
  Pencil,
  Check,
  X,
  CheckCircle,
  Clock3,
  AlertCircle,
  Loader2,
  Calendar,
  Hash,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type VerificationStatus = "unverified" | "pending" | "approved" | "rejected";

interface StoredUser {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  verificationStatus: VerificationStatus;
}

interface ProfileRow {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  verification_status: VerificationStatus;
  bio?: string | null;
  location?: string | null;
  car_model?: string | null;
  car_plate?: string | null;
  created_at: string;
}

const VERIFY_BADGE: Record<
  VerificationStatus,
  { label: string; heroCls: string; pillCls: string; noticeCls: string; icon: React.ElementType }
> = {
  approved: {
    label: "Verified",
    heroCls: "bg-green-500 text-white",
    pillCls: "bg-green-50 text-green-700 border-green-200",
    noticeCls: "",
    icon: CheckCircle,
  },
  pending: {
    label: "Under Review",
    heroCls: "bg-yellow-500 text-white",
    pillCls: "bg-yellow-50 text-yellow-700 border-yellow-200",
    noticeCls: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: Clock3,
  },
  rejected: {
    label: "Rejected",
    heroCls: "bg-red-500 text-white",
    pillCls: "bg-red-50 text-red-700 border-red-200",
    noticeCls: "bg-red-50 border-red-200 text-red-800",
    icon: AlertCircle,
  },
  unverified: {
    label: "Not Verified",
    heroCls: "bg-white/10 text-white/70 border border-white/15",
    pillCls: "bg-gray-100 text-gray-500 border-gray-200",
    noticeCls: "bg-black border-black text-white",
    icon: Shield,
  },
};

// ─── Editable field ───────────────────────────────────────────────────────────

function EditableField({
  icon: Icon,
  label,
  value,
  editing,
  onChange,
  type = "text",
  locked = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  type?: string;
  locked?: boolean;
}) {
  const showInput = editing && !locked;
  return (
    <div className="flex gap-3 py-3.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        {showInput ? (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-200 focus:border-black rounded-lg px-3 py-1.5 text-[14px] font-semibold outline-none transition-colors bg-white"
          />
        ) : (
          <p className="font-semibold text-[14px] text-gray-900 truncate">
            {value || <span className="text-gray-300 font-normal">Not set</span>}
          </p>
        )}
      </div>
      {locked && editing && (
        <span className="text-[10px] text-gray-300 self-center flex-shrink-0">locked</span>
      )}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, num, label, sub }: { icon: React.ElementType; num: string; label: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
        <Icon size={17} className="text-gray-400" />
      </div>
      <div>
        <p className="text-[26px] font-black tracking-tight text-gray-900 leading-none">{num}</p>
        <p className="text-[12px] text-gray-400 font-medium mt-1">{label}</p>
        {sub && <p className="text-[11px] text-gray-300 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [stats, setStats] = useState({ rides: 0, bookings: 0, memberSince: "" });

  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", bio: "", location: "",
    car_model: "", car_plate: "",
  });

  // ── Load ──
  useEffect(() => {
    const load = async () => {
      const raw = localStorage.getItem("user");
      if (!raw) { router.push("/login"); return; }

      let stored: StoredUser;
      try { stored = JSON.parse(raw); } catch { router.push("/login"); return; }

      if (!stored.id) { setUser(stored); setChecking(false); return; }

      const { data, error } = await supabase
        .from("profiles").select("*").eq("id", stored.id).single();

      if (!error && data) {
        const row = data as ProfileRow;
        setProfile(row);
        setForm({
          full_name: row.full_name ?? "",
          phone:     row.phone ?? "",
          email:     row.email ?? "",
          bio:       row.bio ?? "",
          location:  row.location ?? "",
          car_model: row.car_model ?? "",
          car_plate: row.car_plate ?? "",
        });
        if (stored.verificationStatus !== row.verification_status) {
          stored = { ...stored, verificationStatus: row.verification_status };
          localStorage.setItem("user", JSON.stringify(stored));
        }
        setStats((s) => ({
          ...s,
          memberSince: new Date(row.created_at).toLocaleDateString("en-PK", { month: "short", year: "numeric" }),
        }));
      }

      const { count: ridesCount } = await supabase
        .from("rides").select("id", { count: "exact", head: true }).eq("driver_id", stored.id);
      const { count: bookingsCount } = await supabase
        .from("bookings").select("id", { count: "exact", head: true }).eq("passenger_id", stored.id);

      setStats((s) => ({ ...s, rides: ridesCount ?? 0, bookings: bookingsCount ?? 0 }));
      setUser(stored);
      setChecking(false);
    };
    load();
  }, [router]);

  const setField = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: form.full_name.trim(),
        phone:     form.phone.trim(),
        bio:       form.bio.trim() || null,
        location:  form.location.trim() || null,
        car_model: form.car_model.trim() || null,
        car_plate: form.car_plate.trim() || null,
      }).eq("id", user.id);
      if (error) throw new Error(error.message);
      const updated = { ...user, name: form.full_name.trim(), phone: form.phone.trim() };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone:     profile.phone ?? "",
        email:     profile.email ?? "",
        bio:       profile.bio ?? "",
        location:  profile.location ?? "",
        car_model: profile.car_model ?? "",
        car_plate: profile.car_plate ?? "",
      });
    }
    setEditing(false);
    setSaveError("");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const firstName = form.full_name.split(" ")[0] || user.name?.split(" ")[0] || "U";
  const initials = form.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || firstName.charAt(0).toUpperCase();

  const status = user.verificationStatus;
  const badge = VERIFY_BADGE[status];
  const BadgeIcon = badge.icon;
  const totalRides = stats.rides + stats.bookings;
  const completionPct = Math.round(
    ([form.full_name, form.phone, form.email, form.bio, form.location, form.car_model]
      .filter(Boolean).length / 6) * 100
  );

  return (
    <main className="min-h-screen bg-[#f5f5f3]">
      <Navbar />

      {/* ── SUCCESS TOAST ── */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 bg-black text-white text-[13px] font-bold px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-200">
          <CheckCircle size={15} className="text-green-400" />
          Profile saved successfully
        </div>
      )}

      {/* ── HERO ── */}
      <section className="bg-black relative overflow-hidden mx-3 mt-[80px] rounded-2xl sm:mx-4 md:mx-6">
        {/* dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10 px-5 py-7 sm:px-8 sm:py-9 max-w-[1100px] mx-auto">
          {/* Top row: avatar + info + edit button */}
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-white">{initials}</span>
              </div>
              {status === "approved" && (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-[20px] sm:text-[24px] md:text-[28px] font-black text-white tracking-tight leading-tight truncate">
                {form.full_name || "Your Name"}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                {form.location && (
                  <span className="flex items-center gap-1 text-[12px] text-white/45">
                    <MapPin size={11} className="opacity-60" />
                    {form.location}
                  </span>
                )}
                {stats.memberSince && (
                  <span className="flex items-center gap-1 text-[12px] text-white/45">
                    <Calendar size={11} className="opacity-60" />
                    Since {stats.memberSince}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full ${badge.heroCls}`}>
                  <BadgeIcon size={11} />
                  {badge.label}
                </span>
                {form.car_model && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
                    <Car size={10} />
                    {form.car_model}
                  </span>
                )}
              </div>
            </div>

            {/* Edit / Save / Cancel — top right */}
            <div className="flex-shrink-0 pt-1">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-white/60 hover:text-white transition-colors border border-white/15 hover:border-white/30 px-3 py-2 rounded-xl"
                >
                  <Pencil size={13} /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 text-[12px] font-bold text-white/50 hover:text-white/80 transition-colors px-2.5 py-2 rounded-xl border border-white/10 hover:border-white/20"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-[12px] font-black text-white bg-green-500 hover:bg-green-600 disabled:bg-green-700 px-3 py-2 rounded-xl transition-colors"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-6 pt-6 border-t border-white/[0.07] grid grid-cols-3 sm:grid-cols-4 gap-px bg-white/[0.07] rounded-xl overflow-hidden">
            {[
              { num: String(stats.rides),    label: "Rides offered" },
              { num: String(stats.bookings), label: "Rides booked"  },
              { num: String(totalRides),     label: "Total rides"   },
              { num: "— / 5",               label: "Rating"        },
            ].map((s) => (
              <div key={s.label} className="bg-black/60 px-4 py-3.5 text-center last:hidden sm:last:block">
                <div className="text-[18px] sm:text-[20px] font-black text-white leading-none">{s.num}</div>
                <div className="text-[10px] sm:text-[11px] text-white/35 font-medium mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VERIFICATION NOTICE ── */}
      {status !== "approved" && (
        <div className="max-w-[1100px] mx-auto px-3 sm:px-4 md:px-6 mt-4">
          <div className={`flex items-center justify-between gap-4 flex-wrap rounded-2xl border px-5 py-4 ${badge.noticeCls}`}>
            <div className="flex items-center gap-3">
              <BadgeIcon size={18} />
              <div>
                <p className="text-[13px] font-black">
                  {status === "pending" && "Verification under review"}
                  {status === "rejected" && "Verification was rejected"}
                  {status === "unverified" && "Your identity isn't verified yet"}
                </p>
                <p className="text-[12px] mt-0.5 opacity-70">
                  {status === "pending" && "Usually takes up to 24 hours. We'll notify you."}
                  {status === "rejected" && "Resubmit with a clearer photo of your ID."}
                  {status === "unverified" && "Verified drivers get more bookings and higher trust from passengers."}
                </p>
              </div>
            </div>
            {status !== "pending" && (
              <a
                href="/verify"
                className="flex-shrink-0 flex items-center gap-1.5 text-[12px] font-black px-4 py-2.5 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
              >
                {status === "rejected" ? "Retry" : "Verify now"} <ChevronRight size={13} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── SAVE ERROR ── */}
      {saveError && (
        <div className="max-w-[1100px] mx-auto px-3 sm:px-4 md:px-6 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
            <p className="text-[13px] text-red-700 font-medium">{saveError}</p>
          </div>
        </div>
      )}

      {/* ── BODY ── */}
      <div className="max-w-[1100px] mx-auto px-3 sm:px-4 md:px-6 py-6 pb-16">

        {/* Profile completion bar */}
        <div className="mb-6 bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-bold text-gray-700">Profile completion</p>
              <p className="text-[12px] font-black text-gray-900">{completionPct}%</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
          {completionPct < 100 && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex-shrink-0 text-[12px] font-bold text-black border border-gray-200 hover:border-black px-3 py-2 rounded-xl transition-colors"
            >
              Complete profile
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Personal Info */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-black tracking-tight text-gray-900">Personal information</h2>
                  <p className="text-[12px] text-gray-400 mt-0.5">Visible to passengers and drivers</p>
                </div>
              </div>
              <div className="px-6 py-1">
                <EditableField icon={User}   label="Full name" value={form.full_name} editing={editing} onChange={(v) => setField("full_name", v)} />
                <EditableField icon={Phone}  label="Phone"     value={form.phone}     editing={editing} onChange={(v) => setField("phone", v)} type="tel" />
                <EditableField icon={Mail}   label="Email"     value={form.email}     editing={editing} onChange={() => {}} locked />
                <EditableField icon={MapPin} label="Location"  value={form.location}  editing={editing} onChange={(v) => setField("location", v)} />
              </div>
              {editing && (
                <p className="px-6 pb-4 text-[11px] text-gray-300">
                  Email address can't be changed here. Contact support if needed.
                </p>
              )}
            </div>

            {/* About / Bio */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <h2 className="text-[15px] font-black tracking-tight text-gray-900">About you</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">Tell passengers what to expect</p>
              </div>
              <div className="px-6 py-5">
                {editing ? (
                  <textarea
                    value={form.bio}
                    onChange={(e) => setField("bio", e.target.value)}
                    rows={4}
                    maxLength={300}
                    placeholder="e.g. Daily commuter on the DHA–Gulshan route. Music on, AC always on. Punctual."
                    className="w-full border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-[14px] outline-none transition-colors resize-none text-gray-700"
                  />
                ) : (
                  <p className="text-[14px] text-gray-600 leading-7">
                    {form.bio || (
                      <span className="text-gray-300 italic">
                        No bio yet. Add one so passengers know what to expect from you.
                      </span>
                    )}
                  </p>
                )}
                {editing && (
                  <p className="text-[11px] text-gray-300 mt-2 text-right">
                    {form.bio.length}/300
                  </p>
                )}
              </div>
            </div>

            {/* Stats grid — mobile only (appears between columns) */}
            <div className="grid grid-cols-2 gap-4 lg:hidden">
              <StatCard icon={Car}      num={String(stats.rides)}    label="Rides offered" />
              <StatCard icon={MapPin}   num={String(stats.bookings)} label="Rides booked"  />
              <StatCard icon={Star}     num="—"                      label="Rating"        />
              <StatCard icon={Calendar} num={stats.memberSince || "—"} label="Member since" />
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">

            {/* Stats grid — desktop only */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <StatCard icon={Car}      num={String(stats.rides)}    label="Rides offered" />
              <StatCard icon={MapPin}   num={String(stats.bookings)} label="Rides booked"  />
              <StatCard icon={Star}     num="—"                      label="Rating"        />
              <StatCard icon={Calendar} num={stats.memberSince || "—"} label="Member since" />
            </div>

            {/* Vehicle */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <h2 className="text-[15px] font-black tracking-tight text-gray-900">Vehicle</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">Required to offer rides</p>
              </div>
              <div className="px-6 py-5">
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                        Car model
                      </label>
                      <input
                        value={form.car_model}
                        onChange={(e) => setField("car_model", e.target.value)}
                        placeholder="e.g. Honda City 2022"
                        className="w-full border border-gray-200 focus:border-black rounded-lg px-3 py-2 text-[14px] font-semibold outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                        Plate number
                      </label>
                      <input
                        value={form.car_plate}
                        onChange={(e) => setField("car_plate", e.target.value)}
                        placeholder="e.g. ABC-1234"
                        className="w-full border border-gray-200 focus:border-black rounded-lg px-3 py-2 text-[14px] font-semibold outline-none transition-colors"
                      />
                    </div>
                  </div>
                ) : form.car_model ? (
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                      <Car size={18} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="font-black text-[14px] text-gray-900">{form.car_model}</p>
                      {form.car_plate ? (
                        <p className="flex items-center gap-1 text-[12px] text-gray-400 mt-0.5">
                          <Hash size={10} />
                          {form.car_plate}
                        </p>
                      ) : (
                        <p className="text-[12px] text-gray-300 mt-0.5">No plate number</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4 text-center">
                    <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                      <Car size={18} className="text-gray-300" />
                    </div>
                    <p className="text-[13px] font-semibold text-gray-400">No vehicle added</p>
                    <p className="text-[11px] text-gray-300 mt-1">Add your car to start offering rides</p>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="mt-3 text-[12px] font-bold text-black border border-gray-200 hover:border-black px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Add vehicle
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Verification */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <h2 className="text-[15px] font-black tracking-tight text-gray-900">Verification</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">Build trust with other users</p>
              </div>
              <div className="px-6 py-4 space-y-1">
                {[
                  { label: "Phone number",    done: !!form.phone,          note: form.phone || "Not added" },
                  { label: "Email address",   done: !!form.email,          note: form.email || "Not added" },
                  { label: "Identity (CNIC)", done: status === "approved", note: badge.label },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${row.done ? "bg-green-50" : "bg-gray-50"}`}>
                      {row.done
                        ? <CheckCircle size={14} className="text-green-500" />
                        : <Shield size={14} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800">{row.label}</p>
                      <p className="text-[11px] text-gray-400 truncate">{row.note}</p>
                    </div>
                  </div>
                ))}
              </div>
              {status !== "approved" && (
                <div className="px-6 pb-5">
                  <a
                    href="/verify"
                    className="flex items-center justify-center gap-1.5 w-full text-[13px] font-black bg-black text-white py-2.5 rounded-xl hover:bg-gray-900 transition-colors"
                  >
                    {status === "rejected" ? "Retry verification" : status === "pending" ? "Check status" : "Verify identity"}
                    <ChevronRight size={14} />
                  </a>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <h2 className="text-[15px] font-black tracking-tight text-gray-900">Reviews</h2>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-[32px] font-black text-gray-900 leading-none">—</span>
                  <div>
                    <div className="flex gap-0.5 mb-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={13} className="text-gray-200 fill-gray-200" />
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400">out of 5</p>
                  </div>
                </div>
                <p className="text-[12px] text-gray-400 leading-relaxed mt-2">
                  No reviews yet. Complete a ride to start building your reputation.
                </p>
                <a
                  href="/find-ride"
                  className="mt-4 flex items-center gap-1 text-[12px] font-bold text-black hover:text-green-600 transition-colors"
                >
                  <MessageSquare size={13} />
                  Find your first ride
                  <ChevronRight size={12} />
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}