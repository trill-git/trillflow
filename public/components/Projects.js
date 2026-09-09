////////////////////////// PROJECTS //////////////////////////

// ==================================================
// PROJECT ELEMENTS
// ==================================================

const projectform =
    document.getElementById("projectform");

const addProjectbtn =
    document.getElementById("addProjectbtn");

const closeBtn2 =
    document.getElementById("closeBtn2");

const createProjectBtn =
    document.getElementById("createProjectbtn");

const projectTitle =
    document.getElementById("projectTitle");

const projectDescription =
    document.getElementById("projectDescription");

const projectPriority =
    document.getElementById("projectPriority");

const projectStatus =
    document.getElementById("projectstatus");

const projectDueDate =
    document.getElementById("projectduedate");

const projectContent =
    document.getElementById("projectContent");

const projectForm =
    document.getElementById("projectform");

const projectImage =
    document.getElementById("projectImage");

const projectImagePreview =
    document.getElementById("projectImagePreview");

const projectFiles =
    document.getElementById("projectFiles");

const projectFilesPreview =
    document.getElementById("projectFilesPreview");

const projectMembersSelect =
    document.getElementById("projectMembersSelect");


// ==================================================
// SELECTED PROJECT MEMBERS
// ==================================================

let selectedProjectMembers = [];


// ==================================================
// CURRENT PROJECT
// ==================================================

let currentProjectId = null;
let projectCurrentUserRole = null;
let activeProject = null;


// ==================================================
// PROJECT MEMBERS MODAL ELEMENTS
// ==================================================

const projectMembersModal =
    document.getElementById(
        "projectMembersModal"
    );

const closeProjectMembers =
    document.getElementById(
        "closeProjectMembers"
    );

const projectMembersList =
    document.getElementById(
        "projectMembersList"
    );

const projectMemberSelect =
    document.getElementById(
        "projectMemberSelect"
    );

const addProjectMemberBtn =
    document.getElementById(
        "addProjectMemberBtn"
    );


// ==================================================
// OPEN PROJECT FORM
// ==================================================

addProjectbtn?.addEventListener(
    "click",
    async () => {

        projectform.style.display =
            "block";

        // إعادة تصفير الأعضاء المختارين
        selectedProjectMembers = [];

        // تحميل المستخدمين داخل الفورم
        await loadUsersForProjectForm();

    }
);


// ==================================================
// CLOSE PROJECT FORM
// ==================================================

closeBtn2?.addEventListener(
    "click",
    () => {

        projectform.style.display =
            "none";

    }
);


// ==================================================
// PROJECT IMAGE PREVIEW
// ==================================================

projectImage?.addEventListener(
    "change",
    () => {

        const file =
            projectImage.files[0];


        if (!file) {

            projectImagePreview.innerHTML =
                "";

            return;

        }


        // التأكد أن الملف صورة
        if (!file.type.startsWith("image/")) {

            projectImagePreview.innerHTML =
                "";

            showMessage(
                "يرجى اختيار صورة صحيحة.",
                "warning"
            );

            projectImage.value =
                "";

            return;

        }


        const imageURL =
            URL.createObjectURL(file);


        projectImagePreview.innerHTML = `
            <img
                src = "${imageURL}"
                alt = "صورة المشروع"
            >
        `;

    }
);


// ==================================================
// PROJECT CONTENT CLICK
// فتح المشروع عند الضغط على الحاوية كاملة
// ==================================================

