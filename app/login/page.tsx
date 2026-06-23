"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirect =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect") || "/dashboard"
      : "/dashboard";

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      setError("Invalid email or password");
      return;
    }

    router.push(redirect);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-5">
      <form onSubmit={login} className="w-full max-w-sm space-y-4">

        <h1 className="text-2xl font-bold">Login</h1>

        <input
          className="w-full h-12 px-3 border rounded-lg text-base"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <input
          className="w-full h-12 px-3 border rounded-lg text-base"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          disabled={loading}
          className="w-full h-12 bg-black text-white rounded-lg"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-center">
          No account? <Link href="/signup" className="underline">Signup</Link>
        </p>
      </form>
    </div>
  );
}
