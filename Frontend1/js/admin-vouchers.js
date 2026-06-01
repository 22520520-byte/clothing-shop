// =========================================================
// File: Frontend1/js/admin-vouchers.js
// Mục đích: Gắn trang quản lý voucher admin với API backend thật
// =========================================================


// 1. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");


// 2. Lấy element thống kê
const totalVoucherCount = document.getElementById("totalVoucherCount");
const activeVoucherCount = document.getElementById("activeVoucherCount");
const pointVoucherCount = document.getElementById("pointVoucherCount");
const outVoucherCount = document.getElementById("outVoucherCount");


// 3. Lấy element bộ lọc và bảng
const voucherSearchInput = document.getElementById("voucherSearchInput");
const voucherTypeFilter = document.getElementById("voucherTypeFilter");
const voucherStatusFilter = document.getElementById("voucherStatusFilter");
const voucherTableBody = document.getElementById("voucherTableBody");
const emptyVoucherText = document.getElementById("emptyVoucherText");
const voucherRowTemplate = document.getElementById("voucherRowTemplate");


// 4. Lấy element nút thêm voucher
const openAddVoucherBtn = document.getElementById("openAddVoucherBtn");


// 5. Biến lưu dữ liệu voucher
let currentAdminUser = null;
let adminVouchers = [];
let voucherSummary = null;


// 6. Format tiền Việt Nam
function formatPrice(price) {
    if (window.AdminApi && window.AdminApi.formatPrice) {
        return window.AdminApi.formatPrice(price);
    }

    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}


// 7. Format số điểm
function formatPoint(point) {
    return Number(point || 0).toLocaleString("vi-VN") + " điểm";
}


// 8. Format ngày Việt Nam
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


// 9. Render ngày hiện tại
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


// 10. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) {
        return "A";
    }

    return String(text).trim().charAt(0).toUpperCase();
}


// 11. Lấy nhãn vai trò admin
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


// 12. Hiển thị thông tin admin
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


// 13. Lấy loại voucher chuẩn từ API
function getVoucherTypeCode(voucher) {
    if (voucher.discount_type === "freeship") {
        return "free-ship";
    }

    return voucher.discount_type || "fixed";
}


// 14. Lấy trạng thái tính toán của voucher
function getVoucherComputedStatus(voucher) {
    if (voucher.state && voucher.state.code) {
        if (voucher.state.code === "available") {
            return "active";
        }

        if (voucher.state.code === "not_started") {
            return "scheduled";
        }

        if (voucher.state.code === "out_of_quantity") {
            return "out";
        }

        if (voucher.state.code === "expired") {
            return "expired";
        }

        if (voucher.state.code === "inactive") {
            return "disabled";
        }
    }

    if (voucher.status === "inactive") {
        return "disabled";
    }

    const now = new Date();
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);
    const remainingQuantity = Number(voucher.remaining_quantity || 0);

    if (remainingQuantity <= 0) {
        return "out";
    }

    if (!Number.isNaN(startDate.getTime()) && now < startDate) {
        return "scheduled";
    }

    if (!Number.isNaN(endDate.getTime()) && now > endDate) {
        return "expired";
    }

    return "active";
}


// 15. Lấy thông tin trạng thái voucher
function getVoucherStatusInfo(voucher) {
    const computedStatus = getVoucherComputedStatus(voucher);

    if (computedStatus === "active") {
        return {
            text: "Đang hiệu lực",
            className: "statusActive"
        };
    }

    if (computedStatus === "scheduled") {
        return {
            text: "Sắp diễn ra",
            className: "statusShipping"
        };
    }

    if (computedStatus === "expired") {
        return {
            text: "Hết hạn",
            className: "statusCancelled"
        };
    }

    if (computedStatus === "out") {
        return {
            text: "Hết lượt",
            className: "statusPending"
        };
    }

    if (computedStatus === "disabled") {
        return {
            text: "Đã tắt",
            className: "statusCancelled"
        };
    }

    return {
        text: "Đang hiệu lực",
        className: "statusActive"
    };
}


