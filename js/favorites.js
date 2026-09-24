"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    const supabaseClient = window.supabaseClient;

    const loadingState =
        document.getElementById("loadingState");

    const errorState =
        document.getElementById("errorState");

    const favoritesContent =
        document.getElementById("favoritesContent");

    const errorMessage =
        document.getElementById("errorMessage");

    const retryBtn =
        document.getElementById("retryBtn");

    const favoritesGrid =
        document.getElementById("favoritesGrid");

    const emptyState =
        document.getElementById("emptyState");

    const favoriteCount =
        document.getElementById("favoriteCount");

    const resultText =
        document.getElementById("resultText");

    const userName =
        document.getElementById("userName");

    const userEmail =
        document.getElementById("userEmail");

    const userAvatar =
        document.getElementById("userAvatar");

    const planBadge =
        document.getElementById("planBadge");

    const planTitle =
        document.getElementById("planTitle");

    const planText =
        document.getElementById("planText");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const sidebar =
        document.getElementById("sidebar");

    const sidebarToggle =
        document.getElementById("sidebarToggle");

    const toast =
        document.getElementById("toast");


    let currentUser = null;


    function showToast(message) {

        if (!toast) return;

        toast.textContent = message;

        toast.classList.add("show");

        clearTimeout(
            window.__novaFavoritesToast
        );

        window.__novaFavoritesToast =
            setTimeout(() => {
                toast.classList.remove("show");
            }, 2400);
    }


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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


    function getInitial(
        name,
        email
    ) {

        const text =
            String(
                name ||
                email ||
                "U"
            )
                .trim();

        return (
            text.charAt(0) ||
            "U"
        ).toUpperCase();
    }


    function setError(message) {

        loadingState.classList.add(
            "hidden"
        );

        favoritesContent.classList.add(
            "hidden"
        );

        errorState.classList.remove(
            "hidden"
        );

        errorMessage.textContent =
            message ||
            "Could not load favorites.";
    }


    function showContent() {

        loadingState.classList.add(
            "hidden"
        );

        errorState.classList.add(
            "hidden"
        );

        favoritesContent.classList.remove(
            "hidden"
        );
    }


    async function getUser() {

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
                    avatar_url,
                    plan
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


        userName.textContent =
            name;


        userEmail.textContent =
            email;


        userAvatar.textContent =
            getInitial(
                name,
                email
            );


        if (data?.avatar_url) {

            userAvatar.innerHTML = `
                <img
                    src="${escapeHtml(
                        data.avatar_url
                    )}"
                    alt="Profile"
                >
            `;
        }


        const plan =
            String(
                data?.plan ||
                "free"
            ).toLowerCase();


        planBadge.textContent =
            plan.toUpperCase();


        planTitle.textContent =
            plan === "business"
                ? "NOVA Business"
                : plan === "pro"
                    ? "NOVA Pro"
                    : "NOVA Free";


        planText.textContent =
            plan === "business"
                ? "Business marketplace access."
                : plan === "pro"
                    ? "More tools and marketplace access."
                    : "Explore digital services.";
    }


    async function loadFavorites() {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "get_my_favorites"
            );


        if (error) {
            throw error;
        }


        const favorites =
            Array.isArray(data)
                ? data
                : [];


        renderFavorites(
            favorites
        );
    }


    function renderFavorites(
        favorites
    ) {

        const total =
            favorites.length;


        favoriteCount.textContent =
            total;


        resultText.textContent =
            `${total} service${total === 1 ? "" : "s"}`;


        if (!total) {

            favoritesGrid.innerHTML = "";

            emptyState.classList.remove(
                "hidden"
            );

            return;
        }


        emptyState.classList.add(
            "hidden"
        );


        favoritesGrid.innerHTML =
            favorites
                .map(
                    (favorite) => {

                        const title =
                            favorite.service_title ||
                            "Untitled Service";


                        const category =
                            favorite.category ||
                            "Other";


                        const description =
                            favorite.description ||
                            "Digital service available on NOVA MARKET.";


                        const workerName =
                            favorite.worker_full_name ||
                            "NOVA Worker";


                        const workerInitial =
                            getInitial(
                                workerName,
                                ""
                            );


                        const image =
                            favorite.image_url
                                ? `
                                    <img
                                        class="favorite-image"
                                        src="${escapeHtml(
                                            favorite.image_url
                                        )}"
                                        alt="${escapeHtml(
                                            title
                                        )}"
                                    >
                                `
                                : `
                                    <div
                                        class="favorite-no-image"
                                    >
                                        N
                                    </div>
                                `;


                        return `
                            <article
                                class="favorite-card"
                                data-favorite-id="${escapeHtml(
                                    favorite.favorite_id
                                )}"
                            >

                                <div
                                    class="favorite-image-wrap"
                                >

                                    ${image}

                                    <div
                                        class="favorite-heart"
                                    >
                                        ♥
                                    </div>

                                </div>


                                <div
                                    class="favorite-body"
                                >

                                    <span
                                        class="service-category"
                                    >
                                        ${escapeHtml(
                                            category
                                        )}
                                    </span>


                                    <h3
                                        class="favorite-title"
                                    >
                                        ${escapeHtml(
                                            title
                                        )}
                                    </h3>


                                    <p
                                        class="favorite-description"
                                    >
                                        ${escapeHtml(
                                            description
                                        )}
                                    </p>


                                    <div
                                        class="worker-row"
                                    >

                                        <div
                                            class="worker-avatar"
                                        >
                                            ${
                                                favorite.worker_avatar_url
                                                    ? `
                                                        <img
                                                            src="${escapeHtml(
                                                                favorite.worker_avatar_url
                                                            )}"
                                                            alt="Worker"
                                                        >
                                                    `
                                                    : escapeHtml(
                                                        workerInitial
                                                    )
                                            }
                                        </div>


                                        <div
                                            class="worker-info"
                                        >

                                            <strong>
                                                ${escapeHtml(
                                                    workerName
                                                )}
                                            </strong>

                                            <span>
                                                Service Provider
                                            </span>

                                        </div>

                                    </div>


                                    <div
                                        class="card-bottom"
                                    >

                                        <div
                                            class="price-block"
                                        >

                                            <span
                                                class="price-label"
                                            >
                                                STARTING FROM
                                            </span>

                                            <span
                                                class="price"
                                            >
                                                ${escapeHtml(
                                                    formatMoney(
                                                        favorite.price,
                                                        favorite.currency || "MAD"
                                                    )
                                                )}
                                            </span>

                                        </div>


                                        <div
                                            class="card-actions"
                                        >

                                            <a
                                                href="../service.html?id=${encodeURIComponent(
                                                    favorite.service_id
                                                )}${
                                                    favorite.service_slug
                                                        ? `&slug=${encodeURIComponent(
                                                            favorite.service_slug
                                                        )}`
                                                        : ""
                                                }"
                                                class="view-btn"
                                            >
                                                View
                                            </a>


                                            <button
                                                type="button"
                                                class="remove-btn"
                                                data-favorite-id="${escapeHtml(
                                                    favorite.favorite_id
                                                )}"
                                                data-service-id="${escapeHtml(
                                                    favorite.service_id
                                                )}"
                                            >
                                                Remove
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </article>
                        `;
                    }
                )
                .join("");


        document
            .querySelectorAll(
                ".remove-btn"
            )
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        const favoriteId =
                            button.dataset.favoriteId;


                        await removeFavorite(
                            favoriteId,
                            button
                        );
                    }
                );
            });
    }


    async function removeFavorite(
        favoriteId,
        button
    ) {

        if (!favoriteId) {
            return;
        }


        button.disabled = true;

        const oldText =
            button.textContent;

        button.textContent =
            "Removing...";


        try {

            const {
                error
            } =
                await supabaseClient.rpc(
                    "remove_favorite",
                    {
                        p_favorite_id:
                            favoriteId
                    }
                );


            if (error) {
                throw error;
            }


            showToast(
                "Removed from favorites."
            );


            await loadFavorites();


        } catch (error) {

            console.error(
                "NOVA remove favorite error:",
                error
            );


            button.disabled = false;

            button.textContent =
                oldText;


            showToast(
                error.message ||
                "Could not remove favorite."
            );
        }
    }


    async function initialize() {

        try {

            if (!supabaseClient) {
                throw new Error(
                    "Supabase is not configured."
                );
            }


            currentUser =
                await getUser();


            if (!currentUser) {

                window.location.replace(
                    "../login.html?redirect=dashboard/favorites.html"
                );

                return;
            }


            await loadProfile();

            await loadFavorites();

            showContent();


        } catch (error) {

            console.error(
                "NOVA Favorites initialization error:",
                error
            );


            setError(
                error.message ||
                "Could not load favorites."
            );
        }
    }


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


    supabaseClient?.auth
        .onAuthStateChange(
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


    await initialize();

});