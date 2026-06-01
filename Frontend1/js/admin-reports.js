// =========================================================
// File: Frontend1/js/admin-reports.js
// Mục đích: Gắn trang báo cáo thống kê admin với API backend thật
// =========================================================


// 1. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");


// 2. Lấy element bộ lọc
const reportRangeFilter = document.getElementById("reportRangeFilter");


// 3. Lấy element thống kê chính
const reportTotalRevenue = document.getElementById("reportTotalRevenue");
const reportTotalOrders = document.getElementById("reportTotalOrders");
const reportCompletedOrders = document.getElementById("reportCompletedOrders");
const reportAverageOrder = document.getElementById("reportAverageOrder");


// 4. Lấy element khu vực báo cáo
const revenueBarList = document.getElementById("revenueBarList");
const statusReportList = document.getElementById("statusReportList");
const bestSellerTableBody = document.getElementById("bestSellerTableBody");

const emptyRevenueText = document.getElementById("emptyRevenueText");
const emptyStatusText = document.getElementById("emptyStatusText");
const emptyBestSellerText = document.getElementById("emptyBestSellerText");

const revenueBarTemplate = document.getElementById("revenueBarTemplate");
const statusReportTemplate = document.getElementById("statusReportTemplate");
const bestSellerRowTemplate = document.getElementById("bestSellerRowTemplate");


// 5. Lấy element tổng quan dữ liệu
const overviewProductCount = document.getElementById("overviewProductCount");
const overviewLowStockCount = document.getElementById("overviewLowStockCount");
const overviewCustomerCount = document.getElementById("overviewCustomerCount");
const overviewCancelledOrderCount = document.getElementById("overviewCancelledOrderCount");


// 6. Biến lưu dữ liệu báo cáo
let currentAdminUser = null;


// 7. Format tiền Việt Nam
function formatPrice(price) {
    if (window.AdminApi && window.AdminApi.formatPrice) {
        return window.AdminApi.formatPrice(price);
    }

    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}


// 8. Format số
function formatNumber(number) {
    return Number(number || 0).toLocaleString("vi-VN");
}


// 9. Format ngày Việt Nam
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


// 10. Render ngày hiện tại
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


// 11. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) {
        return "A";
    }

    return String(text).trim().charAt(0).toUpperCase();
}


// 12. Lấy nhãn vai trò admin
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


// 13. Hiển thị thông tin admin
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


// 14. Xử lý đăng xuất
function handleAdminLogout() {
    if (window.AdminApi && window.AdminApi.logoutAdmin) {
        window.AdminApi.logoutAdmin();
        return;
    }

    localStorage.removeItem("admin_current_user");
    localStorage.removeItem("admin_is_login");
    window.location.href = "../html/admin-login.html";
}


// 15. Lấy ngày dạng YYYY-MM-DD
function formatDateForApi(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}


// 16. Lấy khoảng ngày theo bộ lọc
function getReportDateRange() {
    const rangeValue = reportRangeFilter ? reportRangeFilter.value : "all";
    const today = new Date();

    let fromDate = new Date();

    if (rangeValue === "today") {
        fromDate = new Date(today);
    } else if (rangeValue === "7days") {
        fromDate.setDate(today.getDate() - 6);
    } else if (rangeValue === "30days") {
        fromDate.setDate(today.getDate() - 29);
    } else {
        // API doanh thu giới hạn tối đa 365 ngày, nên "all" dùng 365 ngày gần nhất cho biểu đồ.
        fromDate.setDate(today.getDate() - 364);
    }

    return {
        range: rangeValue,
        fromDate: formatDateForApi(fromDate),
        toDate: formatDateForApi(today)
    };
}


// 17. Lấy thông tin trạng thái đơn hàng
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


// 18. Lấy mã trạng thái đơn hàng
function getOrderStatusCode(order) {
    if (order.status && order.status.code) {
        return order.status.code;
    }

    return order.order_status || "pending";
}


// 19. Lấy tổng tiền đơn hàng
function getOrderFinalTotal(order) {
    if (order.money && order.money.final_total !== undefined) {
        return Number(order.money.final_total || 0);
    }

    return Number(order.final_total || 0);
}


