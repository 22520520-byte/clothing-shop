// =========================================================
// File: Frontend1/js/admin-customer-detail.js
// Mục đích: Gắn trang chi tiết khách hàng admin với API backend thật
// =========================================================


// 1. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");


// 2. Lấy element profile khách hàng bên trái
const detailCustomerAvatar = document.getElementById("detailCustomerAvatar");
const detailCustomerCode = document.getElementById("detailCustomerCode");
const detailCustomerName = document.getElementById("detailCustomerName");
const detailCustomerContact = document.getElementById("detailCustomerContact");
const detailCustomerRankBadge = document.getElementById("detailCustomerRankBadge");
const detailCustomerStatusBadge = document.getElementById("detailCustomerStatusBadge");


// 3. Lấy element menu tab
const customerDetailMenuItems = document.querySelectorAll("[data-customer-tab]");
const customerTabPanels = document.querySelectorAll("[data-customer-panel]");


// 4. Lấy element tab thông tin tài khoản
const accountAvatarText = document.getElementById("accountAvatarText");
const accountHeaderName = document.getElementById("accountHeaderName");
const accountHeaderContact = document.getElementById("accountHeaderContact");

const accountFullName = document.getElementById("accountFullName");
const accountEmail = document.getElementById("accountEmail");
const accountPhone = document.getElementById("accountPhone");
const accountBirthDate = document.getElementById("accountBirthDate");

const accountProvince = document.getElementById("accountProvince");
const accountDistrict = document.getElementById("accountDistrict");
const accountWard = document.getElementById("accountWard");
const accountStatus = document.getElementById("accountStatus");
const accountDetailAddress = document.getElementById("accountDetailAddress");

const accountGenderMale = document.getElementById("accountGenderMale");
const accountGenderFemale = document.getElementById("accountGenderFemale");
const accountGenderOther = document.getElementById("accountGenderOther");


// 5. Lấy element tab đơn hàng
const customerOrderCardList = document.getElementById("customerOrderCardList");
const customerOrderCardTemplate = document.getElementById("customerOrderCardTemplate");
const customerOrderProductTemplate = document.getElementById("customerOrderProductTemplate");
const emptyCustomerOrderCardText = document.getElementById("emptyCustomerOrderCardText");


// 6. Lấy element lịch sử mua hàng
const customerOrderHistoryBody = document.getElementById("customerOrderHistoryBody");
const customerOrderRowTemplate = document.getElementById("customerOrderRowTemplate");
const emptyCustomerOrderText = document.getElementById("emptyCustomerOrderText");


// 7. Lấy element sản phẩm yêu thích
const customerWishlistList = document.getElementById("customerWishlistList");
const customerWishlistItemTemplate = document.getElementById("customerWishlistItemTemplate");
const emptyWishlistText = document.getElementById("emptyWishlistText");

const wishlistProductDetailEmpty = document.getElementById("wishlistProductDetailEmpty");
const wishlistProductDetailContent = document.getElementById("wishlistProductDetailContent");

const wishlistDetailImage = document.getElementById("wishlistDetailImage");
const wishlistDetailImageText = document.getElementById("wishlistDetailImageText");
const wishlistDetailProductCode = document.getElementById("wishlistDetailProductCode");
const wishlistDetailProductName = document.getElementById("wishlistDetailProductName");
const wishlistDetailProductPrice = document.getElementById("wishlistDetailProductPrice");
const wishlistDetailProductGroup = document.getElementById("wishlistDetailProductGroup");
const wishlistDetailProductCategory = document.getElementById("wishlistDetailProductCategory");
const wishlistDetailProductSalePrice = document.getElementById("wishlistDetailProductSalePrice");
const wishlistDetailProductOldPrice = document.getElementById("wishlistDetailProductOldPrice");
const wishlistDetailProductMaterial = document.getElementById("wishlistDetailProductMaterial");
const wishlistDetailProductStock = document.getElementById("wishlistDetailProductStock");
const wishlistDetailProductColors = document.getElementById("wishlistDetailProductColors");
const wishlistDetailProductStatus = document.getElementById("wishlistDetailProductStatus");
const wishlistDetailProductSizes = document.getElementById("wishlistDetailProductSizes");
const wishlistDetailProductDescription = document.getElementById("wishlistDetailProductDescription");


