// =========================================================
// File: Frontend1/js/admin-customers.js
// Mục đích: Gắn trang quản lý khách hàng admin với API backend thật
// =========================================================


// 1. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");


// 2. Lấy element thống kê khách hàng
const totalCustomerCount = document.getElementById("totalCustomerCount");
const activeCustomerCount = document.getElementById("activeCustomerCount");
const vipCustomerCount = document.getElementById("vipCustomerCount");
const lockedCustomerCount = document.getElementById("lockedCustomerCount");


// 3. Lấy element bộ lọc và bảng khách hàng
const customerSearchInput = document.getElementById("customerSearchInput");
const customerRankFilter = document.getElementById("customerRankFilter");
const customerStatusFilter = document.getElementById("customerStatusFilter");
const customerTableBody = document.getElementById("customerTableBody");
const emptyCustomerText = document.getElementById("emptyCustomerText");
const customerRowTemplate = document.getElementById("customerRowTemplate");


// 4. Biến lưu dữ liệu khách hàng
let currentAdminUser = null;
let adminCustomers = [];
let customerSummary = null;


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
        return "Chưa có";
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
        return "K";
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


// 11. Lấy hạng khách hàng từ API
function getCustomerRankCode(customer) {
    if (customer.customer_profile && customer.customer_profile.membership_level) {
        return customer.customer_profile.membership_level;
    }

    if (customer.membership_level) {
        return customer.membership_level;
    }

    return "normal";
}


// 12. Lấy nhãn hạng khách hàng
function getCustomerRankInfo(rank) {
    if (rank === "silver") {
        return {
            text: "Bạc",
            className: "rankSilver"
        };
    }

    if (rank === "gold") {
        return {
            text: "Vàng",
            className: "rankGold"
        };
    }

    if (rank === "diamond") {
        return {
            text: "Kim cương",
            className: "rankDiamond"
        };
    }

    return {
        text: "Khách mới",
        className: "rankNew"
    };
}


// 13. Lấy trạng thái khách hàng
function getCustomerStatusCode(customer) {
    if (customer.status) {
        return customer.status;
    }

    return "active";
}


// 14. Lấy nhãn trạng thái khách hàng
function getCustomerStatusInfo(status) {
    if (status === "blocked") {
        return {
            text: "Bị khóa",
            className: "statusCancelled"
        };
    }

    if (status === "inactive") {
        return {
            text: "Tạm khóa",
            className: "statusCancelled"
        };
    }

    return {
        text: "Hoạt động",
        className: "statusActive"
    };
}


// 15. Lấy tổng đơn hàng của khách
function getCustomerOrderCount(customer) {
    if (customer.order_summary && customer.order_summary.total_orders !== undefined) {
        return Number(customer.order_summary.total_orders || 0);
    }

    return Number(customer.total_orders || 0);
}


// 16. Lấy tổng chi tiêu của khách
function getCustomerTotalSpent(customer) {
    if (customer.order_summary && customer.order_summary.total_spent !== undefined) {
        return Number(customer.order_summary.total_spent || 0);
    }

    return Number(customer.total_spent || 0);
}


// 17. Chuẩn hóa khách hàng từ API
function normalizeCustomer(customer) {
    const rank = getCustomerRankCode(customer);
    const status = getCustomerStatusCode(customer);

    return {
        id: customer.id,
        code: "KH" + String(customer.id).padStart(3, "0"),
        fullName: customer.full_name || customer.fullName || "Khách hàng",
        email: customer.email || "Chưa cập nhật",
        phone: customer.phone || "Chưa cập nhật",
        registerDate: customer.created_at || "",
        orderCount: getCustomerOrderCount(customer),
        totalSpent: getCustomerTotalSpent(customer),
        rank: rank,
        status: status,
        points: customer.customer_profile && customer.customer_profile.points_balance !== undefined
            ? Number(customer.customer_profile.points_balance || 0)
            : 0,
        raw: customer
    };
}


// 18. Render thống kê khách hàng
function renderCustomerStats() {
    const totalCustomers = customerSummary && customerSummary.total_customers !== undefined
        ? Number(customerSummary.total_customers || 0)
        : adminCustomers.length;

    const activeCustomers = customerSummary && customerSummary.active_customers !== undefined
        ? Number(customerSummary.active_customers || 0)
        : adminCustomers.filter(function (customer) {
            return customer.status === "active";
        }).length;

    const vipCustomers = adminCustomers.filter(function (customer) {
        return customer.rank === "gold" || customer.rank === "diamond";
    }).length;

    const lockedCustomers = customerSummary && customerSummary.inactive_customers !== undefined
        ? Number(customerSummary.inactive_customers || 0)
        : adminCustomers.filter(function (customer) {
            return customer.status !== "active";
        }).length;

    if (totalCustomerCount) {
        totalCustomerCount.textContent = totalCustomers;
    }

    if (activeCustomerCount) {
        activeCustomerCount.textContent = activeCustomers;
    }

    if (vipCustomerCount) {
        vipCustomerCount.textContent = vipCustomers;
    }

    if (lockedCustomerCount) {
        lockedCustomerCount.textContent = lockedCustomers;
    }
}


