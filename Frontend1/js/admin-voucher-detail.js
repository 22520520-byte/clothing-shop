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

// 4. Lấy element tiêu đề trang
const voucherDetailTitle = document.getElementById("voucherDetailTitle");
const voucherDetailSubtitle = document.getElementById("voucherDetailSubtitle");
const voucherFormTitle = document.getElementById("voucherFormTitle");

// 5. Lấy element form voucher
const voucherDetailForm = document.getElementById("voucherDetailForm");
const voucherFormMessage = document.getElementById("voucherFormMessage");
const voucherId = document.getElementById("voucherId");
const voucherCode = document.getElementById("voucherCode");
const voucherName = document.getElementById("voucherName");
const voucherType = document.getElementById("voucherType");
const voucherValue = document.getElementById("voucherValue");
const voucherPointGroup = document.getElementById("voucherPointGroup");
const voucherPointCost = document.getElementById("voucherPointCost");
const voucherMinOrder = document.getElementById("voucherMinOrder");
const voucherQuantity = document.getElementById("voucherQuantity");
const voucherStartDate = document.getElementById("voucherStartDate");
const voucherEndDate = document.getElementById("voucherEndDate");
const voucherStatus = document.getElementById("voucherStatus");
const voucherDescription = document.getElementById("voucherDescription");

// 6. Lấy element trạng thái trang
const voucherDetailLayout = document.getElementById("voucherDetailLayout");
const voucherNotFoundBox = document.getElementById("voucherNotFoundBox");

// 7. Biến lưu trạng thái trang
let currentAdminUser = null;
let currentVoucherId = null;
let isEditMode = false;

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

// 9. Lấy ngày hôm nay dạng YYYY-MM-DD
function getTodayString() {
    return new Date().toISOString().slice(0, 10);
}

// 10. Lấy id voucher từ URL
function getVoucherIdFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return params.get("id");
}

// 11. Kiểm tra đăng nhập admin
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

// 12. Hiển thị thông tin admin
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

// 13. Kiểm tra quyền chỉnh sửa voucher
function checkVoucherPermission(adminUser) {
    if (!adminUser) return false;

    if (adminUser.role !== "owner") {
        alert("Bạn không có quyền thêm hoặc chỉnh sửa voucher.");
        window.location.href = "../html/admin-vouchers.html";
        return false;
    }

    return true;
}

// 14. Đăng xuất admin
function handleAdminLogout() {
    localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
    localStorage.removeItem(ADMIN_IS_LOGIN_KEY);

    window.location.href = "../html/admin-login.html";
}

// 15. Chuẩn hóa voucher
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

// 16. Lấy danh sách voucher
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

// 17. Lưu danh sách voucher
function saveVouchers(vouchers) {
    localStorage.setItem(ADMIN_VOUCHERS_KEY, JSON.stringify(vouchers));
}

// 18. Tạo mã voucher mới
function createVoucherId() {
    const vouchers = getVouchers();

    if (vouchers.length === 0) {
        return "VC001";
    }

    const maxNumber = vouchers.reduce(function(max, voucher) {
        const number = Number(String(voucher.id).replace("VC", ""));

        return number > max ? number : max;
    }, 0);

    return "VC" + String(maxNumber + 1).padStart(3, "0");
}

// 19. Tìm voucher theo id
function getVoucherById(id) {
    const vouchers = getVouchers();

    return vouchers.find(function(voucher) {
        return voucher.id === id;
    });
}

// 20. Hiển thị không tìm thấy voucher
function showVoucherNotFound() {
    if (voucherDetailLayout) {
        voucherDetailLayout.style.display = "none";
    }

    if (voucherNotFoundBox) {
        voucherNotFoundBox.style.display = "block";
    }
}

