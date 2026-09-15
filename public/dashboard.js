// =====================================================
// DASHBOARD
// =====================================================


// =====================================================
// LOAD USERNAME
// =====================================================

async function loadUsername() {

    try {

        const response = await fetch("/user", {
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Failed to load user");
        }

        const user = await response.json();

        const usernameElement =
            document.getElementById("profileusername");

        if (usernameElement) {
            usernameElement.textContent =
                user.username || "";
        }

        const usernameElement1 =
            document.getElementById("username");

        if (usernameElement1) {
            usernameElement1.textContent =
                `صباح الخير ${user.username || ""}`;
        }

        if (typeof window.updateNavbarUser === "function") {
            window.updateNavbarUser(
                user.username || "",
                user.email || ""
            );
        }

    } catch (error) {

        console.error(
            "Username Error:",
            error
        );

    }

}

loadUsername();


// =====================================================
// AI TRILL
// =====================================================

const closebtn =
    document.querySelector(
        ".aitrill-container-closebtn"
    );

const AITrillcontainer =
    document.querySelector(
        ".aitrill-container"
    );

const AiBtn =
    document.querySelector(
        ".icon-btn"
    );

const aiInput =
    document.querySelector(
        ".ai-input"
    );

const aiSubmitBtn =
    document.querySelector(
        ".ai-submit-btn"
    );

const aiMessages =
    document.querySelector(
        ".ai-message-box-container"
    );


// =====================================================
// CLOSE AI
// =====================================================

if (
    closebtn &&
    AITrillcontainer
) {

    closebtn.addEventListener(
        "click",
        () => {

            AITrillcontainer.style.display =
                "none";

        }
    );

}


// =====================================================
// OPEN AI
// =====================================================

if (
    AiBtn &&
    AITrillcontainer
) {

    AiBtn.addEventListener(
        "click",
        () => {

            AITrillcontainer.style.display =
                "flex";

        }
    );

}


// =====================================================
// ENTER TO SEND
// =====================================================

if (
    aiInput &&
    aiSubmitBtn
) {

    aiInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                aiSubmitBtn.click();

            }

        }
    );

}


// =====================================================
// SEND AI MESSAGE
// =====================================================

