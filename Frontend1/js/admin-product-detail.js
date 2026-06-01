// =========================================================
// File: Frontend1/js/admin-product-detail.js
// Mục đích: Thêm / sửa sản phẩm admin bằng API backend thật
// =========================================================


// 1. Lấy element thông tin admin
const adminAvatar = document.getElementById("adminAvatar");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const adminCurrentDate = document.getElementById("adminCurrentDate");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");


// 2. Lấy element tiêu đề trang
const productDetailTitle = document.getElementById("productDetailTitle");
const productDetailSubtitle = document.getElementById("productDetailSubtitle");
const detailPageProductName = document.getElementById("detailPageProductName");
const detailPageProductCode = document.getElementById("detailPageProductCode");
const detailPageProductStatusBadge = document.getElementById("detailPageProductStatusBadge");
const saveProductHeaderBtn = document.getElementById("saveProductHeaderBtn");


// 3. Lấy element form sản phẩm
const productDetailForm = document.getElementById("productDetailForm");
const detailProductIdInput = document.getElementById("detailProductIdInput");
const detailProductImagePreview = document.getElementById("detailProductImagePreview");
const detailProductImageText = document.getElementById("detailProductImageText");
const detailProductImageFile = document.getElementById("detailProductImageFile");

const detailProductNameInput = document.getElementById("detailProductNameInput");
const detailProductGroupInput = document.getElementById("detailProductGroupInput");
const detailProductCategoryInput = document.getElementById("detailProductCategoryInput");
const detailProductStatusInput = document.getElementById("detailProductStatusInput");
const detailProductPriceInput = document.getElementById("detailProductPriceInput");
const detailProductOldPriceInput = document.getElementById("detailProductOldPriceInput");
const detailProductMaterialInput = document.getElementById("detailProductMaterialInput");
const detailProductStockInput = document.getElementById("detailProductStockInput");

const detailProductColorInput = document.getElementById("detailProductColorInput");
const addProductColorBtn = document.getElementById("addProductColorBtn");
const detailProductColorList = document.getElementById("detailProductColorList");

const detailProductSizeInput = document.getElementById("detailProductSizeInput");
const detailProductSizeQuantityInput = document.getElementById("detailProductSizeQuantityInput");
const addProductSizeBtn = document.getElementById("addProductSizeBtn");
const detailProductSizeTableBody = document.getElementById("detailProductSizeTableBody");

const detailProductDescriptionInput = document.getElementById("detailProductDescriptionInput");
const detailProductFormMessage = document.getElementById("detailProductFormMessage");


// 4. Lấy element template
const productColorTagTemplate = document.getElementById("productColorTagTemplate");
const productSizeRowTemplate = document.getElementById("productSizeRowTemplate");


// 5. Lấy element tóm tắt sản phẩm
const summaryProductGroup = document.getElementById("summaryProductGroup");
const summaryProductCategory = document.getElementById("summaryProductCategory");
const summaryProductMaterial = document.getElementById("summaryProductMaterial");
const summaryProductColorCount = document.getElementById("summaryProductColorCount");
const summaryProductPrice = document.getElementById("summaryProductPrice");
const summaryProductStock = document.getElementById("summaryProductStock");


// 6. Lấy element trạng thái trang
const productDetailEditCard = document.getElementById("productDetailEditCard");
const productDetailSummaryGrid = document.getElementById("productDetailSummaryGrid");
const productNotFoundBox = document.getElementById("productNotFoundBox");


// 7. Biến lưu trạng thái trang
let currentAdminUser = null;
let currentProductId = null;
let currentProductData = null;
let isEditMode = false;

let adminProductOptions = {
    parentCategories: [],
    childCategories: [],
    categories: [],
    colors: [],
    sizes: []
};

let selectedColors = [];
let selectedSizes = [];
let selectedImage = "";
let existingVariantMap = {};


// 7.1. Nhóm sản phẩm hiển thị theo đúng menu khách hàng
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


// 8. Format tiền Việt Nam
function formatPrice(price) {
    if (window.AdminApi && window.AdminApi.formatPrice) {
        return window.AdminApi.formatPrice(price);
    }

    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}


// 9. Render ngày hiện tại
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


// 10. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) {
        return "S";
    }

    return text.trim().charAt(0).toUpperCase();
}


// 11. Lấy id sản phẩm từ URL
function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}


// 12. Lấy label vai trò
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


// 13. Hiển thị thông tin admin
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


// 14. Đăng xuất admin
function handleAdminLogout() {
    if (window.AdminApi && window.AdminApi.logoutAdmin) {
        window.AdminApi.logoutAdmin();
        return;
    }

    localStorage.removeItem("admin_current_user");
    localStorage.removeItem("admin_is_login");
    window.location.href = "../html/admin-login.html";
}


