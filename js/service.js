document.addEventListener("DOMContentLoaded", async () => {
    const supabase = window.supabaseClient;

    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const serviceContent = document.getElementById("serviceContent");

    const serviceImage = document.getElementById("serviceImage");
    const serviceTitle = document.getElementById("serviceTitle");
    const serviceDescription = document.getElementById("serviceDescription");

    const categoryBadge = document.getElementById("categoryBadge");

    const workerAvatar = document.getElementById("workerAvatar");
    const workerName = document.getElementById("workerName");
    const workerEmail = document.getElementById("workerEmail");

    const breadcrumbCategory =
        document.getElementById("breadcrumbCategory");

    const breadcrumbTitle =
        document.getElementById("breadcrumbTitle");

    const detailCategory =
        document.getElementById("detailCategory");

    const detailDelivery =
        document.getElementById("detailDelivery");

    const detailPrice =
        document.getElementById("detailPrice");

    const detailStatus =
        document.getElementById("detailStatus");

    const servicePrice =
        document.getElementById("servicePrice");

    const deliveryTime =
        document.getElementById("deliveryTime");

    const orderNowBtn =
        document.getElementById("orderNowBtn");

    const workerProfileBtn =
        document.getElementById("workerProfileBtn");

    const errorMessage =
        document.getElementById("errorMessage");


    /* ========================================
       HELPERS
    ======================================== */

    function showError(message) {
        if (loadingState) {
            loadingState.style.display = "none";
        }

        if (serviceContent) {
            serviceContent.style.display = "none";
        }

        if (errorState) {
            errorState.style.display = "flex";
        }

        if (errorMessage) {
            errorMessage.textContent = message;
        }
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


    function formatPrice(value) {
        const number = Number(value || 0);

        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(number);
    }


    function showToast(message) {
        const toast = document.getElementById("toast");

        if (!toast) {
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(window.novaToastTimer);

        window.novaToastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }


    function getInitials(name) {
        if (!name) {
            return "N";
        }

        const parts = name
            .trim()
            .split(/\s+/)
            .slice(0, 2);

        return parts
            .map(part => part.charAt(0).toUpperCase())
            .join("");
    }


    function generateAvatar(name) {
        const initials = getInitials(name);

        return (
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="200"
                    height="200"
                    viewBox="0 0 200 200"
                >

                    <defs>

                        <linearGradient
                            id="g"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >

                            <stop
                                offset="0%"
                                stop-color="#4f6cff"
                            />

                            <stop
                                offset="100%"
                                stop-color="#8b5cf6"
                            />

                        </linearGradient>

                    </defs>

                    <rect
                        width="200"
                        height="200"
                        rx="45"
                        fill="url(#g)"
                    />

                    <text
                        x="100"
                        y="108"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        fill="white"
                        font-family="Arial"
                        font-size="70"
                        font-weight="700"
                    >
                        ${initials}
                    </text>

                </svg>
            `)
        );
    }


    /* ========================================
       SUPABASE CHECK
    ======================================== */

    if (!supabase) {
        showError(
            "Supabase is not configured. Please check js/supabase-config.js."
        );

        return;
    }


    /* ========================================
       URL SLUG
    ======================================== */

    const params =
        new URLSearchParams(window.location.search);

    const slug =
        params.get("slug");


    if (!slug) {
        showError(
            "No service was selected. Please return to the marketplace and choose a service."
        );

        return;
    }


    /* ========================================
       LOAD SERVICE
    ======================================== */

    try {
        const {
            data: service,
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
                status,
                created_at
            `)
            .eq("slug", slug)
            .eq("status", "published")
            .maybeSingle();


        if (error) {
            console.error(
                "NOVA service error:",
                error
            );

            showError(
                "Unable to load this service. Please try again."
            );

            return;
        }


        if (!service) {
            showError(
                "This service does not exist or is no longer published."
            );

            return;
        }


        /* ========================================
           LOAD WORKER
        ======================================== */

        let worker = null;


        if (service.worker_id) {
            const {
                data: profile,
                error: profileError
            } = await supabase
                .from("profiles")
                .select(`
                    id,
                    first_name,
                    last_name,
                    full_name,
                    avatar_url,
                    role
                `)
                .eq("id", service.worker_id)
                .maybeSingle();


            if (profileError) {
                console.warn(
                    "Worker profile could not be loaded:",
                    profileError
                );
            }


            worker = profile || null;
        }


        /* ========================================
           SERVICE IMAGE
        ======================================== */

        const fallbackImage =
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1200"
                    height="800"
                    viewBox="0 0 1200 800"
                >

                    <defs>

                        <linearGradient
                            id="bg"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >

                            <stop
                                offset="0%"
                                stop-color="#0c1533"
                            />

                            <stop
                                offset="55%"
                                stop-color="#19275f"
                            />

                            <stop
                                offset="100%"
                                stop-color="#34175f"
                            />

                        </linearGradient>

                    </defs>

                    <rect
                        width="1200"
                        height="800"
                        fill="url(#bg)"
                    />

                    <circle
                        cx="250"
                        cy="180"
                        r="250"
                        fill="#4f6cff"
                        opacity=".15"
                    />

                    <circle
                        cx="950"
                        cy="600"
                        r="320"
                        fill="#8b5cf6"
                        opacity=".15"
                    />

                    <text
                        x="600"
                        y="400"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        fill="white"
                        font-family="Arial"
                        font-size="90"
                        font-weight="800"
                    >
                        NOVA
                    </text>

                </svg>
            `);


        if (serviceImage) {
            serviceImage.src =
                service.image_url || fallbackImage;

            serviceImage.alt =
                escapeAttribute(service.title || "NOVA Service");

            serviceImage.onerror = () => {
                serviceImage.src = fallbackImage;
            };
        }


        /* ========================================
           SERVICE INFO
        ======================================== */

        const title =
            service.title || "Untitled Service";

        const description =
            service.description ||
            "Professional digital service from a NOVA worker.";

        const category =
            service.category || "Other";

        const price =
            Number(service.price || 0);

        const deliveryDays =
            Number(service.delivery_days || 1);


        if (serviceTitle) {
            serviceTitle.textContent =
                title;
        }


        if (serviceDescription) {
            serviceDescription.textContent =
                description;
        }


        if (categoryBadge) {
            categoryBadge.textContent =
                category;
        }


        if (breadcrumbCategory) {
            breadcrumbCategory.textContent =
                category;
        }


        if (breadcrumbTitle) {
            breadcrumbTitle.textContent =
                title;
        }


        if (detailCategory) {
            detailCategory.textContent =
                category;
        }


        if (detailDelivery) {
            detailDelivery.textContent =
                `${deliveryDays} day${deliveryDays !== 1 ? "s" : ""}`;
        }


        if (detailPrice) {
            detailPrice.textContent =
                `${formatPrice(price)} MAD`;
        }


        if (detailStatus) {
            detailStatus.textContent =
                "Published";
        }


        if (servicePrice) {
            servicePrice.textContent =
                formatPrice(price);
        }


        if (deliveryTime) {
            deliveryTime.textContent =
                `${deliveryDays} day${deliveryDays !== 1 ? "s" : ""}`;
        }


        /* ========================================
           WORKER INFO
        ======================================== */

        const workerFullName =
            worker?.full_name ||
            `${worker?.first_name || ""} ${worker?.last_name || ""}`.trim() ||
            "NOVA Worker";


        if (workerName) {
            workerName.textContent =
                workerFullName;
        }


        if (workerEmail) {
            workerEmail.textContent =
                worker?.role === "worker"
                    ? "Professional NOVA Worker"
                    : "NOVA Marketplace Worker";
        }


        if (workerAvatar) {

            workerAvatar.src =
                worker?.avatar_url ||
                generateAvatar(workerFullName);

            workerAvatar.alt =
                `${workerFullName} avatar`;

            workerAvatar.onerror = () => {
                workerAvatar.src =
                    generateAvatar(workerFullName);
            };
        }


        if (workerProfileBtn) {

            if (worker?.id) {

                workerProfileBtn.href =
                    `profile.html?id=${encodeURIComponent(worker.id)}`;

            } else {

                workerProfileBtn.style.display =
                    "none";
            }
        }


        /* ========================================
           ORDER NOW
        ======================================== */

        if (orderNowBtn) {

            orderNowBtn.addEventListener(
                "click",
                async () => {

                    try {

                        const {
                            data: authData,
                            error: authError
                        } = await supabase.auth.getUser();


                        if (authError) {
                            console.error(
                                "Auth error:",
                                authError
                            );
                        }


                        const user =
                            authData?.user;


                        if (!user) {

                            showToast(
                                "Please login first to order this service."
                            );


                            setTimeout(() => {

                                const redirect =
                                    encodeURIComponent(
                                        window.location.href
                                    );


                                window.location.href =
                                    `login.html?redirect=${redirect}`;

                            }, 900);


                            return;
                        }


                        /*
                         * Order flow will be connected
                         * to the orders table.
                         *
                         * For now we send the service
                         * information to the checkout page.
                         */

                        const orderParams =
                            new URLSearchParams({

                                service:
                                    service.id,

                                slug:
                                    service.slug,

                                title:
                                    service.title,

                                price:
                                    String(service.price),

                                worker:
                                    service.worker_id

                            });


                        window.location.href =
                            `order.html?${orderParams.toString()}`;

                    } catch (error) {

                        console.error(
                            "Order button error:",
                            error
                        );

                        showToast(
                            "Something went wrong. Please try again."
                        );
                    }
                }
            );
        }


        /* ========================================
           PAGE TITLE
        ======================================== */

        document.title =
            `NOVA — ${title}`;


        /* ========================================
           SHOW PAGE
        ======================================== */

        if (loadingState) {
            loadingState.style.display =
                "none";
        }


        if (errorState) {
            errorState.style.display =
                "none";
        }


        if (serviceContent) {
            serviceContent.style.display =
                "block";
        }


    } catch (error) {

        console.error(
            "Unexpected NOVA service error:",
            error
        );

        showError(
            "Something went wrong while loading the service."
        );
    }
});