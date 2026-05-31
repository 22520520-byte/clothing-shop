// 1. Khởi tạo trang đăng nhập

document.addEventListener("DOMContentLoaded", function () {
    const loginPage = document.querySelector('[data-page="login"]');

    if (!loginPage) {
        return;
    }

    // 2. Key localStorage

    const USERS_STORAGE_KEY = "users";
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const LOGIN_STATUS_STORAGE_KEY = "is_login";
    const REMEMBER_LOGIN_STORAGE_KEY = "remember_login";
    const USER_POINTS_STORAGE_KEY = "user_points";

    // 3. Dữ liệu tài khoản mẫu

    const defaultUsers = [
        {
            id: "user001",
            fullName: "Nguyễn Văn A",
            username: "vana",
            email: "vana@gmail.com",
            phone: "0911010757",
            password: "123456",
            role: "customer",
            points: 1200
        },
        {
            id: "user002",
            fullName: "Trần Thị B",
            username: "tranb",
            email: "tranb@gmail.com",
            phone: "0917257595",
            password: "123456",
            role: "customer",
            points: 500
        }
    ];

    // 4. Lấy DOM

    const loginForm = document.getElementById("loginForm");
    const loginIdentifier = document.getElementById("loginIdentifier");
    const loginPassword = document.getElementById("loginPassword");
    const rememberMe = document.getElementById("rememberMe");
    const loginErrorState = document.getElementById("loginErrorState");
    const loginSuccessState = document.getElementById("loginSuccessState");
    const togglePassword = document.getElementById("togglePassword");
    const btnLogin = document.getElementById("btnLogin");

    const searchForm = document.getElementById("searchForm");
    const searchKeyword = document.getElementById("searchKeyword");

    // 5. Hàm tiện ích

    function normalizeText(value) {
        return String(value || "").trim().toLowerCase();
    }

    function isEmpty(value) {
        return String(value || "").trim() === "";
    }

    function hideFormStates() {
        if (loginErrorState) {
            loginErrorState.hidden = true;
            loginErrorState.textContent = "";
        }

        if (loginSuccessState) {
            loginSuccessState.hidden = true;
            loginSuccessState.textContent = "";
        }
    }

    function showError(message) {
        hideFormStates();

        if (loginErrorState) {
            loginErrorState.hidden = false;
            loginErrorState.textContent = message;
        }
    }

    function showSuccess(message) {
        hideFormStates();

        if (loginSuccessState) {
            loginSuccessState.hidden = false;
            loginSuccessState.textContent = message;
        }
    }

    function setLoginButtonLoading(isLoading) {
        if (!btnLogin) {
            return;
        }

        btnLogin.disabled = isLoading;
        btnLogin.textContent = isLoading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP";
    }

    // 6. Đọc ghi localStorage

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

    function saveDataToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function getUsersFromStorage() {
        const users = getDataFromStorage(USERS_STORAGE_KEY, []);

        if (!Array.isArray(users) || users.length === 0) {
            saveDataToStorage(USERS_STORAGE_KEY, defaultUsers);
            return defaultUsers;
        }

        return users;
    }

    function getUserPointMap() {
        const pointMap = getDataFromStorage(USER_POINTS_STORAGE_KEY, {});

        if (!pointMap || typeof pointMap !== "object" || Array.isArray(pointMap)) {
            return {};
        }

        return pointMap;
    }

    function saveUserPointMap(pointMap) {
        saveDataToStorage(USER_POINTS_STORAGE_KEY, pointMap);
    }

    // 7. Xử lý điểm theo tài khoản

    function getUserKey(user) {
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

    function getSyncedUserPoints(user) {
        const userKey = getUserKey(user);

        if (!userKey) {
            return Number(user?.points || 0);
        }

        const pointMap = getUserPointMap();

        if (typeof pointMap[userKey] === "number") {
            return pointMap[userKey];
        }

        const defaultPoints = Number(user?.points || 0);
        pointMap[userKey] = defaultPoints;
        saveUserPointMap(pointMap);

        return defaultPoints;
    }

    function updateUsersPoint(user, points) {
        const users = getUsersFromStorage();

        const userIndex = users.findIndex(function (item) {
            return (
                item.id === user.id ||
                item.email === user.email ||
                item.phone === user.phone ||
                item.username === user.username
            );
        });

        if (userIndex >= 0) {
            users[userIndex].points = Number(points || 0);
            saveDataToStorage(USERS_STORAGE_KEY, users);
        }
    }

    // 8. Lấy trang cần chuyển sau đăng nhập

    function isSafeRedirectUrl(url) {
        if (!url) {
            return false;
        }

        const redirectUrl = String(url).trim();

        if (
            redirectUrl.startsWith("http://") ||
            redirectUrl.startsWith("https://") ||
            redirectUrl.startsWith("//")
        ) {
            return false;
        }

        if (
            redirectUrl.includes("login.html") ||
            redirectUrl.includes("register.html")
        ) {
            return false;
        }

        return true;
    }

    function getRedirectUrl() {
        const params = new URLSearchParams(window.location.search);
        const redirectFromParam = params.get("redirect");

        if (isSafeRedirectUrl(redirectFromParam)) {
            return redirectFromParam;
        }

        if (document.referrer) {
            try {
                const referrerUrl = new URL(document.referrer);
                const currentUrl = new URL(window.location.href);

                if (
                    referrerUrl.origin === currentUrl.origin &&
                    !referrerUrl.pathname.includes("login.html") &&
                    !referrerUrl.pathname.includes("register.html")
                ) {
                    return referrerUrl.href;
                }
            } catch (error) {
                console.warn("Không đọc được trang trước đó:", error);
            }
        }

        return "../html/home.html";
    }

    // 9. Lưu phiên đăng nhập

    function saveLoginSession(user) {
        const syncedPoints = getSyncedUserPoints(user);

        const currentUser = {
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role,
            points: syncedPoints
        };

        localStorage.setItem(LOGIN_STATUS_STORAGE_KEY, "true");
        saveDataToStorage(CURRENT_USER_STORAGE_KEY, currentUser);
        updateUsersPoint(user, syncedPoints);

        if (rememberMe && rememberMe.checked) {
            localStorage.setItem(REMEMBER_LOGIN_STORAGE_KEY, "true");
        } else {
            localStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
        }
    }

    // 10. Kiểm tra dữ liệu đăng nhập

    function validateLoginForm() {
        const identifier = loginIdentifier?.value.trim() || "";
        const password = loginPassword?.value.trim() || "";

        if (isEmpty(identifier)) {
            showError("Vui lòng nhập email, số điện thoại hoặc tên đăng nhập.");
            loginIdentifier?.focus();
            return false;
        }

        if (isEmpty(password)) {
            showError("Vui lòng nhập mật khẩu.");
            loginPassword?.focus();
            return false;
        }

        if (password.length < 6) {
            showError("Mật khẩu phải có ít nhất 6 ký tự.");
            loginPassword?.focus();
            return false;
        }

        return true;
    }

    function findUserByLoginInfo(identifier, password) {
        const users = getUsersFromStorage();
        const normalizedIdentifier = normalizeText(identifier);

        return users.find(function (user) {
            const username = normalizeText(user.username);
            const email = normalizeText(user.email);
            const phone = normalizeText(user.phone);

            const isMatchedIdentifier =
                username === normalizedIdentifier ||
                email === normalizedIdentifier ||
                phone === normalizedIdentifier;

            return isMatchedIdentifier && user.password === password;
        });
    }

    // 11. Xử lý đăng nhập

    function handleLoginSubmit(event) {
        event.preventDefault();

        hideFormStates();

        if (!validateLoginForm()) {
            return;
        }

        const identifier = loginIdentifier.value.trim();
        const password = loginPassword.value.trim();

        setLoginButtonLoading(true);

        setTimeout(function () {
            const user = findUserByLoginInfo(identifier, password);

            if (!user) {
                setLoginButtonLoading(false);
                showError("Thông tin đăng nhập không chính xác.");
                return;
            }

            saveLoginSession(user);

            if (window.authUI && typeof window.authUI.renderTopbarAccount === "function") {
                window.authUI.renderTopbarAccount();
            }

            const redirectUrl = getRedirectUrl();

            showSuccess("Đăng nhập thành công. Đang chuyển trang...");

            setTimeout(function () {
                window.location.href = redirectUrl;
            }, 700);
        }, 400);
    }

    // 12. Hiện ẩn mật khẩu

    function togglePasswordVisibility() {
        if (!togglePassword || !loginPassword) {
            return;
        }

        const icon = togglePassword.querySelector("i");

        if (loginPassword.type === "password") {
            loginPassword.type = "text";

            if (icon) {
                icon.className = "fa-regular fa-eye-slash";
            }

            return;
        }

        loginPassword.type = "password";

        if (icon) {
            icon.className = "fa-regular fa-eye";
        }
    }

    // 13. Xử lý tìm kiếm

    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword?.value.trim() || "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }

    // 14. Gắn sự kiện

    function bindEvents() {
        loginForm?.addEventListener("submit", handleLoginSubmit);
        togglePassword?.addEventListener("click", togglePasswordVisibility);
        searchForm?.addEventListener("submit", handleSearchSubmit);
    }

    // 15. Khởi tạo dữ liệu

    function initLoginData() {
        getUsersFromStorage();
    }

    // 16. Khởi tạo trang

    function initLoginPage() {
        initLoginData();
        bindEvents();
    }

    initLoginPage();
});