"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Car, MapPin, Search, Shield, Star, Users, DollarSign,
  Calendar, ArrowRight, Phone, Clock, TrendingDown, CheckCircle, Zap,
} from "lucide-react";

// ─── Static Data ──────────────────────────────────────────────────────────────

const ROUTES = [
  { tag: "Most Popular", to: "DHA Phase 5",     seats: 14, price: "350" },
  { tag: "High Demand",  to: "Clifton",          seats: 9,  price: "400" },
  { tag: "New Route",    to: "Gulshan-e-Iqbal",  seats: 7,  price: "420" },
  { tag: null,           to: "Shahrah-e-Faisal", seats: 6,  price: "380" },
];

const STEPS = [
  { n: "01", icon: Search,      title: "Route dhundho",    desc: "Destination daalo — available seats instantly nazar aayengi." },
  { n: "02", icon: CheckCircle, title: "Driver chunno",    desc: "Verified profiles aur ratings dekho, seat confirm karo."      },
  { n: "03", icon: Users,       title: "Saath safar karo", desc: "Cost share karo. Monthly bill 60% tak kam ho jaata hai."      },
];

const SAFETY = [
  { icon: Shield, title: "CNIC Verification",  desc: "Manual review before first ride"        },
  { icon: Phone,  title: "Phone Verified",      desc: "Real number, real identity"             },
  { icon: Star,   title: "Two-Way Ratings",     desc: "Low scores get suspended automatically" },
  { icon: MapPin, title: "Live Trip Tracking",  desc: "Share link with family anytime"         },
];

const REVIEWS = [
  { text: "Pehle Rs 12,000 mahine mein kharch hote the. Ab 3,500 mein kaam chal jaata hai. Zindagi badal di.", name: "Ahmed Raza",  role: "Software Engineer · DHA Phase 5", saving: "Rs 8,500/mo", color: "#6366F1", initial: "A" },
  { text: "Verified drivers aur live tracking ne mujhe itna safe feel karaya ke meri family fikr nahi karti.",  name: "Sara Khan",   role: "Teacher · Clifton",               saving: "Rs 6,500/mo", color: "#EC4899", initial: "S" },
  { text: "WhatsApp pe dhundna band. Ab Sunday raat ko poori week ki rides book ho jaati hain. Kamaal hai.",    name: "Bilal Mirza", role: "Finance Manager · PECHS",          saving: "Rs 7,200/mo", color: "#0E7C66", initial: "B" },
];

const FEATURES = [
  { icon: Shield,       title: "Verified community", desc: "Har driver CNIC-verified. Stranger nahi — apne mohalle ke log." },
  { icon: DollarSign,   title: "Fixed, fair fares",  desc: "Koi surge nahi, koi negotiate nahi. Price hamesha same."        },
  { icon: Calendar,     title: "Weekly booking",     desc: "Sunday ko puri week book karo. Subah tension khatam."           },
  { icon: MapPin,       title: "Live tracking",      desc: "Ghar wale dekh sakte hain aap kahan ho, real time mein."        },
  { icon: Users,        title: "Real community",     desc: "Roz ke saathiyon ke saath safar. Akela commute khatam."         },
  { icon: TrendingDown, title: "Zero commission",    desc: "Driver poora paisa rakhta hai. Isliye service bhi achi hai."   },
];

const STATS = [
  { num: 2400, suffix: "+",  label: "Active commuters",   prefix: ""     },
  { num: 300,  suffix: "+",  label: "Daily rides",        prefix: ""     },
  { num: 4.9,  suffix: "★", label: "Average rating",     prefix: ""     },
  { num: 4.2,  suffix: "M+", label: "Saved this year",   prefix: "Rs "  },
];

