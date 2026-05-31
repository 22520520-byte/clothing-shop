// 1. Chờ HTML tải xong

document.addEventListener("DOMContentLoaded", function () {
    const successPage = document.querySelector(".successPage");

    if (!successPage) {
        return;
    }

    // 2. Key localStorage

    const ORDERS_STORAGE_KEY = "orders";
    const CURRENT_ORDER_STORAGE_KEY = "current_order";

    // 3. Lấy DOM trạng thái

    const orderSuccessLoadingState = document.getElementById("orderSuccessLoadingState");
    const orderSuccessErrorState = document.getElementById("orderSuccessErrorState");
    const orderSuccessEmptyState = document.getElementById("orderSuccessEmptyState");
    const orderSuccessContent = document.getElementById("orderSuccessContent");

    // 4. Lấy DOM thông tin tổng quan đơn hàng

    const successTitle = document.getElementById("successTitle");
    const successDescription = document.getElementById("successDescription");

    const successOrderCode = document.getElementById("successOrderCode");
    const successOrderCreatedAt = document.getElementById("successOrderCreatedAt");
    const successOrderStatus = document.getElementById("successOrderStatus");
    const successPaymentMethod = document.getElementById("successPaymentMethod");
    const successGrandTotal = document.getElementById("successGrandTotal");

    // 5. Lấy DOM thông tin nhận hàng

    const successReceiverName = document.getElementById("successReceiverName");
    const successReceiverPhone = document.getElementById("successReceiverPhone");
    const successReceiverEmail = document.getElementById("successReceiverEmail");
    const successReceiverAddress = document.getElementById("successReceiverAddress");
    const successOrderNote = document.getElementById("successOrderNote");

    // 6. Lấy DOM sản phẩm đã đặt

    const orderedProductEmptyState = document.getElementById("orderedProductEmptyState");
    const orderedProductList = document.getElementById("orderedProductList");
    const orderedProductItemTemplate = document.getElementById("orderedProductItemTemplate");

    // 7. Lấy DOM chi tiết thanh toán

    const successSubtotalAmount = document.getElementById("successSubtotalAmount");
    const successShippingFee = document.getElementById("successShippingFee");

    const successPointDiscountRow = document.getElementById("successPointDiscountRow");
    const successPointDiscountAmount = document.getElementById("successPointDiscountAmount");

    const successVoucherDiscountRow = document.getElementById("successVoucherDiscountRow");
    const successVoucherDiscountAmount = document.getElementById("successVoucherDiscountAmount");

    const successDiscountTotalRow = document.getElementById("successDiscountTotalRow");
    const successDiscountAmount = document.getElementById("successDiscountAmount");

    const successTotalAmount = document.getElementById("successTotalAmount");

    // 8. Lấy DOM ưu đãi đã sử dụng

    const usedBenefitsBox = document.getElementById("usedBenefitsBox");
    const usedPointBenefit = document.getElementById("usedPointBenefit");
    const usedPointBenefitText = document.getElementById("usedPointBenefitText");
    const usedVoucherBenefit = document.getElementById("usedVoucherBenefit");
    const usedVoucherBenefitText = document.getElementById("usedVoucherBenefitText");

    // 9. Lấy DOM thông báo và nút điều hướng

    const guestOrderNotice = document.getElementById("guestOrderNotice");
    const viewMyOrdersButton = document.getElementById("viewMyOrdersButton");
    const backToCartButton = document.getElementById("backToCartButton");

    // 10. Hàm tiện ích

    function formatPrice(price) {
        return Number(price || 0).toLocaleString("vi-VN") + "đ";
    }

    function formatDiscount(price) {
        const value = Number(price || 0);

        if (value <= 0) {
            return "0đ";
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

    function getOrderIdFromUrl() {
        const params = new URLSearchParams(window.location.search);

        return params.get("id") || "";
    }

    function getProductDetailUrl(productId) {
        if (!productId) {
            return "#";
        }

        return "../html/product-detail.html?id=" + encodeURIComponent(productId);
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

    // 11. Đọc localStorage

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
        const currentOrder = getDataFromStorage(CURRENT_ORDER_STORAGE_KEY, null);

        if (!currentOrder || typeof currentOrder !== "object") {
            return null;
        }

        return currentOrder;
    }

    // 12. Lấy đơn hàng cần hiển thị

    function getOrderById(orderId) {
        const currentOrder = getCurrentOrderFromStorage();

        if (currentOrder) {
            const currentOrderId = currentOrder.orderId || currentOrder.id || "";

            if (!orderId || currentOrderId === orderId) {
                return currentOrder;
            }
        }

        const orders = getOrdersFromStorage();

        return orders.find(function (order) {
            return order.orderId === orderId || order.id === orderId;
        }) || null;
    }

    function getOrderToRender() {
        const orderId = getOrderIdFromUrl();

        return getOrderById(orderId);
    }

    // 13. Chuẩn hóa dữ liệu đơn hàng

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
            return total + Number(item.price || 0) * Number(item.quantity || item.qty || 0);
        }, 0);
    }

    function getOrderSummary(order) {
        const items = getOrderItems(order);
        const summary = order.summary || {};
        const benefits = order.benefits || {};

        const pointBenefit = benefits.point || null;
        const voucherBenefit = benefits.voucher || null;

        const subtotalValue = Number(
            summary.subtotal ??
            order.subtotal ??
            calculateSubtotal(items)
        );

        const shippingFeeValue = Number(
            summary.shippingFee ??
            order.shippingFee ??
            order.shipping?.fee ??
            0
        );

        const pointDiscountValue = Number(
            summary.pointDiscount ??
            order.pointDiscount ??
            pointBenefit?.discountAmount ??
            0
        );

        const voucherDiscountValue = Number(
            summary.voucherDiscount ??
            order.voucherDiscount ??
            voucherBenefit?.discountAmount ??
            0
        );

        const discountTotalValue = Number(
            summary.discountTotal ??
            order.discountTotal ??
            order.discount ??
            pointDiscountValue + voucherDiscountValue
        );

        const totalValue = Number(
            summary.total ??
            order.total ??
            Math.max(subtotalValue + shippingFeeValue - discountTotalValue, 0)
        );

        return {
            subtotal: subtotalValue,
            shippingFee: shippingFeeValue,
            pointDiscount: pointDiscountValue,
            voucherDiscount: voucherDiscountValue,
            discountTotal: discountTotalValue,
            total: totalValue
        };
    }

    function getPaymentName(order) {
        if (!order) {
            return "---";
        }

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

    function getOrderStatusText(order) {
        if (!order) {
            return "Chờ xác nhận";
        }

        return order.statusText || order.statusName || "Chờ xác nhận";
    }

    function isGuestOrder(order) {
        if (!order) {
            return true;
        }

        return order.customerType === "guest" || !order.userKey;
    }

    // 14. Hiển thị trạng thái trang

    function showPageState(type) {
        if (orderSuccessLoadingState) orderSuccessLoadingState.hidden = true;
        if (orderSuccessErrorState) orderSuccessErrorState.hidden = true;
        if (orderSuccessEmptyState) orderSuccessEmptyState.hidden = true;
        if (orderSuccessContent) orderSuccessContent.hidden = true;

        if (type === "loading" && orderSuccessLoadingState) {
            orderSuccessLoadingState.hidden = false;
        }

        if (type === "error" && orderSuccessErrorState) {
            orderSuccessErrorState.hidden = false;
        }

        if (type === "empty" && orderSuccessEmptyState) {
            orderSuccessEmptyState.hidden = false;
        }

        if (type === "content" && orderSuccessContent) {
            orderSuccessContent.hidden = false;
        }
    }

    // 15. Render thông tin tổng quan

    function renderOrderOverview(order) {
        const summary = getOrderSummary(order);
        const orderCode = order.orderId || order.id || "---";

        if (successTitle) {
            successTitle.textContent = "Đặt hàng thành công!";
        }

        if (successDescription) {
            successDescription.textContent =
                "Cảm ơn bạn đã mua sắm. Đơn hàng " + orderCode + " đã được ghi nhận và sẽ được xử lý trong thời gian sớm nhất.";
        }

        if (successOrderCode) {
            successOrderCode.textContent = orderCode;
        }

        if (successOrderCreatedAt) {
            successOrderCreatedAt.textContent = formatDateTime(order.createdAt || order.orderDate);
        }

        if (successOrderStatus) {
            successOrderStatus.textContent = getOrderStatusText(order);
        }

        if (successPaymentMethod) {
            successPaymentMethod.textContent = getPaymentName(order);
        }

        if (successGrandTotal) {
            successGrandTotal.textContent = formatPrice(summary.total);
        }
    }

    // 16. Render thông tin nhận hàng

    function renderReceiverInfo(order) {
        const customer = order.customer || order.receiver || {};

        if (successReceiverName) {
            successReceiverName.textContent = customer.fullName || customer.name || "---";
        }

        if (successReceiverPhone) {
            successReceiverPhone.textContent = customer.phone || "---";
        }

        if (successReceiverEmail) {
            successReceiverEmail.textContent = customer.email || "---";
        }

        if (successReceiverAddress) {
            successReceiverAddress.textContent = buildFullAddress(customer);
        }

        if (successOrderNote) {
            successOrderNote.textContent = customer.note || order.note || "Không có";
        }
    }

    // 17. Render sản phẩm đã đặt

    function createOrderedProductElement(item) {
        if (!orderedProductItemTemplate) {
            return null;
        }

        const clone = orderedProductItemTemplate.content.cloneNode(true);

        const orderedItem = clone.querySelector(".orderedItem");
        const productLinks = clone.querySelectorAll('[data-role="product-link"]');
        const productImage = clone.querySelector('[data-role="product-image"]');
        const productName = clone.querySelector('[data-role="product-name"]');
        const productVariant = clone.querySelector('[data-role="product-variant"]');
        const productPriceQuantity = clone.querySelector('[data-role="product-price-quantity"]');
        const productLineTotal = clone.querySelector('[data-role="product-line-total"]');

        const productId = item.id || item.productId || "";
        const productNameText = item.name || item.productName || "Sản phẩm";
        const productImageUrl = item.image || item.img || item.thumbnail || "";
        const productPrice = Number(item.price || item.currentPrice || 0);
        const productQuantity = Number(item.quantity || item.qty || 1);
        const detailUrl = getProductDetailUrl(productId);

        if (orderedItem) {
            orderedItem.dataset.productId = productId;
        }

        productLinks.forEach(function (link) {
            link.href = detailUrl;
        });

        if (productImage) {
            productImage.src = productImageUrl;
            productImage.alt = productNameText;
        }

        if (productName) {
            productName.textContent = productNameText;
        }

        if (productVariant) {
            productVariant.textContent = buildVariantText(item);
        }

        if (productPriceQuantity) {
            productPriceQuantity.textContent = formatPrice(productPrice) + " x " + productQuantity;
        }

        if (productLineTotal) {
            productLineTotal.textContent = formatPrice(productPrice * productQuantity);
        }

        return clone;
    }

    function renderOrderedProducts(order) {
        const items = getOrderItems(order);

        if (!orderedProductList) {
            return;
        }

        orderedProductList.innerHTML = "";

        if (items.length === 0) {
            orderedProductList.hidden = true;

            if (orderedProductEmptyState) {
                orderedProductEmptyState.hidden = false;
            }

            return;
        }

        if (orderedProductEmptyState) {
            orderedProductEmptyState.hidden = true;
        }

        const fragment = document.createDocumentFragment();

        items.forEach(function (item) {
            const element = createOrderedProductElement(item);

            if (element) {
                fragment.appendChild(element);
            }
        });

        orderedProductList.appendChild(fragment);
        orderedProductList.hidden = false;
    }

    // 18. Render chi tiết thanh toán

    function renderOrderSummary(order) {
        const summary = getOrderSummary(order);

        if (successSubtotalAmount) {
            successSubtotalAmount.textContent = formatPrice(summary.subtotal);
        }

        if (successShippingFee) {
            successShippingFee.textContent = formatPrice(summary.shippingFee);
        }

        if (successPointDiscountRow && successPointDiscountAmount) {
            if (summary.pointDiscount > 0) {
                successPointDiscountRow.hidden = false;
                successPointDiscountAmount.textContent = formatDiscount(summary.pointDiscount);
            } else {
                successPointDiscountRow.hidden = true;
                successPointDiscountAmount.textContent = "-0đ";
            }
        }

        if (successVoucherDiscountRow && successVoucherDiscountAmount) {
            if (summary.voucherDiscount > 0) {
                successVoucherDiscountRow.hidden = false;
                successVoucherDiscountAmount.textContent = formatDiscount(summary.voucherDiscount);
            } else {
                successVoucherDiscountRow.hidden = true;
                successVoucherDiscountAmount.textContent = "-0đ";
            }
        }

        if (successDiscountTotalRow && successDiscountAmount) {
            successDiscountTotalRow.hidden = false;
            successDiscountAmount.textContent = formatDiscount(summary.discountTotal);
        }

        if (successTotalAmount) {
            successTotalAmount.textContent = formatPrice(summary.total);
        }
    }

    // 19. Render ưu đãi đã sử dụng

    function renderUsedBenefits(order) {
        const summary = getOrderSummary(order);
        const benefits = order.benefits || {};

        const pointBenefit = benefits.point || null;
        const voucherBenefit = benefits.voucher || null;

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

    // 20. Render thông báo khách vãng lai và nút

    function renderCustomerTypeActions(order) {
        const guest = isGuestOrder(order);

        if (guestOrderNotice) {
            guestOrderNotice.hidden = !guest;
        }

        if (viewMyOrdersButton) {
            viewMyOrdersButton.hidden = guest;
        }

        if (backToCartButton) {
            backToCartButton.hidden = true;
        }
    }

    // 21. Render toàn bộ trang

    function renderOrderSuccess(order) {
        renderOrderOverview(order);
        renderReceiverInfo(order);
        renderOrderedProducts(order);
        renderOrderSummary(order);
        renderUsedBenefits(order);
        renderCustomerTypeActions(order);

        showPageState("content");
    }

    // 22. Khởi tạo trang

    function initOrderSuccessPage() {
        try {
            showPageState("loading");

            const order = getOrderToRender();

            if (!order) {
                showPageState("empty");
                return;
            }

            setTimeout(function () {
                renderOrderSuccess(order);
            }, 250);
        } catch (error) {
            console.error("Lỗi order-success:", error);
            showPageState("error");
        }
    }

    initOrderSuccessPage();
});