/* =========================================================
   NOVA MARKET — ADMIN REPORTS
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

let reportData = null;

let currentStartDate = "";
let currentEndDate = "";

let currentPeriodLabel = "Last 30 days";


/* =========================================================
   DEFAULT INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initReports
);


async function initReports() {

    setupSidebar();
    setupEvents();

    setDefaultPeriod(30);

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
        await verifyAdmin(client);

    if (!adminOk) {
        return;
    }


    await loadReport(client);
}


/* =========================================================
   ADMIN VERIFICATION
========================================================= */

async function verifyAdmin(client) {

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

            console.error(
                "admin_current_profile:",
                error
            );

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
            "Admin verification error:",
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
   ADMIN PROFILE
========================================================= */

function applyAdminProfile(profile) {

    const nameElement =
        document.getElementById(
            "adminName"
        );

    const emailElement =
        document.getElementById(
            "adminEmail"
        );

    const avatarElement =
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


    if (nameElement) {

        nameElement.textContent =
            fullName;
    }


    if (emailElement) {

        emailElement.textContent =
            profile.email ||
            "";
    }


    if (avatarElement) {

        avatarElement.innerHTML = "";

        if (profile.avatar_url) {

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

            img.style.borderRadius =
                "50%";

            avatarElement.appendChild(
                img
            );

        } else {

            avatarElement.textContent =
                fullName
                    .charAt(0)
                    .toUpperCase();
        }
    }
}


/* =========================================================
   PERIOD
========================================================= */

function setDefaultPeriod(days) {

    const end =
        new Date();

    const start =
        new Date();


    start.setDate(
        end.getDate() -
        (days - 1)
    );


    currentStartDate =
        formatInputDate(
            start
        );

    currentEndDate =
        formatInputDate(
            end
        );


    currentPeriodLabel =
        `Last ${days} days`;


    document
        .querySelectorAll(
            ".period-btn"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.days ===
                    String(days)
                );
            }
        );


    const customPanel =
        document.getElementById(
            "customPeriod"
        );

    if (customPanel) {
        customPanel.hidden = true;
    }


    updatePeriodLabel();
}


/* =========================================================
   CUSTOM PERIOD
========================================================= */

function openCustomPeriod() {

    const panel =
        document.getElementById(
            "customPeriod"
        );

    if (panel) {
        panel.hidden = false;
    }


    const start =
        document.getElementById(
            "startDate"
        );

    const end =
        document.getElementById(
            "endDate"
        );


    if (start) {

        start.value =
            currentStartDate;
    }


    if (end) {

        end.value =
            currentEndDate;
    }
}


async function applyCustomPeriod() {

    const start =
        document.getElementById(
            "startDate"
        )?.value;


    const end =
        document.getElementById(
            "endDate"
        )?.value;


    if (!start || !end) {

        showAlert(
            "Please select both dates.",
            "error"
        );

        return;
    }


    if (start > end) {

        showAlert(
            "Start date cannot be after end date.",
            "error"
        );

        return;
    }


    currentStartDate =
        start;

    currentEndDate =
        end;


    currentPeriodLabel =
        `${formatReadableDate(start)} → ${formatReadableDate(end)}`;


    updatePeriodLabel();


    await loadReport(
        window.supabaseClient
    );
}


function updatePeriodLabel() {

    const element =
        document.getElementById(
            "periodLabel"
        );


    if (element) {

        element.textContent =
            currentPeriodLabel;
    }
}


/* =========================================================
   LOAD REPORT
========================================================= */

async function loadReport(client) {

    if (!client) {

        showAlert(
            "Supabase is not available.",
            "error"
        );

        return;
    }


    try {

        setReportLoading(true);


        const {
            data,
            error
        } = await client.rpc(
            "admin_reports",
            {
                p_start_date:
                    currentStartDate,

                p_end_date:
                    currentEndDate
            }
        );


        if (error) {
            throw error;
        }


        reportData =
            normalizeReportData(
                data
            );


        renderReport(
            reportData
        );


        showAlert(
            "Report updated successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "admin_reports:",
            error
        );


        showAlert(
            error.message ||
            "Failed to load report.",
            "error"
        );

    } finally {

        setReportLoading(false);
    }
}


