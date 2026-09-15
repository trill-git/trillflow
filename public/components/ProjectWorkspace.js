// ==================================================
// PROJECT WORKSPACE
// A project-first workspace that reuses the existing Kanban and task forms.
// ==================================================

(function initializeProjectWorkspace() {

    let workspaceProject = null;
    let workspaceMembers = [];

    const byId = id => document.getElementById(id);

    function setText(id, value) {

        const element = byId(id);

        if (element) {
            element.textContent = value;
        }

    }

    function setHidden(id, hidden) {

        const element = byId(id);

        if (element) {
            element.hidden = hidden;
        }

    }

    function formatWorkspaceDate(value) {

        if (!value) return "غير محدد";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return String(value);

        return new Intl.DateTimeFormat("ar-SA", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }).format(date);

    }

    function formatFileSize(bytes) {

        const value = Number(bytes || 0);

        if (!value) return "0 B";

        const units = ["B", "KB", "MB", "GB", "TB"];
        const unitIndex = Math.min(
            Math.floor(Math.log(value) / Math.log(1024)),
            units.length - 1
        );

        const amount = value / Math.pow(1024, unitIndex);

        return `${amount >= 10 || unitIndex === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[unitIndex]}`;

    }

    function getInitial(value) {

        return String(value || "م")
            .trim()
            .charAt(0)
            .toUpperCase() || "م";

    }

    function canManageWorkspace() {

        return ["owner", "manager", "admin"].includes(projectCurrentUserRole);

    }

    async function ensureWorkspaceRole() {

        if (projectCurrentUserRole) return;

        try {

            const response = await fetch("/user", {
                credentials: "include"
            });

            if (!response.ok) return;

            const user = await response.json();
            projectCurrentUserRole = user.role;

        } catch (error) {

            console.error("WORKSPACE ROLE ERROR:", error);

        }

    }

    function renderWorkspaceIdentity(project) {

        const identity = byId("projectDetailsIdentity");

        if (!identity) return;

        identity.innerHTML = "";

        if (project.image_url) {

            const image = document.createElement("img");
            image.src = project.image_url;
            image.alt = project.ProjectTitle || "صورة المشروع";
            image.onerror = () => {
                image.replaceWith(createProjectInitial(project));
            };
            identity.appendChild(image);

        } else {

            identity.appendChild(createProjectInitial(project));

        }

    }

    function createProjectInitial(project) {

        const initial = document.createElement("span");
        initial.textContent = getInitial(project.ProjectTitle);

        return initial;

    }

    function renderWorkspaceMembers(members) {
        const list = byId("workspaceMembersList");

        if (!list) return;

        list.innerHTML = "";

        if (!members.length) {
            const empty = document.createElement("span");
            empty.className = "workspace-members-empty";
            empty.textContent = "لا يوجد أعضاء ظاهرون";
            list.appendChild(empty);
            return;
        }

        members.slice(0, 8).forEach(member => {
            const avatar = document.createElement("span");

            const name = String(
                member.username ||
                member.name ||
                member.email ||
                "مستخدم"
            ).trim();

            avatar.className = "workspace-member-avatar";
            avatar.textContent = name;
            avatar.title = name;

            list.appendChild(avatar);
        });

        if (members.length > 8) {
            const extra = document.createElement("span");

            extra.className = "workspace-members-extra";
            extra.textContent = `+${members.length - 8}`;

            list.appendChild(extra);
        }
    }


    function renderWorkspaceSummary(data) {

        const project = data.project || {};
        const stats = data.stats || {};
        const taskCount = Number(stats.task_count || 0);
        const completedCount = Number(stats.completed_task_count || 0);
        const progress = Math.max(0, Math.min(100, Number(stats.progress || 0)));

        workspaceProject = project;
        workspaceMembers = Array.isArray(data.members) ? data.members : [];

        // These bindings belong to the original project/edit flow. Keeping them
        // current lets the existing project form and task components work here.
        activeProject = project;
        currentProjectId = String(project.id);
        localStorage.setItem("currentProject", String(project.id));

        setText("projectDetailsTitle", project.ProjectTitle || "بدون اسم");
        setText("projectDetailsDescription", project.description || "لا يوجد وصف لهذا المشروع.");
        setText("workspaceStatus", project.status || "قيد الانتظار");
        setText("workspacePriority", project.Priority ? `أولوية ${project.Priority}` : "أولوية غير محددة");
        setText("workspaceStartDate", formatWorkspaceDate(project.start_date || project.created_at));
        setText("workspaceDueDate", formatWorkspaceDate(project.due_date));
        setText("workspaceMemberCount", stats.member_count ?? workspaceMembers.length);
        setText("workspaceTaskCount", taskCount);
        setText("workspaceCompletedCount", completedCount);
        setText("workspaceCompletedHint", `من أصل ${taskCount} مهمة`);
        setText("workspaceRemainingCount", Math.max(0, taskCount - completedCount));
        setText("workspaceProgressValue", `${progress}%`);
        setText(
            "workspaceProgressHint",
            taskCount ? `${completedCount} من ${taskCount} مهمة مكتملة` : "لا توجد مهام بعد"
        );

        const progressBar = byId("workspaceProgressBar");
        if (progressBar) progressBar.style.width = `${progress}%`;

        const emptyTasks = byId("workspaceTasksEmpty");
        if (emptyTasks) emptyTasks.hidden = taskCount !== 0;

        const editButton = byId("editProjectBtn");
        const topTaskButton = byId("workspaceAddTaskBtn");
        const taskButton = byId("addTaskbtn");
        const uploadLabel = byId("workspaceFilesUploadLabel");
        const dropzone = byId("workspaceFilesDropzone");
        const manageable = canManageWorkspace();

        if (editButton) editButton.hidden = !manageable;
        if (topTaskButton) topTaskButton.hidden = !manageable;
        if (taskButton) taskButton.hidden = !manageable;
        if (uploadLabel) uploadLabel.hidden = !manageable;
        if (dropzone) dropzone.hidden = !manageable;

        renderWorkspaceIdentity(project);
        renderWorkspaceMembers(workspaceMembers);

    }

    function getFileVisual(file) {

        const name = String(file.file_name || "").toLowerCase();
        const type = String(file.file_type || "").toLowerCase();
        const extension = name.includes(".") ? name.split(".").pop() : "";

        if (type.includes("pdf") || extension === "pdf") return { label: "PDF", tone: "type-pdf" };
        if (["doc", "docx", "rtf"].includes(extension) || type.includes("word")) return { label: "DOC", tone: "type-word" };
        if (["xls", "xlsx", "csv"].includes(extension) || type.includes("spreadsheet")) return { label: "XLS", tone: "type-sheet" };
        if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(extension) || type.startsWith("image/")) return { label: "IMG", tone: "type-image" };
        if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return { label: "ZIP", tone: "type-archive" };
        if (["psd", "ai", "fig", "sketch"].includes(extension)) return { label: extension.toUpperCase(), tone: "type-design" };

        return { label: (extension || "FILE").slice(0, 4).toUpperCase(), tone: "" };

    }

    function showFilesFeedback(message, type = "info") {

        const feedback = byId("workspaceFilesFeedback");

        if (!feedback) return;

        feedback.hidden = !message;
        feedback.textContent = message || "";
        feedback.classList.toggle("workspace-inline-error", type === "error");

    }

    function createFileAction({ title, symbol, onClick, className = "" }) {

        const button = document.createElement("button");
        button.type = "button";
        button.title = title;
        button.setAttribute("aria-label", title);
        button.className = className;
        button.textContent = symbol;
        button.addEventListener("click", onClick);

        return button;

    }

    function renderWorkspaceFiles(files) {

        const list = byId("workspaceFilesList");

        if (!list) return;

        list.innerHTML = "";
        setText("workspaceFileCount", files.length);

        if (!files.length) {

            const empty = document.createElement("div");
            empty.className = "workspace-empty-state";
            empty.innerHTML = "<span>▣</span><h3>لا توجد ملفات للمشروع</h3><p>أضف ملفات المشروع المشتركة هنا، وستبقى منفصلة عن ملفات التاسكات.</p>";
            list.appendChild(empty);
            return;

        }

        files.forEach(file => {

            const row = document.createElement("article");
            const visual = getFileVisual(file);
            const icon = document.createElement("span");
            const primary = document.createElement("div");
            const title = document.createElement("strong");
            const subTitle = document.createElement("small");
            const type = document.createElement("span");
            const size = document.createElement("span");
            const date = document.createElement("span");
            const uploader = document.createElement("span");
            const actions = document.createElement("div");

            row.className = "workspace-file-row";
            icon.className = `workspace-file-icon ${visual.tone}`;
            icon.textContent = visual.label;
            primary.className = "workspace-file-primary";
            title.textContent = file.file_name || "ملف غير مسمى";
            subTitle.textContent = file.legacy ? "ملف محفوظ سابقًا" : "ملف المشروع";
            primary.append(title, subTitle);

            [
                [type, file.file_type || "غير معروف"],
                [size, formatFileSize(file.file_size)],
                [date, formatWorkspaceDate(file.created_at)],
                [uploader, file.uploader?.username || "غير معروف"]
            ].forEach(([element, value]) => {
                element.className = "workspace-file-meta";
                element.title = value;
                element.textContent = value;
            });

            actions.className = "workspace-file-actions";

            if (file.previewable) {
                actions.appendChild(createFileAction({
                    title: "معاينة الملف",
                    symbol: "◉",
                    onClick: () => openProjectFilePreview(file)
                }));
            }

            const download = document.createElement("a");
            download.href = file.download_url;
            download.title = "تحميل الملف";
            download.setAttribute("aria-label", "تحميل الملف");
            download.textContent = "↓";
            actions.appendChild(download);

            if (canManageWorkspace()) {
                actions.appendChild(createFileAction({
                    title: "حذف الملف",
                    symbol: "×",
                    className: "workspace-delete-file",
                    onClick: () => deleteWorkspaceFile(file)
                }));
            }

            row.append(icon, primary, type, size, date, uploader, actions);
            list.appendChild(row);

        });

    }

    async function loadWorkspaceFiles(projectId) {

        const list = byId("workspaceFilesList");

        if (list) {
            list.innerHTML = "<div class=\"workspace-files-feedback\">جارٍ تحميل ملفات المشروع...</div>";
        }

        showFilesFeedback("");

        try {

            const response = await fetch(`/projects/${projectId}/files`, {
                credentials: "include"
            });
            const data = await response.json().catch(() => []);

            if (!response.ok) {
                throw new Error(data.message || "تعذر تحميل ملفات المشروع.");
            }

            renderWorkspaceFiles(Array.isArray(data) ? data : []);

        } catch (error) {

            if (list) list.innerHTML = "";
            showFilesFeedback(error.message || "تعذر تحميل ملفات المشروع.", "error");

        }

    }

    async function uploadWorkspaceFiles(files) {

        if (!workspaceProject || !files.length || !canManageWorkspace()) return;

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append("files", file));
        showFilesFeedback(`جارٍ رفع ${files.length} ملف…`);

        try {

            const response = await fetch(`/projects/${workspaceProject.id}/files`, {
                method: "POST",
                credentials: "include",
                body: formData
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "فشل رفع ملفات المشروع.");
            }

            showFilesFeedback("تم رفع ملفات المشروع بنجاح.");
            await loadWorkspaceFiles(workspaceProject.id);

        } catch (error) {

            showFilesFeedback(error.message || "فشل رفع ملفات المشروع.", "error");

        }

    }

    async function deleteWorkspaceFile(file) {

        if (!workspaceProject || !canManageWorkspace()) return;

        if (!window.confirm(`حذف «${file.file_name}» من المشروع؟`)) return;

        try {

            const endpoint = file.legacy
                ? `/projects/${workspaceProject.id}/attachments`
                : `/projects/${workspaceProject.id}/files/${file.id}`;
            const options = {
                method: "DELETE",
                credentials: "include"
            };

            if (file.legacy) {
                options.headers = { "Content-Type": "application/json" };
                options.body = JSON.stringify({ path: file.storage_path });
            }

            const response = await fetch(endpoint, options);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "تعذر حذف الملف.");
            }

            showFilesFeedback("تم حذف الملف من المشروع.");
            await loadWorkspaceFiles(workspaceProject.id);

        } catch (error) {

            showFilesFeedback(error.message || "تعذر حذف الملف.", "error");

        }

    }

    function openProjectFilePreview(file) {

        const modal = byId("projectFilePreviewModal");
        const title = byId("projectFilePreviewTitle");
        const content = byId("projectFilePreviewContent");

        if (!modal || !content) return;

        title.textContent = file.file_name || "معاينة الملف";
        content.innerHTML = "";

        if (String(file.file_type || "").startsWith("image/")) {

            const image = document.createElement("img");
            image.src = file.preview_url;
            image.alt = file.file_name || "معاينة ملف";
            content.appendChild(image);

        } else {

            const frame = document.createElement("iframe");
            frame.src = file.preview_url;
            frame.title = file.file_name || "معاينة ملف";
            content.appendChild(frame);

        }

        modal.hidden = false;

    }

    function closeProjectFilePreview() {

        const modal = byId("projectFilePreviewModal");
        const content = byId("projectFilePreviewContent");

        if (content) content.innerHTML = "";
        if (modal) modal.hidden = true;

    }

    async function loadWorkspaceKanban() {

        const error = byId("workspaceTasksError");

        if (error) error.hidden = true;

        try {

            if (typeof loadKanbanProject === "function") {
                await loadKanbanProject();
            }

        } catch (loadError) {

            if (error) {
                error.textContent = loadError.message || "تعذر تحميل مهام المشروع.";
                error.hidden = false;
            }

        }

    }

    async function refreshProjectWorkspaceSummary() {

        const projectId = workspaceProject?.id || localStorage.getItem("currentProject");

        if (!projectId) return;

        try {

            const response = await fetch(`/projects/${projectId}/workspace`, {
                credentials: "include"
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) return;

            renderWorkspaceSummary(data);

        } catch (error) {

            console.error("REFRESH PROJECT WORKSPACE ERROR:", error);

        }

    }

    async function openProjectWorkspace(projectId, options = {}) {

        if (!projectId) return;

        await ensureWorkspaceRole();
        setHidden("workspaceLoadingState", false);
        setHidden("workspaceTasksError", true);

        try {

            const response = await fetch(`/projects/${projectId}/workspace`, {
                credentials: "include"
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "تعذر فتح مساحة عمل المشروع.");
            }

            renderWorkspaceSummary(data);
            window.openPage?.("projectDetailsPage");

            await Promise.all([
                loadWorkspaceFiles(data.project.id),
                loadWorkspaceKanban()
            ]);

            if (options.focusTasks) {
                byId("workspaceTasksPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }

        } catch (error) {

            console.error("OPEN PROJECT WORKSPACE ERROR:", error);
            showMessage(error.message || "تعذر فتح مساحة عمل المشروع.", "error");
            window.openPage?.("projectsPage");

        } finally {

            setHidden("workspaceLoadingState", true);

        }

    }

    window.openProjectWorkspace = openProjectWorkspace;
    window.refreshProjectWorkspaceSummary = refreshProjectWorkspaceSummary;

    byId("workspaceFilesInput")?.addEventListener("change", event => {

        uploadWorkspaceFiles(event.target.files);
        event.target.value = "";

    });

    const dropzone = byId("workspaceFilesDropzone");

    dropzone?.addEventListener("click", () => {
        byId("workspaceFilesInput")?.click();
    });

    ["dragenter", "dragover"].forEach(eventName => {
        dropzone?.addEventListener(eventName, event => {
            event.preventDefault();
            dropzone.classList.add("is-dragging");
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropzone?.addEventListener(eventName, event => {
            event.preventDefault();
            dropzone.classList.remove("is-dragging");
        });
    });

    dropzone?.addEventListener("drop", event => {
        uploadWorkspaceFiles(event.dataTransfer?.files || []);
    });

    byId("workspaceAddTaskBtn")?.addEventListener("click", () => {
        byId("addTaskbtn")?.click();
        byId("workspaceTasksPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.querySelectorAll(".workspace-nav-link").forEach(button => {
        button.addEventListener("click", () => {

            document.querySelectorAll(".workspace-nav-link").forEach(link => {
                link.classList.remove("is-active");
            });
            button.classList.add("is-active");
            byId(button.dataset.workspaceTarget)?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });
    });

    byId("closeProjectFilePreviewBtn")?.addEventListener("click", closeProjectFilePreview);
    byId("projectFilePreviewModal")?.addEventListener("click", event => {
        if (event.target === event.currentTarget) closeProjectFilePreview();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeProjectFilePreview();
    });

    document.querySelector('.nav__link[data-page="projectDetailsPage"]')?.addEventListener("click", () => {
        const projectId = localStorage.getItem("currentProject");

        if (projectId) openProjectWorkspace(projectId, { focusTasks: true });
    });

})();