projectContent?.addEventListener(
    "click",
    async (e) => {



        // ==================================================
        // DELETE PROJECT
        // مهم:
        // إذا ضغط على X لا نفتح المشروع
        // ==================================================

        const deleteButton =
            e.target.closest(
                ".deleteProjectbtn"
            );

        if (deleteButton) {

            const projectId =
                deleteButton.dataset.projectId;


            if (!projectId) {

                return;

            }


            try {

                const response =
                    await fetch(
                        `/projects/${projectId}`,
                        {
                            method: "DELETE",

                            credentials:
                                "include"
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    showMessage(
                        data.message ||
                        "لا يمكن حذف المشروع.",
                        "error"
                    );

                    return;

                }


                // إذا كان المشروع المحذوف
                // هو المشروع الحالي

                const currentProject =
                    localStorage.getItem(
                        "currentProject"
                    );


                if (
                    currentProject ===
                    String(projectId)
                ) {

                    localStorage.removeItem(
                        "currentProject"
                    );

                }


                // إعادة تحميل المشاريع
                await loadProjects();


                showMessage(
                    "تم حذف المشروع.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Delete Project ERROR:",
                    error
                );


                showMessage(
                    "حدث خطأ أثناء حذف المشروع.",
                    "error"
                );

            }


            return;

        }


        // ==================================================
        // SHOW PROJECT
        // الضغط على أي مكان داخل project-card
        // ==================================================

        const projectCard =
            e.target.closest(
                ".project-card"
            );


        if (!projectCard) {

            return;

        }


        const projectId =
            projectCard.dataset.projectId;


        if (!projectId) {

            console.error(
                "Project ID غير موجود."
            );

            return;

        }




        // ==================================================
        // حفظ المشروع الحالي
        // ==================================================

        localStorage.setItem(
            "currentProject",
            projectId
        );


        currentProjectId =
            projectId;


        await openProjectWorkspace(projectId);

    }
);


// ==================================================
// CHECK PROJECT PERMISSION
// ==================================================

async function checkProjectPermission() {

    try {

        const response =
            await fetch(
                "/user",
                {
                    credentials:
                        "include"
                }
            );


        if (!response.ok) {

            return;

        }


        const user =
            await response.json();

        projectCurrentUserRole = user.role;





        // العضو العادي لا يستطيع إضافة مشروع

        if (
            user.role === "member"
        ) {

            if (addProjectbtn) {

                addProjectbtn.style.display =
                    "none";

            }

        } else {

            if (addProjectbtn) {

                addProjectbtn.style.display =
                    "block";

            }

        }


    } catch (error) {

        console.error(
            "Permission check error:",
            error
        );

    }

}


checkProjectPermission();


// ==================================================
// LOAD PROJECTS
// ==================================================

function escapeProjectText(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function getProjectTone(value, type) {

    const text = String(value || "").toLowerCase();

    if (type === "priority") {

        if (text.includes("عالي") || text.includes("high")) return "high";
        if (text.includes("منخفض") || text.includes("low")) return "low";

        return "medium";

    }

    if (text.includes("مكتمل") || text.includes("تم") || text.includes("done")) {
        return "complete";
    }

    if (text.includes("تنفيذ") || text.includes("progress")) {
        return "progress";
    }

    return "planned";

}


function formatProjectDate(value) {

    if (!value) return "بدون موعد";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("ar-SA", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);

}

async function loadProjects() {

    try {

        const response =
            await fetch(
                "/projects",
                {
                    credentials:
                        "include"
                }
            );


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        () => ({})
                    );


            console.error(
                "Projects fetch error:",
                errorData
            );


            return;

        }


        const projects =
            await response.json();




        if (!projectContent) {

            return;

        }


        projectContent.innerHTML = `
            <div class="projects-loading" aria-live="polite">
                <span class="projects-loading-orbit"></span>
                جاري ترتيب المشاريع...
            </div>
        `;


        if (
            !Array.isArray(projects) ||
            projects.length === 0
        ) {

            projectContent.innerHTML = `
                <div class="no-projects">
                    <span class="empty-project-icon">✦</span>
                    <h2>مساحة العمل جاهزة</h2>
                    <p>أنشئ مشروعك الأول لتنظيم المهام والفريق في مكان واحد.</p>
                </div>
            `;

            return;

        }

        // ==================================================
        // RENDER PROJECTS
        // ==================================================

        projectContent.innerHTML = projects
            .map((project, index) => {

                const title = escapeProjectText(project.ProjectTitle || "بدون اسم");
                const priority = escapeProjectText(project.Priority || "غير محددة");
                const status = escapeProjectText(project.status || "مخطط له");
                const dueDate = escapeProjectText(formatProjectDate(project.due_date));
                const image = escapeProjectText(project.image_url || "");
                const initial = escapeProjectText(
                    String(project.ProjectTitle || "م").trim().charAt(0).toUpperCase()
                );
                const projectIdentity = image
                    ? `<img class="project-icon" src="${image}" alt="${title}" onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'project-icon project-icon-letter', textContent: '${initial}' }));">`
                    : `<span class="project-icon project-icon-letter" aria-label="${title}">${initial}</span>`;

                return `
                    <article class="project-card" data-project-id="${project.id}" style="--project-order:${index}">
                        <div class="project-card-glow"></div>
                        <header class="project-card-header">
                            ${projectIdentity}
                            <div class="project-card-heading">
                                <span class="project-kicker">مشروع</span>
                                <h2 class="project-title">${title}</h2>
                            </div>
                            <button type="button" class="deleteProjectbtn" data-project-id="${project.id}" aria-label="حذف ${title}" title="حذف المشروع">×</button>
                        </header>
                        <div class="project-meta">
                            <span class="project-pill project-priority ${getProjectTone(project.Priority, "priority")}"><i></i>${priority}</span>
                            <span class="project-pill project-status ${getProjectTone(project.status, "status")}">${status}</span>
                        </div>
                        <div class="project-date-row">
                            <span>موعد التسليم</span>
                            <strong>${dueDate}</strong>
                        </div>
                        <div class="project-members-container">
                            <span class="members-title">فريق المشروع</span>
                            <div class="members" data-project-id="${project.id}">
                                <span class="loading-members">جاري تحميل الفريق...</span>
                            </div>
                        </div>
                        <footer class="project-footer">
                            <span class="project-open-hint">افتح اللوحة لإدارة المهام</span>
                            <button type="button" class="showProbtn" data-project-id="${project.id}">فتح المشروع <span>←</span></button>
                        </footer>
                    </article>
                `;

            })
            .join("");


        // ==================================================
        // تحميل أسماء أعضاء المشاريع
        // ==================================================

        await loadProjectMemberNames();


    } catch (error) {

        console.error(
            "LOAD PROJECTS ERROR:",
            error
        );

    }

}


