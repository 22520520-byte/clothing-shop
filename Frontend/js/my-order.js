// =========================================================
// File: Frontend/js/my-order.js
// Mục đích: Trang Đơn hàng của tôi
// Cập nhật: Lấy đơn từ API/database, render chắc chắn vào my-order.html
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang đơn hàng của tôi
    const myOrderPage = document.querySelector('[data-page="my-order"], .myOrderPage, .profilePage');

    if (!myOrderPage) {
        return;
    }

    // 2. Key localStorage
    const ORDERS_STORAGE_KEY = "orders";
    const CURRENT_ORDER_STORAGE_KEY = "current_order";
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
    const profileUserName =
        document.getElementById("profileUserName") ||
        document.querySelector(".userBoxName") ||
        document.querySelector(".profileUserName");

    const profileUserEmail =
        document.getElementById("profileUserEmail") ||
        document.querySelector(".userBoxRole") ||
        document.querySelector(".profileUserEmail");

    const profileUserAvatar =
        document.getElementById("profileUserAvatar") ||
        document.querySelector(".userAvatar") ||
        document.querySelector(".profileUserAvatar");

    // 6. Lấy DOM trạng thái đơn hàng
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

    // 7. Lấy DOM bộ lọc trạng thái nếu có
    const orderStatusTabs = document.querySelectorAll("[data-order-status]");
    const orderStatusFilter = document.getElementById("orderStatusFilter");

    // 8. Lấy DOM popup đã nhận hàng / đánh giá nếu có
    const receiveSuccessPopup = document.getElementById("receiveSuccessPopup");
    const closeReceiveSuccessPopupBtn = document.getElementById("closeReceiveSuccessPopupBtn");
    const reviewLaterBtn = document.getElementById("reviewLaterBtn");
    const openReviewPopupBtn = document.getElementById("openReviewPopupBtn");

    const reviewPopup = document.getElementById("reviewPopup");
    const closeReviewPopupBtn = document.getElementById("closeReviewPopupBtn");
    const cancelReviewBtn = document.getElementById("cancelReviewBtn");
    const submitReviewBtn = document.getElementById("submitReviewBtn");

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

    function escapeHtml(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getFirstLetter(text) {
        if (!text) {
            return "K";
        }

        return String(text).trim().charAt(0).toUpperCase();
    }

    function normalizeText(value) {
        return String(value || "").trim().toLowerCase();
    }

    function normalizePhone(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function getProductDetailUrl(productId) {
        if (!productId) {
            return "#";
        }

        return "../html/product-detail.html?id=" + encodeURIComponent(productId);
    }

    function getOrderDetailUrl(order) {
        const orderId = order.id || order.orderId || order.orderCode || order.order_code || "";
        return "../html/order-detail.html?id=" + encodeURIComponent(orderId);
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
            console.error("Lỗi đọc localStorage:", error);
            return fallbackValue;
        }
    }

    function saveDataToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function getOrdersFromStorage() {
        const orders = getDataFromStorage(ORDERS_STORAGE_KEY, []);
        return Array.isArray(orders) ? orders : [];
    }

    function getCurrentOrderFromStorage() {
        const currentOrder = getDataFromStorage(CURRENT_ORDER_STORAGE_KEY, null);

        if (!currentOrder || typeof currentOrder !== "object") {
            return null;
        }

        return currentOrder;
    }

    // 13. Lấy user hiện tại
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
        const localUser = getCurrentUserLocal();

        if (!localUser) {
            const redirectUrl = encodeURIComponent(window.location.href);
            window.location.href = "../html/login.html?redirect=" + redirectUrl;
            return false;
        }

        currentUser = localUser;

        if (window.CustomerApi && typeof window.CustomerApi.getCurrentCustomerFromSession === "function") {
            try {
                const sessionUser = await window.CustomerApi.getCurrentCustomerFromSession();

                if (sessionUser && sessionUser.id) {
                    currentUser = {
                        ...localUser,
                        ...sessionUser
                    };
                }
            } catch (error) {
                console.warn("Không lấy được session khách hàng, dùng localStorage:", error);
            }
        }

        return true;
    }

    function getCurrentUserKey() {
        if (!currentUser) {
            return "";
        }

        return (
            currentUser.id ||
            currentUser.userId ||
            currentUser.user_id ||
            currentUser.email ||
            currentUser.phone ||
            currentUser.fullName ||
            currentUser.full_name ||
            currentUser.name ||
            "member"
        );
    }

    function getCurrentUserName() {
        if (!currentUser) {
            return "Khách hàng";
        }

        return (
            currentUser.fullName ||
            currentUser.full_name ||
            currentUser.name ||
            currentUser.username ||
            currentUser.email ||
            "Khách hàng"
        );
    }

    function getCurrentUserEmail() {
        if (!currentUser) {
            return "";
        }

        return currentUser.email || "";
    }

    function getCurrentUserPhone() {
        if (!currentUser) {
            return "";
        }

        return currentUser.phone || "";
    }

    // 14. Render thông tin user
    function renderCurrentUserInfo() {
        if (!currentUser) {
            return;
        }

        const fullName = getCurrentUserName();
        const emailOrPhone = getCurrentUserEmail() || getCurrentUserPhone() || "Thành viên";

        if (profileUserName) {
            profileUserName.textContent = fullName;
        }

        if (profileUserEmail) {
            profileUserEmail.textContent = emailOrPhone;
        }

        if (profileUserAvatar) {
            profileUserAvatar.textContent = getFirstLetter(fullName);
        }
    }

    // 15. Trạng thái đơn hàng
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
                className: "statusConfirmed"
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
        if (order.status && typeof order.status === "object" && order.status.code) {
            return order.status.code;
        }

        return order.status || order.order_status || "pending";
    }

    function getOrderStatusLabel(order) {
        if (order.status && typeof order.status === "object" && order.status.label) {
            return order.status.label;
        }

        return order.statusText || getStatusInfo(getOrderStatus(order)).text;
    }

    function isCurrentOrder(order) {
        const status = getOrderStatus(order);

        return status === "pending" || status === "confirmed" || status === "shipping";
    }

    // 16. Lấy dữ liệu tiền
    function getOrderMoney(order) {
        const summary = order.summary || {};
        const money = order.money || {};

        return {
            subtotal: Number(summary.subtotal ?? money.total_product_price ?? order.total_product_price ?? 0),
            shippingFee: Number(summary.shippingFee ?? money.shipping_fee ?? order.shipping_fee ?? 0),
            pointDiscount: Number(summary.pointDiscount ?? money.points_discount ?? order.points_discount ?? 0),
            voucherDiscount: Number(summary.voucherDiscount ?? money.discount_amount ?? order.discount_amount ?? 0),
            total: Number(summary.total ?? money.final_total ?? order.final_total ?? order.finalTotal ?? order.total ?? 0)
        };
    }

    // 17. Lấy sản phẩm trong đơn
    function getOrderItems(order) {
        if (Array.isArray(order.items)) {
            return order.items;
        }

        if (Array.isArray(order.products)) {
            return order.products;
        }

        if (Array.isArray(order.order_items)) {
            return order.order_items;
        }

        return [];
    }

    function getOrderItemCount(order) {
        const items = getOrderItems(order);

        return items.reduce(function (total, item) {
            return total + Number(item.quantity || item.qty || 1);
        }, 0);
    }

    function getItemProductName(item) {
        const product = item.product || {};
        return product.name || item.name || item.productName || item.product_name || "Sản phẩm";
    }

    function getItemProductImage(item) {
        const product = item.product || {};
        return product.image_url || product.image || item.image || item.productImage || item.product_image || "../img/products/default.jpg";
    }

    function getItemProductId(item) {
        const product = item.product || {};
        return product.id || item.productId || item.product_id || item.id || "";
    }

    function getItemVariantText(item) {
        const color = item.color || item.colorName || item.color_name || "";
        const size = item.size || item.sizeName || item.size_name || "";
        const meta = item.meta || item.variant || "";

        if (meta) {
            return meta;
        }

        if (color && size) {
            return color + " / " + size;
        }

        if (color) {
            return color;
        }

        if (size) {
            return size;
        }

        return "Mặc định";
    }

    // 18. Lấy thông tin người nhận
    function getOrderReceiver(order) {
        const receiver = order.receiver || order.customer || {};
        const raw = order.raw || {};

        return {
            name:
                receiver.name ||
                receiver.fullName ||
                receiver.full_name ||
                order.receiver_name ||
                raw.receiver_name ||
                "Khách hàng",
            phone:
                receiver.phone ||
                order.receiver_phone ||
                raw.receiver_phone ||
                "",
            email:
                receiver.email ||
                order.receiver_email ||
                raw.receiver_email ||
                "",
            address:
                receiver.address ||
                receiver.fullAddress ||
                receiver.shipping_address ||
                order.shipping_address ||
                order.address ||
                raw.shipping_address ||
                ""
        };
    }

    // 19. Chuẩn hóa đơn từ API
    function normalizeApiOrder(order) {
        const money = order.money || {};
        const status = order.status || {};
        const receiver = order.receiver || {};
        const payment = order.payment || {};

        return {
            id: order.id,
            orderId: order.order_code || String(order.id),
            orderCode: order.order_code || String(order.id),
            createdAt: order.created_at || order.orderDate || "",
            orderDate: order.created_at || order.orderDate || "",
            status: status.code || order.order_status || "pending",
            statusText: status.label || getStatusInfo(order.order_status || "pending").text,
            paymentMethod: payment.method || order.payment_method || "",
            paymentMethodName: payment.method_label || order.paymentMethodName || "Thanh toán khi nhận hàng",
            customerType: order.customer_type || "member",
            userId: order.user_id || order.userId || "",
            userKey: order.userKey || getCurrentUserKey(),
            receiver: {
                name: receiver.name || order.receiver_name || "",
                phone: receiver.phone || order.receiver_phone || "",
                email: receiver.email || order.receiver_email || "",
                address: receiver.shipping_address || order.shipping_address || ""
            },
            items: Array.isArray(order.items) ? order.items : [],
            summary: {
                subtotal: Number(money.total_product_price || order.total_product_price || 0),
                shippingFee: Number(money.shipping_fee || order.shipping_fee || 0),
                pointDiscount: Number(money.points_discount || order.points_discount || 0),
                voucherDiscount: Number(money.discount_amount || order.discount_amount || 0),
                discountTotal:
                    Number(money.points_discount || order.points_discount || 0) +
                    Number(money.discount_amount || order.discount_amount || 0),
                total: Number(money.final_total || order.final_total || 0)
            },
            source: "api",
            raw: order
        };
    }

    // 20. Chuẩn hóa đơn localStorage
    function normalizeLocalOrder(order) {
        const receiver = getOrderReceiver(order);

        return {
            ...order,
            id: order.id || order.orderId || order.orderCode,
            orderId: order.orderId || order.orderCode || order.id,
            orderCode: order.orderCode || order.order_code || order.orderId || order.id,
            createdAt: order.createdAt || order.created_at || order.orderDate || "",
            orderDate: order.orderDate || order.createdAt || order.created_at || "",
            status: order.status || order.order_status || "pending",
            statusText: order.statusText || getStatusInfo(order.status || order.order_status || "pending").text,
            userKey: order.userKey || "",
            userId: order.user_id || order.userId || "",
            receiver: receiver,
            items: getOrderItems(order),
            summary: order.summary || {},
            source: "local",
            raw: order
        };
    }

    // 21. Kiểm tra đơn có thuộc user hiện tại không
    function isOrderBelongsToCurrentUser(order) {
        if (order.source === "api") {
            return true;
        }

        const userKey = String(getCurrentUserKey() || "");
        const userId = String(currentUser?.id || currentUser?.user_id || currentUser?.userId || "");
        const userEmail = normalizeText(getCurrentUserEmail());
        const userPhone = normalizePhone(getCurrentUserPhone());
        const userName = normalizeText(getCurrentUserName());
        const receiver = getOrderReceiver(order);

        if (order.userKey && userKey && String(order.userKey) === userKey) {
            return true;
        }

        if (order.userId && userId && String(order.userId) === userId) {
            return true;
        }

        if (order.user_id && userId && String(order.user_id) === userId) {
            return true;
        }

        if (receiver.email && userEmail && normalizeText(receiver.email) === userEmail) {
            return true;
        }

        if (receiver.phone && userPhone && normalizePhone(receiver.phone) === userPhone) {
            return true;
        }

        if (receiver.name && userName && normalizeText(receiver.name) === userName) {
            return true;
        }

        return false;
    }

    // 22. Load đơn hàng từ API
    async function loadOrdersFromApi() {
        const phone = normalizePhone(getCurrentUserPhone());
        const email = getCurrentUserEmail();

        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("limit", "100");
        params.set("status", "all");
        params.set("sort", "latest");

        if (phone) {
            params.set("phone", phone);
        }

        if (email) {
            params.set("email", email);
        }

        const endpoints = [
            "orders/get-my-orders.php?" + params.toString()
        ];

        for (let index = 0; index < endpoints.length; index += 1) {
            try {
                const response = await getApi(endpoints[index]);
                const data = response.data || {};
                const orders = Array.isArray(data.orders) ? data.orders : [];

                return orders.map(normalizeApiOrder);
            } catch (error) {
                console.warn("Không lấy được đơn hàng từ API:", endpoints[index], error);
            }
        }

        return [];
    }

    // 23. Load đơn hàng từ localStorage
    function loadOrdersFromLocalStorage() {
        const orders = getOrdersFromStorage();
        const currentOrder = getCurrentOrderFromStorage();
        const orderMap = new Map();

        orders.forEach(function (order) {
            const normalizedOrder = normalizeLocalOrder(order);
            const key = normalizedOrder.orderCode || normalizedOrder.id;

            if (key) {
                orderMap.set(String(key), normalizedOrder);
            }
        });

        if (currentOrder) {
            const normalizedCurrentOrder = normalizeLocalOrder(currentOrder);
            const key = normalizedCurrentOrder.orderCode || normalizedCurrentOrder.id;

            if (key) {
                orderMap.set(String(key), normalizedCurrentOrder);
            }
        }

        return Array.from(orderMap.values()).filter(isOrderBelongsToCurrentUser);
    }

    // 24. Gộp API và localStorage
    function mergeOrders(apiOrders, localOrders) {
        const orderMap = new Map();

        localOrders.forEach(function (order) {
            const key = order.orderCode || order.id;

            if (key) {
                orderMap.set(String(key), order);
            }
        });

        apiOrders.forEach(function (order) {
            const key = order.orderCode || order.id;

            if (key) {
                orderMap.set(String(key), order);
            }
        });

        return Array.from(orderMap.values()).sort(function (a, b) {
            const timeA = new Date(a.createdAt || a.orderDate || 0).getTime();
            const timeB = new Date(b.createdAt || b.orderDate || 0).getTime();

            return timeB - timeA;
        });
    }

    // 25. Tìm card nội dung đơn hàng
    function getOrderContentCard() {
        const cards = Array.from(document.querySelectorAll(".contentCard, .profileContentCard, .profileContent > section, .profileContent > div"));

        const matchedCard = cards.find(function (card) {
            return normalizeText(card.textContent).includes("đơn hàng hiện tại");
        });

        if (matchedCard) {
            return matchedCard;
        }

        return (
            document.querySelector(".profileContent .contentCard") ||
            document.querySelector(".profileContent") ||
            document.querySelector(".contentCard")
        );
    }

    // 26. Tìm hoặc tạo vùng render đơn hàng
    function getMyOrderRenderTarget() {
        let autoTarget = document.getElementById("myOrderAutoList");

        if (autoTarget) {
            return autoTarget;
        }

        const contentCard = getOrderContentCard();

        if (!contentCard) {
            return null;
        }

        autoTarget = document.createElement("div");
        autoTarget.id = "myOrderAutoList";
        autoTarget.className = "myOrderAutoList";
        autoTarget.hidden = false;

        contentCard.appendChild(autoTarget);

        return autoTarget;
    }

    function revealElement(element) {
        if (!element) {
            return;
        }

        element.hidden = false;
        element.removeAttribute("hidden");
        element.style.display = "";

        let parent = element.parentElement;

        while (parent && parent !== document.body) {
            parent.hidden = false;
            parent.removeAttribute("hidden");

            if (parent.style.display === "none") {
                parent.style.display = "";
            }

            parent = parent.parentElement;
        }
    }

    // 27. Trạng thái hiển thị
    function showLoadingState() {
        const renderTarget = getMyOrderRenderTarget();

        if (orderLoadingState) {
            orderLoadingState.hidden = false;
            orderLoadingState.classList.add("show");
        }

        if (orderErrorState) {
            orderErrorState.hidden = true;
            orderErrorState.classList.remove("show");
        }

        if (emptyOrderText) {
            emptyOrderText.hidden = true;
            emptyOrderText.classList.remove("show");
        }

        if (renderTarget) {
            revealElement(renderTarget);
            renderTarget.innerHTML = '<div class="myOrderLoadingText">Đang tải đơn hàng hiện tại...</div>';
        }
    }

    function showEmptyState() {
        const renderTarget = getMyOrderRenderTarget();

        if (orderLoadingState) {
            orderLoadingState.hidden = true;
            orderLoadingState.classList.remove("show");
        }

        if (orderErrorState) {
            orderErrorState.hidden = true;
            orderErrorState.classList.remove("show");
        }

        if (emptyOrderText) {
            emptyOrderText.hidden = false;
            emptyOrderText.classList.add("show");
            emptyOrderText.textContent = "Bạn chưa có đơn hàng đang xử lý.";
        }

        if (renderTarget) {
            revealElement(renderTarget);
            renderTarget.innerHTML = `
                <div class="myOrderEmptyBox">
                    <h3>Bạn chưa có đơn hàng nào đang xử lý</h3>
                    <p>Khi bạn đặt hàng và đơn chưa hoàn thành, thông tin đơn hàng sẽ được hiển thị tại đây.</p>
                    <a href="../html/home.html">Tiếp tục mua sắm</a>
                </div>
            `;
        }
    }

    function showContentState() {
        const renderTarget = getMyOrderRenderTarget();

        if (orderLoadingState) {
            orderLoadingState.hidden = true;
            orderLoadingState.classList.remove("show");
        }

        if (orderErrorState) {
            orderErrorState.hidden = true;
            orderErrorState.classList.remove("show");
        }

        if (emptyOrderText) {
            emptyOrderText.hidden = true;
            emptyOrderText.classList.remove("show");
        }

        if (renderTarget) {
            revealElement(renderTarget);
        }
    }

    // 28. Lọc đơn hàng
    function getFilteredOrders() {
        if (currentStatusFilter === "all") {
            return allOrders;
        }

        return allOrders.filter(function (order) {
            return getOrderStatus(order) === currentStatusFilter;
        });
    }

    // 29. Render danh sách sản phẩm trong đơn
    function createOrderProductListHtml(order) {
        const items = getOrderItems(order);

        if (items.length === 0) {
            return '<div class="orderProductMiniItem">Chưa có sản phẩm</div>';
        }

        return items.map(function (item) {
            const productId = getItemProductId(item);
            const productName = getItemProductName(item);
            const productImage = getItemProductImage(item);
            const variantText = getItemVariantText(item);
            const quantity = Number(item.quantity || item.qty || 1);
            const price = Number(item.price || item.currentPrice || 0);

            return `
                <div class="orderProductMiniItem">
                    <a class="orderProductMiniImage" href="${getProductDetailUrl(productId)}">
                        <img src="${escapeHtml(productImage)}" alt="${escapeHtml(productName)}">
                    </a>
                    <div class="orderProductMiniInfo">
                        <a class="orderProductMiniName" href="${getProductDetailUrl(productId)}">${escapeHtml(productName)}</a>
                        <p>${escapeHtml(variantText)}</p>
                        <p>${formatPrice(price)} x ${quantity}</p>
                    </div>
                </div>
            `;
        }).join("");
    }

    // 30. Tạo card đơn hàng
    function createMyOrderCard(order) {
        const status = getOrderStatus(order);
        const statusInfo = getStatusInfo(status);
        const money = getOrderMoney(order);
        const receiver = getOrderReceiver(order);

        const card = document.createElement("article");
        card.className = "orderHistoryCard orderRow";
        card.dataset.orderId = order.id;
        card.dataset.orderCode = order.orderCode;

        card.innerHTML = `
            <div class="orderHistoryHeader">
                <div>
                    <span class="mutedText">Mã đơn hàng</span>
                    <h3>${escapeHtml(order.orderCode)}</h3>
                </div>
                <span class="statusBadge ${statusInfo.className}">
                    ${escapeHtml(getOrderStatusLabel(order))}
                </span>
            </div>

            <div class="orderHistoryMeta">
                <p><strong>Ngày đặt:</strong> ${escapeHtml(formatDateTime(order.createdAt))}</p>
                <p><strong>Phương thức thanh toán:</strong> ${escapeHtml(order.paymentMethodName || "Thanh toán khi nhận hàng")}</p>
                <p><strong>Người nhận:</strong> ${escapeHtml(receiver.name)}</p>
                <p><strong>Số điện thoại:</strong> ${escapeHtml(receiver.phone)}</p>
                <p><strong>Địa chỉ:</strong> ${escapeHtml(receiver.address)}</p>
            </div>

            <div class="orderHistoryProducts">
                <div class="orderHistorySectionTitle">
                    <strong>Sản phẩm trong đơn</strong>
                    <span>${getOrderItemCount(order)} sản phẩm</span>
                </div>
                ${createOrderProductListHtml(order)}
            </div>

            <div class="orderHistoryMoney">
                <div>
                    <span>Tổng tiền hàng</span>
                    <strong>${formatPrice(money.subtotal)}</strong>
                </div>
                <div>
                    <span>Phí vận chuyển</span>
                    <strong>${formatPrice(money.shippingFee)}</strong>
                </div>
                <div>
                    <span>Tổng giảm giá</span>
                    <strong>-${formatPrice(money.pointDiscount + money.voucherDiscount)}</strong>
                </div>
                <div class="orderHistoryFinalTotal">
                    <span>Tổng thanh toán</span>
                    <strong>${formatPrice(money.total)}</strong>
                </div>
            </div>

            <div class="orderHistoryActions">
                <a class="orderDetailLink" href="${getOrderDetailUrl(order)}">Xem chi tiết</a>
                <button
                    type="button"
                    class="orderReceivedBtn"
                    data-action="receive-order"
                    data-order-id="${escapeHtml(order.id)}"
                    data-order-code="${escapeHtml(order.orderCode)}"
                    ${status !== "shipping" ? "hidden" : ""}
                >
                    ĐÃ NHẬN
                </button>
            </div>
        `;

        return card;
    }

    // 31. Render danh sách đơn hàng
    function renderOrders() {
        const renderTarget = getMyOrderRenderTarget();

        if (!renderTarget) {
            console.error("Không tìm thấy vùng render đơn hàng trong my-order.html.");
            return;
        }

        const filteredOrders = getFilteredOrders();

        revealElement(renderTarget);
        renderTarget.innerHTML = "";

        if (filteredOrders.length === 0) {
            showEmptyState();
            return;
        }

        const fragment = document.createDocumentFragment();

        filteredOrders.forEach(function (order) {
            const card = createMyOrderCard(order);
            fragment.appendChild(card);
        });

        renderTarget.appendChild(fragment);
        showContentState();
    }

    // 32. Load danh sách đơn hàng
    async function loadOrders() {
        showLoadingState();

        try {
            const apiOrders = await loadOrdersFromApi();
            const localOrders = loadOrdersFromLocalStorage();

            allOrders = mergeOrders(apiOrders, localOrders)
                .filter(isOrderBelongsToCurrentUser)
                .filter(isCurrentOrder);

            renderOrders();
        } catch (error) {
            console.error(error);

            const localOrders = loadOrdersFromLocalStorage();

            allOrders = localOrders.filter(isCurrentOrder);
            renderOrders();
        }
    }

    // 33. Đổi trạng thái tab
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

    // 34. Cập nhật localStorage khi đã nhận hàng
    function updateLocalOrderStatus(orderCode, newStatus) {
        const orders = getOrdersFromStorage();
        const currentOrder = getCurrentOrderFromStorage();

        const updatedOrders = orders.map(function (order) {
            const code = order.orderCode || order.order_code || order.orderId || order.id;

            if (String(code) !== String(orderCode)) {
                return order;
            }

            return {
                ...order,
                status: newStatus,
                statusText: getStatusInfo(newStatus).text
            };
        });

        saveDataToStorage(ORDERS_STORAGE_KEY, updatedOrders);

        if (currentOrder) {
            const currentCode = currentOrder.orderCode || currentOrder.order_code || currentOrder.orderId || currentOrder.id;

            if (String(currentCode) === String(orderCode)) {
                saveDataToStorage(CURRENT_ORDER_STORAGE_KEY, {
                    ...currentOrder,
                    status: newStatus,
                    statusText: getStatusInfo(newStatus).text
                });
            }
        }
    }

    // 35. Xác nhận đã nhận hàng
