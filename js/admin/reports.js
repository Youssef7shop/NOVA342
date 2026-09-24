"use strict";

let reportData = null;

document.addEventListener(
    "DOMContentLoaded",
    initReports
);

async function initReports() {

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

    await loadReports(client);
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
        } = await client.rpc(
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

        console.error(error);

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
                document.createElement("img");

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

            avatar.appendChild(img);

        } else {

            avatar.textContent =
                fullName
                    .charAt(0)
                    .toUpperCase();
        }
    }
}


/* =========================================================
   LOAD REPORTS
========================================================= */

async function loadReports(client) {

    setReportLoading(true);

    try {

        const period =
            document.getElementById(
                "periodFilter"
            )?.value || "30";


        const {
            data,
            error
        } = await client.rpc(
            "admin_reports",
            {
                p_days:
                    period === "all"
                        ? null
                        : Number(period)
            }
        );


        if (error) {
            throw error;
        }


        reportData =
            data || {};


        renderReports(
            reportData
        );

    } catch (error) {

        console.error(
            "admin_reports:",
            error
        );

        showAlert(
            error.message ||
            "Failed to load reports.",
            "error"
        );

    } finally {

        setReportLoading(false);
    }
}


/* =========================================================
   RENDER
========================================================= */

function renderReports(data) {

    const overview =
        data.overview || {};

    const orders =
        data.orders || {};

    const financial =
        data.financial || {};


    /* KPI */

    setText(
        "usersMetric",
        number(
            overview.total_users
        )
    );

    setText(
        "usersSub",
        `${number(overview.new_users)} new`
    );


    setText(
        "workersMetric",
        number(
            overview.total_workers
        )
    );

    setText(
        "workersSub",
        `${number(overview.active_workers)} active`
    );


    setText(
        "servicesMetric",
        number(
            overview.total_services
        )
    );

    setText(
        "servicesSub",
        `${number(overview.published_services)} published`
    );


    setText(
        "ordersMetric",
        number(
            overview.total_orders
        )
    );

    setText(
        "ordersSub",
        `${number(overview.completed_orders)} completed`
    );


    setText(
        "salesMetric",
        money(
            financial.paid_amount_mad
        )
    );


    setText(
        "feesMetric",
        money(
            financial.platform_fees_mad
        )
    );


    /* ORDER STATUS */

    const statusMap = [
        [
            "pending",
            orders.pending,
            "barPending",
            "statusPending"
        ],
        [
            "accepted",
            orders.accepted,
            "barAccepted",
            "statusAccepted"
        ],
        [
            "in_progress",
            orders.in_progress,
            "barProgress",
            "statusProgress"
        ],
        [
            "delivered",
            orders.delivered,
            "barDelivered",
            "statusDelivered"
        ],
        [
            "completed",
            orders.completed,
            "barCompleted",
            "statusCompleted"
        ],
        [
            "cancelled",
            orders.cancelled,
            "barCancelled",
            "statusCancelled"
        ]
    ];


    const maxStatus =
        Math.max(
            1,
            ...statusMap.map(
                item => Number(item[1] || 0)
            )
        );


    statusMap.forEach(
        item => {

            const value =
                Number(item[1] || 0);

            setText(
                item[3],
                value
            );

            const bar =
                document.getElementById(
                    item[2]
                );

            if (bar) {

                const percentage =
                    Math.round(
                        (value / maxStatus) *
                        100
                    );

                bar.style.width =
                    `${percentage}%`;
            }
        }
    );


    /* FINANCIAL */

    setText(
        "paidVolume",
        money(
            financial.paid_amount_mad
        )
    );

    setText(
        "platformFees",
        money(
            financial.platform_fees_mad
        )
    );

    setText(
        "workerEarnings",
        money(
            financial.worker_amount_mad
        )
    );

    setText(
        "paidTransactions",
        number(
            financial.paid_transactions
        )
    );


    renderTopServices(
        data.top_services || []
    );


    renderActivity(
        data.activity || []
    );
}


/* =========================================================
   TOP SERVICES
========================================================= */

