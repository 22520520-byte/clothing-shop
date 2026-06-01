// =========================================================
// File: Frontend/js/auth-ui.js
// Mục đích: Đồng bộ giao diện tài khoản khách hàng trên topbar
// =========================================================

(function () {
    // 1. Key localStorage
    const AUTH_CURRENT_USER_STORAGE_KEY = "current_user";
    const AUTH_IS_LOGIN_STORAGE_KEY = "is_login";


    // 2. Biến DOM
    let topbarAccountLink;
    let topbarAccountText;
    let logoutButtons;


    // 3. Lấy phần tử DOM
    function getAuthElements() {
        topbarAccountLink = document.getElementById("topbarAccountLink");
        topbarAccountText = document.getElementById("topbarAccountText");

        logoutButtons = document.querySelectorAll(
            "#logoutBtn, #profileLogoutBtn, [data-action='logout'], [data-action='logout-customer']"
        );
    }


    // 4. Đọc localStorage
    function getDataFromStorage(key, fallbackValue) {
        const rawData = localStorage.getItem(key);

        if (!rawData) {
            return fallbackValue;
        }

        try {
            return JSON.parse(rawData);
        } catch (error) {
            console.error("Lỗi đọc localStorage:", error);
            return fallbackValue;
        }
    }


    // 5. Xóa đăng nhập local
    function clearLocalAuth() {
        localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
        localStorage.removeItem(AUTH_IS_LOGIN_STORAGE_KEY);
    }


    // 6. Lấy thông tin người dùng đang đăng nhập
    function getCurrentUser() {
        const isLogin = localStorage.getItem(AUTH_IS_LOGIN_STORAGE_KEY) === "true";

        if (!isLogin) {
            return null;
        }

        const currentUser = getDataFromStorage(AUTH_CURRENT_USER_STORAGE_KEY, null);

        if (!currentUser) {
            return null;
        }

        if (typeof currentUser === "string") {
            return {
                id: currentUser,
                fullName: currentUser,
                name: currentUser
            };
        }

        return currentUser;
    }


    // 7. Kiểm tra đã đăng nhập chưa
    function isUserLoggedIn() {
        return Boolean(getCurrentUser());
    }


    // 8. Lấy key người dùng
    function getCurrentUserKey() {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            return "";
        }

        return (
            currentUser.id ||
            currentUser.userId ||
            currentUser.email ||
            currentUser.phone ||
            currentUser.username ||
            currentUser.fullName ||
            currentUser.name ||
            "member"
        );
    }


    // 9. Lấy tên hiển thị
    function getDisplayName(user) {
        if (!user) {
            return "Tài khoản";
        }

        return (
            user.fullName ||
            user.full_name ||
            user.name ||
            user.username ||
            user.email ||
            "Tài khoản"
        );
    }


    // 10. Kiểm tra trang đăng nhập / đăng ký
    function isAuthPage() {
        const currentPath = window.location.pathname;

        return (
            currentPath.includes("login.html") ||
            currentPath.includes("register.html")
        );
    }


    // 11. Lấy URL hiện tại để redirect sau đăng nhập
    function getCurrentPageRedirectUrl() {
        const currentPath = window.location.pathname;
        const currentFileName = currentPath.split("/").pop() || "home.html";
        const currentSearch = window.location.search || "";

        return "../html/" + currentFileName + currentSearch;
    }


    // 12. Tạo link đăng nhập có redirect
    function getLoginUrlWithRedirect() {
        if (isAuthPage()) {
            return "../html/login.html";
        }

        const redirectUrl = getCurrentPageRedirectUrl();

        return "../html/login.html?redirect=" + encodeURIComponent(redirectUrl);
    }


    // 13. Lấy link tài khoản sau khi đăng nhập
    function getAccountUrl() {
        return "../html/profile.html";
    }


    // 14. Render topbar tài khoản
    function renderTopbarAccount() {
        getAuthElements();

        if (!topbarAccountLink || !topbarAccountText) {
            return;
        }

        const currentUser = getCurrentUser();

        if (!currentUser) {
            topbarAccountLink.href = getLoginUrlWithRedirect();
            topbarAccountText.textContent = "Tài khoản";
            topbarAccountLink.title = "Đăng nhập tài khoản";
            return;
        }

        const displayName = getDisplayName(currentUser);

        topbarAccountLink.href = getAccountUrl();
        topbarAccountText.textContent = displayName;
        topbarAccountLink.title = "Thông tin tài khoản";
    }


    // 15. Đồng bộ session PHP nếu có CustomerApi
    async function syncCustomerSession() {
        if (!window.CustomerApi) {
            renderTopbarAccount();
            return;
        }

        const localUser = getCurrentUser();

        if (!localUser) {
            renderTopbarAccount();
            return;
        }

        try {
            await window.CustomerApi.getCurrentCustomerFromSession();
        } catch (error) {
            clearLocalAuth();
        }

        renderTopbarAccount();
    }


    // 16. Xử lý đăng xuất
    async function logoutCurrentUser() {
        if (window.CustomerApi && typeof window.CustomerApi.logoutCustomer === "function") {
            await window.CustomerApi.logoutCustomer();
            return;
        }

        clearLocalAuth();
        renderTopbarAccount();

        window.location.href = "../html/login.html";
    }


    // 17. Gắn sự kiện đăng xuất
    function bindLogoutEvents() {
        getAuthElements();

        if (!logoutButtons || logoutButtons.length === 0) {
            return;
        }

        logoutButtons.forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();

                const isConfirm = confirm("Bạn có chắc muốn đăng xuất không?");

                if (!isConfirm) {
                    return;
                }

                logoutCurrentUser();
            });
        });
    }


    // 18. Khởi tạo Auth UI
    function initAuthUI() {
        renderTopbarAccount();
        bindLogoutEvents();

        setTimeout(function () {
            syncCustomerSession();
        }, 100);
    }


    // 19. Cho file khác dùng lại
    window.authUI = {
        getCurrentUser: getCurrentUser,
        isUserLoggedIn: isUserLoggedIn,
        getCurrentUserKey: getCurrentUserKey,
        getDisplayName: getDisplayName,

        renderTopbarAccount: renderTopbarAccount,
        syncCustomerSession: syncCustomerSession,
        logoutCurrentUser: logoutCurrentUser,
        clearLocalAuth: clearLocalAuth
    };


    // 20. Chạy khi DOM sẵn sàng
    document.addEventListener("DOMContentLoaded", initAuthUI);
})();