// 1. Khai báo key localStorage
const ADMIN_CURRENT_USER_KEY = "admin_current_user";
const ADMIN_IS_LOGIN_KEY = "admin_is_login";
const ADMIN_PRODUCTS_KEY = "admin_products";

// 2. Dữ liệu sản phẩm mẫu
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

// 3. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

// 4. Lấy element thống kê sản phẩm
const totalProductCount = document.getElementById("totalProductCount");
const activeProductCount = document.getElementById("activeProductCount");
const lowStockProductCount = document.getElementById("lowStockProductCount");
const hiddenProductCount = document.getElementById("hiddenProductCount");

// 5. Lấy element bộ lọc và bảng sản phẩm
const productSearchInput = document.getElementById("productSearchInput");
const productGroupFilter = document.getElementById("productGroupFilter");
const categoryFilter = document.getElementById("categoryFilter");
const stockFilter = document.getElementById("stockFilter");
const productTableBody = document.getElementById("productTableBody");
const emptyProductText = document.getElementById("emptyProductText");
const productRowTemplate = document.getElementById("productRowTemplate");

// 6. Biến lưu admin hiện tại
let currentAdminUser = null;

// 7. Format tiền Việt Nam
function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}

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

// 9. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) return "S";

    return text.trim().charAt(0).toUpperCase();
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

// 11. Hiển thị thông tin admin
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

// 12. Đăng xuất admin
function handleAdminLogout() {
    localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
    localStorage.removeItem(ADMIN_IS_LOGIN_KEY);

    window.location.href = "../html/admin-login.html";
}

// 13. Tính tổng tồn kho từ size
function calculateProductStockBySizes(sizes) {
    return (sizes || []).reduce(function(total, item) {
        return total + Number(item.quantity || 0);
    }, 0);
}

// 14. Chuẩn hóa sản phẩm
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

// 15. Lấy danh sách sản phẩm
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

// 16. Lưu danh sách sản phẩm
function saveProducts(products) {
    localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products));
}

// 17. Tìm sản phẩm theo id
function getProductById(productId) {
    const products = getProducts();

    return products.find(function(product) {
        return product.id === productId;
    });
}

// 18. Lấy thông tin trạng thái sản phẩm
function getProductStatusInfo(status) {
    if (status === "hidden") {
        return {
            text: "Đang ẩn",
            className: "statusCancelled"
        };
    }

    return {
        text: "Đang bán",
        className: "statusActive"
    };
}

// 19. Lấy thông tin tồn kho
function getProductStockInfo(stock) {
    const quantity = Number(stock || 0);

    if (quantity <= 0) {
        return {
            text: "Hết hàng",
            className: "stockOut"
        };
    }

    if (quantity <= 5) {
        return {
            text: quantity + " sản phẩm",
            className: "stockLow"
        };
    }

    return {
        text: quantity + " sản phẩm",
        className: "stockIn"
    };
}

// 20. Render thống kê sản phẩm
function renderProductStats(products) {
    const activeProducts = products.filter(function(product) {
        return product.status === "active";
    });

    const lowStockProducts = products.filter(function(product) {
        return product.stock > 0 && product.stock <= 5;
    });

    const hiddenProducts = products.filter(function(product) {
        return product.status === "hidden";
    });

    if (totalProductCount) {
        totalProductCount.textContent = products.length;
    }

    if (activeProductCount) {
        activeProductCount.textContent = activeProducts.length;
    }

    if (lowStockProductCount) {
        lowStockProductCount.textContent = lowStockProducts.length;
    }

    if (hiddenProductCount) {
        hiddenProductCount.textContent = hiddenProducts.length;
    }
}

// 21. Lọc sản phẩm
function getFilteredProducts(products) {
    const searchValue = productSearchInput ? productSearchInput.value.trim().toLowerCase() : "";
    const productGroupValue = productGroupFilter ? productGroupFilter.value : "all";
    const categoryValue = categoryFilter ? categoryFilter.value : "all";
    const stockValue = stockFilter ? stockFilter.value : "all";

    return products.filter(function(product) {
        const name = product.name.toLowerCase();
        const id = product.id.toLowerCase();
        const productGroup = product.productGroup.toLowerCase();
        const category = product.category.toLowerCase();

        const matchSearch =
            name.includes(searchValue) ||
            id.includes(searchValue) ||
            productGroup.includes(searchValue) ||
            category.includes(searchValue);

        const matchProductGroup =
            productGroupValue === "all" ||
            product.productGroup === productGroupValue;

        const matchCategory =
            categoryValue === "all" ||
            product.category === categoryValue;

        let matchStock = true;

        if (stockValue === "in-stock") {
            matchStock = product.stock > 5;
        }

        if (stockValue === "low-stock") {
            matchStock = product.stock > 0 && product.stock <= 5;
        }

        if (stockValue === "out-stock") {
            matchStock = product.stock <= 0;
        }

        return matchSearch && matchProductGroup && matchCategory && matchStock;
    });
}

