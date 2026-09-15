/////////// importing required modules //////////////////
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const jwt = require("jsonwebtoken");
const supabase = require("./supabase");
const multer = require("multer");
const helmet = require("helmet");
const upload = multer({
    storage: multer.memoryStorage()
});

// =====================================================
// GOOGLE DRIVE
// =====================================================

const { google } = require("googleapis");
const { Readable } = require("stream");


// =====================================================
// CREATE EXPRESS APP
// =====================================================

const app = express();

app.disable("x-powered-by");

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);


// =====================================================
// GOOGLE DRIVE OAUTH CLIENT
// =====================================================

const oauth2Client =
    new google.auth.OAuth2(

        process.env.GOOGLE_CLIENT_ID,

        process.env.GOOGLE_CLIENT_SECRET,

        process.env.GOOGLE_REDIRECT_URI

    );


// =====================================================
// CREATE GOOGLE DRIVE CLIENT
// =====================================================

function getGoogleDriveClient() {

    if (!process.env.GOOGLE_REFRESH_TOKEN) {

        throw new Error(
            "GOOGLE_REFRESH_TOKEN is missing"
        );

    }

    oauth2Client.setCredentials({

        refresh_token:
            process.env.GOOGLE_REFRESH_TOKEN

    });

    return google.drive({

        version: "v3",

        auth: oauth2Client

    });

}


// =====================================================
// GOOGLE AUTH URL
// =====================================================

function getGoogleAuthUrl() {

    return oauth2Client.generateAuthUrl({

        access_type: "offline",

        prompt: "consent",

        scope: [

            "https://www.googleapis.com/auth/drive.file"

        ]

    });

}


// =====================================================
// EXCHANGE GOOGLE CODE FOR TOKENS
// =====================================================

async function exchangeCodeForTokens(code) {

    const { tokens } =
        await oauth2Client.getToken(code);

    return tokens;

}


// =====================================================
// SET REFRESH TOKEN
// =====================================================

function setRefreshToken(refreshToken) {

    oauth2Client.setCredentials({

        refresh_token:
            refreshToken

    });

}


// =====================================================
// UPLOAD FILE TO GOOGLE DRIVE
// =====================================================

async function uploadToGoogleDrive(file) {

    const drive =
        getGoogleDriveClient();


    // =====================================================
    // UPLOAD FILE
    // =====================================================

    const response =
        await drive.files.create({

            requestBody: {

                name:
                    file.originalname,

                parents: [

                    process.env
                        .GOOGLE_DRIVE_FOLDER_ID

                ]

            },

            media: {

                mimeType:
                    file.mimetype,

                body:
                    Readable.from(
                        file.buffer
                    )

            },

            fields:
                "id,name,mimeType"

        });


    const fileId =
        response.data.id;


    // =====================================================
    // MAKE FILE PUBLIC
    // =====================================================

    await drive.permissions.create({

        fileId: fileId,

        requestBody: {

            role: "reader",

            type: "anyone"

        }

    });


    // =====================================================
    // RETURN FILE DATA
    // =====================================================

    return {

        id:
            fileId,

        name:
            response.data.name,

        mimeType:
            response.data.mimeType,

        directUrl:
            `https://drive.google.com/uc?export=view&id=${fileId}`,

        webViewLink:
            `https://drive.google.com/file/d/${fileId}/view`

    };

}
app.get(
    "/projects/file/:fileId",
    async (req, res) => {

        try {

            const fileId = req.params.fileId;

            if (!fileId) {
                return res.status(400).send("File ID is required");
            }

            const drive = getGoogleDriveClient();

            // جلب metadata الملف أولاً
            const meta = await drive.files.get({
                fileId,
                fields: "id,name,mimeType,size"
            });

            const driveResponse = await drive.files.get(
                { fileId, alt: "media" },
                { responseType: "stream" }
            );

            res.setHeader("Content-Type", meta.data.mimeType || "application/octet-stream");
            res.setHeader("Cache-Control", "public, max-age=86400");
            if (meta.data.size) res.setHeader("Content-Length", meta.data.size);

            driveResponse.data.pipe(res);

        } catch (error) {

            console.error("❌ PROJECT FILE ERROR:", error.message);
            return res.status(404).send("File not found");

        }

    }
);

app.get(
    "/projects/image/:fileId",
    async (req, res) => {

        try {

            const fileId = req.params.fileId;

            if (!fileId) {
                return res.status(400).send("File ID is required");
            }

            const drive = getGoogleDriveClient();

            const meta = await drive.files.get({
                fileId,
                fields: "id,mimeType,size"
            });

            const driveResponse = await drive.files.get(
                { fileId, alt: "media" },
                { responseType: "stream" }
            );

            res.setHeader("Content-Type", meta.data.mimeType || "image/jpeg");
            res.setHeader("Cache-Control", "public, max-age=86400");
            if (meta.data.size) res.setHeader("Content-Length", meta.data.size);

            driveResponse.data.pipe(res);

        } catch (error) {

            console.error("❌ PROJECT IMAGE ERROR:", error.message);
            return res.status(404).send("Image not found");

        }

    }
);

// =====================================================
// SERVE CHANNEL IMAGE FROM GOOGLE DRIVE
// =====================================================

app.get(
    "/channels/image/:fileId",
    async (req, res) => {

        try {

            const fileId = req.params.fileId;

            if (!fileId) {
                return res.status(400).send("File ID is required");
            }

            const drive = getGoogleDriveClient();

            const meta = await drive.files.get({
                fileId,
                fields: "id,mimeType,size"
            });

            const driveResponse = await drive.files.get(
                { fileId, alt: "media" },
                { responseType: "stream" }
            );

            res.setHeader("Content-Type", meta.data.mimeType || "image/jpeg");
            res.setHeader("Cache-Control", "public, max-age=86400");
            if (meta.data.size) res.setHeader("Content-Length", meta.data.size);

            driveResponse.data.pipe(res);

        } catch (error) {

            console.error("❌ CHANNEL IMAGE ERROR:", error.message);
            return res.status(404).send("Image not found");

        }

    }
);


// =====================================================
// GOOGLE DRIVE OAUTH ROUTE
// =====================================================

// فتح صفحة تسجيل الدخول وربط Google Drive

app.get(
    "/auth/google",
    (req, res) => {

        const url =
            getGoogleAuthUrl();

        res.redirect(url);

    }
);


// =====================================================
// GOOGLE OAUTH CALLBACK
// =====================================================

app.get("/auth/google/callback", async (req, res) => {

    try {

        const { code } = req.query;

        if (!code) {

            return res.status(400).send(
                "Google authorization code is missing"
            );

        }

        const tokens =
            await exchangeCodeForTokens(code);

        console.log("=================================");
        console.log("GOOGLE TOKENS");
        console.log(tokens);
        console.log("=================================");

        res.send(`

            <html>

                <head>
                    <title>Google Drive</title>
                </head>

                <body>

                    <h2>
                        Google Drive connected successfully ✅
                    </h2>

                    <p>
                        You can close this window.
                    </p>

                </body>

            </html>

        `);

    } catch (error) {

        console.error(
            "Google OAuth Error:",
            error
        );

        res.status(500).send(`

            <html>

                <head>
                    <title>Google Drive Error</title>
                </head>

                <body>

                    <h2>
                        Google Drive connection failed ❌
                    </h2>

                    <pre>
${error.message}
                    </pre>

                </body>

            </html>

        `);

    }

});


// =====================================================
// TEST GOOGLE DRIVE UPLOAD
// =====================================================

app.post(
    "/test-google-drive",
    upload.single("file"),
    async (req, res) => {

        try {

            // -------------------------------------------------
            // CHECK FILE
            // -------------------------------------------------

            if (!req.file) {

                return res.status(400).json({

                    success: false,

                    error:
                        "No file uploaded"

                });

            }


            // -------------------------------------------------
            // UPLOAD TO GOOGLE DRIVE
            // -------------------------------------------------

            const result =
                await uploadToGoogleDrive(
                    req.file
                );


            // -------------------------------------------------
            // LOG RESULT
            // -------------------------------------------------

            console.log(
                "GOOGLE DRIVE UPLOAD RESULT:",
                result
            );


            // -------------------------------------------------
            // RESPONSE
            // -------------------------------------------------

            return res.json({

                success: true,

                message:
                    "File uploaded to Google Drive successfully",

                file: {

                    id:
                        result.id,

                    name:
                        result.name,

                    mimeType:
                        result.mimeType,

                    directUrl:
                        result.directUrl,

                    webViewLink:
                        result.webViewLink

                }

            });

        } catch (error) {

            console.error(
                "Google Drive Upload Error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);
// =====================================================
// N8N NOTIFICATION SERVICE
// =====================================================

const NotificationType = Object.freeze({

    TASK_ASSIGNED:
        "TASK_ASSIGNED",

    TASK_DUE_DATE_CHANGED:
        "TASK_DUE_DATE_CHANGED",

    TASK_OVERDUE:
        "TASK_OVERDUE",

    PROJECT_MEMBER_ADDED:
        "PROJECT_MEMBER_ADDED",

    TASK_CREATED:
        "TASK_CREATED",

    USER_ROLE_CHANGED:
        "USER_ROLE_CHANGED"

});


// =====================================================
// NOTIFICATION CONTENT
// =====================================================

function buildNotificationContent(type, data = {}) {

    const taskTitle =
        data.taskTitle ||
        "المهمة";


    switch (type) {

        case NotificationType.TASK_ASSIGNED:

            return {

                title:
                    "تم تعيين مهمة لك",

                message:
                    `تم تعيين المهمة "${taskTitle}" لك.`,

                link:
                    data.taskId
                        ? `/tasks/${data.taskId}`
                        : null

            };


        case NotificationType.TASK_DUE_DATE_CHANGED:

            return {

                title:
                    "تم تغيير موعد المهمة",

                message:
                    `تم تغيير موعد المهمة "${taskTitle}".`,

                link:
                    data.taskId
                        ? `/tasks/${data.taskId}`
                        : null

            };


        case NotificationType.TASK_OVERDUE:

            return {

                title:
                    "مهمة متأخرة",

                message:
                    `المهمة "${taskTitle}" متأخرة منذ ${data.daysOverdue || 0} يوم.`,

                link:
                    data.taskId
                        ? `/tasks/${data.taskId}`
                        : null

            };


        case NotificationType.PROJECT_MEMBER_ADDED:

            return {

                title:
                    "تمت إضافتك إلى مشروع",

                message:
                    data.projectTitle
                        ? `تمت إضافتك إلى مشروع "${data.projectTitle}".`
                        : "تمت إضافتك إلى مشروع جديد.",

                link:
                    data.projectId
                        ? `/projects/${data.projectId}`
                        : null

            };


        case NotificationType.TASK_CREATED:

            return {

                title:
                    "تم إنشاء مهمة جديدة",

                message:
                    `تم إنشاء المهمة "${taskTitle}".`,

                link:
                    data.taskId
                        ? `/tasks/${data.taskId}`
                        : null

            };


        case NotificationType.USER_ROLE_CHANGED:

            return {

                title:
                    "تم تغيير صلاحياتك",

                message:
                    data.role
                        ? `تم تحديث دور حسابك إلى "${data.role}".`
                        : "تم تحديث صلاحيات حسابك.",

                link:
                    null

            };


        default:

            return {

                title:
                    "إشعار جديد",

                message:
                    "لديك إشعار جديد في TrillFlow.",

                link:
                    null

            };

    }

}


// =====================================================
// SAVE IN-APP NOTIFICATION
// =====================================================

async function saveInAppNotification({

    user,
    type,
    data = {}

}) {

    try {

        if (
            !user ||
            !user.id
        ) {

            console.error(
                "Cannot save notification: user id missing"
            );

            return {
                ok: false
            };

        }


        const content =
            buildNotificationContent(
                type,
                data
            );


        const {
            error
        } = await supabase
            .from("notifications")
            .insert({

                user_id:
                    user.id,

                type:
                    type,

                title:
                    content.title,

                message:
                    content.message,

                link:
                    content.link,

                data:
                    data,

                is_read:
                    false

            });


        if (error) {

            console.error(
                "IN-APP NOTIFICATION ERROR:",
                error
            );

            return {
                ok: false
            };

        }


        console.log(
            `IN-APP NOTIFICATION SAVED: ${type} → ${user.id}`
        );


        return {
            ok: true
        };


    } catch (error) {

        console.error(
            "SAVE IN-APP NOTIFICATION ERROR:",
            error
        );

        return {
            ok: false
        };

    }

}


// =====================================================
// SEND NOTIFICATION TO N8N
// =====================================================

async function sendNotificationEmail({

    user,
    type,
    data = {}

}) {

    try {

        const webhookUrl =
            process.env.N8N_NOTIFICATION_WEBHOOK_URL;


        if (!webhookUrl) {

            console.error(
                "N8N_NOTIFICATION_WEBHOOK_URL غير موجود"
            );

            return {
                ok: false
            };

        }


        if (
            !user ||
            !user.email
        ) {

            console.error(
                "User email missing"
            );

            return {
                ok: false
            };

        }


        const payload = {

            type,

            user: {

                id:
                    user.id,

                name:
                    user.username ||
                    user.name ||
                    "مستخدم",

                email:
                    user.email

            },

            data:
                data

        };


        console.log(
            "N8N Notification:",
            payload
        );


        const response =
            await fetch(
                webhookUrl,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        if (
            !response.ok
        ) {

            console.error(
                "Webhook failed:",
                response.status
            );

            return {
                ok: false
            };

        }


        console.log(
            "Notification sent to N8N:",
            type
        );


        return {
            ok: true
        };


    } catch (error) {

        console.error(
            "N8N Notification error:",
            error.message ||
            error
        );


        return {
            ok: false
        };

    }

}


// =====================================================
// SEND BOTH
// IN-APP + N8N
// =====================================================

async function sendNotification({

    user,
    type,
    data = {}

}) {

    const results =
        await Promise.allSettled([

            saveInAppNotification({

                user,
                type,
                data

            }),

            sendNotificationEmail({

                user,
                type,
                data

            })

        ]);


    return {

        inApp:
            results[0].status === "fulfilled"
                ? results[0].value
                : { ok: false },

        n8n:
            results[1].status === "fulfilled"
                ? results[1].value
                : { ok: false }

    };

}
// =====================================================
// Middleware
// =====================================================

app.use(express.json());
app.use(cookieParser());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

// =====================================================
// Middleware للتحقق من JWT
// =====================================================

function verifyToken(req, res, next) {

    const token = req.cookies.token;

    if (!token) {

        return res.status(401).json({
            message: "لا يوجد Token."
        });

    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;


        next();

    } catch (err) {

        console.error(
            "JWT ERROR:",
            err
        );

        return res.status(401).json({
            message: "Token غير صالح."
        });

    }

}
// =====================================================
// التحقق من الجلسة الحالية
// =====================================================

// =====================================================
// التحقق من الجلسة الحالية
// =====================================================

app.get(
    "/check-session",
    verifyToken,
    async (req, res) => {

        try {

            // تحديث آخر ظهور للمستخدم
            await supabase
                .from("users")
                .update({
                    last_seen_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    req.user.id
                );

        } catch (error) {

            console.error(
                "UPDATE LAST SEEN ERROR:",
                error
            );

        }

        return res.status(200).json({

            loggedIn: true,

            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role
            }

        });

    }
);
// =====================================================
// Middleware للتحقق من صلاحية المستخدم
// =====================================================

function requireRole(...allowedRoles) {

    return (req, res, next) => {

        if (!req.user) {

            return res.status(401).json({
                message: "غير مصرح."
            });

        }

        if (!allowedRoles.includes(req.user.role)) {

            return res.status(403).json({
                message:
                    "ليس لديك صلاحية لتنفيذ هذا الإجراء."
            });

        }

        next();

    };

}

// =====================================================
// Project workspace access and file helpers
// =====================================================

const PROJECT_FILES_BUCKET = "project-files";
const LEGACY_PROJECT_FILES_BUCKET = "task-files";
const PROJECT_MANAGER_ROLES = ["owner", "manager", "admin"];

function isValidProjectId(value) {

    const projectId = Number(value);

    return Number.isInteger(projectId) && projectId > 0;

}

async function getProjectAccess(projectId, userId) {

    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

    if (projectError) {
        throw projectError;
    }

    if (!project) {
        return { project: null, access: null };
    }

    if (Number(project.user_id) === Number(userId)) {
        return { project, access: "owner" };
    }

    const { data: membership, error: membershipError } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .maybeSingle();

    if (membershipError) {
        throw membershipError;
    }

    return {
        project,
        access: membership ? "member" : null
    };

}

async function canAccessProject(projectId, userId) {

    const result = await getProjectAccess(projectId, userId);

    return Boolean(result.access);

}

async function canManageProject(projectId, userId, role) {

    if (!PROJECT_MANAGER_ROLES.includes(role)) {
        return false;
    }

    return canAccessProject(projectId, userId);

}

async function ensureProjectFilesBucket() {

    const { data: bucket, error: bucketError } = await supabase.storage
        .getBucket(PROJECT_FILES_BUCKET);

    if (bucket) {
        return;
    }

    // "not found" is expected on first upload. Other errors should still be
    // surfaced, rather than accidentally attempting to recreate the bucket.
    if (bucketError && !/not found|does not exist/i.test(bucketError.message || "")) {
        throw bucketError;
    }

    const { error: createError } = await supabase.storage
        .createBucket(PROJECT_FILES_BUCKET, {
            public: false,
            fileSizeLimit: "52428800"
        });

    if (createError && !/already exists/i.test(createError.message || "")) {
        throw createError;
    }

}

function getFileExtension(fileName = "") {

    return path.extname(String(fileName)).toLowerCase();

}

function isPreviewableFile(fileType = "", fileName = "") {

    const extension = getFileExtension(fileName);

    return String(fileType).startsWith("image/") ||
        fileType === "application/pdf" ||
        [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".pdf", ".txt", ".md", ".csv"].includes(extension);

}

function legacyProjectFileName(storageName = "") {

    const name = String(storageName).replace(/^\d+_[a-z0-9]+_/i, "");

    try {
        return decodeURIComponent(name);
    } catch {
        return name;
    }

}

function projectFilePayload(file, projectId) {

    const basePath = `/projects/${projectId}/files/${file.id}`;

    return {
        id: file.id,
        file_name: file.file_name,
        file_type: file.file_type || "application/octet-stream",
        file_size: Number(file.file_size || 0),
        created_at: file.created_at,
        uploaded_by: file.uploaded_by,
        uploader: file.users || null,
        previewable: isPreviewableFile(file.file_type, file.file_name),
        preview_url: `${basePath}/view`,
        download_url: `${basePath}/download`
    };

}

function legacyProjectFilePayload(file, projectId) {

    const storagePath = `projects/${projectId}/${file.name}`;
    const query = `path=${encodeURIComponent(storagePath)}`;
    const fileName = legacyProjectFileName(file.name);
    const fileType = file.metadata?.mimetype || "application/octet-stream";

    return {
        id: `legacy:${storagePath}`,
        file_name: fileName,
        file_type: fileType,
        file_size: Number(file.metadata?.size || 0),
        created_at: file.created_at || file.updated_at || null,
        uploaded_by: null,
        uploader: null,
        legacy: true,
        storage_path: storagePath,
        previewable: isPreviewableFile(fileType, fileName),
        preview_url: `/projects/${projectId}/legacy-files/view?${query}`,
        download_url: `/projects/${projectId}/legacy-files/download?${query}`
    };

}

async function uploadProjectFile({ projectId, file, userId }) {

    const originalName =
        String(file.originalname || "file").trim() || "file";

    const safeFileName =
        originalName.replace(/[\\/]/g, "-");

    // ==========================================
    // رفع الملف إلى Google Drive
    // ==========================================

    const uploadedFile =
        await uploadToGoogleDrive(file);

    const googleDriveFileId =
        uploadedFile.id;

    // ==========================================
    // رابط الملف من السيرفر
    // ==========================================

    const fileUrl =
        `/projects/file/${googleDriveFileId}`;

    // ==========================================
    // حفظ بيانات الملف في Supabase
    // ==========================================

    const {
        data: savedFile,
        error: insertError
    } = await supabase
        .from("project_files")
        .insert({
            project_id:
                projectId,

            file_name:
                safeFileName,

            storage_path:
                fileUrl,

            file_type:
                file.mimetype ||
                "application/octet-stream",

            file_size:
                Number(file.size || 0),

            uploaded_by:
                userId
        })
        .select(`
            id,
            project_id,
            file_name,
            storage_path,
            file_type,
            file_size,
            uploaded_by,
            created_at,
            users (
                id,
                username,
                email
            )
        `)
        .single();

    if (insertError) {

        console.error(
            "PROJECT FILE DATABASE ERROR:",
            insertError
        );

        throw insertError;
    }

    console.log(
        "✅ PROJECT FILE UPLOADED TO GOOGLE DRIVE:",
        {
            projectId,
            fileName: safeFileName,
            googleDriveFileId
        }
    );

    return {
        ...savedFile,

        google_drive_file_id:
            googleDriveFileId,

        file_url:
            fileUrl
    };
}
async function streamProjectFile(req, res, { file, disposition }) {

    const drive = getGoogleDriveClient();

    // استخراج Google Drive File ID من storage_path
    const googleDriveFileId =
        String(file.storage_path || "")
            .split("/")
            .filter(Boolean)
            .pop();

    if (!googleDriveFileId) {
        const error = new Error(
            "معرف ملف Google Drive غير موجود."
        );

        error.status = 404;
        throw error;
    }

    console.log(
        "🔥 GOOGLE DRIVE STREAM:",
        {
            projectId: req.params.id,
            fileId: req.params.fileId,
            storagePath: file.storage_path,
            googleDriveFileId,
            fileName: file.file_name
        }
    );

    // جلب معلومات الملف
    const metadataResponse =
        await drive.files.get({
            fileId: googleDriveFileId,
            fields: "id,name,mimeType,size"
        });

    const driveFile = metadataResponse.data;

    // تحميل الملف من Google Drive كـ Stream
    const driveResponse =
        await drive.files.get(
            {
                fileId: googleDriveFileId,
                alt: "media"
            },
            {
                responseType: "stream"
            }
        );

    const fileName =
        encodeURIComponent(
            file.file_name ||
            driveFile.name ||
            "download"
        );

    res.setHeader(
        "Content-Type",
        file.file_type ||
        driveFile.mimeType ||
        "application/octet-stream"
    );

    res.setHeader(
        "Content-Disposition",
        `${disposition}; filename="${fileName}"; filename*=UTF-8''${fileName}`
    );

    res.setHeader(
        "Cache-Control",
        "private, no-store"
    );

    if (driveFile.size) {
        res.setHeader(
            "Content-Length",
            driveFile.size
        );
    }

    driveResponse.data.pipe(res);
}

// =====================================================
// تسجيل الدخول
// =====================================================

app.post(
    "/signin",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;


            // =================================================
            // التحقق من البيانات
            // =================================================

            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    message:
                        "يرجى إدخال البريد الإلكتروني وكلمة المرور."

                });

            }


            // =================================================
            // جلب المستخدم
            // =================================================

            const {
                data: user,
                error
            } = await supabase

                .from("users")

                .select(
                    "id, username, email, password, role,last_seen_at"
                )

                .eq(
                    "email",
                    email
                )

                .maybeSingle();


            // =================================================
            // خطأ قاعدة البيانات
            // =================================================

            if (error) {

                console.error(
                    "Signin error:",
                    error
                );

                return res.status(500).json({

                    message:
                        "حدث خطأ في الخادم."

                });

            }


            // =================================================
            // الحساب غير موجود
            // =================================================

            if (!user) {

                return res.status(404).json({

                    message:
                        "الحساب غير موجود."

                });

            }


            // =================================================
            // التحقق من كلمة المرور
            // =================================================

            if (
                user.password !== password
            ) {

                return res.status(401).json({

                    message:
                        "كلمة المرور غير صحيحة."

                });

            }


            // =================================================
            // إنشاء JWT
            // =================================================

            const token =
                jwt.sign(

                    {

                        id:
                            user.id,

                        username:
                            user.username,

                        email:
                            user.email,

                        role:
                            user.role

                    },

                    process.env.JWT_SECRET,

                    {

                        expiresIn:
                            "30d"

                    }

                );


            // =================================================
            // حفظ JWT في Cookie
            // =================================================

            res.cookie(
                "token",
                token,
                {

                    httpOnly:
                        true,

                    secure:
                        false,

                    sameSite:
                        "lax",

                    path:
                        "/",

                    maxAge:
                        30 *
                        24 *
                        60 *
                        60 *
                        1000

                }
            );


            // =================================================
            // إرسال بيانات تسجيل الدخول إلى n8n
            // =================================================

            try {

                const n8nResponse =
                    await fetch(
                        process.env.N8N_LOGIN_WEBHOOK,
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    email:
                                        user.email,

                                    username:
                                        user.username,

                                    event:
                                        "login"

                                })

                        }
                    );


                // =============================================
                // فحص استجابة n8n
                // =============================================

                if (
                    !n8nResponse.ok
                ) {

                    const n8nError =
                        await n8nResponse.text();

                    console.error(
                        "n8n webhook error:",
                        n8nResponse.status,
                        n8nError
                    );

                } else {

                    console.log(
                        "Login notification sent to n8n."
                    );

                }


            } catch (n8nError) {

                console.error(
                    "n8n connection error:",
                    n8nError
                );

                // =============================================
                // مهم:
                // فشل n8n لا يفشل تسجيل الدخول
                // =============================================

            }


            // =================================================
            // نجاح تسجيل الدخول
            // =================================================

            return res.status(200).json({

                message:
                    "تم تسجيل الدخول بنجاح."

            });


        } catch (error) {

            console.error(
                "POST /signin ERROR:",
                error
            );

            return res.status(500).json({

                message:
                    "حدث خطأ في الخادم."

            });

        }

    }
);
// =====================================================
// صفحة Dashboard محمية
// =====================================================

