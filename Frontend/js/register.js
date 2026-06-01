// =========================================================
// File: Frontend/js/register.js
// Mục đích: Đăng ký khách hàng bằng API backend thật
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang đăng ký
    const registerPage = document.querySelector('[data-page="register"]');

    if (!registerPage) {
        return;
    }


    // 2. Lấy DOM
    const registerForm = document.getElementById("registerForm");
    const registerFullName = document.getElementById("registerFullName");
    const registerEmail = document.getElementById("registerEmail");
    
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


    // 3. Kiểm tra dữ liệu rỗng
    function isEmpty(value) {
        return String(value || "").trim() === "";
    }


    // 4. Kiểm tra email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(email);
    }


    

    // 6. Kiểm tra số điện thoại Việt Nam đơn giản
    function isValidPhone(phone) {
        const phoneRegex = /^0\d{9}$/;

        return phoneRegex.test(phone);
    }


    // 7. Ẩn thông báo
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


    // 8. Hiển thị lỗi
    function showError(message) {
        hideFormStates();

        if (registerErrorState) {
            registerErrorState.hidden = false;
            registerErrorState.textContent = message;
        }
    }


    // 9. Hiển thị thành công
    function showSuccess(message) {
        hideFormStates();

        if (registerSuccessState) {
            registerSuccessState.hidden = false;
            registerSuccessState.textContent = message;
        }
    }


    // 10. Loading nút đăng ký
    function setRegisterButtonLoading(isLoading) {
        if (!btnRegister) {
            return;
        }

        btnRegister.disabled = isLoading;
        btnRegister.textContent = isLoading ? "ĐANG ĐĂNG KÝ..." : "ĐĂNG KÝ";
    }


    // 11. Kiểm tra redirect an toàn
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


    // 12. Lấy redirect sau đăng ký
    function getRedirectUrlFromParam() {
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get("redirect");

        if (isSafeRedirectUrl(redirectUrl)) {
            return redirectUrl;
        }

        return "";
    }


    // 13. Lấy link đăng nhập sau đăng ký
    function getLoginUrlAfterRegister() {
        const redirectUrl = getRedirectUrlFromParam();

        if (!redirectUrl) {
            return "../html/login.html";
        }

        return "../html/login.html?redirect=" + encodeURIComponent(redirectUrl);
    }


    // 14. Validate form đăng ký
    function validateRegisterForm() {
        const fullName = registerFullName ? registerFullName.value.trim() : "";
        const email = registerEmail ? registerEmail.value.trim() : "";
        
        const phone = registerPhone ? registerPhone.value.trim() : "";
        const password = registerPassword ? registerPassword.value.trim() : "";
        const confirm = confirmPassword ? confirmPassword.value.trim() : "";

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


    // 15. Lấy dữ liệu gửi API
    function getRegisterData() {
        return {
            full_name: registerFullName.value.trim(),
            fullName: registerFullName.value.trim(),

            email: registerEmail.value.trim(),
            phone: registerPhone.value.trim(),

           

            password: registerPassword.value.trim(),
            confirm_password: confirmPassword ? confirmPassword.value.trim() : ""
        };
    }


    // 16. Xử lý đăng ký
    async function handleRegisterSubmit(event) {
        event.preventDefault();

        hideFormStates();

        if (!validateRegisterForm()) {
            return;
        }

        if (!window.CustomerApi) {
            showError("Thiếu file customer-api.js. Vui lòng kiểm tra lại thứ tự nhúng script.");
            return;
        }

        const registerData = getRegisterData();

        try {
            setRegisterButtonLoading(true);

            await window.CustomerApi.post("auth/register.php", registerData);

            showSuccess("Đăng ký thành công. Đang chuyển về trang đăng nhập...");

            setTimeout(function () {
                window.location.href = getLoginUrlAfterRegister();
            }, 900);
        } catch (error) {
            showError(
                window.CustomerApi.getApiErrorMessage(
                    error,
                    "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin."
                )
            );
        } finally {
            setRegisterButtonLoading(false);
        }
    }


    // 17. Hiện ẩn mật khẩu
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


    // 18. Xử lý click hiện ẩn mật khẩu
    function handleTogglePasswordClick(event) {
        togglePasswordVisibility(event.currentTarget);
    }


    // 19. Xử lý tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword ? searchKeyword.value.trim() : "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 20. Nếu đã đăng nhập thì chuyển về home
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

            window.location.href = "../html/home.html";
        } catch (error) {
            window.CustomerApi.clearCustomerLocalAuth();
        }
    }


    // 21. Gắn sự kiện
    function bindEvents() {
        if (registerForm) {
            registerForm.addEventListener("submit", handleRegisterSubmit);
        }

        if (togglePasswordButtons) {
            togglePasswordButtons.forEach(function (button) {
                button.addEventListener("click", handleTogglePasswordClick);
            });
        }

        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }

        const inputs = [
            registerFullName,
            registerEmail,
            
            registerPhone,
            registerPassword,
            confirmPassword,
            agreeTerms
        ];

        inputs.forEach(function (input) {
            if (!input) {
                return;
            }

            input.addEventListener("input", hideFormStates);
            input.addEventListener("change", hideFormStates);
        });
    }


    // 22. Khởi tạo trang đăng ký
    async function initRegisterPage() {
        bindEvents();
        await redirectIfLoggedIn();
    }

    initRegisterPage();
});