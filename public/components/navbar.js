// =====================================================
// TRILL FLOW — NAVBAR
// NAVBAR + NOTIFICATIONS + PROFILE + AI
// =====================================================


// =====================================================
// NAVBAR HTML
// =====================================================

function Navbar() {

    return `

    <header class="topbar">

        <!-- ================================================= -->
        <!-- SEARCH -->
        <!-- ================================================= -->

        <div
            class="search"
            id="search"
        >

            <i data-lucide="search"></i>

            <input
                type="search"
                id="searchInput"
                placeholder="ابحث في المهام والأشخاص والملفات…"
                aria-label="البحث في مساحة العمل"
                autocomplete="off"
            />

            <kbd>⌘K</kbd>

        </div>


        <!-- ================================================= -->
        <!-- TOPBAR ACTIONS -->
        <!-- ================================================= -->

        <div class="topbar__actions">


            <!-- ================================================= -->
            <!-- AI BUTTON -->
            <!-- ================================================= -->

            <button
                class="icon-btn"
                id="aiNavbarBtn"
                type="button"
                data-tip="المساعد"
                aria-label="المساعد"
                aria-expanded="false"
            >

                <i data-lucide="asterisk"></i>

            </button>


            <!-- ================================================= -->
            <!-- NOTIFICATIONS -->
            <!-- ================================================= -->

            <div
                class="notification-wrap"
                id="notificationWrap"
            >

                <button
                    class="icon-btn notification-btn"
                    id="notificationBtn"
                    type="button"
                    data-tip="الإشعارات"
                    aria-label="الإشعارات"
                    aria-expanded="false"
                >

                    <i data-lucide="bell"></i>

                    <span
                        class="notification-badge"
                        id="notificationBadge"
                        hidden
                    >
                        0
                    </span>

                </button>


                <div
                    class="notification-menu glass"
                    id="notificationMenu"
                    hidden
                >

                    <div class="notification-header">

                        <div>

                            <span class="notification-eyebrow">
                                TRILL FLOW
                            </span>

                            <h3>
                                الإشعارات
                            </h3>

                        </div>

                        <button
                            class="notification-read-all"
                            id="markNotificationsRead"
                            type="button"
                        >
                            تحديد الكل كمقروء
                        </button>

                    </div>


                    <div
                        class="notification-list"
                        id="notificationList"
                    >

                        <div class="notification-loading">
                            جاري تحميل الإشعارات...
                        </div>

                    </div>


                    <div class="notification-footer">

                        <button
                            id="viewAllNotifications"
                            type="button"
                        >

                            <span>
                                عرض جميع الإشعارات
                            </span>

                            <i data-lucide="arrow-left"></i>

                        </button>

                    </div>

                </div>

            </div>


            <!-- ================================================= -->
            <!-- PROFILE -->
            <!-- ================================================= -->

            <div
                class="menu-wrap"
                id="profileWrap"
            >

                <button
                    class="avatar-btn"
                    id="profileBtn"
                    data-tip="الحساب"
                    type="button"
                    aria-expanded="false"
                >

                    <span
                        class="avatar avatar--md"
                        id="navProfileAvatar"
                        style="--a:152; --b:190"
                    >
                        م
                    </span>

                    <span class="nav-profile-name" id="navProfileName">
                        مستخدم
                    </span>

                    <i data-lucide="chevron-down" class="nav-profile-arrow"></i>

                </button>


                <div
                    class="dropdown glass"
                    id="profileMenu"
                    hidden
                >

                    <div class="dropdown__user-info">
                        <span class="dropdown__user-name" id="dropdownUserName">مستخدم</span>
                        <span class="dropdown__user-email" id="dropdownUserEmail">user@example.com</span>
                    </div>

                    <div class="dropdown__sep"></div>

                    <button
                        class="dropdown__item"
                        id="navProfileItemProfile"
                        type="button"
                    >

                        <i data-lucide="user"></i>

                        <span>
                            الملف الشخصي
                        </span>

                    </button>


                    <button
                        class="dropdown__item"
                        id="navProfileItemSettings"
                        type="button"
                    >

                        <i data-lucide="settings"></i>

                        <span>
                            الإعدادات
                        </span>

                    </button>


                    <button
                        class="dropdown__item"
                        id="navProfileItemActivity"
                        type="button"
                    >

                        <i data-lucide="activity"></i>

                        <span>
                            لوحة التحكم
                        </span>

                    </button>


                    <div class="dropdown__sep"></div>

                    <button
                        class="dropdown__item dropdown__item--danger"
                        id="navProfileItemLogout"
                        type="button"
                    >

                        <i data-lucide="log-out"></i>

                        <span>
                            تسجيل الخروج
                        </span>

                    </button>

                </div>

            </div>


        </div>

    </header>

    `;

}