app.get(
    "/dashboard",
    verifyToken,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "private",
                "dashboard.html"
            )
        );

    }
);

// =====================================================
// عرض اسم المستخدم الحالي
// =====================================================

app.get(
    "/user",
    verifyToken,
    async (req, res) => {

        try {

            const {
                data,
                error
            } = await supabase
                .from("users")
                .select("id, username, role, email")
                .eq(
                    "id",
                    req.user.id
                )
                .single();

            if (error) {

                console.error(
                    "GET /user ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        error.message
                });

            }

            return res.json(data);

        } catch (error) {

            console.error(
                "GET /user ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);
// =====================================================
// إضافة عضو جديد إلى النظام
// =====================================================

app.post(
    "/users",
    verifyToken,
    requireRole("owner", "manager", "admin"),
    async (req, res) => {

        try {

            const {
                username,
                email,
                password,
                role
            } = req.body;


            // =================================================
            // التحقق من البيانات
            // =================================================

            if (
                !username ||
                !email ||
                !password ||
                !role
            ) {

                return res.status(400).json({
                    message:
                        "يرجى إدخال جميع البيانات."
                });

            }


            // =================================================
            // التحقق من أن البريد غير مستخدم
            // =================================================

            const {
                data: existingUser,
                error: existingError
            } = await supabase
                .from("users")
                .select("id")
                .eq(
                    "email",
                    email
                )
                .maybeSingle();


            if (existingError) {

                console.error(
                    "Check existing user error:",
                    existingError
                );

                return res.status(500).json({
                    message:
                        "حدث خطأ أثناء التحقق من البريد."
                });

            }


            if (existingUser) {

                return res.status(409).json({
                    message:
                        "البريد الإلكتروني مستخدم بالفعل."
                });

            }


            // =================================================
            // إنشاء المستخدم
            // =================================================

            const {
                data: newUser,
                error: insertError
            } = await supabase
                .from("users")
                .insert([
                    {
                        username:
                            username.trim(),

                        email:
                            email.trim(),

                        password:
                            password,

                        role:
                            role
                    }
                ])
                .select(
                    "id, username, email, role"
                )
                .single();


            if (insertError) {

                console.error(
                    "Create user error:",
                    insertError
                );

                return res.status(500).json({
                    message:
                        "فشل إنشاء العضو.",
                    error:
                        insertError.message
                });

            }


            // =================================================
            // نجاح
            // =================================================

            return res.status(201).json({

                message:
                    "تم إضافة العضو بنجاح.",

                user:
                    newUser

            });


        } catch (error) {

            console.error(
                "POST /users ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);

// =====================================================
// تعديل بيانات مستخدم
// =====================================================

app.patch(
    "/users/:id",
    verifyToken,
    requireRole("owner", "manager", "admin"),
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const {
                username,
                email,
                password,
                role
            } = req.body;


            // =================================================
            // التحقق
            // =================================================

            if (
                !username ||
                !email ||
                !role
            ) {

                return res.status(400).json({

                    message:
                        "اسم المستخدم والبريد والصلاحية مطلوبة."

                });

            }


            // =================================================
            // التأكد أن المستخدم موجود
            // =================================================

            const {
                data: existingUser,
                error: userError
            } = await supabase
                .from("users")
                .select(
                    "id, username, email, role"
                )
                .eq(
                    "id",
                    id
                )
                .maybeSingle();


            if (userError) {

                console.error(
                    "Find user error:",
                    userError
                );

                return res.status(500).json({

                    message:
                        "حدث خطأ أثناء البحث عن المستخدم."

                });

            }


            if (!existingUser) {

                return res.status(404).json({

                    message:
                        "المستخدم غير موجود."

                });

            }


            // =================================================
            // التأكد أن البريد غير مستخدم
            // من مستخدم آخر
            // =================================================

            const {
                data: emailUser,
                error: emailError
            } = await supabase
                .from("users")
                .select("id")
                .eq(
                    "email",
                    email.trim()
                )
                .neq(
                    "id",
                    id
                )
                .maybeSingle();


            if (emailError) {

                console.error(
                    "Email check error:",
                    emailError
                );

                return res.status(500).json({

                    message:
                        "حدث خطأ أثناء التحقق من البريد."

                });

            }


            if (emailUser) {

                return res.status(409).json({

                    message:
                        "البريد الإلكتروني مستخدم بالفعل."

                });

            }


            // =================================================
            // البيانات التي سيتم تحديثها
            // =================================================

            const updateData = {

                username:
                    username.trim(),

                email:
                    email.trim(),

                role:
                    role

            };


            // =================================================
            // تحديث كلمة المرور فقط إذا تم إدخالها
            // =================================================

            if (
                password &&
                password.trim()
            ) {

                updateData.password =
                    password;

            }


            // =================================================
            // تحديث المستخدم
            // =================================================

            const {
                data: updatedUser,
                error: updateError
            } = await supabase
                .from("users")
                .update(
                    updateData
                )
                .eq(
                    "id",
                    id
                )
                .select(
                    "id, username, email, role"
                )
                .single();


            if (updateError) {

                console.error(
                    "Update user error:",
                    updateError
                );

                return res.status(500).json({

                    message:
                        "فشل تحديث بيانات المستخدم.",

                    error:
                        updateError.message

                });

            }
            // =====================================================
            // إرسال إشعار عند تغيير العضوية
            // =====================================================

            if (
                String(existingUser.role) !==
                String(updatedUser.role)
            ) {

                try {

                    const currentUserId =
                        req.user.id ||
                        req.user.userId ||
                        req.user.user_id;

                    let changedByName = null;

                    if (currentUserId) {

                        const {
                            data: currentUser
                        } = await supabase
                            .from("users")
                            .select("username")
                            .eq("id", currentUserId)
                            .maybeSingle();

                        if (currentUser) {
                            changedByName =
                                currentUser.username;
                        }
                    }

                    await sendNotificationEmail({

                        user: {
                            id:
                                updatedUser.id,

                            username:
                                updatedUser.username,

                            email:
                                updatedUser.email
                        },

                        type:
                            NotificationType.USER_ROLE_CHANGED,

                        data: {

                            oldRole:
                                existingUser.role,

                            newRole:
                                updatedUser.role,

                            changedBy:
                                changedByName
                        }

                    });

                } catch (notificationError) {

                    console.error(
                        "USER_ROLE_CHANGED notification error:",
                        notificationError
                    );

                }
            }

            // =================================================
            // النجاح
            // =================================================

            return res.status(200).json({

                message:
                    "تم تحديث بيانات المستخدم بنجاح.",

                user:
                    updatedUser

            });


        } catch (error) {

            console.error(
                "PATCH /users/:id ERROR:",
                error
            );

            return res.status(500).json({

                message:
                    "حدث خطأ في السيرفر."

            });

        }

    }
);

// =====================================================
// حذف عضو من النظام
// =====================================================

app.delete(
    "/users/:id",
    verifyToken,
    requireRole("owner"),
    async (req, res) => {

        try {

            const userId = Number(req.params.id);
            const currentUserId = Number(req.user.id);

            if (!Number.isInteger(userId) || userId <= 0) {

                return res.status(400).json({
                    message: "رقم المستخدم غير صحيح."
                });

            }

            if (userId === currentUserId) {

                return res.status(400).json({
                    message: "لا يمكنك حذف حسابك الحالي."
                });

            }

            const {
                data: user,
                error: userError
            } = await supabase
                .from("users")
                .select("id, username, role")
                .eq("id", userId)
                .maybeSingle();

            if (userError) {

                console.error("FIND USER FOR DELETE ERROR:", userError);

                return res.status(500).json({
                    message: "تعذر التحقق من المستخدم."
                });

            }

            if (!user) {

                return res.status(404).json({
                    message: "المستخدم غير موجود."
                });

            }

            if (user.role === "owner") {

                return res.status(403).json({
                    message: "لا يمكن حذف حساب مالك النظام."
                });

            }

            // نحافظ على المشاريع والقنوات التي أنشأها العضو بتحويل
            // ملكيتها إلى مالك النظام، ثم نحذف كل علاقاته الشخصية.
            const cleanupOperations = [
                ["password_resets", "user_id"],
                ["task_members", "user_id"],
                ["project_members", "user_id"],
                ["channel_members", "user_id"],
                ["task_comments", "user_id"],
                ["channel_messages", "user_id"]
            ];

            for (const [table, column] of cleanupOperations) {

                const { error } = await supabase
                    .from(table)
                    .delete()
                    .eq(column, userId);

                if (error) {

                    console.error(
                        `DELETE USER ${table.toUpperCase()} ERROR:`,
                        error
                    );

                    return res.status(500).json({
                        message: "تعذر حذف البيانات المرتبطة بالعضو."
                    });

                }

            }

            const { error: projectsError } = await supabase
                .from("projects")
                .update({ user_id: currentUserId })
                .eq("user_id", userId);

            if (projectsError) {

                console.error("TRANSFER USER PROJECTS ERROR:", projectsError);

                return res.status(500).json({
                    message: "تعذر نقل مشاريع العضو قبل الحذف."
                });

            }

            const { error: channelsError } = await supabase
                .from("channels")
                .update({ created_by: currentUserId })
                .eq("created_by", userId);

            if (channelsError) {

                console.error("TRANSFER USER CHANNELS ERROR:", channelsError);

                return res.status(500).json({
                    message: "تعذر نقل قنوات العضو قبل الحذف."
                });

            }

            const { error: deleteError } = await supabase
                .from("users")
                .delete()
                .eq("id", userId);

            if (deleteError) {

                console.error("DELETE USER ERROR:", deleteError);

                return res.status(500).json({
                    message: "فشل حذف العضو من النظام."
                });

            }

            return res.json({
                message: `تم حذف العضو ${user.username || ""} من النظام.`
            });

        } catch (error) {

            console.error("DELETE /users/:id ERROR:", error);

            return res.status(500).json({
                message: "حدث خطأ أثناء حذف العضو."
            });

        }

    }
);

// =====================================================
// جلب جميع أعضاء النظام
// =====================================================

app.get("/users", verifyToken, async (req, res) => {

    try {

        const {
            data,
            error
        } = await supabase
            .from("users")
            .select(
                "id, username, email, role"
            )
            .order(
                "id",
                {
                    ascending: true
                }
            );

        if (error) {

            console.error(
                "Users fetch error:",
                error
            );

            return res.status(500).json({
                message:
                    "فشل جلب أعضاء النظام."
            });

        }

        return res.json(data);

    } catch (error) {

        console.error(
            "GET /users ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "حدث خطأ في السيرفر."
        });

    }

}
);

// =====================================================
// إنشاء حساب
// =====================================================

// app.post(
//     "/signup",
//     async (req, res) => {

//         try {

//             const {
//                 signupusername,
//                 signupemail,
//                 signuppassword
//             } = req.body;

//             if (
//                 !signupusername ||
//                 !signupemail ||
//                 !signuppassword
//             ) {

//                 return res.status(400).json({
//                     message:
//                         "يرجى إدخال جميع الحقول."
//                 });

//             }

// =================================================
// التأكد أن الحساب غير موجود
// =================================================

// const {
//     data: user,
//     error
// } = await supabase
//     .from("users")
//     .select("id")
//     .eq(
//         "email",
//         signupemail
//     )
//     .maybeSingle();

// if (error) {

//     console.error(
//         "Signup user lookup error:",
//         error
//     );

//     return res.status(500).json({
//         message:
//             "حدث خطأ في الخادم."
//     });

// }

// if (user) {

//     return res.status(409).json({
//         message:
//             "الحساب موجود بالفعل، يرجى تسجيل الدخول."
//     });

// }

// =================================================
// إنشاء المستخدم
// =================================================

//             const {
//                 data,
//                 error: insertError
//             } = await supabase
//                 .from("users")
//                 .insert([
//                     {
//                         username:
//                             signupusername,

//                         email:
//                             signupemail,

//                         password:
//                             signuppassword
//                     }
//                 ])
//                 .select();

//             if (insertError) {

//                 console.error(
//                     "Signup insert error:",
//                     insertError
//                 );

//                 return res.status(500).json({
//                     message:
//                         "فشل إنشاء الحساب."
//                 });

//             }

//             return res.status(201).json({

//                 message:
//                     "تم إنشاء الحساب بنجاح.",

//                 user:
//                     data

//             });

//         } catch (error) {

//             console.error(
//                 "POST /signup ERROR:",
//                 error
//             );

//             return res.status(500).json({
//                 message:
//                     "حدث خطأ في الخادم."
//             });

//         }

//     }
// );

// =====================================================
// تسجيل الخروج
// =====================================================

app.post(
    "/logout",
    (req, res) => {

        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/"
        });

        return res.json({
            message:
                "تم تسجيل الخروج."
        });

    }
);
// =====================================================
// إضافة مشروع
// =====================================================
app.post(
    "/addproject",
    verifyToken,
    upload.fields([
        { name: "projectImage", maxCount: 1 },
        { name: "files", maxCount: 20 }
    ]),
    async (req, res) => {

        try {

            const {
                title,
                description,
                status,
                start_date,
                due_date,
                Priority,
                members
            } = req.body;

            const projectImageFile =
                req.files?.projectImage?.[0] || null;

            const projectFiles =
                req.files?.files || [];

            // ==========================================
            // التحقق من عنوان المشروع
            // ==========================================

            if (!title || !title.trim()) {

                return res.status(400).json({
                    message: "يرجى إدخال اسم المشروع."
                });

            }

            const userId = req.user.id;

            // ==========================================
            // معالجة الأعضاء
            // ==========================================

            let selectedMembers = [];

            if (members) {

                try {

                    selectedMembers = JSON.parse(members);

                } catch (error) {

                    console.error(
                        "PROJECT MEMBERS JSON ERROR:",
                        error
                    );

                    selectedMembers = [];

                }

            }

            // ==========================================
            // تحديد الأعضاء
            // ==========================================

            let membersToAdd = [];

            if (
                Array.isArray(selectedMembers) &&
                selectedMembers.length > 0
            ) {

                membersToAdd =
                    selectedMembers
                        .map(id => Number(id))
                        .filter(id =>
                            Number.isInteger(id)
                        );

            } else {

                const {
                    data: users,
                    error: usersError
                } =
                    await supabase
                        .from("users")
                        .select("id");

                if (usersError) {

                    console.error(
                        "Get users error:",
                        usersError
                    );

                    return res.status(500).json({
                        message:
                            usersError.message
                    });

                }

                membersToAdd =
                    (users || [])
                        .map(user => Number(user.id))
                        .filter(id =>
                            Number.isInteger(id)
                        );

            }

            membersToAdd =
                [...new Set(membersToAdd)];

            // ==========================================
            // إنشاء المشروع مباشرة
            // ==========================================

            const {
                data: project,
                error: projectError
            } =
                await supabase
                    .from("projects")
                    .insert([
                        {
                            ProjectTitle:
                                title.trim(),

                            description:
                                description?.trim() || "",

                            status:
                                status ||
                                "قيد الانتظار",

                            start_date:
                                start_date ||
                                null,

                            due_date:
                                due_date ||
                                null,

                            Priority:
                                Priority ||
                                null,

                            image_url:
                                null,

                            user_id:
                                userId
                        }
                    ])
                    .select()
                    .single();

            if (projectError) {

                console.error(
                    "Add project error:",
                    projectError
                );

                return res.status(500).json({
                    message:
                        "فشل إنشاء المشروع.",

                    error:
                        projectError.message
                });

            }

            const projectId =
                project.id;

            // ==========================================
            // إضافة الأعضاء مباشرة
            // ==========================================

            if (membersToAdd.length > 0) {

                const projectMembers =
                    membersToAdd.map(memberId => ({
                        project_id:
                            projectId,

                        user_id:
                            memberId
                    }));

                const {
                    error: membersError
                } =
                    await supabase
                        .from("project_members")
                        .insert(projectMembers);

                if (membersError) {

                    console.error(
                        "Add project members error:",
                        membersError
                    );

                    // المشروع موجود بالفعل
                    // لذلك لا نحذف المشروع
                    // فقط نبلغ بالخطأ

                    return res.status(500).json({
                        message:
                            "تم إنشاء المشروع لكن فشل إضافة الأعضاء.",

                        error:
                            membersError.message
                    });

                }

            }

            // ==========================================
            // الرد للمستخدم فورًا
            // ==========================================

            res.status(201).json({

                message:
                    "تم إنشاء المشروع بنجاح.",

                project: {

                    ...project,

                    image_url:
                        null

                }

            });

            // ==================================================
            // من هنا العمليات الخلفية
            // ==================================================
            // لا تستخدم await قبلها
            // المستخدم استلم الرد بالفعل
            // ==================================================

            setImmediate(async () => {

                // ==========================================
                // رفع صورة المشروع
                // ==========================================

                if (projectImageFile) {

                    try {

                        console.log(
                            `📤 رفع صورة المشروع ${projectId} إلى Google Drive...`
                        );

                        const uploadedImage =
                            await uploadToGoogleDrive(
                                projectImageFile
                            );

                        const imageUrl =
                            `/projects/image/${uploadedImage.id}`;

                        await supabase
                            .from("projects")
                            .update({
                                image_url:
                                    imageUrl
                            })
                            .eq(
                                "id",
                                projectId
                            );

                        console.log(
                            `✅ تم رفع صورة المشروع ${projectId}`
                        );

                    } catch (imageError) {

                        console.error(
                            `❌ PROJECT IMAGE UPLOAD ERROR [${projectId}]:`,
                            imageError
                        );

                    }

                }

                // ==========================================
                // رفع ملفات المشروع
                // ==========================================

                if (projectFiles.length > 0) {

                    console.log(
                        `📤 رفع ${projectFiles.length} ملف للمشروع ${projectId}...`
                    );

                    for (const file of projectFiles) {

                        try {

                            await uploadProjectFile({

                                projectId,

                                file,

                                userId

                            });

                            console.log(
                                `✅ تم رفع الملف: ${file.originalname}`
                            );

                        } catch (attachmentError) {

                            console.error(
                                `❌ CREATE PROJECT ATTACHMENT ERROR [${projectId}]:`,
                                attachmentError
                            );

                        }

                    }

                }

                // ==========================================
                // إرسال الإشعارات والإيميلات
                // ==========================================

                try {

                    if (
                        Array.isArray(membersToAdd) &&
                        membersToAdd.length > 0
                    ) {

                        const {
                            data: projectUsers,
                            error: projectUsersError
                        } =
                            await supabase
                                .from("users")
                                .select(
                                    "id, username, email"
                                )
                                .in(
                                    "id",
                                    membersToAdd
                                );

                        if (projectUsersError) {

                            console.error(
                                "PROJECT MEMBER NOTIFICATION USERS ERROR:",
                                projectUsersError
                            );

                            return;

                        }

                        let addedByName = null;

                        const {
                            data: currentUser
                        } =
                            await supabase
                                .from("users")
                                .select("username")
                                .eq(
                                    "id",
                                    userId
                                )
                                .maybeSingle();

                        if (currentUser) {

                            addedByName =
                                currentUser.username;

                        }

                        // ==========================================
                        // إرسال الإيميلات بالتوازي
                        // ==========================================

                        await Promise.allSettled(

                            (projectUsers || []).map(
                                async projectUser => {

                                    try {

                                        await sendNotificationEmail({

                                            user: {

                                                id:
                                                    projectUser.id,

                                                username:
                                                    projectUser.username,

                                                email:
                                                    projectUser.email

                                            },

                                            type:
                                                NotificationType.PROJECT_MEMBER_ADDED,

                                            data: {

                                                projectId:
                                                    project.id,

                                                projectName:
                                                    project.ProjectTitle ||
                                                    title.trim() ||
                                                    "مشروع",

                                                addedBy:
                                                    addedByName

                                            }

                                        });

                                    } catch (emailError) {

                                        console.error(
                                            "PROJECT MEMBER EMAIL ERROR:",
                                            emailError
                                        );

                                    }

                                }
                            )

                        );

                    }

                } catch (notificationError) {

                    console.error(
                        "PROJECT_MEMBER_ADDED notification error:",
                        notificationError
                    );

                }

                console.log(
                    `🎉 اكتملت العمليات الخلفية للمشروع ${projectId}`
                );

            });

        } catch (error) {

            console.error(
                "POST /addproject ERROR:",
                error
            );

            // إذا لم يتم إرسال response بعد
            if (!res.headersSent) {

                return res.status(500).json({

                    message:
                        "حدث خطأ في السيرفر.",

                    error:
                        error.message

                });

            }

        }

    }
);



// =====================================================
// جلب مشروع واحد
// =====================================================

app.get(
    "/projects/:id",
    verifyToken,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const userId =
                req.user.id;

            if (!isValidProjectId(id)) {

                return res.status(400).json({
                    message:
                        "معرف المشروع غير صحيح."
                });

            }

            // ==========================================
            // البحث عن المشروع
            // ==========================================

            const {
                data: project,
                error: projectError
            } =
                await supabase
                    .from("projects")
                    .select("*")
                    .eq("id", id)
                    .maybeSingle();

            if (projectError) {

                console.error(
                    "Get project error:",
                    projectError
                );

                return res.status(500).json({
                    message:
                        "حدث خطأ أثناء جلب المشروع."
                });

            }

            if (!project) {

                return res.status(404).json({
                    message:
                        "المشروع غير موجود."
                });

            }

            // ==========================================
            // التحقق من المالك
            // ==========================================

            if (
                Number(project.user_id) ===
                Number(userId)
            ) {

                return res.json(project);

            }

            // ==========================================
            // التحقق من العضوية
            // ==========================================

            const {
                data: membership,
                error: membershipError
            } =
                await supabase
                    .from("project_members")
                    .select("id")
                    .eq(
                        "project_id",
                        id
                    )
                    .eq(
                        "user_id",
                        userId
                    )
                    .maybeSingle();

            if (membershipError) {

                console.error(
                    "Project membership error:",
                    membershipError
                );

                return res.status(500).json({
                    message:
                        "حدث خطأ أثناء التحقق من صلاحية المشروع."
                });

            }

            if (!membership) {

                return res.status(403).json({
                    message:
                        "ليس لديك صلاحية للوصول إلى هذا المشروع."
                });

            }

            return res.json(project);

        } catch (error) {

            console.error(
                "GET /projects/:id ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);


// =====================================================
// تعديل خصائص المشروع
// =====================================================

app.patch(
    "/projects/:id",
    verifyToken,
    requireRole("owner", "manager", "admin"),
    upload.single("projectImage"),
    async (req, res) => {

        try {

            const { id } = req.params;

            const {
                title,
                description,
                status,
                start_date,
                due_date,
                Priority
            } = req.body;

            if (!isValidProjectId(id)) {

                return res.status(400).json({
                    message:
                        "معرف المشروع غير صحيح."
                });

            }

            const allowed =
                await canManageProject(
                    id,
                    req.user.id,
                    req.user.role
                );

            if (!allowed) {

                return res.status(403).json({
                    message:
                        "ليس لديك صلاحية لتعديل هذا المشروع."
                });

            }

            if (!title || !title.trim()) {

                return res.status(400).json({
                    message:
                        "اسم المشروع مطلوب."
                });

            }

            const {
                data: project,
                error: projectError
            } =
                await supabase
                    .from("projects")
                    .select("id")
                    .eq("id", id)
                    .maybeSingle();

            if (projectError) {

                console.error(
                    "PROJECT LOOKUP ERROR:",
                    projectError
                );

                return res.status(500).json({
                    message:
                        "حدث خطأ أثناء البحث عن المشروع."
                });

            }

            if (!project) {

                return res.status(404).json({
                    message:
                        "المشروع غير موجود."
                });

            }

            const updateData = {

                ProjectTitle:
                    title.trim(),

                description:
                    description?.trim() || "",

                status:
                    status ||
                    "قيد الانتظار",

                start_date:
                    start_date ||
                    null,

                due_date:
                    due_date ||
                    null,

                Priority:
                    Priority ||
                    null

            };

            // ==========================================
            // تحديث صورة المشروع — Google Drive
            // ==========================================

            if (req.file) {

                try {

                    const uploadedImage =
                        await uploadToGoogleDrive(req.file);

                    updateData.image_url =
                        `/projects/image/${uploadedImage.id}`;

                } catch (imageError) {

                    console.error(
                        "PROJECT IMAGE UPDATE ERROR (Google Drive):",
                        imageError
                    );

                    return res.status(500).json({
                        message:
                            "فشل رفع صورة المشروع."
                    });

                }

            }

            const {
                data: updatedProject,
                error: updateError
            } =
                await supabase
                    .from("projects")
                    .update(updateData)
                    .eq("id", id)
                    .select()
                    .single();

            if (updateError) {

                console.error(
                    "UPDATE PROJECT ERROR:",
                    updateError
                );

                return res.status(500).json({
                    message:
                        "فشل تحديث المشروع."
                });

            }

            return res.json({

                message:
                    "تم تحديث المشروع بنجاح.",

                project:
                    updatedProject

            });

        } catch (error) {

            console.error(
                "PATCH /projects/:id ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء تحديث المشروع."
            });

        }

    }
);


// =====================================================
// دالة التحقق من الوصول لملفات المشروع
// =====================================================

async function canAccessProjectFiles(
    projectId,
    userId,
    role
) {

    return canAccessProject(
        projectId,
        userId
    );

}


// =====================================================
// المرفقات القديمة للمشروع
// =====================================================

// =====================================================
// جلب مرفقات المشروع — Google Drive
// =====================================================

app.get(
    "/projects/:id/attachments",
    verifyToken,
    async (req, res) => {

        try {

            const projectId =
                Number(req.params.id);

            if (
                !Number.isInteger(projectId) ||
                projectId <= 0
            ) {

                return res.status(400).json({
                    message:
                        "معرف المشروع غير صحيح."
                });

            }

            const allowed =
                await canAccessProjectFiles(
                    projectId,
                    req.user.id,
                    req.user.role
                );

            if (!allowed) {

                return res.status(403).json({
                    message:
                        "ليس لديك صلاحية للوصول إلى مرفقات المشروع."
                });

            }

            // ==========================================
            // جلب الملفات من جدول project_files
            // ==========================================

            const {
                data: files,
                error
            } =
                await supabase
                    .from("project_files")
                    .select(`
                        id,
                        project_id,
                        file_name,
                        storage_path,
                        file_type,
                        file_size,
                        uploaded_by,
                        created_at
                    `)
                    .eq(
                        "project_id",
                        projectId
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );

            if (error) {

                console.error(
                    "GET PROJECT ATTACHMENTS DATABASE ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل جلب مرفقات المشروع."
                });

            }

            // ==========================================
            // تحويل بيانات قاعدة البيانات إلى الشكل
            // الذي تتوقعه الواجهة
            // ==========================================

            const attachments =
                (files || []).map(file => {

                    return {

                        id:
                            file.id,

                        name:
                            file.file_name ||
                            "ملف مرفق",

                        path:
                            file.storage_path,

                        url:
                            file.storage_path,

                        size:
                            Number(
                                file.file_size || 0
                            ),

                        type:
                            file.file_type || "",

                        uploaded_by:
                            file.uploaded_by,

                        created_at:
                            file.created_at

                    };

                });

            return res.json(
                attachments
            );

        } catch (error) {

            console.error(
                "GET /projects/:id/attachments ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء جلب المرفقات."
            });

        }

    }
);

// =====================================================
// رفع مرفقات المشروع — Google Drive
// =====================================================

app.post(
    "/projects/:id/attachments",
    verifyToken,
    requireRole("owner", "manager", "admin"),
    upload.array("files"),
    async (req, res) => {

        try {

            const projectId =
                Number(req.params.id);

            if (
                !Number.isInteger(projectId) ||
                projectId <= 0
            ) {

                return res.status(400).json({
                    message:
                        "معرف المشروع غير صحيح."
                });

            }

            const allowed =
                await canManageProject(
                    projectId,
                    req.user.id,
                    req.user.role
                );

            if (!allowed) {

                return res.status(403).json({
                    message:
                        "ليس لديك صلاحية لإضافة ملفات إلى هذا المشروع."
                });

            }

            if (!req.files?.length) {

                return res.status(400).json({
                    message:
                        "اختر ملفًا واحدًا على الأقل."
                });

            }

            const {
                data: project
            } =
                await supabase
                    .from("projects")
                    .select("id")
                    .eq("id", projectId)
                    .maybeSingle();

            if (!project) {

                return res.status(404).json({
                    message:
                        "المشروع غير موجود."
                });

            }

            const uploaded = [];

            for (const file of req.files) {

                // ==========================================
                // رفع الملف إلى Google Drive
                // ==========================================

                const uploadedFile =
                    await uploadToGoogleDrive(file);

                const googleDriveFileId =
                    uploadedFile.id;

                // ==========================================
                // رابط الملف من السيرفر
                // ==========================================

                const fileUrl =
                    `/projects/file/${googleDriveFileId}`;

                // ==========================================
                // اسم الملف
                // ==========================================

                const safeName =
                    String(
                        file.originalname ||
                        "file"
                    ).trim() || "file";

                // ==========================================
                // حفظ بيانات الملف في Supabase
                // ==========================================

                const {
                    data: savedFile,
                    error: insertError
                } =
                    await supabase
                        .from("project_files")
                        .insert({

                            project_id:
                                projectId,

                            file_name:
                                safeName,

                            storage_path:
                                fileUrl,

                            file_type:
                                file.mimetype ||
                                "application/octet-stream",

                            file_size:
                                Number(
                                    file.size || 0
                                ),

                            uploaded_by:
                                req.user.id

                        })
                        .select(`
                            id,
                            project_id,
                            file_name,
                            storage_path,
                            file_type,
                            file_size,
                            uploaded_by,
                            created_at
                        `)
                        .single();

                if (insertError) {

                    console.error(
                        "PROJECT FILE DATABASE ERROR:",
                        insertError
                    );

                    return res.status(500).json({
                        message:
                            "تم رفع الملف ولكن فشل حفظ بياناته."
                    });

                }

                uploaded.push({

                    id:
                        savedFile.id,

                    name:
                        safeName,

                    path:
                        fileUrl,

                    url:
                        fileUrl,

                    size:
                        Number(
                            file.size || 0
                        ),

                    type:
                        file.mimetype || "",

                    google_drive_file_id:
                        googleDriveFileId

                });

            }

            return res.status(201).json({

                message:
                    "تم رفع مرفقات المشروع.",

                attachments:
                    uploaded

            });

        } catch (error) {

            console.error(
                "POST /projects/:id/attachments ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء رفع المرفقات."
            });

        }

    }
);

