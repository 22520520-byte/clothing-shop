// =========================================================
// File: Frontend1/js/admin-staff-detail.js
// Mục đích: Thêm / xem / cập nhật trạng thái nhân viên bằng API thật
// =========================================================


// 1. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");


// 2. Lấy element tiêu đề trang
const staffDetailTitle = document.getElementById("staffDetailTitle");
const staffDetailSubtitle = document.getElementById("staffDetailSubtitle");
const staffFormTitle = document.getElementById("staffFormTitle");


// 3. Lấy element form nhân viên
const staffDetailForm = document.getElementById("staffDetailForm");
const staffFormMessage = document.getElementById("staffFormMessage");

const staffId = document.getElementById("staffId");
const staffFullName = document.getElementById("staffFullName");
const staffUsername = document.getElementById("staffUsername");
const staffPassword = document.getElementById("staffPassword");
const staffRoleInput = document.getElementById("staffRoleInput");
const staffEmail = document.getElementById("staffEmail");
const staffPhone = document.getElementById("staffPhone");
const staffCreatedAt = document.getElementById("staffCreatedAt");
const staffStatusInput = document.getElementById("staffStatusInput");
const staffNote = document.getElementById("staffNote");


// 4. Lấy element lịch sử hoạt động
const staffActivityCard = document.getElementById("staffActivityCard");
const staffActivitySummaryCard = document.querySelector(".staffActivitySummaryCard");
const staffActivityList = document.getElementById("staffActivityList");
const emptyStaffActivityText = document.getElementById("emptyStaffActivityText");
const staffActivityItemTemplate = document.getElementById("staffActivityItemTemplate");

const staffActivityTotalCount = document.getElementById("staffActivityTotalCount");
const staffActivityLastLogin = document.getElementById("staffActivityLastLogin");
const staffActivityMainAction = document.getElementById("staffActivityMainAction");
const staffActivityLastAction = document.getElementById("staffActivityLastAction");


// 5. Lấy element trạng thái trang
const staffDetailLayout = document.getElementById("staffDetailLayout");
const staffNotFoundBox = document.getElementById("staffNotFoundBox");


// 6. Biến lưu trạng thái trang
let currentAdminUser = null;
let currentStaffId = null;
let currentStaffData = null;
let isEditMode = false;


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


// 8. Lấy id nhân viên từ URL
function getStaffIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || params.get("staff_id") || "";
}


// 9. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) {
        return "A";
    }

    return String(text).trim().charAt(0).toUpperCase();
}


// 10. Format ngày Việt Nam
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


// 11. Format ngày giờ Việt Nam
function formatDateTime(dateTimeString) {
    if (!dateTimeString) {
        return "Chưa có";
    }

    const date = new Date(dateTimeString);

    if (Number.isNaN(date.getTime())) {
        return dateTimeString;
    }

    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}


// 12. Lấy ngày hôm nay dạng YYYY-MM-DD
function getTodayString() {
    return new Date().toISOString().slice(0, 10);
}


// 13. Lấy nhãn vai trò admin
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


// 14. Kiểm tra quyền quản lý nhân viên
function canManageStaff(adminUser) {
    return adminUser && adminUser.role === "owner";
}


// 15. Hiển thị thông tin admin
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


// 17. Thêm option nếu select chưa có
function addSelectOptionIfMissing(selectElement, value, text) {
    if (!selectElement) {
        return;
    }

    const isExist = Array.from(selectElement.options).some(function (option) {
        return option.value === value;
    });

    if (isExist) {
        return;
    }

    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;

    selectElement.appendChild(option);
}


// 18. Chuẩn bị option role/status cho đồng bộ API
function prepareStaffSelectOptions() {
    addSelectOptionIfMissing(staffRoleInput, "staff", "Nhân viên");
    addSelectOptionIfMissing(staffRoleInput, "admin", "Quản trị viên");
    addSelectOptionIfMissing(staffRoleInput, "owner", "Chủ cửa hàng");

    addSelectOptionIfMissing(staffStatusInput, "active", "Đang hoạt động");
    addSelectOptionIfMissing(staffStatusInput, "inactive", "Đã khóa");
    addSelectOptionIfMissing(staffStatusInput, "blocked", "Bị chặn");
}