if (
    aiSubmitBtn &&
    aiInput &&
    aiMessages
) {

    aiSubmitBtn.addEventListener(
        "click",
        async () => {

            const message =
                aiInput.value.trim();


            if (!message) {
                return;
            }


            // =================================================
            // USER MESSAGE
            // =================================================

            const userMessageContainer =
                document.createElement(
                    "div"
                );

            userMessageContainer.className =
                "user-message-container";


            const userMessage =
                document.createElement(
                    "p"
                );

            userMessage.className =
                "user-message";


            userMessage.textContent =
                message;


            userMessageContainer.appendChild(
                userMessage
            );


            aiMessages.appendChild(
                userMessageContainer
            );


            aiMessages.scrollTop =
                aiMessages.scrollHeight;


            // =================================================
            // CLEAR INPUT
            // =================================================

            aiInput.value = "";


            // =================================================
            // THINKING
            // =================================================

            const thinkingMessage =
                document.createElement(
                    "div"
                );

            thinkingMessage.className =
                "ai-message-container thinking-message";


            const thinkingText =
                document.createElement(
                    "p"
                );

            thinkingText.className =
                "ai-message";


            thinkingText.textContent =
                "جاري التفكير...";


            thinkingMessage.appendChild(
                thinkingText
            );


            aiMessages.appendChild(
                thinkingMessage
            );


            aiMessages.scrollTop =
                aiMessages.scrollHeight;


            try {

                // =================================================
                // CURRENT PROJECT
                // =================================================

                const currentProject =
                    localStorage.getItem(
                        "currentProject"
                    );


                // =================================================
                // REQUEST
                // =================================================

                const response =
                    await fetch(
                        "/ai/chat",
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            credentials:
                                "include",

                            body:
                                JSON.stringify({

                                    message:
                                        message,

                                    projectId:
                                        currentProject

                                })

                        }
                    );


                // =================================================
                // ERROR
                // =================================================

                if (
                    !response.ok
                ) {

                    let errorMessage =
                        "حدث خطأ في السيرفر.";


                    try {

                        const errorData =
                            await response.json();


                        errorMessage =
                            errorData.message ||
                            errorMessage;

                    } catch (error) {



                    }


                    throw new Error(
                        errorMessage
                    );

                }


                // =================================================
                // REMOVE THINKING
                // =================================================

                if (
                    thinkingMessage
                ) {

                    thinkingMessage.remove();

                }


                // =================================================
                // AI MESSAGE
                // =================================================

                const aiMessageContainer =
                    document.createElement(
                        "div"
                    );

                aiMessageContainer.className =
                    "ai-message-container";


                const aiMessage =
                    document.createElement(
                        "p"
                    );

                aiMessage.className =
                    "ai-message";


                aiMessageContainer.appendChild(
                    aiMessage
                );


                aiMessages.appendChild(
                    aiMessageContainer
                );


                // =================================================
                // STREAMING
                // =================================================

                if (
                    !response.body
                ) {

                    throw new Error(
                        "لا يوجد Stream في الاستجابة."
                    );

                }


                const reader =
                    response.body.getReader();


                const decoder =
                    new TextDecoder(
                        "utf-8"
                    );


                let fullReply =
                    "";


                while (true) {

                    const {
                        done,
                        value
                    } =
                        await reader.read();


                    if (done) {
                        break;
                    }


                    const chunk =
                        decoder.decode(
                            value,
                            {
                                stream:
                                    true
                            }
                        );


                    fullReply +=
                        chunk;


                    aiMessage.textContent =
                        fullReply;


                    aiMessages.scrollTop =
                        aiMessages.scrollHeight;

                }

            } catch (error) {

                console.error(
                    "AI Error:",
                    error
                );


                // =================================================
                // REMOVE THINKING
                // =================================================

                if (
                    thinkingMessage
                ) {

                    thinkingMessage.remove();

                }


                // =================================================
                // ERROR MESSAGE
                // =================================================

                const errorContainer =
                    document.createElement(
                        "div"
                    );

                errorContainer.className =
                    "ai-message-container";


                const errorText =
                    document.createElement(
                        "p"
                    );

                errorText.className =
                    "ai-message";


                errorText.textContent =
                    error.message ||
                    "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";


                errorContainer.appendChild(
                    errorText
                );


                aiMessages.appendChild(
                    errorContainer
                );


                aiMessages.scrollTop =
                    aiMessages.scrollHeight;

            }

        }
    );

}


// =====================================================
// PROFILE MENU
// =====================================================

const profileBtn =
    document.getElementById(
        "profileBtn"
    );

const profile =
    document.querySelector(
        ".profile-menu-container"
    );


if (
    profileBtn &&
    profile
) {

    profileBtn.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            profile.style.display =
                profile.style.display === "block"
                    ? "none"
                    : "block";

        }
    );


    profile.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

        }
    );


    document.addEventListener(
        "click",
        (event) => {

            if (
                !profile.contains(
                    event.target
                ) &&
                !profileBtn.contains(
                    event.target
                )
            ) {

                profile.style.display =
                    "none";

            }

        }
    );

}


// =====================================================
// MESSAGE BOX
// =====================================================

const messageBox =
    document.getElementById(
        "messageBox"
    );

const messageBoxTitle =
    document.getElementById(
        "messageBoxTitle"
    );

const messageBoxText =
    document.getElementById(
        "messageBoxText"
    );

const messageBoxIcon =
    document.getElementById(
        "messageBoxIcon"
    );

const messageBoxClose =
    document.getElementById(
        "messageBoxClose"
    );


let messageBoxTimer = null;


function showMessage(
    message,
    type = "success",
    title = null
) {

    if (!messageBox) {
        return;
    }


    clearTimeout(
        messageBoxTimer
    );


    messageBox.classList.remove(
        "success",
        "error",
        "warning",
        "info"
    );


    messageBox.classList.add(
        type
    );


    const titles = {

        success:
            "تم بنجاح",

        error:
            "حدث خطأ",

        warning:
            "تنبيه",

        info:
            "معلومة"

    };


    if (messageBoxTitle) {

        messageBoxTitle.textContent =
            title ||
            titles[type] ||
            "تنبيه";

    }


    if (messageBoxText) {

        messageBoxText.textContent =
            message;

    }


    const icons = {

        success: "✓",

        error: "!",

        warning: "!",

        info: "i"

    };


    if (messageBoxIcon) {

        messageBoxIcon.textContent =
            icons[type] ||
            "i";

    }


    messageBox.classList.add(
        "show"
    );


    messageBoxTimer =
        setTimeout(
            () => {

                hideMessage();

            },
            3500
        );

}


