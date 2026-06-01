// =========================================================
// File: Frontend1/js/admin-product-detail.js
// Mục đích: Thêm / sửa sản phẩm admin bằng API backend thật
//          Quản lý biến thể theo Màu + Size + Số lượng
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
const detailProductDescriptionInput = document.getElementById("detailProductDescriptionInput");
const detailProductFormMessage = document.getElementById("detailProductFormMessage");


// 4. Lấy element biến thể sản phẩm
const detailVariantColorInput = document.getElementById("detailVariantColorInput");
const detailVariantSizeInput = document.getElementById("detailVariantSizeInput");
const detailVariantQuantityInput = document.getElementById("detailVariantQuantityInput");
const detailVariantSkuInput = document.getElementById("detailVariantSkuInput");
const addProductVariantBtn = document.getElementById("addProductVariantBtn");

const detailProductVariantTableBody = document.getElementById("detailProductVariantTableBody");
const productVariantRowTemplate = document.getElementById("productVariantRowTemplate");


// 5. Lấy element tóm tắt sản phẩm
const summaryProductGroup = document.getElementById("summaryProductGroup");
const summaryProductCategory = document.getElementById("summaryProductCategory");
const summaryProductMaterial = document.getElementById("summaryProductMaterial");
const summaryProductVariantCount = document.getElementById("summaryProductVariantCount");
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
let isProductImageUploading = false;

let adminProductOptions = {
    parentCategories: [],
    childCategories: [],
    categories: [],
    colors: [],
    sizes: []
};

let selectedImage = "";
let selectedVariants = [];


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

    createInputDatalist(detailVariantColorInput, "adminColorOptions", adminProductOptions.colors);
    createInputDatalist(detailVariantSizeInput, "adminSizeOptions", adminProductOptions.sizes);
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


// 30. Kiểm tra ảnh tạm không được lưu vào database
function isTemporaryImageUrl(imageUrl) {
    return String(imageUrl || "").startsWith("data:image") ||
        String(imageUrl || "").startsWith("blob:");
}


// 31. Set trạng thái upload ảnh
function setImageUploadLoading(isLoading) {
    isProductImageUploading = isLoading;

    const submitButtons = document.querySelectorAll("button[type='submit'], #saveProductHeaderBtn");

    submitButtons.forEach(function (button) {
        button.disabled = isLoading;
    });

    if (saveProductHeaderBtn) {
        saveProductHeaderBtn.textContent = isLoading ? "Đang upload ảnh..." : "Lưu sản phẩm";
    }

    if (detailProductImageText && isLoading) {
        detailProductImageText.textContent = "...";
        detailProductImageText.style.display = "flex";
    }
}


// 32. Upload ảnh sản phẩm lên server
async function uploadProductImage(file) {
    const formData = new FormData();

    formData.append("image", file);

    const response = await fetch("../../BackEnd/php/api/admin/products/upload-product-image.php", {
        method: "POST",
        credentials: "same-origin",
        body: formData
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
        throw data;
    }

    const imageUrl = data.data && data.data.image
        ? data.data.image.image_url
        : "";

    if (!imageUrl) {
        throw {
            message: "API upload ảnh không trả về image_url."
        };
    }

    return imageUrl;
}


// 33. Xử lý upload ảnh sản phẩm
async function handleProductImageUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        showProductFormMessage("Vui lòng chọn đúng file hình ảnh.");
        event.target.value = "";
        return;
    }

    const maxFileSize = 5 * 1024 * 1024;

    if (file.size > maxFileSize) {
        showProductFormMessage("Ảnh sản phẩm không được vượt quá 5MB.");
        event.target.value = "";
        return;
    }

    try {
        clearProductFormMessage();
        setImageUploadLoading(true);
        showProductFormMessage("Đang upload ảnh sản phẩm...", "success");

        const imageUrl = await uploadProductImage(file);

        selectedImage = imageUrl;

        renderProductImagePreview(detailProductNameInput.value.trim());
        showProductFormMessage("Upload ảnh sản phẩm thành công.", "success");
    } catch (error) {
        selectedImage = isEditMode && currentProductData ? currentProductData.image : "";
        renderProductImagePreview(detailProductNameInput.value.trim());

        showProductFormMessage(
            window.AdminApi.getApiErrorMessage(error, "Upload ảnh sản phẩm thất bại.")
        );
    } finally {
        setImageUploadLoading(false);
    }
}