// 19. Lọc khách hàng trên frontend
function getFilteredCustomers() {
    const searchValue = customerSearchInput
        ? customerSearchInput.value.trim().toLowerCase()
        : "";

    const rankValue = customerRankFilter
        ? customerRankFilter.value
        : "all";

    const statusValue = customerStatusFilter
        ? customerStatusFilter.value
        : "all";

    return adminCustomers.filter(function (customer) {
        const fullName = customer.fullName.toLowerCase();
        const email = customer.email.toLowerCase();
        const phone = customer.phone.toLowerCase();
        const customerCode = customer.code.toLowerCase();

        const matchSearch =
            fullName.includes(searchValue) ||
            email.includes(searchValue) ||
            phone.includes(searchValue) ||
            customerCode.includes(searchValue);

        let matchRank = true;

        if (rankValue !== "all") {
            if (rankValue === "new") {
                matchRank = customer.rank === "normal";
            } else {
                matchRank = customer.rank === rankValue;
            }
        }

        let matchStatus = true;

        if (statusValue === "active") {
            matchStatus = customer.status === "active";
        }

        if (statusValue === "locked") {
            matchStatus = customer.status !== "active";
        }

        return matchSearch && matchRank && matchStatus;
    });
}


// 20. Tạo link chi tiết khách hàng
function getAdminCustomerDetailUrl(customerId) {
    return "../html/admin-customer-detail.html?id=" + encodeURIComponent(customerId);
}


// 21. Render một dòng khách hàng
function renderCustomerRow(customer) {
    const rowFragment = customerRowTemplate.content.cloneNode(true);
    const row = rowFragment.querySelector("tr");

    const rankInfo = getCustomerRankInfo(customer.rank);
    const statusInfo = getCustomerStatusInfo(customer.status);

    const customerAvatar = rowFragment.querySelector(".customerAvatarText");
    const customerNameText = rowFragment.querySelector(".customerNameText");
    const customerCodeText = rowFragment.querySelector(".customerCodeText");
    const customerEmailText = rowFragment.querySelector(".customerEmailText");
    const customerPhoneText = rowFragment.querySelector(".customerPhoneText");
    const customerRegisterDateText = rowFragment.querySelector(".customerRegisterDateText");
    const customerOrderCountText = rowFragment.querySelector(".customerOrderCountText");
    const customerTotalSpentText = rowFragment.querySelector(".customerTotalSpentText");
    const customerRankText = rowFragment.querySelector(".customerRankText");
    const customerStatusText = rowFragment.querySelector(".customerStatusText");
    const actionButton = rowFragment.querySelector("[data-action]");

    if (row) {
        row.dataset.customerId = customer.id;
        row.classList.add("clickableCustomerRow");
        row.title = "Nhấn để xem chi tiết khách hàng";
    }

    if (customerAvatar) {
        customerAvatar.textContent = getFirstLetter(customer.fullName);
    }

    if (customerNameText) {
        customerNameText.textContent = customer.fullName;
    }

    if (customerCodeText) {
        customerCodeText.textContent = customer.code;
    }

    if (customerEmailText) {
        customerEmailText.textContent = customer.email;
    }

    if (customerPhoneText) {
        customerPhoneText.textContent = customer.phone;
    }

    if (customerRegisterDateText) {
        customerRegisterDateText.textContent = formatDate(customer.registerDate);
    }

    if (customerOrderCountText) {
        customerOrderCountText.textContent = customer.orderCount + " đơn";
    }

    if (customerTotalSpentText) {
        customerTotalSpentText.textContent = formatPrice(customer.totalSpent);
    }

    if (customerRankText) {
        customerRankText.textContent = rankInfo.text;
        customerRankText.className = "customerRankText rankBadge";
        customerRankText.classList.add(rankInfo.className);
    }

    if (customerStatusText) {
        customerStatusText.textContent = statusInfo.text;
        customerStatusText.className = "customerStatusText statusBadge";
        customerStatusText.classList.add(statusInfo.className);
    }

    if (actionButton) {
        actionButton.textContent = customer.status === "active" ? "Khóa" : "Mở";
        actionButton.dataset.action = "toggle-status";
        actionButton.title = customer.status === "active"
            ? "Khóa tài khoản khách hàng"
            : "Mở lại tài khoản khách hàng";
    }

    return rowFragment;
}


