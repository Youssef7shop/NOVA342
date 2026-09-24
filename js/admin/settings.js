"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    const supabaseClient =
        window.supabaseClient;


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const accessLoading =
        document.getElementById("accessLoading");

    const accessDenied =
        document.getElementById("accessDenied");

    const settingsContent =
        document.getElementById("settingsContent");


    const sidebar =
        document.getElementById("sidebar");

    const sidebarToggle =
        document.getElementById("sidebarToggle");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const refreshBtn =
        document.getElementById("refreshBtn");

    const backHomeBtn =
        document.getElementById("backHomeBtn");


    const saveBtn =
        document.getElementById("saveBtn");

    const resetBtn =
        document.getElementById("resetBtn");


    const platformName =
        document.getElementById("platformName");

    const platformDescription =
        document.getElementById(
            "platformDescription"
        );

    const platformCurrency =
        document.getElementById(
            "platformCurrency"
        );

    const platformFee =
        document.getElementById("platformFee");

    const defaultPlan =
        document.getElementById("defaultPlan");


    const registrationEnabled =
        document.getElementById(
            "registrationEnabled"
        );

    const workerRegistrationEnabled =
        document.getElementById(
            "workerRegistrationEnabled"
        );

    const maintenanceMode =
        document.getElementById(
            "maintenanceMode"
        );


    const freePrice =
        document.getElementById("freePrice");

    const freeOrdersLimit =
        document.getElementById(
            "freeOrdersLimit"
        );

    const freeProjectsLimit =
        document.getElementById(
            "freeProjectsLimit"
        );


    const proPrice =
        document.getElementById("proPrice");

    const proOrdersLimit =
        document.getElementById(
            "proOrdersLimit"
        );

    const proProjectsLimit =
        document.getElementById(
            "proProjectsLimit"
        );


    const businessPrice =
        document.getElementById(
            "businessPrice"
        );

    const businessOrdersLimit =
        document.getElementById(
            "businessOrdersLimit"
        );

    const businessProjectsLimit =
        document.getElementById(
            "businessProjectsLimit"
        );


    const saveStatus =
        document.getElementById("saveStatus");

    const saveDot =
        document.getElementById("saveDot");


    let originalSettings = null;


    /* =====================================================
       UI
    ===================================================== */

    function showDenied() {

        accessLoading.classList.add(
            "hidden"
        );

        settingsContent.classList.add(
            "hidden"
        );

        accessDenied.classList.remove(
            "hidden"
        );
    }


    function showContent() {

        accessLoading.classList.add(
            "hidden"
        );

        accessDenied.classList.add(
            "hidden"
        );

        settingsContent.classList.remove(
            "hidden"
        );
    }


    function showToast(message) {

        const toast =
            document.getElementById("toast");

        if (!toast) {
            return;
        }

        toast.textContent =
            message;

        toast.classList.add("show");

        clearTimeout(
            window.__novaSettingsToast
        );

        window.__novaSettingsToast =
            setTimeout(() => {

                toast.classList.remove(
                    "show"
                );

            }, 2500);
    }


    function setSaveStatus(
        text,
        type = "saved"
    ) {

        if (saveStatus) {
            saveStatus.textContent =
                text;
        }


        if (!saveDot) {
            return;
        }


        if (type === "saving") {

            saveDot.style.background =
                "#f4c95d";

            saveDot.style.boxShadow =
                "0 0 12px rgba(244,201,93,.7)";

            return;
        }


        if (type === "error") {

            saveDot.style.background =
                "#ff5577";

            saveDot.style.boxShadow =
                "0 0 12px rgba(255,85,119,.7)";

            return;
        }


        saveDot.style.background =
            "var(--green)";

        saveDot.style.boxShadow =
            "0 0 12px rgba(41,217,139,.7)";
    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function numberValue(
        element,
        fallback = 0
    ) {

        const value =
            Number(element.value);

        return Number.isFinite(value)
            ? value
            : fallback;
    }


    function booleanValue(
        element
    ) {

        return Boolean(
            element.checked
        );
    }


    function setNumber(
        element,
        value
    ) {

        element.value =
            value ?? 0;
    }


    function setBoolean(
        element,
        value
    ) {

        element.checked =
            Boolean(value);
    }


    /* =====================================================
       ADMIN ACCESS
    ===================================================== */

    async function checkAdmin() {

        if (!supabaseClient) {

            throw new Error(
                "Supabase client is missing."
            );
        }


        const {
            data: userData,
            error: userError
        } =
            await supabaseClient
                .auth
                .getUser();


        if (userError) {
            throw userError;
        }


        if (!userData?.user) {

            window.location.replace(
                "../login.html?redirect=admin/settings.html"
            );

            return false;
        }


        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient.rpc(
                "admin_current_profile"
            );


        if (profileError) {
            throw profileError;
        }


        if (!profile) {
            return false;
        }


        const isAdmin =
            String(
                profile.role || ""
            ).toLowerCase() ===
            "admin";


        const isActive =
            profile.is_active !== false;


        if (!isAdmin || !isActive) {
            return false;
        }


        applyAdminProfile(
            profile,
            userData.user
        );


        return true;
    }


    function applyAdminProfile(
        profile,
        user
    ) {

        const name =
            profile.full_name ||
            [
                profile.first_name,
                profile.last_name
            ]
                .filter(Boolean)
                .join(" ") ||
            user?.email?.split("@")[0] ||
            "Admin";


        const email =
            profile.email ||
            user?.email ||
            "";


        document.getElementById(
            "adminName"
        ).textContent =
            name;


        document.getElementById(
            "adminEmail"
        ).textContent =
            email;


        document.getElementById(
            "adminInitial"
        ).textContent =
            name
                .charAt(0)
                .toUpperCase();
    }


    /* =====================================================
       LOAD SETTINGS
    ===================================================== */

    async function loadSettings() {

        setSaveStatus(
            "Loading...",
            "saving"
        );


        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "admin_get_settings"
            );


        if (error) {
            throw error;
        }


        const settings =
            data || {};


        originalSettings =
            JSON.parse(
                JSON.stringify(
                    settings
                )
            );


        applySettings(
            settings
        );


        setSaveStatus(
            "Saved",
            "saved"
        );
    }


    function applySettings(
        settings
    ) {

        const platform =
            settings.platform || {};

        const marketplace =
            settings.marketplace || {};

        const registration =
            settings.registration || {};

        const plans =
            settings.plans || {};


        platformName.value =
            platform.name ||
            "NOVA MARKET";


        platformDescription.value =
            platform.description ||
            "Digital services marketplace.";


        platformCurrency.value =
            platform.currency ||
            "MAD";


        platformFee.value =
            marketplace.platform_fee ??
            10;


        defaultPlan.value =
            marketplace.default_plan ||
            "free";


        setBoolean(
            registration.user_registration,
            registration.user_registration
        );
    }


    /* =====================================================
       FIX SETTINGS FIELDS
    ===================================================== */

    function applySettings(
        settings
    ) {

        const platform =
            settings.platform || {};

        const marketplace =
            settings.marketplace || {};

        const registration =
            settings.registration || {};

        const plans =
            settings.plans || {};


        platformName.value =
            platform.name ||
            "NOVA MARKET";


        platformDescription.value =
            platform.description ||
            "Digital services marketplace.";


        platformCurrency.value =
            platform.currency ||
            "MAD";


        platformFee.value =
            marketplace.platform_fee ??
            10;


        defaultPlan.value =
            marketplace.default_plan ||
            "free";


        registrationEnabled.checked =
            registration.user_registration !== false;


        workerRegistrationEnabled.checked =
            registration.worker_registration !== false;


        maintenanceMode.checked =
            registration.maintenance_mode === true;


        const free =
            plans.free || {};

        const pro =
            plans.pro || {};

        const business =
            plans.business || {};


        setNumber(
            freePrice,
            free.price ?? 0
        );

        setNumber(
            freeOrdersLimit,
            free.orders_limit ?? 5
        );

        setNumber(
            freeProjectsLimit,
            free.projects_limit ?? 2
        );


        setNumber(
            proPrice,
            pro.price ?? 99
        );

        setNumber(
            proOrdersLimit,
            pro.orders_limit ?? 30
        );

        setNumber(
            proProjectsLimit,
            pro.projects_limit ?? 20
        );


        setNumber(
            businessPrice,
            business.price ?? 299
        );

        setNumber(
            businessOrdersLimit,
            business.orders_limit ?? 100
        );

        setNumber(
            businessProjectsLimit,
            business.projects_limit ?? 100
        );
    }


    /* =====================================================
       COLLECT SETTINGS
    ===================================================== */

    function collectSettings() {

        return {

            platform: {

                name:
                    platformName.value.trim(),

                description:
                    platformDescription.value.trim(),

                currency:
                    platformCurrency.value

            },


            marketplace: {

                platform_fee:
                    numberValue(
                        platformFee
                    ),

                default_plan:
                    defaultPlan.value

            },


            registration: {

                user_registration:
                    booleanValue(
                        registrationEnabled
                    ),

                worker_registration:
                    booleanValue(
                        workerRegistrationEnabled
                    ),

                maintenance_mode:
                    booleanValue(
                        maintenanceMode
                    )

            },


            plans: {

                free: {

                    price:
                        numberValue(
                            freePrice
                        ),

                    orders_limit:
                        numberValue(
                            freeOrdersLimit
                        ),

                    projects_limit:
                        numberValue(
                            freeProjectsLimit
                        )

                },


                pro: {

                    price:
                        numberValue(
                            proPrice
                        ),

                    orders_limit:
                        numberValue(
                            proOrdersLimit
                        ),

                    projects_limit:
                        numberValue(
                            proProjectsLimit
                        )

                },


                business: {

                    price:
                        numberValue(
                            businessPrice
                        ),

                    orders_limit:
                        numberValue(
                            businessOrdersLimit
                        ),

                    projects_limit:
                        numberValue(
                            businessProjectsLimit
                        )

                }

            }

        };
    }


    /* =====================================================
       VALIDATION
    ===================================================== */

    function validateSettings(
        settings
    ) {

        if (!settings.platform.name) {

            throw new Error(
                "Platform name is required."
            );
        }


        if (
            settings.marketplace.platform_fee < 0 ||
            settings.marketplace.platform_fee > 50
        ) {

            throw new Error(
                "Platform fee must be between 0% and 50%."
            );
        }


        const plans =
            settings.plans;


        for (
            const key of [
                "free",
                "pro",
                "business"
            ]
        ) {

            const plan =
                plans[key];


            if (
                plan.price < 0 ||
                plan.orders_limit < 0 ||
                plan.projects_limit < 0
            ) {

                throw new Error(
                    `${key} plan values cannot be negative.`
                );
            }
        }
    }


    /* =====================================================
       SAVE
    ===================================================== */

    async function saveSettings() {

        const settings =
            collectSettings();


        try {

            validateSettings(
                settings
            );

        } catch (error) {

            showToast(
                error.message
            );

            return;
        }


        saveBtn.disabled =
            true;

        resetBtn.disabled =
            true;


        setSaveStatus(
            "Saving...",
            "saving"
        );


        try {

            const {
                data,
                error
            } =
                await supabaseClient.rpc(
                    "admin_update_settings",
                    {
                        p_settings:
                            settings
                    }
                );


            if (error) {
                throw error;
            }


            originalSettings =
                JSON.parse(
                    JSON.stringify(
                        data?.settings ||
                        settings
                    )
                );


            setSaveStatus(
                "Saved",
                "saved"
            );


            showToast(
                "Settings saved successfully."
            );


        } catch (error) {

            console.error(
                "NOVA settings save error:",
                error
            );


            setSaveStatus(
                "Save failed",
                "error"
            );


            showToast(
                error.message ||
                "Could not save settings."
            );

        } finally {

            saveBtn.disabled =
                false;

            resetBtn.disabled =
                false;
        }
    }


    /* =====================================================
       RESET
    ===================================================== */

    function resetSettings() {

        if (!originalSettings) {
            return;
        }


        applySettings(
            originalSettings
        );


        setSaveStatus(
            "Saved",
            "saved"
        );


        showToast(
            "Changes reset."
        );
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    saveBtn?.addEventListener(
        "click",
        saveSettings
    );


    resetBtn?.addEventListener(
        "click",
        resetSettings
    );


    refreshBtn?.addEventListener(
        "click",
        async () => {

            refreshBtn.disabled =
                true;


            try {

                await loadSettings();

                showToast(
                    "Settings refreshed."
                );

            } catch (error) {

                console.error(error);

                showToast(
                    "Refresh failed."
                );
            }


            refreshBtn.disabled =
                false;
        }
    );


    sidebarToggle?.addEventListener(
        "click",
        () => {

            sidebar?.classList.toggle(
                "open"
            );
        }
    );


    document
        .querySelectorAll(".nav-item")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        sidebar?.classList.remove(
                            "open"
                        );

                    }
                );

            }
        );


    backHomeBtn?.addEventListener(
        "click",
        () => {

            window.location.replace(
                "../index.html"
            );
        }
    );


    logoutBtn?.addEventListener(
        "click",
        async () => {

            try {

                const {
                    error
                } =
                    await supabaseClient
                        .auth
                        .signOut();


                if (error) {
                    throw error;
                }


                window.location.replace(
                    "../login.html"
                );

            } catch (error) {

                console.error(error);

                showToast(
                    "Logout failed."
                );
            }
        }
    );


    /* =====================================================
       AUTH
    ===================================================== */

    supabaseClient?.auth
        .onAuthStateChange(
            event => {

                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    window.location.replace(
                        "../login.html"
                    );
                }
            }
        );


    /* =====================================================
       START
    ===================================================== */

    try {

        if (!supabaseClient) {

            throw new Error(
                "Supabase client missing."
            );
        }


        const allowed =
            await checkAdmin();


        if (!allowed) {

            showDenied();

            return;
        }


        showContent();


        await loadSettings();


    } catch (error) {

        console.error(
            "NOVA Admin Settings initialization error:",
            error
        );


        showDenied();
    }

});