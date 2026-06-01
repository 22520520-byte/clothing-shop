// =========================================================
// File: Frontend1/js/admin-order-detail.js
// Mục đích: Gắn trang chi tiết đơn hàng admin với API backend thật
// =========================================================


// 1. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");


// 2. Lấy element thông tin đơn hàng
const detailOrderCode = document.getElementById("detailOrderCode");
const detailOrderDate = document.getElementById("detailOrderDate");
const detailOrderStatusBadge = document.getElementById("detailOrderStatusBadge");


// 3. Lấy element thông tin khách hàng
const detailCustomerName = document.getElementById("detailCustomerName");
const detailCustomerPhone = document.getElementById("detailCustomerPhone");
const detailCustomerAddress = document.getElementById("detailCustomerAddress");
const detailOrderNote = document.getElementById("detailOrderNote");


// 4. Lấy element cập nhật trạng thái
const orderStatusForm = document.getElementById("orderStatusForm");
const detailOrderStatusSelect = document.getElementById("detailOrderStatusSelect");
const orderStatusMessage = document.getElementById("orderStatusMessage");
const saveOrderStatusHeaderBtn = document.getElementById("saveOrderStatusHeaderBtn");


// 5. Lấy element bảng sản phẩm trong đơn
const orderItemTableBody = document.getElementById("orderItemTableBody");
const orderItemRowTemplate = document.getElementById("orderItemRowTemplate");


// 6. Lấy element tổng thanh toán
const detailSubtotal = document.getElementById("detailSubtotal");
const detailShippingFee = document.getElementById("detailShippingFee");
const detailDiscount = document.getElementById("detailDiscount");
const detailTotal = document.getElementById("detailTotal");


// 7. Lấy element popup chi tiết giảm giá
const discountDetailTrigger = document.getElementById("discountDetailTrigger");
const discountDetailModalOverlay = document.getElementById("discountDetailModalOverlay");
const closeDiscountDetailModalBtn = document.getElementById("closeDiscountDetailModalBtn");
const closeDiscountDetailBtn = document.getElementById("closeDiscountDetailBtn");

const discountVoucherCode = document.getElementById("discountVoucherCode");
const discountVoucherName = document.getElementById("discountVoucherName");
const discountVoucherType = document.getElementById("discountVoucherType");
const discountVoucherValue = document.getElementById("discountVoucherValue");
const discountVoucherAmount = document.getElementById("discountVoucherAmount");

const discountUsedPoints = document.getElementById("discountUsedPoints");
const discountPointRate = document.getElementById("discountPointRate");
const discountPointAmount = document.getElementById("discountPointAmount");
const discountTotalAmount = document.getElementById("discountTotalAmount");


// 8. Lấy element trạng thái trang
const orderDetailMainCard = document.getElementById("orderDetailMainCard");
const orderDetailItemsCard = document.getElementById("orderDetailItemsCard");
const orderDetailSummaryCard = document.getElementById("orderDetailSummaryCard");
const orderNotFoundBox = document.getElementById("orderNotFoundBox");


// 9. Biến lưu trạng thái trang
let currentAdminUser = null;
let currentOrderId = null;
let currentOrderCode = "";
let currentOrderData = null;


// 10. Format tiền Việt Nam
function formatPrice(price) {
    if (window.AdminApi && window.AdminApi.formatPrice) {
        return window.AdminApi.formatPrice(price);
    }

    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}


// 11. Format số tiền giảm
function formatDiscountPrice(price) {
    const discount = Number(price || 0);

    if (discount <= 0) {
        return "0đ";
    }

    return "-" + formatPrice(discount);
}


// 12. Format ngày Việt Nam
function formatDate(dateString) {
    if (!dateString) {
        return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("vi-VN");
}


// 13. Render ngày hiện tại
function renderCurrentDate() {
    if (!adminCurrentDate) {
        return;
    }

    const today = new Date();

    adminCurrentDate.textContent = today.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}


// 14. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) {
        return "A";
    }

    return text.trim().charAt(0).toUpperCase();
}