// 21. Render tiêu đề trang
function renderPageTitle() {
    if (isEditMode) {
        if (voucherDetailTitle) {
            voucherDetailTitle.textContent = "Sửa voucher";
        }

        if (voucherDetailSubtitle) {
            voucherDetailSubtitle.textContent = "Chỉnh sửa thông tin voucher hiện có của cửa hàng";
        }

        if (voucherFormTitle) {
            voucherFormTitle.textContent = "Thông tin voucher";
        }

        document.title = "Sửa voucher";
        return;
    }

    if (voucherDetailTitle) {
        voucherDetailTitle.textContent = "Thêm voucher";
    }

    if (voucherDetailSubtitle) {
        voucherDetailSubtitle.textContent = "Tạo mã giảm giá, freeship hoặc ưu đãi đổi điểm mới";
    }

    if (voucherFormTitle) {
        voucherFormTitle.textContent = "Thông tin voucher mới";
    }

    document.title = "Thêm voucher";
}

// 22. Hiển thị lỗi form
function showVoucherFormMessage(message, type = "error") {
    if (!voucherFormMessage) return;

    voucherFormMessage.textContent = message;

    if (type === "success") {
        voucherFormMessage.classList.add("success");
    } else {
        voucherFormMessage.classList.remove("success");
    }
}

// 23. Xóa lỗi form
function clearVoucherFormMessage() {
    if (!voucherFormMessage) return;

    voucherFormMessage.textContent = "";
    voucherFormMessage.classList.remove("success");
}

// 24. Bật/tắt field điểm cần đổi
function toggleVoucherPointField() {
    if (!voucherPointGroup || !voucherPointCost || !voucherType) return;

    if (voucherType.value === "point") {
        voucherPointGroup.style.display = "block";
        voucherPointCost.disabled = false;
    } else {
        voucherPointGroup.style.display = "none";
        voucherPointCost.disabled = true;
        voucherPointCost.value = "";
    }
}

// 25. Đổ dữ liệu voucher vào form
function fillVoucherForm(voucher) {
    if (!voucher) return;

    if (voucherId) voucherId.value = voucher.id;
    if (voucherCode) voucherCode.value = voucher.code;
    if (voucherName) voucherName.value = voucher.name;
    if (voucherType) voucherType.value = voucher.type;
    if (voucherValue) voucherValue.value = voucher.value;
    if (voucherPointCost) voucherPointCost.value = voucher.pointCost || "";
    if (voucherMinOrder) voucherMinOrder.value = voucher.minOrder;
    if (voucherQuantity) voucherQuantity.value = voucher.quantity;
    if (voucherStartDate) voucherStartDate.value = voucher.startDate;
    if (voucherEndDate) voucherEndDate.value = voucher.endDate;
    if (voucherStatus) voucherStatus.value = voucher.status;
    if (voucherDescription) voucherDescription.value = voucher.description;

    toggleVoucherPointField();
}

// 26. Set form mặc định khi thêm mới
function setDefaultVoucherForm() {
    if (voucherId) voucherId.value = "";
    if (voucherStatus) voucherStatus.value = "enabled";
    if (voucherStartDate) voucherStartDate.value = getTodayString();
    if (voucherEndDate) voucherEndDate.value = getTodayString();

    toggleVoucherPointField();
}