// ==================================================
// LOAD PROJECT MEMBER NAMES
// ==================================================

async function loadProjectMemberNames() {

    const membersContainers =
        document.querySelectorAll(
            ".members[data-project-id]"
        );


    for (
        const container
        of membersContainers
    ) {

        const projectId =
            container.dataset.projectId;


        if (!projectId) {

            continue;

        }


        try {

            const response =
                await fetch(
                    `/projects/${projectId}/members`,
                    {
                        credentials:
                            "include"
                    }
                );


            if (!response.ok) {

                container.innerHTML = `
                    <span class="no-members">
                        لا يمكن تحميل الأعضاء
                    </span>
                `;

                continue;

            }


            const members =
                await response.json();


            if (
                !members ||
                members.length === 0
            ) {

                container.innerHTML = `
                <span class="no-members">
                    لا يوجد أعضاء مضافون
                </span>
            `;

                continue;

            }


            container.innerHTML =
                members
                    .map(
                        member => {

                            const username =
                                (
                                    member.users?.username ||
                                    member.username ||
                                    "مستخدم"
                                )
                                    .trim()
                                    .split(/\s+/)[0];


                            return `
                                <span class="project-member-chip" title="${escapeProjectText(username)}">
                                    ${escapeProjectText(username)}
                                </span>
                            `;

                        }
                    )
                    .join("");


        } catch (error) {

            console.error(
                "Project members error:",
                error
            );


            container.innerHTML = `
                <span class="no-members">
                    حدث خطأ في تحميل الأعضاء
                </span>
            `;

        }

    }

}


// ==================================================
// LOAD USERS FOR PROJECT FORM
// ==================================================

