// =========================================================
// File: Frontend/js/profile.js
// Mục đích: Trang thông tin tài khoản khách hàng dùng API thật
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang profile
    const profilePage = document.querySelector('[data-page="profile"]');

    if (!profilePage) {
        return;
    }


    // 2. Key localStorage
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const IS_LOGIN_STORAGE_KEY = "is_login";
    const USER_POINTS_STORAGE_KEY = "user_points";


    // 3. Dữ liệu địa chỉ
    const addressData = [
        {
            name: "TP Hồ Chí Minh",
            districts: [
                {
                    name: "Thành phố Thủ Đức",
                    wards: [
                        "Hiệp Bình",
                        "Thủ Đức",
                        "Tam Bình",
                        "Linh Xuân",
                        "Tăng Nhơn Phú",
                        "Long Bình",
                        "Long Phước",
                        "Long Trường",
                        "Cát Lái",
                        "Bình Trưng",
                        "Phước Long",
                        "An Khánh"
                    ]
                },
                {
                    name: "Quận 1",
                    wards: ["Bến Nghé", "Bến Thành", "Cầu Kho", "Cầu Ông Lãnh"]
                },
                {
                    name: "Bình Thạnh",
                    wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 5"]
                }
            ]
        },
        {
            name: "Hà Nội",
            districts: [
                {
                    name: "Ba Đình",
                    wards: ["Phúc Xá", "Trúc Bạch", "Vĩnh Phúc"]
                },
                {
                    name: "Cầu Giấy",
                    wards: ["Dịch Vọng", "Dịch Vọng Hậu", "Mai Dịch"]
                }
            ]
        },
        {
            name: "Đà Nẵng",
            districts: [
                {
                    name: "Hải Châu",
                    wards: ["Hải Châu I", "Hải Châu II", "Thạch Thang"]
                },
                {
                    name: "Sơn Trà",
                    wards: ["An Hải Bắc", "An Hải Đông", "Mân Thái"]
                }
            ]
        }
    ];


    // 4. Biến trạng thái
    let currentUser = null;
    let currentDefaultAddress = null;
    let currentUserPoints = 0;


    // 5. Lấy DOM sidebar
    const profileUserName = document.getElementById("profileUserName");
    const profileUserEmail = document.getElementById("profileUserEmail");
    const profileUserRank = document.getElementById("profileUserRank");
    const profileUserAvatar = document.getElementById("profileUserAvatar");
    const logoutBtn = document.getElementById("logoutBtn");


    // 6. Lấy DOM form thông tin
    const profileInfoForm = document.getElementById("profileInfoForm");
    const profileInfoErrorState = document.getElementById("profileInfoErrorState");
    const profileInfoSuccessState = document.getElementById("profileInfoSuccessState");

    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const birthDate = document.getElementById("birthDate");
    const city = document.getElementById("city");
    const district = document.getElementById("district");
    const ward = document.getElementById("ward");
    const addressDetail = document.getElementById("addressDetail");
    const genderInputs = document.querySelectorAll('input[name="gender"]');
    const updateProfileBtn = document.getElementById("updateProfileBtn");


    // 7. Lấy DOM đổi mật khẩu
    const changePasswordForm = document.getElementById("changePasswordForm");
    const passwordErrorState = document.getElementById("passwordErrorState");
    const passwordSuccessState = document.getElementById("passwordSuccessState");

    const currentPassword = document.getElementById("currentPassword");
    const newPassword = document.getElementById("newPassword");
    const confirmNewPassword = document.getElementById("confirmNewPassword");
    const changePasswordBtn = document.getElementById("changePasswordBtn");


    // 8. Lấy DOM tìm kiếm
    const searchForm = document.getElementById("searchForm");
    const searchKeyword = document.getElementById("searchKeyword");


    // 9. Gọi API GET
    async function getApi(endpoint) {
        if (window.CustomerApi && typeof window.CustomerApi.get === "function") {
            return await window.CustomerApi.get(endpoint);
        }

        const response = await fetch("../../BackEnd/php/api/" + endpoint, {
            method: "GET",
            credentials: "same-origin"
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            throw data;
        }

        return data;
    }


    // 10. Gọi API POST
    async function postApi(endpoint, body) {
        if (window.CustomerApi && typeof window.CustomerApi.post === "function") {
            return await window.CustomerApi.post(endpoint, body);
        }

        const response = await fetch("../../BackEnd/php/api/" + endpoint, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body || {})
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            throw data;
        }

        return data;
    }


    // 11. Hàm tiện ích
    function isEmpty(value) {
        return String(value || "").trim() === "";
    }

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
    }

    function isValidPhone(value) {
        return /^0\d{9}$/.test(String(value || "").trim());
    }

    function getApiErrorMessage(error, fallbackMessage) {
        if (window.CustomerApi && typeof window.CustomerApi.getApiErrorMessage === "function") {
            return window.CustomerApi.getApiErrorMessage(error, fallbackMessage);
        }

        return error && error.message ? error.message : fallbackMessage;
    }

    function getFirstLetter(text) {
        if (!text) {
            return "K";
        }

        return String(text).trim().charAt(0).toUpperCase();
    }

    function getDisplayName(user) {
        if (!user) {
            return "Khách hàng";
        }

        return (
            user.fullName ||
            user.full_name ||
            user.name ||
            user.username ||
            user.email ||
            "Khách hàng"
        );
    }

    function getRankNameByPoints(points) {
        const currentPoints = Number(points || 0);

        if (currentPoints >= 3000) {
            return "Thành viên kim cương";
        }

        if (currentPoints >= 1500) {
            return "Thành viên vàng";
        }

        if (currentPoints >= 500) {
            return "Thành viên bạc";
        }

        return "Thành viên";
    }

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


    // 12. Đọc ghi localStorage
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

    function saveDataToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function getCurrentUserFromLocal() {
        if (window.CustomerApi && typeof window.CustomerApi.getCurrentCustomerFromLocal === "function") {
            return window.CustomerApi.getCurrentCustomerFromLocal();
        }

        const isLogin = localStorage.getItem(IS_LOGIN_STORAGE_KEY) === "true";

        if (!isLogin) {
            return null;
        }

        return getDataFromStorage(CURRENT_USER_STORAGE_KEY, null);
    }

    function saveCurrentUserToLocal(user) {
        if (window.CustomerApi && typeof window.CustomerApi.saveCustomerLocalAuth === "function") {
            window.CustomerApi.saveCustomerLocalAuth(user);
            return;
        }

        localStorage.setItem(IS_LOGIN_STORAGE_KEY, "true");
        saveDataToStorage(CURRENT_USER_STORAGE_KEY, normalizeUserForLocal(user));
    }


    // 13. Đồng bộ điểm
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

    function syncUserPoints(user) {
        const userKey = getUserKey(user);

        if (!userKey) {
            return;
        }

        const pointMap = getUserPointMap();

        pointMap[userKey] = Number(user.points || 0);
        saveUserPointMap(pointMap);
    }


    // 14. Chuẩn hóa user từ API
    function normalizeUserFromApi(user) {
        if (!user) {
            return null;
        }

        const customerProfile = user.customer_profile || {};
        const defaultAddress = user.default_address || null;
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

            role: roleCode,
            status: user.status || "active",

            gender: user.gender || "other",
            birthDate: user.date_of_birth || user.birthDate || "",
            dateOfBirth: user.date_of_birth || user.birthDate || "",

            points: Number(customerProfile.points_balance || user.points || 0),
            membershipLevel: customerProfile.membership_level || "normal",

            city: defaultAddress ? defaultAddress.province : "",
            district: defaultAddress ? defaultAddress.district : "",
            ward: defaultAddress ? defaultAddress.ward : "",
            addressDetail: defaultAddress ? defaultAddress.address_detail : "",
            address: {
                city: defaultAddress ? defaultAddress.province : "",
                district: defaultAddress ? defaultAddress.district : "",
                ward: defaultAddress ? defaultAddress.ward : "",
                addressDetail: defaultAddress ? defaultAddress.address_detail : ""
            },

            raw: user
        };
    }

    function normalizeUserForLocal(user) {
        if (!user) {
            return null;
        }

        return {
            id: user.id,
            userId: user.userId || user.id,

            fullName: user.fullName || user.full_name || user.name || "Khách hàng",
            name: user.fullName || user.full_name || user.name || "Khách hàng",

            username: user.username || user.email || "",
            email: user.email || "",
            phone: user.phone || "",

            avatar: user.avatar || "",
            role: user.role || "customer",
            status: user.status || "active",

            gender: user.gender || "other",
            birthDate: user.birthDate || user.dateOfBirth || user.date_of_birth || "",
            dateOfBirth: user.birthDate || user.dateOfBirth || user.date_of_birth || "",

            points: Number(user.points || 0),
            membershipLevel: user.membershipLevel || "normal",

            city: user.city || "",
            district: user.district || "",
            ward: user.ward || "",
            addressDetail: user.addressDetail || "",
            address: {
                city: user.city || "",
                district: user.district || "",
                ward: user.ward || "",
                addressDetail: user.addressDetail || ""
            }
        };
    }


    // 15. Thông báo form thông tin
    function hideProfileInfoStates() {
        if (profileInfoErrorState) {
            profileInfoErrorState.hidden = true;
            profileInfoErrorState.textContent = "";
        }

        if (profileInfoSuccessState) {
            profileInfoSuccessState.hidden = true;
            profileInfoSuccessState.textContent = "";
        }
    }

    function showProfileInfoError(message) {
        hideProfileInfoStates();

        if (profileInfoErrorState) {
            profileInfoErrorState.hidden = false;
            profileInfoErrorState.textContent = message;
        }
    }

    function showProfileInfoSuccess(message) {
        hideProfileInfoStates();

        if (profileInfoSuccessState) {
            profileInfoSuccessState.hidden = false;
            profileInfoSuccessState.textContent = message;
        }
    }


    // 16. Thông báo form mật khẩu
    function hidePasswordStates() {
        if (passwordErrorState) {
            passwordErrorState.hidden = true;
            passwordErrorState.textContent = "";
        }

        if (passwordSuccessState) {
            passwordSuccessState.hidden = true;
            passwordSuccessState.textContent = "";
        }
    }

    function showPasswordError(message) {
        hidePasswordStates();

        if (passwordErrorState) {
            passwordErrorState.hidden = false;
            passwordErrorState.textContent = message;
        }
    }

    function showPasswordSuccess(message) {
        hidePasswordStates();

        if (passwordSuccessState) {
            passwordSuccessState.hidden = false;
            passwordSuccessState.textContent = message;
        }
    }


    // 17. Render địa chỉ
    function createOption(value, text) {
        const option = document.createElement("option");

        option.value = value;
        option.textContent = text;

        return option;
    }

    function resetSelect(selectElement, placeholder) {
        if (!selectElement) {
            return;
        }

        selectElement.innerHTML = "";
        selectElement.appendChild(createOption("", placeholder));
        selectElement.value = "";
    }

    function getCityData(cityName) {
        return addressData.find(function (item) {
            return item.name === cityName;
        });
    }

    function getDistrictData(cityName, districtName) {
        const cityData = getCityData(cityName);

        if (!cityData) {
            return null;
        }

        return cityData.districts.find(function (item) {
            return item.name === districtName;
        });
    }

    function renderCityOptions(selectedCity) {
        resetSelect(city, "Chọn Tỉnh/Thành phố");

        if (!city) {
            return;
        }

        addressData.forEach(function (item) {
            city.appendChild(createOption(item.name, item.name));
        });

        if (selectedCity) {
            city.value = selectedCity;
        }
    }

    function renderDistrictOptions(cityName, selectedDistrict) {
        resetSelect(district, "Chọn Quận/Huyện");
        resetSelect(ward, "Chọn Phường/Xã");

        if (!district || !ward) {
            return;
        }

        district.disabled = true;
        ward.disabled = true;

        const cityData = getCityData(cityName);

        if (!cityData) {
            return;
        }

        cityData.districts.forEach(function (item) {
            district.appendChild(createOption(item.name, item.name));
        });

        district.disabled = false;

        if (selectedDistrict) {
            district.value = selectedDistrict;
        }
    }

    function renderWardOptions(cityName, districtName, selectedWard) {
        resetSelect(ward, "Chọn Phường/Xã");

        if (!ward) {
            return;
        }

        ward.disabled = true;

        const districtData = getDistrictData(cityName, districtName);

        if (!districtData) {
            return;
        }

        districtData.wards.forEach(function (item) {
            ward.appendChild(createOption(item, item));
        });

        ward.disabled = false;

        if (selectedWard) {
            ward.value = selectedWard;
        }
    }

    function handleCityChange() {
        renderDistrictOptions(city ? city.value : "", "");
    }

    function handleDistrictChange() {
        renderWardOptions(
            city ? city.value : "",
            district ? district.value : "",
            ""
        );
    }


    // 18. Render thông tin tài khoản
    function renderProfileUserBox(user) {
        const displayName = getDisplayName(user);

        if (profileUserName) {
            profileUserName.textContent = displayName;
        }

        if (profileUserEmail) {
            profileUserEmail.textContent = user.email || user.phone || "";
        }

        if (profileUserRank) {
            profileUserRank.textContent = getRankNameByPoints(currentUserPoints);
        }

        if (profileUserAvatar) {
            profileUserAvatar.textContent = getFirstLetter(displayName);
        }
    }

    function renderGender(user) {
        genderInputs.forEach(function (input) {
            input.checked = input.value === (user.gender || "other");
        });
    }

    function renderProfileForm(user) {
        const userCity = user.city || user.address?.city || "";
        const userDistrict = user.district || user.address?.district || "";
        const userWard = user.ward || user.address?.ward || "";
        const userAddressDetail = user.addressDetail || user.address?.addressDetail || "";

        if (fullName) {
            fullName.value = user.fullName || user.full_name || user.name || "";
        }

        if (email) {
            email.value = user.email || "";
        }

        if (phone) {
            phone.value = user.phone || "";
        }

        if (birthDate) {
            birthDate.value = user.birthDate || user.dateOfBirth || user.date_of_birth || "";
        }

        if (addressDetail) {
            addressDetail.value = userAddressDetail;
        }

        renderCityOptions(userCity);

        if (userCity) {
            renderDistrictOptions(userCity, userDistrict);
        } else {
            resetSelect(district, "Chọn Quận/Huyện");

            if (district) {
                district.disabled = true;
            }
        }

        if (userCity && userDistrict) {
            renderWardOptions(userCity, userDistrict, userWard);
        } else {
            resetSelect(ward, "Chọn Phường/Xã");

            if (ward) {
                ward.disabled = true;
            }
        }

        renderGender(user);
    }

    function renderProfilePage() {
        if (!currentUser) {
            return;
        }

        currentUserPoints = Number(currentUser.points || 0);

        renderProfileUserBox(currentUser);
        renderProfileForm(currentUser);
    }


    // 19. Load profile từ API
    async function loadProfileFromApi() {
        const response = await getApi("users/get-profile.php");
        const apiUser = response.data && response.data.user
            ? response.data.user
            : null;

        if (!apiUser) {
            throw {
                message: "Không lấy được thông tin tài khoản."
            };
        }

        currentDefaultAddress = apiUser.default_address || null;
        currentUser = normalizeUserFromApi(apiUser);

        saveCurrentUserToLocal(currentUser);
        syncUserPoints(currentUser);
    }

    async function loadDefaultAddressFromApi() {
        try {
            const response = await getApi("users/get-addresses.php");
            const data = response.data || {};

            currentDefaultAddress = data.default_address || currentDefaultAddress;

            if (!currentDefaultAddress || !currentUser) {
                return;
            }

            currentUser.city = currentDefaultAddress.province || "";
            currentUser.district = currentDefaultAddress.district || "";
            currentUser.ward = currentDefaultAddress.ward || "";
            currentUser.addressDetail = currentDefaultAddress.address_detail || "";
            currentUser.address = {
                city: currentDefaultAddress.province || "",
                district: currentDefaultAddress.district || "",
                ward: currentDefaultAddress.ward || "",
                addressDetail: currentDefaultAddress.address_detail || ""
            };

            saveCurrentUserToLocal(currentUser);
        } catch (error) {
            console.warn("Không lấy được địa chỉ mặc định:", error);
        }
    }

    async function loadProfileData() {
        try {
            await loadProfileFromApi();
            await loadDefaultAddressFromApi();
            renderProfilePage();
        } catch (error) {
            const localUser = getCurrentUserFromLocal();

            if (!localUser) {
                const redirectUrl = encodeURIComponent(window.location.href);
                window.location.href = "../html/login.html?redirect=" + redirectUrl;
                return;
            }

            currentUser = normalizeUserForLocal(localUser);
            currentUserPoints = Number(currentUser.points || 0);

            renderProfilePage();
            showProfileInfoError("Không tải được hồ sơ từ API, đang hiển thị dữ liệu tạm trên máy.");
        }
    }


    // 20. Kiểm tra đăng nhập
    async function requireLogin() {
        if (!window.CustomerApi) {
            currentUser = getCurrentUserFromLocal();

            if (!currentUser) {
                window.location.href = "../html/login.html";
                return false;
            }

            return true;
        }

        const localUser = window.CustomerApi.getCurrentCustomerFromLocal();

        if (!localUser) {
            const redirectUrl = encodeURIComponent(window.location.href);
            window.location.href = "../html/login.html?redirect=" + redirectUrl;
            return false;
        }

        try {
            await window.CustomerApi.getCurrentCustomerFromSession();
            return true;
        } catch (error) {
            window.CustomerApi.clearCustomerLocalAuth();

            const redirectUrl = encodeURIComponent(window.location.href);
            window.location.href = "../html/login.html?redirect=" + redirectUrl;

            return false;
        }
    }


    // 21. Validate thông tin
    function validateProfileInfoForm() {
        const inputFullName = fullName ? fullName.value.trim() : "";
        const inputEmail = email ? email.value.trim() : "";
        const inputPhone = phone ? phone.value.trim() : "";

        if (isEmpty(inputFullName)) {
            showProfileInfoError("Vui lòng nhập họ và tên.");
            fullName?.focus();
            return false;
        }

        if (inputFullName.length < 2) {
            showProfileInfoError("Họ và tên phải có ít nhất 2 ký tự.");
            fullName?.focus();
            return false;
        }

        if (isEmpty(inputEmail)) {
            showProfileInfoError("Vui lòng nhập email.");
            email?.focus();
            return false;
        }

        if (!isValidEmail(inputEmail)) {
            showProfileInfoError("Email không hợp lệ.");
            email?.focus();
            return false;
        }

        if (isEmpty(inputPhone)) {
            showProfileInfoError("Vui lòng nhập số điện thoại.");
            phone?.focus();
            return false;
        }

        if (!isValidPhone(inputPhone)) {
            showProfileInfoError("Số điện thoại không hợp lệ. Ví dụ: 0911010757.");
            phone?.focus();
            return false;
        }

        return true;
    }


    // 22. Lấy dữ liệu cập nhật
    function getSelectedGender() {
        const selectedGender = document.querySelector('input[name="gender"]:checked');

        if (!selectedGender) {
            return "other";
        }

        return selectedGender.value;
    }

    function getProfileUpdateData() {
        return {
            full_name: fullName ? fullName.value.trim() : "",
            fullName: fullName ? fullName.value.trim() : "",

            email: email ? email.value.trim() : "",
            phone: phone ? phone.value.trim() : "",

            gender: getSelectedGender(),

            date_of_birth: birthDate ? birthDate.value : "",
            birthDate: birthDate ? birthDate.value : ""
        };
    }

    function hasAddressInput() {
        return Boolean(
            (city && city.value) ||
            (district && district.value) ||
            (ward && ward.value) ||
            (addressDetail && addressDetail.value.trim())
        );
    }

    function validateAddressIfFilled() {
        if (!hasAddressInput()) {
            return true;
        }

        if (!city || !city.value) {
            showProfileInfoError("Vui lòng chọn Tỉnh/Thành phố.");
            city?.focus();
            return false;
        }

        if (!district || !district.value) {
            showProfileInfoError("Vui lòng chọn Quận/Huyện.");
            district?.focus();
            return false;
        }

        if (!ward || !ward.value) {
            showProfileInfoError("Vui lòng chọn Phường/Xã.");
            ward?.focus();
            return false;
        }

        if (!addressDetail || !addressDetail.value.trim()) {
            showProfileInfoError("Vui lòng nhập địa chỉ chi tiết.");
            addressDetail?.focus();
            return false;
        }

        return true;
    }

    function getAddressPayload() {
        return {
            receiver_name: fullName ? fullName.value.trim() : "",
            receiverName: fullName ? fullName.value.trim() : "",

            receiver_phone: phone ? phone.value.trim() : "",
            receiverPhone: phone ? phone.value.trim() : "",

            province: city ? city.value : "",
            district: district ? district.value : "",
            ward: ward ? ward.value : "",
            address_detail: addressDetail ? addressDetail.value.trim() : "",
            addressDetail: addressDetail ? addressDetail.value.trim() : "",

            is_default: 1,
            isDefault: 1
        };
    }


    // 23. Cập nhật địa chỉ mặc định
    async function saveDefaultAddress() {
        if (!hasAddressInput()) {
            return null;
        }

        if (!validateAddressIfFilled()) {
            return null;
        }

        const addressPayload = getAddressPayload();

        if (currentDefaultAddress && currentDefaultAddress.id) {
            addressPayload.address_id = Number(currentDefaultAddress.id);
            addressPayload.addressId = Number(currentDefaultAddress.id);

            const response = await postApi("users/update-address.php", addressPayload);

            return response.data && response.data.address
                ? response.data.address
                : null;
        }

        const response = await postApi("users/add-address.php", addressPayload);

        return response.data && response.data.address
            ? response.data.address
            : null;
    }


    // 24. Gộp user sau cập nhật
    function mergeUpdatedUser(apiUser, address) {
        const normalizedUser = normalizeUserFromApi({
            ...apiUser,
            default_address: address || currentDefaultAddress
        });

        currentUser = {
            ...currentUser,
            ...normalizedUser
        };

        if (address) {
            currentDefaultAddress = address;

            currentUser.city = address.province || "";
            currentUser.district = address.district || "";
            currentUser.ward = address.ward || "";
            currentUser.addressDetail = address.address_detail || "";
            currentUser.address = {
                city: address.province || "",
                district: address.district || "",
                ward: address.ward || "",
                addressDetail: address.address_detail || ""
            };
        }

        saveCurrentUserToLocal(currentUser);
        syncUserPoints(currentUser);

        if (window.authUI && typeof window.authUI.renderTopbarAccount === "function") {
            window.authUI.renderTopbarAccount();
        }
    }


    // 25. Submit cập nhật profile
    async function handleProfileInfoSubmit(event) {
        event.preventDefault();
        hideProfileInfoStates();

        if (!validateProfileInfoForm()) {
            return;
        }

        if (!validateAddressIfFilled()) {
            return;
        }

        try {
            if (updateProfileBtn) {
                updateProfileBtn.disabled = true;
                updateProfileBtn.textContent = "ĐANG CẬP NHẬT...";
            }

            const profileResponse = await postApi("users/update-profile.php", getProfileUpdateData());

            const updatedApiUser = profileResponse.data && profileResponse.data.user
                ? profileResponse.data.user
                : null;

            if (!updatedApiUser) {
                throw {
                    message: "API cập nhật thành công nhưng không trả về thông tin user."
                };
            }

            const savedAddress = await saveDefaultAddress();

            mergeUpdatedUser(updatedApiUser, savedAddress);

            renderProfilePage();

            showProfileInfoSuccess("Cập nhật thông tin thành công.");
        } catch (error) {
            showProfileInfoError(
                getApiErrorMessage(error, "Cập nhật thông tin thất bại.")
            );
        } finally {
            if (updateProfileBtn) {
                updateProfileBtn.disabled = false;
                updateProfileBtn.textContent = "CẬP NHẬT THÔNG TIN";
            }
        }
    }


    // 26. Validate đổi mật khẩu
    function validatePasswordForm() {
        const inputCurrentPassword = currentPassword ? currentPassword.value.trim() : "";
        const inputNewPassword = newPassword ? newPassword.value.trim() : "";
        const inputConfirmPassword = confirmNewPassword ? confirmNewPassword.value.trim() : "";

        if (isEmpty(inputCurrentPassword)) {
            showPasswordError("Vui lòng nhập mật khẩu hiện tại.");
            currentPassword?.focus();
            return false;
        }

        if (isEmpty(inputNewPassword)) {
            showPasswordError("Vui lòng nhập mật khẩu mới.");
            newPassword?.focus();
            return false;
        }

        if (inputNewPassword.length < 6) {
            showPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
            newPassword?.focus();
            return false;
        }

        if (inputNewPassword === inputCurrentPassword) {
            showPasswordError("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
            newPassword?.focus();
            return false;
        }

        if (isEmpty(inputConfirmPassword)) {
            showPasswordError("Vui lòng xác nhận mật khẩu mới.");
            confirmNewPassword?.focus();
            return false;
        }

        if (inputNewPassword !== inputConfirmPassword) {
            showPasswordError("Mật khẩu xác nhận không khớp.");
            confirmNewPassword?.focus();
            return false;
        }

        return true;
    }

    function clearPasswordForm() {
        if (currentPassword) currentPassword.value = "";
        if (newPassword) newPassword.value = "";
        if (confirmNewPassword) confirmNewPassword.value = "";
    }


    // 27. Submit đổi mật khẩu
    async function handleChangePasswordSubmit(event) {
        event.preventDefault();
        hidePasswordStates();

        if (!validatePasswordForm()) {
            return;
        }

        try {
            if (changePasswordBtn) {
                changePasswordBtn.disabled = true;
                changePasswordBtn.textContent = "ĐANG ĐỔI...";
            }

            await postApi("users/change-password.php", {
                current_password: currentPassword.value.trim(),
                currentPassword: currentPassword.value.trim(),

                new_password: newPassword.value.trim(),
                newPassword: newPassword.value.trim(),

                confirm_password: confirmNewPassword.value.trim(),
                confirmPassword: confirmNewPassword.value.trim()
            });

            clearPasswordForm();
            showPasswordSuccess("Đổi mật khẩu thành công.");
        } catch (error) {
            showPasswordError(
                "Backend hiện chưa có API đổi mật khẩu hoặc API chưa sẵn sàng. Sau khi thêm users/change-password.php, form này sẽ dùng được."
            );
        } finally {
            if (changePasswordBtn) {
                changePasswordBtn.disabled = false;
                changePasswordBtn.textContent = "ĐỔI MẬT KHẨU";
            }
        }
    }


    // 28. Đăng xuất
    async function handleLogout(event) {
        if (event) {
            event.preventDefault();
        }

        const confirmLogout = confirm("Bạn có chắc muốn đăng xuất không?");

        if (!confirmLogout) {
            return;
        }

        if (window.CustomerApi && typeof window.CustomerApi.logoutCustomer === "function") {
            await window.CustomerApi.logoutCustomer();
            return;
        }

        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        localStorage.setItem(IS_LOGIN_STORAGE_KEY, "false");
        window.location.href = "../html/login.html";
    }


    // 29. Tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword ? searchKeyword.value.trim() : "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 30. Gắn sự kiện
    function bindEvents() {
        if (profileInfoForm) {
            profileInfoForm.addEventListener("submit", handleProfileInfoSubmit);
        }

        if (changePasswordForm) {
            changePasswordForm.addEventListener("submit", handleChangePasswordSubmit);
        }

        if (city) {
            city.addEventListener("change", handleCityChange);
        }

        if (district) {
            district.addEventListener("change", handleDistrictChange);
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", handleLogout);
        }

        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }

        const profileInputs = [
            fullName,
            email,
            phone,
            birthDate,
            city,
            district,
            ward,
            addressDetail
        ];

        profileInputs.forEach(function (input) {
            if (!input) {
                return;
            }

            input.addEventListener("input", hideProfileInfoStates);
            input.addEventListener("change", hideProfileInfoStates);
        });

        genderInputs.forEach(function (input) {
            input.addEventListener("change", hideProfileInfoStates);
        });

        const passwordInputs = [
            currentPassword,
            newPassword,
            confirmNewPassword
        ];

        passwordInputs.forEach(function (input) {
            if (!input) {
                return;
            }

            input.addEventListener("input", hidePasswordStates);
        });
    }


    // 31. Khởi tạo trang profile
    async function initProfilePage() {
        const isLogin = await requireLogin();

        if (!isLogin) {
            return;
        }

        bindEvents();
        await loadProfileData();
    }

    initProfilePage();
});