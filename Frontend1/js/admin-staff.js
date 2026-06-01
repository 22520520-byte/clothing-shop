// =========================================================
// File: Frontend1/js/admin-staff.js
// Mục đích: Gắn trang quản lý nhân viên admin với API backend thật
// =========================================================


// 1. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");


// 2. Lấy element thống kê
const totalStaffCount = document.getElementById("totalStaffCount");
const activeStaffCount = document.getElementById("activeStaffCount");
const ownerStaffCount = document.getElementById("ownerStaffCount");
const lockedStaffCount = document.getElementById("lockedStaffCount");


// 3. Lấy element bộ lọc và bảng
const staffSearchInput = document.getElementById("staffSearchInput");
const staffRoleFilter = document.getElementById("staffRoleFilter");
const staffStatusFilter = document.getElementById("staffStatusFilter");
const staffTableBody = document.getElementById("staffTableBody");
const emptyStaffText = document.getElementById("emptyStaffText");
const staffRowTemplate = document.getElementById("staffRowTemplate");


// 4. Lấy element nút thêm nhân viên
const openAddStaffBtn = document.getElementById("openAddStaffBtn");


// 5. Biến lưu dữ liệu nhân viên
let currentAdminUser = null;
let adminStaffList = [];
let staffSummary = null;


// 6. Format ngày Việt Nam
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


// 10. Kiểm tra role có quyền thao tác nhân viên không
function canManageStaff(adminUser) {
    if (!adminUser) {
        return false;
    }

    return adminUser.role === "owner" || adminUser.role === "admin";
}


// 11. Hiển thị thông tin admin
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

    if (openAddStaffBtn && !canManageStaff(adminUser)) {
        openAddStaffBtn.style.display = "none";
    }
}


// 12. Xử lý đăng xuất
function handleAdminLogout() {
    if (window.AdminApi && window.AdminApi.logoutAdmin) {
        window.AdminApi.logoutAdmin();
        return;
    }

    localStorage.removeItem("admin_current_user");
    localStorage.removeItem("admin_is_login");
    window.location.href = "../html/admin-login.html";
}


// 13. Lấy role code từ API
function getStaffRoleCode(staff) {
    if (staff.role && staff.role.code) {
        return staff.role.code;
    }

    return staff.role_code || "staff";
}


// 14. Lấy thông tin vai trò
function getStaffRoleInfo(roleCode) {
    if (roleCode === "owner") {
        return {
            text: "Chủ cửa hàng",
            className: "roleOwner"
        };
    }

    if (roleCode === "admin") {
        return {
            text: "Quản trị viên",
            className: "roleOwner"
        };
    }

    return {
        text: "Nhân viên",
        className: "roleStaff"
    };
}


// 15. Lấy status tài khoản
function getStaffStatusCode(staff) {
    return staff.status || "active";
}


// 16. Lấy work status
function getStaffWorkStatus(staff) {
    if (staff.staff_profile && staff.staff_profile.work_status) {
        return staff.staff_profile.work_status;
    }

    return staff.work_status || "working";
}