async function loadUsersForProjectForm() {

    try {




        const response =
            await fetch(
                "/users",
                {
                    credentials:
                        "include"
                }
            );


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        () => ({})
                    );


            console.error(
                "Users response:",
                errorData
            );


            throw new Error(
                "فشل جلب المستخدمين"
            );

        }


        const users =
            await response.json();




        if (!projectMembersSelect) {

            console.error(
                "projectMembersSelect غير موجود في HTML"
            );

            return;

        }


        // تنظيف القائمة

        projectMembersSelect.innerHTML =
            "";


        if (
            !Array.isArray(users) ||
            users.length === 0
        ) {

            projectMembersSelect.innerHTML = `
                <span>
                    لا يوجد مستخدمون.
                </span>
            `;

            return;

        }


        // ==================================================
        // إضافة المستخدمين للفورم
        // ==================================================

        users.forEach(
            user => {

                const member =
                    document.createElement(
                        "span"
                    );


                member.className =
                    "project-member-name";


                member.dataset.userId =
                    String(user.id);

                member.textContent =
                    (user.username || "مستخدم")
                        .trim()
                        .split(/\s+/)[0];

                // ==================================================
                // CLICK MEMBER
                // ==================================================

                member.addEventListener(
                    "click",
                    () => {

                        const userId =
                            String(
                                user.id
                            );


                        // العضو موجود مسبقًا

                        if (
                            selectedProjectMembers.includes(
                                userId
                            )
                        ) {

                            // إزالة العضو

                            selectedProjectMembers =
                                selectedProjectMembers.filter(
                                    id =>
                                        id !==
                                        userId
                                );


                            member.classList.remove(
                                "selected"
                            );

                        }


                        // العضو غير موجود

                        else {

                            selectedProjectMembers.push(
                                userId
                            );


                            member.classList.add(
                                "selected"
                            );

                        }




                    }
                );


                projectMembersSelect.appendChild(
                    member
                );

            }
        );


    } catch (error) {

        console.error(
            "Users ERROR:",
            error
        );


        if (projectMembersSelect) {

            projectMembersSelect.innerHTML = `
                <span>
                    فشل تحميل المستخدمين.
                </span>
            `;

        }

    }

}


// ==================================================
// CREATE PROJECT
// ==================================================

