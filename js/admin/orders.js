"use strict";

let allOrders = [];
let filteredOrders = [];

document.addEventListener("DOMContentLoaded", initOrders);

async function initOrders() {
    setupSidebar();
    setupEvents();

    const client = window.supabaseClient;

    if (!client) {
        showAlert("Supabase is not configured correctly.", "error");
        return;
    }

    const adminOk = await checkAdmin(client);

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
        } = await client.auth.getUser();

        if (userError || !userData?.user) {
            window.location.href = "../login.html";
            return false;
        }

        const {
            data: profile,
            error
        } = await client.rpc("admin_current_profile");

        if (error) {
            showAlert(error.message || "Admin verification failed.", "error");
            return false;
        }

        if (
            !profile ||
            profile.role !== "admin" ||
            profile.is_active === false
        ) {
            window.location.href = "../login.html";
            return false;
        }

        applyAdminProfile(profile);

        return true;

    } catch (error) {
        console.error(error);
        showAlert("Unable to verify administrator.", "error");
        return false;
    }
}

/* =========================================================
   PROFILE
========================================================= */

function applyAdminProfile(profile) {
    const name = document.getElementById("adminName");
    const email = document.getElementById("adminEmail");
    const avatar = document.getElementById("adminAvatar");

    const fullName =
        profile.full_name ||
        [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(" ") ||
        "Admin";

    if (name) {
        name.textContent = fullName;
    }

    if (email) {
        email.textContent = profile.email || "";
    }

    if (avatar) {
        if (profile.avatar_url) {
            avatar.innerHTML = "";

            const img = document.createElement("img");
            img.src = profile.avatar_url;
            img.alt = "Admin";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";

            avatar.appendChild(img);
        } else {
            avatar.textContent =
                fullName.charAt(0).toUpperCase();
        }
    }
}

/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders(client) {
    setLoading(true);

    try {
        const {
            data,
            error
        } = await client.rpc("admin_orders");

        if (error) {
            throw error;
        }

        allOrders = Array.isArray(data)
            ? data
            : [];

        updateStats();
        applyFilters();

    } catch (error) {
        console.error("admin_orders:", error);

        allOrders = [];

        showAlert(
            error.message ||
            "Failed to load orders.",
            "error"
        );

        renderOrders();

    } finally {
        setLoading(false);
    }
}

/* =========================================================
   FILTERS
========================================================= */

function applyFilters() {
    const search =
        document.getElementById("searchInput")
            ?.value
            .trim()
            .toLowerCase() || "";

    const status =
        document.getElementById("statusFilter")
            ?.value || "all";

    const payment =
        document.getElementById("paymentFilter")
            ?.value || "all";

    const currency =
        document.getElementById("currencyFilter")
            ?.value || "all";

    filteredOrders = allOrders.filter(order => {

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

        const matchesSearch =
            !search ||
            searchText.includes(search);

        const matchesStatus =
            status === "all" ||
            order.order_status === status;

        const matchesPayment =
            payment === "all" ||
            order.payment_status === payment;

        const matchesCurrency =
            currency === "all" ||
            order.currency === currency;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesPayment &&
            matchesCurrency
        );
    });

    renderOrders();
}

/* =========================================================
   STATS
========================================================= */

function updateStats() {

    const total = allOrders.length;

    const pending =
        allOrders.filter(
            o => o.order_status === "pending"
        ).length;

    const progress =
        allOrders.filter(
            o =>
                o.order_status === "accepted" ||
                o.order_status === "in_progress" ||
                o.order_status === "delivered"
        ).length;

    const completed =
        allOrders.filter(
            o => o.order_status === "completed"
        ).length;

    const cancelled =
        allOrders.filter(
            o =>
                o.order_status === "cancelled" ||
                o.order_status === "rejected"
        ).length;

    setText("totalOrders", total);
    setText("pendingOrders", pending);
    setText("progressOrders", progress);
    setText("completedOrders", completed);
    setText("cancelledOrders", cancelled);
}

/* =========================================================
   RENDER
========================================================= */

function renderOrders() {

    const body =
        document.getElementById("ordersBody");

    const empty =
        document.getElementById("ordersEmpty");

    if (!body) {
        return;
    }

    body.innerHTML = "";

    if (!filteredOrders.length) {
        if (empty) {
            empty.hidden = false;
        }

        setText("ordersCount", "0 orders");
        return;
    }

    if (empty) {
        empty.hidden = true;
    }

    const fragment =
        document.createDocumentFragment();

    filteredOrders.forEach(order => {

        const tr =
            document.createElement("tr");

        tr.innerHTML = `
            <td>
                <div class="order-main">
                    <span class="order-number">
                        #${escapeHtml(shortId(order.id))}
                    </span>

                    <span class="order-id">
                        ${escapeHtml(order.id || "—")}
                    </span>
                </div>
            </td>

            <td>
                <div class="service-name">
                    ${escapeHtml(order.service_title || "Untitled Service")}
                </div>

                <div class="service-category">
                    ${escapeHtml(order.category || "Other")}
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
                    ${formatMoney(order.price, order.currency)}
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
                ${paymentBadge(order.payment_status)}
            </td>

            <td>
                ${statusBadge(order.order_status)}
            </td>

            <td>
                <span class="date-cell">
                    ${formatDate(order.created_at)}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="view-order-btn"
                    data-order-id="${escapeHtml(order.id)}"
                >
                    View
                </button>
            </td>
        `;

        fragment.appendChild(tr);
    });

    body.appendChild(fragment);

    setText(
        "ordersCount",
        `${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"}`
    );
}

/* =========================================================
   DETAILS
========================================================= */

