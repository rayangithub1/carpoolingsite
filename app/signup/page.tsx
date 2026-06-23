"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Users, CheckCircle, ArrowRight, Phone, Eye, EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label, optional, error, children,
}: {
  label: string; optional?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-bold mb-1.5 text-black">
        {label}
        {optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
      </label>
      {children}
      {error && (
        <p className="text-[12px] text-red-500 font-medium mt-1.5">{error}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name:     "",
    phone:    "",
    email:    "",
    password: "",
  });
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPass,    setShowPass]    = useState(false);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
    setServerError("");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())
      e.name = "Enter your full name";
    if (!form.phone.trim())
      e.phone = "Enter your phone number";
    else if (!/^03\d{9}$/.test(form.phone.replace(/[\s-]/g, "")))
      e.phone = "Enter a valid Pakistani number (03XXXXXXXXX)";
    if (!form.email.trim())
      e.email = "Enter your email address";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.password)
      e.password = "Enter a password";
    else if (form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        options:  {
          data: {
            full_name: form.name.trim(),
            phone:     form.phone.trim(),
          },
        },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Signup failed. Please try again.");

      // 2. Insert into profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id:        authData.user.id,
          full_name: form.name.trim(),
          phone:     form.phone.trim(),
          email:     form.email.trim().toLowerCase(),
        });

      // Profile insert may fail if row already exists — that's fine
      if (profileError && profileError.code !== "23505") {
        console.warn("Profile insert warning:", profileError.message);
      }

      // 3. Save to localStorage for navbar
      localStorage.setItem("user", JSON.stringify({
        id:    authData.user.id,
        name:  form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
      }));

      router.push("/dashboard");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";

      // Make common Supabase errors human-friendly
      if (msg.toLowerCase().includes("already registered") ||
          msg.toLowerCase().includes("user already exists")) {
        setServerError("An account with this email already exists. Try logging in.");
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">

      {/* Subtle background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-black/5 rounded-full blur-3xl" />
      </div>

      {/* Top-right login link */}
      <div className="absolute top-6 right-6 z-20">
        <Link href="/login"
          className="px-5 py-2.5 bg-white border border-gray-200 hover:border-black rounded-xl text-[13px] font-bold transition-colors shadow-sm">
          Already a user? Login
        </Link>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-14 items-center">

          {/* ── LEFT ── */}
          <div>
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[11px] font-bold text-green-700 uppercase tracking-widest">
                Free to join
              </span>
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight mb-6">
              Join Karachi's<br />smartest commute<span className="text-green-500">.</span>
            </h1>

            <p className="text-gray-500 text-[16px] leading-relaxed mb-10 max-w-md">
              Book rides, save money, meet trusted commuters, and travel safely across Karachi.
            </p>

            <div className="space-y-3 mb-10">
              {[
                "Verified drivers & commuters",
                "Save up to 60% on commuting",
                "Live ride tracking",
                "Weekly ride scheduling",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle size={17} className="text-green-500 flex-shrink-0" />
                  <span className="text-[15px] font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-gray-200">
              {[
                { num: "2,400+", label: "Commuters",        color: "" },
                { num: "4.9★",   label: "Rating",           color: "" },
                { num: "Rs 4.2M",label: "Saved",            color: "text-green-600" },
              ].map((s, i, arr) => (
                <div key={s.label} className="flex items-center gap-6">
                  <div>
                    <div className={`text-2xl font-black ${s.color}`}>{s.num}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                  {i < arr.length - 1 && <div className="w-px h-10 bg-gray-200" />}
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: FORM ── */}
          <div>
            <div className="bg-white border border-gray-200 rounded-3xl p-8 lg:p-10 shadow-xl">
              <h2 className="text-[28px] font-black tracking-tight mb-1">Create Account</h2>
              <p className="text-gray-500 text-[14px] mb-8">Start booking rides in under 30 seconds.</p>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                {/* Full Name */}
                <Field label="Full Name" error={errors.name}>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Muhammad Ahmed"
                    className={`w-full h-13 px-4 border rounded-xl focus:border-black outline-none text-[14px] font-medium transition-colors ${errors.name ? "border-red-300" : "border-gray-200"}`}
                  />
                </Field>

                {/* Phone */}
                <Field label="Phone Number" error={errors.phone}>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="03XX XXXXXXX"
                      className={`w-full h-13 pl-10 pr-4 border rounded-xl focus:border-black outline-none text-[14px] font-medium transition-colors ${errors.phone ? "border-red-300" : "border-gray-200"}`}
                    />
                  </div>
                </Field>

                {/* Email */}
                <Field label="Email Address" error={errors.email}>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full h-13 px-4 border rounded-xl focus:border-black outline-none text-[14px] font-medium transition-colors ${errors.email ? "border-red-300" : "border-gray-200"}`}
                  />
                </Field>

                {/* Password */}
                <Field label="Password" error={errors.password}>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Min. 8 characters"
                      className={`w-full h-13 px-4 pr-11 border rounded-xl focus:border-black outline-none text-[14px] font-medium transition-colors ${errors.password ? "border-red-300" : "border-gray-200"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((x) => !x)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>

                {/* Server error */}
                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-[13px] text-red-600 font-medium">{serverError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-black text-[15px] rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating Account…</>
                  ) : (
                    <>Create Account <ArrowRight size={17} /></>
                  )}
                </button>

              </form>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-6 text-[13px] text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Shield size={14} className="text-green-500" /> Verified
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-green-500" /> Community
                  </div>
                </div>
                <p className="text-center text-[12px] text-gray-400 mt-4">
                  Already have an account?{" "}
                  <Link href="/login" className="text-black font-bold underline underline-offset-2 hover:text-green-600 transition-colors">
                    Login here
                  </Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}