// 19. Map status API sang UI
function mapApiStatusToUiStatus(status) {
    if (status === "active") {
        return "active";
    }

    if (status === "blocked") {
        return "blocked";
    }

    if (status === "inactive") {
        return "inactive";
    }

    if (status === "locked") {
        return "inactive";
    }

    return "active";
}


// 20. Map status UI sang API
function mapUiStatusToApiStatus(status) {
    if (status === "locked") {
        return "inactive";
    }

    return status || "active";
}


// 21. Lấy work status mặc định theo status tài khoản
function getWorkStatusForApi(status) {
    if (currentStaffData && currentStaffData.workStatus) {
        return currentStaffData.workStatus;
    }

    if (status === "active") {
        return "working";
    }

    return "on_leave";
}


// 22. Hiển thị thông báo form
function showStaffFormMessage(message, type = "error") {
    if (!staffFormMessage) {
        return;
    }

    staffFormMessage.textContent = message;

    if (type === "success") {
        staffFormMessage.classList.add("success");
    } else {
        staffFormMessage.classList.remove("success");
    }
}


// 23. Xóa thông báo form
function clearStaffFormMessage() {
    if (!staffFormMessage) {
        return;
    }

    staffFormMessage.textContent = "";
    staffFormMessage.classList.remove("success");
}


// 24. Hiển thị không tìm thấy nhân viên
function showStaffNotFound() {
    if (staffDetailLayout) {
        staffDetailLayout.style.display = "none";
    }

    if (staffNotFoundBox) {
        staffNotFoundBox.style.display = "block";
    }
}


// 25. Hiển thị layout nhân viên
function showStaffDetailLayout() {
    if (staffDetailLayout) {
        staffDetailLayout.style.display = "grid";
    }

    if (staffNotFoundBox) {
        staffNotFoundBox.style.display = "none";
    }
}


// 26. Ẩn/hiện khu vực lịch sử hoạt động
function toggleStaffActivityArea(isShow) {
    if (staffActivityCard) {
        staffActivityCard.style.display = isShow ? "block" : "none";
    }

    if (staffActivitySummaryCard) {
        staffActivitySummaryCard.style.display = isShow ? "block" : "none";
    }
}


// 27. Render tiêu đề trang
function renderPageTitle() {
    if (isEditMode) {
        if (staffDetailTitle) {
            staffDetailTitle.textContent = "Sửa nhân viên";
        }

        if (staffDetailSubtitle) {
            staffDetailSubtitle.textContent = "Xem thông tin, lịch sử hoạt động và cập nhật trạng thái nhân viên";
        }

        if (staffFormTitle) {
            staffFormTitle.textContent = "Thông tin nhân viên";
        }

        document.title = "Sửa nhân viên";
        return;
    }

    if (staffDetailTitle) {
        staffDetailTitle.textContent = "Thêm nhân viên";
    }

    if (staffDetailSubtitle) {
        staffDetailSubtitle.textContent = "Tạo tài khoản đăng nhập mới cho nhân viên";
    }

    if (staffFormTitle) {
        staffFormTitle.textContent = "Thông tin nhân viên mới";
    }

    document.title = "Thêm nhân viên";
}


// 28. Set trạng thái khóa/mở field theo mode
function setEditModeFieldState() {
    const readOnlyFieldsWhenEdit = [
        staffFullName,
        staffUsername,
        staffPassword,
        staffRoleInput,
        staffEmail,
        staffPhone,
        staffCreatedAt
    ];

    readOnlyFieldsWhenEdit.forEach(function (field) {
        if (!field) {
            return;
        }

        if (field.tagName === "SELECT") {
            field.disabled = isEditMode;
        } else {
            field.readOnly = isEditMode;
        }
    });

    if (staffPassword && isEditMode) {
        staffPassword.placeholder = "Mật khẩu đã được mã hóa";
    }
}