// =====================================================
// RENDER NAVBAR
// =====================================================

function renderNavbar() {

    const container =
        document.getElementById(
            "navbar-container"
        );


    if (!container) {

        console.error(
            "❌ navbar-container غير موجود"
        );

        return;

    }


    container.innerHTML =
        Navbar();


    initializeNavbar();

}


// =====================================================
// INITIALIZE NAVBAR
// =====================================================

function initializeNavbar() {


    // =================================================
    // LUCIDE
    // =================================================

    if (
        typeof lucide !== "undefined"
    ) {

        lucide.createIcons();

    }


    // =================================================
    // NOTIFICATIONS
    // =================================================

    initializeNotifications();


    // =================================================
    // PROFILE
    // =================================================

    initializeProfile();


    // =================================================
    // AI
    // =================================================

    initializeAIButton();

}


// =====================================================
// AI BUTTON
// =====================================================

function initializeAIButton() {

    const button =
        document.getElementById(
            "aiNavbarBtn"
        );


    if (!button) {

        console.error(
            "❌ aiNavbarBtn غير موجود"
        );

        return;

    }


    // منع إضافة Event Listener أكثر من مرة

    if (
        button.dataset.aiInitialized === "true"
    ) {

        return;

    }


    button.dataset.aiInitialized = "true";


    button.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();


            console.log(
                "🤖 Trill AI Button clicked"
            );


            openTrillAI();

        }
    );

}


// =====================================================
// OPEN TRILL AI
// =====================================================

function openTrillAI() {

    console.log(
        "🔎 البحث عن Trill AI..."
    );


    // =================================================
    // 1 — الدالة الأصلية لو موجودة
    // =================================================

    if (
        typeof openAI === "function"
    ) {

        console.log(
            "✅ فتح AI بواسطة openAI()"
        );

        openAI();

        return;

    }


    if (
        typeof openAIModal === "function"
    ) {

        console.log(
            "✅ فتح AI بواسطة openAIModal()"
        );

        openAIModal();

        return;

    }


    if (
        typeof openAIChat === "function"
    ) {

        console.log(
            "✅ فتح AI بواسطة openAIChat()"
        );

        openAIChat();

        return;

    }


    if (
        typeof toggleAI === "function"
    ) {

        console.log(
            "✅ فتح AI بواسطة toggleAI()"
        );

        toggleAI();

        return;

    }


    // =================================================
    // 2 — البحث عن Trill AI الحقيقي
    // =================================================

    const aiElement =
        document.querySelector(
            ".aitrill-container, " +
            "#aitrill-container, " +
            "#aiModal, " +
            "#aiChatModal, " +
            "#AIChatModal, " +
            "#aiPanel, " +
            "#aiChat, " +
            "#AIPage, " +
            "#aiPage, " +
            ".ai-modal, " +
            ".ai-panel"
        );


    if (!aiElement) {

        console.error(
            "❌ لم يتم العثور على .aitrill-container"
        );

        console.log(
            "العناصر الموجودة:",
            document.querySelectorAll(
                ".aitrill-container"
            ).length
        );

        return;

    }


    console.log(
        "✅ تم العثور على Trill AI:",
        aiElement
    );


    // =================================================
    // 3 — إزالة hidden
    // =================================================

    aiElement.hidden = false;


    // =================================================
    // 4 — إضافة حالات الفتح
    // =================================================

    aiElement.classList.add(
        "is-open"
    );

    aiElement.classList.add(
        "open"
    );

    aiElement.classList.add(
        "active"
    );


    // =================================================
    // 5 — منع display:none
    // =================================================

    aiElement.style.display =
        "flex";


    // =================================================
    // 6 — ARIA
    // =================================================

    const button =
        document.getElementById(
            "aiNavbarBtn"
        );


    if (button) {

        button.setAttribute(
            "aria-expanded",
            "true"
        );

        button.classList.add(
            "is-active"
        );

    }


    // =================================================
    // 7 — Lucide
    // =================================================

    if (
        typeof lucide !== "undefined"
    ) {

        lucide.createIcons();

    }

}


