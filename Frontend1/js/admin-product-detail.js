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

// 4. Lấy element tiêu đề trang
const productDetailTitle = document.getElementById("productDetailTitle");
const productDetailSubtitle = document.getElementById("productDetailSubtitle");
const detailPageProductName = document.getElementById("detailPageProductName");
const detailPageProductCode = document.getElementById("detailPageProductCode");
const detailPageProductStatusBadge = document.getElementById("detailPageProductStatusBadge");
const saveProductHeaderBtn = document.getElementById("saveProductHeaderBtn");

// 5. Lấy element form sản phẩm
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

// 6. Lấy element template
const productColorTagTemplate = document.getElementById("productColorTagTemplate");
const productSizeRowTemplate = document.getElementById("productSizeRowTemplate");

// 7. Lấy element tóm tắt sản phẩm
const summaryProductGroup = document.getElementById("summaryProductGroup");
const summaryProductCategory = document.getElementById("summaryProductCategory");
const summaryProductMaterial = document.getElementById("summaryProductMaterial");
const summaryProductColorCount = document.getElementById("summaryProductColorCount");
const summaryProductPrice = document.getElementById("summaryProductPrice");
const summaryProductStock = document.getElementById("summaryProductStock");

// 8. Lấy element trạng thái trang
const productDetailEditCard = document.getElementById("productDetailEditCard");
const productDetailSummaryGrid = document.getElementById("productDetailSummaryGrid");
const productNotFoundBox = document.getElementById("productNotFoundBox");

// 9. Biến lưu trạng thái sản phẩm hiện tại
let currentAdminUser = null;
let currentProductId = null;
let currentProductData = null;
let isEditMode = false;
let selectedColors = [];
let selectedSizes = [];
let selectedImage = "";

// 10. Format tiền Việt Nam
function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
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

// 12. Lấy chữ đại diện
function getFirstLetter(text) {
    if (!text) return "S";

    return text.trim().charAt(0).toUpperCase();
}

// 13. Lấy id sản phẩm từ URL
function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return params.get("id");
}

// 14. Kiểm tra đăng nhập admin
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

// 15. Hiển thị thông tin admin
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

// 16. Đăng xuất admin
function handleAdminLogout() {
    localStorage.removeItem(ADMIN_CURRENT_USER_KEY);
    localStorage.removeItem(ADMIN_IS_LOGIN_KEY);

    window.location.href = "../html/admin-login.html";
}

// 17. Tính tổng tồn kho từ size
function calculateProductStockBySizes(sizes) {
    return (sizes || []).reduce(function(total, item) {
        return total + Number(item.quantity || 0);
    }, 0);
}

// 18. Chuẩn hóa sản phẩm
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

// 19. Lấy danh sách sản phẩm
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

// 20. Lưu danh sách sản phẩm
function saveProducts(products) {
    localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products));
}

// 21. Tạo mã sản phẩm mới
function createProductId() {
    const products = getProducts();

    if (products.length === 0) {
        return "SP001";
    }

    const maxNumber = products.reduce(function(max, product) {
        const number = Number(String(product.id).replace("SP", ""));

        return number > max ? number : max;
    }, 0);

    return "SP" + String(maxNumber + 1).padStart(3, "0");
}

// 22. Tìm sản phẩm theo id
function getProductById(productId) {
    const products = getProducts();

    return products.find(function(product) {
        return product.id === productId;
    });
}

// 23. Hiển thị không tìm thấy sản phẩm
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

// 24. Hiển thị form sản phẩm
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

// 25. Lấy thông tin trạng thái sản phẩm
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

// 26. Render badge trạng thái sản phẩm
function renderProductStatusBadge(status) {
    if (!detailPageProductStatusBadge) return;

    const statusInfo = getProductStatusInfo(status);

    detailPageProductStatusBadge.textContent = statusInfo.text;
    detailPageProductStatusBadge.className = "statusBadge " + statusInfo.className;
}

// 27. Render tiêu đề trang
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

// 28. Hiển thị lỗi form
function showProductFormMessage(message, type = "error") {
    if (!detailProductFormMessage) return;

    detailProductFormMessage.textContent = message;

    if (type === "success") {
        detailProductFormMessage.classList.add("success");
    } else {
        detailProductFormMessage.classList.remove("success");
    }
}

// 29. Xóa lỗi form
function clearProductFormMessage() {
    if (!detailProductFormMessage) return;

    detailProductFormMessage.textContent = "";
    detailProductFormMessage.classList.remove("success");
}

// 30. Render ảnh preview
function renderProductImagePreview(productName) {
    if (!detailProductImagePreview || !detailProductImageText) return;

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

    detailProductImagePreview.onerror = function() {
        detailProductImagePreview.src = "";
        detailProductImagePreview.style.display = "none";
        detailProductImageText.style.display = "flex";
    };
}