// 17. Lấy thông tin trạng thái tài khoản
function getStaffStatusInfo(status) {
    if (status === "blocked") {
        return {
            text: "Bị chặn",
            className: "statusCancelled"
        };
    }

    if (status === "inactive" || status === "locked") {
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


// 18. Lấy thông tin trạng thái làm việc
function getWorkStatusLabel(workStatus) {
    if (workStatus === "on_leave") {
        return "Đang nghỉ phép";
    }

    if (workStatus === "resigned") {
        return "Đã nghỉ việc";
    }

    return "Đang làm việc";
}


// 19. Chuẩn hóa nhân viên từ API
function normalizeStaff(staff) {
    const roleCode = getStaffRoleCode(staff);
    const status = getStaffStatusCode(staff);
    const workStatus = getStaffWorkStatus(staff);

    const staffProfile = staff.staff_profile || {};

    return {
        id: Number(staff.id || 0),
        code: staffProfile.staff_code || "NV" + String(staff.id || 0).padStart(3, "0"),

        fullName: staff.full_name || staff.fullName || "Nhân viên",
        email: staff.email || "Chưa cập nhật",
        phone: staff.phone || "Chưa cập nhật",

        role: roleCode,
        roleName: staff.role && staff.role.name ? staff.role.name : "",
        status: status,
        workStatus: workStatus,

        positionName: staffProfile.position_name || "Đang cập nhật",
        department: staffProfile.department || "Đang cập nhật",

        createdAt: staff.created_at || "",
        updatedAt: staff.updated_at || "",

        totalActivities: staff.activity_summary
            ? Number(staff.activity_summary.total_activities || 0)
            : 0,

        lastActivityAt: staff.activity_summary
            ? staff.activity_summary.last_activity_at
            : null,

        raw: staff
    };
}


// 20. Kiểm tra có phải owner không
function isOwnerStaff(staff) {
    return staff && staff.role === "owner";
}


// 21. Kiểm tra có phải tài khoản đang đăng nhập không
function isCurrentLoginStaff(staff) {
    if (!staff || !currentAdminUser) {
        return false;
    }

    return String(staff.id) === String(currentAdminUser.id);
}


// 22. Render thống kê nhân viên
function renderStaffStats() {
    const totalStaff = staffSummary && staffSummary.total_staff !== undefined
        ? Number(staffSummary.total_staff || 0)
        : adminStaffList.length;

    const activeStaff = staffSummary && staffSummary.active_accounts !== undefined
        ? Number(staffSummary.active_accounts || 0)
        : adminStaffList.filter(function (staff) {
            return staff.status === "active";
        }).length;

    const ownerStaff = staffSummary && staffSummary.total_owner !== undefined
        ? Number(staffSummary.total_owner || 0)
        : adminStaffList.filter(function (staff) {
            return staff.role === "owner";
        }).length;

    const lockedStaff = staffSummary && staffSummary.inactive_accounts !== undefined
        ? Number(staffSummary.inactive_accounts || 0)
        : adminStaffList.filter(function (staff) {
            return staff.status !== "active";
        }).length;

    if (totalStaffCount) {
        totalStaffCount.textContent = totalStaff;
    }

    if (activeStaffCount) {
        activeStaffCount.textContent = activeStaff;
    }

    if (ownerStaffCount) {
        ownerStaffCount.textContent = ownerStaff;
    }

    if (lockedStaffCount) {
        lockedStaffCount.textContent = lockedStaff;
    }
}


// 23. Chuẩn hóa giá trị filter trạng thái cũ trong HTML
function normalizeStatusFilterValue(value) {
    if (value === "locked") {
        return "inactive";
    }

    return value;
}


// 24. Lọc nhân viên trên frontend
function getFilteredStaffList() {
    const searchValue = staffSearchInput
        ? staffSearchInput.value.trim().toLowerCase()
        : "";

    const roleValue = staffRoleFilter
        ? staffRoleFilter.value
        : "all";

    const statusValue = staffStatusFilter
        ? normalizeStatusFilterValue(staffStatusFilter.value)
        : "all";

    return adminStaffList.filter(function (staff) {
        const fullName = staff.fullName.toLowerCase();
        const email = staff.email.toLowerCase();
        const phone = staff.phone.toLowerCase();
        const code = staff.code.toLowerCase();
        const positionName = staff.positionName.toLowerCase();
        const department = staff.department.toLowerCase();

        const matchSearch =
            fullName.includes(searchValue) ||
            email.includes(searchValue) ||
            phone.includes(searchValue) ||
            code.includes(searchValue) ||
            positionName.includes(searchValue) ||
            department.includes(searchValue);

        let matchRole = true;

        if (roleValue !== "all") {
            matchRole = staff.role === roleValue;
        }

        let matchStatus = true;

        if (statusValue !== "all") {
            if (statusValue === "inactive") {
                matchStatus = staff.status !== "active";
            } else {
                matchStatus = staff.status === statusValue;
            }
        }

        return matchSearch && matchRole && matchStatus;
    });
}


// 25. Tạo link trang chi tiết nhân viên
function getAdminStaffDetailUrl(staffId) {
    return "../html/admin-staff-detail.html?id=" + encodeURIComponent(staffId);
}


// 26. Render một dòng nhân viên
function renderStaffRow(staff) {
    const rowFragment = staffRowTemplate.content.cloneNode(true);
    const row = rowFragment.querySelector("tr");

    const roleInfo = getStaffRoleInfo(staff.role);
    const statusInfo = getStaffStatusInfo(staff.status);

    const staffAvatarText = rowFragment.querySelector(".staffAvatarText");
    const staffFullNameText = rowFragment.querySelector(".staffFullNameText");
    const staffCodeText = rowFragment.querySelector(".staffCodeText");
    const staffUsernameText = rowFragment.querySelector(".staffUsernameText");
    const staffEmailText = rowFragment.querySelector(".staffEmailText");
    const staffPhoneText = rowFragment.querySelector(".staffPhoneText");
    const staffRoleText = rowFragment.querySelector(".staffRoleText");
    const staffCreatedAtText = rowFragment.querySelector(".staffCreatedAtText");
    const staffStatusText = rowFragment.querySelector(".staffStatusText");
    const staffNoteText = rowFragment.querySelector(".staffNoteText");
    const actionButton = rowFragment.querySelector("[data-action]");

    if (row) {
        row.dataset.staffId = staff.id;
        row.classList.add("clickableStaffRow");
        row.title = "Nhấn để xem và chỉnh sửa nhân viên";
    }

    if (staffAvatarText) {
        staffAvatarText.textContent = getFirstLetter(staff.fullName);
    }

    if (staffFullNameText) {
        staffFullNameText.textContent = staff.fullName;
    }

    if (staffCodeText) {
        staffCodeText.textContent = staff.code;
    }

    if (staffUsernameText) {
        staffUsernameText.textContent = staff.positionName;
    }

    if (staffEmailText) {
        staffEmailText.textContent = staff.email;
    }

    if (staffPhoneText) {
        staffPhoneText.textContent = staff.phone;
    }

    if (staffRoleText) {
        staffRoleText.textContent = roleInfo.text;
        staffRoleText.className = "staffRoleText roleBadge";
        staffRoleText.classList.add(roleInfo.className);
    }

    if (staffCreatedAtText) {
        staffCreatedAtText.textContent = formatDate(staff.createdAt);
    }

    if (staffStatusText) {
        staffStatusText.textContent = statusInfo.text;
        staffStatusText.className = "staffStatusText statusBadge";
        staffStatusText.classList.add(statusInfo.className);
    }

    if (staffNoteText) {
        staffNoteText.textContent =
            staff.department + " · " + getWorkStatusLabel(staff.workStatus);
    }

    if (actionButton) {
        actionButton.dataset.action = "toggle-status";
        actionButton.textContent = staff.status === "active" ? "Khóa" : "Mở";
        actionButton.title = staff.status === "active"
            ? "Khóa tài khoản nhân viên"
            : "Mở lại tài khoản nhân viên";

        if (
            !canManageStaff(currentAdminUser) ||
            isOwnerStaff(staff) ||
            isCurrentLoginStaff(staff)
        ) {
            actionButton.disabled = true;
            actionButton.classList.add("disabledBtn");
            actionButton.title = "Không thể cập nhật tài khoản này";
        }
    }

    return rowFragment;
}


// 27. Render bảng nhân viên
function renderStaffTable() {
    if (!staffTableBody || !staffRowTemplate) {
        return;
    }

    const filteredStaffList = getFilteredStaffList();

    staffTableBody.innerHTML = "";

    if (emptyStaffText) {
        emptyStaffText.classList.toggle("show", filteredStaffList.length === 0);
    }

    filteredStaffList.forEach(function (staff) {
        const row = renderStaffRow(staff);
        staffTableBody.appendChild(row);
    });

    renderStaffStats();
}


// 28. Hiển thị loading
function setStaffLoading(isLoading) {
    if (!staffTableBody) {
        return;
    }

    if (isLoading) {
        staffTableBody.innerHTML = `
            <tr>
                <td colspan="8">Đang tải danh sách nhân viên...</td>
            </tr>
        `;
    }
}


// 29. Hiển thị lỗi
function renderStaffError(error) {
    console.error(error);

    if (staffTableBody) {
        staffTableBody.innerHTML = "";
    }

    if (emptyStaffText) {
        emptyStaffText.classList.add("show");
        emptyStaffText.textContent = "Không tải được danh sách nhân viên.";
    }

    adminStaffList = [];
    staffSummary = null;
    renderStaffStats();
}


// 30. Load danh sách nhân viên từ API
async function loadStaffFromApi() {
    setStaffLoading(true);

    const response = await window.AdminApi.get(
        "admin/staff/get-staff.php?page=1&limit=100&role_code=all&status=all&work_status=all&sort=latest"
    );

    const data = response.data || {};
    const staffList = Array.isArray(data.staff) ? data.staff : [];

    staffSummary = data.summary || null;

    adminStaffList = staffList.map(function (staff) {
        return normalizeStaff(staff);
    });

    renderStaffTable();
}


// 31. Tìm nhân viên theo id
function getStaffById(staffId) {
    return adminStaffList.find(function (staff) {
        return String(staff.id) === String(staffId);
    });
}


// 32. Chuyển sang trang chi tiết nhân viên
function goToStaffDetail(staffId) {
    if (!staffId) {
        return;
    }

    window.location.href = getAdminStaffDetailUrl(staffId);
}


// 33. Cập nhật trạng thái nhân viên
async function toggleStaffStatus(staffId) {
    const staff = getStaffById(staffId);

    if (!staff) {
        return;
    }

    if (!canManageStaff(currentAdminUser)) {
        alert("Bạn không có quyền cập nhật trạng thái nhân viên.");
        return;
    }

    if (isOwnerStaff(staff)) {
        alert("Không thể khóa tài khoản chủ cửa hàng.");
        return;
    }

    if (isCurrentLoginStaff(staff)) {
        alert("Không thể khóa tài khoản đang đăng nhập.");
        return;
    }

    const newStatus = staff.status === "active" ? "inactive" : "active";
    const newWorkStatus = newStatus === "active" ? "working" : staff.workStatus;
    const actionText = newStatus === "inactive" ? "khóa" : "mở lại";

    const isConfirm = confirm(
        "Bạn có chắc muốn " + actionText + " tài khoản nhân viên " + staff.fullName + " không?"
    );

    if (!isConfirm) {
        return;
    }

    try {
        await window.AdminApi.post("admin/staff/update-staff-status.php", {
            staff_id: Number(staffId),
            status: newStatus,
            work_status: newWorkStatus,
            note: "Admin cập nhật trạng thái nhân viên từ giao diện quản trị."
        });

        await loadStaffFromApi();
    } catch (error) {
        alert(
            window.AdminApi.getApiErrorMessage(
                error,
                "Cập nhật trạng thái nhân viên thất bại."
            )
        );
    }
}


// 34. Xử lý thao tác bảng nhân viên
function handleStaffTableAction(event) {
    const actionButton = event.target.closest("[data-action]");
    const row = event.target.closest("tr");

    if (!row) {
        return;
    }

    const staffId = row.dataset.staffId;

    if (actionButton) {
        event.stopPropagation();

        if (actionButton.disabled) {
            return;
        }

        const action = actionButton.dataset.action;

        if (action === "toggle-status") {
            toggleStaffStatus(staffId);
        }

        return;
    }

    goToStaffDetail(staffId);
}


// 35. Gắn sự kiện trang nhân viên
function bindStaffEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (staffTableBody) {
        staffTableBody.addEventListener("click", handleStaffTableAction);
    }

    if (staffSearchInput) {
        staffSearchInput.addEventListener("input", renderStaffTable);
    }

    if (staffRoleFilter) {
        staffRoleFilter.addEventListener("change", renderStaffTable);
    }

    if (staffStatusFilter) {
        staffStatusFilter.addEventListener("change", renderStaffTable);
    }
}


// 36. Kiểm tra đăng nhập local
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


// 37. Khởi tạo trang quản lý nhân viên
async function initAdminStaffPage() {
    currentAdminUser = checkAdminLoginLocal();

    if (!currentAdminUser) {
        return;
    }

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    bindStaffEvents();

    try {
        await loadStaffFromApi();
    } catch (error) {
        if (error && error.status === 401) {
            window.AdminApi.clearAdminLocalAuth();
            window.location.href = "../html/admin-login.html";
            return;
        }

        renderStaffError(error);
    }
}

initAdminStaffPage();