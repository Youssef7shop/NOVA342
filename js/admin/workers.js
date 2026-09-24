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

    const workersContent =
        document.getElementById("workersContent");


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

    const statusFilter =
        document.getElementById("statusFilter");

    const planFilter =
        document.getElementById("planFilter");

    const clearFiltersBtn =
        document.getElementById("clearFiltersBtn");

    const workersTableBody =
        document.getElementById(
            "workersTableBody"
        );


    /* MODAL */

    const workerModal =
        document.getElementById(
            "workerModal"
        );

    const closeModalBtn =
        document.getElementById(
            "closeModalBtn"
        );

    const modalWorkerName =
        document.getElementById(
            "modalWorkerName"
        );

    const modalWorkerEmail =
        document.getElementById(
            "modalWorkerEmail"
        );

    const modalAvatar =
        document.getElementById(
            "modalAvatar"
        );

    const modalPlan =
        document.getElementById(
            "modalPlan"
        );

    const modalServices =
        document.getElementById(
            "modalServices"
        );

    const modalOrders =
        document.getElementById(
            "modalOrders"
        );

    const modalRevenue =
        document.getElementById(
            "modalRevenue"
        );

    const modalStatus =
        document.getElementById(
            "modalStatus"
        );

    const modalCreated =
        document.getElementById(
            "modalCreated"
        );

    const modalRole =
        document.getElementById(
            "modalRole"
        );

    const saveWorkerBtn =
        document.getElementById(
            "saveWorkerBtn"
        );

    const toggleWorkerBtn =
        document.getElementById(
            "toggleWorkerBtn"
        );


    let currentUser = null;

    let allWorkers = [];

    let selectedWorker = null;


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
                "W"
            ).trim();

        return (
            value.charAt(0) ||
            "W"
        ).toUpperCase();
    }


    function shortMoney(value) {

        const number =
            Number(value || 0);

        return new Intl.NumberFormat(
            "fr-MA",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        ).format(number) + " MAD";
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

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    function getPlanClass(plan) {

        const safe =
            String(
                plan || "free"
            ).toLowerCase();

        if (
            safe === "pro" ||
            safe === "business"
        ) {
            return `plan-${safe}`;
        }

        return "plan-free";
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

        toast.classList.add("show");

        clearTimeout(
            window.__novaWorkersToast
        );

        window.__novaWorkersToast =
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

        workersContent.classList.add(
            "hidden"
        );

        accessDenied.classList.remove(
            "hidden"
        );
    }


    function showWorkers() {

        accessLoading.classList.add(
            "hidden"
        );

        accessDenied.classList.add(
            "hidden"
        );

        workersContent.classList.remove(
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
            data,
            error
        } =
            await supabaseClient
                .auth
                .getUser();


        if (error) {
            throw error;
        }


        if (!data?.user) {

            window.location.replace(
                "../login.html?redirect=admin/workers.html"
            );

            return false;
        }


        currentUser =
            data.user;


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
       LOAD WORKERS
    ===================================================== */

    async function loadWorkers() {

        workersTableBody.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    class="table-loading"
                >
                    Loading workers...
                </td>

            </tr>
        `;


        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "admin_workers"
            );


        if (error) {

            console.error(
                "NOVA admin workers error:",
                error
            );


            workersTableBody.innerHTML = `
                <tr>

                    <td
                        colspan="8"
                        class="empty-workers"
                    >
                        ${escapeHtml(
                            error.message ||
                            "Could not load workers."
                        )}
                    </td>

                </tr>
            `;

            return;
        }


        allWorkers =
            Array.isArray(data)
                ? data
                : [];


        updateStats();

        renderWorkers();
    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats() {

        const total =
            allWorkers.length;


        const active =
            allWorkers.filter(
                worker =>
                    worker.is_active !== false
            ).length;


        const inactive =
            total - active;


        const withServices =
            allWorkers.filter(
                worker =>
                    Number(
                        worker.services_count || 0
                    ) > 0
            ).length;


        document.getElementById(
            "totalWorkers"
        ).textContent =
            total;


        document.getElementById(
            "activeWorkers"
        ).textContent =
            active;


        document.getElementById(
            "inactiveWorkers"
        ).textContent =
            inactive;


        document.getElementById(
            "workersWithServices"
        ).textContent =
            withServices;
    }


    /* =====================================================
       FILTER
    ===================================================== */

    function getFilteredWorkers() {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();


        const status =
            statusFilter.value;


        const plan =
            planFilter.value;


        return allWorkers.filter(
            worker => {

                const name =
                    String(
                        worker.full_name ||
                        ""
                    ).toLowerCase();


                const email =
                    String(
                        worker.email ||
                        ""
                    ).toLowerCase();


                const text =
                    `${name} ${email}`;


                const searchMatch =
                    !query ||
                    text.includes(query);


                const active =
                    worker.is_active !== false;


                const statusMatch =
                    !status ||
                    (
                        status === "active" &&
                        active
                    ) ||
                    (
                        status === "inactive" &&
                        !active
                    );


                const workerPlan =
                    String(
                        worker.plan ||
                        "free"
                    ).toLowerCase();


                const planMatch =
                    !plan ||
                    workerPlan === plan;


                return (
                    searchMatch &&
                    statusMatch &&
                    planMatch
                );
            }
        );
    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderWorkers() {

        const workers =
            getFilteredWorkers();


        if (!workers.length) {

            workersTableBody.innerHTML = `
                <tr>

                    <td
                        colspan="8"
                        class="empty-workers"
                    >
                        No workers found.
                    </td>

                </tr>
            `;

            return;
        }


        workersTableBody.innerHTML =
            workers
                .map(
                    worker => {

                        const name =
                            worker.full_name ||
                            [
                                worker.first_name,
                                worker.last_name
                            ]
                                .filter(Boolean)
                                .join(" ") ||
                            "Unnamed Worker";


                        const email =
                            worker.email ||
                            "No email";


                        const workerInitial =
                            initial(
                                name,
                                email
                            );


                        const active =
                            worker.is_active !== false;


                        const plan =
                            String(
                                worker.plan ||
                                "free"
                            ).toLowerCase();


                        const avatar =
                            worker.avatar_url
                                ? `
                                    <img
                                        src="${escapeHtml(
                                            worker.avatar_url
                                        )}"
                                        alt="Worker"
                                    >
                                `
                                : escapeHtml(
                                    workerInitial
                                );


                        return `
                            <tr>


                                <!-- WORKER -->

                                <td>

                                    <div
                                        class="worker-cell"
                                    >

                                        <div
                                            class="worker-avatar"
                                        >
                                            ${avatar}
                                        </div>


                                        <div
                                            class="worker-cell-info"
                                        >

                                            <strong>
                                                ${escapeHtml(
                                                    name
                                                )}
                                            </strong>

                                            <span>
                                                ${escapeHtml(
                                                    email
                                                )}
                                            </span>

                                        </div>

                                    </div>

                                </td>


                                <!-- PLAN -->

                                <td>

                                    <span
                                        class="plan-badge ${getPlanClass(
                                            plan
                                        )}"
                                    >
                                        ${escapeHtml(
                                            plan
                                        )}
                                    </span>

                                </td>


                                <!-- SERVICES -->

                                <td>

                                    ${Number(
                                        worker.services_count ||
                                        0
                                    )}

                                </td>


                                <!-- ORDERS -->

                                <td>

                                    ${Number(
                                        worker.orders_count ||
                                        0
                                    )}

                                </td>


                                <!-- REVENUE -->

                                <td>

                                    <strong
                                        style="color:white;"
                                    >
                                        ${escapeHtml(
                                            shortMoney(
                                                worker.revenue
                                            )
                                        )}
                                    </strong>

                                </td>


                                <!-- STATUS -->

                                <td>

                                    <span
                                        class="worker-status ${
                                            active
                                                ? "worker-active"
                                                : "worker-inactive"
                                        }"
                                    >
                                        ${
                                            active
                                                ? "Active"
                                                : "Inactive"
                                        }
                                    </span>

                                </td>


                                <!-- CREATED -->

                                <td>

                                    ${escapeHtml(
                                        formatDate(
                                            worker.created_at
                                        )
                                    )}

                                </td>


                                <!-- ACTION -->

                                <td>

                                    <button
                                        type="button"
                                        class="manage-worker-btn"
                                        data-worker-id="${escapeHtml(
                                            worker.id
                                        )}"
                                    >
                                        Manage
                                    </button>

                                </td>


                            </tr>
                        `;
                    }
                )
                .join("");


        workersTableBody
            .querySelectorAll(
                "[data-worker-id]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            openWorkerModal(
                                button.dataset.workerId
                            );

                        }
                    );

                }
            );
    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    function openWorkerModal(
        workerId
    ) {

        const worker =
            allWorkers.find(
                item =>
                    item.id ===
                    workerId
            );


        if (!worker) {

            showToast(
                "Worker not found."
            );

            return;
        }


        selectedWorker =
            worker;


        const name =
            worker.full_name ||
            [
                worker.first_name,
                worker.last_name
            ]
                .filter(Boolean)
                .join(" ") ||
            "Unnamed Worker";


        const email =
            worker.email ||
            "No email";


        modalWorkerName.textContent =
            name;


        modalWorkerEmail.textContent =
            email;


        if (
            worker.avatar_url
        ) {

            modalAvatar.innerHTML = `
                <img
                    src="${escapeHtml(
                        worker.avatar_url
                    )}"
                    alt="Worker"
                >
            `;

        } else {

            modalAvatar.textContent =
                initial(
                    name,
                    email
                );
        }


        modalPlan.textContent =
            worker.plan ||
            "free";


        modalServices.textContent =
            Number(
                worker.services_count ||
                0
            );


        modalOrders.textContent =
            Number(
                worker.orders_count ||
                0
            );


        modalRevenue.textContent =
            shortMoney(
                worker.revenue
            );


        modalStatus.textContent =
            worker.is_active !== false
                ? "Active"
                : "Inactive";


        modalCreated.textContent =
            formatDate(
                worker.created_at
            );


        modalRole.value =
            worker.role ||
            "worker";


        toggleWorkerBtn.textContent =
            worker.is_active !== false
                ? "Disable Worker"
                : "Enable Worker";


        workerModal.classList.remove(
            "hidden"
        );
    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeModal() {

        workerModal.classList.add(
            "hidden"
        );

        selectedWorker =
            null;
    }


    /* =====================================================
       UPDATE ROLE
    ===================================================== */

    async function saveWorkerChanges() {

        if (!selectedWorker) {
            return;
        }


        if (
            currentUser &&
            selectedWorker.id ===
            currentUser.id
        ) {

            showToast(
                "You cannot modify your own admin account here."
            );

            return;
        }


        const role =
            modalRole.value;


        saveWorkerBtn.disabled =
            true;


        saveWorkerBtn.textContent =
            "Saving...";


        try {

            const {
                error
            } =
                await supabaseClient.rpc(
                    "admin_update_worker",
                    {
                        p_worker_id:
                            selectedWorker.id,

                        p_role:
                            role
                    }
                );


            if (error) {
                throw error;
            }


            showToast(
                "Worker role updated."
            );


            closeModal();


            await loadWorkers();


        } catch (error) {

            console.error(
                "NOVA worker role error:",
                error
            );


            showToast(
                error.message ||
                "Could not update worker."
            );

        } finally {

            saveWorkerBtn.disabled =
                false;

            saveWorkerBtn.textContent =
                "Save Changes";
        }
    }


    /* =====================================================
       TOGGLE STATUS
    ===================================================== */

    async function toggleWorkerStatus() {

        if (!selectedWorker) {
            return;
        }


        if (
            currentUser &&
            selectedWorker.id ===
            currentUser.id
        ) {

            showToast(
                "You cannot disable your own admin account."
            );

            return;
        }


        const currentlyActive =
            selectedWorker.is_active !== false;


        const nextStatus =
            !currentlyActive;


        const action =
            nextStatus
                ? "enable"
                : "disable";


        const confirmed =
            window.confirm(
                `Are you sure you want to ${action} this worker?`
            );


        if (!confirmed) {
            return;
        }


        toggleWorkerBtn.disabled =
            true;


        try {

            const {
                error
            } =
                await supabaseClient.rpc(
                    "admin_set_worker_status",
                    {
                        p_worker_id:
                            selectedWorker.id,

                        p_is_active:
                            nextStatus
                    }
                );


            if (error) {
                throw error;
            }


            showToast(
                nextStatus
                    ? "Worker enabled."
                    : "Worker disabled."
            );


            closeModal();


            await loadWorkers();


        } catch (error) {

            console.error(
                "NOVA worker status error:",
                error
            );


            showToast(
                error.message ||
                "Could not change worker status."
            );

        } finally {

            toggleWorkerBtn.disabled =
                false;
        }
    }


    /* =====================================================
       FILTER EVENTS
    ===================================================== */

    searchInput?.addEventListener(
        "input",
        renderWorkers
    );


    statusFilter?.addEventListener(
        "change",
        renderWorkers
    );


    planFilter?.addEventListener(
        "change",
        renderWorkers
    );


    clearFiltersBtn?.addEventListener(
        "click",
        () => {

            searchInput.value =
                "";

            statusFilter.value =
                "";

            planFilter.value =
                "";

            renderWorkers();
        }
    );


    /* =====================================================
       MODAL EVENTS
    ===================================================== */

    closeModalBtn?.addEventListener(
        "click",
        closeModal
    );


    workerModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                workerModal
            ) {

                closeModal();
            }
        }
    );


    saveWorkerBtn?.addEventListener(
        "click",
        saveWorkerChanges
    );


    toggleWorkerBtn?.addEventListener(
        "click",
        toggleWorkerStatus
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

                await loadWorkers();


                showToast(
                    "Workers refreshed."
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
       AUTH LISTENER
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


        showWorkers();


        await loadWorkers();


    } catch (error) {

        console.error(
            "NOVA Admin Workers initialization error:",
            error
        );


        showDenied();
    }

});