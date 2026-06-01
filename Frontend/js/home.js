// =========================================================
// File: Frontend/js/home.js
// Mục đích: Trang chủ lấy sản phẩm thật từ API backend
// =========================================================


// 1. Khai báo key localStorage
const CART_STORAGE_KEY = "cart_items";
const CHECKOUT_STORAGE_KEY = "checkout_items";


// 2. Khai báo biến dữ liệu
let products = [];
let productDetailCache = {};

let quickViewProduct = null;
let quickViewImageIndex = 0;
let quickViewSelectedColor = "";
let quickViewSelectedColorId = "";
let quickViewSelectedSize = "";
let quickViewSelectedSizeId = "";
let quickViewQuantity = 1;

let currentSlideIndex = 0;


// 3. Khai báo biến DOM
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


// 4. Lấy phần tử DOM
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


// 5. Gọi API
async function getApi(endpoint) {
    if (window.CustomerApi && typeof window.CustomerApi.get === "function") {
        return await window.CustomerApi.get(endpoint);
    }

    const response = await fetch("../../BackEnd/php/api/" + endpoint, {
        method: "GET",
        credentials: "same-origin"
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
        throw data;
    }

    return data;
}


// 6. Hàm tiện ích
function formatPrice(price) {
    if (window.CustomerApi && typeof window.CustomerApi.formatPrice === "function") {
        return window.CustomerApi.formatPrice(price);
    }

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
        return String(product.id) === String(productId);
    });
}

