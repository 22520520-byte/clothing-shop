// =========================================================
// File: Frontend/js/checkout.js
// Mục đích: Thanh toán bằng API thật nếu đã đăng nhập,
//           vẫn hỗ trợ khách vãng lai bằng localStorage
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang checkout
    const checkoutPage = document.querySelector(".checkoutPage");

    if (!checkoutPage) {
        return;
    }


    // 2. Key localStorage
    const CART_STORAGE_KEY = "cart_items";
    const CHECKOUT_STORAGE_KEY = "checkout_items";
    const ORDERS_STORAGE_KEY = "orders";
    const CURRENT_ORDER_STORAGE_KEY = "current_order";
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const IS_LOGIN_STORAGE_KEY = "is_login";
    const SAVED_VOUCHERS_STORAGE_KEY = "saved_vouchers";
    const USER_POINTS_STORAGE_KEY = "user_points";


    // 3. Quy đổi điểm frontend
    const POINT_STEP = 100;
    const POINT_MONEY = 10000;


    // 4. Biến trạng thái
    let orderItems = [];
    let subtotal = 0;
    let shippingFeeValue = 30000;
    let appliedPoint = null;
    let appliedVoucher = null;
    let isCustomerLoggedIn = false;


    // 5. Lấy DOM form
    const checkoutForm = document.getElementById("checkoutForm");
    const customerFullName = document.getElementById("customerFullName");
    const customerPhone = document.getElementById("customerPhone");
    const customerEmail = document.getElementById("customerEmail");
    const customerProvince = document.getElementById("customerProvince");
    const customerDistrict = document.getElementById("customerDistrict");
    const customerWard = document.getElementById("customerWard");
    const customerAddress = document.getElementById("customerAddress");
    const orderNote = document.getElementById("orderNote");

    const shippingOptions = document.getElementById("shippingOptions");
    const paymentOptions = document.getElementById("paymentOptions");
    const transferProofBox = document.getElementById("transferProofBox");
    const transferProofImage = document.getElementById("transferProofImage");
    const transferPreview = document.getElementById("transferPreview");
    const transferPreviewImage = document.getElementById("transferPreviewImage");
    const transferFileName = document.getElementById("transferFileName");


    // 6. Lấy DOM đơn hàng
    const checkoutLoadingState = document.getElementById("checkoutLoadingState");
    const checkoutEmptyState = document.getElementById("checkoutEmptyState");
    const checkoutErrorState = document.getElementById("checkoutErrorState");

    const orderList = document.getElementById("orderList");
    const orderItemTemplate = document.getElementById("orderItemTemplate");

    const subtotalPrice = document.getElementById("subtotalPrice");
    const shippingFee = document.getElementById("shippingFee");
    const discountAmount = document.getElementById("discountAmount");
    const totalPrice = document.getElementById("totalPrice");
    const placeOrderBtn = document.getElementById("placeOrderBtn");


    // 7. Lấy DOM điểm và voucher
    const discountActions = document.querySelector(".discountActions");

    const openPointPopupBtn = document.getElementById("openPointPopupBtn");
    const openVoucherPopupBtn = document.getElementById("openVoucherPopupBtn");

    const appliedPointBox = document.getElementById("appliedPointBox");
    const appliedPointText = document.getElementById("appliedPointText");
    const removePointBtn = document.getElementById("removePointBtn");

    const appliedVoucherBox = document.getElementById("appliedVoucherBox");
    const appliedVoucherText = document.getElementById("appliedVoucherText");
    const removeVoucherBtn = document.getElementById("removeVoucherBtn");


    // 8. Lấy DOM popup điểm
    const pointPopup = document.getElementById("pointPopup");
    const closePointPopupBtn = document.getElementById("closePointPopupBtn");
    const cancelPointPopupBtn = document.getElementById("cancelPointPopupBtn");
    const applyPointBtn = document.getElementById("applyPointBtn");

    const pointMemberName = document.getElementById("pointMemberName");
    const currentPointValue = document.getElementById("currentPointValue");
    const pointConvertRule = document.getElementById("pointConvertRule");
    const pointInput = document.getElementById("pointInput");
    const pointDiscountPreview = document.getElementById("pointDiscountPreview");


    // 9. Lấy DOM popup voucher
    const voucherPopup = document.getElementById("voucherPopup");
    const closeVoucherPopupBtn = document.getElementById("closeVoucherPopupBtn");
    const voucherList = document.getElementById("voucherList");
    const voucherItemTemplate = document.getElementById("voucherItemTemplate");
    const voucherEmptyState = document.getElementById("voucherEmptyState");

    const checkoutToastContainer = document.getElementById("checkoutToastContainer");


    // 10. Dữ liệu địa chỉ mẫu
    const addressData = [
        {
            name: "TP Hồ Chí Minh",
            districts: [
                {
                    name: "Thành phố Thủ Đức",
                    wards: [
                        "Hiệp Bình",
                        "Thủ Đức",
                        "Tam Bình",
                        "Linh Xuân",
                        "Tăng Nhơn Phú",
                        "Long Bình",
                        "Long Phước",
                        "Long Trường",
                        "Cát Lái",
                        "Bình Trưng",
                        "Phước Long",
                        "An Khánh"
                    ]
                },
                {
                    name: "Quận 1",
                    wards: ["Bến Nghé", "Bến Thành", "Cầu Kho", "Cầu Ông Lãnh"]
                },
                {
                    name: "Bình Thạnh",
                    wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 5"]
                }
            ]
        },
        {
            name: "Hà Nội",
            districts: [
                {
                    name: "Ba Đình",
                    wards: ["Phúc Xá", "Trúc Bạch", "Vĩnh Phúc"]
                },
                {
                    name: "Cầu Giấy",
                    wards: ["Dịch Vọng", "Dịch Vọng Hậu", "Mai Dịch"]
                }
            ]
        },
        {
            name: "Đà Nẵng",
            districts: [
                {
                    name: "Hải Châu",
                    wards: ["Hải Châu I", "Hải Châu II", "Thạch Thang"]
                },
                {
                    name: "Sơn Trà",
                    wards: ["An Hải Bắc", "An Hải Đông", "Mân Thái"]
                }
            ]
        }
    ];


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


    // 12. Gọi API POST
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


    // 13. Hàm tiện ích
    function formatPrice(price) {
        if (window.CustomerApi && typeof window.CustomerApi.formatPrice === "function") {
            return window.CustomerApi.formatPrice(price);
        }

        return Number(price || 0).toLocaleString("vi-VN") + "đ";
    }

    function formatDateTime(value) {
        const date = value ? new Date(value) : new Date();

        if (Number.isNaN(date.getTime())) {
            return new Date().toISOString();
        }

        return date.toISOString();
    }

    function generateOrderId() {
        return "DH" + Date.now() + Math.floor(Math.random() * 1000);
    }

    function createCartItemId(productId, size, color) {
        return productId + "_" + size + "_" + color;
    }

    function normalizeQuantity(quantity) {
        const value = Number(quantity || 1);

        if (Number.isNaN(value) || value < 1) {
            return 1;
        }

        return Math.floor(value);
    }

    function showToast(message, type) {
        if (!checkoutToastContainer) {
            alert(message);
            return;
        }

        const toast = document.createElement("div");

        toast.className = "checkoutToast " + (type || "success");
        toast.textContent = message;

        checkoutToastContainer.appendChild(toast);

        setTimeout(function () {
            toast.remove();
        }, 2600);
    }

    function getApiErrorMessage(error, fallbackMessage) {
        if (window.CustomerApi && typeof window.CustomerApi.getApiErrorMessage === "function") {
            return window.CustomerApi.getApiErrorMessage(error, fallbackMessage);
        }

        return error && error.message ? error.message : fallbackMessage;
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

    function saveDataToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function removeDataFromStorage(key) {
        localStorage.removeItem(key);
    }

    function getCartItemsFromStorage() {
        const cartItems = getDataFromStorage(CART_STORAGE_KEY, []);

        return Array.isArray(cartItems) ? cartItems : [];
    }

    function saveCartItemsToStorage(cartItems) {
        saveDataToStorage(CART_STORAGE_KEY, cartItems);
    }

    function getCheckoutItemsFromStorageRaw() {
        const checkoutItems = getDataFromStorage(CHECKOUT_STORAGE_KEY, []);

        return Array.isArray(checkoutItems) ? checkoutItems : [];
    }

    function saveCurrentOrder(order) {
        saveDataToStorage(CURRENT_ORDER_STORAGE_KEY, order);
    }

    function saveOrderToHistory(order) {
        const orders = getDataFromStorage(ORDERS_STORAGE_KEY, []);

        if (!Array.isArray(orders)) {
            saveDataToStorage(ORDERS_STORAGE_KEY, [order]);
            return;
        }

        orders.unshift(order);
        saveDataToStorage(ORDERS_STORAGE_KEY, orders);
    }


    // 15. Kiểm tra đăng nhập
    function getCurrentUserLocal() {
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

    async function checkCustomerLoginState() {
        const localUser = getCurrentUserLocal();

        if (!localUser || !window.CustomerApi) {
            isCustomerLoggedIn = false;
            return false;
        }

        try {
            await window.CustomerApi.getCurrentCustomerFromSession();

            isCustomerLoggedIn = true;
            return true;
        } catch (error) {
            isCustomerLoggedIn = false;
            return false;
        }
    }

    function getCurrentUserKey() {
        const currentUser = getCurrentUserLocal();

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
        const currentUser = getCurrentUserLocal();

        if (!currentUser) {
            return "Khách vãng lai";
        }

        return (
            currentUser.fullName ||
            currentUser.name ||
            currentUser.username ||
            currentUser.email ||
            "Thành viên"
        );
    }


    // 16. Điểm tích lũy
    function getUserPointMap() {
        const pointMap = getDataFromStorage(USER_POINTS_STORAGE_KEY, {});

        if (!pointMap || typeof pointMap !== "object" || Array.isArray(pointMap)) {
            return {};
        }

        return pointMap;
    }

    function getCurrentUserPoints() {
        const currentUser = getCurrentUserLocal();
        const userKey = getCurrentUserKey();

        if (!currentUser || !userKey) {
            return 0;
        }

        const pointMap = getUserPointMap();

        if (typeof pointMap[userKey] === "number") {
            return pointMap[userKey];
        }

        if (typeof currentUser.points === "number") {
            return currentUser.points;
        }

        if (typeof currentUser.point === "number") {
            return currentUser.point;
        }

        return 0;
    }

    function saveCurrentUserPoints(points) {
        const currentUser = getCurrentUserLocal();
        const userKey = getCurrentUserKey();

        if (!currentUser || !userKey) {
            return;
        }

        const pointMap = getUserPointMap();

        pointMap[userKey] = Number(points || 0);
        saveDataToStorage(USER_POINTS_STORAGE_KEY, pointMap);

        if (typeof currentUser === "object") {
            currentUser.points = Number(points || 0);
            saveDataToStorage(CURRENT_USER_STORAGE_KEY, currentUser);
        }
    }

    function convertPointsToMoney(points) {
        const validPoints = Math.floor(Number(points || 0) / POINT_STEP) * POINT_STEP;

        return (validPoints / POINT_STEP) * POINT_MONEY;
    }

    function getValidPointAmount(points) {
        return Math.floor(Number(points || 0) / POINT_STEP) * POINT_STEP;
    }


    // 17. Voucher
    function normalizeVoucherFromApi(voucher) {
        return {
            id: voucher.id,
            code: voucher.code || "",
            name: voucher.name || "Voucher",
            description: voucher.description || "",
            discountType: voucher.discount_type === "fixed"
                ? "amount"
                : voucher.discount_type === "freeship"
                    ? "shipping"
                    : "percent",
            discountValue: Number(voucher.discount_value || 0),
            maxDiscount: voucher.max_discount_amount !== null && voucher.max_discount_amount !== undefined
                ? Number(voucher.max_discount_amount || 0)
                : 0,
            minOrder: Number(voucher.min_order_value || 0),
            minOrderValue: Number(voucher.min_order_value || 0),
            expiresAt: voucher.end_date ? new Date(voucher.end_date).getTime() : 0,
            isAvailable: voucher.is_available !== false,
            used: false,
            raw: voucher
        };
    }

    function normalizeVoucherFromLocal(voucher) {
        return {
            id: voucher.id || voucher.code,
            code: voucher.code || "",
            name: voucher.name || voucher.title || "Voucher",
            description: voucher.description || "",
            discountType: voucher.discountType || voucher.type || "amount",
            discountValue: Number(voucher.discountValue || voucher.value || 0),
            maxDiscount: Number(voucher.maxDiscount || voucher.max_discount_amount || 0),
            minOrder: Number(voucher.minOrderValue || voucher.minOrder || 0),
            minOrderValue: Number(voucher.minOrderValue || voucher.minOrder || 0),
            expiresAt: voucher.expiresAt || 0,
            isAvailable: voucher.isAvailable !== false,
            used: voucher.used === true,
            raw: voucher
        };
    }

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
        const vouchers = savedMap[userKey];

        if (!Array.isArray(vouchers)) {
            return [];
        }

        return vouchers.map(normalizeVoucherFromLocal);
    }

    async function loadAvailableVouchers() {
        const localVouchers = getCurrentUserSavedVouchers();

        try {
            const response = await getApi("vouchers/get-vouchers.php?page=1&limit=50&available_only=1&sort=end_soon");
            const data = response.data || {};
            const apiVouchers = Array.isArray(data.vouchers)
                ? data.vouchers.map(normalizeVoucherFromApi)
                : [];

            const voucherMap = {};

            [...apiVouchers, ...localVouchers].forEach(function (voucher) {
                if (!voucher.code) {
                    return;
                }

                voucherMap[voucher.code] = voucher;
            });

            return Object.values(voucherMap);
        } catch (error) {
            return localVouchers;
        }
    }

    function calculateVoucherDiscount(voucher) {
        if (!voucher) {
            return 0;
        }

        const minOrderValue = Number(voucher.minOrderValue || voucher.minOrder || 0);

        if (subtotal < minOrderValue) {
            return 0;
        }

        if (voucher.expiresAt && Date.now() > Number(voucher.expiresAt)) {
            return 0;
        }

        if (voucher.discountType === "amount") {
            return Math.min(Number(voucher.discountValue || 0), subtotal);
        }

        if (voucher.discountType === "percent") {
            const percentDiscount = Math.round(subtotal * Number(voucher.discountValue || 0) / 100);
            const maxDiscount = Number(voucher.maxDiscount || percentDiscount);

            return Math.min(percentDiscount, maxDiscount, subtotal);
        }

        if (voucher.discountType === "shipping") {
            const freeShipAmount = Number(voucher.maxDiscount || voucher.discountValue || shippingFeeValue);

            return Math.min(freeShipAmount, shippingFeeValue);
        }

        return 0;
    }

    function canApplyVoucher(voucher) {
        if (!voucher) {
            return {
                canApply: false,
                message: "Voucher không hợp lệ."
            };
        }

        if (voucher.used) {
            return {
                canApply: false,
                message: "Voucher này đã được sử dụng."
            };
        }

        if (voucher.expiresAt && Date.now() > Number(voucher.expiresAt)) {
            return {
                canApply: false,
                message: "Voucher đã hết hạn."
            };
        }

        const minOrderValue = Number(voucher.minOrderValue || voucher.minOrder || 0);

        if (subtotal < minOrderValue) {
            return {
                canApply: false,
                message: "Cần đơn từ " + formatPrice(minOrderValue) + " để áp dụng."
            };
        }

        const discount = calculateVoucherDiscount(voucher);

        if (discount <= 0) {
            return {
                canApply: false,
                message: "Voucher chưa thể áp dụng cho đơn này."
            };
        }

        return {
            canApply: true,
            message: "Có thể áp dụng. Giảm " + formatPrice(discount) + "."
        };
    }


    // 18. Chuẩn hóa sản phẩm thanh toán
    function buildVariantText(color, size) {
        const parts = [];

        if (color) {
            parts.push("Màu: " + color);
        }

        if (size) {
            parts.push("Size: " + size);
        }

        return parts.join(" / ");
    }

    function normalizeCheckoutItem(item) {
        const quantity = normalizeQuantity(item.quantity || item.qty || 1);
        const price = Number(item.price || item.currentPrice || 0);
        const color = item.color || item.selectedColor || "";
        const size = item.size || item.selectedSize || "";
        const id = item.id || item.productId || item.product_id || "";
        const variantId = item.variantId || item.productVariantId || item.product_variant_id || null;

        const cartItemId = item.cartItemId || createCartItemId(id, size, color);

        return {
            cartItemId: cartItemId,

            id: String(id),
            productId: String(id),
            product_id: String(id),

            variantId: variantId,
            productVariantId: variantId,
            product_variant_id: variantId,

            apiCartItemId: item.apiCartItemId || null,

            name: item.name || item.productName || "Sản phẩm",
            image: item.image || item.img || item.thumbnail || "../img/products/default.jpg",

            price: price,
            oldPrice: Number(item.oldPrice || 0),

            quantity: quantity,
            color: color,
            colorId: item.colorId || "",
            size: size,
            sizeId: item.sizeId || "",
            meta: item.meta || buildVariantText(color, size),
            selected: item.selected !== false,
            source: item.source || "local"
        };
    }

    function getCheckoutItemsFromStorage() {
        const checkoutItems = getCheckoutItemsFromStorageRaw();

        if (checkoutItems.length > 0) {
            return checkoutItems.map(normalizeCheckoutItem);
        }

        const cartItems = getCartItemsFromStorage();
        const selectedCartItems = cartItems.filter(function (item) {
            return item.selected === true;
        });

        if (selectedCartItems.length > 0) {
            return selectedCartItems.map(normalizeCheckoutItem);
        }

        return [];
    }


    // 19. Tính tiền
    function calculateSubtotal(items) {
        return items.reduce(function (total, item) {
            return total + Number(item.price || 0) * Number(item.quantity || 0);
        }, 0);
    }

    function getPointDiscount() {
        if (!appliedPoint) {
            return 0;
        }

        return Number(appliedPoint.discountAmount || 0);
    }

    function getVoucherDiscount() {
        if (!appliedVoucher) {
            return 0;
        }

        return calculateVoucherDiscount(appliedVoucher);
    }

    function getTotalDiscount() {
        return getPointDiscount() + getVoucherDiscount();
    }

    function getFinalTotal() {
        return Math.max(subtotal + shippingFeeValue - getTotalDiscount(), 0);
    }


    // 20. Trạng thái checkout
    function showCheckoutState(type) {
        if (checkoutLoadingState) checkoutLoadingState.hidden = true;
        if (checkoutEmptyState) checkoutEmptyState.hidden = true;
        if (checkoutErrorState) checkoutErrorState.hidden = true;

        if (type === "loading" && checkoutLoadingState) {
            checkoutLoadingState.hidden = false;
        }

        if (type === "empty" && checkoutEmptyState) {
            checkoutEmptyState.hidden = false;
        }

        if (type === "error" && checkoutErrorState) {
            checkoutErrorState.hidden = false;
        }
    }


    // 21. Render đơn hàng
    function renderOrderItems() {
        if (!orderList || !orderItemTemplate) {
            return;
        }

        orderList.innerHTML = "";

        if (orderItems.length === 0) {
            orderList.hidden = true;
            return;
        }

        const fragment = document.createDocumentFragment();

        orderItems.forEach(function (item) {
            const clone = orderItemTemplate.content.cloneNode(true);

            const image = clone.querySelector('[data-role="order-item-image"]');
            const name = clone.querySelector('[data-role="order-item-name"]');
            const variant = clone.querySelector('[data-role="order-item-variant"]');
            const price = clone.querySelector('[data-role="order-item-price"]');
            const quantity = clone.querySelector('[data-role="order-item-quantity"]');
            const lineTotal = clone.querySelector('[data-role="order-item-line-total"]');

            if (image) {
                image.src = item.image;
                image.alt = item.name;
            }

            if (name) {
                name.textContent = item.name;
            }

            if (variant) {
                variant.textContent = item.meta || buildVariantText(item.color, item.size);
            }

            if (price) {
                price.textContent = formatPrice(item.price);
            }

            if (quantity) {
                quantity.textContent = "x" + Number(item.quantity || 0);
            }

            if (lineTotal) {
                lineTotal.textContent = formatPrice(Number(item.price || 0) * Number(item.quantity || 0));
            }

            fragment.appendChild(clone);
        });

        orderList.appendChild(fragment);
        orderList.hidden = false;
    }

    function renderAppliedBenefits() {
        if (appliedPointBox && appliedPointText) {
            if (appliedPoint) {
                appliedPointBox.hidden = false;
                appliedPointText.textContent =
                    appliedPoint.points + " điểm - Giảm " + formatPrice(appliedPoint.discountAmount);
            } else {
                appliedPointBox.hidden = true;
                appliedPointText.textContent = "Chưa áp dụng điểm";
            }
        }

        if (appliedVoucherBox && appliedVoucherText) {
            if (appliedVoucher) {
                appliedVoucherBox.hidden = false;
                appliedVoucherText.textContent =
                    appliedVoucher.code + " - Giảm " + formatPrice(getVoucherDiscount());
            } else {
                appliedVoucherBox.hidden = true;
                appliedVoucherText.textContent = "Chưa áp dụng mã";
            }
        }
    }

    function renderSummary() {
        const totalDiscount = getTotalDiscount();
        const finalTotal = getFinalTotal();

        if (subtotalPrice) {
            subtotalPrice.textContent = formatPrice(subtotal);
        }

        if (shippingFee) {
            shippingFee.textContent = formatPrice(shippingFeeValue);
        }

        if (discountAmount) {
            discountAmount.textContent = "-" + formatPrice(totalDiscount);
        }

        if (totalPrice) {
            totalPrice.textContent = formatPrice(finalTotal);
        }

        renderAppliedBenefits();
    }

    function updateCheckoutSummary() {
        subtotal = calculateSubtotal(orderItems);

        if (appliedVoucher && !canApplyVoucher(appliedVoucher).canApply) {
            appliedVoucher = null;
        }

        if (appliedPoint && getPointDiscount() > subtotal + shippingFeeValue - getVoucherDiscount()) {
            appliedPoint = null;
        }

        renderSummary();

        if (placeOrderBtn) {
            placeOrderBtn.disabled = orderItems.length === 0;
        }
    }


    // 22. Địa chỉ
    function resetSelect(selectElement, placeholder) {
        if (!selectElement) {
            return;
        }

        selectElement.innerHTML = "";

        const option = document.createElement("option");

        option.value = "";
        option.textContent = placeholder;
        option.selected = true;
        option.disabled = true;

        selectElement.appendChild(option);
    }

    function renderProvinceOptions() {
        resetSelect(customerProvince, "Chọn Tỉnh/Thành phố");
        resetSelect(customerDistrict, "Chọn Quận/Huyện");
        resetSelect(customerWard, "Chọn Phường/Xã");

        if (!customerProvince) {
            return;
        }

        addressData.forEach(function (province) {
            const option = document.createElement("option");

            option.value = province.name;
            option.textContent = province.name;

            customerProvince.appendChild(option);
        });

        if (customerDistrict) customerDistrict.disabled = true;
        if (customerWard) customerWard.disabled = true;
    }

    function renderDistrictOptions(provinceName) {
        resetSelect(customerDistrict, "Chọn Quận/Huyện");
        resetSelect(customerWard, "Chọn Phường/Xã");

        const province = addressData.find(function (item) {
            return item.name === provinceName;
        });

        if (!province || !customerDistrict) {
            return;
        }

        province.districts.forEach(function (district) {
            const option = document.createElement("option");

            option.value = district.name;
            option.textContent = district.name;

            customerDistrict.appendChild(option);
        });

        customerDistrict.disabled = false;

        if (customerWard) {
            customerWard.disabled = true;
        }
    }

    function renderWardOptions(provinceName, districtName) {
        resetSelect(customerWard, "Chọn Phường/Xã");

        const province = addressData.find(function (item) {
            return item.name === provinceName;
        });

        if (!province) {
            return;
        }

        const district = province.districts.find(function (item) {
            return item.name === districtName;
        });

        if (!district || !customerWard) {
            return;
        }

        district.wards.forEach(function (ward) {
            const option = document.createElement("option");

            option.value = ward;
            option.textContent = ward;

            customerWard.appendChild(option);
        });

        customerWard.disabled = false;
    }

    function buildFullShippingAddress() {
        return [
            customerAddress ? customerAddress.value.trim() : "",
            customerWard ? customerWard.value : "",
            customerDistrict ? customerDistrict.value : "",
            customerProvince ? customerProvince.value : ""
        ].filter(Boolean).join(", ");
    }


    // 23. Thông tin người dùng
    function fillCustomerInfo() {
        const currentUser = getCurrentUserLocal();

        if (!currentUser) {
            return;
        }

        if (customerFullName && !customerFullName.value) {
            customerFullName.value = currentUser.fullName || currentUser.name || "";
        }

        if (customerPhone && !customerPhone.value) {
            customerPhone.value = currentUser.phone || "";
        }

        if (customerEmail && !customerEmail.value) {
            customerEmail.value = currentUser.email || "";
        }

        if (customerAddress && !customerAddress.value) {
            customerAddress.value = currentUser.address || "";
        }
    }


    // 24. Popup chung
    function openPopup(popupElement) {
        if (!popupElement) {
            return;
        }

        popupElement.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closePopup(popupElement) {
        if (!popupElement) {
            return;
        }

        popupElement.hidden = true;
        document.body.style.overflow = "";
    }


    // 25. Xử lý điểm
    function updatePointFeatureByLogin() {
        if (openPointPopupBtn) {
            openPointPopupBtn.hidden = !isCustomerLoggedIn;
        }

        if (discountActions) {
            discountActions.style.gridTemplateColumns = isCustomerLoggedIn
                ? "repeat(2, minmax(0, 1fr))"
                : "1fr";
        }
    }

    function renderPointPopup() {
        const currentPoints = getCurrentUserPoints();

        if (pointMemberName) {
            pointMemberName.textContent = getCurrentUserName();
        }

        if (currentPointValue) {
            currentPointValue.textContent = currentPoints + " điểm";
        }

        if (pointConvertRule) {
            pointConvertRule.textContent = POINT_STEP + " điểm = " + formatPrice(POINT_MONEY);
        }

        if (pointInput) {
            pointInput.value = "";
            pointInput.max = String(currentPoints);
        }

        if (pointDiscountPreview) {
            pointDiscountPreview.textContent = "0đ";
        }
    }

    function openPointPopup() {
        if (!isCustomerLoggedIn) {
            showToast("Bạn cần đăng nhập để đổi điểm.", "warning");
            return;
        }

        renderPointPopup();
        openPopup(pointPopup);
    }

    function updatePointDiscountPreview() {
        if (!pointInput || !pointDiscountPreview) {
            return;
        }

        const inputPoints = Number(pointInput.value || 0);
        const validPoints = getValidPointAmount(inputPoints);
        const discount = convertPointsToMoney(validPoints);

        pointDiscountPreview.textContent = formatPrice(discount);
    }

    function applyPointDiscount() {
        if (!isCustomerLoggedIn) {
            showToast("Bạn cần đăng nhập để đổi điểm.", "warning");
            return;
        }

        const currentPoints = getCurrentUserPoints();
        const inputPoints = Number(pointInput ? pointInput.value : 0);
        const validPoints = getValidPointAmount(inputPoints);

        if (validPoints < POINT_STEP) {
            showToast("Vui lòng nhập tối thiểu " + POINT_STEP + " điểm.", "warning");
            return;
        }

        if (validPoints > currentPoints) {
            showToast("Bạn không đủ điểm để đổi.", "warning");
            return;
        }

        const pointDiscount = convertPointsToMoney(validPoints);
        const maxDiscountByOrder = Math.max(subtotal + shippingFeeValue - getVoucherDiscount(), 0);

        if (pointDiscount > maxDiscountByOrder) {
            showToast("Số điểm đổi vượt quá giá trị đơn hàng có thể giảm.", "warning");
            return;
        }

        appliedPoint = {
            points: validPoints,
            discountAmount: pointDiscount
        };

        closePopup(pointPopup);
        updateCheckoutSummary();
        showToast("Đã áp dụng " + validPoints + " điểm.", "success");
    }

    function removeAppliedPoint() {
        appliedPoint = null;
        updateCheckoutSummary();
        showToast("Đã bỏ điểm đã đổi.", "success");
    }


    // 26. Xử lý voucher
    function createVoucherElement(voucher) {
        if (!voucherItemTemplate) {
            return null;
        }

        const clone = voucherItemTemplate.content.cloneNode(true);

        const voucherItem = clone.querySelector(".voucherItem") || clone.querySelector("[data-role='voucher-item']");
        const voucherCode = clone.querySelector(".voucherCode") || clone.querySelector("[data-role='voucher-code']");
        const voucherName = clone.querySelector(".voucherName") || clone.querySelector("[data-role='voucher-name']");
        const voucherDescription = clone.querySelector(".voucherDescription") || clone.querySelector("[data-role='voucher-description']");
        const voucherCondition = clone.querySelector(".voucherCondition") || clone.querySelector("[data-role='voucher-condition']");
        const applyButton = clone.querySelector("[data-role='apply-voucher-btn']") || clone.querySelector(".applyVoucherBtn");

        const check = canApplyVoucher(voucher);

        if (voucherItem) {
            voucherItem.dataset.voucherCode = voucher.code;

            if (!check.canApply) {
                voucherItem.classList.add("disabled");
            }
        }

        if (voucherCode) {
            voucherCode.textContent = voucher.code;
        }

        if (voucherName) {
            voucherName.textContent = voucher.name;
        }

        if (voucherDescription) {
            voucherDescription.textContent = voucher.description || check.message;
        }

        if (voucherCondition) {
            voucherCondition.textContent = check.message;
        }

        if (applyButton) {
            applyButton.dataset.voucherCode = voucher.code;
            applyButton.disabled = !check.canApply;
            applyButton.textContent = check.canApply ? "Áp dụng" : "Chưa đủ điều kiện";
        }

        return clone;
    }

    async function renderVoucherPopup() {
        if (!voucherList || !voucherItemTemplate) {
            return;
        }

        voucherList.innerHTML = "";

        const vouchers = await loadAvailableVouchers();

        if (!Array.isArray(vouchers) || vouchers.length === 0) {
            if (voucherEmptyState) {
                voucherEmptyState.hidden = false;
            }

            return;
        }

        if (voucherEmptyState) {
            voucherEmptyState.hidden = true;
        }

        const fragment = document.createDocumentFragment();

        vouchers.forEach(function (voucher) {
            const voucherElement = createVoucherElement(voucher);

            if (voucherElement) {
                fragment.appendChild(voucherElement);
            }
        });

        voucherList.appendChild(fragment);
    }

    async function openVoucherPopup() {
        await renderVoucherPopup();
        openPopup(voucherPopup);
    }

    async function applyVoucherByCode(voucherCode) {
        const vouchers = await loadAvailableVouchers();
        const voucher = vouchers.find(function (item) {
            return item.code === voucherCode;
        });

        const check = canApplyVoucher(voucher);

        if (!check.canApply) {
            showToast(check.message, "warning");
            return;
        }

        appliedVoucher = voucher;

        closePopup(voucherPopup);
        updateCheckoutSummary();

        showToast("Đã áp dụng voucher " + voucher.code + ".", "success");
    }

    function removeAppliedVoucher() {
        appliedVoucher = null;
        updateCheckoutSummary();
        showToast("Đã bỏ mã giảm giá.", "success");
    }


    // 27. Phương thức giao hàng / thanh toán
    function getSelectedShippingMethod() {
        const checked = document.querySelector(
            'input[name="shippingMethod"]:checked, input[name="shipping_method"]:checked, input[name="shipping"]:checked'
        );

        return checked ? checked.value : "standard";
    }

    function updateShippingFeeBySelectedMethod() {
        const shippingMethod = getSelectedShippingMethod();

        if (shippingMethod === "fast" || shippingMethod === "express") {
            shippingFeeValue = 45000;
        } else {
            shippingFeeValue = 30000;
        }

        updateCheckoutSummary();
    }

    function getSelectedPaymentMethod() {
        const checked = document.querySelector(
            'input[name="paymentMethod"]:checked, input[name="payment_method"]:checked, input[name="payment"]:checked'
        );

        const value = checked ? checked.value : "cod";

        if (value === "bank" || value === "bank_transfer" || value === "transfer" || value === "qr" || value === "qr_transfer") {
            return "bank_transfer";
        }

        return "cod";
    }

    function getPaymentMethodName(paymentMethod) {
        if (paymentMethod === "bank_transfer") {
            return "Chuyển khoản qua mã QR";
        }

        return "Thanh toán khi nhận hàng";
    }

    function updateTransferProofVisibility() {
        const paymentMethod = getSelectedPaymentMethod();

        if (transferProofBox) {
            transferProofBox.hidden = paymentMethod !== "bank_transfer";
        }
    }

    function handleTransferProofChange() {
        if (!transferProofImage || !transferProofImage.files || transferProofImage.files.length === 0) {
            return;
        }

        const file = transferProofImage.files[0];

        if (transferFileName) {
            transferFileName.textContent = file.name;
        }

        if (!transferPreview || !transferPreviewImage) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {
            transferPreview.hidden = false;
            transferPreviewImage.src = reader.result;
        };

        reader.readAsDataURL(file);
    }


    // 28. Validate form
    function validateCheckoutForm() {
        const fullName = customerFullName ? customerFullName.value.trim() : "";
        const phone = customerPhone ? customerPhone.value.trim() : "";
        const email = customerEmail ? customerEmail.value.trim() : "";
        const province = customerProvince ? customerProvince.value : "";
        const district = customerDistrict ? customerDistrict.value : "";
        const ward = customerWard ? customerWard.value : "";
        const address = customerAddress ? customerAddress.value.trim() : "";
        const paymentMethod = getSelectedPaymentMethod();

        if (orderItems.length === 0) {
            showToast("Không có sản phẩm nào để thanh toán.", "warning");
            return false;
        }

        if (!fullName) {
            showToast("Vui lòng nhập họ và tên người nhận.", "warning");
            customerFullName?.focus();
            return false;
        }

        if (!/^0\d{9}$/.test(phone)) {
            showToast("Số điện thoại không hợp lệ. Ví dụ: 0911010757.", "warning");
            customerPhone?.focus();
            return false;
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast("Email không hợp lệ.", "warning");
            customerEmail?.focus();
            return false;
        }

        if (!province) {
            showToast("Vui lòng chọn Tỉnh/Thành phố.", "warning");
            customerProvince?.focus();
            return false;
        }

        if (!district) {
            showToast("Vui lòng chọn Quận/Huyện.", "warning");
            customerDistrict?.focus();
            return false;
        }

        if (!ward) {
            showToast("Vui lòng chọn Phường/Xã.", "warning");
            customerWard?.focus();
            return false;
        }

        if (!address) {
            showToast("Vui lòng nhập địa chỉ chi tiết.", "warning");
            customerAddress?.focus();
            return false;
        }

        if (paymentMethod === "bank_transfer" && transferProofImage && transferProofImage.files.length === 0) {
            showToast("Vui lòng tải ảnh minh chứng chuyển khoản.", "warning");
            transferProofImage.focus();
            return false;
        }

        return true;
    }


    // 29. Chuẩn bị API cart đúng checkout_items
    async function clearApiCart() {
        const cartResponse = await getApi("cart/get-cart.php");
        const data = cartResponse.data || {};
        const items = Array.isArray(data.items) ? data.items : [];

        for (let i = 0; i < items.length; i += 1) {
            const cartItemId = items[i].cart_item_id || items[i].id;

            if (!cartItemId) {
                continue;
            }

            await postApi("cart/remove-cart-item.php", {
                cart_item_id: Number(cartItemId)
            });
        }
    }

    async function addCheckoutItemsToApiCart() {
        for (let i = 0; i < orderItems.length; i += 1) {
            const item = orderItems[i];
            const variantId = item.productVariantId || item.variantId || item.product_variant_id;

            if (!variantId) {
                throw {
                    message: "Sản phẩm " + item.name + " thiếu mã biến thể nên chưa thể đặt hàng bằng API."
                };
            }

            await postApi("cart/add-to-cart.php", {
                variant_id: Number(variantId),
                quantity: normalizeQuantity(item.quantity)
            });
        }
    }

    async function prepareApiCartForCheckout() {
        await clearApiCart();
        await addCheckoutItemsToApiCart();
    }


    // 30. Tạo dữ liệu đơn hàng local
    function getReceiverData() {
        return {
            fullName: customerFullName ? customerFullName.value.trim() : "",
            name: customerFullName ? customerFullName.value.trim() : "",
            phone: customerPhone ? customerPhone.value.trim() : "",
            email: customerEmail ? customerEmail.value.trim() : "",
            province: customerProvince ? customerProvince.value : "",
            district: customerDistrict ? customerDistrict.value : "",
            ward: customerWard ? customerWard.value : "",
            address: customerAddress ? customerAddress.value.trim() : "",
            note: orderNote ? orderNote.value.trim() : ""
        };
    }

    function buildOrderFromLocal(orderCode, apiOrder) {
        const receiver = getReceiverData();
        const paymentMethod = getSelectedPaymentMethod();

        const pointDiscountValue = apiOrder
            ? Number(apiOrder.points_discount || 0)
            : getPointDiscount();

        const voucherDiscountValue = apiOrder
            ? Number(apiOrder.discount_amount || 0)
            : getVoucherDiscount();

        const totalProductPrice = apiOrder
            ? Number(apiOrder.total_product_price || 0)
            : subtotal;

        const shippingFeeFinal = apiOrder
            ? Number(apiOrder.shipping_fee || 0)
            : shippingFeeValue;

        const finalTotal = apiOrder
            ? Number(apiOrder.final_total || 0)
            : getFinalTotal();

        return {
            id: String(apiOrder ? apiOrder.id : orderCode),
            orderId: orderCode,
            orderCode: orderCode,

            createdAt: formatDateTime(),
            orderDate: formatDateTime(),

            status: apiOrder ? apiOrder.order_status : "pending",
            statusText: "Chờ xác nhận",

            paymentMethod: paymentMethod,
            paymentMethodName: getPaymentMethodName(paymentMethod),

            customerType: isCustomerLoggedIn ? "member" : "guest",
            userKey: isCustomerLoggedIn ? getCurrentUserKey() : "",

            customer: receiver,
            receiver: receiver,
            note: receiver.note,

            items: orderItems,

            summary: {
                subtotal: totalProductPrice,
                shippingFee: shippingFeeFinal,
                pointDiscount: pointDiscountValue,
                voucherDiscount: voucherDiscountValue,
                discountTotal: pointDiscountValue + voucherDiscountValue,
                total: finalTotal
            },

            benefits: {
                point: appliedPoint
                    ? {
                        points: appliedPoint.points,
                        discountAmount: pointDiscountValue
                    }
                    : null,
                voucher: appliedVoucher
                    ? {
                        code: appliedVoucher.code,
                        name: appliedVoucher.name,
                        discountAmount: voucherDiscountValue
                    }
                    : null
            }
        };
    }


    // 31. Xóa sản phẩm đã đặt khỏi local cart
    function removeOrderedItemsFromLocalCart() {
        const cartItems = getCartItemsFromStorage();
        const orderedIds = orderItems.map(function (item) {
            return item.cartItemId;
        });

        const remainingCartItems = cartItems.filter(function (item) {
            const cartItemId = item.cartItemId || createCartItemId(
                item.id || item.productId || item.product_id,
                item.size || item.selectedSize || "",
                item.color || item.selectedColor || ""
            );

            return !orderedIds.includes(cartItemId);
        });

        saveCartItemsToStorage(remainingCartItems);
        removeDataFromStorage(CHECKOUT_STORAGE_KEY);
    }


    // 32. Tạo đơn hàng bằng API
    async function createOrderByApi() {
        await prepareApiCartForCheckout();

        const paymentMethod = getSelectedPaymentMethod();

        const response = await postApi("orders/create-order.php", {
            receiver_name: customerFullName.value.trim(),
            receiverName: customerFullName.value.trim(),

            receiver_phone: customerPhone.value.trim(),
            receiverPhone: customerPhone.value.trim(),

            receiver_email: customerEmail ? customerEmail.value.trim() : "",

            shipping_address: buildFullShippingAddress(),
            shippingAddress: buildFullShippingAddress(),

            note: orderNote ? orderNote.value.trim() : "",

            payment_method: paymentMethod,
            paymentMethod: paymentMethod,

            voucher_code: appliedVoucher ? appliedVoucher.code : "",
            voucherCode: appliedVoucher ? appliedVoucher.code : "",

            points_to_use: appliedPoint ? Number(appliedPoint.points || 0) : 0,
            pointsToUse: appliedPoint ? Number(appliedPoint.points || 0) : 0
        });

        const apiOrder = response.data && response.data.order
            ? response.data.order
            : null;

        if (!apiOrder) {
            throw {
                message: "API đã tạo đơn nhưng không trả về thông tin đơn hàng."
            };
        }

        return apiOrder;
    }


    // 33. Tạo đơn hàng local cho khách vãng lai
    function createGuestOrder() {
        const orderCode = generateOrderId();
        const order = buildOrderFromLocal(orderCode, null);

        saveCurrentOrder(order);
        saveOrderToHistory(order);
        removeOrderedItemsFromLocalCart();

        window.location.href = "../html/order-success.html?id=" + encodeURIComponent(order.orderId);
    }


    // 34. Tạo đơn hàng đăng nhập bằng API
    async function createLoggedInOrder() {
        const apiOrder = await createOrderByApi();
        const orderCode = apiOrder.order_code || generateOrderId();
        const order = buildOrderFromLocal(orderCode, apiOrder);

        saveCurrentOrder(order);
        saveOrderToHistory(order);

        removeOrderedItemsFromLocalCart();

        if (appliedPoint) {
            const currentPoints = getCurrentUserPoints();
            saveCurrentUserPoints(Math.max(currentPoints - Number(appliedPoint.points || 0), 0));
        }

        window.location.href = "../html/order-success.html?id=" + encodeURIComponent(order.orderId);
    }


    // 35. Submit đặt hàng
    async function handleCheckoutSubmit(event) {
        event.preventDefault();

        if (!validateCheckoutForm()) {
            return;
        }

        try {
            if (placeOrderBtn) {
                placeOrderBtn.disabled = true;
                placeOrderBtn.textContent = "Đang đặt hàng...";
            }

            await checkCustomerLoginState();

            if (isCustomerLoggedIn) {
                await createLoggedInOrder();
                return;
            }

            createGuestOrder();
        } catch (error) {
            console.error(error);

            showToast(
                getApiErrorMessage(error, "Đặt hàng thất bại. Vui lòng kiểm tra lại thông tin."),
                "error"
            );

            if (placeOrderBtn) {
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = "Đặt hàng";
            }
        }
    }


    // 36. Xử lý tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const searchKeyword = document.getElementById("searchKeyword");
        const keyword = searchKeyword ? searchKeyword.value.trim() : "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 37. Load checkout items
    function loadCheckoutItems() {
        showCheckoutState("loading");

        orderItems = getCheckoutItemsFromStorage();

        if (orderItems.length === 0) {
            showCheckoutState("empty");
            return;
        }

        renderOrderItems();
        updateCheckoutSummary();
        showCheckoutState("content");
    }


    // 38. Gắn sự kiện
    function bindEvents() {
        if (checkoutForm) {
            checkoutForm.addEventListener("submit", handleCheckoutSubmit);
        }

        if (customerProvince) {
            customerProvince.addEventListener("change", function () {
                renderDistrictOptions(customerProvince.value);
            });
        }

        if (customerDistrict) {
            customerDistrict.addEventListener("change", function () {
                renderWardOptions(customerProvince.value, customerDistrict.value);
            });
        }

        if (shippingOptions) {
            shippingOptions.addEventListener("change", updateShippingFeeBySelectedMethod);
        }

        if (paymentOptions) {
            paymentOptions.addEventListener("change", updateTransferProofVisibility);
        }

        if (transferProofImage) {
            transferProofImage.addEventListener("change", handleTransferProofChange);
        }

        if (openPointPopupBtn) {
            openPointPopupBtn.addEventListener("click", openPointPopup);
        }

        if (closePointPopupBtn) {
            closePointPopupBtn.addEventListener("click", function () {
                closePopup(pointPopup);
            });
        }

        if (cancelPointPopupBtn) {
            cancelPointPopupBtn.addEventListener("click", function () {
                closePopup(pointPopup);
            });
        }

        if (pointInput) {
            pointInput.addEventListener("input", updatePointDiscountPreview);
        }

        if (applyPointBtn) {
            applyPointBtn.addEventListener("click", applyPointDiscount);
        }

        if (removePointBtn) {
            removePointBtn.addEventListener("click", removeAppliedPoint);
        }

        if (openVoucherPopupBtn) {
            openVoucherPopupBtn.addEventListener("click", function () {
                openVoucherPopup().catch(function () {
                    showToast("Không tải được danh sách voucher.", "error");
                });
            });
        }

        if (closeVoucherPopupBtn) {
            closeVoucherPopupBtn.addEventListener("click", function () {
                closePopup(voucherPopup);
            });
        }

        if (voucherList) {
            voucherList.addEventListener("click", function (event) {
                const applyButton = event.target.closest("[data-role='apply-voucher-btn'], .applyVoucherBtn");

                if (!applyButton) {
                    return;
                }

                const voucherCode = applyButton.dataset.voucherCode;

                applyVoucherByCode(voucherCode);
            });
        }

        if (removeVoucherBtn) {
            removeVoucherBtn.addEventListener("click", removeAppliedVoucher);
        }

        const searchForm = document.getElementById("searchForm");

        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }

        document.addEventListener("keydown", function (event) {
            if (event.key !== "Escape") {
                return;
            }

            closePopup(pointPopup);
            closePopup(voucherPopup);
        });
    }


    // 39. Khởi tạo trang checkout
    async function initCheckoutPage() {
        bindEvents();

        await checkCustomerLoginState();

        renderProvinceOptions();
        fillCustomerInfo();
        updatePointFeatureByLogin();
        updateShippingFeeBySelectedMethod();
        updateTransferProofVisibility();

        loadCheckoutItems();
    }

    initCheckoutPage();
});