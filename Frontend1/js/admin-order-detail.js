// 1. Khai báo key localStorage
const ADMIN_CURRENT_USER_KEY = "admin_current_user";
const ADMIN_IS_LOGIN_KEY = "admin_is_login";
const ADMIN_ORDERS_KEY = "admin_orders";

// 2. Dữ liệu đơn hàng mẫu dự phòng
const demoAdminOrders = [
    {
        id: "DH001",
        customerName: "Nguyễn Minh Anh",
        phone: "0901234567",
        address: "12 Nguyễn Huệ, Quận 1, TP.HCM",
        orderDate: "2026-05-18",
        status: "pending",
        note: "Giao hàng giờ hành chính.",
        shippingFee: 30000,
        discount: 50000,
        voucherDiscount: 50000,
        pointDiscount: 0,
        appliedVoucher: {
            code: "FASHION50",
            name: "Giảm 50K cho đơn từ 500K",
            type: "fixed",
            value: 50000
        },
        usedPoints: 0,
        pointRate: 100,
        items: [
            {
                name: "Áo thun basic nam",
                color: "Trắng",
                size: "L",
                quantity: 2,
                price: 199000
            },
            {
                name: "Quần jean xanh đậm",
                color: "Xanh",
                size: "32",
                quantity: 1,
                price: 459000
            }
        ]
    },
    {
        id: "DH002",
        customerName: "Trần Hoàng Nam",
        phone: "0912345678",
        address: "45 Võ Văn Ngân, TP Thủ Đức, TP.HCM",
        orderDate: "2026-05-18",
        status: "shipping",
        note: "Gọi trước khi giao.",
        shippingFee: 30000,
        discount: 20000,
        voucherDiscount: 0,
        pointDiscount: 20000,
        appliedVoucher: null,
        usedPoints: 200,
        pointRate: 100,
        items: [
            {
                name: "Áo hoodie form rộng",
                color: "Đen",
                size: "XL",
                quantity: 1,
                price: 399000
            },
            {
                name: "Mũ lưỡi trai basic",
                color: "Đen",
                size: "Freesize",
                quantity: 1,
                price: 129000
            }
        ]
    },
    {
        id: "DH003",
        customerName: "Lê Phương Thảo",
        phone: "0987654321",
        address: "88 Lê Văn Sỹ, Quận 3, TP.HCM",
        orderDate: "2026-05-17",
        status: "completed",
        note: "",
        shippingFee: 0,
        discount: 100000,
        voucherDiscount: 70000,
        pointDiscount: 30000,
        appliedVoucher: {
            code: "BIGSALE70",
            name: "Giảm 70K đơn hàng thời trang",
            type: "fixed",
            value: 70000
        },
        usedPoints: 300,
        pointRate: 100,
        items: [
            {
                name: "Áo khoác kaki nữ",
                color: "Be",
                size: "M",
                quantity: 1,
                price: 520000
            },
            {
                name: "Chân váy ngắn basic",
                color: "Đen",
                size: "M",
                quantity: 2,
                price: 299000
            }
        ]
    },
    {
        id: "DH004",
        customerName: "Phạm Quốc Huy",
        phone: "0934567890",
        address: "25 Cách Mạng Tháng 8, Quận 10, TP.HCM",
        orderDate: "2026-05-17",
        status: "cancelled",
        note: "Khách hủy vì đặt nhầm size.",
        shippingFee: 30000,
        discount: 0,
        voucherDiscount: 0,
        pointDiscount: 0,
        appliedVoucher: null,
        usedPoints: 0,
        pointRate: 100,
        items: [
            {
                name: "Áo sơ mi trắng basic",
                color: "Trắng",
                size: "L",
                quantity: 1,
                price: 350000
            }
        ]
    }
];

// 3. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

// 4. Lấy element thông tin đơn hàng
const detailOrderCode = document.getElementById("detailOrderCode");
const detailOrderDate = document.getElementById("detailOrderDate");
const detailOrderStatusBadge = document.getElementById("detailOrderStatusBadge");

// 5. Lấy element thông tin khách hàng
const detailCustomerName = document.getElementById("detailCustomerName");
const detailCustomerPhone = document.getElementById("detailCustomerPhone");
const detailCustomerAddress = document.getElementById("detailCustomerAddress");
const detailOrderNote = document.getElementById("detailOrderNote");

