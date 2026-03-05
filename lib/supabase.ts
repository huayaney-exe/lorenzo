import { createClient } from '@supabase/supabase-js'

// Server-side only — this client uses the service role key.
// Only import from API routes or server-side code.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
