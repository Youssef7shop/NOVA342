"use strict";

console.log("NOVA order.js LOADED");


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const supabase =
            window.supabaseClient;


        const loadingState =
            document.getElementById(
                "loadingState"
            );


        const errorState =
            document.getElementById(
                "errorState"
            );


        const checkoutContent =
            document.getElementById(
                "checkoutContent"
            );


        const errorMessage =
            document.getElementById(
                "errorMessage"
            );


        function showError(message) {

            console.error(
                "NOVA ORDER ERROR:",
                message
            );


            if (loadingState) {

                loadingState.style.display =
                    "none";
            }


            if (checkoutContent) {

                checkoutContent.style.display =
                    "none";
            }


            if (errorState) {

                errorState.style.display =
                    "block";
            }


            if (errorMessage) {

                errorMessage.textContent =
                    message;
            }
        }


        function showToast(message) {

            const toast =
                document.getElementById(
                    "toast"
                );


            if (!toast) {
                return;
            }


            toast.textContent =
                message;


            toast.classList.add(
                "show"
            );


            clearTimeout(
                window.novaOrderToast
            );


            window.novaOrderToast =
                setTimeout(() => {

                    toast.classList.remove(
                        "show"
                    );

                }, 3000);
        }


        function formatPrice(value) {

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


        function avatarFallback(name) {

            const initial =
                (name || "N")
                    .charAt(0)
                    .toUpperCase();


            return (
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="200"
                        height="200"
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


        /* ==========================================
           SUPABASE CHECK
        ========================================== */

        if (!supabase) {

            showError(
                "Supabase is not configured. Check js/supabase-config.js."
            );

            return;
        }


        /* ==========================================
           USER CHECK
        ========================================== */

        const {
            data: userData,
            error: userError
        } =
            await supabase.auth.getUser();


        if (userError) {

            showError(
                userError.message
            );

            return;
        }


        const user =
            userData?.user;


        if (!user) {

            window.location.href =
                `login.html?redirect=${encodeURIComponent(
                    window.location.href
                )}`;

            return;
        }


        /* ==========================================
           URL
        ========================================== */

        const params =
            new URLSearchParams(
                window.location.search
            );


        const serviceId =
            params.get("service");


        const slug =
            params.get("slug");


        if (!serviceId && !slug) {

            showError(
                "No service was selected."
            );

            return;
        }


        /* ==========================================
           LOAD SERVICE
        ========================================== */

        let service = null;


        try {

            let result;


            if (serviceId) {

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
                            status
                        `)
                        .eq(
                            "id",
                            serviceId
                        )
                        .maybeSingle();

            } else {

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
                            status
                        `)
                        .eq(
                            "slug",
                            slug
                        )
                        .maybeSingle();
            }


            if (result.error) {

                showError(
                    result.error.message
                );

                return;
            }


            service =
                result.data;


            if (!service) {

                showError(
                    "The selected service was not found."
                );

                return;
            }


            if (
                service.status !== "published"
            ) {

                showError(
                    "This service is not currently available."
                );

                return;
            }


        } catch (error) {

            console.error(
                error
            );


            showError(
                "Unable to load the selected service."
            );

            return;
        }


        /* ==========================================
           WORKER
        ========================================== */

        let worker = null;


        if (service.worker_id) {

            const {
                data
            } =
                await supabase
                    .from("profiles")
                    .select(`
                        id,
                        first_name,
                        last_name,
                        full_name,
                        avatar_url
                    `)
                    .eq(
                        "id",
                        service.worker_id
                    )
                    .maybeSingle();


            worker =
                data || null;
        }


        /* ==========================================
           VALUES
        ========================================== */

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
            Number(
                service.delivery_days || 1
            );


        const workerFullName =
            worker?.full_name ||
            `${worker?.first_name || ""} ${worker?.last_name || ""}`.trim() ||
            "NOVA Worker";


        /* ==========================================
           ELEMENTS
        ========================================== */

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


        const confirmOrderBtn =
            document.getElementById(
                "confirmOrderBtn"
            );


        /* ==========================================
           FILL SERVICE
        ========================================== */

        const fallbackImage =
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1200"
                    height="800"
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

                    serviceImage.src =
                        fallbackImage;
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


        /* ==========================================
           WORKER
        ========================================== */

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


        /* ==========================================
           SUMMARY
        ========================================== */

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


        /* ==========================================
           CONFIRM ORDER
        ========================================== */

        if (confirmOrderBtn) {

            confirmOrderBtn.addEventListener(
                "click",
                async () => {

                    const requirementsValue =
                        requirements?.value
                            ?.trim() || "";


                    const notesValue =
                        notes?.value
                            ?.trim() || "";


                    if (
                        !requirementsValue
                    ) {

                        showToast(
                            "Please add your project requirements."
                        );

                        requirements?.focus();

                        return;
                    }


                    if (
                        !service.worker_id
                    ) {

                        showToast(
                            "This service has no worker assigned."
                        );

                        return;
                    }


                    confirmOrderBtn.disabled =
                        true;


                    confirmOrderBtn.textContent =
                        "Creating Order...";


                    try {

                        /*
                         * NOVA platform fee
                         * Example: 10%
                         *
                         * This is only stored now.
                         * Payment processing comes next.
                         */

                        const platformFee =
                            Number(
                                (
                                    price * 0.10
                                ).toFixed(2)
                            );


                        const workerAmount =
                            Number(
                                (
                                    price -
                                    platformFee
                                ).toFixed(2)
                            );


                        const {
                            data:
                                createdOrder,
                            error
                        } =
                            await supabase
                                .from("orders")
                                .insert({

                                    customer_id:
                                        user.id,

                                    worker_id:
                                        service.worker_id,

                                    service_id:
                                        service.id,

                                    service_title:
                                        title,

                                    service_slug:
                                        service.slug ||
                                        null,

                                    service_description:
                                        description,

                                    category:
                                        category,

                                    price:
                                        price,

                                    delivery_days:
                                        days,

                                    currency:
                                        "MAD",

                                    notes:
                                        notesValue ||
                                        null,

                                    requirements:
                                        requirementsValue,

                                    status:
                                        "pending",

                                    payment_status:
                                        "unpaid",

                                    platform_fee:
                                        platformFee,

                                    worker_amount:
                                        workerAmount

                                })
                                .select()
                                .single();


                        if (error) {

                            console.error(
                                "Create order error:",
                                error
                            );

                            throw error;
                        }


                        console.log(
                            "NOVA ORDER CREATED:",
                            createdOrder
                        );


                        showToast(
                            "Order created successfully!"
                        );


                        /*
                         * Next:
                         * Customer Orders page
                         */

                        setTimeout(() => {

                            window.location.href =
                                `dashboard/orders.html?order=${encodeURIComponent(
                                    createdOrder.id
                                )}`;

                        }, 700);


                    } catch (error) {

                        console.error(
                            "NOVA order creation failed:",
                            error
                        );


                        showToast(
                            error?.message ||
                            "Unable to create order."
                        );


                        confirmOrderBtn.disabled =
                            false;


                        confirmOrderBtn.textContent =
                            "Confirm Order";
                    }
                }
            );
        }


        /* ==========================================
           SHOW
        ========================================== */

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
    }
);