// 15. Hiển thị thông báo form
function showProductFormMessage(message, type = "error") {
    if (!detailProductFormMessage) {
        return;
    }

    detailProductFormMessage.textContent = message;

    if (type === "success") {
        detailProductFormMessage.classList.add("success");
    } else {
        detailProductFormMessage.classList.remove("success");
    }
}


// 16. Xóa thông báo form
function clearProductFormMessage() {
    if (!detailProductFormMessage) {
        return;
    }

    detailProductFormMessage.textContent = "";
    detailProductFormMessage.classList.remove("success");
}


// 17. Tạo slug từ tên sản phẩm / danh mục
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


// 18. Hiển thị không tìm thấy sản phẩm
function showProductNotFound() {
    if (productDetailEditCard) {
        productDetailEditCard.style.display = "none";
    }

    if (productDetailSummaryGrid) {
        productDetailSummaryGrid.style.display = "none";
    }

    if (productNotFoundBox) {
        productNotFoundBox.style.display = "block";
    }
}


// 19. Hiển thị form sản phẩm
function showProductForm() {
    if (productDetailEditCard) {
        productDetailEditCard.style.display = "block";
    }

    if (productDetailSummaryGrid) {
        productDetailSummaryGrid.style.display = "block";
    }

    if (productNotFoundBox) {
        productNotFoundBox.style.display = "none";
    }
}


