// Supabase Configuration
// Replace these values with your Supabase project credentials
// You can find them in your Supabase dashboard: Settings > API

const SUPABASE_URL = 'https://ohhfcwnvvxxoljbepaom.supabase.co'; // e.g., 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oaGZjd252dnh4b2xqYmVwYW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTQ1MTIsImV4cCI6MjA4MzEzMDUxMn0.SsYy8Mpqs4KAq71_EbvQuloEXqcuuCUxqAZ_1aGs0DY'; // Your anon/public key

// Initialize Supabase client
// Note: Make sure this script loads AFTER the Supabase library script
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

