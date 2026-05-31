// 1. Chờ HTML tải xong

document.addEventListener("DOMContentLoaded", function () {
    const profilePage = document.querySelector('[data-page="profile"]');

    if (!profilePage) {
        return;
    }

    // 2. Key localStorage

    const USERS_STORAGE_KEY = "users";
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const IS_LOGIN_STORAGE_KEY = "is_login";
    const REMEMBER_LOGIN_STORAGE_KEY = "remember_login";
    const USER_POINTS_STORAGE_KEY = "user_points";

    // 3. Dữ liệu địa chỉ

    const addressData = [
        {
            name: "TP. Hồ Chí Minh",
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
                    wards: [
                        "Bến Nghé",
                        "Bến Thành",
                        "Cầu Kho",
                        "Cầu Ông Lãnh",
                        "Cô Giang"
                    ]
                },
                {
                    name: "Quận 3",
                    wards: [
                        "Phường 1",
                        "Phường 2",
                        "Phường 3",
                        "Phường 4",
                        "Phường 5"
                    ]
                },
                {
                    name: "Quận Bình Thạnh",
                    wards: [
                        "Phường 1",
                        "Phường 2",
                        "Phường 3",
                        "Phường 5",
                        "Phường 7"
                    ]
                }
            ]
        },
        {
            name: "Hà Nội",
            districts: [
                {
                    name: "Quận Ba Đình",
                    wards: [
                        "Phúc Xá",
                        "Trúc Bạch",
                        "Vĩnh Phúc",
                        "Cống Vị"
                    ]
                },
                {
                    name: "Quận Hoàn Kiếm",
                    wards: [
                        "Hàng Bạc",
                        "Hàng Bài",
                        "Hàng Đào",
                        "Tràng Tiền"
                    ]
                }
            ]
        },
        {
            name: "Đà Nẵng",
            districts: [
                {
                    name: "Quận Hải Châu",
                    wards: [
                        "Hải Châu 1",
                        "Hải Châu 2",
                        "Thạch Thang"
                    ]
                },
                {
                    name: "Quận Sơn Trà",
                    wards: [
                        "An Hải Bắc",
                        "An Hải Đông",
                        "Phước Mỹ"
                    ]
                }
            ]
        }
    ];

    // 4. Biến dữ liệu

    let currentUser = null;
    let fullCurrentUser = null;
    let currentUserPoints = 0;

    // 5. Lấy DOM sidebar

    const profileUserName = document.getElementById("profileUserName");
    const profileUserRank = document.getElementById("profileUserRank");
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

    // 9. Hàm tiện ích

    function normalizeText(value) {
        return String(value || "").trim().toLowerCase();
    }

    function isEmpty(value) {
        return String(value || "").trim() === "";
    }

    function isValidEmail(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(value);
    }

    function isValidPhone(value) {
        const phoneRegex = /^0\d{9}$/;

        return phoneRegex.test(value);
    }

    function getDisplayName(user) {
        if (!user) {
            return "Khách hàng";
        }

        return (
            user.fullName ||
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

    function createSafeUser(user) {
        return {
            id: user.id,
            userId: user.userId,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role,
            points: Number(user.points || 0),
            birthDate: user.birthDate || "",
            gender: user.gender || "",
            city: user.city || "",
            district: user.district || "",
            ward: user.ward || "",
            addressDetail: user.addressDetail || "",
            address: user.address || null
        };
    }

    // 10. Đọc ghi localStorage

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

        if (!Array.isArray(users)) {
            return [];
        }

        return users;
    }

    function saveUsersToStorage(users) {
        saveDataToStorage(USERS_STORAGE_KEY, users);
    }

    function getCurrentUserFromStorage() {
        const user = getDataFromStorage(CURRENT_USER_STORAGE_KEY, null);

        if (!user) {
            return null;
        }

        if (typeof user === "string") {
            return {
                id: user,
                fullName: user
            };
        }

        return user;
    }

    function saveCurrentUserToStorage(user) {
        saveDataToStorage(CURRENT_USER_STORAGE_KEY, createSafeUser(user));
    }

    function isLoggedIn() {
        const isLogin = localStorage.getItem(IS_LOGIN_STORAGE_KEY);

        return isLogin === "true" && getCurrentUserFromStorage() !== null;
    }

    // 11. Đồng bộ điểm

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

    function getSyncedUserPoints(user) {
        const userKey = getUserKey(user);

        if (!userKey) {
            return Number(user?.points || 0);
        }

        const pointMap = getUserPointMap();

        if (typeof pointMap[userKey] === "number") {
            return pointMap[userKey];
        }

        const fallbackPoints = Number(user?.points || 0);
        pointMap[userKey] = fallbackPoints;
        saveUserPointMap(pointMap);

        return fallbackPoints;
    }

    function saveSyncedUserPoints(user, points) {
        const userKey = getUserKey(user);

        if (!userKey) {
            return;
        }

        const pointMap = getUserPointMap();
        pointMap[userKey] = Number(points || 0);

        saveUserPointMap(pointMap);
    }

    function syncUserPointsToUsers(user, points) {
        const users = getUsersFromStorage();

        const userIndex = users.findIndex(function (item) {
            return isSameUser(item, user);
        });

        if (userIndex >= 0) {
            users[userIndex].points = Number(points || 0);
            saveUsersToStorage(users);
        }
    }

    // 12. Tìm user hiện tại

    function isSameUser(userA, userB) {
        if (!userA || !userB) {
            return false;
        }

        return (
            Boolean(userA.id && userB.id && userA.id === userB.id) ||
            Boolean(userA.userId && userB.userId && userA.userId === userB.userId) ||
            Boolean(userA.email && userB.email && userA.email === userB.email) ||
            Boolean(userA.phone && userB.phone && userA.phone === userB.phone) ||
            Boolean(userA.username && userB.username && userA.username === userB.username)
        );
    }

    function getFullCurrentUser() {
        const users = getUsersFromStorage();

        if (!currentUser) {
            return null;
        }

        const foundUser = users.find(function (user) {
            return isSameUser(user, currentUser);
        });

        return foundUser || currentUser;
    }

    function findCurrentUserIndex(users) {
        return users.findIndex(function (user) {
            return isSameUser(user, currentUser);
        });
    }

    // 13. Trạng thái thông báo

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

    // 14. Render địa chỉ

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

    // 15. Render thông tin tài khoản

    function renderProfileUserBox(user) {
        if (profileUserName) {
            profileUserName.textContent = getDisplayName(user);
        }

        if (profileUserRank) {
            profileUserRank.textContent = getRankNameByPoints(currentUserPoints);
        }
    }

    function renderGender(user) {
        genderInputs.forEach(function (input) {
            input.checked = input.value === user.gender;
        });
    }

    function renderProfileForm(user) {
        const userCity = user.city || user.address?.city || "";
        const userDistrict = user.district || user.address?.district || "";
        const userWard = user.ward || user.address?.ward || "";
        const userAddressDetail = user.addressDetail || user.address?.addressDetail || "";

        if (fullName) fullName.value = user.fullName || "";
        if (email) email.value = user.email || "";
        if (phone) phone.value = user.phone || "";
        if (birthDate) birthDate.value = user.birthDate || "";
        if (addressDetail) addressDetail.value = userAddressDetail;

        renderCityOptions(userCity);

        if (userCity) {
            renderDistrictOptions(userCity, userDistrict);
        } else {
            resetSelect(district, "Chọn Quận/Huyện");
            if (district) district.disabled = true;
        }

        if (userCity && userDistrict) {
            renderWardOptions(userCity, userDistrict, userWard);
        } else {
            resetSelect(ward, "Chọn Phường/Xã");
            if (ward) ward.disabled = true;
        }

        renderGender(user);
    }

    function refreshCurrentUserData() {
        currentUser = getCurrentUserFromStorage();
        fullCurrentUser = getFullCurrentUser();
        currentUserPoints = getSyncedUserPoints(fullCurrentUser || currentUser);

        if (fullCurrentUser) {
            fullCurrentUser.points = currentUserPoints;
        }

        if (currentUser) {
            currentUser.points = currentUserPoints;
        }
    }

    function renderProfilePage() {
        refreshCurrentUserData();

        if (!fullCurrentUser) {
            return;
        }

        renderProfileUserBox(fullCurrentUser);
        renderProfileForm(fullCurrentUser);
    }

    // 16. Kiểm tra dữ liệu cập nhật

    function isEmailExistsInOtherUser(value) {
        const users = getUsersFromStorage();
        const normalizedEmail = normalizeText(value);

        return users.some(function (user) {
            return !isSameUser(user, currentUser) &&
                normalizeText(user.email) === normalizedEmail;
        });
    }

    function isPhoneExistsInOtherUser(value) {
        const users = getUsersFromStorage();
        const normalizedPhone = normalizeText(value);

        return users.some(function (user) {
            return !isSameUser(user, currentUser) &&
                normalizeText(user.phone) === normalizedPhone;
        });
    }

    function validateProfileInfoForm() {
        const inputFullName = fullName?.value.trim() || "";
        const inputEmail = email?.value.trim() || "";
        const inputPhone = phone?.value.trim() || "";

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

        if (isEmailExistsInOtherUser(inputEmail)) {
            showProfileInfoError("Email này đã được sử dụng bởi tài khoản khác.");
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

        if (isPhoneExistsInOtherUser(inputPhone)) {
            showProfileInfoError("Số điện thoại này đã được sử dụng bởi tài khoản khác.");
            phone?.focus();
            return false;
        }

        return true;
    }

    // 17. Cập nhật thông tin tài khoản

    function getSelectedGender() {
        const selectedGender = document.querySelector('input[name="gender"]:checked');

        if (!selectedGender) {
            return "";
        }

        return selectedGender.value;
    }

    function getUpdatedProfileData() {
        return {
            fullName: fullName.value.trim(),
            email: email.value.trim(),
            phone: phone.value.trim(),
            birthDate: birthDate?.value || "",
            gender: getSelectedGender(),
            city: city?.value || "",
            district: district?.value || "",
            ward: ward?.value || "",
            addressDetail: addressDetail?.value.trim() || "",
            address: {
                city: city?.value || "",
                district: district?.value || "",
                ward: ward?.value || "",
                addressDetail: addressDetail?.value.trim() || ""
            }
        };
    }

    function updateUserInStorage(updatedData) {
        const users = getUsersFromStorage();
        const userIndex = findCurrentUserIndex(users);

        const baseUser = fullCurrentUser || currentUser || {};
        const updatedUser = {
            ...baseUser,
            ...updatedData,
            points: currentUserPoints
        };

        if (userIndex >= 0) {
            users[userIndex] = {
                ...users[userIndex],
                ...updatedData,
                points: currentUserPoints
            };

            saveUsersToStorage(users);
            fullCurrentUser = users[userIndex];
        } else {
            fullCurrentUser = updatedUser;
        }

        saveSyncedUserPoints(updatedUser, currentUserPoints);
        syncUserPointsToUsers(updatedUser, currentUserPoints);
        saveCurrentUserToStorage(updatedUser);

        currentUser = createSafeUser(updatedUser);

        return updatedUser;
    }

    function handleProfileInfoSubmit(event) {
        event.preventDefault();

        hideProfileInfoStates();

        if (!validateProfileInfoForm()) {
            return;
        }

        if (updateProfileBtn) {
            updateProfileBtn.disabled = true;
            updateProfileBtn.textContent = "ĐANG CẬP NHẬT...";
        }

        setTimeout(function () {
            const updatedData = getUpdatedProfileData();
            const updatedUser = updateUserInStorage(updatedData);

            renderProfileUserBox(updatedUser);
            renderProfileForm(updatedUser);

            if (window.authUI && typeof window.authUI.renderTopbarAccount === "function") {
                window.authUI.renderTopbarAccount();
            }

            showProfileInfoSuccess("Cập nhật thông tin thành công.");

            if (updateProfileBtn) {
                updateProfileBtn.disabled = false;
                updateProfileBtn.textContent = "CẬP NHẬT THÔNG TIN";
            }
        }, 300);
    }

    // 18. Đổi mật khẩu

    function validatePasswordForm() {
        const inputCurrentPassword = currentPassword?.value.trim() || "";
        const inputNewPassword = newPassword?.value.trim() || "";
        const inputConfirmPassword = confirmNewPassword?.value.trim() || "";

        if (isEmpty(inputCurrentPassword)) {
            showPasswordError("Vui lòng nhập mật khẩu hiện tại.");
            currentPassword?.focus();
            return false;
        }

        if (!fullCurrentUser || fullCurrentUser.password !== inputCurrentPassword) {
            showPasswordError("Mật khẩu hiện tại không đúng.");
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

    function updatePasswordInStorage(newPasswordValue) {
        const users = getUsersFromStorage();
        const userIndex = findCurrentUserIndex(users);

        if (userIndex === -1) {
            return false;
        }

        users[userIndex].password = newPasswordValue;
        users[userIndex].points = currentUserPoints;

        saveUsersToStorage(users);

        fullCurrentUser = users[userIndex];

        return true;
    }

    function clearPasswordForm() {
        if (currentPassword) currentPassword.value = "";
        if (newPassword) newPassword.value = "";
        if (confirmNewPassword) confirmNewPassword.value = "";
    }

    function handleChangePasswordSubmit(event) {
        event.preventDefault();

        hidePasswordStates();

        if (!validatePasswordForm()) {
            return;
        }

        if (changePasswordBtn) {
            changePasswordBtn.disabled = true;
            changePasswordBtn.textContent = "ĐANG ĐỔI...";
        }

        setTimeout(function () {
            const isUpdated = updatePasswordInStorage(newPassword.value.trim());

            if (!isUpdated) {
                showPasswordError("Không tìm thấy tài khoản để đổi mật khẩu.");
            } else {
                clearPasswordForm();
                showPasswordSuccess("Đổi mật khẩu thành công.");
            }

            if (changePasswordBtn) {
                changePasswordBtn.disabled = false;
                changePasswordBtn.textContent = "ĐỔI MẬT KHẨU";
            }
        }, 300);
    }

    // 19. Đăng xuất

    function handleLogout() {
        const confirmLogout = confirm("Bạn có chắc muốn đăng xuất không?");

        if (!confirmLogout) {
            return;
        }

        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        localStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
        localStorage.setItem(IS_LOGIN_STORAGE_KEY, "false");

        window.location.href = "../html/login.html";
    }

    // 20. Xử lý địa chỉ

    function handleCityChange() {
        renderDistrictOptions(city.value, "");
    }

    function handleDistrictChange() {
        renderWardOptions(city.value, district.value, "");
    }

    // 21. Xử lý tìm kiếm

    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword?.value.trim() || "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }

    // 22. Bảo vệ trang tài khoản

    function redirectToLoginIfNeeded() {
        if (isLoggedIn()) {
            return false;
        }

        alert("Vui lòng đăng nhập để xem tài khoản của bạn.");

        const redirectUrl = encodeURIComponent("../html/profile.html");
        window.location.href = "../html/login.html?redirect=" + redirectUrl;

        return true;
    }

    // 23. Gắn sự kiện

    function bindEvents() {
        profileInfoForm?.addEventListener("submit", handleProfileInfoSubmit);
        changePasswordForm?.addEventListener("submit", handleChangePasswordSubmit);
        logoutBtn?.addEventListener("click", handleLogout);

        city?.addEventListener("change", handleCityChange);
        district?.addEventListener("change", handleDistrictChange);

        searchForm?.addEventListener("submit", handleSearchSubmit);
    }

    // 24. Khởi tạo trang

    function initProfilePage() {
        if (redirectToLoginIfNeeded()) {
            return;
        }

        renderProfilePage();
        bindEvents();
    }

    initProfilePage();
});