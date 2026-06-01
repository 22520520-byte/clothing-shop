// =========================================================
// File: Frontend1/js/admin-orders.js
// Mục đích: Gắn trang quản lý đơn hàng admin với API backend thật
// =========================================================


// 1. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");


// 2. Lấy element thống kê đơn hàng
const totalOrderCount = document.getElementById("totalOrderCount");
const pendingOrderCount = document.getElementById("pendingOrderCount");
const shippingOrderCount = document.getElementById("shippingOrderCount");
const completedOrderCount = document.getElementById("completedOrderCount");


// 3. Lấy element bộ lọc và bảng
const orderSearchInput = document.getElementById("orderSearchInput");
const orderStatusFilter = document.getElementById("orderStatusFilter");
const orderSortFilter = document.getElementById("orderSortFilter");
const orderTableBody = document.getElementById("orderTableBody");
const emptyOrderText = document.getElementById("emptyOrderText");
const orderRowTemplate = document.getElementById("orderRowTemplate");


// 4. Biến lưu dữ liệu đơn hàng
let currentAdminUser = null;
let adminOrders = [];
let orderSummary = null;


// 5. Format tiền Việt Nam
function formatPrice(price) {
    if (window.AdminApi && window.AdminApi.formatPrice) {
        return window.AdminApi.formatPrice(price);
    }

    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}


// 6. Format ngày Việt Nam
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


// 7. Render ngày hiện tại
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


// 8. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) {
        return "A";
    }

    return text.trim().charAt(0).toUpperCase();
}


// 9. Lấy nhãn vai trò admin
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


// 10. Hiển thị thông tin admin
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


// 11. Lấy tên khách hàng từ đơn hàng API
function getOrderCustomerName(order) {
    if (order.customer && order.customer.name) {
        return order.customer.name;
    }

    if (order.receiver && order.receiver.name) {
        return order.receiver.name;
    }

    if (order.receiver_name) {
        return order.receiver_name;
    }

    return "Khách hàng";
}


// 12. Lấy số điện thoại từ đơn hàng API
function getOrderCustomerPhone(order) {
    if (order.receiver && order.receiver.phone) {
        return order.receiver.phone;
    }

    if (order.customer && order.customer.phone) {
        return order.customer.phone;
    }

    if (order.receiver_phone) {
        return order.receiver_phone;
    }

    return "Chưa cập nhật";
}


// 13. Lấy tổng tiền từ đơn hàng API
function getOrderFinalTotal(order) {
    if (order.money && order.money.final_total !== undefined) {
        return Number(order.money.final_total || 0);
    }

    if (order.final_total !== undefined) {
        return Number(order.final_total || 0);
    }

    return 0;
}


// 14. Lấy số sản phẩm trong đơn hàng
function getOrderItemCount(order) {
    if (order.summary && order.summary.total_items !== undefined) {
        return Number(order.summary.total_items || 0);
    }

    if (Array.isArray(order.items)) {
        return order.items.length;
    }

    return 0;
}


// 15. Lấy trạng thái đơn hàng
function getOrderStatusCode(order) {
    if (order.status && order.status.code) {
        return order.status.code;
    }

    if (order.order_status) {
        return order.order_status;
    }

    return "pending";
}


// 16. Lấy nhãn trạng thái đơn hàng
function getOrderStatusLabel(order) {
    if (order.status && order.status.label) {
        return order.status.label;
    }

    const status = getOrderStatusCode(order);

    const labels = {
        pending: "Chờ xác nhận",
        confirmed: "Đã xác nhận",
        shipping: "Đang giao",
        completed: "Hoàn thành",
        cancelled: "Đã hủy"
    };

    return labels[status] || "Không xác định";
}


// 17. Lấy class trạng thái đơn hàng
function getOrderStatusClass(status) {
    if (status === "pending") {
        return "statusPending";
    }

    if (status === "confirmed") {
        return "statusShipping";
    }

    if (status === "shipping") {
        return "statusShipping";
    }

    if (status === "completed") {
        return "statusCompleted";
    }

    if (status === "cancelled") {
        return "statusCancelled";
    }

    return "statusPending";
}


// 18. Chuẩn hóa đơn hàng từ API
function normalizeOrder(order) {
    const statusCode = getOrderStatusCode(order);

    return {
        id: order.id,
        orderCode: order.order_code || order.code || "DH" + String(order.id).padStart(6, "0"),
        customerName: getOrderCustomerName(order),
        phone: getOrderCustomerPhone(order),
        orderDate: order.created_at || order.order_date || "",
        itemCount: getOrderItemCount(order),
        finalTotal: getOrderFinalTotal(order),
        status: statusCode,
        statusLabel: getOrderStatusLabel(order),
        raw: order
    };
}


