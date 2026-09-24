"use strict";

console.log("NOVA services.js LOADED");


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "NOVA services.js DOM READY"
        );


        /* =================================================
           SUPABASE
        ================================================= */

        const supabase =
            window.supabaseClient;


        /* =================================================
           ELEMENTS
        ================================================= */

        const grid =
            document.getElementById(
                "servicesGrid"
            );


        const searchInput =
            document.getElementById(
                "searchInput"
            );


        const categoryFilter =
            document.getElementById(
                "categoryFilter"
            );


        let allServices = [];

        let currentUser = null;

        /*
         * service_id -> favorite_id
         */
        const favoriteMap =
            new Map();


        /* =================================================
           CHECK GRID
        ================================================= */

        if (!grid) {

            console.error(
                "NOVA: servicesGrid not found."
            );

            return;
        }


        /* =================================================
           CHECK SUPABASE
        ================================================= */

        if (!supabase) {

            console.error(
                "NOVA: Supabase client not found."
            );


            grid.innerHTML = `
                <div class="empty">

                    <h3>
                        Supabase is not configured
                    </h3>

                    <p>
                        Check js/supabase-config.js
                    </p>

                </div>
            `;

            return;
        }


        /* =================================================
           START
        ================================================= */

        await loadProfile();

        await loadFavoriteState();

        await loadServices();


        /* =================================================
           FILTER EVENTS
        ================================================= */

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


        /* =================================================
           LOAD PROFILE
        ================================================= */

        async function loadProfile() {

            try {

                const {
                    data,
                    error
                } =
                    await supabase
                        .auth
                        .getUser();


                if (error) {

                    console.warn(
                        "NOVA auth user error:",
                        error
                    );

                    return;
                }


                const user =
                    data?.user || null;


                currentUser =
                    user;


                /*
                 * Profile UI
                 */

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
                        .eq(
                            "id",
                            user.id
                        )
                        .maybeSingle();


                if (profileError) {

                    console.warn(
                        "NOVA profile error:",
                        profileError
                    );
                }


                const fullName =
                    profile?.full_name ||
                    `${profile?.first_name || ""} ${profile?.last_name || ""}`
                        .trim() ||
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
                }


            } catch (error) {

                console.warn(
                    "NOVA profile loading:",
                    error
                );
            }
        }


        /* =================================================
           LOAD FAVORITES
        ================================================= */

        async function loadFavoriteState() {

            favoriteMap.clear();


            /*
             * User is not logged in.
             * Services remain public.
             */

            if (!currentUser) {
                return;
            }


            /*
             * First try RPC.
             */

            try {

                const {
                    data,
                    error
                } =
                    await supabase.rpc(
                        "get_my_favorites"
                    );


                if (!error) {

                    const favorites =
                        Array.isArray(data)
                            ? data
                            : [];


                    favorites.forEach(
                        (favorite) => {

                            if (
                                favorite.service_id &&
                                favorite.favorite_id
                            ) {

                                favoriteMap.set(
                                    favorite.service_id,
                                    favorite.favorite_id
                                );
                            }
                        }
                    );


                    console.log(
                        "NOVA favorites loaded:",
                        favoriteMap.size
                    );


                    return;
                }


                console.warn(
                    "NOVA get_my_favorites RPC unavailable:",
                    error
                );


            } catch (error) {

                console.warn(
                    "NOVA favorites RPC failed:",
                    error
                );
            }


            /*
             * Fallback:
             * Read own favorites directly.
             */

            try {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from(
                            "favorite_services"
                        )
                        .select(`
                            id,
                            service_id
                        `)
                        .eq(
                            "user_id",
                            currentUser.id
                        );


                if (error) {

                    console.warn(
                        "NOVA favorite fallback failed:",
                        error
                    );

                    return;
                }


                (
                    Array.isArray(data)
                        ? data
                        : []
                ).forEach(
                    (favorite) => {

                        if (
                            favorite.service_id &&
                            favorite.id
                        ) {

                            favoriteMap.set(
                                favorite.service_id,
                                favorite.id
                            );
                        }
                    }
                );


            } catch (error) {

                console.warn(
                    "NOVA favorite fallback error:",
                    error
                );
            }
        }


        /* =================================================
           LOAD SERVICES
        ================================================= */

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
                        .eq(
                            "status",
                            "published"
                        )
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

                            <h3>
                                Unable to load services
                            </h3>

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

                        <h3>
                            Something went wrong
                        </h3>

                        <p>
                            Please refresh the page.
                        </p>

                    </div>
                `;
            }
        }


        /* =================================================
           ATTACH WORKERS
        ================================================= */

        async function attachWorkers(
            services
        ) {

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
                    "Worker profiles error:",
                    error
                );

                return;
            }


            const map = {};


            (
                profiles || []
            ).forEach(
                profile => {

                    map[
                        profile.id
                    ] = profile;
                }
            );


            services.forEach(
                service => {

                    service.worker =
                        map[
                            service.worker_id
                        ] || null;
                }
            );
        }


        /* =================================================
           FILTER SERVICES
        ================================================= */

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


        /* =================================================
           RENDER SERVICES
        ================================================= */

        function renderServices(
            services
        ) {

            if (!services.length) {

                grid.innerHTML = `
                    <div class="empty">

                        <h3>
                            No services found
                        </h3>

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
                        createServiceCard
                    )
                    .join("");


            /*
             * VIEW BUTTONS
             */

            grid
                .querySelectorAll(
                    ".view-btn[data-service-id]"
                )
                .forEach(
                    button => {

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
                                        "NOVA service not found:",
                                        serviceId
                                    );

                                    return;
                                }


                                const params =
                                    new URLSearchParams();


                                /*
                                 * Send ID
                                 */

                                params.set(
                                    "id",
                                    service.id
                                );


                                /*
                                 * Send SLUG
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
                                    "NOVA opening:",
                                    url
                                );


                                window.location.href =
                                    url;
                            }
                        );
                    }
                );


            /*
             * FAVORITE BUTTONS
             */

            grid
                .querySelectorAll(
                    ".favorite-btn[data-service-id]"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            async (event) => {

                                event.preventDefault();

                                event.stopPropagation();


                                const serviceId =
                                    button.dataset.serviceId;


                                await toggleFavorite(
                                    serviceId,
                                    button
                                );
                            }
                        );
                    }
                );
        }


        /* =================================================
           TOGGLE FAVORITE
        ================================================= */

        async function toggleFavorite(
            serviceId,
            button
        ) {

            if (!serviceId) {
                return;
            }


            /*
             * Login required
             */

            if (!currentUser) {

                const redirect =
                    encodeURIComponent(
                        window.location.pathname +
                        window.location.search
                    );


                window.location.href =
                    `login.html?redirect=${redirect}`;


                return;
            }


            const existingFavoriteId =
                favoriteMap.get(
                    serviceId
                );


            button.disabled =
                true;


            const originalHTML =
                button.innerHTML;


            try {

                /*
                 * REMOVE
                 */

                if (existingFavoriteId) {

                    button.innerHTML =
                        "…";


                    const {
                        error
                    } =
                        await supabase.rpc(
                            "remove_favorite",
                            {
                                p_favorite_id:
                                    existingFavoriteId
                            }
                        );


                    if (error) {
                        throw error;
                    }


                    favoriteMap.delete(
                        serviceId
                    );


                    setFavoriteButtonState(
                        button,
                        false
                    );


                    showFavoriteToast(
                        "Removed from favorites."
                    );


                } else {

                    /*
                     * ADD
                     */

                    button.innerHTML =
                        "…";


                    const {
                        data,
                        error
                    } =
                        await supabase.rpc(
                            "add_favorite",
                            {
                                p_service_id:
                                    serviceId
                            }
                        );


                    if (error) {
                        throw error;
                    }


                    const favoriteId =
                        data?.favorite_id;


                    if (favoriteId) {

                        favoriteMap.set(
                            serviceId,
                            favoriteId
                        );

                    } else {

                        /*
                         * Safety fallback:
                         * reload favorite state
                         */

                        await loadFavoriteState();
                    }


                    setFavoriteButtonState(
                        button,
                        true
                    );


                    showFavoriteToast(
                        "Added to favorites."
                    );
                }


            } catch (error) {

                console.error(
                    "NOVA favorite error:",
                    error
                );


                button.innerHTML =
                    originalHTML;


                showFavoriteToast(
                    error?.message ||
                    "Could not update favorite."
                );


            } finally {

                button.disabled =
                    false;
            }
        }


        /* =================================================
           FAVORITE BUTTON STATE
        ================================================= */

        function setFavoriteButtonState(
            button,
            active
        ) {

            if (!button) {
                return;
            }


            button.innerHTML =
                active
                    ? "♥"
                    : "♡";


            button.setAttribute(
                "aria-label",
                active
                    ? "Remove from favorites"
                    : "Add to favorites"
            );


            button.setAttribute(
                "title",
                active
                    ? "Remove from favorites"
                    : "Add to favorites"
            );


            button.dataset.favorite =
                active
                    ? "true"
                    : "false";


            if (active) {

                button.classList.add(
                    "is-favorite"
                );

            } else {

                button.classList.remove(
                    "is-favorite"
                );
            }
        }


        /* =================================================
           TOAST
        ================================================= */

        function showFavoriteToast(
            message
        ) {

            let toast =
                document.getElementById(
                    "novaFavoriteToast"
                );


            if (!toast) {

                toast =
                    document.createElement(
                        "div"
                    );


                toast.id =
                    "novaFavoriteToast";


                toast.style.position =
                    "fixed";

                toast.style.right =
                    "22px";

                toast.style.bottom =
                    "22px";

                toast.style.zIndex =
                    "99999";

                toast.style.padding =
                    "12px 16px";

                toast.style.borderRadius =
                    "12px";

                toast.style.background =
                    "#14151d";

                toast.style.color =
                    "#ffffff";

                toast.style.border =
                    "1px solid rgba(255,255,255,.10)";

                toast.style.boxShadow =
                    "0 20px 60px rgba(0,0,0,.40)";

                toast.style.fontSize =
                    "11px";

                toast.style.fontWeight =
                    "700";

                toast.style.opacity =
                    "0";

                toast.style.transform =
                    "translateY(10px)";

                toast.style.transition =
                    "opacity .2s ease, transform .2s ease";


                document.body.appendChild(
                    toast
                );
            }


            toast.textContent =
                message;


            toast.style.opacity =
                "1";

            toast.style.transform =
                "translateY(0)";


            clearTimeout(
                window.__novaFavoriteToastTimer
            );


            window.__novaFavoriteToastTimer =
                setTimeout(
                    () => {

                        toast.style.opacity =
                            "0";

                        toast.style.transform =
                            "translateY(10px)";

                    },
                    2200
                );
        }


        /* =================================================
           SERVICE CARD
        ================================================= */

        function createServiceCard(
            service
        ) {

            const worker =
                service.worker;


            const workerName =
                worker?.full_name ||
                `${worker?.first_name || ""} ${worker?.last_name || ""}`
                    .trim() ||
                "NOVA Worker";


            const initial =
                workerName
                    .charAt(0)
                    .toUpperCase();


            const price =
                Number(
                    service.price || 0
                );


            const days =
                Number(
                    service.delivery_days || 1
                );


            const isFavorite =
                favoriteMap.has(
                    service.id
                );


            /* ---------------------------------------------
               WORKER AVATAR
            --------------------------------------------- */

            let avatar;


            if (
                worker?.avatar_url
            ) {

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
                    <div class="worker-avatar">
                        ${escapeHTML(
                            initial
                        )}
                    </div>
                `;
            }


            /* ---------------------------------------------
               SERVICE IMAGE
            --------------------------------------------- */

            let image;


            if (
                service.image_url
            ) {

                image = `
                    <img
                        src="${escapeAttribute(
                            service.image_url
                        )}"
                        alt="${escapeAttribute(
                            service.title ||
                            "NOVA Service"
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
                    <div
                        class="service-placeholder"
                    >
                        N
                    </div>
                `;
            }


            /* ---------------------------------------------
               FAVORITE BUTTON
            --------------------------------------------- */

            const favoriteButton = `
                <button
                    type="button"
                    class="favorite-btn"
                    data-service-id="${escapeAttribute(
                        service.id
                    )}"
                    data-favorite="${
                        isFavorite
                            ? "true"
                            : "false"
                    }"
                    aria-label="${
                        isFavorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                    }"
                    title="${
                        isFavorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                    }"
                    style="
                        position:absolute;
                        top:12px;
                        right:12px;
                        width:38px;
                        height:38px;
                        border-radius:50%;
                        border:1px solid rgba(255,255,255,.12);
                        background:rgba(7,7,11,.72);
                        backdrop-filter:blur(10px);
                        color:${
                            isFavorite
                                ? "#ff5fa8"
                                : "#ffffff"
                        };
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:19px;
                        line-height:1;
                        cursor:pointer;
                        z-index:5;
                    "
                >
                    ${
                        isFavorite
                            ? "♥"
                            : "♡"
                    }
                </button>
            `;


            return `
                <article class="service-card">

                    <div
                        class="service-image"
                        style="position:relative;"
                    >

                        ${image}

                        ${favoriteButton}

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
                                ${days}
                                day${days === 1 ? "" : "s"}
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


        /* =================================================
           FORMAT PRICE
        ================================================= */

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


        /* =================================================
           ESCAPE HTML
        ================================================= */

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


        /* =================================================
           ESCAPE ATTRIBUTE
        ================================================= */

        function escapeAttribute(
            value
        ) {

            return escapeHTML(
                value
            );
        }

    }
);