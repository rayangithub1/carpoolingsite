"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import {
  Car, Search, Star, Users, Clock, ArrowRight,
  SlidersHorizontal, MapPin, CheckCircle, X, ChevronDown,
  Zap, Wind,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ride {
  id: string;
  driver: string;
  driverInitial: string;
  avatarColor: string;
  rating: number;
  reviews: number;
  verified: boolean;
  from: string;
  to: string;
  departure: string;
  car: string;
  carColor: string;
  carYear?: number;
  fare: number;
  seats: number;
  femaleOnly?: boolean;
  acAvailable?: boolean;
}

interface RideRow {
  id: string;
  driver_name: string;
  driver_phone: string;
  from_location: string;
  to_location: string;
  date: string;
  time: string;
  seats: number;
  fare: number;
  car: string;
  car_color: string | null;
  car_year?: number | null;
  plate_no: string;
  notes: string | null;
  female_only?: boolean | null;
  ac_available?: boolean | null;
  status: string;
  created_at: string;
}

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-orange-500", "bg-teal-500", "bg-pink-500",
  "bg-violet-500", "bg-cyan-600", "bg-emerald-600", "bg-rose-500",
];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function mapRowToRide(row: RideRow): Ride {
  return {
    id: row.id,
    driver: row.driver_name,
    driverInitial: row.driver_name?.charAt(0)?.toUpperCase() ?? "?",
    avatarColor: colorForId(row.id),
    rating: 4.8,
    reviews: 0,
    verified: true,
    from: row.from_location,
    to: row.to_location,
    departure: row.time,
    car: row.car,
    carColor: row.car_color ?? "",
    carYear: row.car_year ?? undefined,
    fare: row.fare,
    seats: row.seats,
    femaleOnly: row.female_only ?? false,
    acAvailable: row.ac_available ?? false,
  };
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const origins = [
  "All Origins", "Bahria Town Karachi", "North Nazimabad", "Gulshan-e-Iqbal",
  "Gulistan-e-Johar", "Surjani Town", "Orangi Town", "Korangi", "Landhi", "Malir", "Saddar",
];
const destinations = [
  "All Destinations", "DHA Phase 5", "Clifton", "Gulshan-e-Iqbal",
  "Shahrah-e-Faisal", "PECHS", "I.I. Chundrigar Road", "Tariq Road",
];
const sortOptions = ["Departure Time", "Price: Low to High", "Price: High to Low", "Rating"];

// ─── Ride Card ────────────────────────────────────────────────────────────────

function RideCard({ ride, onBook }: { ride: Ride; onBook: (id: string) => void }) {
  const seatsUrgent = ride.seats <= 2;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl hover:border-gray-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-200 overflow-hidden">

      {/* Top strip */}
      <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-5">

        {/* Route + price row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            {/* Time badge */}
            <div className="inline-flex items-center gap-1.5 bg-black text-white text-[11px] font-black px-2.5 py-1 rounded-lg mb-2.5">
              <Clock size={10} />
              {ride.departure}
            </div>
            {/* Route */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[16px] sm:text-[18px] font-black text-black leading-tight">{ride.from}</span>
              <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
              <span className="text-[16px] sm:text-[18px] font-black text-green-600 leading-tight">{ride.to}</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <p className="text-[24px] sm:text-[28px] font-black text-black leading-none tabular-nums">
              Rs {ride.fare}
            </p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">per seat</p>
          </div>
        </div>

        {/* Driver row */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[13px] font-black text-white flex-shrink-0 ${ride.avatarColor}`}>
            {ride.driverInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-bold text-black">{ride.driver}</span>
              {ride.verified && <CheckCircle size={12} className="text-green-500 flex-shrink-0" />}
              <div className="flex items-center gap-1">
                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                <span className="text-[11px] font-bold text-gray-600">{ride.rating.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-[12px] text-gray-400 mt-0.5 truncate">
              {ride.car}{ride.carColor ? ` · ${ride.carColor}` : ""}{ride.carYear ? ` · ${ride.carYear}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-gray-50 px-4 py-3 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seats */}
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${
            seatsUrgent
              ? "bg-red-50 text-red-600 border border-red-100"
              : "bg-gray-50 text-gray-500 border border-gray-100"
          }`}>
            <Users size={10} />
            {ride.seats} seat{ride.seats !== 1 ? "s" : ""} left
            {seatsUrgent && " · Filling fast"}
          </span>

          {/* Tags */}
          {ride.acAvailable && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Wind size={10} /> AC
            </span>
          )}
          {ride.femaleOnly && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-pink-50 text-pink-600 border border-pink-100">
              Female only
            </span>
          )}
        </div>

        <button
          onClick={() => onBook(ride.id)}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-green-500 text-white text-[13px] font-black rounded-xl transition-colors"
        >
          Book <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Filter Sheet (mobile bottom drawer) ─────────────────────────────────────

function FilterSheet({
  open, onClose, maxFare, setMaxFare, minRating, setMinRating,
  origin, setOrigin, destination, setDestination,
}: {
  open: boolean; onClose: () => void;
  maxFare: number; setMaxFare: (v: number) => void;
  minRating: number; setMinRating: (v: number) => void;
  origin: string; setOrigin: (v: string) => void;
  destination: string; setDestination: (v: string) => void;
}) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl lg:hidden max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-[15px] font-black">Filters</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
            <X size={15} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-6">

          {/* Max fare */}
          <div>
            <div className="flex justify-between mb-3">
              <p className="text-[13px] font-bold text-gray-800">Max Fare</p>
              <span className="text-[13px] font-black">Rs {maxFare}</span>
            </div>
            <input type="range" min={150} max={600} step={25} value={maxFare}
              onChange={(e) => setMaxFare(Number(e.target.value))}
              className="w-full accent-green-500 cursor-pointer" />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>Rs 150</span><span>Rs 600</span>
            </div>
          </div>

          {/* Min rating */}
          <div>
            <p className="text-[13px] font-bold text-gray-800 mb-3">Min Rating</p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 4.5, 4.7, 4.9].map((r) => (
                <button key={r} onClick={() => setMinRating(r)}
                  className={`py-2 rounded-xl text-[12px] font-bold border transition-colors ${
                    minRating === r ? "bg-black text-white border-black" : "border-gray-200 text-gray-600"
                  }`}>
                  {r === 0 ? "Any" : `${r}+`}
                </button>
              ))}
            </div>
          </div>

          {/* From */}
          <div>
            <p className="text-[13px] font-bold text-gray-800 mb-3">From</p>
            <div className="grid grid-cols-2 gap-2">
              {["All", "Bahria Town Karachi", "North Nazimabad", "Gulistan-e-Johar", "Korangi", "Malir"].map((o) => {
                const val = o === "All" ? "" : o;
                return (
                  <button key={o} onClick={() => setOrigin(val)}
                    className={`py-2 px-3 rounded-xl text-[12px] font-medium text-left border transition-colors ${
                      origin === val ? "bg-black text-white border-black" : "border-gray-200 text-gray-600"
                    }`}>
                    {o}
                  </button>
                );
              })}
            </div>
          </div>

          {/* To */}
          <div>
            <p className="text-[13px] font-bold text-gray-800 mb-3">To</p>
            <div className="grid grid-cols-2 gap-2">
              {["All", "DHA Phase 5", "Clifton", "Gulshan-e-Iqbal", "Shahrah-e-Faisal", "PECHS", "Saddar"].map((d) => {
                const val = d === "All" ? "" : d;
                return (
                  <button key={d} onClick={() => setDestination(val)}
                    className={`py-2 px-3 rounded-xl text-[12px] font-medium text-left border transition-colors ${
                      destination === val ? "bg-black text-white border-black" : "border-gray-200 text-gray-600"
                    }`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={onClose}
            className="w-full py-3.5 bg-black text-white font-black text-[14px] rounded-2xl">
            Show rides
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function FindRideInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [rides, setRides]             = useState<Ride[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState("");
  const [origin, setOrigin]           = useState("");
  const [destination, setDestination] = useState("");
  const [dateFilter, setDateFilter]   = useState("");
  const [timeFilter, setTimeFilter]   = useState("");
  const [sortBy, setSortBy]           = useState("Departure Time");
  const [maxFare, setMaxFare]         = useState(600);
  const [minRating, setMinRating]     = useState(0);
  const [user, setUser]               = useState<{ name: string } | null>(null);
  const [filterOpen, setFilterOpen]   = useState(false);

  // Read search params from homepage
  useEffect(() => {
    const from = searchParams.get("from");
    const to   = searchParams.get("to");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    if (from) setOrigin(from);
    if (to)   setDestination(to);
    if (date) setDateFilter(date);
    if (time) setTimeFilter(time);
  }, [searchParams]);

  // Fetch rides
  useEffect(() => {
    const fetchRides = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const { data, error } = await supabase
          .from("rides").select("*").eq("status", "active")
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        setRides((data as RideRow[] ?? []).map(mapRowToRide));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load rides.");
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleBook = (rideId: string) => {
    if (!user) { router.push(`/login?redirect=/booking/${rideId}`); return; }
    router.push(`/booking/${rideId}`);
  };

  const clearAll = () => {
    setOrigin(""); setDestination(""); setDateFilter("");
    setTimeFilter(""); setMaxFare(600); setMinRating(0);
  };

  const hasFilters = origin || destination || dateFilter || timeFilter || maxFare < 600 || minRating > 0;

  const filtered = rides
    .filter((r) => origin      ? r.from.toLowerCase().includes(origin.toLowerCase())      : true)
    .filter((r) => destination ? r.to.toLowerCase().includes(destination.toLowerCase())   : true)
    .filter((r) => r.fare <= maxFare)
    .filter((r) => r.rating >= minRating)
    .sort((a, b) => {
      if (sortBy === "Price: Low to High") return a.fare - b.fare;
      if (sortBy === "Price: High to Low") return b.fare - a.fare;
      if (sortBy === "Rating")             return b.rating - a.rating;
      return a.departure.localeCompare(b.departure);
    });

  return (
    <div className="min-h-screen bg-[#f5f5f3] flex flex-col">
      <Navbar />

      {/* ── SEARCH HEADER ── */}
      <div className="bg-black pt-[76px]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5 sm:py-7">

          {/* Title */}
          <div className="mb-4 sm:mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Find a Ride</p>
            <h1 className="text-[22px] sm:text-[28px] font-black text-white tracking-tight">Where are you headed?</h1>
          </div>

          {/* Search controls */}
          <div className="flex flex-col sm:flex-row gap-2">

            {/* From */}
            <div className="relative flex-1">
              <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-400 pointer-events-none z-10" />
              <select
                value={origin || "All Origins"}
                onChange={(e) => setOrigin(e.target.value === "All Origins" ? "" : e.target.value)}
                className="w-full h-11 bg-white/10 border border-white/10 text-white rounded-xl pl-9 pr-8 text-[13px] font-semibold focus:outline-none focus:border-green-400 transition-colors appearance-none"
              >
                {origins.map((o) => <option key={o} value={o} className="bg-black">{o}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            </div>

            {/* Arrow — desktop only */}
            <div className="hidden sm:flex items-center">
              <ArrowRight size={14} className="text-gray-600" />
            </div>

            {/* To */}
            <div className="relative flex-1">
              <select
                value={destination || "All Destinations"}
                onChange={(e) => setDestination(e.target.value === "All Destinations" ? "" : e.target.value)}
                className="w-full h-11 bg-white/10 border border-white/10 text-white rounded-xl px-4 pr-8 text-[13px] font-semibold focus:outline-none focus:border-green-400 transition-colors appearance-none"
              >
                {destinations.map((d) => <option key={d} value={d} className="bg-black">{d}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            </div>

            {/* Date */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-11 bg-white/10 border border-white/10 text-white rounded-xl px-3 text-[13px] font-semibold focus:outline-none focus:border-green-400 transition-colors sm:w-40"
            />

            {/* Search button */}
            <button className="h-11 px-5 bg-green-500 hover:bg-green-600 text-white font-black text-[13px] rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Search size={14} /> Search
            </button>
          </div>

          {/* Active filter pills */}
          {hasFilters && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {origin && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/10 text-white/70 px-3 py-1.5 rounded-full">
                  From: {origin}
                  <button onClick={() => setOrigin("")} className="hover:text-white"><X size={10} /></button>
                </span>
              )}
              {destination && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/10 text-white/70 px-3 py-1.5 rounded-full">
                  To: {destination}
                  <button onClick={() => setDestination("")} className="hover:text-white"><X size={10} /></button>
                </span>
              )}
              {dateFilter && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/10 text-white/70 px-3 py-1.5 rounded-full">
                  {dateFilter}
                  <button onClick={() => setDateFilter("")} className="hover:text-white"><X size={10} /></button>
                </span>
              )}
              {maxFare < 600 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/10 text-white/70 px-3 py-1.5 rounded-full">
                  Max Rs {maxFare}
                  <button onClick={() => setMaxFare(600)} className="hover:text-white"><X size={10} /></button>
                </span>
              )}
              <button onClick={clearAll} className="text-[11px] font-bold text-white/40 hover:text-white/70 underline underline-offset-2">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex-1 max-w-[1100px] mx-auto w-full px-4 sm:px-6 py-5 flex gap-6 items-start">

        {/* ── SIDEBAR (desktop) ── */}
        <aside className="hidden lg:flex flex-col gap-4 w-56 flex-shrink-0 sticky top-[88px]">

          {/* Live stats */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live</p>
            </div>
            {[
              { label: "Rides available", value: `${filtered.length}` },
              { label: "Active drivers",  value: `${new Set(rides.map((r) => r.driver)).size}` },
              { label: "Avg fare",        value: rides.length ? `Rs ${Math.round(rides.reduce((s, r) => s + r.fare, 0) / rides.length)}` : "—" },
            ].map((s, i) => (
              <div key={s.label} className={`px-4 py-3 flex justify-between items-center ${i < 2 ? "border-b border-gray-50" : ""}`}>
                <span className="text-[12px] text-gray-500">{s.label}</span>
                <span className="text-[13px] font-black tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <SlidersHorizontal size={12} className="text-gray-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Filters</p>
            </div>

            <div className="px-4 py-4 border-b border-gray-50">
              <div className="flex justify-between mb-2">
                <p className="text-[11px] font-bold text-gray-600">Max Fare</p>
                <span className="text-[11px] font-black">Rs {maxFare}</span>
              </div>
              <input type="range" min={150} max={600} step={25} value={maxFare}
                onChange={(e) => setMaxFare(Number(e.target.value))}
                className="w-full accent-green-500 h-1 cursor-pointer" />
              <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                <span>Rs 150</span><span>Rs 600</span>
              </div>
            </div>

            <div className="px-4 py-4 border-b border-gray-50">
              <p className="text-[11px] font-bold text-gray-600 mb-2.5">Min Rating</p>
              <div className="flex gap-1.5 flex-wrap">
                {[0, 4.5, 4.7, 4.9].map((r) => (
                  <button key={r} onClick={() => setMinRating(r)}
                    className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                      minRating === r ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:border-gray-400"
                    }`}>
                    {r === 0 ? "Any" : `${r}+`}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-4 border-b border-gray-50">
              <p className="text-[11px] font-bold text-gray-600 mb-2">From</p>
              <div className="flex flex-col gap-0.5">
                {["All", "Bahria Town Karachi", "North Nazimabad", "Gulistan-e-Johar", "Korangi", "Malir"].map((o) => {
                  const val = o === "All" ? "" : o;
                  return (
                    <button key={o} onClick={() => setOrigin(val)}
                      className={`text-left text-[12px] px-2.5 py-1.5 rounded-lg transition-colors ${
                        origin === val ? "bg-black text-white font-bold" : "text-gray-500 hover:bg-gray-50"
                      }`}>
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-4 py-4">
              <p className="text-[11px] font-bold text-gray-600 mb-2">To</p>
              <div className="flex flex-col gap-0.5">
                {["All", "DHA Phase 5", "Clifton", "Gulshan-e-Iqbal", "Shahrah-e-Faisal", "PECHS", "Saddar"].map((d) => {
                  const val = d === "All" ? "" : d;
                  return (
                    <button key={d} onClick={() => setDestination(val)}
                      className={`text-left text-[12px] px-2.5 py-1.5 rounded-lg transition-colors ${
                        destination === val ? "bg-black text-white font-bold" : "text-gray-500 hover:bg-gray-50"
                      }`}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Offer ride CTA */}
          <div className="bg-black rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            <Car size={16} className="text-green-400 mb-3 relative z-10" />
            <p className="text-[13px] font-black text-white mb-1 relative z-10">Have empty seats?</p>
            <p className="text-[11px] text-gray-400 mb-4 leading-relaxed relative z-10">Earn back your fuel cost every day.</p>
            <Link href="/offer-ride"
              className="relative z-10 block text-center text-[12px] font-black bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl transition-colors">
              Offer a Ride →
            </Link>
          </div>

        </aside>

        {/* ── RESULTS ── */}
        <main className="flex-1 min-w-0">

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-[16px] sm:text-[18px] font-black tracking-tight">
                {loading ? "Finding rides…" : `${filtered.length} ride${filtered.length !== 1 ? "s" : ""} found`}
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {origin || "All areas"} → {destination || "Anywhere"}
                {dateFilter ? ` · ${dateFilter}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile filter button */}
              <button
                onClick={() => setFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 h-9 px-3.5 bg-white border border-gray-200 hover:border-black text-[12px] font-bold rounded-xl transition-colors"
              >
                <SlidersHorizontal size={13} />
                Filters
                {hasFilters && <span className="w-4 h-4 bg-black text-white text-[9px] font-black rounded-full flex items-center justify-center">!</span>}
              </button>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 text-[12px] font-bold border border-gray-200 hover:border-black rounded-xl pl-3 pr-8 bg-white transition-colors focus:outline-none appearance-none"
                >
                  {sortOptions.map((opt) => <option key={opt}>{opt}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* States */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="h-5 w-32 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-7 w-56 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-4 w-40 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                  <div className="border-t border-gray-50 p-4 flex justify-between">
                    <div className="h-6 w-24 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-8 w-20 bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="bg-white border border-red-100 rounded-2xl p-10 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <X size={20} className="text-red-400" />
              </div>
              <p className="font-black text-[16px] mb-1">Couldn't load rides</p>
              <p className="text-[13px] text-gray-400 mb-5">{loadError}</p>
              <button onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-gray-800 transition-colors">
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 sm:p-16 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Car size={22} className="text-gray-300" />
              </div>
              <p className="font-black text-[16px] mb-1">No rides found</p>
              <p className="text-[13px] text-gray-400 mb-6 max-w-xs mx-auto">
                {rides.length === 0
                  ? "No rides have been posted yet. Be the first driver on this route."
                  : "Try a different route or loosen your filters."}
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                {hasFilters && (
                  <button onClick={clearAll}
                    className="px-5 py-2.5 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-gray-800 transition-colors">
                    Clear filters
                  </button>
                )}
                <Link href="/offer-ride"
                  className="px-5 py-2.5 border border-gray-200 hover:border-black text-[13px] font-bold rounded-xl transition-colors flex items-center gap-1.5">
                  <Zap size={13} /> Offer a ride
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((ride) => (
                <RideCard key={ride.id} ride={ride} onBook={handleBook} />
              ))}
              <p className="text-[11px] text-center text-gray-300 mt-4 font-medium">
                {filtered.length} ride{filtered.length !== 1 ? "s" : ""} shown · Live results
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter sheet */}
      <FilterSheet
        open={filterOpen} onClose={() => setFilterOpen(false)}
        maxFare={maxFare} setMaxFare={setMaxFare}
        minRating={minRating} setMinRating={setMinRating}
        origin={origin} setOrigin={setOrigin}
        destination={destination} setDestination={setDestination}
      />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FindRidePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <FindRideInner />
    </Suspense>
  );
}
