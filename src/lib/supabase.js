import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Nomaad] Missing Supabase environment variables — auth will not work until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// No-op lock — prevents the BroadcastChannel lock contention that causes
// auth state listeners (onAuthStateChange) to block all database queries.
// This is safe for single-tab apps; the lock is only needed to synchronise
// across multiple browser tabs/workers.
const noopLock = async (name, acquireTimeout, fn) => fn();

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    lock: noopLock,
  },
});