// 22. Render ảnh sản phẩm trong bảng
function renderProductImage(imageElement, imageTextElement, product) {
    if (!imageElement || !imageTextElement) return;

    imageTextElement.textContent = getFirstLetter(product.name);

    if (!product.image) {
        imageElement.src = "";
        imageElement.classList.remove("show");
        return;
    }

    imageElement.src = product.image;
    imageElement.alt = product.name;
    imageElement.classList.add("show");

    imageElement.addEventListener("error", function() {
        imageElement.src = "";
        imageElement.classList.remove("show");
    });
}

// 23. Render bảng sản phẩm
function renderProductTable() {
    if (!productTableBody || !productRowTemplate) return;

    const products = getProducts();
    const filteredProducts = getFilteredProducts(products);

    productTableBody.innerHTML = "";

    if (emptyProductText) {
        emptyProductText.classList.toggle("show", filteredProducts.length === 0);
    }

    filteredProducts.forEach(function(product) {
        const rowFragment = productRowTemplate.content.cloneNode(true);
        const row = rowFragment.querySelector("tr");
        const statusInfo = getProductStatusInfo(product.status);
        const stockInfo = getProductStockInfo(product.stock);
        const statusBadge = rowFragment.querySelector(".productStatusText");
        const stockBadge = rowFragment.querySelector(".productStockText");
        const productThumbImg = rowFragment.querySelector(".productThumbImg");
        const productThumbText = rowFragment.querySelector(".productThumbText");

        row.dataset.productId = product.id;
        row.classList.add("clickableProductRow");
        row.title = "Nhấn để xem và chỉnh sửa sản phẩm";

        rowFragment.querySelector(".productNameText").textContent = product.name;
        rowFragment.querySelector(".productCodeText").textContent = product.id;
        rowFragment.querySelector(".productGroupText").textContent = product.productGroup;
        rowFragment.querySelector(".productCategoryText").textContent = product.category;
        rowFragment.querySelector(".productPriceText").textContent = formatPrice(product.price);
        rowFragment.querySelector(".productOldPriceText").textContent = product.oldPrice > 0 ? formatPrice(product.oldPrice) : "-";

        stockBadge.textContent = stockInfo.text;
        stockBadge.classList.add(stockInfo.className);

        statusBadge.textContent = statusInfo.text;
        statusBadge.classList.add(statusInfo.className);

        renderProductImage(productThumbImg, productThumbText, product);

        productTableBody.appendChild(rowFragment);
    });

    renderProductStats(products);
}

// 24. Chuyển sang trang chi tiết sản phẩm
function goToProductDetail(productId) {
    if (!productId) return;

    window.location.href = "../html/admin-product-detail.html?id=" + encodeURIComponent(productId);
}

// 25. Xóa sản phẩm
function deleteProduct(productId) {
    const products = getProducts();
    const product = getProductById(productId);

    if (!product) return;

    const isConfirm = confirm("Bạn có chắc muốn xóa sản phẩm " + product.name + "?");

    if (!isConfirm) return;

    const updatedProducts = products.filter(function(item) {
        return item.id !== productId;
    });

    saveProducts(updatedProducts);
    renderProductTable();
}

// 26. Xử lý thao tác bảng sản phẩm
function handleProductTableAction(event) {
    const actionButton = event.target.closest("[data-action]");
    const row = event.target.closest("tr");

    if (!row) return;

    const productId = row.dataset.productId;

    if (actionButton) {
        event.stopPropagation();

        const action = actionButton.dataset.action;

        if (action === "delete") {
            deleteProduct(productId);
        }

        return;
    }

    goToProductDetail(productId);
}

// 27. Gắn sự kiện trang sản phẩm
function bindProductEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (productTableBody) {
        productTableBody.addEventListener("click", handleProductTableAction);
    }

    if (productSearchInput) {
        productSearchInput.addEventListener("input", renderProductTable);
    }

    if (productGroupFilter) {
        productGroupFilter.addEventListener("change", renderProductTable);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", renderProductTable);
    }

    if (stockFilter) {
        stockFilter.addEventListener("change", renderProductTable);
    }
}

// 28. Khởi tạo trang quản lý sản phẩm
function initAdminProductsPage() {
    currentAdminUser = checkAdminLogin();

    if (!currentAdminUser) return;

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    renderProductTable();
    bindProductEvents();
}

initAdminProductsPage();