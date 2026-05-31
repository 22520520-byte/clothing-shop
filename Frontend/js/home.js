// 1. Lấy dữ liệu sản phẩm

const products = [
    {
        id: "hd001",
        category: "hoodie",
        name: "Áo Hoodie Basic Cotton",
        brand: "DUHU Shop",
        meta: "Form rộng · Màu đen",
        shortDesc: "Áo hoodie basic dễ phối đồ, chất vải mềm, giữ form tốt.",
        material: "Chất liệu cotton pha nỉ nhẹ, mềm tay, thoáng và giữ ấm vừa phải.",
        description: "Thiết kế tối giản, hiện đại, phù hợp đi học, đi chơi và mặc hằng ngày.",
        price: 329000,
        oldPrice: 399000,
        image: "../img/hoodie-1.jpg",
        images: [
            "../img/hoodie-1.jpg",
            "../img/hoodie-1.jpg",
            "../img/hoodie-1.jpg"
        ],
        isNew: true,
        isSale: true,
        inStock: true,
        colors: [
            { name: "Đen", value: "#111111" },
            { name: "Xám", value: "#888888" }
        ],
        sizes: ["M", "L", "XL"]
    },
    {
        id: "hd002",
        category: "hoodie",
        name: "Áo Hoodie Urban Style",
        brand: "DUHU Shop",
        meta: "Form vừa · Màu xám",
        shortDesc: "Mẫu hoodie trẻ trung, dễ mặc, tông màu trung tính.",
        material: "Cotton pha polyester giúp áo đứng form và bền hơn.",
        description: "Thiết kế hướng streetwear hiện đại, form vừa, dễ phối đồ.",
        price: 289000,
        oldPrice: 0,
        image: "../img/hoodie-2.jpg",
        images: [
            "../img/hoodie-2.jpg",
            "../img/hoodie-2.jpg"
        ],
        isNew: true,
        isSale: false,
        inStock: true,
        colors: [
            { name: "Xám", value: "#888888" }
        ],
        sizes: ["S", "M", "L"]
    },
    {
        id: "at001",
        category: "ao-thun",
        name: "Áo Thun Basic Oversize",
        brand: "DUHU Shop",
        meta: "Form rộng · Cotton",
        shortDesc: "Áo thun basic form rộng, dễ phối đồ hằng ngày.",
        material: "Cotton mềm, thấm hút tốt, phù hợp mặc thường xuyên.",
        description: "Thiết kế basic, form oversize thoải mái, phù hợp nhiều phong cách.",
        price: 159000,
        oldPrice: 199000,
        image: "../img/ao-thun-1.jpg",
        images: [
            "../img/ao-thun-1.jpg",
            "../img/ao-thun-1.jpg"
        ],
        isNew: true,
        isSale: true,
        inStock: true,
        colors: [
            { name: "Trắng", value: "#ffffff" },
            { name: "Đen", value: "#111111" }
        ],
        sizes: ["S", "M", "L", "XL"]
    },
    {
        id: "ap001",
        category: "ao-polo",
        name: "Áo Polo Daily Wear",
        brand: "DUHU Shop",
        meta: "Form vừa · Màu xanh navy",
        shortDesc: "Áo polo dễ mặc, lịch sự và phù hợp nhiều dịp.",
        material: "Vải cá sấu co giãn nhẹ, thoáng và giữ form tốt.",
        description: "Mẫu polo basic phù hợp đi học, đi làm hoặc đi chơi.",
        price: 219000,
        oldPrice: 269000,
        image: "../img/ao-polo-1.jpg",
        images: [
            "../img/ao-polo-1.jpg",
            "../img/ao-polo-1.jpg"
        ],
        isNew: false,
        isSale: true,
        inStock: true,
        colors: [
            { name: "Navy", value: "#243b6b" }
        ],
        sizes: ["M", "L", "XL"]
    },
    {
        id: "qd001",
        category: "quan-dai",
        name: "Quần Dài Kaki Basic",
        brand: "DUHU Shop",
        meta: "Form straight · Màu be",
        shortDesc: "Quần kaki basic, dễ phối với áo thun, polo hoặc hoodie.",
        material: "Chất kaki mềm, đứng form, ít nhăn.",
        description: "Thiết kế dáng straight đơn giản, phù hợp mặc hằng ngày.",
        price: 299000,
        oldPrice: 359000,
        image: "../img/quan-dai-1.jpg",
        images: [
            "../img/quan-dai-1.jpg",
            "../img/quan-dai-1.jpg"
        ],
        isNew: true,
        isSale: true,
        inStock: true,
        colors: [
            { name: "Be", value: "#d8c3a5" },
            { name: "Đen", value: "#111111" }
        ],
        sizes: ["M", "L", "XL"]
    },
    {
        id: "pk001",
        category: "mu",
        name: "Mũ Lưỡi Trai Basic",
        brand: "DUHU Shop",
        meta: "Freesize · Màu đen",
        shortDesc: "Mũ lưỡi trai basic, dễ phối với nhiều outfit.",
        material: "Vải kaki cotton, thoáng và giữ form tốt.",
        description: "Phụ kiện đơn giản, phù hợp sử dụng hằng ngày.",
        price: 99000,
        oldPrice: 0,
        image: "../img/mu-1.jpg",
        images: [
            "../img/mu-1.jpg"
        ],
        isNew: true,
        isSale: false,
        inStock: true,
        colors: [
            { name: "Đen", value: "#111111" }
        ],
        sizes: ["Freesize"]
    }
];

