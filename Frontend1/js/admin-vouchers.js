// 1. Khai báo key localStorage
const ADMIN_CURRENT_USER_KEY = "admin_current_user";
const ADMIN_IS_LOGIN_KEY = "admin_is_login";
const ADMIN_VOUCHERS_KEY = "admin_vouchers";

// 2. Dữ liệu voucher mẫu
const demoAdminVouchers = [
    {
        id: "VC001",
        code: "SALE10",
        name: "Giảm 10% cho đơn đầu tiên",
        type: "percent",
        value: 10,
        pointCost: 0,
        minOrder: 300000,
        quantity: 100,
        startDate: "2026-05-01",
        endDate: "2026-06-30",
        status: "enabled",
        description: "Áp dụng cho khách hàng mới hoặc đơn hàng đầu tiên."
    },
    {
        id: "VC002",
        code: "GIAM50K",
        name: "Giảm 50.000đ",
        type: "fixed",
        value: 50000,
        pointCost: 0,
        minOrder: 500000,
        quantity: 45,
        startDate: "2026-05-10",
        endDate: "2026-06-10",
        status: "enabled",
        description: "Giảm trực tiếp 50.000đ cho đơn từ 500.000đ."
    },
    {
        id: "VC003",
        code: "FREESHIP",
        name: "Miễn phí vận chuyển",
        type: "free-ship",
        value: 30000,
        pointCost: 0,
        minOrder: 250000,
        quantity: 0,
        startDate: "2026-05-01",
        endDate: "2026-06-15",
        status: "enabled",
        description: "Hỗ trợ phí vận chuyển tối đa 30.000đ."
    },
    {
        id: "VC004",
        code: "POINT20",
        name: "Voucher giảm 20.000đ",
        type: "point",
        value: 20000,
        pointCost: 500,
        minOrder: 200000,
        quantity: 80,
        startDate: "2026-05-01",
        endDate: "2026-07-01",
        status: "enabled",
        description: "Khách hàng dùng 500 điểm để đổi voucher giảm 20.000đ."
    },
    {
        id: "VC005",
        code: "POINT50",
        name: "Voucher giảm 50.000đ",
        type: "point",
        value: 50000,
        pointCost: 1000,
        minOrder: 500000,
        quantity: 50,
        startDate: "2026-05-01",
        endDate: "2026-07-01",
        status: "enabled",
        description: "Khách hàng dùng 1000 điểm để đổi voucher giảm 50.000đ."
    },
    {
        id: "VC006",
        code: "POINTSHIP",
        name: "Freeship 30.000đ",
        type: "point",
        value: 30000,
        pointCost: 400,
        minOrder: 300000,
        quantity: 60,
        startDate: "2026-05-01",
        endDate: "2026-07-01",
        status: "enabled",
        description: "Khách hàng dùng 400 điểm để đổi ưu đãi freeship 30.000đ."
    },
    {
        id: "VC007",
        code: "OLD20",
        name: "Voucher cũ tháng trước",
        type: "percent",
        value: 20,
        pointCost: 0,
        minOrder: 400000,
        quantity: 12,
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        status: "enabled",
        description: "Voucher đã hết hạn."
    }
];

// 3. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

// 4. Lấy element thống kê
const totalVoucherCount = document.getElementById("totalVoucherCount");
const activeVoucherCount = document.getElementById("activeVoucherCount");
const pointVoucherCount = document.getElementById("pointVoucherCount");
const outVoucherCount = document.getElementById("outVoucherCount");

// 5. Lấy element bộ lọc và bảng
const voucherSearchInput = document.getElementById("voucherSearchInput");
const voucherTypeFilter = document.getElementById("voucherTypeFilter");
const voucherStatusFilter = document.getElementById("voucherStatusFilter");
const voucherTableBody = document.getElementById("voucherTableBody");
const emptyVoucherText = document.getElementById("emptyVoucherText");
const voucherRowTemplate = document.getElementById("voucherRowTemplate");

