// =========================================================
// File: Frontend1/js/admin-voucher-detail.js
// Mục đích: Thêm / sửa voucher admin bằng API backend thật
// =========================================================


// 1. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");


// 2. Lấy element tiêu đề trang
const voucherDetailTitle = document.getElementById("voucherDetailTitle");
const voucherDetailSubtitle = document.getElementById("voucherDetailSubtitle");
const voucherFormTitle = document.getElementById("voucherFormTitle");


// 3. Lấy element form voucher
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


// 4. Lấy element trạng thái trang
const voucherDetailLayout = document.getElementById("voucherDetailLayout");
const voucherNotFoundBox = document.getElementById("voucherNotFoundBox");


// 5. Biến lưu trạng thái trang
let currentAdminUser = null;
let currentVoucherId = null;
let currentVoucherData = null;
let isEditMode = false;


// 6. Render ngày hiện tại
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


// 7. Lấy id voucher từ URL
function getVoucherIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || params.get("voucher_id") || "";
}


// 8. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) {
        return "A";
    }

    return String(text).trim().charAt(0).toUpperCase();
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


// 11. Xử lý đăng xuất
function handleAdminLogout() {
    if (window.AdminApi && window.AdminApi.logoutAdmin) {
        window.AdminApi.logoutAdmin();
        return;
    }

    localStorage.removeItem("admin_current_user");
    localStorage.removeItem("admin_is_login");
    window.location.href = "../html/admin-login.html";
}


// 12. Hiển thị thông báo form
function showVoucherFormMessage(message, type = "error") {
    if (!voucherFormMessage) {
        return;
    }

    voucherFormMessage.textContent = message;

    if (type === "success") {
        voucherFormMessage.classList.add("success");
    } else {
        voucherFormMessage.classList.remove("success");
    }
}


// 13. Xóa thông báo form
function clearVoucherFormMessage() {
    if (!voucherFormMessage) {
        return;
    }

    voucherFormMessage.textContent = "";
    voucherFormMessage.classList.remove("success");
}


// 14. Hiển thị không tìm thấy voucher
function showVoucherNotFound() {
    if (voucherDetailLayout) {
        voucherDetailLayout.style.display = "none";
    }

    if (voucherNotFoundBox) {
        voucherNotFoundBox.style.display = "block";
    }
}


// 15. Hiển thị form voucher
function showVoucherDetailLayout() {
    if (voucherDetailLayout) {
        voucherDetailLayout.style.display = "grid";
    }

    if (voucherNotFoundBox) {
        voucherNotFoundBox.style.display = "none";
    }
}


// 16. Render tiêu đề trang
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
        voucherDetailSubtitle.textContent = "Tạo mã giảm giá, freeship hoặc ưu đãi mới";
    }

    if (voucherFormTitle) {
        voucherFormTitle.textContent = "Thông tin voucher mới";
    }

    document.title = "Thêm voucher";
}


// 17. Kiểm tra select có option value nào không
function hasSelectOption(selectElement, value) {
    if (!selectElement) {
        return false;
    }

    return Array.from(selectElement.options).some(function (option) {
        return option.value === value;
    });
}


// 18. Set value an toàn cho select
function setSelectValue(selectElement, value, fallbackValue) {
    if (!selectElement) {
        return;
    }

    if (hasSelectOption(selectElement, value)) {
        selectElement.value = value;
        return;
    }

    if (hasSelectOption(selectElement, fallbackValue)) {
        selectElement.value = fallbackValue;
    }
}


// 19. Chuyển loại voucher từ API sang UI
function mapApiTypeToUiType(discountType) {
    if (discountType === "freeship") {
        return "free-ship";
    }

    return discountType || "fixed";
}


// 20. Chuyển loại voucher từ UI sang API
function mapUiTypeToApiType(type) {
    if (type === "free-ship") {
        return "freeship";
    }

    return type;
}


// 21. Chuyển status API sang UI
function mapApiStatusToUiStatus(status) {
    if (status === "active") {
        return hasSelectOption(voucherStatus, "enabled") ? "enabled" : "active";
    }

    return hasSelectOption(voucherStatus, "disabled") ? "disabled" : "inactive";
}


// 22. Chuyển status UI sang API
function mapUiStatusToApiStatus(status) {
    if (status === "enabled") {
        return "active";
    }

    if (status === "disabled") {
        return "inactive";
    }

    return status || "active";
}


