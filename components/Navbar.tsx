"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { usePathname, useRouter } from "next/navigation";
import {
  Car, ChevronDown, LogOut, User, FileText,
  Navigation, BookOpen, PlusCircle, Bell, X,
  CheckCircle, Calendar,
} from "lucide-react";

interface StoredUser {
  name: string;
  email: string;
  id: string;
  cnicVerified: boolean;
  faceVerified: boolean;
  faceMatched: boolean;
  verificationStatus: "unverified" | "pending" | "approved" | "rejected";
}

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  ride_id: string | null;
  created_at: string;
}

// Pages that have a dark background
const DARK_PAGES = ["/", "/find-ride", "/offer-ride", "/community"];

const NAV_LINKS = [
  { href: "/find-ride", label: "Find Ride" },
  { href: "/community", label: "Community" },
  { href: "/terms",     label: "Terms"     },
];

function VerificationBadge({ status }: { status: StoredUser["verificationStatus"] }) {
  const map = {
    approved:   { label: "Verified",     cls: "bg-green-500/15 text-green-400 border border-green-500/25"  },
    pending:    { label: "Under Review", cls: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25" },
    rejected:   { label: "Rejected",     cls: "bg-red-500/15 text-red-400 border border-red-500/25"         },
    unverified: { label: "Not Verified", cls: "bg-white/8 text-gray-400 border border-white/10"             },
  };
  const { label, cls } = map[status] ?? map.unverified;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}

function timeAgo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const dropRef  = useRef<HTMLDivElement>(null);
  const bellRef  = useRef<HTMLDivElement>(null);

  const [user,          setUser]          = useState<StoredUser | null>(null);
  const [dropOpen,      setDropOpen]      = useState(false);
  const [bellOpen,      setBellOpen]      = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scrolled,      setScrolled]      = useState(false);

  const unread  = notifications.filter(n => !n.read).length;
  const isDark  = DARK_PAGES.some(p => pathname === p || pathname.startsWith(p + "?"));

  // ─── Scroll detection (for transparency effect) ───────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const readLocal = (): StoredUser | null => {
    try { const r = localStorage.getItem("user"); return r ? JSON.parse(r) : null; }
    catch { return null; }
  };

  // ─── Notifications ────────────────────────────────────────────────────────
  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from("notifications").select("*")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
    if (data) setNotifications(data as Notification[]);
  };

  const markAllRead = async (userId: string) => {
    await supabase.from("notifications").update({ read: true })
      .eq("user_id", userId).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // ─── Boot ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = readLocal();
    setUser(stored);
    const sync = () => setUser(readLocal());
    window.addEventListener("storage",      sync);
    window.addEventListener("movento:auth", sync);

    if (stored?.id) {
      fetchNotifications(stored.id);

      const channel = supabase.channel("notifications")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${stored.id}` },
          payload => setNotifications(prev => [payload.new as Notification, ...prev]))
        .subscribe();

      const fetchStatus = async (userId: string) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const { data, error } = await supabase.from("profiles")
            .select("verification_status").eq("id", userId).single();
          if (!error && data?.verification_status) {
            const latest = readLocal();
            if (latest && latest.verificationStatus !== data.verification_status) {
              const updated = { ...latest, verificationStatus: data.verification_status as StoredUser["verificationStatus"] };
              localStorage.setItem("user", JSON.stringify(updated));
              setUser(updated);
            }
          }
        } catch {}
      };

      fetchStatus(stored.id);
      const interval = setInterval(() => {
        const cur = readLocal();
        if (!cur?.id || cur.verificationStatus === "approved") { clearInterval(interval); return; }
        fetchStatus(cur.id);
      }, 5000);

      return () => {
        window.removeEventListener("storage",      sync);
        window.removeEventListener("movento:auth", sync);
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }

    return () => {
      window.removeEventListener("storage",      sync);
      window.removeEventListener("movento:auth", sync);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Outside click ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setUser(null); setDropOpen(false);
    localStorage.removeItem("user"); localStorage.removeItem("token");
    await supabase.auth.signOut();
    window.dispatchEvent(new Event("movento:auth"));
    router.push("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  // ─── Theme tokens ─────────────────────────────────────────────────────────
  // On dark pages: dark pill. On light pages: white pill (original style).
  const dark = isDark;

  const pill = dark
    ? scrolled
      ? "bg-[#0e0e12]/90 border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
      : "bg-[#0e0e12]/60 border-white/8 shadow-none"
    : "bg-white/95 border-black/10 shadow-[0_2px_20px_rgba(0,0,0,0.08)]";

  const logo      = dark ? "text-white"              : "text-black";
  const logoBox   = dark ? "bg-white/10"             : "bg-black";
  const linkBase  = dark ? "text-gray-400 hover:text-white hover:bg-white/8"  : "text-gray-500 hover:text-black hover:bg-gray-100";
  const linkActive= dark ? "bg-white/12 text-white"  : "bg-black text-white";
  const iconBtn   = dark ? "text-gray-400 hover:text-white hover:bg-white/8"  : "text-gray-600 hover:bg-gray-100";
  const userBtn   = dark ? "hover:bg-white/8"        : "hover:bg-gray-100";
  const userName  = dark ? "text-white"              : "text-gray-800";
  const chevron   = dark ? "text-gray-500"           : "text-gray-400";
  const loginBtn  = dark
    ? "border-white/12 text-gray-300 hover:border-white/30 hover:text-white"
    : "border-gray-200 text-gray-700 hover:border-black hover:text-black";
  const signupBtn = dark
    ? "bg-green-500 text-black hover:bg-green-400"
    : "bg-black text-white hover:bg-gray-800";

  // Dropdown is always light (readability)
  const dropBg    = "bg-[#111] border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.7)]";
  const dropHead  = "border-white/8";
  const dropItem  = "text-gray-300 hover:bg-white/6 hover:text-white";
  const dropSep   = "border-white/8";
  const notifBg   = "bg-[#111] border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.7)]";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3 pointer-events-none">
      <div className="max-w-[1120px] mx-auto pointer-events-auto">
        <div className={`backdrop-blur-xl border rounded-2xl h-14 flex items-center justify-between px-4 transition-all duration-300 ${pill}`}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 no-underline">
            <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors ${logoBox}`}>
              <Car size={14} className="text-green-400" />
            </div>
            <span className={`font-black text-[16px] tracking-tight transition-colors ${logo}`}>
              movento<span className="text-green-400">.</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href}
                className={`text-[13px] font-semibold px-3 py-1.5 rounded-[9px] transition-all no-underline ${
                  pathname === link.href ? linkActive : linkBase
                }`}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {user ? (
              <>
                {/* Bell */}
                <div className="relative" ref={bellRef}>
                  <button
                    onClick={() => {
                      setBellOpen(v => !v); setDropOpen(false);
                      if (!bellOpen && unread > 0) markAllRead(user.id);
                    }}
                    className={`relative w-9 h-9 flex items-center justify-center rounded-[9px] transition-colors ${iconBtn}`}
                  >
                    <Bell size={16}/>
                    {unread > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </button>

                  {bellOpen && (
                    <div className={`absolute right-0 top-full mt-2 w-80 border rounded-2xl overflow-hidden ${notifBg}`}>
                      <div className={`px-4 py-3 border-b flex items-center justify-between ${dropHead}`}>
                        <p className="text-[13px] font-black text-white">Notifications</p>
                        <button onClick={() => setBellOpen(false)}>
                          <X size={14} className="text-gray-500 hover:text-white transition-colors"/>
                        </button>
                      </div>
                      <div className="max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center py-10 text-center px-4">
                            <Bell size={22} className="text-gray-700 mb-2"/>
                            <p className="text-[13px] font-bold text-gray-500">No notifications yet</p>
                            <p className="text-[11px] text-gray-600 mt-1">Booking updates will appear here</p>
                          </div>
                        ) : notifications.map(n => (
                          <div key={n.id}
                            className={`flex items-start gap-3 px-4 py-3.5 border-b last:border-0 transition-colors ${dropHead} ${n.read ? "" : "bg-green-500/5"}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              n.type === "booking" ? "bg-green-500/12" : n.type === "cancellation" ? "bg-red-500/12" : "bg-white/6"
                            }`}>
                              {n.type === "booking"
                                ? <CheckCircle size={13} className="text-green-400"/>
                                : <Calendar    size={13} className="text-gray-500"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-gray-300 leading-relaxed">{n.message}</p>
                              <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 mt-1.5"/>}
                          </div>
                        ))}
                      </div>
                      {notifications.length > 0 && (
                        <div className={`px-4 py-2.5 border-t ${dropHead}`}>
                          <button onClick={() => markAllRead(user.id)}
                            className="text-[11px] font-bold text-gray-600 hover:text-white transition-colors">
                            Mark all as read
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User dropdown */}
                <div className="relative" ref={dropRef}>
                  <button onClick={() => { setDropOpen(v => !v); setBellOpen(false); }}
                    className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-[9px] transition-colors ${userBtn}`}>
                    <div className="w-8 h-8 bg-green-500/15 border border-green-500/25 rounded-[8px] flex items-center justify-center">
                      <span className="text-[11px] font-black text-green-400">{initials}</span>
                    </div>
                    <span className={`hidden sm:block text-[13px] font-bold max-w-[100px] truncate transition-colors ${userName}`}>
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown size={12} className={`transition-transform ${dropOpen ? "rotate-180" : ""} ${chevron}`}/>
                  </button>

                  {dropOpen && (
                    <div className={`absolute right-0 top-full mt-2 w-64 border rounded-2xl overflow-hidden ${dropBg}`}>
                      <div className={`px-4 py-3 border-b ${dropHead}`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[14px] font-black text-white truncate">{user.name}</p>
                          <VerificationBadge status={user.verificationStatus}/>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        {[
                          { href: "/offer-ride", icon: PlusCircle, label: "Offer Ride"   },
                          { href: "/my-rides",   icon: Navigation, label: "My Rides"     },
                          { href: "/bookings",   icon: BookOpen,   label: "My Bookings"  },
                          { href: "/profile",    icon: User,       label: "Profile"      },
                          ...(user.verificationStatus !== "approved"
                            ? [{ href: "/verify", icon: FileText, label: "Complete Verification" }]
                            : []),
                        ].map(({ href, icon: Icon, label }) => (
                          <Link key={href} href={href} onClick={() => setDropOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold transition-colors no-underline ${dropItem}`}>
                            <Icon size={13} className="text-gray-600 flex-shrink-0"/>
                            {label}
                          </Link>
                        ))}
                      </div>
                      <div className={`border-t py-1 ${dropSep}`}>
                        <button onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-semibold text-red-400 hover:bg-red-500/8 transition-colors">
                          <LogOut size={13} className="flex-shrink-0"/>
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login"
                  className={`hidden sm:block px-3.5 py-1.5 text-[13px] font-semibold border rounded-[9px] transition-all no-underline ${loginBtn}`}>
                  Login
                </Link>
                <Link href="/signup"
                  className={`px-4 py-1.5 text-[13px] font-black rounded-[9px] transition-all no-underline ${signupBtn}`}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
