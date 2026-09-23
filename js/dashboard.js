document.addEventListener("DOMContentLoaded", async () => {

    const loading = document.getElementById("loading");

    function hideLoading() {
        setTimeout(() => {
            loading?.classList.add("hide");
        }, 300);
    }

    function showToast(message) {

        const toast = document.getElementById("toast");

        if (!toast) return;

        toast.textContent = message;
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    // Check Supabase
    if (!window.supabaseClient) {

        console.error("Supabase client not found.");

        showToast("Supabase is not configured.");

        hideLoading();

        return;
    }

    const client = window.supabaseClient;

    // Get current user
    const {
        data: { user },
        error: userError
    } = await client.auth.getUser();

    if (userError || !user) {

        window.location.href = "login.html";

        return;
    }

    console.log("Logged user:", user);


    // --------------------------------
    // USER PROFILE
    // --------------------------------

    let profile = null;

    const {
        data,
        error: profileError
    } = await client
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {

        console.error(
            "Profile error:",
            profileError
        );

    } else {

        profile = data;
    }


    // --------------------------------
    // USER INFORMATION
    // --------------------------------

    const metadata = user.user_metadata || {};

    const firstName =
        profile?.first_name ||
        metadata.first_name ||
        "";

    const lastName =
        profile?.last_name ||
        metadata.last_name ||
        "";

    const fullName =
        profile?.full_name ||
        metadata.full_name ||
        `${firstName} ${lastName}`.trim() ||
        user.email?.split("@")[0] ||
        "NOVA User";

    const email =
        profile?.email ||
        user.email ||
        "";

    const role =
        profile?.role ||
        "customer";

    const plan =
        profile?.plan ||
        "free";


    // --------------------------------
    // AVATAR
    // --------------------------------

    const avatar =
        profile?.avatar_url ||
        metadata.avatar_url ||
        metadata.picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
            fullName
        )}&background=3977ff&color=fff&size=256`;


    // --------------------------------
    // UPDATE UI
    // --------------------------------

    const welcomeName =
        document.getElementById("welcomeName");

    const profileName =
        document.getElementById("profileName");

    const profileEmail =
        document.getElementById("profileEmail");

    const profileAvatar =
        document.getElementById("profileAvatar");

    const sideAvatar =
        document.getElementById("sideAvatar");

    const sideName =
        document.getElementById("sideName");

    const sidePlan =
        document.getElementById("sidePlan");

    const roleBadge =
        document.getElementById("roleBadge");

    const planBadge =
        document.getElementById("planBadge");


    if (welcomeName) {
        welcomeName.textContent = firstName || fullName;
    }

    if (profileName) {
        profileName.textContent = fullName;
    }

    if (profileEmail) {
        profileEmail.textContent = email;
    }

    if (profileAvatar) {
        profileAvatar.src = avatar;
    }

    if (sideAvatar) {
        sideAvatar.src = avatar;
    }

    if (sideName) {
        sideName.textContent = fullName;
    }

    if (sidePlan) {
        sidePlan.textContent =
            `${capitalize(plan)} Plan`;
    }

    if (roleBadge) {
        roleBadge.textContent =
            capitalize(role);
    }

    if (planBadge) {
        planBadge.textContent =
            capitalize(plan);
    }


    // --------------------------------
    // BUTTONS
    // --------------------------------

    document
        .getElementById("profileBtn")
        ?.addEventListener("click", () => {

            window.location.href = "profile.html";

        });


    document
        .getElementById("editProfileBtn")
        ?.addEventListener("click", () => {

            window.location.href = "profile.html";

        });


    document
        .getElementById("openProfile")
        ?.addEventListener("click", () => {

            window.location.href = "profile.html";

        });


    document
        .getElementById("findService")
        ?.addEventListener("click", () => {

            window.location.href = "services.html";

        });


    document
        .getElementById("newProjectBtn")
        ?.addEventListener("click", () => {

            window.location.href = "projects.html";

        });


    document
        .getElementById("createProject")
        ?.addEventListener("click", () => {

            window.location.href = "projects.html";

        });


    document
        .getElementById("supportBtn")
        ?.addEventListener("click", () => {

            showToast("Support center coming soon.");

        });


    // --------------------------------
    // LOAD PROJECTS
    // --------------------------------

    await loadProjects(user.id, client);


    // --------------------------------
    // FAVORITES
    // --------------------------------

    loadFavorites();


    // --------------------------------
    // FINISH
    // --------------------------------

    hideLoading();

});


// ====================================
// LOAD PROJECTS
// ====================================

async function loadProjects(userId, client) {

    const projectsList =
        document.getElementById("projectsList");

    const projectCount =
        document.getElementById("projectCount");

    try {

        /*
         * This expects a table called:
         *
         * public.projects
         *
         * If you haven't created it yet,
         * the dashboard will simply stay empty.
         */

        const {
            data: projects,
            error
        } = await client
            .from("projects")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", {
                ascending: false
            })
            .limit(5);


        if (error) {

            console.log(
                "Projects table not ready:",
                error.message
            );

            if (projectCount) {
                projectCount.textContent = "0";
            }

            return;
        }


        if (projectCount) {
            projectCount.textContent =
                projects?.length || 0;
        }


        if (!projects || projects.length === 0) {

            projectsList.innerHTML = `
                <div class="empty">
                    No projects yet.<br>
                    Create your first NOVA project.
                </div>
            `;

            return;
        }


        projectsList.innerHTML =
            projects
                .map(project => {

                    const name =
                        project.name ||
                        project.title ||
                        "Untitled Project";

                    const status =
                        project.status ||
                        "Active";

                    return `

                        <div class="project">

                            <div class="project-info">

                                <div class="project-icon">
                                    ◈
                                </div>

                                <div>

                                    <div class="project-name">
                                        ${escapeHTML(name)}
                                    </div>

                                    <div class="project-status">
                                        ${escapeHTML(status)}
                                    </div>

                                </div>

                            </div>

                            <span>
                                →
                            </span>

                        </div>

                    `;

                })
                .join("");

    } catch (error) {

        console.error(
            "Project loading failed:",
            error
        );

    }

}


// ====================================
// FAVORITES
// ====================================

function loadFavorites() {

    const favoriteCount =
        document.getElementById("favoriteCount");

    try {

        const favorites =
            JSON.parse(
                localStorage.getItem("novaFavorites") || "[]"
            );

        if (favoriteCount) {
            favoriteCount.textContent =
                favorites.length;
        }

    } catch {

        if (favoriteCount) {
            favoriteCount.textContent = "0";
        }

    }

}


// ====================================
// HELPERS
// ====================================

function capitalize(value) {

    if (!value) return "";

    return value.charAt(0).toUpperCase() +
        value.slice(1);

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}