// 31. Render tag màu
function renderProductColors() {
    if (!detailProductColorList || !productColorTagTemplate) return;

    detailProductColorList.innerHTML = "";

    selectedColors.forEach(function(color) {
        const colorFragment = productColorTagTemplate.content.cloneNode(true);
        const colorTag = colorFragment.querySelector(".colorTagItem");
        const removeButton = colorFragment.querySelector("[data-action='remove-color']");

        colorTag.dataset.color = color;
        colorFragment.querySelector(".colorNameText").textContent = color;
        removeButton.dataset.color = color;

        detailProductColorList.appendChild(colorFragment);
    });

    renderProductSummary();
}

// 32. Render bảng size
function renderProductSizes() {
    if (!detailProductSizeTableBody || !productSizeRowTemplate) return;

    detailProductSizeTableBody.innerHTML = "";

    selectedSizes.forEach(function(sizeItem, index) {
        const sizeFragment = productSizeRowTemplate.content.cloneNode(true);
        const row = sizeFragment.querySelector("tr");
        const quantityInput = sizeFragment.querySelector(".sizeQuantityInput");
        const removeButton = sizeFragment.querySelector("[data-action='remove-size']");

        row.dataset.index = index;
        quantityInput.dataset.index = index;
        removeButton.dataset.index = index;

        sizeFragment.querySelector(".sizeNameText").textContent = sizeItem.size;
        quantityInput.value = Number(sizeItem.quantity || 0);

        detailProductSizeTableBody.appendChild(sizeFragment);
    });

    updateProductStock();
    renderProductSummary();
}

// 33. Cập nhật tổng tồn kho
function updateProductStock() {
    const stock = calculateProductStockBySizes(selectedSizes);

    if (detailProductStockInput) {
        detailProductStockInput.value = stock;
    }
}