// 6. Lấy element nút thêm voucher
const openAddVoucherBtn = document.getElementById("openAddVoucherBtn");

// 7. Biến lưu admin hiện tại
let currentAdminUser = null;

// 8. Format tiền Việt Nam
function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}

// 9. Format số điểm
function formatPoint(point) {
    return Number(point || 0).toLocaleString("vi-VN") + " điểm";
}

// 10. Format ngày Việt Nam
function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN");
}

// 11. Render ngày hiện tại
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

// 12. Kiểm tra đăng nhập admin
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

// 13. Hiển thị thông tin admin
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

    if (adminUser.role !== "owner" && openAddVoucherBtn) {
        openAddVoucherBtn.style.display = "none";
    }
}

// 14. Đăng xuất admin
function handleAdminLogout() {
    localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
    localStorage.removeItem(ADMIN_IS_LOGIN_KEY);

    window.location.href = "../html/admin-login.html";
}

// 15. Lấy ngày hôm nay dạng YYYY-MM-DD
function getTodayString() {
    return new Date().toISOString().slice(0, 10);
}

// 16. Chuẩn hóa voucher
function normalizeVoucher(voucher, index) {
    const defaultVoucher = demoAdminVouchers[index] || demoAdminVouchers[0];

    return {
        id: voucher.id || "VC" + String(index + 1).padStart(3, "0"),
        code: voucher.code || defaultVoucher.code || "",
        name: voucher.name || defaultVoucher.name || "",
        type: voucher.type || defaultVoucher.type || "fixed",
        value: Number(voucher.value || 0),
        pointCost: Number(voucher.pointCost || 0),
        minOrder: Number(voucher.minOrder || 0),
        quantity: Number(voucher.quantity || 0),
        startDate: voucher.startDate || defaultVoucher.startDate || getTodayString(),
        endDate: voucher.endDate || defaultVoucher.endDate || getTodayString(),
        status: voucher.status || "enabled",
        description: voucher.description || ""
    };
}

// 17. Lấy danh sách voucher
function getVouchers() {
    const savedVouchers = localStorage.getItem(ADMIN_VOUCHERS_KEY);

    if (!savedVouchers) {
        const normalizedDemoVouchers = demoAdminVouchers.map(function(voucher, index) {
            return normalizeVoucher(voucher, index);
        });

        localStorage.setItem(ADMIN_VOUCHERS_KEY, JSON.stringify(normalizedDemoVouchers));

        return normalizedDemoVouchers;
    }

    try {
        const vouchers = JSON.parse(savedVouchers);

        const normalizedVouchers = vouchers.map(function(voucher, index) {
            return normalizeVoucher(voucher, index);
        });

        localStorage.setItem(ADMIN_VOUCHERS_KEY, JSON.stringify(normalizedVouchers));

        return normalizedVouchers;
    } catch (error) {
        const normalizedDemoVouchers = demoAdminVouchers.map(function(voucher, index) {
            return normalizeVoucher(voucher, index);
        });

        localStorage.setItem(ADMIN_VOUCHERS_KEY, JSON.stringify(normalizedDemoVouchers));

        return normalizedDemoVouchers;
    }
}

// 18. Lưu danh sách voucher
function saveVouchers(vouchers) {
    localStorage.setItem(ADMIN_VOUCHERS_KEY, JSON.stringify(vouchers));
}

// 19. Tìm voucher theo id
function getVoucherById(id) {
    const vouchers = getVouchers();

    return vouchers.find(function(voucher) {
        return voucher.id === id;
    });
}

// 20. Lấy trạng thái tính toán của voucher
function getVoucherComputedStatus(voucher) {
    const today = getTodayString();

    if (voucher.status === "disabled") {
        return "disabled";
    }

    if (voucher.quantity <= 0) {
        return "out";
    }

    if (voucher.startDate > today) {
        return "scheduled";
    }

    if (voucher.endDate < today) {
        return "expired";
    }

    return "active";
}

