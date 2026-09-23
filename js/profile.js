document.addEventListener("DOMContentLoaded", async () => {

    const loading = document.getElementById("loading");
    const client = window.supabaseClient;

    function hideLoading() {
        setTimeout(() => {
            loading?.classList.add("hide");
        }, 250);
    }

    function showToast(message, type = "") {

        const toast = document.getElementById("toast");

        if (!toast) return;

        toast.textContent = message;

        toast.className = "toast show";

        if (type) {
            toast.classList.add(type);
        }

        setTimeout(() => {
            toast.className = "toast";
        }, 3000);
    }

    if (!client) {

        showToast(
            "Supabase is not configured.",
            "error"
        );

        hideLoading();

        return;
    }


    // ==========================================
    // GET CURRENT USER
    // ==========================================

    const {
        data: {
            user
        },
        error: userError
    } = await client.auth.getUser();

    if (userError || !user) {

        window.location.href = "login.html";

        return;
    }


    // ==========================================
    // LOAD PROFILE
    // ==========================================

    let profile = null;

    const {
        data,
        error
    } = await client
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {

        console.error(
            "Profile loading error:",
            error
        );

        showToast(
            "Could not load your profile.",
            "error"
        );

    } else {

        profile = data;
    }


    // ==========================================
    // USER DATA
    // ==========================================

    const metadata =
        user.user_metadata || {};

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

    const avatar =
        profile?.avatar_url ||
        metadata.avatar_url ||
        metadata.picture ||
        createAvatar(fullName);


    // ==========================================
    // SET UI
    // ==========================================

    setValue("firstName", firstName);
    setValue("lastName", lastName);
    setValue("email", email);

    setText("heroName", fullName);
    setText("heroEmail", email);

    setText(
        "roleBadge",
        capitalize(role)
    );

    setText(
        "planBadge",
        capitalize(plan)
    );

    setText(
        "accountRole",
        capitalize(role)
    );

    setText(
        "accountPlan",
        capitalize(plan)
    );

    setText(
        "accountId",
        user.id
    );

    setImage(
        "profileAvatar",
        avatar
    );


    // ==========================================
    // SAVE PROFILE
    // ==========================================

    document
        .getElementById("profileForm")
        ?.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                const saveBtn =
                    document.getElementById("saveBtn");

                const newFirstName =
                    document
                        .getElementById("firstName")
                        .value
                        .trim();

                const newLastName =
                    document
                        .getElementById("lastName")
                        .value
                        .trim();


                if (!newFirstName) {

                    showToast(
                        "Please enter your first name.",
                        "error"
                    );

                    return;
                }


                if (!newLastName) {

                    showToast(
                        "Please enter your last name.",
                        "error"
                    );

                    return;
                }


                saveBtn.disabled = true;
                saveBtn.textContent = "Saving...";


                const newFullName =
                    `${newFirstName} ${newLastName}`.trim();


                const {
                    error: updateError
                } = await client
                    .from("profiles")
                    .update({
                        first_name: newFirstName,
                        last_name: newLastName,
                        full_name: newFullName,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", user.id);


                if (updateError) {

                    console.error(
                        "Profile update error:",
                        updateError
                    );

                    showToast(
                        updateError.message ||
                        "Could not update profile.",
                        "error"
                    );

                    saveBtn.disabled = false;
                    saveBtn.textContent = "Save Changes";

                    return;
                }


                // Also update Auth metadata
                const {
                    error: metadataError
                } = await client.auth.updateUser({

                    data: {
                        first_name: newFirstName,
                        last_name: newLastName,
                        full_name: newFullName
                    }

                });


                if (metadataError) {

                    console.warn(
                        "Auth metadata update failed:",
                        metadataError
                    );
                }


                setText(
                    "heroName",
                    newFullName
                );


                saveBtn.disabled = false;
                saveBtn.textContent = "Save Changes";


                showToast(
                    "Profile updated successfully.",
                    "success"
                );

            }
        );


    // ==========================================
    // AVATAR BUTTON
    // ==========================================

    document
        .getElementById("avatarBtn")
        ?.addEventListener(
            "click",
            () => {

                document
                    .getElementById("avatarInput")
                    ?.click();

            }
        );


    // ==========================================
    // AVATAR PREVIEW
    // ==========================================

    document
        .getElementById("avatarInput")
        ?.addEventListener(
            "change",
            async (event) => {

                const file =
                    event.target.files?.[0];

                if (!file) return;


                // Maximum 5 MB
                if (file.size > 5 * 1024 * 1024) {

                    showToast(
                        "Image must be smaller than 5MB.",
                        "error"
                    );

                    return;
                }


                if (!file.type.startsWith("image/")) {

                    showToast(
                        "Please select an image.",
                        "error"
                    );

                    return;
                }


                // Temporary preview
                const previewUrl =
                    URL.createObjectURL(file);

                setImage(
                    "profileAvatar",
                    previewUrl
                );


                /*
                 * Supabase Storage upload can be added here.
                 *
                 * For now this gives an instant preview.
                 *
                 * Next step:
                 * Create a "avatars" Storage bucket
                 * and permanently save the image.
                 */

                showToast(
                    "Image preview updated. Storage upload comes next.",
                    "success"
                );

            }
        );


    // ==========================================
    // LOGOUT
    // ==========================================

    document
        .getElementById("logoutBtn")
        ?.addEventListener(
            "click",
            async () => {

                const logoutBtn =
                    document.getElementById("logoutBtn");

                logoutBtn.disabled = true;
                logoutBtn.textContent = "Logging out...";


                const {
                    error
                } = await client.auth.signOut();


                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    logoutBtn.disabled = false;
                    logoutBtn.textContent = "Log Out";

                    showToast(
                        "Logout failed.",
                        "error"
                    );

                    return;
                }


                window.location.href =
                    "login.html";

            }
        );


    // ==========================================
    // PLANS
    // ==========================================

    document
        .getElementById("upgradeBtn")
        ?.addEventListener(
            "click",
            () => {

                showToast(
                    "NOVA Plans will be available soon."
                );

            }
        );


    hideLoading();

});


// ==========================================
// HELPERS
// ==========================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value ?? "";
    }
}


function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value =
            value ?? "";
    }
}


function setImage(id, value) {

    const element =
        document.getElementById(id);

    if (element && value) {
        element.src = value;
    }
}


function capitalize(value) {

    if (!value) return "";

    return value.charAt(0).toUpperCase() +
        value.slice(1);
}


function createAvatar(name) {

    return (
        "https://ui-avatars.com/api/" +
        "?name=" +
        encodeURIComponent(name) +
        "&background=3977ff" +
        "&color=fff" +
        "&size=256"
    );
}