// =====================================================
// MY TASKS
// =====================================================


// =====================================================
// ELEMENTS
// =====================================================

const myTasksSection =
    document.getElementById("myTasksSection");

const myTasksList =
    document.getElementById("myTasksList");

const myTasksLoading =
    document.getElementById("myTasksLoading");

const myTasksEmpty =
    document.getElementById("myTasksEmpty");

const myTasksError =
    document.getElementById("myTasksError");

const myTasksErrorMessage =
    document.getElementById("myTasksErrorMessage");

const myTasksTotal =
    document.getElementById("myTasksTotal");

const myTasksActive =
    document.getElementById("myTasksActive");

const myTasksOverdue =
    document.getElementById("myTasksOverdue");

const myTasksCompleted =
    document.getElementById("myTasksCompleted");

const myTasksSearch =
    document.getElementById("myTasksSearch");

const myTasksStatusFilter =
    document.getElementById("myTasksStatusFilter");

const myTasksPriorityFilter =
    document.getElementById("myTasksPriorityFilter");

const refreshMyTasksBtn =
    document.getElementById("refreshMyTasksBtn");

const retryMyTasksBtn =
    document.getElementById("retryMyTasksBtn");

const myTasksBtn =
    document.getElementById("myTasksBtn");


// =====================================================
// DATA
// =====================================================

let myTasksData = [];


// =====================================================
// LOAD MY TASKS
// =====================================================

