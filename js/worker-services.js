document.addEventListener("DOMContentLoaded", async () => {

    const supabase = window.supabaseClient;

    const grid =
        document.getElementById("servicesGrid");

    const modal =
        document.getElementById("serviceModal");

    const form =
        document.getElementById("serviceForm");

    const newServiceBtn =
        document.getElementById("newServiceBtn");

    const closeModal =
        document.getElementById("closeModal");

    const cancelBtn =
        document.getElementById("cancelBtn");

    const imageInput =
        document.getElementById("image");

    const imagePreview =
        document.getElementById("imagePreview");

    const previewImage =
        document.getElementById("previewImage");

    let currentUser = null;
    let services = [];

    if (!supabase) {
        showError("Supabase is not configured.");
        return;
    }

    await initialize();

    async function initialize() {

        const {
            data: {
                user
            }
        } = await supabase.auth.getUser();

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }

        currentUser = user;

        await loadServices();
    }

    async function loadServices() {

        grid.innerHTML = `
            <div class="loading">
                Loading your services...
            </div>
        `;

        const {
            data,
            error
        } = await supabase
            .from("services")
            .select("*")
            .eq("worker_id", currentUser.id)
            .order("created_at", {
                ascending: false
            });

        if (error) {

            console.error(error);

            showError(error.message);

            return;
        }

        services = data || [];

        renderServices();
    }

    function renderServices() {

        if (!services.length) {

            grid.innerHTML = `
                <div class="empty">

                    <h2>
                        No services yet
                    </h2>

                    <p style="margin-top:10px;">
                        Create your first service and start
                        offering your skills on NOVA MARKET.
                    </p>

                    <button
                        class="primary-btn"
                        style="margin-top:20px;"
                        id="emptyCreateBtn"
                    >
                        + Create Your First Service
                    </button>

                </div>
            `;

            document
                .getElementById("emptyCreateBtn")
                .addEventListener(
                    "click",
                    openCreateModal
                );

            return;
        }

        grid.innerHTML =
            services
                .map(service => createCard(service))
                .join("");

        document
            .querySelectorAll("[data-edit]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.edit;

                        const service =
                            services.find(
                                item => item.id === id
                            );

                        if (service) {
                            openEditModal(service);
                        }
                    }
                );
            });

        document
            .querySelectorAll("[data-delete]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteService(
                            button.dataset.delete
                        );
                    }
                );
            });

        document
            .querySelectorAll("[data-toggle]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        toggleStatus(
                            button.dataset.toggle
                        );
                    }
                );
            });
    }

    function createCard(service) {

        const status =
            service.status || "draft";

        const image =
            service.image_url
                ? `
                    <img
                        src="${escapeHTML(service.image_url)}"
                        alt="${escapeHTML(service.title)}"
                    >
                `
                : `
                    <div class="image-placeholder">
                        N
                    </div>
                `;

        const nextAction =
            status === "published"
                ? "Pause"
                : "Publish";

        return `
            <article class="card">

                <div class="image">
                    ${image}
                </div>

                <div class="content">

                    <span class="category">
                        ${escapeHTML(service.category)}
                    </span>

                    <h2 class="title">
                        ${escapeHTML(service.title)}
                    </h2>

                    <p class="description">
                        ${escapeHTML(
                            service.description || ""
                        )}
                    </p>

                    <div class="meta">

                        <div class="price">
                            $${Number(
                                service.price || 0
                            ).toFixed(2)}
                        </div>

                        <div class="delivery">
                            ${Number(
                                service.delivery_days || 1
                            )} day(s)
                        </div>

                    </div>

                    <span class="status ${status}">
                        ${capitalize(status)}
                    </span>

                    <div class="actions">

                        <button
                            class="action-btn"
                            data-edit="${escapeHTML(service.id)}"
                        >
                            Edit
                        </button>

                        <button
                            class="action-btn"
                            data-toggle="${escapeHTML(service.id)}"
                        >
                            ${nextAction}
                        </button>

                        <button
                            class="action-btn delete-btn"
                            data-delete="${escapeHTML(service.id)}"
                            style="grid-column:1 / -1;"
                        >
                            Delete Service
                        </button>

                    </div>

                </div>

            </article>
        `;
    }

    newServiceBtn.addEventListener(
        "click",
        openCreateModal
    );

    closeModal.addEventListener(
        "click",
        closeServiceModal
    );

    cancelBtn.addEventListener(
        "click",
        closeServiceModal
    );

    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {
                closeServiceModal();
            }

        }
    );

    imageInput.addEventListener(
        "change",
        () => {

            const file =
                imageInput.files[0];

            if (!file) {
                return;
            }

            if (!file.type.startsWith("image/")) {

                alert(
                    "Please select an image file."
                );

                imageInput.value = "";

                return;
            }

            if (file.size > 5 * 1024 * 1024) {

                alert(
                    "Image must be smaller than 5MB."
                );

                imageInput.value = "";

                return;
            }

            const reader =
                new FileReader();

            reader.onload = event => {

                previewImage.src =
                    event.target.result;

                imagePreview.style.display =
                    "block";
            };

            reader.readAsDataURL(file);
        }
    );

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await saveService();
        }
    );

    function openCreateModal() {

        form.reset();

        document.getElementById("serviceId").value =
            "";

        document.getElementById("modalTitle").textContent =
            "Create Service";

        document.getElementById("status").value =
            "draft";

        document.getElementById("deliveryDays").value =
            "3";

        imagePreview.style.display =
            "none";

        modal.classList.add("active");
    }

    function openEditModal(service) {

        document.getElementById("serviceId").value =
            service.id;

        document.getElementById("title").value =
            service.title || "";

        document.getElementById("description").value =
            service.description || "";

        document.getElementById("category").value =
            service.category || "Other";

        document.getElementById("price").value =
            service.price || 0;

        document.getElementById("deliveryDays").value =
            service.delivery_days || 3;

        document.getElementById("status").value =
            service.status || "draft";

        document.getElementById("modalTitle").textContent =
            "Edit Service";

        imageInput.value = "";

        if (service.image_url) {

            previewImage.src =
                service.image_url;

            imagePreview.style.display =
                "block";

        } else {

            imagePreview.style.display =
                "none";
        }

        modal.classList.add("active");
    }

    function closeServiceModal() {

        modal.classList.remove("active");
    }

    async function saveService() {

        const saveBtn =
            document.getElementById("saveBtn");

        const id =
            document.getElementById("serviceId").value.trim();

        const title =
            document.getElementById("title").value.trim();

        const description =
            document.getElementById("description").value.trim();

        const category =
            document.getElementById("category").value;

        const price =
            Number(
                document.getElementById("price").value
            );

        const deliveryDays =
            Number(
                document.getElementById("deliveryDays").value
            );

        const status =
            document.getElementById("status").value;

        if (!title) {
            alert("Enter a service title.");
            return;
        }

        if (!description) {
            alert("Enter a service description.");
            return;
        }

        if (Number.isNaN(price) || price < 0) {
            alert("Enter a valid price.");
            return;
        }

        if (
            Number.isNaN(deliveryDays) ||
            deliveryDays < 1
        ) {
            alert("Enter a valid delivery time.");
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        try {

            let imageUrl = null;

            const existingService =
                id
                    ? services.find(
                        service => service.id === id
                    )
                    : null;

            imageUrl =
                existingService?.image_url || null;

            const file =
                imageInput.files[0];

            if (file) {

                const extension =
                    file.name
                        .split(".")
                        .pop()
                        .toLowerCase();

                const fileName =
                    `${crypto.randomUUID()}.${extension}`;

                const path =
                    `${currentUser.id}/${fileName}`;

                const {
                    error: uploadError
                } = await supabase
                    .storage
                    .from("service-images")
                    .upload(
                        path,
                        file,
                        {
                            cacheControl: "3600",
                            upsert: false
                        }
                    );

                if (uploadError) {
                    throw uploadError;
                }

                const {
                    data: publicData
                } = supabase
                    .storage
                    .from("service-images")
                    .getPublicUrl(path);

                imageUrl =
                    publicData.publicUrl;
            }

            const slug =
                createSlug(title) +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2, 7);

            if (id) {

                const {
                    error
                } = await supabase
                    .from("services")
                    .update({
                        title,
                        description,
                        category,
                        price,
                        delivery_days: deliveryDays,
                        status,
                        image_url: imageUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", id)
                    .eq("worker_id", currentUser.id);

                if (error) {
                    throw error;
                }

            } else {

                const {
                    error
                } = await supabase
                    .from("services")
                    .insert({
                        worker_id: currentUser.id,
                        title,
                        slug,
                        description,
                        category,
                        price,
                        delivery_days: deliveryDays,
                        status,
                        image_url: imageUrl
                    });

                if (error) {
                    throw error;
                }
            }

            closeServiceModal();

            await loadServices();

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Something went wrong."
            );

        } finally {

            saveBtn.disabled = false;
            saveBtn.textContent =
                "Save Service";
        }
    }

    async function deleteService(id) {

        const confirmed =
            confirm(
                "Are you sure you want to delete this service?"
            );

        if (!confirmed) {
            return;
        }

        const {
            error
        } = await supabase
            .from("services")
            .delete()
            .eq("id", id)
            .eq("worker_id", currentUser.id);

        if (error) {

            console.error(error);

            alert(error.message);

            return;
        }

        services =
            services.filter(
                service => service.id !== id
            );

        renderServices();
    }

    async function toggleStatus(id) {

        const service =
            services.find(
                item => item.id === id
            );

        if (!service) {
            return;
        }

        const newStatus =
            service.status === "published"
                ? "paused"
                : "published";

        const {
            error
        } = await supabase
            .from("services")
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .eq("worker_id", currentUser.id);

        if (error) {

            console.error(error);

            alert(error.message);

            return;
        }

        await loadServices();
    }

    function createSlug(text) {

        return text
            .toLowerCase()
            .trim()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /(^-|-$)/g,
                ""
            );
    }

    function capitalize(value) {

        return String(value)
            .charAt(0)
            .toUpperCase() +
            String(value).slice(1);
    }

    function showError(message) {

        grid.innerHTML = `
            <div class="empty">

                <h2>
                    Something went wrong
                </h2>

                <p style="margin-top:10px;">
                    ${escapeHTML(message)}
                </p>

            </div>
        `;
    }

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

});