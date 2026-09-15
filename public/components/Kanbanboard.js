// ==================================================
// TASK FORM
// ==================================================

const addTaskbtn =
    document.getElementById("addTaskbtn");

const taskform =
    document.getElementById("taskform");

const closeBtn =
    document.getElementById("closeBtn");

const createTaskbtn =
    document.getElementById("createTaskbtn");

const titletask =
    document.getElementById("titletask");

const taskdescription =
    document.getElementById("taskdescription");

const taskduedate =
    document.getElementById("taskduedate");

const taskPriority =
    document.getElementById("taskPriority");

const taskStatus =
    document.getElementById("taskStatus");

const taskMembersSelect =
    document.getElementById("taskMembersSelect");


// ==================================================
// FILE UPLOAD
// ==================================================

const uploadArea =
    document.getElementById("uploadArea");

const fileInput =
    document.getElementById("taskFiles");

const uploadStatus =
    document.getElementById("uploadStatus");

const fileList =
    document.getElementById("fileList");

let selectedTaskFiles = [];


// ==================================================
// TASK DETAILS
// ==================================================

const taskformshow =
    document.getElementById("taskformshow");

const btnTaskshowclose =
    document.getElementById("btnTaskshowclose");


// ==================================================
// COMMENTS & LINK MODAL
// ==================================================

const taskCommentsContainer =
    document.getElementById(
        "taskCommentsContainer"
    );

const taskCommentsCount =
    document.getElementById(
        "taskCommentsCount"
    );

const taskCommentInput =
    document.getElementById(
        "taskCommentInput"
    );

const btnTaskCommentSubmit =
    document.getElementById(
        "btnTaskCommentSubmit"
    );

const btnTaskCommentLink =
    document.getElementById(
        "btnTaskCommentLink"
    );

const taskCommentLinkModal =
    document.getElementById(
        "taskCommentLinkModal"
    );

const taskCommentLinkBackdrop =
    document.getElementById(
        "taskCommentLinkBackdrop"
    );

const commentLinkUrlInput =
    document.getElementById(
        "commentLinkUrlInput"
    );

const commentLinkTitleInput =
    document.getElementById(
        "commentLinkTitleInput"
    );

const btnCloseCommentLinkModal =
    document.getElementById(
        "btnCloseCommentLinkModal"
    );

const btnCommentLinkCancel =
    document.getElementById(
        "btnCommentLinkCancel"
    );

const btnCommentLinkInsert =
    document.getElementById(
        "btnCommentLinkInsert"
    );


// ==================================================
// CURRENT TASK
// ==================================================

let currentTaskId = null;


// ==================================================
// SELECTED TASK MEMBERS
// ==================================================
//
// هنا نحفظ IDs الأعضاء المختارين للتاسك
//

let selectedTaskMemberIds = [];

function getTaskMemberUser(member) {

    const user =
        Array.isArray(member?.users)
            ? member.users[0]
            : member?.users || member?.user || member || {};

    return {
        id: user.id || member?.user_id || member?.id,
        username: user.username || member?.username || "مستخدم"
    };

}


// ==================================================
// التحقق من صلاحية المستخدم
// ==================================================

async function checkTaskPermission() {

    try {

        const response =
            await fetch(
                "/user",
                {
                    credentials: "include"
                }
            );

        if (!response.ok) {
            return;
        }

        const user =
            await response.json();


        // العضو العادي لا يستطيع إضافة / تعديل / حذف التاسك

        if (user.role === "member") {

            if (addTaskbtn) {
                addTaskbtn.style.display = "none";
            }

            if (editTaskBtn) {
                editTaskBtn.style.display = "none";
            }

            if (deleteTaskBtn) {
                deleteTaskBtn.style.display = "none";
            }

        } else {

            if (addTaskbtn) {
                addTaskbtn.style.display = "block";
            }

            if (editTaskBtn) {
                editTaskBtn.style.display = "block";
            }

            if (deleteTaskBtn) {
                deleteTaskBtn.style.display = "block";
            }

        }

    }

    catch (error) {

        console.error(
            "Permission check error:",
            error
        );

    }

}


checkTaskPermission();


// ==================================================
// جلب أعضاء المشروع لفورم التاسك
// ==================================================

async function loadTaskMembers() {

    if (!taskMembersSelect) {
        return;
    }


    const projectId =
        localStorage.getItem(
            "currentProject"
        );


    if (!projectId) {

        taskMembersSelect.innerHTML = `
            <span class="members-empty">
                لم يتم تحديد المشروع
            </span>
        `;

        return;

    }


    // إعادة التصفير

    selectedTaskMemberIds = [];


    taskMembersSelect.innerHTML = `
        <span class="members-loading">
            جاري تحميل الأعضاء...
        </span>
    `;


    try {

        const response =
            await fetch(
                `/projects/${projectId}/members`,
                {
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "فشل تحميل أعضاء المشروع"
            );

        }




        const members =
            Array.isArray(data)
                ? data
                : data.members || [];


        taskMembersSelect.innerHTML = "";


        if (members.length === 0) {

            taskMembersSelect.innerHTML = `
                <span class="members-empty">
                    لا يوجد أعضاء في المشروع
                </span>
            `;

            return;

        }


        members.forEach(
            member => {

                const userId =
                    member.users?.id ||
                    member.user_id ||
                    member.id;

                const username =
                    member.users?.username ||
                    member.username ||
                    "مستخدم";

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "task-member-option";

                button.dataset.userId =
                    userId;

                button.dataset.username =
                    username;

                // Avatar
                const avatar =
                    document.createElement(
                        "span"
                    );


                // Username
                const name =
                    document.createElement(
                        "span"
                    );

                name.textContent =
                    username;


                button.appendChild(
                    name
                );

                // اختيار / إلغاء اختيار العضو
                button.addEventListener(
                    "click",
                    () => {

                        const uIdStr =
                            String(
                                userId
                            );

                        const alreadySelected =
                            selectedTaskMemberIds.includes(
                                uIdStr
                            );

                        if (alreadySelected) {

                            selectedTaskMemberIds =
                                selectedTaskMemberIds.filter(
                                    id =>
                                        id !== uIdStr
                                );

                            button.classList.remove(
                                "active"
                            );

                        } else {

                            selectedTaskMemberIds.push(
                                uIdStr
                            );

                            button.classList.add(
                                "active"
                            );

                        }

                    }
                );

                taskMembersSelect.appendChild(
                    button
                );

            }
        );

    }


    catch (error) {

        console.error(
            "Task members error:",
            error
        );


        taskMembersSelect.innerHTML = `
            <span class="members-error">
                تعذر تحميل أعضاء المشروع
            </span>
        `;

    }

}


// ==================================================
// إظهار فورم إنشاء المهمة
// ==================================================

if (addTaskbtn) {

    addTaskbtn.addEventListener(
        "click",
        async () => {

            if (taskform) {

                taskform.style.display =
                    "flex";

            }


            // ==================================================
            // تحميل أعضاء المشروع
            // ==================================================

            await loadTaskMembers();

        }
    );

}


// ==================================================
// إغلاق فورم إنشاء المهمة
// ==================================================

if (closeBtn) {

    closeBtn.addEventListener(
        "click",
        () => {

            if (taskform) {

                taskform.style.display =
                    "none";

            }

        }
    );

}


// ==================================================
// FILE UPLOAD MANAGEMENT
// ==================================================

function addFilesToTask(files) {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const exists = selectedTaskFiles.some(
            f => f.name === file.name && f.size === file.size
        );
        if (!exists) {
            selectedTaskFiles.push(file);
        }
    }
    renderSelectedTaskFiles();
}

function removeFileFromTask(index) {
    if (index >= 0 && index < selectedTaskFiles.length) {
        selectedTaskFiles.splice(index, 1);
        renderSelectedTaskFiles();
    }
}

function renderSelectedTaskFiles() {
    const fileListContainer =
        document.getElementById("fileList");
    if (!fileListContainer) return;

    fileListContainer.innerHTML = "";

    if (selectedTaskFiles.length === 0) {
        if (uploadStatus) {
            uploadStatus.className = "upload-status";
            uploadStatus.textContent = "";
        }
        return;
    }

    if (uploadStatus) {
        uploadStatus.className = "upload-status loading";
        uploadStatus.textContent = `📂 تم اختيار ${selectedTaskFiles.length} ملف، جاهز للرفع`;
    }

    selectedTaskFiles.forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "file-item";

        const iconName = getFileIconName(file.name, file.type);

        item.innerHTML = `
            <div class="file-item-info">
                <i data-lucide="${iconName}"></i>
                <div class="file-item-details">
                    <span class="file-item-name" title="${file.name}">${file.name}</span>
                    <span class="file-item-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
            <button type="button" class="btn-remove-file" title="إزالة الملف" data-file-index="${index}">
                <i data-lucide="x"></i>
            </button>
        `;

        const removeBtn = item.querySelector(".btn-remove-file");
        if (removeBtn) {
            removeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                removeFileFromTask(index);
            });
        }

        fileListContainer.appendChild(item);
    });

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