function renderTopServices(
    services
) {

    const container =
        document.getElementById(
            "topServices"
        );

    if (!container) {
        return;
    }


    if (!services.length) {

        container.innerHTML = `
            <div class="report-loading">
                No service data available.
            </div>
        `;

        return;
    }


    container.innerHTML =
        services
            .slice(0, 8)
            .map(
                (service, index) => `
                    <div class="service-report-row">

                        <div class="service-rank">
                            ${index + 1}
                        </div>

                        <div class="service-report-info">

                            <span class="service-report-name">
                                ${escapeHtml(
                                    service.service_title ||
                                    "Untitled service"
                                )}
                            </span>

                            <span class="service-report-category">
                                ${escapeHtml(
                                    service.category ||
                                    "Other"
                                )}
                            </span>

                        </div>

                        <div class="service-report-stat">

                            <span>
                                Orders
                            </span>

                            <strong>
                                ${number(
                                    service.order_count
                                )}
                            </strong>

                        </div>

                        <div class="service-report-stat">

                            <span>
                                Sales
                            </span>

                            <strong>
                                ${formatCompactMoney(
                                    service.sales_mad
                                )}
                            </strong>

                        </div>

                    </div>
                `
            )
            .join("");
}


/* =========================================================
   ACTIVITY
========================================================= */

function renderActivity(
    activity
) {

    const container =
        document.getElementById(
            "activityList"
        );

    if (!container) {
        return;
    }


    if (!activity.length) {

        container.innerHTML = `
            <div class="report-loading">
                No recent activity.
            </div>
        `;

        return;
    }


    container.innerHTML =
        activity
            .slice(0, 8)
            .map(
                item => `
                    <div class="activity-item">

                        <div class="activity-icon">
                            ${activityIcon(
                                item.entity_type
                            )}
                        </div>

                        <div class="activity-info">

                            <div class="activity-description">
                                ${escapeHtml(
                                    item.description ||
                                    item.action ||
                                    "Activity"
                                )}
                            </div>

                            <div class="activity-date">
                                ${formatDate(
                                    item.created_at
                                )}
                            </div>

                        </div>

                    </div>
                `
            )
            .join("");
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    document
        .getElementById(
            "periodFilter"
        )
        ?.addEventListener(
            "change",
            async () => {

                const client =
                    window.supabaseClient;

                if (client) {
                    await loadReports(client);
                }
            }
        );


    document
        .getElementById(
            "refreshBtn"
        )
        ?.addEventListener(
            "click",
            async () => {

                const client =
                    window.supabaseClient;

                if (client) {
                    await loadReports(client);
                }
            }
        );


    document
        .getElementById(
            "refreshReportBtn"
        )
        ?.addEventListener(
            "click",
            async () => {

                const client =
                    window.supabaseClient;

                if (client) {
                    await loadReports(client);
                }
            }
        );


    document
        .getElementById(
            "logoutBtn"
        )
        ?.addEventListener(
            "click",
            logoutAdmin
        );
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
        () => {
            layout?.classList.add(
                "sidebar-open"
            );
        }
    );


    close?.addEventListener(
        "click",
        () => {
            layout?.classList.remove(
                "sidebar-open"
            );
        }
    );


    overlay?.addEventListener(
        "click",
        () => {
            layout?.classList.remove(
                "sidebar-open"
            );
        }
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

function setReportLoading(
    loading
) {

    const loadingElements =
        document.querySelectorAll(
            ".report-loading"
        );

    if (!loading) {
        return;
    }

    loadingElements.forEach(
        element => {
            element.style.display =
                "block";
        }
    );
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            String(value);
    }
}


function number(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-US"
    );
}


function money(value) {

    return `${Number(
        value || 0
    ).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )} MAD`;
}


function formatCompactMoney(value) {

    const amount =
        Number(value || 0);

    if (amount >= 1000000) {
        return (
            (amount / 1000000)
                .toFixed(1)
                .replace(".0", "")
            + "M MAD"
        );
    }

    if (amount >= 1000) {
        return (
            (amount / 1000)
                .toFixed(1)
                .replace(".0", "")
            + "K MAD"
        );
    }

    return (
        amount
            .toFixed(0)
        + " MAD"
    );
}


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


function activityIcon(
    type
) {

    switch (
        String(type || "").toLowerCase()
    ) {

        case "orders":
            return "▣";

        case "services":
            return "◇";

        case "profiles":
            return "♙";

        case "support":
        case "support_tickets":
            return "◌";

        case "payments":
            return "$";

        default:
            return "•";
    }
}


function showAlert(
    message,
    type = "error"
) {

    const alert =
        document.getElementById(
            "reportsAlert"
        );

    if (!alert) {
        return;
    }

    alert.hidden = false;

    alert.className =
        `reports-alert ${type}`;

    alert.textContent =
        message;

    clearTimeout(
        window.novaReportsAlertTimer
    );

    window.novaReportsAlertTimer =
        setTimeout(
            () => {
                alert.hidden = true;
            },
            5000
        );
}


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