// 19. Render thống kê đơn hàng
function renderOrderStats() {
    const totalOrders = orderSummary && orderSummary.total_orders !== undefined
        ? Number(orderSummary.total_orders || 0)
        : adminOrders.length;

    const pendingOrders = orderSummary && orderSummary.pending_orders !== undefined
        ? Number(orderSummary.pending_orders || 0)
        : adminOrders.filter(function (order) {
            return order.status === "pending";
        }).length;

    const shippingOrders = orderSummary && orderSummary.shipping_orders !== undefined
        ? Number(orderSummary.shipping_orders || 0)
        : adminOrders.filter(function (order) {
            return order.status === "shipping";
        }).length;

    const completedOrders = orderSummary && orderSummary.completed_orders !== undefined
        ? Number(orderSummary.completed_orders || 0)
        : adminOrders.filter(function (order) {
            return order.status === "completed";
        }).length;

    if (totalOrderCount) {
        totalOrderCount.textContent = totalOrders;
    }

    if (pendingOrderCount) {
        pendingOrderCount.textContent = pendingOrders;
    }

    if (shippingOrderCount) {
        shippingOrderCount.textContent = shippingOrders;
    }

    if (completedOrderCount) {
        completedOrderCount.textContent = completedOrders;
    }
}


// 20. Lọc đơn hàng trên frontend
function getFilteredOrders() {
    const searchValue = orderSearchInput
        ? orderSearchInput.value.trim().toLowerCase()
        : "";

    const statusValue = orderStatusFilter
        ? orderStatusFilter.value
        : "all";

    const sortValue = orderSortFilter
        ? orderSortFilter.value
        : "newest";

    const filteredOrders = adminOrders.filter(function (order) {
        const orderCode = String(order.orderCode || "").toLowerCase();
        const customerName = String(order.customerName || "").toLowerCase();
        const phone = String(order.phone || "").toLowerCase();

        const matchSearch =
            orderCode.includes(searchValue) ||
            customerName.includes(searchValue) ||
            phone.includes(searchValue);

        const matchStatus =
            statusValue === "all" ||
            order.status === statusValue;

        return matchSearch && matchStatus;
    });

    filteredOrders.sort(function (a, b) {
        if (sortValue === "oldest") {
            return new Date(a.orderDate) - new Date(b.orderDate);
        }

        if (sortValue === "highest") {
            return b.finalTotal - a.finalTotal;
        }

        if (sortValue === "lowest") {
            return a.finalTotal - b.finalTotal;
        }

        return new Date(b.orderDate) - new Date(a.orderDate);
    });

    return filteredOrders;
}


// 21. Tạo link trang chi tiết đơn hàng
function getAdminOrderDetailUrl(orderId) {
    return "../html/admin-order-detail.html?id=" + encodeURIComponent(orderId);
}


// 22. Render một dòng đơn hàng
function renderOrderRow(order) {
    const rowFragment = orderRowTemplate.content.cloneNode(true);
    const row = rowFragment.querySelector("tr");

    const orderCodeText = rowFragment.querySelector(".orderCodeText");
    const orderCustomerNameText = rowFragment.querySelector(".orderCustomerNameText");
    const orderCustomerPhoneText = rowFragment.querySelector(".orderCustomerPhoneText");
    const orderDateText = rowFragment.querySelector(".orderDateText");
    const orderItemCountText = rowFragment.querySelector(".orderItemCountText");
    const orderTotalText = rowFragment.querySelector(".orderTotalText");
    const orderStatusText = rowFragment.querySelector(".orderStatusText");
    const actionButton = rowFragment.querySelector("[data-action]");

    if (row) {
        row.dataset.orderId = order.id;
        row.dataset.orderCode = order.orderCode;
        row.classList.add("clickableOrderRow");
        row.title = "Nhấn để xem chi tiết đơn hàng";
    }

    if (orderCodeText) {
        orderCodeText.textContent = order.orderCode;
    }

    if (orderCustomerNameText) {
        orderCustomerNameText.textContent = order.customerName;
    }

    if (orderCustomerPhoneText) {
        orderCustomerPhoneText.textContent = order.phone;
    }

    if (orderDateText) {
        orderDateText.textContent = formatDate(order.orderDate);
    }

    if (orderItemCountText) {
        orderItemCountText.textContent = order.itemCount + " sản phẩm";
    }

    if (orderTotalText) {
        orderTotalText.textContent = formatPrice(order.finalTotal);
    }

    if (orderStatusText) {
        orderStatusText.textContent = order.statusLabel;
        orderStatusText.className = "statusBadge orderStatusText";
        orderStatusText.classList.add(getOrderStatusClass(order.status));
    }

    if (actionButton) {
        actionButton.textContent = "Chi tiết";
        actionButton.dataset.action = "view";
        actionButton.title = "Xem chi tiết đơn hàng";
    }

    return rowFragment;
}