// =====================================================
// CLOSE TRILL AI
// =====================================================

function closeTrillAI() {

    const aiElement =
        document.querySelector(
            ".aitrill-container, " +
            "#aitrill-container, " +
            "#aiModal, " +
            "#aiChatModal, " +
            "#AIChatModal, " +
            "#aiPanel, " +
            "#aiChat, " +
            "#AIPage, " +
            "#aiPage, " +
            ".ai-modal, " +
            ".ai-panel"
        );


    if (!aiElement) {

        return;

    }


    aiElement.classList.remove(
        "is-open"
    );

    aiElement.classList.remove(
        "open"
    );

    aiElement.classList.remove(
        "active"
    );


    aiElement.hidden = true;


    aiElement.style.display =
        "";


    const button =
        document.getElementById(
            "aiNavbarBtn"
        );


    if (button) {

        button.setAttribute(
            "aria-expanded",
            "false"
        );

        button.classList.remove(
            "is-active"
        );

    }

}


// =====================================================
// AI CLOSE BUTTON
// =====================================================

function initializeAICloseButton() {

    const closeButton =
        document.querySelector(
            ".aitrill-container .aitrill-container-closebtn"
        );


    if (!closeButton) {

        return;

    }


    if (
        closeButton.dataset.aiCloseInitialized === "true"
    ) {

        return;

    }


    closeButton.dataset.aiCloseInitialized =
        "true";


    closeButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();

            closeTrillAI();

        }
    );

}


// =====================================================
// NOTIFICATIONS
// =====================================================

function initializeNotifications() {

    const button =
        document.getElementById(
            "notificationBtn"
        );

    const menu =
        document.getElementById(
            "notificationMenu"
        );

    const wrapper =
        document.getElementById(
            "notificationWrap"
        );


    if (
        !button ||
        !menu ||
        !wrapper
    ) {

        console.error(
            "❌ Notification elements not found"
        );

        return;

    }


    button.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();


            if (
                menu.hidden
            ) {

                openNotificationMenu();

            } else {

                closeNotificationMenu();

            }

        }
    );


    menu.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

        }
    );


    document.addEventListener(
        "click",
        function (event) {

            if (
                !wrapper.contains(
                    event.target
                )
            ) {

                closeNotificationMenu();

            }

        }
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeNotificationMenu();

            }

        }
    );


    const readAll =
        document.getElementById(
            "markNotificationsRead"
        );


    if (readAll) {

        readAll.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                markAllNotificationsRead();

            }
        );

    }


    const viewAll =
        document.getElementById(
            "viewAllNotifications"
        );


    if (viewAll) {

        viewAll.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                console.log(
                    "فتح جميع الإشعارات"
                );

            }
        );

    }


    loadNotifications();

}


// =====================================================
// OPEN NOTIFICATION MENU
// =====================================================

function openNotificationMenu() {

    const button =
        document.getElementById(
            "notificationBtn"
        );

    const menu =
        document.getElementById(
            "notificationMenu"
        );


    if (
        !button ||
        !menu
    ) {

        return;

    }


    menu.hidden = false;


    button.setAttribute(
        "aria-expanded",
        "true"
    );


    button.classList.add(
        "is-active"
    );


    loadNotifications();

}


// =====================================================
// CLOSE NOTIFICATION MENU
// =====================================================

function closeNotificationMenu() {

    const button =
        document.getElementById(
            "notificationBtn"
        );

    const menu =
        document.getElementById(
            "notificationMenu"
        );


    if (
        !button ||
        !menu
    ) {

        return;

    }


    menu.hidden = true;


    button.setAttribute(
        "aria-expanded",
        "false"
    );


    button.classList.remove(
        "is-active"
    );

}


