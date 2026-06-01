// =========================================================
// File: Frontend/js/points.js
// Mục đích: Trang điểm tích lũy dùng API user thật,
//           còn voucher đổi điểm/vòng xoay/lịch sử điểm lưu localStorage theo user
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang điểm tích lũy
    const pointsPage = document.querySelector('[data-page="points"]');

    if (!pointsPage) {
        return;
    }


    // 2. Key localStorage
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const IS_LOGIN_STORAGE_KEY = "is_login";
    const USER_POINTS_STORAGE_KEY = "user_points";
    const SAVED_VOUCHERS_STORAGE_KEY = "saved_vouchers";
    const POINT_HISTORY_STORAGE_KEY = "point_history";
    const LUCKY_WHEEL_STORAGE_KEY = "lucky_wheel";
    const ORDERS_STORAGE_KEY = "orders";


    // 3. Quy tắc điểm
    const pointRules = {
        earnLabel: "Tích điểm",
        earnValue: "Đánh giá đơn hàng = +100 điểm",

        voucher20Label: "Voucher 20K",
        voucher20Value: "500 điểm",

        voucher50Label: "Voucher 50K",
        voucher50Value: "1000 điểm"
    };


    // 4. Dữ liệu ưu đãi đổi điểm
    const rewards = [
        {
            id: "point-20k",
            badge: "20K",
            title: "Voucher giảm 20.000đ",
            description: "Áp dụng cho đơn hàng từ 200.000đ.",
            pointCost: 500,
            code: "POINT20",
            discountType: "amount",
            discountValue: 20000,
            maxDiscount: 20000,
            minOrderValue: 200000
        },
        {
            id: "point-50k",
            badge: "50K",
            title: "Voucher giảm 50.000đ",
            description: "Áp dụng cho đơn hàng từ 500.000đ.",
            pointCost: 1000,
            code: "POINT50",
            discountType: "amount",
            discountValue: 50000,
            maxDiscount: 50000,
            minOrderValue: 500000
        },
        {
            id: "point-freeship-30k",
            badge: "SHIP",
            title: "Freeship 30.000đ",
            description: "Giảm phí vận chuyển tối đa 30.000đ cho đơn hàng từ 300.000đ.",
            pointCost: 400,
            code: "POINTSHIP30",
            discountType: "shipping",
            discountValue: 30000,
            maxDiscount: 30000,
            minOrderValue: 300000
        }
    ];


    // 5. Dữ liệu vòng xoay may mắn
    const luckyWheelRewards = [
        {
            label: "Freeship 15K",
            code: "LUCKYSHIP15",
            title: "Freeship 15.000đ",
            description: "Voucher vòng xoay may mắn, giảm phí vận chuyển tối đa 15.000đ.",
            discountType: "shipping",
            discountValue: 15000,
            maxDiscount: 15000,
            minOrderValue: 199000
        },
        {
            label: "Giảm 20K",
            code: "LUCKY20",
            title: "Giảm 20.000đ",
            description: "Voucher vòng xoay may mắn, áp dụng cho đơn hàng từ 299.000đ.",
            discountType: "amount",
            discountValue: 20000,
            maxDiscount: 20000,
            minOrderValue: 299000
        },
        {
            label: "Giảm 10%",
            code: "LUCKY10",
            title: "Giảm 10%",
            description: "Voucher vòng xoay may mắn, giảm 10% tối đa 50.000đ.",
            discountType: "percent",
            discountValue: 10,
            maxDiscount: 50000,
            minOrderValue: 399000
        },
        {
            label: "Freeship 30K",
            code: "LUCKYSHIP30",
            title: "Freeship 30.000đ",
            description: "Voucher vòng xoay may mắn, giảm phí vận chuyển tối đa 30.000đ.",
            discountType: "shipping",
            discountValue: 30000,
            maxDiscount: 30000,
            minOrderValue: 299000
        },
        {
            label: "Giảm 50K",
            code: "LUCKY50",
            title: "Giảm 50.000đ",
            description: "Voucher vòng xoay may mắn, áp dụng cho đơn hàng từ 599.000đ.",
            discountType: "amount",
            discountValue: 50000,
            maxDiscount: 50000,
            minOrderValue: 599000
        },
        {
            label: "May mắn lần sau",
            code: "",
            title: "May mắn lần sau",
            description: "Chúc bạn may mắn ở lượt quay tiếp theo.",
            discountType: "",
            discountValue: 0,
            maxDiscount: 0,
            minOrderValue: 0
        }
    ];


    // 6. Biến trạng thái
    let currentUser = null;
    let userPoints = 0;
    let pointHistory = [];
    let isSpinning = false;


    // 7. Lấy DOM sidebar
    const profileUserName = document.getElementById("profileUserName");
    const profileUserEmail = document.getElementById("profileUserEmail");
    const profileUserRank = document.getElementById("profileUserRank");
    const profileUserAvatar = document.getElementById("profileUserAvatar");
    const logoutBtn = document.getElementById("logoutBtn");


    // 8. Lấy DOM tổng quan điểm
    const pointsSummaryLoadingState = document.getElementById("pointsSummaryLoadingState");
    const pointsSummaryErrorState = document.getElementById("pointsSummaryErrorState");
    const pointsSummaryContent = document.getElementById("pointsSummaryContent");

    const currentPointValue = document.getElementById("currentPointValue");
    const pointHintText = document.getElementById("pointHintText");

    const ruleEarnLabel = document.getElementById("ruleEarnLabel");
    const ruleEarnValue = document.getElementById("ruleEarnValue");
    const ruleVoucher20Label = document.getElementById("ruleVoucher20Label");
    const ruleVoucher20Value = document.getElementById("ruleVoucher20Value");
    const ruleVoucher50Label = document.getElementById("ruleVoucher50Label");
    const ruleVoucher50Value = document.getElementById("ruleVoucher50Value");


    // 9. Lấy DOM ưu đãi
    const openLuckyWheelBtn = document.getElementById("openLuckyWheelBtn");

    const rewardListLoadingState = document.getElementById("rewardListLoadingState");
    const rewardListEmptyState = document.getElementById("rewardListEmptyState");
    const rewardListErrorState = document.getElementById("rewardListErrorState");
    const rewardList = document.getElementById("rewardList");
    const rewardItemTemplate = document.getElementById("rewardItemTemplate");


    // 10. Lấy DOM lịch sử điểm
    const pointsHistoryLoadingState = document.getElementById("pointsHistoryLoadingState");
    const pointsHistoryEmptyState = document.getElementById("pointsHistoryEmptyState");
    const pointsHistoryErrorState = document.getElementById("pointsHistoryErrorState");
    const pointsHistoryContent = document.getElementById("pointsHistoryContent");
    const pointsHistoryList = document.getElementById("pointsHistoryList");
    const pointsHistoryRowTemplate = document.getElementById("pointsHistoryRowTemplate");


    // 11. Lấy DOM vòng xoay
    const luckyWheelPopup = document.getElementById("luckyWheelPopup");
    const closeLuckyWheelBtn = document.getElementById("closeLuckyWheelBtn");
    const cancelLuckyWheelBtn = document.getElementById("cancelLuckyWheelBtn");
    const spinLuckyWheelBtn = document.getElementById("spinLuckyWheelBtn");
    const luckyWheelDisc = document.getElementById("luckyWheelDisc");
    const luckyWheelRuleText = document.getElementById("luckyWheelRuleText");
    const luckyWheelResultText = document.getElementById("luckyWheelResultText");


    // 12. Lấy DOM tìm kiếm
    const searchForm = document.getElementById("searchForm");
    const searchKeyword = document.getElementById("searchKeyword");


    // 13. Gọi API GET
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


    // 14. Hàm tiện ích
    function formatPoint(point) {
        return Number(point || 0).toLocaleString("vi-VN") + " điểm";
    }

    function formatPrice(price) {
        if (window.CustomerApi && typeof window.CustomerApi.formatPrice === "function") {
            return window.CustomerApi.formatPrice(price);
        }

        return Number(price || 0).toLocaleString("vi-VN") + "đ";
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);

        if (Number.isNaN(date.getTime())) {
            return "--/--/----";
        }

        return date.toLocaleDateString("vi-VN");
    }

    function formatDateTime(value) {
        if (!value) {
            return "--/--/----";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "--/--/----";
        }

        return date.toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    function getTodayKey() {
        const today = new Date();

        return today.getFullYear() +
            "-" +
            String(today.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(today.getDate()).padStart(2, "0");
    }

    function generateId(prefix) {
        return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    }

    function getVoucherExpireTime() {
        return Date.now() + 30 * 24 * 60 * 60 * 1000;
    }

    function showMessage(message) {
        alert(message);
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


    // 15. Đọc ghi localStorage
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

    function getArrayFromStorage(key) {
        const data = getDataFromStorage(key, []);

        if (!Array.isArray(data)) {
            return [];
        }

        return data;
    }

    function getObjectFromStorage(key) {
        const data = getDataFromStorage(key, {});

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return {};
        }

        return data;
    }


    // 16. Kiểm tra đăng nhập
    function getCurrentUserFromLocal() {
        if (window.CustomerApi && typeof window.CustomerApi.getCurrentCustomerFromLocal === "function") {
            return window.CustomerApi.getCurrentCustomerFromLocal();
        }

        const isLogin = localStorage.getItem(IS_LOGIN_STORAGE_KEY) === "true";
        const currentUserData = getDataFromStorage(CURRENT_USER_STORAGE_KEY, null);

        if (!isLogin || !currentUserData) {
            return null;
        }

        if (typeof currentUserData === "string") {
            return {
                id: currentUserData,
                fullName: currentUserData
            };
        }

        return currentUserData;
    }

    async function requireLogin() {
        if (!window.CustomerApi) {
            currentUser = getCurrentUserFromLocal();

            if (!currentUser) {
                showMessage("Vui lòng đăng nhập để xem điểm tích lũy.");
                window.location.href = "../html/login.html?redirect=" + encodeURIComponent("../html/points.html");
                return false;
            }

            return true;
        }

        const localUser = window.CustomerApi.getCurrentCustomerFromLocal();

        if (!localUser) {
            showMessage("Vui lòng đăng nhập để xem điểm tích lũy.");
            window.location.href = "../html/login.html?redirect=" + encodeURIComponent("../html/points.html");
            return false;
        }

        try {
            currentUser = await window.CustomerApi.getCurrentCustomerFromSession();
            return true;
        } catch (error) {
            window.CustomerApi.clearCustomerLocalAuth();

            showMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            window.location.href = "../html/login.html?redirect=" + encodeURIComponent("../html/points.html");

            return false;
        }
    }


    // 17. Chuẩn hóa user từ API profile
    function normalizeUserFromApi(user) {
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

            role: roleCode,
            status: user.status || "active",

            points: Number(customerProfile.points_balance || user.points || 0),
            membershipLevel: customerProfile.membership_level || "normal",

            raw: user
        };
    }

    async function loadUserProfileFromApi() {
        try {
            const response = await getApi("users/get-profile.php");
            const apiUser = response.data && response.data.user
                ? response.data.user
                : null;

            if (!apiUser) {
                return;
            }

            const normalizedUser = normalizeUserFromApi(apiUser);

            const localPointMap = getUserPointMap();
            const userKey = getUserKey(normalizedUser);

            if (typeof localPointMap[userKey] === "number") {
                normalizedUser.points = Number(localPointMap[userKey] || 0);
            }

            currentUser = normalizedUser;

            saveDataToStorage(CURRENT_USER_STORAGE_KEY, normalizedUser);
            localStorage.setItem(IS_LOGIN_STORAGE_KEY, "true");
        } catch (error) {
            console.warn("Không lấy được profile từ API, dùng localStorage:", error);

            const localUser = getCurrentUserFromLocal();

            if (localUser) {
                currentUser = localUser;
            }
        }
    }


    // 18. Điểm người dùng
    function getUserPointMap() {
        return getObjectFromStorage(USER_POINTS_STORAGE_KEY);
    }

    function saveUserPointMap(pointMap) {
        saveDataToStorage(USER_POINTS_STORAGE_KEY, pointMap);
    }

    function getCurrentUserKey() {
        return getUserKey(currentUser);
    }

    function getCurrentUserPoints() {
        const userKey = getCurrentUserKey();

        if (!userKey) {
            return 0;
        }

        const pointMap = getUserPointMap();

        if (typeof pointMap[userKey] === "number") {
            return pointMap[userKey];
        }

        if (typeof currentUser?.points === "number") {
            return currentUser.points;
        }

        return 0;
    }

    function saveCurrentUserPoints(points) {
        const userKey = getCurrentUserKey();
        const newPoints = Math.max(Number(points || 0), 0);

        if (!userKey) {
            return;
        }

        const pointMap = getUserPointMap();

        pointMap[userKey] = newPoints;
        saveUserPointMap(pointMap);

        if (currentUser && typeof currentUser === "object") {
            currentUser.points = newPoints;
            saveDataToStorage(CURRENT_USER_STORAGE_KEY, currentUser);
        }

        userPoints = newPoints;

        if (window.authUI && typeof window.authUI.renderTopbarAccount === "function") {
            window.authUI.renderTopbarAccount();
        }
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


    // 19. Lịch sử điểm localStorage
    function getPointHistoryMap() {
        return getObjectFromStorage(POINT_HISTORY_STORAGE_KEY);
    }

    function savePointHistoryMap(historyMap) {
        saveDataToStorage(POINT_HISTORY_STORAGE_KEY, historyMap);
    }

    function getCurrentUserStoredPointHistory() {
        const userKey = getCurrentUserKey();

        if (!userKey) {
            return [];
        }

        const historyMap = getPointHistoryMap();
        const currentHistory = historyMap[userKey];

        if (!Array.isArray(currentHistory)) {
            return [];
        }

        return currentHistory;
    }

    function saveCurrentUserStoredPointHistory(history) {
        const userKey = getCurrentUserKey();

        if (!userKey) {
            return;
        }

        const historyMap = getPointHistoryMap();

        historyMap[userKey] = history;
        savePointHistoryMap(historyMap);
    }

    function addPointHistory(content, point, status, id) {
        const history = getCurrentUserStoredPointHistory();
        const historyId = id || generateId("point");

        const existed = history.some(function (item) {
            return item.id === historyId;
        });

        if (existed) {
            return;
        }

        history.unshift({
            id: historyId,
            date: new Date().toISOString(),
            content: content,
            point: Number(point || 0),
            status: status || "Thành công"
        });

        saveCurrentUserStoredPointHistory(history);

        pointHistory = getMergedPointHistory();
    }


    // 20. Lịch sử điểm từ đơn hàng localStorage
    function getOrdersFromStorage() {
        return getArrayFromStorage(ORDERS_STORAGE_KEY);
    }

    function isCurrentUserOrder(order) {
        const userKey = getCurrentUserKey();

        if (!currentUser || !userKey) {
            return false;
        }

        if (order.userKey && String(order.userKey) === String(userKey)) {
            return true;
        }

        if (order.userId && String(order.userId) === String(userKey)) {
            return true;
        }

        const customer = order.customer || order.customerInfo || order.receiver || {};

        if (currentUser.email && customer.email && currentUser.email === customer.email) {
            return true;
        }

        if (currentUser.phone && customer.phone && currentUser.phone === customer.phone) {
            return true;
        }

        return false;
    }

    function getPointHistoryFromOrders() {
        const orders = getOrdersFromStorage().filter(isCurrentUserOrder);
        const history = [];

        orders.forEach(function (order) {
            const orderId = order.orderCode || order.orderId || order.id || "";
            const benefits = order.benefits || {};
            const pointBenefit = benefits.point || null;

            if (pointBenefit && Number(pointBenefit.points || 0) > 0) {
                history.push({
                    id: "checkout_point_" + orderId,
                    date: order.createdAt || order.orderDate || new Date().toISOString(),
                    content: "Đổi điểm khi thanh toán đơn " + orderId,
                    point: -Number(pointBenefit.points || 0),
                    status: "Thành công"
                });
            }

            if (order.reviewRewardAdded) {
                history.push({
                    id: "review_reward_" + orderId,
                    date: order.review?.createdAt || order.completedAt || new Date().toISOString(),
                    content: "Thưởng đánh giá đơn hàng " + orderId,
                    point: Number(order.reviewRewardPoints || 100),
                    status: "Thành công"
                });
            }
        });

        return history;
    }

    function getMergedPointHistory() {
        const storedHistory = getCurrentUserStoredPointHistory();
        const orderHistory = getPointHistoryFromOrders();
        const historyMap = {};

        storedHistory.concat(orderHistory).forEach(function (item) {
            if (!item || !item.id) {
                return;
            }

            historyMap[item.id] = item;
        });

        return Object.values(historyMap).sort(function (a, b) {
            return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        });
    }


    // 21. Voucher đã lưu
    function getSavedVoucherMap() {
        const savedData = getDataFromStorage(SAVED_VOUCHERS_STORAGE_KEY, {});

        if (Array.isArray(savedData)) {
            return {
                member: savedData
            };
        }

        if (!savedData || typeof savedData !== "object") {
            return {};
        }

        return savedData;
    }

    function saveSavedVoucherMap(savedMap) {
        saveDataToStorage(SAVED_VOUCHERS_STORAGE_KEY, savedMap);
    }

    function getCurrentUserSavedVouchers() {
        const userKey = getCurrentUserKey();

        if (!userKey) {
            return [];
        }

        const savedMap = getSavedVoucherMap();
        const vouchers = savedMap[userKey];

        if (!Array.isArray(vouchers)) {
            return [];
        }

        return vouchers;
    }

    function saveCurrentUserSavedVouchers(vouchers) {
        const userKey = getCurrentUserKey();

        if (!userKey) {
            return;
        }

        const savedMap = getSavedVoucherMap();

        savedMap[userKey] = vouchers;
        saveSavedVoucherMap(savedMap);
    }

    function createSavedVoucherData(sourceData, sourceType) {
        const expiresAt = getVoucherExpireTime();

        return {
            id: generateId(sourceType || "point-voucher"),
            code: sourceData.code,
            title: sourceData.title,
            name: sourceData.title,
            description: sourceData.description,

            discountType: sourceData.discountType,
            discountValue: sourceData.discountValue,
            maxDiscount: sourceData.maxDiscount,

            minOrderValue: sourceData.minOrderValue,
            minOrder: sourceData.minOrderValue,

            expiry: formatDate(expiresAt),
            expiresAt: expiresAt,

            source: sourceType || "point-reward",
            used: false,
            savedAt: new Date().toISOString()
        };
    }

    function addVoucherToSavedList(voucherData) {
        if (!voucherData || !voucherData.code) {
            return;
        }

        const savedVouchers = getCurrentUserSavedVouchers();

        savedVouchers.unshift(voucherData);

        saveCurrentUserSavedVouchers(savedVouchers);
    }


    // 22. Hiển thị trạng thái
    function hideSummaryStates() {
        if (pointsSummaryLoadingState) pointsSummaryLoadingState.hidden = true;
        if (pointsSummaryErrorState) pointsSummaryErrorState.hidden = true;
        if (pointsSummaryContent) pointsSummaryContent.hidden = true;
    }

    function showSummaryContent() {
        hideSummaryStates();

        if (pointsSummaryContent) {
            pointsSummaryContent.hidden = false;
        }
    }

    function showSummaryError() {
        hideSummaryStates();

        if (pointsSummaryErrorState) {
            pointsSummaryErrorState.hidden = false;
        }
    }

    function hideRewardStates() {
        if (rewardListLoadingState) rewardListLoadingState.hidden = true;
        if (rewardListEmptyState) rewardListEmptyState.hidden = true;
        if (rewardListErrorState) rewardListErrorState.hidden = true;
        if (rewardList) rewardList.hidden = true;
    }

    function showRewardContent() {
        hideRewardStates();

        if (rewardList) {
            rewardList.hidden = false;
        }
    }

    function showRewardEmpty() {
        hideRewardStates();

        if (rewardListEmptyState) {
            rewardListEmptyState.hidden = false;
        }
    }

    function showRewardError() {
        hideRewardStates();

        if (rewardListErrorState) {
            rewardListErrorState.hidden = false;
        }
    }

    function hideHistoryStates() {
        if (pointsHistoryLoadingState) pointsHistoryLoadingState.hidden = true;
        if (pointsHistoryEmptyState) pointsHistoryEmptyState.hidden = true;
        if (pointsHistoryErrorState) pointsHistoryErrorState.hidden = true;
        if (pointsHistoryContent) pointsHistoryContent.hidden = true;
    }

    function showHistoryContent() {
        hideHistoryStates();

        if (pointsHistoryContent) {
            pointsHistoryContent.hidden = false;
        }
    }

    function showHistoryEmpty() {
        hideHistoryStates();

        if (pointsHistoryEmptyState) {
            pointsHistoryEmptyState.hidden = false;
        }
    }

    function showHistoryError() {
        hideHistoryStates();

        if (pointsHistoryErrorState) {
            pointsHistoryErrorState.hidden = false;
        }
    }

    function showAllLoadingStates() {
        hideSummaryStates();
        hideRewardStates();
        hideHistoryStates();

        if (pointsSummaryLoadingState) pointsSummaryLoadingState.hidden = false;
        if (rewardListLoadingState) rewardListLoadingState.hidden = false;
        if (pointsHistoryLoadingState) pointsHistoryLoadingState.hidden = false;
    }


    // 23. Render sidebar
    function renderUserBox() {
        const displayName = getDisplayName(currentUser);

        if (profileUserName) {
            profileUserName.textContent = displayName;
        }

        if (profileUserEmail) {
            profileUserEmail.textContent = currentUser?.email || currentUser?.phone || "";
        }

        if (profileUserRank) {
            profileUserRank.textContent = getRankNameByPoints(userPoints);
        }

        if (profileUserAvatar) {
            profileUserAvatar.textContent = getFirstLetter(displayName);
        }
    }


    // 24. Render tổng quan điểm
    function renderPointRules() {
        if (ruleEarnLabel) ruleEarnLabel.textContent = pointRules.earnLabel;
        if (ruleEarnValue) ruleEarnValue.textContent = pointRules.earnValue;
        if (ruleVoucher20Label) ruleVoucher20Label.textContent = pointRules.voucher20Label;
        if (ruleVoucher20Value) ruleVoucher20Value.textContent = pointRules.voucher20Value;
        if (ruleVoucher50Label) ruleVoucher50Label.textContent = pointRules.voucher50Label;
        if (ruleVoucher50Value) ruleVoucher50Value.textContent = pointRules.voucher50Value;
    }

    function renderPointsSummary() {
        if (currentPointValue) {
            currentPointValue.textContent = formatPoint(userPoints);
        }

        if (pointHintText) {
            if (userPoints >= 1000) {
                pointHintText.textContent = "Bạn có thể đổi các voucher giá trị cao hoặc dùng điểm để giảm tiền khi thanh toán.";
            } else if (userPoints >= 500) {
                pointHintText.textContent = "Bạn đã đủ điểm để đổi một số ưu đãi.";
            } else {
                pointHintText.textContent = "Tiếp tục mua sắm và đánh giá đơn hàng để tích thêm điểm thưởng.";
            }
        }

        renderPointRules();
        showSummaryContent();
    }


    // 25. Render ưu đãi
    function createRewardElement(reward) {
        if (!rewardItemTemplate) {
            return null;
        }

        const clone = rewardItemTemplate.content.cloneNode(true);

        const rewardItem = clone.querySelector(".rewardItem");
        const rewardBadge = clone.querySelector('[data-role="reward-badge"]');
        const rewardTitle = clone.querySelector('[data-role="reward-title"]');
        const rewardDescription = clone.querySelector('[data-role="reward-description"]');
        const rewardPointCost = clone.querySelector('[data-role="reward-point-cost"]');
        const rewardButton = clone.querySelector('[data-role="reward-action-button"]');

        const canRedeem = userPoints >= reward.pointCost;

        if (rewardItem) {
            rewardItem.dataset.rewardId = reward.id;
            rewardItem.classList.toggle("available", canRedeem);
            rewardItem.classList.toggle("locked", !canRedeem);
        }

        if (rewardBadge) {
            rewardBadge.textContent = reward.badge;
        }

        if (rewardTitle) {
            rewardTitle.textContent = reward.title;
        }

        if (rewardDescription) {
            rewardDescription.textContent = reward.description;
        }

        if (rewardPointCost) {
            rewardPointCost.textContent = formatPoint(reward.pointCost);
        }

        if (rewardButton) {
            rewardButton.dataset.rewardId = reward.id;
            rewardButton.disabled = !canRedeem;
            rewardButton.textContent = canRedeem ? "Đổi ngay" : "Chưa đủ điểm";
        }

        return clone;
    }

    function renderRewards() {
        if (!rewardList || !rewardItemTemplate) {
            showRewardError();
            return;
        }

        rewardList.innerHTML = "";

        if (rewards.length === 0) {
            showRewardEmpty();
            return;
        }

        const fragment = document.createDocumentFragment();

        rewards.forEach(function (reward) {
            const rewardElement = createRewardElement(reward);

            if (rewardElement) {
                fragment.appendChild(rewardElement);
            }
        });

        rewardList.appendChild(fragment);
        showRewardContent();
    }


    // 26. Render lịch sử điểm
    function getPointClass(point) {
        if (point > 0) {
            return "plus";
        }

        if (point < 0) {
            return "minus";
        }

        return "neutral";
    }

    function getPointText(point) {
        const value = Number(point || 0);

        if (value > 0) {
            return "+" + formatPoint(value);
        }

        if (value < 0) {
            return "-" + formatPoint(Math.abs(value));
        }

        return formatPoint(0);
    }

    function getStatusClass(status) {
        if (status === "Đã dùng") {
            return "used";
        }

        if (status === "Đang chờ") {
            return "pending";
        }

        if (status === "Đã hủy") {
            return "cancelled";
        }

        return "completed";
    }

    function createHistoryRow(historyItem) {
        if (!pointsHistoryRowTemplate) {
            return null;
        }

        const clone = pointsHistoryRowTemplate.content.cloneNode(true);

        const row = clone.querySelector(".pointsRow");
        const historyDate = clone.querySelector('[data-role="history-date"]');
        const historyContent = clone.querySelector('[data-role="history-content"]');
        const historyPoint = clone.querySelector('[data-role="history-point"]');
        const historyStatus = clone.querySelector('[data-role="history-status"]');

        if (row) {
            row.dataset.historyId = historyItem.id || "";
        }

        if (historyDate) {
            historyDate.textContent = formatDateTime(historyItem.date);
        }

        if (historyContent) {
            historyContent.textContent = historyItem.content || "---";
        }

        if (historyPoint) {
            const point = Number(historyItem.point || 0);

            historyPoint.textContent = getPointText(point);
            historyPoint.className = "historyPoint " + getPointClass(point);
        }

        if (historyStatus) {
            historyStatus.textContent = historyItem.status || "Thành công";
            historyStatus.className = "pointsStatus " + getStatusClass(historyItem.status);
        }

        return clone;
    }

    function renderPointHistory() {
        if (!pointsHistoryList || !pointsHistoryRowTemplate) {
            showHistoryError();
            return;
        }

        pointsHistoryList.innerHTML = "";

        if (pointHistory.length === 0) {
            showHistoryEmpty();
            return;
        }

        const fragment = document.createDocumentFragment();

        pointHistory.forEach(function (item) {
            const historyRow = createHistoryRow(item);

            if (historyRow) {
                fragment.appendChild(historyRow);
            }
        });

        pointsHistoryList.appendChild(fragment);
        showHistoryContent();
    }


    // 27. Đổi ưu đãi
    function getRewardById(rewardId) {
        return rewards.find(function (reward) {
            return reward.id === rewardId;
        });
    }

    function redeemReward(rewardId) {
        const reward = getRewardById(rewardId);

        if (!reward) {
            showMessage("Không tìm thấy ưu đãi.");
            return;
        }

        if (userPoints < reward.pointCost) {
            showMessage("Bạn chưa đủ điểm để đổi ưu đãi này.");
            return;
        }

        const confirmRedeem = confirm(
            "Bạn muốn dùng " +
            reward.pointCost +
            " điểm để đổi ưu đãi này?"
        );

        if (!confirmRedeem) {
            return;
        }

        saveCurrentUserPoints(userPoints - reward.pointCost);

        const savedVoucher = createSavedVoucherData(reward, "point-reward");

        addVoucherToSavedList(savedVoucher);

        addPointHistory(
            "Đổi ưu đãi: " + reward.title + " (" + reward.code + ")",
            -reward.pointCost,
            "Thành công",
            "redeem_" + savedVoucher.id
        );

        pointHistory = getMergedPointHistory();

        renderUserBox();
        renderPointsSummary();
        renderRewards();
        renderPointHistory();

        showMessage("Đổi ưu đãi thành công.\nMã ưu đãi của bạn là: " + reward.code);
    }


    // 28. Vòng xoay may mắn
    function getLuckyWheelMap() {
        return getObjectFromStorage(LUCKY_WHEEL_STORAGE_KEY);
    }

    function saveLuckyWheelMap(luckyMap) {
        saveDataToStorage(LUCKY_WHEEL_STORAGE_KEY, luckyMap);
    }

    function getCurrentUserLuckyWheelData() {
        const userKey = getCurrentUserKey();

        if (!userKey) {
            return null;
        }

        const luckyMap = getLuckyWheelMap();

        return luckyMap[userKey] || null;
    }

    function saveCurrentUserLuckyWheelData(data) {
        const userKey = getCurrentUserKey();

        if (!userKey) {
            return;
        }

        const luckyMap = getLuckyWheelMap();

        luckyMap[userKey] = data;
        saveLuckyWheelMap(luckyMap);
    }

    function getTodayLuckyResult() {
        const luckyData = getCurrentUserLuckyWheelData();

        if (!luckyData || luckyData.date !== getTodayKey()) {
            return null;
        }

        return luckyData;
    }

    function hasSpunToday() {
        return Boolean(getTodayLuckyResult());
    }

    function renderLuckyWheelStatus() {
        const todayResult = getTodayLuckyResult();

        if (!todayResult) {
            if (luckyWheelResultText) {
                luckyWheelResultText.textContent = "Bạn chưa quay lần nào.";
            }

            if (spinLuckyWheelBtn) {
                spinLuckyWheelBtn.disabled = false;
                spinLuckyWheelBtn.textContent = "Quay ngay";
            }

            return;
        }

        if (luckyWheelResultText) {
            luckyWheelResultText.textContent = todayResult.resultLabel;
        }

        if (spinLuckyWheelBtn) {
            spinLuckyWheelBtn.disabled = true;
            spinLuckyWheelBtn.textContent = "Đã quay hôm nay";
        }
    }

    function openLuckyWheelPopup() {
        if (!luckyWheelPopup) {
            return;
        }

        luckyWheelPopup.hidden = false;
        document.body.style.overflow = "hidden";

        if (luckyWheelRuleText) {
            luckyWheelRuleText.textContent = "Mỗi tài khoản được quay 1 lần trong ngày.";
        }

        renderLuckyWheelStatus();
    }

    function closeLuckyWheelPopup() {
        if (!luckyWheelPopup) {
            return;
        }

        luckyWheelPopup.hidden = true;
        document.body.style.overflow = "";
    }

    function saveLuckyResult(reward) {
        const luckyData = {
            date: getTodayKey(),
            resultLabel: reward.label,
            voucherCode: reward.code,
            createdAt: new Date().toISOString()
        };

        saveCurrentUserLuckyWheelData(luckyData);
    }

    function saveLuckyVoucher(reward) {
        if (!reward.code) {
            return null;
        }

        const savedVoucher = createSavedVoucherData(reward, "lucky-wheel");

        addVoucherToSavedList(savedVoucher);

        return savedVoucher;
    }

    function spinLuckyWheel() {
        if (isSpinning) {
            return;
        }

        if (hasSpunToday()) {
            showMessage("Bạn đã quay vòng xoay hôm nay rồi.");
            renderLuckyWheelStatus();
            return;
        }

        isSpinning = true;

        if (spinLuckyWheelBtn) {
            spinLuckyWheelBtn.disabled = true;
            spinLuckyWheelBtn.textContent = "Đang quay...";
        }

        const rewardIndex = Math.floor(Math.random() * luckyWheelRewards.length);
        const reward = luckyWheelRewards[rewardIndex];

        const segmentDeg = 360 / luckyWheelRewards.length;
        const rotateDeg = 360 * 5 + rewardIndex * segmentDeg + segmentDeg / 2;

        if (luckyWheelDisc) {
            luckyWheelDisc.style.transition = "transform 2.5s ease-out";
            luckyWheelDisc.style.transform = "rotate(" + rotateDeg + "deg)";
        }

        setTimeout(function () {
            isSpinning = false;

            saveLuckyResult(reward);

            if (reward.code) {
                const savedVoucher = saveLuckyVoucher(reward);

                addPointHistory(
                    "Nhận voucher từ vòng xoay: " + reward.label + " (" + reward.code + ")",
                    0,
                    "Thành công",
                    "lucky_" + savedVoucher.id
                );
            } else {
                addPointHistory(
                    "Vòng xoay may mắn: May mắn lần sau",
                    0,
                    "Thành công",
                    "lucky_none_" + getTodayKey()
                );
            }

            pointHistory = getMergedPointHistory();

            renderPointHistory();
            renderLuckyWheelStatus();

            showMessage("Kết quả vòng xoay: " + reward.label);
        }, 2600);
    }


    // 29. Load dữ liệu điểm
    async function loadPointsData() {
        await loadUserProfileFromApi();

        if (!currentUser) {
            currentUser = getCurrentUserFromLocal();
        }

        userPoints = getCurrentUserPoints();
        pointHistory = getMergedPointHistory();
    }


    // 30. Đăng xuất
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

        localStorage.setItem(IS_LOGIN_STORAGE_KEY, "false");
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        window.location.href = "../html/login.html";
    }


    // 31. Tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword ? searchKeyword.value.trim() : "";

        if (!keyword) {
            showMessage("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 32. Gắn sự kiện
    function handleRewardListClick(event) {
        const rewardButton = event.target.closest('[data-role="reward-action-button"]');

        if (!rewardButton || rewardButton.disabled) {
            return;
        }

        const rewardId = rewardButton.dataset.rewardId;

        redeemReward(rewardId);
    }

    function handleEscapeKey(event) {
        if (event.key === "Escape") {
            closeLuckyWheelPopup();
        }
    }

    function bindEvents() {
        if (rewardList) {
            rewardList.addEventListener("click", handleRewardListClick);
        }

        if (openLuckyWheelBtn) {
            openLuckyWheelBtn.addEventListener("click", openLuckyWheelPopup);
        }

        if (closeLuckyWheelBtn) {
            closeLuckyWheelBtn.addEventListener("click", closeLuckyWheelPopup);
        }

        if (cancelLuckyWheelBtn) {
            cancelLuckyWheelBtn.addEventListener("click", closeLuckyWheelPopup);
        }

        if (spinLuckyWheelBtn) {
            spinLuckyWheelBtn.addEventListener("click", spinLuckyWheel);
        }

        if (luckyWheelPopup) {
            luckyWheelPopup.addEventListener("click", function (event) {
                if (event.target === luckyWheelPopup) {
                    closeLuckyWheelPopup();
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", handleLogout);
        }

        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }

        document.addEventListener("keydown", handleEscapeKey);
    }


    // 33. Render toàn bộ trang
    function renderPointsPage() {
        renderUserBox();
        renderPointsSummary();
        renderRewards();
        renderPointHistory();
    }


    // 34. Khởi tạo trang điểm tích lũy
    async function initPointsPage() {
        const isLogin = await requireLogin();

        if (!isLogin) {
            return;
        }

        showAllLoadingStates();

        try {
            bindEvents();

            await loadPointsData();

            setTimeout(function () {
                renderPointsPage();
            }, 250);
        } catch (error) {
            console.error("Lỗi points:", error);

            showSummaryError();
            showRewardError();
            showHistoryError();
        }
    }

    initPointsPage();
});