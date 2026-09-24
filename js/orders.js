"use strict";

console.log("NOVA orders.js LOADED");


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const supabase =
            window.supabaseClient;


        const ordersList =
            document.getElementById(
                "ordersList"
            );


        const statusFilter =
            document.getElementById(
                "statusFilter"
            );


        const refreshOrdersBtn =
            document.getElementById(
                "refreshOrdersBtn"
            );


        const totalOrders =
            document.getElementById(
                "totalOrders"
            );


        const activeOrders =
            document.getElementById(
                "activeOrders"
            );


        const completedOrders =
            document.getElementById(
                "completedOrders"
            );


        const totalSpent =
            document.getElementById(
                "totalSpent"
            );


        let currentUser = null;

        let allOrders = [];


        /* =========================================
           TOAST
        ========================================= */

        function showToast(
            message
        ) {

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
                window.novaOrdersToast
            );


            window.novaOrdersToast =
                setTimeout(() => {

                    toast.classList.remove(
                        "show"
                    );

                }, 3000);
        }


        /* =========================================
           ERROR STATE
        ========================================= */

        function showError(
            message
        ) {

            ordersList.innerHTML = `
                <div class="state">

                    <div class="state-icon">
                        !
                    </div>

                    <h3>
                        Unable to load orders
                    </h3>

                    <p>
                        ${escapeHTML(message)}
                    </p>

                </div>
            `;
        }


        /* =========================================
           ESCAPE
        ========================================= */

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


        /* =========================================
           PRICE
        ========================================= */

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


        /* =========================================
           DATE
        ========================================= */

        function formatDate(
            value
        ) {

            if (!value) {
                return "—";
            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "—";
            }


            return new Intl.DateTimeFormat(
                "en-US",
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            ).format(
                date
            );
        }


        /* =========================================
           STATUS LABEL
        ========================================= */

        function formatStatus(
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
                labels[status] ||
                "Unknown"
            );
        }


        /* =========================================
           ACTIVE STATUS
        ========================================= */

        function isActiveStatus(
            status
        ) {

            return [
                "pending",
                "accepted",
                "in_progress",
                "delivered"
            ].includes(
                status
            );
        }


        /* =========================================
           INITIAL CHECK
        ========================================= */

        if (!supabase) {

            showError(
                "Supabase client is missing. Check js/supabase-config.js."
            );

            return;
        }


        /* =========================================
           GET USER
        ========================================= */

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


            currentUser =
                data?.user ||
                null;


        } catch (error) {

            console.error(
                "NOVA auth error:",
                error
            );


            showError(
                "Your login session could not be verified."
            );

            return;
        }


        /* =========================================
           LOGIN REQUIRED
        ========================================= */

        if (!currentUser) {

            window.location.href =
                `../login.html?redirect=${encodeURIComponent(
                    window.location.pathname
                )}`;

            return;
        }


        /* =========================================
           LOAD ORDERS
        ========================================= */

        async function loadOrders() {

            ordersList.innerHTML = `
                <div class="state">

                    <div class="spinner"></div>

                    <h3>
                        Loading your orders...
                    </h3>

                </div>
            `;


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
                            category,
                            price,
                            delivery_days,
                            currency,
                            notes,
                            requirements,
                            status,
                            payment_status,
                            created_at,
                            updated_at
                        `)
                        .eq(
                            "customer_id",
                            currentUser.id
                        )
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        );


                if (error) {
                    throw error;
                }


                allOrders =
                    Array.isArray(data)
                        ? data
                        : [];


                await attachWorkers(
                    allOrders
                );


                updateStats();


                applyFilter();


            } catch (error) {

                console.error(
                    "NOVA orders loading error:",
                    error
                );


                showError(
                    error.message ||
                    "Could not load your orders."
                );
            }
        }


        /* =========================================
           LOAD WORKERS
        ========================================= */

        async function attachWorkers(
            orders
        ) {

            const workerIds =
                [
                    ...new Set(
                        orders
                            .map(
                                order =>
                                    order.worker_id
                            )
                            .filter(Boolean)
                    )
                ];


            if (!workerIds.length) {
                return;
            }


            const {
                data,
                error
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
                    .in(
                        "id",
                        workerIds
                    );


            if (error) {

                console.warn(
                    "NOVA worker loading error:",
                    error
                );

                return;
            }


            const profileMap = {};


            (data || [])
                .forEach(
                    profile => {

                        profileMap[
                            profile.id
                        ] = profile;
                    }
                );


            orders.forEach(
                order => {

                    order.worker =
                        profileMap[
                            order.worker_id
                        ] || null;
                }
            );
        }


        /* =========================================
           STATS
        ========================================= */

        function updateStats() {

            const total =
                allOrders.length;


            const active =
                allOrders.filter(
                    order =>
                        isActiveStatus(
                            order.status
                        )
                ).length;


            const completed =
                allOrders.filter(
                    order =>
                        order.status ===
                        "completed"
                ).length;


            const spent =
                allOrders
                    .filter(
                        order =>
                            order.status !==
                            "cancelled" &&
                            order.status !==
                            "rejected"
                    )
                    .reduce(
                        (
                            sum,
                            order
                        ) =>
                            sum +
                            Number(
                                order.price || 0
                            ),
                        0
                    );


            totalOrders.textContent =
                total;


            activeOrders.textContent =
                active;


            completedOrders.textContent =
                completed;


            totalSpent.textContent =
                `${formatPrice(spent)} MAD`;
        }


        /* =========================================
           FILTER
        ========================================= */

        function applyFilter() {

            const selected =
                statusFilter
                    ? statusFilter.value
                    : "all";


            const filtered =
                selected === "all"
                    ? allOrders
                    : allOrders.filter(
                        order =>
                            order.status ===
                            selected
                    );


            renderOrders(
                filtered
            );
        }


        /* =========================================
           RENDER
        ========================================= */

        function renderOrders(
            orders
        ) {

            if (!orders.length) {

                ordersList.innerHTML = `
                    <div class="state">

                        <div class="state-icon">
                            N
                        </div>

                        <h3>
                            No orders found
                        </h3>

                        <p>
                            You don't have any orders matching this filter yet.
                            Browse NOVA services to start a project.
                        </p>

                    </div>
                `;

                return;
            }


            ordersList.innerHTML =
                orders
                    .map(
                        createOrderCard
                    )
                    .join("");


            attachOrderActions();
        }


        /* =========================================
           CREATE ORDER CARD
        ========================================= */

        function createOrderCard(
            order
        ) {

            const status =
                order.status ||
                "pending";


            const worker =
                order.worker ||
                null;


            const workerName =
                worker?.full_name ||
                `${worker?.first_name || ""} ${worker?.last_name || ""}`.trim() ||
                "NOVA Worker";


            const workerInitial =
                workerName
                    .charAt(0)
                    .toUpperCase();


            const workerAvatar =
                worker?.avatar_url
                    ? `
                        <div class="worker-avatar">

                            <img
                                src="${escapeAttribute(
                                    worker.avatar_url
                                )}"
                                alt="${escapeAttribute(
                                    workerName
                                )}"
                            >

                        </div>
                    `
                    : `
                        <div class="worker-avatar">
                            ${escapeHTML(
                                workerInitial
                            )}
                        </div>
                    `;


            /*
             * Customer can cancel only
             * pending orders.
             */

            const canCancel =
                status ===
                "pending";


            const cancelButton =
                canCancel
                    ? `
                        <button
                            type="button"
                            class="action-btn cancel-btn"
                            data-cancel-order="${escapeAttribute(
                                order.id
                            )}"
                        >
                            Cancel Order
                        </button>
                    `
                    : "";


            return `
                <article
                    class="order-card"
                    data-order-id="${escapeAttribute(
                        order.id
                    )}"
                >

                    <div class="order-main">

                        <div class="order-top">

                            <div class="service-info">

                                <div
                                    class="service-category"
                                >
                                    ${escapeHTML(
                                        order.category ||
                                        "Digital Service"
                                    )}
                                </div>


                                <h2
                                    class="service-title"
                                >
                                    ${escapeHTML(
                                        order.service_title ||
                                        "Untitled Service"
                                    )}
                                </h2>


                                <div class="order-id">
                                    Order #${escapeHTML(
                                        order.id
                                    )}
                                </div>

                            </div>


                            <div
                                class="status status-${escapeAttribute(
                                    status
                                )}"
                            >

                                <span
                                    class="status-dot"
                                ></span>

                                ${escapeHTML(
                                    formatStatus(
                                        status
                                    )
                                )}

                            </div>

                        </div>


                        <div class="details-grid">

                            <div class="detail">

                                <div class="detail-label">
                                    Price
                                </div>

                                <div class="detail-value">
                                    ${formatPrice(
                                        order.price
                                    )}
                                    ${escapeHTML(
                                        order.currency ||
                                        "MAD"
                                    )}
                                </div>

                            </div>


                            <div class="detail">

                                <div class="detail-label">
                                    Delivery
                                </div>

                                <div class="detail-value">
                                    ${Number(
                                        order.delivery_days ||
                                        1
                                    )}
                                    day${Number(
                                        order.delivery_days ||
                                        1
                                    ) === 1 ? "" : "s"}
                                </div>

                            </div>


                            <div class="detail">

                                <div class="detail-label">
                                    Payment
                                </div>

                                <div class="detail-value">
                                    ${escapeHTML(
                                        order.payment_status ||
                                        "unpaid"
                                    )}
                                </div>

                            </div>


                            <div class="detail">

                                <div class="detail-label">
                                    Ordered
                                </div>

                                <div class="detail-value">
                                    ${escapeHTML(
                                        formatDate(
                                            order.created_at
                                        )
                                    )}
                                </div>

                            </div>

                        </div>


                        <div class="worker-mini">

                            ${workerAvatar}

                            <span class="worker-name">
                                ${escapeHTML(
                                    workerName
                                )}
                            </span>

                        </div>

                    </div>


                    <div class="order-actions">

                        <button
                            type="button"
                            class="action-btn"
                            data-view-order="${escapeAttribute(
                                order.id
                            )}"
                        >
                            View Details
                        </button>


                        ${cancelButton}

                    </div>

                </article>
            `;
        }


        /* =========================================
           ACTIONS
        ========================================= */

        function attachOrderActions() {

            document
                .querySelectorAll(
                    "[data-cancel-order]"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            async () => {

                                const orderId =
                                    button.dataset
                                        .cancelOrder;


                                await cancelOrder(
                                    orderId,
                                    button
                                );
                            }
                        );
                    }
                );


            document
                .querySelectorAll(
                    "[data-view-order]"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            () => {

                                const orderId =
                                    button.dataset
                                        .viewOrder;


                                openOrderDetails(
                                    orderId
                                );
                            }
                        );
                    }
                );
        }


        /* =========================================
           CANCEL ORDER
        ========================================= */

        async function cancelOrder(
            orderId,
            button
        ) {

            const order =
                allOrders.find(
                    item =>
                        item.id ===
                        orderId
                );


            if (!order) {

                showToast(
                    "Order not found."
                );

                return;
            }


            /*
             * Front-end protection.
             */

            if (
                order.status !==
                "pending"
            ) {

                showToast(
                    "This order can no longer be cancelled."
                );

                return;
            }


            const confirmed =
                window.confirm(
                    "Are you sure you want to cancel this order?"
                );


            if (!confirmed) {
                return;
            }


            button.disabled =
                true;


            button.textContent =
                "Cancelling...";


            try {

                /*
                 * The query includes:
                 *
                 * customer_id
                 * order id
                 * pending status
                 *
                 * So the update only targets
                 * the current customer's pending order.
                 */

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("orders")
                        .update({

                            status:
                                "cancelled"

                        })
                        .eq(
                            "id",
                            orderId
                        )
                        .eq(
                            "customer_id",
                            currentUser.id
                        )
                        .eq(
                            "status",
                            "pending"
                        )
                        .select()
                        .maybeSingle();


                if (error) {
                    throw error;
                }


                if (!data) {

                    throw new Error(
                        "The order could not be cancelled. It may already have changed status."
                    );
                }


                showToast(
                    "Order cancelled successfully."
                );


                await loadOrders();


            } catch (error) {

                console.error(
                    "NOVA cancel order error:",
                    error
                );


                showToast(
                    error.message ||
                    "Unable to cancel the order."
                );


                button.disabled =
                    false;

                button.textContent =
                    "Cancel Order";
            }
        }


        /* =========================================
           VIEW DETAILS
        ========================================= */

        function openOrderDetails(
            orderId
        ) {

            const order =
                allOrders.find(
                    item =>
                        item.id ===
                        orderId
                );


            if (!order) {
                return;
            }


            const worker =
                order.worker;


            const workerName =
                worker?.full_name ||
                `${worker?.first_name || ""} ${worker?.last_name || ""}`.trim() ||
                "NOVA Worker";


            const details =
                [
                    `Service: ${order.service_title || "—"}`,
                    `Worker: ${workerName}`,
                    `Price: ${formatPrice(order.price)} ${order.currency || "MAD"}`,
                    `Delivery: ${order.delivery_days || 1} day(s)`,
                    `Status: ${formatStatus(order.status)}`,
                    `Payment: ${order.payment_status || "unpaid"}`,
                    `Created: ${formatDate(order.created_at)}`
                ]
                .join("\n");


            window.alert(
                details
            );
        }


        /* =========================================
           EVENTS
        ========================================= */

        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                applyFilter
            );
        }


        if (refreshOrdersBtn) {

            refreshOrdersBtn.addEventListener(
                "click",
                async () => {

                    refreshOrdersBtn.disabled =
                        true;


                    refreshOrdersBtn.textContent =
                        "Refreshing...";


                    await loadOrders();


                    refreshOrdersBtn.disabled =
                        false;


                    refreshOrdersBtn.textContent =
                        "↻ Refresh Orders";
                }
            );
        }


        /* =========================================
           START
        ========================================= */

        await loadOrders();

    }
);