function hideMessage() {

    if (!messageBox) {
        return;
    }

    messageBox.classList.remove(
        "show"
    );

}


if (messageBoxClose) {

    messageBoxClose.addEventListener(
        "click",
        hideMessage
    );

}


// =====================================================
// NUMBER ANIMATION
// =====================================================

function animateNumber(
    element,
    end,
    duration = 900
) {

    if (!element) {
        return;
    }


    const numericEnd =
        Number(end) || 0;


    const start = 0;

    const startTime =
        performance.now();


    function update(
        currentTime
    ) {

        const progress =
            Math.min(
                (
                    currentTime -
                    startTime
                ) / duration,
                1
            );


        const value =
            Math.floor(
                start +
                (
                    numericEnd -
                    start
                ) *
                progress
            );


        element.textContent =
            value.toLocaleString(
                "ar-SA"
            );


        if (
            progress < 1
        ) {

            requestAnimationFrame(
                update
            );

        } else {

            element.textContent =
                numericEnd.toLocaleString(
                    "ar-SA"
                );

        }

    }


    requestAnimationFrame(
        update
    );

}


// =====================================================
// PERCENT ANIMATION
// =====================================================

function animatePercent(
    element,
    end,
    duration = 900
) {

    if (!element) {
        return;
    }


    const numericEnd =
        Math.min(
            100,
            Math.max(
                0,
                Number(end) || 0
            )
        );


    const startTime =
        performance.now();


    function update(
        currentTime
    ) {

        const progress =
            Math.min(
                (
                    currentTime -
                    startTime
                ) / duration,
                1
            );


        const value =
            Math.round(
                numericEnd *
                progress
            );


        element.textContent =
            `${value}%`;


        if (
            progress < 1
        ) {

            requestAnimationFrame(
                update
            );

        }

    }


    requestAnimationFrame(
        update
    );

}


// =====================================================
// DASHBOARD LOADING
// =====================================================

function setDashboardLoading(
    isLoading
) {

    const loader =
        document.getElementById(
            "dashboardLoader"
        );

    const content =
        document.getElementById(
            "dashboardContent"
        );


    if (
        !loader ||
        !content
    ) {
        return;
    }


    if (isLoading) {

        loader.style.display =
            "flex";

        content.classList.add(
            "dashboard-hidden"
        );

        content.classList.remove(
            "dashboard-visible"
        );

    } else {

        loader.style.display =
            "none";

        content.classList.remove(
            "dashboard-hidden"
        );


        requestAnimationFrame(
            () => {

                content.classList.add(
                    "dashboard-visible"
                );

            }
        );

    }

}


// =====================================================
// DASHBOARD DATE
// =====================================================

function updateDashboardDate() {

    const dateElement =
        document.getElementById(
            "dashboardDate"
        );


    if (!dateElement) {
        return;
    }


    const today =
        new Date();


    dateElement.textContent =
        today.toLocaleDateString(
            "ar-SA",
            {
                weekday:
                    "long",

                year:
                    "numeric",

                month:
                    "long",

                day:
                    "numeric"
            }
        );

}


// =====================================================
// COMPLETION CIRCLE
// =====================================================

function updateCompletionCircle(
    percent
) {

    const circleProgress =
        document.querySelector(
            ".circle-progress"
        );


    if (!circleProgress) {
        return;
    }


    const radius =
        circleProgress.r.baseVal.value;


    const circumference =
        2 *
        Math.PI *
        radius;


    const safePercent =
        Math.min(
            100,
            Math.max(
                0,
                Number(percent) || 0
            )
        );


    circleProgress.style.transition =
        "none";


    circleProgress.style.strokeDasharray =
        circumference;


    circleProgress.style.strokeDashoffset =
        circumference;


    requestAnimationFrame(
        () => {

            requestAnimationFrame(
                () => {

                    const offset =
                        circumference -
                        (
                            safePercent /
                            100
                        ) *
                        circumference;


                    circleProgress.style.transition =
                        "stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)";


                    circleProgress.style.strokeDashoffset =
                        offset;

                }
            );

        }
    );

}


