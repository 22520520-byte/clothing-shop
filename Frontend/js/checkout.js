// 1. Chờ HTML tải xong

document.addEventListener("DOMContentLoaded", function () {
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

    // 3. Quy đổi điểm

    const POINT_STEP = 100;
    const POINT_MONEY = 10000;

    // 4. Biến trạng thái

    let orderItems = [];
    let subtotal = 0;
    let shippingFeeValue = 30000;

    let appliedPoint = null;
    let appliedVoucher = null;

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

    // 11. Hàm tiện ích

    function formatPrice(price) {
        return Number(price || 0).toLocaleString("vi-VN") + "đ";
    }

    function formatDate(timestamp) {
        if (!timestamp) {
            return "Không giới hạn";
        }

        return new Date(timestamp).toLocaleDateString("vi-VN");
    }

    function generateOrderId() {
        return "DH" + Date.now() + Math.floor(Math.random() * 1000);
    }

    function createCartItemId(productId, size, color) {
        return productId + "_" + size + "_" + color;
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

    function getCartItemsFromStorage() {
        const cartItems = getDataFromStorage(CART_STORAGE_KEY, []);

        if (!Array.isArray(cartItems)) {
            return [];
        }

        return cartItems;
    }

    function saveCartItemsToStorage(cartItems) {
        saveDataToStorage(CART_STORAGE_KEY, cartItems);
    }

    // 13. Kiểm tra đăng nhập

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

    // 14. Điểm tích lũy

    function getUserPointMap() {
        const pointMap = getDataFromStorage(USER_POINTS_STORAGE_KEY, {});

        if (!pointMap || typeof pointMap !== "object" || Array.isArray(pointMap)) {
            return {};
        }

        return pointMap;
    }

    function getCurrentUserPoints() {
        const currentUser = getCurrentUser();
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
        const currentUser = getCurrentUser();
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

    // 15. Lấy voucher đã lưu

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

    function saveSavedVoucherMap(savedMap) {
        saveDataToStorage(SAVED_VOUCHERS_STORAGE_KEY, savedMap);
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

        return vouchers;
    }

    function saveCurrentUserSavedVouchers(vouchers) {
        const userKey = getCurrentUserKey();

        if (!userKey) {
            return;
        }

        const savedMap = getSavedVoucherMap();
        savedMap[userKey] = vouchers;

        saveSavedVoucherMap(savedMap);
    }

    // 16. Chuẩn hóa sản phẩm thanh toán

    function normalizeCheckoutItem(item) {
        const quantity = Number(item.quantity || item.qty || 1);
        const price = Number(item.price || item.currentPrice || 0);

        const color = item.color || item.selectedColor || "";
        const size = item.size || item.selectedSize || "";
        const id = item.id || item.productId || "";
        const cartItemId = item.cartItemId || createCartItemId(id, size, color);

        return {
            cartItemId: cartItemId,
            id: id,
            name: item.name || item.productName || "Sản phẩm",
            image: item.image || item.img || item.thumbnail || "",
            price: price,
            oldPrice: Number(item.oldPrice || 0),
            quantity: quantity,
            color: color,
            size: size,
            meta: item.meta || buildVariantText(color, size),
            selected: item.selected !== false
        };
    }

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

    function getCheckoutItemsFromStorage() {
        const checkoutItems = getDataFromStorage(CHECKOUT_STORAGE_KEY, []);

        if (Array.isArray(checkoutItems) && checkoutItems.length > 0) {
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

    // 17. Tính tiền

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
            return Math.min(percentDiscount, Number(voucher.maxDiscount || percentDiscount), subtotal);
        }

        if (voucher.discountType === "shipping") {
            return Math.min(Number(voucher.maxDiscount || voucher.discountValue || 0), shippingFeeValue);
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

    // 18. Hiển thị trạng thái đơn hàng

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

    function renderSummary() {
        const voucherDiscount = getVoucherDiscount();
        const pointDiscount = getPointDiscount();
        const totalDiscount = voucherDiscount + pointDiscount;
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

    function updateCheckoutSummary() {
        subtotal = calculateSubtotal(orderItems);
        renderSummary();

        if (placeOrderBtn) {
            placeOrderBtn.disabled = orderItems.length === 0;
        }
    }

    // 19. Địa chỉ

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

    // 20. Thông tin người dùng

    function fillCustomerInfo() {
        const currentUser = getCurrentUser();

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

    // 21. Popup chung

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

    // 22. Xử lý điểm

    function updatePointFeatureByLogin() {
        const loggedIn = isUserLoggedIn();

        if (openPointPopupBtn) {
            openPointPopupBtn.hidden = !loggedIn;
        }

        if (discountActions) {
            discountActions.style.gridTemplateColumns = loggedIn
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
        if (!isUserLoggedIn()) {
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
        if (!isUserLoggedIn()) {
            showToast("Bạn cần đăng nhập để đổi điểm.", "warning");
            return;
        }

        const currentPoints = getCurrentUserPoints();
        const inputPoints = Number(pointInput?.value || 0);
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
        const maxDiscountByOrder = Math.max(subtotal - getVoucherDiscount(), 0);

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

    // 23. Xử lý voucher

    function formatVoucherValue(voucher) {
        if (voucher.discountType === "amount") {
            return "Giảm " + formatPrice(voucher.discountValue);
        }

        if (voucher.discountType === "percent") {
            return "Giảm " + voucher.discountValue + "% tối đa " + formatPrice(voucher.maxDiscount);
        }

        if (voucher.discountType === "shipping") {
            return "Freeship tối đa " + formatPrice(voucher.maxDiscount || voucher.discountValue);
        }

        return "Ưu đãi";
    }

    function formatVoucherCondition(voucher) {
        return "Đơn từ " + formatPrice(voucher.minOrderValue || voucher.minOrder || 0);
    }

    function renderVoucherItem(voucher) {
        if (!voucherItemTemplate) {
            return null;
        }

        const clone = voucherItemTemplate.content.cloneNode(true);

        const voucherItem = clone.querySelector(".voucherItem");
        const voucherCode = clone.querySelector('[data-role="voucher-code"]');
        const voucherSource = clone.querySelector('[data-role="voucher-source"]');
        const voucherDescription = clone.querySelector('[data-role="voucher-description"]');
        const voucherValue = clone.querySelector('[data-role="voucher-value"]');
        const voucherCondition = clone.querySelector('[data-role="voucher-condition"]');
        const voucherExpiry = clone.querySelector('[data-role="voucher-expiry"]');
        const voucherStatus = clone.querySelector('[data-role="voucher-status"]');
        const applyButton = clone.querySelector('[data-role="apply-voucher-btn"]');

        const applyResult = canApplyVoucher(voucher);
        const isCurrentApplied = appliedVoucher && appliedVoucher.id === voucher.id;

        if (voucherItem) {
            voucherItem.dataset.voucherId = voucher.id || "";
            voucherItem.dataset.voucherCode = voucher.code || "";
        }

        if (voucherCode) {
            voucherCode.textContent = voucher.code || "VOUCHER";
        }

        if (voucherSource) {
            voucherSource.textContent = voucher.source === "big-voucher" ? "Big Voucher" : "Voucher";
        }

        if (voucherDescription) {
            voucherDescription.textContent = voucher.description || voucher.title || "Mã giảm giá đã lưu.";
        }

        if (voucherValue) {
            voucherValue.textContent = formatVoucherValue(voucher);
        }

        if (voucherCondition) {
            voucherCondition.textContent = formatVoucherCondition(voucher);
        }

        if (voucherExpiry) {
            voucherExpiry.textContent = "HSD: " + formatDate(voucher.expiresAt);
        }

        if (voucherStatus) {
            voucherStatus.textContent = isCurrentApplied ? "Đang được áp dụng." : applyResult.message;
            voucherStatus.classList.toggle("canApply", applyResult.canApply || isCurrentApplied);
            voucherStatus.classList.toggle("cannotApply", !applyResult.canApply && !isCurrentApplied);
        }

        if (applyButton) {
            applyButton.dataset.voucherId = voucher.id || "";
            applyButton.textContent = isCurrentApplied ? "Đang dùng" : "Áp dụng";
            applyButton.disabled = !applyResult.canApply || isCurrentApplied;
        }

        return clone;
    }

    function renderVoucherList() {
        if (!voucherList) {
            return;
        }

        voucherList.innerHTML = "";

        if (!isUserLoggedIn()) {
            if (voucherEmptyState) {
                voucherEmptyState.hidden = false;
                voucherEmptyState.querySelector("p").textContent = "Vui lòng đăng nhập để xem voucher đã lưu.";
            }

            return;
        }

        const savedVouchers = getCurrentUserSavedVouchers().filter(function (voucher) {
            return !voucher.used;
        });

        if (savedVouchers.length === 0) {
            if (voucherEmptyState) {
                voucherEmptyState.hidden = false;
                voucherEmptyState.querySelector("p").textContent = "Bạn chưa có voucher nào được lưu.";
            }

            return;
        }

        if (voucherEmptyState) {
            voucherEmptyState.hidden = true;
        }

        const fragment = document.createDocumentFragment();

        savedVouchers.forEach(function (voucher) {
            const voucherElement = renderVoucherItem(voucher);

            if (voucherElement) {
                fragment.appendChild(voucherElement);
            }
        });

        voucherList.appendChild(fragment);
    }

    function openVoucherPopup() {
        renderVoucherList();
        openPopup(voucherPopup);
    }

    function applyVoucher(voucherId) {
        const savedVouchers = getCurrentUserSavedVouchers();
        const voucher = savedVouchers.find(function (item) {
            return item.id === voucherId;
        });

        if (!voucher) {
            showToast("Không tìm thấy voucher.", "error");
            return;
        }

        const applyResult = canApplyVoucher(voucher);

        if (!applyResult.canApply) {
            showToast(applyResult.message, "warning");
            renderVoucherList();
            return;
        }

        appliedVoucher = {
            ...voucher,
            discountAmount: calculateVoucherDiscount(voucher)
        };

        closePopup(voucherPopup);
        updateCheckoutSummary();
        showToast("Đã áp dụng voucher " + voucher.code + ".", "success");
    }

    function removeAppliedVoucher() {
        appliedVoucher = null;
        updateCheckoutSummary();
        showToast("Đã bỏ mã giảm giá.", "success");
    }

    // 24. Phương thức giao hàng và thanh toán

    function getSelectedShippingMethod() {
        const selected = document.querySelector('input[name="shippingMethod"]:checked');

        if (!selected) {
            return {
                method: "standard",
                name: "Giao hàng tiêu chuẩn",
                fee: 30000
            };
        }

        return {
            method: selected.value,
            name: selected.dataset.shippingName || "Giao hàng",
            fee: Number(selected.dataset.shippingFee || 0)
        };
    }

    function getSelectedPaymentMethod() {
        const selected = document.querySelector('input[name="paymentMethod"]:checked');

        if (!selected) {
            return {
                method: "cod",
                name: "Thanh toán khi nhận hàng"
            };
        }

        return {
            method: selected.value,
            name: selected.dataset.paymentName || "Thanh toán khi nhận hàng"
        };
    }

    function updateShippingFee() {
        const shipping = getSelectedShippingMethod();
        shippingFeeValue = shipping.fee;

        if (appliedVoucher) {
            appliedVoucher.discountAmount = calculateVoucherDiscount(appliedVoucher);
        }

        updateCheckoutSummary();
        renderVoucherList();
    }

    function updatePaymentBox() {
        const payment = getSelectedPaymentMethod();

        if (!transferProofBox) {
            return;
        }

        transferProofBox.hidden = payment.method !== "qr_transfer";
    }

    function handleTransferProofPreview() {
        const file = transferProofImage?.files?.[0];

        if (!file || !transferPreview || !transferPreviewImage || !transferFileName) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            transferPreviewImage.src = event.target.result;
            transferFileName.textContent = file.name;
            transferPreview.hidden = false;
        };

        reader.readAsDataURL(file);
    }

    // 25. Tạo đơn hàng

    function getCustomerInfo() {
        return {
            fullName: customerFullName?.value.trim() || "",
            phone: customerPhone?.value.trim() || "",
            email: customerEmail?.value.trim() || "",
            province: customerProvince?.value || "",
            district: customerDistrict?.value || "",
            ward: customerWard?.value || "",
            address: customerAddress?.value.trim() || "",
            note: orderNote?.value.trim() || ""
        };
    }

    function saveOrder(order) {
        const orders = getDataFromStorage(ORDERS_STORAGE_KEY, []);

        if (Array.isArray(orders)) {
            orders.unshift(order);
            saveDataToStorage(ORDERS_STORAGE_KEY, orders);
        } else {
            saveDataToStorage(ORDERS_STORAGE_KEY, [order]);
        }

        saveDataToStorage(CURRENT_ORDER_STORAGE_KEY, order);
    }

    function removeCheckoutItemsFromCart() {
        const cartItems = getCartItemsFromStorage();

        if (cartItems.length === 0 || orderItems.length === 0) {
            return;
        }

        const checkoutItemIds = orderItems.map(function (item) {
            return item.cartItemId;
        });

        const newCartItems = cartItems.filter(function (cartItem) {
            const normalizedCartItem = normalizeCheckoutItem(cartItem);

            return !checkoutItemIds.includes(normalizedCartItem.cartItemId);
        });

        saveCartItemsToStorage(newCartItems);
    }

    function markVoucherAsUsed() {
        if (!appliedVoucher || !isUserLoggedIn()) {
            return;
        }

        const savedVouchers = getCurrentUserSavedVouchers();

        const updatedVouchers = savedVouchers.map(function (voucher) {
            if (voucher.id !== appliedVoucher.id) {
                return voucher;
            }

            return {
                ...voucher,
                used: true,
                usedAt: new Date().toISOString()
            };
        });

        saveCurrentUserSavedVouchers(updatedVouchers);
    }

    function deductUsedPoints() {
        if (!appliedPoint || !isUserLoggedIn()) {
            return;
        }

        const currentPoints = getCurrentUserPoints();
        const remainingPoints = Math.max(currentPoints - Number(appliedPoint.points || 0), 0);

        saveCurrentUserPoints(remainingPoints);
    }

    function createOrderData() {
        const shipping = getSelectedShippingMethod();
        const payment = getSelectedPaymentMethod();
        const customer = getCustomerInfo();

        const pointDiscount = getPointDiscount();
        const voucherDiscount = getVoucherDiscount();
        const totalDiscount = pointDiscount + voucherDiscount;
        const finalTotal = getFinalTotal();

        const orderId = generateOrderId();

        return {
            id: orderId,
            orderId: orderId,
            userKey: getCurrentUserKey(),
            customerType: isUserLoggedIn() ? "member" : "guest",
            customer: customer,
            items: orderItems,
            shipping: shipping,
            payment: {
                ...payment,
                transferProofFileName: transferProofImage?.files?.[0]?.name || ""
            },
            benefits: {
                point: appliedPoint,
                voucher: appliedVoucher
            },
            summary: {
                subtotal: subtotal,
                shippingFee: shipping.fee,
                pointDiscount: pointDiscount,
                voucherDiscount: voucherDiscount,
                discountTotal: totalDiscount,
                total: finalTotal
            },
            status: "pending",
            statusText: "Chờ xác nhận",
            createdAt: new Date().toISOString()
        };
    }

    function handlePlaceOrder(event) {
        event.preventDefault();

        if (orderItems.length === 0) {
            showToast("Chưa có sản phẩm nào để đặt hàng.", "warning");
            return;
        }

        if (!checkoutForm.checkValidity()) {
            checkoutForm.reportValidity();
            return;
        }

        const payment = getSelectedPaymentMethod();

        if (payment.method === "qr_transfer" && !transferProofImage?.files?.[0]) {
            showToast("Vui lòng tải ảnh minh chứng chuyển khoản.", "warning");
            return;
        }

        const order = createOrderData();

        saveOrder(order);
        removeCheckoutItemsFromCart();
        markVoucherAsUsed();
        deductUsedPoints();

        localStorage.removeItem(CHECKOUT_STORAGE_KEY);

        window.location.href = "../html/order-success.html?id=" + encodeURIComponent(order.orderId);
    }

    // 26. Load dữ liệu checkout

    function loadCheckoutData() {
        try {
            showCheckoutState("loading");

            orderItems = getCheckoutItemsFromStorage();
            subtotal = calculateSubtotal(orderItems);

            if (orderItems.length === 0) {
                showCheckoutState("empty");
                if (placeOrderBtn) {
                    placeOrderBtn.disabled = true;
                }
                return;
            }

            showCheckoutState("");
            renderOrderItems();
            updateShippingFee();
        } catch (error) {
            console.error("Lỗi load checkout:", error);
            showCheckoutState("error");
        }
    }

    // 27. Gắn sự kiện

    customerProvince?.addEventListener("change", function () {
        renderDistrictOptions(customerProvince.value);
    });

    customerDistrict?.addEventListener("change", function () {
        renderWardOptions(customerProvince.value, customerDistrict.value);
    });

    shippingOptions?.addEventListener("change", updateShippingFee);
    paymentOptions?.addEventListener("change", updatePaymentBox);
    transferProofImage?.addEventListener("change", handleTransferProofPreview);

    openPointPopupBtn?.addEventListener("click", openPointPopup);
    closePointPopupBtn?.addEventListener("click", function () {
        closePopup(pointPopup);
    });
    cancelPointPopupBtn?.addEventListener("click", function () {
        closePopup(pointPopup);
    });
    pointInput?.addEventListener("input", updatePointDiscountPreview);
    applyPointBtn?.addEventListener("click", applyPointDiscount);
    removePointBtn?.addEventListener("click", removeAppliedPoint);

    openVoucherPopupBtn?.addEventListener("click", openVoucherPopup);
    closeVoucherPopupBtn?.addEventListener("click", function () {
        closePopup(voucherPopup);
    });
    removeVoucherBtn?.addEventListener("click", removeAppliedVoucher);

    voucherList?.addEventListener("click", function (event) {
        const applyButton = event.target.closest('[data-role="apply-voucher-btn"]');

        if (!applyButton) {
            return;
        }

        const voucherId = applyButton.dataset.voucherId;

        if (!voucherId) {
            return;
        }

        applyVoucher(voucherId);
    });

    pointPopup?.addEventListener("click", function (event) {
        if (event.target === pointPopup) {
            closePopup(pointPopup);
        }
    });

    voucherPopup?.addEventListener("click", function (event) {
        if (event.target === voucherPopup) {
            closePopup(voucherPopup);
        }
    });

    checkoutForm?.addEventListener("submit", handlePlaceOrder);

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        closePopup(pointPopup);
        closePopup(voucherPopup);
    });

    // 28. Khởi tạo trang

    function initCheckoutPage() {
        renderProvinceOptions();
        fillCustomerInfo();
        updatePointFeatureByLogin();
        updatePaymentBox();
        loadCheckoutData();
    }

    initCheckoutPage();
});