// 8. Lấy element điểm tích lũy
const pointsCurrent = document.getElementById("pointsCurrent");
const pointsEarned = document.getElementById("pointsEarned");
const pointsUsed = document.getElementById("pointsUsed");
const pointTransactionList = document.getElementById("pointTransactionList");
const pointTransactionTemplate = document.getElementById("pointTransactionTemplate");
const emptyPointTransactionText = document.getElementById("emptyPointTransactionText");


// 9. Lấy element trạng thái trang
const customerDetailWorkspace = document.getElementById("customerDetailWorkspace");
const customerNotFoundBox = document.getElementById("customerNotFoundBox");


// 10. Biến lưu dữ liệu hiện tại
let currentAdminUser = null;
let currentCustomerId = null;
let currentCustomerData = null;


// 11. Format tiền Việt Nam
function formatPrice(price) {
    if (window.AdminApi && window.AdminApi.formatPrice) {
        return window.AdminApi.formatPrice(price);
    }

    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}


// 12. Format ngày Việt Nam
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


// 13. Render ngày hiện tại
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


// 14. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) {
        return "K";
    }

    return String(text).trim().charAt(0).toUpperCase();
}


// 15. Lấy customer id từ URL
function getCustomerIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || params.get("customer_id") || "";
}


// 16. Lấy nhãn vai trò admin
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


// 17. Hiển thị thông tin admin
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


// 18. Xử lý đăng xuất
function handleAdminLogout() {
    if (window.AdminApi && window.AdminApi.logoutAdmin) {
        window.AdminApi.logoutAdmin();
        return;
    }

    localStorage.removeItem("admin_current_user");
    localStorage.removeItem("admin_is_login");
    window.location.href = "../html/admin-login.html";
}


// 19. Hiển thị không tìm thấy khách hàng
function showCustomerNotFound() {
    if (customerDetailWorkspace) {
        customerDetailWorkspace.style.display = "none";
    }

    if (customerNotFoundBox) {
        customerNotFoundBox.style.display = "block";
    }
}


// 20. Hiển thị workspace khách hàng
function showCustomerWorkspace() {
    if (customerDetailWorkspace) {
        customerDetailWorkspace.style.display = "block";
    }

    if (customerNotFoundBox) {
        customerNotFoundBox.style.display = "none";
    }
}


// 21. Đổi tab khách hàng
function setActiveCustomerTab(tabName) {
    customerDetailMenuItems.forEach(function (menuItem) {
        const isActive = menuItem.dataset.customerTab === tabName;
        menuItem.classList.toggle("active", isActive);
    });

    customerTabPanels.forEach(function (panel) {
        const isActive = panel.dataset.customerPanel === tabName;
        panel.classList.toggle("active", isActive);
    });
}


// 22. Lấy hạng khách hàng
function getCustomerRankCode(customer) {
    if (customer.customer_profile && customer.customer_profile.membership_level) {
        return customer.customer_profile.membership_level;
    }

    return customer.membership_level || "normal";
}


// 23. Lấy nhãn hạng khách hàng
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


// 24. Lấy trạng thái khách hàng
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


// 25. Lấy thông tin trạng thái đơn hàng
function getOrderStatusInfo(status) {
    if (status === "pending") {
        return {
            text: "Chờ xác nhận",
            className: "statusPending"
        };
    }

    if (status === "confirmed") {
        return {
            text: "Đã xác nhận",
            className: "statusShipping"
        };
    }

    if (status === "shipping") {
        return {
            text: "Đang giao",
            className: "statusShipping"
        };
    }

    if (status === "completed") {
        return {
            text: "Hoàn thành",
            className: "statusCompleted"
        };
    }

    if (status === "cancelled") {
        return {
            text: "Đã hủy",
            className: "statusCancelled"
        };
    }

    return {
        text: "Chờ xác nhận",
        className: "statusPending"
    };
}