function getProductImages(product) {
    if (Array.isArray(product.images) && product.images.length > 0) {
        return product.images;
    }

    if (product.image) {
        return [product.image];
    }

    return ["../img/products/default.jpg"];
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


// 8. Chuẩn hóa sản phẩm từ API danh sách
function normalizeProductFromApi(product) {
    const image = product.main_image || product.image_url || product.image || "../img/products/default.jpg";
    const price = Number(product.base_price || product.price || 0);
    const oldPrice = product.old_price !== null && product.old_price !== undefined
        ? Number(product.old_price || 0)
        : 0;

    return {
        id: String(product.id),
        category: product.category_slug || product.category_name || "",
        name: product.name || "Sản phẩm",
        brand: product.brand || "DUHU Shop",

        meta: product.category_name || "",
        shortDesc: product.short_description || "",
        material: product.material || "Chưa có thông tin chất liệu.",
        description: product.short_description || product.description || "Chưa có mô tả sản phẩm.",

        price: price,
        oldPrice: oldPrice,

        image: image,
        images: [image],

        isNew: Number(product.is_new || 0) === 1,
        isSale: Number(product.is_sale || 0) === 1 || oldPrice > price,

        inStock: Number(product.total_stock || 0) > 0,
        totalStock: Number(product.total_stock || 0),

        colors: [],
        sizes: [],
        variants: [],

        raw: product
    };
}


// 9. Chuẩn hóa chi tiết sản phẩm từ API
function normalizeProductDetailFromApi(product) {
    const imageList = Array.isArray(product.images)
        ? product.images.map(function (image) {
            return image.image_url;
        }).filter(Boolean)
        : [];

    const mainImage = imageList.length > 0
        ? imageList[0]
        : "../img/products/default.jpg";

    const price = Number(product.base_price || product.price || 0);
    const oldPrice = product.old_price !== null && product.old_price !== undefined
        ? Number(product.old_price || 0)
        : 0;

    const colors = Array.isArray(product.colors)
        ? product.colors.map(function (color) {
            return {
                id: color.id,
                name: color.name,
                code: color.code,
                value: color.hex_code || "#111111"
            };
        })
        : [];

    const sizes = Array.isArray(product.sizes)
        ? product.sizes.map(function (size) {
            return {
                id: size.id,
                name: size.name,
                code: size.code
            };
        })
        : [];

    const variants = Array.isArray(product.variants)
        ? product.variants.map(function (variant) {
            return {
                id: variant.id,
                colorId: variant.color ? variant.color.id : variant.color_id,
                colorName: variant.color ? variant.color.name : "",
                sizeId: variant.size ? variant.size.id : variant.size_id,
                sizeName: variant.size ? variant.size.name : "",
                sku: variant.sku,
                price: variant.price !== null && variant.price !== undefined
                    ? Number(variant.price)
                    : price,
                oldPrice: variant.old_price !== null && variant.old_price !== undefined
                    ? Number(variant.old_price)
                    : oldPrice,
                stockQuantity: Number(variant.stock_quantity || 0),
                status: variant.status || "active"
            };
        })
        : [];

    return {
        id: String(product.id),
        category: product.category ? product.category.slug : "",
        name: product.name || "Sản phẩm",
        brand: product.brand || "DUHU Shop",

        meta: product.category ? product.category.name : "",
        shortDesc: product.short_description || "",
        material: product.material || "Chưa có thông tin chất liệu.",
        description: product.description || product.short_description || "Chưa có mô tả sản phẩm.",

        price: price,
        oldPrice: oldPrice,

        image: mainImage,
        images: imageList.length > 0 ? imageList : [mainImage],

        isNew: Number(product.is_new || 0) === 1,
        isSale: Number(product.is_sale || 0) === 1 || oldPrice > price,

        inStock: Number(product.total_stock || 0) > 0,
        totalStock: Number(product.total_stock || 0),

        colors: colors,
        sizes: sizes,
        variants: variants,

        raw: product
    };
}


// 10. Gộp sản phẩm không trùng
function mergeProductLists(listA, listB) {
    const map = {};

    [...listA, ...listB].forEach(function (product) {
        map[String(product.id)] = product;
    });

    return Object.values(map);
}


// 11. Trạng thái sản phẩm trang chủ
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

function showNewProductLoading() {
    hideNewProductStates();

    if (newProductLoadingState) {
        newProductLoadingState.hidden = false;
    }
}

function showSaleProductLoading() {
    hideSaleProductStates();

    if (saleProductLoadingState) {
        saleProductLoadingState.hidden = false;
    }
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

function showNewProductError() {
    hideNewProductStates();

    if (newProductErrorState) {
        newProductErrorState.hidden = false;
    }
}

function showSaleProductError() {
    hideSaleProductStates();

    if (saleProductErrorState) {
        saleProductErrorState.hidden = false;
    }
}


// 12. Render sản phẩm trang chủ
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

function renderHomeProducts(newProducts, saleProducts) {
    if (!newProductList || !saleProductList) {
        return;
    }

    if (newProducts.length === 0) {
        showNewProductEmpty();
    } else {
        renderProductList(newProductList, newProducts);
        showNewProductContent();
    }

    if (saleProducts.length === 0) {
        showSaleProductEmpty();
    } else {
        renderProductList(saleProductList, saleProducts);
        showSaleProductContent();
    }
}


// 13. Load sản phẩm trang chủ từ API
async function loadHomeProductsFromApi() {
    showNewProductLoading();
    showSaleProductLoading();

    try {
        const newResponse = await getApi("products/get-products.php?page=1&limit=12&is_new=1&sort=latest");
        const saleResponse = await getApi("products/get-products.php?page=1&limit=12&is_sale=1&sort=latest");

        const newData = newResponse.data || {};
        const saleData = saleResponse.data || {};

        const newProducts = Array.isArray(newData.products)
            ? newData.products.map(normalizeProductFromApi)
            : [];

        const saleProducts = Array.isArray(saleData.products)
            ? saleData.products.map(normalizeProductFromApi)
            : [];

        products = mergeProductLists(newProducts, saleProducts);

        renderHomeProducts(newProducts, saleProducts);
    } catch (error) {
        console.error(error);
        showNewProductError();
        showSaleProductError();
    }
}


// 14. Load chi tiết sản phẩm cho quick view
async function getProductDetailForQuickView(productId) {
    const productKey = String(productId);

    if (productDetailCache[productKey]) {
        return productDetailCache[productKey];
    }

    try {
        const response = await getApi(
            "products/get-product-detail.php?id=" + encodeURIComponent(productId)
        );

        const product = response.data && response.data.product
            ? normalizeProductDetailFromApi(response.data.product)
            : null;

        if (!product) {
            return getProductById(productId);
        }

        productDetailCache[productKey] = product;

        const oldProductIndex = products.findIndex(function (item) {
            return String(item.id) === String(product.id);
        });

        if (oldProductIndex >= 0) {
            products[oldProductIndex] = product;
        } else {
            products.push(product);
        }

        return product;
    } catch (error) {
        console.error(error);
        return getProductById(productId);
    }
}


// 15. Render quick view
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
        : [
            {
                id: "",
                name: "Mặc định",
                value: "#111111"
            }
        ];

    quickViewSelectedColor = colors[0].name;
    quickViewSelectedColorId = colors[0].id || "";

    quickViewColorList.innerHTML = "";

    const fragment = document.createDocumentFragment();

    colors.forEach(function (color, index) {
        const clone = quickViewColorTemplate.content.cloneNode(true);
        const button = clone.querySelector(".quickViewColorItem");

        if (!button) {
            return;
        }

        button.dataset.colorId = color.id || "";
        button.dataset.colorName = color.name;
        button.dataset.colorValue = color.value || "#111111";
        button.title = color.name;
        button.setAttribute("aria-label", color.name);
        button.style.background = color.value || "#111111";

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

    const sizes = product.sizes && product.sizes.length > 0
        ? product.sizes
        : [
            {
                id: "",
                name: "M",
                code: "M"
            }
        ];

    quickViewSelectedSize = sizes[0].name;
    quickViewSelectedSizeId = sizes[0].id || "";

    quickViewSizeList.innerHTML = "";

    const fragment = document.createDocumentFragment();

    sizes.forEach(function (size, index) {
        const clone = quickViewSizeTemplate.content.cloneNode(true);
        const button = clone.querySelector(".quickViewSizeItem");

        if (!button) {
            return;
        }

        button.dataset.sizeId = size.id || "";
        button.dataset.size = size.name;
        button.textContent = size.name;

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


// 16. Mở đóng quick view
async function openQuickView(productId) {
    const product = await getProductDetailForQuickView(productId);

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


// 17. Xử lý chọn trong quick view
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
    quickViewSelectedColorId = button.dataset.colorId || "";

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
    quickViewSelectedSizeId = button.dataset.sizeId || "";

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


// 18. Lấy biến thể đang chọn
function getSelectedQuickViewVariant() {
    if (!quickViewProduct || !Array.isArray(quickViewProduct.variants)) {
        return null;
    }

    return quickViewProduct.variants.find(function (variant) {
        return (
            String(variant.colorId || "") === String(quickViewSelectedColorId || "") &&
            String(variant.sizeId || "") === String(quickViewSelectedSizeId || "")
        );
    }) || null;
}


// 19. Tạo item giỏ hàng
function createCartItemFromQuickView() {
    const selectedVariant = getSelectedQuickViewVariant();

    return {
        cartItemId: createCartItemId(
            quickViewProduct.id,
            quickViewSelectedSize,
            quickViewSelectedColor
        ),

        id: quickViewProduct.id,
        productId: quickViewProduct.id,
        product_id: quickViewProduct.id,

        variantId: selectedVariant ? selectedVariant.id : null,
        productVariantId: selectedVariant ? selectedVariant.id : null,
        product_variant_id: selectedVariant ? selectedVariant.id : null,

        name: quickViewProduct.name,
        price: selectedVariant && selectedVariant.price
            ? Number(selectedVariant.price || 0)
            : Number(quickViewProduct.price || 0),
        oldPrice: Number(quickViewProduct.oldPrice || 0),

        image: quickViewProduct.image,

        meta: "Màu: " + quickViewSelectedColor + " / Size: " + quickViewSelectedSize,
        color: quickViewSelectedColor,
        colorId: quickViewSelectedColorId,
        size: quickViewSelectedSize,
        sizeId: quickViewSelectedSizeId,

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

    const selectedVariant = getSelectedQuickViewVariant();

    if (quickViewProduct.variants.length > 0 && !selectedVariant) {
        alert("Vui lòng chọn đúng màu và size còn tồn tại.");
        return false;
    }

    if (selectedVariant && selectedVariant.stockQuantity <= 0) {
        alert("Phân loại này hiện đã hết hàng.");
        return false;
    }

    const cartItems = getCartItemsFromStorage();
    const newItem = createCartItemFromQuickView();

    const existingItem = cartItems.find(function (item) {
        return item.cartItemId === newItem.cartItemId;
    });

    if (existingItem) {
        existingItem.quantity = normalizeQuantity(existingItem.quantity) + normalizeQuantity(newItem.quantity);
        existingItem.selected = true;
    } else {
        cartItems.push(newItem);
    }

    saveCartItemsToStorage(cartItems);

    return true;
}


// 20. Render cart drawer
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
        productVariant.textContent = "Màu: " + (item.color || "Chưa chọn") + " / Size: " + (item.size || "Chưa chọn");
    }

    if (productPriceQuantity) {
        productPriceQuantity.textContent = formatPrice(item.price) + " x " + Number(item.quantity || 0);
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


// 21. Mở đóng cart drawer
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


// 22. Xử lý sở hữu ngay và thanh toán
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


// 23. Xử lý banner
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


// 24. Xử lý tìm kiếm
function handleSearchSubmit(event) {
    event.preventDefault();

    const keyword = searchKeyword?.value.trim() || "";

    if (!keyword) {
        alert("Vui lòng nhập từ khóa tìm kiếm.");
        return;
    }

    window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
}


// 25. Xử lý click sản phẩm
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


// 26. Xử lý click quick view
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


// 27. Xử lý click cart drawer
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


// 28. Xử lý phím ESC
function handleEscapeKey(event) {
    if (event.key !== "Escape") {
        return;
    }

    closeQuickView();
    closeCartDrawer();
}


// 29. Gắn sự kiện
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


// 30. Khởi tạo trang home
async function initHomePage() {
    getElements();

    if (!homePage || !homeProductTemplate) {
        return;
    }

    bindEvents();
    renderCartDrawer();
    showSlide(0);
    startBannerAutoSlide();

    await loadHomeProductsFromApi();
}

document.addEventListener("DOMContentLoaded", initHomePage);