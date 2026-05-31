// 1. Khai báo key localStorage
const ADMIN_CURRENT_USER_KEY = "admin_current_user";
const ADMIN_IS_LOGIN_KEY = "admin_is_login";
const ADMIN_ORDERS_KEY = "admin_orders";
const ADMIN_PRODUCTS_KEY = "admin_products";
const ADMIN_CUSTOMERS_KEY = "admin_customers";

// 2. Dữ liệu đơn hàng mẫu dự phòng
const demoReportOrders = [
    {
        id: "DH001",
        customerName: "Nguyễn Minh Anh",
        orderDate: "2026-05-19",
        status: "completed",
        shippingFee: 30000,
        discount: 50000,
        items: [
            {
                name: "Áo thun basic nam",
                quantity: 2,
                price: 199000
            },
            {
                name: "Quần jean xanh đậm",
                quantity: 1,
                price: 459000
            }
        ]
    },
    {
        id: "DH002",
        customerName: "Trần Hoàng Nam",
        orderDate: "2026-05-19",
        status: "shipping",
        shippingFee: 30000,
        discount: 0,
        items: [
            {
                name: "Áo hoodie form rộng",
                quantity: 1,
                price: 399000
            }
        ]
    },
    {
        id: "DH003",
        customerName: "Lê Phương Thảo",
        orderDate: "2026-05-18",
        status: "completed",
        shippingFee: 0,
        discount: 100000,
        items: [
            {
                name: "Áo khoác kaki nữ",
                quantity: 1,
                price: 520000
            },
            {
                name: "Chân váy ngắn basic",
                quantity: 2,
                price: 299000
            }
        ]
    },
    {
        id: "DH004",
        customerName: "Phạm Quốc Huy",
        orderDate: "2026-05-17",
        status: "cancelled",
        shippingFee: 30000,
        discount: 0,
        items: [
            {
                name: "Áo sơ mi trắng basic",
                quantity: 1,
                price: 350000
            }
        ]
    }
];

// 3. Dữ liệu sản phẩm mẫu dự phòng
const demoReportProducts = [
    {
        id: "SP001",
        name: "Áo thun basic nam",
        category: "Áo thun",
        stock: 18,
        status: "active"
    },
    {
        id: "SP002",
        name: "Áo hoodie form rộng",
        category: "Áo hoodie",
        stock: 3,
        status: "active"
    },
    {
        id: "SP003",
        name: "Quần jean xanh đậm",
        category: "Quần dài",
        stock: 12,
        status: "active"
    },
    {
        id: "SP004",
        name: "Chân váy ngắn basic",
        category: "Váy",
        stock: 4,
        status: "active"
    }
];

// 4. Dữ liệu khách hàng mẫu dự phòng
const demoReportCustomers = [
    {
        id: "KH001",
        fullName: "Nguyễn Minh Anh"
    },
    {
        id: "KH002",
        fullName: "Trần Hoàng Nam"
    },
    {
        id: "KH003",
        fullName: "Lê Phương Thảo"
    }
];

// 5. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

// 6. Lấy element bộ lọc
const reportRangeFilter = document.getElementById("reportRangeFilter");

// 7. Lấy element thống kê chính
const reportTotalRevenue = document.getElementById("reportTotalRevenue");
const reportTotalOrders = document.getElementById("reportTotalOrders");
const reportCompletedOrders = document.getElementById("reportCompletedOrders");
const reportAverageOrder = document.getElementById("reportAverageOrder");

// 8. Lấy element khu vực báo cáo
const revenueBarList = document.getElementById("revenueBarList");
const statusReportList = document.getElementById("statusReportList");
const bestSellerTableBody = document.getElementById("bestSellerTableBody");

const emptyRevenueText = document.getElementById("emptyRevenueText");
const emptyStatusText = document.getElementById("emptyStatusText");
const emptyBestSellerText = document.getElementById("emptyBestSellerText");

const revenueBarTemplate = document.getElementById("revenueBarTemplate");
const statusReportTemplate = document.getElementById("statusReportTemplate");
const bestSellerRowTemplate = document.getElementById("bestSellerRowTemplate");

// 9. Lấy element tổng quan dữ liệu
const overviewProductCount = document.getElementById("overviewProductCount");
const overviewLowStockCount = document.getElementById("overviewLowStockCount");
const overviewCustomerCount = document.getElementById("overviewCustomerCount");
const overviewCancelledOrderCount = document.getElementById("overviewCancelledOrderCount");

// 10. Format tiền Việt Nam
function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}

// 11. Format số
function formatNumber(number) {
    return Number(number || 0).toLocaleString("vi-VN");
}

// 12. Format ngày Việt Nam
function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN");
}

// 13. Render ngày hiện tại
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

// 14. Kiểm tra đăng nhập admin
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

// 15. Hiển thị thông tin admin
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

// 16. Đăng xuất admin
function handleAdminLogout() {
    localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
    localStorage.removeItem(ADMIN_IS_LOGIN_KEY);

    window.location.href = "../html/admin-login.html";
}