// 21. Lấy thông tin trạng thái voucher
function getVoucherStatusInfo(voucher) {
    const computedStatus = getVoucherComputedStatus(voucher);

    switch (computedStatus) {
        case "active":
            return {
                text: "Đang hiệu lực",
                className: "statusActive"
            };

        case "scheduled":
            return {
                text: "Sắp diễn ra",
                className: "statusShipping"
            };

        case "expired":
            return {
                text: "Hết hạn",
                className: "statusCancelled"
            };

        case "out":
            return {
                text: "Hết lượt",
                className: "statusPending"
            };

        case "disabled":
            return {
                text: "Đã tắt",
                className: "statusCancelled"
            };

        default:
            return {
                text: "Đang hiệu lực",
                className: "statusActive"
            };
    }
}

// 22. Lấy thông tin loại voucher
function getVoucherTypeInfo(type) {
    switch (type) {
        case "percent":
            return {
                text: "Phần trăm",
                className: "voucherTypePercent"
            };

        case "fixed":
            return {
                text: "Giảm tiền",
                className: "voucherTypeFixed"
            };

        case "free-ship":
            return {
                text: "Freeship",
                className: "voucherTypeFreeShip"
            };

        case "point":
            return {
                text: "Đổi điểm",
                className: "voucherTypePoint"
            };

        default:
            return {
                text: "Giảm tiền",
                className: "voucherTypeFixed"
            };
    }
}

// 23. Format giá trị voucher
function formatVoucherValue(voucher) {
    if (voucher.type === "percent") {
        return Number(voucher.value || 0) + "%";
    }

    if (voucher.type === "free-ship") {
        return "Tối đa " + formatPrice(voucher.value);
    }

    return formatPrice(voucher.value);
}

// 24. Render thống kê voucher
function renderVoucherStats(vouchers) {
    const activeVouchers = vouchers.filter(function(voucher) {
        return getVoucherComputedStatus(voucher) === "active";
    });

    const pointVouchers = vouchers.filter(function(voucher) {
        return voucher.type === "point";
    });

    const outVouchers = vouchers.filter(function(voucher) {
        return getVoucherComputedStatus(voucher) === "out";
    });

    if (totalVoucherCount) {
        totalVoucherCount.textContent = vouchers.length;
    }

    if (activeVoucherCount) {
        activeVoucherCount.textContent = activeVouchers.length;
    }

    if (pointVoucherCount) {
        pointVoucherCount.textContent = pointVouchers.length;
    }

    if (outVoucherCount) {
        outVoucherCount.textContent = outVouchers.length;
    }
}

// 25. Lọc voucher
function getFilteredVouchers(vouchers) {
    const searchValue = voucherSearchInput ? voucherSearchInput.value.trim().toLowerCase() : "";
    const typeValue = voucherTypeFilter ? voucherTypeFilter.value : "all";
    const statusValue = voucherStatusFilter ? voucherStatusFilter.value : "all";

    return vouchers.filter(function(voucher) {
        const code = voucher.code.toLowerCase();
        const name = voucher.name.toLowerCase();
        const description = voucher.description.toLowerCase();

        const matchSearch =
            code.includes(searchValue) ||
            name.includes(searchValue) ||
            description.includes(searchValue);

        const matchType =
            typeValue === "all" ||
            voucher.type === typeValue;

        const computedStatus = getVoucherComputedStatus(voucher);

        const matchStatus =
            statusValue === "all" ||
            computedStatus === statusValue;

        return matchSearch && matchType && matchStatus;
    });
}