// 20. Tính báo cáo trạng thái từ danh sách đơn
function getOrderStatusReportFromOrders(orders) {
    const statusList = ["pending", "confirmed", "shipping", "completed", "cancelled"];

    return statusList.map(function (status) {
        const count = orders.filter(function (order) {
            return getOrderStatusCode(order) === status;
        }).length;

        return {
            order_status: status,
            status_label: getOrderStatusInfo(status).text,
            total_orders: count,
            total_amount: orders
                .filter(function (order) {
                    return getOrderStatusCode(order) === status;
                })
                .reduce(function (total, order) {
                    return total + getOrderFinalTotal(order);
                }, 0)
        };
    });
}


// 21. Lấy danh sách trạng thái đơn từ dashboard
function getOrderStatusReportFromDashboard(dashboardData) {
    if (!dashboardData || !Array.isArray(dashboardData.orders_by_status)) {
        return [];
    }

    return dashboardData.orders_by_status.map(function (item) {
        return {
            order_status: item.order_status,
            status_label: item.status_label,
            total_orders: Number(item.total_orders || 0),
            total_amount: Number(item.total_amount || 0)
        };
    });
}


// 22. Render thống kê chính
function renderMainStats(dashboardData, revenueData, ordersData) {
    const rangeInfo = getReportDateRange();

    const dashboardSummary = dashboardData.summary || {};
    const revenueSummary = revenueData.summary || {};
    const ordersPagination = ordersData.pagination || {};
    const orders = Array.isArray(ordersData.orders) ? ordersData.orders : [];

    let totalRevenue = Number(revenueSummary.total_revenue || 0);
    let totalOrders = Number(ordersPagination.total_orders || orders.length);
    let completedOrders = Number(revenueSummary.total_orders || 0);
    let averageOrderValue = Number(revenueSummary.average_order_value || 0);

    if (rangeInfo.range === "all") {
        totalRevenue = Number(dashboardSummary.completed_revenue || 0);
        totalOrders = Number(dashboardSummary.total_orders || 0);
        completedOrders = Number(dashboardSummary.completed_orders || 0);
        averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    }

    if (reportTotalRevenue) {
        reportTotalRevenue.textContent = formatPrice(totalRevenue);
    }

    if (reportTotalOrders) {
        reportTotalOrders.textContent = formatNumber(totalOrders);
    }

    if (reportCompletedOrders) {
        reportCompletedOrders.textContent = formatNumber(completedOrders);
    }

    if (reportAverageOrder) {
        reportAverageOrder.textContent = formatPrice(averageOrderValue);
    }
}


// 23. Render doanh thu theo ngày
function renderRevenueBars(revenueData) {
    if (!revenueBarList || !revenueBarTemplate) {
        return;
    }

    const chartData = Array.isArray(revenueData.chart_data)
        ? revenueData.chart_data
        : [];

    const visibleRevenueData = chartData.filter(function (item) {
        return Number(item.total_revenue || 0) > 0;
    });

    const maxRevenue = visibleRevenueData.reduce(function (max, item) {
        return Math.max(max, Number(item.total_revenue || 0));
    }, 0);

    revenueBarList.innerHTML = "";

    if (emptyRevenueText) {
        emptyRevenueText.classList.toggle("show", visibleRevenueData.length === 0);
    }

    visibleRevenueData.forEach(function (item) {
        const barFragment = revenueBarTemplate.content.cloneNode(true);

        const percent = maxRevenue > 0
            ? (Number(item.total_revenue || 0) / maxRevenue) * 100
            : 0;

        const barDateText = barFragment.querySelector(".barDateText");
        const barRevenueText = barFragment.querySelector(".barRevenueText");
        const reportBarFill = barFragment.querySelector(".reportBarFill");

        if (barDateText) {
            barDateText.textContent = item.date_label || formatDate(item.report_date);
        }

        if (barRevenueText) {
            barRevenueText.textContent = formatPrice(item.total_revenue);
        }

        if (reportBarFill) {
            reportBarFill.style.width = percent + "%";
        }

        revenueBarList.appendChild(barFragment);
    });
}