async function confirmReceiveOrder(orderId, orderCode) {
    const isConfirm = confirm("Bạn xác nhận đã nhận được đơn hàng này?");

    if (!isConfirm) {
        return;
    }

    try {
        await postApi("orders/confirm-received.php", {
            order_id: orderId,
            order_code: orderCode
        });

        updateLocalOrderStatus(orderCode, "completed");

        allOrders = allOrders.filter(function (order) {
            return String(order.orderCode) !== String(orderCode);
        });

        renderOrders();
        openPopup(receiveSuccessPopup);
    } catch (error) {
        console.error(error);
        alert("Không thể xác nhận đã nhận hàng. Vui lòng thử lại.");
    }
}

    // 36. Popup
    function openPopup(popupElement) {
        if (!popupElement) {
            return;
        }

        popupElement.hidden = false;
        popupElement.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function closePopup(popupElement) {
        if (!popupElement) {
            return;
        }

        popupElement.hidden = true;
        popupElement.classList.remove("show");
        document.body.style.overflow = "";
    }

    // 37. Xử lý tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword ? searchKeyword.value.trim() : "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }

    // 38. Xử lý click đơn hàng
    function handleOrderClick(event) {
        const receiveButton = event.target.closest("[data-action='receive-order'], .orderReceivedBtn, .btnReceiveOrder");

        if (receiveButton) {
            const orderId = receiveButton.dataset.orderId || "";
            const orderCode = receiveButton.dataset.orderCode || "";

            if (!orderCode) {
                alert("Không tìm thấy mã đơn hàng.");
                return;
            }

            confirmReceiveOrder(orderId, orderCode);
            return;
        }

        const detailButton = event.target.closest("[data-action='view-detail'], .orderActionBtn, .orderDetailLink");

        if (detailButton) {
            return;
        }

        const row = event.target.closest(".orderRow, .orderHistoryCard");

        if (!row || !row.dataset.orderId) {
            return;
        }

        window.location.href = "../html/order-detail.html?id=" + encodeURIComponent(row.dataset.orderId);
    }

    // 39. Gắn sự kiện
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

        document.addEventListener("click", handleOrderClick);

        if (closeReceiveSuccessPopupBtn) {
            closeReceiveSuccessPopupBtn.addEventListener("click", function () {
                closePopup(receiveSuccessPopup);
            });
        }

        if (reviewLaterBtn) {
            reviewLaterBtn.addEventListener("click", function () {
                closePopup(receiveSuccessPopup);
            });
        }

        if (openReviewPopupBtn) {
            openReviewPopupBtn.addEventListener("click", function () {
                closePopup(receiveSuccessPopup);
                openPopup(reviewPopup);
            });
        }

        if (closeReviewPopupBtn) {
            closeReviewPopupBtn.addEventListener("click", function () {
                closePopup(reviewPopup);
            });
        }

        if (cancelReviewBtn) {
            cancelReviewBtn.addEventListener("click", function () {
                closePopup(reviewPopup);
            });
        }

        if (submitReviewBtn) {
            submitReviewBtn.addEventListener("click", function () {
                closePopup(reviewPopup);
                alert("Cảm ơn bạn đã đánh giá sản phẩm.");
            });
        }

        document.addEventListener("keydown", function (event) {
            if (event.key !== "Escape") {
                return;
            }

            closePopup(receiveSuccessPopup);
            closePopup(reviewPopup);
        });
    }

    // 40. Khởi tạo trang đơn hàng của tôi
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