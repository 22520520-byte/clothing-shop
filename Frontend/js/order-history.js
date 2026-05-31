// 1. Chờ HTML tải xong

document.addEventListener("DOMContentLoaded", function () {
    const orderHistoryPage = document.querySelector('[data-page="order-history"]');

    if (!orderHistoryPage) {
        return;
    }

    // 2. Key localStorage

    const ORDERS_STORAGE_KEY = "orders";
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const IS_LOGIN_STORAGE_KEY = "is_login";
    const USERS_STORAGE_KEY = "users";
    const USER_POINTS_STORAGE_KEY = "user_points";

    // 3. Trạng thái lịch sử

    const HISTORY_STATUS_TEXTS = [
        "Hoàn thành",
        "Đã hủy",
        "Trả hàng"
    ];

    const HISTORY_STATUS_CODES = [
        "completed",
        "cancelled",
        "returned"
    ];

    // 4. Biến trạng thái

    let currentUser = null;
    let fullCurrentUser = null;
    let historyOrders = [];
    let filteredHistoryOrders = [];

    // 5. Lấy DOM sidebar

    const profileUserName = document.getElementById("profileUserName");
    const profileUserRank = document.getElementById("profileUserRank");
    const logoutBtn = document.getElementById("logoutBtn");

    // 6. Lấy DOM trạng thái trang

    const orderHistoryLoadingState = document.getElementById("orderHistoryLoadingState");
    const orderHistoryEmptyState = document.getElementById("orderHistoryEmptyState");
    const orderHistoryErrorState = document.getElementById("orderHistoryErrorState");
    const orderHistoryContent = document.getElementById("orderHistoryContent");

    // 7. Lấy DOM lịch sử

    const historyOrderCount = document.getElementById("historyOrderCount");
    const historyStatusFilter = document.getElementById("historyStatusFilter");
    const orderHistoryList = document.getElementById("orderHistoryList");
    const orderHistoryRowTemplate = document.getElementById("orderHistoryRowTemplate");

    // 8. Lấy DOM tìm kiếm

    const searchForm = document.getElementById("searchForm");
    const searchKeyword = document.getElementById("searchKeyword");

    // 9. Hàm tiện ích

    function formatPrice(price) {
        return Number(price || 0).toLocaleString("vi-VN") + "đ";
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

    function getOrderDetailUrl(orderId) {
        return "../html/order-detail.html?id=" + encodeURIComponent(orderId || "");
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

    function getArrayFromStorage(key) {
        const data = getDataFromStorage(key, []);

        if (!Array.isArray(data)) {
            return [];
        }

        return data;
    }

    // 11. Kiểm tra đăng nhập

    function getCurrentUser() {
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
        const user = currentUser || getCurrentUser();

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

    function getUsersFromStorage() {
        return getArrayFromStorage(USERS_STORAGE_KEY);
    }

    function getFullCurrentUser() {
        const users = getUsersFromStorage();

        if (!currentUser) {
            return null;
        }

        const foundUser = users.find(function (user) {
            return (
                user.id === currentUser.id ||
                user.userId === currentUser.userId ||
                user.email === currentUser.email ||
                user.phone === currentUser.phone ||
                user.username === currentUser.username
            );
        });

        return foundUser || currentUser;
    }

    // 12. Điểm và hạng thành viên

    function getUserPointMap() {
        const pointMap = getDataFromStorage(USER_POINTS_STORAGE_KEY, {});

        if (!pointMap || typeof pointMap !== "object" || Array.isArray(pointMap)) {
            return {};
        }

        return pointMap;
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

        if (typeof fullCurrentUser?.points === "number") {
            return fullCurrentUser.points;
        }

        if (typeof currentUser?.points === "number") {
            return currentUser.points;
        }

        return 0;
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

    // 13. Chuẩn hóa đơn hàng

    function getOrderId(order) {
        if (!order) {
            return "";
        }

        return order.orderId || order.id || "";
    }

    function getOrderStatusText(order) {
        if (!order) {
            return "---";
        }

        const statusText = order.statusText || order.statusName || "";
        const statusCode = String(order.status || "").toLowerCase();

        if (statusText) {
            return statusText;
        }

        if (statusCode === "completed") {
            return "Hoàn thành";
        }

        if (statusCode === "cancelled") {
            return "Đã hủy";
        }

        if (statusCode === "returned") {
            return "Trả hàng";
        }

        return order.status || "Chờ xác nhận";
    }

    function getStatusClass(order) {
        const statusText = getOrderStatusText(order);
        const statusCode = String(order.status || "").toLowerCase();

        if (statusText === "Hoàn thành" || statusCode === "completed") {
            return "completed";
        }

        if (statusText === "Đã hủy" || statusCode === "cancelled") {
            return "cancelled";
        }

        if (statusText === "Trả hàng" || statusCode === "returned") {
            return "cancelled";
        }

        return "processing";
    }

    function getOrderItems(order) {
        if (!order) {
            return [];
        }

        if (Array.isArray(order.items)) {
            return order.items;
        }

        if (Array.isArray(order.products)) {
            return order.products;
        }

        return [];
    }

    function calculateSubtotal(items) {
        return items.reduce(function (total, item) {
            return total + Number(item.price || item.currentPrice || 0) * Number(item.quantity || item.qty || 0);
        }, 0);
    }

    function getOrderSummary(order) {
        const items = getOrderItems(order);
        const summary = order.summary || {};
        const benefits = order.benefits || {};

        const pointBenefit = benefits.point || null;
        const voucherBenefit = benefits.voucher || null;

        const subtotal = Number(
            summary.subtotal ??
            order.subtotal ??
            order.subtotalAmount ??
            calculateSubtotal(items)
        );

        const shippingFee = Number(
            summary.shippingFee ??
            order.shippingFee ??
            order.shipping?.fee ??
            order.shippingInfo?.fee ??
            0
        );

        const pointDiscount = Number(
            summary.pointDiscount ??
            order.pointDiscount ??
            order.pointDiscountAmount ??
            pointBenefit?.discountAmount ??
            0
        );

        const voucherDiscount = Number(
            summary.voucherDiscount ??
            order.voucherDiscount ??
            voucherBenefit?.discountAmount ??
            getOldVoucherDiscount(order)
        );

        const discountTotal = Number(
            summary.discountTotal ??
            order.discountTotal ??
            order.discount ??
            order.discountAmount ??
            pointDiscount + voucherDiscount
        );

        const total = Number(
            summary.total ??
            order.total ??
            order.totalAmount ??
            Math.max(subtotal + shippingFee - discountTotal, 0)
        );

        return {
            subtotal: subtotal,
            shippingFee: shippingFee,
            pointDiscount: pointDiscount,
            voucherDiscount: voucherDiscount,
            discountTotal: discountTotal,
            total: total
        };
    }

    function getOldVoucherDiscount(order) {
        const totalDiscount = Number(order.discountAmount || 0);
        const pointDiscount = Number(order.pointDiscountAmount || 0);

        return Math.max(totalDiscount - pointDiscount, 0);
    }

    function getOrderCreatedTime(order) {
        return (
            order.completedAt ||
            order.receivedAt ||
            order.cancelledAt ||
            order.returnedAt ||
            order.createdAt ||
            order.orderDate ||
            ""
        );
    }

    // 14. Kiểm tra đơn thuộc user hiện tại

    function isCurrentUserOrder(order) {
        const userKey = getCurrentUserKey();

        if (!currentUser || !userKey) {
            return false;
        }

        if (order.userKey && order.userKey === userKey) {
            return true;
        }

        if (order.userId && order.userId === userKey) {
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

    function isHistoryOrder(order) {
        const statusText = getOrderStatusText(order);
        const statusCode = String(order.status || "").toLowerCase();

        return (
            HISTORY_STATUS_TEXTS.includes(statusText) ||
            HISTORY_STATUS_CODES.includes(statusCode)
        );
    }

    function getHistoryOrders() {
        const orders = getArrayFromStorage(ORDERS_STORAGE_KEY);

        return orders
            .filter(isCurrentUserOrder)
            .filter(isHistoryOrder)
            .sort(function (a, b) {
                return new Date(getOrderCreatedTime(b)).getTime() - new Date(getOrderCreatedTime(a)).getTime();
            });
    }

    // 15. Hiển thị trạng thái trang

    function showPageState(type) {
        if (orderHistoryLoadingState) orderHistoryLoadingState.hidden = true;
        if (orderHistoryEmptyState) orderHistoryEmptyState.hidden = true;
        if (orderHistoryErrorState) orderHistoryErrorState.hidden = true;
        if (orderHistoryContent) orderHistoryContent.hidden = true;

        if (type === "loading" && orderHistoryLoadingState) {
            orderHistoryLoadingState.hidden = false;
        }

        if (type === "empty" && orderHistoryEmptyState) {
            orderHistoryEmptyState.hidden = false;
        }

        if (type === "error" && orderHistoryErrorState) {
            orderHistoryErrorState.hidden = false;
        }

        if (type === "content" && orderHistoryContent) {
            orderHistoryContent.hidden = false;
        }
    }

    function updateEmptyMessageForGuest() {
        if (isUserLoggedIn()) {
            return;
        }

        const emptyTitle = orderHistoryEmptyState?.querySelector("h3");
        const emptyDesc = orderHistoryEmptyState?.querySelector("p");
        const emptyLink = orderHistoryEmptyState?.querySelector("a");

        if (emptyTitle) {
            emptyTitle.textContent = "Vui lòng đăng nhập để xem lịch sử mua hàng";
        }

        if (emptyDesc) {
            emptyDesc.textContent = "Trang lịch sử mua hàng chỉ hiển thị đơn hàng của tài khoản thành viên.";
        }

        if (emptyLink) {
            emptyLink.textContent = "Đăng nhập ngay";
            emptyLink.href = "../html/login.html";
        }
    }

    // 16. Render sidebar

    function renderUserBox() {
        if (profileUserName) {
            profileUserName.textContent = getDisplayName(fullCurrentUser);
        }

        if (profileUserRank) {
            if (currentUser) {
                profileUserRank.textContent = getRankNameByPoints(getCurrentUserPoints());
            } else {
                profileUserRank.textContent = "Chưa đăng nhập";
            }
        }
    }

    // 17. Lọc lịch sử theo trạng thái

    function filterOrdersBySelectedStatus() {
        const selectedStatus = historyStatusFilter?.value || "all";

        if (selectedStatus === "all") {
            filteredHistoryOrders = [...historyOrders];
            return;
        }

        filteredHistoryOrders = historyOrders.filter(function (order) {
            return getOrderStatusText(order) === selectedStatus;
        });
    }

    // 18. Render bảng lịch sử

    function createEmptyFilterRow() {
        const row = document.createElement("div");

        row.className = "orderRow emptyFilterRow";
        row.innerHTML = `
            <div>Không có đơn hàng nào phù hợp với bộ lọc hiện tại.</div>
        `;

        return row;
    }

    function createOrderHistoryRow(order) {
        if (!orderHistoryRowTemplate) {
            return null;
        }

        const clone = orderHistoryRowTemplate.content.cloneNode(true);

        const orderRow = clone.querySelector(".orderRow");
        const orderCode = clone.querySelector('[data-role="order-code"]');
        const orderDate = clone.querySelector('[data-role="order-date"]');
        const orderStatus = clone.querySelector('[data-role="order-status"]');
        const orderTotal = clone.querySelector('[data-role="order-total"]');
        const orderDetailLink = clone.querySelector('[data-role="order-detail-link"]');

        const orderId = getOrderId(order);
        const statusText = getOrderStatusText(order);
        const summary = getOrderSummary(order);

        if (orderRow) {
            orderRow.dataset.orderId = orderId;
        }

        if (orderCode) {
            orderCode.textContent = orderId || "---";
        }

        if (orderDate) {
            orderDate.textContent = formatDateTime(order.createdAt || order.orderDate);
        }

        if (orderStatus) {
            orderStatus.textContent = statusText;
            orderStatus.className = "orderStatus " + getStatusClass(order);
        }

        if (orderTotal) {
            orderTotal.textContent = formatPrice(summary.total);
        }

        if (orderDetailLink) {
            orderDetailLink.href = getOrderDetailUrl(orderId);
        }

        return clone;
    }

    function renderHistoryOrderCount() {
        if (historyOrderCount) {
            historyOrderCount.textContent = historyOrders.length;
        }
    }

    function renderOrderHistoryRows() {
        if (!orderHistoryList) {
            return;
        }

        orderHistoryList.innerHTML = "";

        if (filteredHistoryOrders.length === 0) {
            orderHistoryList.appendChild(createEmptyFilterRow());
            return;
        }

        const fragment = document.createDocumentFragment();

        filteredHistoryOrders.forEach(function (order) {
            const row = createOrderHistoryRow(order);

            if (row) {
                fragment.appendChild(row);
            }
        });

        orderHistoryList.appendChild(fragment);
    }

    function renderOrderHistoryPage() {
        renderUserBox();
        updateEmptyMessageForGuest();

        if (!isUserLoggedIn()) {
            historyOrders = [];
            filteredHistoryOrders = [];
            renderHistoryOrderCount();
            showPageState("empty");
            return;
        }

        historyOrders = getHistoryOrders();

        if (historyOrders.length === 0) {
            renderHistoryOrderCount();
            showPageState("empty");
            return;
        }

        filterOrdersBySelectedStatus();
        renderHistoryOrderCount();
        renderOrderHistoryRows();
        showPageState("content");
    }

    // 19. Xử lý đăng xuất

    function handleLogout() {
        const confirmLogout = confirm("Bạn có chắc muốn đăng xuất không?");

        if (!confirmLogout) {
            return;
        }

        localStorage.setItem(IS_LOGIN_STORAGE_KEY, "false");
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);

        window.location.href = "../html/login.html";
    }

    // 20. Xử lý tìm kiếm

    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword?.value.trim() || "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }

    // 21. Gắn sự kiện

    function bindEvents() {
        historyStatusFilter?.addEventListener("change", function () {
            filterOrdersBySelectedStatus();
            renderOrderHistoryRows();
        });

        logoutBtn?.addEventListener("click", handleLogout);
        searchForm?.addEventListener("submit", handleSearchSubmit);
    }

    // 22. Khởi tạo trang

    function initOrderHistoryPage() {
        showPageState("loading");

        try {
            currentUser = getCurrentUser();
            fullCurrentUser = getFullCurrentUser();

            bindEvents();

            setTimeout(function () {
                renderOrderHistoryPage();
            }, 250);
        } catch (error) {
            console.error("Lỗi order-history:", error);
            showPageState("error");
        }
    }

    initOrderHistoryPage();
});