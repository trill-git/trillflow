document.addEventListener("DOMContentLoaded", () => {

});


// ==================================================
// المتغيرات العامة
// ==================================================

let currentUserRole = null;
let currentUserId = null;
let editingUser = null;


// ==================================================
// حالة المستخدم — نشط / غير نشط
// ==================================================

function isUserOnline(lastSeenAt) {

    if (!lastSeenAt) {
        return false;
    }

    const lastSeen = new Date(lastSeenAt).getTime();

    if (Number.isNaN(lastSeen)) {
        return false;
    }

    const now = Date.now();

    // المستخدم يعتبر نشط إذا كان آخر ظهور خلال 90 ثانية
    return (now - lastSeen) <= 90 * 1000;

}


// ==================================================
// تحديث حالة المستخدمين الموجودين على الصفحة
// ==================================================

function updateMemberStatuses(users) {
    const now = Date.now();
    const ONLINE_THRESHOLD = 90 * 1000;

    users.forEach(user => {
        if (!user.last_seen_at) {
            return;
        }

        const lastSeen = new Date(user.last_seen_at).getTime();
        const online = (now - lastSeen) <= ONLINE_THRESHOLD;

        const statusElement = document.querySelector(
            `.member-status[data-status-user-id="${user.id}"]`
        );

        if (!statusElement) {
            return;
        }

        const statusDot = statusElement.querySelector(
            ".member-status-dot"
        );

        const statusTextElement = statusElement.querySelector(
            ".member-status-text"
        );

        if (online) {
            statusElement.classList.remove("offline");
            statusElement.classList.add("online");

            if (statusTextElement) {
                statusTextElement.textContent = "نشط";
            }

            if (statusDot) {
                statusDot.classList.remove("offline");
                statusDot.classList.add("online");
            }
        } else {
            statusElement.classList.remove("online");
            statusElement.classList.add("offline");

            if (statusTextElement) {
                statusTextElement.textContent = "غير نشط";
            }

            if (statusDot) {
                statusDot.classList.remove("online");
                statusDot.classList.add("offline");
            }
        }
    });
}

// ==================================================
// تحديث الحالات من السيرفر
// ==================================================

