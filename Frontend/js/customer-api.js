// =========================================================
// File: Frontend/js/customer-api.js
// Mục đích: Hàm dùng chung để gọi API backend phía khách hàng
// =========================================================


// 1. Cấu hình API và localStorage
const CUSTOMER_API_BASE_URL = "../../BackEnd/php/api";

const CURRENT_USER_STORAGE_KEY = "current_user";
const IS_LOGIN_STORAGE_KEY = "is_login";
const USER_POINTS_STORAGE_KEY = "user_points";


// 2. Chuẩn hóa đường dẫn API
function getCustomerApiUrl(endpoint) {
    if (!endpoint) {
        return CUSTOMER_API_BASE_URL;
    }

    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
        return endpoint;
    }

    if (endpoint.startsWith("/")) {
        return CUSTOMER_API_BASE_URL + endpoint;
    }

    return CUSTOMER_API_BASE_URL + "/" + endpoint;
}


// 3. Đọc localStorage
function getDataFromStorage(key, fallbackValue) {
    const rawData = localStorage.getItem(key);

    if (!rawData) {
        return fallbackValue;
    }

    try {
        return JSON.parse(rawData);
    } catch (error) {
        return fallbackValue;
    }
}


// 4. Ghi localStorage
function saveDataToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}


// 5. Xóa phiên đăng nhập local
function clearCustomerLocalAuth() {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    localStorage.removeItem(IS_LOGIN_STORAGE_KEY);
}


// 6. Lấy key người dùng để đồng bộ điểm
function getCustomerUserKey(user) {
    if (!user) {
        return "";
    }

    return (
        user.id ||
        user.userId ||
        user.email ||
        user.phone ||
        user.username ||
        user.fullName ||
        user.name ||
        "member"
    );
}


// 7. Đồng bộ điểm vào localStorage cũ
function syncCustomerPoints(user) {
    const userKey = getCustomerUserKey(user);

    if (!userKey) {
        return;
    }

    const pointMap = getDataFromStorage(USER_POINTS_STORAGE_KEY, {});

    pointMap[userKey] = Number(user.points || 0);

    saveDataToStorage(USER_POINTS_STORAGE_KEY, pointMap);
}


// 8. Chuẩn hóa user từ API sang format frontend cũ
function normalizeCustomerUser(user) {
    if (!user) {
        return null;
    }

    const customerProfile = user.customer_profile || {};
    const roleCode = user.role && user.role.code ? user.role.code : user.role || "customer";

    return {
        id: user.id,
        userId: user.id,

        fullName: user.full_name || user.fullName || user.name || "Khách hàng",
        name: user.full_name || user.fullName || user.name || "Khách hàng",

        username: user.username || user.email || user.phone || "",
        email: user.email || "",
        phone: user.phone || "",

        avatar: user.avatar || "",
        gender: user.gender || "other",
        dateOfBirth: user.date_of_birth || "",

        role: roleCode,
        status: user.status || "active",

        points: Number(customerProfile.points_balance || user.points || 0),
        membershipLevel: customerProfile.membership_level || "normal",

        raw: user
    };
}


// 9. Lưu phiên đăng nhập khách hàng
function saveCustomerLocalAuth(user) {
    const normalizedUser = normalizeCustomerUser(user);

    if (!normalizedUser) {
        return null;
    }

    localStorage.setItem(IS_LOGIN_STORAGE_KEY, "true");
    saveDataToStorage(CURRENT_USER_STORAGE_KEY, normalizedUser);
    syncCustomerPoints(normalizedUser);

    if (window.authUI && typeof window.authUI.renderTopbarAccount === "function") {
        window.authUI.renderTopbarAccount();
    }

    return normalizedUser;
}


// 10. Lấy user hiện tại từ localStorage
function getCurrentCustomerFromLocal() {
    const isLogin = localStorage.getItem(IS_LOGIN_STORAGE_KEY) === "true";

    if (!isLogin) {
        return null;
    }

    const currentUser = getDataFromStorage(CURRENT_USER_STORAGE_KEY, null);

    if (!currentUser) {
        return null;
    }

    return currentUser;
}


// 11. Kiểm tra role customer
function isCustomerRole(user) {
    if (!user) {
        return false;
    }

    const roleCode = user.role && user.role.code ? user.role.code : user.role;

    return roleCode === "customer";
}


