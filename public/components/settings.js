/* =========================================================
   TRILLFLOW — SETTINGS SYSTEM
   FINAL CLEAN VERSION
   Arabic / RTL
   Account / Notifications / Appearance / Security
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const SETTINGS_PAGE_ID = "settingsPage";


    /* =====================================================
       HELPERS
    ===================================================== */

    const $ = (selector, parent = document) => {

        return parent.querySelector(selector);

    };


    const $$ = (selector, parent = document) => {

        return Array.from(
            parent.querySelectorAll(selector)
        );

    };


    const getSettingsPage = () => {

        return document.getElementById(
            SETTINGS_PAGE_ID
        );

    };


    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimer = null;


    function showSettingsToast(
        message,
        title = "تم بنجاح"
    ) {

        const toast =
            $("#tfSettingsToast");

        const toastTitle =
            $("#tfToastTitle");

        const toastMessage =
            $("#tfToastMessage");


        if (!toast) {

            console.warn(
                "⚠️ tfSettingsToast غير موجود"
            );

            return;

        }


        if (toastTitle) {

            toastTitle.textContent =
                title;

        }


        if (toastMessage) {

            toastMessage.textContent =
                message;

        }


        toast.classList.add(
            "show"
        );


        clearTimeout(
            toastTimer
        );


        toastTimer =
            setTimeout(() => {

                toast.classList.remove(
                    "show"
                );

            }, 3000);

    }


    /* =====================================================
       API REQUEST
    ===================================================== */

    async function settingsRequest(
        url,
        options = {}
    ) {

        try {

            const response =
                await fetch(
                    url,
                    {
                        ...options,

                        credentials:
                            "include",

                        headers: {

                            "Content-Type":
                                "application/json",

                            ...(options.headers || {})

                        }

                    }
                );


            let data = {};


            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    `خطأ في الاتصال (${response.status})`
                );

            }


            return data;


        } catch (error) {

            console.error(
                "SETTINGS API ERROR:",
                error
            );

            throw error;

        }

    }


    /* =====================================================
       ROLE TRANSLATION
    ===================================================== */

    function translateRole(role) {

        const roles = {

            admin:
                "مدير النظام",

            owner:
                "مالك",

            manager:
                "مدير",

            member:
                "عضو",

            user:
                "مستخدم"

        };


        const normalized =
            String(
                role || ""
            ).toLowerCase();


        return (
            roles[normalized] ||
            role ||
            "مستخدم"
        );

    }


    /* =====================================================
       INITIALS
    ===================================================== */

    function getInitials(name) {

        if (!name) {

            return "؟";

        }


        const words =
            String(name)
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (!words.length) {

            return "؟";

        }


        if (words.length === 1) {

            return words[0]
                .substring(0, 1)
                .toUpperCase();

        }


        return (
            words[0][0] +
            words[1][0]
        ).toUpperCase();

    }


    /* =====================================================
       LOAD USER
    ===================================================== */

    async function loadSettingsUser() {

        const page =
            getSettingsPage();


        if (!page) {

            console.warn(
                "⚠️ settingsPage غير موجود"
            );

            return;

        }


        const nameInput =
            $("#tfSettingsUsername");

        const emailInput =
            $("#tfSettingsEmail");

        const displayName =
            $("#tfSettingsDisplayName");

        const roleElement =
            $("#tfSettingsRole");

        const avatar =
            $("#tfSettingsAvatar");


        try {

            const result =
                await settingsRequest(
                    "/user",
                    {
                        method: "GET"
                    }
                );


            /*
             * بعض الـBackends ترجع:
             *
             * { user: {...} }
             *
             * وبعضها ترجع:
             *
             * {...}
             */

            const user =
                result.user ||
                result;


            const username =
                user.username ||
                user.name ||
                "";


            const email =
                user.email ||
                "";


            const role =
                user.role ||
                "user";


            if (nameInput) {

                nameInput.value =
                    username;

            }


            if (emailInput) {

                emailInput.value =
                    email;

            }


            if (displayName) {

                displayName.textContent =
                    username ||
                    "المستخدم";

            }


            if (roleElement) {

                roleElement.textContent =
                    translateRole(role);

            }


            if (avatar) {

                avatar.textContent =
                    getInitials(
                        username
                    );

            }


    

        } catch (error) {

            console.error(
                "❌ SETTINGS USER ERROR:",
                error
            );


            showSettingsToast(
                error.message ||
                "تعذر تحميل بيانات الحساب.",
                "خطأ"
            );

        }

    }


    /* =====================================================
       SETTINGS TABS
       IMPORTANT:
       يوجد Listener واحد فقط
    ===================================================== */

    function initSettingsTabs() {

        const page =
            getSettingsPage();


        if (!page) {

            console.warn(
                "⚠️ لا يمكن تشغيل Settings Tabs لأن settingsPage غير موجود"
            );

            return;

        }


        const sidebar =
            $(".tf-settings-sidebar", page);


        if (!sidebar) {

            console.error(
                "❌ tf-settings-sidebar غير موجود"
            );

            return;

        }


        /*
         * منع تكرار Event Listener
         */

        if (
            sidebar.dataset.settingsTabsReady ===
            "true"
        ) {


            return;

        }


        sidebar.dataset.settingsTabsReady =
            "true";


   


        /* =================================================
           CLICK
        ================================================= */

        sidebar.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        ".tf-settings-nav"
                    );


                if (!button) {

                    return;

                }


                /*
                 * مهم:
                 *
                 * نستخدم preventDefault فقط.
                 *
                 * لا نستخدم stopPropagation
                 * حتى لا نكسر Navigation الرئيسي.
                 */

                event.preventDefault();


                const tab =
                    button.dataset.settingsTab;


                if (!tab) {

                    console.error(
                        "❌ data-settings-tab غير موجود",
                        button
                    );

                    return;

                }




                setSettingsTab(
                    tab,
                    true
                );

            }
        );


        /* =================================================
           INITIAL TAB
        ================================================= */

        const activeButton =
            $(".tf-settings-nav.active", page);


        if (activeButton) {

            const initialTab =
                activeButton.dataset.settingsTab;


            if (initialTab) {

                setSettingsTab(
                    initialTab,
                    false
                );

            }

        } else {

            const firstButton =
                $(".tf-settings-nav", page);


            if (firstButton) {

                const firstTab =
                    firstButton.dataset.settingsTab;


                if (firstTab) {

                    setSettingsTab(
                        firstTab,
                        false
                    );

                }

            }

        }

    }


    /* =====================================================
       SET SETTINGS TAB
    ===================================================== */

    function setSettingsTab(
        tab,
        animate = true
    ) {

        const page =
            getSettingsPage();


        if (!page) {

            console.warn(
                "⚠️ settingsPage غير موجود"
            );

            return;

        }


        if (!tab) {

            console.warn(
                "⚠️ Settings Tab فارغ"
            );

            return;

        }


        const buttons =
            $$(".tf-settings-nav", page);


        const panels =
            $$(".tf-settings-panel", page);


        let found =
            false;


        /* =================================================
           BUTTONS
        ================================================= */

        buttons.forEach(
            (button) => {

                const buttonTab =
                    button.dataset.settingsTab;


                const active =
                    buttonTab === tab;


                button.classList.toggle(
                    "active",
                    active
                );


                /*
                 * Accessibility
                 */

                button.setAttribute(
                    "aria-selected",
                    active
                        ? "true"
                        : "false"
                );

            }
        );


        /* =================================================
           PANELS
        ================================================= */

        panels.forEach(
            (panel) => {

                const panelTab =
                    panel.dataset.settingsPanel;


                const active =
                    panelTab === tab;


                if (active) {

                    found = true;

                }


                panel.classList.toggle(
                    "active",
                    active
                );


                /*
                 * hidden
                 */

                panel.hidden =
                    !active;


                /*
                 * display
                 *
                 * نستخدم block حتى لا يعتمد
                 * ظهور الـPanel على CSS خارجي.
                 */

                panel.style.display =
                    active
                        ? "block"
                        : "none";


                /*
                 * Animation class
                 */

                if (
                    active &&
                    animate
                ) {

                    panel.classList.remove(
                        "tf-settings-panel-enter"
                    );


                    /*
                     * Force reflow
                     */

                    void panel.offsetWidth;


                    panel.classList.add(
                        "tf-settings-panel-enter"
                    );

                }

            }
        );


        /* =================================================
           PANEL NOT FOUND
        ================================================= */

        if (!found) {

            console.error(
                "❌ Settings Panel غير موجود:",
                tab
            );





            return;

        }





        /* =================================================
           ACCOUNT
        ================================================= */

        if (
            tab === "account"
        ) {

            loadSettingsUser();

        }

    }


    /* =====================================================
       SAVE ACCOUNT
    ===================================================== */

    async function saveAccount() {

        const nameInput =
            $("#tfSettingsUsername");

        const emailInput =
            $("#tfSettingsEmail");

        const button =
            $("#tfSaveAccountBtn");


        if (
            !nameInput ||
            !emailInput
        ) {

            console.warn(
                "⚠️ حقول الحساب غير موجودة"
            );

            return;

        }


        const username =
            nameInput.value.trim();


        const email =
            emailInput.value.trim();


        /* =================================================
           VALIDATION
        ================================================= */

        if (!username) {

            showSettingsToast(
                "يرجى إدخال الاسم.",
                "تنبيه"
            );

            return;

        }


        if (!email) {

            showSettingsToast(
                "يرجى إدخال البريد الإلكتروني.",
                "تنبيه"
            );

            return;

        }


        if (button) {

            button.disabled =
                true;


            button.classList.add(
                "tf-settings-loading"
            );

        }


        try {

            const result =
                await settingsRequest(
                    "/user/settings",
                    {
                        method: "PATCH",

                        body:
                            JSON.stringify({
                                username,
                                email
                            })
                    }
                );


            const savedUser =
                result.user ||
                result;


            const savedUsername =
                savedUser.username ||
                username;


            const savedEmail =
                savedUser.email ||
                email;


            nameInput.value =
                savedUsername;


            emailInput.value =
                savedEmail;


            const displayName =
                $("#tfSettingsDisplayName");


            if (displayName) {

                displayName.textContent =
                    savedUsername;

            }


            const avatar =
                $("#tfSettingsAvatar");


            if (avatar) {

                avatar.textContent =
                    getInitials(
                        savedUsername
                    );

            }


            if (
                typeof window.updateNavbarUser ===
                "function"
            ) {

                window.updateNavbarUser(
                    savedUsername,
                    savedEmail
                );

            }


            showSettingsToast(
                result.message ||
                "تم حفظ بيانات الحساب.",
                "تم الحفظ"
            );


        } catch (error) {

            console.error(
                "❌ SAVE ACCOUNT ERROR:",
                error
            );


            showSettingsToast(
                error.message ||
                "تعذر حفظ بيانات الحساب.",
                "خطأ"
            );


        } finally {

            if (button) {

                button.disabled =
                    false;


                button.classList.remove(
                    "tf-settings-loading"
                );

            }

        }

    }


    /* =====================================================
       CHANGE PASSWORD
    ===================================================== */

    async function changePassword() {

        const currentInput =
            $("#tfCurrentPassword");

        const newInput =
            $("#tfNewPassword");

        const confirmInput =
            $("#tfConfirmPassword");

        const button =
            $("#tfChangePasswordBtn");


        const currentPassword =
            currentInput?.value || "";


        const newPassword =
            newInput?.value || "";


        const confirmPassword =
            confirmInput?.value || "";


        /* =================================================
           VALIDATION
        ================================================= */

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {

            showSettingsToast(
                "يرجى تعبئة جميع حقول كلمة المرور.",
                "تنبيه"
            );

            return;

        }


        if (
            newPassword.length < 6
        ) {

            showSettingsToast(
                "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.",
                "تنبيه"
            );

            return;

        }


        if (
            newPassword !==
            confirmPassword
        ) {

            showSettingsToast(
                "كلمتا المرور غير متطابقتين.",
                "تنبيه"
            );

            return;

        }


        if (button) {

            button.disabled =
                true;


            button.classList.add(
                "tf-settings-loading"
            );

        }


        try {

            const result =
                await settingsRequest(
                    "/user/password",
                    {
                        method: "PATCH",

                        body:
                            JSON.stringify({
                                currentPassword,
                                newPassword
                            })
                    }
                );


            /* =================================================
               CLEAR PASSWORD FIELDS
            ================================================= */

            if (currentInput) {

                currentInput.value =
                    "";

            }


            if (newInput) {

                newInput.value =
                    "";

            }


            if (confirmInput) {

                confirmInput.value =
                    "";

            }


            showSettingsToast(
                result.message ||
                "تم تغيير كلمة المرور بنجاح.",
                "تم التحديث"
            );


        } catch (error) {

            console.error(
                "❌ CHANGE PASSWORD ERROR:",
                error
            );


            showSettingsToast(
                error.message ||
                "تعذر تغيير كلمة المرور.",
                "خطأ"
            );


        } finally {

            if (button) {

                button.disabled =
                    false;


                button.classList.remove(
                    "tf-settings-loading"
                );

            }

        }

    }


    /* =====================================================
       PASSWORD TOGGLES
    ===================================================== */

    function initPasswordToggles() {

        const page =
            getSettingsPage();


        if (!page) {

            return;

        }


        const buttons =
            $$(".tf-password-toggle", page);


        buttons.forEach(
            (button) => {

                /*
                 * منع تكرار Listener
                 */

                if (
                    button.dataset.passwordReady ===
                    "true"
                ) {

                    return;

                }


                button.dataset.passwordReady =
                    "true";


                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        const targetId =
                            this.dataset.passwordTarget;


                        if (!targetId) {

                            return;

                        }


                        const input =
                            document.getElementById(
                                targetId
                            );


                        if (!input) {

                            console.warn(
                                "⚠️ Password input غير موجود:",
                                targetId
                            );

                            return;

                        }


                        const icon =
                            this.querySelector("i");


                        if (
                            input.type ===
                            "password"
                        ) {

                            input.type =
                                "text";


                            if (icon) {

                                icon.className =
                                    "fa-solid fa-eye-slash";

                            }

                        } else {

                            input.type =
                                "password";


                            if (icon) {

                                icon.className =
                                    "fa-solid fa-eye";

                            }

                        }

                    }
                );

            }
        );

    }


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    function initNotifications() {

        const email =
            $("#tfEmailNotifications");

        const tasks =
            $("#tfTaskNotifications");

        const mentions =
            $("#tfMentionNotifications");

        const saveButton =
            $("#tfSaveNotificationsBtn");


        if (
            !email &&
            !tasks &&
            !mentions
        ) {

            return;

        }


        let saved =
            null;


        try {

            saved =
                JSON.parse(
                    localStorage.getItem(
                        "trillflow_notification_settings"
                    ) || "null"
                );

        } catch {

            saved =
                null;

        }


        /* =================================================
           LOAD SAVED SETTINGS
        ================================================= */

        if (saved) {

            if (email) {

                email.checked =
                    saved.email !== false;

            }


            if (tasks) {

                tasks.checked =
                    saved.tasks !== false;

            }


            if (mentions) {

                mentions.checked =
                    saved.mentions !== false;

            }

        }


        /* =================================================
           SAVE
        ================================================= */

        if (
            saveButton &&
            saveButton.dataset.notificationsReady !==
            "true"
        ) {

            saveButton.dataset.notificationsReady =
                "true";


            saveButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const settings = {

                        email:
                            email?.checked ??
                            true,

                        tasks:
                            tasks?.checked ??
                            true,

                        mentions:
                            mentions?.checked ??
                            true

                    };


                    localStorage.setItem(
                        "trillflow_notification_settings",
                        JSON.stringify(
                            settings
                        )
                    );


                    showSettingsToast(
                        "تم حفظ إعدادات الإشعارات.",
                        "تم الحفظ"
                    );

                }
            );

        }

    }


    /* =====================================================
       APPEARANCE
    ===================================================== */

    function initAppearance() {

        const darkMode =
            $("#tfDarkMode");

        const compactMode =
            $("#tfCompactMode");


        const savedDark =
            localStorage.getItem(
                "trillflow_dark_mode"
            );


        const savedCompact =
            localStorage.getItem(
                "trillflow_compact_mode"
            );


        /* =================================================
           LOAD DARK MODE
        ================================================= */

        if (darkMode) {

            darkMode.checked =
                savedDark !== "false";

        }


        /* =================================================
           LOAD COMPACT MODE
        ================================================= */

        if (compactMode) {

            compactMode.checked =
                savedCompact === "true";

        }


        /* =================================================
           APPLY CURRENT STATE
        ================================================= */

        applyAppearance();


        /* =================================================
           DARK MODE
        ================================================= */

        if (
            darkMode &&
            darkMode.dataset.appearanceReady !==
            "true"
        ) {

            darkMode.dataset.appearanceReady =
                "true";


            darkMode.addEventListener(
                "change",
                function () {

                    localStorage.setItem(
                        "trillflow_dark_mode",
                        String(
                            this.checked
                        )
                    );


                    applyAppearance();

                }
            );

        }


        /* =================================================
           COMPACT MODE
        ================================================= */

        if (
            compactMode &&
            compactMode.dataset.appearanceReady !==
            "true"
        ) {

            compactMode.dataset.appearanceReady =
                "true";


            compactMode.addEventListener(
                "change",
                function () {

                    localStorage.setItem(
                        "trillflow_compact_mode",
                        String(
                            this.checked
                        )
                    );


                    applyAppearance();

                }
            );

        }

    }


    /* =====================================================
       APPLY APPEARANCE
    ===================================================== */

    function applyAppearance() {

        const darkMode =
            $("#tfDarkMode");

        const compactMode =
            $("#tfCompactMode");


        if (darkMode) {

            document.body.classList.toggle(
                "light-mode",
                !darkMode.checked
            );

        }


        if (compactMode) {

            document.body.classList.toggle(
                "trillflow-compact-mode",
                compactMode.checked === true
            );

        }

    }


    /* =====================================================
       BUTTONS
    ===================================================== */

    function initButtons() {

        /* =================================================
           SAVE ACCOUNT
        ================================================= */

        const saveAccountButton =
            $("#tfSaveAccountBtn");


        if (
            saveAccountButton &&
            saveAccountButton.dataset.settingsButtonReady !==
            "true"
        ) {

            saveAccountButton.dataset.settingsButtonReady =
                "true";


            saveAccountButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    saveAccount();

                }
            );

        }


        /* =================================================
           CHANGE PASSWORD
        ================================================= */

        const changePasswordButton =
            $("#tfChangePasswordBtn");


        if (
            changePasswordButton &&
            changePasswordButton.dataset.settingsButtonReady !==
            "true"
        ) {

            changePasswordButton.dataset.settingsButtonReady =
                "true";


            changePasswordButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    changePassword();

                }
            );

        }

    }


    /* =====================================================
       MAIN INIT
    ===================================================== */

    function initSettings() {

        const page =
            getSettingsPage();


        if (!page) {

            console.warn(
                "⚠️ TrillFlow Settings: settingsPage غير موجود"
            );

            return;

        }




        initSettingsTabs();

        initPasswordToggles();

        initNotifications();

        initAppearance();

        initButtons();


        /*
         * إذا كان تبويب الحساب مفتوحًا بالفعل
         * نحمل بيانات المستخدم.
         */

        const activeButton =
            $(".tf-settings-nav.active", page);


        if (activeButton) {

            const tab =
                activeButton.dataset.settingsTab;


            if (
                tab === "account"
            ) {

                loadSettingsUser();

            }

        }

    }


    /* =====================================================
       OPEN SETTINGS
       هذه الدالة مهمة جدًا للـ NAV الرئيسي
    ===================================================== */

    function openSettings() {

        const page =
            getSettingsPage();


        if (!page) {

            console.error(
                "❌ settingsPage غير موجود في الصفحة"
            );

            return false;

        }




        /* =================================================
           SHOW PAGE
        ================================================= */

        page.hidden =
            false;


        page.style.display =
            "";


        page.classList.add(
            "active"
        );


        /* =================================================
           INITIALIZE
        ================================================= */

        initSettings();


        return true;

    }


    /* =====================================================
       CLOSE SETTINGS
    ===================================================== */

    function closeSettings() {

        const page =
            getSettingsPage();


        if (!page) {

            return false;

        }


        page.classList.remove(
            "active"
        );


        return true;

    }


    /* =====================================================
       GLOBAL API
    ===================================================== */

    window.TrillFlowSettings = {

        init:
            initSettings,

        open:
            openSettings,

        close:
            closeSettings,

        loadUser:
            loadSettingsUser,

        setTab:
            setSettingsTab,

        saveAccount:
            saveAccount,

        changePassword:
            changePassword,

        applyAppearance:
            applyAppearance

    };


    /* =====================================================
       BACKWARD COMPATIBILITY
    ===================================================== */

    window.initSettingsTabs =
        initSettingsTabs;


    window.setSettingsTab =
        setSettingsTab;


    window.openSettings =
        openSettings;


    /* =====================================================
       START
    ===================================================== */

    function start() {

        initSettings();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            {
                once: true
            }
        );

    } else {

        start();

    }


})();