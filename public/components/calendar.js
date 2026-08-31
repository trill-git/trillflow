/* =========================================================
   TRILLFLOW — CALENDAR SUMMARY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const calendarDays =
        document.getElementById(
            "calendarsummryDays"
        );

    const calendarMonth =
        document.getElementById(
            "calendarsummryMonth"
        );

    const calendarPrev =
        document.getElementById(
            "calendarsummryPrev"
        );

    const calendarNext =
        document.getElementById(
            "calendarsummryNext"
        );

    const calendarToday =
        document.getElementById(
            "calendarsummryToday"
        );

    const eventsList =
        document.getElementById(
            "calendarsummryEventsList"
        );

    const eventsCount =
        document.getElementById(
            "calendarsummryEventsCount"
        );


    /* =====================================================
       CHECK
    ===================================================== */

    if (!calendarDays) {

        console.error(
            "❌ calendarsummryDays غير موجود"
        );

        return;

    }


    /* =====================================================
       DATA
    ===================================================== */

    let tasks = [];

    let currentDate = new Date();

    let selectedDate = new Date();


    /* =====================================================
       ARABIC MONTHS
    ===================================================== */

    const months = [

        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر"

    ];


    /* =====================================================
       DATE KEY
    ===================================================== */

    function getDateKey(date) {

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        /*
           مهم:
           بدون مسافات
        */

        return `${year}-${month}-${day}`;

    }


    /* =====================================================
       TASK DATE
    ===================================================== */

    function getTaskDate(task) {

        const value =
            task["Due Date"];


        if (!value) {

            return null;

        }


        return String(value)
            .substring(0, 10);

    }


    /* =====================================================
       LOAD TASKS
    ===================================================== */

    async function loadTasks() {

        try {

            const response =
                await fetch(
                    "/tasks",
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );


            if (!response.ok) {

                console.error(
                    "❌ Tasks response:",
                    response.status
                );

                return;

            }


            const data =
                await response.json();


            if (!Array.isArray(data)) {

                console.error(
                    "❌ Tasks ليست Array:",
                    data
                );

                return;

            }


            tasks = data;


            console.log(
                "📅 Calendar Tasks:",
                tasks
            );


            renderCalendar();


            /*
               اليوم الحالي يظهر مباشرة
            */

            selectDate(
                new Date()
            );


        }

        catch (error) {

            console.error(
                "❌ Calendar error:",
                error
            );

        }

    }


    /* =====================================================
       GET TASKS FOR DATE
    ===================================================== */

    function getTasksForDate(date) {

        const selectedKey =
            getDateKey(date);


        return tasks.filter(task => {

            return (
                getTaskDate(task) ===
                selectedKey
            );

        });

    }


    /* =====================================================
       RENDER CALENDAR
    ===================================================== */

    function renderCalendar() {

        calendarDays.innerHTML = "";


        const year =
            currentDate.getFullYear();

        const month =
            currentDate.getMonth();


        /* =================================================
           MONTH TITLE
        ================================================= */

        calendarMonth.textContent =
            `${months[month]} ${year}`;


        /* =================================================
           FIRST DAY
        ================================================= */

        const firstDay =
            new Date(
                year,
                month,
                1
            ).getDay();


        /* =================================================
           DAYS IN MONTH
        ================================================= */

        const daysInMonth =
            new Date(
                year,
                month + 1,
                0
            ).getDate();


        /* =================================================
           PREVIOUS MONTH
        ================================================= */

        const previousMonthDays =
            new Date(
                year,
                month,
                0
            ).getDate();


        /* =================================================
           42 CELLS
        ================================================= */

        for (
            let i = 0;
            i < 42;
            i++
        ) {

            let day;

            let date;

            let muted = false;


            /* =============================================
               PREVIOUS MONTH
            ============================================= */

            if (
                i <
                firstDay
            ) {

                day =
                    previousMonthDays -
                    firstDay +
                    i +
                    1;


                date =
                    new Date(
                        year,
                        month - 1,
                        day
                    );


                muted = true;

            }


            /* =============================================
               CURRENT MONTH
            ============================================= */

            else if (
                i <
                firstDay +
                daysInMonth
            ) {

                day =
                    i -
                    firstDay +
                    1;


                date =
                    new Date(
                        year,
                        month,
                        day
                    );

            }


            /* =============================================
               NEXT MONTH
            ============================================= */

            else {

                day =
                    i -
                    firstDay -
                    daysInMonth +
                    1;


                date =
                    new Date(
                        year,
                        month + 1,
                        day
                    );


                muted = true;

            }


            /* =============================================
               CELL
            ============================================= */

            const cell =
                document.createElement(
                    "div"
                );


            cell.className =
                "calendarsummry-day";


            if (muted) {

                cell.classList.add(
                    "muted"
                );

            }


            /* =============================================
               TODAY
            ============================================= */

            const today =
                new Date();


            if (
                getDateKey(date) ===
                getDateKey(today)
            ) {

                cell.classList.add(
                    "today"
                );

            }


            /* =============================================
               SELECTED
            ============================================= */

            if (
                getDateKey(date) ===
                getDateKey(selectedDate)
            ) {

                cell.classList.add(
                    "selected"
                );

            }


            /* =============================================
               TASKS
            ============================================= */

            const dayTasks =
                getTasksForDate(
                    date
                );


            if (
                dayTasks.length > 0
            ) {

                cell.classList.add(
                    "has-tasks"
                );

            }


            /* =============================================
               NUMBER
            ============================================= */

            const number =
                document.createElement(
                    "span"
                );


            number.className =
                "calendarsummry-day-number";


            number.textContent =
                day;


            cell.appendChild(
                number
            );


            /* =============================================
               TASK DOTS
            ============================================= */

            if (
                dayTasks.length > 0
            ) {

                const dots =
                    document.createElement(
                        "div"
                    );


                dots.className =
                    "calendarsummry-day-task-dots";


                /*
                   نعرض 3 نقاط كحد أقصى
                */

                dayTasks
                    .slice(0, 3)
                    .forEach(task => {

                        const dot =
                            document.createElement(
                                "span"
                            );


                        dot.className =
                            "calendarsummry-mini-dot";


                        if (
                            task.status ===
                            "قيد التنفيذ"
                        ) {

                            dot.classList.add(
                                "progress"
                            );

                        }

                        else if (
                            task.status ===
                            "مكتمل"
                        ) {

                            dot.classList.add(
                                "completed"
                            );

                        }


                        dots.appendChild(
                            dot
                        );

                    });


                cell.appendChild(
                    dots
                );

            }


            /* =============================================
               TASK COUNT
            ============================================= */

            if (
                dayTasks.length > 0
            ) {

                const count =
                    document.createElement(
                        "small"
                    );


                count.className =
                    "calendarsummry-day-count";


                count.textContent =
                    dayTasks.length;


                cell.appendChild(
                    count
                );

            }


            /* =============================================
               CLICK
            ============================================= */

            cell.addEventListener(
                "click",
                () => {

                    selectedDate =
                        new Date(date);


                    /*
                       إذا ضغط على شهر سابق
                       أو قادم
                    */

                    if (muted) {

                        currentDate =
                            new Date(
                                date.getFullYear(),
                                date.getMonth(),
                                1
                            );


                        renderCalendar();

                    }


                    selectDate(
                        date
                    );

                }
            );


            calendarDays.appendChild(
                cell
            );

        }

    }


    /* =====================================================
       SELECT DATE
    ===================================================== */

    function selectDate(date) {

        selectedDate =
            new Date(date);


        const dateTasks =
            getTasksForDate(
                selectedDate
            );


        renderSelectedTasks(
            dateTasks
        );


        /*
           إعادة رسم حتى يتحرك selected
        */

        renderCalendar();

    }


    /* =====================================================
       RENDER SELECTED TASKS
    ===================================================== */

    function renderSelectedTasks(
        dateTasks
    ) {

        eventsList.innerHTML = "";


        /* =============================================
           DATE
        ============================================= */

        const selectedKey =
            getDateKey(
                selectedDate
            );


        /* =============================================
           COUNT
        ============================================= */

        eventsCount.textContent =
            `${dateTasks.length} مهام`;


        /* =============================================
           EMPTY
        ============================================= */

        if (
            dateTasks.length === 0
        ) {

            eventsList.innerHTML = `

                <div class="calendarsummry-empty">

                    لا توجد مهام في
                    ${selectedKey}

                </div>

            `;

            return;

        }


        /* =============================================
           TASKS
        ============================================= */

        dateTasks.forEach(
            (task, index) => {

                const event =
                    document.createElement(
                        "div"
                    );


                event.className =
                    "calendarsummry-event";


                event.style.animationDelay =
                    `${index * 60}ms`;


                /*
                   حفظ ID التاسك داخل العنصر
                */

                event.dataset.taskId =
                    String(task.id);


                event.style.cursor =
                    "pointer";


                /* =====================================
                   DOT
                ===================================== */

                const dot =
                    document.createElement(
                        "span"
                    );


                dot.className =
                    "calendarsummry-event-dot";


                /* =====================================
                   STATUS
                ===================================== */

                if (
                    task.status ===
                    "قيد التنفيذ"
                ) {

                    dot.classList.add(
                        "blue"
                    );

                }

                else if (
                    task.status ===
                    "مكتمل"
                ) {

                    dot.classList.add(
                        "completed"
                    );

                }


                /* =====================================
                   INFO
                ===================================== */

                const info =
                    document.createElement(
                        "div"
                    );


                info.className =
                    "calendarsummry-event-info";


                /* =====================================
                   TITLE
                ===================================== */

                const title =
                    document.createElement(
                        "strong"
                    );


                title.textContent =
                    task.Title ||
                    "مهمة بدون عنوان";


                /* =====================================
                   STATUS
                ===================================== */

                const status =
                    document.createElement(
                        "small"
                    );


                status.innerHTML = `

                    <i class="fa-regular fa-circle-check"></i>

                    ${task.status || "بدون حالة"}

                `;


                info.appendChild(
                    title
                );


                info.appendChild(
                    status
                );


                event.appendChild(
                    dot
                );


                event.appendChild(
                    info
                );


                /* =====================================
                   OPEN TASK FROM CALENDAR
                ===================================== */

                event.addEventListener(
                    "click",
                    (e) => {

                        e.preventDefault();
                        e.stopPropagation();


                        /*
                           أخذ ID المهمة التي ضغط عليها المستخدم
                        */

                        const taskId =
                            event.dataset.taskId;


                        if (!taskId) {

                            console.error(
                                "❌ Task ID غير موجود"
                            );

                            return;

                        }


                        console.log(
                            "📅 Opening task from calendar:",
                            taskId
                        );


                        /*
                           حفظ ID المهمة في localStorage
                        */

                        localStorage.setItem(
                            "openTaskFromCalendar",
                            taskId
                        );


                        /*
                           الانتقال إلى Kanban
                        */

                        const tasksNav =
                            document.querySelector(
                                '[data-page="projectDetailsPage"]'
                            );


                        if (tasksNav) {

                            tasksNav.click();

                        }

                    }
                );


                /*
                   إضافة العنصر مرة واحدة فقط
                */

                eventsList.appendChild(
                    event
                );

            }
        );

    }


    /* =====================================================
       PREVIOUS MONTH
    ===================================================== */

    calendarPrev?.addEventListener(
        "click",
        () => {

            currentDate.setMonth(
                currentDate.getMonth() - 1
            );


            renderCalendar();

        }
    );


    /* =====================================================
       NEXT MONTH
    ===================================================== */

    calendarNext?.addEventListener(
        "click",
        () => {

            currentDate.setMonth(
                currentDate.getMonth() + 1
            );


            renderCalendar();

        }
    );


    /* =====================================================
       TODAY
    ===================================================== */

    calendarToday?.addEventListener(
        "click",
        () => {

            const today =
                new Date();


            currentDate =
                new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                );


            selectedDate =
                new Date(today);


            renderCalendar();


            selectDate(
                today
            );

        }
    );


    /* =====================================================
       START
    ===================================================== */

    loadTasks();

});