if (uploadArea && fileInput) {

    uploadArea.addEventListener(
        "click",
        async (e) => {
            if (
                e.target.closest(".btn-remove-file") ||
                e.target.closest(".file-item")
            ) {
                return;
            }
            fileInput.click();
        }
    );

    fileInput.addEventListener(
        "change",
        () => {
            if (fileInput.files && fileInput.files.length > 0) {
                addFilesToTask(fileInput.files);
            }
            fileInput.value = "";
        }
    );

    uploadArea.addEventListener(
        "dragover",
        (e) => {
            e.preventDefault();
            uploadArea.classList.add("dragover");
        }
    );

    uploadArea.addEventListener(
        "dragleave",
        () => {
            uploadArea.classList.remove("dragover");
        }
    );

    uploadArea.addEventListener(
        "drop",
        (e) => {
            e.preventDefault();
            uploadArea.classList.remove("dragover");

            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                addFilesToTask(e.dataTransfer.files);
            }
        }
    );

}



// ==================================================
// إنشاء المهمة
// ==================================================

if (createTaskbtn) {

    createTaskbtn.addEventListener(
        "click",
        async (e) => {

            e.preventDefault();


            const projectId =
                localStorage.getItem(
                    "currentProject"
                );


            if (!projectId) {

                showMessage(
                    "لم يتم تحديد المشروع",
                    "warning"
                );

                return;

            }


            // ==================================================
            // التأكد من العنوان
            // ==================================================

            const titleValue =
                titletask?.value.trim() ||
                "";


            if (!titleValue) {

                showMessage(
                    "يرجى إدخال عنوان المهمة",
                    "warning"
                );

                return;

            }


            // ==================================================
            // FormData
            // ==================================================

            const formData =
                new FormData();


            formData.append(
                "title",
                titleValue
            );


            formData.append(
                "description",
                taskdescription?.value || ""
            );


            formData.append(
                "due_date",
                taskduedate?.value || ""
            );


            formData.append(
                "Priority",
                taskPriority?.value || ""
            );


            formData.append(
                "status",
                taskStatus?.value || ""
            );


            formData.append(
                "projectId",
                projectId
            );


            // ==================================================
            // أعضاء التاسك
            // ==================================================
            //
            // نرسل IDs الأعضاء المختارين
            //
            // مثال:
            // ["4","7","12"]
            //

            formData.append(
                "memberIds",
                JSON.stringify(
                    selectedTaskMemberIds
                )
            );


            // ==================================================
            // الملفات
            // ==================================================

            if (selectedTaskFiles && selectedTaskFiles.length > 0) {

                for (
                    const file of
                    selectedTaskFiles
                ) {

                    formData.append(
                        "files",
                        file
                    );

                }

            }


            try {

                createTaskbtn.disabled =
                    true;


                const response =
                    await fetch(
                        "/addtask",
                        {

                            method: "POST",

                            body: formData,

                            credentials:
                                "include"

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    showMessage(
                        data.message ||
                        "فشل إنشاء المهمة",
                        "error"
                    );

                    return;

                }


                // ==================================================
                // نجاح
                // ==================================================

                showMessage(
                    "تم إنشاء المهمة بنجاح",
                    "success"
                );


                // ==================================================
                // إغلاق الفورم
                // ==================================================

                if (taskform) {

                    taskform.style.display =
                        "none";

                }


                // ==================================================
                // تنظيف البيانات
                // ==================================================

                if (titletask) {

                    titletask.value =
                        "";

                }


                if (taskdescription) {

                    taskdescription.value =
                        "";

                }


                if (taskduedate) {

                    taskduedate.value =
                        "";

                }


                if (taskPriority) {

                    taskPriority.selectedIndex =
                        0;

                }


                if (taskStatus) {

                    taskStatus.selectedIndex =
                        0;

                }


                if (fileInput) {

                    fileInput.value =
                        "";

                }

                selectedTaskFiles = [];
                renderSelectedTaskFiles();

                if (uploadStatus) {

                    uploadStatus.textContent =
                        "";

                    uploadStatus.className =
                        "upload-status";

                }


                // ==================================================
                // تنظيف أعضاء التاسك
                // ==================================================

                selectedTaskMemberIds =
                    [];


                if (taskMembersSelect) {

                    taskMembersSelect
                        .querySelectorAll(
                            ".task-member-option.selected"
                        )
                        .forEach(
                            button => {

                                button.classList.remove(
                                    "selected"
                                );

                            }
                        );

                }


                // ==================================================
                // تحديث Kanban بدون Reload
                // ==================================================

                await loadKanbanProject();

            }


            catch (error) {

                console.error(
                    "Create task error:",
                    error
                );


                showMessage(
                    "حدث خطأ أثناء إنشاء المهمة",
                    "error"
                );

            }


            finally {

                createTaskbtn.disabled =
                    false;

            }

        }
    );

}


// ==================================================
// EDIT / DELETE TASK
// ==================================================

const editTaskBtn =
    document.getElementById(
        "editTaskBtn"
    );

const deleteTaskBtn =
    document.getElementById(
        "deleteTaskBtn"
    );

const editTaskForm =
    document.getElementById(
        "editTaskForm"
    );

const editTaskTitle =
    document.getElementById(
        "editTaskTitle"
    );

const editTaskDescription =
    document.getElementById(
        "editTaskDescription"
    );

const editTaskDueDate =
    document.getElementById(
        "editTaskDueDate"
    );

const editTaskPriority =
    document.getElementById(
        "editTaskPriority"
    );

const editTaskStatus =
    document.getElementById(
        "editTaskStatus"
    );

const saveTaskEditBtn =
    document.getElementById(
        "saveTaskEditBtn"
    );

const cancelTaskEditBtn =
    document.getElementById(
        "cancelTaskEditBtn"
    );

const editTaskMembersSelect =
    document.getElementById("editTaskMembersSelect");

const editTaskFiles =
    document.getElementById("editTaskFiles");

const editTaskAttachments =
    document.getElementById("editTaskAttachments");

const editTaskNewFiles =
    document.getElementById("editTaskNewFiles");

let editingTaskMemberIds = [];
let editingTaskAttachments = [];
let editingTaskNewFiles = [];


async function loadEditTaskMembers(initialMembers = []) {

    if (!editTaskMembersSelect) return;

    editingTaskMemberIds = initialMembers
        .map(member => String(getTaskMemberUser(member).id || ""))
        .filter(Boolean);

    editTaskMembersSelect.innerHTML = "جارٍ تحميل أعضاء المشروع...";

    const projectId = localStorage.getItem("currentProject");

    if (!projectId) {

        editTaskMembersSelect.textContent = "لم يتم تحديد المشروع.";
        return;

    }

    try {

        const response = await fetch(
            `/projects/${projectId}/members`,
            { credentials: "include" }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "فشل تحميل الأعضاء.");
        }

        const members = Array.isArray(data) ? data : data.members || [];

        editTaskMembersSelect.innerHTML = "";

        if (!members.length) {

            editTaskMembersSelect.textContent = "لا يوجد أعضاء في المشروع.";
            return;

        }

        members.forEach(member => {

            const user = getTaskMemberUser(member);

            if (!user.id) return;

            const button = document.createElement("button");
            const memberId = String(user.id);

            button.type = "button";
            button.className = "edit-task-member-option";
            button.textContent = user.username;
            button.classList.toggle(
                "active",
                editingTaskMemberIds.includes(memberId)
            );

            button.addEventListener("click", () => {

                if (editingTaskMemberIds.includes(memberId)) {

                    editingTaskMemberIds = editingTaskMemberIds.filter(
                        id => id !== memberId
                    );

                } else {

                    editingTaskMemberIds.push(memberId);

                }

                button.classList.toggle(
                    "active",
                    editingTaskMemberIds.includes(memberId)
                );

            });

            editTaskMembersSelect.appendChild(button);

        });

    } catch (error) {

        console.error("Edit task members error:", error);
        editTaskMembersSelect.textContent = "تعذر تحميل أعضاء المشروع.";

    }

}


