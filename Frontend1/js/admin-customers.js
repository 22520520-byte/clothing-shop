// 1. Khai báo key localStorage
const ADMIN_CURRENT_USER_KEY = "admin_current_user";
const ADMIN_IS_LOGIN_KEY = "admin_is_login";
const ADMIN_CUSTOMERS_KEY = "admin_customers";

// 2. Dữ liệu khách hàng mẫu
const demoAdminCustomers = [
    {
        id: "KH001",
        fullName: "Nguyễn Minh Anh",
        email: "minhanh@gmail.com",
        phone: "0901234567",
        address: "12 Nguyễn Huệ, Quận 1, TP.HCM",
        registerDate: "2026-04-02",
        orderCount: 8,
        totalSpent: 5200000,
        rank: "gold",
        status: "active",
        points: 1250,
        totalPointsEarned: 1800,
        totalPointsUsed: 550,
        wishlistCount: 6,
        lastOrderDate: "2026-05-18"
    },
    {
        id: "KH002",
        fullName: "Trần Hoàng Nam",
        email: "hoangnam@gmail.com",
        phone: "0912345678",
        address: "45 Võ Văn Ngân, TP Thủ Đức, TP.HCM",
        registerDate: "2026-04-12",
        orderCount: 4,
        totalSpent: 2350000,
        rank: "silver",
        status: "active",
        points: 650,
        totalPointsEarned: 900,
        totalPointsUsed: 250,
        wishlistCount: 3,
        lastOrderDate: "2026-05-18"
    },
    {
        id: "KH003",
        fullName: "Lê Phương Thảo",
        email: "phuongthao@gmail.com",
        phone: "0987654321",
        address: "88 Lê Văn Sỹ, Quận 3, TP.HCM",
        registerDate: "2026-03-25",
        orderCount: 12,
        totalSpent: 9800000,
        rank: "diamond",
        status: "active",
        points: 3200,
        totalPointsEarned: 4500,
        totalPointsUsed: 1300,
        wishlistCount: 12,
        lastOrderDate: "2026-05-17"
    },
    {
        id: "KH004",
        fullName: "Phạm Quốc Huy",
        email: "quochuy@gmail.com",
        phone: "0934567890",
        address: "25 Cách Mạng Tháng 8, Quận 10, TP.HCM",
        registerDate: "2026-05-01",
        orderCount: 1,
        totalSpent: 430000,
        rank: "new",
        status: "locked",
        points: 40,
        totalPointsEarned: 40,
        totalPointsUsed: 0,
        wishlistCount: 1,
        lastOrderDate: "2026-05-17"
    },
    {
        id: "KH005",
        fullName: "Võ Thanh Trúc",
        email: "thanhtruc@gmail.com",
        phone: "0977123456",
        address: "70 Phan Văn Trị, Gò Vấp, TP.HCM",
        registerDate: "2026-05-10",
        orderCount: 0,
        totalSpent: 0,
        rank: "new",
        status: "active",
        points: 0,
        totalPointsEarned: 0,
        totalPointsUsed: 0,
        wishlistCount: 2,
        lastOrderDate: ""
    }
];

// 3. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

// 4. Lấy element thống kê
const totalCustomerCount = document.getElementById("totalCustomerCount");
const activeCustomerCount = document.getElementById("activeCustomerCount");
const vipCustomerCount = document.getElementById("vipCustomerCount");
const lockedCustomerCount = document.getElementById("lockedCustomerCount");

// 5. Lấy element bộ lọc và bảng
const customerSearchInput = document.getElementById("customerSearchInput");
const customerRankFilter = document.getElementById("customerRankFilter");
const customerStatusFilter = document.getElementById("customerStatusFilter");
const customerTableBody = document.getElementById("customerTableBody");
const emptyCustomerText = document.getElementById("emptyCustomerText");
const customerRowTemplate = document.getElementById("customerRowTemplate");

// 6. Format tiền Việt Nam
function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}

