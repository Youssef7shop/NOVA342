"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initNovaGuard();
});

let originalGuardSettings = null;

const DEFAULT_GUARD_SETTINGS = {
    enabled: true,

    block_policy_violations: true,
    safe_response_mode: true,

    prompt_injection_protection: true,
    jailbreak_protection: true,
    system_override_protection: true,

    block_illegal_activities: true,
    block_violence: true,
    block_fraud: true,
    block_malware: true,
    block_privacy: true,
    block_dangerous_instructions: true,

    personal_data_protection: true,
    credential_protection: true,
    secret_masking: true,

    refusal_style: "helpful",
    safe_alternative_mode: "enabled",
    max_prompt_length: 20000,

    log_guard_events: true,
    log_detection_reason: true,
    admin_alerts: true
};

async function initNovaGuard() {
    setupSidebar();
    setupButtons();

    const client = window.supabaseClient;

    if (!client) {
        showAlert(
            "Supabase is not configured correctly.",
            "error"
        );

        return;
    }

    const adminOk = await checkAdmin(client);

    if (!adminOk) {
        return;
    }

    await loadGuardSettings(client);
}

/* =========================
   ADMIN AUTH
========================= */

async function checkAdmin(client) {
    try {
        const {
            data: userData,
            error: userError
        } = await client.auth.getUser();

        if (userError || !userData?.user) {
            redirectToLogin();
            return false;
        }

        const {
            data,
            error
        } = await client.rpc(
            "admin_current_profile"
        );

        if (error) {
            console.error(error);

            showAlert(
                error.message ||
                "Admin verification failed.",
                "error"
            );

            return false;
        }

        if (
            !data ||
            data.role !== "admin" ||
            data.is_active === false
        ) {
            document.body.innerHTML = `
                <div style="
                    min-height:100vh;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:#07070a;
                    color:#fff;
                    font-family:Arial,sans-serif;
                    padding:30px;
                    text-align:center;
                ">
                    <div>
                        <div style="
                            font-size:60px;
                            margin-bottom:20px;
                        ">
                            🔒
                        </div>

                        <h1 style="
                            margin:0 0 10px;
                            font-size:32px;
                        ">
                            Access Denied
                        </h1>

                        <p style="
                            color:#aaa;
                            margin-bottom:25px;
                        ">
                            Admin access is required.
                        </p>

                        <a
                            href="../login.html"
                            style="
                                display:inline-block;
                                padding:12px 20px;
                                border-radius:12px;
                                background:#5b5cff;
                                color:white;
                                text-decoration:none;
                            "
                        >
                            Back to Login
                        </a>
                    </div>
                </div>
            `;

            return false;
        }

        applyAdminProfile(data);

        return true;

    } catch (error) {
        console.error(
            "Admin verification error:",
            error
        );

        showAlert(
            "Unable to verify administrator.",
            "error"
        );

        return false;
    }
}

/* =========================
   ADMIN PROFILE
========================= */

function applyAdminProfile(profile) {
    const nameElement =
        document.getElementById("adminName");

    const emailElement =
        document.getElementById("adminEmail");

    const avatarElement =
        document.querySelector(".profile-avatar");

    const fullName =
        profile.full_name ||
        [
            profile.first_name,
            profile.last_name
        ]
            .filter(Boolean)
            .join(" ") ||
        "Admin";

    if (nameElement) {
        nameElement.textContent = fullName;
    }

    if (emailElement) {
        emailElement.textContent =
            profile.email || "Administrator";
    }

    if (avatarElement) {

        if (profile.avatar_url) {
            avatarElement.innerHTML = `
                <img
                    src="${escapeHtml(profile.avatar_url)}"
                    alt="Admin"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:50%;
                    "
                />
            `;
        } else {
            avatarElement.textContent =
                fullName.charAt(0).toUpperCase();
        }
    }
}

/* =========================
   LOAD SETTINGS
========================= */