// 26. Lấy địa chỉ mặc định của khách hàng
function getDefaultAddress(customer) {
    const addresses = Array.isArray(customer.addresses) ? customer.addresses : [];

    if (addresses.length === 0) {
        return null;
    }

    const defaultAddress = addresses.find(function (address) {
        return Number(address.is_default || 0) === 1;
    });

    return defaultAddress || addresses[0];
}


// 27. Tạo địa chỉ đầy đủ
function buildAddressText(address) {
    if (!address) {
        return "Chưa cập nhật";
    }

    return [
        address.address_detail,
        address.ward,
        address.district,
        address.province
    ].filter(Boolean).join(", ") || "Chưa cập nhật";
}


// 28. Set dữ liệu readonly
function setReadonlyInputValue(element, value) {
    if (!element) {
        return;
    }

    element.value = value || "Chưa cập nhật";
}


// 29. Reset radio giới tính
function resetGenderRadio() {
    if (accountGenderMale) {
        accountGenderMale.checked = false;
    }

    if (accountGenderFemale) {
        accountGenderFemale.checked = false;
    }

    if (accountGenderOther) {
        accountGenderOther.checked = false;
    }
}


// 30. Render giới tính
function renderGender(gender) {
    resetGenderRadio();

    if (gender === "male" && accountGenderMale) {
        accountGenderMale.checked = true;
        return;
    }

    if (gender === "female" && accountGenderFemale) {
        accountGenderFemale.checked = true;
        return;
    }

    if (accountGenderOther) {
        accountGenderOther.checked = true;
    }
}


// 31. Chuẩn hóa khách hàng từ API
function normalizeCustomer(customer) {
    const defaultAddress = getDefaultAddress(customer);
    const rank = getCustomerRankCode(customer);
    const pointsBalance = customer.customer_profile
        ? Number(customer.customer_profile.points_balance || 0)
        : 0;

    const orderSummary = customer.order_summary || {};

    return {
        id: Number(customer.id || 0),
        code: "KH" + String(customer.id || 0).padStart(3, "0"),

        fullName: customer.full_name || "Khách hàng",
        email: customer.email || "Chưa cập nhật",
        phone: customer.phone || "Chưa cập nhật",

        birthDate: customer.date_of_birth || "",
        gender: customer.gender || "other",
        status: customer.status || "active",
        rank: rank,

        province: defaultAddress ? defaultAddress.province : "Chưa cập nhật",
        district: defaultAddress ? defaultAddress.district : "Chưa cập nhật",
        ward: defaultAddress ? defaultAddress.ward : "Chưa cập nhật",
        detailAddress: defaultAddress ? defaultAddress.address_detail : "Chưa cập nhật",
        address: buildAddressText(defaultAddress),

        points: pointsBalance,
        totalPointsEarned: pointsBalance,
        totalPointsUsed: 0,

        orderCount: Number(orderSummary.total_orders || 0),
        totalSpent: Number(orderSummary.total_spent || 0),
        lastOrderDate: orderSummary.last_order_at || "",

        recentOrders: Array.isArray(customer.recent_orders) ? customer.recent_orders : [],
        addresses: Array.isArray(customer.addresses) ? customer.addresses : [],

        raw: customer
    };
}


// 32. Render profile khách hàng bên trái
function renderCustomerProfile(customer) {
    const rankInfo = getCustomerRankInfo(customer.rank);
    const statusInfo = getCustomerStatusInfo(customer.status);

    if (detailCustomerAvatar) {
        detailCustomerAvatar.textContent = getFirstLetter(customer.fullName);
    }

    if (detailCustomerCode) {
        detailCustomerCode.textContent = customer.code;
    }

    if (detailCustomerName) {
        detailCustomerName.textContent = customer.fullName;
    }

    if (detailCustomerContact) {
        detailCustomerContact.textContent = customer.email + " · " + customer.phone;
    }

    if (detailCustomerRankBadge) {
        detailCustomerRankBadge.textContent = rankInfo.text;
        detailCustomerRankBadge.className = "rankBadge " + rankInfo.className;
    }

    if (detailCustomerStatusBadge) {
        detailCustomerStatusBadge.textContent = statusInfo.text;
        detailCustomerStatusBadge.className = "statusBadge " + statusInfo.className;
    }
}


