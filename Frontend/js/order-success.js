// =========================================================
// File: Frontend/js/order-success.js
// Mục đích: Hiển thị trang đặt hàng thành công.
//           Ưu tiên API nếu khách đã đăng nhập, fallback localStorage.
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang đặt hàng thành công
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


    // 10. Lấy DOM tìm kiếm
    const searchForm = document.getElementById("searchForm");
    const searchKeyword = document.getElementById("searchKeyword");


    // 11. Gọi API GET
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


    // 12. Hàm tiện ích
    function formatPrice(price) {
        if (window.CustomerApi && typeof window.CustomerApi.formatPrice === "function") {
            return window.CustomerApi.formatPrice(price);
        }

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

    function getOrderQueryFromUrl() {
        const params = new URLSearchParams(window.location.search);

        return (
            params.get("id") ||
            params.get("order_id") ||
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


    // 13. Đọc localStorage
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


    // 14. Kiểm tra đăng nhập
    async function isLoggedInCustomer() {
        if (!window.CustomerApi) {
            return false;
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


    // 15. Lấy đơn local
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


    // 16. Chuẩn hóa đơn hàng API sang format frontend
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
            id: String(apiOrder.id),
            orderId: apiOrder.order_code || String(apiOrder.id),
            orderCode: apiOrder.order_code || String(apiOrder.id),

            createdAt: apiOrder.created_at || "",
            orderDate: apiOrder.created_at || "",

            status: apiStatus.code || apiOrder.order_status || "pending",
            statusText: apiStatus.label || "Chờ xác nhận",

            paymentMethod: apiPayment.method || apiOrder.payment_method || "cod",
            paymentMethodName: apiPayment.method_label || getPaymentName(localOrder),

            customerType: "member",
            userKey: "member",

            customer: {
                fullName: apiReceiver.name || localCustomer.fullName || localCustomer.name || "",
                name: apiReceiver.name || localCustomer.name || localCustomer.fullName || "",
                phone: apiReceiver.phone || localCustomer.phone || "",
                email: localCustomer.email || "",
                address: apiReceiver.shipping_address || localCustomer.address || "",
                ward: localCustomer.ward || "",
                district: localCustomer.district || "",
                province: localCustomer.province || "",
                note: apiOrder.note || localCustomer.note || ""
            },

            receiver: {
                fullName: apiReceiver.name || localCustomer.fullName || localCustomer.name || "",
                name: apiReceiver.name || localCustomer.name || localCustomer.fullName || "",
                phone: apiReceiver.phone || localCustomer.phone || "",
                email: localCustomer.email || "",
                address: apiReceiver.shipping_address || localCustomer.address || "",
                shipping_address: apiReceiver.shipping_address || "",
                ward: localCustomer.ward || "",
                district: localCustomer.district || "",
                province: localCustomer.province || "",
                note: apiOrder.note || localCustomer.note || ""
            },

            note: apiOrder.note || "",

            items: normalizeApiOrderItems(apiOrder.items || []),

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
            }
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
                quantity: Number(item.quantity || 1),
                totalPrice: Number(item.total_price || 0),

                meta: buildVariantText({
                    color: item.color_name || "",
                    size: item.size_name || ""
                })
            };
        });
    }


    // 17. Load đơn hàng từ API
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


    // 18. Lấy đơn hàng cần render
    async function getOrderToRender() {
        const queryValue = getOrderQueryFromUrl();
        const localOrder = getLocalOrderByQuery(queryValue);
        const loggedIn = await isLoggedInCustomer();

        if (loggedIn && queryValue) {
            try {
                const apiOrder = await getApiOrderByQuery(queryValue, localOrder);

                if (apiOrder) {
                    return apiOrder;
                }
            } catch (error) {
                console.warn("Không lấy được đơn hàng từ API, fallback localStorage:", error);
            }
        }

        return localOrder;
    }


    // 19. Chuẩn hóa dữ liệu đơn hàng
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
        const money = order.money || {};
        const benefits = order.benefits || {};

        const pointBenefit = benefits.point || null;
        const voucherBenefit = benefits.voucher || null;

        const subtotalValue = Number(
            summary.subtotal ??
            money.total_product_price ??
            order.subtotal ??
            calculateSubtotal(items)
        );

        const shippingFeeValue = Number(
            summary.shippingFee ??
            money.shipping_fee ??
            order.shippingFee ??
            order.shipping?.fee ??
            0
        );

        const pointDiscountValue = Number(
            summary.pointDiscount ??
            money.points_discount ??
            order.pointDiscount ??
            pointBenefit?.discountAmount ??
            0
        );

        const voucherDiscountValue = Number(
            summary.voucherDiscount ??
            money.discount_amount ??
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
            money.final_total ??
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

        if (order.payment && order.payment.method_label) {
            return order.payment.method_label;
        }

        if (order.payment && order.payment.name) {
            return order.payment.name;
        }

        if (order.paymentMethodName) {
            return order.paymentMethodName;
        }

        if (order.paymentMethod === "cod" || order.payment_method === "cod") {
            return "Thanh toán khi nhận hàng";
        }

        if (
            order.paymentMethod === "bank_transfer" ||
            order.payment_method === "bank_transfer" ||
            order.paymentMethod === "qr_transfer"
        ) {
            return "Chuyển khoản ngân hàng";
        }

        return "---";
    }

    function getOrderStatusText(order) {
        if (!order) {
            return "Chờ xác nhận";
        }

        if (order.status && order.status.label) {
            return order.status.label;
        }

        return order.statusText || order.statusName || "Chờ xác nhận";
    }

    function isGuestOrder(order) {
        if (!order) {
            return true;
        }

        return order.customerType === "guest" || !order.userKey;
    }

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

    function getReceiverInfo(order) {
        if (!order) {
            return {};
        }

        return order.customer || order.receiver || {};
    }

    function buildFullAddress(receiver) {
        if (!receiver) {
            return "---";
        }

        if (receiver.shipping_address) {
            return receiver.shipping_address;
        }

        const parts = [
            receiver.address,
            receiver.ward,
            receiver.district,
            receiver.province
        ].filter(Boolean);

        if (parts.length === 0) {
            return "---";
        }

        return parts.join(", ");
    }


    // 20. Hiển thị trạng thái trang
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


    // 21. Render thông tin tổng quan
    function renderOrderOverview(order) {
        const summary = getOrderSummary(order);
        const orderCode = getOrderIdentity(order) || "---";

        if (successTitle) {
            successTitle.textContent = "Đặt hàng thành công!";
        }

        if (successDescription) {
            successDescription.textContent =
                "Cảm ơn bạn đã mua sắm. Đơn hàng " +
                orderCode +
                " đã được ghi nhận và sẽ được xử lý trong thời gian sớm nhất.";
        }

        if (successOrderCode) {
            successOrderCode.textContent = orderCode;
        }

        if (successOrderCreatedAt) {
            successOrderCreatedAt.textContent = formatDateTime(
                order.createdAt ||
                order.created_at ||
                order.orderDate
            );
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


    // 22. Render thông tin nhận hàng
    function renderReceiverInfo(order) {
        const receiver = getReceiverInfo(order);

        if (successReceiverName) {
            successReceiverName.textContent =
                receiver.fullName ||
                receiver.name ||
                "---";
        }

        if (successReceiverPhone) {
            successReceiverPhone.textContent = receiver.phone || "---";
        }

        if (successReceiverEmail) {
            successReceiverEmail.textContent = receiver.email || "---";
        }

        if (successReceiverAddress) {
            successReceiverAddress.textContent = buildFullAddress(receiver);
        }

        if (successOrderNote) {
            successOrderNote.textContent =
                receiver.note ||
                order.note ||
                "Không có";
        }
    }


    // 23. Render sản phẩm đã đặt
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

        const product = item.product || {};

        const productId =
            product.id ||
            item.id ||
            item.productId ||
            item.product_id ||
            "";

        const productNameText =
            product.name ||
            item.name ||
            item.productName ||
            item.product_name ||
            "Sản phẩm";

        const productImageUrl =
            product.image_url ||
            item.image ||
            item.img ||
            item.thumbnail ||
            "../img/products/default.jpg";

        const productPrice = Number(item.price || item.currentPrice || 0);
        const productQuantity = Number(item.quantity || item.qty || 1);
        const productTotal = Number(item.totalPrice || item.total_price || productPrice * productQuantity);
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
            productLineTotal.textContent = formatPrice(productTotal);
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


    // 24. Render chi tiết thanh toán
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
            if (summary.discountTotal > 0) {
                successDiscountTotalRow.hidden = false;
                successDiscountAmount.textContent = formatDiscount(summary.discountTotal);
            } else {
                successDiscountTotalRow.hidden = true;
                successDiscountAmount.textContent = "0đ";
            }
        }

        if (successTotalAmount) {
            successTotalAmount.textContent = formatPrice(summary.total);
        }
    }


    // 25. Render ưu đãi đã sử dụng
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


    // 26. Render thông báo khách vãng lai và nút
    function renderCustomerTypeActions(order) {
        const guest = isGuestOrder(order);

        if (guestOrderNotice) {
            guestOrderNotice.hidden = !guest;
        }

        if (viewMyOrdersButton) {
            viewMyOrdersButton.hidden = guest;
            viewMyOrdersButton.href = "../html/my-order.html";
        }

        if (backToCartButton) {
            backToCartButton.hidden = true;
        }
    }


    // 27. Render toàn bộ trang
    function renderOrderSuccess(order) {
        renderOrderOverview(order);
        renderReceiverInfo(order);
        renderOrderedProducts(order);
        renderOrderSummary(order);
        renderUsedBenefits(order);
        renderCustomerTypeActions(order);

        showPageState("content");
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


    // 29. Gắn sự kiện
    function bindEvents() {
        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }
    }


    // 30. Khởi tạo trang
    async function initOrderSuccessPage() {
        try {
            bindEvents();
            showPageState("loading");

            const order = await getOrderToRender();

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