async function loadGuardSettings(client) {
    try {
        setSaveStatus("Loading settings...", false);

        const {
            data,
            error
        } = await client.rpc(
            "admin_get_settings"
        );

        if (error) {
            throw error;
        }

        const settings = data || {};

        const guard = {
            ...DEFAULT_GUARD_SETTINGS,
            ...(
                settings.nova_guard ||
                {}
            )
        };

        originalGuardSettings =
            JSON.parse(
                JSON.stringify(guard)
            );

        populateForm(guard);

        updateGuardStatus(guard.enabled);

        setSaveStatus(
            "Settings loaded.",
            false
        );

        updateLastSaved(
            settings.updated_at ||
            null
        );

    } catch (error) {
        console.error(
            "Failed to load NOVA Guard settings:",
            error
        );

        showAlert(
            error.message ||
            "Failed to load settings.",
            "error"
        );

        const fallback =
            JSON.parse(
                JSON.stringify(
                    DEFAULT_GUARD_SETTINGS
                )
            );

        originalGuardSettings = fallback;

        populateForm(fallback);

        updateGuardStatus(
            fallback.enabled
        );
    }
}

/* =========================
   FORM POPULATION
========================= */

function populateForm(guard) {

    setChecked(
        "guardEnabled",
        guard.enabled
    );

    setChecked(
        "blockPolicyViolations",
        guard.block_policy_violations
    );

    setChecked(
        "safeResponseMode",
        guard.safe_response_mode
    );

    setChecked(
        "promptInjectionProtection",
        guard.prompt_injection_protection
    );

    setChecked(
        "jailbreakProtection",
        guard.jailbreak_protection
    );

    setChecked(
        "systemOverrideProtection",
        guard.system_override_protection
    );

    setChecked(
        "blockIllegalActivities",
        guard.block_illegal_activities
    );

    setChecked(
        "blockViolence",
        guard.block_violence
    );

    setChecked(
        "blockFraud",
        guard.block_fraud
    );

    setChecked(
        "blockMalware",
        guard.block_malware
    );

    setChecked(
        "blockPrivacy",
        guard.block_privacy
    );

    setChecked(
        "blockDangerousInstructions",
        guard.block_dangerous_instructions
    );

    setChecked(
        "personalDataProtection",
        guard.personal_data_protection
    );

    setChecked(
        "credentialProtection",
        guard.credential_protection
    );

    setChecked(
        "secretMasking",
        guard.secret_masking
    );

    const refusalStyle =
        document.getElementById(
            "refusalStyle"
        );

    if (refusalStyle) {
        refusalStyle.value =
            guard.refusal_style ||
            "helpful";
    }

    const alternativeMode =
        document.getElementById(
            "safeAlternativeMode"
        );

    if (alternativeMode) {
        alternativeMode.value =
            guard.safe_alternative_mode ||
            "enabled";
    }

    const maxPrompt =
        document.getElementById(
            "maxPromptLength"
        );

    if (maxPrompt) {
        maxPrompt.value =
            Number(
                guard.max_prompt_length ||
                20000
            );
    }

    setChecked(
        "logGuardEvents",
        guard.log_guard_events
    );

    setChecked(
        "logDetectionReason",
        guard.log_detection_reason
    );

    setChecked(
        "adminAlerts",
        guard.admin_alerts
    );
}

/* =========================
   READ FORM
========================= */