// =====================================================
// LOAD NOTIFICATIONS
// =====================================================

async function loadNotifications() {

    const list =
        document.getElementById(
            "notificationList"
        );


    if (!list) {

        return;

    }


    try {

        const response =
            await fetch(
                "/notifications",
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        const notifications =
            Array.isArray(
                result.notifications
            )
                ? result.notifications
                : [];


        const unreadCount =
            Number(
                result.unreadCount || 0
            );


        updateNotificationBadge(
            unreadCount
        );


        renderNotifications(
            notifications
        );


    } catch (error) {

        console.error(
            "❌ Notifications error:",
            error
        );


        list.innerHTML = `

            <div class="notification-empty">

                <div class="notification-empty-icon">

                    <i data-lucide="bell-off"></i>

                </div>

                <strong>
                    لا يمكن تحميل الإشعارات
                </strong>

                <span>
                    تأكد من اتصال الخادم.
                </span>

            </div>

        `;


        if (
            typeof lucide !== "undefined"
        ) {

            lucide.createIcons();

        }

    }

}


// =====================================================
// RENDER NOTIFICATIONS
// =====================================================

function renderNotifications(
    notifications
) {

    const list =
        document.getElementById(
            "notificationList"
        );


    if (!list) {

        return;

    }


    if (
        notifications.length === 0
    ) {

        list.innerHTML = `

            <div class="notification-empty">

                <div class="notification-empty-icon">

                    <i data-lucide="bell-off"></i>

                </div>

                <strong>
                    لا توجد إشعارات
                </strong>

                <span>
                    سنخبرك عندما يحدث شيء جديد.
                </span>

            </div>

        `;


        if (
            typeof lucide !== "undefined"
        ) {

            lucide.createIcons();

        }


        return;

    }


    list.innerHTML =
        notifications
            .map(
                notification =>
                    createNotification(
                        notification
                    )
            )
            .join("");


    if (
        typeof lucide !== "undefined"
    ) {

        lucide.createIcons();

    }


    list
        .querySelectorAll(
            ".notification-item"
        )
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    function () {

                        const id =
                            this.dataset.id;

                        const link =
                            this.dataset.link;


                        markNotificationRead(
                            id
                        );


                        if (
                            link &&
                            link !== "null" &&
                            link !== "undefined"
                        ) {

                            // ================================================
                            // فتح Task من الإشعار داخل واجهة TrillFlow
                            // ================================================

                            const taskMatch =
                                link.match(/^\/tasks\/(\d+)$/);

                            if (taskMatch) {

                                const taskId =
                                    taskMatch[1];

                                if (
                                    typeof window.openTaskFromNotification ===
                                    "function"
                                ) {

                                    window.openTaskFromNotification(
                                        taskId
                                    );

                                } else {

                                    console.error(
                                        "❌ openTaskFromNotification غير موجود"
                                    );

                                }

                                return;

                            }

                            window.location.href =
                                link;

                        }
                    }
                );

            }
        );

}


// =====================================================
// CREATE NOTIFICATION
// =====================================================

function createNotification(
    notification
) {

    const id =
        notification.id || "";

    const type =
        notification.type ||
        "default";

    const title =
        notification.title ||
        "إشعار جديد";

    const message =
        notification.message ||
        "";

    const isRead =
        Boolean(
            notification.is_read
        );

    const link =
        notification.link ||
        "";


    return `

        <button
            class="
                notification-item
                ${!isRead ? "is-unread" : ""}
            "
            type="button"
            data-id="${escapeNotification(id)}"
            data-link="${escapeNotification(link)}"
        >

            <div
                class="
                    notification-icon
                    notification-icon--${escapeNotification(type)}
                "
            >

                <i
                    data-lucide="${getNotificationIcon(type)}"
                ></i>

            </div>


            <div
                class="notification-content"
            >

                <div
                    class="notification-title"
                >
                    ${escapeNotification(title)}
                </div>


                <div
                    class="notification-message"
                >
                    ${escapeNotification(message)}
                </div>


                <div
                    class="notification-time"
                >
                    ${formatNotificationTime(
        notification.created_at
    )}
                </div>

            </div>


            ${!isRead
            ? `
                        <span
                            class="notification-unread-dot"
                        ></span>
                    `
            : ""
        }

        </button>

    `;

}


