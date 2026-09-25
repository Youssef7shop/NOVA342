"use strict";

console.log("NOVA order-details.js LOADED");


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /* =====================================================
           SUPABASE
        ====================================================== */

        const supabase =
            window.supabaseClient;


        /* =====================================================
           ELEMENTS
        ====================================================== */

        const loadingState =
            document.getElementById(
                "loadingState"
            );

        const errorState =
            document.getElementById(
                "errorState"
            );

        const errorMessage =
            document.getElementById(
                "errorMessage"
            );

        const orderContent =
            document.getElementById(
                "orderContent"
            );

        const toast =
            document.getElementById(
                "toast"
            );


        /* =====================================================
           HELPERS
        ====================================================== */

        function showError(message) {

            console.error(
                "NOVA ORDER DETAILS ERROR:",
                message
            );


            if (loadingState) {

                loadingState.style.display =
                    "none";
            }


            if (orderContent) {

                orderContent.style.display =
                    "none";
            }


            if (errorState) {

                errorState.style.display =
                    "flex";
            }


            if (errorMessage) {

                errorMessage.textContent =
                    message;
            }
        }


        function showToast(message) {

            if (!toast) {
                return;
            }


            toast.textContent =
                message;


            toast.classList.add(
                "show"
            );


            clearTimeout(
                window.novaOrderDetailsToast
            );


            window.novaOrderDetailsToast =
                setTimeout(
                    () => {

                        toast.classList.remove(
                            "show"
                        );

                    },
                    3000
                );
        }


        function setText(
            id,
            value
        ) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    String(
                        value ??
                        ""
                    );
            }
        }


        function formatMoney(
            value,
            currency = "MAD"
        ) {

            const amount =
                Number(
                    value || 0
                );


            return (
                new Intl.NumberFormat(
                    "en-US",
                    {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                    }
                ).format(
                    amount
                ) +
                ` ${currency}`
            );
        }


        function formatDate(
            value,
            detailed = false
        ) {

            if (!value) {
                return "—";
            }


            const date =
                new Date(
                    value
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "—";
            }


            if (detailed) {

                return date.toLocaleString(
                    "en-US",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );
            }


            return date.toLocaleDateString(
                "en-US",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );
        }


        function shortOrderId(
            id
        ) {

            if (!id) {
                return "--------";
            }


            return String(id)
                .replaceAll(
                    "-",
                    ""
                )
                .slice(
                    0,
                    8
                )
                .toUpperCase();
        }


        function isValidUUID(
            value
        ) {

            return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
                .test(
                    String(
                        value || ""
                    )
                );
        }


        function avatarFallback(
            name
        ) {

            const initial =
                String(
                    name || "N"
                )
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
                            rx="50"
                            fill="url(#g)"
                        />


                        <text
                            x="100"
                            y="108"
                            text-anchor="middle"
                            dominant-baseline="middle"
                            fill="white"
                            font-family="Arial"
                            font-size="78"
                            font-weight="700"
                        >
                            ${initial}
                        </text>

                    </svg>
                `)
            );
        }


        function statusLabel(
            status
        ) {

            const labels = {

                pending:
                    "Pending",

                accepted:
                    "Accepted",

                in_progress:
                    "In Progress",

                delivered:
                    "Delivered",

                completed:
                    "Completed",

                cancelled:
                    "Cancelled",

                rejected:
                    "Rejected"

            };


            return (
                labels[
                    String(status || "")
                ] ||
                "Unknown"
            );
        }


        function paymentLabel(
            status
        ) {

            const labels = {

                unpaid:
                    "Unpaid",

                pending:
                    "Payment Pending",

                paid:
                    "Paid",

                failed:
                    "Failed",

                refunded:
                    "Refunded"

            };


            return (
                labels[
                    String(status || "")
                ] ||
                "Unknown"
            );
        }


        /* =====================================================
           SUPABASE CHECK
        ====================================================== */

        if (!supabase) {

            showError(
                "Supabase is not configured. Check js/supabase-config.js."
            );

            return;
        }


        /* =====================================================
           AUTH CHECK
        ====================================================== */

        let currentUser = null;


        try {

            const {
                data,
                error
            } =
                await supabase.auth.getUser();


            if (error) {

                throw error;
            }


            currentUser =
                data?.user ||
                null;


        } catch (error) {

            console.error(
                "NOVA auth error:",
                error
            );


            showError(
                "Unable to verify your account."
            );

            return;
        }


        if (!currentUser) {

            window.location.href =
                `../login.html?redirect=${encodeURIComponent(
                    window.location.href
                )}`;

            return;
        }


        /* =====================================================
           URL ORDER ID
        ====================================================== */

        const params =
            new URLSearchParams(
                window.location.search
            );


        const orderId =
            params.get(
                "id"
            ) ||
            params.get(
                "order"
            );


        if (!orderId) {

            showError(
                "No order was selected."
            );

            return;
        }


        if (!isValidUUID(orderId)) {

            showError(
                "The order ID is invalid."
            );

            return;
        }


        /* =====================================================
           LOAD ORDER
        ====================================================== */

        let order = null;


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("orders")
                    .select(`
                        id,
                        customer_id,
                        worker_id,
                        service_id,
                        service_title,
                        service_slug,
                        service_description,
                        category,
                        price,
                        currency,
                        delivery_days,
                        notes,
                        requirements,
                        status,
                        payment_status,
                        platform_fee,
                        worker_amount,
                        created_at,
                        updated_at
                    `)
                    .eq(
                        "id",
                        orderId
                    )
                    .maybeSingle();


            if (error) {

                throw error;
            }


            order =
                data;


        } catch (error) {

            console.error(
                "NOVA load order:",
                error
            );


            if (
                /permission denied/i
                    .test(
                        error?.message || ""
                    )
            ) {

                showError(
                    "You do not have permission to view this order."
                );

            } else {

                showError(
                    error?.message ||
                    "Unable to load this order."
                );
            }


            return;
        }


        if (!order) {

            showError(
                "Order not found."
            );

            return;
        }


        /* =====================================================
           SECURITY CHECK
        ====================================================== */

        const isCustomer =
            order.customer_id ===
            currentUser.id;


        const isWorker =
            order.worker_id ===
            currentUser.id;


        if (
            !isCustomer &&
            !isWorker
        ) {

            showError(
                "You are not authorized to view this order."
            );

            return;
        }


        /* =====================================================
           LOAD PROFILE
        ====================================================== */

        let customer = null;
        let worker = null;


        try {

            if (order.customer_id) {

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
                            email,
                            avatar_url
                        `)
                        .eq(
                            "id",
                            order.customer_id
                        )
                        .maybeSingle();


                customer =
                    data ||
                    null;
            }


            if (order.worker_id) {

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
                            email,
                            avatar_url
                        `)
                        .eq(
                            "id",
                            order.worker_id
                        )
                        .maybeSingle();


                worker =
                    data ||
                    null;
            }

        } catch (error) {

            console.warn(
                "NOVA profile loading warning:",
                error
            );
        }


        /* =====================================================
           NAMES
        ====================================================== */

        const customerName =
            customer?.full_name ||
            [
                customer?.first_name,
                customer?.last_name
            ]
                .filter(Boolean)
                .join(" ") ||
            customer?.email ||
            "Customer";


        const workerName =
            worker?.full_name ||
            [
                worker?.first_name,
                worker?.last_name
            ]
                .filter(Boolean)
                .join(" ") ||
            worker?.email ||
            "NOVA Worker";


        const currency =
            order.currency ||
            "MAD";


        const status =
            order.status ||
            "pending";


        const paymentStatus =
            order.payment_status ||
            "unpaid";


        /* =====================================================
           PROFILE TOPBAR
        ====================================================== */

        const profileAvatar =
            document.getElementById(
                "profileAvatar"
            );


        const profileName =
            document.getElementById(
                "profileName"
            );


        const profileEmail =
            document.getElementById(
                "profileEmail"
            );


        const currentProfileName =
            customerName;


        if (profileName) {

            profileName.textContent =
                currentProfileName;
        }


        if (profileEmail) {

            profileEmail.textContent =
                customer?.email ||
                currentUser.email ||
                "";
        }


        if (profileAvatar) {

            profileAvatar.src =
                customer?.avatar_url ||
                avatarFallback(
                    currentProfileName
                );


            profileAvatar.alt =
                currentProfileName;


            profileAvatar.onerror =
                () => {

                    profileAvatar.src =
                        avatarFallback(
                            currentProfileName
                        );
                };
        }


        /* =====================================================
           PAGE TITLE
        ====================================================== */

        document.title =
            `NOVA MARKET — Order #${shortOrderId(
                order.id
            )}`;


        setText(
            "orderNumber",
            `#${shortOrderId(
                order.id
            )}`
        );


        /* =====================================================
           MAIN STATUS
        ====================================================== */

        setText(
            "statusMainText",
            statusLabel(
                status
            )
        );


        setText(
            "orderStatusBadge",
            statusLabel(
                status
            )
        );


        setText(
            "paymentStatusBadge",
            `Payment: ${paymentLabel(
                paymentStatus
            )}`
        );


        setText(
            "detailOrderStatus",
            statusLabel(
                status
            )
        );


        setText(
            "detailPaymentStatus",
            paymentLabel(
                paymentStatus
            )
        );


        /* =====================================================
           MAIN STATUS COLOR
        ====================================================== */

        const statusDot =
            document.getElementById(
                "statusMainDot"
            );


        if (statusDot) {

            statusDot.style.background =
                getStatusColor(
                    status
                );

            statusDot.style.boxShadow =
                `0 0 0 4px ${getStatusGlow(
                    status
                )}`;
        }


        const orderStatusBadge =
            document.getElementById(
                "orderStatusBadge"
            );


        if (orderStatusBadge) {

            orderStatusBadge.style.color =
                getStatusColor(
                    status
                );

            orderStatusBadge.style.background =
                getStatusBackground(
                    status
                );
        }


        const paymentStatusBadge =
            document.getElementById(
                "paymentStatusBadge"
            );


        if (paymentStatusBadge) {

            paymentStatusBadge.style.color =
                getPaymentColor(
                    paymentStatus
                );

            paymentStatusBadge.style.background =
                getPaymentBackground(
                    paymentStatus
                );
        }


        /* =====================================================
           SERVICE
        ====================================================== */

        setText(
            "serviceCategory",
            order.category ||
            "Other"
        );


        setText(
            "serviceTitle",
            order.service_title ||
            "NOVA Service"
        );


        setText(
            "serviceDescription",
            order.service_description ||
            "Professional digital service."
        );


        /* =====================================================
           WORKER
        ====================================================== */

        const workerAvatar =
            document.getElementById(
                "workerAvatar"
            );


        if (workerAvatar) {

            workerAvatar.innerHTML = "";


            if (
                worker?.avatar_url
            ) {

                const img =
                    document.createElement(
                        "img"
                    );


                img.src =
                    worker.avatar_url;


                img.alt =
                    workerName;


                img.style.width =
                    "100%";


                img.style.height =
                    "100%";


                img.style.objectFit =
                    "cover";


                workerAvatar.appendChild(
                    img
                );

            } else {

                workerAvatar.textContent =
                    workerName
                        .charAt(0)
                        .toUpperCase();
            }
        }


        setText(
            "workerName",
            workerName
        );


        /* =====================================================
           ORDER INFO
        ====================================================== */

        setText(
            "detailOrderId",
            order.id
        );


        setText(
            "detailDelivery",
            order.delivery_days
                ? `${order.delivery_days} day${
                    Number(
                        order.delivery_days
                    ) === 1
                        ? ""
                        : "s"
                }`
                : "—"
        );


        setText(
            "detailCreated",
            formatDate(
                order.created_at,
                true
            )
        );


        setText(
            "detailUpdated",
            formatDate(
                order.updated_at,
                true
            )
        );


        /* =====================================================
           MONEY
        ====================================================== */

        setText(
            "orderPrice",
            formatMoney(
                order.price,
                ""
            ).trim()
        );


        setText(
            "orderCurrency",
            currency
        );


        setText(
            "servicePrice",
            formatMoney(
                order.price,
                currency
            )
        );


        setText(
            "platformFee",
            formatMoney(
                order.platform_fee,
                currency
            )
        );


        setText(
            "workerAmount",
            formatMoney(
                order.worker_amount,
                currency
            )
        );


        /* =====================================================
           REQUIREMENTS
        ====================================================== */

        setText(
            "orderRequirements",
            order.requirements ||
            "No requirements were provided."
        );


        setText(
            "orderNotes",
            order.notes ||
            "No notes were added."
        );


        /* =====================================================
           TIMELINE
        ====================================================== */

        renderTimeline(
            order
        );


        /* =====================================================
           SUPPORT BUTTON
        ====================================================== */

        const supportBtn =
            document.getElementById(
                "supportBtn"
            );


        if (supportBtn) {

            supportBtn.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `support.html?order=${encodeURIComponent(
                            order.id
                        )}`;
                }
            );
        }


        /* =====================================================
           BACK TO ORDERS
        ====================================================== */

        const ordersBtn =
            document.getElementById(
                "ordersBtn"
            );


        if (ordersBtn) {

            ordersBtn.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "orders.html";
                }
            );
        }


        /* =====================================================
           SHOW CONTENT
        ====================================================== */

        if (loadingState) {

            loadingState.style.display =
                "none";
        }


        if (errorState) {

            errorState.style.display =
                "none";
        }


        if (orderContent) {

            orderContent.style.display =
                "block";
        }


        console.log(
            "NOVA ORDER DETAILS READY:",
            order.id
        );
    }
);


/* =========================================================
   TIMELINE
========================================================= */

function renderTimeline(
    order
) {

    const container =
        document.getElementById(
            "orderTimeline"
        );


    if (!container) {
        return;
    }


    const status =
        order.status ||
        "pending";


    const createdDate =
        formatTimelineDate(
            order.created_at
        );


    const updatedDate =
        formatTimelineDate(
            order.updated_at
        );


    const steps = [
        {
            key: "pending",
            title: "Order Created",
            text: createdDate
        },
        {
            key: "accepted",
            title: "Order Accepted",
            text: "Worker accepted the order"
        },
        {
            key: "in_progress",
            title: "Work In Progress",
            text: "Worker started working"
        },
        {
            key: "delivered",
            title: "Order Delivered",
            text: "Work has been delivered"
        },
        {
            key: "completed",
            title: "Order Completed",
            text: updatedDate
        }
    ];


    const orderSequence = [
        "pending",
        "accepted",
        "in_progress",
        "delivered",
        "completed"
    ];


    const cancelled =
        status === "cancelled";


    const rejected =
        status === "rejected";


    let currentIndex =
        orderSequence.indexOf(
            status
        );


    if (
        currentIndex < 0 &&
        !cancelled &&
        !rejected
    ) {

        currentIndex = 0;
    }


    let html = "";


    steps.forEach(
        (step, index) => {

            let active =
                index <= currentIndex;


            let title =
                step.title;


            let text =
                step.text;


            if (
                cancelled &&
                step.key === "pending"
            ) {

                active = true;

                title =
                    "Order Created";

                text =
                    `${createdDate}`;
            }


            html += `
                <div
                    class="timeline-item ${
                        active
                            ? "active"
                            : ""
                    }"
                >

                    <span
                        class="timeline-dot"
                    ></span>

                    <div class="timeline-info">

                        <strong>
                            ${escapeHtml(
                                title
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                text
                            )}
                        </span>

                    </div>

                </div>
            `;
        }
    );


    if (
        cancelled
    ) {

        html += `
            <div
                class="timeline-item active"
            >

                <span
                    class="timeline-dot"
                    style="
                        background:#ff6d72;
                    "
                ></span>

                <div class="timeline-info">

                    <strong>
                        Order Cancelled
                    </strong>

                    <span>
                        ${escapeHtml(
                            updatedDate
                        )}
                    </span>

                </div>

            </div>
        `;
    }


    if (
        rejected
    ) {

        html += `
            <div
                class="timeline-item active"
            >

                <span
                    class="timeline-dot"
                    style="
                        background:#ff6d72;
                    "
                ></span>

                <div class="timeline-info">

                    <strong>
                        Order Rejected
                    </strong>

                    <span>
                        ${escapeHtml(
                            updatedDate
                        )}
                    </span>

                </div>

            </div>
        `;
    }


    container.innerHTML =
        html;
}


/* =========================================================
   TIMELINE DATE
========================================================= */

function formatTimelineDate(
    value
) {

    if (!value) {
        return "Date unavailable";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Date unavailable";
    }


    return date.toLocaleString(
        "en-US",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   STATUS COLORS
========================================================= */

function getStatusColor(
    status
) {

    const colors = {

        pending:
            "#ffc365",

        accepted:
            "#83aaff",

        in_progress:
            "#a998ff",

        delivered:
            "#65ddbf",

        completed:
            "#53e69a",

        cancelled:
            "#ff7378",

        rejected:
            "#ff7378"

    };


    return (
        colors[
            String(
                status || ""
            )
        ] ||
        "#ffffff"
    );
}


function getStatusGlow(
    status
) {

    const glows = {

        pending:
            "rgba(255,195,101,.10)",

        accepted:
            "rgba(131,170,255,.10)",

        in_progress:
            "rgba(169,152,255,.10)",

        delivered:
            "rgba(101,221,191,.10)",

        completed:
            "rgba(83,230,154,.10)",

        cancelled:
            "rgba(255,115,120,.10)",

        rejected:
            "rgba(255,115,120,.10)"

    };


    return (
        glows[
            String(
                status || ""
            )
        ] ||
        "rgba(255,255,255,.08)"
    );
}


function getStatusBackground(
    status
) {

    const backgrounds = {

        pending:
            "rgba(255,195,101,.08)",

        accepted:
            "rgba(131,170,255,.08)",

        in_progress:
            "rgba(169,152,255,.08)",

        delivered:
            "rgba(101,221,191,.08)",

        completed:
            "rgba(83,230,154,.08)",

        cancelled:
            "rgba(255,115,120,.08)",

        rejected:
            "rgba(255,115,120,.08)"

    };


    return (
        backgrounds[
            String(
                status || ""
            )
        ] ||
        "rgba(255,255,255,.04)"
    );
}


/* =========================================================
   PAYMENT COLORS
========================================================= */

function getPaymentColor(
    status
) {

    const colors = {

        unpaid:
            "#bfc4d1",

        pending:
            "#ffc365",

        paid:
            "#53e69a",

        failed:
            "#ff7378",

        refunded:
            "#91a5ff"

    };


    return (
        colors[
            String(
                status || ""
            )
        ] ||
        "#ffffff"
    );
}


function getPaymentBackground(
    status
) {

    const backgrounds = {

        unpaid:
            "rgba(255,255,255,.05)",

        pending:
            "rgba(255,195,101,.07)",

        paid:
            "rgba(83,230,154,.07)",

        failed:
            "rgba(255,115,120,.07)",

        refunded:
            "rgba(145,165,255,.07)"

    };


    return (
        backgrounds[
            String(
                status || ""
            )
        ] ||
        "rgba(255,255,255,.04)"
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}