// 34. Tính tổng tồn kho
function calculateTotalStock() {
    return selectedVariants.reduce(function (total, variant) {
        return total + Number(variant.stockQuantity || 0);
    }, 0);
}


// 35. Cập nhật tổng tồn kho
function updateProductStock() {
    if (detailProductStockInput) {
        detailProductStockInput.value = calculateTotalStock();
    }
}


// 36. Lấy text option đang chọn
function getSelectedOptionText(selectElement) {
    if (!selectElement || !selectElement.options || selectElement.selectedIndex < 0) {
        return "";
    }

    return selectElement.options[selectElement.selectedIndex].textContent;
}


// 37. Render tóm tắt sản phẩm
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

    if (summaryProductVariantCount) {
        summaryProductVariantCount.textContent = selectedVariants.length + " biến thể";
    }

    if (summaryProductPrice) {
        summaryProductPrice.textContent = formatPrice(price);
    }

    if (summaryProductStock) {
        summaryProductStock.textContent = stock + " sản phẩm";
    }

    updateProductStock();
}


// 38. Tạo SKU cho biến thể
function createVariantSku(productName, color, size) {
    const productPart = isEditMode && currentProductId
        ? "SP" + String(currentProductId).padStart(3, "0")
        : createSlug(productName).toUpperCase().slice(0, 12);

    const colorPart = String(color.code || color.name || color.id)
        .toUpperCase()
        .replace(/\s+/g, "-");

    const sizePart = String(size.code || size.name || size.id)
        .toUpperCase()
        .replace(/\s+/g, "-");

    return productPart + "-" + colorPart + "-" + sizePart + "-" + Date.now().toString().slice(-4);
}


// 39. Tìm biến thể theo màu và size
function findVariantIndex(colorId, sizeId) {
    return selectedVariants.findIndex(function (variant) {
        return (
            Number(variant.colorId) === Number(colorId) &&
            Number(variant.sizeId) === Number(sizeId)
        );
    });
}


// 40. Thêm biến thể sản phẩm
function addProductVariant() {
    const colorValue = detailVariantColorInput ? detailVariantColorInput.value.trim() : "";
    const sizeValue = detailVariantSizeInput ? detailVariantSizeInput.value.trim() : "";
    const quantity = detailVariantQuantityInput ? Number(detailVariantQuantityInput.value || 0) : 0;
    const skuValue = detailVariantSkuInput ? detailVariantSkuInput.value.trim() : "";

    if (!colorValue) {
        showProductFormMessage("Vui lòng nhập hoặc chọn màu sản phẩm.");
        return;
    }

    if (!sizeValue) {
        showProductFormMessage("Vui lòng nhập hoặc chọn kích thước sản phẩm.");
        return;
    }

    if (quantity < 0) {
        showProductFormMessage("Số lượng biến thể không hợp lệ.");
        return;
    }

    const colorOption = findColorOption(colorValue);

    if (!colorOption) {
        showProductFormMessage("Màu này chưa có trong database. Vui lòng chọn theo gợi ý.");
        return;
    }

    const sizeOption = findSizeOption(sizeValue);

    if (!sizeOption) {
        showProductFormMessage("Size này chưa có trong database. Vui lòng chọn theo gợi ý.");
        return;
    }

    const existedIndex = findVariantIndex(colorOption.id, sizeOption.id);

    if (existedIndex >= 0) {
        showProductFormMessage("Biến thể màu và size này đã tồn tại. Bạn có thể sửa số lượng trực tiếp trong bảng.");
        return;
    }

    const productName = detailProductNameInput ? detailProductNameInput.value.trim() : "product";

    selectedVariants.push({
        id: 0,
        colorId: Number(colorOption.id),
        colorName: colorOption.name,
        colorCode: colorOption.code || "",
        sizeId: Number(sizeOption.id),
        sizeName: sizeOption.name,
        sizeCode: sizeOption.code || "",
        sku: skuValue || createVariantSku(productName, colorOption, sizeOption),
        stockQuantity: quantity,
        status: "active"
    });

    if (detailVariantColorInput) detailVariantColorInput.value = "";
    if (detailVariantSizeInput) detailVariantSizeInput.value = "";
    if (detailVariantQuantityInput) detailVariantQuantityInput.value = "";
    if (detailVariantSkuInput) detailVariantSkuInput.value = "";

    clearProductFormMessage();
    renderProductVariants();
}