createProjectBtn?.addEventListener(
    "click",
    async (e) => {

        e.preventDefault();


        createProjectBtn.disabled =
            true;


        const title =
            projectTitle.value.trim();


        // ==================================================
        // TITLE VALIDATION
        // ==================================================

        if (!title) {

            showMessage(
                "اكتب اسم المشروع",
                "warning"
            );


            createProjectBtn.disabled =
                false;


            return;

        }


        try {

            // ==================================================
            // MEMBERS
            // ==================================================

            let membersToAdd =
                [
                    ...selectedProjectMembers
                ];





            // ==================================================
            // إذا لم يتم اختيار أي عضو
            // إضافة جميع المستخدمين
            // ==================================================

            if (
                membersToAdd.length === 0
            ) {

                const usersResponse =
                    await fetch(
                        "/users",
                        {
                            credentials:
                                "include"
                        }
                    );


                if (!usersResponse.ok) {

                    throw new Error(
                        "فشل جلب المستخدمين"
                    );

                }


                const users =
                    await usersResponse.json();


                membersToAdd =
                    users.map(
                        user =>
                            String(
                                user.id
                            )
                    );

            }





            // ==================================================
            // FORM DATA
            // ==================================================

            const formData =
                new FormData();


            // ==================================================
            // بيانات المشروع
            // ==================================================

            formData.append(
                "title",
                projectTitle.value.trim()
            );


            formData.append(
                "description",
                projectDescription.value.trim()
            );


            // مهم:
            // Backend ينتظر Priority

            formData.append(
                "Priority",
                projectPriority.value
            );


            formData.append(
                "status",
                projectStatus.value
            );


            // مهم:
            // Backend ينتظر due_date

            formData.append(
                "due_date",
                projectDueDate.value
            );


            // ==================================================
            // MEMBERS
            // ==================================================

            // Backend يستخدم JSON.parse(members)
            // لذلك لازم نرسلها كنص JSON

            formData.append(
                "members",
                JSON.stringify(
                    membersToAdd
                )
            );


            // ==================================================
            // PROJECT IMAGE
            // ==================================================

            if (
                projectImage &&
                projectImage.files &&
                projectImage.files.length > 0
            ) {

                formData.append(
                    "projectImage",
                    projectImage.files[0]
                );

            }

            Array.from(projectFiles?.files || []).forEach(file => {
                formData.append("files", file);
            });


            // ==================================================
            // DEBUG FORM DATA
            // ==================================================




            for (
                const [
                    key,
                    value
                ]
                of formData.entries()
            ) {


            }


            // ==================================================
            // SEND REQUEST
            // ==================================================

            const response =
                await fetch(
                    "/addproject",
                    {
                        method: "POST",

                        credentials:
                            "include",

                        // لا تضع Content-Type هنا
                        // لأن المتصفح سيضع multipart/form-data
                        // تلقائيًا

                        body:
                            formData
                    }
                );


            const data =
                await response.json();





            // ==================================================
            // ERROR
            // ==================================================

            if (!response.ok) {

                showMessage(
                    data.message ||
                    "فشل إنشاء المشروع",
                    "error"
                );


                return;

            }


            // ==================================================
            // RESET FORM
            // ==================================================

            projectTitle.value =
                "";


            projectDescription.value =
                "";


            projectPriority.value =
                "";


            projectStatus.value =
                "";


            projectDueDate.value =
                "";


            if (projectImage) {

                projectImage.value =
                    "";

            }


            if (projectImagePreview) {

                projectImagePreview.innerHTML =
                    "";

            }

            if (projectFiles) {
                projectFiles.value = "";
            }

            if (projectFilesPreview) {
                projectFilesPreview.innerHTML = "";
            }


            // تصفير الأعضاء

            selectedProjectMembers =
                [];


            // إزالة selected من الواجهة

            document
                .querySelectorAll(
                    "#projectMembersSelect .selected"
                )
                .forEach(
                    member => {

                        member.classList.remove(
                            "selected"
                        );

                    }
                );


            // ==================================================
            // CLOSE FORM
            // ==================================================

            projectForm.style.display =
                "none";


            // ==================================================
            // SUCCESS MESSAGE
            // ==================================================

            showMessage(
                "تم إنشاء المشروع وإضافة الأعضاء بنجاح",
                "success"
            );


            // ==================================================
            // RELOAD PROJECTS
            // ==================================================
            // ==================================================
            // RELOAD PROJECTS
            // ==================================================

            // تحميل المشاريع مباشرة
            await loadProjects();

            // إعادة التحميل بعد انتهاء رفع الصورة إلى Google Drive
            setTimeout(async () => {

                try {

                    await loadProjects();

                } catch (error) {

                    console.error(
                        "Reload projects after Drive upload ERROR:",
                        error
                    );

                }

            }, 2000);


        } catch (error) {

            console.error(
                "Create Project ERROR:",
                error
            );


            showMessage(
                "حدث خطأ أثناء إنشاء المشروع",
                "error"
            );


        } finally {

            createProjectBtn.disabled =
                false;

        }

    }
);


projectFiles?.addEventListener("change", () => {

    if (!projectFilesPreview) return;

    projectFilesPreview.innerHTML = "";

    Array.from(projectFiles.files || []).forEach(file => {

        const item = document.createElement("span");
        item.textContent = file.name;
        projectFilesPreview.appendChild(item);

    });

});


// ==================================================
// PROJECT DETAILS
// ==================================================

function canManageProject() {

    return ["owner", "manager", "admin"].includes(
        projectCurrentUserRole
    );

}


function getProjectInitial(project) {

    return String(project?.ProjectTitle || "م")
        .trim()
        .charAt(0)
        .toUpperCase() || "م";

}


function renderProjectIdentity(project) {

    const identity = document.getElementById("projectDetailsIdentity");

    if (!identity) return;

    identity.innerHTML = "";

    if (project.image_url) {

        const image = document.createElement("img");
        image.src = project.image_url;
        image.alt = project.ProjectTitle || "المشروع";
        image.onerror = () => {
            image.replaceWith(Object.assign(document.createElement("span"), {
                className: "project-details-letter",
                textContent: getProjectInitial(project)
            }));
        };
        identity.appendChild(image);

    } else {

        const letter = document.createElement("span");
        letter.className = "project-details-letter";
        letter.textContent = getProjectInitial(project);
        identity.appendChild(letter);

    }

}