// 22. Render bảng khách hàng
function renderCustomerTable() {
    if (!customerTableBody || !customerRowTemplate) {
        return;
    }

    const filteredCustomers = getFilteredCustomers();

    customerTableBody.innerHTML = "";

    if (emptyCustomerText) {
        emptyCustomerText.classList.toggle("show", filteredCustomers.length === 0);
    }

    filteredCustomers.forEach(function (customer) {
        const row = renderCustomerRow(customer);
        customerTableBody.appendChild(row);
    });

    renderCustomerStats();
}


// 23. Hiển thị loading
function setCustomerLoading(isLoading) {
    if (!customerTableBody) {
        return;
    }

    if (isLoading) {
        customerTableBody.innerHTML = `
            <tr>
                <td colspan="8">Đang tải danh sách khách hàng...</td>
            </tr>
        `;
    }
}


// 24. Hiển thị lỗi
function renderCustomerError(error) {
    console.error(error);

    if (customerTableBody) {
        customerTableBody.innerHTML = "";
    }

    if (emptyCustomerText) {
        emptyCustomerText.classList.add("show");
        emptyCustomerText.textContent = "Không tải được danh sách khách hàng.";
    }

    adminCustomers = [];
    customerSummary = null;
    renderCustomerStats();
}


// 25. Load danh sách khách hàng từ API
async function loadCustomersFromApi() {
    setCustomerLoading(true);

    const response = await window.AdminApi.get(
        "admin/customers/get-customers.php?page=1&limit=100&status=all&membership_level=all&sort=latest"
    );

    const data = response.data || {};
    const customers = Array.isArray(data.customers) ? data.customers : [];

    customerSummary = data.summary || null;

    adminCustomers = customers.map(function (customer) {
        return normalizeCustomer(customer);
    });

    renderCustomerTable();
}


// 26. Tìm khách hàng theo id
function getCustomerById(customerId) {
    return adminCustomers.find(function (customer) {
        return String(customer.id) === String(customerId);
    });
}


// 27. Cập nhật trạng thái khách hàng
async function toggleCustomerStatus(customerId) {
    const customer = getCustomerById(customerId);

    if (!customer) {
        return;
    }

    const newStatus = customer.status === "active" ? "blocked" : "active";
    const actionText = newStatus === "blocked" ? "khóa" : "mở lại";

    const isConfirm = confirm(
        "Bạn có chắc muốn " + actionText + " tài khoản khách hàng " + customer.fullName + " không?"
    );

    if (!isConfirm) {
        return;
    }

    try {
        await window.AdminApi.post("admin/customers/update-customer-status.php", {
            customer_id: Number(customerId),
            status: newStatus,
            note: "Admin cập nhật trạng thái khách hàng từ giao diện quản trị."
        });

        await loadCustomersFromApi();
    } catch (error) {
        alert(
            window.AdminApi.getApiErrorMessage(
                error,
                "Cập nhật trạng thái khách hàng thất bại."
            )
        );
    }
}


// 28. Chuyển sang trang chi tiết khách hàng
function goToCustomerDetail(customerId) {
    if (!customerId) {
        return;
    }

    window.location.href = getAdminCustomerDetailUrl(customerId);
}


// 29. Xử lý thao tác bảng khách hàng
function handleCustomerTableAction(event) {
    const actionButton = event.target.closest("[data-action]");
    const row = event.target.closest("tr");

    if (!row) {
        return;
    }

    const customerId = row.dataset.customerId;

    if (actionButton) {
        event.stopPropagation();

        const action = actionButton.dataset.action;

        if (action === "toggle-status") {
            toggleCustomerStatus(customerId);
        }

        return;
    }

    goToCustomerDetail(customerId);
}


// 30. Xử lý đăng xuất
function handleAdminLogout() {
    if (window.AdminApi && window.AdminApi.logoutAdmin) {
        window.AdminApi.logoutAdmin();
        return;
    }

    localStorage.removeItem("admin_current_user");
    localStorage.removeItem("admin_is_login");
    window.location.href = "../html/admin-login.html";
}


// 31. Gắn sự kiện trang khách hàng
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


// 32. Kiểm tra đăng nhập local
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


// 33. Khởi tạo trang quản lý khách hàng
async function initAdminCustomersPage() {
    currentAdminUser = checkAdminLoginLocal();

    if (!currentAdminUser) {
        return;
    }

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    bindCustomerEvents();

    try {
        await loadCustomersFromApi();
    } catch (error) {
        if (error && error.status === 401) {
            window.AdminApi.clearAdminLocalAuth();
            window.location.href = "../html/admin-login.html";
            return;
        }

        renderCustomerError(error);
    }
}

initAdminCustomersPage();