function renderEditTaskAttachments() {

    if (!editTaskAttachments || !editTaskNewFiles) return;

    editTaskAttachments.innerHTML = "";
    editTaskNewFiles.innerHTML = "";

    if (!editingTaskAttachments.length) {

        editTaskAttachments.textContent = "لا توجد ملفات مرفقة.";

    } else {

        editingTaskAttachments.forEach((attachment, index) => {

            const item = document.createElement("div");
            item.className = "edit-task-file-item";

            const name = document.createElement("span");
            name.textContent = attachment.name || "ملف مرفق";

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "إزالة";
            remove.addEventListener("click", () => {
                editingTaskAttachments.splice(index, 1);
                renderEditTaskAttachments();
            });

            item.append(name, remove);
            editTaskAttachments.appendChild(item);

        });

    }

    editingTaskNewFiles.forEach((file, index) => {

        const item = document.createElement("div");
        item.className = "edit-task-file-item is-new";

        const name = document.createElement("span");
        name.textContent = `ملف جديد: ${file.name}`;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "إزالة";
        remove.addEventListener("click", () => {
            editingTaskNewFiles.splice(index, 1);
            renderEditTaskAttachments();
        });

        item.append(name, remove);
        editTaskNewFiles.appendChild(item);

    });

}


editTaskFiles?.addEventListener("change", () => {

    editingTaskNewFiles.push(...Array.from(editTaskFiles.files || []));
    editTaskFiles.value = "";
    renderEditTaskAttachments();

});


// ==================================================
// فتح فورم التعديل
// ==================================================

if (editTaskBtn) {

    editTaskBtn.addEventListener(
        "click",
        async (e) => {

            e.preventDefault();
            e.stopPropagation();


            if (!currentTaskId) {

                showMessage(
                    "لم يتم تحديد المهمة.",
                    "warning"
                );

                return;

            }


            const taskElement =
                document.querySelector(
                    `.Kanban-task[data-task-id="${currentTaskId}"]`
                );


            if (!taskElement) {

                showMessage(
                    "لم يتم العثور على عنصر التاسك.",
                    "error"
                );

                return;

            }


            if (editTaskTitle) {

                editTaskTitle.value =
                    taskElement.dataset.title ||
                    "";

            }


            if (editTaskDescription) {

                editTaskDescription.value =
                    taskElement.dataset.description ||
                    "";

            }


            if (editTaskDueDate) {

                editTaskDueDate.value =
                    taskElement.dataset.dueDate ||
                    "";

            }


            if (editTaskPriority) {

                editTaskPriority.value =
                    taskElement.dataset.priority ||
                    "";

            }


            if (editTaskStatus) {

                editTaskStatus.value =
                    taskElement.dataset.status ||
                    "";

            }

            let taskMembers = [];

            try {

                taskMembers = JSON.parse(
                    taskElement.dataset.members || "[]"
                );

            } catch {

                taskMembers = [];

            }

            editingTaskAttachments = parseTaskAttachments(
                taskElement.dataset.attachmentUrl || ""
            );

            editingTaskNewFiles = [];

            renderEditTaskAttachments();

            await loadEditTaskMembers(taskMembers);


            if (editTaskForm) {

                editTaskForm.style.display =
                    "flex";

            }

        }
    );

}


// ==================================================
// إغلاق فورم التعديل
// ==================================================

if (cancelTaskEditBtn) {

    cancelTaskEditBtn.addEventListener(
        "click",
        (e) => {

            e.preventDefault();


            if (editTaskForm) {

                editTaskForm.style.display =
                    "none";

            }

        }
    );

}


// ==================================================
// حفظ التعديل
// ==================================================

if (saveTaskEditBtn) {

    saveTaskEditBtn.addEventListener(
        "click",
        async (e) => {

            e.preventDefault();


            if (!currentTaskId) {

                showMessage(
                    "لم يتم تحديد المهمة.",
                    "warning"
                );

                return;

            }


            const updatedData = {

                title: editTaskTitle?.value.trim() || "",
                description: editTaskDescription?.value.trim() || "",
                due_date: editTaskDueDate?.value || "",
                Priority: editTaskPriority?.value || "",
                status: editTaskStatus?.value || ""

            };


            if (!updatedData.title) {

                showMessage(
                    "يرجى إدخال عنوان المهمة.",
                    "warning"
                );

                return;

            }


            try {

                saveTaskEditBtn.disabled =
                    true;


                const formData = new FormData();

                Object.entries(updatedData).forEach(([key, value]) => {
                    formData.append(key, value);
                });

                formData.append(
                    "memberIds",
                    JSON.stringify(editingTaskMemberIds)
                );

                formData.append(
                    "existingAttachments",
                    JSON.stringify(editingTaskAttachments)
                );

                editingTaskNewFiles.forEach(file => {
                    formData.append("files", file);
                });

                const response = await fetch(
                    `/tasks/${currentTaskId}`,
                    {
                        method: "PATCH",
                        credentials: "include",
                        body: formData
                    }
                );


                const data =
                    await response.json();


                if (!response.ok) {

                    showMessage(
                        data.message ||
                        "فشل تعديل المهمة.",
                        "error"
                    );

                    return;

                }


                if (editTaskForm) {

                    editTaskForm.style.display =
                        "none";

                }


                await loadKanbanProject();


                const updatedTask =
                    document.querySelector(
                        `.Kanban-task[data-task-id="${currentTaskId}"]`
                    );


                if (updatedTask) {

                    openTaskDetails(
                        updatedTask
                    );

                }


                showMessage(
                    "تم تعديل المهمة بنجاح",
                    "success"
                );

            }


            catch (error) {

                console.error(
                    "Edit task error:",
                    error
                );


                showMessage(
                    "حدث خطأ أثناء تعديل المهمة.",
                    "error"
                );

            }


            finally {

                saveTaskEditBtn.disabled =
                    false;

            }

        }
    );

}


// ==================================================
// DELETE TASK CONFIRMATION
// ==================================================

const deleteConfirmOverlay =
    document.getElementById(
        "deleteConfirmOverlay"
    );

const cancelDeleteBtn =
    document.getElementById(
        "cancelDeleteBtn"
    );

const confirmDeleteBtn =
    document.getElementById(
        "confirmDeleteBtn"
    );


// ==================================================
// فتح فورم التأكيد
// ==================================================

function openDeleteConfirm() {

    if (!deleteConfirmOverlay) {
        return;
    }


    deleteConfirmOverlay.classList.add(
        "show"
    );

}


// ==================================================
// إغلاق فورم التأكيد
// ==================================================

function closeDeleteConfirm() {

    if (!deleteConfirmOverlay) {
        return;
    }


    deleteConfirmOverlay.classList.remove(
        "show"
    );

}


// ==================================================
// زر DELETE الأساسي
// ==================================================

if (deleteTaskBtn) {

    deleteTaskBtn.addEventListener(
        "click",
        () => {

            if (!currentTaskId) {

                showMessage(
                    "لم يتم تحديد المهمة.",
                    "warning"
                );

                return;

            }


            openDeleteConfirm();

        }
    );

}


// ==================================================
// إلغاء الحذف
// ==================================================

if (cancelDeleteBtn) {

    cancelDeleteBtn.addEventListener(
        "click",
        () => {

            closeDeleteConfirm();

        }
    );

}


// ==================================================
// الضغط خارج الفورم
// ==================================================

if (deleteConfirmOverlay) {

    deleteConfirmOverlay.addEventListener(
        "click",
        (e) => {

            if (
                e.target ===
                deleteConfirmOverlay
            ) {

                closeDeleteConfirm();

            }

        }
    );

}


// ==================================================
// تأكيد الحذف
// ==================================================

if (confirmDeleteBtn) {

    confirmDeleteBtn.addEventListener(
        "click",
        async () => {

            if (!currentTaskId) {

                closeDeleteConfirm();

                return;

            }


            try {

                confirmDeleteBtn.disabled =
                    true;

                confirmDeleteBtn.textContent =
                    "جاري الحذف...";


                const response =
                    await fetch(
                        `/tasks/${currentTaskId}`,
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
                        "فشل حذف التاسك",
                        "error"
                    );

                    return;

                }


                closeDeleteConfirm();


                if (taskformshow) {

                    taskformshow.style.display =
                        "none";

                }


                currentTaskId =
                    null;


                await loadKanbanProject();


                showMessage(
                    "تم حذف التاسك بنجاح",
                    "success"
                );

            }


            catch (error) {

                console.error(
                    "Delete task error:",
                    error
                );


                showMessage(
                    "حدث خطأ أثناء حذف التاسك",
                    "error"
                );

            }


            finally {

                confirmDeleteBtn.disabled =
                    false;

                confirmDeleteBtn.textContent =
                    "حذف التاسك";

            }

        }
    );

}


