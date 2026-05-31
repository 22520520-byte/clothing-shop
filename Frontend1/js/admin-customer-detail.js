// 1. Khai báo key localStorage
const ADMIN_CURRENT_USER_KEY = "admin_current_user";
const ADMIN_IS_LOGIN_KEY = "admin_is_login";
const ADMIN_CUSTOMERS_KEY = "admin_customers";
const ADMIN_ORDERS_KEY = "admin_orders";
const ADMIN_PRODUCTS_KEY = "admin_products";

// 2. Dữ liệu khách hàng mẫu dự phòng
const demoAdminCustomers = [
    {
        id: "KH001",
        fullName: "Nguyễn Minh Anh",
        email: "minhanh@gmail.com",
        phone: "0901234567",
        birthDate: "2004-05-20",
        province: "TP.HCM",
        district: "Quận 1",
        ward: "Phường Bến Nghé",
        detailAddress: "12 Nguyễn Huệ",
        gender: "female",
        address: "12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
        registerDate: "2026-04-02",
        orderCount: 8,
        totalSpent: 5200000,
        rank: "gold",
        status: "active",
        points: 1250,
        totalPointsEarned: 1800,
        totalPointsUsed: 550,
        wishlistCount: 6,
        lastOrderDate: "2026-05-18"
    },
    {
        id: "KH002",
        fullName: "Trần Hoàng Nam",
        email: "hoangnam@gmail.com",
        phone: "0912345678",
        birthDate: "2003-08-12",
        province: "TP.HCM",
        district: "TP Thủ Đức",
        ward: "Phường Linh Chiểu",
        detailAddress: "45 Võ Văn Ngân",
        gender: "male",
        address: "45 Võ Văn Ngân, Phường Linh Chiểu, TP Thủ Đức, TP.HCM",
        registerDate: "2026-04-12",
        orderCount: 4,
        totalSpent: 2350000,
        rank: "silver",
        status: "active",
        points: 650,
        totalPointsEarned: 900,
        totalPointsUsed: 250,
        wishlistCount: 3,
        lastOrderDate: "2026-05-18"
    },
    {
        id: "KH003",
        fullName: "Lê Phương Thảo",
        email: "phuongthao@gmail.com",
        phone: "0987654321",
        birthDate: "2004-11-03",
        province: "TP.HCM",
        district: "Quận 3",
        ward: "Phường Võ Thị Sáu",
        detailAddress: "88 Lê Văn Sỹ",
        gender: "female",
        address: "88 Lê Văn Sỹ, Phường Võ Thị Sáu, Quận 3, TP.HCM",
        registerDate: "2026-03-25",
        orderCount: 12,
        totalSpent: 9800000,
        rank: "diamond",
        status: "active",
        points: 3200,
        totalPointsEarned: 4500,
        totalPointsUsed: 1300,
        wishlistCount: 12,
        lastOrderDate: "2026-05-17"
    },
    {
        id: "KH004",
        fullName: "Phạm Quốc Huy",
        email: "quochuy@gmail.com",
        phone: "0934567890",
        birthDate: "2002-02-18",
        province: "TP.HCM",
        district: "Quận 10",
        ward: "Phường 12",
        detailAddress: "25 Cách Mạng Tháng 8",
        gender: "male",
        address: "25 Cách Mạng Tháng 8, Phường 12, Quận 10, TP.HCM",
        registerDate: "2026-05-01",
        orderCount: 1,
        totalSpent: 430000,
        rank: "new",
        status: "locked",
        points: 40,
        totalPointsEarned: 40,
        totalPointsUsed: 0,
        wishlistCount: 1,
        lastOrderDate: "2026-05-17"
    },
    {
        id: "KH005",
        fullName: "Võ Thanh Trúc",
        email: "thanhtruc@gmail.com",
        phone: "0977123456",
        birthDate: "2005-09-10",
        province: "TP.HCM",
        district: "Gò Vấp",
        ward: "Phường 5",
        detailAddress: "70 Phan Văn Trị",
        gender: "female",
        address: "70 Phan Văn Trị, Phường 5, Gò Vấp, TP.HCM",
        registerDate: "2026-05-10",
        orderCount: 0,
        totalSpent: 0,
        rank: "new",
        status: "active",
        points: 0,
        totalPointsEarned: 0,
        totalPointsUsed: 0,
        wishlistCount: 2,
        lastOrderDate: ""
    }
];