// 41. Xóa biến thể sản phẩm
function removeProductVariant(index) {
    selectedVariants.splice(index, 1);
    renderProductVariants();
}


// 42. Cập nhật SKU biến thể
function updateVariantSku(index, sku) {
    if (!selectedVariants[index]) {
        return;
    }

    selectedVariants[index].sku = String(sku || "").trim();
}


// 43. Cập nhật số lượng biến thể
function updateVariantQuantity(index, quantity) {
    if (!selectedVariants[index]) {
        return;
    }

    selectedVariants[index].stockQuantity = Math.max(Number(quantity || 0), 0);
    renderProductSummary();
}


// 44. Render bảng biến thể
function renderProductVariants() {
    if (!detailProductVariantTableBody || !productVariantRowTemplate) {
        renderProductSummary();
        return;
    }

    detailProductVariantTableBody.innerHTML = "";

    selectedVariants.forEach(function (variant, index) {
        const variantFragment = productVariantRowTemplate.content.cloneNode(true);
        const row = variantFragment.querySelector("tr");

        const colorText = variantFragment.querySelector(".variantColorText");
        const sizeText = variantFragment.querySelector(".variantSizeText");
        const skuInput = variantFragment.querySelector(".variantSkuInput");
        const quantityInput = variantFragment.querySelector(".variantQuantityInput");
        const removeButton = variantFragment.querySelector("[data-action='remove-variant']");

        if (row) {
            row.dataset.index = index;
        }

        if (colorText) {
            colorText.textContent = variant.colorName || "Đang cập nhật";
        }

        if (sizeText) {
            sizeText.textContent = variant.sizeName || "Đang cập nhật";
        }

        if (skuInput) {
            skuInput.dataset.index = index;
            skuInput.value = variant.sku || "";
        }

        if (quantityInput) {
            quantityInput.dataset.index = index;
            quantityInput.value = Number(variant.stockQuantity || 0);
        }

        if (removeButton) {
            removeButton.dataset.index = index;
        }

        detailProductVariantTableBody.appendChild(variantFragment);
    });

    renderProductSummary();
}


// 45. Set form mặc định khi thêm mới
function setDefaultProductForm() {
    selectedImage = "";
    selectedVariants = [];

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

    if (detailVariantColorInput) {
        detailVariantColorInput.value = "";
    }

    if (detailVariantSizeInput) {
        detailVariantSizeInput.value = "";
    }

    if (detailVariantQuantityInput) {
        detailVariantQuantityInput.value = "";
    }

    if (detailVariantSkuInput) {
        detailVariantSkuInput.value = "";
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
    renderProductVariants();
    renderProductSummary();
}


// 46. Chuẩn hóa dữ liệu sản phẩm từ API
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
        variants: Array.isArray(product.variants) ? product.variants : [],
        is_featured: product.is_featured || 0
    };
}


// 47. Tạo dữ liệu biến thể từ API
function prepareVariantData(product) {
    selectedVariants = [];

    product.variants.forEach(function (variant) {
        if (!variant.color || !variant.color.id || !variant.size || !variant.size.id) {
            return;
        }

        selectedVariants.push({
            id: Number(variant.id || 0),
            colorId: Number(variant.color.id),
            colorName: variant.color.name || "Đang cập nhật",
            colorCode: variant.color.code || "",
            sizeId: Number(variant.size.id),
            sizeName: variant.size.name || "Đang cập nhật",
            sizeCode: variant.size.code || "",
            sku: variant.sku || "",
            stockQuantity: Number(variant.stock_quantity || 0),
            status: variant.status || "active"
        });
    });
}


// 48. Đổ dữ liệu sản phẩm vào form
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
    renderProductVariants();
    renderProductSummary();
}


// 49. Load chi tiết sản phẩm từ API
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