// ==================================================
// PRIORITY CLASS
// ==================================================

function getPriorityClass(priority) {

    const value =
        String(priority || "")
            .trim()
            .toLowerCase();


    switch (value) {

        case "عاجل":

            return "priority-div-red";


        case "متوسطة":

            return "priority-div-blue";


        case "منخفضة":

            return "priority-div-gray";


        default:

            return "priority-div-gray";

    }

}

// ==================================================
// FORMAT FILE SIZE
// ==================================================

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ==================================================
// FILE ICON NAME
// ==================================================

function getFileIconName(filename, mimetype) {
    const ext = (filename || "").split(".").pop().toLowerCase();
    if (mimetype?.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
        return "image";
    }
    if (["pdf"].includes(ext)) {
        return "file-text";
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
        return "archive";
    }
    if (["doc", "docx", "txt", "rtf"].includes(ext)) {
        return "file-text";
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
        return "file-spreadsheet";
    }
    return "file";
}

// ==================================================
// PARSE ATTACHMENTS
// ==================================================

function parseTaskAttachments(attachmentData) {
    if (!attachmentData) return [];
    let items = [];
    if (Array.isArray(attachmentData)) {
        items = attachmentData;
    } else if (typeof attachmentData === "string") {
        const trimmed = attachmentData.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
                items = JSON.parse(trimmed);
            } catch (e) {
                console.error("Failed to parse attachments JSON:", e);
            }
        } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            const rawName = trimmed.split("/").pop().split("?")[0];
            const decodedName = decodeURIComponent(rawName || "ملف مرفق");
            const cleanName = decodedName.replace(/^\d+_[a-z0-9]+_/, '').replace(/^\d+\s*-\s*/, '').trim();
            items = [{
                name: cleanName || "ملف مرفق",
                url: trimmed,
                size: 0,
                type: ""
            }];
        }
    }

    return items.map(item => {
        const cleanUrl = (item.url || "").trim().replace(/%20$/, '');
        return {
            ...item,
            url: cleanUrl
        };
    });
}

// ==================================================
// FORMAT DISPLAY DATE
// ==================================================

function formatDisplayDate(dateStr) {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    } catch (e) {
        return dateStr;
    }
}



// ==================================================
// تحويل الروابط داخل الوصف
// ==================================================

