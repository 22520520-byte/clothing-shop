// =========================================================
// File: Frontend/js/my-order.js
// Mục đích: Trang đơn hàng của tôi lấy dữ liệu thật từ API
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang đơn hàng của tôi
    const myOrderPage = document.querySelector('[data-page="my-order"], .myOrderPage, .profilePage');

    if (!myOrderPage) {
        return;
    }


    // 2. Key localStorage
    const ORDERS_STORAGE_KEY = "orders";
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const IS_LOGIN_STORAGE_KEY = "is_login";


    // 3. Biến trạng thái
    let currentUser = null;
    let allOrders = [];
    let currentStatusFilter = "all";


    // 4. Lấy DOM tìm kiếm
    const searchForm = document.getElementById("searchForm");
    const searchKeyword = document.getElementById("searchKeyword");


    // 5. Lấy DOM thông tin sidebar/profile
    const profileUserName = document.getElementById("profileUserName");
    const profileUserEmail = document.getElementById("profileUserEmail");
    const profileUserAvatar = document.getElementById("profileUserAvatar");


    // 6. Lấy DOM danh sách đơn hàng
    const orderTableBody = document.getElementById("orderTableBody");
    const orderHistoryRowTemplate =
        document.getElementById("orderHistoryRowTemplate") ||
        document.getElementById("myOrderRowTemplate") ||
        document.getElementById("orderRowTemplate");

    const emptyOrderText =
        document.getElementById("emptyOrderText") ||
        document.getElementById("emptyMyOrderText") ||
        document.getElementById("orderEmptyState");

    const orderLoadingState =
        document.getElementById("orderLoadingState") ||
        document.getElementById("myOrderLoadingState");

    const orderErrorState =
        document.getElementById("orderErrorState") ||
        document.getElementById("myOrderErrorState");


    // 7. Lấy DOM bộ lọc trạng thái
    const orderStatusTabs = document.querySelectorAll("[data-order-status]");
    const orderStatusFilter = document.getElementById("orderStatusFilter");


    // 8. Gọi API GET
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


    // 9. Hàm tiện ích
    function formatPrice(price) {
        if (window.CustomerApi && typeof window.CustomerApi.formatPrice === "function") {
            return window.CustomerApi.formatPrice(price);
        }

        return Number(price || 0).toLocaleString("vi-VN") + "đ";
    }

    function formatDateTime(value) {
        if (!value) {
            return "--/--/----";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    function getFirstLetter(text) {
        if (!text) {
            return "K";
        }

        return String(text).trim().charAt(0).toUpperCase();
    }

    function getOrderDetailUrl(order) {
        const orderId = order.id || order.orderId || order.orderCode || order.order_code || "";

        return "../html/order-detail.html?id=" + encodeURIComponent(orderId);
    }

    function getProductDetailUrl(productId) {
        if (!productId) {
            return "#";
        }

        return "../html/product-detail.html?id=" + encodeURIComponent(productId);
    }


    // 10. Đọc localStorage
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

    function getOrdersFromStorage() {
        const orders = getDataFromStorage(ORDERS_STORAGE_KEY, []);

        if (!Array.isArray(orders)) {
            return [];
        }

        return orders;
    }


    // 11. Lấy user hiện tại
    function getCurrentUserLocal() {
        if (window.CustomerApi && typeof window.CustomerApi.getCurrentCustomerFromLocal === "function") {
            return window.CustomerApi.getCurrentCustomerFromLocal();
        }

        const isLogin = localStorage.getItem(IS_LOGIN_STORAGE_KEY) === "true";
        const userData = getDataFromStorage(CURRENT_USER_STORAGE_KEY, null);

        if (!isLogin || !userData) {
            return null;
        }

        return userData;
    }

    async function requireLogin() {
        if (!window.CustomerApi) {
            currentUser = getCurrentUserLocal();
            return Boolean(currentUser);
        }

        const localUser = window.CustomerApi.getCurrentCustomerFromLocal();

        if (!localUser) {
            const redirectUrl = encodeURIComponent(window.location.href);
            window.location.href = "../html/login.html?redirect=" + redirectUrl;
            return false;
        }

        try {
            currentUser = await window.CustomerApi.getCurrentCustomerFromSession();
            return true;
        } catch (error) {
            window.CustomerApi.clearCustomerLocalAuth();

            const redirectUrl = encodeURIComponent(window.location.href);
            window.location.href = "../html/login.html?redirect=" + redirectUrl;

            return false;
        }
    }

    function getCurrentUserKey() {
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


    // 12. Render thông tin user
    function renderCurrentUserInfo() {
        if (!currentUser) {
            return;
        }

        const fullName =
            currentUser.fullName ||
            currentUser.full_name ||
            currentUser.name ||
            "Khách hàng";

        const email = currentUser.email || currentUser.phone || "";

        if (profileUserName) {
            profileUserName.textContent = fullName;
        }

        if (profileUserEmail) {
            profileUserEmail.textContent = email;
        }

        if (profileUserAvatar) {
            profileUserAvatar.textContent = getFirstLetter(fullName);
        }
    }


    // 13. Lấy trạng thái đơn hàng
    function getStatusInfo(status) {
        if (status === "pending") {
            return {
                text: "Chờ xác nhận",
                className: "statusPending"
            };
        }

        if (status === "confirmed") {
            return {
                text: "Đã xác nhận",
                className: "statusShipping"
            };
        }

        if (status === "shipping") {
            return {
                text: "Đang giao",
                className: "statusShipping"
            };
        }

        if (status === "completed") {
            return {
                text: "Hoàn thành",
                className: "statusCompleted"
            };
        }

        if (status === "cancelled") {
            return {
                text: "Đã hủy",
                className: "statusCancelled"
            };
        }

        return {
            text: "Chờ xác nhận",
            className: "statusPending"
        };
    }

    function getOrderStatus(order) {
        if (order.status && order.status.code) {
            return order.status.code;
        }

        return order.status || order.order_status || "pending";
    }

    function getOrderStatusLabel(order) {
        if (order.status && order.status.label) {
            return order.status.label;
        }

        return order.statusText || getStatusInfo(getOrderStatus(order)).text;
    }


    // 14. Lấy dữ liệu tiền
    function getOrderMoney(order) {
        const summary = order.summary || {};
        const money = order.money || {};

        return {
            subtotal: Number(summary.subtotal ?? money.total_product_price ?? 0),
            shippingFee: Number(summary.shippingFee ?? money.shipping_fee ?? 0),
            pointDiscount: Number(summary.pointDiscount ?? money.points_discount ?? 0),
            voucherDiscount: Number(summary.voucherDiscount ?? money.discount_amount ?? 0),
            total: Number(summary.total ?? money.final_total ?? order.finalTotal ?? order.total ?? 0)
        };
    }

    function getOrderItems(order) {
        if (Array.isArray(order.items)) {
            return order.items;
        }

        if (Array.isArray(order.products)) {
            return order.products;
        }

        return [];
    }

    function getOrderItemCount(order) {
        const items = getOrderItems(order);

        return items.reduce(function (total, item) {
            return total + Number(item.quantity || item.qty || 1);
        }, 0);
    }


    // 15. Chuẩn hóa đơn từ API
    function normalizeApiOrder(order) {
        const money = order.money || {};
        const status = order.status || {};

        return {
            id: order.id,
            orderId: order.order_code || String(order.id),
            orderCode: order.order_code || String(order.id),

            createdAt: order.created_at || "",
            orderDate: order.created_at || "",

            status: status.code || order.order_status || "pending",
            statusText: status.label || getStatusInfo(order.order_status).text,

            paymentMethod: order.payment ? order.payment.method : order.payment_method,
            paymentMethodName: order.payment ? order.payment.method_label : "",

            customerType: "member",
            userKey: getCurrentUserKey(),

            items: Array.isArray(order.items) ? order.items : [],

            summary: {
                subtotal: Number(money.total_product_price || 0),
                shippingFee: Number(money.shipping_fee || 0),
                pointDiscount: Number(money.points_discount || 0),
                voucherDiscount: Number(money.discount_amount || 0),
                discountTotal: Number(money.points_discount || 0) + Number(money.discount_amount || 0),
                total: Number(money.final_total || 0)
            },

            raw: order
        };
    }


    // 16. Chuẩn hóa đơn localStorage
    function normalizeLocalOrder(order) {
        return {
            ...order,
            id: order.id || order.orderId || order.orderCode,
            orderId: order.orderId || order.orderCode || order.id,
            orderCode: order.orderCode || order.orderId || order.id,
            createdAt: order.createdAt || order.created_at || order.orderDate || "",
            status: order.status || order.order_status || "pending",
            statusText: order.statusText || getStatusInfo(order.status || "pending").text,
            items: getOrderItems(order),
            summary: order.summary || {}
        };
    }


    // 17. Kiểm tra đơn hiện tại hay lịch sử
    function isCurrentOrder(order) {
        const status = getOrderStatus(order);

        return status === "pending" || status === "confirmed" || status === "shipping";
    }


    // 18. Load đơn hàng từ API
    async function loadOrdersFromApi() {
        const response = await getApi("orders/get-orders.php?page=1&limit=100&order_status=all&sort=latest");
        const data = response.data || {};
        const orders = Array.isArray(data.orders) ? data.orders : [];

        return orders.map(normalizeApiOrder);
    }


    // 19. Load đơn hàng từ localStorage
    function loadOrdersFromLocalStorage() {
        const userKey = getCurrentUserKey();
        const orders = getOrdersFromStorage();

        return orders
            .map(normalizeLocalOrder)
            .filter(function (order) {
                if (!order.userKey) {
                    return false;
                }

                return String(order.userKey) === String(userKey);
            });
    }


    // 20. Load danh sách đơn hàng
    async function loadOrders() {
        showLoadingState();

        try {
            allOrders = await loadOrdersFromApi();
        } catch (error) {
            console.warn("Không lấy được đơn hàng từ API, fallback localStorage:", error);
            allOrders = loadOrdersFromLocalStorage();
        }

        allOrders = allOrders.filter(isCurrentOrder);

        renderOrders();
    }


    // 21. Trạng thái hiển thị
    function showLoadingState() {
        if (orderLoadingState) {
            orderLoadingState.hidden = false;
        }

        if (orderErrorState) {
            orderErrorState.hidden = true;
        }

        if (emptyOrderText) {
            emptyOrderText.hidden = true;
            emptyOrderText.classList.remove("show");
        }

        if (orderTableBody) {
            orderTableBody.innerHTML = "";
        }
    }

    function showEmptyState() {
        if (orderLoadingState) {
            orderLoadingState.hidden = true;
        }

        if (orderErrorState) {
            orderErrorState.hidden = true;
        }

        if (emptyOrderText) {
            emptyOrderText.hidden = false;
            emptyOrderText.classList.add("show");
            emptyOrderText.textContent = "Bạn chưa có đơn hàng đang xử lý.";
        }
    }

    function showContentState() {
        if (orderLoadingState) {
            orderLoadingState.hidden = true;
        }

        if (orderErrorState) {
            orderErrorState.hidden = true;
        }

        if (emptyOrderText) {
            emptyOrderText.hidden = true;
            emptyOrderText.classList.remove("show");
        }
    }


    // 22. Lọc đơn hàng
    function getFilteredOrders() {
        if (currentStatusFilter === "all") {
            return allOrders;
        }

        return allOrders.filter(function (order) {
            return getOrderStatus(order) === currentStatusFilter;
        });
    }


    // 23. Render sản phẩm trong đơn dạng text
    function getOrderProductText(order) {
        const items = getOrderItems(order);

        if (items.length === 0) {
            return "Chưa có sản phẩm";
        }

        if (items.length === 1) {
            const item = items[0];
            const product = item.product || {};

            return product.name || item.name || item.productName || item.product_name || "Sản phẩm";
        }

        const firstItem = items[0];
        const firstProduct = firstItem.product || {};
        const firstName =
            firstProduct.name ||
            firstItem.name ||
            firstItem.productName ||
            firstItem.product_name ||
            "Sản phẩm";

        return firstName + " và " + (items.length - 1) + " sản phẩm khác";
    }


    // 24. Render dòng fallback nếu template không khớp
    function createFallbackOrderRow(order) {
        const status = getOrderStatus(order);
        const statusInfo = getStatusInfo(status);
        const money = getOrderMoney(order);

        const row = document.createElement("tr");

        row.dataset.orderId = order.id;
        row.className = "orderRow";
        row.innerHTML = `
            <td>${order.orderCode}</td>
            <td>${formatDateTime(order.createdAt)}</td>
            <td>${getOrderProductText(order)}</td>
            <td>${getOrderItemCount(order)} sản phẩm</td>
            <td>${formatPrice(money.total)}</td>
            <td><span class="statusBadge ${statusInfo.className}">${getOrderStatusLabel(order)}</span></td>
            <td><a class="tableActionBtn" href="${getOrderDetailUrl(order)}">Chi tiết</a></td>
        `;

        return row;
    }


    // 25. Render một dòng đơn hàng bằng template
    function createOrderRow(order) {
        if (!orderHistoryRowTemplate) {
            return createFallbackOrderRow(order);
        }

        const clone = orderHistoryRowTemplate.content.cloneNode(true);
        const row = clone.querySelector("tr") || clone.querySelector(".orderRow");

        const status = getOrderStatus(order);
        const statusInfo = getStatusInfo(status);
        const money = getOrderMoney(order);

        if (row) {
            row.dataset.orderId = order.id;
            row.dataset.orderCode = order.orderCode;
        }

        const orderCodeText = clone.querySelector(".orderCodeText");
        const orderDateText = clone.querySelector(".orderDateText");
        const orderProductText = clone.querySelector(".orderProductText");
        const orderItemCountText = clone.querySelector(".orderItemCountText");
        const orderTotalText = clone.querySelector(".orderTotalText");
        const orderStatusText = clone.querySelector(".orderStatusText");
        const orderDetailLink = clone.querySelector(".orderDetailLink, [data-role='order-detail-link']");
        const orderActionBtn = clone.querySelector("[data-action='view-detail'], .orderActionBtn");

        if (orderCodeText) {
            orderCodeText.textContent = order.orderCode;
        }

        if (orderDateText) {
            orderDateText.textContent = formatDateTime(order.createdAt);
        }

        if (orderProductText) {
            orderProductText.textContent = getOrderProductText(order);
        }

        if (orderItemCountText) {
            orderItemCountText.textContent = getOrderItemCount(order) + " sản phẩm";
        }

        if (orderTotalText) {
            orderTotalText.textContent = formatPrice(money.total);
        }

        if (orderStatusText) {
            orderStatusText.textContent = getOrderStatusLabel(order);
            orderStatusText.className = "statusBadge orderStatusText " + statusInfo.className;
        }

        if (orderDetailLink) {
            orderDetailLink.href = getOrderDetailUrl(order);
        }

        if (orderActionBtn) {
            if (orderActionBtn.tagName === "A") {
                orderActionBtn.href = getOrderDetailUrl(order);
            }

            orderActionBtn.dataset.orderId = order.id;
            orderActionBtn.textContent = "Chi tiết";
        }

        return clone;
    }


    // 26. Render danh sách đơn hàng
    function renderOrders() {
        if (!orderTableBody) {
            return;
        }

        const filteredOrders = getFilteredOrders();

        orderTableBody.innerHTML = "";

        if (filteredOrders.length === 0) {
            showEmptyState();
            return;
        }

        const fragment = document.createDocumentFragment();

        filteredOrders.forEach(function (order) {
            const row = createOrderRow(order);

            if (row) {
                fragment.appendChild(row);
            }
        });

        orderTableBody.appendChild(fragment);
        showContentState();
    }


    // 27. Đổi trạng thái tab
    function setActiveStatusFilter(status) {
        currentStatusFilter = status || "all";

        orderStatusTabs.forEach(function (tab) {
            tab.classList.toggle("active", tab.dataset.orderStatus === currentStatusFilter);
        });

        if (orderStatusFilter) {
            orderStatusFilter.value = currentStatusFilter;
        }

        renderOrders();
    }


    // 28. Xử lý tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword ? searchKeyword.value.trim() : "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 29. Xử lý click bảng đơn hàng
    function handleOrderTableClick(event) {
        const detailButton = event.target.closest("[data-action='view-detail'], .orderActionBtn");

        if (detailButton) {
            return;
        }

        const row = event.target.closest("tr");

        if (!row || !row.dataset.orderId) {
            return;
        }

        window.location.href = "../html/order-detail.html?id=" + encodeURIComponent(row.dataset.orderId);
    }


    // 30. Gắn sự kiện
    function bindEvents() {
        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }

        orderStatusTabs.forEach(function (tab) {
            tab.addEventListener("click", function () {
                setActiveStatusFilter(tab.dataset.orderStatus || "all");
            });
        });

        if (orderStatusFilter) {
            orderStatusFilter.addEventListener("change", function () {
                setActiveStatusFilter(orderStatusFilter.value);
            });
        }

        if (orderTableBody) {
            orderTableBody.addEventListener("click", handleOrderTableClick);
        }
    }


    // 31. Khởi tạo trang đơn hàng của tôi
    async function initMyOrderPage() {
        const isLogin = await requireLogin();

        if (!isLogin) {
            return;
        }

        renderCurrentUserInfo();
        bindEvents();

        await loadOrders();
    }

    initMyOrderPage();
});