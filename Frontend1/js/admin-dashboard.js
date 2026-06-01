// =========================================================
// File: Frontend1/js/admin-dashboard.js
// Mục đích: Gắn dashboard admin với API backend thật
// =========================================================


// 1. Lấy element từ DOM
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


// 2. Hiển thị ngày hiện tại
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


// 3. Format ngày ngắn
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


// 4. Format tiền
function formatPrice(price) {
    if (window.AdminApi && window.AdminApi.formatPrice) {
        return window.AdminApi.formatPrice(price);
    }

    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}


// 5. Lấy ngày hiện tại dạng YYYY-MM-DD
function getTodayDateString() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}


// 6. Lấy thông tin role hiển thị
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


// 7. Hiển thị thông tin admin
function renderAdminInfo(adminUser) {
    if (!adminUser) {
        return;
    }

    const fullName = adminUser.fullName || adminUser.full_name || "Quản trị viên";
    const roleCode = adminUser.role || (adminUser.role && adminUser.role.code) || "";
    const roleName = adminUser.roleName || (adminUser.role && adminUser.role.name) || "";

    if (adminName) {
        adminName.textContent = fullName;
    }

    if (adminRole) {
        adminRole.textContent = getAdminRoleLabel(roleCode, roleName);
    }

    if (adminAvatar) {
        adminAvatar.textContent = fullName.charAt(0).toUpperCase();
    }

    const ownerOnlyLinks = document.querySelectorAll("[data-owner-only='true']");

    ownerOnlyLinks.forEach(function (link) {
        if (roleCode !== "owner") {
            link.style.display = "none";
        } else {
            link.style.display = "";
        }
    });
}


// 8. Lấy class trạng thái đơn hàng
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


// 9. Lấy label trạng thái đơn hàng
function getOrderStatusLabel(order) {
    if (order.status && order.status.label) {
        return order.status.label;
    }

    const status = order.order_status || "";

    const labels = {
        pending: "Chờ xác nhận",
        confirmed: "Đã xác nhận",
        shipping: "Đang giao",
        completed: "Hoàn thành",
        cancelled: "Đã hủy"
    };

    return labels[status] || "Không xác định";
}


// 10. Render thống kê tổng quan
function renderDashboardStats(dashboardData, todayRevenueData) {
    const summary = dashboardData.summary || {};
    const todaySummary = todayRevenueData.summary || {};

    const revenueToday = Number(todaySummary.total_revenue || 0);
    const pendingOrders = Number(summary.pending_orders || 0);
    const activeProducts = Number(summary.active_products || 0);
    const lowStockVariants = Number(summary.low_stock_variants || 0);

    if (todayRevenue) {
        todayRevenue.textContent = formatPrice(revenueToday);
    }

    if (newOrderCount) {
        newOrderCount.textContent = pendingOrders;
    }

    if (productCount) {
        productCount.textContent = activeProducts;
    }

    if (lowStockCount) {
        lowStockCount.textContent = lowStockVariants;
    }
}


// 11. Render đơn hàng gần đây
function renderRecentOrders(orders) {
    if (!recentOrderList || !dashboardOrderRowTemplate) {
        return;
    }

    recentOrderList.innerHTML = "";

    const orderList = Array.isArray(orders) ? orders.slice(0, 5) : [];

    if (emptyRecentOrder) {
        emptyRecentOrder.classList.toggle("show", orderList.length === 0);
    }

    orderList.forEach(function (order) {
        const row = dashboardOrderRowTemplate.content.cloneNode(true);

        const statusCode = order.status && order.status.code
            ? order.status.code
            : order.order_status;

        const orderCodeElement = row.querySelector(".orderCode");
        const customerNameElement = row.querySelector(".customerName");
        const orderDateElement = row.querySelector(".orderDate");
        const orderTotalElement = row.querySelector(".orderTotal");
        const statusBadge = row.querySelector(".orderStatus");

        if (orderCodeElement) {
            orderCodeElement.textContent = order.order_code || "";
        }

        if (customerNameElement) {
            customerNameElement.textContent = order.customer && order.customer.name
                ? order.customer.name
                : "Khách hàng";
        }

        if (orderDateElement) {
            orderDateElement.textContent = formatDate(order.created_at);
        }

        if (orderTotalElement) {
            const finalTotal = order.money ? order.money.final_total : order.final_total;
            orderTotalElement.textContent = formatPrice(finalTotal);
        }

        if (statusBadge) {
            statusBadge.textContent = getOrderStatusLabel(order);
            statusBadge.className = "statusBadge orderStatus";
            statusBadge.classList.add(getOrderStatusClass(statusCode));
        }

        recentOrderList.appendChild(row);
    });
}


