// 1. Khởi tạo Auth UI

(function () {
    // 2. Key localStorage

    const AUTH_CURRENT_USER_STORAGE_KEY = "current_user";
    const AUTH_IS_LOGIN_STORAGE_KEY = "is_login";

    // 3. Biến DOM

    let topbarAccountLink;
    let topbarAccountText;

    // 4. Lấy phần tử DOM

    function getAuthElements() {
        topbarAccountLink = document.getElementById("topbarAccountLink");
        topbarAccountText = document.getElementById("topbarAccountText");
    }

    // 5. Đọc localStorage

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
                fullName: currentUser
            };
        }

        return currentUser;
    }

    function isUserLoggedIn() {
        return Boolean(getCurrentUser());
    }

    // 7. Lấy key người dùng

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

    // 8. Lấy tên hiển thị

    function getDisplayName(user) {
        if (!user) {
            return "Tài khoản";
        }

        return (
            user.fullName ||
            user.name ||
            user.username ||
            user.email ||
            "Tài khoản"
        );
    }

    // 9. Tạo link đăng nhập có redirect

    function isAuthPage() {
        const currentPath = window.location.pathname;

        return (
            currentPath.includes("login.html") ||
            currentPath.includes("register.html")
        );
    }

    function getCurrentPageRedirectUrl() {
        const currentPath = window.location.pathname;
        const currentFileName = currentPath.split("/").pop() || "home.html";
        const currentSearch = window.location.search || "";

        return "../html/" + currentFileName + currentSearch;
    }

    function getLoginUrlWithRedirect() {
        if (isAuthPage()) {
            return "../html/login.html";
        }

        const redirectUrl = getCurrentPageRedirectUrl();

        return "../html/login.html?redirect=" + encodeURIComponent(redirectUrl);
    }

    // 10. Render topbar tài khoản

    function renderTopbarAccount() {
        getAuthElements();

        if (!topbarAccountLink || !topbarAccountText) {
            return;
        }

        if (!isUserLoggedIn()) {
            topbarAccountLink.href = getLoginUrlWithRedirect();
            topbarAccountText.textContent = "Tài khoản";
            return;
        }

        const currentUser = getCurrentUser();
        const displayName = getDisplayName(currentUser);

        topbarAccountLink.href = "../html/profile.html";
        topbarAccountText.textContent = displayName;
    }

    // 11. Cho file khác dùng lại nếu cần

    window.authUI = {
        getCurrentUser: getCurrentUser,
        isUserLoggedIn: isUserLoggedIn,
        getCurrentUserKey: getCurrentUserKey,
        getDisplayName: getDisplayName,
        renderTopbarAccount: renderTopbarAccount
    };

    // 12. Khởi tạo Auth UI

    document.addEventListener("DOMContentLoaded", renderTopbarAccount);
})();