// 24. Render thống kê trạng thái đơn hàng
function renderStatusReport(dashboardData, ordersData) {
    if (!statusReportList || !statusReportTemplate) {
        return;
    }

    const rangeInfo = getReportDateRange();
    const orders = Array.isArray(ordersData.orders) ? ordersData.orders : [];

    let statusData = [];

    if (rangeInfo.range === "all") {
        statusData = getOrderStatusReportFromDashboard(dashboardData);
    }

    if (statusData.length === 0) {
        statusData = getOrderStatusReportFromOrders(orders);
    }

    const totalOrders = statusData.reduce(function (total, item) {
        return total + Number(item.total_orders || 0);
    }, 0);

    statusReportList.innerHTML = "";

    if (emptyStatusText) {
        emptyStatusText.classList.toggle("show", totalOrders === 0);
    }

    statusData.forEach(function (item) {
        const status = item.order_status;
        const statusInfo = getOrderStatusInfo(status);
        const count = Number(item.total_orders || 0);

        const percent = totalOrders > 0
            ? Math.round((count / totalOrders) * 100)
            : 0;

        const statusFragment = statusReportTemplate.content.cloneNode(true);

        const statusReportName = statusFragment.querySelector(".statusReportName");
        const statusReportCount = statusFragment.querySelector(".statusReportCount");
        const statusReportPercent = statusFragment.querySelector(".statusReportPercent");
        const statusReportFill = statusFragment.querySelector(".statusReportFill");

        if (statusReportName) {
            statusReportName.textContent = item.status_label || statusInfo.text;
            statusReportName.classList.add(statusInfo.className);
        }

        if (statusReportCount) {
            statusReportCount.textContent = count + " đơn";
        }

        if (statusReportPercent) {
            statusReportPercent.textContent = percent + "% tổng đơn hàng";
        }

        if (statusReportFill) {
            statusReportFill.style.width = percent + "%";
        }

        statusReportList.appendChild(statusFragment);
    });
}


// 25. Render sản phẩm bán chạy
function renderBestSellingProducts(bestSellerData) {
    if (!bestSellerTableBody || !bestSellerRowTemplate) {
        return;
    }

    const products = Array.isArray(bestSellerData.products)
        ? bestSellerData.products
        : [];

    bestSellerTableBody.innerHTML = "";

    if (emptyBestSellerText) {
        emptyBestSellerText.classList.toggle("show", products.length === 0);
    }

    products.forEach(function (product, index) {
        const rowFragment = bestSellerRowTemplate.content.cloneNode(true);

        const bestSellerIndexText = rowFragment.querySelector(".bestSellerIndexText");
        const bestSellerNameText = rowFragment.querySelector(".bestSellerNameText");
        const bestSellerQuantityText = rowFragment.querySelector(".bestSellerQuantityText");
        const bestSellerRevenueText = rowFragment.querySelector(".bestSellerRevenueText");

        if (bestSellerIndexText) {
            bestSellerIndexText.textContent = product.rank || index + 1;
        }

        if (bestSellerNameText) {
            bestSellerNameText.textContent = product.product_name || "Sản phẩm";
        }

        if (bestSellerQuantityText) {
            bestSellerQuantityText.textContent = formatNumber(product.total_sold || 0);
        }

        if (bestSellerRevenueText) {
            bestSellerRevenueText.textContent = formatPrice(product.total_revenue || 0);
        }

        bestSellerTableBody.appendChild(rowFragment);
    });
}


// 26. Lấy số đơn bị hủy từ dashboard
function getCancelledOrderCount(dashboardData) {
    if (!dashboardData || !Array.isArray(dashboardData.orders_by_status)) {
        return 0;
    }

    const cancelledItem = dashboardData.orders_by_status.find(function (item) {
        return item.order_status === "cancelled";
    });

    return cancelledItem ? Number(cancelledItem.total_orders || 0) : 0;
}


// 27. Render tổng quan dữ liệu
function renderOverviewData(dashboardData) {
    const summary = dashboardData.summary || {};

    if (overviewProductCount) {
        overviewProductCount.textContent = formatNumber(summary.active_products || 0);
    }

    if (overviewLowStockCount) {
        overviewLowStockCount.textContent = formatNumber(summary.low_stock_variants || 0);
    }

    if (overviewCustomerCount) {
        overviewCustomerCount.textContent = formatNumber(summary.total_customers || 0);
    }

    if (overviewCancelledOrderCount) {
        overviewCancelledOrderCount.textContent = formatNumber(getCancelledOrderCount(dashboardData));
    }
}


// 28. Hiển thị loading báo cáo
function setReportLoading() {
    if (reportTotalRevenue) {
        reportTotalRevenue.textContent = "Đang tải...";
    }

    if (reportTotalOrders) {
        reportTotalOrders.textContent = "...";
    }

    if (reportCompletedOrders) {
        reportCompletedOrders.textContent = "...";
    }

    if (reportAverageOrder) {
        reportAverageOrder.textContent = "Đang tải...";
    }

    if (revenueBarList) {
        revenueBarList.innerHTML = "";
    }

    if (statusReportList) {
        statusReportList.innerHTML = "";
    }

    if (bestSellerTableBody) {
        bestSellerTableBody.innerHTML = "";
    }
}


