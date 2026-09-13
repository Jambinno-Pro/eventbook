import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "EventBook Supabase configuration is missing. Check the root .env file and restart Vite."
  );
}

if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes("supabase.co")) {
  throw new Error(
    "VITE_SUPABASE_URL does not look like a valid Supabase project URL."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
