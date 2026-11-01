import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://swklzpclsghbdtmtprnb.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3a2x6cGNsc2doYmR0bXRwcm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNzI0ODksImV4cCI6MjEwODk0ODQ4OX0.SbQYMwf5COhWmLgkjHN-LvwaXUadUz59T4pANE36GcI';

  return createBrowserClient(supabaseUrl, supabaseKey);
}

// Global browser instance for single client calls
export const supabase = createClient();

