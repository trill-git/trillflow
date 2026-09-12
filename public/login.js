////////////////////////hero////////////////////////////////
const btn1 = document.getElementById("hero-btn1");
const btn2 = document.getElementById("hero-btn2");
const btn3 = document.getElementById("hero-btn3");
const signinform = document.getElementById("signinform");
const btnclose = document.getElementById("btn-close");
////////show and hide login form///////////////
btn1.addEventListener("click", () => {
    signinform.style.display = "flex";
});
btn2.addEventListener("click", () => {
    signinform.style.display = "flex";
});
btn3.addEventListener("click", () => {
    signinform.style.display = "flex";
});
btnclose.addEventListener("click", () => {
    signinform.style.display = "none";
});
// =====================================================
// التحقق من جلسة تسجيل الدخول الحالية
// =====================================================

// document.addEventListener("DOMContentLoaded", async () => {

//     try {

//         const response = await fetch(
//             "/check-session",
//             {
//                 method: "GET",
//                 credentials: "include"
//             }
//         );

//         if (response.ok) {

//             console.log(
//                 "✅ المستخدم مسجل دخول بالفعل"
//             );

//             window.location.href = "/dashboard";

//         } else {



//         }

//     } catch (error) {

//         console.error(
//             "❌ Session check error:",
//             error
//         );

//     }

// });
////////////////////////login////////////////////////////////
const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const messageBox = document.getElementById("messagebox");
const messageBox2 = document.getElementById("messagebox2");
const message = document.getElementById("message");
const message2 = document.getElementById("message2");
const loginCard = document.getElementById("loginCard");
const signinbtntext = document.getElementById("signinbtntext");

// ==========================================
/////////////signin تسجيل الدخول ////////
// ==========================================
const loginbtn = document.getElementById("loginbtn");
/// Sending data to the backend
loginbtn.addEventListener("click", async (e) => {
    e.preventDefault();

    loginbtn.disabled = true;
    signinbtntext.textContent = "جاري التحميل...";
    loginCard.classList.add("loading");


    try {

        const response = await fetch("/signin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include", // مهم جداً لإرسال واستقبال الـ Cookie
            body: JSON.stringify({
                email: email.value,
                password: password.value
            })
        });

        const result = await response.json();

        loginCard.classList.remove("loading");

        if (!response.ok) {
            message.textContent = result.message;
            messageBox.style.display = "flex";
            setTimeout(() => {
                messageBox.style.display = "none";
            }, 3000);

            return;

        }

        // لا تحفظ الـ JWT في localStorage
        // السيرفر سيضعه داخل HttpOnly Cookie

        window.location.href = "/dashboard";

    } catch (err) {
        message.textContent = "حدث خطأ في الاتصال بالسيرفر.";
        messageBox.style.display = "flex";
        setTimeout(() => {
            messageBox.style.display = "none";
        }, 3000);

        return;
    }
    finally {
        loginCard.classList.remove("loading");
        loginbtn.disabled = false;
        signinbtntext.textContent = "تسجيل الدخول";
    }

});
// ==========================================
/////////////signup انشاء الحساب ////////
// ==========================================
// const signupform = document.getElementById("signupform");
// const showSigninBtn = document.getElementById("showSigninBtn");
// const btnclose2 = document.getElementById("btn-close2");
// const signupbtn = document.getElementById("signupbtn");
// const signupusername = document.getElementById("signupusername");
// const signupemail = document.getElementById("signupemail");
// const signuppassword = document.getElementById("signuppassword");
// const btntext2 = document.getElementById("btntext2");
// const loginCard2 = document.getElementById("loginCard2");
////////show and hide signup form//////
// showSigninBtn.addEventListener("click", () => {
//     signinform.style.display = "none";
//     signupform.style.display = "flex";
// });
// btnclose2.addEventListener("click", () => {
//     signupform.style.display = "none";
// });

/// Sending data to the backend
// signupbtn.addEventListener("click", async (e) => {
//     e.preventDefault();


//     btntext2.textContent = "جاري التحميل...";
//     try {

//         const response = await fetch("/signup", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 signupusername: signupusername.value,
//                 signupemail: signupemail.value,
//                 signuppassword: signuppassword.value
//             })
//         });


//         const result = await response.json();


//         if (!response.ok) {

//             message2.textContent = result.message;
//             messageBox2.style.display = "flex";

//             setTimeout(() => {
//                 messageBox2.style.display = "none";
//             }, 3000);

//             return;
//         }


// نجاح التسجيل
//     window.location.href = "/dashboard";


// } catch (error) {

//     message2.textContent = "حدث خطأ في الاتصال بالسيرفر.";
//     messageBox2.style.display = "flex";


// } finally {

// يشتغل دائما بعد انتهاء الطلب
//         btntext2.textContent = "إنشاء حساب";
//         signupbtn.disabled = false;

//     }

// });

///////////////////////////preloader/////////////////////////////////
document.addEventListener("DOMContentLoaded", () => {

    const loader = document.getElementById("tpEl");
    const percent = document.getElementById("tpPercent");

    if (!loader || !percent) return;

    let progress = 0;

    const interval = setInterval(() => {

        const step =
            progress < 70
                ? Math.floor(Math.random() * 5) + 2
                : Math.floor(Math.random() * 2) + 1;

        progress += step;

        if (progress >= 100) {

            progress = 100;

            clearInterval(interval);

            percent.textContent = "100%";

            setTimeout(() => {

                loader.classList.add("hide");

            }, 500);

            return;
        }

        percent.textContent = `${progress}%`;

    }, 70);

});