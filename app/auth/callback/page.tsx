"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Car } from "lucide-react";

function CallbackInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    const handle = async () => {
      // Exchange the code in the URL for a session
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.push("/login");
        return;
      }

      const user = data.session.user;

      // Upsert profile (Google users won't have one yet)
      await supabase.from("profiles").upsert({
        id:        user.id,
        full_name: user.user_metadata?.full_name ?? user.email ?? "User",
        email:     user.email ?? "",
        phone:     user.user_metadata?.phone ?? "",
        verification_status: "unverified",
      }, { onConflict: "id", ignoreDuplicates: true });

      // Fetch the profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, email, verification_status")
        .eq("id", user.id)
        .single();

      const storedUser = {
        id:                 user.id,
        name:               profile?.full_name ?? user.email ?? "User",
        email:              profile?.email     ?? user.email ?? "",
        phone:              profile?.phone     ?? "",
        verificationStatus: (profile?.verification_status ?? "unverified") as
          "unverified" | "pending" | "approved" | "rejected",
      };

      localStorage.setItem("user", JSON.stringify(storedUser));
      window.dispatchEvent(new Event("movento:auth"));
      router.push(redirect);
    };

    handle();
  }, [router, redirect]);

  return (
    <div className="min-h-screen bg-[#f5f5f3] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
        <Car size={18} className="text-green-400" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
        <p className="text-[13px] font-medium text-gray-500">Signing you in…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
