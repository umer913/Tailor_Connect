import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wxufxklshorkbxwkxagx.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dWZ4a2xzaG9ya2J4d2t4YWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MTc5OTcsImV4cCI6MjA3NjA5Mzk5N30.Pw1M4KHbAKB2IAemfJGCN1qi1Ewvy8kFPjISDti-OIU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
