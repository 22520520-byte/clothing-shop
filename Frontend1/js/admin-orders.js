// 1. Khai báo key localStorage
const ADMIN_CURRENT_USER_KEY = "admin_current_user";
const ADMIN_IS_LOGIN_KEY = "admin_is_login";
const ADMIN_ORDERS_KEY = "admin_orders";

// 2. Dữ liệu đơn hàng mẫu
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
        discount: 0,
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

// 4. Lấy element thống kê
const totalOrderCount = document.getElementById("totalOrderCount");
const pendingOrderCount = document.getElementById("pendingOrderCount");
const shippingOrderCount = document.getElementById("shippingOrderCount");
const completedOrderCount = document.getElementById("completedOrderCount");

// 5. Lấy element bộ lọc và bảng
const orderSearchInput = document.getElementById("orderSearchInput");
const orderStatusFilter = document.getElementById("orderStatusFilter");
const orderSortFilter = document.getElementById("orderSortFilter");
const orderTableBody = document.getElementById("orderTableBody");
const emptyOrderText = document.getElementById("emptyOrderText");
const orderRowTemplate = document.getElementById("orderRowTemplate");

// 6. Format tiền Việt Nam
function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}

// 7. Format ngày Việt Nam
function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN");
}

// 8. Render ngày hiện tại
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

// 9. Kiểm tra đăng nhập admin
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

// 10. Hiển thị thông tin admin
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

// 11. Đăng xuất admin
function handleAdminLogout() {
    localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
    localStorage.removeItem(ADMIN_IS_LOGIN_KEY);

    window.location.href = "../html/admin-login.html";
}

// 12. Tính tổng tiền hàng
function calculateSubtotal(items) {
    return (items || []).reduce(function(total, item) {
        return total + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
}

// 13. Tính tổng thanh toán
function calculateOrderTotal(order) {
    const subtotal = calculateSubtotal(order.items || []);
    const shippingFee = Number(order.shippingFee || 0);
    const discount = Number(order.discount || 0);

    return subtotal + shippingFee - discount;
}

// 14. Tạo link trang chi tiết đơn hàng
function getAdminOrderDetailUrl(orderId) {
    return "../html/admin-order-detail.html?id=" + encodeURIComponent(orderId);
}

// 15. Chuẩn hóa dữ liệu đơn hàng
function normalizeOrder(order, index) {
    const defaultOrder = demoAdminOrders[index] || demoAdminOrders[0];

    const items = Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : defaultOrder.items;

    return {
        id: order.id || "DH" + String(index + 1).padStart(3, "0"),
        customerName: order.customerName || defaultOrder.customerName || "Khách hàng",
        phone: order.phone || defaultOrder.phone || "Chưa cập nhật",
        address: order.address || defaultOrder.address || "Chưa cập nhật",
        orderDate: order.orderDate || defaultOrder.orderDate || new Date().toISOString().slice(0, 10),
        status: order.status || "pending",
        note: order.note || "",
        shippingFee: Number(order.shippingFee || defaultOrder.shippingFee || 0),
        discount: Number(order.discount || defaultOrder.discount || 0),
        items: items
    };
}

// 16. Lấy danh sách đơn hàng
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

// 17. Lưu danh sách đơn hàng
function saveOrders(orders) {
    localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders));
}

// 18. Lấy thông tin trạng thái đơn hàng
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

// 19. Render thống kê đơn hàng
function renderOrderStats(orders) {
    const pendingOrders = orders.filter(function(order) {
        return order.status === "pending";
    });

    const shippingOrders = orders.filter(function(order) {
        return order.status === "shipping";
    });

    const completedOrders = orders.filter(function(order) {
        return order.status === "completed";
    });

    if (totalOrderCount) {
        totalOrderCount.textContent = orders.length;
    }

    if (pendingOrderCount) {
        pendingOrderCount.textContent = pendingOrders.length;
    }

    if (shippingOrderCount) {
        shippingOrderCount.textContent = shippingOrders.length;
    }

    if (completedOrderCount) {
        completedOrderCount.textContent = completedOrders.length;
    }
}