// 20. Lấy thông tin trạng thái sản phẩm
function getProductStatusInfo(status) {
    if (status === "inactive" || status === "hidden") {
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


// 21. Render badge trạng thái sản phẩm
function renderProductStatusBadge(status) {
    if (!detailPageProductStatusBadge) {
        return;
    }

    const statusInfo = getProductStatusInfo(status);

    detailPageProductStatusBadge.textContent = statusInfo.text;
    detailPageProductStatusBadge.className = "statusBadge " + statusInfo.className;
}


// 22. Render tiêu đề trang
function renderPageTitle() {
    if (isEditMode) {
        if (productDetailTitle) {
            productDetailTitle.textContent = "Sửa sản phẩm";
        }

        if (productDetailSubtitle) {
            productDetailSubtitle.textContent = "Xem và chỉnh sửa thông tin sản phẩm trong hệ thống quản trị";
        }

        document.title = "Sửa sản phẩm";
        return;
    }

    if (productDetailTitle) {
        productDetailTitle.textContent = "Thêm sản phẩm";
    }

    if (productDetailSubtitle) {
        productDetailSubtitle.textContent = "Tạo sản phẩm mới trong hệ thống quản trị";
    }

    document.title = "Thêm sản phẩm";
}


// 23. Tìm option màu theo tên/code/id
function findColorOption(value) {
    const keyword = String(value || "").trim().toLowerCase();

    return adminProductOptions.colors.find(function (color) {
        return (
            String(color.id) === keyword ||
            String(color.name || "").toLowerCase() === keyword ||
            String(color.code || "").toLowerCase() === keyword
        );
    });
}


// 24. Tìm option size theo tên/code/id
function findSizeOption(value) {
    const keyword = String(value || "").trim().toLowerCase();

    return adminProductOptions.sizes.find(function (size) {
        return (
            String(size.id) === keyword ||
            String(size.name || "").toLowerCase() === keyword ||
            String(size.code || "").toLowerCase() === keyword
        );
    });
}


// 25. Tạo datalist gợi ý màu / size
function createInputDatalist(inputElement, listId, items) {
    if (!inputElement) {
        return;
    }

    let dataList = document.getElementById(listId);

    if (!dataList) {
        dataList = document.createElement("datalist");
        dataList.id = listId;
        document.body.appendChild(dataList);
    }

    dataList.innerHTML = "";

    items.forEach(function (item) {
        const option = document.createElement("option");
        option.value = item.name || item.code || item.id;
        option.label = item.code ? item.name + " - " + item.code : item.name;
        dataList.appendChild(option);
    });

    inputElement.setAttribute("list", listId);
}


// 26. Render option nhóm sản phẩm
function renderProductGroupOptions() {
    if (!detailProductGroupInput) {
        return;
    }

    detailProductGroupInput.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Chọn nhóm sản phẩm";
    detailProductGroupInput.appendChild(defaultOption);

    ADMIN_CATEGORY_GROUPS.forEach(function (group) {
        const option = document.createElement("option");
        option.value = group.id;
        option.textContent = group.name;
        detailProductGroupInput.appendChild(option);
    });
}


// 26.1. Lấy slug danh mục
function getCategorySlug(category) {
    if (!category) {
        return "";
    }

    return category.slug || createSlug(category.name || "");
}


// 26.2. Kiểm tra danh mục có thuộc nhóm admin không
function isCategoryInAdminGroup(category, groupId) {
    const group = ADMIN_CATEGORY_GROUPS.find(function (item) {
        return item.id === groupId;
    });

    if (!group) {
        return false;
    }

    const categorySlug = getCategorySlug(category);

    return group.categorySlugs.includes(categorySlug);
}


// 26.3. Tìm nhóm admin theo danh mục sản phẩm
function getAdminGroupIdByCategory(categoryId, categoryName) {
    const category = adminProductOptions.categories.find(function (item) {
        return String(item.id) === String(categoryId);
    }) || adminProductOptions.childCategories.find(function (item) {
        return String(item.id) === String(categoryId);
    }) || {
        id: categoryId,
        name: categoryName || ""
    };

    const categorySlug = getCategorySlug(category);

    const group = ADMIN_CATEGORY_GROUPS.find(function (item) {
        return item.categorySlugs.includes(categorySlug);
    });

    return group ? group.id : "";
}


// 27. Render option danh mục sản phẩm
function renderCategoryOptions(groupId = "") {
    if (!detailProductCategoryInput) {
        return;
    }

    const currentValue = detailProductCategoryInput.value;

    detailProductCategoryInput.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Chọn loại sản phẩm";
    detailProductCategoryInput.appendChild(defaultOption);

    let categoryList = adminProductOptions.childCategories;

    if (groupId) {
        categoryList = categoryList.filter(function (category) {
            return isCategoryInAdminGroup(category, groupId);
        });
    } else {
        categoryList = [];
    }

    categoryList.forEach(function (category) {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        option.dataset.parentId = category.parent && category.parent.id ? category.parent.id : "";
        detailProductCategoryInput.appendChild(option);
    });

    const hasCurrentValue = categoryList.some(function (category) {
        return String(category.id) === String(currentValue);
    });

    if (hasCurrentValue) {
        detailProductCategoryInput.value = currentValue;
    }
}


// 28. Load option sản phẩm từ API
async function loadProductOptions() {
    const response = await window.AdminApi.get("admin/options/get-product-options.php");
    const data = response.data || {};

    adminProductOptions = {
        parentCategories: Array.isArray(data.parent_categories) ? data.parent_categories : [],
        childCategories: Array.isArray(data.child_categories) ? data.child_categories : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        colors: Array.isArray(data.colors) ? data.colors : [],
        sizes: Array.isArray(data.sizes) ? data.sizes : []
    };

    renderProductGroupOptions();
    renderCategoryOptions();

    createInputDatalist(detailProductColorInput, "adminColorOptions", adminProductOptions.colors);
    createInputDatalist(detailProductSizeInput, "adminSizeOptions", adminProductOptions.sizes);
}


// 29. Render ảnh preview
function renderProductImagePreview(productName) {
    if (!detailProductImagePreview || !detailProductImageText) {
        return;
    }

    detailProductImageText.textContent = getFirstLetter(productName);

    if (!selectedImage) {
        detailProductImagePreview.src = "";
        detailProductImagePreview.style.display = "none";
        detailProductImageText.style.display = "flex";
        return;
    }

    detailProductImagePreview.src = selectedImage;
    detailProductImagePreview.alt = productName || "Ảnh sản phẩm";
    detailProductImagePreview.style.display = "block";
    detailProductImageText.style.display = "none";

    detailProductImagePreview.onerror = function () {
        detailProductImagePreview.src = "";
        detailProductImagePreview.style.display = "none";
        detailProductImageText.style.display = "flex";
    };
}


// 30. Tính tổng tồn kho
function calculateTotalStock() {
    return selectedSizes.reduce(function (total, item) {
        return total + Number(item.quantity || 0);
    }, 0);
}


// 31. Cập nhật tổng tồn kho
function updateProductStock() {
    if (detailProductStockInput) {
        detailProductStockInput.value = calculateTotalStock();
    }
}


// 32. Lấy text option đang chọn
function getSelectedOptionText(selectElement) {
    if (!selectElement || !selectElement.options || selectElement.selectedIndex < 0) {
        return "";
    }

    return selectElement.options[selectElement.selectedIndex].textContent;
}


// 33. Render tóm tắt sản phẩm
function renderProductSummary() {
    const groupText = getSelectedOptionText(detailProductGroupInput);
    const categoryText = getSelectedOptionText(detailProductCategoryInput);
    const material = detailProductMaterialInput ? detailProductMaterialInput.value.trim() : "";
    const price = detailProductPriceInput ? Number(detailProductPriceInput.value || 0) : 0;
    const stock = calculateTotalStock();

    if (summaryProductGroup) {
        summaryProductGroup.textContent = groupText && groupText !== "Chọn nhóm sản phẩm"
            ? groupText
            : "Đang cập nhật";
    }

    if (summaryProductCategory) {
        summaryProductCategory.textContent = categoryText && categoryText !== "Chọn loại sản phẩm"
            ? categoryText
            : "Đang cập nhật";
    }

    if (summaryProductMaterial) {
        summaryProductMaterial.textContent = material || "Đang cập nhật";
    }

    if (summaryProductColorCount) {
        summaryProductColorCount.textContent = selectedColors.length + " màu";
    }

    if (summaryProductPrice) {
        summaryProductPrice.textContent = formatPrice(price);
    }

    if (summaryProductStock) {
        summaryProductStock.textContent = stock + " sản phẩm";
    }
}


// 34. Render tag màu
function renderProductColors() {
    if (!detailProductColorList || !productColorTagTemplate) {
        return;
    }

    detailProductColorList.innerHTML = "";

    selectedColors.forEach(function (color) {
        const colorFragment = productColorTagTemplate.content.cloneNode(true);
        const colorTag = colorFragment.querySelector(".colorTagItem");
        const removeButton = colorFragment.querySelector("[data-action='remove-color']");
        const colorNameText = colorFragment.querySelector(".colorNameText");

        if (colorTag) {
            colorTag.dataset.colorId = color.id;
        }

        if (colorNameText) {
            colorNameText.textContent = color.name;
        }

        if (removeButton) {
            removeButton.dataset.colorId = color.id;
        }

        detailProductColorList.appendChild(colorFragment);
    });

    renderProductSummary();
}


// 35. Render bảng size
function renderProductSizes() {
    if (!detailProductSizeTableBody || !productSizeRowTemplate) {
        return;
    }

    detailProductSizeTableBody.innerHTML = "";

    selectedSizes.forEach(function (sizeItem, index) {
        const sizeFragment = productSizeRowTemplate.content.cloneNode(true);
        const row = sizeFragment.querySelector("tr");
        const sizeNameText = sizeFragment.querySelector(".sizeNameText");
        const quantityInput = sizeFragment.querySelector(".sizeQuantityInput");
        const removeButton = sizeFragment.querySelector("[data-action='remove-size']");

        if (row) {
            row.dataset.index = index;
        }

        if (sizeNameText) {
            sizeNameText.textContent = sizeItem.name;
        }

        if (quantityInput) {
            quantityInput.dataset.index = index;
            quantityInput.value = Number(sizeItem.quantity || 0);
        }

        if (removeButton) {
            removeButton.dataset.index = index;
        }

        detailProductSizeTableBody.appendChild(sizeFragment);
    });

    updateProductStock();
    renderProductSummary();
}


// 36. Thêm màu sản phẩm
function addProductColor() {
    if (!detailProductColorInput) {
        return;
    }

    const colorValue = detailProductColorInput.value.trim();

    if (!colorValue) {
        showProductFormMessage("Vui lòng nhập hoặc chọn màu sản phẩm.");
        return;
    }

    const colorOption = findColorOption(colorValue);

    if (!colorOption) {
        showProductFormMessage("Màu này chưa có trong database. Vui lòng chọn theo gợi ý.");
        return;
    }

    const isDuplicate = selectedColors.some(function (item) {
        return Number(item.id) === Number(colorOption.id);
    });

    if (isDuplicate) {
        showProductFormMessage("Màu này đã tồn tại.");
        return;
    }

    selectedColors.push({
        id: Number(colorOption.id),
        name: colorOption.name,
        code: colorOption.code,
        hex_code: colorOption.hex_code
    });

    detailProductColorInput.value = "";
    clearProductFormMessage();
    renderProductColors();
}


// 37. Xóa màu sản phẩm
function removeProductColor(colorId) {
    selectedColors = selectedColors.filter(function (item) {
        return Number(item.id) !== Number(colorId);
    });

    renderProductColors();
}


// 38. Thêm size sản phẩm
function addProductSize() {
    if (!detailProductSizeInput || !detailProductSizeQuantityInput) {
        return;
    }

    const sizeValue = detailProductSizeInput.value.trim();
    const quantity = Number(detailProductSizeQuantityInput.value || 0);

    if (!sizeValue) {
        showProductFormMessage("Vui lòng nhập hoặc chọn kích thước sản phẩm.");
        return;
    }

    if (quantity < 0) {
        showProductFormMessage("Số lượng size không hợp lệ.");
        return;
    }

    const sizeOption = findSizeOption(sizeValue);

    if (!sizeOption) {
        showProductFormMessage("Size này chưa có trong database. Vui lòng chọn theo gợi ý.");
        return;
    }

    const isDuplicate = selectedSizes.some(function (item) {
        return Number(item.id) === Number(sizeOption.id);
    });

    if (isDuplicate) {
        showProductFormMessage("Kích thước này đã tồn tại.");
        return;
    }

    selectedSizes.push({
        id: Number(sizeOption.id),
        name: sizeOption.name,
        code: sizeOption.code,
        quantity: quantity
    });

    detailProductSizeInput.value = "";
    detailProductSizeQuantityInput.value = "";
    clearProductFormMessage();
    renderProductSizes();
}


// 39. Xóa size sản phẩm
function removeProductSize(index) {
    selectedSizes.splice(index, 1);
    renderProductSizes();
}


// 40. Cập nhật số lượng size
function updateProductSizeQuantity(index, quantity) {
    if (!selectedSizes[index]) {
        return;
    }

    selectedSizes[index].quantity = Math.max(Number(quantity || 0), 0);

    updateProductStock();
    renderProductSummary();
}


// 41. Xử lý upload ảnh sản phẩm
function handleProductImageUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        showProductFormMessage("Vui lòng chọn đúng file hình ảnh.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function () {
        selectedImage = reader.result;
        renderProductImagePreview(detailProductNameInput.value.trim());
    };

    reader.readAsDataURL(file);
}


// 42. Set form mặc định khi thêm mới
function setDefaultProductForm() {
    selectedColors = [];
    selectedSizes = [];
    selectedImage = "";
    existingVariantMap = {};

    if (detailProductIdInput) {
        detailProductIdInput.value = "";
    }

    if (detailProductNameInput) {
        detailProductNameInput.value = "";
    }

    if (detailProductGroupInput) {
        detailProductGroupInput.value = "";
    }

    renderCategoryOptions("");

    if (detailProductCategoryInput) {
        detailProductCategoryInput.value = "";
    }

    if (detailProductStatusInput) {
        detailProductStatusInput.value = "active";
    }

    if (detailProductPriceInput) {
        detailProductPriceInput.value = "";
    }

    if (detailProductOldPriceInput) {
        detailProductOldPriceInput.value = "";
    }

    if (detailProductMaterialInput) {
        detailProductMaterialInput.value = "";
    }

    if (detailProductStockInput) {
        detailProductStockInput.value = 0;
    }

    if (detailProductColorInput) {
        detailProductColorInput.value = "";
    }

    if (detailProductSizeInput) {
        detailProductSizeInput.value = "";
    }

    if (detailProductSizeQuantityInput) {
        detailProductSizeQuantityInput.value = "";
    }

    if (detailProductDescriptionInput) {
        detailProductDescriptionInput.value = "";
    }

    if (detailPageProductName) {
        detailPageProductName.textContent = "Thông tin sản phẩm mới";
    }

    if (detailPageProductCode) {
        detailPageProductCode.textContent = "Sản phẩm mới";
    }

    renderProductStatusBadge("active");
    renderProductImagePreview("");
    renderProductColors();
    renderProductSizes();
    renderProductSummary();
}


// 43. Chuẩn hóa dữ liệu sản phẩm từ API
function normalizeProductDetail(product) {
    if (!product) {
        return null;
    }

    return {
        id: product.id,
        name: product.name || "",
        slug: product.slug || "",
        categoryId: product.category ? product.category.id : "",
        categoryName: product.category ? product.category.name : "",
        parentCategoryId: product.parent_category ? product.parent_category.id : "",
        parentCategoryName: product.parent_category ? product.parent_category.name : "",
        status: product.status || "active",
        price: Number(product.base_price || 0),
        oldPrice: product.old_price !== null && product.old_price !== undefined
            ? Number(product.old_price)
            : "",
        material: product.material || "",
        brand: product.brand || "Local Brand",
        gender: product.gender || "unisex",
        description: product.short_description || "",
        image: product.main_image || "",
        images: Array.isArray(product.images) ? product.images : [],
        variants: Array.isArray(product.variants) ? product.variants : []
    };
}


// 44. Tạo dữ liệu màu và size từ variants
function prepareVariantData(product) {
    selectedColors = [];
    selectedSizes = [];
    existingVariantMap = {};

    const colorMap = {};
    const sizeMap = {};

    product.variants.forEach(function (variant) {
        if (variant.color && variant.color.id) {
            colorMap[variant.color.id] = {
                id: Number(variant.color.id),
                name: variant.color.name,
                code: variant.color.code,
                hex_code: variant.color.hex_code
            };
        }

        if (variant.size && variant.size.id) {
            if (!sizeMap[variant.size.id]) {
                sizeMap[variant.size.id] = {
                    id: Number(variant.size.id),
                    name: variant.size.name,
                    code: variant.size.code,
                    quantity: 0
                };
            }

            sizeMap[variant.size.id].quantity += Number(variant.stock_quantity || 0);
        }

        if (variant.color && variant.color.id && variant.size && variant.size.id) {
            const mapKey = variant.color.id + "-" + variant.size.id;

            existingVariantMap[mapKey] = {
                id: variant.id,
                sku: variant.sku,
                stock_quantity: Number(variant.stock_quantity || 0),
                status: variant.status || "active"
            };
        }
    });

    selectedColors = Object.values(colorMap);
    selectedSizes = Object.values(sizeMap);
}


// 45. Đổ dữ liệu sản phẩm vào form
function fillProductForm(product) {
    const normalizedProduct = normalizeProductDetail(product);

    if (!normalizedProduct) {
        return;
    }

    currentProductData = normalizedProduct;
    selectedImage = normalizedProduct.image || "";
    prepareVariantData(normalizedProduct);

    const adminGroupId = getAdminGroupIdByCategory(
        normalizedProduct.categoryId,
        normalizedProduct.categoryName
    );

    if (detailProductIdInput) {
        detailProductIdInput.value = normalizedProduct.id;
    }

    if (detailProductNameInput) {
        detailProductNameInput.value = normalizedProduct.name;
    }

    if (detailProductGroupInput) {
        detailProductGroupInput.value = adminGroupId;
    }

    renderCategoryOptions(adminGroupId);

    if (detailProductCategoryInput) {
        detailProductCategoryInput.value = normalizedProduct.categoryId || "";
    }

    if (detailProductStatusInput) {
        detailProductStatusInput.value = normalizedProduct.status;
    }

    if (detailProductPriceInput) {
        detailProductPriceInput.value = normalizedProduct.price;
    }

    if (detailProductOldPriceInput) {
        detailProductOldPriceInput.value = normalizedProduct.oldPrice;
    }

    if (detailProductMaterialInput) {
        detailProductMaterialInput.value = normalizedProduct.material;
    }

    if (detailProductDescriptionInput) {
        detailProductDescriptionInput.value = normalizedProduct.description;
    }

    if (detailPageProductName) {
        detailPageProductName.textContent = normalizedProduct.name;
    }

    if (detailPageProductCode) {
        detailPageProductCode.textContent = "SP" + String(normalizedProduct.id).padStart(3, "0");
    }

    renderProductStatusBadge(normalizedProduct.status);
    renderProductImagePreview(normalizedProduct.name);
    renderProductColors();
    renderProductSizes();
    renderProductSummary();
}


// 46. Load chi tiết sản phẩm từ API
async function loadProductDetail(productId) {
    const response = await window.AdminApi.get(
        "admin/products/get-product-detail.php?id=" + encodeURIComponent(productId)
    );

    const product = response.data && response.data.product
        ? response.data.product
        : null;

    if (!product) {
        showProductNotFound();
        return;
    }

    showProductForm();
    fillProductForm(product);
}


// 47. Kiểm tra form sản phẩm
function validateProductForm() {
    const name = detailProductNameInput ? detailProductNameInput.value.trim() : "";
    const groupId = detailProductGroupInput ? detailProductGroupInput.value : "";
    const categoryId = detailProductCategoryInput ? Number(detailProductCategoryInput.value || 0) : 0;
    const price = detailProductPriceInput ? Number(detailProductPriceInput.value || 0) : 0;
    const oldPrice = detailProductOldPriceInput && detailProductOldPriceInput.value !== ""
        ? Number(detailProductOldPriceInput.value)
        : 0;
    const material = detailProductMaterialInput ? detailProductMaterialInput.value.trim() : "";

    if (!name) {
        showProductFormMessage("Vui lòng nhập tên sản phẩm.");
        return false;
    }

    if (!groupId) {
        showProductFormMessage("Vui lòng chọn nhóm sản phẩm.");
        return false;
    }

    if (categoryId <= 0) {
        showProductFormMessage("Vui lòng chọn loại sản phẩm.");
        return false;
    }

    if (price <= 0) {
        showProductFormMessage("Giá bán phải lớn hơn 0.");
        return false;
    }

    if (oldPrice > 0 && oldPrice < price) {
        showProductFormMessage("Giá gốc không được nhỏ hơn giá bán.");
        return false;
    }

    if (!material) {
        showProductFormMessage("Vui lòng nhập chất liệu sản phẩm.");
        return false;
    }

    if (selectedColors.length === 0) {
        showProductFormMessage("Vui lòng thêm ít nhất 1 màu sản phẩm.");
        return false;
    }

    if (selectedSizes.length === 0) {
        showProductFormMessage("Vui lòng thêm ít nhất 1 kích thước sản phẩm.");
        return false;
    }

    return true;
}


// 48. Tạo SKU cho biến thể
function createVariantSku(productIdOrName, color, size) {
    const base = isEditMode && currentProductId
        ? "SP" + String(currentProductId).padStart(3, "0")
        : createSlug(productIdOrName).toUpperCase().slice(0, 12);

    const colorCode = String(color.code || color.name || color.id)
        .toUpperCase()
        .replace(/\s+/g, "-");

    const sizeCode = String(size.code || size.name || size.id)
        .toUpperCase()
        .replace(/\s+/g, "-");

    return base + "-" + colorCode + "-" + sizeCode + "-" + Date.now().toString().slice(-4);
}


// 49. Chia tồn kho của size cho các màu
function distributeQuantity(totalQuantity, colorIndex, colorCount) {
    const quantity = Number(totalQuantity || 0);
    const baseQuantity = Math.floor(quantity / colorCount);
    const remainder = quantity % colorCount;

    return baseQuantity + (colorIndex < remainder ? 1 : 0);
}


// 50. Tạo danh sách biến thể gửi lên API
function buildProductVariants(productName) {
    const variants = [];
    const colorCount = selectedColors.length;

    selectedSizes.forEach(function (size) {
        selectedColors.forEach(function (color, colorIndex) {
            const mapKey = color.id + "-" + size.id;
            const oldVariant = existingVariantMap[mapKey] || null;
            const stockQuantity = distributeQuantity(size.quantity, colorIndex, colorCount);

            variants.push({
                id: oldVariant ? Number(oldVariant.id) : 0,
                color_id: Number(color.id),
                size_id: Number(size.id),
                sku: oldVariant && oldVariant.sku
                    ? oldVariant.sku
                    : createVariantSku(productName, color, size),
                stock_quantity: stockQuantity,
                status: "active"
            });
        });
    });

    return variants;
}


// 51. Tạo danh sách ảnh gửi lên API
function buildProductImages() {
    if (!selectedImage) {
        return [];
    }

    return [
        {
            image_url: selectedImage,
            is_main: 1
        }
    ];
}


// 52. Lấy dữ liệu form sản phẩm để gửi API
function getProductFormData() {
    const name = detailProductNameInput.value.trim();

    const data = {
        category_id: Number(detailProductCategoryInput.value),
        name: name,
        slug: createSlug(name),
        short_description: detailProductDescriptionInput
            ? detailProductDescriptionInput.value.trim()
            : "",
        base_price: Number(detailProductPriceInput.value || 0),
        old_price: detailProductOldPriceInput && detailProductOldPriceInput.value !== ""
            ? Number(detailProductOldPriceInput.value)
            : "",
        gender: "unisex",
        material: detailProductMaterialInput ? detailProductMaterialInput.value.trim() : "",
        brand: currentProductData && currentProductData.brand
            ? currentProductData.brand
            : "Local Brand",
        is_featured: currentProductData && currentProductData.is_featured
            ? Number(currentProductData.is_featured)
            : 0,
        is_new: isEditMode ? 0 : 1,
        is_sale: detailProductOldPriceInput && Number(detailProductOldPriceInput.value || 0) > 0 ? 1 : 0,
        status: detailProductStatusInput ? detailProductStatusInput.value : "active",
        images: buildProductImages(),
        variants: buildProductVariants(name)
    };

    if (isEditMode) {
        data.product_id = Number(currentProductId);
    }

    return data;
}


// 53. Set trạng thái loading nút lưu
function setSaveLoading(isLoading) {
    const submitButtons = document.querySelectorAll("button[type='submit'], #saveProductHeaderBtn");

    submitButtons.forEach(function (button) {
        button.disabled = isLoading;
    });

    if (saveProductHeaderBtn) {
        saveProductHeaderBtn.textContent = isLoading ? "Đang lưu..." : "Lưu sản phẩm";
    }
}


// 54. Lưu sản phẩm bằng API
async function saveProduct() {
    if (!validateProductForm()) {
        return;
    }

    const formData = getProductFormData();

    try {
        setSaveLoading(true);

        if (isEditMode) {
            await window.AdminApi.post("admin/products/update-product.php", formData);
        } else {
            await window.AdminApi.post("admin/products/create-product.php", formData);
        }

        showProductFormMessage("Lưu sản phẩm thành công. Đang quay lại danh sách...", "success");

        setTimeout(function () {
            window.location.href = "../html/admin-products.html";
        }, 700);
    } catch (error) {
        showProductFormMessage(
            window.AdminApi.getApiErrorMessage(error, "Lưu sản phẩm thất bại.")
        );
    } finally {
        setSaveLoading(false);
    }
}


// 55. Xử lý submit form sản phẩm
function handleProductFormSubmit(event) {
    event.preventDefault();
    clearProductFormMessage();
    saveProduct();
}


// 56. Gắn sự kiện form màu / size / ảnh
function bindDynamicFormEvents() {
    if (addProductColorBtn) {
        addProductColorBtn.addEventListener("click", addProductColor);
    }

    if (detailProductColorInput) {
        detailProductColorInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                addProductColor();
            }
        });
    }

    if (detailProductColorList) {
        detailProductColorList.addEventListener("click", function (event) {
            const removeButton = event.target.closest("[data-action='remove-color']");

            if (!removeButton) {
                return;
            }

            removeProductColor(removeButton.dataset.colorId);
        });
    }

    if (addProductSizeBtn) {
        addProductSizeBtn.addEventListener("click", addProductSize);
    }

    if (detailProductSizeInput) {
        detailProductSizeInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                addProductSize();
            }
        });
    }

    if (detailProductSizeQuantityInput) {
        detailProductSizeQuantityInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                addProductSize();
            }
        });
    }

    if (detailProductSizeTableBody) {
        detailProductSizeTableBody.addEventListener("click", function (event) {
            const removeButton = event.target.closest("[data-action='remove-size']");

            if (!removeButton) {
                return;
            }

            removeProductSize(Number(removeButton.dataset.index));
        });

        detailProductSizeTableBody.addEventListener("input", function (event) {
            const quantityInput = event.target.closest(".sizeQuantityInput");

            if (!quantityInput) {
                return;
            }

            updateProductSizeQuantity(Number(quantityInput.dataset.index), quantityInput.value);
        });
    }

    if (detailProductImageFile) {
        detailProductImageFile.addEventListener("change", handleProductImageUpload);
    }
}