// 29. Chuẩn hóa staff từ API
function normalizeStaff(staff) {
    if (!staff) {
        return null;
    }

    const roleCode = staff.role && staff.role.code
        ? staff.role.code
        : staff.role_code || "staff";

    const roleName = staff.role && staff.role.name
        ? staff.role.name
        : "";

    const profile = staff.staff_profile || {};
    const summary = staff.activity_summary || {};

    return {
        id: Number(staff.id || 0),
        fullName: staff.full_name || "Nhân viên",
        email: staff.email || "",
        phone: staff.phone || "",
        status: staff.status || "active",

        role: roleCode,
        roleName: roleName,

        staffCode: profile.staff_code || "NV" + String(staff.id || 0).padStart(3, "0"),
        positionName: profile.position_name || "",
        department: profile.department || "",
        workStatus: profile.work_status || "working",

        createdAt: staff.created_at || "",
        updatedAt: staff.updated_at || "",

        activitySummary: {
            totalActivities: Number(summary.total_activities || 0),
            createActivities: Number(summary.create_activities || 0),
            updateActivities: Number(summary.update_activities || 0),
            updateStatusActivities: Number(summary.update_status_activities || 0),
            updatePaymentActivities: Number(summary.update_payment_activities || 0),
            firstActivityAt: summary.first_activity_at || null,
            lastActivityAt: summary.last_activity_at || null
        },

        activities: Array.isArray(staff.activities) ? staff.activities : [],
        raw: staff
    };
}


// 30. Đổ dữ liệu nhân viên vào form
function fillStaffForm(staff) {
    const normalizedStaff = normalizeStaff(staff);

    if (!normalizedStaff) {
        return;
    }

    currentStaffData = normalizedStaff;

    if (staffId) {
        staffId.value = normalizedStaff.id;
    }

    if (staffFullName) {
        staffFullName.value = normalizedStaff.fullName;
    }

    if (staffUsername) {
        staffUsername.value = normalizedStaff.staffCode;
    }

    if (staffPassword) {
        staffPassword.value = "";
    }

    if (staffRoleInput) {
        staffRoleInput.value = normalizedStaff.role;
    }

    if (staffEmail) {
        staffEmail.value = normalizedStaff.email;
    }

    if (staffPhone) {
        staffPhone.value = normalizedStaff.phone;
    }

    if (staffCreatedAt) {
        staffCreatedAt.value = normalizedStaff.createdAt
            ? String(normalizedStaff.createdAt).slice(0, 10)
            : "";
    }

    if (staffStatusInput) {
        staffStatusInput.value = mapApiStatusToUiStatus(normalizedStaff.status);
    }

    if (staffNote) {
        const noteParts = [
            normalizedStaff.department,
            normalizedStaff.positionName
        ].filter(Boolean);

        staffNote.value = noteParts.join(" - ");
    }

    setEditModeFieldState();
}


// 31. Set form mặc định khi thêm mới
function setDefaultStaffForm() {
    currentStaffData = null;

    if (staffId) {
        staffId.value = "";
    }

    if (staffFullName) {
        staffFullName.value = "";
    }

    if (staffUsername) {
        staffUsername.value = "";
    }

    if (staffPassword) {
        staffPassword.value = "";
        staffPassword.placeholder = "";
    }

    if (staffRoleInput) {
        staffRoleInput.value = "staff";
    }

    if (staffEmail) {
        staffEmail.value = "";
    }

    if (staffPhone) {
        staffPhone.value = "";
    }

    if (staffCreatedAt) {
        staffCreatedAt.value = getTodayString();
    }

    if (staffStatusInput) {
        staffStatusInput.value = "active";
    }

    if (staffNote) {
        staffNote.value = "";
    }

    setEditModeFieldState();
    toggleStaffActivityArea(false);
}