// 15. Lấy id hoặc mã đơn từ URL
function getOrderQueryFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return {
        id: params.get("id") || params.get("order_id") || "",
        code: params.get("code") || params.get("order_code") || ""
    };
}


// 16. Lấy nhãn vai trò admin
function getAdminRoleLabel(roleCode, roleName) {
    if (roleCode === "owner") {
        return "Chủ cửa hàng";
    }

    if (roleCode === "admin") {
        return "Quản trị viên";
    }

    if (roleCode === "staff") {
        return "Nhân viên";
    }

    return roleName || "Quản trị viên";
}


// 17. Hiển thị thông tin admin
function renderAdminInfo(adminUser) {
    if (!adminUser) {
        return;
    }

    const fullName = adminUser.fullName || adminUser.full_name || "Quản trị viên";
    const roleCode = adminUser.role || "";
    const roleName = adminUser.roleName || "";

    if (adminName) {
        adminName.textContent = fullName;
    }

    if (adminRole) {
        adminRole.textContent = getAdminRoleLabel(roleCode, roleName);
    }

    if (adminAvatar) {
        adminAvatar.textContent = getFirstLetter(fullName);
    }

    const ownerOnlyLinks = document.querySelectorAll("[data-owner-only='true']");

    ownerOnlyLinks.forEach(function (link) {
        link.style.display = roleCode === "owner" ? "" : "none";
    });
}


// 18. Đăng xuất admin
function handleAdminLogout() {
    if (window.AdminApi && window.AdminApi.logoutAdmin) {
        window.AdminApi.logoutAdmin();
        return;
    }

    localStorage.removeItem("admin_current_user");
    localStorage.removeItem("admin_is_login");
    window.location.href = "../html/admin-login.html";
}


// 19. Lấy thông tin trạng thái đơn hàng
function getOrderStatusInfo(status) {
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
        text: "Không xác định",
        className: "statusPending"
    };
}


// 20. Xóa class trạng thái cũ
function clearStatusClass(element) {
    if (!element) {
        return;
    }

    element.classList.remove(
        "statusPending",
        "statusShipping",
        "statusCompleted",
        "statusCancelled",
        "statusActive",
        "statusHidden"
    );
}


// 21. Render badge trạng thái
function renderOrderStatusBadge(status) {
    if (!detailOrderStatusBadge) {
        return;
    }

    const statusInfo = getOrderStatusInfo(status);

    clearStatusClass(detailOrderStatusBadge);

    detailOrderStatusBadge.textContent = statusInfo.text;
    detailOrderStatusBadge.classList.add(statusInfo.className);
}


// 22. Hiển thị thông báo trạng thái
function showOrderStatusMessage(message, type = "error") {
    if (!orderStatusMessage) {
        return;
    }

    orderStatusMessage.textContent = message;

    if (type === "success") {
        orderStatusMessage.classList.add("success");
    } else {
        orderStatusMessage.classList.remove("success");
    }
}


// 23. Xóa thông báo trạng thái
function clearOrderStatusMessage() {
    if (!orderStatusMessage) {
        return;
    }

    orderStatusMessage.textContent = "";
    orderStatusMessage.classList.remove("success");
}


// 24. Hiển thị khu vực không tìm thấy
function showOrderNotFound() {
    if (orderDetailMainCard) {
        orderDetailMainCard.style.display = "none";
    }

    if (orderDetailItemsCard) {
        orderDetailItemsCard.style.display = "none";
    }

    if (orderDetailSummaryCard) {
        orderDetailSummaryCard.style.display = "none";
    }

    if (orderNotFoundBox) {
        orderNotFoundBox.style.display = "block";
    }

    if (saveOrderStatusHeaderBtn) {
        saveOrderStatusHeaderBtn.style.display = "none";
    }
}