function readForm() {

    return {
        enabled:
            isChecked("guardEnabled"),

        block_policy_violations:
            isChecked(
                "blockPolicyViolations"
            ),

        safe_response_mode:
            isChecked(
                "safeResponseMode"
            ),

        prompt_injection_protection:
            isChecked(
                "promptInjectionProtection"
            ),

        jailbreak_protection:
            isChecked(
                "jailbreakProtection"
            ),

        system_override_protection:
            isChecked(
                "systemOverrideProtection"
            ),

        block_illegal_activities:
            isChecked(
                "blockIllegalActivities"
            ),

        block_violence:
            isChecked(
                "blockViolence"
            ),

        block_fraud:
            isChecked(
                "blockFraud"
            ),

        block_malware:
            isChecked(
                "blockMalware"
            ),

        block_privacy:
            isChecked(
                "blockPrivacy"
            ),

        block_dangerous_instructions:
            isChecked(
                "blockDangerousInstructions"
            ),

        personal_data_protection:
            isChecked(
                "personalDataProtection"
            ),

        credential_protection:
            isChecked(
                "credentialProtection"
            ),

        secret_masking:
            isChecked(
                "secretMasking"
            ),

        refusal_style:
            document.getElementById(
                "refusalStyle"
            )?.value ||
            "helpful",

        safe_alternative_mode:
            document.getElementById(
                "safeAlternativeMode"
            )?.value ||
            "enabled",

        max_prompt_length:
            Number(
                document.getElementById(
                    "maxPromptLength"
                )?.value ||
                20000
            ),

        log_guard_events:
            isChecked(
                "logGuardEvents"
            ),

        log_detection_reason:
            isChecked(
                "logDetectionReason"
            ),

        admin_alerts:
            isChecked(
                "adminAlerts"
            )
    };
}

/* =========================
   SAVE
========================= */

async function saveGuardSettings() {

    const client =
        window.supabaseClient;

    if (!client) {
        showAlert(
            "Supabase is not configured.",
            "error"
        );

        return;
    }

    const saveBtn =
        document.getElementById(
            "saveBtn"
        );

    const saveText =
        document.getElementById(
            "saveBtnText"
        );

    const saveIcon =
        document.getElementById(
            "saveBtnIcon"
        );

    try {

        saveBtn.disabled = true;

        if (saveText) {
            saveText.textContent =
                "Saving...";
        }

        if (saveIcon) {
            saveIcon.textContent = "⏳";
        }

        const guard =
            readForm();

        if (
            !Number.isFinite(
                guard.max_prompt_length
            )
        ) {
            guard.max_prompt_length = 20000;
        }

        guard.max_prompt_length =
            Math.min(
                100000,
                Math.max(
                    500,
                    guard.max_prompt_length
                )
            );

        const {
            data: currentSettings,
            error: getError
        } = await client.rpc(
            "admin_get_settings"
        );

        if (getError) {
            throw getError;
        }

        const mergedSettings = {
            ...(currentSettings || {}),
            nova_guard: guard
        };

        const {
            data,
            error
        } = await client.rpc(
            "admin_update_settings",
            {
                p_settings:
                    mergedSettings
            }
        );

        if (error) {
            throw error;
        }

        originalGuardSettings =
            JSON.parse(
                JSON.stringify(guard)
            );

        updateGuardStatus(
            guard.enabled
        );

        setSaveStatus(
            "Guard settings saved successfully.",
            true
        );

        updateLastSaved(
            new Date().toISOString()
        );

        showAlert(
            "NOVA Guard settings saved successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "Save NOVA Guard error:",
            error
        );

        showAlert(
            error.message ||
            "Could not save NOVA Guard settings.",
            "error"
        );

        setSaveStatus(
            "Save failed.",
            false
        );

    } finally {

        saveBtn.disabled = false;

        if (saveText) {
            saveText.textContent =
                "Save Guard Settings";
        }

        if (saveIcon) {
            saveIcon.textContent = "✓";
        }
    }
}

/* =========================
   RESET
========================= */

function resetGuardSettings() {

    if (!originalGuardSettings) {
        return;
    }

    const confirmReset =
        window.confirm(
            "Reset the form to the last saved NOVA Guard settings?"
        );

    if (!confirmReset) {
        return;
    }

    populateForm(
        JSON.parse(
            JSON.stringify(
                originalGuardSettings
            )
        )
    );

    updateGuardStatus(
        originalGuardSettings.enabled
    );

    setSaveStatus(
        "Changes reset.",
        false
    );

    showAlert(
        "The form has been reset.",
        "success"
    );
}

/* =========================
   STATUS
========================= */