// 32. Kiểm tra email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// 33. Validate form thêm nhân viên
function validateCreateStaffForm() {
    const fullName = staffFullName ? staffFullName.value.trim() : "";
    const staffCode = staffUsername ? staffUsername.value.trim() : "";
    const password = staffPassword ? staffPassword.value.trim() : "";
    const role = staffRoleInput ? staffRoleInput.value : "";
    const email = staffEmail ? staffEmail.value.trim() : "";
    const phone = staffPhone ? staffPhone.value.trim() : "";

    if (!fullName) {
        showStaffFormMessage("Vui lòng nhập họ tên nhân viên.");
        return false;
    }

    if (!staffCode) {
        showStaffFormMessage("Vui lòng nhập mã/tên đăng nhập nhân viên.");
        return false;
    }

    if (!password) {
        showStaffFormMessage("Vui lòng nhập mật khẩu.");
        return false;
    }

    if (password.length < 6) {
        showStaffFormMessage("Mật khẩu phải có ít nhất 6 ký tự.");
        return false;
    }

    if (!role) {
        showStaffFormMessage("Vui lòng chọn vai trò.");
        return false;
    }

    if (!email) {
        showStaffFormMessage("Vui lòng nhập email.");
        return false;
    }

    if (!isValidEmail(email)) {
        showStaffFormMessage("Email không hợp lệ.");
        return false;
    }

    if (!phone) {
        showStaffFormMessage("Vui lòng nhập số điện thoại.");
        return false;
    }

    return true;
}


// 34. Validate form cập nhật trạng thái nhân viên
function validateUpdateStaffStatusForm() {
    const status = staffStatusInput ? staffStatusInput.value : "";

    if (!status) {
        showStaffFormMessage("Vui lòng chọn trạng thái tài khoản.");
        return false;
    }

    if (!currentStaffData) {
        showStaffFormMessage("Không tìm thấy dữ liệu nhân viên cần cập nhật.");
        return false;
    }

    if (String(currentStaffData.id) === String(currentAdminUser.id) && status !== "active") {
        showStaffFormMessage("Không thể khóa tài khoản đang đăng nhập.");
        return false;
    }

    if (currentStaffData.role === "owner" && status !== "active") {
        showStaffFormMessage("Không thể khóa tài khoản chủ cửa hàng.");
        return false;
    }

    return true;
}


// 35. Lấy dữ liệu thêm nhân viên
function getCreateStaffData() {
    const roleCode = staffRoleInput ? staffRoleInput.value : "staff";
    const status = staffStatusInput ? mapUiStatusToApiStatus(staffStatusInput.value) : "active";

    return {
        full_name: staffFullName.value.trim(),
        email: staffEmail.value.trim(),
        phone: staffPhone.value.trim(),
        password: staffPassword.value.trim(),

        gender: "other",
        date_of_birth: "",

        role_code: roleCode,

        staff_code: staffUsername.value.trim().toUpperCase(),
        position_name: roleCode === "owner" ? "Chủ cửa hàng" : "Nhân viên",
        department: staffNote ? staffNote.value.trim() : "",
        work_status: status === "active" ? "working" : "on_leave",

        status: status
    };
}


// 36. Lấy dữ liệu cập nhật trạng thái
function getUpdateStaffStatusData() {
    const status = staffStatusInput ? mapUiStatusToApiStatus(staffStatusInput.value) : "active";
    const note = staffNote ? staffNote.value.trim() : "";

    return {
        staff_id: Number(currentStaffId),
        status: status,
        work_status: getWorkStatusForApi(status),
        note: note || "Owner cập nhật trạng thái nhân viên từ giao diện quản trị."
    };
}


// 37. Set loading nút lưu
function setSaveStaffLoading(isLoading) {
    const submitButton = staffDetailForm
        ? staffDetailForm.querySelector("button[type='submit']")
        : null;

    if (!submitButton) {
        return;
    }

    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Đang lưu..." : "Lưu nhân viên";
}


// 38. Tạo nhân viên bằng API
async function createStaff() {
    if (!validateCreateStaffForm()) {
        return;
    }

    const formData = getCreateStaffData();

    try {
        setSaveStaffLoading(true);

        await window.AdminApi.post("admin/staff/create-staff.php", formData);

        showStaffFormMessage("Thêm nhân viên thành công. Đang quay lại danh sách...", "success");

        setTimeout(function () {
            window.location.href = "../html/admin-staff.html";
        }, 700);
    } catch (error) {
        showStaffFormMessage(
            window.AdminApi.getApiErrorMessage(error, "Thêm nhân viên thất bại.")
        );
    } finally {
        setSaveStaffLoading(false);
    }
}