// 34. Render tóm tắt sản phẩm
function renderProductSummary() {
    const group = detailProductGroupInput ? detailProductGroupInput.value : "";
    const category = detailProductCategoryInput ? detailProductCategoryInput.value : "";
    const material = detailProductMaterialInput ? detailProductMaterialInput.value.trim() : "";
    const price = detailProductPriceInput ? Number(detailProductPriceInput.value || 0) : 0;
    const stock = calculateProductStockBySizes(selectedSizes);

    if (summaryProductGroup) {
        summaryProductGroup.textContent = group || "Đang cập nhật";
    }

    if (summaryProductCategory) {
        summaryProductCategory.textContent = category || "Đang cập nhật";
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

// 35. Đổ dữ liệu sản phẩm vào form
function fillProductForm(product) {
    if (!product) return;

    selectedColors = Array.isArray(product.colors) ? [...product.colors] : [];
    selectedSizes = Array.isArray(product.sizes)
        ? product.sizes.map(function(item) {
            return {
                size: item.size,
                quantity: Number(item.quantity || 0)
            };
        })
        : [];

    selectedImage = product.image || "";

    if (detailProductIdInput) detailProductIdInput.value = product.id;
    if (detailProductNameInput) detailProductNameInput.value = product.name;
    if (detailProductGroupInput) detailProductGroupInput.value = product.productGroup;
    if (detailProductCategoryInput) detailProductCategoryInput.value = product.category;
    if (detailProductStatusInput) detailProductStatusInput.value = product.status;
    if (detailProductPriceInput) detailProductPriceInput.value = product.price;
    if (detailProductOldPriceInput) detailProductOldPriceInput.value = product.oldPrice || "";
    if (detailProductMaterialInput) detailProductMaterialInput.value = product.material;
    if (detailProductDescriptionInput) detailProductDescriptionInput.value = product.description;

    if (detailPageProductName) {
        detailPageProductName.textContent = product.name;
    }

    if (detailPageProductCode) {
        detailPageProductCode.textContent = product.id;
    }

    renderProductStatusBadge(product.status);
    renderProductImagePreview(product.name);
    renderProductColors();
    renderProductSizes();
    renderProductSummary();
}

// 36. Set form mặc định khi thêm mới
function setDefaultProductForm() {
    selectedColors = [];
    selectedSizes = [];
    selectedImage = "";

    if (detailProductIdInput) detailProductIdInput.value = "";
    if (detailProductNameInput) detailProductNameInput.value = "";
    if (detailProductGroupInput) detailProductGroupInput.value = "";
    if (detailProductCategoryInput) detailProductCategoryInput.value = "";
    if (detailProductStatusInput) detailProductStatusInput.value = "active";
    if (detailProductPriceInput) detailProductPriceInput.value = "";
    if (detailProductOldPriceInput) detailProductOldPriceInput.value = "";
    if (detailProductMaterialInput) detailProductMaterialInput.value = "";
    if (detailProductStockInput) detailProductStockInput.value = 0;
    if (detailProductColorInput) detailProductColorInput.value = "";
    if (detailProductSizeInput) detailProductSizeInput.value = "";
    if (detailProductSizeQuantityInput) detailProductSizeQuantityInput.value = "";
    if (detailProductDescriptionInput) detailProductDescriptionInput.value = "";

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

// 37. Thêm màu sản phẩm
function addProductColor() {
    if (!detailProductColorInput) return;

    const color = detailProductColorInput.value.trim();

    if (!color) {
        showProductFormMessage("Vui lòng nhập màu sản phẩm.");
        return;
    }

    const isDuplicate = selectedColors.some(function(item) {
        return item.toLowerCase() === color.toLowerCase();
    });

    if (isDuplicate) {
        showProductFormMessage("Màu này đã tồn tại.");
        return;
    }

    selectedColors.push(color);
    detailProductColorInput.value = "";
    clearProductFormMessage();
    renderProductColors();
}

// 38. Xóa màu sản phẩm
function removeProductColor(color) {
    selectedColors = selectedColors.filter(function(item) {
        return item !== color;
    });

    renderProductColors();
}

// 39. Thêm size sản phẩm
function addProductSize() {
    if (!detailProductSizeInput || !detailProductSizeQuantityInput) return;

    const size = detailProductSizeInput.value.trim();
    const quantity = Number(detailProductSizeQuantityInput.value || 0);

    if (!size) {
        showProductFormMessage("Vui lòng nhập kích thước sản phẩm.");
        return;
    }

    if (quantity < 0) {
        showProductFormMessage("Số lượng size không hợp lệ.");
        return;
    }

    const isDuplicate = selectedSizes.some(function(item) {
        return item.size.toLowerCase() === size.toLowerCase();
    });

    if (isDuplicate) {
        showProductFormMessage("Kích thước này đã tồn tại.");
        return;
    }

    selectedSizes.push({
        size: size,
        quantity: quantity
    });

    detailProductSizeInput.value = "";
    detailProductSizeQuantityInput.value = "";
    clearProductFormMessage();
    renderProductSizes();
}

// 40. Xóa size sản phẩm
function removeProductSize(index) {
    selectedSizes.splice(index, 1);

    renderProductSizes();
}

// 41. Cập nhật số lượng size
function updateProductSizeQuantity(index, quantity) {
    if (!selectedSizes[index]) return;

    selectedSizes[index].quantity = Number(quantity || 0);

    if (selectedSizes[index].quantity < 0) {
        selectedSizes[index].quantity = 0;
    }

    updateProductStock();
    renderProductSummary();
}

// 42. Xử lý upload ảnh sản phẩm
function handleProductImageUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showProductFormMessage("Vui lòng chọn đúng file hình ảnh.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function() {
        selectedImage = reader.result;
        renderProductImagePreview(detailProductNameInput.value.trim());
    };

    reader.readAsDataURL(file);
}

// 43. Kiểm tra form sản phẩm
function validateProductForm() {
    const name = detailProductNameInput.value.trim();
    const productGroup = detailProductGroupInput.value;
    const category = detailProductCategoryInput.value;
    const price = Number(detailProductPriceInput.value || 0);
    const oldPrice = Number(detailProductOldPriceInput.value || 0);
    const material = detailProductMaterialInput.value.trim();

    if (!name) {
        showProductFormMessage("Vui lòng nhập tên sản phẩm.");
        return false;
    }

    if (!productGroup) {
        showProductFormMessage("Vui lòng chọn nhóm sản phẩm.");
        return false;
    }

    if (!category) {
        showProductFormMessage("Vui lòng chọn loại sản phẩm.");
        return false;
    }

    if (price <= 0) {
        showProductFormMessage("Giá bán phải lớn hơn 0.");
        return false;
    }

    if (oldPrice > 0 && oldPrice < price) {
        showProductFormMessage("Giá gốc không nên nhỏ hơn giá bán.");
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

// 44. Lấy dữ liệu form sản phẩm
function getProductFormData() {
    const productId = detailProductIdInput.value || createProductId();
    const stock = calculateProductStockBySizes(selectedSizes);

    return {
        id: productId,
        name: detailProductNameInput.value.trim(),
        productGroup: detailProductGroupInput.value,
        category: detailProductCategoryInput.value,
        price: Number(detailProductPriceInput.value || 0),
        oldPrice: Number(detailProductOldPriceInput.value || 0),
        stock: stock,
        material: detailProductMaterialInput.value.trim(),
        colors: [...selectedColors],
        sizes: selectedSizes.map(function(item) {
            return {
                size: item.size,
                quantity: Number(item.quantity || 0)
            };
        }),
        image: selectedImage,
        status: detailProductStatusInput.value,
        description: detailProductDescriptionInput.value.trim()
    };
}

// 45. Kiểm tra trùng tên sản phẩm
function isDuplicateProductName(products, formData) {
    return products.some(function(product) {
        return product.name.toLowerCase() === formData.name.toLowerCase() &&
            product.id !== formData.id;
    });
}

// 46. Lưu sản phẩm
function saveProduct(formData) {
    const products = getProducts();

    if (isDuplicateProductName(products, formData)) {
        showProductFormMessage("Tên sản phẩm đã tồn tại.");
        return;
    }

    let updatedProducts;

    if (isEditMode) {
        updatedProducts = products.map(function(product) {
            if (product.id === formData.id) {
                return formData;
            }

            return product;
        });
    } else {
        updatedProducts = [formData].concat(products);
    }

    saveProducts(updatedProducts);

    alert("Lưu sản phẩm thành công.");
    window.location.href = "../html/admin-products.html";
}

// 47. Xử lý submit form sản phẩm
function handleProductFormSubmit(event) {
    event.preventDefault();

    clearProductFormMessage();

    if (!validateProductForm()) return;

    const formData = getProductFormData();

    saveProduct(formData);
}

// 48. Gắn sự kiện form động
function bindDynamicFormEvents() {
    if (addProductColorBtn) {
        addProductColorBtn.addEventListener("click", addProductColor);
    }

    if (detailProductColorInput) {
        detailProductColorInput.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                addProductColor();
            }
        });
    }

    if (detailProductColorList) {
        detailProductColorList.addEventListener("click", function(event) {
            const removeButton = event.target.closest("[data-action='remove-color']");

            if (!removeButton) return;

            removeProductColor(removeButton.dataset.color);
        });
    }

    if (addProductSizeBtn) {
        addProductSizeBtn.addEventListener("click", addProductSize);
    }

    if (detailProductSizeInput) {
        detailProductSizeInput.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                addProductSize();
            }
        });
    }

    if (detailProductSizeQuantityInput) {
        detailProductSizeQuantityInput.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                addProductSize();
            }
        });
    }

    if (detailProductSizeTableBody) {
        detailProductSizeTableBody.addEventListener("click", function(event) {
            const removeButton = event.target.closest("[data-action='remove-size']");

            if (!removeButton) return;

            removeProductSize(Number(removeButton.dataset.index));
        });

        detailProductSizeTableBody.addEventListener("input", function(event) {
            const quantityInput = event.target.closest(".sizeQuantityInput");

            if (!quantityInput) return;

            updateProductSizeQuantity(Number(quantityInput.dataset.index), quantityInput.value);
        });
    }

    if (detailProductImageFile) {
        detailProductImageFile.addEventListener("change", handleProductImageUpload);
    }
}

