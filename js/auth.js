"use strict";

/* =========================================================
   NOVA MARKET
   SUPABASE AUTH
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    /* =====================================================
       CHECK SUPABASE
       ===================================================== */

    if (
        typeof supabase === "undefined" ||
        typeof SUPABASE_URL === "undefined" ||
        typeof SUPABASE_ANON_KEY === "undefined"
    ) {
        console.error("Supabase is not configured.");

        showMessage(
            "Supabase is not configured. Check supabase-config.js.",
            "error"
        );

        return;
    }

    /* =====================================================
       CREATE CLIENT
       ===================================================== */

    const supabaseClient = supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const loginForm =
        document.getElementById("loginForm");

    const registerForm =
        document.getElementById("registerForm");

    const loginButton =
        document.getElementById("loginButton");

    const registerButton =
        document.getElementById("registerButton");

    const googleLogin =
        document.getElementById("googleLogin");

    const googleRegister =
        document.getElementById("googleRegister");

    const forgotPassword =
        document.getElementById("forgotPassword");

    const togglePassword =
        document.getElementById("togglePassword");

    const toggleConfirmPassword =
        document.getElementById(
            "toggleConfirmPassword"
        );

    const password =
        document.getElementById("password");

    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        );

    const passwordStrength =
        document.getElementById(
            "passwordStrength"
        );

    const strengthText =
        document.getElementById(
            "strengthText"
        );


    /* =====================================================
       CURRENT USER
       ===================================================== */

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();

    if (session) {

        const currentPage =
            window.location.pathname;

        if (
            currentPage.endsWith("login.html") ||
            currentPage.endsWith("register.html")
        ) {
            window.location.href =
                "index.html";
        }
    }


    /* =====================================================
       AUTH STATE
       ===================================================== */

    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            console.log(
                "NOVA Auth:",
                event
            );

            if (
                event === "SIGNED_IN" &&
                session
            ) {

                const currentPage =
                    window.location.pathname;

                if (
                    currentPage.endsWith("login.html") ||
                    currentPage.endsWith("register.html")
                ) {
                    window.location.href =
                        "index.html";
                }
            }

        }
    );


    /* =====================================================
       LOGIN
       ===================================================== */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                clearMessage();

                const email =
                    document
                        .getElementById("email")
                        ?.value
                        .trim();

                const password =
                    document
                        .getElementById("password")
                        ?.value;

                if (!email || !password) {

                    showMessage(
                        "دخل Email و Password.",
                        "error"
                    );

                    return;
                }

                if (!isValidEmail(email)) {

                    showMessage(
                        "دخل Email صحيح.",
                        "error"
                    );

                    return;
                }

                setButtonLoading(
                    loginButton,
                    true,
                    "Logging in..."
                );

                try {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient.auth
                            .signInWithPassword({
                                email,
                                password
                            });

                    if (error) {
                        throw error;
                    }

                    if (!data.session) {

                        showMessage(
                            "Login ماكملش. حاول مرة أخرى.",
                            "error"
                        );

                        setButtonLoading(
                            loginButton,
                            false,
                            "Login to NOVA"
                        );

                        return;
                    }

                    showMessage(
                        "Login successful. Welcome back!",
                        "success"
                    );

                    setTimeout(() => {

                        window.location.href =
                            "index.html";

                    }, 700);

                } catch (error) {

                    console.error(
                        "Login error:",
                        error
                    );

                    showMessage(
                        getAuthErrorMessage(error),
                        "error"
                    );

                    setButtonLoading(
                        loginButton,
                        false,
                        "Login to NOVA"
                    );
                }

            }
        );
    }


    /* =====================================================
       REGISTER
       ===================================================== */

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                clearMessage();

                const firstName =
                    document
                        .getElementById("firstName")
                        ?.value
                        .trim();

                const lastName =
                    document
                        .getElementById("lastName")
                        ?.value
                        .trim();

                const email =
                    document
                        .getElementById("email")
                        ?.value
                        .trim();

                const password =
                    document
                        .getElementById("password")
                        ?.value;

                const confirm =
                    document
                        .getElementById(
                            "confirmPassword"
                        )
                        ?.value;

                const terms =
                    document
                        .getElementById("terms")
                        ?.checked;


                /* -----------------------------------------
                   VALIDATION
                   ----------------------------------------- */

                if (
                    !firstName ||
                    !lastName ||
                    !email ||
                    !password ||
                    !confirm
                ) {

                    showMessage(
                        "عمر جميع الخانات المطلوبة.",
                        "error"
                    );

                    return;
                }


                if (
                    firstName.length < 2 ||
                    lastName.length < 2
                ) {

                    showMessage(
                        "الاسم والكنية خاصهم يكونو على الأقل جوج حروف.",
                        "error"
                    );

                    return;
                }


                if (!isValidEmail(email)) {

                    showMessage(
                        "دخل Email صحيح.",
                        "error"
                    );

                    return;
                }


                if (password.length < 8) {

                    showMessage(
                        "Password خاصو يكون فيه 8 حروف على الأقل.",
                        "error"
                    );

                    return;
                }


                if (password !== confirm) {

                    showMessage(
                        "Password و Confirm Password ما متطابقينش.",
                        "error"
                    );

                    return;
                }


                if (!terms) {

                    showMessage(
                        "خاصك توافق على Terms of Service و Privacy Policy.",
                        "error"
                    );

                    return;
                }


                /* -----------------------------------------
                   LOADING
                   ----------------------------------------- */

                setButtonLoading(
                    registerButton,
                    true,
                    "Creating account..."
                );


                try {

                    /* -------------------------------------
                       SUPABASE SIGN UP
                       ------------------------------------- */

                    const {
                        data,
                        error
                    } =
                        await supabaseClient.auth
                            .signUp({

                                email,

                                password,

                                options: {

                                    data: {

                                        first_name:
                                            firstName,

                                        last_name:
                                            lastName,

                                        full_name:
                                            `${firstName} ${lastName}`

                                    }

                                }

                            });


                    if (error) {
                        throw error;
                    }


                    /* -------------------------------------
                       EMAIL CONFIRMATION
                       ------------------------------------- */

                    if (
                        data.user &&
                        !data.session
                    ) {

                        showMessage(
                            "تم إنشاء الحساب. شيك على Email ديالك باش تأكد الحساب.",
                            "success"
                        );

                        registerForm.reset();

                        setButtonLoading(
                            registerButton,
                            false,
                            "Create account"
                        );

                        return;
                    }


                    /* -------------------------------------
                       DIRECT LOGIN
                       ------------------------------------- */

                    if (data.session) {

                        showMessage(
                            "Account created successfully!",
                            "success"
                        );

                        setTimeout(() => {

                            window.location.href =
                                "index.html";

                        }, 700);

                        return;
                    }


                } catch (error) {

                    console.error(
                        "Register error:",
                        error
                    );

                    showMessage(
                        getAuthErrorMessage(error),
                        "error"
                    );

                    setButtonLoading(
                        registerButton,
                        false,
                        "Create account"
                    );
                }

            }
        );
    }


    /* =====================================================
       GOOGLE LOGIN
       ===================================================== */

    if (googleLogin) {

        googleLogin.addEventListener(
            "click",
            async () => {

                clearMessage();

                setButtonLoading(
                    googleLogin,
                    true,
                    "Connecting..."
                );

                try {

                    const {
                        error
                    } =
                        await supabaseClient.auth
                            .signInWithOAuth({

                                provider: "google",

                                options: {

                                    redirectTo:
                                        `${window.location.origin}/index.html`

                                }

                            });

                    if (error) {
                        throw error;
                    }

                } catch (error) {

                    console.error(
                        "Google login error:",
                        error
                    );

                    showMessage(
                        getAuthErrorMessage(error),
                        "error"
                    );

                    setButtonLoading(
                        googleLogin,
                        false,
                        "Continue with Google"
                    );
                }

            }
        );
    }


    /* =====================================================
       GOOGLE REGISTER
       ===================================================== */

    if (googleRegister) {

        googleRegister.addEventListener(
            "click",
            async () => {

                clearMessage();

                setButtonLoading(
                    googleRegister,
                    true,
                    "Connecting..."
                );

                try {

                    const {
                        error
                    } =
                        await supabaseClient.auth
                            .signInWithOAuth({

                                provider: "google",

                                options: {

                                    redirectTo:
                                        `${window.location.origin}/index.html`

                                }

                            });

                    if (error) {
                        throw error;
                    }

                } catch (error) {

                    console.error(
                        "Google register error:",
                        error
                    );

                    showMessage(
                        getAuthErrorMessage(error),
                        "error"
                    );

                    setButtonLoading(
                        googleRegister,
                        false,
                        "Continue with Google"
                    );
                }

            }
        );
    }


    /* =====================================================
       FORGOT PASSWORD
       ===================================================== */

    if (forgotPassword) {

        forgotPassword.addEventListener(
            "click",
            async (event) => {

                event.preventDefault();

                clearMessage();

                const email =
                    document
                        .getElementById("email")
                        ?.value
                        .trim();

                if (!email) {

                    showMessage(
                        "دخل Email ديالك الأول.",
                        "error"
                    );

                    return;
                }

                if (!isValidEmail(email)) {

                    showMessage(
                        "دخل Email صحيح.",
                        "error"
                    );

                    return;
                }

                try {

                    const {
                        error
                    } =
                        await supabaseClient.auth
                            .resetPasswordForEmail(
                                email,
                                {
                                    redirectTo:
                                        `${window.location.origin}/reset-password.html`
                                }
                            );

                    if (error) {
                        throw error;
                    }

                    showMessage(
                        "إلا كان الحساب موجود، غادي توصلك رسالة باش تبدل Password.",
                        "success"
                    );

                } catch (error) {

                    console.error(
                        "Reset password error:",
                        error
                    );

                    showMessage(
                        getAuthErrorMessage(error),
                        "error"
                    );
                }

            }
        );
    }


    /* =====================================================
       PASSWORD TOGGLE
       ===================================================== */

    setupPasswordToggle(
        togglePassword,
        password
    );

    setupPasswordToggle(
        toggleConfirmPassword,
        confirmPassword
    );


    /* =====================================================
       PASSWORD STRENGTH
       ===================================================== */

    if (password) {

        password.addEventListener(
            "input",
            () => {

                updatePasswordStrength(
                    password.value,
                    passwordStrength,
                    strengthText
                );

            }
        );
    }


    /* =====================================================
       CONFIRM PASSWORD
       ===================================================== */

    if (confirmPassword) {

        confirmPassword.addEventListener(
            "input",
            () => {

                const original =
                    password?.value || "";

                const confirmation =
                    confirmPassword.value;

                if (!confirmation) {

                    confirmPassword
                        .classList
                        .remove(
                            "valid",
                            "invalid"
                        );

                    return;
                }

                if (
                    original === confirmation
                ) {

                    confirmPassword
                        .classList
                        .add("valid");

                    confirmPassword
                        .classList
                        .remove("invalid");

                } else {

                    confirmPassword
                        .classList
                        .add("invalid");

                    confirmPassword
                        .classList
                        .remove("valid");
                }

            }
        );
    }


    /* =====================================================
       GLOBAL FUNCTIONS
       ===================================================== */

    window.novaAuth = {

        getUser: async () => {

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .getUser();

            if (error) {
                console.error(error);
                return null;
            }

            return data.user;
        },


        getSession: async () => {

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .getSession();

            if (error) {
                console.error(error);
                return null;
            }

            return data.session;
        },


        logout: async () => {

            const {
                error
            } =
                await supabaseClient.auth
                    .signOut();

            if (error) {
                throw error;
            }

            window.location.href =
                "login.html";
        }

    };


});