// =====================================================
// حذف مرفق مشروع قديم
// =====================================================

app.delete(
    "/projects/:id/attachments",
    verifyToken,
    requireRole("owner", "manager", "admin"),
    async (req, res) => {

        try {

            const projectId =
                Number(req.params.id);

            const {
                path: filePath
            } = req.body;

            const requiredPrefix =
                `projects/${projectId}/`;

            const allowed =
                await canManageProject(
                    projectId,
                    req.user.id,
                    req.user.role
                );

            if (!allowed) {

                return res.status(403).json({
                    message:
                        "ليس لديك صلاحية لحذف ملفات هذا المشروع."
                });

            }

            if (
                !filePath ||
                !filePath.startsWith(requiredPrefix) ||
                filePath.includes("..")
            ) {

                return res.status(400).json({
                    message:
                        "مسار الملف غير صحيح."
                });

            }

            const {
                error
            } =
                await supabase.storage
                    .from("task-files")
                    .remove([
                        filePath
                    ]);

            if (error) {

                console.error(
                    "DELETE PROJECT ATTACHMENT ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل حذف مرفق المشروع."
                });

            }

            return res.json({
                message:
                    "تم حذف مرفق المشروع."
            });

        } catch (error) {

            console.error(
                "DELETE /projects/:id/attachments ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء حذف المرفق."
            });

        }

    }
);


// =====================================================
// أعضاء مساحة عمل المشروع
// =====================================================

async function getWorkspaceMembers(
    projectId,
    ownerId
) {

    const {
        data: members,
        error
    } =
        await supabase
            .from("project_members")
            .select(`
                user_id,
                users (
                    id,
                    username,
                    email,
                    role
                )
            `)
            .eq(
                "project_id",
                projectId
            );

    if (error) {
        throw error;
    }

    const normalized =
        (members || []).map(
            member => ({
                id:
                    member.user_id,

                ...(member.users || {})
            })
        );

    if (
        !normalized.some(
            member =>
                Number(member.id) ===
                Number(ownerId)
        )
    ) {

        const {
            data: owner
        } =
            await supabase
                .from("users")
                .select(
                    "id, username, email, role"
                )
                .eq(
                    "id",
                    ownerId
                )
                .maybeSingle();

        if (owner) {

            normalized.unshift(
                owner
            );

        }

    }

    return normalized;

}


// =====================================================
// جلب ملفات المشروع
// مهم:
// لا يوجد أي JOIN مع users هنا.
// =====================================================

async function listProjectFiles(projectId) {
    const { data: savedFiles, error: filesError } =
        await supabase
            .from("project_files")
            .select(`
                id,
                project_id,
                file_name,
                storage_path,
                file_type,
                file_size,
                uploaded_by,
                created_at
            `)
            .eq("project_id", projectId)
            .order("created_at", {
                ascending: false
            });

    if (filesError) {
        if (filesError.code === "PGRST205") {
            const migrationError = new Error(
                "قاعدة بيانات ملفات المشروع غير مهيأة. طبّق ترقية project_files ثم أعد المحاولة."
            );

            migrationError.status = 503;

            throw migrationError;
        }

        throw filesError;
    }

    return (savedFiles || [])
        .map(file =>
            projectFilePayload(
                file,
                projectId
            )
        );


    // ==========================================
    // دمج الملفات
    // ==========================================

    return [

        ...(savedFiles || [])
            .map(
                file =>
                    projectFilePayload(
                        file,
                        projectId
                    )
            ),

        ...(legacyFiles || [])
            .map(
                file =>
                    legacyProjectFilePayload(
                        file,
                        projectId
                    )
            )

    ].sort(
        (first, second) => {

            const firstTime =
                new Date(
                    first.created_at || 0
                ).getTime();

            const secondTime =
                new Date(
                    second.created_at || 0
                ).getTime();

            return (
                secondTime -
                firstTime
            );

        }
    );

}


// =====================================================
// الحصول على المشروع مع التحقق من الصلاحية
// =====================================================

async function getAccessibleProjectOrRespond(
    req,
    res
) {

    const projectId =
        Number(req.params.id);

    if (
        !isValidProjectId(
            projectId
        )
    ) {

        res.status(400).json({
            message:
                "معرف المشروع غير صحيح."
        });

        return null;

    }

    const access =
        await getProjectAccess(
            projectId,
            req.user.id
        );

    if (!access.project) {

        res.status(404).json({
            message:
                "المشروع غير موجود."
        });

        return null;

    }

    if (!access.access) {

        res.status(403).json({
            message:
                "ليس لديك صلاحية للوصول إلى هذا المشروع."
        });

        return null;

    }

    return {

        projectId,

        project:
            access.project

    };

}


// =====================================================
// Workspace
// =====================================================

app.get(
    "/projects/:id/workspace",
    verifyToken,
    async (req, res) => {

        try {

            const context =
                await getAccessibleProjectOrRespond(
                    req,
                    res
                );

            if (!context) return;

            const [
                { data: taskRows, error: tasksError },
                members
            ] =
                await Promise.all([

                    supabase
                        .from("tasks")
                        .select(
                            "id, status"
                        )
                        .eq(
                            "projectId",
                            context.projectId
                        ),

                    getWorkspaceMembers(
                        context.projectId,
                        context.project.user_id
                    )

                ]);

            if (tasksError) {
                throw tasksError;
            }

            const tasks =
                taskRows || [];

            const completedTasks =
                tasks.filter(
                    task =>
                        [
                            "مكتمل",
                            "تم التسليم"
                        ].includes(
                            task.status
                        )
                ).length;

            return res.json({

                project:
                    context.project,

                members,

                stats: {

                    task_count:
                        tasks.length,

                    completed_task_count:
                        completedTasks,

                    progress:
                        tasks.length
                            ? Math.round(
                                (
                                    completedTasks /
                                    tasks.length
                                ) * 100
                            )
                            : 0,

                    member_count:
                        members.length

                }

            });

        } catch (error) {

            console.error(
                "GET PROJECT WORKSPACE ERROR:",
                error
            );

            return res.status(
                error.status || 500
            ).json({

                message:
                    error.message ||
                    "تعذر تحميل مساحة عمل المشروع."

            });

        }

    }
);


// =====================================================
// ملفات المشروع
// =====================================================

app.get(
    "/projects/:id/files",
    verifyToken,
    async (req, res) => {

        try {

            const context =
                await getAccessibleProjectOrRespond(
                    req,
                    res
                );

            if (!context) return;

            const files =
                await listProjectFiles(
                    context.projectId
                );

            return res.json(
                files
            );

        } catch (error) {

            console.error(
                "GET PROJECT FILES ERROR:",
                error
            );

            return res.status(
                error.status || 500
            ).json({

                message:
                    error.message ||
                    "تعذر تحميل ملفات المشروع."

            });

        }

    }
);


// =====================================================
// رفع ملفات المشروع
// =====================================================

app.post(
    "/projects/:id/files",
    verifyToken,
    requireRole(
        "owner",
        "manager",
        "admin"
    ),
    upload.array(
        "files",
        20
    ),
    async (req, res) => {

        try {

            const context =
                await getAccessibleProjectOrRespond(
                    req,
                    res
                );

            if (!context) return;

            const canUpload =
                await canManageProject(
                    context.projectId,
                    req.user.id,
                    req.user.role
                );

            if (!canUpload) {

                return res.status(403).json({
                    message:
                        "ليس لديك صلاحية لرفع ملفات لهذا المشروع."
                });

            }

            if (!req.files?.length) {

                return res.status(400).json({
                    message:
                        "اختر ملفًا واحدًا على الأقل."
                });

            }

            const uploaded = [];

            for (
                const file of req.files
            ) {

                const savedFile =
                    await uploadProjectFile({

                        projectId:
                            context.projectId,

                        file,

                        userId:
                            req.user.id

                    });

                uploaded.push(
                    projectFilePayload(
                        savedFile,
                        context.projectId
                    )
                );

            }

            return res.status(201).json({

                message:
                    "تم رفع ملفات المشروع.",

                files:
                    uploaded

            });

        } catch (error) {

            console.error(
                "POST PROJECT FILES ERROR:",
                error
            );

            return res.status(
                error.status || 500
            ).json({

                message:
                    error.message ||
                    "فشل رفع ملفات المشروع."

            });

        }

    }
);


// =====================================================
// جلب ملف مشروع
// =====================================================

async function getProjectFileForRequest(
    req,
    res
) {

    const context =
        await getAccessibleProjectOrRespond(
            req,
            res
        );

    if (!context) {
        return null;
    }

    const fileId =
        Number(
            req.params.fileId
        );

    if (
        !Number.isInteger(fileId) ||
        fileId <= 0
    ) {
        console.log("❌ INVALID PROJECT FILE ID:", {
            raw: req.params.fileId,
            parsed: fileId
        });
        res.status(400).json({
            message:
                "معرف الملف غير صحيح."
        });

        return null;

    }

    const {
        data: file,
        error
    } =
        await supabase
            .from("project_files")
            .select(`
                id,
                project_id,
                file_name,
                storage_path,
                file_type,
                file_size,
                uploaded_by,
                created_at
            `)
            .eq(
                "id",
                fileId
            )
            .eq(
                "project_id",
                context.projectId
            )
            .maybeSingle();

    if (error) {
        throw error;
    }

    if (!file) {

        res.status(404).json({
            message:
                "الملف غير موجود."
        });

        return null;

    }

    return {

        context,

        file

    };

}


// =====================================================
// معاينة ملف المشروع
// =====================================================

app.get(
    "/projects/:id/files/:fileId/view",
    verifyToken,
    async (req, res) => {

        try {

            const result =
                await getProjectFileForRequest(
                    req,
                    res
                );

            if (!result) return;

            if (
                !isPreviewableFile(
                    result.file.file_type,
                    result.file.file_name
                )
            ) {

                return res.status(415).json({
                    message:
                        "لا تتوفر معاينة لهذا النوع من الملفات."
                });

            }

            return streamProjectFile(
                req,
                res,
                {
                    file:
                        result.file,

                    disposition:
                        "inline"
                }
            );

        } catch (error) {

            console.error(
                "VIEW PROJECT FILE ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "تعذرت معاينة الملف."
            });

        }

    }
);


// =====================================================
// تحميل ملف المشروع
// =====================================================

app.get(
    "/projects/:id/files/:fileId/download",
    verifyToken,
    async (req, res) => {

        try {

            const result =
                await getProjectFileForRequest(
                    req,
                    res
                );

            if (!result) return;

            return streamProjectFile(
                req,
                res,
                {
                    file:
                        result.file,

                    disposition:
                        "attachment"
                }
            );

        } catch (error) {

            console.error(
                "DOWNLOAD PROJECT FILE ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "تعذر تحميل الملف."
            });

        }

    }
);