// 39. Cập nhật trạng thái nhân viên bằng API
async function updateStaffStatus() {
    if (!validateUpdateStaffStatusForm()) {
        return;
    }

    const formData = getUpdateStaffStatusData();

    try {
        setSaveStaffLoading(true);

        await window.AdminApi.post("admin/staff/update-staff-status.php", formData);

        showStaffFormMessage("Cập nhật trạng thái nhân viên thành công.", "success");

        await loadStaffDetail(currentStaffId);
    } catch (error) {
        showStaffFormMessage(
            window.AdminApi.getApiErrorMessage(error, "Cập nhật trạng thái nhân viên thất bại.")
        );
    } finally {
        setSaveStaffLoading(false);
    }
}


// 40. Xử lý submit form
function handleStaffFormSubmit(event) {
    event.preventDefault();
    clearStaffFormMessage();

    if (isEditMode) {
        updateStaffStatus();
        return;
    }

    createStaff();
}


// 41. Lấy icon hoạt động
function getActivityIcon(type) {
    if (type === "login") {
        return "↪";
    }

    if (type === "order" || type === "update_status" || type === "update_payment") {
        return "□";
    }

    if (type === "product") {
        return "▦";
    }

    if (type === "customer") {
        return "♡";
    }

    if (type === "voucher") {
        return "%";
    }

    if (type === "staff") {
        return "☷";
    }

    if (type === "create") {
        return "+";
    }

    if (type === "update") {
        return "✎";
    }

    return "•";
}


// 42. Lấy tên hoạt động thường gặp
function getActivityTypeText(activity) {
    if (!activity) {
        return "Hoạt động";
    }

    if (activity.action_type_label) {
        return activity.action_type_label;
    }

    const type = activity.action_type || activity.type || "";

    const labels = {
        create: "Thêm mới",
        update: "Cập nhật",
        update_status: "Cập nhật trạng thái",
        update_payment: "Cập nhật thanh toán",
        delete: "Xóa",
        login: "Đăng nhập",
        logout: "Đăng xuất"
    };

    return labels[type] || "Hoạt động";
}


// 43. Tìm hoạt động đăng nhập gần nhất
function getLastLoginActivity(activities) {
    return activities.find(function (activity) {
        const type = activity.action_type || activity.type || "";
        return type === "login";
    });
}


// 44. Tìm thao tác thường gặp
function getMainActionType(activities) {
    if (!activities || activities.length === 0) {
        return "Chưa có";
    }

    const countMap = {};

    activities.forEach(function (activity) {
        const type = activity.action_type || activity.type || "activity";

        if (type === "login") {
            return;
        }

        countMap[type] = (countMap[type] || 0) + 1;
    });

    const actionTypes = Object.keys(countMap);

    if (actionTypes.length === 0) {
        return "Đăng nhập";
    }

    const mainType = actionTypes.reduce(function (maxType, currentType) {
        return countMap[currentType] > countMap[maxType] ? currentType : maxType;
    }, actionTypes[0]);

    const sampleActivity = activities.find(function (activity) {
        return (activity.action_type || activity.type) === mainType;
    });

    return getActivityTypeText(sampleActivity);
}


// 45. Render tổng quan hoạt động
function renderStaffActivityOverview(staff) {
    const activities = staff.activities || [];
    const summary = staff.activitySummary || {};
    const lastLogin = getLastLoginActivity(activities);
    const lastActivity = activities[0];

    if (staffActivityTotalCount) {
        staffActivityTotalCount.textContent = summary.totalActivities || activities.length;
    }

    if (staffActivityLastLogin) {
        staffActivityLastLogin.textContent = lastLogin
            ? formatDateTime(lastLogin.created_at || lastLogin.createdAt)
            : "Chưa có";
    }

    if (staffActivityMainAction) {
        staffActivityMainAction.textContent = getMainActionType(activities);
    }

    if (staffActivityLastAction) {
        staffActivityLastAction.textContent = lastActivity
            ? (lastActivity.description || getActivityTypeText(lastActivity))
            : "Chưa có";
    }
}