/* =========================================================
   PASSWORD TOGGLE FUNCTION
   ========================================================= */

function setupPasswordToggle(button, input) {

    if (!button || !input) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            const isPassword =
                input.type === "password";

            input.type =
                isPassword
                    ? "text"
                    : "password";

            button.textContent =
                isPassword
                    ? "🙈"
                    : "👁";

            button.setAttribute(
                "aria-label",
                isPassword
                    ? "Hide password"
                    : "Show password"
            );
        }
    );
}


/* =========================================================
   PASSWORD STRENGTH
   ========================================================= */

function updatePasswordStrength(
    password,
    container,
    textElement
) {

    if (!container || !textElement) {
        return;
    }

    if (!password) {

        container.classList.remove("show");

        textElement.textContent = "";

        return;
    }

    container.classList.add("show");

    const bars =
        container.querySelectorAll(
            ".strength-bar"
        );

    let score = 0;


    if (password.length >= 8) {
        score++;
    }

    if (/[a-z]/.test(password)) {
        score++;
    }

    if (/[A-Z]/.test(password)) {
        score++;
    }

    if (/[0-9]/.test(password)) {
        score++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score++;
    }


    bars.forEach((bar, index) => {

        if (index < score) {

            bar.style.background =
                "rgba(34,197,94,.85)";

        } else {

            bar.style.background =
                "rgba(255,255,255,.08)";
        }

    });


    if (score <= 1) {

        textElement.textContent =
            "Weak password";

    } else if (score === 2) {

        textElement.textContent =
            "Fair password";

    } else if (score === 3) {

        textElement.textContent =
            "Good password";

    } else {

        textElement.textContent =
            "Strong password";
    }
}


