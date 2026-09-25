"use strict";

console.log("NOVA order.js LOADED");

document.addEventListener("DOMContentLoaded", async () => {
    const supabase = window.supabaseClient;

    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const checkoutContent = document.getElementById("checkoutContent");
    const errorMessage = document.getElementById("errorMessage");
    const confirmOrderBtn = document.getElementById("confirmOrderBtn");

    function showError(message) {
        console.error("NOVA ORDER ERROR:", message);

        if (loadingState) {
            loadingState.style.display = "none";
        }

        if (checkoutContent) {
            checkoutContent.style.display = "none";
        }

        if (errorState) {
            errorState.style.display = "block";
        }

        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }

    function showToast(message) {
        const toast = document.getElementById("toast");

        if (!toast) {
            console.warn("NOVA: #toast element not found.");
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(window.novaOrderToast);

        window.novaOrderToast = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    function formatPrice(value) {
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(Number(value || 0));
    }

    function avatarFallback(name) {
        const initial = String(name || "N")
            .charAt(0)
            .toUpperCase();

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
                        fill="url(#g)"
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
            `)
        );
    }

    function isValidUUID(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            String(value || "")
        );
    }

    function extractOrderId(data) {
        if (!data) {
            return null;
        }

        if (typeof data === "string") {
            return isValidUUID(data) ? data : null;
        }

        if (Array.isArray(data)) {
            return data.length ? extractOrderId(data[0]) : null;
        }

        if (typeof data === "object") {
            const possibleId =
                data.id ||
                data.order_id ||
                data.created_order_id;

            return isValidUUID(possibleId)
                ? possibleId
                : null;
        }

        return null;
    }

    if (!supabase) {
        showError(
            "Supabase is not configured. Check js/supabase-config.js."
        );
        return;
    }

    let user = null;

    try {
        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            showError(userError.message);
            return;
        }

        user = userData?.user || null;
    } catch (error) {
        console.error("NOVA user check:", error);

        showError(
            "Unable to verify your account."
        );

        return;
    }

    if (!user) {
        window.location.href =
            `login.html?redirect=${encodeURIComponent(
                window.location.href
            )}`;

        return;
    }

    const params =
        new URLSearchParams(
            window.location.search
        );

    const serviceId =
        params.get("service") ||
        params.get("id");

    const slug =
        params.get("slug");

    if (!serviceId && !slug) {
        showError("No service was selected.");
        return;
    }

    let service = null;

    try {
        let query =
            supabase
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
                `);

        if (serviceId) {
            if (!isValidUUID(serviceId)) {
                showError(
                    "The selected service ID is invalid."
                );
                return;
            }

            query =
                query.eq(
                    "id",
                    serviceId
                );
        } else {
            query =
                query.eq(
                    "slug",
                    slug
                );
        }

        const {
            data,
            error
        } = await query.maybeSingle();

        if (error) {
            console.error(
                "NOVA service error:",
                error
            );

            showError(
                error.message ||
                "Unable to load the selected service."
            );

            return;
        }

        service = data;

        if (!service) {
            showError(
                "The selected service was not found."
            );
            return;
        }

        if (service.status !== "published") {
            showError(
                "This service is not currently available."
            );
            return;
        }

        if (!service.worker_id) {
            showError(
                "This service has no worker assigned."
            );
            return;
        }

    } catch (error) {
        console.error(
            "NOVA service loading:",
            error
        );

        showError(
            "Unable to load the selected service."
        );

        return;
    }

    let worker = null;

    try {
        const {
            data,
            error
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
            .eq(
                "id",
                service.worker_id
            )
            .maybeSingle();

        if (error) {
            console.warn(
                "NOVA worker profile:",
                error.message
            );
        } else {
            worker = data || null;
        }

    } catch (error) {
        console.warn(
            "Worker profile could not be loaded:",
            error
        );
    }

    const title =
        service.title ||
        "Untitled Service";

    const description =
        service.description ||
        "Professional digital service.";

    const category =
        service.category ||
        "Other";

    const price =
        Number(
            service.price || 0
        );

    const days =
        Math.max(
            1,
            Number(
                service.delivery_days || 1
            )
        );

    const workerFullName =
        worker?.full_name ||
        [
            worker?.first_name,
            worker?.last_name
        ]
            .filter(Boolean)
            .join(" ") ||
        "NOVA Worker";

    const serviceImage =
        document.getElementById(
            "serviceImage"
        );

    const serviceCategory =
        document.getElementById(
            "serviceCategory"
        );

    const serviceTitle =
        document.getElementById(
            "serviceTitle"
        );

    const serviceDescription =
        document.getElementById(
            "serviceDescription"
        );

    const metaPrice =
        document.getElementById(
            "metaPrice"
        );

    const metaDelivery =
        document.getElementById(
            "metaDelivery"
        );

    const metaStatus =
        document.getElementById(
            "metaStatus"
        );

    const workerAvatar =
        document.getElementById(
            "workerAvatar"
        );

    const workerName =
        document.getElementById(
            "workerName"
        );

    const summaryService =
        document.getElementById(
            "summaryService"
        );

    const summaryDelivery =
        document.getElementById(
            "summaryDelivery"
        );

    const totalPrice =
        document.getElementById(
            "totalPrice"
        );

    const requirements =
        document.getElementById(
            "requirements"
        );

    const notes =
        document.getElementById(
            "notes"
        );

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
                    fill="url(#bg)"
                />

                <text
                    x="600"
                    y="410"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    fill="white"
                    font-family="Arial"
                    font-size="95"
                    font-weight="800"
                >
                    NOVA
                </text>
            </svg>
        `);

    if (serviceImage) {
        serviceImage.src =
            service.image_url ||
            fallbackImage;

        serviceImage.alt =
            title;

        serviceImage.onerror =
            () => {
                if (
                    serviceImage.src !==
                    fallbackImage
                ) {
                    serviceImage.src =
                        fallbackImage;
                }
            };
    }

    if (serviceCategory) {
        serviceCategory.textContent =
            category;
    }

    if (serviceTitle) {
        serviceTitle.textContent =
            title;
    }

    if (serviceDescription) {
        serviceDescription.textContent =
            description;
    }

    if (metaPrice) {
        metaPrice.textContent =
            `${formatPrice(price)} MAD`;
    }

    if (metaDelivery) {
        metaDelivery.textContent =
            `${days} day${days === 1 ? "" : "s"}`;
    }

    if (metaStatus) {
        metaStatus.textContent =
            "Published";
    }

    if (workerName) {
        workerName.textContent =
            workerFullName;
    }

    if (workerAvatar) {
        workerAvatar.src =
            worker?.avatar_url ||
            avatarFallback(
                workerFullName
            );

        workerAvatar.alt =
            workerFullName;

        workerAvatar.onerror =
            () => {
                workerAvatar.src =
                    avatarFallback(
                        workerFullName
                    );
            };
    }

    if (summaryService) {
        summaryService.textContent =
            title;
    }

    if (summaryDelivery) {
        summaryDelivery.textContent =
            `${days} day${days === 1 ? "" : "s"}`;
    }

    if (totalPrice) {
        totalPrice.textContent =
            formatPrice(price);
    }

    document.title =
        `NOVA MARKET — Checkout — ${title}`;

    if (confirmOrderBtn) {

        confirmOrderBtn.type =
            "button";

        confirmOrderBtn.addEventListener(
            "click",
            async () => {

                const requirementsValue =
                    requirements?.value
                        ?.trim() ||
                    "";

                const notesValue =
                    notes?.value
                        ?.trim() ||
                    "";

                if (!requirementsValue) {

                    showToast(
                        "Please add your project requirements."
                    );

                    requirements?.focus();

                    return;
                }

                if (
                    !service.id ||
                    !service.worker_id
                ) {

                    showToast(
                        "This service is not available for ordering."
                    );

                    return;
                }

                const originalText =
                    confirmOrderBtn.textContent;

                confirmOrderBtn.disabled =
                    true;

                confirmOrderBtn.textContent =
                    "Creating Order...";

                try {

                    console.log(
                        "NOVA: Creating order via secure RPC..."
                    );

                    /*
                     * IMPORTANT:
                     * No direct INSERT into public.orders.
                     *
                     * create_order() handles:
                     * - customer_id
                     * - worker_id
                     * - service information
                     * - price
                     * - delivery time
                     * - platform fee
                     * - worker amount
                     * - initial status
                     * - payment status
                     */

                    const {
                        data,
                        error
                    } = await supabase.rpc(
                        "create_order",
                        {
                            p_service_id:
                                service.id,

                            p_requirements:
                                requirementsValue,

                            p_notes:
                                notesValue ||
                                null
                        }
                    );

                    if (error) {

                        console.error(
                            "NOVA create_order RPC error:",
                            error
                        );

                        throw error;
                    }

                    console.log(
                        "NOVA create_order RPC result:",
                        data
                    );

                    const orderId =
                        extractOrderId(
                            data
                        );

                    if (!orderId) {

                        throw new Error(
                            "Order was created, but no order ID was returned."
                        );
                    }

                    showToast(
                        "Order created successfully!"
                    );

                    /*
                     * DIRECTLY OPEN ORDER DETAILS
                     */

                    setTimeout(
                        () => {

                            window.location.href =
                                `dashboard/order-details.html?id=${encodeURIComponent(
                                    orderId
                                )}`;

                        },
                        700
                    );

                } catch (error) {

                    console.error(
                        "NOVA order creation failed:",
                        error
                    );

                    let message =
                        error?.message ||
                        "Unable to create order.";

                    if (
                        /permission denied for table orders/i
                            .test(message)
                    ) {

                        message =
                            "Order creation is not configured correctly in Supabase.";
                    }

                    else if (
                        /function .*create_order/i
                            .test(message)
                    ) {

                        message =
                            "The create_order function is not configured correctly in Supabase.";
                    }

                    else if (
                        /not authenticated/i
                            .test(message)
                    ) {

                        message =
                            "Your session has expired. Please login again.";
                    }

                    showToast(
                        message
                    );

                    confirmOrderBtn.disabled =
                        false;

                    confirmOrderBtn.textContent =
                        originalText ||
                        "Confirm Order";
                }
            }
        );
    }

    if (loadingState) {
        loadingState.style.display =
            "none";
    }

    if (errorState) {
        errorState.style.display =
            "none";
    }

    if (checkoutContent) {
        checkoutContent.style.display =
            "block";
    }

    console.log(
        "NOVA CHECKOUT READY"
    );
});