// 26. Render bảng voucher
function renderVoucherTable() {
    if (!voucherTableBody || !voucherRowTemplate) return;

    const vouchers = getVouchers();
    const filteredVouchers = getFilteredVouchers(vouchers);

    voucherTableBody.innerHTML = "";

    if (emptyVoucherText) {
        emptyVoucherText.classList.toggle("show", filteredVouchers.length === 0);
    }

    filteredVouchers.forEach(function(voucher) {
        const rowFragment = voucherRowTemplate.content.cloneNode(true);
        const row = rowFragment.querySelector("tr");
        const typeInfo = getVoucherTypeInfo(voucher.type);
        const statusInfo = getVoucherStatusInfo(voucher);
        const typeBadge = rowFragment.querySelector(".voucherTypeText");
        const statusBadge = rowFragment.querySelector(".voucherStatusText");
        const deleteButton = rowFragment.querySelector("[data-action='delete']");

        row.dataset.voucherId = voucher.id;

        if (currentAdminUser && currentAdminUser.role === "owner") {
            row.classList.add("clickableVoucherRow");
            row.title = "Nhấn để xem và chỉnh sửa voucher";
        }

        rowFragment.querySelector(".voucherCodeText").textContent = voucher.code;
        rowFragment.querySelector(".voucherIdText").textContent = voucher.id;
        rowFragment.querySelector(".voucherNameText").textContent = voucher.name;
        rowFragment.querySelector(".voucherDescriptionText").textContent = voucher.description || "Không có mô tả";
        rowFragment.querySelector(".voucherValueText").textContent = formatVoucherValue(voucher);
        rowFragment.querySelector(".voucherPointCostText").textContent = voucher.type === "point" ? formatPoint(voucher.pointCost) : "-";
        rowFragment.querySelector(".voucherMinOrderText").textContent = formatPrice(voucher.minOrder);
        rowFragment.querySelector(".voucherQuantityText").textContent = voucher.quantity + " lượt";
        rowFragment.querySelector(".voucherDateText").textContent = formatDate(voucher.startDate) + " - " + formatDate(voucher.endDate);

        typeBadge.textContent = typeInfo.text;
        typeBadge.classList.add(typeInfo.className);

        statusBadge.textContent = statusInfo.text;
        statusBadge.classList.add(statusInfo.className);

        if (currentAdminUser && currentAdminUser.role !== "owner") {
            if (deleteButton) {
                deleteButton.style.display = "none";
            }
        }

        voucherTableBody.appendChild(rowFragment);
    });

    renderVoucherStats(vouchers);
}

// 27. Chuyển sang trang chi tiết voucher
function goToVoucherDetail(voucherId) {
    if (!voucherId) return;

    if (!currentAdminUser || currentAdminUser.role !== "owner") {
        return;
    }

    window.location.href = "../html/admin-voucher-detail.html?id=" + encodeURIComponent(voucherId);
}

// 28. Xóa voucher
function deleteVoucher(id) {
    const vouchers = getVouchers();
    const voucher = getVoucherById(id);

    if (!voucher) return;

    const isConfirm = confirm("Bạn có chắc muốn xóa voucher " + voucher.code + "?");

    if (!isConfirm) return;

    const updatedVouchers = vouchers.filter(function(item) {
        return item.id !== id;
    });

    saveVouchers(updatedVouchers);
    renderVoucherTable();
}

// 29. Xử lý thao tác bảng voucher
function handleVoucherTableAction(event) {
    const actionButton = event.target.closest("[data-action]");
    const row = event.target.closest("tr");

    if (!row) return;

    const id = row.dataset.voucherId;

    if (actionButton) {
        event.stopPropagation();

        const action = actionButton.dataset.action;

        if (action === "delete") {
            deleteVoucher(id);
        }

        return;
    }

    goToVoucherDetail(id);
}

// 30. Gắn sự kiện trang voucher
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

// 31. Khởi tạo trang quản lý voucher
function initAdminVouchersPage() {
    currentAdminUser = checkAdminLogin();

    if (!currentAdminUser) return;

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    renderVoucherTable();
    bindVoucherEvents();
}

initAdminVouchersPage();