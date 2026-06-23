"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-5">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">

        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-gray-500">Login to continue</p>

        <input
          className="w-full border rounded p-3 text-[16px]"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />

        <input
          className="w-full border rounded p-3 text-[16px]"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          disabled={loading}
          className="w-full bg-black text-white p-3 rounded font-bold"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="text-sm text-center text-gray-500">
          Don’t have an account?{" "}
          <a href="/signup" className="font-bold text-black">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}
