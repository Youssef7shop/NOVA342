"use strict";

console.log("NOVA order-details.js LOADED");


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const supabase =
            window.supabaseClient;


        const loading =
            document.getElementById("loading");

        const errorState =
            document.getElementById("errorState");

        const content =
            document.getElementById("content");

        const errorMessage =
            document.getElementById("errorMessage");

        const actions =
            document.getElementById("actions");


        let currentUser = null;
        let order = null;


        function showError(message) {

            console.error(
                "NOVA ORDER DETAILS:",
                message
            );

            if (loading) {
                loading.style.display = "none";
            }

            if (content) {
                content.style.display = "none";
            }

            if (errorState) {
                errorState.style.display = "block";
            }

            if (errorMessage) {
                errorMessage.textContent = message;
            }
        }


        function showToast(message) {

            const toast =
                document.getElementById("toast");

            if (!toast) {
                return;
            }

            toast.textContent = message;

            toast.classList.add("show");

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


        function formatDate(value) {

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
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ).format(date);
        }


        function formatStatus(status) {

            const labels = {

                pending: "Pending",

                accepted: "Accepted",

                in_progress: "In Progress",

                delivered: "Delivered",

                completed: "Completed",

                cancelled: "Cancelled",

                rejected: "Rejected"
            };

            return (
                labels[status] ||
                "Unknown"
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


        if (!supabase) {

            showError(
                "Supabase client is missing."
            );

            return;
        }


        /* ======================================
           AUTH
        ====================================== */

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
                data?.user || null;


        } catch (error) {

            showError(
                "Your login session could not be verified."
            );

            return;
        }


        if (!currentUser) {

            window.location.href =
                `../login.html?redirect=${encodeURIComponent(
                    window.location.pathname +
                    window.location.search
                )}`;

            return;
        }


        /* ======================================
           GET ORDER ID
        ====================================== */

        const params =
            new URLSearchParams(
                window.location.search
            );


        const orderId =
            params.get("order");


        if (!orderId) {

            showError(
                "No order was selected."
            );

            return;
        }


        /* ======================================
           LOAD ORDER
        ====================================== */

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
                        created_at,
                        updated_at
                    `)
                    .eq(
                        "id",
                        orderId
                    )
                    .eq(
                        "customer_id",
                        currentUser.id
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            if (!data) {

                showError(
                    "This order does not exist or does not belong to your account."
                );

                return;
            }


            order = data;


        } catch (error) {

            console.error(
                "NOVA load order error:",
                error
            );


            showError(
                error.message ||
                "Unable to load this order."
            );

            return;
        }


        /* ======================================
           LOAD WORKER
        ====================================== */

        let worker = null;


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
                        avatar_url
                    `)
                    .eq(
                        "id",
                        order.worker_id
                    )
                    .maybeSingle();


            worker =
                data || null;
        }


        /* ======================================
           VALUES
        ====================================== */

        const title =
            order.service_title ||
            "Untitled Service";


        const workerName =
            worker?.full_name ||
            `${worker?.first_name || ""} ${worker?.last_name || ""}`.trim() ||
            "NOVA Worker";


        const price =
            Number(order.price || 0);


        const days =
            Number(order.delivery_days || 1);


        /* ======================================
           FILL PAGE
        ====================================== */

        document.title =
            `NOVA MARKET — ${title}`;


        document.getElementById(
            "category"
        ).textContent =
            order.category ||
            "Digital Service";


        document.getElementById(
            "serviceTitle"
        ).textContent =
            title;


        document.getElementById(
            "description"
        ).textContent =
            order.service_description ||
            "Professional digital service.";


        document.getElementById(
            "price"
        ).textContent =
            `${formatPrice(price)} ${
                order.currency || "MAD"
            }`;


        document.getElementById(
            "delivery"
        ).textContent =
            `${days} day${days === 1 ? "" : "s"}`;


        document.getElementById(
            "payment"
        ).textContent =
            order.payment_status ||
            "unpaid";


        document.getElementById(
            "orderDate"
        ).textContent =
            formatDate(
                order.created_at
            );


        document.getElementById(
            "workerName"
        ).textContent =
            workerName;


        const workerAvatar =
            document.getElementById(
                "workerAvatar"
            );


        if (workerAvatar) {

            if (worker?.avatar_url) {

                workerAvatar.innerHTML = `
                    <img
                        src="${worker.avatar_url}"
                        alt="${workerName}"
                    >
                `;

            } else {

                workerAvatar.innerHTML =
                    workerName
                        .charAt(0)
                        .toUpperCase();
            }
        }


        document.getElementById(
            "requirements"
        ).textContent =
            order.requirements ||
            "No requirements provided.";


        document.getElementById(
            "notes"
        ).textContent =
            order.notes ||
            "No additional notes.";


        document.getElementById(
            "summaryService"
        ).textContent =
            title;


        document.getElementById(
            "summaryDelivery"
        ).textContent =
            `${days} day${days === 1 ? "" : "s"}`;


        document.getElementById(
            "summaryPayment"
        ).textContent =
            order.payment_status ||
            "unpaid";


        document.getElementById(
            "totalPrice"
        ).textContent =
            formatPrice(price);


        /* ======================================
           STATUS
        ====================================== */

        const statusElement =
            document.getElementById(
                "status"
            );


        statusElement.className =
            `status status-${order.status}`;


        statusElement.innerHTML = `
            <span class="dot"></span>
            ${formatStatus(order.status)}
        `;


        /* ======================================
           ACTIONS
        ====================================== */

        renderActions();


        /* ======================================
           SHOW
        ====================================== */

        loading.style.display =
            "none";


        errorState.style.display =
            "none";


        content.style.display =
            "block";


        /* ======================================
           ACTION RENDERER
        ====================================== */

        function renderActions() {

            actions.innerHTML =
                "";


            /*
             * Pending:
             * Customer can cancel.
             */

            if (
                order.status ===
                "pending"
            ) {

                actions.innerHTML = `
                    <button
                        type="button"
                        id="cancelBtn"
                        class="action cancel"
                    >
                        Cancel Order
                    </button>
                `;


                document
                    .getElementById(
                        "cancelBtn"
                    )
                    .addEventListener(
                        "click",
                        cancelOrder
                    );
            }


            /*
             * Delivered:
             * Customer can complete.
             */

            else if (
                order.status ===
                "delivered"
            ) {

                actions.innerHTML = `
                    <button
                        type="button"
                        id="completeBtn"
                        class="action complete"
                    >
                        ✓ Complete Order
                    </button>
                `;


                document
                    .getElementById(
                        "completeBtn"
                    )
                    .addEventListener(
                        "click",
                        completeOrder
                    );
            }


            /*
             * Completed.
             */

            else if (
                order.status ===
                "completed"
            ) {

                actions.innerHTML = `
                    <div
                        style="
                            padding:14px;
                            border:1px solid rgba(43,217,139,.16);
                            border-radius:12px;
                            background:rgba(43,217,139,.05);
                            color:#7beab8;
                            text-align:center;
                            font-size:11px;
                            font-weight:700;
                        "
                    >
                        ✓ Order Completed
                    </div>
                `;
            }
        }


        /* ======================================
           CANCEL
        ====================================== */

        async function cancelOrder() {

            if (
                order.status !==
                "pending"
            ) {

                showToast(
                    "This order cannot be cancelled anymore."
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


            const button =
                document.getElementById(
                    "cancelBtn"
                );


            button.disabled =
                true;


            button.textContent =
                "Cancelling...";


            try {

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
                            order.id
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
                        "The order status may have changed already."
                    );
                }


                order =
                    data;


                showToast(
                    "Order cancelled successfully."
                );


                renderActions();


                updateStatusUI();


            } catch (error) {

                console.error(
                    error
                );


                showToast(
                    error.message ||
                    "Unable to cancel order."
                );


                button.disabled =
                    false;


                button.textContent =
                    "Cancel Order";
            }
        }


        /* ======================================
           COMPLETE
        ====================================== */

        async function completeOrder() {

            if (
                order.status !==
                "delivered"
            ) {

                showToast(
                    "Only delivered orders can be completed."
                );

                return;
            }


            const confirmed =
                window.confirm(
                    "Confirm that you received and accepted the delivered work?"
                );


            if (!confirmed) {
                return;
            }


            const button =
                document.getElementById(
                    "completeBtn"
                );


            button.disabled =
                true;


            button.textContent =
                "Completing...";


            try {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("orders")
                        .update({
                            status:
                                "completed"
                        })
                        .eq(
                            "id",
                            order.id
                        )
                        .eq(
                            "customer_id",
                            currentUser.id
                        )
                        .eq(
                            "status",
                            "delivered"
                        )
                        .select()
                        .maybeSingle();


                if (error) {
                    throw error;
                }


                if (!data) {

                    throw new Error(
                        "The order could not be completed."
                    );
                }


                order =
                    data;


                showToast(
                    "Order completed successfully!"
                );


                renderActions();


                updateStatusUI();


            } catch (error) {

                console.error(
                    "NOVA complete order error:",
                    error
                );


                showToast(
                    error.message ||
                    "Unable to complete order."
                );


                button.disabled =
                    false;


                button.textContent =
                    "✓ Complete Order";
            }
        }


        /* ======================================
           UPDATE STATUS
        ====================================== */

        function updateStatusUI() {

            statusElement.className =
                `status status-${order.status}`;


            statusElement.innerHTML = `
                <span class="dot"></span>
                ${formatStatus(order.status)}
            `;
        }

    }
);