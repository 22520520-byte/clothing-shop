// 1. Khởi tạo order-detail page

document.addEventListener("DOMContentLoaded", function () {
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

    // 13. Hàm tiện ích

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
            return "---";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "---";
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

    function getOrderIdFromUrl() {
        const params = new URLSearchParams(window.location.search);

        return params.get("id") || params.get("orderId") || "";
    }

    function getProductDetailUrl(productId) {
        if (!productId) {
            return "#";
        }

        return "../html/product-detail.html?id=" + encodeURIComponent(productId);
    }

    // 14. Đọc ghi localStorage

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

    // 15. Kiểm tra người dùng

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

    // 16. Chuẩn hóa dữ liệu đơn hàng

    function getOrderId(order) {
        if (!order) {
            return "";
        }

        return order.orderId || order.id || "";
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

    function getOrderCustomer(order) {
        return order.customer || order.customerInfo || order.receiver || {};
    }

    function getOrderShipping(order) {
        return order.shipping || order.shippingInfo || {};
    }

    function getOrderPayment(order) {
        return order.payment || order.paymentInfo || {};
    }

    function getOrderStatusText(order) {
        return order.statusText || order.statusName || order.status || "Chờ xác nhận";
    }

    function getShippingName(order) {
        const shipping = getOrderShipping(order);

        return shipping.name || shipping.shippingName || order.shippingMethodName || "---";
    }

    function getPaymentName(order) {
        const payment = getOrderPayment(order);

        if (payment.name) {
            return payment.name;
        }

        if (order.paymentMethodName) {
            return order.paymentMethodName;
        }

        if (payment.method === "cod" || order.paymentMethod === "cod") {
            return "Thanh toán khi nhận hàng";
        }

        if (payment.method === "qr_transfer" || order.paymentMethod === "qr_transfer") {
            return "Chuyển khoản qua mã QR";
        }

        return "---";
    }

    function getPaymentMethodCode(order) {
        const payment = getOrderPayment(order);

        return payment.method || order.paymentMethod || "";
    }

    function getPaymentTimeText(order) {
        const paymentMethodCode = getPaymentMethodCode(order);

        if (order.paidAt) {
            return formatDateTime(order.paidAt);
        }

        if (order.paymentTime) {
            return formatDateTime(order.paymentTime);
        }

        if (paymentMethodCode === "cod") {
            return "Thanh toán khi nhận hàng";
        }

        if (paymentMethodCode === "qr_transfer") {
            return "Chờ cửa hàng xác nhận";
        }

        return "---";
    }

    function getShippingPickupTimeText(order) {
        return formatDateTime(order.shippingPickupAt || order.pickupAt || order.deliveryStartAt);
    }

    function getCompletedTimeText(order) {
        return formatDateTime(order.completedAt || order.receivedAt || order.cancelledAt);
    }

    function isActiveOrder(order) {
        const status = String(order.status || "").toLowerCase();
        const statusText = getOrderStatusText(order);

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

    function isCurrentUserOrder(order) {
        const currentUser = getCurrentUser();
        const currentUserKey = getCurrentUserKey();

        if (!currentUser || !currentUserKey) {
            return true;
        }

        if (order.userKey && order.userKey === currentUserKey) {
            return true;
        }

        if (order.userId && order.userId === currentUserKey) {
            return true;
        }

        const customer = getOrderCustomer(order);

        if (currentUser.email && customer.email && currentUser.email === customer.email) {
            return true;
        }

        if (currentUser.phone && customer.phone && currentUser.phone === customer.phone) {
            return true;
        }

        return false;
    }

    // 17. Tìm đơn hàng

    function findOrderById(orderId) {
        const currentOrder = getCurrentOrderFromStorage();

        if (currentOrder) {
            const currentOrderId = getOrderId(currentOrder);

            if (!orderId || currentOrderId === orderId) {
                return currentOrder;
            }
        }

        const orders = getOrdersFromStorage();

        return orders.find(function (order) {
            return getOrderId(order) === orderId;
        }) || null;
    }

    function loadOrderDetailData() {
        const orderId = getOrderIdFromUrl();

        currentOrder = findOrderById(orderId);

        if (currentOrder && !isCurrentUserOrder(currentOrder)) {
            currentOrder = null;
        }
    }

    // 18. Hiển thị trạng thái

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

    // 19. Render link quay lại

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

    // 20. Render thông tin khách hàng

    function renderCustomerInfo(order) {
        const customer = getOrderCustomer(order);

        setText(customerFullName, customer.fullName || customer.name);
        setText(customerEmail, customer.email);
        setText(customerPhone, customer.phone);
        setText(customerBirthday, customer.birthDate || customer.birthday);
        setText(customerProvince, customer.province || customer.city);
        setText(customerDistrict, customer.district);
        setText(customerWard, customer.ward);
        setText(customerAddressDetail, customer.address || customer.addressDetail);
        setText(customerNote, customer.note || order.note || "Không có");
    }

    // 21. Render thông tin đơn hàng

    function renderOrderStatus(order) {
        if (!orderStatusText) {
            return;
        }

        const statusText = getOrderStatusText(order);

        orderStatusText.textContent = statusText;
        orderStatusText.dataset.status = statusText;
    }

    function renderOrderInfo(order) {
        setText(detailOrderCode, getOrderId(order));
        renderOrderStatus(order);

        setText(shippingMethod, getShippingName(order));
        setText(paymentMethod, getPaymentName(order));
        setText(orderCreatedAt, formatDateTime(order.createdAt || order.orderDate));
        setText(paymentTime, getPaymentTimeText(order));
        setText(shippingPickupTime, getShippingPickupTimeText(order));
        setText(completedTime, getCompletedTimeText(order));
    }

    // 22. Render minh chứng chuyển khoản

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

    // 23. Render sản phẩm

    function normalizeProductItem(item) {
        return {
            id: item.id || item.productId || "",
            name: item.name || item.productName || "Sản phẩm",
            image: item.image || item.img || item.thumbnail || "",
            price: Number(item.price || item.currentPrice || 0),
            oldPrice: Number(item.oldPrice || 0),
            color: item.color || item.selectedColor || "",
            size: item.size || item.selectedSize || "",
            meta: item.meta || "",
            quantity: Number(item.quantity || item.qty || 1)
        };
    }

    function calculateLineTotal(item) {
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
            if (product.color) {
                productColor.textContent = "Màu: " + product.color;
            } else if (product.meta) {
                productColor.textContent = product.meta;
            } else {
                productColor.textContent = "Màu: Chưa chọn";
            }
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

    // 24. Render tổng thanh toán

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
            detailDiscountTotalRow.hidden = summary.discountTotal <= 0;
            detailDiscountTotal.textContent = formatDiscount(summary.discountTotal);
        }

        setText(detailTotalAmount, formatPrice(summary.total));
    }

    // 25. Render ưu đãi đã sử dụng

    function renderUsedBenefits(order) {
        const summary = getOrderSummary(order);
        const benefits = order.benefits || {};

        const pointBenefit = benefits.point || null;
        const voucherBenefit = benefits.voucher || order.voucher || null;

        const hasPoint = pointBenefit && summary.pointDiscount > 0;
        const hasVoucher = voucherBenefit && summary.voucherDiscount > 0;

        if (usedBenefitsBox) {
            usedBenefitsBox.hidden = !(hasPoint || hasVoucher);
        }

        if (usedPointBenefit && usedPointBenefitText) {
            if (hasPoint) {
                usedPointBenefit.hidden = false;
                usedPointBenefitText.textContent =
                    "Đã đổi " + Number(pointBenefit.points || 0) + " điểm, giảm " + formatPrice(summary.pointDiscount) + ".";
            } else {
                usedPointBenefit.hidden = true;
                usedPointBenefitText.textContent = "Không sử dụng điểm";
            }
        }

        if (usedVoucherBenefit && usedVoucherBenefitText) {
            if (hasVoucher) {
                usedVoucherBenefit.hidden = false;
                usedVoucherBenefitText.textContent =
                    "Đã dùng mã " + (voucherBenefit.code || "VOUCHER") + ", giảm " + formatPrice(summary.voucherDiscount) + ".";
            } else {
                usedVoucherBenefit.hidden = true;
                usedVoucherBenefitText.textContent = "Không sử dụng voucher";
            }
        }
    }

    // 26. Render toàn bộ trang

    function renderOrderDetailPage() {
        if (!currentOrder) {
            showPageState("empty");
            return;
        }

        renderBackLinks(currentOrder);
        renderCustomerInfo(currentOrder);
        renderOrderInfo(currentOrder);
        renderPaymentProof(currentOrder);
        renderOrderProducts(currentOrder);
        renderOrderSummary(currentOrder);
        renderUsedBenefits(currentOrder);

        showPageState("content");
    }

    // 27. Xử lý tìm kiếm

    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword?.value.trim() || "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }

    // 28. Gắn sự kiện

    function bindEvents() {
        searchForm?.addEventListener("submit", handleSearchSubmit);
    }

    // 29. Khởi tạo trang

    function initOrderDetailPage() {
        showPageState("loading");

        try {
            loadOrderDetailData();
            bindEvents();

            setTimeout(function () {
                renderOrderDetailPage();
            }, 250);
        } catch (error) {
            console.error("Lỗi order-detail:", error);
            showPageState("error");
        }
    }

    initOrderDetailPage();
});