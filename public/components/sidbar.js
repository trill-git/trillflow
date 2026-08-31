function Sidebar() {
    return `
    <aside class="sidebar " id="sidebar" aria-label="التنقل الرئيسي">

        <div class="sidebar__head">
            <a class="brand" href="#">
                <span class="brand__word">trillFLOW</span>
            </a>
        </div>

        <nav class="nav">
            <ul class="nav__list">

                <li class="nav__item">
                    <button class="nav__link active" data-page="dashboard">
                        <i data-lucide="layout-dashboard"></i>
                        <span class="nav__label">الرئيسية</span>
                    </button>
                </li>

                <li class="nav__item">
                    <button class="nav__link" data-page="projectsPage">
                        <i data-lucide="layers"></i>
                        <span class="nav__label">المشاريع</span>
                    </button>
                </li>

                <li class="nav__item">
                    <button class="nav__link" data-page="projectDetailsPage">
                        <i data-lucide="list-todo"></i>
                        <span class="nav__label">لوحة المهام</span>
                    </button>
                </li>

                <li class="nav__item">
                    <button class="nav__link" data-page="calendarPage">
                        <i data-lucide="calendar"></i>
                        <span class="nav__label">التقويم</span>
                    </button>
                </li>
                
                <li class="nav__item">
                    <button class="nav__link" data-page="ChannelsPage">
                        <i data-lucide="message-circle"></i>
                        <span class="nav__label">القنوات</span>
                    </button>
                </li>
                
                <li class="nav__item">
                    <button class="nav__link" data-page="myTasksSection">
                        <i data-lucide="user-check"></i>
                        <span class="nav__label">مهامي</span>
                    </button>
                </li>

                <li class="nav__item">
                    <button class="nav__link" data-page="teamPage">
                        <i data-lucide="users"></i>
                        <span class="nav__label">الأعضاء</span>
                    </button>
                </li>

                <li class="nav__item">
                    <button class="nav__link" data-page="settingsPage">
                        <i data-lucide="settings"></i>
                        <span class="nav__label">الإعدادات</span>
                    </button>
                </li>
                
                
                <li class="nav__item" id="logoutbutton">
                    <button class="nav__link" data-page="logout">
                        <i data-lucide="log-out"></i>
                        <span class="nav__label">خروج</span>
                    </button>
                </li>
            </ul>

        </nav>

    </aside>
    `;
}

// عرض السايدبار
document.getElementById("sidebar-container").innerHTML = Sidebar();

// رسم الأيقونات
lucide.createIcons();

// العناصر
const buttons = document.querySelectorAll(".nav__link");
const sections = document.querySelectorAll("section");

// الصفحة الحالية
const savedPage = localStorage.getItem("currentPage");
const currentPage = savedPage === "KanbanBoardPage"
    ? "projectDetailsPage"
    : (savedPage || "dashboard");


// =========================
// دالة التنقل بين الصفحات
// =========================
function openPage(pageId) {

    // The Kanban now lives inside the project workspace. Keep old saved links
    // and any remaining callers working during the UI transition.
    if (pageId === "KanbanBoardPage") {
        pageId = "projectDetailsPage";
    }

    // حفظ الصفحة
    localStorage.setItem("currentPage", pageId);

    // إخفاء جميع الأقسام
    sections.forEach(section => {
        section.hidden = true;
    });

    // إزالة active
    buttons.forEach(btn => {
        btn.classList.remove("active");
    });

    // إظهار القسم المطلوب
    const page = document.getElementById(pageId);

    if (page) {
        page.hidden = false;
    }

    // تفعيل زر السايدبار
    const activeButton = document.querySelector(`[data-page="${pageId}"]`);

    if (activeButton) {
        activeButton.classList.add("active");
    }
}

// اجعلها متاحة لجميع الملفات
window.openPage = openPage;


// فتح آخر صفحة عند تشغيل الموقع
openPage(currentPage);


// أحداث أزرار السايدبار
buttons.forEach(button => {

    button.addEventListener("click", () => {

        openPage(button.dataset.page);

    });

});
buttons.forEach(button => {

    button.addEventListener("click", async () => {

        // ==================================================
        // تسجيل الخروج
        // ==================================================

        if (button.dataset.page === "logout") {

            try {

                const response = await fetch(
                    "/logout",
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

                const data = await response.json();

                if (!response.ok) {

                    console.error(
                        "Logout error:",
                        data.message
                    );

                    return;
                }

                // حذف الصفحة المحفوظة
                localStorage.removeItem("currentPage");

                // الانتقال لصفحة تسجيل الدخول
                window.location.href = "/";

            } catch (error) {

                console.error(
                    "Logout ERROR:",
                    error
                );

            }

            return;
        }


        // ==================================================
        // الصفحات العادية
        // ==================================================

        openPage(button.dataset.page);

    });

});
