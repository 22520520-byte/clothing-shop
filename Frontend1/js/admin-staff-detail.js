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

// 3. Dữ liệu lịch sử hoạt động mẫu
const demoStaffActivitiesByStaff = {
    NV001: [
        {
            id: "ACT001",
            type: "login",
            title: "Đăng nhập hệ thống",
            detail: "Chủ cửa hàng đã đăng nhập vào trang quản trị.",
            targetType: "Hệ thống",
            targetId: "ADMIN",
            createdAt: "2026-05-25T08:15:00"
        },
        {
            id: "ACT002",
            type: "voucher",
            title: "Tạo voucher đổi điểm",
            detail: "Tạo ưu đãi POINT50 - Voucher giảm 50.000đ cần 1000 điểm để đổi.",
            targetType: "Voucher",
            targetId: "POINT50",
            createdAt: "2026-05-25T09:20:00"
        },
        {
            id: "ACT003",
            type: "staff",
            title: "Cập nhật tài khoản nhân viên",
            detail: "Cập nhật trạng thái tài khoản NV002 sang đang hoạt động.",
            targetType: "Nhân viên",
            targetId: "NV002",
            createdAt: "2026-05-24T16:40:00"
        }
    ],
    NV002: [
        {
            id: "ACT004",
            type: "login",
            title: "Đăng nhập hệ thống",
            detail: "Nhân viên bán hàng đã đăng nhập vào trang quản trị.",
            targetType: "Hệ thống",
            targetId: "ADMIN",
            createdAt: "2026-05-25T08:45:00"
        },
        {
            id: "ACT005",
            type: "order",
            title: "Cập nhật trạng thái đơn hàng",
            detail: "Cập nhật đơn DH001 từ Chờ xác nhận sang Đang giao.",
            targetType: "Đơn hàng",
            targetId: "DH001",
            createdAt: "2026-05-25T09:10:00"
        },
        {
            id: "ACT006",
            type: "product",
            title: "Chỉnh sửa sản phẩm",
            detail: "Cập nhật tồn kho và kích thước cho sản phẩm Áo hoodie form rộng.",
            targetType: "Sản phẩm",
            targetId: "SP002",
            createdAt: "2026-05-24T20:30:00"
        },
        {
            id: "ACT007",
            type: "customer",
            title: "Xem thông tin khách hàng",
            detail: "Xem dashboard chi tiết của khách hàng Nguyễn Minh Anh.",
            targetType: "Khách hàng",
            targetId: "KH001",
            createdAt: "2026-05-24T18:05:00"
        }
    ],
    NV003: [
        {
            id: "ACT008",
            type: "login",
            title: "Đăng nhập hệ thống",
            detail: "Nhân viên kho đã đăng nhập vào trang quản trị.",
            targetType: "Hệ thống",
            targetId: "ADMIN",
            createdAt: "2026-05-25T07:55:00"
        },
        {
            id: "ACT009",
            type: "product",
            title: "Cập nhật tồn kho sản phẩm",
            detail: "Cập nhật số lượng size cho sản phẩm Quần jean xanh đậm.",
            targetType: "Sản phẩm",
            targetId: "SP003",
            createdAt: "2026-05-25T10:05:00"
        },
        {
            id: "ACT010",
            type: "product",
            title: "Ẩn sản phẩm hết hàng",
            detail: "Chuyển trạng thái sản phẩm Áo khoác kaki nữ sang Đang ẩn.",
            targetType: "Sản phẩm",
            targetId: "SP005",
            createdAt: "2026-05-23T15:30:00"
        }
    ],
    NV004: [
        {
            id: "ACT011",
            type: "login",
            title: "Đăng nhập hệ thống",
            detail: "Nhân viên cũ đã đăng nhập vào trang quản trị.",
            targetType: "Hệ thống",
            targetId: "ADMIN",
            createdAt: "2026-04-20T08:30:00"
        },
        {
            id: "ACT012",
            type: "staff",
            title: "Tài khoản bị khóa",
            detail: "Tài khoản nhân viên đã được chuyển sang trạng thái Đã khóa.",
            targetType: "Nhân viên",
            targetId: "NV004",
            createdAt: "2026-04-20T17:00:00"
        }
    ]
};

// 4. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