// 16. Lấy thông tin loại voucher
function getVoucherTypeInfo(type) {
    if (type === "percent") {
        return {
            text: "Phần trăm",
            className: "voucherTypePercent"
        };
    }

    if (type === "fixed") {
        return {
            text: "Giảm tiền",
            className: "voucherTypeFixed"
        };
    }

    if (type === "free-ship" || type === "freeship") {
        return {
            text: "Freeship",
            className: "voucherTypeFreeShip"
        };
    }

    if (type === "point") {
        return {
            text: "Đổi điểm",
            className: "voucherTypePoint"
        };
    }

    return {
        text: "Giảm tiền",
        className: "voucherTypeFixed"
    };
}


// 17. Format giá trị voucher
function formatVoucherValue(voucher) {
    if (voucher.type === "percent") {
        return Number(voucher.value || 0) + "%";
    }

    if (voucher.type === "free-ship") {
        if (voucher.maxDiscountAmount > 0) {
            return "Tối đa " + formatPrice(voucher.maxDiscountAmount);
        }

        return "Miễn phí vận chuyển";
    }

    return formatPrice(voucher.value);
}


// 18. Chuẩn hóa voucher từ API
function normalizeVoucher(voucher) {
    const type = getVoucherTypeCode(voucher);
    const quantity = Number(voucher.quantity || 0);
    const usedQuantity = Number(voucher.used_quantity || 0);
    const remainingQuantity = voucher.remaining_quantity !== undefined
        ? Number(voucher.remaining_quantity || 0)
        : Math.max(quantity - usedQuantity, 0);

    return {
        id: Number(voucher.id || 0),
        code: voucher.code || "",
        name: voucher.name || "Voucher",
        description: voucher.description || "Không có mô tả",

        type: type,
        value: Number(voucher.discount_value || 0),
        discountLabel: voucher.discount_label || "",
        maxDiscountAmount: voucher.max_discount_amount !== null && voucher.max_discount_amount !== undefined
            ? Number(voucher.max_discount_amount || 0)
            : 0,

        pointCost: 0,
        minOrder: Number(voucher.min_order_value || 0),

        quantity: quantity,
        usedQuantity: usedQuantity,
        remainingQuantity: remainingQuantity,
        usageLimitPerUser: Number(voucher.usage_limit_per_user || 1),

        startDate: voucher.start_date || "",
        endDate: voucher.end_date || "",
        status: voucher.status || "active",
        state: voucher.state || null,

        raw: voucher
    };
}


// 19. Render thống kê voucher
function renderVoucherStats() {
    const totalVouchers = voucherSummary && voucherSummary.total_vouchers !== undefined
        ? Number(voucherSummary.total_vouchers || 0)
        : adminVouchers.length;

    const activeVouchers = voucherSummary && voucherSummary.available_vouchers !== undefined
        ? Number(voucherSummary.available_vouchers || 0)
        : adminVouchers.filter(function (voucher) {
            return getVoucherComputedStatus(voucher) === "active";
        }).length;

    const pointVouchers = adminVouchers.filter(function (voucher) {
        return voucher.type === "point";
    }).length;

    const outVouchers = voucherSummary && voucherSummary.out_of_quantity_vouchers !== undefined
        ? Number(voucherSummary.out_of_quantity_vouchers || 0)
        : adminVouchers.filter(function (voucher) {
            return getVoucherComputedStatus(voucher) === "out";
        }).length;

    if (totalVoucherCount) {
        totalVoucherCount.textContent = totalVouchers;
    }

    if (activeVoucherCount) {
        activeVoucherCount.textContent = activeVouchers;
    }

    if (pointVoucherCount) {
        pointVoucherCount.textContent = pointVouchers;
    }

    if (outVoucherCount) {
        outVoucherCount.textContent = outVouchers;
    }
}


// 20. Lọc voucher trên frontend
function getFilteredVouchers() {
    const searchValue = voucherSearchInput
        ? voucherSearchInput.value.trim().toLowerCase()
        : "";

    const typeValue = voucherTypeFilter
        ? voucherTypeFilter.value
        : "all";

    const statusValue = voucherStatusFilter
        ? voucherStatusFilter.value
        : "all";

    return adminVouchers.filter(function (voucher) {
        const code = String(voucher.code || "").toLowerCase();
        const name = String(voucher.name || "").toLowerCase();
        const description = String(voucher.description || "").toLowerCase();

        const matchSearch =
            code.includes(searchValue) ||
            name.includes(searchValue) ||
            description.includes(searchValue);

        let matchType = true;

        if (typeValue !== "all") {
            matchType = voucher.type === typeValue;
        }

        let matchStatus = true;

        if (statusValue !== "all") {
            matchStatus = getVoucherComputedStatus(voucher) === statusValue;
        }

        return matchSearch && matchType && matchStatus;
    });
}