// 25. Hiển thị khu vực chi tiết đơn hàng
function showOrderDetail() {
    if (orderDetailMainCard) {
        orderDetailMainCard.style.display = "block";
    }

    if (orderDetailItemsCard) {
        orderDetailItemsCard.style.display = "block";
    }

    if (orderDetailSummaryCard) {
        orderDetailSummaryCard.style.display = "block";
    }

    if (orderNotFoundBox) {
        orderNotFoundBox.style.display = "none";
    }

    if (saveOrderStatusHeaderBtn) {
        saveOrderStatusHeaderBtn.style.display = "";
    }
}


// 26. Lấy tên khách hàng
function getOrderCustomerName(order) {
    if (order.customer && order.customer.full_name) {
        return order.customer.full_name;
    }

    if (order.customer && order.customer.name) {
        return order.customer.name;
    }

    if (order.receiver && order.receiver.name) {
        return order.receiver.name;
    }

    return "Khách hàng";
}


// 27. Lấy số điện thoại khách hàng
function getOrderCustomerPhone(order) {
    if (order.receiver && order.receiver.phone) {
        return order.receiver.phone;
    }

    if (order.customer && order.customer.phone) {
        return order.customer.phone;
    }

    return "Chưa cập nhật";
}


// 28. Lấy địa chỉ giao hàng
function getOrderShippingAddress(order) {
    if (order.receiver && order.receiver.shipping_address) {
        return order.receiver.shipping_address;
    }

    if (order.shipping_address) {
        return order.shipping_address;
    }

    return "Chưa cập nhật";
}


// 29. Lấy mã trạng thái đơn hàng
function getOrderStatusCode(order) {
    if (order.status && order.status.code) {
        return order.status.code;
    }

    if (order.order_status) {
        return order.order_status;
    }

    return "pending";
}


// 30. Lấy danh sách trạng thái tiếp theo
function getNextStatuses(order) {
    if (order.status && Array.isArray(order.status.next_statuses)) {
        return order.status.next_statuses;
    }

    return [];
}


// 31. Lấy dữ liệu tiền của đơn hàng
function getOrderMoney(order) {
    const money = order.money || {};

    return {
        totalProductPrice: Number(money.total_product_price || 0),
        shippingFee: Number(money.shipping_fee || 0),
        discountAmount: Number(money.discount_amount || 0),
        pointsDiscount: Number(money.points_discount || 0),
        finalTotal: Number(money.final_total || 0)
    };
}


// 32. Lấy tổng giảm giá
function calculateTotalDiscount(order) {
    const money = getOrderMoney(order);

    return Number(money.discountAmount || 0) + Number(money.pointsDiscount || 0);
}


// 33. Lấy tên sản phẩm trong order item
function getItemProductName(item) {
    if (item.product && item.product.name) {
        return item.product.name;
    }

    return item.product_name || "Sản phẩm";
}


// 34. Lấy phân loại sản phẩm trong order item
function getItemVariantText(item) {
    const colorName = item.variant && item.variant.color
        ? item.variant.color.name
        : "";

    const sizeName = item.variant && item.variant.size
        ? item.variant.size.name
        : "";

    const variantText = [colorName, sizeName].filter(Boolean).join(" / ");

    return variantText || "Không có phân loại";
}


// 35. Lấy đơn giá item
function getItemPrice(item) {
    if (item.price_at_time !== undefined) {
        return Number(item.price_at_time || 0);
    }

    if (item.product && item.product.base_price !== undefined) {
        return Number(item.product.base_price || 0);
    }

    return Number(item.price || 0);
}


// 36. Lấy thành tiền item
function getItemTotal(item) {
    if (item.total_price !== undefined) {
        return Number(item.total_price || 0);
    }

    return getItemPrice(item) * Number(item.quantity || 0);
}