function updateGuardStatus(enabled) {

    const text =
        document.getElementById(
            "guardStatusText"
        );

    const dot =
        document.getElementById(
            "guardStatusDot"
        );

    const sidebar =
        document.getElementById(
            "sidebarGuardStatus"
        );

    if (enabled) {

        if (text) {
            text.textContent =
                "Protection Active";
        }

        if (dot) {
            dot.classList.add("active");
            dot.classList.remove("inactive");
        }

        if (sidebar) {
            sidebar.textContent =
                "Protection Active";
        }

    } else {

        if (text) {
            text.textContent =
                "Protection Disabled";
        }

        if (dot) {
            dot.classList.remove("active");
            dot.classList.add("inactive");
        }

        if (sidebar) {
            sidebar.textContent =
                "Protection Disabled";
        }
    }
}

/* =========================
   BUTTONS
========================= */

function setupButtons() {

    const saveBtn =
        document.getElementById(
            "saveBtn"
        );

    const resetBtn =
        document.getElementById(
            "resetBtn"
        );

    const refreshBtn =
        document.getElementById(
            "refreshBtn"
        );

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    const guardEnabled =
        document.getElementById(
            "guardEnabled"
        );

    if (saveBtn) {
        saveBtn.addEventListener(
            "click",
            saveGuardSettings
        );
    }

    if (resetBtn) {
        resetBtn.addEventListener(
            "click",
            resetGuardSettings
        );
    }

    if (refreshBtn) {
        refreshBtn.addEventListener(
            "click",
            async () => {
                location.reload();
            }
        );
    }

    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            logoutAdmin
        );
    }

    if (guardEnabled) {
        guardEnabled.addEventListener(
            "change",
            () => {
                updateGuardStatus(
                    guardEnabled.checked
                );
            }
        );
    }
}

/* =========================
   LOGOUT
========================= */

async function logoutAdmin() {

    try {

        const client =
            window.supabaseClient;

        if (client) {
            await client.auth.signOut();
        }

        window.location.href =
            "../login.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        window.location.href =
            "../login.html";
    }
}

/* =========================
   SIDEBAR
========================= */

function setupSidebar() {

    const layout =
        document.getElementById(
            "adminLayout"
        );

    const toggle =
        document.getElementById(
            "sidebarToggle"
        );

    const close =
        document.getElementById(
            "sidebarClose"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (toggle) {
        toggle.addEventListener(
            "click",
            () => {
                layout?.classList.add(
                    "sidebar-open"
                );
            }
        );
    }

    if (close) {
        close.addEventListener(
            "click",
            () => {
                layout?.classList.remove(
                    "sidebar-open"
                );
            }
        );
    }

    if (overlay) {
        overlay.addEventListener(
            "click",
            () => {
                layout?.classList.remove(
                    "sidebar-open"
                );
            }
        );
    }
}

/* =========================
   UI HELPERS
========================= */

function setChecked(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.checked =
            Boolean(value);
    }
}

function isChecked(id) {

    return Boolean(
        document.getElementById(id)?.checked
    );
}

function showAlert(message, type = "info") {

    const alert =
        document.getElementById(
            "pageAlert"
        );

    if (!alert) {
        return;
    }

    alert.hidden = false;

    alert.className =
        `page-alert ${type}`;

    alert.textContent =
        message;

    clearTimeout(
        window.novaGuardAlertTimer
    );

    window.novaGuardAlertTimer =
        setTimeout(() => {
            alert.hidden = true;
        }, 5000);
}

function setSaveStatus(
    text,
    success
) {

    const element =
        document.getElementById(
            "saveStatus"
        );

    if (!element) {
        return;
    }

    element.textContent = text;

    element.classList.toggle(
        "success",
        Boolean(success)
    );
}

function updateLastSaved(
    dateString
) {

    const element =
        document.getElementById(
            "lastSaved"
        );

    if (!element) {
        return;
    }

    if (!dateString) {
        element.textContent = "—";
        return;
    }

    const date =
        new Date(dateString);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        element.textContent = "—";
        return;
    }

    element.textContent =
        `Last saved: ${date.toLocaleString()}`;
}

function redirectToLogin() {

    window.location.href =
        "../login.html";
}

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}