// 17. Tính tổng tiền hàng
function calculateSubtotal(items) {
    return (items || []).reduce(function(total, item) {
        return total + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
}

// 18. Tính tổng đơn hàng
function calculateOrderTotal(order) {
    const subtotal = calculateSubtotal(order.items || []);
    const shippingFee = Number(order.shippingFee || 0);
    const discount = Number(order.discount || 0);

    return subtotal + shippingFee - discount;
}

// 19. Chuẩn hóa đơn hàng
function normalizeOrder(order, index) {
    return {
        id: order.id || "DH" + String(index + 1).padStart(3, "0"),
        customerName: order.customerName || "Khách hàng",
        orderDate: order.orderDate || new Date().toISOString().slice(0, 10),
        status: order.status || "pending",
        shippingFee: Number(order.shippingFee || 0),
        discount: Number(order.discount || 0),
        items: Array.isArray(order.items) ? order.items : []
    };
}

// 20. Lấy dữ liệu đơn hàng
function getOrders() {
    const savedOrders = localStorage.getItem(ADMIN_ORDERS_KEY);

    if (!savedOrders) {
        localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(demoReportOrders));
        return demoReportOrders;
    }

    try {
        const orders = JSON.parse(savedOrders);

        return orders.map(function(order, index) {
            return normalizeOrder(order, index);
        });
    } catch (error) {
        localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(demoReportOrders));
        return demoReportOrders;
    }
}

// 21. Lấy dữ liệu sản phẩm
function getProducts() {
    const savedProducts = localStorage.getItem(ADMIN_PRODUCTS_KEY);

    if (!savedProducts) {
        localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(demoReportProducts));
        return demoReportProducts;
    }

    try {
        return JSON.parse(savedProducts);
    } catch (error) {
        localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(demoReportProducts));
        return demoReportProducts;
    }
}

// 22. Lấy dữ liệu khách hàng
function getCustomers() {
    const savedCustomers = localStorage.getItem(ADMIN_CUSTOMERS_KEY);

    if (!savedCustomers) {
        localStorage.setItem(ADMIN_CUSTOMERS_KEY, JSON.stringify(demoReportCustomers));
        return demoReportCustomers;
    }

    try {
        return JSON.parse(savedCustomers);
    } catch (error) {
        localStorage.setItem(ADMIN_CUSTOMERS_KEY, JSON.stringify(demoReportCustomers));
        return demoReportCustomers;
    }
}

// 23. Lọc đơn hàng theo khoảng thời gian
function getFilteredOrdersByRange(orders) {
    const rangeValue = reportRangeFilter.value;

    if (rangeValue === "all") {
        return orders;
    }

    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);

    if (rangeValue === "today") {
        return orders.filter(function(order) {
            return order.orderDate === todayString;
        });
    }

    let dayCount = 7;

    if (rangeValue === "30days") {
        dayCount = 30;
    }

    const startDate = new Date();

    startDate.setDate(today.getDate() - dayCount + 1);

    return orders.filter(function(order) {
        const orderDate = new Date(order.orderDate);

        return orderDate >= startDate && orderDate <= today;
    });
}

// 24. Lấy thông tin trạng thái đơn hàng
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

// 25. Render thống kê chính
function renderMainStats(orders) {
    const completedOrders = orders.filter(function(order) {
        return order.status === "completed";
    });

    const totalRevenue = completedOrders.reduce(function(total, order) {
        return total + calculateOrderTotal(order);
    }, 0);

    const averageOrderValue = completedOrders.length > 0
        ? totalRevenue / completedOrders.length
        : 0;

    if (reportTotalRevenue) {
        reportTotalRevenue.textContent = formatPrice(totalRevenue);
    }

    if (reportTotalOrders) {
        reportTotalOrders.textContent = orders.length;
    }

    if (reportCompletedOrders) {
        reportCompletedOrders.textContent = completedOrders.length;
    }

    if (reportAverageOrder) {
        reportAverageOrder.textContent = formatPrice(averageOrderValue);
    }
}

// 26. Nhóm doanh thu theo ngày
function groupRevenueByDate(orders) {
    const completedOrders = orders.filter(function(order) {
        return order.status === "completed";
    });

    const revenueMap = {};

    completedOrders.forEach(function(order) {
        if (!revenueMap[order.orderDate]) {
            revenueMap[order.orderDate] = 0;
        }

        revenueMap[order.orderDate] += calculateOrderTotal(order);
    });

    return Object.keys(revenueMap)
        .sort(function(a, b) {
            return new Date(b) - new Date(a);
        })
        .map(function(date) {
            return {
                date: date,
                revenue: revenueMap[date]
            };
        });
}

// 27. Render doanh thu theo ngày
function renderRevenueBars(orders) {
    if (!revenueBarList || !revenueBarTemplate) return;

    const revenueData = groupRevenueByDate(orders);
    const maxRevenue = revenueData.reduce(function(max, item) {
        return Math.max(max, item.revenue);
    }, 0);

    revenueBarList.innerHTML = "";

    if (emptyRevenueText) {
        emptyRevenueText.classList.toggle("show", revenueData.length === 0);
    }

    revenueData.forEach(function(item) {
        const barFragment = revenueBarTemplate.content.cloneNode(true);
        const percent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

        barFragment.querySelector(".barDateText").textContent = formatDate(item.date);
        barFragment.querySelector(".barRevenueText").textContent = formatPrice(item.revenue);
        barFragment.querySelector(".reportBarFill").style.width = percent + "%";

        revenueBarList.appendChild(barFragment);
    });
}