// 29. Hiển thị lỗi báo cáo
function renderReportError(error) {
    console.error(error);

    if (reportTotalRevenue) {
        reportTotalRevenue.textContent = "0đ";
    }

    if (reportTotalOrders) {
        reportTotalOrders.textContent = "0";
    }

    if (reportCompletedOrders) {
        reportCompletedOrders.textContent = "0";
    }

    if (reportAverageOrder) {
        reportAverageOrder.textContent = "0đ";
    }

    if (revenueBarList) {
        revenueBarList.innerHTML = "";
    }

    if (statusReportList) {
        statusReportList.innerHTML = "";
    }

    if (bestSellerTableBody) {
        bestSellerTableBody.innerHTML = "";
    }

    if (emptyRevenueText) {
        emptyRevenueText.classList.add("show");
        emptyRevenueText.textContent = "Không tải được dữ liệu doanh thu.";
    }

    if (emptyStatusText) {
        emptyStatusText.classList.add("show");
        emptyStatusText.textContent = "Không tải được dữ liệu đơn hàng.";
    }

    if (emptyBestSellerText) {
        emptyBestSellerText.classList.add("show");
        emptyBestSellerText.textContent = "Không tải được dữ liệu sản phẩm bán chạy.";
    }

    renderOverviewData({
        summary: {
            active_products: 0,
            low_stock_variants: 0,
            total_customers: 0
        },
        orders_by_status: []
    });
}


// 30. Tạo query ngày cho API đơn hàng
function buildOrderDateQuery(rangeInfo) {
    if (rangeInfo.range === "all") {
        return "";
    }

    return "&from_date=" + encodeURIComponent(rangeInfo.fromDate) +
        "&to_date=" + encodeURIComponent(rangeInfo.toDate);
}


// 31. Load dữ liệu báo cáo từ API
async function loadReportsFromApi() {
    setReportLoading();

    const rangeInfo = getReportDateRange();

    const dashboardResponse = await window.AdminApi.get("reports/get-dashboard-summary.php");

    const revenueResponse = await window.AdminApi.get(
        "reports/get-revenue-by-day.php?from_date=" + encodeURIComponent(rangeInfo.fromDate) +
        "&to_date=" + encodeURIComponent(rangeInfo.toDate)
    );

    const ordersResponse = await window.AdminApi.get(
        "admin/orders/get-orders.php?page=1&limit=50&order_status=all&payment_status=all&payment_method=all" +
        buildOrderDateQuery(rangeInfo) +
        "&sort=latest"
    );

    const bestSellerResponse = await window.AdminApi.get(
        "reports/get-best-selling-products.php?page=1&limit=5&sort=sold_desc"
    );

    const dashboardData = dashboardResponse.data || {};
    const revenueData = revenueResponse.data || {};
    const ordersData = ordersResponse.data || {};
    const bestSellerData = bestSellerResponse.data || {};

    renderMainStats(dashboardData, revenueData, ordersData);
    renderRevenueBars(revenueData);
    renderStatusReport(dashboardData, ordersData);
    renderBestSellingProducts(bestSellerData);
    renderOverviewData(dashboardData);
}


// 32. Gắn sự kiện trang báo cáo
function bindReportEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (reportRangeFilter) {
        reportRangeFilter.addEventListener("change", function () {
            loadReportsFromApi().catch(function (error) {
                if (error && error.status === 401) {
                    window.AdminApi.clearAdminLocalAuth();
                    window.location.href = "../html/admin-login.html";
                    return;
                }

                renderReportError(error);
            });
        });
    }
}


// 33. Kiểm tra đăng nhập local
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


// 34. Khởi tạo trang báo cáo
async function initAdminReportsPage() {
    currentAdminUser = checkAdminLoginLocal();

    if (!currentAdminUser) {
        return;
    }

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    bindReportEvents();

    try {
        await loadReportsFromApi();
    } catch (error) {
        if (error && error.status === 401) {
            window.AdminApi.clearAdminLocalAuth();
            window.location.href = "../html/admin-login.html";
            return;
        }

        renderReportError(error);
    }
}

initAdminReportsPage();