/* =========================================================
   NOVA MARKET
   Main Application JavaScript
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       HELPERS
       ========================================================= */

    const $ = (selector, parent = document) => {
        return parent.querySelector(selector);
    };

    const $$ = (selector, parent = document) => {
        return [...parent.querySelectorAll(selector)];
    };

    const on = (element, event, callback) => {
        if (element) {
            element.addEventListener(event, callback);
        }
    };

    /* =========================================================
       GLOBAL ELEMENTS
       ========================================================= */

    const body = document.body;

    /* =========================================================
       PAGE LOADER
       ========================================================= */

    const pageLoader = $(".page-loader");

    const hideLoader = () => {
        if (!pageLoader) return;

        pageLoader.classList.add("hidden");

        setTimeout(() => {
            pageLoader.style.display = "none";
        }, 700);
    };

    window.addEventListener("load", () => {
        setTimeout(hideLoader, 400);
    });

    /* Safety fallback */
    setTimeout(hideLoader, 3000);


    /* =========================================================
       NAVBAR
       ========================================================= */

    const navbar = $(".navbar");

    const handleNavbarScroll = () => {
        if (!navbar) return;

        if (window.scrollY > 30) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    };

    window.addEventListener("scroll", handleNavbarScroll, {
        passive: true
    });

    handleNavbarScroll();


    /* =========================================================
       MOBILE MENU
       ========================================================= */

    const mobileMenu = $(".mobile-menu");

    const menuOpenButton =
        $("[data-menu-open]") ||
        $(".menu-btn") ||
        $(".mobile-menu-btn");

    const menuCloseButton =
        $("[data-menu-close]") ||
        $(".close-menu");

    const openMobileMenu = () => {
        if (!mobileMenu) return;

        mobileMenu.classList.add("active");
        body.classList.add("menu-open");

        if (menuOpenButton) {
            menuOpenButton.setAttribute("aria-expanded", "true");
        }
    };

    const closeMobileMenu = () => {
        if (!mobileMenu) return;

        mobileMenu.classList.remove("active");
        body.classList.remove("menu-open");

        if (menuOpenButton) {
            menuOpenButton.setAttribute("aria-expanded", "false");
        }
    };

    on(menuOpenButton, "click", (event) => {
        event.preventDefault();
        openMobileMenu();
    });

    on(menuCloseButton, "click", (event) => {
        event.preventDefault();
        closeMobileMenu();
    });

    if (mobileMenu) {
        $$(".mobile-menu a", mobileMenu).forEach((link) => {
            link.addEventListener("click", () => {
                closeMobileMenu();
            });
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMobileMenu();
        }
    });


    /* =========================================================
       SEARCH OVERLAY
       ========================================================= */

    const searchOverlay = $(".search-overlay");

    const searchOpenButtons = [
        ...$$("[data-search-open]"),
        ...$$(".search-btn"),
        ...$$('[aria-label*="Search"]')
    ];

    const searchCloseButton =
        $("[data-search-close]") ||
        $(".close-search");

    const searchInput =
        $("[data-search-input]") ||
        $(".search-overlay input") ||
        $(".global-search");

    const openSearch = () => {
        if (!searchOverlay) return;

        searchOverlay.classList.add("active");
        body.classList.add("search-open");

        setTimeout(() => {
            if (searchInput) {
                searchInput.focus();
            }
        }, 150);
    };

    const closeSearch = () => {
        if (!searchOverlay) return;

        searchOverlay.classList.remove("active");
        body.classList.remove("search-open");
    };

    searchOpenButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            openSearch();
        });
    });

    on(searchCloseButton, "click", (event) => {
        event.preventDefault();
        closeSearch();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSearch();
        }
    });

    if (searchOverlay) {
        searchOverlay.addEventListener("click", (event) => {
            if (event.target === searchOverlay) {
                closeSearch();
            }
        });
    }


    /* =========================================================
       SEARCH FUNCTION
       ========================================================= */

    const searchableElements = [
        ...$$(".service-card"),
        ...$$(".worker-card"),
        ...$$(".category-card")
    ];

    const performSearch = (query) => {

        query = query.trim().toLowerCase();

        if (!query) {
            showToast(
                "Search",
                "كتب شنو باغي تقلب عليه.",
                "info"
            );
            return;
        }

        let matches = [];

        searchableElements.forEach((element) => {

            const text = element.innerText.toLowerCase();

            if (text.includes(query)) {
                matches.push(element);
            }
        });

        if (matches.length > 0) {

            closeSearch();

            matches[0].scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            matches.forEach((element) => {
                element.classList.add("search-highlight");

                setTimeout(() => {
                    element.classList.remove("search-highlight");
                }, 2500);
            });

            showToast(
                "Results found",
                `${matches.length} résultat${matches.length > 1 ? "s" : ""} trouvé.`,
                "success"
            );

        } else {

            showToast(
                "No results",
                `ما لقيناش نتائج لـ "${query}".`,
                "error"
            );
        }
    };

    if (searchInput) {

        searchInput.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                performSearch(searchInput.value);
            }
        });
    }


    /* =========================================================
       SEARCH SUGGESTIONS
       ========================================================= */

    $$("[data-search-value]").forEach((button) => {

        button.addEventListener("click", () => {

            const value = button.dataset.searchValue;

            if (searchInput) {
                searchInput.value = value;
                searchInput.focus();
            }
        });

    });

    $$(".search-suggestion, .popular-search").forEach((button) => {

        button.addEventListener("click", () => {

            const value =
                button.dataset.search ||
                button.innerText.trim();

            if (searchInput) {
                searchInput.value = value;
                searchInput.focus();
            }
        });

    });


    /* =========================================================
       SMOOTH SCROLL
       ========================================================= */

    $$('a[href^="#"]').forEach((link) => {

        link.addEventListener("click", (event) => {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") {
                event.preventDefault();
                return;
            }

            const target = $(targetId);

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

    });


    /* =========================================================
       ACTIVE NAVIGATION
       ========================================================= */

    const sections = $$("section[id]");
    const navLinks = $$('a[href^="#"]');

    if ("IntersectionObserver" in window && sections.length) {

        const sectionObserver = new IntersectionObserver(
            (entries) => {

                entries.forEach((entry) => {

                    if (!entry.isIntersecting) return;

                    const id = entry.target.id;

                    navLinks.forEach((link) => {

                        link.classList.remove("active");

                        if (
                            link.getAttribute("href") === `#${id}`
                        ) {
                            link.classList.add("active");
                        }

                    });

                });

            },
            {
                threshold: 0.35
            }
        );

        sections.forEach((section) => {
            sectionObserver.observe(section);
        });
    }


    /* =========================================================
       FAVORITES
       ========================================================= */

    const FAVORITES_KEY = "nova_market_favorites";

    let favorites = [];

    try {
        favorites =
            JSON.parse(
                localStorage.getItem(FAVORITES_KEY)
            ) || [];
    } catch (error) {
        favorites = [];
    }

    const getItemId = (button) => {

        if (button.dataset.id) {
            return button.dataset.id;
        }

        const card =
            button.closest(
                ".service-card, .worker-card, .category-card"
            );

        if (!card) return null;

        if (card.dataset.id) {
            return card.dataset.id;
        }

        const title =
            $(".service-title", card) ||
            $(".worker-name", card) ||
            $("h3", card) ||
            $("h2", card);

        if (!title) return null;

        return title.innerText
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-");
    };

    const saveFavorites = () => {

        localStorage.setItem(
            FAVORITES_KEY,
            JSON.stringify(favorites)
        );
    };

    const updateFavoriteButton = (button) => {

        const id = getItemId(button);

        if (!id) return;

        const isFavorite = favorites.includes(id);

        button.classList.toggle(
            "active",
            isFavorite
        );

        button.setAttribute(
            "aria-pressed",
            String(isFavorite)
        );

        if (isFavorite) {
            button.setAttribute(
                "aria-label",
                "Remove from favorites"
            );
        } else {
            button.setAttribute(
                "aria-label",
                "Add to favorites"
            );
        }
    };

    $$(".favorite-btn, [data-favorite]").forEach((button) => {

        updateFavoriteButton(button);

        button.addEventListener("click", (event) => {

            event.preventDefault();
            event.stopPropagation();

            const id = getItemId(button);

            if (!id) return;

            const index = favorites.indexOf(id);

            if (index === -1) {

                favorites.push(id);

                showToast(
                    "Added to favorites",
                    "تمت إضافة الخدمة للمفضلة.",
                    "success"
                );

            } else {

                favorites.splice(index, 1);

                showToast(
                    "Removed",
                    "تحيدات الخدمة من المفضلة.",
                    "info"
                );
            }

            saveFavorites();

            updateFavoriteButton(button);
        });

    });


    /* =========================================================
       TOAST SYSTEM
       ========================================================= */

    let toastContainer = $(".toast-container");

    if (!toastContainer) {

        toastContainer = document.createElement("div");

        toastContainer.className = "toast-container";

        document.body.appendChild(toastContainer);
    }

    window.showToast = (
        title,
        message,
        type = "success"
    ) => {

        const toast = document.createElement("div");

        toast.className = `toast toast-${type}`;

        let icon = "✓";

        if (type === "error") {
            icon = "!";
        }

        if (type === "info") {
            icon = "i";
        }

        toast.innerHTML = `
            <div class="toast-icon">
                ${icon}
            </div>

            <div class="toast-content">
                <strong>${escapeHTML(title)}</strong>
                <span>${escapeHTML(message)}</span>
            </div>

            <button
                class="toast-close"
                aria-label="Close notification"
            >
                ×
            </button>
        `;

        toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        const closeButton = $(".toast-close", toast);

        const removeToast = () => {

            toast.classList.remove("show");

            setTimeout(() => {
                toast.remove();
            }, 300);
        };

        on(closeButton, "click", removeToast);

        setTimeout(removeToast, 4500);
    };


    /* =========================================================
       ESCAPE HTML
       ========================================================= */

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =========================================================
       GENERIC DATA-TOAST BUTTONS
       ========================================================= */

    $$("[data-toast]").forEach((button) => {

        button.addEventListener("click", (event) => {

            event.preventDefault();

            const title =
                button.dataset.toastTitle ||
                "NOVA MARKET";

            const message =
                button.dataset.toast ||
                "Action completed.";

            const type =
                button.dataset.toastType ||
                "success";

            showToast(
                title,
                message,
                type
            );
        });

    });


    /* =========================================================
       SERVICE BUTTONS
       ========================================================= */

    $$(".service-card").forEach((card) => {

        const buttons = $$(
            "button:not(.favorite-btn), .service-action",
            card
        );

        buttons.forEach((button) => {

            button.addEventListener("click", (event) => {

                if (
                    button.closest("a") ||
                    button.dataset.action
                ) {
                    return;
                }

                event.preventDefault();

                const title =
                    $(".service-title", card)?.innerText ||
                    $("h3", card)?.innerText ||
                    "Service";

                showToast(
                    "Service selected",
                    `${title.trim()} — التفاصيل غادي تكون متاحة قريباً.`,
                    "info"
                );
            });

        });

    });


    /* =========================================================
       WORKER BUTTONS
       ========================================================= */

    $$(".worker-card").forEach((card) => {

        const buttons = $$(
            ".worker-action, .view-worker, .profile-btn",
            card
        );

        buttons.forEach((button) => {

            button.addEventListener("click", (event) => {

                if (button.closest("a")) return;

                event.preventDefault();

                const name =
                    $(".worker-name", card)?.innerText ||
                    $("h3", card)?.innerText ||
                    "Worker";

                showToast(
                    "Worker profile",
                    `${name.trim()} — profile opening soon.`,
                    "info"
                );
            });

        });

    });


    /* =========================================================
       CTA BUTTONS
       ========================================================= */

    $$("[data-action]").forEach((button) => {

        button.addEventListener("click", (event) => {

            const action = button.dataset.action;

            if (!action) return;

            switch (action) {

                case "login":

                    window.location.href = "login.html";

                    break;

                case "register":

                    window.location.href = "register.html";

                    break;

                case "services":

                    event.preventDefault();

                    const services =
                        $("#services");

                    if (services) {
                        services.scrollIntoView({
                            behavior: "smooth"
                        });
                    }

                    break;

                case "support":

                    event.preventDefault();

                    const support =
                        $("#support");

                    if (support) {
                        support.scrollIntoView({
                            behavior: "smooth"
                        });
                    }

                    break;

                case "search":

                    event.preventDefault();

                    openSearch();

                    break;

                default:

                    console.log(
                        `NOVA action: ${action}`
                    );
            }

        });

    });


    /* =========================================================
       CATEGORY CARDS
       ========================================================= */

    $$(".category-card").forEach((card) => {

        card.addEventListener("click", () => {

            const category =
                card.dataset.category ||
                $(".category-title", card)?.innerText ||
                $("h3", card)?.innerText;

            if (!category) return;

            const serviceSection =
                $("#services");

            if (serviceSection) {

                serviceSection.scrollIntoView({
                    behavior: "smooth"
                });

            }

            showToast(
                "Category",
                `كتقلب على ${category.trim()}.`,
                "info"
            );

        });

    });


    /* =========================================================
       "VIEW ALL" BUTTONS
       ========================================================= */

    $$("[data-view-all]").forEach((button) => {

        button.addEventListener("click", (event) => {

            event.preventDefault();

            const targetId =
                button.dataset.viewAll;

            const target =
                targetId
                    ? document.getElementById(targetId)
                    : $("#services");

            if (target) {

                target.scrollIntoView({
                    behavior: "smooth"
                });

            }

        });

    });


    /* =========================================================
       SCROLL REVEAL
       ========================================================= */

    const revealElements = $$(
        ".service-card, .worker-card, .category-card, " +
        ".process-card, .section-header, .hero-content, " +
        ".hero-visual, .support-card, .cta-section"
    );

    if (
        "IntersectionObserver" in window &&
        revealElements.length
    ) {

        revealElements.forEach((element) => {
            element.classList.add("reveal");
        });

        const revealObserver =
            new IntersectionObserver(
                (entries, observer) => {

                    entries.forEach((entry) => {

                        if (!entry.isIntersecting) {
                            return;
                        }

                        entry.target.classList.add(
                            "revealed"
                        );

                        observer.unobserve(
                            entry.target
                        );

                    });

                },
                {
                    threshold: 0.08
                }
            );

        revealElements.forEach((element) => {
            revealObserver.observe(element);
        });
    }


    /* =========================================================
       DYNAMIC YEAR
       ========================================================= */

    const currentYear =
        $("#currentYear") ||
        $(".current-year");

    if (currentYear) {
        currentYear.textContent =
            new Date().getFullYear();
    }


    /* =========================================================
       EXTERNAL / DUMMY LINKS
       ========================================================= */

    $$('a[href="#"]').forEach((link) => {

        link.addEventListener("click", (event) => {

            event.preventDefault();

        });

    });


    /* =========================================================
       KEYBOARD ACCESSIBILITY
       ========================================================= */

    document.addEventListener("keydown", (event) => {

        /* Ctrl/Cmd + K → Search */

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            openSearch();
        }

    });


    /* =========================================================
       PREVENT DOUBLE CLICK ZOOM ON MOBILE BUTTONS
       ========================================================= */

    $$("button").forEach((button) => {

        button.addEventListener(
            "touchend",
            () => {},
            { passive: true }
        );

    });


    /* =========================================================
       CONSOLE BRANDING
       ========================================================= */

    console.log(
        "%c NOVA MARKET ",
        "font-size:24px;font-weight:800;color:#7c3aed;"
    );

    console.log(
        "%c Digital Services Marketplace 🚀",
        "font-size:14px;color:#64748b;"
    );


    /* =========================================================
       APP READY
       ========================================================= */

    document.documentElement.classList.add(
        "nova-ready"
    );

});