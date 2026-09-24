"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    const supabaseClient = window.supabaseClient;

    const accessLoading =
        document.getElementById("accessLoading");

    const accessDenied =
        document.getElementById("accessDenied");

    const dashboardContent =
        document.getElementById("dashboardContent");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const backHomeBtn =
        document.getElementById("backHomeBtn");

    const refreshBtn =
        document.getElementById("refreshBtn");

    const sidebarToggle =
        document.getElementById("sidebarToggle");

    const sidebar =
        document.getElementById("sidebar");


    /* =====================================================
       UI STATES
    ===================================================== */

    function showDenied() {

        accessLoading?.classList.add("hidden");

        dashboardContent?.classList.add("hidden");

        accessDenied?.classList.remove("hidden");
    }


    function showDashboard() {

        accessLoading?.classList.add("hidden");

        accessDenied?.classList.add("hidden");

        dashboardContent?.classList.remove("hidden");
    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(message) {

        const toast =
            document.getElementById("toast");

        if (!toast) return;

        toast.textContent =
            message;

        toast.classList.add("show");

        window.clearTimeout(
            window.__novaToastTimer
        );

        window.__novaToastTimer =
            window.setTimeout(() => {

                toast.classList.remove("show");

            }, 2500);
    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatMoney(
        value,
        currency = "MAD"
    ) {

        const number =
            Number(value || 0);

        return new Intl.NumberFormat(
            "fr-MA",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        ).format(number) +
            ` ${currency}`;
    }


    function formatDate(dateValue) {

        if (!dateValue) {
            return "—";
        }

        const date =
            new Date(dateValue);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "—";
        }

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    function shortId(id) {

        if (!id) {
            return "—";
        }

        return String(id)
            .slice(0, 8)
            .toUpperCase();
    }


    function getStatusClass(status) {

        const safe =
            String(status || "")
                .toLowerCase()
                .replace(/\s+/g, "_");

        const known = [
            "pending",
            "accepted",
            "in_progress",
            "delivered",
            "completed",
            "cancelled",
            "rejected"
        ];

        if (known.includes(safe)) {
            return `status-${safe}`;
        }

        return "status-pending";
    }


    function formatStatus(status) {

        if (!status) {
            return "UNKNOWN";
        }

        return String(status)
            .replace(/_/g, " ")
            .toUpperCase();
    }


    /* =====================================================
       AUTH USER
    ===================================================== */

    async function getCurrentUser() {

        if (!supabaseClient) {
            throw new Error(
                "Supabase client is missing."
            );
        }

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getUser();

        if (error) {
            throw error;
        }

        return data?.user || null;
    }


    /* =====================================================
       ADMIN PROFILE
       IMPORTANT:
       We DO NOT query profiles directly here.
       We use the secure RPC function.
    ===================================================== */

    async function getAdminProfile() {

        if (!supabaseClient) {
            throw new Error(
                "Supabase client is missing."
            );
        }

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "admin_current_profile"
            );

        if (error) {

            console.error(
                "NOVA admin_current_profile error:",
                error
            );

            throw error;
        }

        if (!data) {
            throw new Error(
                "Admin profile was not returned."
            );
        }

        return data;
    }


    /* =====================================================
       APPLY ADMIN PROFILE
    ===================================================== */

    function applyAdminProfile(
        user,
        profile
    ) {

        const fullName =
            profile?.full_name ||
            [
                profile?.first_name,
                profile?.last_name
            ]
                .filter(Boolean)
                .join(" ") ||
            user?.user_metadata?.full_name ||
            user?.email?.split("@")[0] ||
            "Admin";


        const email =
            profile?.email ||
            user?.email ||
            "";


        const firstLetter =
            fullName
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "A";


        const adminName =
            document.getElementById(
                "adminName"
            );


        const adminEmail =
            document.getElementById(
                "adminEmail"
            );


        const adminInitial =
            document.getElementById(
                "adminInitial"
            );


        const welcomeName =
            document.getElementById(
                "welcomeName"
            );


        if (adminName) {

            adminName.textContent =
                fullName;
        }


        if (adminEmail) {

            adminEmail.textContent =
                email;
        }


        if (adminInitial) {

            adminInitial.textContent =
                firstLetter;
        }


        if (welcomeName) {

            welcomeName.textContent =
                fullName.split(" ")[0] ||
                "Admin";
        }


        const avatar =
            document.querySelector(
                ".admin-avatar"
            );


        if (
            avatar &&
            profile?.avatar_url
        ) {

            avatar.innerHTML = "";


            const image =
                document.createElement(
                    "img"
                );


            image.src =
                profile.avatar_url;


            image.alt =
                "Admin";


            image.width = 40;

            image.height = 40;


            image.style.width =
                "100%";

            image.style.height =
                "100%";

            image.style.objectFit =
                "cover";


            avatar.appendChild(
                image
            );
        }
    }


    /* =====================================================
       DASHBOARD STATS
    ===================================================== */

    async function loadDashboardStats() {

        if (!supabaseClient) {
            return;
        }


        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "admin_dashboard_stats"
            );


        if (error) {

            console.error(
                "NOVA dashboard stats error:",
                error
            );

            throw error;
        }


        const stats =
            Array.isArray(data)
                ? data[0]
                : data;


        if (!stats) {

            throw new Error(
                "No dashboard statistics returned."
            );
        }


        const totalUsers =
            document.getElementById(
                "totalUsers"
            );


        const totalWorkers =
            document.getElementById(
                "totalWorkers"
            );


        const totalServices =
            document.getElementById(
                "totalServices"
            );


        const totalOrders =
            document.getElementById(
                "totalOrders"
            );


        const grossSales =
            document.getElementById(
                "grossSales"
            );


        const platformFees =
            document.getElementById(
                "platformFees"
            );


        if (totalUsers) {

            totalUsers.textContent =
                Number(
                    stats.total_users || 0
                ).toLocaleString();
        }


        if (totalWorkers) {

            totalWorkers.textContent =
                Number(
                    stats.total_workers || 0
                ).toLocaleString();
        }


        if (totalServices) {

            totalServices.textContent =
                Number(
                    stats.total_services || 0
                ).toLocaleString();
        }


        if (totalOrders) {

            totalOrders.textContent =
                Number(
                    stats.total_orders || 0
                ).toLocaleString();
        }


        if (grossSales) {

            grossSales.textContent =
                formatMoney(
                    stats.gross_sales,
                    stats.currency || "MAD"
                );
        }


        if (platformFees) {

            platformFees.textContent =
                formatMoney(
                    stats.platform_fees,
                    stats.currency || "MAD"
                );
        }
    }


    /* =====================================================
       RECENT ORDERS
    ===================================================== */

    async function loadRecentOrders() {

        const body =
            document.getElementById(
                "recentOrdersBody"
            );


        if (!body) {
            return;
        }


        body.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="table-loading"
                >
                    Loading orders...
                </td>
            </tr>
        `;


        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "admin_recent_orders"
            );


        if (error) {

            console.error(
                "NOVA admin recent orders error:",
                error
            );


            body.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="empty-table"
                    >
                        Could not load recent orders.
                    </td>
                </tr>
            `;


            return;
        }


        const orders =
            Array.isArray(data)
                ? data
                : [];


        if (!orders.length) {

            body.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="empty-table"
                    >
                        No orders yet.
                    </td>
                </tr>
            `;


            return;
        }


        body.innerHTML =
            orders
                .map((order) => {

                    const status =
                        String(
                            order.status || ""
                        );


                    return `
                        <tr>

                            <td>
                                <span class="order-id">
                                    #${escapeHtml(
                                        shortId(order.id)
                                    )}
                                </span>
                            </td>


                            <td>
                                <span class="service-name">
                                    ${escapeHtml(
                                        order.service_title ||
                                        "Untitled Service"
                                    )}
                                </span>
                            </td>


                            <td>
                                <span class="order-price">
                                    ${escapeHtml(
                                        formatMoney(
                                            order.price,
                                            order.currency || "MAD"
                                        )
                                    )}
                                </span>
                            </td>


                            <td>
                                <span
                                    class="status-badge ${getStatusClass(
                                        status
                                    )}"
                                >
                                    ${escapeHtml(
                                        formatStatus(status)
                                    )}
                                </span>
                            </td>


                            <td>
                                ${escapeHtml(
                                    formatDate(
                                        order.created_at
                                    )
                                )}
                            </td>

                        </tr>
                    `;
                })
                .join("");
    }


    /* =====================================================
       LOAD DASHBOARD
    ===================================================== */

    async function loadDashboard() {

        await Promise.all([
            loadDashboardStats(),
            loadRecentOrders()
        ]);
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {

        if (!supabaseClient) {
            return;
        }


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

            console.error(
                "NOVA logout error:",
                error
            );


            showToast(
                "Logout failed."
            );
        }
    }


    /* =====================================================
       INITIALIZE ADMIN
    ===================================================== */

    async function initializeAdmin() {

        if (!supabaseClient) {

            console.error(
                "NOVA: Supabase client missing."
            );


            showDenied();

            return;
        }


        try {

            /* ---------------------------------------------
               STEP 1
               Check current Supabase session/user
            --------------------------------------------- */

            const user =
                await getCurrentUser();


            if (!user) {

                window.location.replace(
                    "../login.html?redirect=admin/index.html"
                );

                return;
            }


            /* ---------------------------------------------
               STEP 2
               Ask secure RPC for admin profile
            --------------------------------------------- */

            const profile =
                await getAdminProfile();


            if (!profile) {

                console.error(
                    "NOVA: Admin profile not returned."
                );


                showDenied();

                return;
            }


            /* ---------------------------------------------
               STEP 3
               Extra frontend verification
            --------------------------------------------- */

            const isAdmin =
                String(
                    profile.role || ""
                )
                    .toLowerCase() ===
                "admin";


            const active =
                profile.is_active !== false;


            if (!isAdmin || !active) {

                console.error(
                    "NOVA: User is not an active admin.",
                    {
                        role: profile.role,
                        is_active: profile.is_active
                    }
                );


                showDenied();

                return;
            }


            /* ---------------------------------------------
               STEP 4
               Save profile
            --------------------------------------------- */

            applyAdminProfile(
                user,
                profile
            );


            /* ---------------------------------------------
               STEP 5
               Show dashboard
            --------------------------------------------- */

            showDashboard();


            /* ---------------------------------------------
               STEP 6
               Load real dashboard data
            --------------------------------------------- */

            await loadDashboard();


        } catch (error) {

            console.error(
                "NOVA Admin initialization error:",
                error
            );


            showDenied();
        }
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    logoutBtn?.addEventListener(
        "click",
        logout
    );


    backHomeBtn?.addEventListener(
        "click",
        () => {

            window.location.replace(
                "../index.html"
            );
        }
    );


    refreshBtn?.addEventListener(
        "click",
        async () => {

            refreshBtn.disabled = true;


            try {

                await loadDashboard();


                showToast(
                    "Dashboard refreshed."
                );

            } catch (error) {

                console.error(
                    error
                );


                showToast(
                    "Refresh failed."
                );
            }


            refreshBtn.disabled = false;
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
        .forEach((link) => {

            link.addEventListener(
                "click",
                () => {

                    sidebar?.classList.remove(
                        "open"
                    );
                }
            );
        });


    /* =====================================================
       AUTH STATE
    ===================================================== */

    supabaseClient?.auth
        .onAuthStateChange(
            (event) => {

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

    await initializeAdmin();

});