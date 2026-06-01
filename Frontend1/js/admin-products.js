// =========================================================
// File: Frontend1/js/admin-products.js
// Mục đích: Gắn trang quản lý sản phẩm admin với API backend thật
// =========================================================


// 1. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");


// 2. Lấy element thống kê sản phẩm
const totalProductCount = document.getElementById("totalProductCount");
const activeProductCount = document.getElementById("activeProductCount");
const lowStockProductCount = document.getElementById("lowStockProductCount");
const hiddenProductCount = document.getElementById("hiddenProductCount");


// 3. Lấy element bộ lọc và bảng sản phẩm
const productSearchInput = document.getElementById("productSearchInput");
const productGroupFilter = document.getElementById("productGroupFilter");
const categoryFilter = document.getElementById("categoryFilter");
const stockFilter = document.getElementById("stockFilter");

const productTableBody = document.getElementById("productTableBody");
const emptyProductText = document.getElementById("emptyProductText");
const productRowTemplate = document.getElementById("productRowTemplate");


// 4. Biến lưu dữ liệu sản phẩm
let currentAdminUser = null;
let adminProducts = [];


// 4.1. Nhóm sản phẩm hiển thị theo đúng menu khách hàng
const ADMIN_CATEGORY_GROUPS = [
    {
        id: "ao-ngan-tay",
        name: "Áo ngắn tay",
        categorySlugs: ["ao-thun", "ao-polo", "ao-so-mi"]
    },
    {
        id: "ao-dai-tay",
        name: "Áo dài tay",
        categorySlugs: ["ao-sweater", "ao-hoodie", "ao-khoac"]
    },
    {
        id: "quan",
        name: "Quần",
        categorySlugs: ["quan-dai", "quan-ngan", "quan-lot"]
    },
    {
        id: "vay",
        name: "Váy",
        categorySlugs: ["vay-dai", "vay-ngan"]
    },
    {
        id: "phu-kien",
        name: "Phụ kiện",
        categorySlugs: ["mu", "tat", "phu-kien"]
    }
];


// 5. Format tiền Việt Nam
function formatPrice(price) {
    if (window.AdminApi && window.AdminApi.formatPrice) {
        return window.AdminApi.formatPrice(price);
    }

    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}


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


// 7. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) {
        return "A";
    }

    return text.trim().charAt(0).toUpperCase();
}


// 8. Lấy nhãn vai trò admin
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


// 9. Hiển thị thông tin admin
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
        if (roleCode !== "owner") {
            link.style.display = "none";
        } else {
            link.style.display = "";
        }
    });
}