// 12. Render sản phẩm sắp hết hàng
function renderLowStockProducts(lowStockVariants) {
    if (!lowStockProductList || !lowStockRowTemplate) {
        return;
    }

    lowStockProductList.innerHTML = "";

    const variantList = Array.isArray(lowStockVariants)
        ? lowStockVariants.slice(0, 5)
        : [];

    if (emptyLowStock) {
        emptyLowStock.classList.toggle("show", variantList.length === 0);
    }

    variantList.forEach(function (variant) {
        const row = lowStockRowTemplate.content.cloneNode(true);

        const productNameElement = row.querySelector(".productName");
        const productCategoryElement = row.querySelector(".productCategory");
        const productStockElement = row.querySelector(".productStock");

        const colorName = variant.color_name || "";
        const sizeName = variant.size_name || "";
        const sku = variant.sku || "";

        let categoryText = sku;

        if (colorName || sizeName) {
            categoryText = [colorName, sizeName].filter(Boolean).join(" / ");
        }

        if (productNameElement) {
            productNameElement.textContent = variant.product_name || "Sản phẩm";
        }

        if (productCategoryElement) {
            productCategoryElement.textContent = categoryText || "Biến thể";
        }

        if (productStockElement) {
            productStockElement.textContent = Number(variant.stock_quantity || 0) + " sản phẩm";
        }

        lowStockProductList.appendChild(row);
    });
}


// 13. Hiển thị trạng thái loading đơn giản
function setDashboardLoading() {
    if (todayRevenue) {
        todayRevenue.textContent = "Đang tải...";
    }

    if (newOrderCount) {
        newOrderCount.textContent = "...";
    }

    if (productCount) {
        productCount.textContent = "...";
    }

    if (lowStockCount) {
        lowStockCount.textContent = "...";
    }
}


// 14. Hiển thị dữ liệu rỗng khi lỗi
function renderDashboardError(error) {
    console.error(error);

    if (todayRevenue) {
        todayRevenue.textContent = "0đ";
    }

    if (newOrderCount) {
        newOrderCount.textContent = "0";
    }

    if (productCount) {
        productCount.textContent = "0";
    }

    if (lowStockCount) {
        lowStockCount.textContent = "0";
    }

    if (recentOrderList) {
        recentOrderList.innerHTML = "";
    }

    if (lowStockProductList) {
        lowStockProductList.innerHTML = "";
    }

    if (emptyRecentOrder) {
        emptyRecentOrder.classList.add("show");
        emptyRecentOrder.textContent = "Không tải được danh sách đơn hàng.";
    }

    if (emptyLowStock) {
        emptyLowStock.classList.add("show");
        emptyLowStock.textContent = "Không tải được danh sách tồn kho thấp.";
    }
}


// 15. Load dữ liệu dashboard từ API
async function loadDashboardData() {
    const today = getTodayDateString();

    const dashboardResponse = await window.AdminApi.get("reports/get-dashboard-summary.php");

    const revenueResponse = await window.AdminApi.get(
        "reports/get-revenue-by-day.php?from_date=" + encodeURIComponent(today) +
        "&to_date=" + encodeURIComponent(today)
    );

    const ordersResponse = await window.AdminApi.get(
        "admin/orders/get-orders.php?page=1&limit=5&sort=latest"
    );

    const dashboardData = dashboardResponse.data || {};
    const todayRevenueData = revenueResponse.data || {};
    const ordersData = ordersResponse.data || {};

    renderDashboardStats(dashboardData, todayRevenueData);
    renderRecentOrders(ordersData.orders || []);
    renderLowStockProducts(dashboardData.low_stock_variants || []);
}


// 16. Xử lý đăng xuất
function handleAdminLogout() {
    if (window.AdminApi && window.AdminApi.logoutAdmin) {
        window.AdminApi.logoutAdmin();
        return;
    }

    localStorage.removeItem("admin_current_user");
    localStorage.removeItem("admin_is_login");
    window.location.href = "../html/admin-login.html";
}


// 17. Gắn sự kiện dashboard
function bindDashboardEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }
}


// 18. Kiểm tra đăng nhập local trước khi gọi API
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


// 19. Khởi tạo trang dashboard
async function initAdminDashboard() {
    const adminUser = checkAdminLoginLocal();

    if (!adminUser) {
        return;
    }

    renderAdminInfo(adminUser);
    renderCurrentDate();
    bindDashboardEvents();
    setDashboardLoading();

    try {
        await loadDashboardData();
    } catch (error) {
        if (error && error.status === 401) {
            window.AdminApi.clearAdminLocalAuth();
            window.location.href = "../html/admin-login.html";
            return;
        }

        renderDashboardError(error);
    }
}

initAdminDashboard();