// 23. Render bảng đơn hàng
function renderOrderTable() {
    if (!orderTableBody || !orderRowTemplate) {
        return;
    }

    const filteredOrders = getFilteredOrders();

    orderTableBody.innerHTML = "";

    if (emptyOrderText) {
        emptyOrderText.classList.toggle("show", filteredOrders.length === 0);
    }

    filteredOrders.forEach(function (order) {
        const row = renderOrderRow(order);
        orderTableBody.appendChild(row);
    });

    renderOrderStats();
}


// 24. Hiển thị loading
function setOrderLoading(isLoading) {
    if (!orderTableBody) {
        return;
    }

    if (isLoading) {
        orderTableBody.innerHTML = `
            <tr>
                <td colspan="7">Đang tải danh sách đơn hàng...</td>
            </tr>
        `;
    }
}


// 25. Hiển thị lỗi
function renderOrderError(error) {
    console.error(error);

    if (orderTableBody) {
        orderTableBody.innerHTML = "";
    }

    if (emptyOrderText) {
        emptyOrderText.classList.add("show");
        emptyOrderText.textContent = "Không tải được danh sách đơn hàng.";
    }

    adminOrders = [];
    orderSummary = null;
    renderOrderStats();
}


// 26. Load danh sách đơn hàng từ API
async function loadOrdersFromApi() {
    setOrderLoading(true);

    const response = await window.AdminApi.get(
        "admin/orders/get-orders.php?page=1&limit=100&sort=latest"
    );

    const data = response.data || {};
    const orders = Array.isArray(data.orders) ? data.orders : [];

    orderSummary = data.summary || null;

    adminOrders = orders.map(function (order) {
        return normalizeOrder(order);
    });

    renderOrderTable();
}


// 27. Chuyển sang trang chi tiết đơn hàng
function goToOrderDetail(orderId) {
    if (!orderId) {
        return;
    }

    window.location.href = getAdminOrderDetailUrl(orderId);
}


// 28. Xử lý thao tác bảng đơn hàng
function handleOrderTableAction(event) {
    const actionButton = event.target.closest("[data-action]");
    const row = event.target.closest("tr");

    if (!row) {
        return;
    }

    const orderId = row.dataset.orderId;

    if (actionButton) {
        event.stopPropagation();

        const action = actionButton.dataset.action;

        if (action === "view") {
            goToOrderDetail(orderId);
        }

        return;
    }

    goToOrderDetail(orderId);
}


// 29. Xử lý đăng xuất
function handleAdminLogout() {
    if (window.AdminApi && window.AdminApi.logoutAdmin) {
        window.AdminApi.logoutAdmin();
        return;
    }

    localStorage.removeItem("admin_current_user");
    localStorage.removeItem("admin_is_login");
    window.location.href = "../html/admin-login.html";
}


// 30. Gắn sự kiện trang đơn hàng
function bindOrderEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (orderTableBody) {
        orderTableBody.addEventListener("click", handleOrderTableAction);
    }

    if (orderSearchInput) {
        orderSearchInput.addEventListener("input", renderOrderTable);
    }

    if (orderStatusFilter) {
        orderStatusFilter.addEventListener("change", renderOrderTable);
    }

    if (orderSortFilter) {
        orderSortFilter.addEventListener("change", renderOrderTable);
    }
}


// 31. Kiểm tra đăng nhập local
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


// 32. Khởi tạo trang quản lý đơn hàng
async function initAdminOrdersPage() {
    currentAdminUser = checkAdminLoginLocal();

    if (!currentAdminUser) {
        return;
    }

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    bindOrderEvents();

    try {
        await loadOrdersFromApi();
    } catch (error) {
        if (error && error.status === 401) {
            window.AdminApi.clearAdminLocalAuth();
            window.location.href = "../html/admin-login.html";
            return;
        }

        renderOrderError(error);
    }
}

initAdminOrdersPage();