// 7. Format ngày Việt Nam
function formatDate(dateString) {
    if (!dateString) return "Chưa có";

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

// 12. Chuẩn hóa khách hàng
function normalizeCustomer(customer, index) {
    const defaultCustomer = demoAdminCustomers[index] || demoAdminCustomers[0];

    return {
        id: customer.id || "KH" + String(index + 1).padStart(3, "0"),
        fullName: customer.fullName || defaultCustomer.fullName || "Khách hàng",
        email: customer.email || defaultCustomer.email || "Chưa cập nhật",
        phone: customer.phone || defaultCustomer.phone || "Chưa cập nhật",
        address: customer.address || defaultCustomer.address || "Chưa cập nhật",
        registerDate: customer.registerDate || defaultCustomer.registerDate || new Date().toISOString().slice(0, 10),
        orderCount: Number(customer.orderCount || 0),
        totalSpent: Number(customer.totalSpent || 0),
        rank: customer.rank || "new",
        status: customer.status || "active",
        points: Number(customer.points || 0),
        totalPointsEarned: Number(customer.totalPointsEarned || 0),
        totalPointsUsed: Number(customer.totalPointsUsed || 0),
        wishlistCount: Number(customer.wishlistCount || 0),
        lastOrderDate: customer.lastOrderDate || ""
    };
}

// 13. Lấy danh sách khách hàng
function getCustomers() {
    const savedCustomers = localStorage.getItem(ADMIN_CUSTOMERS_KEY);

    if (!savedCustomers) {
        localStorage.setItem(ADMIN_CUSTOMERS_KEY, JSON.stringify(demoAdminCustomers));
        return demoAdminCustomers;
    }

    try {
        const customers = JSON.parse(savedCustomers);

        const normalizedCustomers = customers.map(function(customer, index) {
            return normalizeCustomer(customer, index);
        });

        localStorage.setItem(ADMIN_CUSTOMERS_KEY, JSON.stringify(normalizedCustomers));

        return normalizedCustomers;
    } catch (error) {
        localStorage.setItem(ADMIN_CUSTOMERS_KEY, JSON.stringify(demoAdminCustomers));
        return demoAdminCustomers;
    }
}

// 14. Lưu danh sách khách hàng
function saveCustomers(customers) {
    localStorage.setItem(ADMIN_CUSTOMERS_KEY, JSON.stringify(customers));
}

// 15. Tạo link chi tiết khách hàng
function getAdminCustomerDetailUrl(customerId) {
    return "../html/admin-customer-detail.html?id=" + encodeURIComponent(customerId);
}

// 16. Lấy chữ đại diện khách hàng
function getCustomerFirstLetter(fullName) {
    if (!fullName) return "K";

    return fullName.trim().charAt(0).toUpperCase();
}

// 17. Lấy thông tin hạng khách hàng
function getCustomerRankInfo(rank) {
    switch (rank) {
        case "silver":
            return {
                text: "Bạc",
                className: "rankSilver"
            };

        case "gold":
            return {
                text: "Vàng",
                className: "rankGold"
            };

        case "diamond":
            return {
                text: "Kim cương",
                className: "rankDiamond"
            };

        default:
            return {
                text: "Khách mới",
                className: "rankNew"
            };
    }
}

// 18. Lấy thông tin trạng thái khách hàng
function getCustomerStatusInfo(status) {
    if (status === "locked") {
        return {
            text: "Đã khóa",
            className: "statusCancelled"
        };
    }

    return {
        text: "Hoạt động",
        className: "statusActive"
    };
}

// 19. Render thống kê khách hàng
function renderCustomerStats(customers) {
    const activeCustomers = customers.filter(function(customer) {
        return customer.status === "active";
    });

    const vipCustomers = customers.filter(function(customer) {
        return customer.rank === "gold" || customer.rank === "diamond";
    });

    const lockedCustomers = customers.filter(function(customer) {
        return customer.status === "locked";
    });

    if (totalCustomerCount) {
        totalCustomerCount.textContent = customers.length;
    }

    if (activeCustomerCount) {
        activeCustomerCount.textContent = activeCustomers.length;
    }

    if (vipCustomerCount) {
        vipCustomerCount.textContent = vipCustomers.length;
    }

    if (lockedCustomerCount) {
        lockedCustomerCount.textContent = lockedCustomers.length;
    }
}

// 20. Lọc khách hàng
function getFilteredCustomers(customers) {
    const searchValue = customerSearchInput ? customerSearchInput.value.trim().toLowerCase() : "";
    const rankValue = customerRankFilter ? customerRankFilter.value : "all";
    const statusValue = customerStatusFilter ? customerStatusFilter.value : "all";

    return customers.filter(function(customer) {
        const fullName = customer.fullName.toLowerCase();
        const email = customer.email.toLowerCase();
        const phone = customer.phone.toLowerCase();
        const customerId = customer.id.toLowerCase();

        const matchSearch =
            fullName.includes(searchValue) ||
            email.includes(searchValue) ||
            phone.includes(searchValue) ||
            customerId.includes(searchValue);

        const matchRank =
            rankValue === "all" ||
            customer.rank === rankValue;

        const matchStatus =
            statusValue === "all" ||
            customer.status === statusValue;

        return matchSearch && matchRank && matchStatus;
    });
}

// 21. Render bảng khách hàng
function renderCustomerTable() {
    if (!customerTableBody || !customerRowTemplate) return;

    const customers = getCustomers();
    const filteredCustomers = getFilteredCustomers(customers);

    customerTableBody.innerHTML = "";

    if (emptyCustomerText) {
        emptyCustomerText.classList.toggle("show", filteredCustomers.length === 0);
    }

    filteredCustomers.forEach(function(customer) {
        const rowFragment = customerRowTemplate.content.cloneNode(true);
        const row = rowFragment.querySelector("tr");

        const rankInfo = getCustomerRankInfo(customer.rank);
        const statusInfo = getCustomerStatusInfo(customer.status);

        const customerAvatar = rowFragment.querySelector(".customerAvatarText");
        const rankBadge = rowFragment.querySelector(".customerRankText");
        const statusBadge = rowFragment.querySelector(".customerStatusText");

        row.dataset.customerId = customer.id;

        customerAvatar.textContent = getCustomerFirstLetter(customer.fullName);

        rowFragment.querySelector(".customerNameText").textContent = customer.fullName;
        rowFragment.querySelector(".customerCodeText").textContent = customer.id;
        rowFragment.querySelector(".customerEmailText").textContent = customer.email;
        rowFragment.querySelector(".customerPhoneText").textContent = customer.phone;
        rowFragment.querySelector(".customerRegisterDateText").textContent = formatDate(customer.registerDate);
        rowFragment.querySelector(".customerOrderCountText").textContent = customer.orderCount + " đơn";
        rowFragment.querySelector(".customerTotalSpentText").textContent = formatPrice(customer.totalSpent);

        rankBadge.textContent = rankInfo.text;
        rankBadge.classList.add(rankInfo.className);

        statusBadge.textContent = statusInfo.text;
        statusBadge.classList.add(statusInfo.className);

        customerTableBody.appendChild(rowFragment);
    });

    renderCustomerStats(customers);
}

// 22. Xóa khách hàng
function deleteCustomer(customerId) {
    const customers = getCustomers();

    const customer = customers.find(function(item) {
        return item.id === customerId;
    });

    if (!customer) return;

    const isConfirm = confirm("Bạn có chắc muốn xóa khách hàng " + customer.fullName + "?");

    if (!isConfirm) return;

    const updatedCustomers = customers.filter(function(item) {
        return item.id !== customerId;
    });

    saveCustomers(updatedCustomers);
    renderCustomerTable();
}

// 23. Chuyển sang trang dashboard khách hàng
function goToCustomerDetail(customerId) {
    if (!customerId) return;

    window.location.href = getAdminCustomerDetailUrl(customerId);
}

// 24. Xử lý thao tác bảng khách hàng
function handleCustomerTableAction(event) {
    const actionButton = event.target.closest("[data-action]");
    const row = event.target.closest("tr");

    if (!row) return;

    const customerId = row.dataset.customerId;

    if (actionButton) {
        event.stopPropagation();

        const action = actionButton.dataset.action;

        if (action === "delete") {
            deleteCustomer(customerId);
        }

        return;
    }

    goToCustomerDetail(customerId);
}

// 25. Gắn sự kiện trang khách hàng
function bindCustomerEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (customerTableBody) {
        customerTableBody.addEventListener("click", handleCustomerTableAction);
    }

    if (customerSearchInput) {
        customerSearchInput.addEventListener("input", renderCustomerTable);
    }

    if (customerRankFilter) {
        customerRankFilter.addEventListener("change", renderCustomerTable);
    }

    if (customerStatusFilter) {
        customerStatusFilter.addEventListener("change", renderCustomerTable);
    }
}

// 26. Khởi tạo trang quản lý khách hàng
function initAdminCustomersPage() {
    const adminUser = checkAdminLogin();

    if (!adminUser) return;

    renderAdminInfo(adminUser);
    renderCurrentDate();
    renderCustomerTable();
    bindCustomerEvents();
}

initAdminCustomersPage();