// 1. Khai báo key localStorage
const ADMIN_CURRENT_USER_KEY = "admin_current_user";
const ADMIN_IS_LOGIN_KEY = "admin_is_login";
const ADMIN_STAFF_KEY = "admin_staff";

// 2. Dữ liệu nhân viên mẫu
const demoAdminStaff = [
    {
        id: "NV001",
        fullName: "Chủ cửa hàng",
        username: "owner",
        password: "123456",
        role: "owner",
        email: "owner@gmail.com",
        phone: "0900000001",
        status: "active",
        createdAt: "2026-05-01",
        note: "Tài khoản chủ cửa hàng mặc định."
    },
    {
        id: "NV002",
        fullName: "Nhân viên bán hàng",
        username: "staff",
        password: "123456",
        role: "staff",
        email: "staff@gmail.com",
        phone: "0900000002",
        status: "active",
        createdAt: "2026-05-02",
        note: "Nhân viên xử lý đơn hàng và sản phẩm."
    },
    {
        id: "NV003",
        fullName: "Nhân viên kho",
        username: "khohang",
        password: "123456",
        role: "staff",
        email: "khohang@gmail.com",
        phone: "0900000003",
        status: "active",
        createdAt: "2026-05-05",
        note: "Theo dõi tồn kho sản phẩm."
    },
    {
        id: "NV004",
        fullName: "Nhân viên cũ",
        username: "nhanviencu",
        password: "123456",
        role: "staff",
        email: "nhanviencu@gmail.com",
        phone: "0900000004",
        status: "locked",
        createdAt: "2026-04-20",
        note: "Tài khoản đã tạm khóa."
    }
];

// 3. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

// 4. Lấy element thống kê
const totalStaffCount = document.getElementById("totalStaffCount");
const activeStaffCount = document.getElementById("activeStaffCount");
const ownerStaffCount = document.getElementById("ownerStaffCount");
const lockedStaffCount = document.getElementById("lockedStaffCount");

// 5. Lấy element bộ lọc và bảng
const staffSearchInput = document.getElementById("staffSearchInput");
const staffRoleFilter = document.getElementById("staffRoleFilter");
const staffStatusFilter = document.getElementById("staffStatusFilter");
const staffTableBody = document.getElementById("staffTableBody");
const emptyStaffText = document.getElementById("emptyStaffText");
const staffRowTemplate = document.getElementById("staffRowTemplate");

// 6. Lấy element nút thêm nhân viên
const openAddStaffBtn = document.getElementById("openAddStaffBtn");

// 7. Biến lưu admin hiện tại
let currentAdminUser = null;

// 8. Format ngày Việt Nam
function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN");
}

// 9. Render ngày hiện tại
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

// 10. Kiểm tra đăng nhập admin
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

// 11. Kiểm tra quyền quản lý nhân viên
function checkStaffPermission(adminUser) {
    if (!adminUser) return false;

    if (adminUser.role !== "owner") {
        alert("Bạn không có quyền truy cập trang quản lý nhân viên.");
        window.location.href = "../html/admin-dashboard.html";
        return false;
    }

    return true;
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
        adminAvatar.textContent = getFirstLetter(fullName);
    }

    const ownerOnlyLinks = document.querySelectorAll("[data-owner-only='true']");

    ownerOnlyLinks.forEach(function(link) {
        if (adminUser.role !== "owner") {
            link.style.display = "none";
        }
    });

    if (adminUser.role !== "owner" && openAddStaffBtn) {
        openAddStaffBtn.style.display = "none";
    }
}

// 13. Đăng xuất admin
function handleAdminLogout() {
    localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
    localStorage.removeItem(ADMIN_IS_LOGIN_KEY);

    window.location.href = "../html/admin-login.html";
}

// 14. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) return "A";

    return text.trim().charAt(0).toUpperCase();
}

// 15. Lấy ngày hôm nay dạng YYYY-MM-DD
function getTodayString() {
    return new Date().toISOString().slice(0, 10);
}

// 16. Chuẩn hóa nhân viên
function normalizeStaff(staff, index) {
    const defaultStaff = demoAdminStaff[index] || demoAdminStaff[0];

    return {
        id: staff.id || "NV" + String(index + 1).padStart(3, "0"),
        fullName: staff.fullName || defaultStaff.fullName || "Nhân viên",
        username: staff.username || defaultStaff.username || "",
        password: staff.password || defaultStaff.password || "123456",
        role: staff.role || defaultStaff.role || "staff",
        email: staff.email || defaultStaff.email || "Chưa cập nhật",
        phone: staff.phone || defaultStaff.phone || "Chưa cập nhật",
        status: staff.status || defaultStaff.status || "active",
        createdAt: staff.createdAt || defaultStaff.createdAt || getTodayString(),
        note: staff.note || ""
    };
}