// 10. Tạo slug từ tên danh mục
function createSlug(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


// 11. Lấy tên danh mục cha gốc từ database
function getParentCategoryName(product) {
    if (product.parent_category && product.parent_category.name) {
        return product.parent_category.name;
    }

    if (product.parentCategory && product.parentCategory.name) {
        return product.parentCategory.name;
    }

    return "Đang cập nhật";
}


// 12. Lấy tên danh mục con
function getCategoryName(product) {
    if (product.category && product.category.name) {
        return product.category.name;
    }

    if (product.category_name) {
        return product.category_name;
    }

    return "Đang cập nhật";
}


// 13. Lấy slug danh mục
function getCategorySlug(product) {
    if (product.category && product.category.slug) {
        return product.category.slug;
    }

    if (product.category_slug) {
        return product.category_slug;
    }

    const categoryName = getCategoryName(product);

    if (categoryName && categoryName !== "Đang cập nhật") {
        return createSlug(categoryName);
    }

    return "";
}


// 14. Lấy nhóm sản phẩm theo menu khách hàng
function getAdminProductGroupByCategorySlug(categorySlug, fallbackGroupName) {
    const group = ADMIN_CATEGORY_GROUPS.find(function (item) {
        return item.categorySlugs.includes(categorySlug);
    });

    if (group) {
        return group.name;
    }

    return fallbackGroupName || "Đang cập nhật";
}


// 15. Lấy tổng tồn kho của sản phẩm
function getProductStock(product) {
    if (product.variant_summary && product.variant_summary.total_stock !== undefined) {
        return Number(product.variant_summary.total_stock || 0);
    }

    if (product.summary && product.summary.total_stock !== undefined) {
        return Number(product.summary.total_stock || 0);
    }

    if (product.total_stock !== undefined) {
        return Number(product.total_stock || 0);
    }

    if (Array.isArray(product.variants)) {
        return product.variants.reduce(function (total, variant) {
            return total + Number(variant.stock_quantity || variant.stock || 0);
        }, 0);
    }

    if (product.stock_quantity !== undefined) {
        return Number(product.stock_quantity || 0);
    }

    if (product.stock !== undefined) {
        return Number(product.stock || 0);
    }

    return 0;
}


// 16. Lấy ảnh sản phẩm
function getProductImage(product) {
    if (product.main_image) {
        return product.main_image;
    }

    if (product.image_url) {
        return product.image_url;
    }

    if (product.image) {
        return product.image;
    }

    if (Array.isArray(product.images) && product.images.length > 0) {
        return product.images[0].image_url || product.images[0].url || "";
    }

    return "";
}


// 17. Lấy giá bán
function getProductPrice(product) {
    if (product.base_price !== undefined) {
        return Number(product.base_price || 0);
    }

    if (product.price !== undefined) {
        return Number(product.price || 0);
    }

    return 0;
}


// 18. Lấy giá gốc
function getProductOldPrice(product) {
    if (product.old_price !== undefined && product.old_price !== null) {
        return Number(product.old_price || 0);
    }

    if (product.oldPrice !== undefined && product.oldPrice !== null) {
        return Number(product.oldPrice || 0);
    }

    return 0;
}


// 19. Chuẩn hóa trạng thái sản phẩm
function normalizeProductStatus(status) {
    if (status === "hidden") {
        return "inactive";
    }

    return status || "active";
}


// 20. Chuẩn hóa sản phẩm từ API
function normalizeProduct(product) {
    const status = normalizeProductStatus(product.status);
    const stock = getProductStock(product);
    const categoryName = getCategoryName(product);
    const categorySlug = getCategorySlug(product);
    const parentCategoryName = getParentCategoryName(product);
    const adminProductGroup = getAdminProductGroupByCategorySlug(categorySlug, parentCategoryName);

    return {
        id: product.id,
        code: product.code || product.sku || "SP" + String(product.id).padStart(3, "0"),
        name: product.name || "Sản phẩm",
        slug: product.slug || "",

        productGroup: adminProductGroup,
        parentCategory: parentCategoryName,

        category: categoryName,
        categorySlug: categorySlug,

        price: getProductPrice(product),
        oldPrice: getProductOldPrice(product),
        stock: stock,

        material: product.material || "Đang cập nhật",
        brand: product.brand || "Đang cập nhật",
        image: getProductImage(product),
        status: status,
        raw: product
    };
}


// 21. Lấy thông tin trạng thái sản phẩm
function getProductStatusInfo(status) {
    const normalizedStatus = normalizeProductStatus(status);

    if (normalizedStatus === "inactive") {
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


// 22. Lấy thông tin tồn kho
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


// 23. Render thống kê sản phẩm
function renderProductStats(products) {
    const activeProducts = products.filter(function (product) {
        return product.status === "active";
    });

    const lowStockProducts = products.filter(function (product) {
        return product.stock > 0 && product.stock <= 5;
    });

    const hiddenProducts = products.filter(function (product) {
        return product.status !== "active";
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


// 24. Tạo option cho select
function createSelectOption(value, text) {
    const option = document.createElement("option");

    option.value = value;
    option.textContent = text;

    return option;
}


// 25. Lấy danh sách nhóm có sản phẩm
function getAvailableProductGroups() {
    const productGroupMap = {};

    adminProducts.forEach(function (product) {
        if (!product.productGroup || product.productGroup === "Đang cập nhật") {
            return;
        }

        productGroupMap[product.productGroup] = true;
    });

    return ADMIN_CATEGORY_GROUPS
        .map(function (group) {
            return group.name;
        })
        .filter(function (groupName) {
            return productGroupMap[groupName];
        });
}


// 26. Lấy danh sách danh mục theo nhóm đang chọn
function getAvailableCategoriesByGroup(groupName) {
    const categoryMap = {};

    adminProducts.forEach(function (product) {
        if (!product.category || product.category === "Đang cập nhật") {
            return;
        }

        if (groupName && groupName !== "all" && product.productGroup !== groupName) {
            return;
        }

        categoryMap[product.category] = true;
    });

    return Object.keys(categoryMap).sort(function (a, b) {
        return a.localeCompare(b, "vi");
    });
}


// 27. Render filter nhóm sản phẩm
function renderProductGroupFilterOptions() {
    if (!productGroupFilter) {
        return;
    }

    const currentValue = productGroupFilter.value;
    const groupNames = getAvailableProductGroups();

    productGroupFilter.innerHTML = "";
    productGroupFilter.appendChild(createSelectOption("all", "Tất cả nhóm sản phẩm"));

    groupNames.forEach(function (groupName) {
        productGroupFilter.appendChild(createSelectOption(groupName, groupName));
    });

    const hasCurrentValue = groupNames.some(function (groupName) {
        return groupName === currentValue;
    });

    productGroupFilter.value = hasCurrentValue ? currentValue : "all";
}


// 28. Render filter danh mục
function renderCategoryFilterOptions() {
    if (!categoryFilter) {
        return;
    }

    const currentValue = categoryFilter.value;
    const selectedGroup = productGroupFilter ? productGroupFilter.value : "all";
    const categoryNames = getAvailableCategoriesByGroup(selectedGroup);

    categoryFilter.innerHTML = "";
    categoryFilter.appendChild(createSelectOption("all", "Tất cả loại sản phẩm"));

    categoryNames.forEach(function (categoryName) {
        categoryFilter.appendChild(createSelectOption(categoryName, categoryName));
    });

    const hasCurrentValue = categoryNames.some(function (categoryName) {
        return categoryName === currentValue;
    });

    categoryFilter.value = hasCurrentValue ? currentValue : "all";
}


// 29. Render toàn bộ filter sản phẩm
function renderProductFilterOptions() {
    renderProductGroupFilterOptions();
    renderCategoryFilterOptions();
}


// 30. Lọc sản phẩm trên frontend
function getFilteredProducts(products) {
    const searchValue = productSearchInput
        ? productSearchInput.value.trim().toLowerCase()
        : "";

    const productGroupValue = productGroupFilter
        ? productGroupFilter.value
        : "all";

    const categoryValue = categoryFilter
        ? categoryFilter.value
        : "all";

    const stockValue = stockFilter
        ? stockFilter.value
        : "all";

    return products.filter(function (product) {
        const name = product.name.toLowerCase();
        const code = String(product.code || product.id).toLowerCase();
        const productGroup = product.productGroup.toLowerCase();
        const parentCategory = product.parentCategory.toLowerCase();
        const category = product.category.toLowerCase();

        const matchSearch =
            name.includes(searchValue) ||
            code.includes(searchValue) ||
            productGroup.includes(searchValue) ||
            parentCategory.includes(searchValue) ||
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


// 31. Render ảnh sản phẩm trong bảng
function renderProductImage(imageElement, imageTextElement, product) {
    if (!imageElement || !imageTextElement) {
        return;
    }

    imageTextElement.textContent = getFirstLetter(product.name);

    if (!product.image) {
        imageElement.src = "";
        imageElement.alt = "";
        imageElement.classList.remove("show");
        imageElement.style.display = "none";
        imageTextElement.style.display = "flex";
        return;
    }

    imageElement.src = product.image;
    imageElement.alt = product.name;
    imageElement.classList.add("show");
    imageElement.style.display = "block";
    imageTextElement.style.display = "none";

    imageElement.onerror = function () {
        imageElement.src = "";
        imageElement.alt = "";
        imageElement.classList.remove("show");
        imageElement.style.display = "none";
        imageTextElement.style.display = "flex";
    };
}

// 32. Render một dòng sản phẩm
function renderProductRow(product) {
    const rowFragment = productRowTemplate.content.cloneNode(true);
    const row = rowFragment.querySelector("tr");

    const statusInfo = getProductStatusInfo(product.status);
    const stockInfo = getProductStockInfo(product.stock);

    const productNameText = rowFragment.querySelector(".productNameText");
    const productCodeText = rowFragment.querySelector(".productCodeText");
    const productGroupText = rowFragment.querySelector(".productGroupText");
    const productCategoryText = rowFragment.querySelector(".productCategoryText");
    const productPriceText = rowFragment.querySelector(".productPriceText");
    const productOldPriceText = rowFragment.querySelector(".productOldPriceText");
    const productStatusText = rowFragment.querySelector(".productStatusText");
    const productStockText = rowFragment.querySelector(".productStockText");
    const productThumbImg = rowFragment.querySelector(".productThumbImg");
    const productThumbText = rowFragment.querySelector(".productThumbText");
    const actionButton = rowFragment.querySelector("[data-action='delete']");

    if (row) {
        row.dataset.productId = product.id;
        row.classList.add("clickableProductRow");
        row.title = "Nhấn để xem và chỉnh sửa sản phẩm";
    }

    if (productNameText) {
        productNameText.textContent = product.name;
    }

    if (productCodeText) {
        productCodeText.textContent = product.code;
    }

    if (productGroupText) {
        productGroupText.textContent = product.productGroup;
    }

    if (productCategoryText) {
        productCategoryText.textContent = product.category;
    }

    if (productPriceText) {
        productPriceText.textContent = formatPrice(product.price);
    }

    if (productOldPriceText) {
        productOldPriceText.textContent = product.oldPrice > 0
            ? formatPrice(product.oldPrice)
            : "-";
    }

    if (productStockText) {
        productStockText.textContent = stockInfo.text;
        productStockText.classList.add(stockInfo.className);
    }

    if (productStatusText) {
        productStatusText.textContent = statusInfo.text;
        productStatusText.classList.add(statusInfo.className);
    }

    if (actionButton) {
        actionButton.textContent = product.status === "active" ? "Ẩn" : "Hiện";
        actionButton.title = product.status === "active"
            ? "Ẩn sản phẩm"
            : "Hiển thị sản phẩm";
    }

    renderProductImage(productThumbImg, productThumbText, product);

    return rowFragment;
}


// 33. Render bảng sản phẩm
function renderProductTable() {
    if (!productTableBody || !productRowTemplate) {
        return;
    }

    const filteredProducts = getFilteredProducts(adminProducts);

    productTableBody.innerHTML = "";

    if (emptyProductText) {
        emptyProductText.classList.toggle("show", filteredProducts.length === 0);
    }

    filteredProducts.forEach(function (product) {
        const row = renderProductRow(product);
        productTableBody.appendChild(row);
    });

    renderProductStats(adminProducts);
}


// 34. Hiển thị trạng thái loading
function setProductLoading(isLoading) {
    if (!productTableBody) {
        return;
    }

    if (isLoading) {
        productTableBody.innerHTML = `
            <tr>
                <td colspan="8">Đang tải danh sách sản phẩm...</td>
            </tr>
        `;
    }
}


// 35. Hiển thị lỗi tải sản phẩm
function renderProductError(error) {
    console.error(error);

    if (productTableBody) {
        productTableBody.innerHTML = "";
    }

    if (emptyProductText) {
        emptyProductText.classList.add("show");
        emptyProductText.textContent = "Không tải được danh sách sản phẩm.";
    }

    renderProductStats([]);
}


// 36. Load sản phẩm từ API
async function loadProductsFromApi() {
    setProductLoading(true);

    const response = await window.AdminApi.get(
        "admin/products/get-products.php?page=1&limit=100&status=all&sort=latest"
    );

    const data = response.data || {};
    const products = Array.isArray(data.products) ? data.products : [];

    adminProducts = products.map(function (product) {
        return normalizeProduct(product);
    });

    renderProductFilterOptions();
    renderProductTable();
}


// 37. Chuyển sang trang chi tiết sản phẩm
function goToProductDetail(productId) {
    if (!productId) {
        return;
    }

    window.location.href = "../html/admin-product-detail.html?id=" + encodeURIComponent(productId);
}


// 38. Tìm sản phẩm theo id
function getProductById(productId) {
    return adminProducts.find(function (product) {
        return String(product.id) === String(productId);
    });
}


// 39. Cập nhật trạng thái ẩn/hiện sản phẩm
async function toggleProductStatus(productId) {
    const product = getProductById(productId);

    if (!product) {
        return;
    }

    const newStatus = product.status === "active" ? "inactive" : "active";
    const actionText = newStatus === "inactive" ? "ẩn" : "hiển thị";

    const isConfirm = confirm(
        "Bạn có chắc muốn " + actionText + " sản phẩm " + product.name + " không?"
    );

    if (!isConfirm) {
        return;
    }

    try {
        await window.AdminApi.post("admin/products/update-product-status.php", {
            product_id: Number(productId),
            status: newStatus
        });

        await loadProductsFromApi();
    } catch (error) {
        alert(
            window.AdminApi.getApiErrorMessage(
                error,
                "Cập nhật trạng thái sản phẩm thất bại."
            )
        );
    }
}


// 40. Xử lý thao tác bảng sản phẩm
function handleProductTableAction(event) {
    const actionButton = event.target.closest("[data-action]");
    const row = event.target.closest("tr");

    if (!row) {
        return;
    }

    const productId = row.dataset.productId;

    if (actionButton) {
        event.stopPropagation();

        const action = actionButton.dataset.action;

        if (action === "delete") {
            toggleProductStatus(productId);
        }

        return;
    }

    goToProductDetail(productId);
}


// 41. Xử lý đổi nhóm lọc
function handleProductGroupFilterChange() {
    renderCategoryFilterOptions();
    renderProductTable();
}


// 42. Xử lý đăng xuất
function handleAdminLogout() {
    if (window.AdminApi && window.AdminApi.logoutAdmin) {
        window.AdminApi.logoutAdmin();
        return;
    }

    localStorage.removeItem("admin_current_user");
    localStorage.removeItem("admin_is_login");
    window.location.href = "../html/admin-login.html";
}


// 43. Gắn sự kiện trang sản phẩm
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
        productGroupFilter.addEventListener("change", handleProductGroupFilterChange);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", renderProductTable);
    }

    if (stockFilter) {
        stockFilter.addEventListener("change", renderProductTable);
    }
}


// 44. Kiểm tra đăng nhập local
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


// 45. Khởi tạo trang quản lý sản phẩm
async function initAdminProductsPage() {
    currentAdminUser = checkAdminLoginLocal();

    if (!currentAdminUser) {
        return;
    }

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    bindProductEvents();

    try {
        await loadProductsFromApi();
    } catch (error) {
        if (error && error.status === 401) {
            window.AdminApi.clearAdminLocalAuth();
            window.location.href = "../html/admin-login.html";
            return;
        }

        renderProductError(error);
    }
}

initAdminProductsPage();