// 21. Render một dòng voucher
function renderVoucherRow(voucher) {
    const rowFragment = voucherRowTemplate.content.cloneNode(true);
    const row = rowFragment.querySelector("tr");

    const typeInfo = getVoucherTypeInfo(voucher.type);
    const statusInfo = getVoucherStatusInfo(voucher);

    const voucherCodeText = rowFragment.querySelector(".voucherCodeText");
    const voucherIdText = rowFragment.querySelector(".voucherIdText");
    const voucherNameText = rowFragment.querySelector(".voucherNameText");
    const voucherDescriptionText = rowFragment.querySelector(".voucherDescriptionText");
    const voucherTypeText = rowFragment.querySelector(".voucherTypeText");
    const voucherValueText = rowFragment.querySelector(".voucherValueText");
    const voucherPointCostText = rowFragment.querySelector(".voucherPointCostText");
    const voucherMinOrderText = rowFragment.querySelector(".voucherMinOrderText");
    const voucherQuantityText = rowFragment.querySelector(".voucherQuantityText");
    const voucherDateText = rowFragment.querySelector(".voucherDateText");
    const voucherStatusText = rowFragment.querySelector(".voucherStatusText");
    const actionButton = rowFragment.querySelector("[data-action]");

    if (row) {
        row.dataset.voucherId = voucher.id;
        row.classList.add("clickableVoucherRow");
        row.title = "Nhấn để xem và chỉnh sửa voucher";
    }

    if (voucherCodeText) {
        voucherCodeText.textContent = voucher.code;
    }

    if (voucherIdText) {
        voucherIdText.textContent = "VC" + String(voucher.id).padStart(3, "0");
    }

    if (voucherNameText) {
        voucherNameText.textContent = voucher.name;
    }

    if (voucherDescriptionText) {
        voucherDescriptionText.textContent = voucher.description || "Không có mô tả";
    }

    if (voucherTypeText) {
        voucherTypeText.textContent = typeInfo.text;
        voucherTypeText.className = "voucherTypeBadge voucherTypeText";
        voucherTypeText.classList.add(typeInfo.className);
    }

    if (voucherValueText) {
        voucherValueText.textContent = formatVoucherValue(voucher);
    }

    if (voucherPointCostText) {
        voucherPointCostText.textContent = voucher.type === "point"
            ? formatPoint(voucher.pointCost)
            : "-";
    }

    if (voucherMinOrderText) {
        voucherMinOrderText.textContent = formatPrice(voucher.minOrder);
    }

    if (voucherQuantityText) {
        voucherQuantityText.textContent =
            voucher.remainingQuantity + "/" + voucher.quantity + " lượt";
    }

    if (voucherDateText) {
        voucherDateText.textContent =
            formatDate(voucher.startDate) + " - " + formatDate(voucher.endDate);
    }

    if (voucherStatusText) {
        voucherStatusText.textContent = statusInfo.text;
        voucherStatusText.className = "statusBadge voucherStatusText";
        voucherStatusText.classList.add(statusInfo.className);
    }

    if (actionButton) {
        actionButton.textContent = voucher.status === "active" ? "Tắt" : "Bật";
        actionButton.dataset.action = "toggle-status";
        actionButton.title = voucher.status === "active"
            ? "Tắt voucher"
            : "Bật voucher";
    }

    return rowFragment;
}


// 22. Render bảng voucher
function renderVoucherTable() {
    if (!voucherTableBody || !voucherRowTemplate) {
        return;
    }

    const filteredVouchers = getFilteredVouchers();

    voucherTableBody.innerHTML = "";

    if (emptyVoucherText) {
        emptyVoucherText.classList.toggle("show", filteredVouchers.length === 0);
    }

    filteredVouchers.forEach(function (voucher) {
        const row = renderVoucherRow(voucher);
        voucherTableBody.appendChild(row);
    });

    renderVoucherStats();
}