// 46. Render lịch sử hoạt động
function renderStaffActivities(staff) {
    if (!staffActivityList || !staffActivityItemTemplate) {
        return;
    }

    const activities = staff.activities || [];

    staffActivityList.innerHTML = "";

    if (emptyStaffActivityText) {
        emptyStaffActivityText.classList.toggle("show", activities.length === 0);
    }

    activities.forEach(function (activity) {
        const activityFragment = staffActivityItemTemplate.content.cloneNode(true);

        const type = activity.action_type || activity.type || "activity";
        const targetType = activity.target_type_label || activity.target_type || "Hệ thống";
        const targetId = activity.target_id || "";

        const iconElement = activityFragment.querySelector(".staffActivityIconText");
        const titleElement = activityFragment.querySelector(".staffActivityTitleText");
        const timeElement = activityFragment.querySelector(".staffActivityTimeText");
        const detailElement = activityFragment.querySelector(".staffActivityDetailText");
        const typeElement = activityFragment.querySelector(".staffActivityTypeText");
        const targetElement = activityFragment.querySelector(".staffActivityTargetText");

        if (iconElement) {
            iconElement.textContent = getActivityIcon(type);
        }

        if (titleElement) {
            titleElement.textContent = getActivityTypeText(activity);
        }

        if (timeElement) {
            timeElement.textContent = formatDateTime(activity.created_at || activity.createdAt);
        }

        if (detailElement) {
            detailElement.textContent = activity.description || "Hoạt động nhân viên";
        }

        if (typeElement) {
            typeElement.textContent = getActivityTypeText(activity);
        }

        if (targetElement) {
            targetElement.textContent = targetId
                ? targetType + " · " + targetId
                : targetType;
        }

        staffActivityList.appendChild(activityFragment);
    });

    renderStaffActivityOverview(staff);
}


// 47. Load chi tiết nhân viên từ API
async function loadStaffDetail(staffIdValue) {
    const response = await window.AdminApi.get(
        "admin/staff/get-staff-detail.php?id=" + encodeURIComponent(staffIdValue)
    );

    const staff = response.data && response.data.staff
        ? response.data.staff
        : null;

    if (!staff) {
        showStaffNotFound();
        return;
    }

    showStaffDetailLayout();
    toggleStaffActivityArea(true);
    fillStaffForm(staff);
    renderStaffActivities(currentStaffData);
}


// 48. Gắn sự kiện trang chi tiết nhân viên
function bindStaffDetailEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (staffDetailForm) {
        staffDetailForm.addEventListener("submit", handleStaffFormSubmit);
    }

    const inputs = [
        staffFullName,
        staffUsername,
        staffPassword,
        staffRoleInput,
        staffEmail,
        staffPhone,
        staffCreatedAt,
        staffStatusInput,
        staffNote
    ];

    inputs.forEach(function (input) {
        if (!input) {
            return;
        }

        input.addEventListener("input", clearStaffFormMessage);
        input.addEventListener("change", clearStaffFormMessage);
    });
}


// 49. Kiểm tra đăng nhập local
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


// 50. Khởi tạo trang chi tiết nhân viên
async function initAdminStaffDetailPage() {
    currentAdminUser = checkAdminLoginLocal();

    if (!currentAdminUser) {
        return;
    }

    if (!canManageStaff(currentAdminUser)) {
        alert("Chỉ tài khoản chủ cửa hàng mới được quản lý nhân viên.");
        window.location.href = "../html/admin-dashboard.html";
        return;
    }

    currentStaffId = getStaffIdFromUrl();
    isEditMode = Boolean(currentStaffId);

    prepareStaffSelectOptions();
    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    renderPageTitle();
    bindStaffDetailEvents();

    try {
        if (isEditMode) {
            await loadStaffDetail(currentStaffId);
        } else {
            showStaffDetailLayout();
            setDefaultStaffForm();
        }
    } catch (error) {
        if (error && error.status === 401) {
            window.AdminApi.clearAdminLocalAuth();
            window.location.href = "../html/admin-login.html";
            return;
        }

        showStaffNotFound();
    }
}

initAdminStaffDetailPage();