// 5. Lấy element tiêu đề trang
const staffDetailTitle = document.getElementById("staffDetailTitle");
const staffDetailSubtitle = document.getElementById("staffDetailSubtitle");
const staffFormTitle = document.getElementById("staffFormTitle");

// 6. Lấy element form nhân viên
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

// 7. Lấy element lịch sử hoạt động
const staffActivityCard = document.getElementById("staffActivityCard");
const staffActivitySummaryCard = document.querySelector(".staffActivitySummaryCard");
const staffActivityList = document.getElementById("staffActivityList");
const emptyStaffActivityText = document.getElementById("emptyStaffActivityText");
const staffActivityItemTemplate = document.getElementById("staffActivityItemTemplate");
const staffActivityTotalCount = document.getElementById("staffActivityTotalCount");
const staffActivityLastLogin = document.getElementById("staffActivityLastLogin");
const staffActivityMainAction = document.getElementById("staffActivityMainAction");
const staffActivityLastAction = document.getElementById("staffActivityLastAction");

// 8. Lấy element trạng thái trang
const staffDetailLayout = document.getElementById("staffDetailLayout");
const staffNotFoundBox = document.getElementById("staffNotFoundBox");

// 9. Biến lưu trạng thái trang
let currentAdminUser = null;
let currentStaffId = null;
let currentStaffData = null;
let isEditMode = false;

// 10. Lấy ngày hôm nay dạng YYYY-MM-DD
function getTodayString() {
    return new Date().toISOString().slice(0, 10);
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

// 12. Lấy id nhân viên từ URL
function getStaffIdFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return params.get("id");
}

// 13. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) return "A";

    return text.trim().charAt(0).toUpperCase();
}

// 14. Format ngày Việt Nam
function formatDate(dateString) {
    if (!dateString) return "Chưa có";

    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN");
}

// 15. Format ngày giờ Việt Nam
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return "Chưa có";

    const date = new Date(dateTimeString);

    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

// 16. Kiểm tra đăng nhập admin
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

// 17. Kiểm tra quyền quản lý nhân viên
function checkStaffPermission(adminUser) {
    if (!adminUser) return false;

    if (adminUser.role !== "owner") {
        alert("Bạn không có quyền thêm hoặc chỉnh sửa nhân viên.");
        window.location.href = "../html/admin-dashboard.html";
        return false;
    }

    return true;
}

// 18. Hiển thị thông tin admin
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
}

// 19. Đăng xuất admin
function handleAdminLogout() {
    localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
    localStorage.removeItem(ADMIN_IS_LOGIN_KEY);

    window.location.href = "../html/admin-login.html";
}

// 20. Chuẩn hóa nhân viên
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

// 21. Lấy danh sách nhân viên
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

// 22. Lưu danh sách nhân viên
function saveStaffList(staffList) {
    localStorage.setItem(ADMIN_STAFF_KEY, JSON.stringify(staffList));
}

// 23. Tạo mã nhân viên mới
function createStaffId() {
    const staffList = getStaffList();

    if (staffList.length === 0) {
        return "NV001";
    }

    const maxNumber = staffList.reduce(function(max, staff) {
        const number = Number(String(staff.id).replace("NV", ""));

        return number > max ? number : max;
    }, 0);

    return "NV" + String(maxNumber + 1).padStart(3, "0");
}

// 24. Tìm nhân viên theo id
function getStaffById(id) {
    const staffList = getStaffList();

    return staffList.find(function(staff) {
        return staff.id === id;
    });
}

// 25. Kiểm tra có phải tài khoản đang đăng nhập không
function isCurrentLoginStaff(staff) {
    if (!staff || !currentAdminUser) return false;

    const sameUsername = staff.username && currentAdminUser.username && staff.username === currentAdminUser.username;
    const sameId = staff.id && currentAdminUser.id && staff.id === currentAdminUser.id;

    return sameUsername || sameId;
}

// 26. Đếm số tài khoản chủ cửa hàng
function countOwnerStaff(staffList) {
    return staffList.filter(function(staff) {
        return staff.role === "owner";
    }).length;
}

// 27. Hiển thị không tìm thấy nhân viên
function showStaffNotFound() {
    if (staffDetailLayout) {
        staffDetailLayout.style.display = "none";
    }

    if (staffNotFoundBox) {
        staffNotFoundBox.style.display = "block";
    }
}

