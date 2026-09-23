document.addEventListener("DOMContentLoaded", async () => {

    const client = window.supabaseClient;

    const loading =
        document.getElementById("loading");

    const modal =
        document.getElementById("createModal");

    const projectsList =
        document.getElementById("projectsList");


    function hideLoading() {

        setTimeout(() => {

            loading?.classList.add("hide");

        }, 250);

    }


    function toast(message) {

        const element =
            document.getElementById("toast");

        if (!element) return;

        element.textContent = message;

        element.classList.add("show");

        setTimeout(() => {

            element.classList.remove("show");

        }, 3000);

    }


    // ==========================================
    // SUPABASE CHECK
    // ==========================================

    if (!client) {

        toast(
            "Supabase is not configured."
        );

        hideLoading();

        return;
    }


    // ==========================================
    // CURRENT USER
    // ==========================================

    const {
        data: {
            user
        },
        error
    } = await client.auth.getUser();


    if (error || !user) {

        window.location.href =
            "login.html";

        return;
    }


    // ==========================================
    // LOAD PROJECTS
    // ==========================================

    await loadProjects();


    // ==========================================
    // OPEN MODAL
    // ==========================================

    document
        .getElementById("openCreate")
        ?.addEventListener(
            "click",
            openModal
        );


    document
        .getElementById("closeModal")
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("cancelModal")
        ?.addEventListener(
            "click",
            closeModal
        );


    // Close by clicking outside
    modal?.addEventListener(
        "click",
        (event) => {

            if (event.target === modal) {

                closeModal();

            }

        }
    );


    // ==========================================
    // CREATE PROJECT
    // ==========================================

    document
        .getElementById("projectForm")
        ?.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const submit =
                    document.getElementById(
                        "submitProject"
                    );


                const name =
                    document
                        .getElementById(
                            "projectName"
                        )
                        .value
                        .trim();


                const description =
                    document
                        .getElementById(
                            "projectDescription"
                        )
                        .value
                        .trim();


                const status =
                    document
                        .getElementById(
                            "projectStatus"
                        )
                        .value;


                if (!name) {

                    toast(
                        "Enter a project name."
                    );

                    return;
                }


                submit.disabled = true;
                submit.textContent = "Creating...";


                const {
                    error
                } = await client
                    .from("projects")
                    .insert({

                        user_id: user.id,

                        name: name,

                        description:
                            description || null,

                        status: status

                    });


                if (error) {

                    console.error(
                        "Create project error:",
                        error
                    );

                    toast(
                        error.message ||
                        "Could not create project."
                    );

                    submit.disabled = false;
                    submit.textContent =
                        "Create Project";

                    return;
                }


                toast(
                    "Project created successfully."
                );


                document
                    .getElementById(
                        "projectForm"
                    )
                    .reset();


                closeModal();


                submit.disabled = false;
                submit.textContent =
                    "Create Project";


                await loadProjects();

            }
        );


    hideLoading();


    // ==========================================
    // LOAD PROJECTS FUNCTION
    // ==========================================

    async function loadProjects() {

        projectsList.innerHTML = `
            <div class="empty">

                <div class="empty-icon">
                    ◈
                </div>

                <h3>
                    Loading projects...
                </h3>

            </div>
        `;


        const {
            data: projects,
            error
        } = await client
            .from("projects")
            .select("*")
            .eq("user_id", user.id)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Load projects error:",
                error
            );

            projectsList.innerHTML = `
                <div class="empty">

                    <div class="empty-icon">
                        ⚠
                    </div>

                    <h3>
                        Could not load projects
                    </h3>

                    <p>
                        ${escapeHTML(error.message)}
                    </p>

                </div>
            `;

            return;
        }


        if (!projects || projects.length === 0) {

            projectsList.innerHTML = `
                <div class="empty">

                    <div class="empty-icon">
                        ◈
                    </div>

                    <h3>
                        No projects yet
                    </h3>

                    <p>
                        Create your first NOVA project.
                    </p>

                </div>
            `;

            return;
        }


        projectsList.innerHTML =
            projects
                .map(project => {

                    return createProjectCard(
                        project
                    );

                })
                .join("");


        // Delete buttons
        document
            .querySelectorAll(".delete-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset.id;

                        await deleteProject(id);

                    }
                );

            });

    }


    // ==========================================
    // DELETE PROJECT
    // ==========================================

    async function deleteProject(id) {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this project?"
            );


        if (!confirmed) return;


        const {
            error
        } = await client
            .from("projects")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);


        if (error) {

            console.error(
                "Delete project error:",
                error
            );

            toast(
                error.message ||
                "Could not delete project."
            );

            return;
        }


        toast(
            "Project deleted."
        );


        await loadProjects();

    }


    // ==========================================
    // MODAL
    // ==========================================

    function openModal() {

        modal?.classList.add("show");

        setTimeout(() => {

            document
                .getElementById(
                    "projectName"
                )
                ?.focus();

        }, 100);

    }


    function closeModal() {

        modal?.classList.remove("show");

    }


    // ==========================================
    // PROJECT CARD
    // ==========================================

    function createProjectCard(project) {

        const name =
            project.name ||
            "Untitled Project";


        const description =
            project.description ||
            "No description provided.";


        const status =
            project.status ||
            "active";


        const date =
            project.created_at
                ? new Date(
                    project.created_at
                ).toLocaleDateString(
                    undefined,
                    {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                    }
                )
                : "";


        return `

            <article class="project-card">

                <div class="project-top">

                    <div class="project-icon">
                        ◈
                    </div>

                    <span
                        class="status ${escapeHTML(status)}"
                    >
                        ${escapeHTML(status)}
                    </span>

                </div>


                <h3>
                    ${escapeHTML(name)}
                </h3>


                <p>
                    ${escapeHTML(description)}
                </p>


                <div class="project-footer">

                    <span class="date">
                        ${escapeHTML(date)}
                    </span>

                    <button
                        class="delete-btn"
                        data-id="${escapeHTML(project.id)}"
                    >
                        Delete
                    </button>

                </div>

            </article>

        `;

    }

});


// ==========================================
// HELPERS
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}