// 20. Lọc đơn hàng
function getFilteredOrders(orders) {
    const searchValue = orderSearchInput ? orderSearchInput.value.trim().toLowerCase() : "";
    const statusValue = orderStatusFilter ? orderStatusFilter.value : "all";
    const sortValue = orderSortFilter ? orderSortFilter.value : "newest";

    const filteredOrders = orders.filter(function(order) {
        const orderId = order.id.toLowerCase();
        const customerName = order.customerName.toLowerCase();
        const phone = order.phone.toLowerCase();

        const matchSearch =
            orderId.includes(searchValue) ||
            customerName.includes(searchValue) ||
            phone.includes(searchValue);

        const matchStatus =
            statusValue === "all" ||
            order.status === statusValue;

        return matchSearch && matchStatus;
    });

    filteredOrders.sort(function(a, b) {
        if (sortValue === "oldest") {
            return new Date(a.orderDate) - new Date(b.orderDate);
        }

        if (sortValue === "highest") {
            return calculateOrderTotal(b) - calculateOrderTotal(a);
        }

        if (sortValue === "lowest") {
            return calculateOrderTotal(a) - calculateOrderTotal(b);
        }

        return new Date(b.orderDate) - new Date(a.orderDate);
    });

    return filteredOrders;
}

// 21. Render bảng đơn hàng
function renderOrderTable() {
    if (!orderTableBody || !orderRowTemplate) return;

    const orders = getOrders();
    const filteredOrders = getFilteredOrders(orders);

    orderTableBody.innerHTML = "";

    if (emptyOrderText) {
        emptyOrderText.classList.toggle("show", filteredOrders.length === 0);
    }

    filteredOrders.forEach(function(order) {
        const rowFragment = orderRowTemplate.content.cloneNode(true);
        const row = rowFragment.querySelector("tr");

        const statusInfo = getOrderStatusInfo(order.status);

        row.dataset.orderId = order.id;

        rowFragment.querySelector(".orderCodeText").textContent = order.id;
        rowFragment.querySelector(".orderCustomerNameText").textContent = order.customerName;
        rowFragment.querySelector(".orderCustomerPhoneText").textContent = order.phone;
        rowFragment.querySelector(".orderDateText").textContent = formatDate(order.orderDate);
        rowFragment.querySelector(".orderItemCountText").textContent = (order.items || []).length + " sản phẩm";
        rowFragment.querySelector(".orderTotalText").textContent = formatPrice(calculateOrderTotal(order));

        const statusBadge = rowFragment.querySelector(".orderStatusText");

        statusBadge.textContent = statusInfo.text;
        statusBadge.classList.add(statusInfo.className);

        orderTableBody.appendChild(rowFragment);
    });

    renderOrderStats(orders);
}

// 22. Xóa đơn hàng
function deleteOrder(orderId) {
    const orders = getOrders();

    const order = orders.find(function(item) {
        return item.id === orderId;
    });

    if (!order) return;

    const isConfirm = confirm("Bạn có chắc muốn xóa đơn hàng " + order.id + "?");

    if (!isConfirm) return;

    const updatedOrders = orders.filter(function(item) {
        return item.id !== orderId;
    });

    saveOrders(updatedOrders);
    renderOrderTable();
}

// 23. Chuyển sang trang chi tiết đơn hàng
function goToOrderDetail(orderId) {
    if (!orderId) return;

    window.location.href = getAdminOrderDetailUrl(orderId);
}

// 24. Xử lý thao tác bảng đơn hàng
function handleOrderTableAction(event) {
    const actionButton = event.target.closest("[data-action]");
    const row = event.target.closest("tr");

    if (!row) return;

    const orderId = row.dataset.orderId;

    if (actionButton) {
        event.stopPropagation();

        const action = actionButton.dataset.action;

        if (action === "delete") {
            deleteOrder(orderId);
        }

        return;
    }

    goToOrderDetail(orderId);
}

// 25. Gắn sự kiện trang đơn hàng
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

// 26. Khởi tạo trang quản lý đơn hàng
function initAdminOrdersPage() {
    const adminUser = checkAdminLogin();

    if (!adminUser) return;

    renderAdminInfo(adminUser);
    renderCurrentDate();
    renderOrderTable();
    bindOrderEvents();
}

initAdminOrdersPage();