// 6. Lấy element cập nhật trạng thái
const orderStatusForm = document.getElementById("orderStatusForm");
const detailOrderStatusSelect = document.getElementById("detailOrderStatusSelect");
const orderStatusMessage = document.getElementById("orderStatusMessage");
const saveOrderStatusHeaderBtn = document.getElementById("saveOrderStatusHeaderBtn");

// 7. Lấy element bảng sản phẩm trong đơn
const orderItemTableBody = document.getElementById("orderItemTableBody");
const orderItemRowTemplate = document.getElementById("orderItemRowTemplate");

// 8. Lấy element tổng thanh toán
const detailSubtotal = document.getElementById("detailSubtotal");
const detailShippingFee = document.getElementById("detailShippingFee");
const detailDiscount = document.getElementById("detailDiscount");
const detailTotal = document.getElementById("detailTotal");

// 9. Lấy element popup chi tiết giảm giá
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

// 10. Lấy element trạng thái trang
const orderDetailMainCard = document.getElementById("orderDetailMainCard");
const orderDetailItemsCard = document.getElementById("orderDetailItemsCard");
const orderDetailSummaryCard = document.getElementById("orderDetailSummaryCard");
const orderNotFoundBox = document.getElementById("orderNotFoundBox");

// 11. Biến lưu đơn hàng hiện tại
let currentOrderId = null;
let currentOrderData = null;

// 12. Format tiền Việt Nam
function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}

// 13. Format ngày Việt Nam
function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN");
}

// 14. Render ngày hiện tại
function renderCurrentDate() {
    if (!adminCurrentDate) return;

    const today = new Date();

    adminCurrentDate.textContent = today.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

// 15. Lấy id đơn hàng từ URL
function getOrderIdFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return params.get("id");
}

// 16. Kiểm tra đăng nhập admin
function checkAdminLogin() {
    const isLogin = localStorage.getItem(ADMIN_IS_LOGIN_KEY) === "true";
    const currentAdmin = localStorage.getItem(ADMIN_CURRENT_USER_KEY);

    if (!isLogin || !currentAdmin) {
        window.location.href = "../html/admin-login.html";
        return null;
    }

    try {
        return JSON.parse(currentAdmin);
    } catch (error) {
        localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
        localStorage.removeItem(ADMIN_IS_LOGIN_KEY);

        window.location.href = "../html/admin-login.html";
        return null;
    }
}

// 17. Hiển thị thông tin admin
function renderAdminInfo(adminUser) {
    if (!adminUser) return;

    const fullName = adminUser.fullName || "Quản trị viên";
    const roleText = adminUser.role === "owner" ? "Chủ cửa hàng" : "Nhân viên";

    if (adminName) {
        adminName.textContent = fullName;
    }

    if (adminRole) {
        adminRole.textContent = roleText;
    }

    if (adminAvatar) {
        adminAvatar.textContent = fullName.charAt(0).toUpperCase();
    }

    const ownerOnlyLinks = document.querySelectorAll("[data-owner-only='true']");

    ownerOnlyLinks.forEach(function(link) {
        if (adminUser.role !== "owner") {
            link.style.display = "none";
        }
    });
}

// 18. Đăng xuất admin
function handleAdminLogout() {
    localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
    localStorage.removeItem(ADMIN_IS_LOGIN_KEY);

    window.location.href = "../html/admin-login.html";
}