// 23. Hiển thị loading
function setVoucherLoading(isLoading) {
    if (!voucherTableBody) {
        return;
    }

    if (isLoading) {
        voucherTableBody.innerHTML = `
            <tr>
                <td colspan="10">Đang tải danh sách voucher...</td>
            </tr>
        `;
    }
}


// 24. Hiển thị lỗi
function renderVoucherError(error) {
    console.error(error);

    if (voucherTableBody) {
        voucherTableBody.innerHTML = "";
    }

    if (emptyVoucherText) {
        emptyVoucherText.classList.add("show");
        emptyVoucherText.textContent = "Không tải được danh sách voucher.";
    }

    adminVouchers = [];
    voucherSummary = null;
    renderVoucherStats();
}


// 25. Load danh sách voucher từ API
async function loadVouchersFromApi() {
    setVoucherLoading(true);

    const response = await window.AdminApi.get(
        "admin/vouchers/get-vouchers.php?page=1&limit=100&discount_type=all&status=all&state=all&sort=latest"
    );

    const data = response.data || {};
    const vouchers = Array.isArray(data.vouchers) ? data.vouchers : [];

    voucherSummary = data.summary || null;

    adminVouchers = vouchers.map(function (voucher) {
        return normalizeVoucher(voucher);
    });

    renderVoucherTable();
}


// 26. Tìm voucher theo id
function getVoucherById(voucherId) {
    return adminVouchers.find(function (voucher) {
        return String(voucher.id) === String(voucherId);
    });
}


// 27. Chuyển sang trang chi tiết voucher
function goToVoucherDetail(voucherId) {
    if (!voucherId) {
        return;
    }

    window.location.href = "../html/admin-voucher-detail.html?id=" + encodeURIComponent(voucherId);
}


// 28. Cập nhật trạng thái voucher
async function toggleVoucherStatus(voucherId) {
    const voucher = getVoucherById(voucherId);

    if (!voucher) {
        return;
    }

    const newStatus = voucher.status === "active" ? "inactive" : "active";
    const actionText = newStatus === "inactive" ? "tắt" : "bật";

    const isConfirm = confirm(
        "Bạn có chắc muốn " + actionText + " voucher " + voucher.code + " không?"
    );

    if (!isConfirm) {
        return;
    }

    try {
        await window.AdminApi.post("admin/vouchers/update-voucher-status.php", {
            voucher_id: Number(voucherId),
            status: newStatus
        });

        await loadVouchersFromApi();
    } catch (error) {
        alert(
            window.AdminApi.getApiErrorMessage(
                error,
                "Cập nhật trạng thái voucher thất bại."
            )
        );
    }
}


// 29. Xử lý thao tác bảng voucher
function handleVoucherTableAction(event) {
    const actionButton = event.target.closest("[data-action]");
    const row = event.target.closest("tr");

    if (!row) {
        return;
    }

    const voucherId = row.dataset.voucherId;

    if (actionButton) {
        event.stopPropagation();

        const action = actionButton.dataset.action;

        if (action === "toggle-status") {
            toggleVoucherStatus(voucherId);
        }

        return;
    }

    goToVoucherDetail(voucherId);
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


// 31. Gắn sự kiện trang voucher
function bindVoucherEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (voucherTableBody) {
        voucherTableBody.addEventListener("click", handleVoucherTableAction);
    }

    if (voucherSearchInput) {
        voucherSearchInput.addEventListener("input", renderVoucherTable);
    }

    if (voucherTypeFilter) {
        voucherTypeFilter.addEventListener("change", renderVoucherTable);
    }

    if (voucherStatusFilter) {
        voucherStatusFilter.addEventListener("change", renderVoucherTable);
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


// 33. Khởi tạo trang quản lý voucher
async function initAdminVouchersPage() {
    currentAdminUser = checkAdminLoginLocal();

    if (!currentAdminUser) {
        return;
    }

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    bindVoucherEvents();

    try {
        await loadVouchersFromApi();
    } catch (error) {
        if (error && error.status === 401) {
            window.AdminApi.clearAdminLocalAuth();
            window.location.href = "../html/admin-login.html";
            return;
        }

        renderVoucherError(error);
    }
}

initAdminVouchersPage();