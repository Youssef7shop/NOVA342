"use strict";

let allOrders = [];
let filteredOrders = [];

document.addEventListener(
    "DOMContentLoaded",
    initOrders
);


/* =========================================================
   INIT
========================================================= */

async function initOrders() {

    setupSidebar();

    setupEvents();

    const client =
        window.supabaseClient;


    if (!client) {

        showAlert(
            "Supabase is not configured correctly.",
            "error"
        );

        return;
    }


    const adminOk =
        await checkAdmin(client);


    if (!adminOk) {
        return;
    }


    await loadOrders(client);
}


/* =========================================================
   ADMIN AUTH
========================================================= */

async function checkAdmin(client) {

    try {

        const {
            data: userData,
            error: userError
        } =
            await client.auth.getUser();


        if (
            userError ||
            !userData?.user
        ) {

            window.location.href =
                "../login.html";

            return false;
        }


        const {
            data: profile,
            error
        } =
            await client.rpc(
                "admin_current_profile"
            );


        if (error) {

            showAlert(
                error.message ||
                "Admin verification failed.",
                "error"
            );

            return false;
        }


        if (
            !profile ||
            profile.role !== "admin" ||
            profile.is_active === false
        ) {

            window.location.href =
                "../login.html";

            return false;
        }


        applyAdminProfile(profile);

        return true;


    } catch (error) {

        console.error(
            "NOVA admin auth error:",
            error
        );


        showAlert(
            "Unable to verify administrator.",
            "error"
        );

        return false;
    }
}


/* =========================================================
   PROFILE
========================================================= */

function applyAdminProfile(profile) {

    const name =
        document.getElementById(
            "adminName"
        );

    const email =
        document.getElementById(
            "adminEmail"
        );

    const avatar =
        document.getElementById(
            "adminAvatar"
        );


    const fullName =
        profile.full_name ||
        [
            profile.first_name,
            profile.last_name
        ]
            .filter(Boolean)
            .join(" ") ||
        "Admin";


    if (name) {
        name.textContent =
            fullName;
    }


    if (email) {
        email.textContent =
            profile.email || "";
    }


    if (avatar) {

        if (profile.avatar_url) {

            avatar.innerHTML = "";

            const img =
                document.createElement(
                    "img"
                );

            img.src =
                profile.avatar_url;

            img.alt =
                "Admin";

            img.style.width =
                "100%";

            img.style.height =
                "100%";

            img.style.objectFit =
                "cover";

            avatar.appendChild(
                img
            );

        } else {

            avatar.textContent =
                fullName
                    .charAt(0)
                    .toUpperCase();
        }
    }
}


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders(client) {

    setLoading(true);

    try {

        console.log(
            "NOVA: loading admin orders..."
        );


        const {
            data,
            error
        } =
            await client.rpc(
                "admin_orders"
            );


        if (error) {
            throw error;
        }


        allOrders =
            Array.isArray(data)
                ? data
                : [];


        allOrders =
            allOrders.map(
                normalizeOrder
            );


        console.log(
            "NOVA: admin orders loaded:",
            allOrders.length
        );


        updateStats();

        applyFilters();


    } catch (error) {

        console.error(
            "NOVA admin_orders error:",
            error
        );


        allOrders = [];

        filteredOrders = [];


        showAlert(
            error.message ||
            "Failed to load orders.",
            "error"
        );


        renderOrders();


    } finally {

        setLoading(false);

        hideLoadingForce();
    }
}


/* =========================================================
   NORMALIZE
========================================================= */

function normalizeOrder(order) {

    if (
        !order ||
        typeof order !== "object"
    ) {

        return {};
    }


    return {

        ...order,

        price:
            toSafeNumber(
                order.price
            ),

        platform_fee:
            toSafeNumber(
                order.platform_fee
            ),

        worker_amount:
            toSafeNumber(
                order.worker_amount
            ),

        delivery_days:
            toSafeNumber(
                order.delivery_days
            )
    };
}


function toSafeNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;
    }


    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;
}


/* =========================================================
   FILTERS
========================================================= */

