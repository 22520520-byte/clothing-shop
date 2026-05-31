// 1. Khai báo key localStorage
const ADMIN_CURRENT_USER_KEY = "admin_current_user";
const ADMIN_IS_LOGIN_KEY = "admin_is_login";

// 2. Khai báo tài khoản quản trị demo
const adminAccounts = [
    {
        username: "owner",
        password: "123456",
        fullName: "Chủ cửa hàng",
        role: "owner"
    },
    {
        username: "staff",
        password: "123456",
        fullName: "Nhân viên bán hàng",
        role: "staff"
    }
];

// 3. Lấy element từ DOM
const adminLoginForm = document.getElementById("adminLoginForm");
const adminUsernameInput = document.getElementById("adminUsername");
const adminPasswordInput = document.getElementById("adminPassword");
const rememberAdminInput = document.getElementById("rememberAdmin");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const formMessage = document.getElementById("formMessage");

// 4. Hiển thị thông báo
function showMessage(message, type = "error") {
    if (!formMessage) return;

    formMessage.textContent = message;

    if (type === "success") {
        formMessage.classList.add("success");
    } else {
        formMessage.classList.remove("success");
    }
}

// 5. Xóa thông báo
function clearMessage() {
    if (!formMessage) return;

    formMessage.textContent = "";
    formMessage.classList.remove("success");
}

// 6. Kiểm tra dữ liệu form
function validateLoginForm(username, password) {
    if (!username) {
        showMessage("Vui lòng nhập tên đăng nhập.");
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

// 7. Tìm tài khoản quản trị
function findAdminAccount(username, password) {
    return adminAccounts.find(function(account) {
        return account.username === username && account.password === password;
    });
}

// 8. Lưu trạng thái đăng nhập quản trị
function saveAdminLogin(account) {
    const adminUser = {
        username: account.username,
        fullName: account.fullName,
        role: account.role,
        loginAt: new Date().toISOString()
    };

    localStorage.setItem(ADMIN_CURRENT_USER_KEY, JSON.stringify(adminUser));
    localStorage.setItem(ADMIN_IS_LOGIN_KEY, "true");
}

// 9. Xử lý đăng nhập
function handleAdminLogin(event) {
    event.preventDefault();

    clearMessage();

    const username = adminUsernameInput.value.trim();
    const password = adminPasswordInput.value.trim();

    const isValid = validateLoginForm(username, password);

    if (!isValid) return;

    const account = findAdminAccount(username, password);

    if (!account) {
        showMessage("Tên đăng nhập hoặc mật khẩu không đúng.");
        return;
    }

    saveAdminLogin(account);

    if (rememberAdminInput.checked) {
        localStorage.setItem("admin_remember_username", username);
    } else {
        localStorage.removeItem("admin_remember_username");
    }

    showMessage("Đăng nhập thành công. Đang chuyển trang...", "success");

    setTimeout(function() {
        window.location.href = "../html/admin-dashboard.html";
    }, 700);
}

// 10. Ẩn hiện mật khẩu
function handleTogglePassword() {
    if (!adminPasswordInput || !togglePasswordBtn) return;

    const isPassword = adminPasswordInput.type === "password";

    adminPasswordInput.type = isPassword ? "text" : "password";
    togglePasswordBtn.textContent = isPassword ? "Ẩn" : "Hiện";
}

// 11. Tự điền tên đăng nhập nếu đã ghi nhớ
function loadRememberedAdmin() {
    const rememberedUsername = localStorage.getItem("admin_remember_username");

    if (!rememberedUsername) return;

    adminUsernameInput.value = rememberedUsername;
    rememberAdminInput.checked = true;
}

// 12. Kiểm tra nếu đã đăng nhập
function redirectIfLoggedIn() {
    const isLogin = localStorage.getItem(ADMIN_IS_LOGIN_KEY) === "true";
    const currentAdmin = localStorage.getItem(ADMIN_CURRENT_USER_KEY);

    if (isLogin && currentAdmin) {
        window.location.href = "../html/admin-dashboard.html";
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
function initAdminLoginPage() {
    redirectIfLoggedIn();
    loadRememberedAdmin();
    bindAdminLoginEvents();
}

initAdminLoginPage();