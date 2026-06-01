// =========================================================
// File: Frontend/js/order-detail.js
// Mục đích: Trang chi tiết đơn hàng lấy dữ liệu thật từ API,
//           fallback localStorage nếu là đơn khách vãng lai/API lỗi
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang chi tiết đơn hàng
    const orderDetailPage = document.querySelector('[data-page="order-detail"]');

    if (!orderDetailPage) {
        return;
    }


    // 2. Key localStorage
    const ORDERS_STORAGE_KEY = "orders";
    const CURRENT_ORDER_STORAGE_KEY = "current_order";
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const IS_LOGIN_STORAGE_KEY = "is_login";


    // 3. Biến trạng thái
    let currentOrder = null;


    // 4. Lấy DOM trạng thái trang
    const orderDetailLoadingState = document.getElementById("orderDetailLoadingState");
    const orderDetailErrorState = document.getElementById("orderDetailErrorState");
    const orderDetailEmptyState = document.getElementById("orderDetailEmptyState");
    const orderDetailContent = document.getElementById("orderDetailContent");


    // 5. Lấy DOM link quay lại
    const orderListBreadcrumbLink = document.getElementById("orderListBreadcrumbLink");
    const orderListBreadcrumbText = document.getElementById("orderListBreadcrumbText");
    const backToOrdersLink = document.getElementById("backToOrdersLink");
    const backToOrdersText = document.getElementById("backToOrdersText");


    // 6. Lấy DOM thông tin khách hàng
    const customerFullName = document.getElementById("customerFullName");
    const customerEmail = document.getElementById("customerEmail");
    const customerPhone = document.getElementById("customerPhone");
    const customerBirthday = document.getElementById("customerBirthday");
    const customerProvince = document.getElementById("customerProvince");
    const customerDistrict = document.getElementById("customerDistrict");
    const customerWard = document.getElementById("customerWard");
    const customerAddressDetail = document.getElementById("customerAddressDetail");
    const customerNote = document.getElementById("customerNote");


    // 7. Lấy DOM thông tin đơn hàng
    const detailOrderCode = document.getElementById("detailOrderCode");
    const orderStatusText = document.getElementById("orderStatusText");
    const shippingMethod = document.getElementById("shippingMethod");
    const paymentMethod = document.getElementById("paymentMethod");
    const orderCreatedAt = document.getElementById("orderCreatedAt");
    const paymentTime = document.getElementById("paymentTime");
    const shippingPickupTime = document.getElementById("shippingPickupTime");
    const completedTime = document.getElementById("completedTime");


    // 8. Lấy DOM minh chứng chuyển khoản
    const paymentProofBox = document.getElementById("paymentProofBox");
    const paymentProofFileName = document.getElementById("paymentProofFileName");
    const paymentProofFileType = document.getElementById("paymentProofFileType");
    const paymentProofFileSize = document.getElementById("paymentProofFileSize");


    // 9. Lấy DOM sản phẩm
    const orderProductEmptyState = document.getElementById("orderProductEmptyState");
    const orderProductList = document.getElementById("orderProductList");
    const orderProductItemTemplate = document.getElementById("orderProductItemTemplate");


    // 10. Lấy DOM tổng thanh toán
    const detailSubtotalAmount = document.getElementById("detailSubtotalAmount");
    const detailShippingFee = document.getElementById("detailShippingFee");
    const detailPointDiscountRow = document.getElementById("detailPointDiscountRow");
    const detailPointDiscount = document.getElementById("detailPointDiscount");
    const detailVoucherDiscountRow = document.getElementById("detailVoucherDiscountRow");
    const detailVoucherDiscount = document.getElementById("detailVoucherDiscount");
    const detailDiscountTotalRow = document.getElementById("detailDiscountTotalRow");
    const detailDiscountTotal = document.getElementById("detailDiscountTotal");
    const detailTotalAmount = document.getElementById("detailTotalAmount");


    // 11. Lấy DOM ưu đãi đã sử dụng
    const usedBenefitsBox = document.getElementById("usedBenefitsBox");
    const usedPointBenefit = document.getElementById("usedPointBenefit");
    const usedPointBenefitText = document.getElementById("usedPointBenefitText");
    const usedVoucherBenefit = document.getElementById("usedVoucherBenefit");
    const usedVoucherBenefitText = document.getElementById("usedVoucherBenefitText");


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
    function formatPrice(price) {
        if (window.CustomerApi && typeof window.CustomerApi.formatPrice === "function") {
            return window.CustomerApi.formatPrice(price);
        }

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
            return "---";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    function formatFileSize(size) {
        const fileSize = Number(size || 0);

        if (fileSize <= 0) {
            return "---";
        }

        if (fileSize < 1024) {
            return fileSize + " B";
        }

        if (fileSize < 1024 * 1024) {
            return (fileSize / 1024).toFixed(1) + " KB";
        }

        return (fileSize / (1024 * 1024)).toFixed(1) + " MB";
    }

    function setText(element, value) {
        if (!element) {
            return;
        }

        element.textContent = value || "---";
    }

    function getOrderQueryFromUrl() {
        const params = new URLSearchParams(window.location.search);

        return (
            params.get("id") ||
            params.get("order_id") ||
            params.get("orderId") ||
            params.get("code") ||
            params.get("order_code") ||
            ""
        );
    }

    function isNumericId(value) {
        return /^\d+$/.test(String(value || ""));
    }

    function getProductDetailUrl(productId) {
        if (!productId) {
            return "#";
        }

        return "../html/product-detail.html?id=" + encodeURIComponent(productId);
    }


    // 15. Đọc localStorage
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

    function getOrdersFromStorage() {
        const orders = getDataFromStorage(ORDERS_STORAGE_KEY, []);

        if (!Array.isArray(orders)) {
            return [];
        }

        return orders;
    }

    function getCurrentOrderFromStorage() {
        const order = getDataFromStorage(CURRENT_ORDER_STORAGE_KEY, null);

        if (!order || typeof order !== "object") {
            return null;
        }

        return order;
    }


    // 16. Kiểm tra người dùng
    function getCurrentUser() {
        if (window.CustomerApi && typeof window.CustomerApi.getCurrentCustomerFromLocal === "function") {
            return window.CustomerApi.getCurrentCustomerFromLocal();
        }

        const isLogin = localStorage.getItem(IS_LOGIN_STORAGE_KEY) === "true";
        const currentUserData = localStorage.getItem(CURRENT_USER_STORAGE_KEY);

        if (!isLogin || !currentUserData) {
            return null;
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

    async function isLoggedInCustomer() {
        if (!window.CustomerApi) {
            return Boolean(getCurrentUser());
        }

        const localUser = window.CustomerApi.getCurrentCustomerFromLocal();

        if (!localUser) {
            return false;
        }

        try {
            await window.CustomerApi.getCurrentCustomerFromSession();
            return true;
        } catch (error) {
            return false;
        }
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


    // 17. Thông tin trạng thái
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

    function getOrderStatusCode(order) {
        if (!order) {
            return "pending";
        }

        if (order.status && order.status.code) {
            return order.status.code;
        }

        return order.status || order.order_status || "pending";
    }

    function getOrderStatusText(order) {
        if (!order) {
            return "Chờ xác nhận";
        }

        if (order.status && order.status.label) {
            return order.status.label;
        }

        return order.statusText || order.statusName || getStatusInfo(getOrderStatusCode(order)).text;
    }


    // 18. Chuẩn hóa dữ liệu đơn hàng
    function getOrderIdentity(order) {
        if (!order) {
            return "";
        }

        return String(
            order.orderCode ||
            order.order_code ||
            order.orderId ||
            order.id ||
            ""
        );
    }

    function isSameOrder(order, queryValue) {
        if (!order || !queryValue) {
            return false;
        }

        const query = String(queryValue);

        return (
            String(order.id || "") === query ||
            String(order.orderId || "") === query ||
            String(order.orderCode || "") === query ||
            String(order.order_code || "") === query
        );
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
        const money = order.money || {};
        const benefits = order.benefits || {};

        const pointBenefit = benefits.point || null;
        const voucherBenefit = benefits.voucher || null;

        const pointDiscount = Number(
            summary.pointDiscount ??
            money.points_discount ??
            order.pointDiscount ??
            order.pointDiscountAmount ??
            pointBenefit?.discountAmount ??
            0
        );

        const voucherDiscount = Number(
            summary.voucherDiscount ??
            money.discount_amount ??
            order.voucherDiscount ??
            voucherBenefit?.discountAmount ??
            getOldVoucherDiscount(order)
        );

        const subtotal = Number(
            summary.subtotal ??
            money.total_product_price ??
            order.subtotal ??
            order.subtotalAmount ??
            calculateSubtotal(items)
        );

        const shippingFee = Number(
            summary.shippingFee ??
            money.shipping_fee ??
            order.shippingFee ??
            order.shipping?.fee ??
            order.shippingInfo?.fee ??
            0
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
            money.final_total ??
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

    function getOrderCustomer(order) {
        return order.customer || order.customerInfo || order.receiver || {};
    }

    function getOrderShipping(order) {
        return order.shipping || order.shippingInfo || {};
    }

    function getOrderPayment(order) {
        return order.payment || order.paymentInfo || {};
    }

    function getShippingName(order) {
        const shipping = getOrderShipping(order);

        return shipping.name || shipping.shippingName || order.shippingMethodName || "Giao hàng tiêu chuẩn";
    }

    function getPaymentName(order) {
        const payment = getOrderPayment(order);

        if (payment.method_label) {
            return payment.method_label;
        }

        if (payment.name) {
            return payment.name;
        }

        if (order.paymentMethodName) {
            return order.paymentMethodName;
        }

        if (payment.method === "cod" || order.paymentMethod === "cod" || order.payment_method === "cod") {
            return "Thanh toán khi nhận hàng";
        }

        if (
            payment.method === "bank_transfer" ||
            order.paymentMethod === "bank_transfer" ||
            order.payment_method === "bank_transfer" ||
            payment.method === "qr_transfer" ||
            order.paymentMethod === "qr_transfer"
        ) {
            return "Chuyển khoản ngân hàng";
        }

        return "---";
    }

    function getPaymentMethodCode(order) {
        const payment = getOrderPayment(order);

        return payment.method || order.paymentMethod || order.payment_method || "";
    }

    function getPaymentTimeText(order) {
        const paymentMethodCode = getPaymentMethodCode(order);

        if (order.paidAt || order.paid_at) {
            return formatDateTime(order.paidAt || order.paid_at);
        }

        if (order.paymentTime) {
            return formatDateTime(order.paymentTime);
        }

        if (paymentMethodCode === "cod") {
            return "Thanh toán khi nhận hàng";
        }

        if (paymentMethodCode === "bank_transfer" || paymentMethodCode === "qr_transfer") {
            return "Chờ cửa hàng xác nhận";
        }

        return "---";
    }

    function getShippingPickupTimeText(order) {
        return formatDateTime(order.shippingPickupAt || order.pickupAt || order.deliveryStartAt || order.shipping_started_at);
    }

    function getCompletedTimeText(order) {
        return formatDateTime(order.completedAt || order.receivedAt || order.cancelledAt || order.completed_at || order.cancelled_at);
    }

    function isActiveOrder(order) {
        const status = getOrderStatusCode(order);

        return status === "pending" || status === "confirmed" || status === "shipping";
    }

    function isCurrentUserOrder(order) {
        const currentUser = getCurrentUser();
        const currentUserKey = getCurrentUserKey();

        if (!currentUser || !currentUserKey) {
            return true;
        }

        if (order.userKey && String(order.userKey) === String(currentUserKey)) {
            return true;
        }

        if (order.userId && String(order.userId) === String(currentUserKey)) {
            return true;
        }

        const customer = getOrderCustomer(order);

        if (currentUser.email && customer.email && currentUser.email === customer.email) {
            return true;
        }

        if (currentUser.phone && customer.phone && currentUser.phone === customer.phone) {
            return true;
        }

        return true;
    }


    // 19. Chuẩn hóa đơn API
    function normalizeApiOrder(apiOrder, localOrder) {
        if (!apiOrder) {
            return null;
        }

        const localCustomer = localOrder
            ? localOrder.customer || localOrder.receiver || {}
            : {};

        const apiReceiver = apiOrder.receiver || {};
        const apiMoney = apiOrder.money || {};
        const apiPayment = apiOrder.payment || {};
        const apiStatus = apiOrder.status || {};

        const pointDiscount = Number(apiMoney.points_discount || 0);
        const voucherDiscount = Number(apiMoney.discount_amount || 0);

        return {
            id: apiOrder.id,
            orderId: apiOrder.order_code || String(apiOrder.id),
            orderCode: apiOrder.order_code || String(apiOrder.id),

            createdAt: apiOrder.created_at || "",
            orderDate: apiOrder.created_at || "",

            status: apiStatus.code || apiOrder.order_status || "pending",
            statusText: apiStatus.label || getStatusInfo(apiOrder.order_status).text,

            paymentMethod: apiPayment.method || apiOrder.payment_method || "cod",
            paymentMethodName: apiPayment.method_label || "",

            customerType: "member",
            userKey: getCurrentUserKey(),

            customer: {
                fullName: apiReceiver.name || localCustomer.fullName || localCustomer.name || "",
                name: apiReceiver.name || localCustomer.name || localCustomer.fullName || "",
                email: localCustomer.email || "",
                phone: apiReceiver.phone || localCustomer.phone || "",
                birthDate: localCustomer.birthDate || localCustomer.birthday || "",
                province: localCustomer.province || "",
                district: localCustomer.district || "",
                ward: localCustomer.ward || "",
                address: apiReceiver.shipping_address || localCustomer.address || "",
                addressDetail: localCustomer.addressDetail || localCustomer.address || "",
                note: apiOrder.note || localCustomer.note || ""
            },

            receiver: {
                fullName: apiReceiver.name || localCustomer.fullName || localCustomer.name || "",
                name: apiReceiver.name || localCustomer.name || localCustomer.fullName || "",
                email: localCustomer.email || "",
                phone: apiReceiver.phone || localCustomer.phone || "",
                shipping_address: apiReceiver.shipping_address || "",
                address: apiReceiver.shipping_address || localCustomer.address || "",
                province: localCustomer.province || "",
                district: localCustomer.district || "",
                ward: localCustomer.ward || "",
                note: apiOrder.note || localCustomer.note || ""
            },

            note: apiOrder.note || "",

            items: normalizeApiOrderItems(apiOrder.items || []),

            payment: {
                method: apiPayment.method || apiOrder.payment_method || "cod",
                method_label: apiPayment.method_label || ""
            },

            summary: {
                subtotal: Number(apiMoney.total_product_price || 0),
                shippingFee: Number(apiMoney.shipping_fee || 0),
                pointDiscount: pointDiscount,
                voucherDiscount: voucherDiscount,
                discountTotal: pointDiscount + voucherDiscount,
                total: Number(apiMoney.final_total || 0)
            },

            benefits: {
                point: pointDiscount > 0
                    ? {
                        points: localOrder && localOrder.benefits && localOrder.benefits.point
                            ? localOrder.benefits.point.points
                            : 0,
                        discountAmount: pointDiscount
                    }
                    : null,
                voucher: voucherDiscount > 0
                    ? {
                        code: localOrder && localOrder.benefits && localOrder.benefits.voucher
                            ? localOrder.benefits.voucher.code
                            : "VOUCHER",
                        name: localOrder && localOrder.benefits && localOrder.benefits.voucher
                            ? localOrder.benefits.voucher.name
                            : "Mã giảm giá",
                        discountAmount: voucherDiscount
                    }
                    : null
            },

            raw: apiOrder
        };
    }

    function normalizeApiOrderItems(items) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items.map(function (item) {
            const product = item.product || {};

            return {
                id: product.id || item.product_id || "",
                productId: product.id || item.product_id || "",
                product_id: product.id || item.product_id || "",

                variantId: item.variant_id || null,
                productVariantId: item.variant_id || null,
                product_variant_id: item.variant_id || null,

                name: product.name || item.product_name || "Sản phẩm",
                productName: product.name || item.product_name || "Sản phẩm",

                image: product.image_url || item.product_image || "../img/products/default.jpg",

                color: item.color_name || "",
                size: item.size_name || "",
                sku: item.sku || "",

                price: Number(item.price || 0),
                oldPrice: 0,
                quantity: Number(item.quantity || 1),
                totalPrice: Number(item.total_price || 0),

                meta: buildVariantText({
                    color: item.color_name || "",
                    size: item.size_name || ""
                })
            };
        });
    }


    // 20. Tìm đơn hàng local/API
    function getLocalOrderByQuery(queryValue) {
        const currentOrder = getCurrentOrderFromStorage();

        if (currentOrder) {
            if (!queryValue || isSameOrder(currentOrder, queryValue)) {
                return currentOrder;
            }
        }

        const orders = getOrdersFromStorage();

        return orders.find(function (order) {
            return isSameOrder(order, queryValue);
        }) || null;
    }

    async function getApiOrderByQuery(queryValue, localOrder) {
        if (!queryValue) {
            return null;
        }

        const endpoint = isNumericId(queryValue)
            ? "orders/get-order-detail.php?id=" + encodeURIComponent(queryValue)
            : "orders/get-order-detail.php?order_code=" + encodeURIComponent(queryValue);

        const response = await getApi(endpoint);
        const apiOrder = response.data && response.data.order
            ? response.data.order
            : null;

        return normalizeApiOrder(apiOrder, localOrder);
    }

    async function loadOrderDetailData() {
        const queryValue = getOrderQueryFromUrl();
        const localOrder = getLocalOrderByQuery(queryValue);
        const loggedIn = await isLoggedInCustomer();

        if (loggedIn && queryValue) {
            try {
                const apiOrder = await getApiOrderByQuery(queryValue, localOrder);

                if (apiOrder) {
                    currentOrder = apiOrder;
                    return;
                }
            } catch (error) {
                console.warn("Không lấy được chi tiết đơn hàng từ API, fallback localStorage:", error);
            }
        }

        currentOrder = localOrder;

        if (currentOrder && !isCurrentUserOrder(currentOrder)) {
            currentOrder = null;
        }
    }


    // 21. Hiển thị trạng thái trang
    function showPageState(type) {
        if (orderDetailLoadingState) orderDetailLoadingState.hidden = true;
        if (orderDetailErrorState) orderDetailErrorState.hidden = true;
        if (orderDetailEmptyState) orderDetailEmptyState.hidden = true;
        if (orderDetailContent) orderDetailContent.hidden = true;

        if (type === "loading" && orderDetailLoadingState) {
            orderDetailLoadingState.hidden = false;
        }

        if (type === "error" && orderDetailErrorState) {
            orderDetailErrorState.hidden = false;
        }

        if (type === "empty" && orderDetailEmptyState) {
            orderDetailEmptyState.hidden = false;
        }

        if (type === "content" && orderDetailContent) {
            orderDetailContent.hidden = false;
        }
    }


    // 22. Render link quay lại
    function renderBackLinks(order) {
        const active = isActiveOrder(order);
        const href = active ? "../html/my-order.html" : "../html/order-history.html";
        const text = active ? "Đơn hàng của tôi" : "Lịch sử mua hàng";
        const backText = active ? "Quay lại đơn hàng của tôi" : "Quay lại lịch sử mua hàng";

        if (orderListBreadcrumbLink) {
            orderListBreadcrumbLink.href = href;
        }

        if (orderListBreadcrumbText) {
            orderListBreadcrumbText.textContent = text;
        }

        if (backToOrdersLink) {
            backToOrdersLink.href = href;
        }

        if (backToOrdersText) {
            backToOrdersText.textContent = backText;
        }
    }


    // 23. Render thông tin khách hàng
    function renderCustomerInfo(order) {
        const customer = getOrderCustomer(order);

        setText(customerFullName, customer.fullName || customer.name);
        setText(customerEmail, customer.email);
        setText(customerPhone, customer.phone);
        setText(customerBirthday, customer.birthDate || customer.birthday);
        setText(customerProvince, customer.province || customer.city);
        setText(customerDistrict, customer.district);
        setText(customerWard, customer.ward);

        setText(
            customerAddressDetail,
            customer.addressDetail ||
            customer.address ||
            customer.shipping_address
        );

        setText(customerNote, customer.note || order.note || "Không có");
    }


    // 24. Render thông tin đơn hàng
    function renderOrderStatus(order) {
        if (!orderStatusText) {
            return;
        }

        const statusCode = getOrderStatusCode(order);
        const statusInfo = getStatusInfo(statusCode);

        orderStatusText.textContent = getOrderStatusText(order);
        orderStatusText.className = "statusBadge " + statusInfo.className;
        orderStatusText.dataset.status = statusCode;
    }

    function renderOrderInfo(order) {
        setText(detailOrderCode, getOrderIdentity(order));
        renderOrderStatus(order);

        setText(shippingMethod, getShippingName(order));
        setText(paymentMethod, getPaymentName(order));
        setText(orderCreatedAt, formatDateTime(order.createdAt || order.orderDate || order.created_at));
        setText(paymentTime, getPaymentTimeText(order));
        setText(shippingPickupTime, getShippingPickupTimeText(order));
        setText(completedTime, getCompletedTimeText(order));
    }


    // 25. Render minh chứng chuyển khoản
    function renderPaymentProof(order) {
        if (!paymentProofBox) {
            return;
        }

        const payment = getOrderPayment(order);
        const proof = payment.proof || order.paymentProof || null;

        const fileName =
            proof?.fileName ||
            proof?.name ||
            payment.transferProofFileName ||
            order.transferProofFileName ||
            "";

        const fileType =
            proof?.fileType ||
            proof?.type ||
            payment.transferProofFileType ||
            order.transferProofFileType ||
            "";

        const fileSize =
            proof?.fileSize ||
            proof?.size ||
            payment.transferProofFileSize ||
            order.transferProofFileSize ||
            0;

        if (!fileName) {
            paymentProofBox.hidden = true;
            return;
        }

        paymentProofBox.hidden = false;

        setText(paymentProofFileName, fileName);
        setText(paymentProofFileType, fileType || "---");
        setText(paymentProofFileSize, formatFileSize(fileSize));
    }


    // 26. Render sản phẩm
    function buildVariantText(item) {
        if (item.meta) {
            return item.meta;
        }

        const parts = [];

        if (item.color || item.color_name) {
            parts.push("Màu: " + (item.color || item.color_name));
        }

        if (item.size || item.size_name) {
            parts.push("Size: " + (item.size || item.size_name));
        }

        if (parts.length === 0) {
            return "Chưa chọn phân loại";
        }

        return parts.join(" / ");
    }

    function normalizeProductItem(item) {
        const product = item.product || {};

        return {
            id: product.id || item.id || item.productId || item.product_id || "",
            name: product.name || item.name || item.productName || item.product_name || "Sản phẩm",
            image: product.image_url || item.image || item.img || item.thumbnail || "../img/products/default.jpg",
            price: Number(item.price || item.currentPrice || 0),
            oldPrice: Number(item.oldPrice || 0),
            color: item.color || item.color_name || item.selectedColor || "",
            size: item.size || item.size_name || item.selectedSize || "",
            meta: item.meta || "",
            quantity: Number(item.quantity || item.qty || 1),
            totalPrice: Number(item.totalPrice || item.total_price || 0)
        };
    }

    function calculateLineTotal(item) {
        if (item.totalPrice && Number(item.totalPrice) > 0) {
            return Number(item.totalPrice);
        }

        return Number(item.price || 0) * Number(item.quantity || 0);
    }

    function createOrderProductElement(item) {
        if (!orderProductItemTemplate) {
            return null;
        }

        const product = normalizeProductItem(item);
        const clone = orderProductItemTemplate.content.cloneNode(true);

        const productItem = clone.querySelector(".orderProductItem");
        const productLinks = clone.querySelectorAll('[data-role="product-link"]');
        const productImage = clone.querySelector('[data-role="product-image"]');
        const productName = clone.querySelector('[data-role="product-name"]');
        const productColor = clone.querySelector('[data-role="product-color"]');
        const productSize = clone.querySelector('[data-role="product-size"]');
        const productQuantity = clone.querySelector('[data-role="product-quantity"]');
        const productOldPrice = clone.querySelector('[data-role="product-old-price"]');
        const productSalePrice = clone.querySelector('[data-role="product-sale-price"]');
        const productLineTotal = clone.querySelector('[data-role="product-line-total"]');

        const detailUrl = getProductDetailUrl(product.id);

        if (productItem) {
            productItem.dataset.productId = product.id;
        }

        productLinks.forEach(function (link) {
            link.href = detailUrl;
        });

        if (productImage) {
            productImage.src = product.image;
            productImage.alt = product.name;
        }

        setText(productName, product.name);

        if (productColor) {
            productColor.textContent = product.color
                ? "Màu: " + product.color
                : buildVariantText(product);
        }

        if (productSize) {
            productSize.textContent = "Size: " + (product.size || "Chưa chọn");
        }

        if (productQuantity) {
            productQuantity.textContent = "Số lượng: " + product.quantity;
        }

        if (productOldPrice) {
            if (product.oldPrice && product.oldPrice > product.price) {
                productOldPrice.textContent = formatPrice(product.oldPrice);
            } else {
                productOldPrice.textContent = "";
            }
        }

        setText(productSalePrice, formatPrice(product.price));
        setText(productLineTotal, "Thành tiền: " + formatPrice(calculateLineTotal(product)));

        return clone;
    }

    function renderOrderProducts(order) {
        if (!orderProductList || !orderProductItemTemplate) {
            return;
        }

        const items = getOrderItems(order);

        orderProductList.innerHTML = "";

        if (items.length === 0) {
            if (orderProductEmptyState) {
                orderProductEmptyState.hidden = false;
            }

            return;
        }

        if (orderProductEmptyState) {
            orderProductEmptyState.hidden = true;
        }

        const fragment = document.createDocumentFragment();

        items.forEach(function (item) {
            const productElement = createOrderProductElement(item);

            if (productElement) {
                fragment.appendChild(productElement);
            }
        });

        orderProductList.appendChild(fragment);
    }


    // 27. Render tổng thanh toán
    function renderOrderSummary(order) {
        const summary = getOrderSummary(order);

        setText(detailSubtotalAmount, formatPrice(summary.subtotal));
        setText(detailShippingFee, formatPrice(summary.shippingFee));

        if (detailPointDiscountRow && detailPointDiscount) {
            if (summary.pointDiscount > 0) {
                detailPointDiscountRow.hidden = false;
                detailPointDiscount.textContent = formatDiscount(summary.pointDiscount);
            } else {
                detailPointDiscountRow.hidden = true;
                detailPointDiscount.textContent = "-0đ";
            }
        }

        if (detailVoucherDiscountRow && detailVoucherDiscount) {
            if (summary.voucherDiscount > 0) {
                detailVoucherDiscountRow.hidden = false;
                detailVoucherDiscount.textContent = formatDiscount(summary.voucherDiscount);
            } else {
                detailVoucherDiscountRow.hidden = true;
                detailVoucherDiscount.textContent = "-0đ";
            }
        }

        if (detailDiscountTotalRow && detailDiscountTotal) {
            if (summary.discountTotal > 0) {
                detailDiscountTotalRow.hidden = false;
                detailDiscountTotal.textContent = formatDiscount(summary.discountTotal);
            } else {
                detailDiscountTotalRow.hidden = true;
                detailDiscountTotal.textContent = "-0đ";
            }
        }

        setText(detailTotalAmount, formatPrice(summary.total));
    }


    // 28. Render ưu đãi đã sử dụng
    function renderUsedBenefits(order) {
        const summary = getOrderSummary(order);
        const benefits = order.benefits || {};

        const pointBenefit = benefits.point || null;
        const voucherBenefit = benefits.voucher || null;

        const hasPoint = summary.pointDiscount > 0;
        const hasVoucher = summary.voucherDiscount > 0;

        if (usedBenefitsBox) {
            usedBenefitsBox.hidden = !(hasPoint || hasVoucher);
        }

        if (usedPointBenefit && usedPointBenefitText) {
            if (hasPoint) {
                usedPointBenefit.hidden = false;

                if (pointBenefit && pointBenefit.points) {
                    usedPointBenefitText.textContent =
                        "Đã đổi " +
                        Number(pointBenefit.points || 0) +
                        " điểm, giảm " +
                        formatPrice(summary.pointDiscount) +
                        ".";
                } else {
                    usedPointBenefitText.textContent =
                        "Đã sử dụng điểm, giảm " +
                        formatPrice(summary.pointDiscount) +
                        ".";
                }
            } else {
                usedPointBenefit.hidden = true;
                usedPointBenefitText.textContent = "Không sử dụng điểm";
            }
        }

        if (usedVoucherBenefit && usedVoucherBenefitText) {
            if (hasVoucher) {
                usedVoucherBenefit.hidden = false;
                usedVoucherBenefitText.textContent =
                    "Đã dùng mã " +
                    (voucherBenefit?.code || "VOUCHER") +
                    ", giảm " +
                    formatPrice(summary.voucherDiscount) +
                    ".";
            } else {
                usedVoucherBenefit.hidden = true;
                usedVoucherBenefitText.textContent = "Không sử dụng voucher";
            }
        }
    }


    // 29. Render toàn bộ trang
    function renderOrderDetail(order) {
        renderBackLinks(order);
        renderCustomerInfo(order);
        renderOrderInfo(order);
        renderPaymentProof(order);
        renderOrderProducts(order);
        renderOrderSummary(order);
        renderUsedBenefits(order);

        showPageState("content");
    }


    // 30. Xử lý tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword ? searchKeyword.value.trim() : "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 31. Gắn sự kiện
    function bindEvents() {
        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }
    }


    // 32. Khởi tạo trang chi tiết đơn hàng
    async function initOrderDetailPage() {
        try {
            bindEvents();
            showPageState("loading");

            await loadOrderDetailData();

            if (!currentOrder) {
                showPageState("empty");
                return;
            }

            renderOrderDetail(currentOrder);
        } catch (error) {
            console.error("Lỗi order-detail:", error);
            showPageState("error");
        }
    }

    initOrderDetailPage();
});