// =====================================================
// ملفات المشروع القديمة
// =====================================================

async function streamLegacyProjectFile(
    req,
    res,
    disposition
) {

    const context =
        await getAccessibleProjectOrRespond(
            req,
            res
        );

    if (!context) return;

    const storagePath =
        String(
            req.query.path || ""
        );

    const prefix =
        `projects/${context.projectId}/`;

    if (
        !storagePath.startsWith(prefix) ||
        storagePath.includes("..")
    ) {

        return res.status(400).json({
            message:
                "مسار الملف غير صحيح."
        });

    }

    const {
        data: blob,
        error
    } =
        await supabase.storage
            .from(
                LEGACY_PROJECT_FILES_BUCKET
            )
            .download(
                storagePath
            );

    if (error) {
        throw error;
    }

    const fileName =
        legacyProjectFileName(
            storagePath
                .split("/")
                .pop()
        );

    const encodedName =
        encodeURIComponent(
            fileName
        );

    const buffer =
        Buffer.from(
            await blob.arrayBuffer()
        );

    res.setHeader(
        "Content-Type",
        blob.type ||
        "application/octet-stream"
    );

    res.setHeader(
        "Content-Disposition",
        `${disposition}; filename="${encodedName}"; filename*=UTF-8''${encodedName}`
    );

    res.setHeader(
        "Cache-Control",
        "private, no-store"
    );

    return res.send(
        buffer
    );

}


app.get(
    "/projects/:id/legacy-files/view",
    verifyToken,
    async (req, res) => {

        try {

            return await streamLegacyProjectFile(
                req,
                res,
                "inline"
            );

        } catch (error) {

            console.error(
                "VIEW LEGACY PROJECT FILE ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "تعذرت معاينة الملف."
            });

        }

    }
);


app.get(
    "/projects/:id/legacy-files/download",
    verifyToken,
    async (req, res) => {

        try {

            return await streamLegacyProjectFile(
                req,
                res,
                "attachment"
            );

        } catch (error) {

            console.error(
                "DOWNLOAD LEGACY PROJECT FILE ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "تعذر تحميل الملف."
            });

        }

    }
);


// =====================================================
// حذف ملف المشروع
// =====================================================

app.delete(
    "/projects/:id/files/:fileId",
    verifyToken,
    requireRole(
        "owner",
        "manager",
        "admin"
    ),
    async (req, res) => {

        try {

            const result =
                await getProjectFileForRequest(
                    req,
                    res
                );

            if (!result) return;

            const canDelete =
                await canManageProject(
                    result.context.projectId,
                    req.user.id,
                    req.user.role
                );

            if (!canDelete) {

                return res.status(403).json({
                    message:
                        "ليس لديك صلاحية لحذف هذا الملف."
                });

            }

            const {
                error: storageError
            } =
                await supabase.storage
                    .from(
                        PROJECT_FILES_BUCKET
                    )
                    .remove([
                        result.file.storage_path
                    ]);

            if (storageError) {
                throw storageError;
            }

            const {
                error: databaseError
            } =
                await supabase
                    .from("project_files")
                    .delete()
                    .eq(
                        "id",
                        result.file.id
                    );

            if (databaseError) {
                throw databaseError;
            }

            return res.json({
                message:
                    "تم حذف ملف المشروع."
            });

        } catch (error) {

            console.error(
                "DELETE PROJECT FILE ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "تعذر حذف ملف المشروع."
            });

        }

    }
);


// =====================================================
// إضافة عضو إلى مشروع
// =====================================================