// =====================================================
// NOTIFICATION ICON
// =====================================================

function getNotificationIcon(
    type
) {

    switch (
    String(type).toUpperCase()
    ) {

        case "TASK_ASSIGNED":
            return "clipboard-check";

        case "TASK_DUE_DATE_CHANGED":
            return "calendar-clock";

        case "TASK_OVERDUE":
            return "triangle-alert";

        case "PROJECT_MEMBER_ADDED":
            return "user-plus";

        case "TASK_CREATED":
            return "square-check-big";

        case "USER_ROLE_CHANGED":
            return "shield-check";

        case "COMMENT":
            return "message-circle";

        case "MENTION":
            return "at-sign";

        case "SUCCESS":
            return "circle-check";

        case "ERROR":
            return "circle-x";

        default:
            return "bell";

    }

}


// =====================================================
// UPDATE BADGE
// =====================================================

function updateNotificationBadge(
    count
) {

    const badge =
        document.getElementById(
            "notificationBadge"
        );


    if (!badge) {

        return;

    }


    count =
        Number(
            count || 0
        );


    if (
        count <= 0
    ) {

        badge.hidden = true;

        badge.textContent = "0";

        return;

    }


    badge.hidden = false;

    badge.textContent =
        count > 99
            ? "99+"
            : String(count);

}


// =====================================================
// MARK ONE NOTIFICATION AS READ
// =====================================================