// 28. Thống kê trạng thái đơn hàng
function getOrderStatusReport(orders) {
    const statusList = ["pending", "shipping", "completed", "cancelled"];

    return statusList.map(function(status) {
        const count = orders.filter(function(order) {
            return order.status === status;
        }).length;

        return {
            status: status,
            count: count
        };
    });
}

// 29. Render thống kê trạng thái
function renderStatusReport(orders) {
    if (!statusReportList || !statusReportTemplate) return;

    const statusData = getOrderStatusReport(orders);
    const totalOrders = orders.length;

    statusReportList.innerHTML = "";

    if (emptyStatusText) {
        emptyStatusText.classList.toggle("show", totalOrders === 0);
    }

    statusData.forEach(function(item) {
        const statusInfo = getOrderStatusInfo(item.status);
        const percent = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0;
        const statusFragment = statusReportTemplate.content.cloneNode(true);

        const statusName = statusFragment.querySelector(".statusReportName");

        statusName.textContent = statusInfo.text;
        statusName.classList.add(statusInfo.className);

        statusFragment.querySelector(".statusReportCount").textContent = item.count + " đơn";
        statusFragment.querySelector(".statusReportPercent").textContent = percent + "% tổng đơn hàng";
        statusFragment.querySelector(".statusReportFill").style.width = percent + "%";

        statusReportList.appendChild(statusFragment);
    });
}

// 30. Tính sản phẩm bán chạy
function getBestSellingProducts(orders) {
    const completedOrders = orders.filter(function(order) {
        return order.status === "completed";
    });

    const productMap = {};

    completedOrders.forEach(function(order) {
        (order.items || []).forEach(function(item) {
            if (!productMap[item.name]) {
                productMap[item.name] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0
                };
            }

            productMap[item.name].quantity += Number(item.quantity || 0);
            productMap[item.name].revenue += Number(item.price || 0) * Number(item.quantity || 0);
        });
    });

    return Object.values(productMap)
        .sort(function(a, b) {
            return b.quantity - a.quantity;
        })
        .slice(0, 5);
}

// 31. Render sản phẩm bán chạy
function renderBestSellingProducts(orders) {
    if (!bestSellerTableBody || !bestSellerRowTemplate) return;

    const bestSellers = getBestSellingProducts(orders);

    bestSellerTableBody.innerHTML = "";

    if (emptyBestSellerText) {
        emptyBestSellerText.classList.toggle("show", bestSellers.length === 0);
    }

    bestSellers.forEach(function(product, index) {
        const rowFragment = bestSellerRowTemplate.content.cloneNode(true);

        rowFragment.querySelector(".bestSellerIndexText").textContent = index + 1;
        rowFragment.querySelector(".bestSellerNameText").textContent = product.name;
        rowFragment.querySelector(".bestSellerQuantityText").textContent = formatNumber(product.quantity);
        rowFragment.querySelector(".bestSellerRevenueText").textContent = formatPrice(product.revenue);

        bestSellerTableBody.appendChild(rowFragment);
    });
}

// 32. Render tổng quan dữ liệu
function renderOverviewData(orders, products, customers) {
    const lowStockProducts = products.filter(function(product) {
        return Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 5;
    });

    const cancelledOrders = orders.filter(function(order) {
        return order.status === "cancelled";
    });

    if (overviewProductCount) {
        overviewProductCount.textContent = products.length;
    }

    if (overviewLowStockCount) {
        overviewLowStockCount.textContent = lowStockProducts.length;
    }

    if (overviewCustomerCount) {
        overviewCustomerCount.textContent = customers.length;
    }

    if (overviewCancelledOrderCount) {
        overviewCancelledOrderCount.textContent = cancelledOrders.length;
    }
}

// 33. Render toàn bộ báo cáo
function renderReports() {
    const orders = getOrders();
    const products = getProducts();
    const customers = getCustomers();

    const filteredOrders = getFilteredOrdersByRange(orders);

    renderMainStats(filteredOrders);
    renderRevenueBars(filteredOrders);
    renderStatusReport(filteredOrders);
    renderBestSellingProducts(filteredOrders);
    renderOverviewData(filteredOrders, products, customers);
}

// 34. Gắn sự kiện trang báo cáo
function bindReportEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (reportRangeFilter) {
        reportRangeFilter.addEventListener("change", renderReports);
    }
}

// 35. Khởi tạo trang báo cáo
function initAdminReportsPage() {
    const adminUser = checkAdminLogin();

    if (!adminUser) return;

    renderAdminInfo(adminUser);
    renderCurrentDate();
    renderReports();
    bindReportEvents();
}

initAdminReportsPage();