// 3. Dữ liệu sản phẩm mẫu dự phòng
const demoAdminProducts = [
    {
        id: "SP001",
        name: "Áo thun basic nam",
        productGroup: "Áo ngắn tay",
        category: "Áo thun",
        price: 199000,
        oldPrice: 250000,
        stock: 18,
        material: "Cotton",
        colors: ["Trắng", "Đen", "Be"],
        sizes: [
            { size: "S", quantity: 4 },
            { size: "M", quantity: 6 },
            { size: "L", quantity: 5 },
            { size: "XL", quantity: 3 }
        ],
        image: "../img/ao-thun-basic.jpg",
        status: "active",
        description: "Áo thun basic dễ phối đồ, phù hợp mặc hằng ngày."
    },
    {
        id: "SP002",
        name: "Áo hoodie form rộng",
        productGroup: "Áo dài tay",
        category: "Áo hoodie",
        price: 399000,
        oldPrice: 450000,
        stock: 3,
        material: "Nỉ cotton",
        colors: ["Đen", "Xám"],
        sizes: [
            { size: "M", quantity: 1 },
            { size: "L", quantity: 1 },
            { size: "XL", quantity: 1 }
        ],
        image: "../img/ao-hoodie.jpg",
        status: "active",
        description: "Áo hoodie form rộng, chất vải mềm và ấm."
    },
    {
        id: "SP003",
        name: "Quần jean xanh đậm",
        productGroup: "Quần",
        category: "Quần dài",
        price: 459000,
        oldPrice: 520000,
        stock: 12,
        material: "Denim",
        colors: ["Xanh đậm"],
        sizes: [
            { size: "29", quantity: 3 },
            { size: "30", quantity: 3 },
            { size: "31", quantity: 2 },
            { size: "32", quantity: 4 }
        ],
        image: "../img/quan-jean.jpg",
        status: "active",
        description: "Quần jean dáng basic, dễ phối với áo thun và sơ mi."
    },
    {
        id: "SP004",
        name: "Chân váy ngắn basic",
        productGroup: "Váy",
        category: "Váy ngắn",
        price: 299000,
        oldPrice: 350000,
        stock: 4,
        material: "Kaki",
        colors: ["Đen", "Be"],
        sizes: [
            { size: "S", quantity: 1 },
            { size: "M", quantity: 2 },
            { size: "L", quantity: 1 }
        ],
        image: "../img/vay-ngan.jpg",
        status: "active",
        description: "Chân váy ngắn basic, phù hợp đi học, đi chơi."
    },
    {
        id: "SP005",
        name: "Áo khoác kaki nữ",
        productGroup: "Áo dài tay",
        category: "Áo khoác",
        price: 520000,
        oldPrice: 590000,
        stock: 0,
        material: "Kaki",
        colors: ["Be"],
        sizes: [
            { size: "S", quantity: 0 },
            { size: "M", quantity: 0 },
            { size: "L", quantity: 0 }
        ],
        image: "../img/ao-khoac-kaki.jpg",
        status: "hidden",
        description: "Áo khoác kaki nữ phong cách đơn giản, thanh lịch."
    }
];

// 4. Dữ liệu đơn hàng mẫu dự phòng
const demoAdminOrders = [
    {
        id: "DH001",
        customerId: "KH001",
        customerName: "Nguyễn Minh Anh",
        phone: "0901234567",
        address: "12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
        receiverName: "Nguyễn Minh Anh",
        receiverPhone: "0901234567",
        receiverAddress: "12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
        paymentMethod: "Thanh toán khi nhận hàng",
        orderDate: "2026-05-18",
        status: "pending",
        shippingFee: 30000,
        discount: 50000,
        voucherDiscount: 50000,
        pointDiscount: 0,
        appliedVoucher: {
            code: "FASHION50",
            name: "Giảm 50K cho đơn từ 500K",
            type: "fixed",
            value: 50000
        },
        usedPoints: 0,
        pointRate: 100,
        items: [
            {
                name: "Áo thun basic nam",
                color: "Trắng",
                size: "L",
                quantity: 2,
                price: 199000
            },
            {
                name: "Quần jean xanh đậm",
                color: "Xanh",
                size: "32",
                quantity: 1,
                price: 459000
            }
        ]
    },
    {
        id: "DH002",
        customerId: "KH002",
        customerName: "Trần Hoàng Nam",
        phone: "0912345678",
        address: "45 Võ Văn Ngân, Phường Linh Chiểu, TP Thủ Đức, TP.HCM",
        receiverName: "Trần Hoàng Nam",
        receiverPhone: "0912345678",
        receiverAddress: "45 Võ Văn Ngân, Phường Linh Chiểu, TP Thủ Đức, TP.HCM",
        paymentMethod: "Thanh toán khi nhận hàng",
        orderDate: "2026-05-18",
        status: "shipping",
        shippingFee: 30000,
        discount: 20000,
        voucherDiscount: 0,
        pointDiscount: 20000,
        appliedVoucher: null,
        usedPoints: 200,
        pointRate: 100,
        items: [
            {
                name: "Áo hoodie form rộng",
                color: "Đen",
                size: "XL",
                quantity: 1,
                price: 399000
            },
            {
                name: "Mũ lưỡi trai basic",
                color: "Đen",
                size: "Freesize",
                quantity: 1,
                price: 129000
            }
        ]
    },
    {
        id: "DH003",
        customerId: "KH003",
        customerName: "Lê Phương Thảo",
        phone: "0987654321",
        address: "88 Lê Văn Sỹ, Phường Võ Thị Sáu, Quận 3, TP.HCM",
        receiverName: "Lê Phương Thảo",
        receiverPhone: "0987654321",
        receiverAddress: "88 Lê Văn Sỹ, Phường Võ Thị Sáu, Quận 3, TP.HCM",
        paymentMethod: "Chuyển khoản ngân hàng",
        orderDate: "2026-05-17",
        status: "completed",
        shippingFee: 0,
        discount: 100000,
        voucherDiscount: 70000,
        pointDiscount: 30000,
        appliedVoucher: {
            code: "BIGSALE70",
            name: "Giảm 70K đơn hàng thời trang",
            type: "fixed",
            value: 70000
        },
        usedPoints: 300,
        pointRate: 100,
        items: [
            {
                name: "Áo khoác kaki nữ",
                color: "Be",
                size: "M",
                quantity: 1,
                price: 520000
            },
            {
                name: "Chân váy ngắn basic",
                color: "Đen",
                size: "M",
                quantity: 2,
                price: 299000
            }
        ]
    },
    {
        id: "DH004",
        customerId: "KH004",
        customerName: "Phạm Quốc Huy",
        phone: "0934567890",
        address: "25 Cách Mạng Tháng 8, Phường 12, Quận 10, TP.HCM",
        receiverName: "Phạm Quốc Huy",
        receiverPhone: "0934567890",
        receiverAddress: "25 Cách Mạng Tháng 8, Phường 12, Quận 10, TP.HCM",
        paymentMethod: "Thanh toán khi nhận hàng",
        orderDate: "2026-05-17",
        status: "cancelled",
        shippingFee: 30000,
        discount: 0,
        voucherDiscount: 0,
        pointDiscount: 0,
        appliedVoucher: null,
        usedPoints: 0,
        pointRate: 100,
        items: [
            {
                name: "Áo sơ mi trắng basic",
                color: "Trắng",
                size: "L",
                quantity: 1,
                price: 350000
            }
        ]
    }
];