async function markNotificationRead(
    id
) {

    if (!id) {

        return;

    }


    try {

        const response =
            await fetch(
                `/notifications/${encodeURIComponent(id)}/read`,
                {
                    method: "PATCH",
                    credentials: "include"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        loadNotifications();


    } catch (error) {

        console.error(
            "❌ Mark notification read error:",
            error
        );

    }

}


// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

async function markAllNotificationsRead() {

    try {

        const response =
            await fetch(
                "/notifications/read-all",
                {
                    method: "PATCH",
                    credentials: "include"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        loadNotifications();


    } catch (error) {

        console.error(
            "❌ Mark all notifications error:",
            error
        );

    }

}


// =====================================================
// FORMAT NOTIFICATION TIME
// =====================================================

function formatNotificationTime(
    date
) {

    if (!date) {

        return "";

    }


    const notificationDate =
        new Date(date);


    if (
        Number.isNaN(
            notificationDate.getTime()
        )
    ) {

        return "";

    }


    const now =
        new Date();


    const difference =
        now.getTime() -
        notificationDate.getTime();


    const seconds =
        Math.floor(
            difference / 1000
        );


    if (
        seconds < 60
    ) {

        return "الآن";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (
        minutes < 60
    ) {

        return `منذ ${minutes} دقيقة`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (
        hours < 24
    ) {

        return `منذ ${hours} ساعة`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (
        days < 7
    ) {

        return `منذ ${days} يوم`;

    }


    return notificationDate.toLocaleDateString(
        "ar-SA",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeNotification(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// LOAD NAVBAR USER PROFILE
// =====================================================

async function loadNavbarUserProfile() {

    try {

        const response =
            await fetch(
                "/user",
                {
                    method: "GET",
                    credentials: "include"
                }
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        const user =
            data.user || data;

        const username =
            user.username || user.name || "مستخدم";

        const email =
            user.email || "";

        updateNavbarUser(
            username,
            email
        );

    } catch (error) {

        console.error(
            "❌ Load navbar user profile error:",
            error
        );

    }

}


// =====================================================
// UPDATE NAVBAR USER DOM
// =====================================================

function updateNavbarUser(username, email) {

    const cleanName =
        (username || "مستخدم").trim();

    const initial =
        cleanName.charAt(0).toUpperCase() || "م";

    const navAvatar =
        document.getElementById("navProfileAvatar");

    if (navAvatar) {
        navAvatar.textContent = initial;
    }

    const navName =
        document.getElementById("navProfileName");

    if (navName) {
        navName.textContent = cleanName;
    }

    const dropdownName =
        document.getElementById("dropdownUserName");

    if (dropdownName) {
        dropdownName.textContent = cleanName;
    }

    const dropdownEmail =
        document.getElementById("dropdownUserEmail");

    if (dropdownEmail) {
        dropdownEmail.textContent = email || "مستخدم TrillFlow";
    }

}

// إتاحة الدالة لباقي أجزاء التطبيق
window.updateNavbarUser = updateNavbarUser;
window.loadNavbarUserProfile = loadNavbarUserProfile;


// =====================================================
// PROFILE MENU & ACTIONS
// =====================================================

function initializeProfile() {

    const button =
        document.getElementById(
            "profileBtn"
        );

    const menu =
        document.getElementById(
            "profileMenu"
        );

    const wrapper =
        document.getElementById(
            "profileWrap"
        );

    const itemProfile =
        document.getElementById(
            "navProfileItemProfile"
        );

    const itemSettings =
        document.getElementById(
            "navProfileItemSettings"
        );

    const itemActivity =
        document.getElementById(
            "navProfileItemActivity"
        );

    const itemLogout =
        document.getElementById(
            "navProfileItemLogout"
        );


    if (
        !button ||
        !menu ||
        !wrapper
    ) {

        return;

    }


    // =================================================
    // TOGGLE MENU
    // =================================================

    button.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();

            if (menu.hidden) {

                menu.hidden = false;

                button.setAttribute(
                    "aria-expanded",
                    "true"
                );

            } else {

                menu.hidden = true;

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    menu.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

        }
    );


    document.addEventListener(
        "click",
        function (event) {

            if (
                !wrapper.contains(
                    event.target
                )
            ) {

                menu.hidden = true;

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    // =================================================
    // NAVIGATION: الملف الشخصي
    // =================================================

    if (itemProfile) {

        itemProfile.addEventListener(
            "click",
            function () {

                menu.hidden = true;

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );

                if (typeof window.openPage === "function") {
                    window.openPage("settingsPage");
                }

                if (typeof window.setSettingsTab === "function") {
                    window.setSettingsTab("account");
                } else if (window.TrillFlowSettings && typeof window.TrillFlowSettings.setTab === "function") {
                    window.TrillFlowSettings.setTab("account");
                }

            }
        );

    }


    // =================================================
    // NAVIGATION: الإعدادات
    // =================================================

    if (itemSettings) {

        itemSettings.addEventListener(
            "click",
            function () {

                menu.hidden = true;

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );

                if (typeof window.openPage === "function") {
                    window.openPage("settingsPage");
                }

                if (typeof window.setSettingsTab === "function") {
                    window.setSettingsTab("account");
                } else if (window.TrillFlowSettings && typeof window.TrillFlowSettings.setTab === "function") {
                    window.TrillFlowSettings.setTab("account");
                }

            }
        );

    }


    // =================================================
    // NAVIGATION: لوحة التحكم / النشاط
    // =================================================

    if (itemActivity) {

        itemActivity.addEventListener(
            "click",
            function () {

                menu.hidden = true;

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );

                if (typeof window.openPage === "function") {
                    window.openPage("dashboard");
                }

            }
        );

    }


    // =================================================
    // LOGOUT
    // =================================================

    if (itemLogout) {

        itemLogout.addEventListener(
            "click",
            async function () {

                menu.hidden = true;

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );

                try {

                    await fetch(
                        "/logout",
                        {
                            method: "POST",
                            credentials: "include"
                        }
                    );

                    localStorage.removeItem("currentPage");

                    window.location.href = "/";

                } catch (error) {

                    console.error("Logout error:", error);

                    window.location.href = "/";

                }

            }
        );

    }


    // =================================================
    // LOAD USER PROFILE DATA
    // =================================================

    loadNavbarUserProfile();

}


// =====================================================
// START NAVBAR
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderNavbar();

        // ننتظر حتى يتم رسم الـ Navbar
        // ثم نربط زر إغلاق Trill AI

        setTimeout(
            function () {

                initializeAICloseButton();

            },
            0
        );

    }
);