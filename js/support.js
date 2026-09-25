"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    const supabaseClient =
        window.supabaseClient;

    const loadingState =
        document.getElementById("loadingState");

    const errorState =
        document.getElementById("errorState");

    const supportContent =
        document.getElementById("supportContent");

    const errorMessage =
        document.getElementById("errorMessage");

    const retryBtn =
        document.getElementById("retryBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const sidebar =
        document.getElementById("sidebar");

    const sidebarToggle =
        document.getElementById("sidebarToggle");

    const profileName =
        document.getElementById("profileName");

    const profileEmail =
        document.getElementById("profileEmail");

    const profileAvatar =
        document.getElementById("profileAvatar");

    const ticketsList =
        document.getElementById("ticketsList");

    const ticketsEmpty =
        document.getElementById("ticketsEmpty");

    const ticketsResult =
        document.getElementById("ticketsResult");

    const newTicketBtn =
        document.getElementById("newTicketBtn");

    const emptyNewTicketBtn =
        document.getElementById(
            "emptyNewTicketBtn"
        );

    const ticketModal =
        document.getElementById("ticketModal");

    const closeTicketModal =
        document.getElementById(
            "closeTicketModal"
        );

    const cancelTicketBtn =
        document.getElementById(
            "cancelTicketBtn"
        );

    const ticketForm =
        document.getElementById("ticketForm");

    const ticketSubject =
        document.getElementById("ticketSubject");

    const ticketCategory =
        document.getElementById("ticketCategory");

    const ticketPriority =
        document.getElementById("ticketPriority");

    const ticketMessage =
        document.getElementById("ticketMessage");

    const submitTicketBtn =
        document.getElementById(
            "submitTicketBtn"
        );

    const detailsModal =
        document.getElementById(
            "detailsModal"
        );

    const closeDetailsModal =
        document.getElementById(
            "closeDetailsModal"
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

    const closeCurrentTicketBtn =
        document.getElementById(
            "closeCurrentTicketBtn"
        );


    let currentUser = null;

    let tickets = [];

    let selectedTicket = null;

    /*
     * Order linked from:
     * dashboard/support.html?order=UUID
     */
    let linkedOrderId = null;


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


    function shortId(id) {

        if (!id) {
            return "—";
        }

        return String(id)
            .slice(0, 8)
            .toUpperCase();
    }


    function isValidUUID(value) {

        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            .test(String(value || ""));
    }


    function showToast(message) {

        const toast =
            document.getElementById("toast");

        if (!toast) {
            return;
        }

        toast.textContent =
            message;

        toast.classList.add(
            "show"
        );

        clearTimeout(
            window.__novaSupportToast
        );

        window.__novaSupportToast =
            setTimeout(() => {

                toast.classList.remove(
                    "show"
                );

            }, 2400);
    }


    function showContent() {

        loadingState.classList.add(
            "hidden"
        );

        errorState.classList.add(
            "hidden"
        );

        supportContent.classList.remove(
            "hidden"
        );
    }


    function showError(message) {

        loadingState.classList.add(
            "hidden"
        );

        supportContent.classList.add(
            "hidden"
        );

        errorState.classList.remove(
            "hidden"
        );

        errorMessage.textContent =
            message ||
            "Something went wrong.";
    }


    /*
     * Read order UUID from URL
     */
    function readLinkedOrder() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const order =
            params.get("order");

        if (!order) {
            linkedOrderId = null;
            return;
        }

        if (!isValidUUID(order)) {

            console.warn(
                "NOVA: Invalid order UUID:",
                order
            );

            linkedOrderId = null;

            return;
        }

        linkedOrderId =
            order;
    }


    /*
     * Remove ?order=... after ticket creation
     * so a second new ticket isn't linked
     * to the same order accidentally.
     */
    function clearLinkedOrderFromUrl() {

        try {

            const url =
                new URL(
                    window.location.href
                );

            url.searchParams.delete(
                "order"
            );

            window.history.replaceState(
                {},
                document.title,
                url.pathname +
                (
                    url.search
                        ? url.search
                        : ""
                )
            );

        } catch (error) {

            console.warn(
                "NOVA: Could not clean support URL:",
                error
            );
        }
    }


    /* =====================================================
       AUTH
    ===================================================== */

    async function getCurrentUser() {

        if (!supabaseClient) {

            throw new Error(
                "Supabase is not configured."
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

        return data?.user || null;
    }


    /* =====================================================
       PROFILE
    ===================================================== */

    async function loadProfile() {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select(`
                    first_name,
                    last_name,
                    full_name,
                    email,
                    avatar_url
                `)
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        const name =
            data?.full_name ||
            [
                data?.first_name,
                data?.last_name
            ]
                .filter(Boolean)
                .join(" ") ||
            currentUser
                .email
                ?.split("@")[0] ||
            "User";


        const email =
            data?.email ||
            currentUser.email ||
            "";


        profileName.textContent =
            name;

        profileEmail.textContent =
            email;

        profileAvatar.textContent =
            getInitial(
                name,
                email
            );


        if (data?.avatar_url) {

            profileAvatar.innerHTML = `
                <img
                    src="${escapeHtml(
                        data.avatar_url
                    )}"
                    alt="Profile"
                >
            `;
        }
    }


    /* =====================================================
       LOAD TICKETS
    ===================================================== */

    async function loadTickets() {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "get_my_support_tickets"
            );


        if (error) {
            throw error;
        }


        tickets =
            Array.isArray(data)
                ? data
                : [];


        renderStats();

        renderTickets();
    }


    /* =====================================================
       STATS
    ===================================================== */

    function renderStats() {

        const total =
            tickets.length;


        const open =
            tickets.filter(
                ticket =>
                    ticket.status ===
                    "open"
            ).length;


        const progress =
            tickets.filter(
                ticket =>
                    ticket.status ===
                    "in_progress"
            ).length;


        const resolved =
            tickets.filter(
                ticket =>
                    ticket.status ===
                    "resolved" ||
                    ticket.status ===
                    "closed"
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


        ticketsResult.textContent =
            `${total} ticket${total === 1 ? "" : "s"}`;
    }


    /* =====================================================
       RENDER TICKETS
    ===================================================== */

    function renderTickets() {

        if (!tickets.length) {

            ticketsList.innerHTML = "";

            ticketsEmpty.classList.remove(
                "hidden"
            );

            return;
        }


        ticketsEmpty.classList.add(
            "hidden"
        );


        ticketsList.innerHTML =
            tickets
                .map(
                    ticket => {

                        const priority =
                            String(
                                ticket.priority ||
                                "normal"
                            ).toLowerCase();


                        const status =
                            String(
                                ticket.status ||
                                "open"
                            ).toLowerCase();


                        const orderHtml =
                            ticket.order_id
                                ? `
                                    <span
                                        class="ticket-category"
                                    >
                                        Order #${escapeHtml(
                                            shortId(
                                                ticket.order_id
                                            )
                                        )}
                                    </span>
                                `
                                : "";


                        return `
                            <article
                                class="ticket-row"
                            >

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

                                    ${orderHtml}

                                </div>


                                <div>

                                    <span
                                        class="priority-badge priority-${escapeHtml(
                                            priority
                                        )}"
                                    >
                                        ${escapeHtml(
                                            priority
                                        )}
                                    </span>

                                </div>


                                <div>

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

                                </div>


                                <div
                                    style="
                                        display:flex;
                                        flex-direction:column;
                                        gap:7px;
                                        align-items:flex-end;
                                    "
                                >

                                    <span
                                        class="ticket-date"
                                    >
                                        ${escapeHtml(
                                            formatDate(
                                                ticket.updated_at ||
                                                ticket.created_at
                                            )
                                        )}
                                    </span>

                                    <button
                                        type="button"
                                        class="ticket-action"
                                        data-ticket-id="${escapeHtml(
                                            ticket.id
                                        )}"
                                    >
                                        Open
                                    </button>

                                </div>

                            </article>
                        `;
                    }
                )
                .join("");


        ticketsList
            .querySelectorAll(
                "[data-ticket-id]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            await openTicket(
                                button.dataset.ticketId
                            );

                        }
                    );
                }
            );
    }


    /* =====================================================
       NEW TICKET
    ===================================================== */

    function openTicketModal() {

        ticketForm.reset();

        ticketCategory.value =
            linkedOrderId
                ? "Order"
                : "General";

        ticketPriority.value =
            "normal";


        /*
         * When opening support from an Order
         * automatically prepare the subject.
         */
        if (linkedOrderId) {

            ticketSubject.value =
                `Support request for Order #${shortId(
                    linkedOrderId
                )}`;

            showToast(
                `This ticket will be linked to Order #${shortId(
                    linkedOrderId
                )}.`
            );
        }


        ticketModal.classList.remove(
            "hidden"
        );


        setTimeout(() => {

            ticketSubject?.focus();

        }, 50);
    }


    function closeTicketModalFn() {

        ticketModal.classList.add(
            "hidden"
        );
    }


    async function createTicket(event) {

        event.preventDefault();


        const subject =
            ticketSubject.value.trim();


        const category =
            ticketCategory.value;


        const priority =
            ticketPriority.value;


        const message =
            ticketMessage.value.trim();


        if (
            !subject ||
            !message
        ) {

            showToast(
                "Please complete the form."
            );

            return;
        }


        submitTicketBtn.disabled =
            true;

        submitTicketBtn.textContent =
            "Creating...";


        try {

            const rpcPayload = {

                p_subject:
                    subject,

                p_category:
                    category,

                p_priority:
                    priority,

                p_message:
                    message,

                p_order_id:
                    linkedOrderId || null
            };


            console.log(
                "NOVA: creating support ticket:",
                rpcPayload
            );


            const {
                data,
                error
            } =
                await supabaseClient.rpc(
                    "create_support_ticket",
                    rpcPayload
                );


            if (error) {
                throw error;
            }


            closeTicketModalFn();


            showToast(
                linkedOrderId
                    ? "Support ticket created and linked to the order."
                    : "Support ticket created."
            );


            /*
             * Save ticket ID before clearing
             * the linked order from URL.
             */
            const ticketId =
                data?.ticket_id;


            /*
             * Prevent another newly-created
             * ticket from using the same order.
             */
            if (linkedOrderId) {

                linkedOrderId = null;

                clearLinkedOrderFromUrl();
            }


            await loadTickets();


            if (ticketId) {

                await openTicket(
                    ticketId
                );
            }


        } catch (error) {

            console.error(
                "NOVA create ticket error:",
                error
            );


            showToast(
                error.message ||
                "Could not create ticket."
            );

        } finally {

            submitTicketBtn.disabled =
                false;

            submitTicketBtn.textContent =
                "Create Ticket";
        }
    }


    /* =====================================================
       OPEN TICKET
    ===================================================== */

    async function openTicket(ticketId) {

        if (!ticketId) {
            return;
        }


        detailsModal.classList.remove(
            "hidden"
        );


        detailsSubject.textContent =
            "Loading...";


        detailsMeta.textContent =
            "Loading conversation...";


        messagesList.innerHTML = `
            <div class="messages-empty">
                Loading messages...
            </div>
        `;


        try {

            const {
                data,
                error
            } =
                await supabaseClient.rpc(
                    "get_my_support_ticket",
                    {
                        p_ticket_id:
                            ticketId
                    }
                );


            if (error) {
                throw error;
            }


            selectedTicket =
                Array.isArray(data)
                    ? data[0]
                    : data;


            if (!selectedTicket) {

                throw new Error(
                    "Ticket not found."
                );
            }


            detailsSubject.textContent =
                selectedTicket.subject;


            const orderPart =
                selectedTicket.order_id
                    ? ` • Order #${shortId(
                        selectedTicket.order_id
                    )}`
                    : "";


            detailsMeta.textContent =
                `#${shortId(
                    selectedTicket.id
                )} • ${selectedTicket.category || "General"}${orderPart} • Created ${formatDate(
                    selectedTicket.created_at
                )}`;


            renderDetailsStatus(
                selectedTicket.status
            );


            await loadMessages(
                selectedTicket.id
            );


        } catch (error) {

            console.error(
                "NOVA open ticket error:",
                error
            );


            detailsModal.classList.add(
                "hidden"
            );


            showToast(
                error.message ||
                "Could not open ticket."
            );
        }
    }


    function renderDetailsStatus(status) {

        const safe =
            String(
                status || "open"
            ).toLowerCase();


        detailsStatus.textContent =
            safe.replace(
                /_/g,
                " "
            );


        detailsStatus.className =
            `ticket-status status-${safe}`;


        if (
            safe === "closed" ||
            safe === "resolved"
        ) {

            replyMessage.disabled =
                true;

            sendReplyBtn.disabled =
                true;

            sendReplyBtn.textContent =
                "Ticket Closed";

            closeCurrentTicketBtn.disabled =
                true;

        } else {

            replyMessage.disabled =
                false;

            sendReplyBtn.disabled =
                false;

            sendReplyBtn.textContent =
                "Send Reply";

            closeCurrentTicketBtn.disabled =
                false;
        }
    }


    /* =====================================================
       LOAD MESSAGES
    ===================================================== */

    async function loadMessages(ticketId) {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "get_my_support_messages",
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
                            message.sender_name ||
                            (
                                mine
                                    ? "You"
                                    : "NOVA Support"
                            );


                        return `
                            <div
                                class="message-bubble ${
                                    mine
                                        ? "mine"
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
                                    class="message-text"
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


        requestAnimationFrame(() => {

            messagesList.scrollTop =
                messagesList.scrollHeight;

        });
    }


    /* =====================================================
       REPLY
    ===================================================== */

    async function sendReply(event) {

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


            await loadMessages(
                selectedTicket.id
            );


            await loadTickets();


            /*
             * Reload selected ticket so
             * status changes are reflected.
             */
            const {
                data: refreshedTicket
            } =
                await supabaseClient.rpc(
                    "get_my_support_ticket",
                    {
                        p_ticket_id:
                            selectedTicket.id
                    }
                );


            if (refreshedTicket) {

                selectedTicket =
                    Array.isArray(
                        refreshedTicket
                    )
                        ? refreshedTicket[0]
                        : refreshedTicket;
            }


            showToast(
                "Message sent."
            );


        } catch (error) {

            console.error(
                "NOVA support reply error:",
                error
            );


            showToast(
                error.message ||
                "Could not send message."
            );

        } finally {

            renderDetailsStatus(
                selectedTicket.status
            );
        }
    }


    /* =====================================================
       CLOSE TICKET
    ===================================================== */

    async function closeCurrentTicket() {

        if (!selectedTicket) {
            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to close this ticket?"
            );


        if (!confirmed) {
            return;
        }


        closeCurrentTicketBtn.disabled =
            true;


        try {

            const {
                error
            } =
                await supabaseClient.rpc(
                    "close_support_ticket",
                    {
                        p_ticket_id:
                            selectedTicket.id
                    }
                );


            if (error) {
                throw error;
            }


            selectedTicket.status =
                "closed";


            renderDetailsStatus(
                "closed"
            );


            await loadTickets();


            showToast(
                "Ticket closed."
            );


        } catch (error) {

            console.error(
                "NOVA close ticket error:",
                error
            );


            closeCurrentTicketBtn.disabled =
                false;


            showToast(
                error.message ||
                "Could not close ticket."
            );
        }
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async function initialize() {

        try {

            if (!supabaseClient) {

                throw new Error(
                    "Supabase is not configured."
                );
            }


            readLinkedOrder();


            currentUser =
                await getCurrentUser();


            if (!currentUser) {

                window.location.replace(
                    "../login.html?redirect=dashboard/support.html"
                );

                return;
            }


            await loadProfile();

            await loadTickets();

            showContent();


            /*
             * When Contact Support is opened
             * from Order Details:
             *
             * support.html?order=UUID
             *
             * automatically open the ticket modal.
             */
            if (linkedOrderId) {

                setTimeout(() => {

                    openTicketModal();

                }, 250);
            }


        } catch (error) {

            console.error(
                "NOVA Support initialization error:",
                error
            );


            showError(
                error.message ||
                "Could not load support."
            );
        }
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    newTicketBtn?.addEventListener(
        "click",
        openTicketModal
    );


    emptyNewTicketBtn?.addEventListener(
        "click",
        openTicketModal
    );


    closeTicketModal?.addEventListener(
        "click",
        closeTicketModalFn
    );


    cancelTicketBtn?.addEventListener(
        "click",
        closeTicketModalFn
    );


    ticketModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                ticketModal
            ) {

                closeTicketModalFn();
            }
        }
    );


    ticketForm?.addEventListener(
        "submit",
        createTicket
    );


    closeDetailsModal?.addEventListener(
        "click",
        () => {

            detailsModal.classList.add(
                "hidden"
            );

            selectedTicket =
                null;
        }
    );


    detailsModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                detailsModal
            ) {

                detailsModal.classList.add(
                    "hidden"
                );

                selectedTicket =
                    null;
            }
        }
    );


    replyForm?.addEventListener(
        "submit",
        sendReply
    );


    closeCurrentTicketBtn?.addEventListener(
        "click",
        closeCurrentTicket
    );


    retryBtn?.addEventListener(
        "click",
        async () => {

            loadingState.classList.remove(
                "hidden"
            );

            errorState.classList.add(
                "hidden"
            );

            await initialize();
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

                console.error(
                    error
                );


                showToast(
                    "Logout failed."
                );
            }
        }
    );


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


    await initialize();

});