/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


/* =========================================================
   AUTH MESSAGE
   ========================================================= */

function showMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "authMessage"
        );

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        `auth-message show ${type}`;
}


function clearMessage() {

    const element =
        document.getElementById(
            "authMessage"
        );

    if (!element) {
        return;
    }

    element.textContent = "";

    element.className =
        "auth-message";
}


/* =========================================================
   BUTTON LOADING
   ========================================================= */

function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {
        return;
    }

    button.disabled = loading;

    const span =
        button.querySelector("span");

    if (span) {

        if (!button.dataset.originalText) {

            button.dataset.originalText =
                span.textContent;
        }

        span.textContent = loading
            ? text
            : button.dataset.originalText;

    } else {

        if (!button.dataset.originalText) {

            button.dataset.originalText =
                button.textContent;
        }

        button.textContent = loading
            ? text
            : button.dataset.originalText;
    }
}


/* =========================================================
   SUPABASE ERROR TRANSLATION
   ========================================================= */

function getAuthErrorMessage(error) {

    if (!error) {
        return "وقع خطأ غير معروف.";
    }

    const message =
        String(
            error.message || ""
        ).toLowerCase();


    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return "Email أو Password غير صحيح.";
    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return "خاصك تأكد Email ديالك قبل Login.";
    }


    if (
        message.includes(
            "user already registered"
        )
    ) {

        return "هاد Email مسجل من قبل. جرب Login.";
    }


    if (
        message.includes(
            "password should be at least"
        )
    ) {

        return "Password ضعيف. خاصو يكون أقوى.";
    }


    if (
        message.includes(
            "invalid email"
        )
    ) {

        return "Email غير صحيح.";
    }


    if (
        message.includes(
            "email rate limit exceeded"
        )
    ) {

        return "طلبات Email كثيرة دابا. حاول من بعد.";
    }


    if (
        message.includes(
            "network"
        )
    ) {

        return "كاين مشكل فالإنترنت. حاول مرة أخرى.";
    }


    return error.message ||
        "وقع خطأ. حاول مرة أخرى.";
}