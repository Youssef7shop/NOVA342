"use strict";

console.log("NOVA worker-orders.js LOADED");


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


        const refreshBtn =
            document.getElementById(
                "refreshBtn"
            );


        const totalCount =
            document.getElementById(
                "totalCount"
            );


        const pendingCount =
            document.getElementById(
                "pendingCount"
            );


        const activeCount =
            document.getElementById(
                "activeCount"
            );


        const deliveredCount =
            document.getElementById(
                "deliveredCount"
            );


        const revenueCount =
            document.getElementById(
                "revenueCount"
            );


        const detailsModal =
            document.getElementById(
                "detailsModal"
            );


        const closeModalBtn =
            document.getElementById(
                "closeModalBtn"
            );


        let currentWorker =
            null;


        let allOrders =
            [];


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
                window.novaWorkerToast
            );


            window.novaWorkerToast =
                setTimeout(() => {

                    toast.classList.remove(
                        "show"
                    );

                }, 3000);
        }


        /* =========================================
           ERROR
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
           WORKER AVATAR
        ========================================= */

        function avatarFallback(
            name
        ) {

            const initial =
                (name || "C")
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
                                id="customerGradient"
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
                            rx="42"
                            fill="url(#customerGradient)"
                        />


                        <text
                            x="100"
                            y="110"
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


        /* =========================================
           SUPABASE CHECK
        ========================================= */

        if (!supabase) {

            showError(
                "Supabase client is missing. Check js/supabase-config.js."
            );

            return;
        }


        /* =========================================
           GET AUTH USER
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


            currentWorker =
                data?.user ||
                null;


        } catch (error) {

            console.error(
                "NOVA worker auth error:",
                error
            );


            showError(
                "Your session could not be verified."
            );

            return;
        }


        /* =========================================
           LOGIN CHECK
        ========================================= */

        if (!currentWorker) {

            window.location.href =
                `../login.html?redirect=${encodeURIComponent(
                    window.location.pathname
                )}`;

            return;
        }


        /* =========================================
           WORKER ROLE CHECK
        ========================================= */

        try {

            const {
                data: profile,
                error
            } =
                await supabase
                    .from("profiles")
                    .select(`
                        id,
                        role,
                        full_name,
                        first_name,
                        last_name,
                        avatar_url
                    `)
                    .eq(
                        "id",
                        currentWorker.id
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            if (
                !profile ||
                profile.role !== "worker"
            ) {

                showError(
                    "This page is available only to NOVA workers."
                );

                return;
            }

        } catch (error) {

            console.error(
                "NOVA worker profile error:",
                error
            );


            showError(
                error.message ||
                "Unable to verify worker permissions."
            );

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
                        Loading customer orders...
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
                            service_description,
                            category,
                            price,
                            delivery_days,
                            currency,
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
                            "worker_id",
                            currentWorker.id
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


                await attachCustomers(
                    allOrders
                );


                updateStats();


                applyFilter();


            } catch (error) {

                console.error(
                    "NOVA worker orders error:",
                    error
                );


                showError(
                    error.message ||
                    "Could not load your orders."
                );
            }
        }


        /* =========================================
           LOAD CUSTOMERS
        ========================================= */

        async function attachCustomers(
            orders
        ) {

            const customerIds =
                [
                    ...new Set(
                        orders
                            .map(
                                order =>
                                    order.customer_id
                            )
                            .filter(Boolean)
                    )
                ];


            if (!customerIds.length) {
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
                        full_name,
                        first_name,
                        last_name,
                        avatar_url,
                        email
                    `)
                    .in(
                        "id",
                        customerIds
                    );


            if (error) {

                console.warn(
                    "NOVA customer profiles error:",
                    error
                );

                return;
            }


            const customerMap =
                {};


            (data || [])
                .forEach(
                    profile => {

                        customerMap[
                            profile.id
                        ] = profile;
                    }
                );


            orders.forEach(
                order => {

                    order.customer =
                        customerMap[
                            order.customer_id
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


            const pending =
                allOrders.filter(
                    order =>
                        order.status ===
                        "pending"
                ).length;


            const active =
                allOrders.filter(
                    order =>
                        [
                            "accepted",
                            "in_progress"
                        ].includes(
                            order.status
                        )
                ).length;


            const delivered =
                allOrders.filter(
                    order =>
                        order.status ===
                        "delivered"
                ).length;


            const revenue =
                allOrders
                    .filter(
                        order =>
                            [
                                "accepted",
                                "in_progress",
                                "delivered",
                                "completed"
                            ].includes(
                                order.status
                            )
                    )
                    .reduce(
                        (
                            sum,
                            order
                        ) =>
                            sum +
                            Number(
                                order.worker_amount ??
                                0
                            ),
                        0
                    );


            totalCount.textContent =
                total;


            pendingCount.textContent =
                pending;


            activeCount.textContent =
                active;


            deliveredCount.textContent =
                delivered;


            revenueCount.textContent =
                `${formatPrice(
                    revenue
                )} MAD`;
        }


        /* =========================================
           FILTER
        ========================================= */

        function applyFilter() {

            const selected =
                statusFilter?.value ||
                "all";


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
           RENDER ORDERS
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
                            There are no customer orders
                            matching this filter.
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


            attachActions();
        }


        /* =========================================
           ORDER CARD
        ========================================= */

        function createOrderCard(
            order
        ) {

            const status =
                order.status ||
                "pending";


            const customer =
                order.customer ||
                null;


            const customerName =
                customer?.full_name ||
                `${customer?.first_name || ""} ${customer?.last_name || ""}`.trim() ||
                "NOVA Customer";


            const customerInitial =
                customerName
                    .charAt(0)
                    .toUpperCase();


            const customerAvatar =
                customer?.avatar_url
                    ? `
                        <div class="customer-avatar">

                            <img
                                src="${escapeAttribute(
                                    customer.avatar_url
                                )}"
                                alt="${escapeAttribute(
                                    customerName
                                )}"
                            >

                        </div>
                    `
                    : `
                        <div class="customer-avatar">

                            ${escapeHTML(
                                customerInitial
                            )}

                        </div>
                    `;


            const actionButtons =
                getActionButtons(
                    order
                );


            return `
                <article
                    class="order-card"
                    data-order-id="${escapeAttribute(
                        order.id
                    )}"
                >

                    <div class="main">

                        <div class="top">

                            <div>

                                <span
                                    class="service-category"
                                >
                                    ${escapeHTML(
                                        order.category ||
                                        "Digital Service"
                                    )}
                                </span>


                                <h2
                                    class="service-title"
                                >
                                    ${escapeHTML(
                                        order.service_title ||
                                        "Untitled Service"
                                    )}
                                </h2>


                                <div
                                    class="order-id"
                                >
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


                        <div class="details">

                            <div class="detail">

                                <div class="label">
                                    Price
                                </div>

                                <div class="value">
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

                                <div class="label">
                                    Worker Earnings
                                </div>

                                <div class="value">
                                    ${formatPrice(
                                        order.worker_amount
                                    )}
                                    MAD
                                </div>

                            </div>


                            <div class="detail">

                                <div class="label">
                                    Delivery
                                </div>

                                <div class="value">
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

                                <div class="label">
                                    Ordered
                                </div>

                                <div class="value">
                                    ${escapeHTML(
                                        formatDate(
                                            order.created_at
                                        )
                                    )}
                                </div>

                            </div>

                        </div>


                        <div class="customer">

                            ${customerAvatar}

                            <span class="customer-name">
                                Customer:
                                ${escapeHTML(
                                    customerName
                                )}
                            </span>

                        </div>

                    </div>


                    <div class="actions">

                        <button
                            type="button"
                            class="action"
                            data-view-order="${escapeAttribute(
                                order.id
                            )}"
                        >
                            View Details
                        </button>


                        ${actionButtons}

                    </div>

                </article>
            `;
        }


        /* =========================================
           ACTION BUTTONS
        ========================================= */

        function getActionButtons(
            order
        ) {

            switch (
                order.status
            ) {

                case "pending":

                    return `
                        <button
                            type="button"
                            class="action accept"
                            data-action="accept"
                            data-order-id="${escapeAttribute(
                                order.id
                            )}"
                        >
                            ✓ Accept Order
                        </button>

                        <button
                            type="button"
                            class="action reject"
                            data-action="reject"
                            data-order-id="${escapeAttribute(
                                order.id
                            )}"
                        >
                            × Reject Order
                        </button>
                    `;


                case "accepted":

                    return `
                        <button
                            type="button"
                            class="action start"
                            data-action="start"
                            data-order-id="${escapeAttribute(
                                order.id
                            )}"
                        >
                            ▶ Start Work
                        </button>
                    `;


                case "in_progress":

                    return `
                        <button
                            type="button"
                            class="action deliver"
                            data-action="deliver"
                            data-order-id="${escapeAttribute(
                                order.id
                            )}"
                        >
                            ↑ Mark as Delivered
                        </button>
                    `;


                default:

                    return "";
            }
        }


        /* =========================================
           ATTACH ACTIONS
        ========================================= */

        function attachActions() {

            document
                .querySelectorAll(
                    "[data-action]"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            async () => {

                                const action =
                                    button.dataset.action;

                                const orderId =
                                    button.dataset.orderId;


                                await updateOrderStatus(
                                    orderId,
                                    action,
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

                                openOrderDetails(
                                    button.dataset
                                        .viewOrder
                                );
                            }
                        );
                    }
                );
        }


        /* =========================================
           ORDER STATUS UPDATE
        ========================================= */

        async function updateOrderStatus(
            orderId,
            action,
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


            const transitions = {

                accept: {
                    from:
                        "pending",
                    to:
                        "accepted"
                },

                reject: {
                    from:
                        "pending",
                    to:
                        "rejected"
                },

                start: {
                    from:
                        "accepted",
                    to:
                        "in_progress"
                },

                deliver: {
                    from:
                        "in_progress",
                    to:
                        "delivered"
                }
            };


            const transition =
                transitions[action];


            if (!transition) {

                showToast(
                    "Invalid order action."
                );

                return;
            }


            if (
                order.status !==
                transition.from
            ) {

                showToast(
                    "This order has already changed status."
                );

                return;
            }


            let confirmation =
                true;


            if (
                action ===
                "accept"
            ) {

                confirmation =
                    window.confirm(
                        "Accept this customer order?"
                    );

            } else if (
                action ===
                "reject"
            ) {

                confirmation =
                    window.confirm(
                        "Reject this customer order?"
                    );

            } else if (
                action ===
                "start"
            ) {

                confirmation =
                    window.confirm(
                        "Start working on this order?"
                    );

            } else if (
                action ===
                "deliver"
            ) {

                confirmation =
                    window.confirm(
                        "Mark this order as delivered?"
                    );
            }


            if (!confirmation) {
                return;
            }


            button.disabled =
                true;


            const originalText =
                button.textContent;


            button.textContent =
                "Updating...";


            try {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("orders")
                        .update({

                            status:
                                transition.to

                        })
                        .eq(
                            "id",
                            orderId
                        )
                        .eq(
                            "worker_id",
                            currentWorker.id
                        )
                        .eq(
                            "status",
                            transition.from
                        )
                        .select()
                        .maybeSingle();


                if (error) {
                    throw error;
                }


                if (!data) {

                    throw new Error(
                        "The order could not be updated. Its status may have changed."
                    );
                }


                showToast(
                    `Order ${formatStatus(
                        transition.to
                    ).toLowerCase()} successfully.`
                );


                await loadOrders();


            } catch (error) {

                console.error(
                    "NOVA status update error:",
                    error
                );


                showToast(
                    error.message ||
                    "Unable to update the order."
                );


                button.disabled =
                    false;

                button.textContent =
                    originalText;
            }
        }


        /* =========================================
           ORDER DETAILS MODAL
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


            const customer =
                order.customer;


            const customerName =
                customer?.full_name ||
                `${customer?.first_name || ""} ${customer?.last_name || ""}`.trim() ||
                "NOVA Customer";


            document.getElementById(
                "modalService"
            ).textContent =
                order.service_title ||
                "—";


            document.getElementById(
                "modalCustomer"
            ).textContent =
                customerName;


            document.getElementById(
                "modalRequirements"
            ).textContent =
                order.requirements ||
                "No requirements provided.";


            document.getElementById(
                "modalNotes"
            ).textContent =
                order.notes ||
                "No additional notes.";


            document.getElementById(
                "modalInfo"
            ).textContent =
                [
                    `Order ID: ${order.id}`,
                    `Status: ${formatStatus(order.status)}`,
                    `Price: ${formatPrice(order.price)} ${order.currency || "MAD"}`,
                    `Worker amount: ${formatPrice(order.worker_amount)} MAD`,
                    `Delivery: ${order.delivery_days || 1} day(s)`,
                    `Payment: ${order.payment_status || "unpaid"}`,
                    `Created: ${formatDate(order.created_at)}`,
                    `Updated: ${formatDate(order.updated_at)}`
                ].join("\n");


            detailsModal.classList.add(
                "show"
            );
        }


        /* =========================================
           CLOSE MODAL
        ========================================= */

        function closeModal() {

            detailsModal.classList.remove(
                "show"
            );
        }


        if (closeModalBtn) {

            closeModalBtn.addEventListener(
                "click",
                closeModal
            );
        }


        if (detailsModal) {

            detailsModal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        detailsModal
                    ) {

                        closeModal();
                    }
                }
            );
        }


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeModal();
                }
            }
        );


        /* =========================================
           FILTER EVENTS
        ========================================= */

        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                applyFilter
            );
        }


        if (refreshBtn) {

            refreshBtn.addEventListener(
                "click",
                async () => {

                    refreshBtn.disabled =
                        true;

                    refreshBtn.textContent =
                        "Refreshing...";


                    await loadOrders();


                    refreshBtn.disabled =
                        false;

                    refreshBtn.textContent =
                        "↻ Refresh";
                }
            );
        }


        /* =========================================
           START
        ========================================= */

        await loadOrders();

    }
);