// 37. Render thông tin khách hàng
function renderCustomerInfo(order) {
    if (detailCustomerName) {
        detailCustomerName.textContent = getOrderCustomerName(order);
    }

    if (detailCustomerPhone) {
        detailCustomerPhone.textContent = getOrderCustomerPhone(order);
    }

    if (detailCustomerAddress) {
        detailCustomerAddress.textContent = getOrderShippingAddress(order);
    }

    if (detailOrderNote) {
        detailOrderNote.textContent = order.note || "Không có ghi chú";
    }
}


// 38. Render danh sách trạng thái có thể cập nhật
function renderOrderStatusSelect(order) {
    if (!detailOrderStatusSelect) {
        return;
    }

    const currentStatus = getOrderStatusCode(order);
    const nextStatuses = getNextStatuses(order);

    const statusList = [currentStatus, ...nextStatuses];

    detailOrderStatusSelect.innerHTML = "";

    statusList.forEach(function (status) {
        const statusInfo = getOrderStatusInfo(status);
        const option = document.createElement("option");

        option.value = status;
        option.textContent = statusInfo.text;

        detailOrderStatusSelect.appendChild(option);
    });

    detailOrderStatusSelect.value = currentStatus;

    const canUpdate = nextStatuses.length > 0;

    detailOrderStatusSelect.disabled = !canUpdate;

    if (saveOrderStatusHeaderBtn) {
        saveOrderStatusHeaderBtn.disabled = !canUpdate;
    }

    const submitButton = orderStatusForm
        ? orderStatusForm.querySelector("button[type='submit']")
        : null;

    if (submitButton) {
        submitButton.disabled = !canUpdate;
    }

    if (!canUpdate) {
        showOrderStatusMessage("Đơn hàng hiện không còn trạng thái tiếp theo để cập nhật.", "success");
    } else {
        clearOrderStatusMessage();
    }
}


// 39. Render danh sách sản phẩm trong đơn
function renderOrderItems(items) {
    if (!orderItemTableBody || !orderItemRowTemplate) {
        return;
    }

    orderItemTableBody.innerHTML = "";

    const itemList = Array.isArray(items) ? items : [];

    itemList.forEach(function (item) {
        const rowFragment = orderItemRowTemplate.content.cloneNode(true);

        const itemNameText = rowFragment.querySelector(".itemNameText");
        const itemVariantText = rowFragment.querySelector(".itemVariantText");
        const itemQuantityText = rowFragment.querySelector(".itemQuantityText");
        const itemPriceText = rowFragment.querySelector(".itemPriceText");
        const itemTotalText = rowFragment.querySelector(".itemTotalText");

        const itemName = getItemProductName(item);
        const variantText = getItemVariantText(item);
        const quantity = Number(item.quantity || 0);
        const price = getItemPrice(item);
        const total = getItemTotal(item);

        if (itemNameText) {
            itemNameText.textContent = itemName;
        }

        if (itemVariantText) {
            itemVariantText.textContent = variantText;
        }

        if (itemQuantityText) {
            itemQuantityText.textContent = quantity;
        }

        if (itemPriceText) {
            itemPriceText.textContent = formatPrice(price);
        }

        if (itemTotalText) {
            itemTotalText.textContent = formatPrice(total);
        }

        orderItemTableBody.appendChild(rowFragment);
    });
}


// 40. Render tổng thanh toán
function renderOrderSummary(order) {
    const money = getOrderMoney(order);
    const totalDiscount = calculateTotalDiscount(order);

    if (detailSubtotal) {
        detailSubtotal.textContent = formatPrice(money.totalProductPrice);
    }

    if (detailShippingFee) {
        detailShippingFee.textContent = formatPrice(money.shippingFee);
    }

    if (detailDiscount) {
        detailDiscount.textContent = formatDiscountPrice(totalDiscount);
    }

    if (detailTotal) {
        detailTotal.textContent = formatPrice(money.finalTotal);
    }
}