// =====================================================
// DONUT CHART
// =====================================================

function updateDonutChart(
    completed,
    inProgress,
    late
) {

    completed =
        Number(completed) || 0;

    inProgress =
        Number(inProgress) || 0;

    late =
        Number(late) || 0;


    const total =
        completed +
        inProgress +
        late;


    const radius = 42;


    const circumference =
        2 *
        Math.PI *
        radius;


    const completedCircle =
        document.querySelector(
            ".donut-completed"
        );

    const progressCircle =
        document.querySelector(
            ".donut-progress"
        );

    const lateCircle =
        document.querySelector(
            ".donut-late"
        );


    if (
        !completedCircle ||
        !progressCircle ||
        !lateCircle
    ) {
        return;
    }


    const values = [
        completed,
        inProgress,
        late
    ];


    const circles = [
        completedCircle,
        progressCircle,
        lateCircle
    ];


    let currentOffset = 0;


    circles.forEach(
        (
            circle,
            index
        ) => {

            const value =
                values[index];


            const length =
                total > 0
                    ? (
                        value /
                        total
                    ) *
                    circumference
                    : 0;


            circle.style.strokeDasharray =
                `${length} ${circumference - length}`;


            circle.style.strokeDashoffset =
                -currentOffset;


            currentOffset +=
                length;

        }
    );

}


// =====================================================
// ACTIVITY CHART
// =====================================================

function renderActivityChart(
    data = []
) {

    const chart =
        document.getElementById(
            "activityChart"
        );


    if (!chart) {
        return;
    }


    chart.innerHTML = "";


    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        chart.innerHTML = `

            <div class="empty-analytics">

                <i class="fa-solid fa-chart-simple"></i>

                <span>
                    لا توجد بيانات نشاط حتى الآن
                </span>

            </div>

        `;

        return;
    }


    const normalizedData =
        data.map(
            item => ({

                label:
                    item.label ||
                    item.day ||
                    "",

                count:
                    Number(
                        item.count ??
                        item.completed ??
                        0
                    ) || 0

            })
        );


    const max =
        Math.max(
            ...normalizedData.map(
                item =>
                    item.count
            ),
            1
        );


    normalizedData.forEach(
        (
            item,
            index
        ) => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "chart-bar-wrapper";


            wrapper.style.animationDelay =
                `${index * 0.08}s`;


            const bar =
                document.createElement(
                    "div"
                );


            bar.className =
                "chart-bar";


            const height =
                (
                    item.count /
                    max
                ) *
                100;


            bar.style.height =
                `${Math.max(height, 4)}%`;


            const label =
                document.createElement(
                    "span"
                );


            label.className =
                "chart-label";


            label.textContent =
                item.label;


            wrapper.appendChild(
                bar
            );


            wrapper.appendChild(
                label
            );


            chart.appendChild(
                wrapper
            );

        }
    );

}


// =====================================================
// RISK PROJECTS
// =====================================================