function renderProjectMeta(project) {

    const meta = document.getElementById("projectDetailsMeta");

    if (!meta) return;

    const items = [
        ["الحالة", project.status || "قيد الانتظار"],
        ["الأولوية", project.Priority || "غير محددة"],
        ["موعد التسليم", formatProjectDate(project.due_date)]
    ];

    meta.innerHTML = "";

    items.forEach(([label, value]) => {

        const row = document.createElement("div");
        const labelElement = document.createElement("span");
        const valueElement = document.createElement("strong");

        labelElement.textContent = label;
        valueElement.textContent = value;
        row.append(labelElement, valueElement);
        meta.appendChild(row);

    });

}


function renderProjectAttachments(attachments) {

    const list = document.getElementById("projectAttachmentsList");

    if (!list) return;

    list.innerHTML = "";

    if (!attachments.length) {

        list.innerHTML = "<p class=\"project-attachments-empty\">لا توجد مرفقات في هذا المشروع.</p>";
        return;

    }

    attachments.forEach(attachment => {

        const item = document.createElement("div");
        item.className = "project-attachment-item";

        const file = document.createElement("a");
        file.href = attachment.url;
        file.target = "_blank";
        file.rel = "noopener noreferrer";
        file.textContent = attachment.name || "ملف مرفق";

        item.appendChild(file);

        if (canManageProject()) {

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "حذف";
            remove.addEventListener("click", async () => {

                if (!window.confirm("حذف هذا المرفق من المشروع؟")) return;

                try {

                    const response = await fetch(
                        `/projects/${activeProject.id}/attachments`,
                        {
                            method: "DELETE",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ path: attachment.path })
                        }
                    );

                    const data = await response.json().catch(() => ({}));

                    if (!response.ok) {
                        throw new Error(data.message || "فشل حذف المرفق.");
                    }

                    await loadProjectAttachments(activeProject.id);
                    showMessage("تم حذف المرفق.", "success");

                } catch (error) {

                    showMessage(error.message || "حدث خطأ أثناء حذف المرفق.", "error");

                }

            });

            item.appendChild(remove);

        }

        list.appendChild(item);

    });

}


async function loadProjectAttachments(projectId) {

    const list = document.getElementById("projectAttachmentsList");

    if (list) list.textContent = "جارٍ تحميل المرفقات...";

    try {

        const response = await fetch(
            `/projects/${projectId}/attachments`,
            { credentials: "include" }
        );

        const data = await response.json().catch(() => []);

        if (!response.ok) {
            throw new Error(data.message || "فشل جلب المرفقات.");
        }

        renderProjectAttachments(Array.isArray(data) ? data : []);

    } catch (error) {

        if (list) list.textContent = error.message || "تعذر تحميل المرفقات.";

    }

}


function renderProjectBoardIdentity(project) {

    const identity = document.getElementById("projectBoardIdentity");

    if (!identity) return;

    identity.innerHTML = "";

    if (project.image_url) {

        const image = document.createElement("img");
        image.src = project.image_url;
        image.alt = project.ProjectTitle || "المشروع";
        image.onerror = () => {
            identity.textContent = getProjectInitial(project);
        };
        identity.appendChild(image);

    } else {

        identity.textContent = getProjectInitial(project);

    }

}


