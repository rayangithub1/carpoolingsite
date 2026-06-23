"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import {
  Car, Search, Star, Users, Clock, ArrowRight,
  SlidersHorizontal, MapPin, CheckCircle,
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
  return (
    <div className="bg-white border border-gray-100 rounded-2xl hover:border-black hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)] transition-all duration-200 group overflow-hidden">
      <div className="p-6">
        <div className="flex gap-6 items-start">

          {/* Time column */}
          <div className="flex-shrink-0 text-center w-[72px]">
            <p className="text-[28px] font-black tracking-tight leading-none text-black tabular-nums">
              {ride.departure.split(" ")[0]}
            </p>
            <p className="text-[11px] font-bold text-gray-400 mt-0.5">
              {ride.departure.split(" ")[1]}
            </p>
            <div className="my-3 flex flex-col items-center gap-1">
              <div className="w-px h-3 bg-gray-200" />
              <Clock size={11} className="text-gray-300" />
              <div className="w-px h-3 bg-gray-200" />
            </div>
          </div>

          <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-[15px] font-black text-black">{ride.from}</span>
              <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
              <span className="text-[15px] font-black text-black">{ride.to}</span>
              {ride.femaleOnly && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-pink-50 text-pink-600 border-pink-200">
                  Female Only
                </span>
              )}
              {ride.acAvailable && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-blue-50 text-blue-600 border-blue-200">
                  AC
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0 ${ride.avatarColor}`}>
                {ride.driverInitial}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-black">{ride.driver}</span>
                  {ride.verified && <CheckCircle size={13} className="text-green-500 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Star size={11} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold tabular-nums">{ride.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({ride.reviews} reviews)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-[12px] px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-600 font-medium">
                {ride.car}{ride.carYear ? ` (${ride.carYear})` : ""}{ride.carColor ? ` · ${ride.carColor}` : ""}
              </span>
              <span className={`text-[12px] px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 ${
                ride.seats === 1
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-gray-50 border border-gray-100 text-gray-600"
              }`}>
                <Users size={11} />
                {ride.seats} {ride.seats === 1 ? "seat" : "seats"} left
              </span>
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex-shrink-0 flex flex-col items-end justify-between self-stretch">
            <div className="text-right">
              <p className="text-[26px] font-black tracking-tight text-black tabular-nums leading-none">
                Rs {ride.fare}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">per seat</p>
            </div>
            <button
              onClick={() => onBook(ride.id)}
              className="mt-4 px-5 py-2.5 bg-black hover:bg-green-500 text-white text-[13px] font-bold rounded-xl transition-colors"
            >
              Book Seat
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Inner page (uses useSearchParams) ───────────────────────────────────────

function FindRideInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [rides, setRides]           = useState<Ride[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState("");
  const [origin, setOrigin]         = useState("");
  const [destination, setDestination] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [sortBy, setSortBy]         = useState("Departure Time");
  const [maxFare, setMaxFare]       = useState(600);
  const [minRating, setMinRating]   = useState(0);
  const [user, setUser]             = useState<{ name: string } | null>(null);

  // ── Read search params from homepage ──
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

  // ── Fetch rides ──
  useEffect(() => {
    const fetchRides = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const { data, error } = await supabase
          .from("rides")
          .select("*")
          .eq("status", "active")
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

  // ── Load user ──
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleBook = (rideId: string) => {
    if (!user) { router.push(`/login?redirect=/booking/${rideId}`); return; }
    router.push(`/booking/${rideId}`);
  };

  const filtered = rides
    .filter((r) => origin      ? r.from.toLowerCase().includes(origin.toLowerCase())           : true)
    .filter((r) => destination ? r.to.toLowerCase().includes(destination.toLowerCase())        : true)
    .filter((r) => r.fare <= maxFare)
    .filter((r) => r.rating >= minRating)
    .sort((a, b) => {
      if (sortBy === "Price: Low to High") return a.fare - b.fare;
      if (sortBy === "Price: High to Low") return b.fare - a.fare;
      if (sortBy === "Rating")             return b.rating - a.rating;
      return a.departure.localeCompare(b.departure);
    });

  return (
    <div className="min-h-screen bg-[#f9f9f8] flex flex-col">
      <Navbar />

      {/* ── SEARCH BAR ── */}
      <div className="flex-shrink-0 bg-black pt-[76px]">
        <div className="max-w-[1100px] mx-auto px-6 py-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Find a Ride</p>
          <h1 className="text-3xl font-black text-white tracking-tight mb-5">Where are you headed?</h1>
          <div className="flex items-center gap-2 flex-wrap">

            <div className="relative flex items-center flex-1 min-w-[160px]">
              <MapPin size={13} className="absolute left-3 text-green-400 pointer-events-none" />
              <select
                className="w-full h-11 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl pl-8 pr-3 text-[13px] font-semibold focus:outline-none focus:border-green-400 transition-colors appearance-none"
                value={origin || "All Origins"}
                onChange={(e) => setOrigin(e.target.value === "All Origins" ? "" : e.target.value)}
              >
                {origins.map((o) => (
                  <option key={o} value={o} className="bg-black text-white">{o}</option>
                ))}
              </select>
            </div>

            <ArrowRight size={14} className="text-gray-600 flex-shrink-0 hidden sm:block" />

            <div className="flex-1 min-w-[140px]">
              <select
                className="w-full h-11 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl px-3 text-[13px] font-semibold focus:outline-none focus:border-green-400 transition-colors appearance-none"
                value={destination || "All Destinations"}
                onChange={(e) => setDestination(e.target.value === "All Destinations" ? "" : e.target.value)}
              >
                {destinations.map((d) => (
                  <option key={d} value={d} className="bg-black text-white">{d}</option>
                ))}
              </select>
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-11 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl px-3 text-[13px] font-semibold focus:outline-none focus:border-green-400 transition-colors"
            />

            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="h-11 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl px-3 text-[13px] font-semibold focus:outline-none focus:border-green-400 transition-colors appearance-none"
            >
              <option value="" className="bg-black">Any time</option>
              <option className="bg-black">Before 7:00 AM</option>
              <option className="bg-black">7:00 – 9:00 AM</option>
              <option className="bg-black">9:00 – 12:00 PM</option>
              <option className="bg-black">After 12:00 PM</option>
            </select>

            <button
              onClick={() => { setOrigin(""); setDestination(""); setDateFilter(""); setTimeFilter(""); }}
              className="h-11 px-4 border border-white/10 hover:border-white/30 text-white/60 hover:text-white font-bold text-[13px] rounded-xl transition-colors flex-shrink-0"
            >
              Clear
            </button>

            <button className="h-11 px-6 bg-green-500 hover:bg-green-600 text-white font-bold text-[13px] rounded-xl flex items-center gap-2 transition-colors flex-shrink-0">
              <Search size={14} /> Search
            </button>

          </div>

          {/* Active filter pills */}
          {(origin || destination || dateFilter) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {origin && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold bg-white/10 text-white/70 px-3 py-1 rounded-full">
                  From: {origin}
                  <button onClick={() => setOrigin("")} className="hover:text-white ml-1">×</button>
                </span>
              )}
              {destination && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold bg-white/10 text-white/70 px-3 py-1 rounded-full">
                  To: {destination}
                  <button onClick={() => setDestination("")} className="hover:text-white ml-1">×</button>
                </span>
              )}
              {dateFilter && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold bg-white/10 text-white/70 px-3 py-1 rounded-full">
                  Date: {dateFilter}
                  <button onClick={() => setDateFilter("")} className="hover:text-white ml-1">×</button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="flex-1 max-w-[1100px] mx-auto w-full px-4 py-6 flex gap-6 items-start">

        {/* ── SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col gap-4 w-60 flex-shrink-0 sticky top-[76px]">

          <div className="border-2 border-black rounded-2xl overflow-hidden">
            <div className="bg-black px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live stats</p>
            </div>
            {[
              { label: "Available rides", value: `${filtered.length} of ${rides.length}` },
              { label: "Active drivers",  value: `${new Set(rides.map((r) => r.driver)).size}` },
              { label: "Avg fare today",  value: rides.length ? `Rs ${Math.round(rides.reduce((s, r) => s + r.fare, 0) / rides.length)}` : "—" },
            ].map((s, i) => (
              <div key={s.label} className={`px-5 py-3.5 flex justify-between items-center bg-white ${i < 2 ? "border-b border-gray-100" : ""}`}>
                <span className="text-xs font-medium text-gray-500">{s.label}</span>
                <span className="text-sm font-black tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>

          <div className="border-2 border-black rounded-2xl overflow-hidden">
            <div className="bg-black px-5 py-3 flex items-center gap-2">
              <SlidersHorizontal size={12} className="text-gray-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Filters</p>
            </div>

            <div className="px-5 py-4 border-b border-gray-100 bg-white">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Max Fare</p>
                <span className="text-sm font-black tabular-nums">Rs {maxFare}</span>
              </div>
              <input
                type="range" min={150} max={600} step={25} value={maxFare}
                onChange={(e) => setMaxFare(Number(e.target.value))}
                className="w-full accent-green-500 h-1 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-300 mt-1.5 font-medium">
                <span>Rs 150</span><span>Rs 600</span>
              </div>
            </div>

            <div className="px-5 py-4 border-b border-gray-100 bg-white">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Min Rating</p>
              <div className="flex gap-2 flex-wrap">
                {[0, 4.5, 4.7, 4.9].map((r) => (
                  <button key={r} onClick={() => setMinRating(r)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                      minRating === r ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:border-black"
                    }`}>
                    {r === 0 ? "Any" : `${r}+`}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-4 border-b border-gray-100 bg-white">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">From</p>
              <div className="flex flex-col gap-0.5">
                {["All", "Bahria Town Karachi", "North Nazimabad", "Gulistan-e-Johar", "Korangi", "Malir"].map((o) => {
                  const val = o === "All" ? "" : o;
                  return (
                    <button key={o} onClick={() => setOrigin(val)}
                      className={`text-left text-[13px] px-3 py-2 rounded-lg font-medium transition-colors ${
                        origin === val ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
                      }`}>
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-4 bg-white">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">To</p>
              <div className="flex flex-col gap-0.5">
                {["All", "DHA Phase 5", "Clifton", "Gulshan-e-Iqbal", "Shahrah-e-Faisal", "PECHS", "Saddar"].map((d) => {
                  const val = d === "All" ? "" : d;
                  return (
                    <button key={d} onClick={() => setDestination(val)}
                      className={`text-left text-[13px] px-3 py-2 rounded-lg font-medium transition-colors ${
                        destination === val ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
                      }`}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-black rounded-2xl px-5 py-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            <Car size={18} className="text-green-400 mb-3 relative z-10" />
            <p className="text-sm font-black text-white leading-tight mb-1 relative z-10">Have a car?</p>
            <p className="text-xs text-gray-400 leading-relaxed mb-4 relative z-10">
              Offer your empty seats and earn back your fuel costs every day.
            </p>
            <Link href="/offer-ride"
              className="relative z-10 block text-center text-xs font-bold bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl transition-colors">
              Offer a Ride →
            </Link>
          </div>

        </aside>

        {/* ── RESULTS ── */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h2 className="text-[20px] font-black tracking-tight">
                {filtered.length} {filtered.length === 1 ? "ride" : "rides"} available
              </h2>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {origin || "All origins"} → {destination || "All destinations"}
                {dateFilter ? ` · ${dateFilter}` : " · Today"}
              </p>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 text-[12px] font-bold border-2 border-gray-200 hover:border-black rounded-xl px-3 bg-white transition-colors focus:outline-none focus:border-black appearance-none"
            >
              {sortOptions.map((opt) => <option key={opt}>{opt}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl h-32 animate-pulse" />
              ))}
            </div>
          ) : loadError ? (
            <div className="border-2 border-dashed border-red-200 rounded-2xl p-16 text-center bg-white">
              <p className="font-black text-lg mb-2 text-red-600">Couldn't load rides</p>
              <p className="text-[13px] text-gray-400">{loadError}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center bg-white">
              <Search size={28} className="text-gray-200 mx-auto mb-4" />
              <p className="font-black text-lg mb-2">No rides found</p>
              <p className="text-[13px] text-gray-400 mb-6">
                {rides.length === 0
                  ? "No one has published a ride yet. Be the first driver!"
                  : "Try a different route or adjust your filters."}
              </p>
              <button
                onClick={() => { setOrigin(""); setDestination(""); setMaxFare(600); setMinRating(0); setDateFilter(""); setTimeFilter(""); }}
                className="px-6 py-2.5 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((ride) => (
                <RideCard key={ride.id} ride={ride} onBook={handleBook} />
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <p className="text-[11px] text-center text-gray-300 mt-8 font-medium">
              All {filtered.length} rides shown · Updated just now
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Page (wraps inner in Suspense for useSearchParams) ───────────────────────

export default function FindRidePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f9f9f8] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <FindRideInner />
    </Suspense>
  );
}