/* =========================================================
   NORMALIZE DATA
========================================================= */

function normalizeReportData(data) {

    const source =
        data || {};


    return {

        summary:
            source.summary || {},

        users:
            source.users || {},

        workers:
            source.workers || {},

        orders:
            source.orders || {},

        payments:
            source.payments || {},

        timeline:
            Array.isArray(
                source.timeline
            )
                ? source.timeline
                : [],

        top_services:
            Array.isArray(
                source.top_services
            )
                ? source.top_services
                : [],

        top_workers:
            Array.isArray(
                source.top_workers
            )
                ? source.top_workers
                : []
    };
}


/* =========================================================
   RENDER REPORT
========================================================= */

function renderReport(data) {

    const summary =
        data.summary;

    const users =
        data.users;

    const workers =
        data.workers;

    const orders =
        data.orders;

    const payments =
        data.payments;


    /* -----------------------------------------
       KPI
    ----------------------------------------- */

    setText(
        "grossSales",
        `${money(summary.gross_sales_mad)} MAD`
    );


    setText(
        "platformFees",
        `${money(summary.platform_fees_mad)} MAD`
    );


    setText(
        "totalOrders",
        summary.total_orders || 0
    );


    setText(
        "completedOrders",
        summary.completed_orders || 0
    );


    setText(
        "newUsers",
        users.new_users || 0
    );


    setText(
        "newWorkers",
        workers.new_workers || 0
    );


    /* -----------------------------------------
       CHART TOTALS
    ----------------------------------------- */

    setText(
        "chartOrderTotal",
        summary.total_orders || 0
    );


    setText(
        "chartSalesTotal",
        `${money(summary.gross_sales_mad)} MAD`
    );


    /* -----------------------------------------
       CHARTS
    ----------------------------------------- */

    drawOrdersChart(
        data.timeline
    );


    drawSalesChart(
        data.timeline
    );


    /* -----------------------------------------
       BREAKDOWNS
    ----------------------------------------- */

    renderStatusBreakdown(
        orders.by_status || {}
    );


    renderPaymentBreakdown(
        payments.by_status || {}
    );


    /* -----------------------------------------
       TOP LISTS
    ----------------------------------------- */

    renderTopServices(
        data.top_services
    );


    renderTopWorkers(
        data.top_workers
    );


    /* -----------------------------------------
       SUMMARY
    ----------------------------------------- */

    renderSummary(
        summary,
        users,
        workers
    );
}


/* =========================================================
   ORDER CHART
========================================================= */

function drawOrdersChart(timeline) {

    const canvas =
        document.getElementById(
            "ordersChart"
        );


    if (!canvas) {
        return;
    }


    const ctx =
        setupCanvas(
            canvas
        );


    const width =
        canvas.clientWidth;

    const height =
        canvas.clientHeight;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    if (!timeline.length) {

        drawEmptyChart(
            ctx,
            width,
            height,
            "No order data"
        );

        return;
    }


    const values =
        timeline.map(
            item =>
                Number(
                    item.orders || 0
                )
        );


    const dates =
        timeline.map(
            item =>
                item.date
        );


    drawLineChart(
        ctx,
        width,
        height,
        values,
        dates,
        false
    );
}


/* =========================================================
   SALES CHART
========================================================= */

function drawSalesChart(timeline) {

    const canvas =
        document.getElementById(
            "salesChart"
        );


    if (!canvas) {
        return;
    }


    const ctx =
        setupCanvas(
            canvas
        );


    const width =
        canvas.clientWidth;

    const height =
        canvas.clientHeight;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    if (!timeline.length) {

        drawEmptyChart(
            ctx,
            width,
            height,
            "No sales data"
        );

        return;
    }


    const values =
        timeline.map(
            item =>
                Number(
                    item.sales_mad || 0
                )
        );


    const dates =
        timeline.map(
            item =>
                item.date
        );


    drawLineChart(
        ctx,
        width,
        height,
        values,
        dates,
        true
    );
}