function renderProjectBoardAttachments(attachments) {

    const panel = document.getElementById("projectBoardAttachmentsPanel");
    const count = document.getElementById("projectBoardAttachmentsCount");

    if (count) count.textContent = attachments.length;
    if (!panel) return;

    panel.innerHTML = "";

    if (!attachments.length) {

        panel.textContent = "لا توجد مرفقات في هذا المشروع.";
        return;

    }

    attachments.forEach(attachment => {

        const item = document.createElement("div");
        item.className = "project-board-attachment-item";

        const link = document.createElement("a");
        link.href = attachment.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = attachment.name || "ملف مرفق";
        item.appendChild(link);

        if (canManageProject()) {

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "حذف";
            remove.addEventListener("click", async () => {

                if (!window.confirm("حذف هذا المرفق؟")) return;

                const response = await fetch(
                    `/projects/${activeProject.id}/attachments`,
                    {
                        method: "DELETE",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ path: attachment.path })
                    }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    showMessage(data.message || "فشل حذف المرفق.", "error");
                    return;
                }

                await loadProjectBoardAttachments(activeProject.id);

            });

            item.appendChild(remove);

        }

        panel.appendChild(item);

    });

}


async function loadProjectBoardAttachments(projectId) {

    try {

        const response = await fetch(
            `/projects/${projectId}/attachments`,
            { credentials: "include" }
        );

        const data = await response.json().catch(() => []);

        if (!response.ok) {
            throw new Error(data.message || "فشل جلب المرفقات.");
        }

        renderProjectBoardAttachments(Array.isArray(data) ? data : []);

    } catch (error) {

        const panel = document.getElementById("projectBoardAttachmentsPanel");
        if (panel) panel.textContent = error.message || "تعذر تحميل المرفقات.";

    }

}


async function openProjectBoard(projectId) {

    if (!projectCurrentUserRole) {
        await checkProjectPermission();
    }

    try {

        const response = await fetch(
            `/projects/${projectId}`,
            { credentials: "include" }
        );

        const project = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(project.message || "فشل فتح المشروع.");
        }

        activeProject = project;
        currentProjectId = String(project.id);
        localStorage.setItem("currentProject", String(project.id));

        document.getElementById("projectBoardTitle").textContent =
            project.ProjectTitle || "بدون اسم";
        document.getElementById("projectBoardDescription").textContent =
            project.description || "لا يوجد وصف لهذا المشروع.";

        renderProjectBoardIdentity(project);

        const overview = document.getElementById("projectBoardOverview");
        const editButton = document.getElementById("projectBoardEditBtn");
        const uploadLabel = document.getElementById("projectBoardAttachmentUploadLabel");

        if (overview) overview.hidden = false;
        if (editButton) editButton.hidden = !canManageProject();
        if (uploadLabel) uploadLabel.hidden = !canManageProject();

        window.openPage?.("KanbanBoardPage");

        if (typeof loadKanbanProject === "function") {
            await loadKanbanProject();
        }

        await loadProjectBoardAttachments(project.id);

    } catch (error) {

        console.error("OPEN PROJECT BOARD ERROR:", error);
        showMessage(error.message || "تعذر فتح المشروع.", "error");

    }

}


async function openProjectDetails(projectId) {

    try {

        const response = await fetch(
            `/projects/${projectId}`,
            { credentials: "include" }
        );

        const project = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(project.message || "فشل فتح المشروع.");
        }

        activeProject = project;
        currentProjectId = String(project.id);
        localStorage.setItem("currentProject", String(project.id));

        document.getElementById("projectDetailsTitle").textContent =
            project.ProjectTitle || "بدون اسم";
        document.getElementById("projectDetailsDescription").textContent =
            project.description || "لا يوجد وصف لهذا المشروع.";

        renderProjectIdentity(project);
        renderProjectMeta(project);

        const editButton = document.getElementById("editProjectBtn");
        const uploadLabel = document.getElementById("projectAttachmentUploadLabel");

        if (editButton) editButton.hidden = !canManageProject();
        if (uploadLabel) uploadLabel.hidden = !canManageProject();

        if (typeof window.openPage === "function") {
            window.openPage("projectDetailsPage");
        }

        await loadProjectAttachments(project.id);

    } catch (error) {

        console.error("OPEN PROJECT DETAILS ERROR:", error);
        showMessage(error.message || "تعذر فتح المشروع.", "error");

    }

}


document.getElementById("backToProjectsBtn")?.addEventListener("click", () => {
    window.openPage?.("projectsPage");
});

