// =========================================================
// File: Frontend1/js/admin-login.js
// Mục đích: Đăng nhập admin bằng API backend thật
// =========================================================


// 1. Lấy element từ DOM
const adminLoginForm = document.getElementById("adminLoginForm");
const adminUsernameInput = document.getElementById("adminUsername");
const adminPasswordInput = document.getElementById("adminPassword");
const rememberAdminInput = document.getElementById("rememberAdmin");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const formMessage = document.getElementById("formMessage");


// 2. Hiển thị thông báo
function showMessage(message, type = "error") {
    if (!formMessage) {
        return;
    }

    formMessage.textContent = message;

    if (type === "success") {
        formMessage.classList.add("success");
    } else {
        formMessage.classList.remove("success");
    }
}


// 3. Xóa thông báo
function clearMessage() {
    if (!formMessage) {
        return;
    }

    formMessage.textContent = "";
    formMessage.classList.remove("success");
}


// 4. Bật/tắt trạng thái loading
function setLoginLoading(isLoading) {
    const submitButton = adminLoginForm
        ? adminLoginForm.querySelector("button[type='submit']")
        : null;

    if (!submitButton) {
        return;
    }

    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Đang đăng nhập..." : "Đăng nhập";
}


// 5. Kiểm tra dữ liệu form
function validateLoginForm(account, password) {
    if (!account) {
        showMessage("Vui lòng nhập email hoặc số điện thoại.");
        adminUsernameInput.focus();
        return false;
    }

    if (!password) {
        showMessage("Vui lòng nhập mật khẩu.");
        adminPasswordInput.focus();
        return false;
    }

    return true;
}


// 6. Lấy user từ response login
function getUserFromLoginResponse(responseData) {
    if (!responseData || !responseData.data) {
        return null;
    }

    return responseData.data.user || null;
}


// 7. Kiểm tra tài khoản có quyền vào admin không
function validateAdminUser(user) {
    if (!user) {
        return false;
    }

    return window.AdminApi.isAdminRole(user);
}


// 8. Lưu ghi nhớ tài khoản
function saveRememberedAdmin(account) {
    if (!rememberAdminInput) {
        return;
    }

    if (rememberAdminInput.checked) {
        localStorage.setItem("admin_remember_username", account);
    } else {
        localStorage.removeItem("admin_remember_username");
    }
}


// 9. Xử lý đăng nhập
async function handleAdminLogin(event) {
    event.preventDefault();

    clearMessage();

    const account = adminUsernameInput.value.trim();
    const password = adminPasswordInput.value.trim();

    const isValid = validateLoginForm(account, password);

    if (!isValid) {
        return;
    }

    try {
        setLoginLoading(true);

        const responseData = await window.AdminApi.post("auth/login.php", {
            account: account,
            email: account,
            phone: account,
            password: password
        });

        const user = getUserFromLoginResponse(responseData);

        if (!validateAdminUser(user)) {
            window.AdminApi.clearAdminLocalAuth();

            try {
                await window.AdminApi.post("auth/logout.php", {});
            } catch (logoutError) {
                // Bỏ qua lỗi logout
            }

            showMessage("Tài khoản này không có quyền vào trang quản trị.");
            return;
        }

        window.AdminApi.saveAdminLocalAuth(user);
        saveRememberedAdmin(account);

        showMessage("Đăng nhập thành công. Đang chuyển trang...", "success");

        setTimeout(function () {
            window.location.href = "../html/admin-dashboard.html";
        }, 700);
    } catch (error) {
        const message = window.AdminApi.getApiErrorMessage(
            error,
            "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản."
        );

        showMessage(message);
    } finally {
        setLoginLoading(false);
    }
}


// 10. Ẩn hiện mật khẩu
function handleTogglePassword() {
    if (!adminPasswordInput || !togglePasswordBtn) {
        return;
    }

    const isPassword = adminPasswordInput.type === "password";

    adminPasswordInput.type = isPassword ? "text" : "password";
    togglePasswordBtn.textContent = isPassword ? "Ẩn" : "Hiện";
}


// 11. Tự điền tài khoản nếu đã ghi nhớ
function loadRememberedAdmin() {
    const rememberedUsername = localStorage.getItem("admin_remember_username");

    if (!rememberedUsername || !adminUsernameInput || !rememberAdminInput) {
        return;
    }

    adminUsernameInput.value = rememberedUsername;
    rememberAdminInput.checked = true;
}


// 12. Kiểm tra nếu đã đăng nhập thật bằng session
async function redirectIfLoggedIn() {
    const localAdmin = window.AdminApi.getCurrentAdminFromLocal();

    if (!localAdmin) {
        return;
    }

    try {
        await window.AdminApi.getCurrentAdminFromSession();
        window.location.href = "../html/admin-dashboard.html";
    } catch (error) {
        window.AdminApi.clearAdminLocalAuth();
    }
}


// 13. Gắn sự kiện cho trang đăng nhập
function bindAdminLoginEvents() {
    if (adminLoginForm) {
        adminLoginForm.addEventListener("submit", handleAdminLogin);
    }

    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener("click", handleTogglePassword);
    }

    if (adminUsernameInput) {
        adminUsernameInput.addEventListener("input", clearMessage);
    }

    if (adminPasswordInput) {
        adminPasswordInput.addEventListener("input", clearMessage);
    }
}


// 14. Khởi tạo trang đăng nhập quản trị
async function initAdminLoginPage() {
    if (!window.AdminApi) {
        showMessage("Thiếu file admin-api.js. Vui lòng kiểm tra lại thứ tự nhúng script.");
        return;
    }

    await redirectIfLoggedIn();
    loadRememberedAdmin();
    bindAdminLoginEvents();
}

initAdminLoginPage();