async function loadMyTasks() {

    showMyTasksLoading();

    try {

        const response =
            await fetch("/my-tasks", {

                method: "GET",

                credentials: "include",

                headers: {
                    "Accept": "application/json"
                }

            });




        const rawResponse =
            await response.text();



        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}: ${rawResponse}`
            );

        }


        const data =
            JSON.parse(rawResponse);




        // =================================================
        // TASKS
        // =================================================

        myTasksData =
            Array.isArray(data.tasks)
                ? data.tasks
                : [];


        // =================================================
        // UPDATE STATS
        // =================================================

        updateMyTasksStats();


        // =================================================
        // RENDER
        // =================================================

        renderMyTasks();


    } catch (error) {

        console.error(
            "LOAD MY TASKS ERROR:",
            error
        );


        showMyTasksError(
            error.message ||
            "تعذر تحميل المهام."
        );

    }

}


// =====================================================
// UPDATE STATS
// =====================================================

function updateMyTasksStats() {


    // =================================================
    // TOTAL
    // =================================================

    const total =
        myTasksData.length;


    // =================================================
    // COMPLETED
    // مكتمل + تم التسليم
    // =================================================

    const completed =
        myTasksData.filter(task => {

            const status =
                normalizeTaskStatus(
                    task.status
                );


            return (
                status === "completed" ||
                status === "delivered"
            );

        }).length;


    // =================================================
    // OVERDUE
    // =================================================

    const overdue =
        myTasksData.filter(task => {

            return isTaskOverdue(task);

        }).length;


    // =================================================
    // ACTIVE
    // قيد التنفيذ + قيد المراجعة
    // =================================================

    const active =
        myTasksData.filter(task => {

            const status =
                normalizeTaskStatus(
                    task.status
                );


            return (
                status === "in_progress" ||
                status === "in_review"
            );

        }).length;


    // =================================================
    // UPDATE DOM
    // =================================================

    if (myTasksTotal) {

        myTasksTotal.textContent =
            total;

    }


    if (myTasksActive) {

        myTasksActive.textContent =
            active;

    }


    if (myTasksOverdue) {

        myTasksOverdue.textContent =
            overdue;

    }


    if (myTasksCompleted) {

        myTasksCompleted.textContent =
            completed;

    }

}


// =====================================================
// CHECK TASK OVERDUE
// =====================================================
//
// المهمة تعتبر متأخرة من 4 أيام قبل موعد التسليم.
//
// مثال:
//
// موعد التسليم: 30 أغسطس
//
// 25 أغسطس = عادية
// 26 أغسطس = متأخرة
// 27 أغسطس = متأخرة
// 28 أغسطس = متأخرة
// 29 أغسطس = متأخرة
// 30 أغسطس = متأخرة
// بعد 30 أغسطس = متأخرة
//
// مكتمل / تم التسليم = ليست متأخرة
// بدون موعد = ليست متأخرة
// =====================================================

function isTaskOverdue(task) {


    // =================================================
    // STATUS
    // =================================================

    const status =
        normalizeTaskStatus(
            task.status
        );


    // =================================================
    // COMPLETED / DELIVERED
    // =================================================

    if (
        status === "completed" ||
        status === "delivered"
    ) {

        return false;

    }


    // =================================================
    // NO DUE DATE
    // =================================================

    if (!task.due_date) {

        return false;

    }


    // =================================================
    // DATE
    // =================================================

    const dueDate =
        new Date(
            task.due_date
        );


    if (
        Number.isNaN(
            dueDate.getTime()
        )
    ) {

        return false;

    }


    // =================================================
    // TODAY
    // =================================================

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    // =================================================
    // DUE DATE
    // =================================================

    const compareDate =
        new Date(
            dueDate
        );


    compareDate.setHours(
        0,
        0,
        0,
        0
    );


    // =================================================
    // OVERDUE START DATE
    // موعد التسليم - 4 أيام
    // =================================================

    const overdueStartDate =
        new Date(
            compareDate
        );


    overdueStartDate.setDate(
        overdueStartDate.getDate() - 4
    );


    // =================================================
    // RESULT
    // =================================================

    return (
        today >= overdueStartDate
    );

}


// =====================================================
// RENDER
// =====================================================

function renderMyTasks() {


    // =================================================
    // SEARCH
    // =================================================

    const search =
        String(
            myTasksSearch?.value || ""
        )
            .trim()
            .toLowerCase();


    // =================================================
    // STATUS FILTER
    // =================================================

    const status =
        myTasksStatusFilter?.value ||
        "all";


    // =================================================
    // PRIORITY FILTER
    // =================================================

    const priority =
        myTasksPriorityFilter?.value ||
        "all";


    // =================================================
    // FILTER
    // =================================================

    const filteredTasks =
        myTasksData.filter(task => {


            // =============================================
            // TITLE
            // =============================================

            const title =
                String(
                    task.title || ""
                )
                    .toLowerCase();


            // =============================================
            // DESCRIPTION
            // =============================================

            const description =
                String(
                    task.description || ""
                )
                    .toLowerCase();


            // =============================================
            // PROJECT
            // =============================================

            const projectTitle =
                getProjectTitle(
                    task
                );


            const project =
                String(
                    projectTitle || ""
                )
                    .toLowerCase();


            // =============================================
            // SEARCH
            // =============================================

            const matchesSearch =
                !search ||
                title.includes(search) ||
                description.includes(search) ||
                project.includes(search);


            if (!matchesSearch) {

                return false;

            }


            // =============================================
            // STATUS
            // =============================================

            if (
                status !== "all" &&
                normalizeTaskStatus(
                    task.status
                ) !== status
            ) {

                return false;

            }


            // =============================================
            // PRIORITY
            // =============================================

            if (
                priority !== "all" &&
                normalizePriority(
                    task.priority
                ) !== priority
            ) {

                return false;

            }


            return true;

        });


    // =================================================
    // EMPTY
    // =================================================

    if (
        filteredTasks.length === 0
    ) {

        myTasksList.style.display =
            "none";


        myTasksLoading.style.display =
            "none";


        myTasksError.style.display =
            "none";


        myTasksEmpty.style.display =
            "flex";


        const emptyTitle =
            myTasksEmpty.querySelector(
                "h3"
            );


        const emptyText =
            myTasksEmpty.querySelector(
                "p"
            );


        if (
            myTasksData.length > 0
        ) {

            emptyTitle.textContent =
                "لا توجد نتائج";


            emptyText.textContent =
                "لم نجد مهام تطابق الفلاتر الحالية.";

        } else {

            emptyTitle.textContent =
                "لا توجد مهام";


            emptyText.textContent =
                "لا توجد مهام مسندة إليك حالياً.";

        }


        refreshMyTasksIcons();

        return;

    }


    // =================================================
    // RENDER TASKS
    // =================================================

    myTasksList.innerHTML =
        filteredTasks
            .map(
                createMyTaskCard
            )
            .join("");


    // =================================================
    // UI
    // =================================================

    myTasksLoading.style.display =
        "none";


    myTasksError.style.display =
        "none";


    myTasksEmpty.style.display =
        "none";


    myTasksList.style.display =
        "flex";


    refreshMyTasksIcons();

}


// =====================================================
// GET PROJECT TITLE
// =====================================================

function getProjectTitle(task) {

    return (

        task.project?.title ||

        task.project?.ProjectTitle ||

        task.project_title ||

        task.ProjectTitle ||

        task.projectName ||

        task.project_name ||

        task.project?.name ||

        task.project?.projectTitle ||

        "بدون مشروع"

    );

}


// =====================================================
// CREATE TASK CARD
// =====================================================

function createMyTaskCard(task) {


    // =================================================
    // PRIORITY
    // =================================================

    const priority =
        normalizePriority(
            task.priority
        );


    // =================================================
    // STATUS
    // =================================================

    const status =
        normalizeTaskStatus(
            task.status
        );


    // =================================================
    // DATA
    // =================================================

    const priorityData =
        getPriorityData(
            priority
        );


    const statusData =
        getStatusData(
            status
        );


    const dateData =
        getTaskDateData(
            task.due_date,
            status
        );


    // =================================================
    // PROJECT
    // =================================================

    const projectTitle =
        escapeHtml(
            getProjectTitle(
                task
            )
        );


    // =================================================
    // TITLE
    // =================================================

    const title =
        escapeHtml(
            task.title ||
            "بدون عنوان"
        );


    // =================================================
    // DESCRIPTION
    // =================================================

    const description =
        escapeHtml(
            task.description ||
            ""
        );


    // =================================================
    // TASK ID
    // =================================================

    const taskId =
        escapeHtml(
            String(
                task.id
            )
        );


    // =================================================
    // CARD
    // =================================================

    return `

        <div
            class="my-task-card"
            data-task-id="${taskId}"
           onclick="openMyTask('${taskId}')"
        >


            <!-- ===================================== -->
            <!-- TITLE -->
            <!-- ===================================== -->

            <div class="my-task-main">

                <div class="my-task-title">

                    ${title}

                </div>


                ${description
            ? `

                            <div class="my-task-description">

                                ${description}

                            </div>

                          `
            : ""
        }

            </div>


            <!-- ===================================== -->
            <!-- PROJECT -->
            <!-- ===================================== -->

            <div class="my-task-project">

                <i data-lucide="folder"></i>

                <span>

                    ${projectTitle}

                </span>

            </div>


            <!-- ===================================== -->
            <!-- PRIORITY -->
            <!-- ===================================== -->

            <div>

                <span
                    class="
                        my-task-badge
                        ${priorityData.class}
                    "
                >

                    ${priorityData.label}

                </span>

            </div>


            <!-- ===================================== -->
            <!-- STATUS -->
            <!-- ===================================== -->

            <div>

                <span
                    class="
                        my-task-status
                        ${statusData.class}
                    "
                >

                    ${statusData.label}

                </span>

            </div>


            <!-- ===================================== -->
            <!-- DATE -->
            <!-- ===================================== -->

            <div
                class="
                    my-task-date
                    ${dateData.class}
                "
            >

                <i
                    data-lucide="${dateData.icon}"
                ></i>


                <span>

                    ${dateData.text}

                </span>

            </div>


        </div>

    `;

}


// =====================================================
// STATUS NORMALIZATION
// =====================================================

function normalizeTaskStatus(status) {

    const value =
        String(
            status || ""
        )
            .toLowerCase()
            .trim();


    // =================================================
    // قيد الانتظار
    // =================================================

    if (

        value === "قيد الانتظار" ||

        value === "waiting" ||

        value === "in-progress" ||

        value === "progress" ||

        value === "waiting"

    ) {

        return "waiting";

    }
    // =================================================
    // قيد التنفيذ
    // =================================================

    if (

        value === "قيد التنفيذ" ||

        value === "in_progress" ||

        value === "in-progress" ||

        value === "progress" ||

        value === "working"

    ) {

        return "in_progress";

    }


    // =================================================
    // قيد المراجعة
    // =================================================

    if (

        value === "قيد المراجعة" ||

        value === "in_review" ||

        value === "in-review" ||

        value === "review" ||

        value === "under_review"

    ) {

        return "in_review";

    }


    // =================================================
    // مكتمل
    // =================================================

    if (

        value === "مكتمل" ||

        value === "مكتملة" ||

        value === "completed" ||

        value === "complete" ||

        value === "done"

    ) {

        return "completed";

    }


    // =================================================
    // تم التسليم
    // =================================================

    if (

        value === "تم التسليم" ||

        value === "delivered" ||

        value === "delivery"

    ) {

        return "delivered";

    }


    // =================================================
    // DEFAULT
    // =================================================

    return "todo";

}


// =====================================================
// STATUS DATA
// =====================================================

function getStatusData(status) {

    switch (status) {


        // =============================================
        // قيد التنفيذ
        // =============================================

        case "in_progress":

            return {

                label:
                    "قيد التنفيذ",

                class:
                    "my-task-status-progress"

            };


        // =============================================
        // قيد المراجعة
        // =============================================

        case "in_review":

            return {

                label:
                    "قيد المراجعة",

                class:
                    "my-task-status-review"

            };


        // =============================================
        // مكتمل
        // =============================================

        case "completed":

            return {

                label:
                    "مكتمل",

                class:
                    "my-task-status-completed"

            };


        // =============================================
        // تم التسليم
        // =============================================

        case "delivered":

            return {

                label:
                    "تم التسليم",

                class:
                    "my-task-status-delivered"

            };


        // =============================================
        // DEFAULT
        // =============================================

        default:

            return {

                label:
                    "قيد الانتظار",

                class:
                    "my-task-status-waiting"

            };

    }

}


// =====================================================
// PRIORITY NORMALIZATION
// =====================================================

function normalizePriority(priority) {

    const value =
        String(
            priority || ""
        )
            .toLowerCase()
            .trim();


    // =================================================
    // HIGH
    // =================================================

    if (

        value === "عالية" ||

        value === "high" ||

        value === "urgent"

    ) {

        return "high";

    }


    // =================================================
    // MEDIUM
    // =================================================

    if (

        value === "متوسطة" ||

        value === "متوسط" ||

        value === "medium" ||

        value === "normal"

    ) {

        return "medium";

    }


    // =================================================
    // LOW
    // =================================================

    if (

        value === "منخفضة" ||

        value === "منخفض" ||

        value === "low"

    ) {

        return "low";

    }


    // =================================================
    // DEFAULT
    // =================================================

    return "medium";

}


// =====================================================
// PRIORITY DATA
// =====================================================

function getPriorityData(priority) {

    switch (priority) {


        // =============================================
        // HIGH
        // =============================================

        case "high":

            return {

                label:
                    "عالية",

                class:
                    "my-task-badge-high"

            };


        // =============================================
        // LOW
        // =============================================

        case "low":

            return {

                label:
                    "منخفضة",

                class:
                    "my-task-badge-low"

            };


        // =============================================
        // MEDIUM
        // =============================================

        default:

            return {

                label:
                    "متوسطة",

                class:
                    "my-task-badge-medium"

            };

    }

}


// =====================================================
// DATE DATA
// =====================================================

function getTaskDateData(
    dueDate,
    status
) {


    // =================================================
    // NO DATE
    // =================================================

    if (!dueDate) {

        return {

            text:
                "بدون موعد",

            icon:
                "calendar",

            class:
                ""

        };

    }


    // =================================================
    // DATE
    // =================================================

    const date =
        new Date(
            dueDate
        );


    // =================================================
    // INVALID DATE
    // =================================================

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return {

            text:
                "تاريخ غير صالح",

            icon:
                "calendar",

            class:
                ""

        };

    }


    // =================================================
    // FORMAT
    // =================================================

    const formatted =
        date.toLocaleDateString(
            "ar-SA",
            {
                day:
                    "numeric",

                month:
                    "short"
            }
        );


    // =================================================
    // COMPLETED
    // =================================================

    if (
        status === "completed"
    ) {

        return {

            text:
                formatted,

            icon:
                "calendar-check",

            class:
                "my-task-date-completed"

        };

    }


    // =================================================
    // DELIVERED
    // =================================================

    if (
        status === "delivered"
    ) {

        return {

            text:
                formatted,

            icon:
                "calendar-check",

            class:
                "my-task-date-completed"

        };

    }


    // =================================================
    // OVERDUE
    // =================================================

    if (
        isTaskOverdue({

            due_date:
                dueDate,

            status:
                status

        })
    ) {

        return {

            text:
                `متأخرة • ${formatted}`,

            icon:
                "triangle-alert",

            class:
                "my-task-date-overdue"

        };

    }


    // =================================================
    // NORMAL
    // =================================================

    return {

        text:
            formatted,

        icon:
            "calendar",

        class:
            ""

    };

}


// =====================================================
// OPEN TASK FROM MY TASKS
// =====================================================

function openMyTask(taskId) {

    const task =
        myTasksData.find(
            item =>
                String(item.id) ===
                String(taskId)
        );


    if (!task) {

        console.error(
            "MY TASKS: Task not found:",
            taskId
        );

        return;

    }


    console.log(
        "MY TASKS: Opening task:",
        task
    );


    // =================================================
    // CREATE TASK ELEMENT
    // =================================================

    const taskElement =
        document.createElement("div");


    taskElement.className =
        "Kanban-task";


    // =================================================
    // DATASET
    // =================================================

    taskElement.dataset.taskId =
        String(task.id);


    taskElement.dataset.title =
        task.title || "";


    taskElement.dataset.description =
        task.description || "";


    taskElement.dataset.dueDate =
        task.due_date || "";


    taskElement.dataset.priority =
        task.priority || "";


    taskElement.dataset.status =
        task.status || "";


    // =================================================
    // MEMBERS
    // =================================================

    taskElement.dataset.members =
        JSON.stringify(
            task.members ||
            task.task_members ||
            []
        );


    // =================================================
    // ATTACHMENT
    // =================================================

    taskElement.dataset.attachmentUrl =
        task.attachment_url ||
        task.attachmentUrl ||
        task.attachments ||
        "";


    console.log(
        "OPEN TASK MEMBERS:",
        taskElement.dataset.members
    );


    console.log(
        "OPEN TASK ATTACHMENT:",
        taskElement.dataset.attachmentUrl
    );


    // =================================================
    // OPEN EXISTING TASK DETAILS
    // =================================================

    if (
        typeof window.openTaskDetails ===
        "function"
    ) {

        window.openTaskDetails(
            taskElement
        );

        return;

    }


    console.error(
        "openTaskDetails is not available."
    );

}


// =====================================================
// LOADING
// =====================================================

function showMyTasksLoading() {

    myTasksLoading.style.display =
        "flex";


    myTasksList.style.display =
        "none";


    myTasksEmpty.style.display =
        "none";


    myTasksError.style.display =
        "none";

}


// =====================================================
// ERROR
// =====================================================

function showMyTasksError(
    message
) {

    myTasksLoading.style.display =
        "none";


    myTasksList.style.display =
        "none";


    myTasksEmpty.style.display =
        "none";


    myTasksError.style.display =
        "flex";


    myTasksErrorMessage.textContent =
        message;


    refreshMyTasksIcons();

}


// =====================================================
// LUCIDE
// =====================================================

function refreshMyTasksIcons() {

    if (
        typeof lucide !==
        "undefined"
    ) {

        lucide.createIcons();

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// =====================================================
// SEARCH
// =====================================================

if (myTasksSearch) {

    myTasksSearch.addEventListener(
        "input",
        renderMyTasks
    );

}


// =====================================================
// STATUS FILTER
// =====================================================

if (myTasksStatusFilter) {

    myTasksStatusFilter.addEventListener(
        "change",
        renderMyTasks
    );

}


// =====================================================
// PRIORITY FILTER
// =====================================================

if (myTasksPriorityFilter) {

    myTasksPriorityFilter.addEventListener(
        "change",
        renderMyTasks
    );

}


// =====================================================
// REFRESH BUTTON
// =====================================================

if (refreshMyTasksBtn) {

    refreshMyTasksBtn.addEventListener(
        "click",
        loadMyTasks
    );

}


// =====================================================
// RETRY BUTTON
// =====================================================

if (retryMyTasksBtn) {

    retryMyTasksBtn.addEventListener(
        "click",
        loadMyTasks
    );

}


// =====================================================
// MY TASKS BUTTON
// =====================================================

if (myTasksBtn) {

    myTasksBtn.addEventListener(
        "click",
        () => {


            // =============================================
            // HIDE OTHER DASHBOARD SECTIONS
            // =============================================

            document
                .querySelectorAll(
                    ".dashboard-content > section"
                )
                .forEach(
                    section => {

                        section.classList.add(
                            "dashboard-hidden"
                        );

                    }
                );


            // =============================================
            // SHOW MY TASKS
            // =============================================

            if (myTasksSection) {

                myTasksSection.classList.remove(
                    "dashboard-hidden"
                );

            }


            // =============================================
            // REFRESH DATA
            // =============================================

            loadMyTasks();

        }
    );

}


// =====================================================
// INITIAL LOAD
// =====================================================

loadMyTasks();