// 5. Dữ liệu yêu thích mẫu
const demoWishlistByCustomer = {
    KH001: [
        {
            productId: "SP001",
            name: "Áo thun basic nam",
            price: 199000,
            image: "../img/ao-thun-basic.jpg"
        },
        {
            productId: "SP002",
            name: "Áo hoodie form rộng",
            price: 399000,
            image: "../img/ao-hoodie.jpg"
        },
        {
            productId: "SP003",
            name: "Quần jean xanh đậm",
            price: 459000,
            image: "../img/quan-jean.jpg"
        }
    ],
    KH002: [
        {
            productId: "SP002",
            name: "Áo hoodie form rộng",
            price: 399000,
            image: "../img/ao-hoodie.jpg"
        }
    ],
    KH003: [
        {
            productId: "SP005",
            name: "Áo khoác kaki nữ",
            price: 520000,
            image: "../img/ao-khoac-kaki.jpg"
        },
        {
            productId: "SP004",
            name: "Chân váy ngắn basic",
            price: 299000,
            image: "../img/vay-ngan.jpg"
        }
    ],
    KH004: [
        {
            productId: "SP001",
            name: "Áo thun basic nam",
            price: 199000,
            image: "../img/ao-thun-basic.jpg"
        }
    ],
    KH005: [
        {
            productId: "SP001",
            name: "Áo thun basic nam",
            price: 199000,
            image: "../img/ao-thun-basic.jpg"
        }
    ]
};

// 6. Dữ liệu điểm mẫu
const demoPointTransactionsByCustomer = {
    KH001: [
        {
            title: "Tích điểm từ đơn DH001",
            date: "2026-05-18",
            type: "earn",
            points: 120
        },
        {
            title: "Đổi điểm giảm giá",
            date: "2026-05-10",
            type: "use",
            points: 200
        },
        {
            title: "Tích điểm từ đơn trước",
            date: "2026-05-02",
            type: "earn",
            points: 80
        }
    ],
    KH002: [
        {
            title: "Đổi điểm giảm giá đơn DH002",
            date: "2026-05-18",
            type: "use",
            points: 200
        },
        {
            title: "Tích điểm từ đơn trước",
            date: "2026-05-01",
            type: "earn",
            points: 90
        }
    ],
    KH003: [
        {
            title: "Tích điểm từ đơn DH003",
            date: "2026-05-17",
            type: "earn",
            points: 300
        },
        {
            title: "Đổi điểm giảm giá",
            date: "2026-05-12",
            type: "use",
            points: 300
        },
        {
            title: "Tích điểm thành viên kim cương",
            date: "2026-05-01",
            type: "earn",
            points: 500
        }
    ],
    KH004: [
        {
            title: "Tích điểm từ đơn DH004",
            date: "2026-05-17",
            type: "earn",
            points: 40
        }
    ],
    KH005: []
};

// 7. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

// 8. Lấy element profile khách hàng bên trái
const detailCustomerAvatar = document.getElementById("detailCustomerAvatar");
const detailCustomerCode = document.getElementById("detailCustomerCode");
const detailCustomerName = document.getElementById("detailCustomerName");
const detailCustomerContact = document.getElementById("detailCustomerContact");
const detailCustomerRankBadge = document.getElementById("detailCustomerRankBadge");
const detailCustomerStatusBadge = document.getElementById("detailCustomerStatusBadge");

// 9. Lấy element menu tab
const customerDetailMenuItems = document.querySelectorAll("[data-customer-tab]");
const customerTabPanels = document.querySelectorAll("[data-customer-panel]");

// 10. Lấy element tab thông tin tài khoản
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

// 11. Lấy element tab đơn hàng
const customerOrderCardList = document.getElementById("customerOrderCardList");
const customerOrderCardTemplate = document.getElementById("customerOrderCardTemplate");
const customerOrderProductTemplate = document.getElementById("customerOrderProductTemplate");
const emptyCustomerOrderCardText = document.getElementById("emptyCustomerOrderCardText");

// 12. Lấy element lịch sử mua hàng
const customerOrderHistoryBody = document.getElementById("customerOrderHistoryBody");
const customerOrderRowTemplate = document.getElementById("customerOrderRowTemplate");
const emptyCustomerOrderText = document.getElementById("emptyCustomerOrderText");

// 13. Lấy element sản phẩm yêu thích
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

// 14. Lấy element điểm tích lũy
const pointsCurrent = document.getElementById("pointsCurrent");
const pointsEarned = document.getElementById("pointsEarned");
const pointsUsed = document.getElementById("pointsUsed");
const pointTransactionList = document.getElementById("pointTransactionList");
const pointTransactionTemplate = document.getElementById("pointTransactionTemplate");
const emptyPointTransactionText = document.getElementById("emptyPointTransactionText");

// 15. Lấy element trạng thái trang
const customerDetailWorkspace = document.getElementById("customerDetailWorkspace");
const customerNotFoundBox = document.getElementById("customerNotFoundBox");

// 16. Biến lưu khách hàng hiện tại
let currentCustomerData = null;

// 17. Format tiền Việt Nam
function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}

// 18. Format ngày Việt Nam
function formatDate(dateString) {
    if (!dateString) return "Chưa có";

    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN");
}