function renderRiskProjects(
    projects = []
) {

    const container =
        document.getElementById(
            "riskProjectsList"
        );


    const count =
        document.getElementById(
            "riskProjectsCount"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (count) {

        animateNumber(
            count,
            projects.length
        );

    }


    if (
        !Array.isArray(projects) ||
        projects.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-analytics">

                <i
                    class="fa-solid fa-shield-heart"
                ></i>

                <span>
                    ممتاز! لا توجد مشاريع معرضة للخطر
                </span>

            </div>

        `;

        return;
    }


    projects
        .slice(0, 5)
        .forEach(
            (
                project,
                index
            ) => {

                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "risk-project";


                element.style.animationDelay =
                    `${index * 0.08}s`;


                element.innerHTML = `

                    <div class="risk-icon">

                        <i
                            class="fa-solid fa-triangle-exclamation"
                        ></i>

                    </div>


                    <div class="risk-info">

                        <strong>
                            ${escapeHtml(
                    project.title ||
                    "مشروع"
                )}
                        </strong>

                        <span>
                            ${Number(
                    project.overdueTasks ??
                    project.lateTasks ??
                    0
                )}
                            مهام متأخرة
                        </span>

                    </div>


                    <div class="risk-badge">

                        ${escapeHtml(
                    project.risk ||
                    "يحتاج متابعة"
                )}

                    </div>

                `;


                container.appendChild(
                    element
                );

            }
        );

}


// =====================================================
// TEAM PERFORMANCE
// =====================================================

function renderTeamPerformance(
    members = []
) {

    const container =
        document.getElementById(
            "teamPerformanceList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !Array.isArray(members) ||
        members.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-analytics">

                <i
                    class="fa-solid fa-users"
                ></i>

                <span>
                    لا توجد بيانات كافية لأداء الفريق
                </span>

            </div>

        `;

        return;
    }


    members
        .slice(0, 6)
        .forEach(
            (
                member,
                index
            ) => {

                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "member-performance";


                element.style.animationDelay =
                    `${index * 0.08}s`;


                const username =
                    member.username ||
                    member.name ||
                    "عضو الفريق";


                const completedTasks =
                    Number(
                        member.completedTasks
                    ) || 0;


                const totalTasks =
                    Number(
                        member.totalTasks
                    ) || 0;


                const completionRate =
                    Number(
                        member.completionRate
                    ) || 0;


                element.innerHTML = `

                    <div class="member-rank">

                        ${index + 1}

                    </div>


                    <div class="member-info">

                        <strong>
                            ${escapeHtml(
                    username
                )}
                        </strong>

                        <span>

                            ${completedTasks}

                            مهمة مكتملة

                        </span>

                    </div>


                    <div class="member-rate">

                        ${completionRate}%

                    </div>

                `;


                container.appendChild(
                    element
                );

            }
        );

}


// =====================================================
// ACTIVITY HEATMAP
// =====================================================

function renderActivityHeatmap(
    data = []
) {

    const container =
        document.getElementById(
            "activityHeatmap"
        );


    const totalElement =
        document.getElementById(
            "totalActivities"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        if (totalElement) {

            animateNumber(
                totalElement,
                0
            );

        }


        container.innerHTML = `

            <div class="empty-analytics">

                <i
                    class="fa-solid fa-chart-simple"
                ></i>

                <span>
                    لا يوجد نشاط
                </span>

            </div>

        `;

        return;
    }


    const normalizedData =
        data.map(
            item => ({

                date:
                    item.date ||
                    "",

                count:
                    Number(
                        item.count
                    ) || 0

            })
        );


    const total =
        normalizedData.reduce(
            (
                sum,
                item
            ) =>
                sum +
                item.count,
            0
        );


    if (totalElement) {

        animateNumber(
            totalElement,
            total
        );

    }


    const max =
        Math.max(
            ...normalizedData.map(
                item =>
                    item.count
            ),
            1
        );


    normalizedData.forEach(
        (
            item,
            index
        ) => {

            const day =
                document.createElement(
                    "div"
                );


            day.className =
                "heatmap-day";


            const ratio =
                item.count /
                max;


            let level = 0;


            if (
                item.count > 0
            ) {

                if (
                    ratio > 0.75
                ) {

                    level = 4;

                } else if (
                    ratio > 0.5
                ) {

                    level = 3;

                } else if (
                    ratio > 0.25
                ) {

                    level = 2;

                } else {

                    level = 1;

                }

            }


            if (level > 0) {

                day.classList.add(
                    `heatmap-level-${level}`
                );

            }


            day.style.animationDelay =
                `${index * 0.025}s`;


            day.title =
                `${item.date} - ${item.count} نشاط`;


            container.appendChild(
                day
            );

        }
    );

}


// =====================================================
// ACTIVE PROJECTS
// =====================================================

function renderProjects(
    projects = []
) {

    const projectsList =
        document.getElementById(
            "activeProjectsList"
        );


    if (!projectsList) {
        return;
    }


    projectsList.innerHTML = "";


    const icons = [

        "fa-cube",

        "fa-building",

        "fa-layer-group",

        "fa-folder",

        "fa-rocket"

    ];


    if (
        !Array.isArray(projects) ||
        projects.length === 0
    ) {

        projectsList.innerHTML = `

            <div class="empty-analytics">

                <i
                    class="fa-solid fa-folder-open"
                ></i>

                <span>
                    لا توجد مشاريع نشطة
                </span>

            </div>

        `;

        return;
    }


    projects
        .slice(0, 5)
        .forEach(
            (
                project,
                index
            ) => {

                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "project-mini";


                element.style.animationDelay =
                    `${index * 0.08}s`;


                const icon =
                    icons[index] ||
                    "fa-folder";


                const completedTasks =
                    Number(
                        project.completedTasks
                    ) || 0;


                const totalTasks =
                    Number(
                        project.totalTasks
                    ) || 0;


                const remainingTasks =
                    Number(
                        project.remainingTasks
                    ) ||
                    Math.max(
                        totalTasks -
                        completedTasks,
                        0
                    );


                const progress =
                    Math.min(
                        100,
                        Math.max(
                            0,
                            Number(
                                project.progress
                            ) || 0
                        )
                    );


                element.innerHTML = `

                    <div class="project-icon">

                        <i
                            class="fa-solid ${icon}"
                        ></i>

                    </div>


                    <div class="project-info">

                        <strong>
                            ${escapeHtml(
                    project.title ||
                    "بدون اسم"
                )}
                        </strong>

                        <span>

                            ${remainingTasks}

                            مهام متبقية

                        </span>

                    </div>


                    <div class="project-percent">

                        ${progress}%

                    </div>

                `;


                projectsList.appendChild(
                    element
                );

            }
        );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
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
// MAIN DASHBOARD LOADER
// =====================================================

async function loadDashboardAnalytics() {

    setDashboardLoading(
        true
    );


    updateDashboardDate();


    try {

        const response =
            await fetch(
                "/dashboard/analytics",
                {
                    method: "GET",

                    credentials:
                        "include",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "فشل تحميل التحليلات"
            );

        }


        const analytics =
            await response.json();




        // =================================================
        // SUMMARY
        // =================================================

        const activeTasks =
            Number(
                analytics.activeTasks
            ) || 0;


        const lateTasks =
            Number(
                analytics.lateTasks
            ) || 0;


        const completedTasks =
            Number(
                analytics.completedTasks
            ) || 0;


        const inProgressTasks =
            Number(
                analytics.inProgressTasks
            ) || 0;


        const teamMembersCount =
            Number(
                analytics.teamMembersCount
            ) || 0;


        animateNumber(
            document.getElementById(
                "activeTasksCount"
            ),
            activeTasks
        );


        animateNumber(
            document.getElementById(
                "lateTasksCount"
            ),
            lateTasks
        );


        animateNumber(
            document.getElementById(
                "completedTasksCount"
            ),
            completedTasks
        );


        animateNumber(
            document.getElementById(
                "teamMembersCount"
            ),
            teamMembersCount
        );


        // =================================================
        // COMPLETION
        // =================================================

        const completionPercent =
            Math.min(
                100,
                Math.max(
                    0,
                    Number(
                        analytics.completionPercent
                    ) || 0
                )
            );


        animatePercent(
            document.getElementById(
                "completionPercent"
            ),
            completionPercent
        );


        updateCompletionCircle(
            completionPercent
        );


        animateNumber(
            document.getElementById(
                "completedStat"
            ),
            completedTasks
        );


        animateNumber(
            document.getElementById(
                "progressStat"
            ),
            inProgressTasks
        );


        animateNumber(
            document.getElementById(
                "lateStat"
            ),
            lateTasks
        );


        // =================================================
        // SMART INSIGHT
        // =================================================

        const insight =
            document.getElementById(
                "completionDescription"
            );


        if (insight) {

            if (
                completionPercent >= 80
            ) {

                insight.textContent =
                    "أداء ممتاز! الفريق يحقق معدل إنجاز مرتفع.";

            } else if (
                lateTasks > 0
            ) {

                insight.textContent =
                    `يوجد ${lateTasks} مهام متأخرة تحتاج إلى متابعة.`;

            } else {

                insight.textContent =
                    "أداء الفريق مستقر ويوجد تقدم مستمر في المشاريع.";

            }

        }


        // =================================================
        // GROWTH
        // =================================================

        const growth =
            Number(
                analytics.completionGrowth
            ) || 0;


        const growthElement =
            document.getElementById(
                "completionGrowth"
            );


        const growthIcon =
            document.getElementById(
                "growthIcon"
            );


        if (growthElement) {

            growthElement.textContent =
                `${growth > 0 ? "+" : ""}${growth}%`;

        }


        if (growthIcon) {

            growthIcon.className =
                growth < 0
                    ? "fa-solid fa-arrow-trend-down"
                    : "fa-solid fa-arrow-trend-up";

        }


        // =================================================
        // DONUT
        // =================================================

        const totalTasks =
            completedTasks +
            inProgressTasks +
            lateTasks;


        animateNumber(
            document.getElementById(
                "totalTasksCount"
            ),
            totalTasks
        );


        animateNumber(
            document.getElementById(
                "donutCompleted"
            ),
            completedTasks
        );


        animateNumber(
            document.getElementById(
                "donutProgress"
            ),
            inProgressTasks
        );


        animateNumber(
            document.getElementById(
                "donutLate"
            ),
            lateTasks
        );


        updateDonutChart(
            completedTasks,
            inProgressTasks,
            lateTasks
        );


        // =================================================
        // WEEKLY ACTIVITY
        // =================================================

        const weeklyActivity =
            Array.isArray(
                analytics.weeklyActivity
            )
                ? analytics.weeklyActivity
                : [];


        renderActivityChart(
            weeklyActivity
        );


        const weeklyCompleted =
            weeklyActivity.reduce(
                (
                    sum,
                    item
                ) =>
                    sum +
                    (
                        Number(
                            item.count ??
                            item.completed ??
                            0
                        ) || 0
                    ),
                0
            );


        const weeklyCompletedElement =
            document.getElementById(
                "weeklyCompleted"
            );


        if (
            weeklyCompletedElement
        ) {

            weeklyCompletedElement.textContent =
                `${weeklyCompleted} مهمة مكتملة`;

        }


        // =================================================
        // RISK PROJECTS
        // =================================================

        renderRiskProjects(
            Array.isArray(
                analytics.riskProjects
            )
                ? analytics.riskProjects
                : []
        );


        // =================================================
        // TEAM PERFORMANCE
        // =================================================

        renderTeamPerformance(
            Array.isArray(
                analytics.teamPerformance
            )
                ? analytics.teamPerformance
                : []
        );


        // =================================================
        // ACTIVITY HEATMAP
        // =================================================

        renderActivityHeatmap(
            Array.isArray(
                analytics.activityHeatmap
            )
                ? analytics.activityHeatmap
                : []
        );


        // =================================================
        // ACTIVE PROJECTS
        // =================================================

        const activeProjectsCount =
            Number(
                analytics.activeProjectsCount
            ) || 0;


        const projectsProgress =
            Math.min(
                100,
                Math.max(
                    0,
                    Number(
                        analytics.projectsProgress
                    ) || 0
                )
            );


        animateNumber(
            document.getElementById(
                "activeProjectsCount"
            ),
            activeProjectsCount
        );


        animatePercent(
            document.getElementById(
                "projectsProgress"
            ),
            projectsProgress
        );


        const progressBar =
            document.getElementById(
                "projectsProgressBar"
            );


        if (progressBar) {

            progressBar.style.width =
                "0%";


            requestAnimationFrame(
                () => {

                    requestAnimationFrame(
                        () => {

                            progressBar.style.width =
                                `${projectsProgress}%`;

                        }
                    );

                }
            );

        }


        renderProjects(
            Array.isArray(
                analytics.projects
            )
                ? analytics.projects
                : []
        );


        // =================================================
        // LUCIDE
        // =================================================

        if (
            window.lucide &&
            typeof lucide.createIcons ===
            "function"
        ) {

            lucide.createIcons();

        }


        // =================================================
        // SHOW DASHBOARD
        // =================================================

        setTimeout(
            () => {

                setDashboardLoading(
                    false
                );

            },
            250
        );


    } catch (error) {

        console.error(
            "❌ Analytics Error:",
            error
        );


        setDashboardLoading(
            false
        );


        if (
            typeof showMessage ===
            "function"
        ) {

            showMessage(
                "تعذر تحميل بيانات الداشبورد",
                "error"
            );

        }

    }

}
async function updatePresence() {
    try {
        const response = await fetch("/api/presence", {
            method: "POST",
            credentials: "include"
        });

        if (!response.ok) {
            console.error("Presence update failed:", response.status);
        }
    } catch (error) {
        console.error("Presence update error:", error);
    }
}

updatePresence();

setInterval(updatePresence, 30000);

// =====================================================
// START DASHBOARD
// =====================================================

if (
    document.getElementById(
        "dashboard"
    )
) {

    loadDashboardAnalytics();

}