const FROM_OPTIONS = ["Bahria Town Karachi","North Nazimabad","Gulshan-e-Iqbal","Gulistan-e-Johar","Surjani Town","Orangi Town","Korangi","Landhi","Malir","Saddar","PECHS","DHA Phase 5","Clifton"];
const TO_OPTIONS   = ["DHA Phase 5","Clifton","Gulshan-e-Iqbal","Shahrah-e-Faisal","PECHS","I.I. Chundrigar Road","Tariq Road","Saddar","North Nazimabad","Bahria Town Karachi","Korangi","Landhi"];
const TIME_OPTIONS = ["6:00 AM","6:30 AM","7:00 AM","7:15 AM","7:30 AM","7:45 AM","8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","12:00 PM","5:00 PM","5:30 PM","6:00 PM"];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCounter(target: number, duration = 1600, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    const dec = target % 1 !== 0;
    let frame = 0; const total = 60;
    const id = setInterval(() => {
      frame++;
      const t = 1 - Math.pow(1 - frame / total, 4);
      setVal(parseFloat((t * target).toFixed(dec ? 1 : 0)));
      if (frame >= total) clearInterval(id);
    }, duration / total);
    return () => clearInterval(id);
  }, [start, target, duration]);
  return val;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ s, go }: { s: typeof STATS[0]; go: boolean }) {
  const v = useCounter(s.num, 1600, go);
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <div className="text-[42px] md:text-[52px] font-black leading-none tracking-tight tabular-nums" style={{ color: "#15171A" }}>
        {s.prefix}{s.num % 1 !== 0 ? v.toFixed(1) : v}{s.suffix}
      </div>
      <div className="text-[11px] font-bold mt-2 uppercase tracking-[0.15em]" style={{ color: "#9B9690" }}>{s.label}</div>
    </div>
  );
}