function formatDescription(text) {

    const value =
        String(text ?? "");


    const container =
        document.createElement("div");


    const hrefRegex =
        /href=["'](https?:\/\/[^"']+)["']/gi;


    let lastIndex = 0;

    let match;


    while (
        (match =
            hrefRegex.exec(value)) !== null
    ) {

        const before =
            value.substring(
                lastIndex,
                match.index
            );


        if (before) {

            container.appendChild(
                document.createTextNode(
                    before
                )
            );

        }


        const url =
            match[1];


        const link =
            document.createElement("a");


        link.className =
            "task-link";


        link.href =
            url;


        link.target =
            "_blank";


        link.rel =
            "noopener noreferrer";


        link.textContent =
            url;


        container.appendChild(
            link
        );


        lastIndex =
            hrefRegex.lastIndex;

    }


    const after =
        value.substring(
            lastIndex
        );


    if (after) {

        container.appendChild(
            document.createTextNode(
                after
            )
        );

    }


    if (
        !value.match(
            /href=["'](https?:\/\/[^"']+)["']/i
        )
    ) {

        container.innerHTML =
            "";


        const normalRegex =
            /https?:\/\/[^\s<>"']+/gi;


        let normalLast = 0;

        let normalMatch;


        while (
            (normalMatch =
                normalRegex.exec(value)) !== null
        ) {

            const before =
                value.substring(
                    normalLast,
                    normalMatch.index
                );


            if (before) {

                container.appendChild(
                    document.createTextNode(
                        before
                    )
                );

            }


            const url =
                normalMatch[0];


            const link =
                document.createElement("a");


            link.className =
                "task-link";


            link.href =
                url;


            link.target =
                "_blank";


            link.rel =
                "noopener noreferrer";


            link.textContent =
                url;


            container.appendChild(
                link
            );


            normalLast =
                normalMatch.index +
                normalMatch[0].length;

        }


        const remaining =
            value.substring(
                normalLast
            );


        if (remaining) {

            container.appendChild(
                document.createTextNode(
                    remaining
                )
            );

        }

    }


    return container.innerHTML;

}


// ==================================================
// KANBAN BOARD
// ==================================================

async function loadKanbanProject() {

    const projectId =
        localStorage.getItem(
            "currentProject"
        );


    if (!projectId) {
        return;
    }


    try {

        // ==================================================
        // جلب المشروع
        // ==================================================

        const projectResponse = await fetch(
            `/projects/${projectId}`,
            {
                credentials: "include"
            }
        );

        // المشروع غير موجود أو المستخدم ما عنده صلاحية
        if (!projectResponse.ok) {

            console.warn(
                `Project ${projectId} غير متاح. سيتم حذف المشروع الحالي من localStorage.`
            );

            localStorage.removeItem("currentProject");

            const projectName =
                document.getElementById("projectName");

            if (projectName) {
                projectName.textContent = "";
            }

            return;
        }

        const project = await projectResponse.json();

        const projectName =
            document.getElementById("projectName");

        if (projectName && project) {

            projectName.textContent =
                project.ProjectTitle || "";

        }

        // ==================================================
        // جلب التاسكات
        // ==================================================

        const tasksResponse =
            await fetch(
                `/tasks/${projectId}`,
                {
                    credentials:
                        "include"
                }
            );


        const tasks =
            await tasksResponse.json();


        if (!Array.isArray(tasks)) {

            const workspaceError =
                document.getElementById("workspaceTasksError");

            if (workspaceError) {
                workspaceError.textContent =
                    tasks.message ||
                    "تعذر تحميل مهام المشروع.";
                workspaceError.hidden = false;
            }

            showMessage(
                tasks.message ||
                "تعذر تحميل المهام",
                "error"
            );

            return;

        }

        const workspaceError =
            document.getElementById("workspaceTasksError");

        if (workspaceError) {
            workspaceError.hidden = true;
        }

        const workspaceEmpty =
            document.getElementById("workspaceTasksEmpty");

        if (workspaceEmpty) {
            workspaceEmpty.hidden = tasks.length !== 0;
        }


        // ==================================================
        // الأعمدة
        // ==================================================

        const todoColumn =
            document.getElementById(
                "todo-column"
            );

        const progressColumn =
            document.getElementById(
                "progress-column"
            );

        const doneColumn =
            document.getElementById(
                "done-column"
            );

        const reviewColumn =
            document.getElementById(
                "review-column"
            );
        const doneshowColumn =
            document.getElementById(
                "doneshow-column"
            );


        if (
            !todoColumn ||
            !progressColumn ||
            !doneColumn ||
            !reviewColumn ||
            !doneshowColumn
        ) {

            return;

        }


        // ==================================================
        // تنظيف الأعمدة
        // ==================================================

        todoColumn.innerHTML =
            "";

        progressColumn.innerHTML =
            "";

        doneColumn.innerHTML =
            "";

        reviewColumn.innerHTML =
            "";
        doneshowColumn.innerHTML =
            "";


        // ==================================================
        // إنشاء جميع التاسكات
        // ==================================================

        tasks.forEach(
            task => {

                let column;


                switch (task.status) {

                    case "قيد الانتظار":

                        column =
                            todoColumn;

                        break;


                    case "قيد التنفيذ":

                        column =
                            progressColumn;

                        break;


                    case "قيد المراجعة":

                        column =
                            reviewColumn;

                        break;


                    case "مكتمل":

                        column =
                            doneColumn;

                        break;
                    case "تم التسليم":

                        column =
                            doneshowColumn;

                        break;


                    default:


                }


                // ==================================================
                // عنصر التاسك
                // ==================================================

                const taskElement =
                    document.createElement(
                        "div"
                    );


                taskElement.className =
                    "Kanban-task";


                taskElement.draggable =
                    true;


                // ==================================================
                // Data
                // ==================================================

                taskElement.dataset.taskId =
                    task.id;


                taskElement.dataset.status =
                    task.status || "";


                taskElement.dataset.title =
                    task.Title || "";


                taskElement.dataset.description =
                    task.description || "";


                taskElement.dataset.priority =
                    task.Priority || "";

                taskElement.dataset.dueDate =
                    task["Due Date"] ||
                    task.due_date ||
                    "";

                taskElement.dataset.members =
                    JSON.stringify(
                        task.task_members || []
                    );

                // ==================================================
                // Priority
                // ==================================================

                const priorityClass =
                    getPriorityClass(
                        task.Priority
                    );


                const priorityDiv =
                    document.createElement(
                        "div"
                    );


                priorityDiv.className =
                    `priority-div ${priorityClass}`;


                const priorityText =
                    document.createElement(
                        "p"
                    );


                priorityText.className =
                    "priority";


                priorityText.textContent =
                    task.Priority || "";


                priorityDiv.appendChild(
                    priorityText
                );


                // ==================================================
                // Title
                // ==================================================

                const title =
                    document.createElement(
                        "h4"
                    );


                title.className =
                    "title-task";


                title.textContent =
                    task.Title || "";


                // ==================================================
                // Description
                // ==================================================

                const description =
                    document.createElement(
                        "p"
                    );


                description.className =
                    "description-task";


                description.innerHTML =
                    formatDescription(
                        task.description
                    );


                // ==================================================
                // Status
                // ==================================================

                const statusDiv =
                    document.createElement(
                        "div"
                    );


                statusDiv.className =
                    "priority-div";


                const statusText =
                    document.createElement(
                        "p"
                    );


                statusText.className =
                    "task-taype";


                statusText.textContent =
                    task.status || "";


                statusDiv.appendChild(
                    statusText
                );


                // ==================================================
                // Append
                // ==================================================

                taskElement.appendChild(
                    priorityDiv
                );


                taskElement.appendChild(
                    title
                );


                taskElement.appendChild(
                    description
                );


                taskElement.appendChild(
                    statusDiv
                );


                // ==================================================
                // Members on Card
                // ==================================================

                const cardMembers =
                    task.task_members || [];

                if (cardMembers.length > 0) {

                    const membersDiv =
                        document.createElement(
                            "div"
                        );

                    membersDiv.className =
                        "task-card-members";

                    membersDiv.style.cssText =
                        "display: flex; gap: 4px; margin-top: 10px; align-items: center; flex-wrap: wrap;";

                    cardMembers.forEach(
                        tm => {

                            const uName =
                                getTaskMemberUser(tm).username;

                            const avatarBadge =
                                document.createElement(
                                    "span"
                                );

                            avatarBadge.className =
                                "avatar avatar--sm";

                            avatarBadge.title =
                                uName;

                            avatarBadge.textContent =
                                (
                                    uName || "م"
                                ).charAt(0).toUpperCase();

                            avatarBadge.style.cssText =
                                "width: 24px; height: 24px; font-size: 10px; cursor: default;";

                            membersDiv.appendChild(
                                avatarBadge
                            );

                        }
                    );

                    taskElement.appendChild(
                        membersDiv
                    );

                }

                // ==================================================
                // Attachment URL & Due Date Data
                // ==================================================

                taskElement.dataset.attachmentUrl =
                    task.attachment_url || "";

                const taskDueDate =
                    task["Due Date"] ||
                    task.due_date ||
                    "";

                const taskAttachments =
                    parseTaskAttachments(task.attachment_url);

                // ==================================================
                // Card Footer (Date & Attachments)
                // ==================================================

                if (taskDueDate || taskAttachments.length > 0) {

                    const footerDiv =
                        document.createElement("div");

                    footerDiv.className =
                        "task-card-meta-footer";

                    if (taskDueDate) {

                        const dateBadge =
                            document.createElement("span");

                        dateBadge.className =
                            "task-card-date-badge";

                        dateBadge.innerHTML =
                            `<i data-lucide="calendar"></i> <span>${formatDisplayDate(taskDueDate)}</span>`;

                        footerDiv.appendChild(dateBadge);

                    }

                    if (taskAttachments.length > 0) {

                        const attachBadge =
                            document.createElement("span");

                        attachBadge.className =
                            "task-card-attach-badge";

                        attachBadge.innerHTML =
                            `<i data-lucide="paperclip"></i> <span>${taskAttachments.length}</span>`;

                        footerDiv.appendChild(attachBadge);

                    }

                    taskElement.appendChild(footerDiv);

                }



                column.appendChild(
                    taskElement
                );

            }
        );

        window.refreshProjectWorkspaceSummary?.();

    }


    catch (error) {

        console.error(
            "Kanban load error:",
            error
        );


        showMessage(
            "تعذر تحميل بيانات المشروع",
            "error"
        );

        const workspaceError =
            document.getElementById("workspaceTasksError");

        if (workspaceError) {
            workspaceError.textContent =
                "تعذر تحميل مهام المشروع. حاول مرة أخرى.";
            workspaceError.hidden = false;
        }

    }

}


// ==================================================
// تشغيل اللوحة
// ==================================================

loadKanbanProject();


// ==================================================
// فتح تفاصيل التاسك
// ==================================================

window.openTaskDetails = function (
    taskElement
) {

    if (!taskElement) {
        return;
    }


    if (
        document.body.classList.contains(
            "is-dragging-task"
        )
    ) {

        return;

    }


    const taskId =
        taskElement.dataset.taskId;


    const title =
        taskElement.dataset.title ||
        "";


    const description =
        taskElement.dataset.description ||
        "";


    currentTaskId =
        taskId;


    if (showTaskTitle) {

        showTaskTitle.textContent =
            title ||
            "بدون عنوان";

    }


    if (showTaskDescription) {

        showTaskDescription.innerHTML =
            formatDescription(
                description
            );

    }


    // ==================================================
    // الأعضاء المسندين للمهمة
    // ==================================================

    let taskMembers = [];

    try {

        taskMembers =
            JSON.parse(
                taskElement.dataset.members || "[]"
            );

    } catch (e) {

        taskMembers = [];

    }

    const countSpan =
        document.getElementById(
            "taskShowMembersCount"
        );

    const listContainer =
        document.getElementById(
            "taskShowMembersList"
        );

    if (countSpan) {

        countSpan.textContent =
            taskMembers.length;

    }

    if (listContainer) {

        listContainer.innerHTML = "";

        if (taskMembers.length === 0) {

            listContainer.innerHTML = `
                <span class="members-empty" style="color: rgba(255,255,255,0.5); font-size: 13px; padding: 8px; display: block;">
                    لا يوجد أعضاء مسندين لهذه المهمة
                </span>
            `;

        } else {

            taskMembers.forEach(
                tm => {

                    const username =
                        getTaskMemberUser(tm).username;

                    const initial = username;

                    const memberItem =
                        document.createElement(
                            "div"
                        );

                    memberItem.className =
                        "task-form-show-members";

                    memberItem.innerHTML = `
                        <span class="avatar avatar--md">
                            ${initial}
                        </span>
                        <div class="member-info">
                            <strong>${username}</strong>
                            <span>عضو في المهمة</span>
                        </div>
                    `;

                    listContainer.appendChild(
                        memberItem
                    );

                }
            );

        }

    }


    // ==================================================
    // تاريخ المهمة والأولوية والحالة
    // ==================================================

    const dueDate =
        taskElement.dataset.dueDate || "";

    const priority =
        taskElement.dataset.priority || "";

    const status =
        taskElement.dataset.status || "";

    const showTaskDueDate =
        document.getElementById("showTaskDueDate");

    const showTaskPriority =
        document.getElementById("showTaskPriority");

    const showTaskStatus =
        document.getElementById("showTaskStatus");

    if (showTaskDueDate) {
        showTaskDueDate.textContent =
            dueDate ? formatDisplayDate(dueDate) : "غير محدد";
    }

    if (showTaskPriority) {
        showTaskPriority.textContent =
            priority || "عادية";
        showTaskPriority.className =
            "task-meta-badge " + getPriorityClass(priority);
    }

    if (showTaskStatus) {
        showTaskStatus.textContent =
            status || "قيد الانتظار";
    }

    // ==================================================
    // الملفات المرفقة
    // ==================================================

    const attachmentUrl =
        taskElement.dataset.attachmentUrl || "";

    const attachments =
        parseTaskAttachments(attachmentUrl);

    const attachmentsCount =
        document.getElementById("showTaskAttachmentsCount");

    const attachmentsList =
        document.getElementById("showTaskAttachmentsList");

    if (attachmentsCount) {
        attachmentsCount.textContent =
            attachments.length;
    }

    if (attachmentsList) {
        attachmentsList.innerHTML = "";

        if (attachments.length === 0) {
            attachmentsList.innerHTML = `
                <div class="attachments-empty">
                    <i data-lucide="paperclip"></i>
                    <span>لا توجد ملفات مرفقة مع هذه المهمة</span>
                </div>
            `;
        } else {
            attachments.forEach(att => {
                const isImg = att.type?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(att.url || att.name);
                const item = document.createElement("div");
                item.className = "task-attachment-item";

                const iconName = getFileIconName(att.name, att.type);

                if (isImg) {
                    item.classList.add("is-image");
                    item.innerHTML = `
                        <div class="task-attachment-preview">
                            <img src="${att.url}" alt="${att.name}" loading="lazy" />
                        </div>
                        <div class="task-attachment-info">
                            <span class="task-attachment-name" title="${att.name}">${att.name}</span>
                            <div class="task-attachment-actions">
                                <a href="${att.url}" target="_blank" rel="noopener noreferrer" class="btn-attachment-action" title="فتح الصورة">
                                    <i data-lucide="external-link"></i> معاينة
                                </a>
                                <a href="/tasks/attachment/download?url=${encodeURIComponent(att.url)}&filename=${encodeURIComponent(att.name)}" target="_blank" class="btn-attachment-action btn-download" title="تحميل">
                                    <i data-lucide="download"></i> تحميل
                                </a>
                            </div>
                        </div>
                    `;
                } else {
                    item.innerHTML = `
                        <div class="task-attachment-icon">
                            <i data-lucide="${iconName}"></i>
                        </div>
                        <div class="task-attachment-info">
                            <span class="task-attachment-name" title="${att.name}">${att.name}</span>
                            ${att.size ? `<span class="task-attachment-size">${formatFileSize(att.size)}</span>` : ''}
                        </div>
                        <div class="task-attachment-actions">
                            <a href="${att.url}" target="_blank" rel="noopener noreferrer" class="btn-attachment-action" title="فتح الملف">
                                <i data-lucide="external-link"></i>
                            </a>
                            <a href="/tasks/attachment/download?url=${encodeURIComponent(att.url)}&filename=${encodeURIComponent(att.name)}" target="_blank" class="btn-attachment-action btn-download" title="تحميل الملف">
                                <i data-lucide="download"></i>
                            </a>
                        </div>
                    `;
                }

                attachmentsList.appendChild(item);
            });
        }
    }

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }



    if (taskformshow) {

        taskformshow.style.display =
            "block";

    }


    loadTaskComments(
        currentTaskId
    );

}