// 33. Render thông tin tài khoản
function renderAccountInfo(customer) {
    const statusInfo = getCustomerStatusInfo(customer.status);

    if (accountAvatarText) {
        accountAvatarText.textContent = getFirstLetter(customer.fullName);
    }

    if (accountHeaderName) {
        accountHeaderName.textContent = customer.fullName;
    }

    if (accountHeaderContact) {
        accountHeaderContact.textContent = customer.email + " · " + customer.phone;
    }

    setReadonlyInputValue(accountFullName, customer.fullName);
    setReadonlyInputValue(accountEmail, customer.email);
    setReadonlyInputValue(accountPhone, customer.phone);

    if (accountBirthDate) {
        accountBirthDate.value = customer.birthDate || "";
    }

    setReadonlyInputValue(accountProvince, customer.province);
    setReadonlyInputValue(accountDistrict, customer.district);
    setReadonlyInputValue(accountWard, customer.ward);
    setReadonlyInputValue(accountStatus, statusInfo.text);
    setReadonlyInputValue(accountDetailAddress, customer.detailAddress);

    renderGender(customer.gender);
}


// 34. Lấy mã đơn
function getOrderCode(order) {
    return order.order_code || order.code || "DH" + String(order.id || 0).padStart(6, "0");
}


// 35. Lấy trạng thái đơn
function getOrderStatusCode(order) {
    if (order.status && order.status.code) {
        return order.status.code;
    }

    return order.order_status || "pending";
}


// 36. Lấy nhãn trạng thái đơn
function getOrderStatusLabel(order) {
    if (order.status && order.status.label) {
        return order.status.label;
    }

    return getOrderStatusInfo(getOrderStatusCode(order)).text;
}


// 37. Lấy tổng tiền đơn
function getOrderFinalTotal(order) {
    if (order.money && order.money.final_total !== undefined) {
        return Number(order.money.final_total || 0);
    }

    return Number(order.final_total || 0);
}


// 38. Lấy số sản phẩm trong đơn
function getOrderItemCount(order) {
    if (order.summary && order.summary.total_items !== undefined) {
        return Number(order.summary.total_items || 0);
    }

    if (Array.isArray(order.items)) {
        return order.items.length;
    }

    return 0;
}


// 39. Lấy người nhận
function getOrderReceiverName(order) {
    if (order.receiver && order.receiver.name) {
        return order.receiver.name;
    }

    if (order.customer && order.customer.name) {
        return order.customer.name;
    }

    return "Khách hàng";
}


// 40. Lấy số điện thoại người nhận
function getOrderReceiverPhone(order) {
    if (order.receiver && order.receiver.phone) {
        return order.receiver.phone;
    }

    return "Chưa cập nhật";
}


// 41. Lấy địa chỉ người nhận
function getOrderReceiverAddress(order) {
    if (order.receiver && order.receiver.shipping_address) {
        return order.receiver.shipping_address;
    }

    return "Chưa cập nhật";
}


// 42. Lấy phương thức thanh toán
function getOrderPaymentMethod(order) {
    if (order.payment && order.payment.method_label) {
        return order.payment.method_label;
    }

    return "Thanh toán khi nhận hàng";
}


// 43. Render sản phẩm trong card đơn hàng
function renderCustomerOrderProducts(productListElement, order) {
    if (!productListElement || !customerOrderProductTemplate) {
        return;
    }

    productListElement.innerHTML = "";

    const items = Array.isArray(order.items) ? order.items : [];

    if (items.length === 0) {
        const emptyItem = document.createElement("div");
        emptyItem.className = "customerOrderProductItem";
        emptyItem.textContent = "Xem chi tiết đơn hàng để xem sản phẩm.";
        productListElement.appendChild(emptyItem);
        return;
    }

    items.forEach(function (item) {
        const productFragment = customerOrderProductTemplate.content.cloneNode(true);

        const productName = item.product && item.product.name
            ? item.product.name
            : item.product_name || "Sản phẩm";

        const colorName = item.variant && item.variant.color
            ? item.variant.color.name
            : "";

        const sizeName = item.variant && item.variant.size
            ? item.variant.size.name
            : "";

        const variantText = [colorName, sizeName].filter(Boolean).join(" / ") || "Không có phân loại";
        const quantity = Number(item.quantity || 0);
        const price = Number(item.total_price || item.price_at_time || 0);

        const nameElement = productFragment.querySelector(".customerOrderProductName");
        const variantElement = productFragment.querySelector(".customerOrderProductVariant");
        const quantityElement = productFragment.querySelector(".customerOrderProductQuantity");
        const priceElement = productFragment.querySelector(".customerOrderProductPrice");

        if (nameElement) {
            nameElement.textContent = productName;
        }

        if (variantElement) {
            variantElement.textContent = variantText;
        }

        if (quantityElement) {
            quantityElement.textContent = "x" + quantity;
        }

        if (priceElement) {
            priceElement.textContent = formatPrice(price);
        }

        productListElement.appendChild(productFragment);
    });
}


