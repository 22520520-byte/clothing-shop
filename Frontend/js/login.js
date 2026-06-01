// =========================================================
// File: Frontend/js/login.js
// Mục đích: Đăng nhập khách hàng bằng API backend thật
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang đăng nhập
    const loginPage = document.querySelector('[data-page="login"]');

    if (!loginPage) {
        return;
    }


    // 2. Lấy DOM
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


    // 3. Key localStorage
    const REMEMBER_LOGIN_STORAGE_KEY = "remember_login";
    const REMEMBER_ACCOUNT_STORAGE_KEY = "remember_account";


    // 4. Kiểm tra dữ liệu rỗng
    function isEmpty(value) {
        return String(value || "").trim() === "";
    }


    // 5. Ẩn thông báo
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


    // 6. Hiển thị lỗi
    function showError(message) {
        hideFormStates();

        if (loginErrorState) {
            loginErrorState.hidden = false;
            loginErrorState.textContent = message;
        }
    }


    // 7. Hiển thị thành công
    function showSuccess(message) {
        hideFormStates();

        if (loginSuccessState) {
            loginSuccessState.hidden = false;
            loginSuccessState.textContent = message;
        }
    }


    // 8. Loading nút đăng nhập
    function setLoginButtonLoading(isLoading) {
        if (!btnLogin) {
            return;
        }

        btnLogin.disabled = isLoading;
        btnLogin.textContent = isLoading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP";
    }


    // 9. Kiểm tra redirect an toàn
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


    // 10. Lấy trang cần chuyển sau đăng nhập
    function getRedirectUrl() {
        const params = new URLSearchParams(window.location.search);
        const redirectFromParam = params.get("redirect");

        if (isSafeRedirectUrl(redirectFromParam)) {
            return redirectFromParam;
        }

        return "../html/home.html";
    }


    // 11. Validate form đăng nhập
    function validateLoginForm() {
        const identifier = loginIdentifier ? loginIdentifier.value.trim() : "";
        const password = loginPassword ? loginPassword.value.trim() : "";

        if (isEmpty(identifier)) {
            showError("Vui lòng nhập email hoặc số điện thoại.");
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


    // 12. Lấy user từ response login
    function getUserFromLoginResponse(responseData) {
        if (!responseData || !responseData.data) {
            return null;
        }

        return responseData.data.user || null;
    }


    // 13. Lưu ghi nhớ đăng nhập
    function saveRememberLogin(identifier) {
        if (!rememberMe) {
            return;
        }

        if (rememberMe.checked) {
            localStorage.setItem(REMEMBER_LOGIN_STORAGE_KEY, "true");
            localStorage.setItem(REMEMBER_ACCOUNT_STORAGE_KEY, identifier);
        } else {
            localStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
            localStorage.removeItem(REMEMBER_ACCOUNT_STORAGE_KEY);
        }
    }


    // 14. Load ghi nhớ đăng nhập
    function loadRememberLogin() {
        const isRemember = localStorage.getItem(REMEMBER_LOGIN_STORAGE_KEY) === "true";
        const account = localStorage.getItem(REMEMBER_ACCOUNT_STORAGE_KEY) || "";

        if (!isRemember || !account) {
            return;
        }

        if (loginIdentifier) {
            loginIdentifier.value = account;
        }

        if (rememberMe) {
            rememberMe.checked = true;
        }
    }


    // 15. Xử lý đăng nhập
    async function handleLoginSubmit(event) {
        event.preventDefault();

        hideFormStates();

        if (!validateLoginForm()) {
            return;
        }

        if (!window.CustomerApi) {
            showError("Thiếu file customer-api.js. Vui lòng kiểm tra lại thứ tự nhúng script.");
            return;
        }

        const identifier = loginIdentifier.value.trim();
        const password = loginPassword.value.trim();

        try {
            setLoginButtonLoading(true);

            const responseData = await window.CustomerApi.post("auth/login.php", {
                account: identifier,
                email: identifier,
                phone: identifier,
                password: password
            });

            const user = getUserFromLoginResponse(responseData);

            if (!window.CustomerApi.isCustomerRole(user)) {
                try {
                    await window.CustomerApi.post("auth/logout.php", {});
                } catch (logoutError) {
                    // Bỏ qua lỗi logout
                }

                window.CustomerApi.clearCustomerLocalAuth();

                showError("Tài khoản này không phải tài khoản khách hàng. Vui lòng dùng trang quản trị nếu là admin/nhân viên.");
                return;
            }

            window.CustomerApi.saveCustomerLocalAuth(user);
            saveRememberLogin(identifier);

            showSuccess("Đăng nhập thành công. Đang chuyển trang...");

            setTimeout(function () {
                window.location.href = getRedirectUrl();
            }, 700);
        } catch (error) {
            showError(
                window.CustomerApi.getApiErrorMessage(
                    error,
                    "Thông tin đăng nhập không chính xác."
                )
            );
        } finally {
            setLoginButtonLoading(false);
        }
    }


    // 16. Hiện ẩn mật khẩu
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


    // 17. Xử lý tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword ? searchKeyword.value.trim() : "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 18. Nếu đã đăng nhập thì chuyển khỏi login
    async function redirectIfLoggedIn() {
        if (!window.CustomerApi) {
            return;
        }

        const localUser = window.CustomerApi.getCurrentCustomerFromLocal();

        if (!localUser) {
            return;
        }

        try {
            await window.CustomerApi.getCurrentCustomerFromSession();

            window.location.href = getRedirectUrl();
        } catch (error) {
            window.CustomerApi.clearCustomerLocalAuth();
        }
    }


    // 19. Gắn sự kiện
    function bindEvents() {
        if (loginForm) {
            loginForm.addEventListener("submit", handleLoginSubmit);
        }

        if (togglePassword) {
            togglePassword.addEventListener("click", togglePasswordVisibility);
        }

        if (loginIdentifier) {
            loginIdentifier.addEventListener("input", hideFormStates);
        }

        if (loginPassword) {
            loginPassword.addEventListener("input", hideFormStates);
        }

        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }
    }


    // 20. Khởi tạo trang đăng nhập
    async function initLoginPage() {
        loadRememberLogin();
        bindEvents();
        await redirectIfLoggedIn();
    }

    initLoginPage();
});