// 41. Render popup chi tiết giảm giá
function renderDiscountDetail(order) {
    if (!order) {
        return;
    }

    const money = getOrderMoney(order);
    const voucherDiscount = Number(money.discountAmount || 0);
    const pointDiscount = Number(money.pointsDiscount || 0);
    const totalDiscount = voucherDiscount + pointDiscount;

    if (discountVoucherCode) {
        discountVoucherCode.textContent = voucherDiscount > 0 ? "Đã áp dụng" : "Không áp dụng";
    }

    if (discountVoucherName) {
        discountVoucherName.textContent = voucherDiscount > 0 ? "Ưu đãi giảm giá đơn hàng" : "Không áp dụng";
    }

    if (discountVoucherType) {
        discountVoucherType.textContent = voucherDiscount > 0 ? "Giảm trực tiếp" : "Không áp dụng";
    }

    if (discountVoucherValue) {
        discountVoucherValue.textContent = formatPrice(voucherDiscount);
    }

    if (discountVoucherAmount) {
        discountVoucherAmount.textContent = formatDiscountPrice(voucherDiscount);
    }

    if (discountUsedPoints) {
        discountUsedPoints.textContent = pointDiscount > 0 ? "Có sử dụng điểm" : "Không sử dụng";
    }

    if (discountPointRate) {
        discountPointRate.textContent = pointDiscount > 0 ? "Theo cấu hình hệ thống" : "Không áp dụng";
    }

    if (discountPointAmount) {
        discountPointAmount.textContent = formatDiscountPrice(pointDiscount);
    }

    if (discountTotalAmount) {
        discountTotalAmount.textContent = formatDiscountPrice(totalDiscount);
    }
}


// 42. Mở popup chi tiết giảm giá
function openDiscountDetailModal() {
    if (!currentOrderData || !discountDetailModalOverlay) {
        return;
    }

    renderDiscountDetail(currentOrderData);
    discountDetailModalOverlay.classList.add("show");
}


// 43. Đóng popup chi tiết giảm giá
function closeDiscountDetailModal() {
    if (!discountDetailModalOverlay) {
        return;
    }

    discountDetailModalOverlay.classList.remove("show");
}


// 44. Render chi tiết đơn hàng
function renderOrderDetail(order) {
    if (!order) {
        showOrderNotFound();
        return;
    }

    currentOrderData = order;
    currentOrderId = order.id;
    currentOrderCode = order.order_code || "";

    showOrderDetail();

    document.title = "Chi tiết " + currentOrderCode;

    if (detailOrderCode) {
        detailOrderCode.textContent = currentOrderCode;
    }

    if (detailOrderDate) {
        detailOrderDate.textContent = formatDate(order.created_at);
    }

    renderOrderStatusBadge(getOrderStatusCode(order));
    renderOrderStatusSelect(order);
    renderCustomerInfo(order);
    renderOrderItems(order.items || []);
    renderOrderSummary(order);
    renderDiscountDetail(order);
}


// 45. Load chi tiết đơn hàng từ API
async function loadOrderDetail() {
    const query = getOrderQueryFromUrl();

    if (!query.id && !query.code) {
        showOrderNotFound();
        return;
    }

    let endpoint = "admin/orders/get-order-detail.php?";

    if (query.id) {
        endpoint += "id=" + encodeURIComponent(query.id);
    } else {
        endpoint += "order_code=" + encodeURIComponent(query.code);
    }

    const response = await window.AdminApi.get(endpoint);
    const order = response.data && response.data.order ? response.data.order : null;

    if (!order) {
        showOrderNotFound();
        return;
    }

    renderOrderDetail(order);
}


