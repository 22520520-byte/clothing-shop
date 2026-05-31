// 1. Khai báo key localStorage
const ADMIN_CURRENT_USER_KEY = "admin_current_user";
const ADMIN_IS_LOGIN_KEY = "admin_is_login";
const ADMIN_ORDERS_KEY = "admin_orders";
const ADMIN_PRODUCTS_KEY = "admin_products";

// 2. Dữ liệu đơn hàng mẫu cho dashboard
const demoAdminOrders = [
    {
        id: "DH001",
        customerName: "Nguyễn Minh Anh",
        orderDate: "2026-05-18",
        total: 780000,
        status: "pending"
    },
    {
        id: "DH002",
        customerName: "Trần Hoàng Nam",
        orderDate: "2026-05-18",
        total: 520000,
        status: "shipping"
    },
    {
        id: "DH003",
        customerName: "Lê Phương Thảo",
        orderDate: "2026-05-17",
        total: 1250000,
        status: "completed"
    },
    {
        id: "DH004",
        customerName: "Phạm Quốc Huy",
        orderDate: "2026-05-17",
        total: 430000,
        status: "cancelled"
    }
];

// 3. Dữ liệu sản phẩm mẫu cho dashboard
const demoAdminProducts = [
    {
        id: "SP001",
        name: "Áo thun basic nam",
        category: "Áo thun",
        price: 199000,
        stock: 8
    },
    {
        id: "SP002",
        name: "Áo hoodie form rộng",
        category: "Áo hoodie",
        price: 399000,
        stock: 3
    },
    {
        id: "SP003",
        name: "Quần jean xanh đậm",
        category: "Quần dài",
        price: 459000,
        stock: 12
    },
    {
        id: "SP004",
        name: "Chân váy ngắn basic",
        category: "Váy ngắn",
        price: 299000,
        stock: 4
    },
    {
        id: "SP005",
        name: "Áo khoác kaki nữ",
        category: "Áo khoác",
        price: 520000,
        stock: 15
    }
];

// 4. Lấy element từ DOM
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

const todayRevenue = document.getElementById("todayRevenue");
const newOrderCount = document.getElementById("newOrderCount");
const productCount = document.getElementById("productCount");
const lowStockCount = document.getElementById("lowStockCount");

const recentOrderList = document.getElementById("recentOrderList");
const lowStockProductList = document.getElementById("lowStockProductList");

const emptyRecentOrder = document.getElementById("emptyRecentOrder");
const emptyLowStock = document.getElementById("emptyLowStock");

const dashboardOrderRowTemplate = document.getElementById("dashboardOrderRowTemplate");
const lowStockRowTemplate = document.getElementById("lowStockRowTemplate");

// 5. Format tiền Việt Nam
function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}

// 6. Format ngày Việt Nam
function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN");
}

// 7. Lấy ngày hiện tại
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

// 8. Lấy trạng thái đơn hàng
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
                text: "Không xác định",
                className: "statusPending"
            };
    }
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

// 11. Lấy danh sách đơn hàng
function getAdminOrders() {
    const savedOrders = localStorage.getItem(ADMIN_ORDERS_KEY);

    if (!savedOrders) {
        localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(demoAdminOrders));
        return demoAdminOrders;
    }

    try {
        return JSON.parse(savedOrders);
    } catch (error) {
        return demoAdminOrders;
    }
}

// 12. Lấy danh sách sản phẩm
function getAdminProducts() {
    const savedProducts = localStorage.getItem(ADMIN_PRODUCTS_KEY);

    if (!savedProducts) {
        localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(demoAdminProducts));
        return demoAdminProducts;
    }

    try {
        return JSON.parse(savedProducts);
    } catch (error) {
        return demoAdminProducts;
    }
}

// 13. Tính doanh thu hôm nay
function calculateTodayRevenue(orders) {
    const today = new Date().toISOString().slice(0, 10);

    return orders
        .filter(function(order) {
            return order.orderDate === today && order.status === "completed";
        })
        .reduce(function(total, order) {
            return total + Number(order.total || 0);
        }, 0);
}

// 14. Render thống kê tổng quan
function renderDashboardStats(orders, products) {
    const revenue = calculateTodayRevenue(orders);

    const pendingOrders = orders.filter(function(order) {
        return order.status === "pending";
    });

    const lowStockProducts = products.filter(function(product) {
        return Number(product.stock || 0) <= 5;
    });

    if (todayRevenue) {
        todayRevenue.textContent = formatPrice(revenue);
    }

    if (newOrderCount) {
        newOrderCount.textContent = pendingOrders.length;
    }

    if (productCount) {
        productCount.textContent = products.length;
    }

    if (lowStockCount) {
        lowStockCount.textContent = lowStockProducts.length;
    }
}

// 15. Render đơn hàng gần đây
function renderRecentOrders(orders) {
    if (!recentOrderList || !dashboardOrderRowTemplate) return;

    recentOrderList.innerHTML = "";

    const recentOrders = orders.slice(0, 5);

    if (emptyRecentOrder) {
        emptyRecentOrder.classList.toggle("show", recentOrders.length === 0);
    }

    recentOrders.forEach(function(order) {
        const row = dashboardOrderRowTemplate.content.cloneNode(true);

        const statusInfo = getOrderStatusInfo(order.status);

        row.querySelector(".orderCode").textContent = order.id;
        row.querySelector(".customerName").textContent = order.customerName;
        row.querySelector(".orderDate").textContent = formatDate(order.orderDate);
        row.querySelector(".orderTotal").textContent = formatPrice(order.total);

        const statusBadge = row.querySelector(".orderStatus");
        statusBadge.textContent = statusInfo.text;
        statusBadge.classList.add(statusInfo.className);

        recentOrderList.appendChild(row);
    });
}

// 16. Render sản phẩm sắp hết hàng
function renderLowStockProducts(products) {
    if (!lowStockProductList || !lowStockRowTemplate) return;

    lowStockProductList.innerHTML = "";

    const lowStockProducts = products
        .filter(function(product) {
            return Number(product.stock || 0) <= 5;
        })
        .slice(0, 5);

    if (emptyLowStock) {
        emptyLowStock.classList.toggle("show", lowStockProducts.length === 0);
    }

    lowStockProducts.forEach(function(product) {
        const row = lowStockRowTemplate.content.cloneNode(true);

        row.querySelector(".productName").textContent = product.name;
        row.querySelector(".productCategory").textContent = product.category;
        row.querySelector(".productStock").textContent = product.stock + " sản phẩm";

        lowStockProductList.appendChild(row);
    });
}

// 17. Xử lý đăng xuất
function handleAdminLogout() {
    localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
    localStorage.removeItem(ADMIN_IS_LOGIN_KEY);

    window.location.href = "../html/admin-login.html";
}

// 18. Gắn sự kiện dashboard
function bindDashboardEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }
}

// 19. Khởi tạo trang dashboard
function initAdminDashboard() {
    const adminUser = checkAdminLogin();

    if (!adminUser) return;

    const orders = getAdminOrders();
    const products = getAdminProducts();

    renderAdminInfo(adminUser);
    renderCurrentDate();
    renderDashboardStats(orders, products);
    renderRecentOrders(orders);
    renderLowStockProducts(products);
    bindDashboardEvents();
}

initAdminDashboard();