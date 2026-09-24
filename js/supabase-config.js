"use strict";

/* =========================================================
   NOVA MARKET
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL =
    "https://iawhkjwltyqeuovxpjss.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_aeJ0TwTnDtaS4vWEa9JJBw_yR-eWAjL";


/* =========================================================
   VALIDATION
   ========================================================= */

const supabaseConfigured =
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_URL.includes(".supabase.co");


/* =========================================================
   CREATE ONE SUPABASE CLIENT
   ========================================================= */

if (!supabaseConfigured) {

    console.error(
        "NOVA: Supabase is not configured correctly."
    );

    window.supabaseClient = null;

} else if (typeof supabase === "undefined") {

    console.error(
        "NOVA: Supabase library was not loaded."
    );

    window.supabaseClient = null;

} else {

    try {

        window.supabaseClient =
            supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );

        console.log(
            "NOVA: Supabase connected successfully."
        );

    } catch (error) {

        console.error(
            "NOVA: Failed to create Supabase client:",
            error
        );

        window.supabaseClient = null;
    }
}