// 44. Render danh sách card đơn hàng
function renderCustomerOrderCards(customerOrders) {
    if (!customerOrderCardList || !customerOrderCardTemplate) {
        return;
    }

    customerOrderCardList.innerHTML = "";

    if (emptyCustomerOrderCardText) {
        emptyCustomerOrderCardText.classList.toggle("show", customerOrders.length === 0);
    }

    customerOrders.forEach(function (order) {
        const cardFragment = customerOrderCardTemplate.content.cloneNode(true);
        const card = cardFragment.querySelector(".customerOrderCard");
        const statusBadge = cardFragment.querySelector(".customerOrderCardStatus");
        const currentStatusText = cardFragment.querySelector(".customerOrderCurrentStatusText");
        const statusSelect = cardFragment.querySelector(".customerOrderStatusSelect");
        const detailLink = cardFragment.querySelector(".customerOrderDetailLink");
        const productList = cardFragment.querySelector(".customerOrderProductList");
        const updateButton = cardFragment.querySelector(".customerOrderUpdateBtn");

        const orderCode = getOrderCode(order);
        const statusCode = getOrderStatusCode(order);
        const statusInfo = getOrderStatusInfo(statusCode);

        if (card) {
            card.dataset.orderId = order.id;
            card.dataset.orderCode = orderCode;
        }

        const codeElement = cardFragment.querySelector(".customerOrderCardCode");
        const dateElement = cardFragment.querySelector(".customerOrderCardDate");
        const paymentElement = cardFragment.querySelector(".customerOrderPaymentMethod");
        const receiverNameElement = cardFragment.querySelector(".customerOrderReceiverName");
        const receiverPhoneElement = cardFragment.querySelector(".customerOrderReceiverPhone");
        const receiverAddressElement = cardFragment.querySelector(".customerOrderReceiverAddress");
        const productCountElement = cardFragment.querySelector(".customerOrderProductCount");
        const totalElement = cardFragment.querySelector(".customerOrderTotalText");

        if (codeElement) {
            codeElement.textContent = orderCode;
        }

        if (dateElement) {
            dateElement.textContent = formatDate(order.created_at);
        }

        if (paymentElement) {
            paymentElement.textContent = getOrderPaymentMethod(order);
        }

        if (receiverNameElement) {
            receiverNameElement.textContent = getOrderReceiverName(order);
        }

        if (receiverPhoneElement) {
            receiverPhoneElement.textContent = getOrderReceiverPhone(order);
        }

        if (receiverAddressElement) {
            receiverAddressElement.textContent = getOrderReceiverAddress(order);
        }

        if (productCountElement) {
            productCountElement.textContent = getOrderItemCount(order) + " sản phẩm";
        }

        if (totalElement) {
            totalElement.textContent = formatPrice(getOrderFinalTotal(order));
        }

        if (statusBadge) {
            statusBadge.textContent = getOrderStatusLabel(order);
            statusBadge.classList.add(statusInfo.className);
        }

        if (currentStatusText) {
            currentStatusText.textContent = getOrderStatusLabel(order);
        }

        if (statusSelect) {
            statusSelect.value = statusCode;
            statusSelect.dataset.orderId = order.id;
        }

        if (updateButton) {
            updateButton.dataset.orderId = order.id;
        }

        if (detailLink) {
            detailLink.href = "../html/admin-order-detail.html?id=" + encodeURIComponent(order.id);
        }

        renderCustomerOrderProducts(productList, order);

        customerOrderCardList.appendChild(cardFragment);
    });
}


