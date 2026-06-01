// =========================================================
// File: Frontend1/js/admin-api.js
// Mục đích: Hàm dùng chung để gọi API admin/backend
// =========================================================


// 1. Khai báo cấu hình API và localStorage
const ADMIN_API_BASE_URL = "../../BackEnd/php/api";

const ADMIN_CURRENT_USER_KEY = "admin_current_user";
const ADMIN_IS_LOGIN_KEY = "admin_is_login";

const ADMIN_ALLOWED_ROLES = ["owner", "admin", "staff"];


// 2. Chuẩn hóa endpoint API
function getAdminApiUrl(endpoint) {
    if (!endpoint) {
        return ADMIN_API_BASE_URL;
    }

    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
        return endpoint;
    }

    if (endpoint.startsWith("/")) {
        return ADMIN_API_BASE_URL + endpoint;
    }

    return ADMIN_API_BASE_URL + "/" + endpoint;
}


// 3. Lấy thông tin lỗi dễ đọc
function getApiErrorMessage(error, fallbackMessage) {
    if (error && error.message) {
        return error.message;
    }

    return fallbackMessage || "Co loi xay ra, vui long thu lai";
}


// 4. Xóa thông tin admin ở localStorage
function clearAdminLocalAuth() {
    localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
    localStorage.removeItem(ADMIN_IS_LOGIN_KEY);
}


// 5. Lưu thông tin admin vào localStorage
function saveAdminLocalAuth(user) {
    const roleCode = user && user.role ? user.role.code : "";

    const adminUser = {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: roleCode,
        roleName: user.role ? user.role.name : "",
        permissions: user.permissions || [],
        staffProfile: user.staff_profile || null,
        loginAt: new Date().toISOString()
    };

    localStorage.setItem(ADMIN_CURRENT_USER_KEY, JSON.stringify(adminUser));
    localStorage.setItem(ADMIN_IS_LOGIN_KEY, "true");

    return adminUser;
}


// 6. Lấy admin hiện tại từ localStorage
function getCurrentAdminFromLocal() {
    const rawUser = localStorage.getItem(ADMIN_CURRENT_USER_KEY);
    const isLogin = localStorage.getItem(ADMIN_IS_LOGIN_KEY) === "true";

    if (!rawUser || !isLogin) {
        return null;
    }

    try {
        return JSON.parse(rawUser);
    } catch (error) {
        clearAdminLocalAuth();
        return null;
    }
}


// 7. Kiểm tra role có phải admin/staff/owner không
function isAdminRole(user) {
    if (!user || !user.role) {
        return false;
    }

    return ADMIN_ALLOWED_ROLES.includes(user.role.code);
}


// 8. Gọi API dùng chung
async function fetchAdminApi(endpoint, options = {}) {
    const url = getAdminApiUrl(endpoint);

    const fetchOptions = {
        method: options.method || "GET",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };

    if (options.body !== undefined && options.body !== null) {
        if (typeof options.body === "string") {
            fetchOptions.body = options.body;
        } else {
            fetchOptions.body = JSON.stringify(options.body);
        }
    }

    const response = await fetch(url, fetchOptions);

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        throw {
            status: response.status,
            message: "API khong tra ve JSON hop le",
            data: null
        };
    }

    if (response.status === 401) {
        clearAdminLocalAuth();
    }

    if (!response.ok || data.success === false) {
        throw {
            status: response.status,
            message: data.message || "Goi API that bai",
            data: data
        };
    }

    return data;
}


// 9. Gọi API GET
function adminGet(endpoint) {
    return fetchAdminApi(endpoint, {
        method: "GET"
    });
}


// 10. Gọi API POST
function adminPost(endpoint, body) {
    return fetchAdminApi(endpoint, {
        method: "POST",
        body: body
    });
}


// 11. Lấy user hiện tại từ session PHP
async function getCurrentAdminFromSession() {
    const result = await adminGet("auth/get-current-user.php");
    const user = result.data && result.data.user ? result.data.user : null;

    if (!isAdminRole(user)) {
        clearAdminLocalAuth();

        throw {
            status: 403,
            message: "Tai khoan nay khong co quyen vao trang quan tri",
            data: result
        };
    }

    saveAdminLocalAuth(user);

    return user;
}


// 12. Đăng xuất admin
async function logoutAdmin() {
    try {
        await adminPost("auth/logout.php", {});
    } catch (error) {
        // Vẫn xóa localStorage kể cả khi API logout lỗi
    }

    clearAdminLocalAuth();

    window.location.href = "../html/admin-login.html";
}


// 13. Yêu cầu đăng nhập khi vào trang admin
async function requireAdminLogin() {
    const localAdmin = getCurrentAdminFromLocal();

    if (!localAdmin) {
        window.location.href = "../html/admin-login.html";
        return null;
    }

    try {
        const user = await getCurrentAdminFromSession();
        return user;
    } catch (error) {
        clearAdminLocalAuth();
        window.location.href = "../html/admin-login.html";
        return null;
    }
}


// 14. Format tiền Việt Nam
function formatAdminPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}


// 15. Format ngày giờ
function formatAdminDateTime(dateTime) {
    if (!dateTime) {
        return "";
    }

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) {
        return dateTime;
    }

    return date.toLocaleString("vi-VN");
}


// 16. Gắn object dùng chung ra window
window.AdminApi = {
    API_BASE_URL: ADMIN_API_BASE_URL,

    ADMIN_CURRENT_USER_KEY: ADMIN_CURRENT_USER_KEY,
    ADMIN_IS_LOGIN_KEY: ADMIN_IS_LOGIN_KEY,
    ADMIN_ALLOWED_ROLES: ADMIN_ALLOWED_ROLES,

    fetchAdminApi: fetchAdminApi,
    get: adminGet,
    post: adminPost,

    saveAdminLocalAuth: saveAdminLocalAuth,
    clearAdminLocalAuth: clearAdminLocalAuth,
    getCurrentAdminFromLocal: getCurrentAdminFromLocal,
    getCurrentAdminFromSession: getCurrentAdminFromSession,
    requireAdminLogin: requireAdminLogin,
    logoutAdmin: logoutAdmin,

    isAdminRole: isAdminRole,
    getApiErrorMessage: getApiErrorMessage,

    formatPrice: formatAdminPrice,
    formatDateTime: formatAdminDateTime
};