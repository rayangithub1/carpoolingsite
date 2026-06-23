"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import {
  Car, Phone, CheckCircle, ArrowRight, Clock,
  Users, ChevronLeft, Calendar, MapPin, X, Loader2, AlertCircle,
} from "lucide-react";

interface Ride {
  id: string;
  from_location: string;
  to_location: string;
  date: string;
  time: string;
  seats: number;
  fare: number;
  car: string;
  car_color: string;
  plate_no: string;
  driver_name: string;
  driver_phone: string;
  notes: string;
  status: string;
}

interface Booking {
  id: string;
  user_name: string;      // was: passenger_name
  user_phone: string;     // was: passenger_phone
  seats: number;          // was: seats_booked
  status: "pending" | "confirmed" | "cancelled";
}

export default function RideDetailsPage() {
  const { id } = useParams();
  const router  = useRouter();

  const [ride, setRide]         = useState<Ride | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
  const load = async () => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) { router.push("/login"); return; }

      const user = JSON.parse(stored);
      if (!user?.phone) { router.push("/login"); return; }

      // Fetch ride — verify it belongs to this driver via phone
      const { data: rideData, error: rideErr } = await supabase
        .from("rides")
        .select("*")
        .eq("id", id)
        .eq("driver_id", user.id)   // ← was driver_id
        .single();

      if (rideErr || !rideData) {
        setError("Ride not found or you don't have access.");
        setLoading(false);
        return;
      }

      setRide(rideData as Ride);

      // Fetch bookings for this ride
      const { data: bookingData, error: bookingErr } = await supabase
        .from("bookings")
        .select("*")
        .eq("ride_id", id)
        .neq("status", "cancelled");

      if (!bookingErr) setBookings((bookingData as Booking[]) ?? []);
    } catch {
      setError("Failed to load ride.");
    } finally {
      setLoading(false);
    }
  };

  load();
}, [id, router]);

  const toggleConfirm = async (booking: Booking) => {
    const newStatus = booking.status === "confirmed" ? "pending" : "confirmed";
    setConfirming(booking.id);

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", booking.id);

    if (!error) {
      setBookings((prev) =>
        prev.map((b) => b.id === booking.id ? { ...b, status: newStatus } : b)
      );
    }
    setConfirming(null);
  };

  const confirmAll = async () => {
    const pending = bookings.filter((b) => b.status !== "confirmed");
    if (pending.length === 0) return;

    const ids = pending.map((b) => b.id);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .in("id", ids);

    if (!error) {
      setBookings((prev) =>
        prev.map((b) => ids.includes(b.id) ? { ...b, status: "confirmed" } : b)
      );
    }
  };

  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const pendingCount   = bookings.length - confirmedCount;
  const totalSeats     = bookings.reduce((acc, b) => acc + b.seats, 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </main>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-[#f9f9f8] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="font-black text-[20px] mb-1">Ride not found</p>
          <p className="text-[13px] text-gray-400 mb-5">
            {error || "This ride doesn't exist or has been deleted."}
          </p>
          <Link href="/my-rides"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-gray-800 transition-colors">
            <ChevronLeft size={14} /> Back to My Rides
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f8]">
      <Navbar />

      {/* ── HERO ── */}
      <div className="pt-[76px] bg-black relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative z-10 max-w-[1100px] mx-auto px-6 py-8">
          <Link href="/my-rides"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-gray-500 hover:text-white transition-colors mb-5">
            <ChevronLeft size={14} /> My Rides
          </Link>

          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Passengers</p>

          <div className="flex items-center gap-3 flex-wrap mb-4">
            <h1 className="text-[26px] md:text-[30px] font-black text-white tracking-tight leading-none">
              {ride.from_location}
            </h1>
            <ArrowRight size={18} className="text-gray-600 flex-shrink-0" />
            <h1 className="text-[26px] md:text-[30px] font-black text-green-400 tracking-tight leading-none">
              {ride.to_location}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="flex items-center gap-1.5 text-[12px] text-gray-400">
              <Calendar size={11} /> {ride.date}
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-gray-400">
              <Clock size={11} /> {ride.time}
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-gray-400">
              <Car size={11} /> {ride.car}{ride.car_color ? ` · ${ride.car_color}` : ""}{ride.plate_no ? ` · ${ride.plate_no}` : ""}
            </span>
          </div>

          <div className="flex items-center gap-6 pt-5 border-t border-white/10">
            {[
              { num: bookings.length, label: "Passengers",   color: "text-white" },
              { num: totalSeats,      label: "Seats Booked", color: "text-white" },
              { num: confirmedCount,  label: "Confirmed",    color: "text-green-400" },
              { num: pendingCount,    label: "Pending",      color: "text-yellow-400" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-6">
                <div className="text-center">
                  <div className={`text-[22px] font-black leading-none ${s.color}`}>{s.num}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
                {i < 3 && <div className="w-px h-7 bg-white/10" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-[1100px] mx-auto px-4 py-6 flex flex-col gap-5">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-black tracking-tight">Passenger List</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {bookings.length} {bookings.length === 1 ? "passenger has" : "passengers have"} booked this ride
            </p>
          </div>
          {confirmedCount > 0 && (
            <span className="flex items-center gap-1.5 text-[12px] font-bold bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-xl">
              <CheckCircle size={12} /> {confirmedCount} confirmed
            </span>
          )}
        </div>

        {/* Empty state */}
        {bookings.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-16 text-center">
            <Users size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="font-black text-[16px] mb-1">No passengers yet</p>
            <p className="text-[13px] text-gray-400">No one has booked this ride yet.</p>
          </div>
        ) : (
          <>
            {/* Passenger cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bookings.map((b) => {
                const isConfirmed = b.status === "confirmed";
                const isLoading   = confirming === b.id;
                return (
                  <div key={b.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isConfirmed
                        ? "border-green-200 shadow-[0_0_0_3px_rgba(34,197,94,0.08)]"
                        : "border-gray-100 hover:border-gray-200"
                    }`}>
                    <div className={`h-1 transition-all duration-300 ${isConfirmed ? "bg-green-500" : "bg-gray-100"}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-black text-white flex-shrink-0 transition-colors duration-300 ${
                            isConfirmed ? "bg-green-500" : "bg-black"
                          }`}>
                            {(b.user_name ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[15px] font-black leading-none">{b.user_name ?? "Passenger"}</p>
                              {isConfirmed && <CheckCircle size={14} className="text-green-500 flex-shrink-0" />}
                            </div>
                            {b.user_phone && (
                              <a href={`tel:${b.user_phone}`}
                                className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-black transition-colors mt-0.5 group">
                                <Phone size={11} className="group-hover:text-green-500 transition-colors" />
                                {b.user_phone}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[12px] font-black flex-shrink-0 ${
                          isConfirmed
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : "bg-gray-50 text-gray-700 border border-gray-100"
                        }`}>
                          <Users size={11} />
                          {b.seats} seat{b.seats > 1 ? "s" : ""}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <p className="text-[11px] text-gray-400">
                          {isConfirmed ? "Passenger confirmed" : "Confirmation pending"}
                        </p>
                        <button
                          onClick={() => toggleConfirm(b)}
                          disabled={isLoading}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all duration-200 disabled:opacity-60 ${
                            isConfirmed
                              ? "bg-green-500 hover:bg-red-500 text-white"
                              : "bg-black hover:bg-gray-700 text-white"
                          }`}>
                          {isLoading
                            ? <Loader2 size={13} className="animate-spin" />
                            : isConfirmed
                              ? <><CheckCircle size={13} /> Confirmed</>
                              : <><CheckCircle size={13} /> Confirm</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick call strip */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-[13px] font-black mb-1">All passenger numbers</p>
              <p className="text-[11px] text-gray-400 mb-4">Tap to call directly</p>
              <div className="flex flex-wrap gap-2">
                {bookings.filter((b) => b.user_phone).map((b) => (
                  <a key={b.id} href={`tel:${b.user_phone}`}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all border ${
                      b.status === "confirmed"
                        ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:border-black hover:bg-gray-100"
                    }`}>
                    <Phone size={11} />
                    {(b.user_name ?? "Passenger").split(" ")[0]} · {b.user_phone}
                    {b.status === "confirmed" && <CheckCircle size={11} className="text-green-500" />}
                  </a>
                ))}
              </div>
            </div>

            {/* Confirm all */}
            {pendingCount > 0 && (
              <button onClick={confirmAll}
                className="w-full py-3.5 border-2 border-dashed border-gray-200 hover:border-black rounded-2xl text-[13px] font-bold text-gray-500 hover:text-black transition-all">
                ✓ Confirm all at once ({pendingCount} remaining)
              </button>
            )}

            {/* All confirmed celebration */}
            {bookings.length > 0 && confirmedCount === bookings.length && (
              <div className="bg-green-500 rounded-2xl px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-white font-black text-[16px]">All passengers confirmed!</p>
                  <p className="text-green-100 text-[12px] mt-0.5">
                    Ride is ready with all {bookings.length} passengers.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Ride notes */}
        {ride.notes && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Your Notes</p>
            <p className="text-[13px] text-gray-700 leading-relaxed">{ride.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}