/* =========================================================
   CANVAS SETUP
========================================================= */

function setupCanvas(canvas) {

    const rect =
        canvas.getBoundingClientRect();


    const ratio =
        window.devicePixelRatio ||
        1;


    const width =
        Math.max(
            rect.width,
            1
        );


    const height =
        Math.max(
            rect.height,
            1
        );


    canvas.width =
        Math.round(
            width * ratio
        );


    canvas.height =
        Math.round(
            height * ratio
        );


    const ctx =
        canvas.getContext(
            "2d"
        );


    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );


    return ctx;
}


/* =========================================================
   LINE CHART
========================================================= */

function drawLineChart(
    ctx,
    width,
    height,
    values,
    dates,
    moneyMode = false
) {

    const padding = {
        top: 22,
        right: 18,
        bottom: 38,
        left: 45
    };


    const chartWidth =
        Math.max(
            width -
            padding.left -
            padding.right,
            1
        );


    const chartHeight =
        Math.max(
            height -
            padding.top -
            padding.bottom,
            1
        );


    let maxValue =
        Math.max(
            ...values,
            1
        );


    /* -----------------------------------------
       NICE MAX
    ----------------------------------------- */

    if (moneyMode) {

        const magnitude =
            Math.pow(
                10,
                Math.max(
                    0,
                    Math.floor(
                        Math.log10(
                            maxValue
                        )
                    )
                )
            );

        const normalized =
            maxValue /
            magnitude;

        let nice =
            1;

        if (normalized <= 1) {
            nice = 1;
        } else if (normalized <= 2) {
            nice = 2;
        } else if (normalized <= 5) {
            nice = 5;
        } else {
            nice = 10;
        }

        maxValue =
            nice * magnitude;
    }


    /* -----------------------------------------
       GRID
    ----------------------------------------- */

    ctx.lineWidth = 1;

    ctx.font =
        "9px Arial";


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            padding.top +
            chartHeight -
            (
                chartHeight *
                i /
                4
            );


        ctx.strokeStyle =
            "rgba(255,255,255,.055)";


        ctx.beginPath();

        ctx.moveTo(
            padding.left,
            y
        );

        ctx.lineTo(
            width -
            padding.right,
            y
        );

        ctx.stroke();


        const labelValue =
            (
                maxValue *
                i /
                4
            );


        const label =
            moneyMode
                ? formatCompactMoney(
                    labelValue
                )
                : Math.round(
                    labelValue
                ).toString();


        ctx.fillStyle =
            "rgba(255,255,255,.25)";


        ctx.textAlign =
            "right";


        ctx.fillText(
            label,
            padding.left - 7,
            y + 3
        );
    }


    /* -----------------------------------------
       POINTS
    ----------------------------------------- */

    const count =
        values.length;


    const step =
        count > 1
            ? chartWidth /
              (count - 1)
            : 0;


    const points =
        values.map(
            (value, index) => {

                const x =
                    count === 1
                        ? (
                            padding.left +
                            chartWidth / 2
                        )
                        : (
                            padding.left +
                            index * step
                        );


                const y =
                    padding.top +
                    chartHeight -
                    (
                        (
                            Number(value) /
                            maxValue
                        ) *
                        chartHeight
                    );


                return {
                    x,
                    y
                };
            }
        );


    /* -----------------------------------------
       AREA
    ----------------------------------------- */

    if (points.length) {

        const gradient =
            ctx.createLinearGradient(
                0,
                padding.top,
                0,
                height -
                padding.bottom
            );


        gradient.addColorStop(
            0,
            "rgba(110,98,255,.18)"
        );


        gradient.addColorStop(
            1,
            "rgba(110,98,255,0)"
        );


        ctx.fillStyle =
            gradient;


        ctx.beginPath();


        ctx.moveTo(
            points[0].x,
            height -
            padding.bottom
        );


        points.forEach(
            point => {

                ctx.lineTo(
                    point.x,
                    point.y
                );
            }
        );


        ctx.lineTo(
            points[
                points.length - 1
            ].x,
            height -
            padding.bottom
        );


        ctx.closePath();

        ctx.fill();
    }


    /* -----------------------------------------
       LINE
    ----------------------------------------- */

    if (points.length) {

        ctx.beginPath();


        points.forEach(
            (point, index) => {

                if (index === 0) {

                    ctx.moveTo(
                        point.x,
                        point.y
                    );

                } else {

                    ctx.lineTo(
                        point.x,
                        point.y
                    );
                }
            }
        );


        ctx.strokeStyle =
            "#776cff";

        ctx.lineWidth =
            2;


        ctx.stroke();
    }


    /* -----------------------------------------
       POINT DOTS
    ----------------------------------------- */

    points.forEach(
        point => {

            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                3,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "#8d83ff";


            ctx.fill();
        }
    );


    /* -----------------------------------------
       DATE LABELS
    ----------------------------------------- */

    if (dates.length) {

        const desiredLabels =
            width < 500
                ? 4
                : 6;


        const labelStep =
            Math.max(
                1,
                Math.ceil(
                    dates.length /
                    desiredLabels
                )
            );


        dates.forEach(
            (date, index) => {

                const isFirst =
                    index === 0;

                const isLast =
                    index ===
                    dates.length - 1;

                const isStep =
                    index %
                    labelStep ===
                    0;


                if (
                    !isFirst &&
                    !isLast &&
                    !isStep
                ) {
                    return;
                }


                const point =
                    points[index];


                if (!point) {
                    return;
                }


                ctx.fillStyle =
                    "rgba(255,255,255,.27)";


                ctx.font =
                    "8px Arial";


                ctx.textAlign =
                    "center";


                ctx.fillText(
                    formatShortDate(
                        date
                    ),
                    point.x,
                    height - 13
                );
            }
        );
    }


    ctx.textAlign =
        "left";
}