async function refreshMemberStatuses() {

    try {

        const response = await fetch(
            "/users",
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        if (!response.ok) {
            return;
        }

        const users = await response.json();

        updateMemberStatuses(users);

    } catch (error) {

        console.error(
            "❌ refreshMemberStatuses:",
            error
        );

    }

}


// ==================================================
// التحقق من صلاحية المستخدم
// ==================================================

async function checkMemberPermission() {

    try {

        const response = await fetch(
            "/user",
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!response.ok) {
            return;
        }

        const user = await response.json();

        currentUserRole = user.role;

        currentUserId = String(user.id);


        const addMemberBtn =
            document.getElementById("addMemberBtn");


        if (!addMemberBtn) {
            return;
        }


        if (currentUserRole === "member") {

            addMemberBtn.style.display = "none";

        } else {

            addMemberBtn.style.display = "block";

        }

    } catch (error) {

        console.error(
            "Permission check error:",
            error
        );

    }

}

checkMemberPermission();


// ==================================================
// تحميل أعضاء النظام — GROUPED BY ROLE
// ==================================================

async function loadMembers() {

    const container =
        document.getElementById("membersContainer");


    if (!container) {

        console.error(
            "❌ membersContainer غير موجود"
        );

        return;
    }


    try {

        const response =
            await fetch(
                "/users",
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                }
            );


        const users =
            await response.json();


        if (!response.ok) {

            throw new Error(
                users.message ||
                "فشل جلب المستخدمين"
            );

        }


        container.innerHTML = "";


        // ==================================================
        // تقسيم المستخدمين حسب الدور
        // ==================================================

        const owners =
            users.filter(
                user => user.role === "owner"
            );


        const managers =
            users.filter(
                user => user.role === "manager"
            );


        const admins =
            users.filter(
                user => user.role === "admin"
            );


        const members =
            users.filter(
                user => user.role === "member"
            );


        // ==================================================
        // إنشاء مجموعة
        // ==================================================

        function createMemberGroup(
            title,
            subtitle,
            groupUsers,
            type
        ) {

            if (!groupUsers.length) {
                return;
            }


            const group =
                document.createElement("section");


            group.className =
                `members-group members-group--${type}`;


            // ==================================================
            // HEADER
            // ==================================================

            const header =
                document.createElement("div");


            header.className =
                "members-group-header";


            header.innerHTML = `

                <div class="members-group-title">

                    <span class="members-group-icon">

                        ${type === "owner"
                    ? "👑"
                    : type === "manager"
                        ? "💼"
                        : type === "admin"
                            ? "🛡️"
                            : "👤"
                }

                    </span>

                    <div>

                        <h3>
                            ${title}
                        </h3>

                        <span>
                            ${subtitle}
                        </span>

                    </div>

                </div>

                <span class="members-group-count">
                    ${groupUsers.length}
                </span>

            `;


            group.appendChild(header);


            // ==================================================
            // LIST
            // ==================================================

            const list =
                document.createElement("div");


            list.className =
                "members-group-list";


            groupUsers.forEach(user => {


                const card =
                    document.createElement("div");


                card.className =
                    `member-card member-card--${type}`;


                card.dataset.userId =
                    user.id;


                // ==================================================
                // AVATAR LETTER
                // ==================================================

                const firstLetter =
                    user.username
                        ?.trim()
                        ?.charAt(0)
                        ?.toUpperCase() ||
                    "؟";


                // ==================================================
                // ROLE LABEL
                // ==================================================

                let roleName =
                    "عضو";


                if (user.role === "owner") {

                    roleName =
                        "مالك النظام";

                } else if (
                    user.role === "manager"
                ) {

                    roleName =
                        "مدير";

                } else if (
                    user.role === "admin"
                ) {

                    roleName =
                        "مسؤول";

                }


                // ==================================================
                // حالة المستخدم
                // ==================================================

                const online =
                    isUserOnline(
                        user.last_seen_at
                    );


                const statusClass =
                    online
                        ? "online"
                        : "offline";


                const statusText =
                    online
                        ? "نشط"
                        : "غير نشط";


                // ==================================================
                // CARD
                // ==================================================

                card.innerHTML = `

                    <div class="member-avatar">

                        <span>
                            ${firstLetter}
                        </span>

                    </div>


                    <div class="member-main">

                        <div class="member-name-row">

                            <h4 class="member-name">
                                ${user.username || "مستخدم"}
                            </h4>

                            ${type === "owner"
                        ? `
                                        <span class="member-crown">
                                            ♛
                                        </span>
                                      `
                        : ""
                    }

                        </div>


                        <div class="member-meta">

                            <span class="member-role">
                                ${roleName}
                            </span>

                            ${user.email
                        ? `
                                        <span class="member-email">
                                            ${user.email}
                                        </span>
                                      `
                        : ""
                    }

                        </div>

                    </div>


                    <div class="member-right">

                        <span
                            class="member-status ${statusClass}"
                            data-status-user-id="${user.id}"
                            title="آخر ظهور يتم تحديثه تلقائياً"
                        >

                            <span class="member-status-dot"></span>

                            <span class="member-status-text">
                                ${statusText}
                            </span>

                        </span>


                        ${currentUserRole !== "member"
                        ? `
                                    <button
                                        type="button"
                                        class="member-edit-btn"
                                        title="تعديل العضو"
                                    >
                                        ✎
                                    </button>
                                  `
                        : ""
                    }

                    </div>

                `;


                // ==================================================
                // فتح التعديل
                // ==================================================

                card.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.closest(
                                ".member-edit-btn"
                            )
                        ) {

                            event.stopPropagation();

                            return;
                        }


                        openEditUserModal(user);

                    }
                );


                // ==================================================
                // زر التعديل
                // ==================================================

                const editBtn =
                    card.querySelector(
                        ".member-edit-btn"
                    );


                if (editBtn) {

                    editBtn.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();

                            openEditUserModal(user);

                        }
                    );

                }


                list.appendChild(card);

            });


            group.appendChild(list);

            container.appendChild(group);

        }


        // ==================================================
        // عرض المجموعات
        // ==================================================

        createMemberGroup(
            "المالك",
            "أصحاب أعلى صلاحيات في النظام",
            owners,
            "owner"
        );


        createMemberGroup(
            "المدراء",
            "إدارة النظام والمستخدمين",
            managers,
            "manager"
        );


        createMemberGroup(
            "المسؤولون",
            "صلاحيات إدارية",
            admins,
            "admin"
        );


        createMemberGroup(
            "الأعضاء",
            "أعضاء الفريق",
            members,
            "member"
        );


        // ==================================================
        // لا يوجد مستخدمين
        // ==================================================

        if (!users.length) {

            container.innerHTML = `

                <div class="members-empty">

                    <div class="members-empty-icon">
                        👥
                    </div>

                    <h3>
                        لا يوجد أعضاء
                    </h3>

                    <p>
                        لم يتم إضافة أي مستخدم للنظام حتى الآن.
                    </p>

                </div>

            `;

        }


    } catch (error) {

        console.error(
            "❌ loadMembers:",
            error
        );


        container.innerHTML = `

            <div class="members-error">

                <div>
                    ⚠
                </div>

                <span>
                    تعذر تحميل أعضاء الفريق
                </span>

            </div>

        `;

    }

}


