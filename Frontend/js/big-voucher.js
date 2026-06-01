// =========================================================
// File: Frontend/js/big-voucher.js
// Mục đích: Trang Big Voucher lấy voucher thật từ API,
//           lưu voucher đã săn vào localStorage theo user
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang Big Voucher
    const bigVoucherPage = document.querySelector(".bigVoucherPage");

    if (!bigVoucherPage) {
        return;
    }


    // 2. Key localStorage
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const IS_LOGIN_STORAGE_KEY = "is_login";
    const BIG_VOUCHER_END_TIME_KEY = "big_voucher_end_time";
    const SAVED_VOUCHERS_STORAGE_KEY = "saved_vouchers";


    // 3. Biến trạng thái
    let bigVouchers = [];
    let currentFilter = "all";
    let currentSort = "default";
    let currentKeyword = "";
    let countdownTimer = null;


    // 4. Lấy DOM chung
    const searchForm = document.getElementById("searchForm");
    const searchKeywordInput = document.getElementById("searchKeyword");

    const bigVoucherHero = document.querySelector(".bigVoucherHero");
    const memberNotice = document.getElementById("memberNotice");

    const highlightVoucherText = document.getElementById("highlightVoucherText");
    const highlightVoucherSubtext = document.getElementById("highlightVoucherSubtext");

    const countdownDays = document.getElementById("bigVoucherCountdownDays");
    const countdownHours = document.getElementById("bigVoucherCountdownHours");
    const countdownMinutes = document.getElementById("bigVoucherCountdownMinutes");
    const countdownSeconds = document.getElementById("bigVoucherCountdownSeconds");

    const bigVoucherFilterBar = document.getElementById("bigVoucherFilterBar");
    const bigVoucherSort = document.getElementById("bigVoucherSort");
    const bigVoucherResultCount = document.getElementById("bigVoucherResultCount");

    const bigVoucherLoadingState = document.getElementById("bigVoucherLoadingState");
    const bigVoucherEmptyState = document.getElementById("bigVoucherEmptyState");
    const bigVoucherErrorState = document.getElementById("bigVoucherErrorState");

    const bigVoucherList = document.getElementById("bigVoucherList");
    const bigVoucherTemplate = document.getElementById("bigVoucherTemplate");

    const voucherToastContainer = document.getElementById("voucherToastContainer");


    // 5. Gọi API GET
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


    // 6. Hàm tiện ích định dạng
    function formatPrice(price) {
        if (window.CustomerApi && typeof window.CustomerApi.formatPrice === "function") {
            return window.CustomerApi.formatPrice(price);
        }

        return Number(price || 0).toLocaleString("vi-VN") + "đ";
    }

    function formatDate(timestamp) {
        if (!timestamp) {
            return "--/--/----";
        }

        const date = new Date(Number(timestamp));

        if (Number.isNaN(date.getTime())) {
            return "--/--/----";
        }

        return date.toLocaleDateString("vi-VN");
    }

    function getStoredOrNewEndTime() {
        const htmlEndTime = bigVoucherHero?.dataset.endTime || "";

        if (htmlEndTime) {
            return new Date(htmlEndTime).getTime();
        }

        const savedEndTime = Number(localStorage.getItem(BIG_VOUCHER_END_TIME_KEY) || 0);

        if (savedEndTime && savedEndTime > Date.now()) {
            return savedEndTime;
        }

        const newEndTime = Date.now() + 24 * 60 * 60 * 1000;

        localStorage.setItem(BIG_VOUCHER_END_TIME_KEY, String(newEndTime));

        return newEndTime;
    }

    function getBigVoucherEndTime() {
        const activeExpireTimes = bigVouchers
            .map(function (voucher) {
                return Number(voucher.expiresAt || 0);
            })
            .filter(function (time) {
                return time > Date.now();
            });

        if (activeExpireTimes.length > 0) {
            return Math.min.apply(null, activeExpireTimes);
        }

        return getStoredOrNewEndTime();
    }

    function formatVoucherValue(voucher) {
        if (voucher.discountType === "amount") {
            return formatPrice(voucher.discountValue);
        }

        if (voucher.discountType === "percent") {
            return voucher.discountValue + "% tối đa " + formatPrice(voucher.maxDiscount);
        }

        if (voucher.discountType === "shipping") {
            return "Freeship tối đa " + formatPrice(voucher.maxDiscount);
        }

        return "Ưu đãi";
    }

    function formatVoucherCondition(voucher) {
        return "Đơn từ " + formatPrice(voucher.minOrderValue);
    }

    function getVoucherRemaining(voucher) {
        return Math.max(
            Number(voucher.totalQuantity || 0) - Number(voucher.claimedQuantity || 0),
            0
        );
    }

    function getVoucherClaimedPercent(voucher) {
        if (!voucher.totalQuantity || voucher.totalQuantity <= 0) {
            return 0;
        }

        return Math.min(
            Math.round((Number(voucher.claimedQuantity || 0) / Number(voucher.totalQuantity || 0)) * 100),
            100
        );
    }

    function getVoucherComparableValue(voucher) {
        if (voucher.discountType === "amount") {
            return Number(voucher.discountValue || 0);
        }

        if (voucher.discountType === "percent") {
            return Number(voucher.maxDiscount || 0);
        }

        if (voucher.discountType === "shipping") {
            return Number(voucher.maxDiscount || voucher.discountValue || 0);
        }

        return 0;
    }

    function isBigVoucherEnded() {
        return Date.now() >= getBigVoucherEndTime();
    }

    function isVoucherExpired(voucher) {
        return Date.now() >= Number(voucher.expiresAt || 0) || isBigVoucherEnded();
    }

    function showToast(message, type) {
        if (!voucherToastContainer) {
            alert(message);
            return;
        }

        const toast = document.createElement("div");

        toast.className = "voucherToast " + (type || "success");
        toast.textContent = message;

        voucherToastContainer.appendChild(toast);

        setTimeout(function () {
            toast.remove();
        }, 2600);
    }


    // 7. Đọc ghi localStorage
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


    // 8. Kiểm tra đăng nhập
    function getCurrentUser() {
        if (window.CustomerApi && typeof window.CustomerApi.getCurrentCustomerFromLocal === "function") {
            return window.CustomerApi.getCurrentCustomerFromLocal();
        }

        const isLogin = localStorage.getItem(IS_LOGIN_STORAGE_KEY) === "true";
        const currentUserData = localStorage.getItem(CURRENT_USER_STORAGE_KEY);

        if (!isLogin) {
            return null;
        }

        if (!currentUserData) {
            return {
                id: "member",
                fullName: "Thành viên"
            };
        }

        try {
            const parsedUser = JSON.parse(currentUserData);

            if (typeof parsedUser === "string") {
                return {
                    id: parsedUser,
                    fullName: parsedUser
                };
            }

            return parsedUser;
        } catch (error) {
            return {
                id: currentUserData,
                fullName: currentUserData
            };
        }
    }

    function isUserLoggedIn() {
        return Boolean(getCurrentUser());
    }

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

    function getCurrentUserName() {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            return "";
        }

        return (
            currentUser.fullName ||
            currentUser.name ||
            currentUser.username ||
            currentUser.email ||
            "thành viên"
        );
    }

    function getLoginRedirectUrl() {
        return "../html/login.html?redirect=" + encodeURIComponent("../html/big-voucher.html");
    }


    // 9. Lưu voucher theo từng tài khoản
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

    function getCurrentUserSavedVouchers() {
        const userKey = getCurrentUserKey();

        if (!userKey) {
            return [];
        }

        const savedMap = getSavedVoucherMap();
        const savedVouchers = savedMap[userKey];

        if (!Array.isArray(savedVouchers)) {
            return [];
        }

        return savedVouchers;
    }

    function saveCurrentUserVouchers(savedVouchers) {
        const userKey = getCurrentUserKey();

        if (!userKey) {
            return;
        }

        const savedMap = getSavedVoucherMap();

        savedMap[userKey] = savedVouchers;
        saveDataToStorage(SAVED_VOUCHERS_STORAGE_KEY, savedMap);
    }

    function isVoucherSaved(voucher) {
        const savedVouchers = getCurrentUserSavedVouchers();

        return savedVouchers.some(function (savedVoucher) {
            return (
                String(savedVoucher.id || "") === String(voucher.id || "") ||
                String(savedVoucher.code || "") === String(voucher.code || "")
            );
        });
    }

    function createSavedVoucherData(voucher) {
        return {
            id: voucher.id,
            code: voucher.code,
            title: voucher.title,
            name: voucher.title,
            description: voucher.description,

            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            maxDiscount: voucher.maxDiscount,

            minOrderValue: voucher.minOrderValue,
            minOrder: voucher.minOrderValue,

            expiry: formatDate(voucher.expiresAt),
            expiresAt: voucher.expiresAt,

            source: "big-voucher",
            used: false,
            savedAt: new Date().toISOString()
        };
    }

    function saveVoucher(voucher) {
        if (!isUserLoggedIn()) {
            showToast("Vui lòng đăng nhập để lưu Big Voucher.", "warning");

            setTimeout(function () {
                window.location.href = getLoginRedirectUrl();
            }, 900);

            return;
        }

        if (isVoucherExpired(voucher)) {
            showToast("Voucher này đã hết hạn.", "warning");
            return;
        }

        if (getVoucherRemaining(voucher) <= 0) {
            showToast("Voucher này đã hết lượt.", "warning");
            return;
        }

        if (isVoucherSaved(voucher)) {
            showToast("Voucher này đã được lưu trước đó.", "warning");
            return;
        }

        const savedVouchers = getCurrentUserSavedVouchers();

        savedVouchers.unshift(createSavedVoucherData(voucher));
        saveCurrentUserVouchers(savedVouchers);

        showToast("Đã lưu voucher " + voucher.code + ".", "success");

        renderPage();
        updateMemberNotice();
    }


    // 10. Dữ liệu fallback khi API chưa có voucher
    function createFallbackBigVoucherData() {
        const endTime = getStoredOrNewEndTime();
        const now = Date.now();

        return [
            {
                id: "big-50k",
                code: "BIG50K",
                type: "high-value",
                badge: "Giá trị cao",
                title: "Giảm 50.000đ",
                description: "Áp dụng cho đơn hàng từ 499.000đ. Phù hợp khi mua áo, quần hoặc phụ kiện.",
                discountType: "amount",
                discountValue: 50000,
                maxDiscount: 50000,
                minOrderValue: 499000,
                totalQuantity: 120,
                claimedQuantity: 76,
                createdAt: now - 5 * 24 * 60 * 60 * 1000,
                expiresAt: endTime
            },
            {
                id: "big-100k",
                code: "BIG100K",
                type: "high-value",
                badge: "Hiếm",
                title: "Giảm 100.000đ",
                description: "Voucher giá trị lớn cho đơn hàng từ 899.000đ. Số lượng mở rất hạn chế.",
                discountType: "amount",
                discountValue: 100000,
                maxDiscount: 100000,
                minOrderValue: 899000,
                totalQuantity: 60,
                claimedQuantity: 48,
                createdAt: now - 4 * 24 * 60 * 60 * 1000,
                expiresAt: endTime
            },
            {
                id: "big-150k",
                code: "BIG150K",
                type: "high-value",
                badge: "Siêu hiếm",
                title: "Giảm 150.000đ",
                description: "Ưu đãi đặc biệt cho đơn hàng từ 1.299.000đ. Dành cho khách hàng săn voucher sớm.",
                discountType: "amount",
                discountValue: 150000,
                maxDiscount: 150000,
                minOrderValue: 1299000,
                totalQuantity: 40,
                claimedQuantity: 34,
                createdAt: now - 3 * 24 * 60 * 60 * 1000,
                expiresAt: endTime
            },
            {
                id: "big-freeship",
                code: "BIGFREESHIP",
                type: "freeship",
                badge: "Freeship",
                title: "Miễn phí vận chuyển",
                description: "Giảm phí vận chuyển tối đa 30.000đ cho đơn hàng từ 299.000đ.",
                discountType: "shipping",
                discountValue: 30000,
                maxDiscount: 30000,
                minOrderValue: 299000,
                totalQuantity: 180,
                claimedQuantity: 92,
                createdAt: now - 2 * 24 * 60 * 60 * 1000,
                expiresAt: endTime
            },
            {
                id: "big-percent-10",
                code: "BIG10",
                type: "percent",
                badge: "Giảm %",
                title: "Giảm 10%",
                description: "Giảm 10% tối đa 80.000đ cho đơn hàng từ 599.000đ.",
                discountType: "percent",
                discountValue: 10,
                maxDiscount: 80000,
                minOrderValue: 599000,
                totalQuantity: 90,
                claimedQuantity: 64,
                createdAt: now - 1 * 24 * 60 * 60 * 1000,
                expiresAt: endTime
            },
            {
                id: "big-percent-15",
                code: "BIG15",
                type: "percent",
                badge: "Hot",
                title: "Giảm 15%",
                description: "Giảm 15% tối đa 150.000đ cho đơn hàng từ 999.000đ.",
                discountType: "percent",
                discountValue: 15,
                maxDiscount: 150000,
                minOrderValue: 999000,
                totalQuantity: 50,
                claimedQuantity: 43,
                createdAt: now,
                expiresAt: endTime
            }
        ];
    }


    // 11. Chuẩn hóa voucher từ API
    function normalizeDiscountType(type) {
        if (type === "fixed" || type === "amount") {
            return "amount";
        }

        if (type === "freeship" || type === "shipping") {
            return "shipping";
        }

        if (type === "percent") {
            return "percent";
        }

        return "amount";
    }

    function getVoucherType(voucher) {
        if (voucher.discountType === "shipping") {
            return "freeship";
        }

        if (voucher.discountType === "percent") {
            return "percent";
        }

        if (getVoucherComparableValue(voucher) >= 50000) {
            return "high-value";
        }

        return "normal";
    }

    function getVoucherBadge(voucher) {
        if (voucher.discountType === "shipping") {
            return "Freeship";
        }

        if (voucher.discountType === "percent") {
            return "Giảm %";
        }

        if (getVoucherComparableValue(voucher) >= 100000) {
            return "Hiếm";
        }

        if (getVoucherComparableValue(voucher) >= 50000) {
            return "Giá trị cao";
        }

        return "Voucher";
    }

    function normalizeVoucherFromApi(apiVoucher) {
        const discountType = normalizeDiscountType(apiVoucher.discount_type || apiVoucher.discountType);
        const discountValue = Number(apiVoucher.discount_value || apiVoucher.discountValue || 0);
        const maxDiscount = Number(
            apiVoucher.max_discount_amount ||
            apiVoucher.maxDiscount ||
            apiVoucher.max_discount ||
            discountValue ||
            0
        );

        const totalQuantity = Number(
            apiVoucher.usage_limit ||
            apiVoucher.total_quantity ||
            apiVoucher.totalQuantity ||
            100
        );

        let claimedQuantity = Number(
            apiVoucher.used_count ||
            apiVoucher.used_quantity ||
            apiVoucher.claimedQuantity ||
            0
        );

        if (apiVoucher.remaining_quantity !== undefined && apiVoucher.remaining_quantity !== null) {
            claimedQuantity = Math.max(totalQuantity - Number(apiVoucher.remaining_quantity || 0), 0);
        }

        const endTime = apiVoucher.end_date
            ? new Date(apiVoucher.end_date).getTime()
            : getStoredOrNewEndTime();

        const startTime = apiVoucher.start_date
            ? new Date(apiVoucher.start_date).getTime()
            : Date.now();

        const voucher = {
            id: String(apiVoucher.id || apiVoucher.code || ""),
            code: apiVoucher.code || "",
            type: "",
            badge: "",

            title: apiVoucher.name || apiVoucher.title || apiVoucher.code || "Voucher",
            description: apiVoucher.description || "Ưu đãi đặc biệt dành cho khách hàng.",

            discountType: discountType,
            discountValue: discountValue,
            maxDiscount: maxDiscount,

            minOrderValue: Number(
                apiVoucher.min_order_value ||
                apiVoucher.minOrderValue ||
                apiVoucher.min_order ||
                0
            ),

            totalQuantity: totalQuantity,
            claimedQuantity: claimedQuantity,

            createdAt: startTime,
            expiresAt: endTime,

            raw: apiVoucher
        };

        voucher.type = getVoucherType(voucher);
        voucher.badge = getVoucherBadge(voucher);

        return voucher;
    }


    // 12. Load voucher từ API
    async function loadBigVouchersFromApi() {
        try {
            const response = await getApi("vouchers/get-vouchers.php?page=1&limit=100&available_only=1&sort=end_soon");
            const data = response.data || {};
            const apiVouchers = Array.isArray(data.vouchers) ? data.vouchers : [];

            const normalizedVouchers = apiVouchers
                .map(normalizeVoucherFromApi)
                .filter(function (voucher) {
                    return voucher.code && getVoucherComparableValue(voucher) > 0;
                });

            if (normalizedVouchers.length > 0) {
                bigVouchers = normalizedVouchers;
                return;
            }

            bigVouchers = createFallbackBigVoucherData();
        } catch (error) {
            console.warn("Không tải được voucher từ API, dùng dữ liệu fallback:", error);
            bigVouchers = createFallbackBigVoucherData();
        }
    }


    // 13. Countdown Big Voucher
    function updateCountdown() {
        const endTime = getBigVoucherEndTime();
        const distance = Math.max(endTime - Date.now(), 0);

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((distance / (1000 * 60)) % 60);
        const seconds = Math.floor((distance / 1000) % 60);

        if (countdownDays) countdownDays.textContent = String(days).padStart(2, "0");
        if (countdownHours) countdownHours.textContent = String(hours).padStart(2, "0");
        if (countdownMinutes) countdownMinutes.textContent = String(minutes).padStart(2, "0");
        if (countdownSeconds) countdownSeconds.textContent = String(seconds).padStart(2, "0");

        bigVoucherPage.classList.toggle("is-ended", distance <= 0);
    }

    function startCountdown() {
        updateCountdown();

        countdownTimer = setInterval(function () {
            const wasEnded = bigVoucherPage.classList.contains("is-ended");

            updateCountdown();

            const isEndedNow = bigVoucherPage.classList.contains("is-ended");

            if (wasEnded !== isEndedNow) {
                renderPage();
            }
        }, 1000);
    }


    // 14. Cập nhật thông tin thành viên
    function updateMemberNotice() {
        if (!memberNotice) {
            return;
        }

        if (!isUserLoggedIn()) {
            memberNotice.textContent = "Đăng nhập để lưu và sử dụng Big Voucher khi thanh toán.";
            memberNotice.classList.remove("isLogin");
            return;
        }

        const savedCount = getCurrentUserSavedVouchers().length;
        const userName = getCurrentUserName();

        memberNotice.textContent =
            "Xin chào " +
            userName +
            ", bạn đang có " +
            savedCount +
            " voucher đã lưu.";

        memberNotice.classList.add("isLogin");
    }

    function updateHighlightVoucher() {
        if (!highlightVoucherText || !highlightVoucherSubtext) {
            return;
        }

        const bestVoucher = [...bigVouchers].sort(function (a, b) {
            return getVoucherComparableValue(b) - getVoucherComparableValue(a);
        })[0];

        if (!bestVoucher) {
            highlightVoucherText.textContent = "---";
            highlightVoucherSubtext.textContent = "Chưa có voucher nổi bật";
            return;
        }

        highlightVoucherText.textContent = bestVoucher.code;
        highlightVoucherSubtext.textContent = formatVoucherValue(bestVoucher);
    }


    // 15. Lọc voucher
    function filterVouchersByTab(vouchers, filterValue) {
        if (filterValue === "all") {
            return vouchers;
        }

        if (filterValue === "limited") {
            return vouchers.filter(function (voucher) {
                const remaining = getVoucherRemaining(voucher);

                return remaining > 0 && remaining <= Math.ceil(Number(voucher.totalQuantity || 0) * 0.25);
            });
        }

        if (filterValue === "high-value") {
            return vouchers.filter(function (voucher) {
                return voucher.type === "high-value" || getVoucherComparableValue(voucher) >= 50000;
            });
        }

        return vouchers.filter(function (voucher) {
            return voucher.type === filterValue || voucher.discountType === filterValue;
        });
    }

    function filterVouchersByKeyword(vouchers, keyword) {
        if (!keyword.trim()) {
            return vouchers;
        }

        const normalizedKeyword = keyword.trim().toLowerCase();

        return vouchers.filter(function (voucher) {
            return (
                voucher.code.toLowerCase().includes(normalizedKeyword) ||
                voucher.title.toLowerCase().includes(normalizedKeyword) ||
                voucher.description.toLowerCase().includes(normalizedKeyword)
            );
        });
    }


    // 16. Sắp xếp voucher
    function sortVouchers(vouchers, sortValue) {
        const clonedVouchers = [...vouchers];

        if (sortValue === "value-desc") {
            clonedVouchers.sort(function (a, b) {
                return getVoucherComparableValue(b) - getVoucherComparableValue(a);
            });
        }

        if (sortValue === "ending-soon") {
            clonedVouchers.sort(function (a, b) {
                return Number(a.expiresAt || 0) - Number(b.expiresAt || 0);
            });
        }

        if (sortValue === "limited-first") {
            clonedVouchers.sort(function (a, b) {
                return getVoucherRemaining(a) - getVoucherRemaining(b);
            });
        }

        if (sortValue === "newest") {
            clonedVouchers.sort(function (a, b) {
                return Number(b.createdAt || 0) - Number(a.createdAt || 0);
            });
        }

        return clonedVouchers;
    }

    function getFilteredAndSortedVouchers() {
        let vouchers = [...bigVouchers];

        vouchers = filterVouchersByTab(vouchers, currentFilter);
        vouchers = filterVouchersByKeyword(vouchers, currentKeyword);
        vouchers = sortVouchers(vouchers, currentSort);

        return vouchers;
    }


    // 17. Hiển thị trạng thái
    function showState(type) {
        bigVoucherLoadingState?.classList.remove("show");
        bigVoucherEmptyState?.classList.remove("show");
        bigVoucherErrorState?.classList.remove("show");

        if (bigVoucherLoadingState) bigVoucherLoadingState.hidden = true;
        if (bigVoucherEmptyState) bigVoucherEmptyState.hidden = true;
        if (bigVoucherErrorState) bigVoucherErrorState.hidden = true;

        if (type === "loading" && bigVoucherLoadingState) {
            bigVoucherLoadingState.hidden = false;
            bigVoucherLoadingState.classList.add("show");
        }

        if (type === "empty" && bigVoucherEmptyState) {
            bigVoucherEmptyState.hidden = false;
            bigVoucherEmptyState.classList.add("show");
        }

        if (type === "error" && bigVoucherErrorState) {
            bigVoucherErrorState.hidden = false;
            bigVoucherErrorState.classList.add("show");
        }
    }

    function updateResultCount(count) {
        if (bigVoucherResultCount) {
            bigVoucherResultCount.textContent = "Hiển thị " + count + " voucher đặc biệt";
        }
    }

    function clearVoucherList() {
        if (bigVoucherList) {
            bigVoucherList.innerHTML = "";
        }
    }


    // 18. Tạo card voucher
    function getVoucherButtonState(voucher) {
        if (isVoucherExpired(voucher)) {
            return {
                text: "Hết hạn",
                status: "expired",
                disabled: true
            };
        }

        if (getVoucherRemaining(voucher) <= 0) {
            return {
                text: "Hết lượt",
                status: "sold-out",
                disabled: true
            };
        }

        if (isUserLoggedIn() && isVoucherSaved(voucher)) {
            return {
                text: "Đã lưu",
                status: "saved",
                disabled: true
            };
        }

        if (!isUserLoggedIn()) {
            return {
                text: "Đăng nhập để lưu",
                status: "login-required",
                disabled: false
            };
        }

        return {
            text: "Săn ngay",
            status: "available",
            disabled: false
        };
    }

    function createVoucherCard(voucher) {
        if (!bigVoucherTemplate) {
            return null;
        }

        const clone = bigVoucherTemplate.content.cloneNode(true);

        const voucherCard = clone.querySelector(".bigVoucherCard");
        const voucherBadge = clone.querySelector('[data-role="voucher-badge"]');
        const voucherLimit = clone.querySelector('[data-role="voucher-limit"]');
        const voucherCode = clone.querySelector('[data-role="voucher-code"]');
        const voucherTitle = clone.querySelector('[data-role="voucher-title"]');
        const voucherDescription = clone.querySelector('[data-role="voucher-description"]');
        const voucherValue = clone.querySelector('[data-role="voucher-value"]');
        const voucherCondition = clone.querySelector('[data-role="voucher-condition"]');
        const voucherExpiry = clone.querySelector('[data-role="voucher-expiry"]');
        const voucherClaimedText = clone.querySelector('[data-role="voucher-claimed-text"]');
        const voucherStockText = clone.querySelector('[data-role="voucher-stock-text"]');
        const voucherProgress = clone.querySelector('[data-role="voucher-progress"]');
        const voucherAction = clone.querySelector('[data-role="voucher-action"]');

        const remaining = getVoucherRemaining(voucher);
        const claimedPercent = getVoucherClaimedPercent(voucher);
        const buttonState = getVoucherButtonState(voucher);

        if (voucherCard) {
            voucherCard.dataset.voucherId = voucher.id;
            voucherCard.dataset.voucherCode = voucher.code;
            voucherCard.classList.toggle("isSaved", buttonState.status === "saved");
            voucherCard.classList.toggle("isExpired", buttonState.status === "expired");
            voucherCard.classList.toggle("isSoldOut", buttonState.status === "sold-out");
        }

        if (voucherBadge) {
            voucherBadge.textContent = voucher.badge;
        }

        if (voucherLimit) {
            voucherLimit.textContent = "Còn " + remaining + " lượt";
        }

        if (voucherCode) {
            voucherCode.textContent = voucher.code;
        }

        if (voucherTitle) {
            voucherTitle.textContent = voucher.title;
        }

        if (voucherDescription) {
            voucherDescription.textContent = voucher.description;
        }

        if (voucherValue) {
            voucherValue.textContent = formatVoucherValue(voucher);
        }

        if (voucherCondition) {
            voucherCondition.textContent = formatVoucherCondition(voucher);
        }

        if (voucherExpiry) {
            voucherExpiry.textContent = formatDate(voucher.expiresAt);
        }

        if (voucherClaimedText) {
            voucherClaimedText.textContent = "Đã săn " + claimedPercent + "%";
        }

        if (voucherStockText) {
            voucherStockText.textContent = "Còn lại " + remaining + " lượt";
        }

        if (voucherProgress) {
            voucherProgress.style.width = claimedPercent + "%";
        }

        if (voucherAction) {
            voucherAction.textContent = buttonState.text;
            voucherAction.dataset.voucherId = voucher.id;
            voucherAction.dataset.status = buttonState.status;
            voucherAction.disabled = buttonState.disabled;
        }

        return clone;
    }


    // 19. Render voucher
    function renderVouchers(vouchers) {
        clearVoucherList();
        updateResultCount(vouchers.length);

        if (!vouchers.length) {
            showState("empty");
            return;
        }

        showState("");

        const fragment = document.createDocumentFragment();

        vouchers.forEach(function (voucher) {
            const voucherCard = createVoucherCard(voucher);

            if (voucherCard) {
                fragment.appendChild(voucherCard);
            }
        });

        if (bigVoucherList) {
            bigVoucherList.appendChild(fragment);
        }
    }

    function renderPage() {
        try {
            const vouchers = getFilteredAndSortedVouchers();

            renderVouchers(vouchers);
            updateMemberNotice();
            updateHighlightVoucher();
        } catch (error) {
            console.error("Lỗi render Big Voucher:", error);

            clearVoucherList();
            updateResultCount(0);
            showState("error");
        }
    }


    // 20. Xử lý filter
    function handleFilterClick(event) {
        const tab = event.target.closest(".voucherTab");

        if (!tab) {
            return;
        }

        currentFilter = tab.dataset.filter || "all";

        bigVoucherFilterBar.querySelectorAll(".voucherTab").forEach(function (item) {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        renderPage();
    }


    // 21. Xử lý sort
    function handleSortChange() {
        currentSort = bigVoucherSort.value || "default";

        renderPage();
    }


    // 22. Xử lý tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeywordInput ? searchKeywordInput.value.trim() : "";

        if (!keyword) {
            showToast("Vui lòng nhập từ khóa tìm kiếm.", "warning");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 23. Xử lý săn voucher
    function handleVoucherListClick(event) {
        const actionButton = event.target.closest('[data-role="voucher-action"]');

        if (!actionButton) {
            return;
        }

        const voucherId = actionButton.dataset.voucherId;

        if (!voucherId) {
            return;
        }

        const voucher = bigVouchers.find(function (item) {
            return String(item.id) === String(voucherId);
        });

        if (!voucher) {
            showToast("Không tìm thấy voucher.", "error");
            return;
        }

        saveVoucher(voucher);
    }


    // 24. Gắn sự kiện
    function bindEvents() {
        if (bigVoucherFilterBar) {
            bigVoucherFilterBar.addEventListener("click", handleFilterClick);
        }

        if (bigVoucherSort) {
            bigVoucherSort.addEventListener("change", handleSortChange);
        }

        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }

        if (bigVoucherList) {
            bigVoucherList.addEventListener("click", handleVoucherListClick);
        }
    }


    // 25. Khởi tạo trang
    async function initBigVoucherPage() {
        bindEvents();

        showState("loading");
        clearVoucherList();
        updateResultCount(0);
        updateMemberNotice();

        await loadBigVouchersFromApi();

        updateHighlightVoucher();
        startCountdown();

        setTimeout(function () {
            renderPage();
        }, 300);
    }

    initBigVoucherPage();


    // 26. Dọn interval khi rời trang
    window.addEventListener("beforeunload", function () {
        if (countdownTimer) {
            clearInterval(countdownTimer);
        }
    });
});