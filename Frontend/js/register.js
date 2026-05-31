// 1. Khởi tạo trang đăng ký

document.addEventListener("DOMContentLoaded", function () {
    const registerPage = document.querySelector('[data-page="register"]');

    if (!registerPage) {
        return;
    }

    // 2. Key localStorage

    const USERS_STORAGE_KEY = "users";
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

    const registerForm = document.getElementById("registerForm");

    const registerFullName = document.getElementById("registerFullName");
    const registerEmail = document.getElementById("registerEmail");
    const registerUsername = document.getElementById("registerUsername");
    const registerPhone = document.getElementById("registerPhone");
    const registerPassword = document.getElementById("registerPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const agreeTerms = document.getElementById("agreeTerms");

    const registerErrorState = document.getElementById("registerErrorState");
    const registerSuccessState = document.getElementById("registerSuccessState");
    const btnRegister = document.getElementById("btnRegister");
    const togglePasswordButtons = document.querySelectorAll(".togglePassword");

    const searchForm = document.getElementById("searchForm");
    const searchKeyword = document.getElementById("searchKeyword");

    // 5. Hàm tiện ích

    function normalizeText(value) {
        return String(value || "").trim().toLowerCase();
    }

    function isEmpty(value) {
        return String(value || "").trim() === "";
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(email);
    }

    function isValidUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;

        return usernameRegex.test(username);
    }

    function isValidPhone(phone) {
        const phoneRegex = /^0\d{9}$/;

        return phoneRegex.test(phone);
    }

    function generateUserId() {
        return "user" + Date.now();
    }

    function hideFormStates() {
        if (registerErrorState) {
            registerErrorState.hidden = true;
            registerErrorState.textContent = "";
        }

        if (registerSuccessState) {
            registerSuccessState.hidden = true;
            registerSuccessState.textContent = "";
        }
    }

    function showError(message) {
        hideFormStates();

        if (registerErrorState) {
            registerErrorState.hidden = false;
            registerErrorState.textContent = message;
        }
    }

    function showSuccess(message) {
        hideFormStates();

        if (registerSuccessState) {
            registerSuccessState.hidden = false;
            registerSuccessState.textContent = message;
        }
    }

    function setRegisterButtonLoading(isLoading) {
        if (!btnRegister) {
            return;
        }

        btnRegister.disabled = isLoading;
        btnRegister.textContent = isLoading ? "ĐANG ĐĂNG KÝ..." : "ĐĂNG KÝ";
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
            initDefaultUserPoints(defaultUsers);
            return defaultUsers;
        }

        return users;
    }

    function saveUsersToStorage(users) {
        saveDataToStorage(USERS_STORAGE_KEY, users);
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

    // 7. Đồng bộ điểm

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

    function initDefaultUserPoints(users) {
        const pointMap = getUserPointMap();

        users.forEach(function (user) {
            const userKey = getUserKey(user);

            if (!userKey) {
                return;
            }

            if (typeof pointMap[userKey] !== "number") {
                pointMap[userKey] = Number(user.points || 0);
            }
        });

        saveUserPointMap(pointMap);
    }

    function initNewUserPoints(user) {
        const userKey = getUserKey(user);

        if (!userKey) {
            return;
        }

        const pointMap = getUserPointMap();
        pointMap[userKey] = Number(user.points || 0);

        saveUserPointMap(pointMap);
    }

    // 8. Redirect sau đăng ký

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

    function getRedirectUrlFromParam() {
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get("redirect");

        if (isSafeRedirectUrl(redirectUrl)) {
            return redirectUrl;
        }

        return "";
    }

    function getLoginUrlAfterRegister() {
        const redirectUrl = getRedirectUrlFromParam();

        if (!redirectUrl) {
            return "../html/login.html";
        }

        return "../html/login.html?redirect=" + encodeURIComponent(redirectUrl);
    }

    // 9. Kiểm tra tài khoản tồn tại

    function isEmailExists(email) {
        const users = getUsersFromStorage();
        const normalizedEmail = normalizeText(email);

        return users.some(function (user) {
            return normalizeText(user.email) === normalizedEmail;
        });
    }

    function isUsernameExists(username) {
        const users = getUsersFromStorage();
        const normalizedUsername = normalizeText(username);

        return users.some(function (user) {
            return normalizeText(user.username) === normalizedUsername;
        });
    }

    function isPhoneExists(phone) {
        const users = getUsersFromStorage();
        const normalizedPhone = normalizeText(phone);

        return users.some(function (user) {
            return normalizeText(user.phone) === normalizedPhone;
        });
    }

    // 10. Kiểm tra dữ liệu đăng ký

    function validateRegisterForm() {
        const fullName = registerFullName?.value.trim() || "";
        const email = registerEmail?.value.trim() || "";
        const username = registerUsername?.value.trim() || "";
        const phone = registerPhone?.value.trim() || "";
        const password = registerPassword?.value.trim() || "";
        const confirm = confirmPassword?.value.trim() || "";

        if (isEmpty(fullName)) {
            showError("Vui lòng nhập họ và tên.");
            registerFullName?.focus();
            return false;
        }

        if (fullName.length < 2) {
            showError("Họ và tên phải có ít nhất 2 ký tự.");
            registerFullName?.focus();
            return false;
        }

        if (isEmpty(email)) {
            showError("Vui lòng nhập email.");
            registerEmail?.focus();
            return false;
        }

        if (!isValidEmail(email)) {
            showError("Email không hợp lệ.");
            registerEmail?.focus();
            return false;
        }

        if (isEmailExists(email)) {
            showError("Email này đã được sử dụng.");
            registerEmail?.focus();
            return false;
        }

        if (isEmpty(username)) {
            showError("Vui lòng nhập tên đăng nhập.");
            registerUsername?.focus();
            return false;
        }

        if (!isValidUsername(username)) {
            showError("Tên đăng nhập phải từ 4-20 ký tự, chỉ gồm chữ, số hoặc dấu gạch dưới.");
            registerUsername?.focus();
            return false;
        }

        if (isUsernameExists(username)) {
            showError("Tên đăng nhập này đã tồn tại.");
            registerUsername?.focus();
            return false;
        }

        if (isEmpty(phone)) {
            showError("Vui lòng nhập số điện thoại.");
            registerPhone?.focus();
            return false;
        }

        if (!isValidPhone(phone)) {
            showError("Số điện thoại không hợp lệ. Ví dụ: 0911010757.");
            registerPhone?.focus();
            return false;
        }

        if (isPhoneExists(phone)) {
            showError("Số điện thoại này đã được sử dụng.");
            registerPhone?.focus();
            return false;
        }

        if (isEmpty(password)) {
            showError("Vui lòng nhập mật khẩu.");
            registerPassword?.focus();
            return false;
        }

        if (password.length < 6) {
            showError("Mật khẩu phải có ít nhất 6 ký tự.");
            registerPassword?.focus();
            return false;
        }

        if (isEmpty(confirm)) {
            showError("Vui lòng xác nhận mật khẩu.");
            confirmPassword?.focus();
            return false;
        }

        if (password !== confirm) {
            showError("Mật khẩu xác nhận không khớp.");
            confirmPassword?.focus();
            return false;
        }

        if (agreeTerms && !agreeTerms.checked) {
            showError("Vui lòng đồng ý với điều khoản sử dụng.");
            agreeTerms.focus();
            return false;
        }

        return true;
    }

    // 11. Tạo tài khoản mới

    function createNewUser() {
        return {
            id: generateUserId(),
            fullName: registerFullName.value.trim(),
            username: registerUsername.value.trim(),
            email: registerEmail.value.trim(),
            phone: registerPhone.value.trim(),
            password: registerPassword.value.trim(),
            role: "customer",
            points: 0,
            createdAt: new Date().toISOString()
        };
    }

    function saveNewUser(user) {
        const users = getUsersFromStorage();

        users.push(user);
        saveUsersToStorage(users);
        initNewUserPoints(user);
    }

    // 12. Xử lý đăng ký

    function handleRegisterSubmit(event) {
        event.preventDefault();

        hideFormStates();

        if (!validateRegisterForm()) {
            return;
        }

        setRegisterButtonLoading(true);

        setTimeout(function () {
            const newUser = createNewUser();

            saveNewUser(newUser);

            showSuccess("Đăng ký thành công. Đang chuyển về trang đăng nhập...");

            setTimeout(function () {
                window.location.href = getLoginUrlAfterRegister();
            }, 1000);
        }, 400);
    }

    // 13. Hiện ẩn mật khẩu

    function togglePasswordVisibility(button) {
        const targetId = button.getAttribute("data-target");
        const input = document.getElementById(targetId);
        const icon = button.querySelector("i");

        if (!input) {
            return;
        }

        if (input.type === "password") {
            input.type = "text";

            if (icon) {
                icon.className = "fa-regular fa-eye-slash";
            }

            return;
        }

        input.type = "password";

        if (icon) {
            icon.className = "fa-regular fa-eye";
        }
    }

    function handleTogglePasswordClick(event) {
        togglePasswordVisibility(event.currentTarget);
    }

    // 14. Xử lý tìm kiếm

    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword?.value.trim() || "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }

    // 15. Gắn sự kiện

    function bindEvents() {
        registerForm?.addEventListener("submit", handleRegisterSubmit);

        togglePasswordButtons?.forEach(function (button) {
            button.addEventListener("click", handleTogglePasswordClick);
        });

        searchForm?.addEventListener("submit", handleSearchSubmit);
    }

    // 16. Khởi tạo dữ liệu

    function initRegisterData() {
        const users = getUsersFromStorage();
        initDefaultUserPoints(users);
    }

    // 17. Khởi tạo trang

    function initRegisterPage() {
        initRegisterData();
        bindEvents();
    }

    initRegisterPage();
});