// 19. Tính tổng tiền hàng
function calculateSubtotal(items) {
    return (items || []).reduce(function(total, item) {
        return total + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
}

// 20. Tính tổng giảm giá
function calculateTotalDiscount(order) {
    const voucherDiscount = Number(order.voucherDiscount || 0);
    const pointDiscount = Number(order.pointDiscount || 0);
    const totalDetailDiscount = voucherDiscount + pointDiscount;

    if (totalDetailDiscount > 0) {
        return totalDetailDiscount;
    }

    return Number(order.discount || 0);
}

// 21. Tính tổng thanh toán
function calculateOrderTotal(order) {
    const subtotal = calculateSubtotal(order.items || []);
    const shippingFee = Number(order.shippingFee || 0);
    const discount = calculateTotalDiscount(order);

    return subtotal + shippingFee - discount;
}

// 22. Lấy text loại voucher
function getVoucherTypeText(type) {
    if (type === "fixed") {
        return "Giảm tiền trực tiếp";
    }

    if (type === "percent") {
        return "Giảm theo phần trăm";
    }

    if (type === "free-shipping") {
        return "Miễn phí vận chuyển";
    }

    return "Không áp dụng";
}

// 23. Format giá trị voucher
function formatVoucherValue(voucher) {
    if (!voucher) return "0đ";

    if (voucher.type === "percent") {
        return Number(voucher.value || 0) + "%";
    }

    return formatPrice(voucher.value || 0);
}

// 24. Format số tiền giảm
function formatDiscountPrice(price) {
    const discount = Number(price || 0);

    if (discount <= 0) {
        return "0đ";
    }

    return "-" + formatPrice(discount);
}

// 25. Chuẩn hóa dữ liệu đơn hàng
function normalizeOrder(order, index) {
    const defaultOrder = demoAdminOrders[index] || demoAdminOrders[0];

    const items = Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : defaultOrder.items;

    const voucherDiscount = Number(
        order.voucherDiscount !== undefined
            ? order.voucherDiscount
            : defaultOrder.voucherDiscount || 0
    );

    const pointDiscount = Number(
        order.pointDiscount !== undefined
            ? order.pointDiscount
            : defaultOrder.pointDiscount || 0
    );

    const fallbackDiscount = Number(
        order.discount !== undefined
            ? order.discount
            : defaultOrder.discount || 0
    );

    const totalDiscount = voucherDiscount + pointDiscount > 0
        ? voucherDiscount + pointDiscount
        : fallbackDiscount;

    return {
        id: order.id || "DH" + String(index + 1).padStart(3, "0"),
        customerName: order.customerName || defaultOrder.customerName || "Khách hàng",
        phone: order.phone || defaultOrder.phone || "Chưa cập nhật",
        address: order.address || defaultOrder.address || "Chưa cập nhật",
        orderDate: order.orderDate || defaultOrder.orderDate || new Date().toISOString().slice(0, 10),
        status: order.status || "pending",
        note: order.note || "",
        shippingFee: Number(order.shippingFee || defaultOrder.shippingFee || 0),
        discount: totalDiscount,
        voucherDiscount: voucherDiscount > 0 ? voucherDiscount : totalDiscount,
        pointDiscount: pointDiscount,
        appliedVoucher: order.appliedVoucher !== undefined
            ? order.appliedVoucher
            : defaultOrder.appliedVoucher || null,
        usedPoints: Number(order.usedPoints || defaultOrder.usedPoints || 0),
        pointRate: Number(order.pointRate || defaultOrder.pointRate || 100),
        items: items
    };
}

// 26. Lấy danh sách đơn hàng
function getOrders() {
    const savedOrders = localStorage.getItem(ADMIN_ORDERS_KEY);

    if (!savedOrders) {
        localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(demoAdminOrders));
        return demoAdminOrders;
    }

    try {
        const orders = JSON.parse(savedOrders);

        const normalizedOrders = orders.map(function(order, index) {
            return normalizeOrder(order, index);
        });

        localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(normalizedOrders));

        return normalizedOrders;
    } catch (error) {
        localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(demoAdminOrders));
        return demoAdminOrders;
    }
}

// 27. Lưu danh sách đơn hàng
function saveOrders(orders) {
    localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders));
}

// 28. Tìm đơn hàng theo id
function getOrderById(orderId) {
    const orders = getOrders();

    return orders.find(function(order) {
        return order.id === orderId;
    });
}

// 29. Lấy thông tin trạng thái đơn hàng
function getOrderStatusInfo(status) {
    switch (status) {
        case "pending":
            return {
                text: "Chờ xác nhận",
                className: "statusPending"
            };

        case "shipping":
            return {
                text: "Đang giao",
                className: "statusShipping"
            };

        case "completed":
            return {
                text: "Hoàn thành",
                className: "statusCompleted"
            };

        case "cancelled":
            return {
                text: "Đã hủy",
                className: "statusCancelled"
            };

        default:
            return {
                text: "Chờ xác nhận",
                className: "statusPending"
            };
    }
}

// 30. Xóa class trạng thái cũ
function clearStatusClass(element) {
    if (!element) return;

    element.classList.remove(
        "statusPending",
        "statusShipping",
        "statusCompleted",
        "statusCancelled",
        "statusActive",
        "statusHidden"
    );
}