// ==================================================
// Event Delegation - فتح التاسك
// ==================================================

document.addEventListener(
    "click",
    (e) => {

        const task =
            e.target.closest(
                ".Kanban-task"
            );


        if (!task) {
            return;
        }


        if (
            e.target.closest(
                ".task-link"
            )
        ) {

            return;

        }


        window.openTaskDetails(
            task
        );

    }
);


// ==================================================
// إغلاق تفاصيل التاسك
// ==================================================

if (
    btnTaskshowclose &&
    taskformshow
) {

    btnTaskshowclose.addEventListener(
        "click",
        () => {

            taskformshow.style.display =
                "none";


            currentTaskId =
                null;

        }
    );

}

// ==================================================
// فتح Task من الإشعار
// ==================================================

window.openTaskFromNotification = function (
    taskId
) {

    if (!taskId) {
        return;
    }


    const task =
        document.querySelector(
            `.Kanban-task[data-task-id="${CSS.escape(String(taskId))}"]`
        );


    if (!task) {

        console.warn(
            `⚠️ Task ${taskId} غير موجودة حاليًا في الـ Kanban`
        );

        return;

    }


    // ================================================
    // فتح نفس نافذة تفاصيل التاسك الطبيعية
    // ================================================

    window.openTaskDetails(
        task
    );

};
// ==================================================
// استخراج نطاق الموقع (Domain)
// ==================================================

function getDomainFromUrl(urlStr) {
    try {
        const fullUrl = (urlStr.startsWith("http://") || urlStr.startsWith("https://"))
            ? urlStr
            : `https://${urlStr}`;
        const parsed = new URL(fullUrl);
        return parsed.hostname.replace(/^www\./, "");
    } catch (e) {
        return "";
    }
}


// ==================================================
// حماية النص
// ==================================================

function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==================================================
// تنسيق محتوى التعليق وتحويل الروابط لعناصر تفاعلية
// ==================================================