// 27. Kiểm tra form voucher
function validateVoucherForm() {
    const code = voucherCode.value.trim();
    const name = voucherName.value.trim();
    const type = voucherType.value;
    const value = Number(voucherValue.value || 0);
    const pointCost = Number(voucherPointCost.value || 0);
    const minOrder = Number(voucherMinOrder.value || 0);
    const quantity = Number(voucherQuantity.value || 0);
    const startDate = voucherStartDate.value;
    const endDate = voucherEndDate.value;

    if (!code) {
        showVoucherFormMessage("Vui lòng nhập mã voucher.");
        return false;
    }

    if (!name) {
        showVoucherFormMessage("Vui lòng nhập tên chương trình.");
        return false;
    }

    if (!type) {
        showVoucherFormMessage("Vui lòng chọn loại voucher.");
        return false;
    }

    if (value <= 0) {
        showVoucherFormMessage("Giá trị giảm phải lớn hơn 0.");
        return false;
    }

    if (type === "percent" && value > 100) {
        showVoucherFormMessage("Voucher phần trăm không được lớn hơn 100%.");
        return false;
    }

    if (type === "point" && pointCost <= 0) {
        showVoucherFormMessage("Vui lòng nhập số điểm cần đổi cho voucher đổi điểm.");
        return false;
    }

    if (minOrder < 0) {
        showVoucherFormMessage("Đơn tối thiểu không hợp lệ.");
        return false;
    }

    if (quantity < 0) {
        showVoucherFormMessage("Số lượng không hợp lệ.");
        return false;
    }

    if (!startDate || !endDate) {
        showVoucherFormMessage("Vui lòng chọn thời gian hiệu lực.");
        return false;
    }

    if (startDate > endDate) {
        showVoucherFormMessage("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
        return false;
    }

    return true;
}

// 28. Lấy dữ liệu từ form voucher
function getVoucherFormData() {
    const type = voucherType.value;

    return {
        id: voucherId.value || createVoucherId(),
        code: voucherCode.value.trim().toUpperCase(),
        name: voucherName.value.trim(),
        type: type,
        value: Number(voucherValue.value || 0),
        pointCost: type === "point" ? Number(voucherPointCost.value || 0) : 0,
        minOrder: Number(voucherMinOrder.value || 0),
        quantity: Number(voucherQuantity.value || 0),
        startDate: voucherStartDate.value,
        endDate: voucherEndDate.value,
        status: voucherStatus.value,
        description: voucherDescription.value.trim()
    };
}

// 29. Kiểm tra trùng mã voucher
function isDuplicateVoucherCode(vouchers, formData) {
    return vouchers.some(function(voucher) {
        return voucher.code.toLowerCase() === formData.code.toLowerCase() &&
            voucher.id !== formData.id;
    });
}

// 30. Lưu voucher
function saveVoucher(formData) {
    const vouchers = getVouchers();

    if (isDuplicateVoucherCode(vouchers, formData)) {
        showVoucherFormMessage("Mã voucher đã tồn tại.");
        return;
    }

    let updatedVouchers;

    if (isEditMode) {
        updatedVouchers = vouchers.map(function(voucher) {
            if (voucher.id === formData.id) {
                return formData;
            }

            return voucher;
        });
    } else {
        updatedVouchers = [formData].concat(vouchers);
    }

    saveVouchers(updatedVouchers);

    alert("Lưu voucher thành công.");
    window.location.href = "../html/admin-vouchers.html";
}

// 31. Xử lý submit form
function handleVoucherFormSubmit(event) {
    event.preventDefault();

    clearVoucherFormMessage();

    if (!validateVoucherForm()) return;

    const formData = getVoucherFormData();

    saveVoucher(formData);
}

// 32. Gắn sự kiện trang chi tiết voucher
function bindVoucherDetailEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (voucherType) {
        voucherType.addEventListener("change", toggleVoucherPointField);
    }

    if (voucherDetailForm) {
        voucherDetailForm.addEventListener("submit", handleVoucherFormSubmit);
    }
}

// 33. Khởi tạo trang chi tiết voucher
function initAdminVoucherDetailPage() {
    currentAdminUser = checkAdminLogin();

    if (!currentAdminUser) return;

    const hasPermission = checkVoucherPermission(currentAdminUser);

    if (!hasPermission) return;

    currentVoucherId = getVoucherIdFromUrl();
    isEditMode = Boolean(currentVoucherId);

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    renderPageTitle();

    if (isEditMode) {
        const voucher = getVoucherById(currentVoucherId);

        if (!voucher) {
            showVoucherNotFound();
            return;
        }

        fillVoucherForm(voucher);
    } else {
        setDefaultVoucherForm();
    }

    bindVoucherDetailEvents();
}

initAdminVoucherDetailPage();