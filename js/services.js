"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    const supabase = window.supabaseClient;

    const grid =
        document.getElementById("servicesGrid");

    const searchInput =
        document.getElementById("searchInput");

    const categoryFilter =
        document.getElementById("categoryFilter");

    let allServices = [];


    /* ==========================================
       CHECK ELEMENTS
    ========================================== */

    if (!grid) {
        console.error(
            "NOVA: #servicesGrid was not found."
        );
        return;
    }


    if (!supabase) {

        grid.innerHTML = `
            <div class="empty">
                <h3>Supabase is not configured</h3>
                <p>
                    Please configure js/supabase-config.js first.
                </p>
            </div>
        `;

        return;
    }


    /* ==========================================
       INITIAL LOAD
    ========================================== */

    await loadProfile();
    await loadServices();


    if (searchInput) {
        searchInput.addEventListener(
            "input",
            filterServices
        );
    }


    if (categoryFilter) {
        categoryFilter.addEventListener(
            "change",
            filterServices
        );
    }


    /* ==========================================
       LOAD PROFILE
    ========================================== */

    async function loadProfile() {

        try {

            const {
                data,
                error
            } = await supabase.auth.getUser();


            if (error) {
                console.warn(
                    "NOVA profile auth error:",
                    error
                );
            }


            const user =
                data?.user;


            if (!user) {
                return;
            }


            const profileInitial =
                document.getElementById(
                    "profileInitial"
                );

            const profileImage =
                document.getElementById(
                    "profileImage"
                );


            const {
                data: profile,
                error: profileError
            } =
                await supabase
                    .from("profiles")
                    .select(`
                        full_name,
                        first_name,
                        last_name,
                        avatar_url
                    `)
                    .eq("id", user.id)
                    .maybeSingle();


            if (profileError) {

                console.warn(
                    "NOVA profile error:",
                    profileError
                );
            }


            const fullName =
                profile?.full_name ||
                `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
                user.user_metadata?.full_name ||
                user.email ||
                "NOVA";


            if (profileInitial) {

                profileInitial.textContent =
                    fullName
                        .charAt(0)
                        .toUpperCase();
            }


            if (
                profileImage &&
                profile?.avatar_url
            ) {

                profileImage.src =
                    profile.avatar_url;

                profileImage.style.display =
                    "block";


                if (profileInitial) {

                    profileInitial.style.display =
                        "none";
                }
            }

        } catch (error) {

            console.warn(
                "NOVA loadProfile error:",
                error
            );
        }
    }


    /* ==========================================
       LOAD SERVICES
    ========================================== */

    async function loadServices() {

        grid.innerHTML = `
            <div class="loader">
                Loading services...
            </div>
        `;


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("services")
                    .select(`
                        id,
                        worker_id,
                        title,
                        slug,
                        description,
                        category,
                        price,
                        delivery_days,
                        image_url,
                        status,
                        created_at
                    `)
                    .eq("status", "published")
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {

                console.error(
                    "NOVA services error:",
                    error
                );


                grid.innerHTML = `
                    <div class="empty">
                        <h3>Unable to load services</h3>
                        <p>
                            ${escapeHTML(
                                error.message
                            )}
                        </p>
                    </div>
                `;

                return;
            }


            allServices =
                Array.isArray(data)
                    ? data
                    : [];


            await attachWorkers(
                allServices
            );


            renderServices(
                allServices
            );


        } catch (error) {

            console.error(
                "NOVA loadServices error:",
                error
            );


            grid.innerHTML = `
                <div class="empty">
                    <h3>Something went wrong</h3>
                    <p>
                        Please refresh the page and try again.
                    </p>
                </div>
            `;
        }
    }


    /* ==========================================
       ATTACH WORKERS
    ========================================== */

    async function attachWorkers(
        services
    ) {

        if (!services.length) {
            return;
        }


        const workerIds =
            [
                ...new Set(
                    services
                        .map(
                            service =>
                                service.worker_id
                        )
                        .filter(Boolean)
                )
            ];


        if (!workerIds.length) {
            return;
        }


        const {
            data: profiles,
            error
        } =
            await supabase
                .from("profiles")
                .select(`
                    id,
                    first_name,
                    last_name,
                    full_name,
                    avatar_url,
                    role
                `)
                .in(
                    "id",
                    workerIds
                );


        if (error) {

            console.warn(
                "Could not load worker profiles:",
                error
            );

            return;
        }


        const profileMap = {};


        (profiles || [])
            .forEach(profile => {

                profileMap[
                    profile.id
                ] = profile;
            });


        services.forEach(service => {

            service.worker =
                profileMap[
                    service.worker_id
                ] || null;

        });
    }


    /* ==========================================
       FILTER
    ========================================== */

    function filterServices() {

        const query =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";


        const category =
            categoryFilter
                ? categoryFilter.value
                : "all";


        const filtered =
            allServices.filter(
                service => {

                    const title =
                        String(
                            service.title || ""
                        ).toLowerCase();


                    const description =
                        String(
                            service.description || ""
                        ).toLowerCase();


                    const serviceCategory =
                        String(
                            service.category || ""
                        ).toLowerCase();


                    const matchesSearch =
                        !query ||
                        title.includes(query) ||
                        description.includes(query) ||
                        serviceCategory.includes(query);


                    const matchesCategory =
                        category === "all" ||
                        service.category === category;


                    return (
                        matchesSearch &&
                        matchesCategory
                    );
                }
            );


        renderServices(
            filtered
        );
    }


    /* ==========================================
       RENDER
    ========================================== */

    function renderServices(
        services
    ) {

        if (!services.length) {

            grid.innerHTML = `
                <div class="empty">
                    <h3>No services found</h3>

                    <p>
                        Try another search or category.
                    </p>
                </div>
            `;

            return;
        }


        grid.innerHTML =
            services
                .map(
                    service =>
                        createServiceCard(
                            service
                        )
                )
                .join("");


        /*
         * IMPORTANT
         *
         * View Service now sends BOTH:
         *
         * id
         * slug
         *
         * This makes service.html
         * much more reliable.
         */


        grid
            .querySelectorAll(
                "[data-service-id]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const serviceId =
                            button.dataset.serviceId;


                        const service =
                            allServices.find(
                                item =>
                                    item.id ===
                                    serviceId
                            );


                        if (!service) {

                            console.error(
                                "NOVA: Service not found:",
                                serviceId
                            );

                            return;
                        }


                        const params =
                            new URLSearchParams();


                        /*
                         * Always send ID
                         */

                        params.set(
                            "id",
                            service.id
                        );


                        /*
                         * Send slug when available
                         */

                        if (service.slug) {

                            params.set(
                                "slug",
                                service.slug
                            );
                        }


                        const url =
                            `service.html?${params.toString()}`;


                        console.log(
                            "NOVA opening service:",
                            url
                        );


                        window.location.href =
                            url;
                    }
                );
            });
    }


    /* ==========================================
       SERVICE CARD
    ========================================== */

    function createServiceCard(
        service
    ) {

        const worker =
            service.worker;


        const workerName =
            worker?.full_name ||
            `${worker?.first_name || ""} ${worker?.last_name || ""}`.trim() ||
            "NOVA Worker";


        const initial =
            workerName
                .charAt(0)
                .toUpperCase();


        /* ======================================
           WORKER AVATAR
        ====================================== */

        let avatar;


        if (worker?.avatar_url) {

            avatar = `
                <img
                    class="worker-avatar"
                    src="${escapeAttribute(
                        worker.avatar_url
                    )}"
                    alt="${escapeAttribute(
                        workerName
                    )}"
                    loading="lazy"
                >
            `;

        } else {

            avatar = `
                <div
                    class="worker-avatar"
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:12px;
                        font-weight:700;
                    "
                >
                    ${escapeHTML(
                        initial
                    )}
                </div>
            `;
        }


        /* ======================================
           SERVICE IMAGE
        ====================================== */

        let image;


        if (service.image_url) {

            image = `
                <img
                    src="${escapeAttribute(
                        service.image_url
                    )}"
                    alt="${escapeAttribute(
                        service.title
                    )}"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >

                <div
                    class="service-placeholder"
                    style="display:none;"
                >
                    N
                </div>
            `;

        } else {

            image = `
                <div class="service-placeholder">
                    N
                </div>
            `;
        }


        const price =
            Number(
                service.price || 0
            );


        const deliveryDays =
            Number(
                service.delivery_days || 1
            );


        return `
            <article
                class="service-card"
                data-service-card="${escapeAttribute(
                    service.id
                )}"
            >

                <div class="service-image">
                    ${image}
                </div>


                <div class="service-content">

                    <span class="category">
                        ${escapeHTML(
                            service.category ||
                            "Other"
                        )}
                    </span>


                    <h2 class="service-title">
                        ${escapeHTML(
                            service.title ||
                            "Untitled Service"
                        )}
                    </h2>


                    <p class="service-description">
                        ${escapeHTML(
                            service.description ||
                            "Professional digital service from a NOVA worker."
                        )}
                    </p>


                    <div class="service-meta">

                        <div class="price">
                            ${formatPrice(
                                price
                            )} MAD
                        </div>


                        <div class="delivery">

                            ${deliveryDays}

                            day${deliveryDays !== 1 ? "s" : ""}

                        </div>

                    </div>


                    <div class="service-footer">

                        <div class="worker">

                            ${avatar}


                            <span class="worker-name">
                                ${escapeHTML(
                                    workerName
                                )}
                            </span>

                        </div>


                        <button
                            type="button"
                            class="view-btn"
                            data-service-id="${escapeAttribute(
                                service.id
                            )}"
                        >
                            View Service
                        </button>

                    </div>

                </div>

            </article>
        `;
    }


    /* ==========================================
       PRICE FORMAT
    ========================================== */

    function formatPrice(
        value
    ) {

        return new Intl.NumberFormat(
            "en-US",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        ).format(
            Number(value || 0)
        );
    }


    /* ==========================================
       ESCAPE HTML
    ========================================== */

    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    function escapeAttribute(
        value
    ) {

        return escapeHTML(
            value
        );
    }

});