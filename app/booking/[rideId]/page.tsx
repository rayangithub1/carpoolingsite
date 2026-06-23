"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import {
  Users, CheckCircle, XCircle,
  ChevronLeft, Phone, Star, AlertCircle,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  car_year: number | null;
  plate_no: string;
  notes: string | null;
  female_only: boolean | null;
  ac_available: boolean | null;
  status: string;
  driver_id: string;
}

type Step = "review" | "confirm" | "success";

// ─── Avatar colour (matches find-ride logic) ────────────────────────────────

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-orange-500", "bg-teal-500", "bg-pink-500",
  "bg-violet-500", "bg-cyan-600", "bg-emerald-600", "bg-rose-500",
];
function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const params   = useParams();
  const rideId = params?.["rideId"] as string;
  const router   = useRouter();

  const [ride, setRide]         = useState<RideRow | null>(null);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState("");

  const [seats, setSeats]       = useState(1);
  const [step, setStep]         = useState<Step>("review");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingRef, setBookingRef]   = useState("");

  const [user, setUser] = useState<{ name: string; phone?: string } | null>(null);

  // ── Load user ───────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  // ── Load ride ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!rideId) return;

    const fetchRide = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const { data, error } = await supabase
          .from("rides")
          .select("*")
          .eq("id", rideId)
          .single();

        if (error || !data) throw new Error(error?.message ?? "Ride not found.");
        setRide(data as RideRow);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load ride.");
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
  }, [rideId]);

  // ── Confirm booking ─────────────────────────────────────────────────────────
  const handleConfirm = async () => {
  if (!ride || !user) return;
  setSubmitting(true);
  setSubmitError("");

  try {
    // 1. Get full user from localStorage (need id)
    const stored = localStorage.getItem("user");
    const fullUser = stored ? JSON.parse(stored) : null;
    if (!fullUser?.id) {
      router.push(`/login?redirect=/booking/${rideId}`);
      return;
    }

    // 2. Check for existing booking (prevent duplicates)
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("ride_id", ride.id)
      .eq("passenger_id", fullUser.id)
      .maybeSingle();

    if (existing) {
      setSubmitError("You've already booked this ride.");
      setSubmitting(false);
      return;
    }

    // 3. Insert booking
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        ride_id:      ride.id,
        passenger_id: fullUser.id,
        user_phone:   user.phone ?? "unknown",
        user_name:    user.name,
        seats:        seats,
        total_fare:   ride.fare * seats,
        status:       "pending",
      })
      .select("id")
      .single();

    if (bookingError) throw new Error(bookingError.message);

    // 4. Decrement seats
    const { error: seatError } = await supabase
      .from("rides")
      .update({ seats: ride.seats - seats })
      .eq("id", ride.id);

    if (seatError) throw new Error(seatError.message);

    // 5. Notify driver
    await supabase.from("notifications").insert({
      user_id: ride.driver_id,
      ride_id: ride.id,
      type:    "booking",
      message: `${user.name} booked ${seats} seat${seats > 1 ? "s" : ""} on your ride from ${ride.from_location} to ${ride.to_location}.`,
    });

    // 6. Notify passenger
    await supabase.from("notifications").insert({
      user_id: fullUser.id,
      ride_id: ride.id,
      type:    "booking",
      message: `Your booking is confirmed! ${ride.driver_name} will pick you up from ${ride.from_location} at ${ride.time}.`,
    });

    // 7. Success
    const ref = `MV-${(bookingData as { id: string }).id.slice(0, 5).toUpperCase()}`;
    setBookingRef(ref);
    setStep("success");
  } catch (err) {
    setSubmitError(err instanceof Error ? err.message : "Booking failed. Please try again.");
  } finally {
    setSubmitting(false);
  }
};

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f8]">
        <Navbar />
        <div className="pt-[76px] max-w-[620px] mx-auto px-4 py-10">
          <div className="space-y-3">
            <div className="h-8 w-40 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            <div className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (loadError || !ride) {
    return (
      <div className="min-h-screen bg-[#f9f9f8]">
        <Navbar />
        <div className="pt-[76px] max-w-[620px] mx-auto px-4 py-16 text-center">
          <XCircle size={36} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-black mb-2">Ride Not Found</h1>
          <p className="text-gray-400 text-sm mb-6">{loadError || "This ride may have been removed."}</p>
          <Link
            href="/find-ride"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold text-sm rounded-xl hover:bg-gray-800 transition-colors no-underline"
          >
            <ChevronLeft size={15} /> Back to Rides
          </Link>
        </div>
      </div>
    );
  }

  const total         = ride.fare * seats;
  const avatarColor   = colorForId(ride.id);
  const driverInitial = ride.driver_name?.charAt(0).toUpperCase() ?? "?";
  const slotsLeft     = ride.seats;

  // ── Success screen ──────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#f9f9f8]">
        <Navbar />
        <div className="pt-[76px] max-w-[620px] mx-auto px-4 py-12">
          <div className="bg-white border-2 border-green-500 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-black mb-1">Booking Confirmed!</h1>
            <p className="text-gray-400 text-sm mb-1">Your seat has been reserved.</p>
            <p className="text-[11px] font-black tracking-widest text-gray-400 mt-3 mb-6">{bookingRef}</p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Route</span>
                <span className="font-bold">{ride.from_location} → {ride.to_location}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Driver</span>
                <span className="font-bold">{ride.driver_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Departure</span>
                <span className="font-bold">{ride.date} · {ride.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Seats</span>
                <span className="font-bold">{seats}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-3 mt-1">
                <span className="font-black">Total</span>
                <span className="font-black text-lg">Rs {total}</span>
              </div>
            </div>

            <a
              href={`tel:${ride.driver_phone}`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-xl transition-colors mb-3 no-underline"
            >
              <Phone size={14} /> Call Driver · {ride.driver_phone}
            </a>

            <Link
              href="/bookings"
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-200 hover:border-black text-gray-700 font-bold text-sm rounded-xl transition-colors no-underline"
            >
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Review + Confirm screens ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f9f9f8]">
      <Navbar />

      <div className="pt-[76px] max-w-[620px] mx-auto px-4 py-8">

        {/* Back link */}
        <button
          onClick={() => (step === "confirm" ? setStep("review") : router.back())}
          className="flex items-center gap-1.5 text-[13px] font-bold text-gray-400 hover:text-black transition-colors mb-6"
        >
          <ChevronLeft size={16} />
          {step === "confirm" ? "Back to review" : "Back to rides"}
        </button>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-7">
          {(["review", "confirm"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-colors ${
                step === s ? "bg-black text-white" :
                (step === "confirm" && s === "review") ? "bg-green-500 text-white" :
                "bg-gray-100 text-gray-400"
              }`}>
                {step === "confirm" && s === "review" ? <CheckCircle size={12} /> : i + 1}
              </div>
              <span className={`text-[12px] font-bold capitalize ${step === s ? "text-black" : "text-gray-400"}`}>{s}</span>
              {i === 0 && <div className="w-8 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: REVIEW ── */}
        {step === "review" && (
          <div className="space-y-4">

            {/* Ride summary card */}
            <div className="bg-white border-2 border-[#e8e8e8] rounded-2xl overflow-hidden">
              <div className="bg-black px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ride Details</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Route */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="w-2 h-2 rounded-full bg-black" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">From</p>
                      <p className="text-[15px] font-black">{ride.from_location}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">To</p>
                      <p className="text-[15px] font-black">{ride.to_location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Departure</p>
                    <p className="text-[20px] font-black tabular-nums">{ride.time}</p>
                    <p className="text-[12px] text-gray-400">{ride.date}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0 ${avatarColor}`}>
                    {driverInitial}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-black">{ride.driver_name}</span>
                      <CheckCircle size={13} className="text-green-500" />
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={11} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold">4.8</span>
                      <span className="text-xs text-gray-400">· Verified driver</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-gray-400">{ride.car}{ride.car_year ? ` (${ride.car_year})` : ""}</p>
                    {ride.car_color && <p className="text-[12px] text-gray-400">{ride.car_color}</p>}
                    <p className="text-[11px] font-bold text-gray-500 mt-0.5">{ride.plate_no}</p>
                  </div>
                </div>

                {/* Tags */}
                {(ride.female_only || ride.ac_available) && (
                  <div className="flex gap-2 flex-wrap pt-1">
                    {ride.female_only && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-pink-50 text-pink-600 border border-pink-200">
                        Female Only
                      </span>
                    )}
                    {ride.ac_available && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                        AC Available
                      </span>
                    )}
                  </div>
                )}

                {ride.notes && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-[13px] text-gray-500 leading-relaxed">
                    {ride.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Seat selector */}
            <div className="bg-white border-2 border-[#e8e8e8] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Seats</p>
                <p className="text-[12px] text-gray-400 flex items-center gap-1">
                  <Users size={11} /> {slotsLeft} left
                </p>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <button
                  onClick={() => setSeats((s) => Math.max(1, s - 1))}
                  disabled={seats <= 1}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-black disabled:opacity-30 font-black text-lg transition-colors flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-2xl font-black tabular-nums w-6 text-center">{seats}</span>
                <button
                  onClick={() => setSeats((s) => Math.min(slotsLeft, s + 1))}
                  disabled={seats >= slotsLeft}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-black disabled:opacity-30 font-black text-lg transition-colors flex items-center justify-center"
                >
                  +
                </button>
                <div className="flex-1 text-right">
                  <p className="text-[26px] font-black tabular-nums leading-none">Rs {total}</p>
                  {seats > 1 && (
                    <p className="text-[12px] text-gray-400 mt-0.5">{seats} × Rs {ride.fare}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment note */}
            <div className="flex items-start gap-2.5 px-4 py-3 bg-yellow-50 border border-yellow-100 rounded-xl">
              <AlertCircle size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-yellow-700 leading-relaxed font-medium">
                Payment is <strong>cash on pickup</strong>. Have the exact amount ready for your driver.
              </p>
            </div>

            <button
              onClick={() => {
                if (!user) { router.push(`/login?redirect=/booking/${rideId}`); return; }
                setStep("confirm");
              }}
              className="w-full py-4 bg-black hover:bg-green-500 text-white font-black text-[15px] rounded-2xl transition-colors"
            >
              Continue to Confirm →
            </button>
          </div>
        )}

        {/* ── STEP 2: CONFIRM ── */}
        {step === "confirm" && (
          <div className="space-y-4">

            <div className="bg-white border-2 border-[#e8e8e8] rounded-2xl overflow-hidden">
              <div className="bg-black px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Confirm Your Booking</p>
              </div>

              <div className="p-5 space-y-3">
                {[
                  { label: "From",      value: ride.from_location },
                  { label: "To",        value: ride.to_location },
                  { label: "Driver",    value: ride.driver_name },
                  { label: "Date",      value: ride.date },
                  { label: "Time",      value: ride.time },
                  { label: "Car",       value: `${ride.car}${ride.car_color ? ` · ${ride.car_color}` : ""}` },
                  { label: "Plate",     value: ride.plate_no },
                  { label: "Seats",     value: `${seats}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">{label}</span>
                    <span className="font-bold text-right">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
                  <span className="font-black">Total</span>
                  <span className="font-black text-xl tabular-nums">Rs {total}</span>
                </div>
              </div>
            </div>

            {/* Booking as */}
            <div className="bg-white border-2 border-[#e8e8e8] rounded-2xl p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Booking as</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-[14px] font-black">{user?.name ?? "Guest"}</p>
                  {user?.phone && <p className="text-[12px] text-gray-400">{user.phone}</p>}
                </div>
              </div>
            </div>

            {submitError && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <XCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-600 font-medium">{submitError}</p>
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-black text-[15px] rounded-2xl transition-colors"
            >
              {submitting ? "Confirming…" : "Confirm Booking"}
            </button>

            <p className="text-[11px] text-center text-gray-400">
              By confirming you agree to Movento's{" "}
              <Link href="/terms" className="underline hover:text-black">Terms</Link> and{" "}
              <Link href="/safety" className="underline hover:text-black">Safety Policy</Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}