document.getElementById("openProjectTasksBtn")?.addEventListener("click", async () => {

    if (!activeProject) return;

    localStorage.setItem("currentProject", String(activeProject.id));
    currentProjectId = String(activeProject.id);
    window.openPage?.("KanbanBoardPage");

    if (typeof loadKanbanProject === "function") {
        await loadKanbanProject();
    }

});

async function uploadProjectAttachments(event) {

    const files = Array.from(event.target.files || []);

    if (!activeProject || !files.length) return;

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    try {

        const response = await fetch(
            `/projects/${activeProject.id}/attachments`,
            { method: "POST", credentials: "include", body: formData }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "فشل رفع المرفقات.");
        }

        await loadProjectAttachments(activeProject.id);
        await loadProjectBoardAttachments(activeProject.id);
        showMessage("تم رفع مرفقات المشروع.", "success");

    } catch (error) {

        showMessage(error.message || "حدث خطأ أثناء رفع المرفقات.", "error");

    } finally {

        event.target.value = "";

    }

}

document.getElementById("projectAttachmentFiles")?.addEventListener(
    "change",
    uploadProjectAttachments
);

document.getElementById("projectBoardAttachmentFiles")?.addEventListener(
    "change",
    uploadProjectAttachments
);

document.getElementById("projectBoardAttachmentsBtn")?.addEventListener(
    "click",
    () => {
        const panel = document.getElementById("projectBoardAttachmentsPanel");
        if (panel) panel.hidden = !panel.hidden;
    }
);

document.getElementById("projectBoardEditBtn")?.addEventListener(
    "click",
    () => document.getElementById("editProjectBtn")?.click()
);


function closeEditProjectModal() {
    document.getElementById("editProjectModal").hidden = true;
}

document.getElementById("editProjectBtn")?.addEventListener("click", () => {

    if (!activeProject || !canManageProject()) return;

    document.getElementById("editProjectTitle").value = activeProject.ProjectTitle || "";
    document.getElementById("editProjectDescription").value = activeProject.description || "";
    document.getElementById("editProjectPriority").value = activeProject.Priority || "متوسطة";
    document.getElementById("editProjectStatus").value = activeProject.status || "قيد الانتظار";
    document.getElementById("editProjectStartDate").value = activeProject.start_date || "";
    document.getElementById("editProjectDueDate").value = activeProject.due_date || "";
    document.getElementById("editProjectImage").value = "";
    document.getElementById("editProjectModal").hidden = false;

});

document.getElementById("closeEditProjectBtn")?.addEventListener("click", closeEditProjectModal);
document.getElementById("cancelEditProjectBtn")?.addEventListener("click", closeEditProjectModal);

document.getElementById("editProjectForm")?.addEventListener("submit", async event => {

    event.preventDefault();

    if (!activeProject || !canManageProject()) return;

    const formData = new FormData();
    formData.append("title", document.getElementById("editProjectTitle").value.trim());
    formData.append("description", document.getElementById("editProjectDescription").value.trim());
    formData.append("Priority", document.getElementById("editProjectPriority").value);
    formData.append("status", document.getElementById("editProjectStatus").value);
    formData.append("start_date", document.getElementById("editProjectStartDate").value);
    formData.append("due_date", document.getElementById("editProjectDueDate").value);

    const image = document.getElementById("editProjectImage").files[0];
    if (image) formData.append("projectImage", image);

    try {

        const response = await fetch(
            `/projects/${activeProject.id}`,
            { method: "PATCH", credentials: "include", body: formData }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "فشل تحديث المشروع.");
        }

        activeProject = data.project;
        closeEditProjectModal();
        await openProjectWorkspace(activeProject.id);
        await loadProjects();
        showMessage("تم تحديث المشروع بنجاح.", "success");

    } catch (error) {

        showMessage(error.message || "حدث خطأ أثناء تحديث المشروع.", "error");

    }

});


// ==================================================
// INITIAL LOAD
// ==================================================

loadProjects();

// ==================================================
// INITIAL LOAD USERS
// ==================================================

loadUsersForProjectForm();