// 31. Hiển thị thông báo trạng thái
function showOrderStatusMessage(message, type = "error") {
    if (!orderStatusMessage) return;

    orderStatusMessage.textContent = message;

    if (type === "success") {
        orderStatusMessage.classList.add("success");
    } else {
        orderStatusMessage.classList.remove("success");
    }
}

// 32. Xóa thông báo trạng thái
function clearOrderStatusMessage() {
    if (!orderStatusMessage) return;

    orderStatusMessage.textContent = "";
    orderStatusMessage.classList.remove("success");
}

// 33. Render badge trạng thái
function renderOrderStatusBadge(status) {
    if (!detailOrderStatusBadge) return;

    const statusInfo = getOrderStatusInfo(status);

    clearStatusClass(detailOrderStatusBadge);

    detailOrderStatusBadge.textContent = statusInfo.text;
    detailOrderStatusBadge.classList.add(statusInfo.className);
}

// 34. Hiển thị khu vực không tìm thấy
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

// 35. Render thông tin khách hàng
function renderCustomerInfo(order) {
    if (detailCustomerName) {
        detailCustomerName.textContent = order.customerName;
    }

    if (detailCustomerPhone) {
        detailCustomerPhone.textContent = order.phone;
    }

    if (detailCustomerAddress) {
        detailCustomerAddress.textContent = order.address;
    }

    if (detailOrderNote) {
        detailOrderNote.textContent = order.note || "Không có ghi chú";
    }
}

// 36. Render danh sách sản phẩm trong đơn
function renderOrderItems(items) {
    if (!orderItemTableBody || !orderItemRowTemplate) return;

    orderItemTableBody.innerHTML = "";

    (items || []).forEach(function(item) {
        const rowFragment = orderItemRowTemplate.content.cloneNode(true);

        const itemName = item.name || "Sản phẩm";
        const itemColor = item.color || "Không có màu";
        const itemSize = item.size || "Không có size";
        const itemQuantity = Number(item.quantity || 0);
        const itemPrice = Number(item.price || 0);
        const itemTotal = itemQuantity * itemPrice;

        rowFragment.querySelector(".itemNameText").textContent = itemName;
        rowFragment.querySelector(".itemVariantText").textContent = itemColor + " / " + itemSize;
        rowFragment.querySelector(".itemQuantityText").textContent = itemQuantity;
        rowFragment.querySelector(".itemPriceText").textContent = formatPrice(itemPrice);
        rowFragment.querySelector(".itemTotalText").textContent = formatPrice(itemTotal);

        orderItemTableBody.appendChild(rowFragment);
    });
}

// 37. Render tổng thanh toán
function renderOrderSummary(order) {
    const subtotal = calculateSubtotal(order.items || []);
    const shippingFee = Number(order.shippingFee || 0);
    const discount = calculateTotalDiscount(order);
    const total = calculateOrderTotal(order);

    if (detailSubtotal) {
        detailSubtotal.textContent = formatPrice(subtotal);
    }

    if (detailShippingFee) {
        detailShippingFee.textContent = formatPrice(shippingFee);
    }

    if (detailDiscount) {
        detailDiscount.textContent = formatDiscountPrice(discount);
    }

    if (detailTotal) {
        detailTotal.textContent = formatPrice(total);
    }
}

// 38. Render popup chi tiết giảm giá
function renderDiscountDetail(order) {
    if (!order) return;

    const voucher = order.appliedVoucher;
    const voucherDiscount = Number(order.voucherDiscount || 0);
    const pointDiscount = Number(order.pointDiscount || 0);
    const usedPoints = Number(order.usedPoints || 0);
    const pointRate = Number(order.pointRate || 0);
    const totalDiscount = calculateTotalDiscount(order);

    if (discountVoucherCode) {
        discountVoucherCode.textContent = voucher ? voucher.code : "Không áp dụng";
    }

    if (discountVoucherName) {
        discountVoucherName.textContent = voucher ? voucher.name : "Không áp dụng";
    }

    if (discountVoucherType) {
        discountVoucherType.textContent = voucher ? getVoucherTypeText(voucher.type) : "Không áp dụng";
    }

    if (discountVoucherValue) {
        discountVoucherValue.textContent = voucher ? formatVoucherValue(voucher) : "0đ";
    }

    if (discountVoucherAmount) {
        discountVoucherAmount.textContent = formatDiscountPrice(voucherDiscount);
    }

    if (discountUsedPoints) {
        discountUsedPoints.textContent = usedPoints > 0 ? usedPoints + " điểm" : "Không sử dụng";
    }

    if (discountPointRate) {
        discountPointRate.textContent = usedPoints > 0 ? formatPrice(pointRate) + " / điểm" : "Không áp dụng";
    }

    if (discountPointAmount) {
        discountPointAmount.textContent = formatDiscountPrice(pointDiscount);
    }

    if (discountTotalAmount) {
        discountTotalAmount.textContent = formatDiscountPrice(totalDiscount);
    }
}

