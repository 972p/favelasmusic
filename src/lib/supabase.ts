import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role (bypasses RLS for API routes)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Public bucket name for all media
export const BUCKET = 'beats-media';
