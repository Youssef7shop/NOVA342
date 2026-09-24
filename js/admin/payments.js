"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    const supabaseClient =
        window.supabaseClient;


    const accessLoading =
        document.getElementById("accessLoading");

    const accessDenied =
        document.getElementById("accessDenied");

    const paymentsContent =
        document.getElementById("paymentsContent");

    const sidebar =
        document.getElementById("sidebar");

    const sidebarToggle =
        document.getElementById("sidebarToggle");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const refreshBtn =
        document.getElementById("refreshBtn");

    const backHomeBtn =
        document.getElementById("backHomeBtn");

    const searchInput =
        document.getElementById("searchInput");

    const paymentStatusFilter =
        document.getElementById(
            "paymentStatusFilter"
        );

    const currencyFilter =
        document.getElementById(
            "currencyFilter"
        );

    const clearFiltersBtn =
        document.getElementById(
            "clearFiltersBtn"
        );

    const paymentsTableBody =
        document.getElementById(
            "paymentsTableBody"
        );

    const resultsInfo =
        document.getElementById(
            "resultsInfo"
        );

    const loadMoreBtn =
        document.getElementById(
            "loadMoreBtn"
        );


    /* MODAL */

    const paymentModal =
        document.getElementById(
            "paymentModal"
        );

    const closeModalBtn =
        document.getElementById(
            "closeModalBtn"
        );


    let currentUser = null;

    let allPayments = [];

    let visibleLimit = 50;


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function initial(name, email) {

        const value =
            String(
                name ||
                email ||
                "U"
            ).trim();

        return (
            value.charAt(0) ||
            "U"
        ).toUpperCase();
    }


    function shortId(id) {

        if (!id) {
            return "—";
        }

        return String(id)
            .slice(0, 8)
            .toUpperCase();
    }


    function formatMoney(
        value,
        currency = "MAD"
    ) {

        const number =
            Number(value || 0);

        return new Intl.NumberFormat(
            "fr-MA",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        ).format(number) +
            ` ${currency}`;
    }


    function formatDate(value) {

        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    function normalize(value) {

        return String(
            value || ""
        )
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_");
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
            window.__novaPaymentsToast
        );

        window.__novaPaymentsToast =
            setTimeout(() => {

                toast.classList.remove(
                    "show"
                );

            }, 2500);
    }


    function showDenied() {

        accessLoading.classList.add(
            "hidden"
        );

        paymentsContent.classList.add(
            "hidden"
        );

        accessDenied.classList.remove(
            "hidden"
        );
    }


    function showContent() {

        accessLoading.classList.add(
            "hidden"
        );

        accessDenied.classList.add(
            "hidden"
        );

        paymentsContent.classList.remove(
            "hidden"
        );
    }


    /* =====================================================
       ADMIN ACCESS
    ===================================================== */

    async function checkAdmin() {

        if (!supabaseClient) {

            throw new Error(
                "Supabase client is missing."
            );
        }


        const {
            data: userData,
            error: userError
        } =
            await supabaseClient
                .auth
                .getUser();


        if (userError) {
            throw userError;
        }


        if (!userData?.user) {

            window.location.replace(
                "../login.html?redirect=admin/payments.html"
            );

            return false;
        }


        currentUser =
            userData.user;


        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient.rpc(
                "admin_current_profile"
            );


        if (profileError) {
            throw profileError;
        }


        if (!profile) {
            return false;
        }


        const isAdmin =
            String(
                profile.role || ""
            ).toLowerCase() ===
            "admin";


        const active =
            profile.is_active !== false;


        if (
            !isAdmin ||
            !active
        ) {
            return false;
        }


        applyAdminProfile(
            profile
        );


        return true;
    }


    function applyAdminProfile(
        profile
    ) {

        const name =
            profile.full_name ||
            [
                profile.first_name,
                profile.last_name
            ]
                .filter(Boolean)
                .join(" ") ||
            currentUser
                ?.email
                ?.split("@")[0] ||
            "Admin";


        const email =
            profile.email ||
            currentUser?.email ||
            "";


        document.getElementById(
            "adminName"
        ).textContent =
            name;


        document.getElementById(
            "adminEmail"
        ).textContent =
            email;


        document.getElementById(
            "adminInitial"
        ).textContent =
            initial(
                name,
                email
            );
    }


    /* =====================================================
       STATS
    ===================================================== */

    async function loadStats() {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "admin_payment_stats"
            );


        if (error) {
            throw error;
        }


        const stats =
            data || {};


        document.getElementById(
            "totalTransactions"
        ).textContent =
            Number(
                stats.total_transactions || 0
            ).toLocaleString();


        document.getElementById(
            "paidTransactions"
        ).textContent =
            Number(
                stats.paid_transactions || 0
            ).toLocaleString();


        document.getElementById(
            "pendingTransactions"
        ).textContent =
            Number(
                stats.pending_transactions || 0
            ).toLocaleString();


        document.getElementById(
            "failedTransactions"
        ).textContent =
            Number(
                stats.failed_transactions || 0
            ).toLocaleString();


        document.getElementById(
            "paidAmount"
        ).textContent =
            formatMoney(
                stats.paid_amount_mad || 0,
                "MAD"
            );


        document.getElementById(
            "platformFees"
        ).textContent =
            formatMoney(
                stats.platform_fees_mad || 0,
                "MAD"
            );
    }


    /* =====================================================
       LOAD PAYMENTS
    ===================================================== */

    async function loadPayments() {

        paymentsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="table-loading"
                >
                    Loading payments...
                </td>
            </tr>
        `;


        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "admin_payments"
            );


        if (error) {

            console.error(
                "NOVA admin payments error:",
                error
            );


            paymentsTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="9"
                        class="empty-payments"
                    >
                        ${escapeHtml(
                            error.message ||
                            "Could not load payments."
                        )}
                    </td>
                </tr>
            `;

            return;
        }


        allPayments =
            Array.isArray(data)
                ? data
                : [];


        visibleLimit =
            50;


        renderPayments();
    }


    /* =====================================================
       FILTER
    ===================================================== */

    function getFilteredPayments() {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();


        const paymentStatus =
            normalize(
                paymentStatusFilter.value
            );


        const currency =
            String(
                currencyFilter.value ||
                ""
            ).toUpperCase();


        return allPayments.filter(
            payment => {

                const searchable =
                    [
                        payment.id,
                        payment.service_title,
                        payment.customer_name,
                        payment.customer_email,
                        payment.worker_name,
                        payment.worker_email,
                        payment.payment_status,
                        payment.order_status
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                const searchMatch =
                    !query ||
                    searchable.includes(query);


                const paymentMatch =
                    !paymentStatus ||
                    normalize(
                        payment.payment_status
                    ) === paymentStatus;


                const currencyMatch =
                    !currency ||
                    String(
                        payment.currency || ""
                    ).toUpperCase() === currency;


                return (
                    searchMatch &&
                    paymentMatch &&
                    currencyMatch
                );
            }
        );
    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderPayments() {

        const filtered =
            getFilteredPayments();


        const visible =
            filtered.slice(
                0,
                visibleLimit
            );


        resultsInfo.textContent =
            `${filtered.length} payment${
                filtered.length === 1
                    ? ""
                    : "s"
            }`;


        loadMoreBtn.disabled =
            visibleLimit >=
            filtered.length;


        if (!filtered.length) {

            paymentsTableBody.innerHTML = `
                <tr>

                    <td
                        colspan="9"
                        class="empty-payments"
                    >
                        No payment records found.
                    </td>

                </tr>
            `;

            return;
        }


        paymentsTableBody.innerHTML =
            visible
                .map(
                    payment =>
                        createPaymentRow(
                            payment
                        )
                )
                .join("");


        paymentsTableBody
            .querySelectorAll(
                "[data-payment-id]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const paymentId =
                                button.dataset.paymentId;


                            const payment =
                                allPayments.find(
                                    item =>
                                        item.id ===
                                        paymentId
                                );


                            if (payment) {
                                openPaymentModal(
                                    payment
                                );
                            }
                        }
                    );
                }
            );
    }


    /* =====================================================
       PAYMENT ROW
    ===================================================== */

    function createPaymentRow(
        payment
    ) {

        const customer =
            payment.customer_name ||
            "Unknown Customer";


        const worker =
            payment.worker_name ||
            "Unknown Worker";


        const customerAvatar =
            payment.customer_avatar
                ? `
                    <img
                        src="${escapeHtml(
                            payment.customer_avatar
                        )}"
                        alt="Customer"
                    >
                `
                : escapeHtml(
                    initial(
                        customer,
                        payment.customer_email
                    )
                );


        const workerAvatar =
            payment.worker_avatar
                ? `
                    <img
                        src="${escapeHtml(
                            payment.worker_avatar
                        )}"
                        alt="Worker"
                    >
                `
                : escapeHtml(
                    initial(
                        worker,
                        payment.worker_email
                    )
                );


        const paymentStatus =
            normalize(
                payment.payment_status ||
                "unpaid"
            );


        const orderStatus =
            normalize(
                payment.order_status ||
                "pending"
            );


        const currency =
            payment.currency ||
            "MAD";


        return `
            <tr>

                <td>

                    <div class="order-cell">

                        <span class="order-id">
                            #${escapeHtml(
                                shortId(
                                    payment.id
                                )
                            )}
                        </span>

                        <span class="order-service">
                            ${escapeHtml(
                                payment.service_title ||
                                "Untitled Service"
                            )}
                        </span>

                        <button
                            type="button"
                            class="details-payment-btn"
                            data-payment-id="${escapeHtml(
                                payment.id
                            )}"
                            style="margin-top:6px;width:max-content;"
                        >
                            Details
                        </button>

                    </div>

                </td>


                <td>

                    <div class="person-cell">

                        <div class="person-avatar">
                            ${customerAvatar}
                        </div>

                        <div class="person-info">

                            <strong>
                                ${escapeHtml(
                                    customer
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    payment.customer_email ||
                                    ""
                                )}
                            </span>

                        </div>

                    </div>

                </td>


                <td>

                    <div class="person-cell">

                        <div class="person-avatar">
                            ${workerAvatar}
                        </div>

                        <div class="person-info">

                            <strong>
                                ${escapeHtml(
                                    worker
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    payment.worker_email ||
                                    ""
                                )}
                            </span>

                        </div>

                    </div>

                </td>


                <td>

                    <div>

                        <div class="amount-main">
                            ${escapeHtml(
                                formatMoney(
                                    payment.price,
                                    currency
                                )
                            )}
                        </div>

                        <div class="amount-sub">
                            Order amount
                        </div>

                    </div>

                </td>


                <td>

                    <div>

                        <div
                            class="amount-main"
                            style="color:var(--purple);"
                        >
                            ${escapeHtml(
                                formatMoney(
                                    payment.platform_fee,
                                    currency
                                )
                            )}
                        </div>

                        <div class="amount-sub">
                            NOVA fee
                        </div>

                    </div>

                </td>


                <td>

                    <div>

                        <div
                            class="amount-main"
                            style="color:var(--green);"
                        >
                            ${escapeHtml(
                                formatMoney(
                                    payment.worker_amount,
                                    currency
                                )
                            )}
                        </div>

                        <div class="amount-sub">
                            Worker payout
                        </div>

                    </div>

                </td>


                <td>

                    <span
                        class="payment-badge payment-${escapeHtml(
                            paymentStatus
                        )}"
                    >
                        ${escapeHtml(
                            paymentStatus.replace(
                                /_/g,
                                " "
                            )
                        )}
                    </span>

                </td>


                <td>

                    <span
                        class="order-badge order-${escapeHtml(
                            orderStatus
                        )}"
                    >
                        ${escapeHtml(
                            orderStatus.replace(
                                /_/g,
                                " "
                            )
                        )}
                    </span>

                </td>


                <td>

                    <span class="date-cell">
                        ${escapeHtml(
                            formatDate(
                                payment.created_at
                            )
                        )}
                    </span>

                </td>

            </tr>
        `;
    }


    /* =====================================================
       PAYMENT MODAL
    ===================================================== */

    function openPaymentModal(
        payment
    ) {

        document.getElementById(
            "modalService"
        ).textContent =
            payment.service_title ||
            "Untitled Service";


        document.getElementById(
            "modalOrderId"
        ).textContent =
            `Order #${shortId(
                payment.id
            )}`;


        document.getElementById(
            "modalCustomer"
        ).textContent =
            payment.customer_name ||
            "Unknown";


        document.getElementById(
            "modalWorker"
        ).textContent =
            payment.worker_name ||
            "Unknown";


        document.getElementById(
            "modalAmount"
        ).textContent =
            formatMoney(
                payment.price,
                payment.currency || "MAD"
            );


        document.getElementById(
            "modalFee"
        ).textContent =
            formatMoney(
                payment.platform_fee,
                payment.currency || "MAD"
            );


        document.getElementById(
            "modalWorkerAmount"
        ).textContent =
            formatMoney(
                payment.worker_amount,
                payment.currency || "MAD"
            );


        document.getElementById(
            "modalPaymentStatus"
        ).textContent =
            String(
                payment.payment_status ||
                "unpaid"
            )
                .replace(
                    /_/g,
                    " "
                );


        document.getElementById(
            "modalOrderStatus"
        ).textContent =
            String(
                payment.order_status ||
                "pending"
            )
                .replace(
                    /_/g,
                    " "
                );


        document.getElementById(
            "modalCreated"
        ).textContent =
            formatDate(
                payment.created_at
            );


        paymentModal.classList.remove(
            "hidden"
        );
    }


    function closePaymentModal() {

        paymentModal.classList.add(
            "hidden"
        );
    }


    /* =====================================================
       FILTER EVENTS
    ===================================================== */

    searchInput?.addEventListener(
        "input",
        renderPayments
    );


    paymentStatusFilter?.addEventListener(
        "change",
        renderPayments
    );


    currencyFilter?.addEventListener(
        "change",
        renderPayments
    );


    clearFiltersBtn?.addEventListener(
        "click",
        () => {

            searchInput.value =
                "";

            paymentStatusFilter.value =
                "";

            currencyFilter.value =
                "";

            renderPayments();
        }
    );


    loadMoreBtn?.addEventListener(
        "click",
        () => {

            visibleLimit += 50;

            renderPayments();
        }
    );


    /* =====================================================
       REFRESH
    ===================================================== */

    refreshBtn?.addEventListener(
        "click",
        async () => {

            refreshBtn.disabled =
                true;


            try {

                await Promise.all([
                    loadStats(),
                    loadPayments()
                ]);


                showToast(
                    "Payments refreshed."
                );

            } catch (error) {

                console.error(error);

                showToast(
                    "Refresh failed."
                );
            }


            refreshBtn.disabled =
                false;
        }
    );


    /* =====================================================
       MODAL
    ===================================================== */

    closeModalBtn?.addEventListener(
        "click",
        closePaymentModal
    );


    paymentModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                paymentModal
            ) {

                closePaymentModal();
            }
        }
    );


    /* =====================================================
       SIDEBAR
    ===================================================== */

    sidebarToggle?.addEventListener(
        "click",
        () => {

            sidebar?.classList.toggle(
                "open"
            );
        }
    );


    document
        .querySelectorAll(".nav-item")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        sidebar?.classList.remove(
                            "open"
                        );
                    }
                );

            }
        );


    /* =====================================================
       BACK HOME
    ===================================================== */

    backHomeBtn?.addEventListener(
        "click",
        () => {

            window.location.replace(
                "../index.html"
            );
        }
    );


    /* =====================================================
       LOGOUT
    ===================================================== */

    logoutBtn?.addEventListener(
        "click",
        async () => {

            try {

                const {
                    error
                } =
                    await supabaseClient
                        .auth
                        .signOut();


                if (error) {
                    throw error;
                }


                window.location.replace(
                    "../login.html"
                );

            } catch (error) {

                console.error(error);

                showToast(
                    "Logout failed."
                );
            }
        }
    );


    /* =====================================================
       AUTH STATE
    ===================================================== */

    supabaseClient?.auth
        .onAuthStateChange(
            event => {

                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    window.location.replace(
                        "../login.html"
                    );
                }
            }
        );


    /* =====================================================
       INIT
    ===================================================== */

    try {

        if (!supabaseClient) {

            throw new Error(
                "Supabase client missing."
            );
        }


        const allowed =
            await checkAdmin();


        if (!allowed) {

            showDenied();

            return;
        }


        showContent();


        await Promise.all([
            loadStats(),
            loadPayments()
        ]);


    } catch (error) {

        console.error(
            "NOVA Admin Payments initialization error:",
            error
        );


        showDenied();
    }

});