/* =========================================================
   EMPTY CHART
========================================================= */

function drawEmptyChart(
    ctx,
    width,
    height,
    message
) {

    ctx.fillStyle =
        "rgba(255,255,255,.25)";

    ctx.font =
        "11px Arial";

    ctx.textAlign =
        "center";


    ctx.fillText(
        message,
        width / 2,
        height / 2
    );


    ctx.textAlign =
        "left";
}


/* =========================================================
   ORDER STATUS BREAKDOWN
========================================================= */

function renderStatusBreakdown(data) {

    const container =
        document.getElementById(
            "statusBreakdown"
        );


    if (!container) {
        return;
    }


    const items = [

        {
            key: "pending",
            label: "Pending"
        },

        {
            key: "accepted",
            label: "Accepted"
        },

        {
            key: "in_progress",
            label: "In Progress"
        },

        {
            key: "delivered",
            label: "Delivered"
        },

        {
            key: "completed",
            label: "Completed"
        },

        {
            key: "cancelled",
            label: "Cancelled"
        },

        {
            key: "rejected",
            label: "Rejected"
        }

    ];


    const values =
        items.map(
            item => ({
                ...item,

                value:
                    Number(
                        data[
                            item.key
                        ] || 0
                    )
            })
        );


    const total =
        values.reduce(
            (
                sum,
                item
            ) =>
                sum +
                item.value,
            0
        );


    if (total === 0) {

        container.innerHTML =
            emptyBreakdown(
                "No orders in this period."
            );

        return;
    }


    container.innerHTML =
        values
            .map(
                item => {

                    const percentage =
                        total > 0
                            ? (
                                item.value /
                                total
                            ) * 100
                            : 0;


                    return `
                        <div class="breakdown-row">

                            <div class="breakdown-top">

                                <span class="breakdown-name">

                                    <span
                                        class="breakdown-dot"
                                    ></span>

                                    ${escapeHtml(
                                        item.label
                                    )}

                                </span>

                                <span class="breakdown-number">

                                    ${item.value}

                                </span>

                            </div>


                            <div class="breakdown-track">

                                <div
                                    class="breakdown-fill"
                                    style="width:${percentage.toFixed(2)}%"
                                ></div>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   PAYMENT BREAKDOWN
========================================================= */

function renderPaymentBreakdown(data) {

    const container =
        document.getElementById(
            "paymentBreakdown"
        );


    if (!container) {
        return;
    }


    const items = [

        {
            key: "unpaid",
            label: "Unpaid"
        },

        {
            key: "pending",
            label: "Pending"
        },

        {
            key: "paid",
            label: "Paid"
        },

        {
            key: "failed",
            label: "Failed"
        },

        {
            key: "refunded",
            label: "Refunded"
        }

    ];


    const values =
        items.map(
            item => ({

                ...item,

                value:
                    Number(
                        data[
                            item.key
                        ] || 0
                    )

            })
        );


    const total =
        values.reduce(
            (
                sum,
                item
            ) =>
                sum +
                item.value,
            0
        );


    if (total === 0) {

        container.innerHTML =
            emptyBreakdown(
                "No payment data in this period."
            );

        return;
    }


    container.innerHTML =
        values
            .map(
                item => {

                    const percentage =
                        (
                            item.value /
                            total
                        ) * 100;


                    return `
                        <div class="breakdown-row">

                            <div class="breakdown-top">

                                <span class="breakdown-name">

                                    <span
                                        class="breakdown-dot"
                                    ></span>

                                    ${escapeHtml(
                                        item.label
                                    )}

                                </span>

                                <span class="breakdown-number">
                                    ${item.value}
                                </span>

                            </div>


                            <div class="breakdown-track">

                                <div
                                    class="breakdown-fill"
                                    style="width:${percentage.toFixed(2)}%"
                                ></div>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   TOP SERVICES
========================================================= */

function renderTopServices(items) {

    const container =
        document.getElementById(
            "topServices"
        );


    if (!container) {
        return;
    }


    if (!items.length) {

        container.innerHTML =
            emptyRanking(
                "No service data available."
            );

        return;
    }


    container.innerHTML =
        items
            .slice(0, 8)
            .map(
                (
                    item,
                    index
                ) => {

                    return `
                        <div class="ranking-item">

                            <div class="ranking-number">
                                ${index + 1}
                            </div>


                            <div class="ranking-info">

                                <span class="ranking-title">
                                    ${escapeHtml(
                                        item.title ||
                                        "Untitled Service"
                                    )}
                                </span>

                                <span class="ranking-subtitle">
                                    ${escapeHtml(
                                        item.category ||
                                        "Other"
                                    )}
                                </span>

                            </div>


                            <div class="ranking-value">

                                <strong>
                                    ${Number(
                                        item.orders ||
                                        0
                                    )}
                                </strong>

                                <span>
                                    orders
                                </span>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   TOP WORKERS
========================================================= */

function renderTopWorkers(items) {

    const container =
        document.getElementById(
            "topWorkers"
        );


    if (!container) {
        return;
    }


    if (!items.length) {

        container.innerHTML =
            emptyRanking(
                "No worker data available."
            );

        return;
    }


    container.innerHTML =
        items
            .slice(0, 8)
            .map(
                (
                    item,
                    index
                ) => {

                    return `
                        <div class="ranking-item">

                            <div class="ranking-number">
                                ${index + 1}
                            </div>


                            <div class="ranking-info">

                                <span class="ranking-title">
                                    ${escapeHtml(
                                        item.name ||
                                        "Unknown Worker"
                                    )}
                                </span>

                                <span class="ranking-subtitle">
                                    ${escapeHtml(
                                        item.email ||
                                        "Worker"
                                    )}
                                </span>

                            </div>


                            <div class="ranking-value">

                                <strong>
                                    ${Number(
                                        item.orders ||
                                        0
                                    )}
                                </strong>

                                <span>
                                    orders
                                </span>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   REPORT SUMMARY
========================================================= */

function renderSummary(
    summary,
    users,
    workers
) {

    const titleElement =
        document.getElementById(
            "summaryTitle"
        );

    const textElement =
        document.getElementById(
            "summaryText"
        );


    if (titleElement) {

        titleElement.textContent =
            currentPeriodLabel;
    }


    if (!textElement) {
        return;
    }


    const totalOrders =
        Number(
            summary.total_orders || 0
        );


    const completedOrders =
        Number(
            summary.completed_orders || 0
        );


    const grossSales =
        Number(
            summary.gross_sales_mad || 0
        );


    const platformFees =
        Number(
            summary.platform_fees_mad || 0
        );


    const newUsers =
        Number(
            users.new_users || 0
        );


    const newWorkers =
        Number(
            workers.new_workers || 0
        );


    const completionRate =
        totalOrders > 0
            ? Math.round(
                (
                    completedOrders /
                    totalOrders
                ) * 100
            )
            : 0;


    if (totalOrders === 0) {

        textElement.textContent =
            `There is no order activity for ${currentPeriodLabel.toLowerCase()}. The platform recorded ${newUsers} new users and ${newWorkers} new workers during this period.`;

        return;
    }


    textElement.textContent =
        `During ${currentPeriodLabel.toLowerCase()}, NOVA MARKET recorded ${totalOrders} orders and ${money(grossSales)} MAD in paid gross sales. Platform fees were ${money(platformFees)} MAD. ${completedOrders} orders were completed, representing a ${completionRate}% completion ratio. The platform added ${newUsers} new users and ${newWorkers} new workers during the selected period.`;
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {


    /* -----------------------------------------
       PERIOD BUTTONS
    ----------------------------------------- */

    document
        .querySelectorAll(
            ".period-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        if (
                            button.dataset.custom ===
                            "true"
                        ) {

                            document
                                .querySelectorAll(
                                    ".period-btn"
                                )
                                .forEach(
                                    item =>
                                        item.classList.remove(
                                            "active"
                                        )
                                );


                            button.classList.add(
                                "active"
                            );


                            openCustomPeriod();

                            return;
                        }


                        const days =
                            Number(
                                button.dataset.days
                            );


                        if (
                            !Number.isFinite(
                                days
                            )
                        ) {
                            return;
                        }


                        setDefaultPeriod(
                            days
                        );


                        await loadReport(
                            window.supabaseClient
                        );
                    }
                );
            }
        );


    /* -----------------------------------------
       CUSTOM DATE
    ----------------------------------------- */

    document
        .getElementById(
            "applyDateBtn"
        )
        ?.addEventListener(
            "click",
            applyCustomPeriod
        );


    /* -----------------------------------------
       REFRESH TOPBAR
    ----------------------------------------- */

    document
        .getElementById(
            "refreshBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.reload();

            }
        );


    /* -----------------------------------------
       REFRESH REPORT
    ----------------------------------------- */

    document
        .getElementById(
            "refreshReportBtn"
        )
        ?.addEventListener(
            "click",
            async () => {

                await loadReport(
                    window.supabaseClient
                );

            }
        );


    /* -----------------------------------------
       EXPORT
    ----------------------------------------- */

    document
        .getElementById(
            "exportBtn"
        )
        ?.addEventListener(
            "click",
            exportReportCSV
        );


    /* -----------------------------------------
       LOGOUT
    ----------------------------------------- */

    document
        .getElementById(
            "logoutBtn"
        )
        ?.addEventListener(
            "click",
            logoutAdmin
        );


    /* -----------------------------------------
       RESIZE
    ----------------------------------------- */

    window.addEventListener(
        "resize",
        debounce(
            () => {

                if (!reportData) {
                    return;
                }


                drawOrdersChart(
                    reportData.timeline
                );


                drawSalesChart(
                    reportData.timeline
                );

            },
            150
        )
    );
}


/* =========================================================
   EXPORT CSV
========================================================= */

function exportReportCSV() {

    if (
        !reportData ||
        !reportData.timeline.length
    ) {

        showAlert(
            "There is no timeline data to export.",
            "error"
        );

        return;
    }


    const rows = [

        [
            "Date",
            "Orders",
            "Sales MAD"
        ]

    ];


    reportData.timeline.forEach(
        item => {

            rows.push([
                item.date || "",
                Number(
                    item.orders || 0
                ),
                Number(
                    item.sales_mad || 0
                )
            ]);

        }
    );


    const csv =
        rows
            .map(
                row =>
                    row
                        .map(
                            csvCell
                        )
                        .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `nova-report-${currentStartDate}-to-${currentEndDate}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    showAlert(
        "Report exported successfully.",
        "success"
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

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    } finally {

        window.location.href =
            "../login.html";
    }
}


/* =========================================================
   LOADING
========================================================= */

function setReportLoading(
    loading
) {

    const buttons =
        document.querySelectorAll(
            ".period-btn, .report-btn"
        );


    buttons.forEach(
        button => {

            button.disabled =
                loading;
        }
    );


    if (loading) {

        setText(
            "grossSales",
            "Loading..."
        );

        setText(
            "platformFees",
            "Loading..."
        );

        setText(
            "totalOrders",
            "..."
        );

    }
}


/* =========================================================
   EMPTY BREAKDOWN
========================================================= */

function emptyBreakdown(
    message
) {

    return `
        <div
            style="
                min-height:150px;
                display:flex;
                align-items:center;
                justify-content:center;
                text-align:center;
                color:rgba(255,255,255,.30);
                font-size:10px;
            "
        >
            ${escapeHtml(message)}
        </div>
    `;
}


/* =========================================================
   EMPTY RANKING
========================================================= */

function emptyRanking(
    message
) {

    return `
        <div
            style="
                min-height:160px;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                gap:7px;
                text-align:center;
                color:rgba(255,255,255,.28);
                font-size:10px;
            "
        >

            <div
                style="
                    font-size:26px;
                    opacity:.25;
                "
            >
                ◌
            </div>

            <strong
                style="
                    color:rgba(255,255,255,.45);
                    font-size:10px;
                "
            >
                ${escapeHtml(message)}
            </strong>

        </div>
    `;
}


/* =========================================================
   DATE HELPERS
========================================================= */

function formatInputDate(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
}


function formatReadableDate(
    value
) {

    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;
    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatShortDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short"
        }
    );
}


/* =========================================================
   NUMBER HELPERS
========================================================= */

function money(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function formatCompactMoney(
    value
) {

    const amount =
        Number(
            value || 0
        );


    if (amount >= 1000000) {

        return (
            amount /
            1000000
        ).toFixed(1) + "M";
    }


    if (amount >= 1000) {

        return (
            amount /
            1000
        ).toFixed(1) + "K";
    }


    return Math.round(
        amount
    ).toString();
}


/* =========================================================
   DOM HELPERS
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
   CSV
========================================================= */

function csvCell(
    value
) {

    const text =
        String(
            value ?? ""
        );


    return `"${text.replaceAll(
        '"',
        '""'
    )}"`;
}


/* =========================================================
   ALERT
========================================================= */

function showAlert(
    message,
    type = "success"
) {

    const alert =
        document.getElementById(
            "reportsAlert"
        );


    if (!alert) {
        return;
    }


    alert.hidden =
        false;


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
            4500
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


/* =========================================================
   DEBOUNCE
========================================================= */

function debounce(
    callback,
    wait
) {

    let timeout = null;


    return function (...args) {

        clearTimeout(
            timeout
        );


        timeout =
            setTimeout(
                () => {

                    callback(
                        ...args
                    );

                },
                wait
            );
    };
}