// ==================================================
// إضافة عضو جديد للنظام
// ==================================================

const addMemberBtn =
    document.getElementById(
        "addMemberBtn"
    );


const addMemberModal =
    document.getElementById(
        "addMemberModal"
    );


const closeAddMemberBtn =
    document.getElementById(
        "closeAddMemberBtn"
    );


const createMemberBtn =
    document.getElementById(
        "createMemberBtn"
    );


const newMemberUsername =
    document.getElementById(
        "newMemberUsername"
    );


const newMemberEmail =
    document.getElementById(
        "newMemberEmail"
    );


const newMemberPassword =
    document.getElementById(
        "newMemberPassword"
    );


const newMemberRole =
    document.getElementById(
        "newMemberRole"
    );


// ==================================================
// فتح الفورم
// ==================================================

addMemberBtn?.addEventListener(
    "click",
    () => {

        if (!addMemberModal) {
            return;
        }

        addMemberModal.style.display =
            "flex";

    }
);


// ==================================================
// إغلاق الفورم
// ==================================================

closeAddMemberBtn?.addEventListener(
    "click",
    () => {

        if (!addMemberModal) {
            return;
        }

        addMemberModal.style.display =
            "none";

    }
);


// ==================================================
// إنشاء العضو
// ==================================================

createMemberBtn?.addEventListener(
    "click",
    async () => {

        const username =
            newMemberUsername.value.trim();


        const email =
            newMemberEmail.value.trim();


        const password =
            newMemberPassword.value;


        const role =
            newMemberRole.value;


        // ==================================================
        // التحقق
        // ==================================================

        if (
            !username ||
            !email ||
            !password ||
            !role
        ) {

            showMessage(
                "يرجى إدخال جميع البيانات.",
                "warning"
            );

            return;

        }


        try {

            createMemberBtn.disabled =
                true;


            // ==================================================
            // إرسال للسيرفر
            // ==================================================

            const response =
                await fetch(
                    "/users",
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

                                username:
                                    username,

                                email:
                                    email,

                                password:
                                    password,

                                role:
                                    role

                            })

                    }
                );


            const data =
                await response.json();


            // ==================================================
            // خطأ
            // ==================================================

            if (!response.ok) {

                showMessage(
                    data.message ||
                    "فشل إضافة العضو.",
                    "error"
                );

                return;

            }


            // ==================================================
            // نجاح
            // ==================================================

            showMessage(
                "تم إضافة العضو بنجاح.",
                "success"
            );


            // تنظيف الحقول

            newMemberUsername.value =
                "";


            newMemberEmail.value =
                "";


            newMemberPassword.value =
                "";


            newMemberRole.value =
                "member";


            // إغلاق الفورم

            if (addMemberModal) {

                addMemberModal.style.display =
                    "none";

            }


            // إعادة تحميل أعضاء النظام

            await loadMembers();


        } catch (error) {

            console.error(
                "Create member ERROR:",
                error
            );


            showMessage(
                "حدث خطأ أثناء إضافة العضو.",
                "error"
            );


        } finally {

            createMemberBtn.disabled =
                false;

        }

    }
);


// ==================================================
// EDIT USER
// ==================================================

const editUserModal =
    document.getElementById(
        "editUserModal"
    );


const closeEditUserBtn =
    document.getElementById(
        "closeEditUserBtn"
    );


const cancelEditUserBtn =
    document.getElementById(
        "cancelEditUserBtn"
    );


const saveUserChangesBtn =
    document.getElementById(
        "saveUserChangesBtn"
    );


const editUserId =
    document.getElementById(
        "editUserId"
    );


const editUsername =
    document.getElementById(
        "editUsername"
    );


const editUserEmail =
    document.getElementById(
        "editUserEmail"
    );


const editUserPassword =
    document.getElementById(
        "editUserPassword"
    );


const editUserRole =
    document.getElementById(
        "editUserRole"
    );


const editUserAvatar =
    document.getElementById(
        "editUserAvatar"
    );


const deleteUserBtn =
    document.getElementById(
        "deleteUserBtn"
    );


// ==================================================
// فتح فورم التعديل
// ==================================================

function openEditUserModal(user) {

    // العضو العادي لا يستطيع فتح فورم التعديل

    if (
        currentUserRole === "member"
    ) {

        return;

    }


    editingUser = user;


    editUserId.value =
        user.id;


    editUsername.value =
        user.username || "";


    editUserEmail.value =
        user.email || "";


    editUserPassword.value =
        "";


    editUserRole.value =
        user.role || "member";


    editUserAvatar.textContent =
        user.username?.charAt(0) || "؟";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    // الحذف متاح للمالك فقط
    // ولا يمكن حذف المالك أو الحساب الحالي

    if (deleteUserBtn) {

        const canDelete =
            currentUserRole === "owner" &&
            user.role !== "owner" &&
            String(user.id) !== currentUserId;


        deleteUserBtn.hidden =
            !canDelete;


        deleteUserBtn.disabled =
            !canDelete;

    }


    editUserModal.style.display =
        "flex";

}


