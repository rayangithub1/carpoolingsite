// lib/supabaseClient.ts
// Single shared Supabase client — import this everywhere instead of
// calling createClient() multiple times.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env"
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,        // saves session to localStorage
    autoRefreshToken: true,      // keeps token fresh automatically
    detectSessionInUrl: true,    // handles OAuth redirects
    storageKey: "sb-movento-auth", // explicit key avoids conflicts
  },
});