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

    const supportContent =
        document.getElementById("supportContent");

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

    const ticketsTableBody =
        document.getElementById(
            "ticketsTableBody"
        );

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );

    const priorityFilter =
        document.getElementById(
            "priorityFilter"
        );

    const clearFiltersBtn =
        document.getElementById(
            "clearFiltersBtn"
        );


    /* MODAL */

    const detailsModal =
        document.getElementById(
            "detailsModal"
        );

    const closeModalBtn =
        document.getElementById(
            "closeModalBtn"
        );

    const detailsSubject =
        document.getElementById(
            "detailsSubject"
        );

    const detailsMeta =
        document.getElementById(
            "detailsMeta"
        );

    const detailsStatus =
        document.getElementById(
            "detailsStatus"
        );

    const customerAvatar =
        document.getElementById(
            "customerAvatar"
        );

    const customerName =
        document.getElementById(
            "customerName"
        );

    const customerEmail =
        document.getElementById(
            "customerEmail"
        );

    const statusSelect =
        document.getElementById(
            "statusSelect"
        );

    const saveStatusBtn =
        document.getElementById(
            "saveStatusBtn"
        );

    const messagesList =
        document.getElementById(
            "messagesList"
        );

    const replyForm =
        document.getElementById(
            "replyForm"
        );

    const replyMessage =
        document.getElementById(
            "replyMessage"
        );

    const sendReplyBtn =
        document.getElementById(
            "sendReplyBtn"
        );


    let currentUser = null;

    let adminProfile = null;

    let allTickets = [];

    let selectedTicket = null;


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


    function formatDateTime(value) {

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


    function normalizeStatus(value) {

        return String(
            value || "open"
        )
            .toLowerCase()
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
            window.__novaAdminSupportToast
        );

        window.__novaAdminSupportToast =
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

        supportContent.classList.add(
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

        supportContent.classList.remove(
            "hidden"
        );
    }


    /* =====================================================
       ADMIN PROFILE
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
                "../login.html?redirect=admin/support.html"
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


        const role =
            String(
                profile.role || ""
            ).toLowerCase();


        const active =
            profile.is_active !== false;


        if (
            role !== "admin" ||
            !active
        ) {
            return false;
        }


        adminProfile =
            profile;


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
                document.createElement(
                    "img"
                );

            image.src =
                profile.avatar_url;

            image.alt =
                "Admin";

            image.style.width =
                "100%";

            image.style.height =
                "100%";

            image.style.objectFit =
                "cover";

            avatar.appendChild(
                image
            );
        }
    }


    /* =====================================================
       LOAD TICKETS
    ===================================================== */

    async function loadTickets() {

        ticketsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="table-loading"
                >
                    Loading tickets...
                </td>
            </tr>
        `;


        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "admin_support_tickets"
            );


        if (error) {

            console.error(
                "NOVA admin support tickets:",
                error
            );

            ticketsTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="empty-table"
                    >
                        ${escapeHtml(
                            error.message ||
                            "Could not load tickets."
                        )}
                    </td>
                </tr>
            `;

            return;
        }


        allTickets =
            Array.isArray(data)
                ? data
                : [];


        updateStats();

        renderTickets();
    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats() {

        const total =
            allTickets.length;


        const open =
            allTickets.filter(
                ticket =>
                    normalizeStatus(
                        ticket.status
                    ) === "open"
            ).length;


        const progress =
            allTickets.filter(
                ticket =>
                    normalizeStatus(
                        ticket.status
                    ) === "in_progress"
            ).length;


        const resolved =
            allTickets.filter(
                ticket => {

                    const status =
                        normalizeStatus(
                            ticket.status
                        );

                    return (
                        status === "resolved" ||
                        status === "closed"
                    );
                }
            ).length;


        document.getElementById(
            "totalTickets"
        ).textContent =
            total;


        document.getElementById(
            "openTickets"
        ).textContent =
            open;


        document.getElementById(
            "progressTickets"
        ).textContent =
            progress;


        document.getElementById(
            "resolvedTickets"
        ).textContent =
            resolved;
    }


    /* =====================================================
       FILTER
    ===================================================== */

    function getFilteredTickets() {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();


        const status =
            statusFilter.value;


        const priority =
            priorityFilter.value;


        return allTickets.filter(
            ticket => {

                const searchText =
                    [
                        ticket.subject,
                        ticket.category,
                        ticket.customer_name,
                        ticket.customer_email
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                const statusMatch =
                    !status ||
                    normalizeStatus(
                        ticket.status
                    ) === status;


                const priorityMatch =
                    !priority ||
                    String(
                        ticket.priority || ""
                    ).toLowerCase() ===
                    priority;


                const searchMatch =
                    !query ||
                    searchText.includes(
                        query
                    );


                return (
                    statusMatch &&
                    priorityMatch &&
                    searchMatch
                );
            }
        );
    }


    /* =====================================================
       RENDER TABLE
    ===================================================== */

    function renderTickets() {

        const tickets =
            getFilteredTickets();


        if (!tickets.length) {

            ticketsTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="empty-table"
                    >
                        No support tickets found.
                    </td>
                </tr>
            `;

            return;
        }


        ticketsTableBody.innerHTML =
            tickets
                .map(
                    ticket => {

                        const status =
                            normalizeStatus(
                                ticket.status
                            );


                        const priority =
                            String(
                                ticket.priority ||
                                "normal"
                            ).toLowerCase();


                        const customerName =
                            ticket.customer_name ||
                            "Unknown Customer";


                        const customerEmail =
                            ticket.customer_email ||
                            "No email";


                        const customerInitial =
                            initial(
                                customerName,
                                customerEmail
                            );


                        const avatar =
                            ticket.customer_avatar
                                ? `
                                    <img
                                        src="${escapeHtml(
                                            ticket.customer_avatar
                                        )}"
                                        alt="Customer"
                                    >
                                `
                                : escapeHtml(
                                    customerInitial
                                );


                        return `
                            <tr>

                                <td>

                                    <div
                                        class="ticket-main"
                                    >

                                        <span
                                            class="ticket-id"
                                        >
                                            #${escapeHtml(
                                                shortId(
                                                    ticket.id
                                                )
                                            )}
                                        </span>

                                        <strong
                                            class="ticket-subject"
                                        >
                                            ${escapeHtml(
                                                ticket.subject
                                            )}
                                        </strong>

                                        <span
                                            class="ticket-category"
                                        >
                                            ${escapeHtml(
                                                ticket.category ||
                                                "General"
                                            )}
                                        </span>

                                    </div>

                                </td>


                                <td>

                                    <div
                                        class="customer-table"
                                    >

                                        <div
                                            class="customer-table-avatar"
                                        >
                                            ${avatar}
                                        </div>

                                        <div
                                            class="customer-table-info"
                                        >

                                            <strong>
                                                ${escapeHtml(
                                                    customerName
                                                )}
                                            </strong>

                                            <span>
                                                ${escapeHtml(
                                                    customerEmail
                                                )}
                                            </span>

                                        </div>

                                    </div>

                                </td>


                                <td>
                                    ${escapeHtml(
                                        ticket.category ||
                                        "General"
                                    )}
                                </td>


                                <td>

                                    <span
                                        class="priority-badge priority-${escapeHtml(
                                            priority
                                        )}"
                                    >
                                        ${escapeHtml(
                                            priority
                                        )}
                                    </span>

                                </td>


                                <td>

                                    <span
                                        class="ticket-status status-${escapeHtml(
                                            status
                                        )}"
                                    >
                                        ${escapeHtml(
                                            status.replace(
                                                /_/g,
                                                " "
                                            )
                                        )}
                                    </span>

                                </td>


                                <td>
                                    ${escapeHtml(
                                        formatDate(
                                            ticket.updated_at ||
                                            ticket.created_at
                                        )
                                    )}
                                </td>


                                <td>

                                    <button
                                        type="button"
                                        class="open-ticket-btn"
                                        data-ticket-id="${escapeHtml(
                                            ticket.id
                                        )}"
                                    >
                                        Open Ticket
                                    </button>

                                </td>

                            </tr>
                        `;
                    }
                )
                .join("");


        ticketsTableBody
            .querySelectorAll(
                "[data-ticket-id]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            openTicket(
                                button.dataset.ticketId
                            );
                        }
                    );
                }
            );
    }


    /* =====================================================
       OPEN TICKET
    ===================================================== */

    async function openTicket(
        ticketId
    ) {

        if (!ticketId) {
            return;
        }


        const ticket =
            allTickets.find(
                item =>
                    item.id ===
                    ticketId
            );


        if (!ticket) {

            showToast(
                "Ticket not found."
            );

            return;
        }


        selectedTicket =
            ticket;


        detailsModal.classList.remove(
            "hidden"
        );


        detailsSubject.textContent =
            "Loading...";


        messagesList.innerHTML = `
            <div class="messages-loading">
                Loading conversation...
            </div>
        `;


        try {

            detailsSubject.textContent =
                ticket.subject;


            detailsMeta.textContent =
                `#${shortId(
                    ticket.id
                )} • ${
                    ticket.category ||
                    "General"
                } • Created ${
                    formatDate(
                        ticket.created_at
                    )
                }`;


            const status =
                normalizeStatus(
                    ticket.status
                );


            statusSelect.value =
                status;


            renderDetailsStatus(
                status
            );


            const customer =
                ticket.customer_name ||
                "Unknown Customer";


            customerName.textContent =
                customer;


            customerEmail.textContent =
                ticket.customer_email ||
                "No email";


            customerAvatar.innerHTML =
                ticket.customer_avatar
                    ? `
                        <img
                            src="${escapeHtml(
                                ticket.customer_avatar
                            )}"
                            alt="Customer"
                        >
                    `
                    : escapeHtml(
                        initial(
                            customer,
                            ticket.customer_email
                        )
                    );


            await loadMessages(
                ticket.id
            );


        } catch (error) {

            console.error(
                "NOVA open admin ticket error:",
                error
            );


            showToast(
                error.message ||
                "Could not open ticket."
            );
        }
    }


    /* =====================================================
       RENDER DETAILS STATUS
    ===================================================== */

    function renderDetailsStatus(
        status
    ) {

        const safe =
            normalizeStatus(
                status
            );


        detailsStatus.textContent =
            safe.replace(
                /_/g,
                " "
            );


        detailsStatus.className =
            `ticket-status status-${safe}`;


        const closed =
            safe === "closed";


        replyMessage.disabled =
            closed;


        sendReplyBtn.disabled =
            closed;


        if (closed) {

            sendReplyBtn.textContent =
                "Ticket Closed";

        } else {

            sendReplyBtn.textContent =
                "Send Reply";
        }
    }


    /* =====================================================
       LOAD MESSAGES
    ===================================================== */

    async function loadMessages(
        ticketId
    ) {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "admin_support_messages",
                {
                    p_ticket_id:
                        ticketId
                }
            );


        if (error) {
            throw error;
        }


        const messages =
            Array.isArray(data)
                ? data
                : [];


        if (!messages.length) {

            messagesList.innerHTML = `
                <div class="messages-empty">
                    No messages yet.
                </div>
            `;

            return;
        }


        messagesList.innerHTML =
            messages
                .map(
                    message => {

                        const mine =
                            message.sender_id ===
                            currentUser.id;


                        const senderName =
                            mine
                                ? "You"
                                : "Customer";


                        return `
                            <div
                                class="message ${
                                    mine
                                        ? "admin"
                                        : ""
                                }"
                            >

                                <div
                                    class="message-head"
                                >

                                    <strong>
                                        ${escapeHtml(
                                            senderName
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHtml(
                                            formatDateTime(
                                                message.created_at
                                            )
                                        )}
                                    </span>

                                </div>


                                <div
                                    class="message-body"
                                >
                                    ${escapeHtml(
                                        message.message
                                    )}
                                </div>

                            </div>
                        `;
                    }
                )
                .join("");


        requestAnimationFrame(
            () => {

                messagesList.scrollTop =
                    messagesList.scrollHeight;
            }
        );
    }


    /* =====================================================
       UPDATE STATUS
    ===================================================== */

    async function updateTicketStatus() {

        if (!selectedTicket) {
            return;
        }


        const newStatus =
            statusSelect.value;


        saveStatusBtn.disabled =
            true;

        saveStatusBtn.textContent =
            "Updating...";


        try {

            const {
                error
            } =
                await supabaseClient.rpc(
                    "admin_set_ticket_status",
                    {
                        p_ticket_id:
                            selectedTicket.id,

                        p_status:
                            newStatus
                    }
                );


            if (error) {
                throw error;
            }


            selectedTicket.status =
                newStatus;


            renderDetailsStatus(
                newStatus
            );


            showToast(
                "Ticket status updated."
            );


            await loadTickets();


        } catch (error) {

            console.error(
                "NOVA status update error:",
                error
            );


            showToast(
                error.message ||
                "Could not update status."
            );

        } finally {

            saveStatusBtn.disabled =
                false;

            saveStatusBtn.textContent =
                "Update Status";
        }
    }


    /* =====================================================
       SEND ADMIN REPLY
    ===================================================== */

    async function sendReply(
        event
    ) {

        event.preventDefault();


        if (!selectedTicket) {
            return;
        }


        const message =
            replyMessage.value.trim();


        if (!message) {

            showToast(
                "Write a message first."
            );

            return;
        }


        sendReplyBtn.disabled =
            true;

        sendReplyBtn.textContent =
            "Sending...";


        try {

            const {
                error
            } =
                await supabaseClient.rpc(
                    "add_support_message",
                    {
                        p_ticket_id:
                            selectedTicket.id,

                        p_message:
                            message
                    }
                );


            if (error) {
                throw error;
            }


            replyMessage.value =
                "";


            /*
             * When admin replies to an open ticket,
             * the RPC changes it to in_progress.
             */

            if (
                selectedTicket.status ===
                "open"
            ) {

                selectedTicket.status =
                    "in_progress";

                statusSelect.value =
                    "in_progress";

                renderDetailsStatus(
                    "in_progress"
                );
            }


            await loadMessages(
                selectedTicket.id
            );


            await loadTickets();


            showToast(
                "Reply sent successfully."
            );


        } catch (error) {

            console.error(
                "NOVA admin reply error:",
                error
            );


            showToast(
                error.message ||
                "Could not send reply."
            );

        } finally {

            if (
                selectedTicket &&
                selectedTicket.status !==
                "closed"
            ) {

                sendReplyBtn.disabled =
                    false;

                sendReplyBtn.textContent =
                    "Send Reply";
            }
        }
    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeModal() {

        detailsModal.classList.add(
            "hidden"
        );

        selectedTicket =
            null;

        replyMessage.value =
            "";
    }


    /* =====================================================
       FILTER EVENTS
    ===================================================== */

    searchInput?.addEventListener(
        "input",
        renderTickets
    );


    statusFilter?.addEventListener(
        "change",
        renderTickets
    );


    priorityFilter?.addEventListener(
        "change",
        renderTickets
    );


    clearFiltersBtn?.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            statusFilter.value = "";

            priorityFilter.value = "";

            renderTickets();
        }
    );


    /* =====================================================
       UI EVENTS
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


    refreshBtn?.addEventListener(
        "click",
        async () => {

            refreshBtn.disabled =
                true;

            try {

                await loadTickets();

                showToast(
                    "Support tickets refreshed."
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


    closeModalBtn?.addEventListener(
        "click",
        closeModal
    );


    detailsModal?.addEventListener(
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


    saveStatusBtn?.addEventListener(
        "click",
        updateTicketStatus
    );


    replyForm?.addEventListener(
        "submit",
        sendReply
    );


    backHomeBtn?.addEventListener(
        "click",
        () => {

            window.location.replace(
                "../index.html"
            );
        }
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
       INITIALIZE
    ===================================================== */

    try {

        if (!supabaseClient) {

            throw new Error(
                "Supabase client is missing."
            );
        }


        const allowed =
            await checkAdmin();


        if (!allowed) {

            showDenied();

            return;
        }


        showContent();


        await loadTickets();


    } catch (error) {

        console.error(
            "NOVA Admin Support initialization error:",
            error
        );


        showDenied();
    }

});