// 12. Lấy message lỗi dễ đọc
function getApiErrorMessage(error, fallbackMessage) {
    if (error && error.message) {
        return error.message;
    }

    return fallbackMessage || "Có lỗi xảy ra, vui lòng thử lại.";
}


// 13. Gọi API dùng chung
async function fetchCustomerApi(endpoint, options = {}) {
    const url = getCustomerApiUrl(endpoint);

    const fetchOptions = {
        method: options.method || "GET",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };

    if (options.body !== undefined && options.body !== null) {
        fetchOptions.body = typeof options.body === "string"
            ? options.body
            : JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        throw {
            status: response.status,
            message: "API không trả về JSON hợp lệ.",
            data: null
        };
    }

    if (response.status === 401) {
        clearCustomerLocalAuth();
    }

    if (!response.ok || data.success === false) {
        throw {
            status: response.status,
            message: data.message || "Gọi API thất bại.",
            data: data
        };
    }

    return data;
}


// 14. Gọi API GET
function customerGet(endpoint) {
    return fetchCustomerApi(endpoint, {
        method: "GET"
    });
}


// 15. Gọi API POST
function customerPost(endpoint, body) {
    return fetchCustomerApi(endpoint, {
        method: "POST",
        body: body
    });
}


// 16. Lấy user hiện tại từ session PHP
async function getCurrentCustomerFromSession() {
    const responseData = await customerGet("auth/get-current-user.php");
    const user = responseData.data && responseData.data.user
        ? responseData.data.user
        : null;

    if (!isCustomerRole(user)) {
        clearCustomerLocalAuth();

        throw {
            status: 403,
            message: "Tài khoản này không phải tài khoản khách hàng.",
            data: responseData
        };
    }

    return saveCustomerLocalAuth(user);
}


// 17. Yêu cầu đăng nhập khi vào trang cần tài khoản
async function requireCustomerLogin() {
    const localUser = getCurrentCustomerFromLocal();

    if (!localUser) {
        const redirectUrl = encodeURIComponent(window.location.href);
        window.location.href = "../html/login.html?redirect=" + redirectUrl;
        return null;
    }

    try {
        return await getCurrentCustomerFromSession();
    } catch (error) {
        clearCustomerLocalAuth();

        const redirectUrl = encodeURIComponent(window.location.href);
        window.location.href = "../html/login.html?redirect=" + redirectUrl;

        return null;
    }
}


// 18. Đăng xuất khách hàng
async function logoutCustomer() {
    try {
        await customerPost("auth/logout.php", {});
    } catch (error) {
        // Vẫn xóa localStorage kể cả khi API logout lỗi
    }

    clearCustomerLocalAuth();

    if (window.authUI && typeof window.authUI.renderTopbarAccount === "function") {
        window.authUI.renderTopbarAccount();
    }

    window.location.href = "../html/login.html";
}


// 19. Format tiền
function formatCustomerPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}


// 20. Format ngày
function formatCustomerDate(dateString) {
    if (!dateString) {
        return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("vi-VN");
}


// 21. Gắn object dùng chung ra window
window.CustomerApi = {
    API_BASE_URL: CUSTOMER_API_BASE_URL,

    CURRENT_USER_STORAGE_KEY: CURRENT_USER_STORAGE_KEY,
    IS_LOGIN_STORAGE_KEY: IS_LOGIN_STORAGE_KEY,
    USER_POINTS_STORAGE_KEY: USER_POINTS_STORAGE_KEY,

    get: customerGet,
    post: customerPost,
    fetch: fetchCustomerApi,

    saveCustomerLocalAuth: saveCustomerLocalAuth,
    clearCustomerLocalAuth: clearCustomerLocalAuth,
    getCurrentCustomerFromLocal: getCurrentCustomerFromLocal,
    getCurrentCustomerFromSession: getCurrentCustomerFromSession,
    requireCustomerLogin: requireCustomerLogin,
    logoutCustomer: logoutCustomer,

    isCustomerRole: isCustomerRole,
    getApiErrorMessage: getApiErrorMessage,

    formatPrice: formatCustomerPrice,
    formatDate: formatCustomerDate
};