// 28. Render tiêu đề trang
function renderPageTitle() {
    if (isEditMode) {
        if (staffDetailTitle) {
            staffDetailTitle.textContent = "Sửa nhân viên";
        }

        if (staffDetailSubtitle) {
            staffDetailSubtitle.textContent = "Chỉnh sửa thông tin tài khoản nhân viên";
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

// 29. Hiển thị lỗi form
function showStaffFormMessage(message, type = "error") {
    if (!staffFormMessage) return;

    staffFormMessage.textContent = message;

    if (type === "success") {
        staffFormMessage.classList.add("success");
    } else {
        staffFormMessage.classList.remove("success");
    }
}

// 30. Xóa lỗi form
function clearStaffFormMessage() {
    if (!staffFormMessage) return;

    staffFormMessage.textContent = "";
    staffFormMessage.classList.remove("success");
}

// 31. Ẩn/hiện khu vực hoạt động nhân viên
function toggleStaffActivityArea(isShow) {
    if (staffActivityCard) {
        staffActivityCard.style.display = isShow ? "block" : "none";
    }

    if (staffActivitySummaryCard) {
        staffActivitySummaryCard.style.display = isShow ? "block" : "none";
    }
}

// 32. Đổ dữ liệu nhân viên vào form
function fillStaffForm(staff) {
    if (!staff) return;

    if (staffId) staffId.value = staff.id;
    if (staffFullName) staffFullName.value = staff.fullName;
    if (staffUsername) staffUsername.value = staff.username;
    if (staffPassword) staffPassword.value = staff.password;
    if (staffRoleInput) staffRoleInput.value = staff.role;
    if (staffEmail) staffEmail.value = staff.email;
    if (staffPhone) staffPhone.value = staff.phone;
    if (staffCreatedAt) staffCreatedAt.value = staff.createdAt;
    if (staffStatusInput) staffStatusInput.value = staff.status;
    if (staffNote) staffNote.value = staff.note;
}

// 33. Set form mặc định khi thêm mới
function setDefaultStaffForm() {
    if (staffId) staffId.value = "";
    if (staffFullName) staffFullName.value = "";
    if (staffUsername) staffUsername.value = "";
    if (staffPassword) staffPassword.value = "";
    if (staffRoleInput) staffRoleInput.value = "staff";
    if (staffEmail) staffEmail.value = "";
    if (staffPhone) staffPhone.value = "";
    if (staffStatusInput) staffStatusInput.value = "active";
    if (staffCreatedAt) staffCreatedAt.value = getTodayString();
    if (staffNote) staffNote.value = "";

    toggleStaffActivityArea(false);
}

// 34. Kiểm tra email đơn giản
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 35. Kiểm tra form nhân viên
function validateStaffForm() {
    const fullName = staffFullName.value.trim();
    const username = staffUsername.value.trim();
    const password = staffPassword.value.trim();
    const role = staffRoleInput.value;
    const email = staffEmail.value.trim();
    const phone = staffPhone.value.trim();
    const createdAt = staffCreatedAt.value;
    const status = staffStatusInput.value;

    if (!fullName) {
        showStaffFormMessage("Vui lòng nhập họ tên nhân viên.");
        return false;
    }

    if (!username) {
        showStaffFormMessage("Vui lòng nhập tên đăng nhập.");
        return false;
    }

    if (username.length < 4) {
        showStaffFormMessage("Tên đăng nhập nên có ít nhất 4 ký tự.");
        return false;
    }

    if (!password) {
        showStaffFormMessage("Vui lòng nhập mật khẩu.");
        return false;
    }

    if (password.length < 6) {
        showStaffFormMessage("Mật khẩu nên có ít nhất 6 ký tự.");
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

    if (!createdAt) {
        showStaffFormMessage("Vui lòng chọn ngày tạo tài khoản.");
        return false;
    }

    if (!status) {
        showStaffFormMessage("Vui lòng chọn trạng thái tài khoản.");
        return false;
    }

    return true;
}

// 36. Lấy dữ liệu từ form nhân viên
function getStaffFormData() {
    return {
        id: staffId.value || createStaffId(),
        fullName: staffFullName.value.trim(),
        username: staffUsername.value.trim(),
        password: staffPassword.value.trim(),
        role: staffRoleInput.value,
        email: staffEmail.value.trim(),
        phone: staffPhone.value.trim(),
        status: staffStatusInput.value,
        createdAt: staffCreatedAt.value,
        note: staffNote.value.trim()
    };
}

// 37. Kiểm tra trùng username
function isDuplicateUsername(staffList, formData) {
    return staffList.some(function(staff) {
        return staff.username.toLowerCase() === formData.username.toLowerCase() &&
            staff.id !== formData.id;
    });
}

// 38. Kiểm tra trùng email
function isDuplicateEmail(staffList, formData) {
    return staffList.some(function(staff) {
        return staff.email.toLowerCase() === formData.email.toLowerCase() &&
            staff.id !== formData.id;
    });
}

// 39. Kiểm tra trùng số điện thoại
function isDuplicatePhone(staffList, formData) {
    return staffList.some(function(staff) {
        return staff.phone === formData.phone &&
            staff.id !== formData.id;
    });
}

// 40. Kiểm tra chỉnh sửa tài khoản chủ cửa hàng
function validateOwnerSafety(staffList, formData) {
    if (!isEditMode || !currentStaffData) {
        return true;
    }

    const currentIsOwner = currentStaffData.role === "owner";
    const formIsOwner = formData.role === "owner";

    if (currentIsOwner && !formIsOwner && countOwnerStaff(staffList) <= 1) {
        showStaffFormMessage("Hệ thống phải có ít nhất 1 tài khoản chủ cửa hàng.");
        return false;
    }

    if (currentIsOwner && formData.status === "locked" && countOwnerStaff(staffList) <= 1) {
        showStaffFormMessage("Không thể khóa tài khoản chủ cửa hàng duy nhất.");
        return false;
    }

    if (isCurrentLoginStaff(currentStaffData) && formData.status === "locked") {
        showStaffFormMessage("Không thể khóa tài khoản đang đăng nhập.");
        return false;
    }

    if (isCurrentLoginStaff(currentStaffData) && formData.role !== "owner") {
        showStaffFormMessage("Không thể hạ quyền tài khoản đang đăng nhập.");
        return false;
    }

    return true;
}

// 41. Cập nhật lại current admin nếu đang sửa chính tài khoản đăng nhập
function updateCurrentAdminIfNeeded(formData) {
    if (!currentAdminUser || !currentStaffData) return;

    const sameUsername = currentAdminUser.username && currentAdminUser.username === currentStaffData.username;
    const sameId = currentAdminUser.id && currentAdminUser.id === currentStaffData.id;

    if (!sameUsername && !sameId) return;

    const updatedAdminUser = {
        ...currentAdminUser,
        id: formData.id,
        fullName: formData.fullName,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        status: formData.status
    };

    localStorage.setItem(ADMIN_CURRENT_USER_KEY, JSON.stringify(updatedAdminUser));
}

// 42. Lấy icon theo loại hoạt động
function getActivityIcon(type) {
    switch (type) {
        case "login":
            return "↪";

        case "order":
            return "□";

        case "product":
            return "▦";

        case "customer":
            return "♡";

        case "voucher":
            return "%";

        case "staff":
            return "☷";

        default:
            return "•";
    }
}

// 43. Lấy nhãn loại hoạt động
function getActivityTypeText(type) {
    switch (type) {
        case "login":
            return "Đăng nhập";

        case "order":
            return "Đơn hàng";

        case "product":
            return "Sản phẩm";

        case "customer":
            return "Khách hàng";

        case "voucher":
            return "Voucher";

        case "staff":
            return "Nhân viên";

        default:
            return "Hoạt động";
    }
}

// 44. Lấy lịch sử hoạt động theo nhân viên
function getStaffActivities(staffId) {
    const activities = demoStaffActivitiesByStaff[staffId] || [];

    return [...activities].sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

// 45. Tìm lần đăng nhập gần nhất
function getLastLoginActivity(activities) {
    return activities.find(function(activity) {
        return activity.type === "login";
    });
}

// 46. Tìm loại thao tác thường gặp
function getMainActionType(activities) {
    if (!activities || activities.length === 0) return "Chưa có";

    const countMap = {};

    activities.forEach(function(activity) {
        if (activity.type === "login") return;

        countMap[activity.type] = (countMap[activity.type] || 0) + 1;
    });

    const actionTypes = Object.keys(countMap);

    if (actionTypes.length === 0) {
        return "Đăng nhập";
    }

    const mainType = actionTypes.reduce(function(maxType, currentType) {
        return countMap[currentType] > countMap[maxType] ? currentType : maxType;
    }, actionTypes[0]);

    return getActivityTypeText(mainType);
}

// 47. Render tổng quan hoạt động
function renderStaffActivityOverview(activities) {
    const lastLogin = getLastLoginActivity(activities);
    const lastActivity = activities[0];

    if (staffActivityTotalCount) {
        staffActivityTotalCount.textContent = activities.length;
    }

    if (staffActivityLastLogin) {
        staffActivityLastLogin.textContent = lastLogin ? formatDateTime(lastLogin.createdAt) : "Chưa có";
    }

    if (staffActivityMainAction) {
        staffActivityMainAction.textContent = getMainActionType(activities);
    }

    if (staffActivityLastAction) {
        staffActivityLastAction.textContent = lastActivity ? lastActivity.title : "Chưa có";
    }
}

// 48. Render lịch sử hoạt động
function renderStaffActivities(staffId) {
    if (!staffActivityList || !staffActivityItemTemplate) return;

    const activities = getStaffActivities(staffId);

    staffActivityList.innerHTML = "";

    if (emptyStaffActivityText) {
        emptyStaffActivityText.classList.toggle("show", activities.length === 0);
    }

    activities.forEach(function(activity) {
        const activityFragment = staffActivityItemTemplate.content.cloneNode(true);

        activityFragment.querySelector(".staffActivityIconText").textContent = getActivityIcon(activity.type);
        activityFragment.querySelector(".staffActivityTitleText").textContent = activity.title;
        activityFragment.querySelector(".staffActivityTimeText").textContent = formatDateTime(activity.createdAt);
        activityFragment.querySelector(".staffActivityDetailText").textContent = activity.detail;
        activityFragment.querySelector(".staffActivityTypeText").textContent = getActivityTypeText(activity.type);
        activityFragment.querySelector(".staffActivityTargetText").textContent = activity.targetType + " · " + activity.targetId;

        staffActivityList.appendChild(activityFragment);
    });

    renderStaffActivityOverview(activities);
}

// 49. Lưu nhân viên
function saveStaff(formData) {
    const staffList = getStaffList();

    if (isDuplicateUsername(staffList, formData)) {
        showStaffFormMessage("Tên đăng nhập đã tồn tại.");
        return;
    }

    if (isDuplicateEmail(staffList, formData)) {
        showStaffFormMessage("Email đã tồn tại.");
        return;
    }

    if (isDuplicatePhone(staffList, formData)) {
        showStaffFormMessage("Số điện thoại đã tồn tại.");
        return;
    }

    if (!validateOwnerSafety(staffList, formData)) {
        return;
    }

    let updatedStaffList;

    if (isEditMode) {
        updatedStaffList = staffList.map(function(staff) {
            if (staff.id === formData.id) {
                return formData;
            }

            return staff;
        });

        updateCurrentAdminIfNeeded(formData);
    } else {
        updatedStaffList = [formData].concat(staffList);
    }

    saveStaffList(updatedStaffList);

    alert("Lưu nhân viên thành công.");
    window.location.href = "../html/admin-staff.html";
}

// 50. Xử lý submit form
function handleStaffFormSubmit(event) {
    event.preventDefault();

    clearStaffFormMessage();

    if (!validateStaffForm()) return;

    const formData = getStaffFormData();

    saveStaff(formData);
}

// 51. Gắn sự kiện trang chi tiết nhân viên
function bindStaffDetailEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (staffDetailForm) {
        staffDetailForm.addEventListener("submit", handleStaffFormSubmit);
    }
}

// 52. Khởi tạo trang chi tiết nhân viên
function initAdminStaffDetailPage() {
    currentAdminUser = checkAdminLogin();

    if (!currentAdminUser) return;

    const hasPermission = checkStaffPermission(currentAdminUser);

    if (!hasPermission) return;

    currentStaffId = getStaffIdFromUrl();
    isEditMode = Boolean(currentStaffId);

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    renderPageTitle();

    if (isEditMode) {
        currentStaffData = getStaffById(currentStaffId);

        if (!currentStaffData) {
            showStaffNotFound();
            return;
        }

        toggleStaffActivityArea(true);
        fillStaffForm(currentStaffData);
        renderStaffActivities(currentStaffData.id);
    } else {
        setDefaultStaffForm();
    }

    bindStaffDetailEvents();
}

initAdminStaffDetailPage();