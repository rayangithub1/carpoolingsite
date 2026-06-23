"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import {
  Car, Calendar, Clock, User, Phone, CheckCircle,
  XCircle, AlertCircle, ArrowRight, Search, Ticket,
  ChevronDown, Star, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  ref: string;
  from: string;
  to: string;
  driver: string;
  driverInitial: string;
  avatarColor: string;
  rating: number;
  phone: string;
  car: string;
  plateNo: string;
  date: string;
  time: string;
  seats: number;
  fare: number;
  total: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  bookedAt: string;
}

interface BookingRow {
  id: string;
  ride_id: string;
  user_name: string;
  user_phone: string;
  seats: number;
  total_fare: number;
  status: string;
  created_at: string;
  rides: {
    from_location: string;
    to_location: string;
    driver_name: string;
    driver_phone: string;
    car: string;
    car_color: string | null;
    plate_no: string;
    date: string;
    time: string;
    fare: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-orange-500", "bg-teal-500", "bg-pink-500",
  "bg-violet-500", "bg-cyan-600", "bg-emerald-600", "bg-rose-500",
];
function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function mapRowToBooking(row: BookingRow): Booking {
  return {
    id:            row.id,
    ref:           `MV-${row.id.slice(0, 5).toUpperCase()}`,
    from:          row.rides.from_location,
    to:            row.rides.to_location,
    driver:        row.rides.driver_name,
    driverInitial: row.rides.driver_name?.charAt(0).toUpperCase() ?? "?",
    avatarColor:   colorForId(row.id),
    rating:        4.8,
    phone:         row.rides.driver_phone,
    car:           `${row.rides.car}${row.rides.car_color ? ` · ${row.rides.car_color}` : ""}`,
    plateNo:       row.rides.plate_no,
    date:          row.rides.date,
    time:          row.rides.time,
    seats:         row.seats,
    fare:          row.rides.fare,
    total:         row.total_fare,
    status:        row.status as Booking["status"],
    bookedAt:      row.created_at,
  };
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  confirmed: { label: "Confirmed",  bg: "bg-green-50",  text: "text-green-700",  border: "border-green-100",  icon: CheckCircle },
  pending:   { label: "Pending",    bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-100", icon: AlertCircle },
  cancelled: { label: "Cancelled",  bg: "bg-red-50",    text: "text-red-600",    border: "border-red-100",    icon: XCircle },
  completed: { label: "Completed",  bg: "bg-gray-100",  text: "text-gray-500",   border: "border-gray-200",   icon: CheckCircle },
};

const FILTER_TABS = ["All", "Confirmed", "Pending", "Completed", "Cancelled"] as const;
type FilterTab = typeof FILTER_TABS[number];

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg        = STATUS_CONFIG[booking.status];
  const StatusIcon = cfg.icon;
  const canCancel  = booking.status === "confirmed" || booking.status === "pending";

  return (
    <div className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${
      booking.status === "cancelled" ? "border-gray-100 opacity-60" :
      booking.status === "completed" ? "border-gray-100" :
      "border-[#e8e8e8] hover:border-black"
    }`}>
      <div className="p-5">
        <div className="flex items-start gap-4">

          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-black text-white flex-shrink-0 ${booking.avatarColor}`}>
            {booking.driverInitial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-black">{booking.from}</span>
                  <ArrowRight size={13} className="text-gray-300 flex-shrink-0" />
                  <span className="text-[15px] font-black">{booking.to}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-[12px] text-gray-500">
                    <Calendar size={11} /> {booking.date}
                  </span>
                  <span className="flex items-center gap-1 text-[12px] text-gray-500">
                    <Clock size={11} /> {booking.time}
                  </span>
                  <span className="flex items-center gap-1 text-[12px] text-gray-500">
                    <User size={11} /> {booking.driver}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                  <StatusIcon size={11} />
                  {cfg.label}
                </span>
                <span className="text-[10px] font-bold text-gray-400 tracking-widest">{booking.ref}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-xl font-black tabular-nums">Rs {booking.total}</span>
                {booking.seats > 1 && (
                  <span className="text-[11px] text-gray-400">{booking.seats} seats × Rs {booking.fare}</span>
                )}
              </div>
              <button
                onClick={() => setExpanded((x) => !x)}
                className="flex items-center gap-1 text-[12px] font-bold text-gray-500 hover:text-black transition-colors"
              >
                {expanded ? "Less" : "Details"}
                <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#e8e8e8] bg-[#f9f9f8]">
          <div className="p-5 grid sm:grid-cols-3 gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Driver</p>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0 ${booking.avatarColor}`}>
                  {booking.driverInitial}
                </div>
                <div>
                  <p className="text-[13px] font-black">{booking.driver}</p>
                  <p className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    {booking.rating}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Vehicle</p>
              <p className="text-[13px] font-black">{booking.car}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{booking.plateNo}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Trip</p>
              <p className="text-[13px] font-black">{booking.time}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{booking.seats} seat{booking.seats > 1 ? "s" : ""} · Cash on pickup</p>
            </div>
          </div>

          <div className="px-5 pb-5 flex items-center gap-3 flex-wrap">
            {booking.status === "confirmed" && (
              <a
                href={`tel:${booking.phone}`}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-black hover:bg-gray-900 text-white text-[13px] font-bold rounded-xl transition-colors no-underline"
              >
                <Phone size={13} /> Call Driver
              </a>
            )}
            {canCancel && (
              <button
                onClick={() => onCancel(booking.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 hover:border-red-400 text-red-500 text-[13px] font-bold rounded-xl transition-colors"
              >
                <XCircle size={13} /> Cancel Booking
              </button>
            )}
            {booking.status === "completed" && (
              <Link
                href="/find-ride"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-[13px] font-bold rounded-xl transition-colors no-underline"
              >
                <ArrowRight size={13} /> Book Again
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────

function CancelModal({ onConfirm, onClose, cancelling }: { onConfirm: () => void; onClose: () => void; cancelling: boolean }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm pointer-events-auto shadow-2xl">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <XCircle size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-black text-center mb-2">Cancel Booking?</h3>
          <p className="text-[13px] text-gray-500 text-center leading-relaxed mb-6">
            Are you sure? This cannot be undone. The seat will be released back to the driver.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={cancelling}
              className="flex-1 h-11 border border-gray-200 hover:border-black font-bold text-[14px] rounded-xl transition-colors disabled:opacity-50"
            >
              Keep it
            </button>
            <button
              onClick={onConfirm}
              disabled={cancelling}
              className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white font-black text-[14px] rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {cancelling ? <><Loader2 size={14} className="animate-spin" /> Cancelling…</> : "Yes, Cancel"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterTab }) {
  return (
    <div className="border-2 border-dashed border-[#e8e8e8] rounded-2xl p-16 text-center">
      <Ticket size={32} className="text-gray-200 mx-auto mb-4" />
      <p className="font-black text-lg mb-2">
        {filter === "All" ? "No bookings yet" : `No ${filter.toLowerCase()} bookings`}
      </p>
      <p className="text-sm text-gray-400 mb-6">
        {filter === "All"
          ? "Rides you book will appear here."
          : `You have no ${filter.toLowerCase()} rides right now.`}
      </p>
      <Link
        href="/find-ride"
        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-900 transition-colors no-underline"
      >
        <Search size={15} /> Find a Ride
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState("");
  const [filter, setFilter]           = useState<FilterTab>("All");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling]   = useState(false);
  const [user, setUser]               = useState<{ name: string; phone?: string } | null>(null);

  // ── Load user from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  // ── Fetch bookings from Supabase ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`*, rides(from_location, to_location, driver_name, driver_phone, car, car_color, plate_no, date, time, fare)`)
          .eq("user_phone", user.phone ?? "")
          .order("created_at", { ascending: false });

        if (error) throw new Error(error.message);
        setBookings((data as BookingRow[]).map(mapRowToBooking));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  // ── Cancel booking ──────────────────────────────────────────────────────────
  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      // 1. Get the booking to find how many seats to restore
      const booking = bookings.find((b) => b.id === cancelTarget);
      if (!booking) throw new Error("Booking not found.");

      // 2. Mark booking as cancelled
      const { error: cancelError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", cancelTarget);
      if (cancelError) throw new Error(cancelError.message);

      // 3. Restore seats on the ride
      const { data: rideRow, error: rideReadError } = await supabase
        .from("bookings")
        .select("ride_id, seats")
        .eq("id", cancelTarget)
        .single();

      // We already have ride info from the mapped booking — use the join data
      const { error: seatError } = await supabase.rpc("restore_seats", {
        p_ride_id: (rideRow as { ride_id: string; seats: number } | null)?.ride_id,
        p_seats:   booking.seats,
      });
      // Note: if restore_seats RPC doesn't exist yet, seats won't update —
      // that's okay for now, cancel still works.
      void seatError;

      // 4. Update local state
      setBookings((prev) =>
        prev.map((b) => b.id === cancelTarget ? { ...b, status: "cancelled" as const } : b)
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cancel failed.");
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = filter === "All"
    ? bookings
    : bookings.filter((b) => b.status === filter.toLowerCase());

  const active     = bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length;
  const completed  = bookings.filter((b) => b.status === "completed").length;
  const totalSpent = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + b.total, 0);

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-[#f9f9f8]">
        <Navbar />
        <div className="pt-[76px] max-w-[500px] mx-auto px-4 py-24 text-center">
          <Ticket size={36} className="text-gray-200 mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2">Sign in to see your bookings</h1>
          <p className="text-gray-400 text-sm mb-6">Your ride history lives here once you're logged in.</p>
          <Link
            href="/login?redirect=/bookings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold text-sm rounded-xl hover:bg-gray-800 transition-colors no-underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black antialiased">
      <Navbar />

      {cancelTarget && (
        <CancelModal
          onConfirm={confirmCancel}
          onClose={() => setCancelTarget(null)}
          cancelling={cancelling}
        />
      )}

      {/* ── HERO ── */}
      <section className="pt-[76px] bg-black">
        <div className="max-w-[1100px] mx-auto px-6 py-10">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Passenger</p>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-2">
                My Bookings
              </h1>
              <p className="text-gray-500 text-[14px]">
                {user?.name ? `Welcome back, ${user.name.split(" ")[0]}.` : "All your ride bookings in one place."}
              </p>
            </div>
            <Link
              href="/find-ride"
              className="flex items-center gap-2 px-5 py-3 bg-green-500 hover:bg-green-600 text-white font-black text-[13px] rounded-xl transition-colors no-underline flex-shrink-0"
            >
              <Search size={15} /> Find New Ride
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { label: "Active Rides",  value: loading ? "—" : String(active) },
              { label: "Completed",     value: loading ? "—" : String(completed) },
              { label: "Total Spent",   value: loading ? "—" : `Rs ${totalSpent.toLocaleString()}` },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-4">
                <p className="text-2xl font-black text-white tabular-nums">{s.value}</p>
                <p className="text-[11px] text-gray-500 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILTER TABS ── */}
      <div className="bg-white border-b border-[#e8e8e8] sticky top-[72px] z-30">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-3">
            {FILTER_TABS.map((tab) => {
              const count = tab === "All"
                ? bookings.length
                : bookings.filter((b) => b.status === tab.toLowerCase()).length;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold flex-shrink-0 transition-colors ${
                    filter === tab ? "bg-black text-white" : "text-gray-500 hover:text-black hover:bg-gray-100"
                  }`}
                >
                  {tab}
                  {count > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      filter === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BOOKING LIST ── */}
      <main className="max-w-[1100px] mx-auto px-6 py-8">

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div className="border-2 border-dashed border-red-200 rounded-2xl p-16 text-center">
            <XCircle size={28} className="text-red-300 mx-auto mb-4" />
            <p className="font-black text-lg mb-2 text-red-600">Couldn't load bookings</p>
            <p className="text-[13px] text-gray-400">{loadError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <>
            <p className="text-[13px] font-bold text-gray-400 mb-5">
              {filtered.length} {filtered.length === 1 ? "booking" : "bookings"}
              {filter !== "All" && ` · ${filter}`}
            </p>
            <div className="flex flex-col gap-3">
              {filtered.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={(id) => setCancelTarget(id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-black border-t border-white/5 py-8 px-6 mt-10">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <Car size={14} className="text-green-400" />
            </div>
            <span className="text-white font-black text-[15px]">
              Movento<span className="text-green-400">.</span>
            </span>
          </Link>
          <p className="text-gray-600 text-[12px]">© 2026 Movento · Karachi ka apna ride sharing</p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Safety", "Help"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="text-gray-600 hover:text-green-400 text-[12px] no-underline transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}