// Light "fare meter" route visual — the signature element
function RouteMeter() {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef  = useRef<SVGCircleElement>(null);
  const [ready, setReady] = useState(false);
  const [fare, setFare] = useState(0);

  useEffect(() => {
    const p = pathRef.current; if (!p) return;
    const len = p.getTotalLength();
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
    const t = setTimeout(() => {
      p.style.transition = "stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)";
      p.style.strokeDashoffset = "0";
      setTimeout(() => setReady(true), 2000);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let f = 0;
    const id = setInterval(() => {
      f += 14;
      if (f >= 350) { f = 350; clearInterval(id); }
      setFare(f);
    }, 40);
    const path = pathRef.current; const dot = dotRef.current;
    if (path && dot) {
      const len = path.getTotalLength();
      let prog = 0; let raf: number;
      const tick = () => {
        prog = (prog + 0.004) % 1;
        const pt = path.getPointAtLength(prog * len);
        dot.setAttribute("cx", String(pt.x)); dot.setAttribute("cy", String(pt.y));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => { clearInterval(id); cancelAnimationFrame(raf); };
    }
    return () => clearInterval(id);
  }, [ready]);

  const D = "M 44 248 C 80 220, 120 200, 160 175 C 200 150, 230 132, 265 110 C 295 90, 330 70, 368 48";

  return (
    <svg viewBox="0 0 420 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {[0,1,2,3].map(i => <line key={`h${i}`} x1="0" y1={i*100} x2="420" y2={i*100} stroke="rgba(20,20,20,0.04)" strokeWidth="1"/>)}
      {[0,1,2,3,4].map(i => <line key={`v${i}`} x1={i*105} y1="0" x2={i*105} y2="300" stroke="rgba(20,20,20,0.04)" strokeWidth="1"/>)}

      <path d={D} fill="none" stroke="#FF5630" strokeWidth="10" strokeLinecap="round" opacity="0.10"/>
      <path ref={pathRef} d={D} fill="none" stroke="#FF5630" strokeWidth="2" strokeLinecap="round"/>

      <circle cx="44" cy="248" r="9" fill="#FF5630" opacity="0.14"/>
      <circle cx="44" cy="248" r="5" fill="#FF5630"/>
      <text x="58" y="252" fill="#5B5651" fontSize="10" fontWeight="800" fontFamily="Inter, sans-serif">Bahria Town</text>

      <circle cx="368" cy="48" r="9" fill="#0E7C66" opacity="0.14"/>
      <circle cx="368" cy="48" r="5" fill="#0E7C66"/>
      <text x="305" y="42" fill="#5B5651" fontSize="10" fontWeight="800" fontFamily="Inter, sans-serif">DHA Phase 5</text>

      <circle ref={dotRef} cx="44" cy="248" r="5" fill="#15171A"/>

      {ready && (
        <g>
          <rect x="148" y="104" width="112" height="32" rx="16" fill="#15171A"/>
          <text x="204" y="125" fill="#FFC857" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="Inter, sans-serif">Rs {fare}</text>
        </g>
      )}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [from, setFrom] = useState("Bahria Town Karachi");
  const [to,   setTo]   = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [rdy,  setRdy]  = useState(false);

  const words = ["smart.", "safe.", "sasti.", "aasaan."];
  const [wIdx, setWIdx] = useState(0);
  const [show, setShow] = useState(true);

  const statsRef   = useInView(0.2);
  const routesRef  = useInView(0.1);
  const stepsRef   = useInView(0.1);
  const safetyRef  = useInView(0.1);
  const reviewsRef = useInView(0.1);
  const featRef    = useInView(0.1);
  const ctaRef     = useInView(0.2);

  useEffect(() => { setRdy(true); }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => { setWIdx(i => (i + 1) % words.length); setShow(true); }, 350);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const go = useCallback(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to)   p.set("to",   to);
    if (date) p.set("date", date);
    if (time) p.set("time", time);
    router.push(`/find-ride?${p.toString()}`);
  }, [from, to, date, time, router]);

  return (
    <main className="min-h-screen antialiased overflow-x-hidden" style={{ background: "#FAF8F4", color: "#15171A" }}>

      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }
        h1, h2, .display { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #FAF8F4; }
        ::-webkit-scrollbar-thumb { background: #E4DFD6; border-radius: 2px; }

        .dot-bg {
          background-image: radial-gradient(rgba(20,20,20,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .btn-coral {
          background: #FF5630;
          box-shadow: 0 6px 0 0 #C73A1D;
          transition: transform 0.12s, box-shadow 0.12s;
        }
        .btn-coral:hover { transform: translateY(-2px); box-shadow: 0 8px 0 0 #C73A1D; }
        .btn-coral:active { transform: translateY(3px); box-shadow: 0 2px 0 0 #C73A1D; }

        .btn-ghost {
          border: 2px solid #15171A;
          background: transparent;
          transition: background 0.15s, color 0.15s, transform 0.12s;
        }
        .btn-ghost:hover { background: #15171A; color: #FAF8F4; transform: translateY(-2px); }

        .card {
          background: #FFFFFF;
          border: 1.5px solid #EAE4D9;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
        }
        .card:hover {
          border-color: #FF5630;
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(20,20,20,0.08);
        }

        .inp {
          background: #FAF8F4;
          border: 1.5px solid #E4DFD6;
          color: #15171A;
          transition: border-color 0.2s, background 0.2s;
          width: 100%;
          outline: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          height: 46px;
          padding: 0 14px 0 36px;
          appearance: none;
          -webkit-appearance: none;
        }
        .inp:focus { border-color: #FF5630; background: #FFF; }
        .inp option { background: #fff; color: #15171A; }
        input[type="date"].inp { color-scheme: light; }

        .inp-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          pointer-events: none; color: #B5AFA4; z-index: 1;
        }
        .inp-wrap { position: relative; }

        .word { display: inline-block; transition: opacity 0.35s ease, transform 0.35s ease; }
        .word.in  { opacity: 1; transform: translateY(0px); }
        .word.out { opacity: 0; transform: translateY(10px); }

        .rv { opacity: 0; transform: translateY(24px); transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1); }
        .rv.in { opacity: 1; transform: translateY(0); }

        .eyebrow { font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #FF5630; }

        .sep { border: none; border-top: 1.5px solid #EAE4D9; margin: 0; }

        .pill {
          display: inline-flex; align-items: center; gap: 7px;
          border: 1.5px solid #15171A;
          background: #FFFFFF;
          border-radius: 99px;
          padding: 6px 14px;
          font-size: 12px; font-weight: 700; color: #15171A;
        }

        @media (prefers-reduced-motion: reduce) {
          .rv, .word, .btn-coral, .btn-ghost, .card { transition: none !important; }
        }
      `}</style>

      <Navbar />

      {/* ══════════════════════════════════ HERO */}
      <section className="relative pt-[72px] min-h-screen flex flex-col dot-bg overflow-hidden">

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div style={{ position:"absolute", top:"-12%", left:"58%", width:"560px", height:"560px", background:"radial-gradient(circle, rgba(255,86,48,0.10) 0%, transparent 65%)", borderRadius:"50%" }}/>
          <div style={{ position:"absolute", bottom:"-6%", left:"-8%", width:"480px", height:"480px", background:"radial-gradient(circle, rgba(14,124,102,0.08) 0%, transparent 65%)", borderRadius:"50%" }}/>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-[1120px] mx-auto w-full px-5 sm:px-8 py-16">
          <div className="grid lg:grid-cols-[1fr_440px] gap-14 xl:gap-20 items-center">

            {/* LEFT */}
            <div>
              <div className={`pill mb-8 transition-all duration-700 ${rdy ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:"#FF5630", display:"inline-block", animation:"ping 1.8s ease infinite" }}/>
                <style>{`@keyframes ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.15)} }`}</style>
                400+ commuters online right now
              </div>

              <h1 style={{ fontSize:"clamp(2.8rem,6vw,4.5rem)", fontWeight:900, lineHeight:0.95, letterSpacing:"-0.02em", marginBottom:"1.5rem", color:"#15171A" }}
                className={`transition-all duration-700 delay-100 ${rdy ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                Karachi ka<br/>commute<br/>
                <span className={`word ${show ? "in" : "out"}`} style={{ color:"#FF5630" }}>{words[wIdx]}</span>
              </h1>

              <p className={`transition-all duration-700 delay-[180ms] ${rdy ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ color:"#5B5651", fontSize:15, lineHeight:1.7, maxWidth:420, marginBottom:"2.5rem" }}>
                Bahria Town se DHA tak, daily commute ab verified, live-tracked aur 60% sasti. Hazaaron log roz CarpoolKHI se safar kar rahe hain.
              </p>

              <div className={`flex flex-wrap gap-3 mb-12 transition-all duration-700 delay-[240ms] ${rdy ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                <Link href="/find-ride" className="btn-coral inline-flex items-center gap-2 px-6 py-3.5 text-white font-black text-[14px] rounded-xl no-underline">
                  <Search size={15}/> Ride Dhundho
                </Link>
                <Link href="/offer-ride" className="btn-ghost inline-flex items-center gap-2 px-6 py-3.5 font-bold text-[14px] rounded-xl no-underline" style={{ color:"#15171A" }}>
                  Ride Offer Karo <ArrowRight size={14}/>
                </Link>
              </div>

              <div className={`flex flex-wrap items-center gap-6 pt-7 transition-all duration-700 delay-[300ms] ${rdy ? "opacity-100" : "opacity-0"}`}
                style={{ borderTop:"1.5px solid #EAE4D9" }}>
                <div className="flex">
                  {[["A","#6366F1"],["S","#EC4899"],["B","#0E7C66"],["F","#FF5630"]].map(([l,c],i) => (
                    <div key={l} style={{ width:32, height:32, borderRadius:"50%", background:c, border:"2.5px solid #FAF8F4", marginRight:-8, zIndex:4-i, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:"#fff" }}>{l}</div>
                  ))}
                </div>
                <div style={{ marginLeft:8 }}>
                  <p style={{ color:"#15171A", fontSize:13, fontWeight:800 }}>2,400+ commuters</p>
                  <p style={{ color:"#9B9690", fontSize:11, marginTop:2 }}>roz CarpoolKHI use karte hain</p>
                </div>
                <div style={{ width:1, height:32, background:"#EAE4D9" }} className="hidden sm:block"/>
                <div className="hidden sm:flex items-center gap-1.5">
                  <Star size={13} style={{ fill:"#FFC857", color:"#FFC857" }}/>
                  <span style={{ fontWeight:900, fontSize:14, color:"#15171A" }}>4.9</span>
                  <span style={{ color:"#9B9690", fontSize:12 }}>avg rating</span>
                </div>
              </div>
            </div>

            {/* RIGHT — Search card */}
            <div className={`transition-all duration-1000 delay-[150ms] ${rdy ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
              <div style={{ background:"#FFFFFF", border:"1.5px solid #EAE4D9", borderRadius:20, overflow:"hidden", boxShadow:"0 24px 60px rgba(20,20,20,0.10)" }}>

                <div style={{ height:170, background:"#FAF8F4", borderBottom:"1.5px solid #EAE4D9", position:"relative", overflow:"hidden" }}>
                  <RouteMeter/>
                  <div style={{ position:"absolute", top:12, right:12, background:"#15171A", borderRadius:8, padding:"4px 10px" }}>
                    <span style={{ color:"#FFC857", fontSize:10, fontWeight:800 }}>LIVE ROUTES</span>
                  </div>
                </div>

                <div style={{ padding:"20px 20px 4px" }}>
                  <p style={{ fontSize:11, fontWeight:800, color:"#B5AFA4", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:16 }}>Find a ride</p>

                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div className="inp-wrap">
                      <MapPin size={13} className="inp-icon" style={{ color:"#FF5630" }}/>
                      <select value={from} onChange={e => setFrom(e.target.value)} className="inp">
                        {FROM_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>

                    <div className="inp-wrap">
                      <Search size={13} className="inp-icon"/>
                      <select value={to} onChange={e => setTo(e.target.value)} className="inp">
                        <option value="">Any destination</option>
                        {TO_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <div className="inp-wrap">
                        <Calendar size={13} className="inp-icon"/>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]} className="inp" style={{ paddingLeft:36, paddingRight:8 }}/>
                      </div>
                      <div className="inp-wrap">
                        <Clock size={13} className="inp-icon"/>
                        <select value={time} onChange={e => setTime(e.target.value)} className="inp">
                          <option value="">Any time</option>
                          {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <button onClick={go} className="btn-coral w-full font-black text-white rounded-xl flex items-center justify-center gap-2"
                      style={{ height:46, fontSize:14, marginTop:2 }}>
                      <Search size={14}/> Rides Dhundho
                    </button>
                  </div>

                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:12 }}>
                    {[{from:"Bahria Town Karachi",to:"DHA Phase 5"},{from:"Bahria Town Karachi",to:"Clifton"},{from:"North Nazimabad",to:"Shahrah-e-Faisal"}].map(r => (
                      <button key={r.to} onClick={() => { setFrom(r.from); setTo(r.to); }}
                        style={{ fontSize:11, fontWeight:700, padding:"5px 10px", borderRadius:8, border:"1.5px solid #EAE4D9", background:"transparent", color:"#9B9690", cursor:"pointer", transition:"all 0.2s" }}
                        onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor="#FF5630"; (e.target as HTMLButtonElement).style.color="#FF5630"; }}
                        onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor="#EAE4D9"; (e.target as HTMLButtonElement).style.color="#9B9690"; }}>
                        → {r.to}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ padding:"14px 20px 18px", borderTop:"1.5px solid #EAE4D9", display:"flex", alignItems:"center", gap:8, marginTop:12 }}>
                  <CheckCircle size={12} style={{ color:"#0E7C66", flexShrink:0 }}/>
                  <p style={{ fontSize:11, color:"#9B9690" }}>
                    Driver ho?{" "}
                    <Link href="/offer-ride" style={{ color:"#FF5630", fontWeight:800, textDecoration:"none" }}>Seat offer karo →</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:6, opacity:0.3 }}>
          <span style={{ fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:"#15171A" }}>scroll</span>
          <div style={{ width:1, height:32, background:"#15171A", overflow:"hidden", position:"relative" }}>
            <div style={{ position:"absolute", width:"100%", background:"#FF5630", animation:"sd 1.6s ease infinite" }}/>
          </div>
          <style>{`@keyframes sd { 0%{top:-50%;height:50%} 100%{top:150%;height:50%} }`}</style>
        </div>
      </section>

      {/* ══════════════════════════════════ STATS */}
      <div ref={statsRef.ref} className="sep">
        <div style={{ maxWidth:1120, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(2,1fr)" }} className="md:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.label} className={`rv ${statsRef.inView ? "in" : ""}`} style={{ transitionDelay:`${i*80}ms`, borderRight: i < 3 ? "1.5px solid #EAE4D9" : "none", borderBottom: i < 2 ? "1.5px solid #EAE4D9" : "none" }}>
              <StatCard s={s} go={statsRef.inView}/>
            </div>
          ))}
        </div>
      </div>
      <div className="sep"/>

      {/* ══════════════════════════════════ ROUTES */}
      <section ref={routesRef.ref} style={{ padding:"96px 0" }}>
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"0 20px" }}>
          <div className={`rv ${routesRef.inView ? "in" : ""}`} style={{ marginBottom:48 }}>
            <p className="eyebrow" style={{ marginBottom:12 }}>Popular Routes</p>
            <h2 style={{ fontSize:"clamp(1.8rem,4vw,2.8rem)", fontWeight:900, letterSpacing:"-0.02em", color:"#15171A" }}>
              Roz ke routes, aaj bhi available.
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:12 }}>
            {ROUTES.map((r, i) => (
              <Link key={r.to} href={`/find-ride?to=${encodeURIComponent(r.to)}`}
                className={`card rv ${routesRef.inView ? "in" : ""}`}
                style={{ borderRadius:18, padding:"24px", textDecoration:"none", color:"#15171A", transitionDelay:`${i*70}ms`, display:"block" }}>
                {r.tag
                  ? <span style={{ display:"inline-block", fontSize:9, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", color:"#FF5630", background:"rgba(255,86,48,0.08)", border:"1.5px solid rgba(255,86,48,0.25)", borderRadius:6, padding:"3px 8px", marginBottom:18 }}>{r.tag}</span>
                  : <div style={{ marginBottom:30 }}/>}
                <p style={{ fontSize:10, color:"#B5AFA4", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Bahria Town →</p>
                <p style={{ fontSize:20, fontWeight:900, marginBottom:4, lineHeight:1.1 }}>{r.to}</p>
                <p style={{ fontSize:11, color:"#9B9690", marginBottom:20 }}>{r.seats} seats available today</p>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:26, fontWeight:900, color:"#0E7C66" }}>Rs {r.price}</span>
                  <div style={{ width:34, height:34, borderRadius:10, background:"#FAF8F4", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.background="#FF5630")}
                    onMouseLeave={e => (e.currentTarget.style.background="#FAF8F4")}>
                    <ArrowRight size={14} style={{ color:"#9B9690" }}/>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="sep"/>

      {/* ══════════════════════════════════ HOW IT WORKS */}
      <section ref={stepsRef.ref} style={{ padding:"96px 0" }}>
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"0 20px" }}>
          <div className={`rv ${stepsRef.inView ? "in" : ""}`} style={{ marginBottom:48, display:"flex", flexDirection:"column", gap:8 }}>
            <p className="eyebrow">How It Works</p>
            <h2 style={{ fontSize:"clamp(1.8rem,4vw,2.8rem)", fontWeight:900, letterSpacing:"-0.02em", color:"#15171A" }}>Teen steps. Bas.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px,1fr))", gap:12 }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className={`card rv ${stepsRef.inView ? "in" : ""}`}
                  style={{ borderRadius:18, padding:"32px", position:"relative", overflow:"hidden", transitionDelay:`${i*90}ms` }}>
                  <span style={{ position:"absolute", top:12, right:16, fontSize:72, fontWeight:900, color:"rgba(20,20,20,0.04)", lineHeight:1, userSelect:"none" }}>{s.n}</span>
                  <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,86,48,0.08)", border:"1.5px solid rgba(255,86,48,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24 }}>
                    <Icon size={19} style={{ color:"#FF5630" }}/>
                  </div>
                  <h3 style={{ fontSize:16, fontWeight:800, marginBottom:8, color:"#15171A" }}>{s.title}</h3>
                  <p style={{ fontSize:13, color:"#9B9690", lineHeight:1.65 }}>{s.desc}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:flex" style={{ position:"absolute", right:-18, top:"50%", transform:"translateY(-50%)", width:36, height:36, borderRadius:"50%", background:"#FAF8F4", border:"1.5px solid #EAE4D9", alignItems:"center", justifyContent:"center", zIndex:10 }}>
                      <ArrowRight size={13} style={{ color:"#B5AFA4" }}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="sep"/>

      {/* ══════════════════════════════════ SAFETY */}
      <section ref={safetyRef.ref} style={{ padding:"96px 0" }}>
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:56, alignItems:"center" }} className="grid-cols-1 lg:grid-cols-2">
            <div className={`rv ${safetyRef.inView ? "in" : ""}`}>
              <p className="eyebrow" style={{ marginBottom:12 }}>Safety First</p>
              <h2 style={{ fontSize:"clamp(1.8rem,4vw,2.8rem)", fontWeight:900, letterSpacing:"-0.02em", marginBottom:16, lineHeight:1.08, color:"#15171A" }}>
                Bharosa sirf<br/>naam ka nahi.
              </h2>
              <p style={{ fontSize:14, color:"#5B5651", lineHeight:1.7, maxWidth:380, marginBottom:32 }}>
                Har driver real verification se guzarta hai. Sirf phone number se kaam nahi chalta yahan.
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {SAFETY.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.title} className={`rv ${safetyRef.inView ? "in" : ""}`}
                      style={{ background:"#FFFFFF", border:"1.5px solid #EAE4D9", borderRadius:14, padding:"16px", display:"flex", alignItems:"flex-start", gap:12, transitionDelay:`${i*80}ms` }}>
                      <div style={{ width:32, height:32, borderRadius:9, background:"rgba(14,124,102,0.08)", border:"1.5px solid rgba(14,124,102,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Icon size={13} style={{ color:"#0E7C66" }}/>
                      </div>
                      <div>
                        <p style={{ fontSize:12, fontWeight:800, color:"#15171A" }}>{c.title}</p>
                        <p style={{ fontSize:11, color:"#9B9690", marginTop:3 }}>{c.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`rv ${safetyRef.inView ? "in" : ""}`} style={{ transitionDelay:"150ms" }}>
              <div style={{ background:"#FFFFFF", border:"1.5px solid #EAE4D9", borderRadius:24, padding:"40px", textAlign:"center" }}>
                <div style={{ fontSize:120, fontWeight:900, color:"#15171A", lineHeight:1, letterSpacing:"-0.04em" }}>4.9</div>
                <div style={{ fontSize:22, color:"#FFC857", letterSpacing:"0.2em", margin:"12px 0" }}>★★★★★</div>
                <p style={{ fontSize:12, color:"#9B9690", marginBottom:28 }}>Average from 12,000+ completed rides</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[{l:"5",p:87},{l:"4",p:9},{l:"3",p:3},{l:"2",p:1}].map(b => (
                    <div key={b.l} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:10, fontWeight:800, color:"#9B9690", width:10, textAlign:"right" }}>{b.l}</span>
                      <div style={{ flex:1, height:5, background:"#F0ECE3", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", background:"#FF5630", borderRadius:99, width: safetyRef.inView ? `${b.p}%` : "0%", transition:"width 1.2s cubic-bezier(0.16,1,0.3,1)", transitionDelay:"400ms" }}/>
                      </div>
                      <span style={{ fontSize:10, color:"#9B9690", width:28 }}>{b.p}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sep"/>

      {/* ══════════════════════════════════ REVIEWS */}
      <section ref={reviewsRef.ref} style={{ padding:"96px 0" }}>
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"0 20px" }}>
          <div className={`rv ${reviewsRef.inView ? "in" : ""}`} style={{ marginBottom:48 }}>
            <p className="eyebrow" style={{ marginBottom:12 }}>Reviews</p>
            <h2 style={{ fontSize:"clamp(1.8rem,4vw,2.8rem)", fontWeight:900, letterSpacing:"-0.02em", color:"#15171A" }}>Real log, real bachat.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))", gap:12 }}>
            {REVIEWS.map((r, i) => (
              <div key={r.name} className={`card rv ${reviewsRef.inView ? "in" : ""}`}
                style={{ borderRadius:18, padding:"28px", display:"flex", flexDirection:"column", transitionDelay:`${i*90}ms` }}>
                <div style={{ color:"#FFC857", fontSize:13, letterSpacing:"0.15em", marginBottom:16 }}>★★★★★</div>
                <p style={{ color:"#5B5651", fontSize:13, lineHeight:1.7, flex:1, marginBottom:24 }}>"{r.text}"</p>
                <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:20, borderTop:"1.5px solid #EAE4D9" }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:r.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:"#fff", flexShrink:0 }}>{r.initial}</div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:800, color:"#15171A" }}>{r.name}</p>
                    <p style={{ fontSize:11, color:"#9B9690", marginTop:2 }}>{r.role}</p>
                  </div>
                </div>
                <div style={{ marginTop:16, display:"inline-flex", alignItems:"center", gap:6, background:"rgba(14,124,102,0.08)", border:"1.5px solid rgba(14,124,102,0.2)", borderRadius:8, padding:"6px 12px", width:"fit-content" }}>
                  <Zap size={11} style={{ color:"#0E7C66" }}/>
                  <span style={{ fontSize:11, fontWeight:800, color:"#0E7C66" }}>{r.saving} saved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="sep"/>

      {/* ══════════════════════════════════ FEATURES */}
      <section ref={featRef.ref} style={{ padding:"96px 0" }}>
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"0 20px" }}>
          <div className={`rv ${featRef.inView ? "in" : ""}`} style={{ marginBottom:48 }}>
            <p className="eyebrow" style={{ marginBottom:12 }}>Why CarpoolKHI</p>
            <h2 style={{ fontSize:"clamp(1.8rem,4vw,2.8rem)", fontWeight:900, letterSpacing:"-0.02em", lineHeight:1.08, color:"#15171A" }}>
              Sirf ride nahi,<br/>ek smart commute.
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))", gap:10 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className={`card rv ${featRef.inView ? "in" : ""}`}
                  style={{ borderRadius:16, padding:"28px", transitionDelay:`${(i%3)*90}ms` }}
                  onMouseEnter={e => { const ic = e.currentTarget.querySelector(".feat-icon") as HTMLElement; if(ic) { ic.style.background="rgba(255,86,48,0.1)"; ic.style.borderColor="rgba(255,86,48,0.3)"; } }}
                  onMouseLeave={e => { const ic = e.currentTarget.querySelector(".feat-icon") as HTMLElement; if(ic) { ic.style.background="#FAF8F4"; ic.style.borderColor="#EAE4D9"; } }}>
                  <div className="feat-icon" style={{ width:42, height:42, borderRadius:11, background:"#FAF8F4", border:"1.5px solid #EAE4D9", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20, transition:"all 0.3s" }}>
                    <Icon size={17} style={{ color:"#5B5651" }}/>
                  </div>
                  <h3 style={{ fontSize:14, fontWeight:800, color:"#15171A", marginBottom:8 }}>{f.title}</h3>
                  <p style={{ fontSize:12, color:"#9B9690", lineHeight:1.65 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="sep"/>

      {/* ══════════════════════════════════ CTA */}
      <section ref={ctaRef.ref} style={{ padding:"96px 0" }}>
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"0 20px" }}>
          <div className={`rv ${ctaRef.inView ? "in" : ""}`}>
            <div style={{ position:"relative", borderRadius:24, overflow:"hidden", border:"1.5px solid #EAE4D9", background:"#15171A" }}
              className="dot-bg">
              <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:500, height:200, background:"radial-gradient(ellipse, rgba(255,86,48,0.18) 0%, transparent 65%)", pointerEvents:"none" }}/>
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:"linear-gradient(90deg, transparent, #FF5630, transparent)" }}/>

              <div style={{ position:"relative", zIndex:1, padding:"60px 40px", display:"grid", gap:40, alignItems:"center" }} className="md:grid-cols-2">
                <div>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(255,86,48,0.12)", border:"1.5px solid rgba(255,86,48,0.3)", borderRadius:99, padding:"5px 14px", marginBottom:20 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"#FF5630", display:"inline-block", animation:"ping 1.8s ease infinite" }}/>
                    <span style={{ fontSize:11, fontWeight:800, color:"#FF8A6E" }}>Free to join — no credit card</span>
                  </div>
                  <h2 style={{ fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900, letterSpacing:"-0.02em", lineHeight:1.08, marginBottom:14, color:"#FFFFFF" }}>
                    Aaj hi smart<br/><span style={{ color:"#FF5630" }}>commute</span> shuru karo.
                  </h2>
                  <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.7, maxWidth:380 }}>
                    Hazaaron commuters already paise bcha rahe hain. Pehli ride ek click door hai.
                  </p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <Link href="/signup" className="btn-coral inline-flex items-center justify-center gap-2 font-black text-white rounded-xl no-underline"
                    style={{ height:54, fontSize:15 }}>
                    Get Started Free <ArrowRight size={16}/>
                  </Link>
                  <Link href="/offer-ride" className="inline-flex items-center justify-center font-bold rounded-xl no-underline"
                    style={{ height:54, fontSize:14, border:"1.5px solid rgba(255,255,255,0.25)", color:"#fff" }}>
                    Offer a Ride
                  </Link>
                  <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:4 }}>No hidden fees · Cancel anytime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ FOOTER */}
      <footer style={{ borderTop:"1.5px solid #EAE4D9", padding:"36px 20px" }}>
        <div style={{ maxWidth:1120, margin:"0 auto", display:"flex", flexDirection:"column", gap:16, alignItems:"center" }} className="md:flex-row md:justify-between">
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
            <div style={{ width:30, height:30, borderRadius:9, background:"#15171A", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Car size={14} style={{ color:"#FF5630" }}/>
            </div>
            <span style={{ color:"#15171A", fontWeight:900, fontSize:15 }}>carpoolkhi<span style={{ color:"#FF5630" }}>.</span></span>
          </Link>
          <p style={{ color:"#9B9690", fontSize:11 }}>© 2026 CarpoolKHI · Karachi ka apna ride sharing</p>
          <div style={{ display:"flex", gap:20 }}>
            {["Privacy","Terms","Safety","Help"].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                style={{ color:"#9B9690", fontSize:11, textDecoration:"none", transition:"color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color="#FF5630")}
                onMouseLeave={e => (e.currentTarget.style.color="#9B9690")}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>

    </main>
  );
}
