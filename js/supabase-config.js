const SUPABASE_URL = "https://iawhkjwltyqeuovxpjss.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_aeJ0TwTnDtaS4vWEa9JJBw_yR-eWAjL";

if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL.includes("YOUR-PROJECT-ID") ||
    SUPABASE_ANON_KEY.includes("YOUR-SUPABASE")
) {
    console.error("Supabase is not configured.");
} else {
    window.supabaseClient = supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );
}