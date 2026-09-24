"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    const supabaseClient = window.supabaseClient;

    const accessLoading =
        document.getElementById("accessLoading");

    const accessDenied =
        document.getElementById("accessDenied");

    const usersContent =
        document.getElementById("usersContent");

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

    const roleFilter =
        document.getElementById("roleFilter");

    const statusFilter =
        document.getElementById("statusFilter");

    const clearFiltersBtn =
        document.getElementById("clearFiltersBtn");

    const usersTableBody =
        document.getElementById("usersTableBody");

    const previousBtn =
        document.getElementById("previousBtn");

    const nextBtn =
        document.getElementById("nextBtn");

    const paginationInfo =
        document.getElementById("paginationInfo");

    const userModal =
        document.getElementById("userModal");

    const modalCloseBtn =
        document.getElementById("modalCloseBtn");

    const saveUserBtn =
        document.getElementById("saveUserBtn");

    const toggleStatusBtn =
        document.getElementById("toggleStatusBtn");

    const modalRole =
        document.getElementById("modalRole");


    let currentUser = null;
    let currentAdminProfile = null;
    let selectedUser = null;

    let currentPage = 1;

    const pageSize = 15;

    let totalUsers = 0;


    function showDenied() {

        accessLoading.classList.add("hidden");

        usersContent.classList.add("hidden");

        accessDenied.classList.remove("hidden");
    }


    function showUsers() {

        accessLoading.classList.add("hidden");

        accessDenied.classList.add("hidden");

        usersContent.classList.remove("hidden");
    }


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function getInitial(name, email) {

        const text =
            String(
                name ||
                email ||
                "U"
            ).trim();

        return (
            text.charAt(0) ||
            "U"
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

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    function capitalize(value) {

        const text =
            String(value || "");

        if (!text) {
            return "—";
        }

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1)
        );
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
            window.__novaToastTimer
        );

        window.__novaToastTimer =
            setTimeout(() => {

                toast.classList.remove("show");

            }, 2500);
    }


    async function checkAdmin() {

        if (!supabaseClient) {
            throw new Error(
                "Supabase client is missing."
            );
        }


        const {
            data,
            error
        } = await supabaseClient.auth.getUser();


        if (error) {
            throw error;
        }


        if (!data.user) {

            window.location.replace(
                "../login.html?redirect=admin/users.html"
            );

            return false;
        }


        currentUser = data.user;


        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select(`
                id,
                first_name,
                last_name,
                full_name,
                email,
                role,
                avatar_url,
                is_active,
                plan
            `)
            .eq("id", currentUser.id)
            .maybeSingle();


        if (profileError) {
            throw profileError;
        }


        if (!profile) {
            return false;
        }


        const isAdmin =
            String(profile.role || "")
                .toLowerCase() === "admin";


        const isActive =
            profile.is_active !== false;


        if (!isAdmin || !isActive) {
            return false;
        }


        currentAdminProfile = profile;


        applyAdminProfile(
            currentUser,
            profile
        );


        return true;
    }


    function applyAdminProfile(
        user,
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
            user.email?.split("@")[0] ||
            "Admin";


        document.getElementById(
            "adminName"
        ).textContent = name;


        document.getElementById(
            "adminEmail"
        ).textContent =
            profile.email ||
            user.email ||
            "";


        document.getElementById(
            "adminInitial"
        ).textContent =
            getInitial(
                name,
                user.email
            );


        const avatar =
            document.querySelector(
                ".admin-avatar"
            );


        if (
            avatar &&
            profile.avatar_url
        ) {

            avatar.innerHTML = "";

            const image =
                document.createElement("img");

            image.src =
                profile.avatar_url;

            image.alt =
                "Admin";

            image.style.width = "100%";
            image.style.height = "100%";
            image.style.objectFit = "cover";

            avatar.appendChild(image);
        }
    }


    async function loadStats() {

        const {
            data,
            error
        } = await supabaseClient.rpc(
            "admin_user_stats"
        );


        if (error) {
            throw error;
        }


        const stats =
            Array.isArray(data)
                ? data[0]
                : data;


        document.getElementById(
            "statTotal"
        ).textContent =
            Number(
                stats?.total_users || 0
            ).toLocaleString();


        document.getElementById(
            "statActive"
        ).textContent =
            Number(
                stats?.active_users || 0
            ).toLocaleString();


        document.getElementById(
            "statWorkers"
        ).textContent =
            Number(
                stats?.workers || 0
            ).toLocaleString();


        document.getElementById(
            "statPaid"
        ).textContent =
            Number(
                stats?.paid_users || 0
            ).toLocaleString();
    }


    async function loadUsers() {

        usersTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="table-loading"
                >
                    Loading users...
                </td>
            </tr>
        `;


        const search =
            searchInput.value.trim();


        const role =
            roleFilter.value || null;


        const status =
            statusFilter.value || null;


        const offset =
            (currentPage - 1) *
            pageSize;


        const {
            data,
            error
        } = await supabaseClient.rpc(
            "admin_users",
            {
                p_search: search || null,
                p_role: role,
                p_status: status,
                p_limit: pageSize,
                p_offset: offset
            }
        );


        if (error) {

            console.error(
                "NOVA admin users error:",
                error
            );

            usersTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="empty-users"
                    >
                        Could not load users.
                    </td>
                </tr>
            `;

            return;
        }


        const users =
            Array.isArray(data)
                ? data
                : [];


        totalUsers =
            Number(
                users[0]?.total_count || 0
            );


        renderUsers(users);

        updatePagination();
    }


    function renderUsers(users) {

        if (!users.length) {

            usersTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="empty-users"
                    >
                        No users found.
                    </td>
                </tr>
            `;

            return;
        }


        usersTableBody.innerHTML =
            users
                .map((user) => {

                    const fullName =
                        user.full_name ||
                        [
                            user.first_name,
                            user.last_name
                        ]
                            .filter(Boolean)
                            .join(" ") ||
                        "Unnamed User";


                    const email =
                        user.email ||
                        "No email";


                    const initial =
                        getInitial(
                            fullName,
                            email
                        );


                    const role =
                        String(
                            user.role ||
                            "customer"
                        ).toLowerCase();


                    const plan =
                        String(
                            user.plan ||
                            "free"
                        ).toLowerCase();


                    const active =
                        user.is_active !== false;


                    let avatarHtml =
                        `<span>${escapeHtml(initial)}</span>`;


                    if (user.avatar_url) {

                        avatarHtml =
                            `
                            <img
                                src="${escapeHtml(
                                    user.avatar_url
                                )}"
                                alt="User"
                            />
                            `;
                    }


                    const isSelf =
                        currentUser &&
                        user.id ===
                        currentUser.id;


                    return `
                        <tr>

                            <td>

                                <div class="user-cell">

                                    <div
                                        class="user-table-avatar"
                                    >
                                        ${avatarHtml}
                                    </div>

                                    <div
                                        class="user-cell-info"
                                    >

                                        <strong>
                                            ${escapeHtml(
                                                fullName
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


                            <td>

                                <span
                                    class="role-badge role-${escapeHtml(
                                        role
                                    )}"
                                >
                                    ${escapeHtml(
                                        capitalize(role)
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="plan-badge plan-${escapeHtml(
                                        plan
                                    )}"
                                >
                                    ${escapeHtml(
                                        capitalize(plan)
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="account-status ${
                                        active
                                            ? "account-active"
                                            : "account-inactive"
                                    }"
                                >
                                    ${
                                        active
                                            ? "Active"
                                            : "Inactive"
                                    }
                                </span>

                            </td>


                            <td>
                                ${escapeHtml(
                                    formatDate(
                                        user.created_at
                                    )
                                )}
                            </td>


                            <td>

                                <button
                                    type="button"
                                    class="action-btn"
                                    data-user-id="${escapeHtml(
                                        user.id
                                    )}"
                                    ${
                                        isSelf
                                            ? "disabled"
                                            : ""
                                    }
                                >
                                    ${
                                        isSelf
                                            ? "Current Admin"
                                            : "Manage"
                                    }
                                </button>

                            </td>

                        </tr>
                    `;
                })
                .join("");


        document
            .querySelectorAll(
                ".action-btn[data-user-id]"
            )
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const userId =
                            button.dataset.userId;

                        const target =
                            users.find(
                                (user) =>
                                    user.id ===
                                    userId
                            );

                        if (target) {
                            openUserModal(
                                target
                            );
                        }
                    }
                );

            });
    }


    function updatePagination() {

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    totalUsers /
                    pageSize
                )
            );


        paginationInfo.textContent =
            `Page ${currentPage} of ${totalPages}`;


        previousBtn.disabled =
            currentPage <= 1;


        nextBtn.disabled =
            currentPage >= totalPages;
    }


    function openUserModal(user) {

        selectedUser = user;


        const fullName =
            user.full_name ||
            [
                user.first_name,
                user.last_name
            ]
                .filter(Boolean)
                .join(" ") ||
            "Unnamed User";


        document.getElementById(
            "modalUserName"
        ).textContent =
            fullName;


        document.getElementById(
            "modalUserEmail"
        ).textContent =
            user.email ||
            "No email";


        const avatar =
            document.getElementById(
                "modalAvatar"
            );


        if (user.avatar_url) {

            avatar.innerHTML = `
                <img
                    src="${escapeHtml(
                        user.avatar_url
                    )}"
                    alt="User"
                />
            `;

        } else {

            avatar.textContent =
                getInitial(
                    fullName,
                    user.email
                );
        }


        modalRole.value =
            user.role || "customer";


        document.getElementById(
            "modalPlan"
        ).textContent =
            capitalize(
                user.plan || "free"
            );


        const active =
            user.is_active !== false;


        document.getElementById(
            "modalStatus"
        ).textContent =
            active
                ? "Active"
                : "Inactive";


        document.getElementById(
            "modalCreated"
        ).textContent =
            formatDate(
                user.created_at
            );


        toggleStatusBtn.textContent =
            active
                ? "Disable Account"
                : "Enable Account";


        if (
            currentUser &&
            user.id === currentUser.id
        ) {

            modalRole.disabled = true;

            saveUserBtn.disabled = true;

            toggleStatusBtn.disabled = true;

        } else {

            modalRole.disabled = false;

            saveUserBtn.disabled = false;

            toggleStatusBtn.disabled = false;
        }


        userModal.classList.remove(
            "hidden"
        );
    }


    function closeUserModal() {

        selectedUser = null;

        userModal.classList.add(
            "hidden"
        );
    }


    async function saveUserChanges() {

        if (!selectedUser) {
            return;
        }


        if (
            currentUser &&
            selectedUser.id === currentUser.id
        ) {

            showToast(
                "You cannot modify your own admin account here."
            );

            return;
        }


        const newRole =
            modalRole.value;


        saveUserBtn.disabled = true;


        try {

            const {
                error
            } = await supabaseClient.rpc(
                "admin_update_user",
                {
                    p_user_id:
                        selectedUser.id,

                    p_role:
                        newRole
                }
            );


            if (error) {
                throw error;
            }


            showToast(
                "User updated successfully."
            );


            closeUserModal();

            await Promise.all([
                loadStats(),
                loadUsers()
            ]);


        } catch (error) {

            console.error(error);

            showToast(
                error.message ||
                "Could not update user."
            );

        } finally {

            saveUserBtn.disabled = false;
        }
    }


    async function toggleUserStatus() {

        if (!selectedUser) {
            return;
        }


        if (
            currentUser &&
            selectedUser.id === currentUser.id
        ) {

            showToast(
                "You cannot disable your own admin account."
            );

            return;
        }


        const nextStatus =
            selectedUser.is_active === false;


        const actionText =
            nextStatus
                ? "enable"
                : "disable";


        const confirmed =
            window.confirm(
                `Are you sure you want to ${actionText} this account?`
            );


        if (!confirmed) {
            return;
        }


        toggleStatusBtn.disabled = true;


        try {

            const {
                error
            } = await supabaseClient.rpc(
                "admin_set_user_status",
                {
                    p_user_id:
                        selectedUser.id,

                    p_is_active:
                        nextStatus
                }
            );


            if (error) {
                throw error;
            }


            showToast(
                nextStatus
                    ? "Account enabled."
                    : "Account disabled."
            );


            closeUserModal();


            await Promise.all([
                loadStats(),
                loadUsers()
            ]);


        } catch (error) {

            console.error(error);

            showToast(
                error.message ||
                "Could not change account status."
            );

        } finally {

            toggleStatusBtn.disabled = false;
        }
    }


    let searchTimer = null;


    searchInput?.addEventListener(
        "input",
        () => {

            clearTimeout(
                searchTimer
            );

            searchTimer =
                setTimeout(
                    () => {

                        currentPage = 1;

                        loadUsers();

                    },
                    350
                );
        }
    );


    roleFilter?.addEventListener(
        "change",
        () => {

            currentPage = 1;

            loadUsers();
        }
    );


    statusFilter?.addEventListener(
        "change",
        () => {

            currentPage = 1;

            loadUsers();
        }
    );


    clearFiltersBtn?.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            roleFilter.value = "";

            statusFilter.value = "";

            currentPage = 1;

            loadUsers();
        }
    );


    previousBtn?.addEventListener(
        "click",
        () => {

            if (currentPage <= 1) {
                return;
            }

            currentPage--;

            loadUsers();
        }
    );


    nextBtn?.addEventListener(
        "click",
        () => {

            const totalPages =
                Math.max(
                    1,
                    Math.ceil(
                        totalUsers /
                        pageSize
                    )
                );


            if (
                currentPage >=
                totalPages
            ) {
                return;
            }


            currentPage++;

            loadUsers();
        }
    );


    refreshBtn?.addEventListener(
        "click",
        async () => {

            refreshBtn.disabled = true;

            try {

                await Promise.all([
                    loadStats(),
                    loadUsers()
                ]);

                showToast(
                    "Users refreshed."
                );

            } catch (error) {

                console.error(error);

                showToast(
                    "Refresh failed."
                );
            }

            refreshBtn.disabled = false;
        }
    );


    modalCloseBtn?.addEventListener(
        "click",
        closeUserModal
    );


    userModal?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                userModal
            ) {
                closeUserModal();
            }
        }
    );


    saveUserBtn?.addEventListener(
        "click",
        saveUserChanges
    );


    toggleStatusBtn?.addEventListener(
        "click",
        toggleUserStatus
    );


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


    backHomeBtn?.addEventListener(
        "click",
        () => {

            window.location.replace(
                "../index.html"
            );
        }
    );


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
        .forEach((link) => {

            link.addEventListener(
                "click",
                () => {

                    sidebar?.classList.remove(
                        "open"
                    );
                }
            );
        });


    if (supabaseClient) {

        supabaseClient.auth.onAuthStateChange(
            (event) => {

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
    }


    try {

        const allowed =
            await checkAdmin();


        if (!allowed) {

            showDenied();

            return;
        }


        showUsers();


        await Promise.all([
            loadStats(),
            loadUsers()
        ]);

    } catch (error) {

        console.error(
            "NOVA Users initialization error:",
            error
        );

        showDenied();
    }

});