function openOrderModal(orderId) {

    const order =
        allOrders.find(
            item => item.id === orderId
        );

    if (!order) {
        return;
    }

    setText(
        "modalOrderTitle",
        `Order #${shortId(order.id)}`
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
            ? `${order.delivery_days} day${Number(order.delivery_days) === 1 ? "" : "s"}`
            : "—"
    );

    setText(
        "modalCreated",
        formatDate(order.created_at, true)
    );

    setText(
        "modalUpdated",
        formatDate(order.updated_at, true)
    );

    setText(
        "modalNotes",
        order.notes || "No notes."
    );

    setText(
        "modalRequirements",
        order.requirements || "No requirements."
    );

    const statusRow =
        document.getElementById(
            "modalStatusRow"
        );

    if (statusRow) {
        statusRow.innerHTML = `
            ${statusBadge(order.order_status)}
            ${paymentBadge(order.payment_status)}
        `;
    }

    const modal =
        document.getElementById("orderModal");

    if (modal) {
        modal.hidden = false;
        document.body.style.overflow = "hidden";
    }
}

function closeOrderModal() {

    const modal =
        document.getElementById("orderModal");

    if (modal) {
        modal.hidden = true;
        document.body.style.overflow = "";
    }
}

/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    document
        .getElementById("searchInput")
        ?.addEventListener(
            "input",
            applyFilters
        );

    document
        .getElementById("statusFilter")
        ?.addEventListener(
            "change",
            applyFilters
        );

    document
        .getElementById("paymentFilter")
        ?.addEventListener(
            "change",
            applyFilters
        );

    document
        .getElementById("currencyFilter")
        ?.addEventListener(
            "change",
            applyFilters
        );

    document
        .getElementById("clearFilters")
        ?.addEventListener(
            "click",
            clearFilters
        );

    document
        .getElementById("refreshBtn")
        ?.addEventListener(
            "click",
            () => window.location.reload()
        );

    document
        .getElementById("logoutBtn")
        ?.addEventListener(
            "click",
            logoutAdmin
        );

    document
        .getElementById("modalClose")
        ?.addEventListener(
            "click",
            closeOrderModal
        );

    document
        .getElementById("modalBackdrop")
        ?.addEventListener(
            "click",
            closeOrderModal
        );

    document
        .getElementById("ordersBody")
        ?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        ".view-order-btn"
                    );

                if (!button) {
                    return;
                }

                openOrderModal(
                    button.dataset.orderId
                );
            }
        );
}

function clearFilters() {

    const search =
        document.getElementById("searchInput");

    const status =
        document.getElementById("statusFilter");

    const payment =
        document.getElementById("paymentFilter");

    const currency =
        document.getElementById("currencyFilter");

    if (search) search.value = "";
    if (status) status.value = "all";
    if (payment) payment.value = "all";
    if (currency) currency.value = "all";

    applyFilters();
}

/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const layout =
        document.getElementById("adminLayout");

    const toggle =
        document.getElementById("sidebarToggle");

    const close =
        document.getElementById("sidebarClose");

    const overlay =
        document.getElementById("sidebarOverlay");

    toggle?.addEventListener(
        "click",
        () => layout?.classList.add("sidebar-open")
    );

    close?.addEventListener(
        "click",
        () => layout?.classList.remove("sidebar-open")
    );

    overlay?.addEventListener(
        "click",
        () => layout?.classList.remove("sidebar-open")
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
   HELPERS
========================================================= */

function statusBadge(status) {

    const value =
        String(status || "unknown");

    const label =
        value
            .replaceAll("_", " ")
            .replace(/\b\w/g, c => c.toUpperCase());

    return `
        <span class="status-badge status-${escapeHtml(value)}">
            ${escapeHtml(label)}
        </span>
    `;
}

function paymentBadge(status) {

    const value =
        String(status || "unknown");

    const label =
        value
            .replaceAll("_", " ")
            .replace(/\b\w/g, c => c.toUpperCase());

    return `
        <span class="payment-badge payment-${escapeHtml(value)}">
            ${escapeHtml(label)}
        </span>
    `;
}

function personHtml(
    name,
    email,
    avatar
) {

    const displayName =
        name || email || "Unknown";

    const initial =
        displayName
            .charAt(0)
            .toUpperCase();

    const avatarHtml = avatar
        ? `
            <img
                src="${escapeHtml(avatar)}"
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
                    ${escapeHtml(displayName)}
                </span>

                ${
                    email
                        ? `
                            <span class="person-email">
                                ${escapeHtml(email)}
                            </span>
                          `
                        : ""
                }

            </div>

        </div>
    `;
}

function formatMoney(
    value,
    currency
) {

    const amount =
        Number(value || 0);

    return `${amount.toFixed(2)} ${currency || "MAD"}`;
}

function formatDate(
    value,
    detailed = false
) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
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

function shortId(id) {

    if (!id) {
        return "—";
    }

    return id
        .replaceAll("-", "")
        .slice(0, 8)
        .toUpperCase();
}

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            String(value);
    }
}

function setLoading(value) {

    const loading =
        document.getElementById(
            "ordersLoading"
        );

    if (loading) {
        loading.hidden = !value;
    }
}

function showAlert(
    message,
    type = "error"
) {

    const alert =
        document.getElementById(
            "ordersAlert"
        );

    if (!alert) {
        return;
    }

    alert.hidden = false;
    alert.className =
        `orders-alert ${type}`;

    alert.textContent =
        message;

    clearTimeout(
        window.novaOrdersAlertTimer
    );

    window.novaOrdersAlertTimer =
        setTimeout(() => {
            alert.hidden = true;
        }, 5000);
}

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}