function formatCommentContent(text) {
    if (!text) return "";

    // 1. حماية وتشفير أي HTML غير آمن أولاً
    let safe = escapeHtml(text);

    // 2. معالجة روابط الماركداون: [النص](الرابط)
    safe = safe.replace(
        /\[([^\]]+)\]\(((?:https?:\/\/)[^\s\)]+)\)/gi,
        (match, label, url) => {
            const domain = getDomainFromUrl(url);
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="comment-link-pill" title="${url}"><i data-lucide="link-2" class="comment-link-icon"></i><span class="comment-link-text">${label}</span>${domain ? `<span class="comment-link-domain">${domain}</span>` : ""}<i data-lucide="external-link" class="comment-link-ext"></i></a>`;
        }
    );

    // 3. معالجة الروابط المباشرة (URLs) غير المحاطة بروابط
    const rawUrlRegex = /(^|[\s\(\[\{\>])((https?:\/\/|www\.)[^\s<\]\)\}"']+)/gi;
    safe = safe.replace(rawUrlRegex, (match, prefix, url) => {
        let cleanUrl = url;
        let trailing = "";
        const trailingMatch = cleanUrl.match(/[.,!?;:)]+$/);
        if (trailingMatch) {
            trailing = trailingMatch[0];
            cleanUrl = cleanUrl.slice(0, -trailing.length);
        }

        const href = cleanUrl.startsWith("www.") ? `https://${cleanUrl}` : cleanUrl;
        const domain = getDomainFromUrl(href);
        const linkHtml = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="comment-link-pill" title="${cleanUrl}"><i data-lucide="globe" class="comment-link-icon"></i><span class="comment-link-text">${cleanUrl}</span>${domain ? `<span class="comment-link-domain">${domain}</span>` : ""}<i data-lucide="external-link" class="comment-link-ext"></i></a>`;
        return `${prefix}${linkHtml}${trailing}`;
    });

    return safe;
}


// ==================================================
// جلب التعليقات
// ==================================================

async function loadTaskComments(
    taskId
) {

    if (!taskId) {
        return;
    }

    if (!taskCommentsContainer) {
        return;
    }

    taskCommentsContainer.innerHTML = `
        <div class="comments-loading">
            جاري تحميل التعليقات...
        </div>
    `;

    try {

        const response =
            await fetch(
                `/tasks/${taskId}/comments`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            taskCommentsContainer.innerHTML = `
                <div class="comments-error">
                    ${escapeHtml(
                data.message ||
                "فشل جلب التعليقات"
            )}
                </div>
            `;

            if (taskCommentsCount) {
                taskCommentsCount.textContent = "0";
            }

            return;

        }

        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            taskCommentsContainer.innerHTML = `
                <div class="no-comments">
                    لا توجد تعليقات حتى الآن.
                </div>
            `;

            if (taskCommentsCount) {
                taskCommentsCount.textContent = "0";
            }

            return;

        }

        if (taskCommentsCount) {
            taskCommentsCount.textContent = String(data.length);
        }

        taskCommentsContainer.innerHTML = "";

        data.forEach(
            comment => {

                const commentElement =
                    document.createElement(
                        "div"
                    );

                commentElement.className =
                    "task-form-show-comments";

                commentElement.setAttribute(
                    "data-comment-id",
                    comment.id
                );

                const usernameStr =
                    (comment.username || "مستخدم").trim();

                const userInitial =
                    usernameStr.charAt(0).toUpperCase() || "م";

                let timeStr = "";
                if (comment.created_at) {
                    try {
                        const d = new Date(comment.created_at);
                        timeStr = d.toLocaleDateString("ar-SA", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                        });
                    } catch (e) {
                        timeStr = "";
                    }
                }

                const isOwner = Boolean(comment.isOwner);

                commentElement.innerHTML = `
                    <span class="avatar avatar--md" style="--a: 152; --b: 190;">
                        ${escapeHtml(userInitial)}
                    </span>
                    <div class="comment-content-wrap">
                        <div class="comment-header-row">
                            <div class="comment-user-info">
                                <h3 class="comment-user-name">${escapeHtml(usernameStr)}</h3>
                                ${timeStr ? `<span class="comment-time">${escapeHtml(timeStr)}</span>` : ""}
                            </div>
                            ${isOwner ? `
                                <button type="button" class="btn-comment-delete" title="حذف التعليق" data-comment-id="${escapeHtml(String(comment.id))}" aria-label="حذف التعليق">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            ` : ""}
                        </div>
                        <div class="comment-description">
                            ${formatCommentContent(comment.comment || "")}
                        </div>
                    </div>
                `;

                taskCommentsContainer.appendChild(
                    commentElement
                );

            }
        );

        if (typeof lucide !== "undefined" && lucide.createIcons) {
            lucide.createIcons();
        }

    } catch (error) {

        console.error(
            "Comments error:",
            error
        );

        taskCommentsContainer.innerHTML = `
            <div class="comments-error">
                حدث خطأ أثناء جلب التعليقات.
            </div>
        `;

        if (taskCommentsCount) {
            taskCommentsCount.textContent = "0";
        }

    }

}


// ==================================================
// إضافة تعليق
// ==================================================

async function addTaskComment() {

    if (!taskCommentInput) {
        return;
    }

    const comment =
        taskCommentInput.value.trim();

    if (!comment) {
        return;
    }

    if (!currentTaskId) {

        if (typeof showMessage === "function") {
            showMessage(
                "لم يتم تحديد المهمة",
                "warning"
            );
        }

        return;
    }

    if (btnTaskCommentSubmit) {
        btnTaskCommentSubmit.disabled = true;
    }

    try {

        const response =
            await fetch(
                `/tasks/${currentTaskId}/comments`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        comment: comment
                    })
                }
            );

        const responseText =
            await response.text();

        let data = {};

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.error("❌ Server returned non-JSON:", responseText);
            if (typeof showMessage === "function") {
                showMessage(
                    `السيرفر رجّع استجابة غير صحيحة (${response.status})`,
                    "error"
                );
            }
            return;
        }

        if (!response.ok) {
            if (typeof showMessage === "function") {
                showMessage(
                    data.message || "فشل إضافة التعليق",
                    "error"
                );
            }
            return;
        }

        taskCommentInput.value = "";

        await loadTaskComments(
            currentTaskId
        );

    } catch (error) {

        console.error(
            "Add comment error:",
            error
        );

        if (typeof showMessage === "function") {
            showMessage(
                "حدث خطأ أثناء إضافة التعليق",
                "error"
            );
        }

    } finally {

        if (btnTaskCommentSubmit) {
            btnTaskCommentSubmit.disabled = false;
        }

    }

}


// ==================================================
// نافذة إرفاق الرابط في التعليقات
// ==================================================

function openCommentLinkModal() {
    if (!taskCommentLinkModal) return;
    taskCommentLinkModal.style.display = "flex";
    if (commentLinkUrlInput) {
        commentLinkUrlInput.value = "";
        setTimeout(() => commentLinkUrlInput.focus(), 60);
    }
    if (commentLinkTitleInput) {
        commentLinkTitleInput.value = "";
    }
    if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
    }
}

function closeCommentLinkModal() {
    if (!taskCommentLinkModal) return;
    taskCommentLinkModal.style.display = "none";
}

function handleInsertCommentLink() {
    if (!commentLinkUrlInput) return;
    let url = commentLinkUrlInput.value.trim();
    if (!url) {
        if (typeof showMessage === "function") {
            showMessage("يرجى إدخال الرابط أولاً", "warning");
        }
        commentLinkUrlInput.focus();
        return;
    }

    // إضافة بروتوكول https:// إن لم يكن موجوداً
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
    }

    const title = commentLinkTitleInput ? commentLinkTitleInput.value.trim() : "";
    const formattedLink = title ? `[${title}](${url})` : url;

    if (taskCommentInput) {
        const currentVal = taskCommentInput.value;
        if (currentVal && !currentVal.endsWith(" ")) {
            taskCommentInput.value = `${currentVal} ${formattedLink} `;
        } else {
            taskCommentInput.value = `${currentVal}${formattedLink} `;
        }
        taskCommentInput.focus();
    }

    closeCommentLinkModal();
}


// ==================================================
// أحداث زر وروابط التعليق
// ==================================================

if (btnTaskCommentLink) {
    btnTaskCommentLink.addEventListener(
        "click",
        openCommentLinkModal
    );
}

if (btnCloseCommentLinkModal) {
    btnCloseCommentLinkModal.addEventListener(
        "click",
        closeCommentLinkModal
    );
}

if (btnCommentLinkCancel) {
    btnCommentLinkCancel.addEventListener(
        "click",
        closeCommentLinkModal
    );
}

if (taskCommentLinkBackdrop) {
    taskCommentLinkBackdrop.addEventListener(
        "click",
        closeCommentLinkModal
    );
}

if (btnCommentLinkInsert) {
    btnCommentLinkInsert.addEventListener(
        "click",
        handleInsertCommentLink
    );
}

if (commentLinkUrlInput) {
    commentLinkUrlInput.addEventListener(
        "keydown",
        (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (commentLinkTitleInput && !commentLinkTitleInput.value.trim()) {
                    commentLinkTitleInput.focus();
                } else {
                    handleInsertCommentLink();
                }
            } else if (e.key === "Escape") {
                closeCommentLinkModal();
            }
        }
    );
}

if (commentLinkTitleInput) {
    commentLinkTitleInput.addEventListener(
        "keydown",
        (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleInsertCommentLink();
            } else if (e.key === "Escape") {
                closeCommentLinkModal();
            }
        }
    );
}


// ==================================================
// حذف التعليقات
// ==================================================

if (taskCommentsContainer) {
    taskCommentsContainer.addEventListener(
        "click",
        async (e) => {
            const deleteBtn = e.target.closest(".btn-comment-delete");
            if (!deleteBtn) return;
            const commentId = deleteBtn.getAttribute("data-comment-id");
            if (!commentId) return;

            if (!confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
                return;
            }

            try {
                deleteBtn.disabled = true;
                const res = await fetch(`/comments/${commentId}`, {
                    method: "DELETE",
                    credentials: "include"
                });
                const data = await res.json();
                if (res.ok) {
                    if (typeof showMessage === "function") {
                        showMessage("تم حذف التعليق بنجاح", "success");
                    }
                    await loadTaskComments(currentTaskId);
                } else {
                    if (typeof showMessage === "function") {
                        showMessage(data.message || "فشل حذف التعليق", "error");
                    }
                    deleteBtn.disabled = false;
                }
            } catch (err) {
                console.error("Delete comment error:", err);
                if (typeof showMessage === "function") {
                    showMessage("حدث خطأ أثناء حذف التعليق", "error");
                }
                deleteBtn.disabled = false;
            }
        }
    );
}


// ==================================================
// زر إرسال التعليق
// ==================================================

if (btnTaskCommentSubmit) {

    btnTaskCommentSubmit.addEventListener(
        "click",
        addTaskComment
    );

}


// ==================================================
// Enter لإرسال التعليق
// ==================================================

if (taskCommentInput) {

    taskCommentInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                addTaskComment();

            }

        }
    );

}


// ==================================================
// KANBAN DRAG & DROP
// ==================================================

let draggedTask =
    null;

let originalColumn =
    null;

let originalNextSibling =
    null;


// ==================================================
// KANBAN COLUMNS
// ==================================================

const kanbanWrappers =
    document.querySelectorAll(
        "#Kanban-board-container .kanban-columns"
    );


// ==================================================
// GET TASK CONTAINER
// ==================================================

function getTaskContainer(
    wrapper
) {

    return wrapper.querySelector(
        "#todo-column, #progress-column, #done-column, #review-column ,#doneshow-column"
    );

}


// ==================================================
// DRAG START
// ==================================================

document.addEventListener(
    "dragstart",
    (e) => {

        const task =
            e.target.closest(
                ".Kanban-task"
            );


        if (!task) {
            return;
        }


        draggedTask =
            task;


        originalColumn =
            task.parentElement;


        originalNextSibling =
            task.nextElementSibling;


        const taskId =
            task.dataset.taskId;


        if (!taskId) {

            e.preventDefault();

            return;

        }


        e.dataTransfer.effectAllowed =
            "move";


        e.dataTransfer.setData(
            "text/plain",
            taskId
        );


        document.body.classList.add(
            "is-dragging-task"
        );


        requestAnimationFrame(
            () => {

                task.classList.add(
                    "dragging"
                );

            }
        );

    }
);


// ==================================================
// DRAG OVER + DROP
// ==================================================

kanbanWrappers.forEach(
    wrapper => {

        wrapper.addEventListener(
            "dragover",
            (e) => {

                if (!draggedTask) {
                    return;
                }


                e.preventDefault();


                e.dataTransfer.dropEffect =
                    "move";


                kanbanWrappers.forEach(
                    column => {

                        column.classList.remove(
                            "drag-over"
                        );

                    }
                );


                wrapper.classList.add(
                    "drag-over"
                );

            }
        );


        // ==================================================
        // DROP
        // ==================================================

        wrapper.addEventListener(
            "drop",
            async (e) => {

                e.preventDefault();

                e.stopPropagation();


                if (!draggedTask) {
                    return;
                }


                const task =
                    draggedTask;


                const taskId =
                    task.dataset.taskId;


                const oldStatus =
                    task.dataset.status;


                const newStatus =
                    wrapper.dataset.status;


                if (!taskId) {
                    return;
                }


                if (!newStatus) {
                    return;
                }


                if (
                    oldStatus ===
                    newStatus
                ) {

                    return;

                }


                const targetContainer =
                    getTaskContainer(
                        wrapper
                    );


                if (!targetContainer) {

                    showMessage(
                        "تعذر نقل المهمة",
                        "error"
                    );

                    return;

                }


                targetContainer.appendChild(
                    task
                );


                task.dataset.status =
                    newStatus;


                const statusElement =
                    task.querySelector(
                        ".task-taype"
                    );


                if (statusElement) {

                    statusElement.textContent =
                        newStatus;

                }


                task.classList.add(
                    "status-updating"
                );


                try {

                    const response =
                        await fetch(
                            `/tasks/${taskId}/status`,
                            {

                                method: "PATCH",

                                credentials:
                                    "include",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({
                                        status:
                                            newStatus
                                    })

                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "فشل تحديث الحالة"
                        );

                    }


                    showMessage(
                        "تم تحديث الحالة بنجاح",
                        "success"
                    );

                    window.refreshProjectWorkspaceSummary?.();

                }


                catch (error) {

                    console.error(
                        "Task status error:",
                        error
                    );


                    // ==================================================
                    // ROLLBACK
                    // ==================================================

                    if (
                        originalNextSibling &&
                        originalNextSibling.parentElement ===
                        originalColumn
                    ) {

                        originalColumn.insertBefore(
                            task,
                            originalNextSibling
                        );

                    }

                    else {

                        originalColumn.appendChild(
                            task
                        );

                    }


                    task.dataset.status =
                        oldStatus;


                    if (statusElement) {

                        statusElement.textContent =
                            oldStatus;

                    }


                    showMessage(
                        "تعذر تحديث حالة المهمة",
                        "error"
                    );

                }


                finally {

                    task.classList.remove(
                        "status-updating"
                    );

                }

            }
        );

    }
);


// ==================================================
// DRAG END
// ==================================================

document.addEventListener(
    "dragend",
    (e) => {

        const task =
            e.target.closest(
                ".Kanban-task"
            );


        if (!task) {
            return;
        }


        task.classList.remove(
            "dragging"
        );


        kanbanWrappers.forEach(
            wrapper => {

                wrapper.classList.remove(
                    "drag-over"
                );

            }
        );


        document.body.classList.remove(
            "is-dragging-task"
        );


        draggedTask =
            null;


        originalColumn =
            null;


        originalNextSibling =
            null;

    }
);
// ==================================================
// KANBAN PROJECT MEMBERS
// ==================================================
async function loadKanbanProjectMembers() {

    const projectId = localStorage.getItem("currentProject");

    if (!projectId) {
        return;
    }

    const membersList = document.getElementById(
        "kanbanProjectMembersList"
    );

    const memberSelect = document.getElementById(
        "kanbanProjectMemberSelect"
    );

    if (!membersList || !memberSelect) {
        return;
    }

    try {

        const membersResponse = await fetch(
            `/projects/${projectId}/members`,
            {
                credentials: "include"
            }
        );

        if (!membersResponse.ok) {
            throw new Error("تعذر تحميل أعضاء المشروع");
        }

        const members = await membersResponse.json();

        const usersResponse = await fetch(
            "/users",
            {
                credentials: "include"
            }
        );

        if (!usersResponse.ok) {
            throw new Error("تعذر تحميل الموظفين");
        }

        const users = await usersResponse.json();

        membersList.innerHTML = "";

        memberSelect.innerHTML =
            `<option value="">اختر موظف</option>`;

        if (!Array.isArray(members)) {
            return;
        }

        const currentMemberIds = new Set();

        members.forEach(member => {

            const user = member.users || member;

            const userId =
                user.id ||
                member.user_id;

            if (userId !== undefined && userId !== null) {
                currentMemberIds.add(String(userId));
            }

            const username =
                user.username ||
                user.email ||
                "عضو";

            const email =
                user.email ||
                "";

            const memberItem =
                document.createElement("div");

            memberItem.className =
                "project-member-item";

            memberItem.innerHTML = `
                <div class="project-member-avatar">
                    ${(username || "م")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div class="project-member-info">
                    <strong>${username}</strong>
                    <small>${email}</small>
                </div>
            `;

            membersList.appendChild(memberItem);

        });

        if (Array.isArray(users)) {

            users.forEach(user => {

                if (!user || user.id === undefined || user.id === null) {
                    return;
                }

                if (
                    currentMemberIds.has(
                        String(user.id)
                    )
                ) {
                    return;
                }

                const option =
                    document.createElement("option");

                option.value = user.id;

                option.textContent =
                    user.username ||
                    user.email ||
                    `مستخدم ${user.id}`;

                memberSelect.appendChild(option);

            });

        }

    } catch (error) {

        console.error(
            "Load project members error:",
            error
        );

        membersList.innerHTML = `
            <div class="project-members-error">
                تعذر تحميل أعضاء المشروع
            </div>
        `;

        memberSelect.innerHTML =
            `<option value="">تعذر تحميل الموظفين</option>`;

    }
}

// ==================================================
// OPEN PROJECT MEMBERS MODAL
// ==================================================

function openKanbanProjectMembersModal() {

    const modal =
        document.getElementById(
            "kanbanProjectMembersModal"
        );

    if (!modal) {
        return;
    }

    modal.style.display = "flex";

    loadKanbanProjectMembers();

}


// ==================================================
// CLOSE PROJECT MEMBERS MODAL
// ==================================================

function closeKanbanProjectMembersModal() {

    const modal =
        document.getElementById(
            "kanbanProjectMembersModal"
        );

    if (!modal) {
        return;
    }

    modal.style.display = "none";

}


// ==================================================
// KANBAN PROJECT MEMBERS EVENTS
// ==================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const openBtn =
            document.getElementById(
                "openProjectMembersBtn"
            );

        const closeBtn =
            document.getElementById(
                "closeKanbanProjectMembersBtn"
            );

        if (openBtn) {

            openBtn.addEventListener(
                "click",
                openKanbanProjectMembersModal
            );

        }

        if (closeBtn) {

            closeBtn.addEventListener(
                "click",
                closeKanbanProjectMembersModal
            );

        }

    }
);
async function addKanbanProjectMember() {

    const projectId = localStorage.getItem("currentProject");

    const memberSelect = document.getElementById(
        "kanbanProjectMemberSelect"
    );

    const addBtn = document.getElementById(
        "kanbanAddProjectMemberBtn"
    );

    if (!projectId || !memberSelect) {
        return;
    }

    const userId = memberSelect.value;

    if (!userId) {
        showMessage("اختر موظف أولاً", "error");
        return;
    }

    try {

        if (addBtn) {
            addBtn.disabled = true;
            addBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                جاري الإضافة...
            `;
        }

        const response = await fetch(
            `/projects/${projectId}/members`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: Number(userId)
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            showMessage(data.message || "تعذر إضافة العضو", "error");
        }

        memberSelect.value = "";

        await loadKanbanProjectMembers();

        showMessage("تم إضافة العضو بنجاح", "success");

    } catch (error) {

        console.error(
            "Add project member error:",
            error
        );

        showMessage(error.message || "حدث خطأ أثناء إضافة العضو", "error");


    } finally {

        if (addBtn) {
            addBtn.disabled = false;
            addBtn.innerHTML = `
                <i class="fa-solid fa-user-plus"></i>
                إضافة
            `;
        }

    }
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const addBtn =
            document.getElementById(
                "kanbanAddProjectMemberBtn"
            );

        if (addBtn) {

            addBtn.addEventListener(
                "click",
                addKanbanProjectMember
            );

        }

    }
);