// 17. Lấy danh sách nhân viên
function getStaffList() {
    const savedStaff = localStorage.getItem(ADMIN_STAFF_KEY);

    if (!savedStaff) {
        const normalizedDemoStaff = demoAdminStaff.map(function(staff, index) {
            return normalizeStaff(staff, index);
        });

        localStorage.setItem(ADMIN_STAFF_KEY, JSON.stringify(normalizedDemoStaff));

        return normalizedDemoStaff;
    }

    try {
        const staffList = JSON.parse(savedStaff);

        const normalizedStaffList = staffList.map(function(staff, index) {
            return normalizeStaff(staff, index);
        });

        localStorage.setItem(ADMIN_STAFF_KEY, JSON.stringify(normalizedStaffList));

        return normalizedStaffList;
    } catch (error) {
        const normalizedDemoStaff = demoAdminStaff.map(function(staff, index) {
            return normalizeStaff(staff, index);
        });

        localStorage.setItem(ADMIN_STAFF_KEY, JSON.stringify(normalizedDemoStaff));

        return normalizedDemoStaff;
    }
}

// 18. Lưu danh sách nhân viên
function saveStaffList(staffList) {
    localStorage.setItem(ADMIN_STAFF_KEY, JSON.stringify(staffList));
}

// 19. Tìm nhân viên theo id
function getStaffById(id) {
    const staffList = getStaffList();

    return staffList.find(function(staff) {
        return staff.id === id;
    });
}

// 20. Lấy thông tin vai trò
function getStaffRoleInfo(role) {
    if (role === "owner") {
        return {
            text: "Chủ cửa hàng",
            className: "roleOwner"
        };
    }

    return {
        text: "Nhân viên",
        className: "roleStaff"
    };
}