app.post(
    "/projects/:projectId/members",
    verifyToken,
    requireRole(
        "owner",
        "manager",
        "admin"
    ),
    async (req, res) => {

        try {

            const {
                projectId
            } = req.params;

            const {
                userId
            } = req.body;

            if (!projectId) {

                return res.status(400).json({
                    message:
                        "معرف المشروع مطلوب."
                });

            }

            if (!userId) {

                return res.status(400).json({
                    message:
                        "معرف المستخدم مطلوب."
                });

            }

            const projectIdNumber =
                Number(projectId);

            const userIdNumber =
                Number(userId);

            if (
                !isValidProjectId(
                    projectIdNumber
                )
            ) {

                return res.status(400).json({
                    message:
                        "معرف المشروع غير صحيح."
                });

            }

            if (
                !Number.isInteger(
                    userIdNumber
                ) ||
                userIdNumber <= 0
            ) {

                return res.status(400).json({
                    message:
                        "معرف المستخدم غير صحيح."
                });

            }

            const {
                data: project,
                error: projectError
            } =
                await supabase
                    .from("projects")
                    .select("id")
                    .eq(
                        "id",
                        projectIdNumber
                    )
                    .maybeSingle();

            if (projectError) {

                console.error(
                    "Project lookup error:",
                    projectError
                );

                return res.status(500).json({
                    message:
                        "حدث خطأ أثناء البحث عن المشروع."
                });

            }

            if (!project) {

                return res.status(404).json({
                    message:
                        "المشروع غير موجود."
                });

            }

            const canManageMembers =
                await canManageProject(
                    projectIdNumber,
                    req.user.id,
                    req.user.role
                );

            if (!canManageMembers) {

                return res.status(403).json({
                    message:
                        "ليس لديك صلاحية لإدارة أعضاء هذا المشروع."
                });

            }

            const {
                data: user,
                error: userError
            } =
                await supabase
                    .from("users")
                    .select(
                        "id, username, email, role"
                    )
                    .eq(
                        "id",
                        userIdNumber
                    )
                    .maybeSingle();

            if (userError) {

                console.error(
                    "User lookup error:",
                    userError
                );

                return res.status(500).json({
                    message:
                        "حدث خطأ أثناء البحث عن المستخدم."
                });

            }

            if (!user) {

                return res.status(404).json({
                    message:
                        "المستخدم غير موجود."
                });

            }

            const {
                data: existingMember,
                error: existingError
            } =
                await supabase
                    .from("project_members")
                    .select("id")
                    .eq(
                        "project_id",
                        projectIdNumber
                    )
                    .eq(
                        "user_id",
                        userIdNumber
                    )
                    .maybeSingle();

            if (existingError) {

                console.error(
                    "Existing member lookup error:",
                    existingError
                );

                return res.status(500).json({
                    message:
                        "حدث خطأ أثناء التحقق من عضو المشروع."
                });

            }

            if (existingMember) {

                return res.status(409).json({
                    message:
                        "المستخدم عضو بالفعل في هذا المشروع."
                });

            }

            const {
                data: member,
                error: memberError
            } =
                await supabase
                    .from("project_members")
                    .insert([
                        {
                            project_id:
                                projectIdNumber,

                            user_id:
                                userIdNumber
                        }
                    ])
                    .select()
                    .single();

            if (memberError) {

                console.error(
                    "Add project member error:",
                    memberError
                );

                return res.status(500).json({
                    message:
                        "فشل إضافة المستخدم إلى المشروع.",

                    error:
                        memberError.message
                });

            }

            return res.status(201).json({

                message:
                    "تمت إضافة العضو إلى المشروع بنجاح.",

                member,

                user

            });

        } catch (error) {

            console.error(
                "POST /projects/:projectId/members ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);


// =====================================================
// جلب جميع المشاريع
// =====================================================

app.get(
    "/projects",
    verifyToken,
    async (req, res) => {

        try {

            const userId =
                req.user.id;

            // ==========================================
            // مشاريع المالك
            // ==========================================

            const {
                data: ownedProjects,
                error: ownerError
            } =
                await supabase
                    .from("projects")
                    .select("*")
                    .eq(
                        "user_id",
                        userId
                    );

            if (ownerError) {

                console.error(
                    "Owner projects error:",
                    ownerError
                );

                return res.status(500).json({
                    message:
                        ownerError.message
                });

            }

            // ==========================================
            // عضويات المستخدم
            // ==========================================

            const {
                data: memberships,
                error: membershipError
            } =
                await supabase
                    .from("project_members")
                    .select("project_id")
                    .eq(
                        "user_id",
                        userId
                    );

            if (membershipError) {

                console.error(
                    "Membership error:",
                    membershipError
                );

                return res.status(500).json({
                    message:
                        membershipError.message
                });

            }

            const memberProjectIds =
                (memberships || [])
                    .map(
                        member =>
                            member.project_id
                    );

            // ==========================================
            // مشاريع العضوية
            // ==========================================

            let memberProjects = [];

            if (
                memberProjectIds.length > 0
            ) {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("projects")
                        .select("*")
                        .in(
                            "id",
                            memberProjectIds
                        );

                if (error) {

                    console.error(
                        "Member projects error:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            error.message
                    });

                }

                memberProjects =
                    data || [];

            }

            // ==========================================
            // الدمج وإزالة التكرار
            // ==========================================

            const allProjects = [

                ...(ownedProjects || []),

                ...memberProjects

            ];

            const uniqueProjects =
                [
                    ...new Map(
                        allProjects.map(
                            project => [
                                project.id,
                                project
                            ]
                        )
                    ).values()
                ];

            return res.json(
                uniqueProjects
            );

        } catch (error) {

            console.error(
                "GET /projects ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);


// =====================================================
// جلب أعضاء مشروع
// =====================================================

app.get(
    "/projects/:projectId/members",
    verifyToken,
    async (req, res) => {

        try {

            const projectId =
                Number(
                    req.params.projectId
                );

            if (
                !isValidProjectId(
                    projectId
                )
            ) {

                return res.status(400).json({
                    message:
                        "معرف المشروع غير صحيح."
                });

            }

            const allowed =
                await canAccessProject(
                    projectId,
                    req.user.id
                );

            if (!allowed) {

                return res.status(403).json({
                    message:
                        "ليس لديك صلاحية للوصول إلى أعضاء هذا المشروع."
                });

            }

            const {
                data,
                error
            } =
                await supabase
                    .from("project_members")
                    .select(`
                        user_id,
                        users (
                            id,
                            username,
                            email,
                            role
                        )
                    `)
                    .eq(
                        "project_id",
                        projectId
                    );

            if (error) {

                console.error(
                    "Get project members error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل جلب أعضاء المشروع.",

                    error:
                        error.message
                });

            }

            return res.json(
                data || []
            );

        } catch (error) {

            console.error(
                "GET PROJECT MEMBERS ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);


// =====================================================
// حذف المشروع
// =====================================================

app.delete(
    "/projects/:id",
    verifyToken,
    requireRole(
        "owner",
        "manager",
        "admin"
    ),
    async (req, res) => {

        try {

            const id =
                Number(
                    req.params.id
                );

            if (
                !isValidProjectId(id)
            ) {

                return res.status(400).json({
                    message:
                        "معرف المشروع غير صحيح."
                });

            }

            const allowed =
                await canManageProject(
                    id,
                    req.user.id,
                    req.user.role
                );

            if (!allowed) {

                return res.status(403).json({
                    message:
                        "ليس لديك صلاحية لحذف هذا المشروع."
                });

            }

            // ==========================================
            // التحقق من وجود المشروع
            // ==========================================

            const {
                data: project,
                error: projectCheckError
            } =
                await supabase
                    .from("projects")
                    .select("id")
                    .eq(
                        "id",
                        id
                    )
                    .maybeSingle();

            if (projectCheckError) {

                console.error(
                    "Project check error:",
                    projectCheckError
                );

                return res.status(500).json({
                    message:
                        "حدث خطأ أثناء التحقق من المشروع."
                });

            }

            if (!project) {

                return res.status(404).json({
                    message:
                        "المشروع غير موجود."
                });

            }

            // ==========================================
            // حذف المشروع
            // ==========================================

            const {
                error: projectError
            } =
                await supabase
                    .from("projects")
                    .delete()
                    .eq(
                        "id",
                        id
                    );

            if (projectError) {

                console.error(
                    "Delete project error:",
                    projectError
                );

                return res.status(400).json({

                    message:
                        "فشل حذف المشروع.",

                    error:
                        projectError.message

                });

            }

            return res.status(200).json({

                success:
                    true,

                message:
                    "تم حذف المشروع بنجاح."

            });

        } catch (error) {

            console.error(
                "DELETE /projects/:id ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);
// =====================================================
// إضافة مهمة
// =====================================================

app.post(
    "/addtask",
    verifyToken,
    requireRole("owner", "manager", "admin"),
    upload.array("files"),
    async (req, res) => {

        try {

            const {
                title,
                description,
                due_date,
                Priority,
                status,
                projectId,
                memberIds
            } = req.body;

            if (!title || !title.trim()) {

                return res.status(400).json({
                    message:
                        "عنوان المهمة مطلوب."
                });

            }

            if (!projectId) {

                return res.status(400).json({
                    message:
                        "معرف المشروع مطلوب."
                });

            }

            // =================================================
            // التأكد أن المشروع موجود
            // =================================================

            const {
                data: project,
                error: projectError
            } = await supabase
                .from("projects")
                .select("id")
                .eq(
                    "id",
                    projectId
                )
                .maybeSingle();

            if (projectError) {

                console.error(
                    "Project lookup error:",
                    projectError
                );

                return res.status(500).json({
                    message:
                        "حدث خطأ أثناء البحث عن المشروع.",
                    error:
                        projectError.message
                });

            }

            if (!project) {

                return res.status(404).json({
                    message:
                        "المشروع غير موجود."
                });

            }

            // =================================================
            // التحقق من صلاحية إدارة مهام هذا المشروع
            // =================================================

            const canManageTasks = await canManageProject(
                projectId,
                req.user.id,
                req.user.role
            );

            if (!canManageTasks) {
                return res.status(403).json({
                    message: "ليس لديك صلاحية لإدارة مهام هذا المشروع."
                });
            }

            // =================================================
            // رفع الملفات إلى Google Drive
            // =================================================

            let attachmentUrl = null;

            if (
                req.files &&
                req.files.length > 0
            ) {
                const uploadedFiles = [];

                for (const file of req.files) {
                    let displayName = file.originalname || "file";
                    try {
                        const utf8Name = Buffer.from(displayName, "latin1").toString("utf8");
                        if (utf8Name && !utf8Name.includes("\ufffd")) {
                            displayName = utf8Name;
                        }
                    } catch (e) {
                        // ignore
                    }

                    try {

                        const uploadedFile =
                            await uploadToGoogleDrive(file);

                        uploadedFiles.push({
                            name: displayName,
                            url: `/projects/file/${uploadedFile.id}`,
                            size: file.size || 0,
                            type: file.mimetype || "application/octet-stream",
                            google_drive_file_id: uploadedFile.id
                        });

                    } catch (uploadError) {

                        console.error(
                            "Task file Google Drive upload error for",
                            displayName,
                            uploadError
                        );
                        continue;

                    }
                }

                if (uploadedFiles.length > 0) {
                    attachmentUrl = JSON.stringify(uploadedFiles);
                }
            }

            // =================================================
            // إنشاء المهمة
            // =================================================

            const {
                data: task,
                error
            } = await supabase
                .from("tasks")
                .insert([
                    {
                        Title:
                            title.trim(),

                        description:
                            description || "",

                        "Due Date":
                            due_date || null,

                        Priority:
                            Priority || null,

                        status:
                            status ||
                            "قيد الانتظار",

                        attachment_url:
                            attachmentUrl,

                        projectId:
                            projectId
                    }
                ])
                .select()
                .single();

            if (error) {

                console.error(
                    "Create task error:",
                    error
                );

                return res.status(500).json({
                    message:
                        error.message
                });

            }

            // =================================================
            // حفظ أعضاء المهمة
            // =================================================

            let memberIdsArray = [];

            if (memberIds) {

                try {

                    memberIdsArray =
                        typeof memberIds === "string"
                            ? JSON.parse(memberIds)
                            : memberIds;

                } catch (e) {

                    console.error(
                        "MemberIds parse error:",
                        e
                    );

                }

            }

            if (
                Array.isArray(memberIdsArray) &&
                memberIdsArray.length > 0
            ) {

                const taskMembersToInsert =
                    memberIdsArray.map(
                        uId => ({
                            task_id: task.id,
                            user_id: uId
                        })
                    );

                const {
                    error: tmError
                } = await supabase
                    .from("task_members")
                    .insert(
                        taskMembersToInsert
                    );

                if (tmError) {

                    console.error(
                        "Task members insert error:",
                        tmError
                    );

                }

            }
            // =================================================
            // إشعار إنشاء المهمة للأعضاء
            // =================================================

            if (
                Array.isArray(memberIdsArray) &&
                memberIdsArray.length > 0
            ) {

                try {

                    const {
                        data: taskUsers,
                        error: taskUsersError
                    } = await supabase
                        .from("users")
                        .select(
                            "id, username, email"
                        )
                        .in(
                            "id",
                            memberIdsArray
                        );


                    if (taskUsersError) {

                        console.error(
                            "TASK CREATED notification users error:",
                            taskUsersError
                        );

                    } else {

                        // =========================================
                        // معرفة منشئ المهمة
                        // =========================================

                        const currentUserId =
                            req.user.id ||
                            req.user.userId ||
                            req.user.user_id;


                        let createdBy =
                            "مستخدم";


                        if (currentUserId) {

                            const {
                                data: creator
                            } = await supabase
                                .from("users")
                                .select("username")
                                .eq(
                                    "id",
                                    currentUserId
                                )
                                .maybeSingle();


                            if (creator) {

                                createdBy =
                                    creator.username;

                            }

                        }


                        // =========================================
                        // إرسال الإشعار لكل عضو
                        // =========================================

                        for (
                            const taskUser of taskUsers || []
                        ) {

                            await sendNotificationEmail({

                                user: {

                                    id:
                                        taskUser.id,

                                    username:
                                        taskUser.username,

                                    email:
                                        taskUser.email

                                },

                                type:
                                    NotificationType.TASK_CREATED,

                                data: {

                                    taskId:
                                        task.id,

                                    taskTitle:
                                        task.Title,

                                    projectId:
                                        project.id,

                                    dueDate:
                                        task["Due Date"],

                                    priority:
                                        task.Priority,

                                    createdBy:
                                        createdBy

                                }

                            });

                        }

                    }

                } catch (notificationError) {

                    console.error(
                        "TASK_CREATED notification error:",
                        notificationError
                    );

                }

            }
            return res.status(201).json({

                message:
                    "Task Created",

                task:
                    task

            });

        } catch (error) {

            console.error(
                "POST /addtask ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء إنشاء المهمة."
            });

        }

    }
);

// =====================================================
// تحميل ملف مرفق
// =====================================================

app.get(
    "/tasks/attachment/download",
    verifyToken,
    async (req, res) => {
        try {
            const { url, filename } = req.query;

            if (!url) {
                return res.status(400).send("رابط الملف مفقود.");
            }

            const cleanUrl = String(url).trim().replace(/%20$/, "");

            const response = await fetch(cleanUrl);

            if (!response.ok) {
                return res.status(response.status).send("تعذر العثور على الملف.");
            }

            const contentType =
                response.headers.get("content-type") ||
                "application/octet-stream";

            const buffer = Buffer.from(await response.arrayBuffer());

            const downloadName =
                filename || cleanUrl.split("/").pop() || "download";

            const encodedFilename = encodeURIComponent(downloadName);

            res.setHeader("Content-Type", contentType);
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
            );

            return res.send(buffer);
        } catch (error) {
            console.error("Attachment download error:", error);
            return res.status(500).send("حدث خطأ أثناء تحميل الملف.");
        }
    }
);

// =====================================================
// جلب Tasks الخاصة بمشروع معيّن
// =====================================================

app.get(
    "/tasks/:projectId",
    verifyToken,
    async (req, res) => {

        try {

            const {
                projectId
            } = req.params;

            if (!projectId) {

                return res.status(400).json({
                    message:
                        "معرف المشروع مطلوب."
                });

            }

            // =================================================
            // التأكد أن المشروع موجود
            // =================================================

            const {
                data: project,
                error: projectError
            } = await supabase
                .from("projects")
                .select("id")
                .eq(
                    "id",
                    projectId
                )
                .maybeSingle();

            if (projectError) {

                console.error(
                    "Project lookup error:",
                    projectError
                );

                return res.status(500).json({
                    message:
                        "حدث خطأ أثناء البحث عن المشروع.",
                    error:
                        projectError.message
                });

            }

            if (!project) {

                return res.status(404).json({
                    message:
                        "المشروع غير موجود."
                });

            }

            // =================================================
            // التحقق من وصول المستخدم إلى المشروع قبل كشف مهامه
            // =================================================

            const canViewTasks = await canAccessProject(
                projectId,
                req.user.id
            );

            if (!canViewTasks) {
                return res.status(403).json({
                    message: "ليس لديك صلاحية للوصول إلى مهام هذا المشروع."
                });
            }

            // =================================================
            // جلب المهام
            // =================================================

            const {
                data,
                error
            } = await supabase
                .from("tasks")
                .select(`
                    *,
                    task_members (
                        user_id,
                        users (
                            id,
                            username,
                            email,
                            role
                        )
                    )
                `)
                .eq(
                    "projectId",
                    projectId
                )
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );

            if (error) {

                console.error(
                    "Tasks fetch error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل جلب مهام المشروع.",
                    error:
                        error.message
                });

            }

            return res.json(
                data || []
            );

        } catch (error) {

            console.error(
                "GET /tasks/:projectId ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء جلب المهام."
            });

        }

    }
);

// =====================================================
// تحديث حالة Task - Drag & Drop Kanban
// =====================================================

app.patch(
    "/tasks/:taskId/status",
    verifyToken,
    async (req, res) => {

        try {

            const {
                taskId
            } = req.params;

            const {
                status
            } = req.body;

            if (!taskId) {

                return res.status(400).json({
                    message:
                        "معرف المهمة مطلوب."
                });

            }

            if (!status) {

                return res.status(400).json({
                    message:
                        "حالة المهمة مطلوبة."
                });

            }

            const allowedStatuses = [
                "قيد الانتظار",
                "قيد التنفيذ",
                "قيد المراجعة",
                "مكتمل",
                "تم التسليم"
            ];

            if (
                !allowedStatuses.includes(status)
            ) {

                return res.status(400).json({
                    message:
                        "حالة المهمة غير صالحة."
                });

            }

            // =================================================
            // البحث عن المهمة
            // =================================================

            const {
                data: task,
                error: taskError
            } = await supabase
                .from("tasks")
                .select(
                    "id, status, projectId"
                )
                .eq(
                    "id",
                    taskId
                )
                .maybeSingle();

            if (taskError) {

                console.error(
                    "❌ Task lookup error:",
                    taskError
                );

                return res.status(500).json({

                    message:
                        "حدث خطأ أثناء البحث عن المهمة.",

                    error:
                        taskError.message,

                    details:
                        taskError.details || null,

                    hint:
                        taskError.hint || null,

                    code:
                        taskError.code || null

                });

            }

            if (!task) {

                return res.status(404).json({
                    message:
                        "المهمة غير موجودة."
                });

            }

            const canUpdateTaskStatus = await canAccessProject(
                task.projectId,
                req.user.id
            );

            if (!canUpdateTaskStatus) {
                return res.status(403).json({
                    message: "ليس لديك صلاحية لتحديث مهمة في هذا المشروع."
                });
            }

            // =================================================
            // تحديث الحالة
            // =================================================

            const {
                data: updatedTask,
                error: updateError
            } = await supabase
                .from("tasks")
                .update({
                    status:
                        status
                })
                .eq(
                    "id",
                    taskId
                )
                .select()
                .single();

            if (updateError) {

                console.error(
                    "❌ Task status update error:",
                    updateError
                );

                return res.status(500).json({

                    message:
                        "فشل تحديث حالة المهمة.",

                    error:
                        updateError.message,

                    details:
                        updateError.details || null,

                    hint:
                        updateError.hint || null,

                    code:
                        updateError.code || null

                });

            }

            return res.status(200).json({

                message:
                    "تم تحديث حالة المهمة بنجاح.",

                task:
                    updatedTask

            });

        } catch (error) {

            console.error(
                "PATCH /tasks/:taskId/status ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);

// =====================================================
// تعديل Task بالكامل
// =====================================================

app.patch("/tasks/:taskId", verifyToken, requireRole("owner", "manager", "admin"), upload.array("files"), async (req, res) => {

    try {

        const {
            taskId
        } = req.params;

        const {
            title,
            description,
            due_date,
            Priority,
            status,
            memberIds,
            existingAttachments
        } = req.body;

        if (
            !title ||
            !title.trim()
        ) {

            return res.status(400).json({
                message:
                    "عنوان المهمة مطلوب."
            });

        }

        const allowedStatuses = [
            "قيد الانتظار",
            "قيد التنفيذ",
            "قيد المراجعة",
            "مكتمل",
            "تم التسليم"
        ];

        if (
            status &&
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({
                message:
                    "حالة المهمة غير صالحة."
            });

        }

        // =================================================
        // البحث عن المهمة
        // =================================================

        const {
            data: task,
            error: taskError
        } = await supabase
            .from("tasks")
            .select(
                "id, projectId"
            )
            .eq(
                "id",
                taskId
            )
            .maybeSingle();

        if (taskError) {

            console.error(
                "❌ Task lookup error:",
                taskError
            );

            return res.status(500).json({

                message:
                    "حدث خطأ أثناء البحث عن المهمة.",

                error:
                    taskError.message,

                details:
                    taskError.details || null,

                hint:
                    taskError.hint || null,

                code:
                    taskError.code || null

            });

        }

        if (!task) {

            return res.status(404).json({
                message:
                    "المهمة غير موجودة."
            });

        }

        const canEditTask = await canManageProject(
            task.projectId,
            req.user.id,
            req.user.role
        );

        if (!canEditTask) {
            return res.status(403).json({
                message: "ليس لديك صلاحية لتعديل مهمة في هذا المشروع."
            });
        }

        // =================================================
        // تحديث المهمة
        // =================================================

        const updateData = {

            Title:
                title.trim(),

            description:
                description?.trim() || "",

            "Due Date":
                due_date || null,

            Priority:
                Priority || null,

            status:
                status ||
                "قيد الانتظار"

        };

        // عند إرسال ملفات أو قائمة بالمرفقات الحالية، حدّث المرفقات مع
        // الحفاظ على الملفات التي لم يطلب المستخدم إزالتها.
        if (
            existingAttachments !== undefined ||
            (req.files && req.files.length > 0)
        ) {

            let attachments = [];

            if (existingAttachments) {

                try {

                    const parsed =
                        typeof existingAttachments === "string"
                            ? JSON.parse(existingAttachments)
                            : existingAttachments;

                    attachments = Array.isArray(parsed)
                        ? parsed
                        : [];

                } catch (parseError) {

                    return res.status(400).json({
                        message: "بيانات الملفات المرفقة غير صحيحة."
                    });

                }

            }

            for (const file of req.files || []) {

                let displayName = file.originalname || "file";

                try {

                    const utf8Name = Buffer
                        .from(displayName, "latin1")
                        .toString("utf8");

                    if (utf8Name && !utf8Name.includes("\ufffd")) {
                        displayName = utf8Name;
                    }

                } catch {

                    // نحتفظ بالاسم القادم من المتصفح عند تعذر التحويل.

                }

                try {

                    const uploadedFile =
                        await uploadToGoogleDrive(file);

                    attachments.push({
                        name: displayName,
                        url: `/projects/file/${uploadedFile.id}`,
                        size: file.size || 0,
                        type: file.mimetype || "application/octet-stream",
                        google_drive_file_id: uploadedFile.id
                    });

                } catch (uploadError) {

                    console.error("TASK EDIT FILE GOOGLE DRIVE UPLOAD ERROR:", uploadError);

                    return res.status(500).json({
                        message: "فشل رفع أحد الملفات المرفقة."
                    });

                }

            }

            updateData.attachment_url =
                attachments.length
                    ? JSON.stringify(attachments)
                    : null;

        }

        const {
            data: updatedTask,
            error: updateError
        } = await supabase
            .from("tasks")
            .update(updateData)
            .eq(
                "id",
                taskId
            )
            .select()
            .single();

        if (updateError) {

            console.error(
                "❌ Task update error:",
                updateError
            );

            return res.status(500).json({

                message:
                    "فشل تحديث المهمة.",

                error:
                    updateError.message,

                details:
                    updateError.details || null,

                hint:
                    updateError.hint || null,

                code:
                    updateError.code || null

            });

        }

        // تعديل الأعضاء المسندين للمهمة عند إرسالهم من نافذة التعديل.
        if (memberIds !== undefined) {

            let parsedMemberIds = [];

            try {

                parsedMemberIds =
                    typeof memberIds === "string"
                        ? JSON.parse(memberIds)
                        : memberIds;

            } catch {

                return res.status(400).json({
                    message: "بيانات أعضاء المهمة غير صحيحة."
                });

            }

            const memberIdList = [
                ...new Set(
                    (Array.isArray(parsedMemberIds)
                        ? parsedMemberIds
                        : [])
                        .map(id => Number(id))
                        .filter(id => Number.isInteger(id) && id > 0)
                )
            ];

            const { error: deleteMembersError } = await supabase
                .from("task_members")
                .delete()
                .eq("task_id", taskId);

            if (deleteMembersError) {

                console.error("DELETE TASK MEMBERS ERROR:", deleteMembersError);

                return res.status(500).json({
                    message: "فشل تحديث أعضاء المهمة."
                });

            }

            if (memberIdList.length > 0) {

                const { error: insertMembersError } = await supabase
                    .from("task_members")
                    .insert(
                        memberIdList.map(userId => ({
                            task_id: taskId,
                            user_id: userId
                        }))
                    );

                if (insertMembersError) {

                    console.error("INSERT TASK MEMBERS ERROR:", insertMembersError);

                    return res.status(500).json({
                        message: "فشل حفظ أعضاء المهمة."
                    });

                }

            }

        }

        return res.status(200).json({

            message:
                "تم تعديل المهمة بنجاح.",

            task:
                updatedTask

        });

    } catch (error) {

        console.error(
            "PATCH /tasks/:taskId ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "حدث خطأ في السيرفر."
        });

    }

}
);

// =====================================================
// حذف Task
// =====================================================

app.delete("/tasks/:taskId", verifyToken, requireRole("owner", "manager", "admin"), async (req, res) => {

    try {

        const {
            taskId
        } = req.params;

        // =================================================
        // البحث عن المهمة
        // =================================================

        const {
            data: task,
            error: taskError
        } = await supabase
            .from("tasks")
            .select(
                "id, projectId"
            )
            .eq(
                "id",
                taskId
            )
            .maybeSingle();

        if (taskError) {

            console.error(
                "❌ Task lookup error:",
                taskError
            );

            return res.status(500).json({

                message:
                    "حدث خطأ أثناء البحث عن المهمة.",

                error:
                    taskError.message,

                details:
                    taskError.details || null,

                hint:
                    taskError.hint || null,

                code:
                    taskError.code || null

            });

        }

        if (!task) {

            return res.status(404).json({
                message:
                    "المهمة غير موجودة."
            });

        }

        const canDeleteTask = await canManageProject(
            task.projectId,
            req.user.id,
            req.user.role
        );

        if (!canDeleteTask) {
            return res.status(403).json({
                message: "ليس لديك صلاحية لحذف مهمة من هذا المشروع."
            });
        }

        // =================================================
        // حذف المهمة
        // =================================================

        const {
            error: deleteError
        } = await supabase
            .from("tasks")
            .delete()
            .eq(
                "id",
                taskId
            );

        if (deleteError) {

            console.error(
                "❌ Task delete error:",
                deleteError
            );

            return res.status(500).json({

                message:
                    "فشل حذف المهمة.",

                error:
                    deleteError.message,

                details:
                    deleteError.details || null,

                hint:
                    deleteError.hint || null,

                code:
                    deleteError.code || null

            });

        }

        return res.status(200).json({

            message:
                "تم حذف المهمة بنجاح.",

            taskId:
                taskId

        });

    } catch (error) {

        console.error(
            "DELETE /tasks/:taskId ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "حدث خطأ في السيرفر."
        });

    }

}
);

// =====================================================
// عرض جميع Tasks
// =====================================================

app.get(
    "/tasks",
    verifyToken,
    async (req, res) => {

        try {

            const {
                data,
                error
            } = await supabase
                .from("tasks")
                .select(`
                    *,
                    task_members (
                        user_id,
                        users (
                            id,
                            username,
                            email,
                            role
                        )
                    )
                `)
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );

            if (error) {

                console.error(
                    "All tasks fetch error:",
                    error
                );

                return res.status(500).json({
                    message:
                        error.message
                });

            }

            return res.json(
                data || []
            );

        } catch (error) {

            console.error(
                "GET /tasks ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);


// =====================================================
// MY TASKS
// =====================================================

app.get(
    "/my-tasks",
    verifyToken,
    async (req, res) => {

        try {

            // =================================================
            // CURRENT USER
            // =================================================

            const userId =
                req.user.id ||
                req.user.userId ||
                req.user.user_id;


            console.log(
                "===================================="
            );

            console.log(
                "MY TASKS USER ID:",
                userId
            );

            console.log(
                "===================================="
            );


            if (!userId) {

                return res.status(401).json({
                    error:
                        "المستخدم غير مسجل الدخول."
                });

            }


            // =================================================
            // GET TASK MEMBERS FOR CURRENT USER
            // =================================================

            const {
                data: memberships,
                error: membershipsError
            } = await supabase

                .from("task_members")

                .select("*")

                .eq(
                    "user_id",
                    userId
                );


            if (membershipsError) {

                console.error(
                    "TASK MEMBERS ERROR:",
                    membershipsError
                );

                return res.status(500).json({
                    error:
                        membershipsError.message
                });

            }


            console.log(
                "MY TASK MEMBERS:",
                memberships
            );


            // =================================================
            // NO TASKS
            // =================================================

            if (
                !memberships ||
                memberships.length === 0
            ) {

                return res.json({

                    stats: {

                        total: 0,
                        active: 0,
                        overdue: 0,
                        completed: 0

                    },

                    tasks: []

                });

            }


            // =================================================
            // TASK IDS
            // =================================================

            const taskIds =
                memberships

                    .map(
                        member =>
                            member.task_id
                    )

                    .filter(Boolean);


            console.log(
                "MY TASK IDS:",
                taskIds
            );


            if (
                taskIds.length === 0
            ) {

                return res.json({

                    stats: {

                        total: 0,
                        active: 0,
                        overdue: 0,
                        completed: 0

                    },

                    tasks: []

                });

            }


            // =================================================
            // GET TASKS
            // =================================================

            const {
                data: tasks,
                error: tasksError
            } = await supabase

                .from("tasks")

                .select("*")

                .in(
                    "id",
                    taskIds
                );


            if (tasksError) {

                console.error(
                    "MY TASKS ERROR:",
                    tasksError
                );

                return res.status(500).json({

                    error:
                        tasksError.message

                });

            }


            console.log(
                "MY TASKS RAW:",
                tasks
            );


            // =================================================
            // GET ALL MEMBERS FOR THESE TASKS
            // =================================================

            const {
                data: allTaskMembers,
                error: allTaskMembersError
            } = await supabase

                .from("task_members")

                .select("*")

                .in(
                    "task_id",
                    taskIds
                );


            if (
                allTaskMembersError
            ) {

                console.error(
                    "ALL TASK MEMBERS ERROR:",
                    allTaskMembersError
                );

            }


            console.log(
                "ALL TASK MEMBERS:",
                allTaskMembers
            );


            // =================================================
            // GET USERS FOR TASK MEMBERS
            // =================================================

            const memberUserIds =
                [
                    ...new Set(

                        (allTaskMembers || [])

                            .map(
                                member =>
                                    member.user_id
                            )

                            .filter(Boolean)

                    )
                ];


            let taskMemberUsers = [];


            if (
                memberUserIds.length > 0
            ) {

                const {
                    data: users,
                    error: usersError
                } = await supabase

                    .from("users")

                    .select("*")

                    .in(
                        "id",
                        memberUserIds
                    );


                if (usersError) {

                    console.error(
                        "TASK MEMBER USERS ERROR:",
                        usersError
                    );

                } else {

                    taskMemberUsers =
                        users || [];

                }

            }


            console.log(
                "TASK MEMBER USERS:",
                taskMemberUsers
            );


            // =================================================
            // GET PROJECT IDS
            // =================================================

            const projectIds =
                [
                    ...new Set(

                        (tasks || [])

                            .map(task => {

                                // دعم project_id
                                // ودعم projectId

                                return (
                                    task.project_id ??
                                    task.projectId ??
                                    null
                                );

                            })

                            .filter(Boolean)

                    )
                ];


            console.log(
                "MY TASK PROJECT IDS:",
                projectIds
            );


            // =================================================
            // GET PROJECTS
            // =================================================

            let projects = [];


            if (
                projectIds.length > 0
            ) {

                const {
                    data,
                    error
                } = await supabase

                    .from("projects")

                    .select("*")

                    .in(
                        "id",
                        projectIds
                    );


                if (error) {

                    console.error(
                        "MY TASKS PROJECT ERROR:",
                        error
                    );

                } else {

                    projects =
                        data || [];

                }

            }


            console.log(
                "MY TASKS PROJECTS:",
                projects
            );


            // =================================================
            // NORMALIZE TASKS
            // =================================================

            const normalizedTasks =
                (tasks || []).map(task => {


                    // =========================================
                    // PROJECT ID
                    // =========================================

                    const taskProjectId =
                        task.project_id ??
                        task.projectId ??
                        null;


                    // =========================================
                    // FIND PROJECT
                    // =========================================

                    const project =
                        projects.find(
                            project =>

                                String(
                                    project.id
                                ) ===

                                String(
                                    taskProjectId
                                )
                        ) || null;


                    // =========================================
                    // TASK MEMBERS
                    // =========================================

                    const taskMembers =
                        (allTaskMembers || [])

                            .filter(
                                member =>

                                    String(
                                        member.task_id
                                    ) ===

                                    String(
                                        task.id
                                    )
                            )

                            .map(
                                member => {

                                    const user =
                                        taskMemberUsers.find(
                                            u =>

                                                String(
                                                    u.id
                                                ) ===

                                                String(
                                                    member.user_id
                                                )
                                        );


                                    return {

                                        ...member,

                                        user:

                                            user

                                                ? {

                                                    id:
                                                        user.id,

                                                    username:
                                                        user.username ||
                                                        user.user_name ||
                                                        user.name ||
                                                        "مستخدم",

                                                    email:
                                                        user.email ||
                                                        "",

                                                    avatar:
                                                        user.avatar ||
                                                        user.avatar_url ||
                                                        user.profile_image ||
                                                        null

                                                }

                                                : {

                                                    id:
                                                        member.user_id,

                                                    username:
                                                        "مستخدم",

                                                    email:
                                                        "",

                                                    avatar:
                                                        null

                                                }

                                    };

                                }
                            );


                    // =========================================
                    // ATTACHMENT URL
                    // =========================================

                    const attachmentUrl =

                        task.attachment_url ??

                        task.attachmentUrl ??

                        task.attachments ??

                        task["Attachment URL"] ??

                        "";


                    // =========================================
                    // DEBUG
                    // =========================================

                    console.log(
                        `TASK ${task.id} PROJECT ID:`,
                        taskProjectId
                    );


                    console.log(
                        `TASK ${task.id} PROJECT:`,
                        project
                    );


                    console.log(
                        `TASK ${task.id} MEMBERS:`,
                        taskMembers
                    );


                    console.log(
                        `TASK ${task.id} ATTACHMENT:`,
                        attachmentUrl
                    );


                    // =========================================
                    // NORMALIZED TASK
                    // =========================================

                    return {

                        // =====================================
                        // BASIC
                        // =====================================

                        id:
                            task.id,


                        title:
                            task.title ||
                            task.Title ||
                            "بدون عنوان",


                        description:
                            task.description ||
                            task.Description ||
                            "",


                        // =====================================
                        // DATE
                        // =====================================

                        due_date:
                            task.due_date ||
                            task["Due Date"] ||
                            null,


                        // =====================================
                        // PRIORITY
                        // =====================================

                        priority:
                            task.priority ||
                            task.Priority ||
                            "medium",


                        // =====================================
                        // STATUS
                        // =====================================

                        status:
                            task.status ||
                            task.Status ||
                            "todo",


                        // =====================================
                        // PROJECT ID
                        // =====================================

                        project_id:
                            taskProjectId,


                        projectId:
                            taskProjectId,


                        // =====================================
                        // MEMBERS
                        // =====================================

                        members:
                            taskMembers,


                        task_members:
                            taskMembers,


                        // =====================================
                        // ATTACHMENTS
                        // =====================================

                        attachment_url:
                            attachmentUrl,


                        attachmentUrl:
                            attachmentUrl,


                        attachments:
                            attachmentUrl,


                        // =====================================
                        // PROJECT OBJECT
                        // =====================================

                        project:

                            project

                                ? {

                                    id:
                                        project.id,

                                    title:

                                        project.ProjectTitle ||

                                        project.projectTitle ||

                                        project.title ||

                                        project.name ||

                                        "مشروع بدون اسم"

                                }

                                : null

                    };

                });


            // =================================================
            // DATE
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
            // STATUS HELPER
            // =================================================

            function isCompleted(
                status
            ) {

                const value =
                    String(
                        status || ""
                    )
                        .toLowerCase()
                        .trim();


                return (

                    value === "مكتمل" ||

                    value === "مكتملة" ||

                    value === "completed" ||

                    value === "complete" ||

                    value === "done" ||

                    value === "delivered" ||

                    value === "تم التسليم"

                );

            }


            // =================================================
            // STATS
            // =================================================

            const total =
                normalizedTasks.length;


            const completed =
                normalizedTasks.filter(
                    task =>
                        isCompleted(
                            task.status
                        )
                ).length;


            const active =
                normalizedTasks.filter(
                    task =>
                        !isCompleted(
                            task.status
                        )
                ).length;


            const overdue =
                normalizedTasks.filter(
                    task => {


                        if (
                            isCompleted(
                                task.status
                            )
                        ) {

                            return false;

                        }


                        if (
                            !task.due_date
                        ) {

                            return false;

                        }


                        const due =
                            new Date(
                                task.due_date
                            );


                        if (
                            Number.isNaN(
                                due.getTime()
                            )
                        ) {

                            return false;

                        }


                        due.setHours(
                            0,
                            0,
                            0,
                            0
                        );


                        return (
                            due < today
                        );

                    }
                ).length;


            // =================================================
            // FINAL DEBUG
            // =================================================

            console.log(
                "===================================="
            );


            console.log(
                "MY TASKS FINAL:",
                normalizedTasks
            );


            console.log(
                "===================================="
            );


            // =================================================
            // RESPONSE
            // =================================================

            return res.json({

                stats: {

                    total,

                    active,

                    overdue,

                    completed

                },

                tasks:
                    normalizedTasks

            });


        } catch (error) {

            console.error(
                "MY TASKS FATAL ERROR:",
                error
            );


            return res.status(500).json({

                error:
                    "تعذر تحميل المهام.",

                details:
                    error.message

            });

        }

    }
);

// =====================================================
// DASHBOARD ANALYTICS
// =====================================================

app.get(
    "/dashboard/analytics",
    verifyToken,
    async (req, res) => {

        console.log("🔥 DASHBOARD ANALYTICS");
        console.log("USER ID:", req.user.id);

        try {

            const userId = req.user.id;

            // =================================================
            // 1. PROJECT MEMBERSHIPS
            // =================================================

            const {
                data: projectMemberships,
                error: membershipError
            } = await supabase
                .from("project_members")
                .select("project_id")
                .eq("user_id", userId);

            if (membershipError) {
                throw membershipError;
            }


            // =================================================
            // 2. OWNED PROJECTS
            // projects.user_id = owner
            // =================================================

            const {
                data: ownedProjects,
                error: ownedProjectsError
            } = await supabase
                .from("projects")
                .select("*")
                .eq("user_id", userId);

            if (ownedProjectsError) {
                throw ownedProjectsError;
            }


            const ownedProjectIds =
                (ownedProjects || [])
                    .map(project => project.id);


            const memberProjectIds =
                (projectMemberships || [])
                    .map(item => item.project_id);


            const allProjectIds = [
                ...new Set([
                    ...ownedProjectIds,
                    ...memberProjectIds
                ])
            ];


            console.log(
                "PROJECT IDS:",
                allProjectIds
            );


            // =================================================
            // 3. PROJECTS
            // =================================================

            let projects = [];

            if (allProjectIds.length > 0) {

                const {
                    data,
                    error
                } = await supabase
                    .from("projects")
                    .select("*")
                    .in(
                        "id",
                        allProjectIds
                    );

                if (error) {
                    throw error;
                }

                projects = data || [];
            }


            // =================================================
            // 4. TASKS
            // tasks.projectId = project relation
            // =================================================

            let tasks = [];

            if (allProjectIds.length > 0) {

                const {
                    data,
                    error
                } = await supabase
                    .from("tasks")
                    .select("*")
                    .in(
                        "projectId",
                        allProjectIds
                    );

                if (error) {
                    throw error;
                }

                tasks = data || [];
            }


            console.log(
                "TOTAL TASKS:",
                tasks.length
            );


            // =================================================
            // DATE
            // =================================================

            const now = new Date();


            // =================================================
            // STATUS
            // =================================================

            function normalizeStatus(status) {

                return String(
                    status || ""
                )
                    .trim()
                    .toLowerCase();

            }


            function isCompleted(task) {

                const status =
                    normalizeStatus(
                        task.status
                    );

                return [
                    "completed",
                    "complete",
                    "done",
                    "مكتملة",
                    "مكتمل",
                    "منتهية",
                    "منتهي"
                ].includes(status);

            }


            function isInProgress(task) {

                const status =
                    normalizeStatus(
                        task.status
                    );

                return [
                    "in progress",
                    "in_progress",
                    "progress",
                    "doing",
                    "active",
                    "قيد التنفيذ",
                    "جاري التنفيذ"
                ].includes(status);

            }


            // =================================================
            // 5. TASK COUNTS
            // =================================================

            const completedTasks =
                tasks.filter(
                    task =>
                        isCompleted(task)
                ).length;


            const inProgressTasks =
                tasks.filter(
                    task =>
                        isInProgress(task)
                ).length;

            const lateTasks =
                tasks.filter(task => {

                    // المهمة المكتملة لا نحسبها
                    if (isCompleted(task)) {
                        return false;
                    }


                    const dueDate =
                        task.due_date ||
                        task["Due Date"];


                    // بدون موعد استحقاق
                    if (!dueDate) {
                        return false;
                    }


                    const due =
                        new Date(dueDate);


                    const now =
                        new Date();


                    // الفرق بين الموعد واليوم
                    const diffTime =
                        due - now;


                    // تحويل الفرق إلى أيام
                    const diffDays =
                        Math.ceil(
                            diffTime /
                            (1000 * 60 * 60 * 24)
                        );


                    // إذا باقي 3 أيام أو أقل
                    return diffDays <= 3;

                }).length;

            const activeTasks =
                tasks.filter(
                    task =>
                        !isCompleted(task)
                ).length;


            const totalTasks =
                tasks.length;


            // =================================================
            // 6. COMPLETION %
            // =================================================

            const completionPercent =
                totalTasks > 0
                    ? Math.round(
                        (
                            completedTasks /
                            totalTasks
                        ) * 100
                    )
                    : 0;


            // =================================================
            // 7. TEAM MEMBERS
            // =================================================

            const teamMemberIds =
                new Set();


            // PROJECT MEMBERS

            if (
                allProjectIds.length > 0
            ) {

                const {
                    data: projectMembers,
                    error
                } = await supabase
                    .from("project_members")
                    .select("user_id")
                    .in(
                        "project_id",
                        allProjectIds
                    );

                if (error) {
                    throw error;
                }


                (projectMembers || [])
                    .forEach(
                        member => {

                            if (
                                member.user_id
                            ) {

                                teamMemberIds.add(
                                    member.user_id
                                );

                            }

                        }
                    );

            }


            // TASK MEMBERS

            if (
                tasks.length > 0
            ) {

                const taskIds =
                    tasks.map(
                        task =>
                            task.id
                    );


                const {
                    data: taskMembers,
                    error
                } = await supabase
                    .from("task_members")
                    .select(
                        "task_id,user_id"
                    )
                    .in(
                        "task_id",
                        taskIds
                    );

                if (error) {
                    throw error;
                }


                console.log(
                    "TASK MEMBERS:",
                    taskMembers
                );


                (taskMembers || [])
                    .forEach(
                        member => {

                            if (
                                member.user_id
                            ) {

                                teamMemberIds.add(
                                    member.user_id
                                );

                            }

                        }
                    );

            }


            const teamMembersCount =
                teamMemberIds.size;


            // =================================================
            // 8. PROJECT ANALYTICS
            // =================================================

            const projectAnalytics =
                projects.map(
                    project => {

                        const projectTasks =
                            tasks.filter(
                                task =>
                                    String(
                                        task.projectId
                                    ) ===
                                    String(
                                        project.id
                                    )
                            );


                        const projectCompleted =
                            projectTasks.filter(
                                task =>
                                    isCompleted(task)
                            ).length;


                        const projectLate =
                            projectTasks.filter(
                                task => {

                                    if (
                                        isCompleted(task)
                                    ) {
                                        return false;
                                    }


                                    const dueDate =
                                        task.due_date ||
                                        task["Due Date"];


                                    if (!dueDate) {
                                        return false;
                                    }


                                    return new Date(
                                        dueDate
                                    ) < now;

                                }
                            ).length;


                        const total =
                            projectTasks.length;


                        const progress =
                            total > 0
                                ? Math.round(
                                    (
                                        projectCompleted /
                                        total
                                    ) * 100
                                )
                                : 0;


                        return {

                            id:
                                project.id,

                            title:
                                project.ProjectTitle ||
                                project.project_title ||
                                project.title ||
                                "بدون اسم",

                            totalTasks:
                                total,

                            completedTasks:
                                projectCompleted,

                            remainingTasks:
                                Math.max(
                                    total -
                                    projectCompleted,
                                    0
                                ),

                            overdueTasks:
                                projectLate,

                            progress

                        };

                    }
                );


            // =================================================
            // 9. ACTIVE PROJECTS
            // =================================================

            const activeProjectAnalytics =
                projectAnalytics.filter(
                    project =>
                        project.progress < 100
                );


            const activeProjectsCount =
                activeProjectAnalytics.length;


            const projectsProgress =
                projectAnalytics.length > 0
                    ? Math.round(
                        projectAnalytics.reduce(
                            (
                                sum,
                                project
                            ) =>
                                sum +
                                project.progress,
                            0
                        ) /
                        projectAnalytics.length
                    )
                    : 0;


            // =================================================
            // 10. RISK PROJECTS
            // =================================================

            const riskProjects =
                projectAnalytics
                    .filter(
                        project =>
                            project.overdueTasks > 0
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            b.overdueTasks -
                            a.overdueTasks
                    )
                    .map(
                        project => ({

                            title:
                                project.title,

                            overdueTasks:
                                project.overdueTasks,

                            risk:
                                project.overdueTasks >= 5
                                    ? "خطر مرتفع"
                                    : project.overdueTasks >= 3
                                        ? "يحتاج متابعة"
                                        : "تنبيه"

                        })
                    );


            // =================================================
            // 11. TEAM PERFORMANCE
            // =================================================

            let teamPerformance = [];


            if (
                tasks.length > 0
            ) {

                const taskIds =
                    tasks.map(
                        task =>
                            task.id
                    );


                const {
                    data: taskMembers,
                    error
                } = await supabase
                    .from("task_members")
                    .select(
                        "task_id,user_id"
                    )
                    .in(
                        "task_id",
                        taskIds
                    );


                if (error) {
                    throw error;
                }


                const memberMap =
                    new Map();


                (taskMembers || [])
                    .forEach(
                        member => {

                            if (
                                !member.user_id
                            ) {
                                return;
                            }


                            if (
                                !memberMap.has(
                                    member.user_id
                                )
                            ) {

                                memberMap.set(
                                    member.user_id,
                                    {
                                        totalTasks: 0,
                                        completedTasks: 0
                                    }
                                );

                            }


                            const stats =
                                memberMap.get(
                                    member.user_id
                                );


                            const task =
                                tasks.find(
                                    item =>
                                        item.id ===
                                        member.task_id
                                );


                            stats.totalTasks++;


                            if (
                                task &&
                                isCompleted(task)
                            ) {

                                stats.completedTasks++;

                            }

                        }
                    );


                const memberIds =
                    [
                        ...memberMap.keys()
                    ];


                if (
                    memberIds.length > 0
                ) {

                    const {
                        data: users,
                        error
                    } = await supabase
                        .from("users")
                        .select(
                            "id,username"
                        )
                        .in(
                            "id",
                            memberIds
                        );


                    if (error) {
                        throw error;
                    }


                    teamPerformance =
                        (users || [])
                            .map(
                                user => {

                                    const stats =
                                        memberMap.get(
                                            user.id
                                        ) || {
                                            totalTasks: 0,
                                            completedTasks: 0
                                        };


                                    const completionRate =
                                        stats.totalTasks > 0
                                            ? Math.round(
                                                (
                                                    stats.completedTasks /
                                                    stats.totalTasks
                                                ) * 100
                                            )
                                            : 0;


                                    return {

                                        username:
                                            user.username,

                                        totalTasks:
                                            stats.totalTasks,

                                        completedTasks:
                                            stats.completedTasks,

                                        completionRate

                                    };

                                }
                            )
                            .sort(
                                (
                                    a,
                                    b
                                ) =>
                                    b.completionRate -
                                    a.completionRate
                            );

                }

            }


            // =================================================
            // 12. WEEKLY ACTIVITY
            // =================================================

            const weeklyActivity = [];


            for (
                let i = 6;
                i >= 0;
                i--
            ) {

                const date =
                    new Date();


                date.setDate(
                    date.getDate() -
                    i
                );


                const dateString =
                    date.toISOString()
                        .split("T")[0];


                const count =
                    tasks.filter(
                        task => {

                            if (
                                !isCompleted(task)
                            ) {
                                return false;
                            }


                            const completedDate =
                                task.completed_at ||
                                task.completedAt ||
                                task.updated_at;


                            if (
                                !completedDate
                            ) {
                                return false;
                            }


                            return String(
                                completedDate
                            ).startsWith(
                                dateString
                            );

                        }
                    ).length;


                weeklyActivity.push({

                    label:
                        date.toLocaleDateString(
                            "ar-SA",
                            {
                                weekday:
                                    "short"
                            }
                        ),

                    count

                });

            }


            // =================================================
            // 13. ACTIVITY HEATMAP
            // =================================================

            const activityHeatmap = [];


            for (
                let i = 29;
                i >= 0;
                i--
            ) {

                const date =
                    new Date();


                date.setDate(
                    date.getDate() -
                    i
                );


                const dateString =
                    date.toISOString()
                        .split("T")[0];


                const count =
                    tasks.filter(
                        task => {

                            const activityDate =
                                task.updated_at ||
                                task.updatedAt ||
                                task.created_at ||
                                task.createdAt;


                            if (
                                !activityDate
                            ) {
                                return false;
                            }


                            return String(
                                activityDate
                            ).startsWith(
                                dateString
                            );

                        }
                    ).length;


                activityHeatmap.push({

                    date:
                        dateString,

                    count

                });

            }


            // =================================================
            // 14. COMPLETION GROWTH
            // =================================================

            const completionGrowth = 0;


            // =================================================
            // 15. RESPONSE
            // =================================================

            res.json({

                totalTasks,

                activeTasks,

                activeTasksCount:
                    activeTasks,

                lateTasks,

                lateTasksCount:
                    lateTasks,

                completedTasks,

                completedTasksCount:
                    completedTasks,

                inProgressTasks,

                teamMembersCount,

                completionPercent,

                completionGrowth,

                weeklyActivity,

                riskProjects,

                teamPerformance,

                activityHeatmap,

                activeProjectsCount,

                projectsProgress,

                projects:
                    activeProjectAnalytics

            });


        } catch (error) {

            console.error(
                "❌ Dashboard Analytics Error:",
                error
            );


            res.status(500).json({

                message:
                    "حدث خطأ أثناء تحميل تحليلات الداشبورد",

                error:
                    error.message,

                code:
                    error.code || null

            });

        }

    }
);

// =====================================================
// جلب تعليقات Task
// =====================================================

app.get(
    "/tasks/:taskId/comments",
    verifyToken,
    async (req, res) => {

        try {

            const {
                taskId
            } = req.params;

            const currentUserId =
                req.user.id;

            // =================================================
            // التأكد أن المهمة موجودة
            // =================================================

            const {
                data: task,
                error: taskError
            } = await supabase
                .from("tasks")
                .select(
                    "id"
                )
                .eq(
                    "id",
                    taskId
                )
                .maybeSingle();

            if (taskError) {

                console.error(
                    "❌ Comments task lookup error:",
                    taskError
                );

                return res.status(500).json({

                    message:
                        "حدث خطأ أثناء البحث عن المهمة.",

                    error:
                        taskError.message,

                    details:
                        taskError.details || null,

                    hint:
                        taskError.hint || null,

                    code:
                        taskError.code || null

                });

            }

            if (!task) {

                return res.status(404).json({
                    message:
                        "المهمة غير موجودة."
                });

            }

            // =================================================
            // جلب التعليقات
            // =================================================

            const {
                data: comments,
                error: commentsError
            } = await supabase
                .from("task_comments")
                .select(`
                    id,
                    task_id,
                    user_id,
                    comment,
                    created_at
                `)
                .eq(
                    "task_id",
                    taskId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );

            if (commentsError) {

                console.error(
                    "Comments fetch error:",
                    commentsError
                );

                return res.status(500).json({
                    message:
                        commentsError.message
                });

            }

            if (
                !comments ||
                comments.length === 0
            ) {

                return res.json([]);

            }

            // =================================================
            // استخراج IDs المستخدمين
            // =================================================

            const userIds = [
                ...new Set(
                    comments.map(
                        comment =>
                            comment.user_id
                    )
                )
            ];

            // =================================================
            // جلب المستخدمين
            // =================================================

            const {
                data: users,
                error: usersError
            } = await supabase
                .from("users")
                .select(
                    "id, username"
                )
                .in(
                    "id",
                    userIds
                );

            if (usersError) {

                console.error(
                    "Users fetch error:",
                    usersError
                );

                return res.status(500).json({
                    message:
                        "فشل جلب أسماء المستخدمين."
                });

            }

            // =================================================
            // ربط التعليقات بالمستخدمين
            // =================================================

            const commentsWithUsers =
                comments.map(
                    comment => {

                        const sender =
                            users.find(
                                user =>
                                    String(
                                        user.id
                                    ) ===
                                    String(
                                        comment.user_id
                                    )
                            );

                        return {

                            id:
                                comment.id,

                            task_id:
                                comment.task_id,

                            user_id:
                                comment.user_id,

                            comment:
                                comment.comment,

                            created_at:
                                comment.created_at,

                            username:
                                sender?.username ||
                                "مستخدم",

                            isOwner:
                                String(
                                    comment.user_id
                                ) ===
                                String(
                                    currentUserId
                                )

                        };

                    }
                );

            return res.json(
                commentsWithUsers
            );

        } catch (error) {

            console.error(
                "GET COMMENTS ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);

// =====================================================
// تعديل تعليق
// =====================================================

app.patch(
    "/comments/:commentId",
    verifyToken,
    async (req, res) => {

        try {

            const {
                commentId
            } = req.params;

            const {
                comment
            } = req.body;

            const currentUserId =
                req.user.id;

            if (
                !comment ||
                !comment.trim()
            ) {

                return res.status(400).json({
                    message:
                        "التعليق فارغ."
                });

            }

            // =================================================
            // جلب التعليق
            // =================================================
            const {
                data: oldComment,
                error: findError
            } = await supabase
                .from("task_comments")
                .select(`
                    id,
                    task_id,
                    user_id
                `)
                .eq(
                    "id",
                    commentId
                )
                .maybeSingle();

            if (findError) {

                console.error(
                    "Find comment error:",
                    findError
                );

                return res.status(500).json({
                    message:
                        "حدث خطأ أثناء البحث عن التعليق.",
                    error:
                        findError.message
                });

            }

            if (!oldComment) {

                return res.status(404).json({
                    message:
                        "التعليق غير موجود."
                });

            }

            // =================================================
            // التأكد أن المستخدم صاحب التعليق
            // =================================================

            if (
                String(
                    oldComment.user_id
                ) !==
                String(
                    currentUserId
                )
            ) {

                return res.status(403).json({
                    message:
                        "لا يمكنك تعديل هذا التعليق."
                });

            }

            // =================================================
            // تحديث التعليق
            // =================================================

            const {
                data: updatedComment,
                error: updateError
            } = await supabase
                .from("task_comments")
                .update({
                    comment:
                        comment.trim()
                })
                .eq(
                    "id",
                    commentId
                )
                .eq(
                    "user_id",
                    currentUserId
                )
                .select(`
                    id,
                    task_id,
                    user_id,
                    comment,
                    created_at
                `)
                .single();

            if (updateError) {

                console.error(
                    "Update comment error:",
                    updateError
                );

                return res.status(500).json({
                    message:
                        "فشل تعديل التعليق.",
                    error:
                        updateError.message
                });

            }

            // =================================================
            // جلب اسم المستخدم
            // =================================================

            const {
                data: sender,
                error: senderError
            } = await supabase
                .from("users")
                .select(
                    "id, username"
                )
                .eq(
                    "id",
                    updatedComment.user_id
                )
                .maybeSingle();

            if (senderError) {

                return res.status(500).json({
                    message:
                        "تم تعديل التعليق ولكن فشل جلب اسم المرسل."
                });

            }

            return res.json({

                message:
                    "تم تعديل التعليق بنجاح.",

                comment: {

                    ...updatedComment,

                    username:
                        sender?.username ||
                        "مستخدم",

                    isOwner:
                        true

                }

            });

        } catch (error) {

            console.error(
                "PATCH COMMENT ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);

// =====================================================
// حذف تعليق
// =====================================================

app.delete(
    "/comments/:commentId",
    verifyToken,
    async (req, res) => {

        try {

            const {
                commentId
            } = req.params;

            const currentUserId =
                req.user.id;

            // =================================================
            // جلب التعليق
            // =================================================

            const {
                data: oldComment,
                error: findError
            } = await supabase
                .from("task_comments")
                .select(`
                    id,
                    task_id,
                    user_id
                `)
                .eq(
                    "id",
                    commentId
                )
                .maybeSingle();

            if (findError) {

                console.error(
                    "Find comment error:",
                    findError
                );

                return res.status(500).json({
                    message:
                        "حدث خطأ أثناء البحث عن التعليق.",
                    error:
                        findError.message
                });

            }

            if (!oldComment) {

                return res.status(404).json({
                    message:
                        "التعليق غير موجود."
                });

            }

            // =================================================
            // التأكد أن المستخدم صاحب التعليق
            // =================================================

            if (
                String(
                    oldComment.user_id
                ) !==
                String(
                    currentUserId
                )
            ) {

                return res.status(403).json({
                    message:
                        "لا يمكنك حذف هذا التعليق."
                });

            }

            // =================================================
            // الحذف
            // =================================================

            const {
                error: deleteError
            } = await supabase
                .from("task_comments")
                .delete()
                .eq(
                    "id",
                    commentId
                )
                .eq(
                    "user_id",
                    currentUserId
                );

            if (deleteError) {

                console.error(
                    "Delete comment error:",
                    deleteError
                );

                return res.status(500).json({

                    message:
                        "فشل حذف التعليق.",

                    error:
                        deleteError.message,

                    details:
                        deleteError.details,

                    hint:
                        deleteError.hint,

                    code:
                        deleteError.code

                });

            }

            return res.json({

                message:
                    "تم حذف التعليق بنجاح.",

                commentId:
                    commentId

            });

        } catch (error) {

            console.error(
                "DELETE COMMENT ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);
// =====================================================
// إضافة تعليق على Task
// =====================================================

app.post(
    "/tasks/:taskId/comments",
    verifyToken,
    async (req, res) => {

        try {

            const {
                taskId
            } = req.params;

            const {
                comment
            } = req.body;

            const currentUserId =
                req.user.id;


            // =================================================
            // التحقق من التعليق
            // =================================================

            if (
                !comment ||
                !comment.trim()
            ) {

                return res.status(400).json({
                    message:
                        "التعليق فارغ."
                });

            }


            // =================================================
            // التأكد أن المهمة موجودة
            // =================================================

            const {
                data: task,
                error: taskError
            } = await supabase
                .from("tasks")
                .select(
                    "id"
                )
                .eq(
                    "id",
                    taskId
                )
                .maybeSingle();


            if (taskError) {

                console.error(
                    "❌ Add comment task lookup error:",
                    taskError
                );

                return res.status(500).json({

                    message:
                        "حدث خطأ أثناء البحث عن المهمة.",

                    error:
                        taskError.message

                });

            }


            if (!task) {

                return res.status(404).json({

                    message:
                        "المهمة غير موجودة."

                });

            }


            // =================================================
            // إضافة التعليق
            // =================================================

            const {
                data: newComment,
                error: insertError
            } = await supabase
                .from("task_comments")
                .insert({

                    task_id:
                        taskId,

                    user_id:
                        currentUserId,

                    comment:
                        comment.trim()

                })
                .select(`
                    id,
                    task_id,
                    user_id,
                    comment,
                    created_at
                `)
                .single();


            if (insertError) {

                console.error(
                    "❌ Add comment insert error:",
                    insertError
                );

                return res.status(500).json({

                    message:
                        "فشل إضافة التعليق.",

                    error:
                        insertError.message,

                    details:
                        insertError.details || null,

                    hint:
                        insertError.hint || null,

                    code:
                        insertError.code || null

                });

            }


            // =================================================
            // جلب اسم المستخدم
            // =================================================

            const {
                data: sender,
                error: senderError
            } = await supabase
                .from("users")
                .select(
                    "id, username"
                )
                .eq(
                    "id",
                    currentUserId
                )
                .maybeSingle();


            if (senderError) {

                console.error(
                    "Get comment sender error:",
                    senderError
                );

            }


            // =================================================
            // SUCCESS
            // =================================================

            return res.status(201).json({

                message:
                    "تم إضافة التعليق بنجاح.",

                comment: {

                    ...newComment,

                    username:
                        sender?.username ||
                        "مستخدم",

                    isOwner:
                        true

                }

            });


        } catch (error) {

            console.error(
                "POST COMMENT ERROR:",
                error
            );

            return res.status(500).json({

                message:
                    "حدث خطأ في السيرفر.",

                error:
                    error.message

            });

        }

    }
);
// =====================================================
// AI TRILL - OLLAMA / QWEN3
// =====================================================

app.post(
    "/ai/chat",
    verifyToken,
    async (req, res) => {

        console.log("1️⃣ وصل طلب /ai/chat");

        try {

            const {
                message,
                projectId
            } = req.body;

            const userId =
                req.user.id;

            const userRole =
                req.user.role;


            console.log("2️⃣ الرسالة:", message);
            console.log("3️⃣ projectId:", projectId);
            console.log("4️⃣ user:", userId);
            console.log("5️⃣ role:", userRole);


            if (
                !message ||
                !message.trim()
            ) {

                return res.status(400).json({
                    message:
                        "يرجى كتابة رسالة."
                });

            }


            // =================================================
            // الصلاحيات التي يسمح لها AI بتنفيذ عمليات
            // =================================================

            const allowedAIRoles = [
                "owner",
                "manager",
                "admin"
            ];


            const canExecuteAI =
                allowedAIRoles.includes(
                    userRole
                );


            // =================================================
            // 1. تحليل طلب المستخدم
            // =================================================

            const intentResponse =
                await fetch(
                    "http://localhost:11434/api/chat",
                    {

                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                model:
                                    "qwen3:8b",

                                stream:
                                    false,

                                format:
                                    "json",

                                messages: [

                                    {
                                        role:
                                            "system",

                                        content: `
أنت محلل أوامر داخل نظام TrillFlow.

مهمتك تحديد هل المستخدم يريد:

1. محادثة عادية
2. إنشاء مشروع
3. إنشاء مهمة

أرجع JSON فقط.

إذا كانت محادثة عادية:

{
    "action": "chat"
}

إذا كان يريد إنشاء مشروع:

{
    "action": "create_project",
    "data": {
        "title": "",
        "description": "",
        "status": "",
        "due_date": null,
        "Priority": null,
        "members": []
    }
}

إذا كان يريد إنشاء مهمة:

{
    "action": "create_task",
    "data": {
        "title": "",
        "description": "",
        "status": "",
        "due_date": null,
        "Priority": null,
        "members": []
    }
}

قواعد المشروع:

- title = اسم المشروع.
- description = وصف المشروع.
- status = حالة المشروع.
- due_date = تاريخ التسليم بصيغة YYYY-MM-DD.
- Priority = الأولوية.
- members = أسماء أعضاء المشروع.

قواعد المهمة:

- title = عنوان المهمة.
- description = وصف المهمة.
- status = حالة المهمة.
- due_date = تاريخ التسليم بصيغة YYYY-MM-DD.
- Priority = الأولوية.
- members = أسماء أعضاء المهمة.

الأولوية:

"عاجل"
"عالية"
"متوسطة"
"منخفضة"

الحالة:

"قيد الانتظار"
"قيد التنفيذ"
"مكتملة"

إذا لم يحدد المستخدم تاريخ التسليم:

"due_date": null

إذا لم يحدد الأولوية:

"Priority": null

إذا لم يحدد أعضاء:

"members": []

لا تخترع أسماء أعضاء.

إذا قال المستخدم "عاجل" اجعل Priority = "عاجل".

إذا قال "قيد الانتظار" اجعل status = "قيد الانتظار".

إذا قال "قيد التنفيذ" اجعل status = "قيد التنفيذ".

إذا قال "مكتملة" اجعل status = "مكتملة".

التاريخ يجب أن يكون YYYY-MM-DD.

لا تكتب أي شيء خارج JSON.
`
                                    },

                                    {
                                        role:
                                            "user",

                                        content:
                                            message.trim()
                                    }

                                ]

                            })

                    }
                );


            if (!intentResponse.ok) {

                console.error(
                    "Ollama intent error:",
                    intentResponse.status
                );

                return res.status(500).json({
                    message:
                        "تعذر تحليل الطلب."
                });

            }


            const intentResult =
                await intentResponse.json();


            let aiIntent;


            try {

                aiIntent =
                    JSON.parse(
                        intentResult.message.content
                    );

            } catch (error) {

                console.error(
                    "AI JSON parse error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "تعذر فهم أمر الذكاء الاصطناعي."
                });

            }


            console.log(
                "6️⃣ AI Intent:",
                aiIntent
            );


            // =================================================
            // CHAT عادي
            // =================================================

            if (
                aiIntent.action ===
                "chat"
            ) {

                console.log(
                    "7️⃣ محادثة عادية"
                );


                const response =
                    await fetch(
                        "http://localhost:11434/api/chat",
                        {

                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    model:
                                        "qwen3:8b",

                                    messages: [

                                        {
                                            role:
                                                "system",

                                            content: `
أنت مساعد ذكاء اصطناعي داخل نظام TrillFlow لإدارة المشاريع.

أجب باللغة العربية بشكل واضح ومختصر.

مهمتك:

- مساعدة المستخدم في إدارة المشاريع والمهام.
- الإجابة عن الأسئلة المتعلقة بالمشاريع والمهام.
- شرح المفاهيم بطريقة بسيطة.
- مساعدة المستخدم في التخطيط وتنظيم العمل.

القواعد:

- تحدث باللغة العربية.
- كن واضحًا ومختصرًا.
- لا تعط معلومات غير متأكد منها.
- لا تخترع بيانات عن مشاريع المستخدم أو مهامه.
- لا تدعي أنك نفذت عملية لم يتم تنفيذها.
- أنت تعمل داخل TrillFlow.
`
                                        },

                                        {
                                            role:
                                                "user",

                                            content:
                                                message.trim()
                                        }

                                    ],

                                    stream:
                                        true

                                })

                        }
                    );


                if (!response.ok) {

                    return res.status(500).json({
                        message:
                            "حدث خطأ أثناء الاتصال بـ Ollama."
                    });

                }


                res.setHeader(
                    "Content-Type",
                    "text/plain; charset=utf-8"
                );


                res.setHeader(
                    "Transfer-Encoding",
                    "chunked"
                );


                const reader =
                    response.body.getReader();


                const decoder =
                    new TextDecoder();


                let buffer = "";


                while (true) {

                    const {
                        done,
                        value
                    } =
                        await reader.read();


                    if (done) {
                        break;
                    }


                    buffer +=
                        decoder.decode(
                            value,
                            {
                                stream:
                                    true
                            }
                        );


                    const lines =
                        buffer.split("\n");


                    buffer =
                        lines.pop();


                    for (
                        const line of lines
                    ) {

                        if (
                            !line.trim()
                        ) {
                            continue;
                        }


                        try {

                            const data =
                                JSON.parse(
                                    line
                                );


                            if (
                                data.message &&
                                data.message.content
                            ) {

                                res.write(
                                    data.message.content
                                );

                            }

                        } catch (error) {

                            console.log(
                                "خطأ في قراءة chunk:",
                                error
                            );

                        }

                    }

                }


                return res.end();

            }


            // =================================================
            // منع تنفيذ العمليات لغير المسموح لهم
            // =================================================

            if (
                aiIntent.action ===
                "create_project" ||

                aiIntent.action ===
                "create_task"
            ) {

                if (!canExecuteAI) {

                    return res.status(403).json({
                        message:
                            "ليس لديك صلاحية لتنفيذ عمليات الإنشاء من خلال AI."
                    });

                }

            }


            // =================================================
            // CREATE PROJECT
            // =================================================

            if (
                aiIntent.action ===
                "create_project"
            ) {

                const data =
                    aiIntent.data || {};


                const title =
                    data.title?.trim();


                if (!title) {

                    return res.status(400).json({
                        message:
                            "لم يتم تحديد اسم المشروع."
                    });

                }


                const description =
                    data.description?.trim() || "";


                const status =
                    data.status ||
                    "قيد الانتظار";


                const dueDate =
                    data.due_date ||
                    null;


                const Priority =
                    data.Priority ||
                    null;


                const memberNames =
                    Array.isArray(
                        data.members
                    )
                        ? data.members
                        : [];


                console.log(
                    "8️⃣ إنشاء مشروع:",
                    title
                );


                // =============================================
                // إنشاء المشروع
                // =============================================

                const {
                    data: project,
                    error: projectError
                } =
                    await supabase
                        .from("projects")
                        .insert([
                            {

                                ProjectTitle:
                                    title,

                                description:
                                    description,

                                status:
                                    status,

                                due_date:
                                    dueDate,

                                Priority:
                                    Priority,

                                image_url:
                                    null,

                                user_id:
                                    userId

                            }
                        ])
                        .select()
                        .single();


                if (projectError) {

                    console.error(
                        "AI create project error:",
                        projectError
                    );

                    return res.status(500).json({
                        message:
                            "فشل إنشاء المشروع.",
                        error:
                            projectError.message
                    });

                }


                // =============================================
                // أعضاء المشروع
                // =============================================

                if (
                    memberNames.length > 0
                ) {

                    const {
                        data: users,
                        error: usersError
                    } =
                        await supabase
                            .from("users")
                            .select(
                                "id, username"
                            )
                            .in(
                                "username",
                                memberNames
                            );


                    if (usersError) {

                        console.error(
                            "AI project members error:",
                            usersError
                        );

                    } else if (
                        users &&
                        users.length > 0
                    ) {

                        const projectMembers =
                            users.map(
                                user => ({

                                    project_id:
                                        project.id,

                                    user_id:
                                        user.id

                                })
                            );


                        const {
                            error:
                            membersError
                        } =
                            await supabase
                                .from(
                                    "project_members"
                                )
                                .insert(
                                    projectMembers
                                );


                        if (membersError) {

                            console.error(
                                "AI project members insert error:",
                                membersError
                            );

                        }

                    }

                }


                return res.status(201).json({

                    type:
                        "action",

                    action:
                        "create_project",

                    message:
                        `تم إنشاء المشروع "${title}" بنجاح.`,

                    project:
                        project

                });

            }


            // =================================================
            // CREATE TASK
            // =================================================

            if (
                aiIntent.action ===
                "create_task"
            ) {

                const data =
                    aiIntent.data || {};


                const title =
                    data.title?.trim();


                if (!title) {

                    return res.status(400).json({
                        message:
                            "لم يتم تحديد عنوان المهمة."
                    });

                }


                // =============================================
                // المشروع
                // =============================================

                if (!projectId) {

                    return res.status(400).json({
                        message:
                            "لم يتم تحديد المشروع. افتح المشروع المطلوب أولًا."
                    });

                }


                // =============================================
                // التأكد أن المشروع موجود
                // =============================================

                const {
                    data: project,
                    error: projectError
                } =
                    await supabase
                        .from("projects")
                        .select("id")
                        .eq(
                            "id",
                            projectId
                        )
                        .maybeSingle();


                if (projectError) {

                    console.error(
                        "AI project lookup error:",
                        projectError
                    );

                    return res.status(500).json({
                        message:
                            "حدث خطأ أثناء التحقق من المشروع."
                    });

                }


                if (!project) {

                    return res.status(404).json({
                        message:
                            "المشروع غير موجود."
                    });

                }


                // =============================================
                // بيانات المهمة
                // =============================================

                const description =
                    data.description ||
                    "";


                const Priority =
                    data.Priority ||
                    null;


                const status =
                    data.status ||
                    "قيد الانتظار";


                const dueDate =
                    data.due_date ||
                    null;


                const memberNames =
                    Array.isArray(
                        data.members
                    )
                        ? data.members
                        : [];


                // =============================================
                // إنشاء المهمة
                // =============================================

                const {
                    data: task,
                    error: taskError
                } =
                    await supabase
                        .from("tasks")
                        .insert([
                            {

                                Title:
                                    title,

                                description:
                                    description,

                                "Due Date":
                                    dueDate,

                                Priority:
                                    Priority,

                                status:
                                    status,

                                attachment_url:
                                    null,

                                projectId:
                                    projectId

                            }
                        ])
                        .select()
                        .single();


                if (taskError) {

                    console.error(
                        "AI create task error:",
                        taskError
                    );

                    return res.status(500).json({
                        message:
                            "فشل إنشاء المهمة.",
                        error:
                            taskError.message
                    });

                }


                // =============================================
                // أعضاء المهمة
                // =============================================

                let addedMembers = 0;


                if (
                    memberNames.length > 0
                ) {

                    // -----------------------------------------
                    // جلب أعضاء المشروع فقط
                    // -----------------------------------------

                    const {
                        data:
                        projectMembers,
                        error:
                        projectMembersError
                    } =
                        await supabase
                            .from(
                                "project_members"
                            )
                            .select(
                                "user_id"
                            )
                            .eq(
                                "project_id",
                                projectId
                            );


                    if (
                        projectMembersError
                    ) {

                        console.error(
                            "Project members lookup error:",
                            projectMembersError
                        );

                    } else {

                        const projectUserIds =
                            (
                                projectMembers ||
                                []
                            ).map(
                                member =>
                                    member.user_id
                            );


                        if (
                            projectUserIds.length > 0
                        ) {

                            const {
                                data: users,
                                error: usersError
                            } =
                                await supabase
                                    .from("users")
                                    .select(
                                        "id, username"
                                    )
                                    .in(
                                        "id",
                                        projectUserIds
                                    );


                            if (!usersError) {

                                const matchedUsers =
                                    (
                                        users ||
                                        []
                                    ).filter(
                                        user =>

                                            memberNames.some(
                                                name =>

                                                    String(
                                                        user.username
                                                    )
                                                        .trim()
                                                        .toLowerCase() ===
                                                    String(
                                                        name
                                                    )
                                                        .trim()
                                                        .toLowerCase()
                                            )
                                    );


                                if (
                                    matchedUsers.length > 0
                                ) {

                                    const taskMembers =
                                        matchedUsers.map(
                                            user => ({

                                                task_id:
                                                    task.id,

                                                user_id:
                                                    user.id

                                            })
                                        );


                                    const {
                                        error:
                                        tmError
                                    } =
                                        await supabase
                                            .from(
                                                "task_members"
                                            )
                                            .insert(
                                                taskMembers
                                            );


                                    if (tmError) {

                                        console.error(
                                            "AI task members error:",
                                            tmError
                                        );

                                    } else {

                                        addedMembers =
                                            matchedUsers.length;

                                    }

                                }

                            }

                        }

                    }

                }


                return res.status(201).json({

                    type:
                        "action",

                    action:
                        "create_task",

                    message:
                        `تم إنشاء المهمة "${title}" بنجاح.`,

                    task:
                        task,

                    membersAdded:
                        addedMembers

                });

            }


            // =================================================
            // Action غير معروف
            // =================================================

            return res.status(400).json({
                message:
                    "لم أفهم العملية المطلوبة."
            });


        } catch (error) {

            console.error(
                "AI Error:",
                error
            );


            if (
                !res.headersSent
            ) {

                return res.status(500).json({
                    message:
                        "تعذر تنفيذ طلب الذكاء الاصطناعي."
                });

            }


            res.end();

        }

    }
);
// =====================================================
// TASK OVERDUE NOTIFICATIONS
// =====================================================

async function checkOverdueTasks() {

    try {

        const today =
            new Date()
                .toISOString()
                .slice(0, 10);


        // =============================================
        // جلب المهام المتأخرة
        // =============================================

        const {
            data: tasks,
            error: tasksError
        } = await supabase
            .from("tasks")
            .select("*")
            .lt(
                "Due Date",
                today
            );


        if (tasksError) {

            console.error(
                "OVERDUE TASKS ERROR:",
                tasksError
            );

            return;

        }


        if (
            !tasks ||
            tasks.length === 0
        ) {

            return;

        }


        // =============================================
        // فحص كل مهمة
        // =============================================

        for (
            const task of tasks
        ) {

            // -----------------------------------------
            // تجاهل المهام المكتملة
            // -----------------------------------------

            const taskStatus =
                String(
                    task.status ||
                    task.Status ||
                    ""
                )
                    .toLowerCase()
                    .trim();


            if (
                taskStatus === "done" ||
                taskStatus === "completed" ||
                taskStatus === "complete" ||
                taskStatus === "مكتمل"
            ) {

                continue;

            }


            // =========================================
            // معرفة أعضاء المهمة
            // =========================================

            const {
                data: taskMembers,
                error: membersError
            } = await supabase
                .from("task_members")
                .select(
                    "user_id"
                )
                .eq(
                    "task_id",
                    task.id
                );


            if (membersError) {

                console.error(
                    "OVERDUE TASK MEMBERS ERROR:",
                    membersError
                );

                continue;

            }


            if (
                !taskMembers ||
                taskMembers.length === 0
            ) {

                continue;

            }


            // =========================================
            // منع تكرار الإشعار
            // =========================================

            const {
                data: existingNotification
            } = await supabase
                .from("task_overdue_notifications")
                .select("id")
                .eq(
                    "task_id",
                    task.id
                )
                .eq(
                    "due_date",
                    task["Due Date"]
                )
                .maybeSingle();


            if (existingNotification) {

                continue;

            }


            // =========================================
            // تسجيل الإشعار
            // =========================================

            const {
                error: notificationInsertError
            } = await supabase
                .from(
                    "task_overdue_notifications"
                )
                .insert({

                    task_id:
                        task.id,

                    due_date:
                        task["Due Date"]

                });


            if (notificationInsertError) {

                // إذا كان مسجلًا بالفعل
                if (
                    notificationInsertError.code ===
                    "23505"
                ) {

                    continue;

                }


                console.error(
                    "OVERDUE NOTIFICATION INSERT ERROR:",
                    notificationInsertError
                );

                continue;

            }


            // =========================================
            // حساب عدد أيام التأخير
            // =========================================

            const dueDate =
                new Date(
                    task["Due Date"]
                );


            const todayDate =
                new Date(
                    today
                );


            const daysOverdue =
                Math.floor(
                    (
                        todayDate -
                        dueDate
                    ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                );


            // =========================================
            // جلب المستخدمين
            // =========================================

            const userIds =
                taskMembers
                    .map(
                        member =>
                            member.user_id
                    )
                    .filter(Boolean);


            const {
                data: users,
                error: usersError
            } = await supabase
                .from("users")
                .select(
                    "id, username, email"
                )
                .in(
                    "id",
                    userIds
                );


            if (usersError) {

                console.error(
                    "OVERDUE USERS ERROR:",
                    usersError
                );

                continue;

            }


            // =========================================
            // إرسال الإشعار
            // =========================================

            for (
                const user of users || []
            ) {

                await sendNotification({

                    user: {

                        id:
                            user.id,

                        username:
                            user.username,

                        email:
                            user.email

                    },


                    type:
                        NotificationType.TASK_OVERDUE,


                    data: {

                        taskId:
                            task.id,

                        taskTitle:
                            task.Title,

                        dueDate:
                            task["Due Date"],

                        daysOverdue:
                            daysOverdue

                    }

                });

            }

        }

    } catch (error) {

        console.error(
            "CHECK OVERDUE TASKS ERROR:",
            error
        );

    }

}

// =====================================================
// GET USER NOTIFICATIONS
// =====================================================

app.get(
    "/notifications",
    verifyToken,
    async (req, res) => {

        try {

            const userId =
                req.user.id;


            const {
                data: notifications,
                error
            } = await supabase
                .from("notifications")
                .select(`
                    id,
                    type,
                    title,
                    message,
                    link,
                    data,
                    is_read,
                    created_at
                `)
                .eq(
                    "user_id",
                    userId
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(50);


            if (error) {

                console.error(
                    "GET NOTIFICATIONS ERROR:",
                    error
                );

                return res.status(500).json({
                    error:
                        "Failed to load notifications"
                });

            }


            const {
                count,
                error: countError
            } = await supabase
                .from("notifications")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "user_id",
                    userId
                )
                .eq(
                    "is_read",
                    false
                );


            if (countError) {

                console.error(
                    "NOTIFICATION COUNT ERROR:",
                    countError
                );

            }


            res.json({

                notifications:
                    notifications || [],

                unreadCount:
                    count || 0

            });


        } catch (error) {

            console.error(
                "GET NOTIFICATIONS ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Failed to load notifications"
            });

        }

    }
);
// =====================================================
// MARK NOTIFICATION AS READ
// =====================================================

app.patch(
    "/notifications/:id/read",
    verifyToken,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const {
                error
            } = await supabase
                .from("notifications")
                .update({

                    is_read:
                        true

                })
                .eq(
                    "id",
                    id
                )
                .eq(
                    "user_id",
                    req.user.id
                );


            if (error) {

                console.error(
                    "MARK NOTIFICATION READ ERROR:",
                    error
                );

                return res.status(500).json({
                    error:
                        "Failed to update notification"
                });

            }


            res.json({
                success: true
            });


        } catch (error) {

            console.error(
                "MARK NOTIFICATION READ ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Failed"
            });

        }

    }
);
// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

app.patch(
    "/notifications/read-all",
    verifyToken,
    async (req, res) => {

        try {

            const {
                error
            } = await supabase
                .from("notifications")
                .update({

                    is_read:
                        true

                })
                .eq(
                    "user_id",
                    req.user.id
                )
                .eq(
                    "is_read",
                    false
                );


            if (error) {

                console.error(
                    "MARK ALL NOTIFICATIONS ERROR:",
                    error
                );

                return res.status(500).json({
                    error:
                        "Failed"
                });

            }


            res.json({
                success: true
            });


        } catch (error) {

            console.error(
                "MARK ALL NOTIFICATIONS ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "Failed"
            });

        }

    }
);
// =====================================================
// TRILL FLOW CHANNELS SYSTEM
// =====================================================


// =====================================================
// HELPERS
// =====================================================

function isChannelAdmin(req) {

    return [
        "owner",
        "manager",
        "admin"
    ].includes(req.user?.role);

}


async function getChannelById(channelId) {

    const { data, error } = await supabase
        .from("channels")
        .select(`
            id,
            name,
            description,
            image_url,
            is_private,
            created_by,
            created_at,
            updated_at
        `)
        .eq("id", channelId)
        .single();

    if (error) {
        return {
            data: null,
            error
        };
    }

    return {
        data,
        error: null
    };

}


async function isChannelMember(
    channelId,
    userId
) {

    const { data, error } = await supabase
        .from("channel_members")
        .select("id")
        .eq("channel_id", channelId)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {

        console.error(
            "CHANNEL MEMBER CHECK ERROR:",
            error
        );

        return false;

    }

    return !!data;

}


// =====================================================
// CHANNEL ACCESS
// =====================================================

async function canAccessChannel(
    channel,
    userId
) {

    if (!channel) {
        return false;
    }


    // المدير والمالك والأدمن يستطيعون
    // الوصول إلى القنوات
    if (
        [
            "owner",
            "manager",
            "admin"
        ].includes(
            arguments[2]?.role
        )
    ) {

        return true;

    }


    // القناة العامة
    if (!channel.is_private) {

        return true;

    }


    // القناة الخاصة
    return await isChannelMember(
        channel.id,
        userId
    );

}


// =====================================================
// GET ALL USERS
// =====================================================

app.get(
    "/users",
    verifyToken,
    async (req, res) => {

        try {

            const {
                data,
                error
            } = await supabase
                .from("users")
                .select(
                    "id, username, email, role"
                )
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


            if (error) {

                console.error(
                    "Users fetch error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل جلب أعضاء النظام."
                });

            }


            return res.json(data);

        } catch (error) {

            console.error(
                "GET /users ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);


// =====================================================
// GET CHANNELS
// =====================================================

app.get(
    "/channels",
    verifyToken,
    async (req, res) => {

        try {

            const userId =
                Number(req.user.id);


            const {
                data: channels,
                error
            } = await supabase
                .from("channels")
                .select(`
                    id,
                    name,
                    description,
                    image_url,
                    is_private,
                    created_by,
                    created_at,
                    updated_at
                `)
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


            if (error) {

                console.error(
                    "GET CHANNELS ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل تحميل القنوات."
                });

            }


            if (!channels?.length) {

                return res.json([]);

            }


            // جلب عضويات المستخدم
            const {
                data: memberships
            } = await supabase
                .from("channel_members")
                .select(
                    "channel_id"
                )
                .eq(
                    "user_id",
                    userId
                );


            const memberChannelIds =
                new Set(
                    (memberships || [])
                        .map(
                            item =>
                                Number(
                                    item.channel_id
                                )
                        )
                );


            // جلب آخر الرسائل
            const channelIds =
                channels.map(
                    channel =>
                        channel.id
                );


            const {
                data: messages
            } = await supabase
                .from("channel_messages")
                .select(`
                    id,
                    channel_id,
                    message,
                    user_id,
                    created_at
                `)
                .in(
                    "channel_id",
                    channelIds
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


            const lastMessages = {};


            for (
                const message
                of messages || []
            ) {

                if (
                    !lastMessages[
                    message.channel_id
                    ]
                ) {

                    lastMessages[
                        message.channel_id
                    ] =
                        message;

                }

            }


            const result =
                channels
                    .filter(channel => {

                        // الإدارة تشوف كل شيء
                        if (
                            isChannelAdmin(req)
                        ) {

                            return true;

                        }

                        // العامة للجميع
                        if (
                            !channel.is_private
                        ) {

                            return true;

                        }

                        // الخاصة للأعضاء فقط
                        return memberChannelIds.has(
                            Number(channel.id)
                        );

                    })
                    .map(channel => ({

                        ...channel,

                        last_message:
                            lastMessages[
                            channel.id
                            ] || null

                    }));


            return res.json(result);

        } catch (error) {

            console.error(
                "GET /channels ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء تحميل القنوات."
            });

        }

    }
);


// =====================================================
// GET SINGLE CHANNEL
// =====================================================

app.get(
    "/channels/:id",
    verifyToken,
    async (req, res) => {

        try {

            const channelId =
                Number(
                    req.params.id
                );


            const {
                data: channel,
                error
            } =
                await getChannelById(
                    channelId
                );


            if (error || !channel) {

                return res.status(404).json({
                    message:
                        "القناة غير موجودة."
                });

            }


            if (
                !isChannelAdmin(req) &&
                channel.is_private
            ) {

                const member =
                    await isChannelMember(
                        channelId,
                        Number(req.user.id)
                    );


                if (!member) {

                    return res.status(403).json({
                        message:
                            "ليس لديك صلاحية الوصول إلى هذه القناة."
                    });

                }

            }


            return res.json(channel);

        } catch (error) {

            console.error(
                "GET CHANNEL ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);


// =====================================================
// CREATE CHANNEL
// ADMIN / MANAGER / OWNER ONLY
// =====================================================

app.post(
    "/channels",
    verifyToken,
    requireRole(
        "owner",
        "manager",
        "admin"
    ),
    async (req, res) => {

        try {

            const {
                name,
                description,
                image_url,
                is_private,
                members
            } = req.body;
            console.log("🖼️ SERVER CHANNEL IMAGE URL:", image_url);

            if (
                !name ||
                !name.trim()
            ) {

                return res.status(400).json({
                    message:
                        "اسم القناة مطلوب."
                });

            }


            const cleanName =
                name.trim();


            // منع اسم طويل جدًا
            if (
                cleanName.length > 100
            ) {

                return res.status(400).json({
                    message:
                        "اسم القناة طويل جدًا."
                });

            }


            // التأكد أن الأعضاء Array
            const memberIds =
                Array.isArray(members)
                    ? [
                        ...new Set(
                            members
                                .map(
                                    id =>
                                        Number(id)
                                )
                                .filter(
                                    id =>
                                        Number.isFinite(id)
                                )
                        )
                    ]
                    : [];


            // إنشاء القناة
            const {
                data: channel,
                error
            } = await supabase
                .from("channels")
                .insert({

                    name:
                        cleanName,

                    description:
                        description
                            ? description.trim()
                            : null,

                    image_url:
                        image_url || null,

                    is_private:
                        Boolean(
                            is_private
                        ),

                    created_by:
                        Number(
                            req.user.id
                        )

                })
                .select()
                .single();


            if (error) {

                console.error(
                    "CREATE CHANNEL ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل إنشاء القناة."
                });

            }


            // إضافة الأعضاء
            if (
                memberIds.length
            ) {

                const rows =
                    memberIds.map(
                        userId => ({

                            channel_id:
                                channel.id,

                            user_id:
                                userId

                        })
                    );


                const {
                    error:
                    membersError
                } =
                    await supabase
                        .from(
                            "channel_members"
                        )
                        .insert(rows);


                if (membersError) {

                    console.error(
                        "ADD CHANNEL MEMBERS ERROR:",
                        membersError
                    );

                }

            }


            return res.status(201).json({

                message:
                    "تم إنشاء القناة بنجاح.",

                channel

            });

        } catch (error) {

            console.error(
                "POST /channels ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء إنشاء القناة."
            });

        }

    }
);


// =====================================================
// UPDATE CHANNEL
// =====================================================

app.put(
    "/channels/:id",
    verifyToken,
    requireRole(
        "owner",
        "manager",
        "admin"
    ),
    async (req, res) => {

        try {

            const channelId =
                Number(
                    req.params.id
                );


            const {
                name,
                description,
                image_url,
                is_private,
                members
            } = req.body;


            if (
                !name ||
                !name.trim()
            ) {

                return res.status(400).json({
                    message:
                        "اسم القناة مطلوب."
                });

            }


            const {
                data: existing,
                error:
                existingError
            } =
                await getChannelById(
                    channelId
                );


            if (
                existingError ||
                !existing
            ) {

                return res.status(404).json({
                    message:
                        "القناة غير موجودة."
                });

            }


            const {
                data: updated,
                error
            } = await supabase
                .from("channels")
                .update({

                    name:
                        name.trim(),

                    description:
                        description
                            ? description.trim()
                            : null,

                    image_url:
                        image_url ||
                        null,

                    is_private:
                        Boolean(
                            is_private
                        ),

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    channelId
                )
                .select()
                .single();


            if (error) {

                console.error(
                    "UPDATE CHANNEL ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل تعديل القناة."
                });

            }


            // تحديث الأعضاء
            if (
                Array.isArray(members)
            ) {

                const memberIds =
                    [
                        ...new Set(
                            members
                                .map(
                                    id =>
                                        Number(id)
                                )
                                .filter(
                                    id =>
                                        Number.isFinite(id)
                                )
                        )
                    ];


                // حذف الحاليين
                const {
                    error:
                    deleteMembersError
                } =
                    await supabase
                        .from(
                            "channel_members"
                        )
                        .delete()
                        .eq(
                            "channel_id",
                            channelId
                        );


                if (
                    deleteMembersError
                ) {

                    console.error(
                        "DELETE OLD MEMBERS ERROR:",
                        deleteMembersError
                    );

                }


                // إضافة الجدد
                if (
                    memberIds.length
                ) {

                    const rows =
                        memberIds.map(
                            userId => ({

                                channel_id:
                                    channelId,

                                user_id:
                                    userId

                            })
                        );


                    const {
                        error:
                        insertMembersError
                    } =
                        await supabase
                            .from(
                                "channel_members"
                            )
                            .insert(rows);


                    if (
                        insertMembersError
                    ) {

                        console.error(
                            "INSERT MEMBERS ERROR:",
                            insertMembersError
                        );

                    }

                }

            }


            return res.json({

                message:
                    "تم تعديل القناة بنجاح.",

                channel:
                    updated

            });

        } catch (error) {

            console.error(
                "PUT /channels/:id ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء تعديل القناة."
            });

        }

    }
);


// =====================================================
// DELETE CHANNEL
// =====================================================

app.delete(
    "/channels/:id",
    verifyToken,
    requireRole(
        "owner",
        "manager",
        "admin"
    ),
    async (req, res) => {

        try {

            const channelId =
                Number(
                    req.params.id
                );


            const {
                data: channel,
                error:
                channelError
            } =
                await getChannelById(
                    channelId
                );


            if (
                channelError ||
                !channel
            ) {

                return res.status(404).json({
                    message:
                        "القناة غير موجودة."
                });

            }


            // لا نعتمد على ON DELETE CASCADE لأن بعض قواعد البيانات
            // قد لا تكون مهيأة به. احذف البيانات التابعة أولاً حتى لا
            // تمنع مفاتيح الربط الأجنبية حذف القناة.
            const {
                error: messagesError
            } = await supabase
                .from("channel_messages")
                .delete()
                .eq(
                    "channel_id",
                    channelId
                );


            if (messagesError) {

                console.error(
                    "DELETE CHANNEL MESSAGES ERROR:",
                    messagesError
                );

                return res.status(500).json({
                    message:
                        "فشل حذف رسائل القناة."
                });

            }


            const {
                error: membersError
            } = await supabase
                .from("channel_members")
                .delete()
                .eq(
                    "channel_id",
                    channelId
                );


            if (membersError) {

                console.error(
                    "DELETE CHANNEL MEMBERS ERROR:",
                    membersError
                );

                return res.status(500).json({
                    message:
                        "فشل حذف أعضاء القناة."
                });

            }


            const {
                error
            } = await supabase
                .from("channels")
                .delete()
                .eq(
                    "id",
                    channelId
                );


            if (error) {

                console.error(
                    "DELETE CHANNEL ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل حذف القناة."
                });

            }


            return res.json({

                message:
                    "تم حذف القناة وجميع محتوياتها."

            });

        } catch (error) {

            console.error(
                "DELETE /channels ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء حذف القناة."
            });

        }

    }
);


// =====================================================
// GET CHANNEL MEMBERS
// =====================================================

app.get(
    "/channels/:id/members",
    verifyToken,
    async (req, res) => {

        try {

            const channelId =
                Number(
                    req.params.id
                );


            const {
                data: channel
            } =
                await getChannelById(
                    channelId
                );


            if (!channel) {

                return res.status(404).json({
                    message:
                        "القناة غير موجودة."
                });

            }


            if (
                channel.is_private &&
                !isChannelAdmin(req)
            ) {

                const member =
                    await isChannelMember(
                        channelId,
                        Number(req.user.id)
                    );


                if (!member) {

                    return res.status(403).json({
                        message:
                            "ليس لديك صلاحية."
                    });

                }

            }


            const {
                data: memberships,
                error
            } = await supabase
                .from("channel_members")
                .select(
                    "user_id"
                )
                .eq(
                    "channel_id",
                    channelId
                );


            if (error) {

                console.error(
                    "GET CHANNEL MEMBERS ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل جلب أعضاء القناة."
                });

            }


            const ids =
                (memberships || [])
                    .map(
                        item =>
                            item.user_id
                    );


            if (!ids.length) {

                return res.json([]);

            }


            const {
                data: users,
                error:
                usersError
            } =
                await supabase
                    .from("users")
                    .select(
                        "id, username, email, role"
                    )
                    .in(
                        "id",
                        ids
                    )
                    .order(
                        "id",
                        {
                            ascending: true
                        }
                    );


            if (usersError) {

                console.error(
                    "CHANNEL USERS ERROR:",
                    usersError
                );

                return res.status(500).json({
                    message:
                        "فشل جلب بيانات الأعضاء."
                });

            }


            return res.json(
                users || []
            );

        } catch (error) {

            console.error(
                "GET MEMBERS ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ في السيرفر."
            });

        }

    }
);

// =====================================================
// UPLOAD CHANNEL IMAGE TO GOOGLE DRIVE
// =====================================================

app.post(
    "/channels/upload-image",
    verifyToken,
    requireRole(
        "owner",
        "manager",
        "admin"
    ),
    upload.single("channelImage"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    message: "لم يتم اختيار صورة."
                });

            }


            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif"
            ];


            if (
                !allowedTypes.includes(
                    req.file.mimetype
                )
            ) {

                return res.status(400).json({
                    message: "نوع الصورة غير مدعوم."
                });

            }


            // 5 MB
            if (
                req.file.size >
                5 * 1024 * 1024
            ) {

                return res.status(400).json({
                    message:
                        "حجم الصورة يجب ألا يتجاوز 5MB."
                });

            }


            // رفع الصورة إلى Google Drive
            const uploadedFile =
                await uploadToGoogleDrive(
                    req.file
                );


            return res.json({

                success: true,

                image_url:
                    `/channels/image/${uploadedFile.id}`,

                google_drive_file_id:
                    uploadedFile.id

            });

        } catch (error) {

            console.error(
                "UPLOAD CHANNEL IMAGE ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء رفع الصورة."
            });

        }

    }
);

// =====================================================
// GET CHANNEL MESSAGES
// =====================================================

app.get(
    "/channels/:id/messages",
    verifyToken,
    async (req, res) => {

        try {

            const channelId =
                Number(
                    req.params.id
                );


            const {
                data: channel
            } =
                await getChannelById(
                    channelId
                );


            if (!channel) {

                return res.status(404).json({
                    message:
                        "القناة غير موجودة."
                });

            }


            // التحقق من القناة الخاصة
            if (
                channel.is_private &&
                !isChannelAdmin(req)
            ) {

                const member =
                    await isChannelMember(
                        channelId,
                        Number(req.user.id)
                    );


                if (!member) {

                    return res.status(403).json({
                        message:
                            "ليس لديك صلاحية الوصول إلى هذه القناة."
                    });

                }

            }


            const {
                data,
                error
            } = await supabase
                .from("channel_messages")
                .select(`
                    id,
                    channel_id,
                    user_id,
                    message,
                    is_pinned,
                    edited_at,
                    created_at,
                    users (
                        id,
                        username,
                        email,
                        role
                    )
                `)
                .eq(
                    "channel_id",
                    channelId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


            if (error) {

                console.error(
                    "GET CHANNEL MESSAGES ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل تحميل الرسائل."
                });

            }


            return res.json(
                data || []
            );

        } catch (error) {

            console.error(
                "GET MESSAGES ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء تحميل الرسائل."
            });

        }

    }
);


// =====================================================
// SEND CHANNEL MESSAGE
// =====================================================

app.post(
    "/channels/:id/messages",
    verifyToken,
    async (req, res) => {

        try {

            const channelId =
                Number(
                    req.params.id
                );


            const message =
                String(
                    req.body.message ||
                    ""
                ).trim();


            if (!message) {

                return res.status(400).json({
                    message:
                        "الرسالة فارغة."
                });

            }


            if (
                message.length >
                5000
            ) {

                return res.status(400).json({
                    message:
                        "الرسالة طويلة جدًا."
                });

            }


            const {
                data: channel
            } =
                await getChannelById(
                    channelId
                );


            if (!channel) {

                return res.status(404).json({
                    message:
                        "القناة غير موجودة."
                });

            }


            // العامة
            // الخاصة تحتاج عضوية
            if (
                channel.is_private &&
                !isChannelAdmin(req)
            ) {

                const member =
                    await isChannelMember(
                        channelId,
                        Number(req.user.id)
                    );


                if (!member) {

                    return res.status(403).json({
                        message:
                            "أنت لست عضوًا في هذه القناة."
                    });

                }

            }


            const {
                data,
                error
            } = await supabase
                .from(
                    "channel_messages"
                )
                .insert({

                    channel_id:
                        channelId,

                    user_id:
                        Number(
                            req.user.id
                        ),

                    message

                })
                .select(`
                    id,
                    channel_id,
                    user_id,
                    message,
                    is_pinned,
                    edited_at,
                    created_at,
                    users (
                        id,
                        username,
                        email,
                        role
                    )
                `)
                .single();


            if (error) {

                console.error(
                    "SEND CHANNEL MESSAGE ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل إرسال الرسالة."
                });

            }


            return res.status(201).json(
                data
            );

        } catch (error) {

            console.error(
                "POST MESSAGE ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء إرسال الرسالة."
            });

        }

    }
);


// =====================================================
// EDIT CHANNEL MESSAGE
// =====================================================

app.put(
    "/channels/:channelId/messages/:messageId",
    verifyToken,
    async (req, res) => {

        try {

            const channelId =
                Number(
                    req.params.channelId
                );

            const messageId =
                Number(
                    req.params.messageId
                );

            const newMessage =
                String(
                    req.body.message ||
                    ""
                ).trim();


            if (!newMessage) {

                return res.status(400).json({
                    message:
                        "الرسالة فارغة."
                });

            }


            const {
                data: existing,
                error:
                existingError
            } =
                await supabase
                    .from(
                        "channel_messages"
                    )
                    .select(
                        "id, user_id"
                    )
                    .eq(
                        "id",
                        messageId
                    )
                    .eq(
                        "channel_id",
                        channelId
                    )
                    .single();


            if (
                existingError ||
                !existing
            ) {

                return res.status(404).json({
                    message:
                        "الرسالة غير موجودة."
                });

            }


            const ownMessage =
                Number(
                    existing.user_id
                ) ===
                Number(
                    req.user.id
                );


            if (
                !ownMessage &&
                !isChannelAdmin(req)
            ) {

                return res.status(403).json({
                    message:
                        "لا يمكنك تعديل هذه الرسالة."
                });

            }


            const {
                data,
                error
            } = await supabase
                .from(
                    "channel_messages"
                )
                .update({

                    message:
                        newMessage,

                    edited_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    messageId
                )
                .select(`
                    id,
                    channel_id,
                    user_id,
                    message,
                    is_pinned,
                    edited_at,
                    created_at,
                    users (
                        id,
                        username,
                        email,
                        role
                    )
                `)
                .single();


            if (error) {

                console.error(
                    "EDIT MESSAGE ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل تعديل الرسالة."
                });

            }


            return res.json(data);

        } catch (error) {

            console.error(
                "PUT MESSAGE ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء تعديل الرسالة."
            });

        }

    }
);


// =====================================================
// DELETE CHANNEL MESSAGE
// =====================================================

app.delete(
    "/channels/:channelId/messages/:messageId",
    verifyToken,
    async (req, res) => {

        try {

            const channelId =
                Number(
                    req.params.channelId
                );

            const messageId =
                Number(
                    req.params.messageId
                );


            const {
                data: existing,
                error:
                existingError
            } =
                await supabase
                    .from(
                        "channel_messages"
                    )
                    .select(
                        "id, user_id"
                    )
                    .eq(
                        "id",
                        messageId
                    )
                    .eq(
                        "channel_id",
                        channelId
                    )
                    .single();


            if (
                existingError ||
                !existing
            ) {

                return res.status(404).json({
                    message:
                        "الرسالة غير موجودة."
                });

            }


            const ownMessage =
                Number(
                    existing.user_id
                ) ===
                Number(
                    req.user.id
                );


            if (
                !ownMessage &&
                !isChannelAdmin(req)
            ) {

                return res.status(403).json({
                    message:
                        "لا يمكنك حذف هذه الرسالة."
                });

            }


            const {
                error
            } = await supabase
                .from(
                    "channel_messages"
                )
                .delete()
                .eq(
                    "id",
                    messageId
                )
                .eq(
                    "channel_id",
                    channelId
                );


            if (error) {

                console.error(
                    "DELETE MESSAGE ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "فشل حذف الرسالة."
                });

            }


            return res.json({

                message:
                    "تم حذف الرسالة."

            });

        } catch (error) {

            console.error(
                "DELETE MESSAGE ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء حذف الرسالة."
            });

        }

    }
);


// =====================================================
// PIN / UNPIN MESSAGE
// ADMIN / MANAGER / OWNER
// =====================================================

app.patch(
    "/channels/:channelId/messages/:messageId/pin",
    verifyToken,
    requireRole(
        "owner",
        "manager",
        "admin"
    ),
    async (req, res) => {

        try {

            const channelId =
                Number(
                    req.params.channelId
                );

            const messageId =
                Number(
                    req.params.messageId
                );


            const pinned =
                Boolean(
                    req.body.pinned
                );


            const {
                data,
                error
            } = await supabase
                .from(
                    "channel_messages"
                )
                .update({

                    is_pinned:
                        pinned

                })
                .eq(
                    "id",
                    messageId
                )
                .eq(
                    "channel_id",
                    channelId
                )
                .select(`
                    id,
                    channel_id,
                    user_id,
                    message,
                    is_pinned,
                    edited_at,
                    created_at,
                    users (
                        id,
                        username,
                        email,
                        role
                    )
                `)
                .single();


            if (error || !data) {

                console.error(
                    "PIN MESSAGE ERROR:",
                    error
                );

                return res.status(404).json({
                    message:
                        "الرسالة غير موجودة."
                });

            }


            return res.json(data);

        } catch (error) {

            console.error(
                "PIN MESSAGE ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "حدث خطأ أثناء تثبيت الرسالة."
            });

        }

    }
);
/////////////////////////////////////////////
console.log("🚨 تشغيل فحص المهام المتأخرة الآن...");

checkOverdueTasks();
/////////////////////////////////////////////
// =====================================================
// تشغيل السيرفر
// =====================================================

app.listen(
    3000,
    () => {

        console.log(
            "🚀 Server running on http://localhost:3000"
        );

    }
);