// 45. Render lịch sử mua hàng
function renderOrderHistory(customerOrders) {
    if (!customerOrderHistoryBody || !customerOrderRowTemplate) {
        return;
    }

    customerOrderHistoryBody.innerHTML = "";

    if (emptyCustomerOrderText) {
        emptyCustomerOrderText.classList.toggle("show", customerOrders.length === 0);
    }

    customerOrders.forEach(function (order) {
        const rowFragment = customerOrderRowTemplate.content.cloneNode(true);
        const row = rowFragment.querySelector("tr");
        const statusBadge = rowFragment.querySelector(".customerOrderStatusText");

        const orderCode = getOrderCode(order);
        const statusCode = getOrderStatusCode(order);
        const statusInfo = getOrderStatusInfo(statusCode);

        if (row) {
            row.dataset.orderId = order.id;
            row.classList.add("clickableOrderRow");
            row.title = "Nhấn để xem chi tiết đơn hàng";
        }

        const codeElement = rowFragment.querySelector(".customerOrderCodeText");
        const dateElement = rowFragment.querySelector(".customerOrderDateText");
        const itemCountElement = rowFragment.querySelector(".customerOrderItemCountText");
        const totalElement = rowFragment.querySelector(".customerOrderTotalText");

        if (codeElement) {
            codeElement.textContent = orderCode;
        }

        if (dateElement) {
            dateElement.textContent = formatDate(order.created_at);
        }

        if (itemCountElement) {
            itemCountElement.textContent = getOrderItemCount(order) + " sản phẩm";
        }

        if (totalElement) {
            totalElement.textContent = formatPrice(getOrderFinalTotal(order));
        }

        if (statusBadge) {
            statusBadge.textContent = getOrderStatusLabel(order);
            statusBadge.classList.add(statusInfo.className);
        }

        customerOrderHistoryBody.appendChild(rowFragment);
    });
}


// 46. Ẩn chi tiết sản phẩm yêu thích
function hideWishlistProductDetail() {
    if (wishlistProductDetailEmpty) {
        wishlistProductDetailEmpty.style.display = "block";
    }

    if (wishlistProductDetailContent) {
        wishlistProductDetailContent.style.display = "none";
    }
}


// 47. Render wishlist rỗng
function renderWishlist() {
    if (customerWishlistList) {
        customerWishlistList.innerHTML = "";
    }

    if (emptyWishlistText) {
        emptyWishlistText.classList.add("show");
    }

    hideWishlistProductDetail();
}


// 48. Render điểm tích lũy
function renderPoints(customer) {
    if (pointsCurrent) {
        pointsCurrent.textContent = customer.points + " điểm";
    }

    if (pointsEarned) {
        pointsEarned.textContent = customer.totalPointsEarned + " điểm";
    }

    if (pointsUsed) {
        pointsUsed.textContent = customer.totalPointsUsed + " điểm";
    }
}


// 49. Render lịch sử điểm rỗng
function renderPointTransactions() {
    if (pointTransactionList) {
        pointTransactionList.innerHTML = "";
    }

    if (emptyPointTransactionText) {
        emptyPointTransactionText.classList.add("show");
    }
}


// 50. Render toàn bộ khách hàng
function renderCustomerDashboard(customer, activeTab = "account") {
    if (!customer) {
        showCustomerNotFound();
        return;
    }

    showCustomerWorkspace();

    currentCustomerData = customer;
    document.title = "Chi tiết " + customer.fullName;

    renderCustomerProfile(customer);
    renderAccountInfo(customer);
    renderCustomerOrderCards(customer.recentOrders);
    renderOrderHistory(customer.recentOrders);
    renderWishlist();
    renderPoints(customer);
    renderPointTransactions();

    setActiveCustomerTab(activeTab);
}