// 21. Lấy thông tin trạng thái
function getStaffStatusInfo(status) {
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

// 22. Kiểm tra có phải tài khoản chủ cửa hàng không
function isOwnerStaff(staff) {
    return staff && staff.role === "owner";
}

// 23. Kiểm tra có phải tài khoản đang đăng nhập không
function isCurrentLoginStaff(staff) {
    if (!staff || !currentAdminUser) return false;

    const sameUsername = staff.username && currentAdminUser.username && staff.username === currentAdminUser.username;
    const sameId = staff.id && currentAdminUser.id && staff.id === currentAdminUser.id;

    return sameUsername || sameId;
}

// 24. Render thống kê nhân viên
function renderStaffStats(staffList) {
    const activeStaff = staffList.filter(function(staff) {
        return staff.status === "active";
    });

    const ownerStaff = staffList.filter(function(staff) {
        return staff.role === "owner";
    });

    const lockedStaff = staffList.filter(function(staff) {
        return staff.status === "locked";
    });

    if (totalStaffCount) {
        totalStaffCount.textContent = staffList.length;
    }

    if (activeStaffCount) {
        activeStaffCount.textContent = activeStaff.length;
    }

    if (ownerStaffCount) {
        ownerStaffCount.textContent = ownerStaff.length;
    }

    if (lockedStaffCount) {
        lockedStaffCount.textContent = lockedStaff.length;
    }
}

// 25. Lọc nhân viên
function getFilteredStaffList(staffList) {
    const searchValue = staffSearchInput ? staffSearchInput.value.trim().toLowerCase() : "";
    const roleValue = staffRoleFilter ? staffRoleFilter.value : "all";
    const statusValue = staffStatusFilter ? staffStatusFilter.value : "all";

    return staffList.filter(function(staff) {
        const fullName = staff.fullName.toLowerCase();
        const username = staff.username.toLowerCase();
        const email = staff.email.toLowerCase();
        const phone = staff.phone.toLowerCase();
        const note = staff.note.toLowerCase();

        const matchSearch =
            fullName.includes(searchValue) ||
            username.includes(searchValue) ||
            email.includes(searchValue) ||
            phone.includes(searchValue) ||
            note.includes(searchValue);

        const matchRole =
            roleValue === "all" ||
            staff.role === roleValue;

        const matchStatus =
            statusValue === "all" ||
            staff.status === statusValue;

        return matchSearch && matchRole && matchStatus;
    });
}

// 26. Render bảng nhân viên
function renderStaffTable() {
    if (!staffTableBody || !staffRowTemplate) return;

    const staffList = getStaffList();
    const filteredStaffList = getFilteredStaffList(staffList);

    staffTableBody.innerHTML = "";

    if (emptyStaffText) {
        emptyStaffText.classList.toggle("show", filteredStaffList.length === 0);
    }

    filteredStaffList.forEach(function(staff) {
        const rowFragment = staffRowTemplate.content.cloneNode(true);
        const row = rowFragment.querySelector("tr");
        const roleInfo = getStaffRoleInfo(staff.role);
        const statusInfo = getStaffStatusInfo(staff.status);
        const roleBadge = rowFragment.querySelector(".staffRoleText");
        const statusBadge = rowFragment.querySelector(".staffStatusText");
        const deleteButton = rowFragment.querySelector("[data-action='delete']");

        row.dataset.staffId = staff.id;
        row.classList.add("clickableStaffRow");
        row.title = "Nhấn để xem và chỉnh sửa nhân viên";

        rowFragment.querySelector(".staffAvatarText").textContent = getFirstLetter(staff.fullName);
        rowFragment.querySelector(".staffFullNameText").textContent = staff.fullName;
        rowFragment.querySelector(".staffCodeText").textContent = staff.id;
        rowFragment.querySelector(".staffUsernameText").textContent = staff.username;

        rowFragment.querySelector(".staffEmailText").textContent = staff.email;
        rowFragment.querySelector(".staffPhoneText").textContent = staff.phone;

        roleBadge.textContent = roleInfo.text;
        roleBadge.classList.add(roleInfo.className);

        rowFragment.querySelector(".staffCreatedAtText").textContent = formatDate(staff.createdAt);

        statusBadge.textContent = statusInfo.text;
        statusBadge.classList.add(statusInfo.className);

        rowFragment.querySelector(".staffNoteText").textContent = staff.note || "-";

        if (isOwnerStaff(staff) || isCurrentLoginStaff(staff)) {
            if (deleteButton) {
                deleteButton.disabled = true;
                deleteButton.classList.add("disabledBtn");
                deleteButton.title = "Không thể xóa tài khoản này";
            }
        }

        staffTableBody.appendChild(rowFragment);
    });

    renderStaffStats(staffList);
}

// 27. Chuyển sang trang chi tiết nhân viên
function goToStaffDetail(staffId) {
    if (!staffId) return;

    window.location.href = "../html/admin-staff-detail.html?id=" + encodeURIComponent(staffId);
}

// 28. Xóa nhân viên
function deleteStaff(id) {
    const staffList = getStaffList();
    const staff = getStaffById(id);

    if (!staff) return;

    if (isOwnerStaff(staff)) {
        alert("Không thể xóa tài khoản chủ cửa hàng.");
        return;
    }

    if (isCurrentLoginStaff(staff)) {
        alert("Không thể xóa tài khoản đang đăng nhập.");
        return;
    }

    const isConfirm = confirm("Bạn có chắc muốn xóa nhân viên " + staff.fullName + "?");

    if (!isConfirm) return;

    const updatedStaffList = staffList.filter(function(item) {
        return item.id !== id;
    });

    saveStaffList(updatedStaffList);
    renderStaffTable();
}

// 29. Xử lý thao tác bảng nhân viên
function handleStaffTableAction(event) {
    const actionButton = event.target.closest("[data-action]");
    const row = event.target.closest("tr");

    if (!row) return;

    const id = row.dataset.staffId;

    if (actionButton) {
        event.stopPropagation();

        if (actionButton.disabled) return;

        const action = actionButton.dataset.action;

        if (action === "delete") {
            deleteStaff(id);
        }

        return;
    }

    goToStaffDetail(id);
}

// 30. Gắn sự kiện trang nhân viên
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

// 31. Khởi tạo trang quản lý nhân viên
function initAdminStaffPage() {
    currentAdminUser = checkAdminLogin();

    if (!currentAdminUser) return;

    const hasPermission = checkStaffPermission(currentAdminUser);

    if (!hasPermission) return;

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    renderStaffTable();
    bindStaffEvents();
}

initAdminStaffPage();