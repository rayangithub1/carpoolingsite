"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            phone: form.phone,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Signup failed");

      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: form.name,
        phone: form.phone,
        email: form.email,
      });

      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">

        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-sm text-gray-500">Join Movento in seconds</p>

        <input
          className="w-full border rounded p-3 text-[16px]"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />

        <input
          className="w-full border rounded p-3 text-[16px]"
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />

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
          className="w-full bg-green-500 text-white p-3 rounded font-bold"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p className="text-sm text-center text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="font-bold text-black">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