// 2. Khai báo key localStorage

const CART_STORAGE_KEY = "cart_items";
const CHECKOUT_STORAGE_KEY = "checkout_items";

// 3. Khai báo biến dữ liệu

let quickViewProduct = null;
let quickViewImageIndex = 0;
let quickViewSelectedColor = "";
let quickViewSelectedSize = "";
let quickViewQuantity = 1;
let currentSlideIndex = 0;

// 4. Khai báo biến DOM

let homePage;

let newProductList;
let saleProductList;

let newProductLoadingState;
let newProductEmptyState;
let newProductErrorState;

let saleProductLoadingState;
let saleProductEmptyState;
let saleProductErrorState;

let homeProductTemplate;

let slides;
let bannerPrevBtn;
let bannerNextBtn;

let searchForm;
let searchKeyword;

let quickViewOverlay;
let quickViewPopup;
let quickViewCloseBtn;
let quickViewThumbs;
let quickViewThumbTemplate;
let quickViewImage;
let quickViewPrevImageBtn;
let quickViewNextImageBtn;
let quickViewBrand;
let quickViewProductName;
let quickViewProductStatus;
let quickViewCurrentPrice;
let quickViewOldPrice;
let quickViewDiscount;
let quickViewSelectedColorText;
let quickViewColorList;
let quickViewColorTemplate;
let quickViewSizeList;
let quickViewSizeTemplate;
let quickViewMinusQty;
let quickViewPlusQty;
let quickViewQuantityInput;
let quickViewBuyBtn;
let quickViewMaterial;
let quickViewDescription;
let quickViewDetailLink;

let cartDrawerOverlay;
let cartDrawer;
let cartDrawerCloseBtn;
let cartDrawerCount;
let cartDrawerEmptyState;
let cartDrawerList;
let cartDrawerSubtotal;
let cartDrawerCheckoutBtn;
let cartDrawerItemTemplate;

// 5. Lấy phần tử DOM

function getElements() {
    homePage = document.querySelector('[data-page="home"]');

    newProductList = document.getElementById("newProductList");
    saleProductList = document.getElementById("saleProductList");

    newProductLoadingState = document.getElementById("newProductLoadingState");
    newProductEmptyState = document.getElementById("newProductEmptyState");
    newProductErrorState = document.getElementById("newProductErrorState");

    saleProductLoadingState = document.getElementById("saleProductLoadingState");
    saleProductEmptyState = document.getElementById("saleProductEmptyState");
    saleProductErrorState = document.getElementById("saleProductErrorState");

    homeProductTemplate = document.getElementById("homeProductTemplate");

    slides = document.querySelectorAll(".slide");
    bannerPrevBtn = document.getElementById("bannerPrevBtn");
    bannerNextBtn = document.getElementById("bannerNextBtn");

    searchForm = document.getElementById("searchForm");
    searchKeyword = document.getElementById("searchKeyword");

    quickViewOverlay = document.getElementById("quickViewOverlay");
    quickViewPopup = document.getElementById("quickViewPopup");
    quickViewCloseBtn = document.getElementById("quickViewCloseBtn");

    quickViewThumbs = document.getElementById("quickViewThumbs");
    quickViewThumbTemplate = document.getElementById("quickViewThumbTemplate");

    quickViewImage = document.getElementById("quickViewImage");
    quickViewPrevImageBtn = document.getElementById("quickViewPrevImageBtn");
    quickViewNextImageBtn = document.getElementById("quickViewNextImageBtn");

    quickViewBrand = document.getElementById("quickViewBrand");
    quickViewProductName = document.getElementById("quickViewProductName");
    quickViewProductStatus = document.getElementById("quickViewProductStatus");
    quickViewCurrentPrice = document.getElementById("quickViewCurrentPrice");
    quickViewOldPrice = document.getElementById("quickViewOldPrice");
    quickViewDiscount = document.getElementById("quickViewDiscount");

    quickViewSelectedColorText = document.getElementById("quickViewSelectedColor");
    quickViewColorList = document.getElementById("quickViewColorList");
    quickViewColorTemplate = document.getElementById("quickViewColorTemplate");

    quickViewSizeList = document.getElementById("quickViewSizeList");
    quickViewSizeTemplate = document.getElementById("quickViewSizeTemplate");

    quickViewMinusQty = document.getElementById("quickViewMinusQty");
    quickViewPlusQty = document.getElementById("quickViewPlusQty");
    quickViewQuantityInput = document.getElementById("quickViewQuantityInput");

    quickViewBuyBtn = document.getElementById("quickViewBuyBtn");
    quickViewMaterial = document.getElementById("quickViewMaterial");
    quickViewDescription = document.getElementById("quickViewDescription");
    quickViewDetailLink = document.getElementById("quickViewDetailLink");

    cartDrawerOverlay = document.getElementById("cartDrawerOverlay");
    cartDrawer = document.getElementById("cartDrawer");
    cartDrawerCloseBtn = document.getElementById("cartDrawerCloseBtn");

    cartDrawerCount = document.getElementById("cartDrawerCount");
    cartDrawerEmptyState = document.getElementById("cartDrawerEmptyState");
    cartDrawerList = document.getElementById("cartDrawerList");
    cartDrawerSubtotal = document.getElementById("cartDrawerSubtotal");
    cartDrawerCheckoutBtn = document.getElementById("cartDrawerCheckoutBtn");
    cartDrawerItemTemplate = document.getElementById("cartDrawerItemTemplate");
}

