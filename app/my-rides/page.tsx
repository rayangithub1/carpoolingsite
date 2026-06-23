"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import {
  Car, MapPin, Clock, Users, DollarSign, ArrowRight,
  PlusCircle, AlertCircle, Loader2, CheckCircle, XCircle,
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
  status: "active" | "completed" | "cancelled";
  created_at: string;
  recurring: boolean;
  recurring_days: string[];
}

const STATUS_CONFIG = {
  active:    { label: "Active",    bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  icon: CheckCircle },
  completed: { label: "Completed", bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-200",   icon: CheckCircle },
  cancelled: { label: "Cancelled", bg: "bg-red-50",    text: "text-red-600",    border: "border-red-200",    icon: XCircle },
};

export default function MyRidesPage() {
  const router = useRouter();
  const [rides, setRides]       = useState<Ride[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState<"all" | "active" | "completed" | "cancelled">("all");

  useEffect(() => {
  const fetchRides = async () => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) { router.push("/login"); return; }

      const user = JSON.parse(stored);
      if (!user?.id) { router.push("/login"); return; }

      console.log("user.id:", user.id);

      const { data, error: dbErr } = await supabase
        .from("rides")
        .select("*")
        .eq("driver_id", user.id)
        .order("created_at", { ascending: false });

      if (dbErr) setError(dbErr.message);
      else setRides((data as Ride[]) ?? []);
    } catch {
      setError("Failed to load rides.");
    } finally {
      setLoading(false);
    }
  };

  fetchRides();
}, [router]);

  const filtered = filter === "all" ? rides : rides.filter((r) => r.status === filter);

  const stats = {
    total:     rides.length,
    active:    rides.filter((r) => r.status === "active").length,
    completed: rides.filter((r) => r.status === "completed").length,
    earned:    rides.reduce((acc, r) => acc + (r.fare * (r.seats || 0)), 0),
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f9f9f8] text-black antialiased">
      <Navbar />

      {/* ── HERO ── */}
      <div className="pt-[76px] bg-black">
        <div className="max-w-[1100px] mx-auto px-6 py-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Driver</p>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="text-3xl font-black text-white tracking-tight">My Rides</h1>
            <Link href="/offer-ride"
              className="flex items-center gap-2 px-5 h-10 bg-green-500 hover:bg-green-600 text-white text-[13px] font-black rounded-xl transition-colors">
              <PlusCircle size={14} /> Offer New Ride
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total Rides",  value: stats.total },
              { label: "Active",       value: stats.active },
              { label: "Completed",    value: stats.completed },
              { label: "Est. Earned",  value: `Rs ${stats.earned.toLocaleString()}` },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <p className="text-[22px] font-black text-white">{s.value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 py-6 space-y-4">

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "active", "completed", "cancelled"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 h-9 rounded-xl text-[13px] font-black capitalize transition-colors ${
                filter === f ? "bg-black text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-black"
              }`}>
              {f === "all" ? `All (${rides.length})` : f}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={14} className="text-red-500" />
            <p className="text-[13px] text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!error && filtered.length === 0 && (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-16 text-center">
            <Car size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="font-black text-[16px] mb-1">No rides yet</p>
            <p className="text-[13px] text-gray-400 mb-5">
              {filter === "all" ? "You haven't offered any rides yet." : `No ${filter} rides found.`}
            </p>
            <Link href="/offer-ride"
              className="inline-flex items-center gap-2 px-5 h-10 bg-black text-white text-[13px] font-black rounded-xl hover:bg-gray-900 transition-colors">
              <PlusCircle size={14} /> Offer a Ride
            </Link>
          </div>
        )}

        {/* Ride cards */}
        <div className="grid gap-3">
          {filtered.map((ride) => {
            const cfg = STATUS_CONFIG[ride.status] ?? STATUS_CONFIG.active;
            const Icon = cfg.icon;
            return (
              <Link key={ride.id} href={`/my-rides/${ride.id}`}
                className="block bg-white border border-gray-100 hover:border-black rounded-2xl overflow-hidden transition-all group">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">

                    {/* Route */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                        <Car size={15} className="text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[16px] font-black">{ride.from_location}</span>
                          <ArrowRight size={13} className="text-gray-400" />
                          <span className="text-[16px] font-black text-green-600">{ride.to_location}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Clock size={10} /> {ride.time}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <MapPin size={10} /> {ride.date}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Users size={10} /> {ride.seats} seats
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <DollarSign size={10} /> Rs {ride.fare}/seat
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                      <ArrowRight size={14} className="text-gray-300 group-hover:text-black transition-colors" />
                    </div>

                  </div>

                  {/* Car info */}
                  {ride.car && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
                      <span className="text-[11px] text-gray-400 font-medium">
                        {ride.car}{ride.car_color ? ` · ${ride.car_color}` : ""}{ride.plate_no ? ` · ${ride.plate_no}` : ""}
                      </span>
                      {ride.recurring && ride.recurring_days?.length > 0 && (
                        <div className="flex gap-1">
                          {ride.recurring_days.map((d) => (
                            <span key={d} className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded">{d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}