function applyFilters() {

    const search =
        document.getElementById(
            "searchInput"
        )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const status =
        document.getElementById(
            "statusFilter"
        )
            ?.value ||
        "all";


    const payment =
        document.getElementById(
            "paymentFilter"
        )
            ?.value ||
        "all";


    const currency =
        document.getElementById(
            "currencyFilter"
        )
            ?.value ||
        "all";


    filteredOrders =
        allOrders.filter(
            order => {

                const searchText = [

                    order.id,
                    order.service_title,
                    order.service_slug,
                    order.customer_name,
                    order.customer_email,
                    order.worker_name,
                    order.worker_email

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                return (

                    (
                        !search ||
                        searchText.includes(search)
                    )

                    &&

                    (
                        status === "all" ||
                        order.order_status === status
                    )

                    &&

                    (
                        payment === "all" ||
                        order.payment_status === payment
                    )

                    &&

                    (
                        currency === "all" ||
                        order.currency === currency
                    )

                );
            }
        );


    renderOrders();
}


/* =========================================================
   STATS
========================================================= */

function updateStats() {

    const total =
        allOrders.length;


    const pending =
        allOrders.filter(
            order =>
                order.order_status === "pending"
        ).length;


    const progress =
        allOrders.filter(
            order =>
                order.order_status === "accepted" ||
                order.order_status === "in_progress" ||
                order.order_status === "delivered"
        ).length;


    const completed =
        allOrders.filter(
            order =>
                order.order_status === "completed"
        ).length;


    const cancelled =
        allOrders.filter(
            order =>
                order.order_status === "cancelled" ||
                order.order_status === "rejected"
        ).length;


    setText(
        "totalOrders",
        total
    );

    setText(
        "pendingOrders",
        pending
    );

    setText(
        "progressOrders",
        progress
    );

    setText(
        "completedOrders",
        completed
    );

    setText(
        "cancelledOrders",
        cancelled
    );
}


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderOrders() {

    const body =
        document.getElementById(
            "ordersBody"
        );


    const empty =
        document.getElementById(
            "ordersEmpty"
        );


    if (!body) {

        console.warn(
            "NOVA: ordersBody not found."
        );

        return;
    }


    body.innerHTML = "";


    if (!filteredOrders.length) {

        if (empty) {
            empty.hidden = false;
        }


        setText(
            "ordersCount",
            "0 orders"
        );

        return;
    }


    if (empty) {
        empty.hidden = true;
    }


    const fragment =
        document.createDocumentFragment();


    filteredOrders.forEach(
        order => {

            const tr =
                document.createElement(
                    "tr"
                );


            const isPending =
                order.order_status === "pending";


            const actionsHtml =
                isPending

                    ? `
                        <div class="order-actions">

                            <button
                                type="button"
                                class="view-order-btn"
                                data-order-id="${escapeHtml(
                                    order.id
                                )}"
                            >
                                View
                            </button>


                            <button
                                type="button"
                                class="accept-order-btn"
                                data-order-id="${escapeHtml(
                                    order.id
                                )}"
                            >
                                ✓ Accept
                            </button>


                            <button
                                type="button"
                                class="reject-order-btn"
                                data-order-id="${escapeHtml(
                                    order.id
                                )}"
                            >
                                × Reject
                            </button>

                        </div>
                    `

                    : `
                        <div class="order-actions">

                            <button
                                type="button"
                                class="view-order-btn"
                                data-order-id="${escapeHtml(
                                    order.id
                                )}"
                            >
                                View
                            </button>

                        </div>
                    `;


            tr.innerHTML = `

                <td>

                    <div class="order-main">

                        <span class="order-number">

                            #${escapeHtml(
                                shortId(order.id)
                            )}

                        </span>

                        <span class="order-id">

                            ${escapeHtml(
                                order.id || "—"
                            )}

                        </span>

                    </div>

                </td>


                <td>

                    <div class="service-name">

                        ${escapeHtml(
                            order.service_title ||
                            "Untitled Service"
                        )}

                    </div>

                    <div class="service-category">

                        ${escapeHtml(
                            order.category ||
                            "Other"
                        )}

                    </div>

                </td>


                <td>

                    ${personHtml(
                        order.customer_name,
                        order.customer_email,
                        order.customer_avatar
                    )}

                </td>


                <td>

                    ${personHtml(
                        order.worker_name,
                        order.worker_email,
                        order.worker_avatar
                    )}

                </td>


                <td>

                    <span class="amount">

                        ${formatMoney(
                            order.price,
                            order.currency
                        )}

                    </span>


                    <span class="amount-sub">

                        Fee:
                        ${formatMoney(
                            order.platform_fee,
                            order.currency
                        )}

                    </span>

                </td>


                <td>

                    ${paymentBadge(
                        order.payment_status
                    )}

                </td>


                <td>

                    ${statusBadge(
                        order.order_status
                    )}

                </td>


                <td>

                    <span class="date-cell">

                        ${formatDate(
                            order.created_at
                        )}

                    </span>

                </td>


                <td>

                    ${actionsHtml}

                </td>

            `;


            fragment.appendChild(
                tr
            );
        }
    );


    body.appendChild(
        fragment
    );


    setText(
        "ordersCount",
        `${filteredOrders.length} order${
            filteredOrders.length === 1
                ? ""
                : "s"
        }`
    );
}


/* =========================================================
   ORDER ACTIONS
========================================================= */

async function acceptOrder(orderId) {

    if (!orderId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Accept this order?"
        );


    if (!confirmed) {
        return;
    }


    const client =
        window.supabaseClient;


    if (!client) {

        showAlert(
            "Supabase is not configured.",
            "error"
        );

        return;
    }


    const buttons =
        document.querySelectorAll(
            `[data-order-id="${CSS.escape(orderId)}"]`
        );


    buttons.forEach(
        button => {
            button.disabled = true;
        }
    );


    try {

        const {
            data,
            error
        } =
            await client.rpc(
                "admin_accept_order",
                {
                    p_order_id:
                        orderId
                }
            );


        if (error) {
            throw error;
        }


        console.log(
            "NOVA: order accepted:",
            data
        );


        showAlert(
            "Order accepted successfully.",
            "success"
        );


        await loadOrders(
            client
        );


    } catch (error) {

        console.error(
            "NOVA accept order error:",
            error
        );


        showAlert(
            error.message ||
            "Could not accept order.",
            "error"
        );


        buttons.forEach(
            button => {
                button.disabled = false;
            }
        );
    }
}


async function rejectOrder(orderId) {

    if (!orderId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to reject this order?"
        );


    if (!confirmed) {
        return;
    }


    const client =
        window.supabaseClient;


    if (!client) {

        showAlert(
            "Supabase is not configured.",
            "error"
        );

        return;
    }


    const buttons =
        document.querySelectorAll(
            `[data-order-id="${CSS.escape(orderId)}"]`
        );


    buttons.forEach(
        button => {
            button.disabled = true;
        }
    );


    try {

        const {
            data,
            error
        } =
            await client.rpc(
                "admin_reject_order",
                {
                    p_order_id:
                        orderId
                }
            );


        if (error) {
            throw error;
        }


        console.log(
            "NOVA: order rejected:",
            data
        );


        showAlert(
            "Order rejected successfully.",
            "success"
        );


        await loadOrders(
            client
        );


    } catch (error) {

        console.error(
            "NOVA reject order error:",
            error
        );


        showAlert(
            error.message ||
            "Could not reject order.",
            "error"
        );


        buttons.forEach(
            button => {
                button.disabled = false;
            }
        );
    }
}


/* =========================================================
   ORDER MODAL
========================================================= */

function openOrderModal(orderId) {

    const order =
        allOrders.find(
            item =>
                item.id === orderId
        );


    if (!order) {
        return;
    }


    setText(
        "modalOrderTitle",
        `Order #${shortId(
            order.id
        )}`
    );


    setText(
        "modalOrderId",
        order.id || "—"
    );


    setText(
        "modalService",
        order.service_title || "—"
    );


    setText(
        "modalCustomer",
        order.customer_name ||
        order.customer_email ||
        "—"
    );


    setText(
        "modalWorker",
        order.worker_name ||
        order.worker_email ||
        "—"
    );


    setText(
        "modalPrice",
        formatMoney(
            order.price,
            order.currency
        )
    );


    setText(
        "modalFee",
        formatMoney(
            order.platform_fee,
            order.currency
        )
    );


    setText(
        "modalWorkerAmount",
        formatMoney(
            order.worker_amount,
            order.currency
        )
    );


    setText(
        "modalDelivery",
        order.delivery_days
            ? `${order.delivery_days} day${
                Number(order.delivery_days) === 1
                    ? ""
                    : "s"
              }`
            : "—"
    );


    setText(
        "modalCreated",
        formatDate(
            order.created_at,
            true
        )
    );


    setText(
        "modalUpdated",
        formatDate(
            order.updated_at,
            true
        )
    );


    setText(
        "modalNotes",
        order.notes ||
        "No notes."
    );


    setText(
        "modalRequirements",
        order.requirements ||
        "No requirements."
    );


    const statusRow =
        document.getElementById(
            "modalStatusRow"
        );


    if (statusRow) {

        statusRow.innerHTML = `

            ${statusBadge(
                order.order_status
            )}

            ${paymentBadge(
                order.payment_status
            )}

        `;
    }


    const modal =
        document.getElementById(
            "orderModal"
        );


    if (modal) {

        modal.hidden =
            false;

        document.body.style.overflow =
            "hidden";
    }


    /*
     * Modal actions
     */
    setupModalOrderActions(
        order
    );
}


/* =========================================================
   MODAL ACTIONS
========================================================= */

function setupModalOrderActions(order) {

    const container =
        document.getElementById(
            "modalStatusRow"
        );


    if (!container) {
        return;
    }


    /*
     * Remove old modal action buttons
     */
    const oldActions =
        document.getElementById(
            "modalOrderActions"
        );


    if (oldActions) {
        oldActions.remove();
    }


    if (
        order.order_status !== "pending"
    ) {
        return;
    }


    const actions =
        document.createElement(
            "div"
        );


    actions.id =
        "modalOrderActions";

    actions.className =
        "order-modal-actions";


    actions.innerHTML = `

        <button
            type="button"
            id="modalAcceptOrder"
            class="accept-order-btn"
        >
            ✓ Accept Order
        </button>


        <button
            type="button"
            id="modalRejectOrder"
            class="reject-order-btn"
        >
            × Reject Order
        </button>

    `;


    container.parentElement?.appendChild(
        actions
    );


    document
        .getElementById(
            "modalAcceptOrder"
        )
        ?.addEventListener(
            "click",
            async () => {

                await acceptOrder(
                    order.id
                );

                closeOrderModal();
            }
        );


    document
        .getElementById(
            "modalRejectOrder"
        )
        ?.addEventListener(
            "click",
            async () => {

                await rejectOrder(
                    order.id
                );

                closeOrderModal();
            }
        );
}


function closeOrderModal() {

    const modal =
        document.getElementById(
            "orderModal"
        );


    if (modal) {

        modal.hidden =
            true;

        document.body.style.overflow =
            "";
    }
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    document
        .getElementById(
            "searchInput"
        )
        ?.addEventListener(
            "input",
            applyFilters
        );


    document
        .getElementById(
            "statusFilter"
        )
        ?.addEventListener(
            "change",
            applyFilters
        );


    document
        .getElementById(
            "paymentFilter"
        )
        ?.addEventListener(
            "change",
            applyFilters
        );


    document
        .getElementById(
            "currencyFilter"
        )
        ?.addEventListener(
            "change",
            applyFilters
        );


    document
        .getElementById(
            "clearFilters"
        )
        ?.addEventListener(
            "click",
            clearFilters
        );


    document
        .getElementById(
            "refreshBtn"
        )
        ?.addEventListener(
            "click",
            () =>
                loadOrders(
                    window.supabaseClient
                )
        );


    document
        .getElementById(
            "logoutBtn"
        )
        ?.addEventListener(
            "click",
            logoutAdmin
        );


    document
        .getElementById(
            "modalClose"
        )
        ?.addEventListener(
            "click",
            closeOrderModal
        );


    document
        .getElementById(
            "modalBackdrop"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    closeOrderModal();
                }
            }
        );


    document
        .getElementById(
            "ordersBody"
        )
        ?.addEventListener(
            "click",
            async event => {

                const viewButton =
                    event.target.closest(
                        ".view-order-btn"
                    );


                if (viewButton) {

                    openOrderModal(
                        viewButton.dataset.orderId
                    );

                    return;
                }


                const acceptButton =
                    event.target.closest(
                        ".accept-order-btn"
                    );


                if (acceptButton) {

                    await acceptOrder(
                        acceptButton.dataset.orderId
                    );

                    return;
                }


                const rejectButton =
                    event.target.closest(
                        ".reject-order-btn"
                    );


                if (rejectButton) {

                    await rejectOrder(
                        rejectButton.dataset.orderId
                    );
                }
            }
        );
}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearFilters() {

    const search =
        document.getElementById(
            "searchInput"
        );


    const status =
        document.getElementById(
            "statusFilter"
        );


    const payment =
        document.getElementById(
            "paymentFilter"
        );


    const currency =
        document.getElementById(
            "currencyFilter"
        );


    if (search) {
        search.value = "";
    }


    if (status) {
        status.value = "all";
    }


    if (payment) {
        payment.value = "all";
    }


    if (currency) {
        currency.value = "all";
    }


    applyFilters();
}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const layout =
        document.getElementById(
            "adminLayout"
        );


    const toggle =
        document.getElementById(
            "sidebarToggle"
        );


    const close =
        document.getElementById(
            "sidebarClose"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    toggle?.addEventListener(
        "click",
        () =>
            layout?.classList.add(
                "sidebar-open"
            )
    );


    close?.addEventListener(
        "click",
        () =>
            layout?.classList.remove(
                "sidebar-open"
            )
    );


    overlay?.addEventListener(
        "click",
        () =>
            layout?.classList.remove(
                "sidebar-open"
            )
    );
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutAdmin() {

    try {

        const client =
            window.supabaseClient;


        if (client) {
            await client.auth.signOut();
        }

    } finally {

        window.location.href =
            "../login.html";
    }
}


/* =========================================================
   STATUS BADGE
========================================================= */

function statusBadge(status) {

    const value =
        String(
            status ||
            "unknown"
        );


    const label =
        value
            .replaceAll(
                "_",
                " "
            )
            .replace(
                /\b\w/g,
                char =>
                    char.toUpperCase()
            );


    return `

        <span
            class="status-badge status-${escapeHtml(
                value
            )}"
        >

            ${escapeHtml(
                label
            )}

        </span>

    `;
}


/* =========================================================
   PAYMENT BADGE
========================================================= */

function paymentBadge(status) {

    const value =
        String(
            status ||
            "unknown"
        );


    const label =
        value
            .replaceAll(
                "_",
                " "
            )
            .replace(
                /\b\w/g,
                char =>
                    char.toUpperCase()
            );


    return `

        <span
            class="payment-badge payment-${escapeHtml(
                value
            )}"
        >

            ${escapeHtml(
                label
            )}

        </span>

    `;
}


/* =========================================================
   PERSON
========================================================= */

function personHtml(
    name,
    email,
    avatar
) {

    const displayName =
        name ||
        email ||
        "Unknown";


    const initial =
        displayName
            .charAt(0)
            .toUpperCase();


    const avatarHtml =
        avatar

            ? `
                <img
                    src="${escapeHtml(
                        avatar
                    )}"
                    alt=""
                >
              `

            : initial;


    return `

        <div class="person">

            <div class="person-avatar">

                ${avatarHtml}

            </div>


            <div class="person-info">

                <span class="person-name">

                    ${escapeHtml(
                        displayName
                    )}

                </span>


                ${
                    email

                        ? `
                            <span class="person-email">

                                ${escapeHtml(
                                    email
                                )}

                            </span>
                          `

                        : ""
                }

            </div>

        </div>

    `;
}


/* =========================================================
   MONEY
========================================================= */

function formatMoney(
    value,
    currency
) {

    const amount =
        toSafeNumber(
            value
        );


    return new Intl.NumberFormat(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(
        amount
    ) +
    ` ${currency || "MAD"}`;
}


/* =========================================================
   DATE
========================================================= */

function formatDate(
    value,
    detailed = false
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


    return detailed

        ? date.toLocaleString()

        : date.toLocaleDateString(
            undefined,
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
}


/* =========================================================
   SHORT ID
========================================================= */

function shortId(id) {

    if (!id) {
        return "—";
    }


    return String(id)
        .replaceAll("-", "")
        .slice(0, 8)
        .toUpperCase();
}


/* =========================================================
   SET TEXT
========================================================= */

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
            String(value);
    }
}


/* =========================================================
   LOADING
========================================================= */

function setLoading(value) {

    const loading =
        document.getElementById(
            "ordersLoading"
        );


    if (!loading) {
        return;
    }


    if (value) {

        loading.hidden =
            false;

        loading.classList.remove(
            "hidden"
        );

        loading.style.setProperty(
            "display",
            "flex",
            "important"
        );

    } else {

        loading.hidden =
            true;

        loading.classList.add(
            "hidden"
        );

        loading.style.setProperty(
            "display",
            "none",
            "important"
        );
    }
}


function hideLoadingForce() {

    const loading =
        document.getElementById(
            "ordersLoading"
        );


    if (!loading) {
        return;
    }


    loading.hidden =
        true;


    loading.classList.add(
        "hidden"
    );


    loading.style.setProperty(
        "display",
        "none",
        "important"
    );


    loading.style.setProperty(
        "visibility",
        "hidden",
        "important"
    );


    loading.style.setProperty(
        "opacity",
        "0",
        "important"
    );


    loading.style.setProperty(
        "pointer-events",
        "none",
        "important"
    );
}


/* =========================================================
   ALERT
========================================================= */

function showAlert(
    message,
    type = "error",
    silent = false
) {

    const alert =
        document.getElementById(
            "ordersAlert"
        );


    if (!alert) {
        return;
    }


    if (silent || !message) {

        alert.hidden =
            true;

        alert.textContent =
            "";

        return;
    }


    alert.hidden =
        false;


    alert.className =
        `orders-alert ${type}`;


    alert.textContent =
        message;


    clearTimeout(
        window.novaOrdersAlertTimer
    );


    window.novaOrdersAlertTimer =
        setTimeout(
            () => {

                alert.hidden =
                    true;

            },
            5000
        );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

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