// 46. Set trạng thái loading nút lưu
function setSaveStatusLoading(isLoading) {
    const submitButton = orderStatusForm
        ? orderStatusForm.querySelector("button[type='submit']")
        : null;

    if (saveOrderStatusHeaderBtn) {
        saveOrderStatusHeaderBtn.disabled = isLoading;
        saveOrderStatusHeaderBtn.textContent = isLoading ? "Đang lưu..." : "Lưu trạng thái";
    }

    if (submitButton) {
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? "Đang lưu..." : "Lưu trạng thái";
    }
}


// 47. Lưu trạng thái đơn hàng bằng API
async function saveOrderStatus(event) {
    if (event) {
        event.preventDefault();
    }

    if (!currentOrderData || !currentOrderId || !detailOrderStatusSelect) {
        return;
    }

    const newStatus = detailOrderStatusSelect.value;
    const oldStatus = getOrderStatusCode(currentOrderData);

    clearOrderStatusMessage();

    if (newStatus === oldStatus) {
        showOrderStatusMessage("Bạn chưa chọn trạng thái mới.", "error");
        return;
    }

    try {
        setSaveStatusLoading(true);

        await window.AdminApi.post("admin/orders/update-order-status.php", {
            order_id: Number(currentOrderId),
            order_code: currentOrderCode,
            status: newStatus,
            new_status: newStatus,
            note: currentOrderData.note || ""
        });

        showOrderStatusMessage("Cập nhật trạng thái đơn hàng thành công.", "success");

        await loadOrderDetail();
    } catch (error) {
        showOrderStatusMessage(
            window.AdminApi.getApiErrorMessage(
                error,
                "Cập nhật trạng thái đơn hàng thất bại."
            )
        );
    } finally {
        setSaveStatusLoading(false);
    }
}


// 48. Gắn sự kiện popup giảm giá
function bindDiscountDetailEvents() {
    if (discountDetailTrigger) {
        discountDetailTrigger.addEventListener("click", openDiscountDetailModal);
    }

    if (closeDiscountDetailModalBtn) {
        closeDiscountDetailModalBtn.addEventListener("click", closeDiscountDetailModal);
    }

    if (closeDiscountDetailBtn) {
        closeDiscountDetailBtn.addEventListener("click", closeDiscountDetailModal);
    }

    if (discountDetailModalOverlay) {
        discountDetailModalOverlay.addEventListener("click", function (event) {
            if (event.target === discountDetailModalOverlay) {
                closeDiscountDetailModal();
            }
        });
    }
}


// 49. Gắn sự kiện trang chi tiết đơn hàng
function bindOrderDetailEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (orderStatusForm) {
        orderStatusForm.addEventListener("submit", saveOrderStatus);
    }

    if (saveOrderStatusHeaderBtn) {
        saveOrderStatusHeaderBtn.addEventListener("click", function () {
            if (orderStatusForm) {
                orderStatusForm.requestSubmit();
            }
        });
    }

    if (detailOrderStatusSelect) {
        detailOrderStatusSelect.addEventListener("change", function () {
            renderOrderStatusBadge(detailOrderStatusSelect.value);
            clearOrderStatusMessage();
        });
    }

    bindDiscountDetailEvents();
}


// 50. Kiểm tra đăng nhập local
function checkAdminLoginLocal() {
    if (!window.AdminApi) {
        window.location.href = "../html/admin-login.html";
        return null;
    }

    const adminUser = window.AdminApi.getCurrentAdminFromLocal();

    if (!adminUser) {
        window.location.href = "../html/admin-login.html";
        return null;
    }

    return adminUser;
}


// 51. Khởi tạo trang chi tiết đơn hàng
async function initAdminOrderDetailPage() {
    currentAdminUser = checkAdminLoginLocal();

    if (!currentAdminUser) {
        return;
    }

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    bindOrderDetailEvents();

    try {
        await loadOrderDetail();
    } catch (error) {
        if (error && error.status === 401) {
            window.AdminApi.clearAdminLocalAuth();
            window.location.href = "../html/admin-login.html";
            return;
        }

        showOrderNotFound();
    }
}

initAdminOrderDetailPage();