// 19. Render ngày hiện tại
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

// 20. Lấy id khách hàng từ URL
function getCustomerIdFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return params.get("id");
}

// 21. Kiểm tra đăng nhập admin
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

// 22. Hiển thị thông tin admin
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

// 23. Đăng xuất admin
function handleAdminLogout() {
    localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
    localStorage.removeItem(ADMIN_IS_LOGIN_KEY);

    window.location.href = "../html/admin-login.html";
}

// 24. Chuẩn hóa địa chỉ đầy đủ
function buildFullAddress(customer) {
    const addressParts = [
        customer.detailAddress,
        customer.ward,
        customer.district,
        customer.province
    ];

    return addressParts
        .filter(function(item) {
            return item && String(item).trim() !== "";
        })
        .join(", ");
}

// 25. Chuẩn hóa khách hàng
function normalizeCustomer(customer, index) {
    const defaultCustomer = demoAdminCustomers[index] || demoAdminCustomers[0];

    const normalizedCustomer = {
        id: customer.id || "KH" + String(index + 1).padStart(3, "0"),
        fullName: customer.fullName || defaultCustomer.fullName || "Khách hàng",
        email: customer.email || defaultCustomer.email || "Chưa cập nhật",
        phone: customer.phone || defaultCustomer.phone || "Chưa cập nhật",
        birthDate: customer.birthDate || defaultCustomer.birthDate || "",
        province: customer.province || defaultCustomer.province || "Chưa cập nhật",
        district: customer.district || defaultCustomer.district || "Chưa cập nhật",
        ward: customer.ward || defaultCustomer.ward || "Chưa cập nhật",
        detailAddress: customer.detailAddress || defaultCustomer.detailAddress || "Chưa cập nhật",
        gender: customer.gender || defaultCustomer.gender || "other",
        address: customer.address || defaultCustomer.address || "",
        registerDate: customer.registerDate || defaultCustomer.registerDate || new Date().toISOString().slice(0, 10),
        orderCount: Number(customer.orderCount || 0),
        totalSpent: Number(customer.totalSpent || 0),
        rank: customer.rank || "new",
        status: customer.status || "active",
        points: Number(customer.points || 0),
        totalPointsEarned: Number(customer.totalPointsEarned || 0),
        totalPointsUsed: Number(customer.totalPointsUsed || 0),
        wishlistCount: Number(customer.wishlistCount || 0),
        lastOrderDate: customer.lastOrderDate || ""
    };

    if (!normalizedCustomer.address) {
        normalizedCustomer.address = buildFullAddress(normalizedCustomer);
    }

    return normalizedCustomer;
}

// 26. Lấy danh sách khách hàng
function getCustomers() {
    const savedCustomers = localStorage.getItem(ADMIN_CUSTOMERS_KEY);

    if (!savedCustomers) {
        const normalizedDemoCustomers = demoAdminCustomers.map(function(customer, index) {
            return normalizeCustomer(customer, index);
        });

        localStorage.setItem(ADMIN_CUSTOMERS_KEY, JSON.stringify(normalizedDemoCustomers));

        return normalizedDemoCustomers;
    }

    try {
        const customers = JSON.parse(savedCustomers);

        const normalizedCustomers = customers.map(function(customer, index) {
            return normalizeCustomer(customer, index);
        });

        localStorage.setItem(ADMIN_CUSTOMERS_KEY, JSON.stringify(normalizedCustomers));

        return normalizedCustomers;
    } catch (error) {
        const normalizedDemoCustomers = demoAdminCustomers.map(function(customer, index) {
            return normalizeCustomer(customer, index);
        });

        localStorage.setItem(ADMIN_CUSTOMERS_KEY, JSON.stringify(normalizedDemoCustomers));

        return normalizedDemoCustomers;
    }
}

// 27. Tìm khách hàng theo id
function getCustomerById(customerId) {
    const customers = getCustomers();

    return customers.find(function(customer) {
        return customer.id === customerId;
    });
}

// 28. Tính tổng tồn kho từ size
function calculateProductStockBySizes(sizes) {
    return (sizes || []).reduce(function(total, item) {
        return total + Number(item.quantity || 0);
    }, 0);
}

// 29. Chuẩn hóa sản phẩm
function normalizeProduct(product, index) {
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const stockBySizes = calculateProductStockBySizes(sizes);

    return {
        id: product.id || "SP" + String(index + 1).padStart(3, "0"),
        name: product.name || "Sản phẩm",
        productGroup: product.productGroup || "Đang cập nhật",
        category: product.category || "Đang cập nhật",
        price: Number(product.price || 0),
        oldPrice: Number(product.oldPrice || 0),
        stock: stockBySizes > 0 ? stockBySizes : Number(product.stock || 0),
        material: product.material || "Đang cập nhật",
        colors: Array.isArray(product.colors) ? product.colors : [],
        sizes: sizes,
        image: product.image || "",
        status: product.status || "active",
        description: product.description || "Chưa có mô tả."
    };
}

// 30. Lấy danh sách sản phẩm
function getProducts() {
    const savedProducts = localStorage.getItem(ADMIN_PRODUCTS_KEY);

    if (!savedProducts) {
        const normalizedDemoProducts = demoAdminProducts.map(function(product, index) {
            return normalizeProduct(product, index);
        });

        localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(normalizedDemoProducts));

        return normalizedDemoProducts;
    }

    try {
        const products = JSON.parse(savedProducts);

        const normalizedProducts = products.map(function(product, index) {
            return normalizeProduct(product, index);
        });

        localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(normalizedProducts));

        return normalizedProducts;
    } catch (error) {
        const normalizedDemoProducts = demoAdminProducts.map(function(product, index) {
            return normalizeProduct(product, index);
        });

        localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(normalizedDemoProducts));

        return normalizedDemoProducts;
    }
}