// 50. Kiểm tra form sản phẩm
function validateProductForm() {
    const name = detailProductNameInput ? detailProductNameInput.value.trim() : "";
    const groupId = detailProductGroupInput ? detailProductGroupInput.value : "";
    const categoryId = detailProductCategoryInput ? Number(detailProductCategoryInput.value || 0) : 0;
    const price = detailProductPriceInput ? Number(detailProductPriceInput.value || 0) : 0;
    const oldPrice = detailProductOldPriceInput && detailProductOldPriceInput.value !== ""
        ? Number(detailProductOldPriceInput.value)
        : 0;
    const material = detailProductMaterialInput ? detailProductMaterialInput.value.trim() : "";

    if (isProductImageUploading) {
        showProductFormMessage("Vui lòng chờ upload ảnh sản phẩm hoàn tất.");
        return false;
    }

    if (selectedImage && isTemporaryImageUrl(selectedImage)) {
        showProductFormMessage("Ảnh sản phẩm chưa được upload lên server. Vui lòng chọn lại ảnh.");
        return false;
    }

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

    if (selectedVariants.length === 0) {
        showProductFormMessage("Vui lòng thêm ít nhất 1 biến thể sản phẩm.");
        return false;
    }

    const hasInvalidVariant = selectedVariants.some(function (variant) {
        return (
            !variant.colorId ||
            !variant.sizeId ||
            Number(variant.stockQuantity || 0) < 0
        );
    });

    if (hasInvalidVariant) {
        showProductFormMessage("Danh sách biến thể có dữ liệu không hợp lệ.");
        return false;
    }

    return true;
}


// 51. Tạo danh sách biến thể gửi lên API
function buildProductVariants(productName) {
    return selectedVariants.map(function (variant) {
        return {
            id: Number(variant.id || 0),
            color_id: Number(variant.colorId),
            size_id: Number(variant.sizeId),
            sku: variant.sku || createVariantSku(
                productName,
                {
                    id: variant.colorId,
                    name: variant.colorName,
                    code: variant.colorCode
                },
                {
                    id: variant.sizeId,
                    name: variant.sizeName,
                    code: variant.sizeCode
                }
            ),
            stock_quantity: Number(variant.stockQuantity || 0),
            status: variant.status || "active"
        };
    });
}


// 52. Tạo danh sách ảnh gửi lên API
function buildProductImages() {
    if (!selectedImage || isTemporaryImageUrl(selectedImage)) {
        return [];
    }

    return [
        {
            image_url: selectedImage,
            is_main: 1
        }
    ];
}


// 53. Lấy dữ liệu form sản phẩm để gửi API
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


// 54. Set trạng thái loading nút lưu
function setSaveLoading(isLoading) {
    const submitButtons = document.querySelectorAll("button[type='submit'], #saveProductHeaderBtn");

    submitButtons.forEach(function (button) {
        button.disabled = isLoading;
    });

    if (saveProductHeaderBtn) {
        saveProductHeaderBtn.textContent = isLoading ? "Đang lưu..." : "Lưu sản phẩm";
    }
}


// 55. Lưu sản phẩm bằng API
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


// 56. Xử lý submit form sản phẩm
function handleProductFormSubmit(event) {
    event.preventDefault();
    clearProductFormMessage();
    saveProduct();
}


// 57. Gắn sự kiện form biến thể / ảnh
function bindDynamicFormEvents() {
    if (addProductVariantBtn) {
        addProductVariantBtn.addEventListener("click", addProductVariant);
    }

    const variantInputs = [
        detailVariantColorInput,
        detailVariantSizeInput,
        detailVariantQuantityInput,
        detailVariantSkuInput
    ];

    variantInputs.forEach(function (input) {
        if (!input) {
            return;
        }

        input.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                addProductVariant();
            }
        });
    });

    if (detailProductVariantTableBody) {
        detailProductVariantTableBody.addEventListener("click", function (event) {
            const removeButton = event.target.closest("[data-action='remove-variant']");

            if (!removeButton) {
                return;
            }

            removeProductVariant(Number(removeButton.dataset.index));
        });

        detailProductVariantTableBody.addEventListener("input", function (event) {
            const skuInput = event.target.closest(".variantSkuInput");
            const quantityInput = event.target.closest(".variantQuantityInput");

            if (skuInput) {
                updateVariantSku(Number(skuInput.dataset.index), skuInput.value);
                return;
            }

            if (quantityInput) {
                updateVariantQuantity(Number(quantityInput.dataset.index), quantityInput.value);
            }
        });
    }

    if (detailProductImageFile) {
        detailProductImageFile.addEventListener("change", handleProductImageUpload);
    }
}


// 58. Gắn sự kiện cập nhật summary
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


// 59. Gắn sự kiện trang chi tiết sản phẩm
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


// 60. Kiểm tra đăng nhập local
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


// 61. Khởi tạo trang chi tiết sản phẩm
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