// 39. Mở popup chi tiết giảm giá
function openDiscountDetailModal() {
    if (!currentOrderData || !discountDetailModalOverlay) return;

    renderDiscountDetail(currentOrderData);
    discountDetailModalOverlay.classList.add("show");
}

// 40. Đóng popup chi tiết giảm giá
function closeDiscountDetailModal() {
    if (!discountDetailModalOverlay) return;

    discountDetailModalOverlay.classList.remove("show");
}

// 41. Render chi tiết đơn hàng
function renderOrderDetail(order) {
    if (!order) {
        showOrderNotFound();
        return;
    }

    const normalizedOrder = normalizeOrder(order, 0);

    currentOrderId = normalizedOrder.id;
    currentOrderData = normalizedOrder;

    document.title = "Chi tiết " + normalizedOrder.id;

    if (detailOrderCode) {
        detailOrderCode.textContent = normalizedOrder.id;
    }

    if (detailOrderDate) {
        detailOrderDate.textContent = formatDate(normalizedOrder.orderDate);
    }

    if (detailOrderStatusSelect) {
        detailOrderStatusSelect.value = normalizedOrder.status;
    }

    renderOrderStatusBadge(normalizedOrder.status);
    renderCustomerInfo(normalizedOrder);
    renderOrderItems(normalizedOrder.items || []);
    renderOrderSummary(normalizedOrder);
    renderDiscountDetail(normalizedOrder);
}

// 42. Lưu trạng thái đơn hàng
function saveOrderStatus(event) {
    if (event) {
        event.preventDefault();
    }

    if (!currentOrderId) return;

    clearOrderStatusMessage();

    const newStatus = detailOrderStatusSelect.value;
    const orders = getOrders();

    const updatedOrders = orders.map(function(order) {
        if (order.id === currentOrderId) {
            return {
                ...order,
                status: newStatus
            };
        }

        return order;
    });

    saveOrders(updatedOrders);

    const updatedOrder = updatedOrders.find(function(order) {
        return order.id === currentOrderId;
    });

    renderOrderDetail(updatedOrder);
    showOrderStatusMessage("Cập nhật trạng thái đơn hàng thành công.", "success");
}

// 43. Gắn sự kiện popup giảm giá
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
        discountDetailModalOverlay.addEventListener("click", function(event) {
            if (event.target === discountDetailModalOverlay) {
                closeDiscountDetailModal();
            }
        });
    }
}

// 44. Gắn sự kiện trang chi tiết đơn hàng
function bindOrderDetailEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (orderStatusForm) {
        orderStatusForm.addEventListener("submit", saveOrderStatus);
    }

    if (saveOrderStatusHeaderBtn) {
        saveOrderStatusHeaderBtn.addEventListener("click", function() {
            if (orderStatusForm) {
                orderStatusForm.requestSubmit();
            }
        });
    }

    if (detailOrderStatusSelect) {
        detailOrderStatusSelect.addEventListener("change", function() {
            renderOrderStatusBadge(detailOrderStatusSelect.value);
            clearOrderStatusMessage();
        });
    }

    bindDiscountDetailEvents();
}

// 45. Khởi tạo trang chi tiết đơn hàng
function initAdminOrderDetailPage() {
    const adminUser = checkAdminLogin();

    if (!adminUser) return;

    const orderId = getOrderIdFromUrl();
    const order = getOrderById(orderId);

    renderAdminInfo(adminUser);
    renderCurrentDate();
    renderOrderDetail(order);
    bindOrderDetailEvents();
}

initAdminOrderDetailPage();