// 31. Tìm sản phẩm theo id
function getProductById(productId) {
    const products = getProducts();

    return products.find(function(product) {
        return product.id === productId;
    });
}

// 32. Chuẩn hóa đơn hàng
function normalizeOrder(order, index) {
    const defaultOrder = demoAdminOrders[index] || demoAdminOrders[0];

    return {
        ...order,
        id: order.id || "DH" + String(index + 1).padStart(3, "0"),
        customerId: order.customerId || defaultOrder.customerId || "",
        customerName: order.customerName || defaultOrder.customerName || "Khách hàng",
        phone: order.phone || defaultOrder.phone || "Chưa cập nhật",
        address: order.address || defaultOrder.address || "Chưa cập nhật",
        receiverName: order.receiverName || order.customerName || defaultOrder.receiverName || "Khách hàng",
        receiverPhone: order.receiverPhone || order.phone || defaultOrder.receiverPhone || "Chưa cập nhật",
        receiverAddress: order.receiverAddress || order.address || defaultOrder.receiverAddress || "Chưa cập nhật",
        paymentMethod: order.paymentMethod || defaultOrder.paymentMethod || "Thanh toán khi nhận hàng",
        orderDate: order.orderDate || defaultOrder.orderDate || new Date().toISOString().slice(0, 10),
        status: order.status || "pending",
        shippingFee: Number(order.shippingFee || 0),
        discount: Number(order.discount || 0),
        voucherDiscount: Number(order.voucherDiscount || 0),
        pointDiscount: Number(order.pointDiscount || 0),
        appliedVoucher: order.appliedVoucher !== undefined ? order.appliedVoucher : defaultOrder.appliedVoucher || null,
        usedPoints: Number(order.usedPoints || 0),
        pointRate: Number(order.pointRate || 100),
        items: Array.isArray(order.items) ? order.items : []
    };
}

// 33. Lấy danh sách đơn hàng
function getOrders() {
    const savedOrders = localStorage.getItem(ADMIN_ORDERS_KEY);

    if (!savedOrders) {
        const normalizedDemoOrders = demoAdminOrders.map(function(order, index) {
            return normalizeOrder(order, index);
        });

        localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(normalizedDemoOrders));

        return normalizedDemoOrders;
    }

    try {
        const orders = JSON.parse(savedOrders);

        const normalizedOrders = orders.map(function(order, index) {
            return normalizeOrder(order, index);
        });

        localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(normalizedOrders));

        return normalizedOrders;
    } catch (error) {
        const normalizedDemoOrders = demoAdminOrders.map(function(order, index) {
            return normalizeOrder(order, index);
        });

        localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(normalizedDemoOrders));

        return normalizedDemoOrders;
    }
}

// 34. Lưu danh sách đơn hàng
function saveOrders(orders) {
    localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders));
}