// 23. Chuyển date từ API sang input
function formatDateForInput(dateValue, inputElement) {
    if (!dateValue) {
        return "";
    }

    const normalizedValue = String(dateValue).replace(" ", "T");

    if (inputElement && inputElement.type === "datetime-local") {
        return normalizedValue.slice(0, 16);
    }

    return normalizedValue.slice(0, 10);
}


// 24. Chuyển date input sang API
function formatDateForApi(dateValue, mode) {
    if (!dateValue) {
        return "";
    }

    if (dateValue.includes("T")) {
        return dateValue;
    }

    if (mode === "end") {
        return dateValue + "T23:59";
    }

    return dateValue + "T00:00";
}


// 25. Lấy ngày hôm nay cho input
function getTodayForInput(inputElement) {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");

    if (inputElement && inputElement.type === "datetime-local") {
        return year + "-" + month + "-" + day + "T" + hour + ":" + minute;
    }

    return year + "-" + month + "-" + day;
}


// 26. Lấy ngày tháng sau cho input
function getNextMonthForInput(inputElement) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const year = nextMonth.getFullYear();
    const month = String(nextMonth.getMonth() + 1).padStart(2, "0");
    const day = String(nextMonth.getDate()).padStart(2, "0");
    const hour = String(nextMonth.getHours()).padStart(2, "0");
    const minute = String(nextMonth.getMinutes()).padStart(2, "0");

    if (inputElement && inputElement.type === "datetime-local") {
        return year + "-" + month + "-" + day + "T" + hour + ":" + minute;
    }

    return year + "-" + month + "-" + day;
}


// 27. Bật/tắt field điểm cần đổi
function toggleVoucherPointField() {
    if (!voucherPointGroup || !voucherPointCost || !voucherType) {
        return;
    }

    if (voucherType.value === "point") {
        voucherPointGroup.style.display = "block";
        voucherPointCost.disabled = false;
    } else {
        voucherPointGroup.style.display = "none";
        voucherPointCost.disabled = true;
        voucherPointCost.value = "";
    }
}


// 28. Chuẩn hóa voucher từ API
function normalizeVoucher(voucher) {
    if (!voucher) {
        return null;
    }

    return {
        id: Number(voucher.id || 0),
        code: voucher.code || "",
        name: voucher.name || "",
        description: voucher.description || "",

        type: mapApiTypeToUiType(voucher.discount_type),
        value: Number(voucher.discount_value || 0),

        pointCost: 0,
        minOrder: Number(voucher.min_order_value || 0),
        maxDiscountAmount: voucher.max_discount_amount !== null && voucher.max_discount_amount !== undefined
            ? Number(voucher.max_discount_amount || 0)
            : "",

        quantity: Number(voucher.quantity || 0),
        usedQuantity: Number(voucher.used_quantity || 0),
        usageLimitPerUser: Number(voucher.usage_limit_per_user || 1),

        startDate: voucher.start_date || "",
        endDate: voucher.end_date || "",
        status: voucher.status || "active",

        raw: voucher
    };
}


// 29. Đổ dữ liệu voucher vào form
function fillVoucherForm(voucher) {
    const normalizedVoucher = normalizeVoucher(voucher);

    if (!normalizedVoucher) {
        showVoucherNotFound();
        return;
    }

    currentVoucherData = normalizedVoucher;

    if (voucherId) {
        voucherId.value = normalizedVoucher.id;
    }

    if (voucherCode) {
        voucherCode.value = normalizedVoucher.code;
    }

    if (voucherName) {
        voucherName.value = normalizedVoucher.name;
    }

    setSelectValue(voucherType, normalizedVoucher.type, "fixed");

    if (voucherValue) {
        voucherValue.value = normalizedVoucher.value;
    }

    if (voucherPointCost) {
        voucherPointCost.value = normalizedVoucher.pointCost || "";
    }

    if (voucherMinOrder) {
        voucherMinOrder.value = normalizedVoucher.minOrder;
    }

    if (voucherQuantity) {
        voucherQuantity.value = normalizedVoucher.quantity;
    }

    if (voucherStartDate) {
        voucherStartDate.value = formatDateForInput(normalizedVoucher.startDate, voucherStartDate);
    }

    if (voucherEndDate) {
        voucherEndDate.value = formatDateForInput(normalizedVoucher.endDate, voucherEndDate);
    }

    setSelectValue(voucherStatus, mapApiStatusToUiStatus(normalizedVoucher.status), "enabled");

    if (voucherDescription) {
        voucherDescription.value = normalizedVoucher.description;
    }

    toggleVoucherPointField();
}