// 51. Load chi tiết khách hàng từ API
async function loadCustomerDetail() {
    if (!currentCustomerId) {
        showCustomerNotFound();
        return;
    }

    const response = await window.AdminApi.get(
        "admin/customers/get-customer-detail.php?id=" + encodeURIComponent(currentCustomerId)
    );

    const customer = response.data && response.data.customer
        ? normalizeCustomer(response.data.customer)
        : null;

    renderCustomerDashboard(customer);
}


// 52. Cập nhật trạng thái đơn hàng từ card khách hàng
async function updateCustomerOrderStatus(orderId, newStatus) {
    if (!orderId || !newStatus) {
        return;
    }

    const order = currentCustomerData.recentOrders.find(function (item) {
        return String(item.id) === String(orderId);
    });

    if (!order) {
        return;
    }

    const oldStatus = getOrderStatusCode(order);

    if (oldStatus === newStatus) {
        alert("Bạn chưa chọn trạng thái mới.");
        return;
    }

    try {
        await window.AdminApi.post("admin/orders/update-order-status.php", {
            order_id: Number(orderId),
            order_code: getOrderCode(order),
            status: newStatus,
            new_status: newStatus,
            note: "Admin cập nhật trạng thái đơn hàng từ trang chi tiết khách hàng."
        });

        alert("Cập nhật trạng thái đơn hàng thành công.");

        await loadCustomerDetail();
        setActiveCustomerTab("orders");
    } catch (error) {
        alert(
            window.AdminApi.getApiErrorMessage(
                error,
                "Cập nhật trạng thái đơn hàng thất bại."
            )
        );
    }
}


// 53. Chuyển sang chi tiết đơn hàng
function goToOrderDetail(orderId) {
    if (!orderId) {
        return;
    }

    window.location.href = "../html/admin-order-detail.html?id=" + encodeURIComponent(orderId);
}


// 54. Gắn sự kiện tab
function bindCustomerTabEvents() {
    customerDetailMenuItems.forEach(function (menuItem) {
        menuItem.addEventListener("click", function () {
            const tabName = menuItem.dataset.customerTab;
            setActiveCustomerTab(tabName);
        });
    });
}


// 55. Gắn sự kiện danh sách card đơn hàng
function bindCustomerOrderCardEvents() {
    if (!customerOrderCardList) {
        return;
    }

    customerOrderCardList.addEventListener("click", function (event) {
        const updateButton = event.target.closest(".customerOrderUpdateBtn");

        if (!updateButton) {
            return;
        }

        const orderId = updateButton.dataset.orderId;
        const card = updateButton.closest(".customerOrderCard");
        const statusSelect = card ? card.querySelector(".customerOrderStatusSelect") : null;

        if (!statusSelect) {
            return;
        }

        updateCustomerOrderStatus(orderId, statusSelect.value);
    });
}


// 56. Gắn sự kiện lịch sử đơn hàng
function bindCustomerOrderHistoryEvents() {
    if (!customerOrderHistoryBody) {
        return;
    }

    customerOrderHistoryBody.addEventListener("click", function (event) {
        const row = event.target.closest("tr");

        if (!row) {
            return;
        }

        goToOrderDetail(row.dataset.orderId);
    });
}


// 57. Gắn sự kiện wishlist
function bindWishlistEvents() {
    if (!customerWishlistList) {
        return;
    }

    customerWishlistList.addEventListener("click", function () {
        // Tạm thời wishlist chưa nối API thật nên để rỗng.
    });
}


// 58. Gắn sự kiện trang
function bindCustomerDetailEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    bindCustomerTabEvents();
    bindCustomerOrderCardEvents();
    bindCustomerOrderHistoryEvents();
    bindWishlistEvents();
}


// 59. Kiểm tra đăng nhập local
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


// 60. Khởi tạo trang chi tiết khách hàng
async function initAdminCustomerDetailPage() {
    currentAdminUser = checkAdminLoginLocal();

    if (!currentAdminUser) {
        return;
    }

    currentCustomerId = getCustomerIdFromUrl();

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    bindCustomerDetailEvents();

    try {
        await loadCustomerDetail();
    } catch (error) {
        if (error && error.status === 401) {
            window.AdminApi.clearAdminLocalAuth();
            window.location.href = "../html/admin-login.html";
            return;
        }

        showCustomerNotFound();
    }
}

initAdminCustomerDetailPage();