// 57. Gắn sự kiện cập nhật summary
function bindSummaryEvents() {
    const summaryInputs = [
        detailProductNameInput,
        detailProductGroupInput,
        detailProductCategoryInput,
        detailProductStatusInput,
        detailProductPriceInput,
        detailProductOldPriceInput,
        detailProductMaterialInput
    ];

    summaryInputs.forEach(function (input) {
        if (!input) {
            return;
        }

        input.addEventListener("input", function () {
            if (input === detailProductNameInput) {
                renderProductImagePreview(detailProductNameInput.value.trim());

                if (!isEditMode && detailPageProductName) {
                    detailPageProductName.textContent =
                        detailProductNameInput.value.trim() || "Thông tin sản phẩm mới";
                }
            }

            if (input === detailProductStatusInput) {
                renderProductStatusBadge(detailProductStatusInput.value);
            }

            renderProductSummary();
        });

        input.addEventListener("change", function () {
            if (input === detailProductGroupInput) {
                renderCategoryOptions(detailProductGroupInput.value);
            }

            if (input === detailProductStatusInput) {
                renderProductStatusBadge(detailProductStatusInput.value);
            }

            renderProductSummary();
        });
    });
}


// 58. Gắn sự kiện trang chi tiết sản phẩm
function bindProductDetailEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (saveProductHeaderBtn) {
        saveProductHeaderBtn.addEventListener("click", function () {
            if (productDetailForm) {
                productDetailForm.requestSubmit();
            }
        });
    }

    if (productDetailForm) {
        productDetailForm.addEventListener("submit", handleProductFormSubmit);
    }

    bindDynamicFormEvents();
    bindSummaryEvents();
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


// 60. Khởi tạo trang chi tiết sản phẩm
async function initAdminProductDetailPage() {
    currentAdminUser = checkAdminLoginLocal();

    if (!currentAdminUser) {
        return;
    }

    currentProductId = getProductIdFromUrl();
    isEditMode = Boolean(currentProductId);

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    renderPageTitle();
    bindProductDetailEvents();

    try {
        await loadProductOptions();

        if (isEditMode) {
            await loadProductDetail(currentProductId);
        } else {
            showProductForm();
            setDefaultProductForm();
        }
    } catch (error) {
        if (error && error.status === 401) {
            window.AdminApi.clearAdminLocalAuth();
            window.location.href = "../html/admin-login.html";
            return;
        }

        showProductFormMessage(
            window.AdminApi.getApiErrorMessage(error, "Không tải được dữ liệu sản phẩm.")
        );

        if (isEditMode) {
            showProductNotFound();
        }
    }
}

initAdminProductDetailPage();