// 49. Gắn sự kiện cập nhật summary
function bindSummaryEvents() {
    const summaryInputs = [
        detailProductNameInput,
        detailProductGroupInput,
        detailProductCategoryInput,
        detailProductStatusInput,
        detailProductPriceInput,
        detailProductMaterialInput
    ];

    summaryInputs.forEach(function(input) {
        if (!input) return;

        input.addEventListener("input", function() {
            if (input === detailProductNameInput) {
                renderProductImagePreview(detailProductNameInput.value.trim());

                if (!isEditMode && detailPageProductName) {
                    detailPageProductName.textContent = detailProductNameInput.value.trim() || "Thông tin sản phẩm mới";
                }
            }

            if (input === detailProductStatusInput) {
                renderProductStatusBadge(detailProductStatusInput.value);
            }

            renderProductSummary();
        });

        input.addEventListener("change", function() {
            if (input === detailProductStatusInput) {
                renderProductStatusBadge(detailProductStatusInput.value);
            }

            renderProductSummary();
        });
    });
}

// 50. Gắn sự kiện trang chi tiết sản phẩm
function bindProductDetailEvents() {
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", handleAdminLogout);
    }

    if (saveProductHeaderBtn) {
        saveProductHeaderBtn.addEventListener("click", function() {
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

// 51. Khởi tạo trang chi tiết sản phẩm
function initAdminProductDetailPage() {
    currentAdminUser = checkAdminLogin();

    if (!currentAdminUser) return;

    currentProductId = getProductIdFromUrl();
    isEditMode = Boolean(currentProductId);

    renderAdminInfo(currentAdminUser);
    renderCurrentDate();
    renderPageTitle();

    if (isEditMode) {
        currentProductData = getProductById(currentProductId);

        if (!currentProductData) {
            showProductNotFound();
            return;
        }

        showProductForm();
        fillProductForm(currentProductData);
    } else {
        showProductForm();
        setDefaultProductForm();
    }

    bindProductDetailEvents();
}

initAdminProductDetailPage();