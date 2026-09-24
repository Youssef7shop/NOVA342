"use strict";

console.log("NOVA service.js LOADED");

document.addEventListener("DOMContentLoaded", async () => {

    console.log("NOVA service.js DOM READY");

    const loadingState =
        document.getElementById("loadingState");

    const errorState =
        document.getElementById("errorState");

    const serviceContent =
        document.getElementById("serviceContent");

    const errorMessage =
        document.getElementById("errorMessage");


    /* ==========================================
       SHOW ERROR
    ========================================== */

    function showError(message) {

        console.error(
            "NOVA SERVICE ERROR:",
            message
        );

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


    /* ==========================================
       TOAST
    ========================================== */

    function showToast(message) {

        const toast =
            document.getElementById("toast");

        if (!toast) {
            return;
        }

        toast.textContent = message;

        toast.classList.add("show");

        clearTimeout(
            window.novaToastTimer
        );

        window.novaToastTimer =
            setTimeout(() => {

                toast.classList.remove(
                    "show"
                );

            }, 3000);
    }


    /* ==========================================
       SUPABASE
    ========================================== */

    try {

        const supabase =
            window.supabaseClient;


        console.log(
            "NOVA supabaseClient:",
            !!supabase
        );


        if (!supabase) {

            showError(
                "Supabase client is missing. Check js/supabase-config.js."
            );

            return;
        }


        /* =======================================
           URL PARAMETERS
        ======================================= */

        const params =
            new URLSearchParams(
                window.location.search
            );


        const id =
            params.get("id");


        const slug =
            params.get("slug");


        console.log(
            "NOVA URL PARAMETERS:",
            {
                id,
                slug
            }
        );


        if (!id && !slug) {

            showError(
                "No service ID or slug was found in the URL."
            );

            return;
        }


        /* =======================================
           SERVICE QUERY
        ======================================= */

        let result;


        if (slug) {

            console.log(
                "Searching by slug:",
                slug
            );


            result =
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
                        "slug",
                        slug
                    )
                    .eq(
                        "status",
                        "published"
                    )
                    .maybeSingle();

        } else {

            console.log(
                "Searching by ID:",
                id
            );


            result =
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
                        "id",
                        id
                    )
                    .eq(
                        "status",
                        "published"
                    )
                    .maybeSingle();
        }


        console.log(
            "NOVA SERVICE RESPONSE:",
            result
        );


        if (result.error) {

            showError(
                result.error.message
            );

            return;
        }


        const service =
            result.data;


        if (!service) {

            showError(
                "Service not found. Make sure the service exists and its status is published."
            );

            return;
        }


        console.log(
            "NOVA SERVICE FOUND:",
            service
        );


        /* =======================================
           SERVICE VALUES
        ======================================= */

        const title =
            service.title ||
            "Untitled Service";


        const description =
            service.description ||
            "Professional digital service from a NOVA worker.";


        const category =
            service.category ||
            "Other";


        const price =
            Number(
                service.price || 0
            );


        const days =
            Number(
                service.delivery_days || 1
            );


        /* =======================================
           ELEMENTS
        ======================================= */

        const serviceImage =
            document.getElementById(
                "serviceImage"
            );


        const serviceTitle =
            document.getElementById(
                "serviceTitle"
            );


        const serviceDescription =
            document.getElementById(
                "serviceDescription"
            );


        const categoryBadge =
            document.getElementById(
                "categoryBadge"
            );


        const breadcrumbCategory =
            document.getElementById(
                "breadcrumbCategory"
            );


        const breadcrumbTitle =
            document.getElementById(
                "breadcrumbTitle"
            );


        const detailCategory =
            document.getElementById(
                "detailCategory"
            );


        const detailDelivery =
            document.getElementById(
                "detailDelivery"
            );


        const detailPrice =
            document.getElementById(
                "detailPrice"
            );


        const detailStatus =
            document.getElementById(
                "detailStatus"
            );


        const servicePrice =
            document.getElementById(
                "servicePrice"
            );


        const deliveryTime =
            document.getElementById(
                "deliveryTime"
            );


        /* =======================================
           FALLBACK IMAGE
        ======================================= */

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
                            id="novaBg"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >

                            <stop
                                offset="0%"
                                stop-color="#101b45"
                            />

                            <stop
                                offset="100%"
                                stop-color="#391766"
                            />

                        </linearGradient>

                    </defs>


                    <rect
                        width="1200"
                        height="800"
                        fill="url(#novaBg)"
                    />


                    <circle
                        cx="220"
                        cy="160"
                        r="220"
                        fill="#536dff"
                        opacity=".15"
                    />


                    <circle
                        cx="970"
                        cy="620"
                        r="280"
                        fill="#8b5cf6"
                        opacity=".14"
                    />


                    <text
                        x="600"
                        y="420"
                        text-anchor="middle"
                        fill="white"
                        font-family="Arial"
                        font-size="100"
                        font-weight="800"
                    >
                        NOVA
                    </text>

                </svg>
            `);


        /* =======================================
           IMAGE
        ======================================= */

        if (serviceImage) {

            serviceImage.src =
                service.image_url ||
                fallbackImage;


            serviceImage.alt =
                title;


            serviceImage.onerror =
                () => {

                    serviceImage.src =
                        fallbackImage;
                };
        }


        /* =======================================
           TEXT
        ======================================= */

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
                `${days} day${days === 1 ? "" : "s"}`;
        }


        if (detailPrice) {

            detailPrice.textContent =
                `${price} MAD`;
        }


        if (detailStatus) {

            detailStatus.textContent =
                "Published";
        }


        if (servicePrice) {

            servicePrice.textContent =
                price;
        }


        if (deliveryTime) {

            deliveryTime.textContent =
                `${days} day${days === 1 ? "" : "s"}`;
        }


        /* =======================================
           WORKER
        ======================================= */

        const workerNameElement =
            document.getElementById(
                "workerName"
            );


        const workerEmailElement =
            document.getElementById(
                "workerEmail"
            );


        const workerAvatarElement =
            document.getElementById(
                "workerAvatar"
            );


        const workerProfileBtn =
            document.getElementById(
                "workerProfileBtn"
            );


        let worker = null;


        if (service.worker_id) {

            console.log(
                "Loading worker:",
                service.worker_id
            );


            const workerResult =
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
                    .eq(
                        "id",
                        service.worker_id
                    )
                    .maybeSingle();


            console.log(
                "NOVA WORKER RESPONSE:",
                workerResult
            );


            if (workerResult.error) {

                console.warn(
                    "Worker loading failed:",
                    workerResult.error
                );

            } else {

                worker =
                    workerResult.data;
            }
        }


        const workerFullName =
            worker?.full_name ||
            `${worker?.first_name || ""} ${worker?.last_name || ""}`.trim() ||
            "NOVA Worker";


        if (workerNameElement) {

            workerNameElement.textContent =
                workerFullName;
        }


        if (workerEmailElement) {

            workerEmailElement.textContent =
                "Professional NOVA Worker";
        }


        /* =======================================
           WORKER AVATAR
        ======================================= */

        if (workerAvatarElement) {

            if (worker?.avatar_url) {

                workerAvatarElement.src =
                    worker.avatar_url;

            } else {

                const initial =
                    workerFullName
                        .charAt(0)
                        .toUpperCase();


                workerAvatarElement.src =
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
                                    id="workerBg"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="100%"
                                >

                                    <stop
                                        offset="0%"
                                        stop-color="#536dff"
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
                                rx="40"
                                fill="url(#workerBg)"
                            />


                            <text
                                x="100"
                                y="110"
                                text-anchor="middle"
                                dominant-baseline="middle"
                                fill="white"
                                font-family="Arial"
                                font-size="75"
                                font-weight="700"
                            >
                                ${initial}
                            </text>

                        </svg>
                    `);
            }


            workerAvatarElement.onerror =
                () => {

                    workerAvatarElement.src =
                        fallbackImage;
                };
        }


        /* =======================================
           WORKER PROFILE
        ======================================= */

        if (
            workerProfileBtn &&
            worker?.id
        ) {

            workerProfileBtn.href =
                `profile.html?id=${encodeURIComponent(
                    worker.id
                )}`;

        } else if (workerProfileBtn) {

            workerProfileBtn.style.display =
                "none";
        }


        /* =======================================
           ORDER NOW
        ======================================= */

        const orderNowBtn =
            document.getElementById(
                "orderNowBtn"
            );


        if (orderNowBtn) {

            orderNowBtn.onclick =
                async () => {

                    try {

                        const {
                            data,
                            error
                        } =
                            await supabase.auth
                                .getUser();


                        if (error) {
                            throw error;
                        }


                        const user =
                            data?.user;


                        if (!user) {

                            window.location.href =
                                `login.html?redirect=${encodeURIComponent(
                                    window.location.href
                                )}`;

                            return;
                        }


                        const orderParams =
                            new URLSearchParams();


                        orderParams.set(
                            "service",
                            service.id
                        );


                        orderParams.set(
                            "slug",
                            service.slug || ""
                        );


                        window.location.href =
                            `order.html?${orderParams.toString()}`;


                    } catch (error) {

                        console.error(
                            "NOVA Order Error:",
                            error
                        );


                        showToast(
                            "Something went wrong. Please try again."
                        );
                    }
                };
        }


        /* =======================================
           SHOW SERVICE
        ======================================= */

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


        document.title =
            `NOVA MARKET — ${title}`;


        console.log(
            "NOVA SERVICE PAGE READY"
        );


    } catch (error) {

        console.error(
            "NOVA FATAL SERVICE ERROR:",
            error
        );


        showError(
            error?.message ||
            "Unexpected error while loading service."
        );
    }
});