// ==================================================
// إغلاق
// ==================================================

function closeEditUserModal() {

    if (!editUserModal) {
        return;
    }


    editUserModal.style.display =
        "none";


    editingUser = null;

}


closeEditUserBtn?.addEventListener(
    "click",
    closeEditUserModal
);


cancelEditUserBtn?.addEventListener(
    "click",
    closeEditUserModal
);


// ==================================================
// الضغط خارج الفورم
// ==================================================

editUserModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            editUserModal
        ) {

            closeEditUserModal();

        }

    }
);


// ==================================================
// حفظ التعديلات
// ==================================================

saveUserChangesBtn?.addEventListener(
    "click",
    async () => {

        const id =
            editUserId.value;


        const username =
            editUsername.value.trim();


        const email =
            editUserEmail.value.trim();


        const password =
            editUserPassword.value;


        const role =
            editUserRole.value;


        // ==================================================
        // Validation
        // ==================================================

        if (
            !username ||
            !email ||
            !role
        ) {

            showMessage(
                "يرجى إدخال جميع البيانات المطلوبة.",
                "warning"
            );

            return;
        }


        try {

            saveUserChangesBtn.disabled =
                true;


            const body = {

                username:
                    username,

                email:
                    email,

                role:
                    role

            };


            // إذا المستخدم كتب كلمة مرور

            if (
                password.trim()
            ) {

                body.password =
                    password;

            }


            const response =
                await fetch(
                    `/users/${id}`,
                    {

                        method:
                            "PATCH",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        credentials:
                            "include",

                        body:
                            JSON.stringify(body)

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                showMessage(
                    data.message ||
                    "فشل تعديل المستخدم.",
                    "error"
                );

                return;

            }


            // ==================================================
            // نجاح
            // ==================================================

            showMessage(
                "تم تحديث بيانات المستخدم بنجاح.",
                "success"
            );


            closeEditUserModal();


            await loadMembers();


        } catch (error) {

            console.error(
                "EDIT USER ERROR:",
                error
            );


            showMessage(
                "حدث خطأ أثناء تعديل المستخدم.",
                "error"
            );


        } finally {

            saveUserChangesBtn.disabled =
                false;

        }

    }
);


// ==================================================
// حذف العضو من النظام
// ==================================================

deleteUserBtn?.addEventListener(
    "click",
    async () => {

        const user =
            editingUser;


        if (
            !user ||
            currentUserRole !== "owner"
        ) {

            showMessage(
                "ليس لديك صلاحية لحذف هذا العضو.",
                "error"
            );

            return;

        }


        const confirmed =
            window.confirm(
                `هل تريد حذف العضو ${user.username || ""} نهائيًا؟\nسيتم حذف عضوياته ورسائله وتعليقاته، بينما ستبقى مشاريعه وقنواته محفوظة.`
            );


        if (!confirmed) {

            return;

        }


        const defaultLabel =
            deleteUserBtn.textContent;


        try {

            deleteUserBtn.disabled =
                true;


            deleteUserBtn.textContent =
                "جاري الحذف...";


            const response =
                await fetch(
                    `/users/${user.id}`,
                    {
                        method:
                            "DELETE",

                        credentials:
                            "include"
                    }
                );


            const data =
                await response
                    .json()
                    .catch(() => ({}));


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "فشل حذف العضو."
                );

            }


            closeEditUserModal();


            showMessage(
                data.message ||
                "تم حذف العضو من النظام.",
                "success"
            );


            await loadMembers();


        } catch (error) {

            console.error(
                "DELETE USER ERROR:",
                error
            );


            showMessage(
                error.message ||
                "حدث خطأ أثناء حذف العضو.",
                "error"
            );


        } finally {

            if (deleteUserBtn) {

                deleteUserBtn.disabled =
                    false;


                deleteUserBtn.textContent =
                    defaultLabel;

            }

        }

    }
);


// ==================================================
// تحميل الأعضاء
// ==================================================

loadMembers();


// ==================================================
// تحديث حالة الأعضاء تلقائياً
// ==================================================
//
// كل 30 ثانية:
// - نطلب أحدث last_seen_at من السيرفر
// - نحدث فقط حالة العضو
// - لا نعيد بناء البطاقات
//

setInterval(
    refreshMemberStatuses,
    30000
);
