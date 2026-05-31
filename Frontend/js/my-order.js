// 1. Chờ HTML tải xong

document.addEventListener("DOMContentLoaded", function () {
    const myOrderPage = document.querySelector('[data-page="my-order"]');

    if (!myOrderPage) {
        return;
    }

    // 2. Key localStorage

    const ORDERS_STORAGE_KEY = "orders";
    const CURRENT_ORDER_STORAGE_KEY = "current_order";
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const IS_LOGIN_STORAGE_KEY = "is_login";
    const USER_POINTS_STORAGE_KEY = "user_points";
    const ORDER_REVIEWS_STORAGE_KEY = "order_reviews";

    // 3. Cấu hình điểm thưởng đánh giá

    const REVIEW_REWARD_POINTS = 100;

    // 4. Biến trạng thái

    let currentOrders = [];
    let selectedReceivedOrderId = "";
    let selectedReviewRating = 0;

    // 5. Lấy DOM sidebar

    const profileUserName = document.getElementById("profileUserName");
    const profileUserRank = document.getElementById("profileUserRank");
    const logoutBtn = document.getElementById("logoutBtn");

    // 6. Lấy DOM trạng thái trang

    const myOrderLoadingState = document.getElementById("myOrderLoadingState");
    const myOrderEmptyState = document.getElementById("myOrderEmptyState");
    const myOrderErrorState = document.getElementById("myOrderErrorState");
    const myOrderContent = document.getElementById("myOrderContent");
    const myOrderList = document.getElementById("myOrderList");

    // 7. Lấy DOM template

    const myOrderCardTemplate = document.getElementById("myOrderCardTemplate");
    const orderProductItemTemplate = document.getElementById("orderProductItemTemplate");

    // 8. Lấy DOM popup nhận hàng

    const rewardPopup = document.getElementById("rewardPopup");
    const rewardPopupOverlay = document.getElementById("rewardPopupOverlay");
    const closeRewardPopupBtn = document.getElementById("closeRewardPopupBtn");
    const rewardLaterBtn = document.getElementById("rewardLaterBtn");
    const rewardReviewNowBtn = document.getElementById("rewardReviewNowBtn");

    // 9. Lấy DOM popup đánh giá

    const reviewPopup = document.getElementById("reviewPopup");
    const reviewPopupOverlay = document.getElementById("reviewPopupOverlay");
    const closeReviewPopupBtn = document.getElementById("closeReviewPopupBtn");
    const cancelReviewBtn = document.getElementById("cancelReviewBtn");
    const reviewForm = document.getElementById("reviewForm");
    const reviewOrderId = document.getElementById("reviewOrderId");
    const reviewStars = document.getElementById("reviewStars");
    const reviewRating = document.getElementById("reviewRating");
    const reviewContent = document.getElementById("reviewContent");

    // 10. Hàm tiện ích

    function formatPrice(price) {
        return Number(price || 0).toLocaleString("vi-VN") + "đ";
    }

    function formatDiscount(price) {
        const value = Number(price || 0);

        if (value <= 0) {
            return "-0đ";
        }

        return "-" + formatPrice(value);
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

    function getProductDetailUrl(productId) {
        if (!productId) {
            return "#";
        }

        return "../html/product-detail.html?id=" + encodeURIComponent(productId);
    }

    function getOrderDetailUrl(orderId) {
        return "../html/order-detail.html?id=" + encodeURIComponent(orderId);
    }

    function showMessage(message) {
        alert(message);
    }

    // 11. Đọc ghi localStorage

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

        if (!Array.isArray(orders)) {
            return [];
        }

        return orders;
    }

    function saveOrdersToStorage(orders) {
        saveDataToStorage(ORDERS_STORAGE_KEY, orders);
    }

    // 12. Kiểm tra đăng nhập

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
            return "Khách hàng";
        }

        return (
            currentUser.fullName ||
            currentUser.name ||
            currentUser.username ||
            currentUser.email ||
            "Thành viên"
        );
    }

    // 13. Hiển thị thông tin sidebar

    function renderSidebarUser() {
        const currentUser = getCurrentUser();

        if (profileUserName) {
            profileUserName.textContent = getCurrentUserName();
        }

        if (profileUserRank) {
            profileUserRank.textContent = currentUser ? "Thành viên" : "Chưa đăng nhập";
        }
    }

    // 14. Lọc đơn hàng hiện tại

    function isCurrentUserOrder(order) {
        const currentUser = getCurrentUser();
        const currentUserKey = getCurrentUserKey();

        if (!currentUser || !currentUserKey) {
            return false;
        }

        if (order.userKey && order.userKey === currentUserKey) {
            return true;
        }

        const customer = order.customer || {};

        if (currentUser.email && customer.email && currentUser.email === customer.email) {
            return true;
        }

        if (currentUser.phone && customer.phone && currentUser.phone === customer.phone) {
            return true;
        }

        return false;
    }

    function isCurrentOrder(order) {
        const status = String(order.status || "").toLowerCase();
        const statusText = order.statusText || order.statusName || "";

        const completedTexts = ["Hoàn thành", "Đã hoàn thành"];
        const cancelledTexts = ["Đã hủy", "Hủy đơn"];

        if (status === "completed" || status === "cancelled") {
            return false;
        }

        if (completedTexts.includes(statusText) || cancelledTexts.includes(statusText)) {
            return false;
        }

        return true;
    }

    function getCurrentOrders() {
        const orders = getOrdersFromStorage();

        return orders
            .filter(isCurrentUserOrder)
            .filter(isCurrentOrder)
            .sort(function (a, b) {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            });
    }

    // 15. Chuẩn hóa dữ liệu đơn hàng

    function getOrderId(order) {
        return order.orderId || order.id || "";
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
            calculateSubtotal(items)
        );

        const shippingFee = Number(
            summary.shippingFee ??
            order.shippingFee ??
            order.shipping?.fee ??
            0
        );

        const pointDiscount = Number(
            summary.pointDiscount ??
            order.pointDiscount ??
            pointBenefit?.discountAmount ??
            0
        );

        const voucherDiscount = Number(
            summary.voucherDiscount ??
            order.voucherDiscount ??
            voucherBenefit?.discountAmount ??
            0
        );

        const discountTotal = Number(
            summary.discountTotal ??
            order.discountTotal ??
            order.discount ??
            pointDiscount + voucherDiscount
        );

        const total = Number(
            summary.total ??
            order.total ??
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

    function getOrderStatusText(order) {
        return order.statusText || order.statusName || "Chờ xác nhận";
    }

    function getPaymentName(order) {
        if (order.payment && order.payment.name) {
            return order.payment.name;
        }

        if (order.paymentMethodName) {
            return order.paymentMethodName;
        }

        if (order.paymentMethod === "cod") {
            return "Thanh toán khi nhận hàng";
        }

        if (order.paymentMethod === "qr_transfer") {
            return "Chuyển khoản qua mã QR";
        }

        return "---";
    }

    function buildFullAddress(customer) {
        if (!customer) {
            return "---";
        }

        const parts = [
            customer.address,
            customer.ward,
            customer.district,
            customer.province
        ].filter(Boolean);

        if (parts.length === 0) {
            return "---";
        }

        return parts.join(", ");
    }

    function buildVariantText(item) {
        if (item.meta) {
            return item.meta;
        }

        const parts = [];

        if (item.color) {
            parts.push("Màu: " + item.color);
        }

        if (item.size) {
            parts.push("Size: " + item.size);
        }

        if (parts.length === 0) {
            return "Chưa chọn phân loại";
        }

        return parts.join(" / ");
    }

    function getTotalQuantity(items) {
        return items.reduce(function (total, item) {
            return total + Number(item.quantity || item.qty || 0);
        }, 0);
    }

    // 16. Hiển thị trạng thái trang

    function showPageState(type) {
        if (myOrderLoadingState) myOrderLoadingState.hidden = true;
        if (myOrderEmptyState) myOrderEmptyState.hidden = true;
        if (myOrderErrorState) myOrderErrorState.hidden = true;
        if (myOrderContent) myOrderContent.hidden = true;

        if (type === "loading" && myOrderLoadingState) {
            myOrderLoadingState.hidden = false;
        }

        if (type === "empty" && myOrderEmptyState) {
            myOrderEmptyState.hidden = false;
        }

        if (type === "error" && myOrderErrorState) {
            myOrderErrorState.hidden = false;
        }

        if (type === "content" && myOrderContent) {
            myOrderContent.hidden = false;
        }
    }

    function updateEmptyMessageForGuest() {
        if (isUserLoggedIn()) {
            return;
        }

        const emptyTitle = myOrderEmptyState?.querySelector("h3");
        const emptyDesc = myOrderEmptyState?.querySelector("p");
        const emptyLink = myOrderEmptyState?.querySelector("a");

        if (emptyTitle) {
            emptyTitle.textContent = "Vui lòng đăng nhập để xem đơn hàng";
        }

        if (emptyDesc) {
            emptyDesc.textContent = "Trang đơn hàng của tôi chỉ hiển thị đơn hàng của tài khoản thành viên.";
        }

        if (emptyLink) {
            emptyLink.textContent = "Đăng nhập ngay";
            emptyLink.href = "../html/login.html";
        }
    }

    // 17. Render sản phẩm trong đơn

    function createOrderProductElement(item) {
        if (!orderProductItemTemplate) {
            return null;
        }

        const clone = orderProductItemTemplate.content.cloneNode(true);

        const productItem = clone.querySelector(".orderProductItem");
        const productLink = clone.querySelector('[data-role="product-link"]');
        const productImage = clone.querySelector('[data-role="product-image"]');
        const productName = clone.querySelector('[data-role="product-name"]');
        const productVariant = clone.querySelector('[data-role="product-variant"]');
        const productQuantity = clone.querySelector('[data-role="product-quantity"]');
        const productPrice = clone.querySelector('[data-role="product-price"]');

        const productId = item.id || item.productId || "";
        const name = item.name || item.productName || "Sản phẩm";
        const image = item.image || item.img || item.thumbnail || "";
        const price = Number(item.price || item.currentPrice || 0);
        const quantity = Number(item.quantity || item.qty || 1);
        const detailUrl = getProductDetailUrl(productId);

        if (productItem) {
            productItem.dataset.productId = productId;
        }

        if (productLink) {
            productLink.href = detailUrl;
        }

        if (productImage) {
            productImage.src = image;
            productImage.alt = name;
        }

        if (productName) {
            productName.textContent = name;
            productName.href = detailUrl;
        }

        if (productVariant) {
            productVariant.textContent = buildVariantText(item);
        }

        if (productQuantity) {
            productQuantity.textContent = "Số lượng: " + quantity;
        }

        if (productPrice) {
            productPrice.textContent = formatPrice(price * quantity);
        }

        return clone;
    }

    function renderProductsInOrder(order, productListElement) {
        if (!productListElement) {
            return;
        }

        const items = getOrderItems(order);
        productListElement.innerHTML = "";

        if (items.length === 0) {
            productListElement.innerHTML = "<p>Không có sản phẩm trong đơn hàng.</p>";
            return;
        }

        const fragment = document.createDocumentFragment();

        items.forEach(function (item) {
            const productElement = createOrderProductElement(item);

            if (productElement) {
                fragment.appendChild(productElement);
            }
        });

        productListElement.appendChild(fragment);
    }

    // 18. Render card đơn hàng

    function createMyOrderCard(order) {
        if (!myOrderCardTemplate) {
            return null;
        }

        const clone = myOrderCardTemplate.content.cloneNode(true);

        const card = clone.querySelector(".myOrderCard");
        const orderCode = clone.querySelector('[data-role="order-code"]');
        const orderStatus = clone.querySelector('[data-role="order-status"]');
        const orderDate = clone.querySelector('[data-role="order-date"]');
        const paymentMethod = clone.querySelector('[data-role="payment-method"]');
        const receiverName = clone.querySelector('[data-role="receiver-name"]');
        const receiverPhone = clone.querySelector('[data-role="receiver-phone"]');
        const receiverAddress = clone.querySelector('[data-role="receiver-address"]');

        const totalProducts = clone.querySelector('[data-role="total-products"]');
        const productList = clone.querySelector('[data-role="product-list"]');

        const orderTotal = clone.querySelector('[data-role="order-total"]');
        const orderSubtotal = clone.querySelector('[data-role="order-subtotal"]');
        const orderShippingFee = clone.querySelector('[data-role="order-shipping-fee"]');
        const orderPointDiscount = clone.querySelector('[data-role="order-point-discount"]');
        const orderVoucherDiscount = clone.querySelector('[data-role="order-voucher-discount"]');
        const orderDiscountTotal = clone.querySelector('[data-role="order-discount-total"]');
        const orderFinalTotal = clone.querySelector('[data-role="order-final-total"]');

        const orderDetailLink = clone.querySelector('[data-role="order-detail-link"]');
        const receivedOrderBtn = clone.querySelector('[data-role="received-order-btn"]');

        const orderId = getOrderId(order);
        const items = getOrderItems(order);
        const summary = getOrderSummary(order);
        const customer = order.customer || {};
        const statusText = getOrderStatusText(order);

        if (card) {
            card.dataset.orderId = orderId;
        }

        if (orderCode) {
            orderCode.textContent = orderId || "---";
        }

        if (orderStatus) {
            orderStatus.textContent = statusText;
            orderStatus.dataset.status = statusText;
        }

        if (orderDate) {
            orderDate.textContent = formatDateTime(order.createdAt || order.orderDate);
        }

        if (paymentMethod) {
            paymentMethod.textContent = getPaymentName(order);
        }

        if (receiverName) {
            receiverName.textContent = customer.fullName || customer.name || "---";
        }

        if (receiverPhone) {
            receiverPhone.textContent = customer.phone || "---";
        }

        if (receiverAddress) {
            receiverAddress.textContent = buildFullAddress(customer);
        }

        if (totalProducts) {
            totalProducts.textContent = getTotalQuantity(items) + " sản phẩm";
        }

        if (productList) {
            renderProductsInOrder(order, productList);
        }

        if (orderTotal) {
            orderTotal.textContent = formatPrice(summary.total);
        }

        if (orderSubtotal) {
            orderSubtotal.textContent = formatPrice(summary.subtotal);
        }

        if (orderShippingFee) {
            orderShippingFee.textContent = formatPrice(summary.shippingFee);
        }

        if (orderPointDiscount) {
            orderPointDiscount.textContent = formatDiscount(summary.pointDiscount);
            orderPointDiscount.closest(".orderTotalBreakdownRow").hidden = summary.pointDiscount <= 0;
        }

        if (orderVoucherDiscount) {
            orderVoucherDiscount.textContent = formatDiscount(summary.voucherDiscount);
            orderVoucherDiscount.closest(".orderTotalBreakdownRow").hidden = summary.voucherDiscount <= 0;
        }

        if (orderDiscountTotal) {
            orderDiscountTotal.textContent = formatDiscount(summary.discountTotal);
            orderDiscountTotal.closest(".orderTotalBreakdownRow").hidden = summary.discountTotal <= 0;
        }

        if (orderFinalTotal) {
            orderFinalTotal.textContent = formatPrice(summary.total);
        }

        if (orderDetailLink) {
            orderDetailLink.href = getOrderDetailUrl(orderId);
        }

        if (receivedOrderBtn) {
            receivedOrderBtn.dataset.orderId = orderId;
        }

        return clone;
    }

    function renderMyOrderList(orders) {
        if (!myOrderList) {
            return;
        }

        myOrderList.innerHTML = "";

        const fragment = document.createDocumentFragment();

        orders.forEach(function (order) {
            const orderCard = createMyOrderCard(order);

            if (orderCard) {
                fragment.appendChild(orderCard);
            }
        });

        myOrderList.appendChild(fragment);
    }

    // 19. Toggle dropdown

    function toggleDropdown(button, dropdown) {
        if (!button || !dropdown) {
            return;
        }

        const isOpening = dropdown.hidden;

        dropdown.hidden = !isOpening;
        button.setAttribute("aria-expanded", String(isOpening));
    }

    function handleToggleProducts(button) {
        const card = button.closest(".myOrderCard");
        const dropdown = card?.querySelector('[data-role="product-dropdown"]');

        toggleDropdown(button, dropdown);
    }

    function handleToggleTotal(button) {
        const card = button.closest(".myOrderCard");
        const dropdown = card?.querySelector('[data-role="total-breakdown"]');

        toggleDropdown(button, dropdown);
    }

    // 20. Cập nhật đơn hàng

    function updateOrderById(orderId, updater) {
        const orders = getOrdersFromStorage();

        const updatedOrders = orders.map(function (order) {
            const currentOrderId = getOrderId(order);

            if (currentOrderId !== orderId) {
                return order;
            }

            return updater(order);
        });

        saveOrdersToStorage(updatedOrders);

        const currentOrder = getDataFromStorage(CURRENT_ORDER_STORAGE_KEY, null);

        if (currentOrder && getOrderId(currentOrder) === orderId) {
            const updatedCurrentOrder = updater(currentOrder);
            saveDataToStorage(CURRENT_ORDER_STORAGE_KEY, updatedCurrentOrder);
        }
    }

    function markOrderAsReceived(orderId) {
        updateOrderById(orderId, function (order) {
            return {
                ...order,
                status: "completed",
                statusText: "Hoàn thành",
                completedAt: new Date().toISOString()
            };
        });

        selectedReceivedOrderId = orderId;
        openRewardPopup();
    }

    // 21. Popup nhận hàng

    function openRewardPopup() {
        if (!rewardPopup) {
            return;
        }

        rewardPopup.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeRewardPopupAndRefresh() {
        if (!rewardPopup) {
            return;
        }

        rewardPopup.hidden = true;
        document.body.style.overflow = "";
        renderMyOrderPage();
    }

    // 22. Popup đánh giá

    function openReviewPopup(orderId) {
        if (!reviewPopup) {
            return;
        }

        selectedReviewRating = 0;

        if (reviewOrderId) {
            reviewOrderId.value = orderId;
        }

        if (reviewRating) {
            reviewRating.value = "";
        }

        if (reviewContent) {
            reviewContent.value = "";
        }

        reviewStars?.querySelectorAll(".reviewStarBtn").forEach(function (button) {
            button.classList.remove("active");
        });

        reviewPopup.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeReviewPopupAndRefresh() {
        if (!reviewPopup) {
            return;
        }

        reviewPopup.hidden = true;
        document.body.style.overflow = "";
        renderMyOrderPage();
    }

    function selectReviewRating(ratingValue) {
        selectedReviewRating = Number(ratingValue || 0);

        if (reviewRating) {
            reviewRating.value = String(selectedReviewRating);
        }

        reviewStars?.querySelectorAll(".reviewStarBtn").forEach(function (button) {
            const buttonValue = Number(button.dataset.value || 0);
            button.classList.toggle("active", buttonValue <= selectedReviewRating);
        });
    }

    // 23. Lưu đánh giá và cộng điểm

    function getReviewsFromStorage() {
        const reviews = getDataFromStorage(ORDER_REVIEWS_STORAGE_KEY, []);

        if (!Array.isArray(reviews)) {
            return [];
        }

        return reviews;
    }

    function saveReview(reviewData) {
        const reviews = getReviewsFromStorage();

        const existedIndex = reviews.findIndex(function (review) {
            return review.orderId === reviewData.orderId;
        });

        if (existedIndex >= 0) {
            reviews[existedIndex] = reviewData;
        } else {
            reviews.unshift(reviewData);
        }

        saveDataToStorage(ORDER_REVIEWS_STORAGE_KEY, reviews);
    }

    function getUserPointMap() {
        const pointMap = getDataFromStorage(USER_POINTS_STORAGE_KEY, {});

        if (!pointMap || typeof pointMap !== "object" || Array.isArray(pointMap)) {
            return {};
        }

        return pointMap;
    }

    function getCurrentUserPoints() {
        const userKey = getCurrentUserKey();
        const currentUser = getCurrentUser();

        if (!userKey) {
            return 0;
        }

        const pointMap = getUserPointMap();

        if (typeof pointMap[userKey] === "number") {
            return pointMap[userKey];
        }

        if (currentUser && typeof currentUser.points === "number") {
            return currentUser.points;
        }

        return 0;
    }

    function saveCurrentUserPoints(points) {
        const userKey = getCurrentUserKey();
        const currentUser = getCurrentUser();

        if (!userKey) {
            return;
        }

        const pointMap = getUserPointMap();
        pointMap[userKey] = Number(points || 0);

        saveDataToStorage(USER_POINTS_STORAGE_KEY, pointMap);

        if (currentUser && typeof currentUser === "object") {
            currentUser.points = Number(points || 0);
            saveDataToStorage(CURRENT_USER_STORAGE_KEY, currentUser);
        }
    }

    function addReviewRewardPoints(orderId) {
        let shouldAddPoints = false;

        updateOrderById(orderId, function (order) {
            if (order.reviewRewardAdded) {
                return order;
            }

            shouldAddPoints = true;

            return {
                ...order,
                reviewRewardAdded: true,
                reviewRewardPoints: REVIEW_REWARD_POINTS
            };
        });

        if (!shouldAddPoints) {
            return false;
        }

        const currentPoints = getCurrentUserPoints();
        saveCurrentUserPoints(currentPoints + REVIEW_REWARD_POINTS);

        return true;
    }

    function handleSubmitReview(event) {
        event.preventDefault();

        const orderId = reviewOrderId?.value || selectedReceivedOrderId;
        const rating = Number(reviewRating?.value || 0);
        const content = reviewContent?.value.trim() || "";

        if (!orderId) {
            showMessage("Không tìm thấy đơn hàng cần đánh giá.");
            return;
        }

        if (rating <= 0) {
            showMessage("Vui lòng chọn số sao đánh giá.");
            return;
        }

        if (!content) {
            showMessage("Vui lòng nhập nội dung đánh giá.");
            return;
        }

        const reviewData = {
            orderId: orderId,
            userKey: getCurrentUserKey(),
            rating: rating,
            content: content,
            createdAt: new Date().toISOString()
        };

        saveReview(reviewData);

        updateOrderById(orderId, function (order) {
            return {
                ...order,
                reviewed: true,
                review: reviewData
            };
        });

        const addedPoints = addReviewRewardPoints(orderId);

        if (addedPoints) {
            showMessage("Cảm ơn bạn đã đánh giá. Bạn được cộng " + REVIEW_REWARD_POINTS + " điểm.");
        } else {
            showMessage("Cảm ơn bạn đã đánh giá đơn hàng.");
        }

        closeReviewPopupAndRefresh();
    }

    // 24. Gắn sự kiện danh sách đơn hàng

    myOrderList?.addEventListener("click", function (event) {
        const productToggleBtn = event.target.closest('[data-role="toggle-products-btn"]');
        const totalToggleBtn = event.target.closest('[data-role="toggle-total-btn"]');
        const receivedOrderBtn = event.target.closest('[data-role="received-order-btn"]');

        if (productToggleBtn) {
            handleToggleProducts(productToggleBtn);
            return;
        }

        if (totalToggleBtn) {
            handleToggleTotal(totalToggleBtn);
            return;
        }

        if (receivedOrderBtn) {
            const orderId = receivedOrderBtn.dataset.orderId;

            if (!orderId) {
                return;
            }

            markOrderAsReceived(orderId);
        }
    });

    // 25. Gắn sự kiện popup nhận hàng

    closeRewardPopupBtn?.addEventListener("click", closeRewardPopupAndRefresh);
    rewardPopupOverlay?.addEventListener("click", closeRewardPopupAndRefresh);
    rewardLaterBtn?.addEventListener("click", closeRewardPopupAndRefresh);

    rewardReviewNowBtn?.addEventListener("click", function () {
        if (rewardPopup) {
            rewardPopup.hidden = true;
        }

        openReviewPopup(selectedReceivedOrderId);
    });

    // 26. Gắn sự kiện popup đánh giá

    closeReviewPopupBtn?.addEventListener("click", closeReviewPopupAndRefresh);
    reviewPopupOverlay?.addEventListener("click", closeReviewPopupAndRefresh);
    cancelReviewBtn?.addEventListener("click", closeReviewPopupAndRefresh);

    reviewStars?.addEventListener("click", function (event) {
        const starButton = event.target.closest(".reviewStarBtn");

        if (!starButton) {
            return;
        }

        selectReviewRating(starButton.dataset.value);
    });

    reviewForm?.addEventListener("submit", handleSubmitReview);

    // 27. Đăng xuất

    logoutBtn?.addEventListener("click", function () {
        localStorage.setItem(IS_LOGIN_STORAGE_KEY, "false");
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);

        window.location.href = "../html/login.html";
    });

    // 28. Xử lý phím ESC

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        if (rewardPopup && !rewardPopup.hidden) {
            closeRewardPopupAndRefresh();
        }

        if (reviewPopup && !reviewPopup.hidden) {
            closeReviewPopupAndRefresh();
        }
    });

    // 29. Render trang my-order

    function renderMyOrderPage() {
        try {
            renderSidebarUser();
            updateEmptyMessageForGuest();

            if (!isUserLoggedIn()) {
                currentOrders = [];
                showPageState("empty");
                return;
            }

            currentOrders = getCurrentOrders();

            if (currentOrders.length === 0) {
                showPageState("empty");
                return;
            }

            renderMyOrderList(currentOrders);
            showPageState("content");
        } catch (error) {
            console.error("Lỗi my-order:", error);
            showPageState("error");
        }
    }

    // 30. Khởi tạo trang

    function initMyOrderPage() {
        showPageState("loading");

        setTimeout(function () {
            renderMyOrderPage();
        }, 250);
    }

    initMyOrderPage();
});