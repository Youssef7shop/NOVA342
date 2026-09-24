"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    const supabaseClient =
        window.supabaseClient;


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const accessLoading =
        document.getElementById("accessLoading");

    const accessDenied =
        document.getElementById("accessDenied");

    const logsContent =
        document.getElementById("logsContent");

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

    const actionFilter =
        document.getElementById("actionFilter");

    const entityFilter =
        document.getElementById("entityFilter");

    const clearFiltersBtn =
        document.getElementById("clearFiltersBtn");

    const logsTableBody =
        document.getElementById(
            "logsTableBody"
        );

    const logsResult =
        document.getElementById(
            "logsResult"
        );

    const loadMoreBtn =
        document.getElementById(
            "loadMoreBtn"
        );


    /* MODAL */

    const logModal =
        document.getElementById(
            "logModal"
        );

    const closeModalBtn =
        document.getElementById(
            "closeModalBtn"
        );

    const modalAction =
        document.getElementById(
            "modalAction"
        );

    const modalDate =
        document.getElementById(
            "modalDate"
        );

    const modalActor =
        document.getElementById(
            "modalActor"
        );

    const modalEntity =
        document.getElementById(
            "modalEntity"
        );

    const modalSource =
        document.getElementById(
            "modalSource"
        );

    const modalLogId =
        document.getElementById(
            "modalLogId"
        );

    const modalMetadata =
        document.getElementById(
            "modalMetadata"
        );


    let currentUser = null;

    let allLogs = [];

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


    function shortId(id) {

        if (!id) {
            return "—";
        }

        return String(id)
            .slice(0, 8)
            .toUpperCase();
    }


    function initial(name, email) {

        const value =
            String(
                name ||
                email ||
                "A"
            ).trim();

        return (
            value.charAt(0) ||
            "A"
        ).toUpperCase();
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


    function capitalize(value) {

        const text =
            String(
                value || ""
            ).replace(
                /_/g,
                " "
            );

        return text
            .replace(
                /\b\w/g,
                letter =>
                    letter.toUpperCase()
            );
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
            window.__novaLogsToast
        );

        window.__novaLogsToast =
            setTimeout(() => {

                toast.classList.remove(
                    "show"
                );

            }, 2500);
    }


    /* =====================================================
       UI STATES
    ===================================================== */

    function showDenied() {

        accessLoading.classList.add(
            "hidden"
        );

        logsContent.classList.add(
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

        logsContent.classList.remove(
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
                "../login.html?redirect=admin/logs.html"
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
       LOAD STATS
    ===================================================== */

    async function loadStats() {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "admin_log_stats"
            );


        if (error) {
            throw error;
        }


        const stats =
            data || {};


        document.getElementById(
            "totalLogs"
        ).textContent =
            Number(
                stats.total_logs || 0
            ).toLocaleString();


        document.getElementById(
            "todayLogs"
        ).textContent =
            Number(
                stats.today_logs || 0
            ).toLocaleString();


        document.getElementById(
            "adminLogs"
        ).textContent =
            Number(
                stats.admin_logs || 0
            ).toLocaleString();


        document.getElementById(
            "systemLogs"
        ).textContent =
            Number(
                stats.system_logs || 0
            ).toLocaleString();
    }


    /* =====================================================
       LOAD LOGS
    ===================================================== */

    async function loadLogs() {

        logsTableBody.innerHTML = `
            <tr>

                <td
                    colspan="6"
                    class="table-loading"
                >
                    Loading activity logs...
                </td>

            </tr>
        `;


        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "admin_activity_logs"
            );


        if (error) {

            console.error(
                "NOVA activity logs error:",
                error
            );


            logsTableBody.innerHTML = `
                <tr>

                    <td
                        colspan="6"
                        class="empty-logs"
                    >
                        ${escapeHtml(
                            error.message ||
                            "Could not load activity logs."
                        )}
                    </td>

                </tr>
            `;

            return;
        }


        allLogs =
            Array.isArray(data)
                ? data
                : [];


        visibleLimit =
            50;


        renderLogs();
    }


    /* =====================================================
       FILTER
    ===================================================== */

    function getFilteredLogs() {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();


        const action =
            normalize(
                actionFilter.value
            );


        const entity =
            normalize(
                entityFilter.value
            );


        return allLogs.filter(
            log => {

                const searchable =
                    [
                        log.actor_name,
                        log.actor_email,
                        log.action,
                        log.entity_type,
                        log.entity_id,
                        log.source,
                        JSON.stringify(
                            log.metadata || {}
                        )
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                const searchMatch =
                    !query ||
                    searchable.includes(
                        query
                    );


                const actionMatch =
                    !action ||
                    normalize(
                        log.action
                    ) === action;


                const entityMatch =
                    !entity ||
                    normalize(
                        log.entity_type
                    ) === entity;


                return (
                    searchMatch &&
                    actionMatch &&
                    entityMatch
                );
            }
        );
    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderLogs() {

        const logs =
            getFilteredLogs();


        const visibleLogs =
            logs.slice(
                0,
                visibleLimit
            );


        logsResult.textContent =
            `${logs.length} log${
                logs.length === 1
                    ? ""
                    : "s"
            }`;


        loadMoreBtn.disabled =
            visibleLimit >= logs.length;


        if (!logs.length) {

            logsTableBody.innerHTML = `
                <tr>

                    <td
                        colspan="6"
                        class="empty-logs"
                    >
                        No activity logs found.
                    </td>

                </tr>
            `;

            return;
        }


        logsTableBody.innerHTML =
            visibleLogs
                .map(
                    log =>
                        createLogRow(
                            log
                        )
                )
                .join("");


        logsTableBody
            .querySelectorAll(
                "[data-log-id]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const logId =
                                button.dataset.logId;


                            const log =
                                allLogs.find(
                                    item =>
                                        item.id ===
                                        logId
                                );


                            if (log) {
                                openLogModal(
                                    log
                                );
                            }
                        }
                    );
                }
            );
    }


    /* =====================================================
       LOG ROW
    ===================================================== */

    function createLogRow(
        log
    ) {

        const action =
            normalize(
                log.action
            );


        const entity =
            normalize(
                log.entity_type
            );


        const source =
            normalize(
                log.source
            );


        const actorName =
            log.actor_name ||
            (
                log.actor_email
                    ? log.actor_email
                    : "System"
            );


        const actorEmail =
            log.actor_email ||
            "";


        const actorAvatar =
            log.actor_avatar
                ? `
                    <img
                        src="${escapeHtml(
                            log.actor_avatar
                        )}"
                        alt="Actor"
                    >
                `
                : escapeHtml(
                    initial(
                        actorName,
                        actorEmail
                    )
                );


        const metadataText =
            log.metadata
                ? JSON.stringify(
                    log.metadata
                )
                : "";


        const entityText =
            entity
                ? capitalize(entity)
                : "System";


        return `
            <tr>

                <td>

                    <div
                        class="actor-cell"
                    >

                        <div
                            class="actor-avatar"
                        >
                            ${actorAvatar}
                        </div>


                        <div
                            class="actor-info"
                        >

                            <strong>
                                ${escapeHtml(
                                    actorName
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    actorEmail ||
                                    source ||
                                    "System"
                                )}
                            </span>

                        </div>

                    </div>

                </td>


                <td>

                    <span
                        class="action-badge action-${escapeHtml(
                            action
                        )}"
                    >
                        ${escapeHtml(
                            capitalize(action)
                        )}
                    </span>

                </td>


                <td>

                    <span
                        class="entity-badge entity-${escapeHtml(
                            entity || "system"
                        )}"
                    >
                        ${escapeHtml(
                            entityText
                        )}
                    </span>

                </td>


                <td>

                    <div
                        class="details-cell"
                        title="${escapeHtml(
                            metadataText
                        )}"
                    >
                        ${escapeHtml(
                            log.description ||
                            metadataText ||
                            "Activity recorded"
                        )}
                    </div>

                </td>


                <td>

                    <span
                        class="source-badge source-${escapeHtml(
                            source || "system"
                        )}"
                    >
                        ${escapeHtml(
                            source || "system"
                        )}
                    </span>

                </td>


                <td>

                    <div
                        style="
                            display:flex;
                            flex-direction:column;
                            gap:7px;
                        "
                    >

                        <span
                            class="date-cell"
                        >
                            ${escapeHtml(
                                formatDate(
                                    log.created_at
                                )
                            )}
                        </span>


                        <button
                            type="button"
                            class="view-log-btn"
                            data-log-id="${escapeHtml(
                                log.id
                            )}"
                        >
                            Details
                        </button>

                    </div>

                </td>

            </tr>
        `;
    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    function openLogModal(
        log
    ) {

        const action =
            normalize(
                log.action
            );


        const entity =
            normalize(
                log.entity_type
            );


        const source =
            normalize(
                log.source
            );


        modalAction.textContent =
            capitalize(action);


        modalDate.textContent =
            formatDate(
                log.created_at
            );


        modalActor.textContent =
            log.actor_name ||
            log.actor_email ||
            "System";


        modalEntity.textContent =
            entity
                ? capitalize(entity)
                : "System";


        modalSource.textContent =
            source
                ? capitalize(source)
                : "System";


        modalLogId.textContent =
            log.id ||
            "—";


        try {

            modalMetadata.textContent =
                JSON.stringify(
                    log.metadata || {},
                    null,
                    2
                );

        } catch {

            modalMetadata.textContent =
                "{}";
        }


        logModal.classList.remove(
            "hidden"
        );
    }


    /* =====================================================
       FILTER EVENTS
    ===================================================== */

    searchInput?.addEventListener(
        "input",
        renderLogs
    );


    actionFilter?.addEventListener(
        "change",
        renderLogs
    );


    entityFilter?.addEventListener(
        "change",
        renderLogs
    );


    clearFiltersBtn?.addEventListener(
        "click",
        () => {

            searchInput.value =
                "";

            actionFilter.value =
                "";

            entityFilter.value =
                "";

            renderLogs();
        }
    );


    loadMoreBtn?.addEventListener(
        "click",
        () => {

            visibleLimit += 50;

            renderLogs();
        }
    );


    /* =====================================================
       MODAL
    ===================================================== */

    closeModalBtn?.addEventListener(
        "click",
        () => {

            logModal.classList.add(
                "hidden"
            );
        }
    );


    logModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                logModal
            ) {

                logModal.classList.add(
                    "hidden"
                );
            }
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
                    loadLogs()
                ]);


                showToast(
                    "Activity logs refreshed."
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
       INITIALIZE
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
            loadLogs()
        ]);


    } catch (error) {

        console.error(
            "NOVA Admin Logs initialization error:",
            error
        );


        showDenied();
    }

});