document.addEventListener("DOMContentLoaded", async () => {

    const supabase = window.supabaseClient;

    const grid = document.getElementById("servicesGrid");
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");

    let allServices = [];

    if (!supabase) {
        grid.innerHTML = `
            <div class="empty">
                <h3>Supabase is not configured</h3>
                <p>Please configure js/supabase-config.js first.</p>
            </div>
        `;
        return;
    }

    await loadProfile();
    await loadServices();

    searchInput.addEventListener("input", filterServices);
    categoryFilter.addEventListener("change", filterServices);

    async function loadProfile() {

        const {
            data: {
                user
            }
        } = await supabase.auth.getUser();

        if (!user) {
            return;
        }

        const profileInitial =
            document.getElementById("profileInitial");

        const profileImage =
            document.getElementById("profileImage");

        const {
            data: profile
        } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

        const name =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            user.email ||
            "NOVA";

        profileInitial.textContent =
            name.charAt(0).toUpperCase();

        if (profile?.avatar_url) {
            profileImage.src = profile.avatar_url;
            profileImage.style.display = "block";
            profileInitial.style.display = "none";
        }
    }

    async function loadServices() {

        grid.innerHTML = `
            <div class="loader">
                Loading services...
            </div>
        `;

        const {
            data,
            error
        } = await supabase
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
                status
            `)
            .eq("status", "published")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            console.error(error);

            grid.innerHTML = `
                <div class="empty">
                    <h3>Unable to load services</h3>
                    <p>${escapeHTML(error.message)}</p>
                </div>
            `;

            return;
        }

        allServices = data || [];

        await attachWorkers(allServices);

        renderServices(allServices);
    }

    async function attachWorkers(services) {

        if (!services.length) {
            return;
        }

        const workerIds = [
            ...new Set(
                services.map(service => service.worker_id)
            )
        ];

        const {
            data: profiles,
            error
        } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", workerIds);

        if (error) {
            console.warn(
                "Could not load worker profiles:",
                error
            );

            return;
        }

        const profileMap = {};

        (profiles || []).forEach(profile => {
            profileMap[profile.id] = profile;
        });

        services.forEach(service => {

            service.worker =
                profileMap[service.worker_id] || null;

        });
    }

    function filterServices() {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();

        const category =
            categoryFilter.value;

        const filtered =
            allServices.filter(service => {

                const matchesSearch =
                    !query ||
                    service.title
                        ?.toLowerCase()
                        .includes(query) ||
                    service.description
                        ?.toLowerCase()
                        .includes(query) ||
                    service.category
                        ?.toLowerCase()
                        .includes(query);

                const matchesCategory =
                    category === "all" ||
                    service.category === category;

                return (
                    matchesSearch &&
                    matchesCategory
                );
            });

        renderServices(filtered);
    }

    function renderServices(services) {

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
                .map(service => createServiceCard(service))
                .join("");

        document
            .querySelectorAll("[data-service-id]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.serviceId;

                        const service =
                            allServices.find(
                                item => item.id === id
                            );

                        if (!service) {
                            return;
                        }

                        const slug =
                            service.slug ||
                            service.id;

                        window.location.href =
                            `service.html?slug=${encodeURIComponent(slug)}`;
                    }
                );
            });
    }

    function createServiceCard(service) {

        const worker =
            service.worker;

        const workerName =
            worker?.full_name ||
            "NOVA Worker";

        const initial =
            workerName
                .charAt(0)
                .toUpperCase();

        const avatar =
            worker?.avatar_url
                ? `
                    <img
                        class="worker-avatar"
                        src="${escapeAttribute(worker.avatar_url)}"
                        alt="${escapeAttribute(workerName)}"
                    >
                `
                : `
                    <div class="worker-avatar"
                         style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:12px;
                            font-weight:700;
                         ">
                        ${escapeHTML(initial)}
                    </div>
                `;

        const image =
            service.image_url
                ? `
                    <img
                        src="${escapeAttribute(service.image_url)}"
                        alt="${escapeAttribute(service.title)}"
                        loading="lazy"
                    >
                `
                : `
                    <div class="service-placeholder">
                        N
                    </div>
                `;

        return `
            <article class="service-card">

                <div class="service-image">
                    ${image}
                </div>

                <div class="service-content">

                    <span class="category">
                        ${escapeHTML(service.category)}
                    </span>

                    <h2 class="service-title">
                        ${escapeHTML(service.title)}
                    </h2>

                    <p class="service-description">
                        ${escapeHTML(
                            service.description ||
                            "Professional digital service from a NOVA worker."
                        )}
                    </p>

                    <div class="service-meta">

                        <div class="price">
                            $${Number(service.price || 0).toFixed(2)}
                        </div>

                        <div class="delivery">
                            ${Number(service.delivery_days || 1)}
                            day${Number(service.delivery_days || 1) !== 1 ? "s" : ""}
                        </div>

                    </div>

                    <div class="service-footer">

                        <div class="worker">
                            ${avatar}

                            <span class="worker-name">
                                ${escapeHTML(workerName)}
                            </span>
                        </div>

                        <button
                            class="view-btn"
                            data-service-id="${escapeAttribute(service.id)}"
                        >
                            View Service
                        </button>

                    </div>

                </div>

            </article>
        `;
    }

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttribute(value) {
        return escapeHTML(value);
    }

});