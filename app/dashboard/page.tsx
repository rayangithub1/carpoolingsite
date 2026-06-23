"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import {
  Car,
  User,
  Star,
  Calendar,
  MapPin,
  Phone,
  ArrowRight,
  Clock,
  LogOut,
  CheckCircle,
  Shield,
  Clock3,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredUser {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  verificationStatus: "unverified" | "pending" | "approved" | "rejected";
}

interface RideRow {
  id: string;
  from_location: string;
  to_location: string;
  date: string;
  time: string;
  status: string;
}

interface BookingRow {
  id: string;
  from_location: string;
  to_location: string;
  date: string;
  time: string;
  status: string;
}

const VERIFY_BADGE: Record<StoredUser["verificationStatus"], { label: string; cls: string; icon: React.ElementType }> = {
  approved:   { label: "Verified",      cls: "bg-green-50 text-green-700 border-green-200",   icon: CheckCircle },
  pending:    { label: "Under Review",  cls: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock3 },
  rejected:   { label: "Rejected",      cls: "bg-red-50 text-red-700 border-red-200",          icon: AlertCircle },
  unverified: { label: "Not Verified",  cls: "bg-gray-100 text-gray-500 border-gray-200",      icon: Shield },
};

const quickActions = [
  { href: "/find-ride",  icon: Car,      label: "Find Ride",   desc: "Browse available rides" },
  { href: "/offer-ride", icon: MapPin,   label: "Offer Ride",  desc: "Publish your route"      },
  { href: "/bookings",   icon: Calendar, label: "My Bookings", desc: "View booked rides"        },
  { href: "/my-rides",   icon: User,     label: "My Rides",    desc: "Manage offered rides"     },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]           = useState<StoredUser | null>(null);
  const [checking, setChecking]   = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const [offeredCount, setOfferedCount] = useState(0);
  const [bookedCount, setBookedCount]   = useState(0);
  const [recentRides, setRecentRides]   = useState<(RideRow | BookingRow)[]>([]);

  // ── Auth check + live verification status ──
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

      if (stored.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("verification_status, full_name, phone, email")
          .eq("id", stored.id)
          .single();

        if (!error && data) {
          stored = {
            ...stored,
            name:               data.full_name ?? stored.name,
            phone:              data.phone ?? stored.phone,
            email:              data.email ?? stored.email,
            verificationStatus: data.verification_status as StoredUser["verificationStatus"],
          };
          localStorage.setItem("user", JSON.stringify(stored));
        }
      }

      setUser(stored);
      setChecking(false);
    };

    loadUser();
  }, [router]);

  // ── Fetch real stats once we know the user ──
  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
      setLoadingData(true);
      try {
        const { data: offered } = await supabase
          .from("rides")
          .select("id, from_location, to_location, date, time, status")
          .eq("driver_id", user.id)
          .order("created_at", { ascending: false });

        const { data: booked } = await supabase
          .from("bookings")
          .select("id, from_location, to_location, date, time, status")
          .eq("passenger_id", user.id)
          .order("created_at", { ascending: false });

        setOfferedCount(offered?.length ?? 0);
        setBookedCount(booked?.length ?? 0);

        const combined = [...(offered ?? []), ...(booked ?? [])]
          .slice(0, 4) as (RideRow | BookingRow)[];
        setRecentRides(combined);
      } catch (err) {
        console.warn("[dashboard] Failed to load stats:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  const logout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f9f9f8] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const firstName = user.name?.split(" ")[0] || "";
  const badge = VERIFY_BADGE[user.verificationStatus];
  const BadgeIcon = badge.icon;

  const stats = [
    { num: String(offeredCount), label: "Rides Offered" },
    { num: String(bookedCount),  label: "Bookings"       },
    { num: "—",                  label: "Rating"         },
    { num: badge.label,          label: "Status"         },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f8]">

      <Navbar />

      {/* ── HERO WELCOME ── */}
      <div className="pt-[76px]">
        <div className="bg-black relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
          <div className="max-w-[1100px] mx-auto px-6 py-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

              {/* Left: greeting + profile summary */}
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-green-500 text-white text-2xl font-black flex items-center justify-center flex-shrink-0 border-2 border-green-400/30">
                  {firstName.charAt(0)}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
                    Dashboard
                  </p>
                  <h1 className="text-[28px] font-black text-white tracking-tight leading-none">
                    Welcome back, {firstName}
                  </h1>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {user.phone && (
                      <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                        <Phone size={11} />
                        {user.phone}
                      </span>
                    )}
                    <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${badge.cls}`}>
                      <BadgeIcon size={11} />
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: stats strip */}
              <div className="flex items-center gap-6 flex-wrap">
                {stats.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-[20px] font-black text-white leading-none tabular-nums truncate max-w-[100px]">{s.num}</div>
                      <div className="text-[10px] text-gray-500 font-medium mt-1">{s.label}</div>
                    </div>
                    {i < stats.length - 1 && <div className="w-px h-8 bg-white/10" />}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── PAGE BODY ── */}
      <div className="max-w-[1100px] mx-auto px-4 py-6 flex flex-col gap-5">

        {/* ── VERIFICATION NOTICE (only if not approved) ── */}
        {user.verificationStatus !== "approved" && (
          <div className={`rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap border-2 ${
            user.verificationStatus === "pending" ? "bg-yellow-50 border-yellow-200" :
            user.verificationStatus === "rejected" ? "bg-red-50 border-red-200" :
            "bg-[#f9f9f8] border-black"
          }`}>
            <div className="flex items-center gap-3">
              <BadgeIcon size={20} className={
                user.verificationStatus === "pending" ? "text-yellow-600" :
                user.verificationStatus === "rejected" ? "text-red-600" : "text-black"
              } />
              <div>
                <p className="text-[14px] font-black">
                  {user.verificationStatus === "pending" && "Verification under review"}
                  {user.verificationStatus === "rejected" && "Verification was rejected"}
                  {user.verificationStatus === "unverified" && "Verify your identity"}
                </p>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  {user.verificationStatus === "pending" && "We'll notify you once it's reviewed — usually within 24 hours."}
                  {user.verificationStatus === "rejected" && "Please resubmit with clearer documents."}
                  {user.verificationStatus === "unverified" && "Verify to offer rides and build trust with passengers."}
                </p>
              </div>
            </div>
            {user.verificationStatus !== "pending" && (
              <Link href="/verify"
                className="flex-shrink-0 px-4 h-10 flex items-center bg-black text-white text-[13px] font-black rounded-xl hover:bg-gray-900 transition-colors no-underline">
                {user.verificationStatus === "rejected" ? "Retry Verification" : "Start Verification"}
              </Link>
            )}
          </div>
        )}

        {/* ── QUICK ACTIONS ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">Quick Actions</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-black hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all group"
              >
                <div className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center mb-4 group-hover:bg-black transition-colors">
                  <Icon size={18} className="text-black group-hover:text-white transition-colors" />
                </div>
                <p className="text-[15px] font-black text-black">{label}</p>
                <p className="text-[12px] text-gray-400 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── RECENT ACTIVITY ── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Recent Activity</p>
            <Link href="/bookings" className="text-[12px] font-bold text-black hover:text-green-600 transition-colors">
              View all →
            </Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              </div>
            ) : recentRides.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Car size={28} className="text-gray-200 mb-3" />
                <p className="text-[14px] font-bold text-gray-400">No rides yet</p>
                <p className="text-[12px] text-gray-300 mt-1">Find or offer your first ride to see activity here.</p>
              </div>
            ) : (
              recentRides.map((ride, i) => (
                <div
                  key={ride.id}
                  className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors ${
                    i < recentRides.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-[#f9f9f8] border border-gray-100 flex items-center justify-center flex-shrink-0">
                      <Car size={15} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[14px] font-black text-black">
                        {ride.from_location} → {ride.to_location}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[12px] text-gray-400 flex items-center gap-1">
                          <Calendar size={11} /> {ride.date}
                        </span>
                        <span className="text-[12px] text-gray-400 flex items-center gap-1">
                          <Clock size={11} /> {ride.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg capitalize ${
                      ride.status === "active" || ride.status === "confirmed"
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                    }`}>
                      {ride.status}
                    </span>
                    <ArrowRight size={13} className="text-gray-300" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── PROFILE CARD ── */}
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-black text-white text-lg font-black flex items-center justify-center flex-shrink-0">
              {firstName.charAt(0)}
            </div>
            <div>
              <p className="text-[15px] font-black text-black">{user.name}</p>
              <p className="text-[12px] text-gray-400">{user.email || user.phone || "No contact added"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="px-4 py-2 text-[13px] font-bold border border-gray-200 hover:border-black rounded-xl transition-colors text-gray-700 hover:text-black"
            >
              Edit Profile
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2 text-[13px] font-bold bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}