// 6. Hàm tiện ích

function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
}

function calculateDiscountPercent(price, oldPrice) {
    if (!oldPrice || oldPrice <= price) {
        return 0;
    }

    return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function getProductById(productId) {
    return products.find(function (product) {
        return product.id === productId;
    });
}

function getNewProducts() {
    return products.filter(function (product) {
        return product.isNew === true;
    });
}

function getSaleProducts() {
    return products.filter(function (product) {
        return product.isSale === true && product.oldPrice > product.price;
    });
}

function getProductImages(product) {
    if (Array.isArray(product.images) && product.images.length > 0) {
        return product.images;
    }

    return [product.image];
}

function getProductDetailUrl(productId) {
    return "../html/product-detail.html?id=" + encodeURIComponent(productId);
}

function createCartItemId(productId, size, color) {
    return productId + "_" + size + "_" + color;
}

function calculateCartSubtotal(cartItems) {
    return cartItems.reduce(function (total, item) {
        return total + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
}

function calculateCartQuantity(cartItems) {
    return cartItems.reduce(function (total, item) {
        return total + Number(item.quantity || 0);
    }, 0);
}

function normalizeQuantity(value) {
    const numberValue = Number(value || 1);

    if (Number.isNaN(numberValue) || numberValue < 1) {
        return 1;
    }

    return Math.floor(numberValue);
}

// 7. LocalStorage

function getDataFromStorage(key, fallbackValue) {
    const data = localStorage.getItem(key);

    if (!data) {
        return fallbackValue;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        console.error("Lỗi đọc localStorage:", error);
        return fallbackValue;
    }
}

function saveDataToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getCartItemsFromStorage() {
    const data = getDataFromStorage(CART_STORAGE_KEY, []);

    if (!Array.isArray(data)) {
        return [];
    }

    return data;
}

function saveCartItemsToStorage(cartItems) {
    saveDataToStorage(CART_STORAGE_KEY, cartItems);
}

function saveCheckoutItemsToStorage(checkoutItems) {
    saveDataToStorage(CHECKOUT_STORAGE_KEY, checkoutItems);
}

// 8. Xử lý trạng thái sản phẩm trang chủ

function hideNewProductStates() {
    if (newProductLoadingState) newProductLoadingState.hidden = true;
    if (newProductEmptyState) newProductEmptyState.hidden = true;
    if (newProductErrorState) newProductErrorState.hidden = true;
    if (newProductList) newProductList.hidden = true;
}

function hideSaleProductStates() {
    if (saleProductLoadingState) saleProductLoadingState.hidden = true;
    if (saleProductEmptyState) saleProductEmptyState.hidden = true;
    if (saleProductErrorState) saleProductErrorState.hidden = true;
    if (saleProductList) saleProductList.hidden = true;
}

function showNewProductContent() {
    hideNewProductStates();

    if (newProductList) {
        newProductList.hidden = false;
    }
}

function showSaleProductContent() {
    hideSaleProductStates();

    if (saleProductList) {
        saleProductList.hidden = false;
    }
}

function showNewProductEmpty() {
    hideNewProductStates();

    if (newProductEmptyState) {
        newProductEmptyState.hidden = false;
    }
}

function showSaleProductEmpty() {
    hideSaleProductStates();

    if (saleProductEmptyState) {
        saleProductEmptyState.hidden = false;
    }
}

// 9. Render sản phẩm trang chủ

function createProductItem(product) {
    if (!homeProductTemplate) {
        return null;
    }

    const clone = homeProductTemplate.content.cloneNode(true);

    const blockItem = clone.querySelector(".blockItem");
    const productLinks = clone.querySelectorAll('[data-role="product-link"]');
    const productImage = clone.querySelector('[data-role="product-image"]');
    const productName = clone.querySelector('[data-role="product-name"]');
    const salePrice = clone.querySelector('[data-role="sale-price"]');
    const oldPriceWrap = clone.querySelector('[data-role="old-price-wrap"]');
    const oldPrice = clone.querySelector('[data-role="old-price"]');
    const discountWrap = clone.querySelector('[data-role="discount-wrap"]');
    const discountPercent = clone.querySelector('[data-role="discount-percent"]');
    const quickBuyBtn = clone.querySelector('[data-action="quick-buy"]');
    const viewDetailBtn = clone.querySelector('[data-action="view-detail"]');

    const detailUrl = getProductDetailUrl(product.id);
    const discount = calculateDiscountPercent(product.price, product.oldPrice);

    if (blockItem) {
        blockItem.dataset.productId = product.id;
    }

    if (productImage) {
        productImage.src = product.image;
        productImage.alt = product.name;
    }

    if (productName) {
        productName.textContent = product.name;
    }

    if (salePrice) {
        salePrice.textContent = formatPrice(product.price);
    }

    productLinks.forEach(function (link) {
        link.href = detailUrl;
    });

    if (quickBuyBtn) {
        quickBuyBtn.href = "#";
        quickBuyBtn.dataset.productId = product.id;
    }

    if (viewDetailBtn) {
        viewDetailBtn.href = detailUrl;
        viewDetailBtn.dataset.productId = product.id;
    }

    if (discount > 0) {
        if (oldPrice) {
            oldPrice.textContent = formatPrice(product.oldPrice);
        }

        if (oldPriceWrap) {
            oldPriceWrap.hidden = false;
        }

        if (discountPercent) {
            discountPercent.textContent = discount;
        }

        if (discountWrap) {
            discountWrap.hidden = false;
        }
    } else {
        if (oldPrice) {
            oldPrice.textContent = "";
        }

        if (oldPriceWrap) {
            oldPriceWrap.hidden = true;
        }

        if (discountWrap) {
            discountWrap.hidden = true;
        }
    }

    return clone;
}

function renderProductList(productListElement, productArray) {
    if (!productListElement) {
        return;
    }

    productListElement.innerHTML = "";

    const fragment = document.createDocumentFragment();

    productArray.forEach(function (product) {
        const productItem = createProductItem(product);

        if (productItem) {
            fragment.appendChild(productItem);
        }
    });

    productListElement.appendChild(fragment);
}

function renderNewProducts() {
    const newProducts = getNewProducts();

    if (!newProductList) {
        return;
    }

    if (newProducts.length === 0) {
        showNewProductEmpty();
        return;
    }

    renderProductList(newProductList, newProducts);
    showNewProductContent();
}

function renderSaleProducts() {
    const saleProducts = getSaleProducts();

    if (!saleProductList) {
        return;
    }

    if (saleProducts.length === 0) {
        showSaleProductEmpty();
        return;
    }

    renderProductList(saleProductList, saleProducts);
    showSaleProductContent();
}

function renderHomeProducts() {
    renderNewProducts();
    renderSaleProducts();
}

// 10. Render quick view

function renderQuickViewThumbs(product) {
    if (!quickViewThumbs || !quickViewThumbTemplate) {
        return;
    }

    const images = getProductImages(product);

    quickViewThumbs.innerHTML = "";

    const fragment = document.createDocumentFragment();

    images.forEach(function (imageUrl, index) {
        const clone = quickViewThumbTemplate.content.cloneNode(true);
        const button = clone.querySelector(".quickViewThumb");
        const image = clone.querySelector("img");

        if (button) {
            button.dataset.imageIndex = String(index);

            if (index === quickViewImageIndex) {
                button.classList.add("active");
            }
        }

        if (image) {
            image.src = imageUrl;
            image.alt = product.name + " " + (index + 1);
        }

        fragment.appendChild(clone);
    });

    quickViewThumbs.appendChild(fragment);
}

function renderQuickViewMainImage(product) {
    if (!quickViewImage) {
        return;
    }

    const images = getProductImages(product);
    const imageUrl = images[quickViewImageIndex];

    quickViewImage.src = imageUrl;
    quickViewImage.alt = product.name;
}

function renderQuickViewColors(product) {
    if (!quickViewColorList || !quickViewColorTemplate) {
        return;
    }

    const colors = product.colors && product.colors.length > 0
        ? product.colors
        : [{ name: "Mặc định", value: "#111111" }];

    quickViewSelectedColor = colors[0].name;
    quickViewColorList.innerHTML = "";

    const fragment = document.createDocumentFragment();

    colors.forEach(function (color, index) {
        const clone = quickViewColorTemplate.content.cloneNode(true);
        const button = clone.querySelector(".quickViewColorItem");

        if (!button) {
            return;
        }

        button.dataset.colorName = color.name;
        button.dataset.colorValue = color.value;
        button.title = color.name;
        button.setAttribute("aria-label", color.name);
        button.style.background = color.value;

        if (index === 0) {
            button.classList.add("active");
        }

        fragment.appendChild(button);
    });

    quickViewColorList.appendChild(fragment);

    if (quickViewSelectedColorText) {
        quickViewSelectedColorText.textContent = quickViewSelectedColor;
    }
}

function renderQuickViewSizes(product) {
    if (!quickViewSizeList || !quickViewSizeTemplate) {
        return;
    }

    const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ["M"];

    quickViewSelectedSize = sizes[0];
    quickViewSizeList.innerHTML = "";

    const fragment = document.createDocumentFragment();

    sizes.forEach(function (size, index) {
        const clone = quickViewSizeTemplate.content.cloneNode(true);
        const button = clone.querySelector(".quickViewSizeItem");

        if (!button) {
            return;
        }

        button.dataset.size = size;
        button.textContent = size;

        if (index === 0) {
            button.classList.add("active");
        }

        fragment.appendChild(button);
    });

    quickViewSizeList.appendChild(fragment);
}

function renderQuickViewInfo(product) {
    const discount = calculateDiscountPercent(product.price, product.oldPrice);

    if (quickViewBrand) {
        quickViewBrand.textContent = product.brand || "DUHU Shop";
    }

    if (quickViewProductName) {
        quickViewProductName.textContent = product.name;
    }

    if (quickViewProductStatus) {
        quickViewProductStatus.textContent = product.inStock ? "Còn hàng" : "Hết hàng";
    }

    if (quickViewCurrentPrice) {
        quickViewCurrentPrice.textContent = formatPrice(product.price);
    }

    if (quickViewOldPrice) {
        if (product.oldPrice && product.oldPrice > product.price) {
            quickViewOldPrice.textContent = formatPrice(product.oldPrice);
            quickViewOldPrice.hidden = false;
        } else {
            quickViewOldPrice.textContent = "";
            quickViewOldPrice.hidden = true;
        }
    }

    if (quickViewDiscount) {
        if (discount > 0) {
            quickViewDiscount.textContent = "Giảm " + discount + "%";
            quickViewDiscount.hidden = false;
        } else {
            quickViewDiscount.textContent = "";
            quickViewDiscount.hidden = true;
        }
    }

    if (quickViewMaterial) {
        quickViewMaterial.textContent = product.material || "Chưa có thông tin chất liệu.";
        quickViewMaterial.hidden = true;
    }

    if (quickViewDescription) {
        quickViewDescription.textContent = product.description || "Chưa có mô tả sản phẩm.";
        quickViewDescription.hidden = true;
    }

    if (quickViewDetailLink) {
        quickViewDetailLink.href = getProductDetailUrl(product.id);
    }

    if (quickViewBuyBtn) {
        quickViewBuyBtn.disabled = !product.inStock;
    }
}

function renderQuickView(product) {
    quickViewProduct = product;
    quickViewImageIndex = 0;
    quickViewQuantity = 1;

    if (quickViewQuantityInput) {
        quickViewQuantityInput.value = String(quickViewQuantity);
    }

    renderQuickViewThumbs(product);
    renderQuickViewMainImage(product);
    renderQuickViewColors(product);
    renderQuickViewSizes(product);
    renderQuickViewInfo(product);
}

// 11. Mở đóng quick view

function openQuickView(productId) {
    const product = getProductById(productId);

    if (!product) {
        alert("Không tìm thấy sản phẩm.");
        return;
    }

    renderQuickView(product);

    if (quickViewOverlay) {
        quickViewOverlay.hidden = false;
        quickViewOverlay.classList.add("show");
    }

    if (quickViewPopup) {
        quickViewPopup.hidden = false;
        quickViewPopup.classList.add("show");
    }

    document.body.style.overflow = "hidden";
}

function closeQuickView() {
    if (quickViewOverlay) {
        quickViewOverlay.classList.remove("show");
        quickViewOverlay.hidden = true;
    }

    if (quickViewPopup) {
        quickViewPopup.classList.remove("show");
        quickViewPopup.hidden = true;
    }

    document.body.style.overflow = "";
}

// 12. Xử lý chọn trong quick view

function updateQuickViewImage(index) {
    if (!quickViewProduct) {
        return;
    }

    const images = getProductImages(quickViewProduct);

    if (index >= images.length) {
        quickViewImageIndex = 0;
    } else if (index < 0) {
        quickViewImageIndex = images.length - 1;
    } else {
        quickViewImageIndex = index;
    }

    renderQuickViewThumbs(quickViewProduct);
    renderQuickViewMainImage(quickViewProduct);
}

function selectQuickViewColor(button) {
    quickViewSelectedColor = button.dataset.colorName || "";

    quickViewColorList?.querySelectorAll(".quickViewColorItem").forEach(function (item) {
        item.classList.remove("active");
    });

    button.classList.add("active");

    if (quickViewSelectedColorText) {
        quickViewSelectedColorText.textContent = quickViewSelectedColor;
    }
}

function selectQuickViewSize(button) {
    quickViewSelectedSize = button.dataset.size || "";

    quickViewSizeList?.querySelectorAll(".quickViewSizeItem").forEach(function (item) {
        item.classList.remove("active");
    });

    button.classList.add("active");
}

function renderQuickViewQuantityInput() {
    if (quickViewQuantityInput) {
        quickViewQuantityInput.value = String(quickViewQuantity);
    }
}

function decreaseQuickViewQuantity() {
    if (quickViewQuantity <= 1) {
        return;
    }

    quickViewQuantity -= 1;
    renderQuickViewQuantityInput();
}

function increaseQuickViewQuantity() {
    quickViewQuantity += 1;
    renderQuickViewQuantityInput();
}

function updateQuickViewQuantityFromInput() {
    quickViewQuantity = normalizeQuantity(quickViewQuantityInput?.value || 1);
    renderQuickViewQuantityInput();
}

function toggleQuickViewContent(action) {
    let targetContent = null;

    if (action === "toggle-material") {
        targetContent = quickViewMaterial;
    }

    if (action === "toggle-description") {
        targetContent = quickViewDescription;
    }

    if (!targetContent) {
        return;
    }

    targetContent.hidden = !targetContent.hidden;
}

// 13. Tạo item giỏ hàng

function createCartItemFromQuickView() {
    return {
        cartItemId: createCartItemId(
            quickViewProduct.id,
            quickViewSelectedSize,
            quickViewSelectedColor
        ),
        id: quickViewProduct.id,
        name: quickViewProduct.name,
        price: Number(quickViewProduct.price || 0),
        oldPrice: Number(quickViewProduct.oldPrice || 0),
        image: quickViewProduct.image,
        meta: "Màu: " + quickViewSelectedColor + " / Size: " + quickViewSelectedSize,
        color: quickViewSelectedColor,
        size: quickViewSelectedSize,
        quantity: normalizeQuantity(quickViewQuantity),
        selected: true
    };
}

function addQuickViewProductToCart() {
    if (!quickViewProduct) {
        return false;
    }

    if (!quickViewProduct.inStock) {
        alert("Sản phẩm hiện đã hết hàng.");
        return false;
    }

    const cartItems = getCartItemsFromStorage();
    const newItem = createCartItemFromQuickView();

    const existingItem = cartItems.find(function (item) {
        return item.cartItemId === newItem.cartItemId;
    });

    if (existingItem) {
        existingItem.quantity =
            normalizeQuantity(existingItem.quantity) +
            normalizeQuantity(newItem.quantity);
        existingItem.selected = true;
    } else {
        cartItems.push(newItem);
    }

    saveCartItemsToStorage(cartItems);

    return true;
}

// 14. Render cart drawer

function createCartDrawerItemElement(item) {
    if (!cartDrawerItemTemplate) {
        return null;
    }

    const clone = cartDrawerItemTemplate.content.cloneNode(true);

    const drawerItem = clone.querySelector(".cartDrawerItem");
    const productLink = clone.querySelector('[data-role="drawer-product-link"]');
    const productImage = clone.querySelector('[data-role="drawer-product-image"]');
    const productName = clone.querySelector('[data-role="drawer-product-name"]');
    const productVariant = clone.querySelector('[data-role="drawer-product-variant"]');
    const productPriceQuantity = clone.querySelector('[data-role="drawer-product-price-quantity"]');
    const removeButton = clone.querySelector('[data-role="drawer-remove-item-btn"]');

    const detailUrl = getProductDetailUrl(item.id);

    if (drawerItem) {
        drawerItem.dataset.cartItemId = item.cartItemId;
    }

    if (productLink) {
        productLink.href = detailUrl;
    }

    if (productImage) {
        productImage.src = item.image;
        productImage.alt = item.name;
    }

    if (productName) {
        productName.href = detailUrl;
        productName.textContent = item.name;
    }

    if (productVariant) {
        productVariant.textContent =
            "Màu: " + (item.color || "Chưa chọn") +
            " / Size: " + (item.size || "Chưa chọn");
    }

    if (productPriceQuantity) {
        productPriceQuantity.textContent =
            formatPrice(item.price) + " x " + Number(item.quantity || 0);
    }

    if (removeButton) {
        removeButton.dataset.cartItemId = item.cartItemId;
    }

    return clone;
}

function renderCartDrawer() {
    const cartItems = getCartItemsFromStorage();
    const totalQuantity = calculateCartQuantity(cartItems);
    const subtotal = calculateCartSubtotal(cartItems);

    if (cartDrawerCount) {
        cartDrawerCount.textContent = String(totalQuantity);
    }

    if (cartDrawerSubtotal) {
        cartDrawerSubtotal.textContent = formatPrice(subtotal);
    }

    if (cartDrawerCheckoutBtn) {
        cartDrawerCheckoutBtn.disabled = cartItems.length === 0;
    }

    if (!cartDrawerList || !cartDrawerItemTemplate) {
        return;
    }

    cartDrawerList.innerHTML = "";

    if (cartItems.length === 0) {
        if (cartDrawerEmptyState) {
            cartDrawerEmptyState.hidden = false;
        }

        cartDrawerList.hidden = true;
        return;
    }

    if (cartDrawerEmptyState) {
        cartDrawerEmptyState.hidden = true;
    }

    cartDrawerList.hidden = false;

    const fragment = document.createDocumentFragment();

    cartItems.forEach(function (item) {
        const cartItemElement = createCartDrawerItemElement(item);

        if (cartItemElement) {
            fragment.appendChild(cartItemElement);
        }
    });

    cartDrawerList.appendChild(fragment);
}

// 15. Mở đóng cart drawer

function openCartDrawer() {
    renderCartDrawer();

    if (cartDrawerOverlay) {
        cartDrawerOverlay.hidden = false;
        cartDrawerOverlay.classList.add("show");
    }

    if (cartDrawer) {
        cartDrawer.hidden = false;

        requestAnimationFrame(function () {
            cartDrawer.classList.add("show");
        });
    }

    document.body.style.overflow = "hidden";
}

function closeCartDrawer() {
    if (cartDrawer) {
        cartDrawer.classList.remove("show");

        setTimeout(function () {
            cartDrawer.hidden = true;
        }, 300);
    }

    if (cartDrawerOverlay) {
        cartDrawerOverlay.classList.remove("show");
        cartDrawerOverlay.hidden = true;
    }

    document.body.style.overflow = "";
}

function removeCartDrawerItem(cartItemId) {
    let cartItems = getCartItemsFromStorage();

    cartItems = cartItems.filter(function (item) {
        return item.cartItemId !== cartItemId;
    });

    saveCartItemsToStorage(cartItems);
    renderCartDrawer();
}

// 16. Xử lý sở hữu ngay và thanh toán

function handleQuickViewBuy() {
    const isAdded = addQuickViewProductToCart();

    if (!isAdded) {
        return;
    }

    closeQuickView();
    openCartDrawer();
}

function handleCartDrawerCheckout() {
    const cartItems = getCartItemsFromStorage();

    if (cartItems.length === 0) {
        alert("Giỏ hàng của bạn đang trống.");
        return;
    }

    const checkoutItems = cartItems.map(function (item) {
        return {
            ...item,
            quantity: normalizeQuantity(item.quantity),
            selected: true
        };
    });

    saveCheckoutItemsToStorage(checkoutItems);

    window.location.href = "../html/checkout.html?mode=cart";
}

// 17. Xử lý banner

function showSlide(index) {
    if (!slides || slides.length === 0) {
        return;
    }

    slides.forEach(function (slide) {
        slide.classList.remove("active");
    });

    if (index >= slides.length) {
        currentSlideIndex = 0;
    } else if (index < 0) {
        currentSlideIndex = slides.length - 1;
    } else {
        currentSlideIndex = index;
    }

    slides[currentSlideIndex].classList.add("active");
}

function showNextSlide() {
    showSlide(currentSlideIndex + 1);
}

function showPrevSlide() {
    showSlide(currentSlideIndex - 1);
}

function startBannerAutoSlide() {
    setInterval(showNextSlide, 4000);
}

// 18. Xử lý tìm kiếm

function handleSearchSubmit(event) {
    event.preventDefault();

    const keyword = searchKeyword?.value.trim() || "";

    if (!keyword) {
        alert("Vui lòng nhập từ khóa tìm kiếm.");
        return;
    }

    window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
}

// 19. Xử lý click sản phẩm

function handleProductClick(event) {
    const quickBuyBtn = event.target.closest('[data-action="quick-buy"]');

    if (!quickBuyBtn) {
        return;
    }

    event.preventDefault();

    const productId = quickBuyBtn.dataset.productId;

    if (!productId) {
        return;
    }

    openQuickView(productId);
}

// 20. Xử lý click quick view

function handleQuickViewClick(event) {
    const thumbButton = event.target.closest(".quickViewThumb");
    const colorButton = event.target.closest(".quickViewColorItem");
    const sizeButton = event.target.closest(".quickViewSizeItem");
    const toggleButton = event.target.closest(".quickViewToggleBtn");

    if (thumbButton) {
        const imageIndex = Number(thumbButton.dataset.imageIndex || 0);
        updateQuickViewImage(imageIndex);
        return;
    }

    if (colorButton) {
        selectQuickViewColor(colorButton);
        return;
    }

    if (sizeButton) {
        selectQuickViewSize(sizeButton);
        return;
    }

    if (toggleButton) {
        const action = toggleButton.dataset.action || "";
        toggleQuickViewContent(action);
    }
}

// 21. Xử lý click cart drawer

function handleCartDrawerClick(event) {
    const removeButton = event.target.closest('[data-role="drawer-remove-item-btn"]');

    if (!removeButton) {
        return;
    }

    const cartItemId = removeButton.dataset.cartItemId;

    if (!cartItemId) {
        return;
    }

    removeCartDrawerItem(cartItemId);
}

// 22. Xử lý phím ESC

function handleEscapeKey(event) {
    if (event.key !== "Escape") {
        return;
    }

    closeQuickView();
    closeCartDrawer();
}

// 23. Gắn sự kiện

function bindEvents() {
    document.addEventListener("click", handleProductClick);
    document.addEventListener("keydown", handleEscapeKey);

    bannerNextBtn?.addEventListener("click", showNextSlide);
    bannerPrevBtn?.addEventListener("click", showPrevSlide);

    searchForm?.addEventListener("submit", handleSearchSubmit);

    quickViewCloseBtn?.addEventListener("click", closeQuickView);
    quickViewOverlay?.addEventListener("click", closeQuickView);

    quickViewThumbs?.addEventListener("click", handleQuickViewClick);
    quickViewColorList?.addEventListener("click", handleQuickViewClick);
    quickViewSizeList?.addEventListener("click", handleQuickViewClick);
    quickViewPopup?.addEventListener("click", handleQuickViewClick);

    quickViewPrevImageBtn?.addEventListener("click", function () {
        updateQuickViewImage(quickViewImageIndex - 1);
    });

    quickViewNextImageBtn?.addEventListener("click", function () {
        updateQuickViewImage(quickViewImageIndex + 1);
    });

    quickViewMinusQty?.addEventListener("click", decreaseQuickViewQuantity);
    quickViewPlusQty?.addEventListener("click", increaseQuickViewQuantity);
    quickViewQuantityInput?.addEventListener("change", updateQuickViewQuantityFromInput);

    quickViewBuyBtn?.addEventListener("click", handleQuickViewBuy);

    cartDrawerCloseBtn?.addEventListener("click", closeCartDrawer);
    cartDrawerOverlay?.addEventListener("click", closeCartDrawer);
    cartDrawerList?.addEventListener("click", handleCartDrawerClick);
    cartDrawerCheckoutBtn?.addEventListener("click", handleCartDrawerCheckout);
}

// 24. Khởi tạo trang home

function initHomePage() {
    getElements();

    if (!homePage || !homeProductTemplate) {
        return;
    }

    bindEvents();
    renderHomeProducts();
    renderCartDrawer();
    showSlide(0);
    startBannerAutoSlide();
}

document.addEventListener("DOMContentLoaded", initHomePage);