// 35. Tính tổng tiền hàng
function calculateSubtotal(items) {
    return (items || []).reduce(function(total, item) {
        return total + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
}

// 36. Tính tổng giảm giá
function calculateTotalDiscount(order) {
    const voucherDiscount = Number(order.voucherDiscount || 0);
    const pointDiscount = Number(order.pointDiscount || 0);
    const detailDiscount = voucherDiscount + pointDiscount;

    if (detailDiscount > 0) {
        return detailDiscount;
    }

    return Number(order.discount || 0);
}

// 37. Tính tổng thanh toán đơn hàng
function calculateOrderTotal(order) {
    const subtotal = calculateSubtotal(order.items || []);
    const shippingFee = Number(order.shippingFee || 0);
    const discount = calculateTotalDiscount(order);

    return subtotal + shippingFee - discount;
}

// 38. Lấy đơn hàng của khách hàng
function getOrdersByCustomer(customer) {
    const orders = getOrders();

    return orders.filter(function(order) {
        const sameCustomerId = order.customerId && order.customerId === customer.id;
        const samePhone = order.phone && order.phone === customer.phone;
        const sameName = order.customerName && order.customerName.toLowerCase() === customer.fullName.toLowerCase();

        return sameCustomerId || samePhone || sameName;
    });
}

// 39. Lấy thông tin hạng khách hàng
function getCustomerRankInfo(rank) {
    switch (rank) {
        case "silver":
            return {
                text: "Bạc",
                className: "rankSilver"
            };

        case "gold":
            return {
                text: "Vàng",
                className: "rankGold"
            };

        case "diamond":
            return {
                text: "Kim cương",
                className: "rankDiamond"
            };

        default:
            return {
                text: "Khách mới",
                className: "rankNew"
            };
    }
}

// 40. Lấy thông tin trạng thái khách hàng
function getCustomerStatusInfo(status) {
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

// 41. Lấy thông tin trạng thái đơn hàng
function getOrderStatusInfo(status) {
    switch (status) {
        case "pending":
            return {
                text: "Chờ xác nhận",
                className: "statusPending"
            };

        case "shipping":
            return {
                text: "Đang giao",
                className: "statusShipping"
            };

        case "completed":
            return {
                text: "Hoàn thành",
                className: "statusCompleted"
            };

        case "cancelled":
            return {
                text: "Đã hủy",
                className: "statusCancelled"
            };

        default:
            return {
                text: "Chờ xác nhận",
                className: "statusPending"
            };
    }
}

// 42. Lấy thông tin trạng thái sản phẩm
function getProductStatusText(status) {
    if (status === "hidden") {
        return "Đang ẩn";
    }

    return "Đang bán";
}

// 43. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) return "S";

    return text.trim().charAt(0).toUpperCase();
}

// 44. Hiển thị không tìm thấy khách hàng
function showCustomerNotFound() {
    if (customerDetailWorkspace) {
        customerDetailWorkspace.style.display = "none";
    }

    if (customerNotFoundBox) {
        customerNotFoundBox.style.display = "block";
    }
}

// 45. Đổi tab khách hàng
function setActiveCustomerTab(tabName) {
    customerDetailMenuItems.forEach(function(menuItem) {
        const isActive = menuItem.dataset.customerTab === tabName;

        menuItem.classList.toggle("active", isActive);
    });

    customerTabPanels.forEach(function(panel) {
        const isActive = panel.dataset.customerPanel === tabName;

        panel.classList.toggle("active", isActive);
    });
}

// 46. Render profile khách hàng bên trái
function renderCustomerProfile(customer) {
    const rankInfo = getCustomerRankInfo(customer.rank);
    const statusInfo = getCustomerStatusInfo(customer.status);

    if (detailCustomerAvatar) {
        detailCustomerAvatar.textContent = getFirstLetter(customer.fullName);
    }

    if (detailCustomerCode) {
        detailCustomerCode.textContent = customer.id;
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

// 47. Set dữ liệu cho input readonly
function setReadonlyInputValue(element, value) {
    if (!element) return;

    element.value = value || "Chưa cập nhật";
}

// 48. Reset radio giới tính
function resetGenderRadio() {
    if (accountGenderMale) accountGenderMale.checked = false;
    if (accountGenderFemale) accountGenderFemale.checked = false;
    if (accountGenderOther) accountGenderOther.checked = false;
}

// 49. Render giới tính
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

// 50. Render thông tin tài khoản readonly
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

// 51. Render sản phẩm trong card đơn hàng
function renderCustomerOrderProducts(productListElement, items) {
    if (!productListElement || !customerOrderProductTemplate) return;

    productListElement.innerHTML = "";

    (items || []).forEach(function(item) {
        const productFragment = customerOrderProductTemplate.content.cloneNode(true);

        const productName = item.name || "Sản phẩm";
        const color = item.color || "Không có màu";
        const size = item.size || "Không có size";
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);

        productFragment.querySelector(".customerOrderProductName").textContent = productName;
        productFragment.querySelector(".customerOrderProductVariant").textContent = color + " / " + size;
        productFragment.querySelector(".customerOrderProductQuantity").textContent = "x" + quantity;
        productFragment.querySelector(".customerOrderProductPrice").textContent = formatPrice(price * quantity);

        productListElement.appendChild(productFragment);
    });
}

// 52. Render danh sách card đơn hàng
function renderCustomerOrderCards(customerOrders) {
    if (!customerOrderCardList || !customerOrderCardTemplate) return;

    customerOrderCardList.innerHTML = "";

    if (emptyCustomerOrderCardText) {
        emptyCustomerOrderCardText.classList.toggle("show", customerOrders.length === 0);
    }

    customerOrders.forEach(function(order) {
        const cardFragment = customerOrderCardTemplate.content.cloneNode(true);
        const card = cardFragment.querySelector(".customerOrderCard");
        const statusBadge = cardFragment.querySelector(".customerOrderCardStatus");
        const currentStatusText = cardFragment.querySelector(".customerOrderCurrentStatusText");
        const statusSelect = cardFragment.querySelector(".customerOrderStatusSelect");
        const detailLink = cardFragment.querySelector(".customerOrderDetailLink");
        const productList = cardFragment.querySelector(".customerOrderProductList");
        const updateButton = cardFragment.querySelector(".customerOrderUpdateBtn");

        const statusInfo = getOrderStatusInfo(order.status);
        const orderTotal = calculateOrderTotal(order);

        card.dataset.orderId = order.id;
        statusSelect.dataset.orderId = order.id;
        updateButton.dataset.orderId = order.id;

        cardFragment.querySelector(".customerOrderCardCode").textContent = order.id;
        cardFragment.querySelector(".customerOrderCardDate").textContent = formatDate(order.orderDate);
        cardFragment.querySelector(".customerOrderPaymentMethod").textContent = order.paymentMethod;
        cardFragment.querySelector(".customerOrderReceiverName").textContent = order.receiverName;
        cardFragment.querySelector(".customerOrderReceiverPhone").textContent = order.receiverPhone;
        cardFragment.querySelector(".customerOrderReceiverAddress").textContent = order.receiverAddress;
        cardFragment.querySelector(".customerOrderProductCount").textContent = (order.items || []).length + " sản phẩm";
        cardFragment.querySelector(".customerOrderTotalText").textContent = formatPrice(orderTotal);

        statusBadge.textContent = statusInfo.text;
        statusBadge.classList.add(statusInfo.className);

        if (currentStatusText) {
            currentStatusText.textContent = statusInfo.text;
        }

        statusSelect.value = order.status;
        detailLink.href = "../html/admin-order-detail.html?id=" + encodeURIComponent(order.id);

        renderCustomerOrderProducts(productList, order.items || []);

        customerOrderCardList.appendChild(cardFragment);
    });
}

// 53. Render lịch sử mua hàng
function renderOrderHistory(customerOrders) {
    if (!customerOrderHistoryBody || !customerOrderRowTemplate) return;

    customerOrderHistoryBody.innerHTML = "";

    if (emptyCustomerOrderText) {
        emptyCustomerOrderText.classList.toggle("show", customerOrders.length === 0);
    }

    customerOrders.forEach(function(order) {
        const rowFragment = customerOrderRowTemplate.content.cloneNode(true);
        const row = rowFragment.querySelector("tr");
        const statusInfo = getOrderStatusInfo(order.status);
        const statusBadge = rowFragment.querySelector(".customerOrderStatusText");

        row.dataset.orderId = order.id;
        row.classList.add("clickableOrderRow");

        rowFragment.querySelector(".customerOrderCodeText").textContent = order.id;
        rowFragment.querySelector(".customerOrderDateText").textContent = formatDate(order.orderDate);
        rowFragment.querySelector(".customerOrderItemCountText").textContent = (order.items || []).length + " sản phẩm";
        rowFragment.querySelector(".customerOrderTotalText").textContent = formatPrice(calculateOrderTotal(order));

        statusBadge.textContent = statusInfo.text;
        statusBadge.classList.add(statusInfo.className);

        customerOrderHistoryBody.appendChild(rowFragment);
    });
}

// 54. Ẩn chi tiết sản phẩm yêu thích
function hideWishlistProductDetail() {
    if (wishlistProductDetailEmpty) {
        wishlistProductDetailEmpty.style.display = "block";
    }

    if (wishlistProductDetailContent) {
        wishlistProductDetailContent.style.display = "none";
    }
}

// 55. Hiện chi tiết sản phẩm yêu thích
function showWishlistProductDetail() {
    if (wishlistProductDetailEmpty) {
        wishlistProductDetailEmpty.style.display = "none";
    }

    if (wishlistProductDetailContent) {
        wishlistProductDetailContent.style.display = "block";
    }
}

// 56. Render ảnh chi tiết sản phẩm yêu thích
function renderWishlistDetailImage(product) {
    if (!wishlistDetailImage || !wishlistDetailImageText) return;

    wishlistDetailImageText.textContent = getFirstLetter(product.name);

    if (!product.image) {
        wishlistDetailImage.src = "";
        wishlistDetailImage.style.display = "none";
        wishlistDetailImageText.style.display = "flex";
        return;
    }

    wishlistDetailImage.src = product.image;
    wishlistDetailImage.alt = product.name;
    wishlistDetailImage.style.display = "block";
    wishlistDetailImageText.style.display = "none";

    wishlistDetailImage.onerror = function() {
        wishlistDetailImage.src = "";
        wishlistDetailImage.style.display = "none";
        wishlistDetailImageText.style.display = "flex";
    };
}

// 57. Render size chi tiết sản phẩm yêu thích
function renderWishlistDetailSizes(sizes) {
    if (!wishlistDetailProductSizes) return;

    wishlistDetailProductSizes.innerHTML = "";

    if (!sizes || sizes.length === 0) {
        wishlistDetailProductSizes.innerHTML = "<p>Chưa có thông tin kích thước.</p>";
        return;
    }

    sizes.forEach(function(sizeItem) {
        const sizeRow = document.createElement("div");

        sizeRow.className = "wishlistProductSizeRow";
        sizeRow.innerHTML = `
            <span>${sizeItem.size}</span>
            <strong>${Number(sizeItem.quantity || 0)} sản phẩm</strong>
        `;

        wishlistDetailProductSizes.appendChild(sizeRow);
    });
}

// 58. Render chi tiết sản phẩm yêu thích readonly
function renderWishlistProductDetail(productId) {
    const product = getProductById(productId);

    if (!product) return;

    showWishlistProductDetail();
    renderWishlistDetailImage(product);

    if (wishlistDetailProductCode) {
        wishlistDetailProductCode.textContent = product.id;
    }

    if (wishlistDetailProductName) {
        wishlistDetailProductName.textContent = product.name;
    }

    if (wishlistDetailProductPrice) {
        wishlistDetailProductPrice.textContent = formatPrice(product.price);
    }

    if (wishlistDetailProductGroup) {
        wishlistDetailProductGroup.textContent = product.productGroup;
    }

    if (wishlistDetailProductCategory) {
        wishlistDetailProductCategory.textContent = product.category;
    }

    if (wishlistDetailProductSalePrice) {
        wishlistDetailProductSalePrice.textContent = formatPrice(product.price);
    }

    if (wishlistDetailProductOldPrice) {
        wishlistDetailProductOldPrice.textContent = product.oldPrice > 0 ? formatPrice(product.oldPrice) : "-";
    }

    if (wishlistDetailProductMaterial) {
        wishlistDetailProductMaterial.textContent = product.material;
    }

    if (wishlistDetailProductStock) {
        wishlistDetailProductStock.textContent = product.stock + " sản phẩm";
    }

    if (wishlistDetailProductColors) {
        wishlistDetailProductColors.textContent = product.colors.length > 0 ? product.colors.join(", ") : "Chưa cập nhật";
    }

    if (wishlistDetailProductStatus) {
        wishlistDetailProductStatus.textContent = getProductStatusText(product.status);
    }

    if (wishlistDetailProductDescription) {
        wishlistDetailProductDescription.textContent = product.description || "Chưa có mô tả.";
    }

    renderWishlistDetailSizes(product.sizes || []);
}

// 59. Render sản phẩm yêu thích
function renderWishlist(customer) {
    if (!customerWishlistList || !customerWishlistItemTemplate) return [];

    const wishlistItems = demoWishlistByCustomer[customer.id] || [];

    customerWishlistList.innerHTML = "";
    hideWishlistProductDetail();

    if (emptyWishlistText) {
        emptyWishlistText.classList.toggle("show", wishlistItems.length === 0);
    }

    wishlistItems.forEach(function(item) {
        const product = getProductById(item.productId);
        const displayProduct = product || item;

        const itemFragment = customerWishlistItemTemplate.content.cloneNode(true);
        const itemButton = itemFragment.querySelector(".wishlistReadonlyItem");
        const image = itemFragment.querySelector(".wishlistThumbImg");
        const imageText = itemFragment.querySelector(".wishlistThumbText");

        itemButton.dataset.productId = item.productId;

        itemFragment.querySelector(".wishlistProductNameText").textContent = displayProduct.name;
        itemFragment.querySelector(".wishlistProductPriceText").textContent = formatPrice(displayProduct.price);
        imageText.textContent = getFirstLetter(displayProduct.name);

        if (displayProduct.image) {
            image.src = displayProduct.image;
            image.alt = displayProduct.name;
            image.classList.add("show");

            image.addEventListener("error", function() {
                image.classList.remove("show");
                image.src = "";
            });
        }

        customerWishlistList.appendChild(itemFragment);
    });

    return wishlistItems;
}

// 60. Render điểm tích lũy
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

// 61. Render lịch sử điểm
function renderPointTransactions(customer) {
    if (!pointTransactionList || !pointTransactionTemplate) return;

    const transactions = demoPointTransactionsByCustomer[customer.id] || [];

    pointTransactionList.innerHTML = "";

    if (emptyPointTransactionText) {
        emptyPointTransactionText.classList.toggle("show", transactions.length === 0);
    }

    transactions.forEach(function(transaction) {
        const transactionFragment = pointTransactionTemplate.content.cloneNode(true);
        const valueText = transactionFragment.querySelector(".pointTransactionValueText");

        transactionFragment.querySelector(".pointTransactionTitleText").textContent = transaction.title;
        transactionFragment.querySelector(".pointTransactionDateText").textContent = formatDate(transaction.date);

        if (transaction.type === "use") {
            valueText.textContent = "-" + transaction.points;
            valueText.classList.add("pointMinus");
        } else {
            valueText.textContent = "+" + transaction.points;
            valueText.classList.add("pointPlus");
        }

        pointTransactionList.appendChild(transactionFragment);
    });
}

// 62. Render toàn bộ dashboard khách hàng
function renderCustomerDashboard(customer, activeTab = "account") {
    if (!customer) {
        showCustomerNotFound();
        return;
    }

    currentCustomerData = customer;

    document.title = "Chi tiết " + customer.fullName;

    const customerOrders = getOrdersByCustomer(customer);

    renderCustomerProfile(customer);
    renderAccountInfo(customer);
    renderCustomerOrderCards(customerOrders);
    renderOrderHistory(customerOrders);
    renderWishlist(customer);
    renderPoints(customer);
    renderPointTransactions(customer);
    setActiveCustomerTab(activeTab);
}

// 63. Cập nhật trạng thái đơn hàng
function updateCustomerOrderStatus(orderId, newStatus) {
    const orders = getOrders();

    const updatedOrders = orders.map(function(order) {
        if (order.id === orderId) {
            return {
                ...order,
                status: newStatus
            };
        }

        return order;
    });

    saveOrders(updatedOrders);

    if (!currentCustomerData) return;

    const latestCustomer = getCustomerById(currentCustomerData.id);

    renderCustomerDashboard(latestCustomer, "orders");

    alert("Cập nhật trạng thái đơn hàng thành công.");
}

// 64. Chuyển sang chi tiết đơn hàng
function goToOrderDetail(orderId) {
    if (!orderId) return;

    window.location.href = "../html/admin-order-detail.html?id=" + encodeURIComponent(orderId);
}

// 65. Gắn sự kiện menu tab
function bindCustomerTabEvents() {
    customerDetailMenuItems.forEach(function(menuItem) {
        menuItem.addEventListener("click", function() {
            const tabName = menuItem.dataset.customerTab;

            setActiveCustomerTab(tabName);
        });
    });
}

// 66. Gắn sự kiện danh sách card đơn hàng
function bindCustomerOrderCardEvents() {
    if (!customerOrderCardList) return;

    customerOrderCardList.addEventListener("click", function(event) {
        const updateButton = event.target.closest(".customerOrderUpdateBtn");

        if (!updateButton) return;

        const orderId = updateButton.dataset.orderId;
        const card = updateButton.closest(".customerOrderCard");
        const statusSelect = card.querySelector(".customerOrderStatusSelect");

        updateCustomerOrderStatus(orderId, statusSelect.value);
    });
}

// 67. Gắn sự kiện lịch sử đơn hàng
function bindCustomerOrderHistoryEvents() {
    if (!customerOrderHistoryBody) return;

    customerOrderHistoryBody.addEventListener("click", function(event) {
        const row = event.target.closest("tr");

        if (!row) return;

        goToOrderDetail(row.dataset.orderId);
    });
}

// 68. Gắn sự kiện sản phẩm yêu thích
function bindWishlistEvents() {
    if (!customerWishlistList) return;

    customerWishlistList.addEventListener("click", function(event) {
        const wishlistItem = event.target.closest(".wishlistReadonlyItem");

        if (!wishlistItem) return;

        const productId = wishlistItem.dataset.productId;

        document.querySelectorAll(".wishlistReadonlyItem").forEach(function(item) {
            item.classList.remove("active");
        });

        wishlistItem.classList.add("active");

        renderWishlistProductDetail(productId);
    });
}

// 69. Gắn sự kiện trang chi tiết khách hàng
function bindCustomerDetailEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    bindCustomerTabEvents();
    bindCustomerOrderCardEvents();
    bindCustomerOrderHistoryEvents();
    bindWishlistEvents();
}

// 70. Khởi tạo trang chi tiết khách hàng
function initAdminCustomerDetailPage() {
    const adminUser = checkAdminLogin();

    if (!adminUser) return;

    const customerId = getCustomerIdFromUrl();
    const customer = getCustomerById(customerId);

    renderAdminInfo(adminUser);
    renderCurrentDate();
    renderCustomerDashboard(customer);
    bindCustomerDetailEvents();
}

initAdminCustomerDetailPage();