// 30. Set form mặc định khi thêm mới
function setDefaultVoucherForm() {
    currentVoucherData = null;

    if (voucherId) {
        voucherId.value = "";
    }

    if (voucherCode) {
        voucherCode.value = "";
    }

    if (voucherName) {
        voucherName.value = "";
    }

    setSelectValue(voucherType, "percent", "fixed");

    if (voucherValue) {
        voucherValue.value = "";
    }

    if (voucherPointCost) {
        voucherPointCost.value = "";
    }

    if (voucherMinOrder) {
        voucherMinOrder.value = 0;
    }

    if (voucherQuantity) {
        voucherQuantity.value = 100;
    }

    if (voucherStartDate) {
        voucherStartDate.value = getTodayForInput(voucherStartDate);
    }

    if (voucherEndDate) {
        voucherEndDate.value = getNextMonthForInput(voucherEndDate);
    }

    setSelectValue(voucherStatus, "enabled", "active");

    if (voucherDescription) {
        voucherDescription.value = "";
    }

    toggleVoucherPointField();
}


// 31. Validate form voucher
function validateVoucherForm() {
    const code = voucherCode ? voucherCode.value.trim() : "";
    const name = voucherName ? voucherName.value.trim() : "";
    const type = voucherType ? voucherType.value : "";
    const value = voucherValue ? Number(voucherValue.value || 0) : 0;
    const pointCost = voucherPointCost ? Number(voucherPointCost.value || 0) : 0;
    const minOrder = voucherMinOrder ? Number(voucherMinOrder.value || 0) : 0;
    const quantity = voucherQuantity ? Number(voucherQuantity.value || 0) : 0;
    const startDate = voucherStartDate ? voucherStartDate.value : "";
    const endDate = voucherEndDate ? voucherEndDate.value : "";

    if (!code) {
        showVoucherFormMessage("Vui lòng nhập mã voucher.");
        return false;
    }

    if (!/^[A-Za-z0-9_-]{3,50}$/.test(code)) {
        showVoucherFormMessage("Mã voucher chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới.");
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

    if (type === "point") {
        showVoucherFormMessage("Loại Đổi điểm hiện chưa có API lưu riêng. Tạm thời hãy chọn Phần trăm, Giảm tiền hoặc Freeship.");
        return false;
    }

    if (type !== "free-ship" && value <= 0) {
        showVoucherFormMessage("Giá trị giảm phải lớn hơn 0.");
        return false;
    }

    if (type === "percent" && (value <= 0 || value > 100)) {
        showVoucherFormMessage("Voucher phần trăm phải từ 1 đến 100%.");
        return false;
    }

    if (type === "point" && pointCost <= 0) {
        showVoucherFormMessage("Vui lòng nhập số điểm cần đổi.");
        return false;
    }

    if (minOrder < 0) {
        showVoucherFormMessage("Đơn tối thiểu không hợp lệ.");
        return false;
    }

    if (quantity <= 0) {
        showVoucherFormMessage("Số lượng voucher phải lớn hơn 0.");
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

    if (isEditMode && currentVoucherData && quantity < currentVoucherData.usedQuantity) {
        showVoucherFormMessage("Số lượng không được nhỏ hơn số lượt đã dùng.");
        return false;
    }

    return true;
}


// 32. Lấy dữ liệu form để gửi API
function getVoucherFormData() {
    const type = voucherType ? voucherType.value : "fixed";
    const apiType = mapUiTypeToApiType(type);

    let discountValue = voucherValue ? Number(voucherValue.value || 0) : 0;
    let maxDiscountAmount = "";

    if (apiType === "freeship") {
        maxDiscountAmount = discountValue > 0 ? discountValue : "";
        discountValue = 0;
    }

    const formData = {
        code: voucherCode.value.trim().toUpperCase(),
        name: voucherName.value.trim(),
        description: voucherDescription ? voucherDescription.value.trim() : "",

        discount_type: apiType,
        discount_value: discountValue,

        min_order_value: voucherMinOrder ? Number(voucherMinOrder.value || 0) : 0,
        max_discount_amount: maxDiscountAmount,

        quantity: voucherQuantity ? Number(voucherQuantity.value || 0) : 1,
        usage_limit_per_user: currentVoucherData ? currentVoucherData.usageLimitPerUser : 1,

        start_date: formatDateForApi(voucherStartDate.value, "start"),
        end_date: formatDateForApi(voucherEndDate.value, "end"),

        status: mapUiStatusToApiStatus(voucherStatus ? voucherStatus.value : "active")
    };

    if (isEditMode) {
        formData.voucher_id = Number(currentVoucherId);
    }

    return formData;
}


// 33. Load voucher theo id từ API danh sách
async function loadVoucherDetail(voucherIdValue) {
    const response = await window.AdminApi.get(
        "admin/vouchers/get-vouchers.php?page=1&limit=100&discount_type=all&status=all&state=all&sort=latest"
    );

    const data = response.data || {};
    const vouchers = Array.isArray(data.vouchers) ? data.vouchers : [];

    const voucher = vouchers.find(function (item) {
        return String(item.id) === String(voucherIdValue);
    });

    if (!voucher) {
        showVoucherNotFound();
        return;
    }

    showVoucherDetailLayout();
    fillVoucherForm(voucher);
}


// 34. Set trạng thái loading nút lưu
function setSaveVoucherLoading(isLoading) {
    const submitButton = voucherDetailForm
        ? voucherDetailForm.querySelector("button[type='submit']")
        : null;

    if (!submitButton) {
        return;
    }

    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Đang lưu..." : "Lưu voucher";
}


// 35. Lưu voucher bằng API
async function saveVoucher() {
    if (!validateVoucherForm()) {
        return;
    }

    const formData = getVoucherFormData();

    try {
        setSaveVoucherLoading(true);

        if (isEditMode) {
            await window.AdminApi.post("admin/vouchers/update-voucher.php", formData);
        } else {
            await window.AdminApi.post("admin/vouchers/create-voucher.php", formData);
        }

        showVoucherFormMessage("Lưu voucher thành công. Đang quay lại danh sách...", "success");

        setTimeout(function () {
            window.location.href = "../html/admin-vouchers.html";
        }, 700);
    } catch (error) {
        showVoucherFormMessage(
            window.AdminApi.getApiErrorMessage(error, "Lưu voucher thất bại.")
        );
    } finally {
        setSaveVoucherLoading(false);
    }
}


// 36. Xử lý submit form
function handleVoucherFormSubmit(event) {
    event.preventDefault();
    clearVoucherFormMessage();
    saveVoucher();
}


// 37. Gắn sự kiện trang chi tiết voucher
function bindVoucherDetailEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (voucherType) {
        voucherType.addEventListener("change", function () {
            toggleVoucherPointField();

            if (voucherType.value === "free-ship" && voucherValue && Number(voucherValue.value || 0) <= 0) {
                voucherValue.value = 30000;
            }
        });
    }

    if (voucherDetailForm) {
        voucherDetailForm.addEventListener("submit", handleVoucherFormSubmit);
    }

    const inputs = [
        voucherCode,
        voucherName,
        voucherType,
        voucherValue,
        voucherPointCost,
        voucherMinOrder,
        voucherQuantity,
        voucherStartDate,
        voucherEndDate,
        voucherStatus,
        voucherDescription
    ];

    inputs.forEach(function (input) {
        if (!input) {
            return;
        }

        input.addEventListener("input", clearVoucherFormMessage);
        input.addEventListener("change", clearVoucherFormMessage);
    });
}


// 38. Kiểm tra đăng nhập local
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


// 39. Khởi tạo trang chi tiết voucher
async function initAdminVoucherDetailPage() {
    currentAdminUser = checkAdminLoginLocal();

    if (!currentAdminUser) {
        return;
    }

    currentVoucherId = getVoucherIdFromUrl();
    isEditMode = Boolean(currentVoucherId);

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    renderPageTitle();
    bindVoucherDetailEvents();

    try {
        if (isEditMode) {
            await loadVoucherDetail(currentVoucherId);
        } else {
            showVoucherDetailLayout();
            setDefaultVoucherForm();
        }
    } catch (error) {
        if (error && error.status === 401) {
            window.AdminApi.clearAdminLocalAuth();
            window.location.href = "../html/admin-login.html";
            return;
        }

        showVoucherNotFound();
    }
}

initAdminVoucherDetailPage();