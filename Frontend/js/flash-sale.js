// =========================================================
// File: Frontend/js/flash-sale.js
// Mục đích: Trang Flash Sale lấy sản phẩm thật từ API backend
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang Flash Sale
    const flashSalePage = document.querySelector(".flashSalePage");

    if (!flashSalePage) {
        return;
    }


    // 2. Key localStorage
    const CART_STORAGE_KEY = "cart_items";
    const CHECKOUT_STORAGE_KEY = "checkout_items";
    const FLASH_END_TIME_KEY = "flash_sale_end_time";


    // 3. Biến trạng thái flash sale
    let flashProducts = [];
    let productDetailCache = {};

    let currentFilter = "all";
    let currentSort = "default";
    let currentView = "grid";
    let currentKeyword = "";
    let countdownTimer = null;


    // 4. Biến trạng thái quick view
    let quickViewProduct = null;
    let quickViewImageIndex = 0;
    let quickViewSelectedColor = "";
    let quickViewSelectedColorId = "";
    let quickViewSelectedSize = "";
    let quickViewSelectedSizeId = "";
    let quickViewQuantity = 1;


    // 5. Lấy DOM flash sale
    const searchForm = document.getElementById("searchForm");
    const searchKeywordInput = document.getElementById("searchKeyword");

    const flashHero = document.querySelector(".flashHero");
    const maxDiscountText = document.getElementById("maxDiscountText");

    const countdownDays = document.getElementById("countdownDays");
    const countdownHours = document.getElementById("countdownHours");
    const countdownMinutes = document.getElementById("countdownMinutes");
    const countdownSeconds = document.getElementById("countdownSeconds");

    const flashFilterBar = document.getElementById("flashFilterBar");
    const sortSelect = document.getElementById("sortSelect");
    const resultCount = document.getElementById("resultCount");
    const viewMode = document.getElementById("viewMode");

    const flashProductList = document.getElementById("flashProductList");
    const flashLoadingState = document.getElementById("flashLoadingState");
    const flashEmptyState = document.getElementById("flashEmptyState");
    const flashErrorState = document.getElementById("flashErrorState");
    const flashProductTemplate = document.getElementById("flashProductTemplate");

    const toastContainer = document.getElementById("flashSaleToastContainer");


    // 6. Lấy DOM quick view
    const quickViewOverlay = document.getElementById("quickViewOverlay");
    const quickViewPopup = document.getElementById("quickViewPopup");
    const quickViewCloseBtn = document.getElementById("quickViewCloseBtn");

    const quickViewThumbs = document.getElementById("quickViewThumbs");
    const quickViewThumbTemplate = document.getElementById("quickViewThumbTemplate");
    const quickViewImage = document.getElementById("quickViewImage");
    const quickViewPrevImageBtn = document.getElementById("quickViewPrevImageBtn");
    const quickViewNextImageBtn = document.getElementById("quickViewNextImageBtn");

    const quickViewBrand = document.getElementById("quickViewBrand");
    const quickViewProductName = document.getElementById("quickViewProductName");
    const quickViewProductStatus = document.getElementById("quickViewProductStatus");
    const quickViewCurrentPrice = document.getElementById("quickViewCurrentPrice");
    const quickViewOldPrice = document.getElementById("quickViewOldPrice");
    const quickViewDiscount = document.getElementById("quickViewDiscount");
    const quickViewSelectedColorText = document.getElementById("quickViewSelectedColor");

    const quickViewColorList = document.getElementById("quickViewColorList");
    const quickViewColorTemplate = document.getElementById("quickViewColorTemplate");

    const quickViewSizeList = document.getElementById("quickViewSizeList");
    const quickViewSizeTemplate = document.getElementById("quickViewSizeTemplate");

    const quickViewMinusQty = document.getElementById("quickViewMinusQty");
    const quickViewPlusQty = document.getElementById("quickViewPlusQty");
    const quickViewQuantityInput = document.getElementById("quickViewQuantityInput");
    const quickViewBuyBtn = document.getElementById("quickViewBuyBtn");

    const quickViewMaterial = document.getElementById("quickViewMaterial");
    const quickViewDescription = document.getElementById("quickViewDescription");
    const quickViewDetailLink = document.getElementById("quickViewDetailLink");


    // 7. Lấy DOM cart drawer
    const cartDrawerOverlay = document.getElementById("cartDrawerOverlay");
    const cartDrawer = document.getElementById("cartDrawer");
    const cartDrawerCloseBtn = document.getElementById("cartDrawerCloseBtn");
    const cartDrawerCount = document.getElementById("cartDrawerCount");
    const cartDrawerEmptyState = document.getElementById("cartDrawerEmptyState");
    const cartDrawerList = document.getElementById("cartDrawerList");
    const cartDrawerSubtotal = document.getElementById("cartDrawerSubtotal");
    const cartDrawerCheckoutBtn = document.getElementById("cartDrawerCheckoutBtn");
    const cartDrawerItemTemplate = document.getElementById("cartDrawerItemTemplate");


    // 8. Gọi API
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


    // 9. Hàm tiện ích
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
        return flashProducts.find(function (product) {
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

    function getSoldPercent(product) {
        if (!product.totalStock || product.totalStock <= 0) {
            return 0;
        }

        return Math.min(
            Math.round((Number(product.sold || 0) / Number(product.totalStock || 0)) * 100),
            100
        );
    }

    function showToast(message, type) {
        if (!toastContainer) {
            alert(message);
            return;
        }

        const toast = document.createElement("div");

        toast.className = "flashSaleToast " + (type || "success");
        toast.textContent = message;

        toastContainer.appendChild(toast);

        setTimeout(function () {
            toast.remove();
        }, 2600);
    }


    // 10. LocalStorage
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


    // 11. Chuẩn hóa sản phẩm từ API danh sách
    function normalizeProductFromApi(product) {
        const image = product.main_image || product.image_url || product.image || "../img/products/default.jpg";
        const price = Number(product.base_price || product.price || 0);
        const oldPrice = product.old_price !== null && product.old_price !== undefined
            ? Number(product.old_price || 0)
            : 0;

        const categorySlug = product.category_slug || "";
        const categoryName = product.category_name || "";

        return {
            id: String(product.id),
            category: categorySlug || categoryName,
            flashType: getFlashTypeByCategory(categorySlug, categoryName),

            name: product.name || "Sản phẩm",
            brand: product.brand || "DUHU Shop",
            meta: categoryName || "Flash Sale",

            material: product.material || "Chưa có thông tin chất liệu.",
            description: product.short_description || product.description || "Chưa có mô tả sản phẩm.",

            price: price,
            oldPrice: oldPrice,

            image: image,
            images: [image],

            sold: Number(product.sold_quantity || product.sold || 0),
            totalStock: Number(product.total_stock || 0) + Number(product.sold_quantity || product.sold || 0),
            inStock: Number(product.total_stock || 0) > 0,

            colors: [],
            sizes: [],
            variants: [],

            raw: product
        };
    }


    // 12. Chuẩn hóa sản phẩm từ API chi tiết
    function normalizeProductDetailFromApi(product) {
        const imageList = Array.isArray(product.images)
            ? product.images.map(function (image) {
                return image.image_url;
            }).filter(Boolean)
            : [];

        const mainImage = product.main_image || imageList[0] || "../img/products/default.jpg";
        const price = Number(product.base_price || product.price || 0);

        const oldPrice = product.old_price !== null && product.old_price !== undefined
            ? Number(product.old_price || 0)
            : 0;

        const category = product.category || {};
        const categorySlug = category.slug || product.category_slug || "";
        const categoryName = category.name || product.category_name || "";

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
            category: categorySlug || categoryName,
            flashType: getFlashTypeByCategory(categorySlug, categoryName),

            name: product.name || "Sản phẩm",
            brand: product.brand || "DUHU Shop",
            meta: categoryName || "Flash Sale",

            material: product.material || "Chưa có thông tin chất liệu.",
            description: product.description || product.short_description || "Chưa có mô tả sản phẩm.",

            price: price,
            oldPrice: oldPrice,

            image: mainImage,
            images: imageList.length > 0 ? imageList : [mainImage],

            sold: Number(product.sold_quantity || product.sold || 0),
            totalStock: Number(product.total_stock || 0) + Number(product.sold_quantity || product.sold || 0),
            inStock: Number(product.total_stock || 0) > 0,

            colors: colors,
            sizes: sizes,
            variants: variants,

            raw: product
        };
    }


    // 13. Phân loại flash sale theo danh mục
    function getFlashTypeByCategory(categorySlug, categoryName) {
        const text = (String(categorySlug || "") + " " + String(categoryName || "")).toLowerCase();

        if (
            text.includes("quan") ||
            text.includes("quần")
        ) {
            return "pants";
        }

        if (
            text.includes("mu") ||
            text.includes("mũ") ||
            text.includes("tat") ||
            text.includes("tất") ||
            text.includes("phu-kien") ||
            text.includes("phụ kiện") ||
            text.includes("quan-lot") ||
            text.includes("quần lót")
        ) {
            return "accessory";
        }

        return "shirt";
    }


    // 14. Load sản phẩm flash sale từ API
    async function loadFlashProductsFromApi() {
        showState("loading");
        clearProductList();
        updateResultCount(0);

        try {
            const response = await getApi("products/get-products.php?page=1&limit=100&is_sale=1&sort=latest");
            const data = response.data || {};
            const products = Array.isArray(data.products) ? data.products : [];

            flashProducts = products
                .map(normalizeProductFromApi)
                .filter(function (product) {
                    return product.oldPrice > product.price;
                });

            updateMaxDiscount();
            renderPage();
        } catch (error) {
            console.error("Lỗi tải flash sale:", error);
            showState("error");
        }
    }


    // 15. Load chi tiết sản phẩm cho quick view
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

            const oldIndex = flashProducts.findIndex(function (item) {
                return String(item.id) === String(product.id);
            });

            if (oldIndex >= 0) {
                flashProducts[oldIndex] = product;
            } else {
                flashProducts.push(product);
            }

            return product;
        } catch (error) {
            console.error("Lỗi lấy chi tiết sản phẩm:", error);
            return getProductById(productId);
        }
    }


    // 16. Countdown flash sale
    function getFlashSaleEndTime() {
        const htmlEndTime = flashHero?.dataset.endTime || "";

        if (htmlEndTime) {
            return new Date(htmlEndTime).getTime();
        }

        const savedEndTime = localStorage.getItem(FLASH_END_TIME_KEY);

        if (savedEndTime && Number(savedEndTime) > Date.now()) {
            return Number(savedEndTime);
        }

        const newEndTime = Date.now() + 24 * 60 * 60 * 1000;

        localStorage.setItem(FLASH_END_TIME_KEY, String(newEndTime));

        return newEndTime;
    }

    function isFlashSaleEnded() {
        return Date.now() >= getFlashSaleEndTime();
    }

    function updateCountdown() {
        const endTime = getFlashSaleEndTime();
        const distance = Math.max(endTime - Date.now(), 0);

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((distance / (1000 * 60)) % 60);
        const seconds = Math.floor((distance / 1000) % 60);

        if (countdownDays) countdownDays.textContent = String(days).padStart(2, "0");
        if (countdownHours) countdownHours.textContent = String(hours).padStart(2, "0");
        if (countdownMinutes) countdownMinutes.textContent = String(minutes).padStart(2, "0");
        if (countdownSeconds) countdownSeconds.textContent = String(seconds).padStart(2, "0");

        flashSalePage.classList.toggle("is-ended", distance <= 0);
    }

    function startCountdown() {
        updateCountdown();

        countdownTimer = setInterval(function () {
            updateCountdown();
            renderPage();
        }, 1000);
    }


    // 17. Cập nhật giảm giá lớn nhất
    function updateMaxDiscount() {
        const maxDiscount = flashProducts.reduce(function (maxValue, product) {
            const discount = calculateDiscountPercent(product.price, product.oldPrice);

            return Math.max(maxValue, discount);
        }, 0);

        if (maxDiscountText) {
            maxDiscountText.textContent = maxDiscount + "%";
        }
    }


    // 18. Lọc sản phẩm
    function filterProductsByTab(products, filterValue) {
        if (filterValue === "all") {
            return products;
        }

        if (filterValue === "under-199k") {
            return products.filter(function (product) {
                return product.price < 199000;
            });
        }

        return products.filter(function (product) {
            return product.flashType === filterValue;
        });
    }

    function filterProductsByKeyword(products, keyword) {
        if (!keyword.trim()) {
            return products;
        }

        const normalizedKeyword = keyword.trim().toLowerCase();

        return products.filter(function (product) {
            return (
                product.name.toLowerCase().includes(normalizedKeyword) ||
                product.meta.toLowerCase().includes(normalizedKeyword) ||
                product.category.toLowerCase().includes(normalizedKeyword)
            );
        });
    }


    // 19. Sắp xếp sản phẩm
    function sortProducts(products, sortValue) {
        const clonedProducts = [...products];

        if (sortValue === "discount-desc") {
            clonedProducts.sort(function (a, b) {
                return calculateDiscountPercent(b.price, b.oldPrice) - calculateDiscountPercent(a.price, a.oldPrice);
            });
        }

        if (sortValue === "price-asc") {
            clonedProducts.sort(function (a, b) {
                return a.price - b.price;
            });
        }

        if (sortValue === "price-desc") {
            clonedProducts.sort(function (a, b) {
                return b.price - a.price;
            });
        }

        if (sortValue === "best-selling") {
            clonedProducts.sort(function (a, b) {
                return Number(b.sold || 0) - Number(a.sold || 0);
            });
        }

        return clonedProducts;
    }

    function getFilteredAndSortedProducts() {
        let products = [...flashProducts];

        products = filterProductsByTab(products, currentFilter);
        products = filterProductsByKeyword(products, currentKeyword);
        products = sortProducts(products, currentSort);

        return products;
    }


    // 20. Hiển thị trạng thái
    function showState(type) {
        flashLoadingState?.classList.remove("show");
        flashEmptyState?.classList.remove("show");
        flashErrorState?.classList.remove("show");

        if (flashLoadingState) flashLoadingState.hidden = true;
        if (flashEmptyState) flashEmptyState.hidden = true;
        if (flashErrorState) flashErrorState.hidden = true;

        if (type === "loading" && flashLoadingState) {
            flashLoadingState.hidden = false;
            flashLoadingState.classList.add("show");
        }

        if (type === "empty" && flashEmptyState) {
            flashEmptyState.hidden = false;
            flashEmptyState.classList.add("show");
        }

        if (type === "error" && flashErrorState) {
            flashErrorState.hidden = false;
            flashErrorState.classList.add("show");
        }
    }

    function clearProductList() {
        if (flashProductList) {
            flashProductList.innerHTML = "";
        }
    }

    function updateResultCount(count) {
        if (resultCount) {
            resultCount.textContent = "Hiển thị " + count + " sản phẩm đang giảm giá";
        }
    }


    // 21. Tạo card sản phẩm flash sale
    function createFlashProductCard(product) {
        if (!flashProductTemplate) {
            return null;
        }

        const clone = flashProductTemplate.content.cloneNode(true);

        const article = clone.querySelector(".productCard");
        const productLink = clone.querySelector('[data-role="product-link"]');
        const productImage = clone.querySelector('[data-role="product-image"]');
        const discountBadge = clone.querySelector('[data-role="discount-badge"]');

        const quickBuyBtn = clone.querySelector('[data-role="quick-buy-btn"]');
        const viewDetailBtn = clone.querySelector('[data-role="view-detail-btn"]');

        const productNameLink = clone.querySelector('[data-role="product-link-text"]');
        const currentPrice = clone.querySelector('[data-role="product-price-current"]');
        const oldPrice = clone.querySelector('[data-role="product-price-old"]');
        const discountText = clone.querySelector('[data-role="product-discount"]');

        const soldCount = clone.querySelector('[data-role="sold-count"]');
        const stockProgress = clone.querySelector('[data-role="stock-progress"]');

        const detailUrl = getProductDetailUrl(product.id);
        const discount = calculateDiscountPercent(product.price, product.oldPrice);
        const soldPercent = getSoldPercent(product);
        const saleEnded = isFlashSaleEnded();

        if (article) {
            article.dataset.productId = product.id;
            article.classList.toggle("outOfStock", !product.inStock);
        }

        if (productLink) {
            productLink.href = detailUrl;
        }

        if (productImage) {
            productImage.src = product.image;
            productImage.alt = product.name;
        }

        if (discountBadge) {
            discountBadge.textContent = discount + "%";
        }

        if (quickBuyBtn) {
            quickBuyBtn.dataset.productId = product.id;
            quickBuyBtn.disabled = saleEnded || !product.inStock;
        }

        if (viewDetailBtn) {
            viewDetailBtn.href = detailUrl;
            viewDetailBtn.dataset.productId = product.id;
        }

        if (productNameLink) {
            productNameLink.href = detailUrl;
            productNameLink.textContent = product.name;
        }

        if (currentPrice) {
            currentPrice.textContent = formatPrice(product.price);
        }

        if (oldPrice) {
            oldPrice.textContent = formatPrice(product.oldPrice);
        }

        if (discountText) {
            discountText.textContent = "Tiết kiệm " + formatPrice(product.oldPrice - product.price);
        }

        if (soldCount) {
            soldCount.textContent = "Đã bán " + Number(product.sold || 0);
        }

        if (stockProgress) {
            stockProgress.style.width = soldPercent + "%";
        }

        return clone;
    }


    // 22. Render danh sách flash sale
    function renderProducts(products) {
        clearProductList();
        updateResultCount(products.length);

        if (!products.length) {
            showState("empty");
            return;
        }

        showState("");

        const fragment = document.createDocumentFragment();

        products.forEach(function (product) {
            const card = createFlashProductCard(product);

            if (card) {
                fragment.appendChild(card);
            }
        });

        if (flashProductList) {
            flashProductList.appendChild(fragment);
        }
    }

    function applyViewMode(view) {
        currentView = view;

        if (!flashProductList || !viewMode) {
            return;
        }

        flashProductList.classList.toggle("listView", view === "list");

        viewMode.querySelectorAll(".viewModeBtn").forEach(function (button) {
            button.classList.toggle("active", button.dataset.view === view);
        });
    }

    function renderPage() {
        try {
            const products = getFilteredAndSortedProducts();

            renderProducts(products);
            applyViewMode(currentView);
        } catch (error) {
            console.error("Lỗi render flash sale:", error);

            clearProductList();
            updateResultCount(0);
            showState("error");
        }
    }


    // 23. Render quick view
    function renderQuickViewThumbs(product) {
        if (!quickViewThumbs || !quickViewThumbTemplate) {
            return;
        }

        const images = getProductImages(product);

        quickViewThumbs.innerHTML = "";

        images.forEach(function (imageUrl, index) {
            const clone = quickViewThumbTemplate.content.cloneNode(true);
            const button = clone.querySelector(".quickViewThumb");
            const image = clone.querySelector("img");

            if (button) {
                button.dataset.imageIndex = String(index);
                button.classList.toggle("active", index === quickViewImageIndex);
            }

            if (image) {
                image.src = imageUrl;
                image.alt = product.name + " " + (index + 1);
            }

            quickViewThumbs.appendChild(clone);
        });
    }

    function renderQuickViewMainImage(product) {
        if (!quickViewImage) {
            return;
        }

        const images = getProductImages(product);

        quickViewImage.src = images[quickViewImageIndex] || images[0];
        quickViewImage.alt = product.name;
    }

    function renderQuickViewColors(product) {
        if (!quickViewColorList || !quickViewColorTemplate) {
            return;
        }

        const colors = Array.isArray(product.colors) && product.colors.length
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

            quickViewColorList.appendChild(button);
        });

        if (quickViewSelectedColorText) {
            quickViewSelectedColorText.textContent = quickViewSelectedColor;
        }
    }

    function renderQuickViewSizes(product) {
        if (!quickViewSizeList || !quickViewSizeTemplate) {
            return;
        }

        const sizes = Array.isArray(product.sizes) && product.sizes.length
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

            quickViewSizeList.appendChild(button);
        });
    }

    function renderQuickViewInfo(product) {
        const discount = calculateDiscountPercent(product.price, product.oldPrice);
        const saleEnded = isFlashSaleEnded();

        if (quickViewBrand) {
            quickViewBrand.textContent = product.brand || "DUHU Shop";
        }

        if (quickViewProductName) {
            quickViewProductName.textContent = product.name;
        }

        if (quickViewProductStatus) {
            if (saleEnded) {
                quickViewProductStatus.textContent = "Flash sale đã kết thúc";
            } else {
                quickViewProductStatus.textContent = product.inStock ? "Còn hàng" : "Hết hàng";
            }
        }

        if (quickViewCurrentPrice) {
            quickViewCurrentPrice.textContent = formatPrice(product.price);
        }

        if (quickViewOldPrice) {
            quickViewOldPrice.textContent = formatPrice(product.oldPrice);
            quickViewOldPrice.hidden = false;
        }

        if (quickViewDiscount) {
            quickViewDiscount.textContent = "Giảm " + discount + "%";
            quickViewDiscount.hidden = false;
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
            quickViewBuyBtn.disabled = saleEnded || !product.inStock;
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


    // 24. Mở đóng quick view
    async function openQuickView(productId) {
        const product = await getProductDetailForQuickView(productId);

        if (!product) {
            showToast("Không tìm thấy sản phẩm.", "error");
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


    // 25. Xử lý chọn quick view
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

    function decreaseQuickViewQuantity() {
        if (quickViewQuantity <= 1) {
            return;
        }

        quickViewQuantity -= 1;

        if (quickViewQuantityInput) {
            quickViewQuantityInput.value = String(quickViewQuantity);
        }
    }

    function increaseQuickViewQuantity() {
        quickViewQuantity += 1;

        if (quickViewQuantityInput) {
            quickViewQuantityInput.value = String(quickViewQuantity);
        }
    }

    function updateQuickViewQuantityFromInput() {
        quickViewQuantity = normalizeQuantity(quickViewQuantityInput?.value || 1);

        if (quickViewQuantityInput) {
            quickViewQuantityInput.value = String(quickViewQuantity);
        }
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


    // 26. Lấy biến thể đang chọn
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


    // 27. Thêm sản phẩm vào cart drawer
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
                ? Number(selectedVariant.price)
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

        if (isFlashSaleEnded()) {
            showToast("Flash sale đã kết thúc.", "warning");
            return false;
        }

        if (!quickViewProduct.inStock) {
            showToast("Sản phẩm hiện đã hết hàng.", "warning");
            return false;
        }

        const selectedVariant = getSelectedQuickViewVariant();

        if (quickViewProduct.variants.length > 0 && !selectedVariant) {
            showToast("Vui lòng chọn đúng màu và size còn tồn tại.", "warning");
            return false;
        }

        if (selectedVariant && selectedVariant.stockQuantity <= 0) {
            showToast("Phân loại này hiện đã hết hàng.", "warning");
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


    // 28. Render cart drawer
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

        cartItems.forEach(function (item) {
            const cartItemElement = createCartDrawerItemElement(item);

            if (cartItemElement) {
                cartDrawerList.appendChild(cartItemElement);
            }
        });
    }


    // 29. Mở đóng cart drawer
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


    // 30. Sở hữu ngay và checkout
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
            showToast("Giỏ hàng của bạn đang trống.", "warning");
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


    // 31. Xử lý filter
    function handleFilterClick(event) {
        const tab = event.target.closest(".flashTab");

        if (!tab) {
            return;
        }

        currentFilter = tab.dataset.filter || "all";

        flashFilterBar?.querySelectorAll(".flashTab").forEach(function (item) {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        renderPage();
    }


    // 32. Xử lý sort
    function handleSortChange() {
        currentSort = sortSelect ? sortSelect.value : "default";

        renderPage();
    }


    // 33. Xử lý view mode
    function handleViewModeClick(event) {
        const button = event.target.closest(".viewModeBtn");

        if (!button) {
            return;
        }

        applyViewMode(button.dataset.view || "grid");
    }


    // 34. Xử lý tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeywordInput ? searchKeywordInput.value.trim() : "";

        if (!keyword) {
            showToast("Vui lòng nhập từ khóa tìm kiếm.", "warning");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 35. Xử lý click sản phẩm
    function handleProductListClick(event) {
        const quickBuyBtn = event.target.closest('[data-role="quick-buy-btn"]');

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


    // 36. Xử lý click quick view
    function handleQuickViewClick(event) {
        const thumbButton = event.target.closest(".quickViewThumb");
        const colorButton = event.target.closest(".quickViewColorItem");
        const sizeButton = event.target.closest(".quickViewSizeItem");
        const toggleButton = event.target.closest(".quickViewToggleBtn");

        if (thumbButton) {
            updateQuickViewImage(Number(thumbButton.dataset.imageIndex || 0));
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
            toggleQuickViewContent(toggleButton.dataset.action || "");
        }
    }


    // 37. Xử lý click cart drawer
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


    // 38. Phím ESC
    function handleEscapeKey(event) {
        if (event.key !== "Escape") {
            return;
        }

        closeQuickView();
        closeCartDrawer();
    }


    // 39. Gắn sự kiện
    function bindEvents() {
        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }

        if (flashFilterBar) {
            flashFilterBar.addEventListener("click", handleFilterClick);
        }

        if (sortSelect) {
            sortSelect.addEventListener("change", handleSortChange);
        }

        if (viewMode) {
            viewMode.addEventListener("click", handleViewModeClick);
        }

        if (flashProductList) {
            flashProductList.addEventListener("click", handleProductListClick);
        }

        if (quickViewCloseBtn) {
            quickViewCloseBtn.addEventListener("click", closeQuickView);
        }

        if (quickViewOverlay) {
            quickViewOverlay.addEventListener("click", closeQuickView);
        }

        if (quickViewThumbs) {
            quickViewThumbs.addEventListener("click", handleQuickViewClick);
        }

        if (quickViewColorList) {
            quickViewColorList.addEventListener("click", handleQuickViewClick);
        }

        if (quickViewSizeList) {
            quickViewSizeList.addEventListener("click", handleQuickViewClick);
        }

        if (quickViewPopup) {
            quickViewPopup.addEventListener("click", handleQuickViewClick);
        }

        if (quickViewPrevImageBtn) {
            quickViewPrevImageBtn.addEventListener("click", function () {
                updateQuickViewImage(quickViewImageIndex - 1);
            });
        }

        if (quickViewNextImageBtn) {
            quickViewNextImageBtn.addEventListener("click", function () {
                updateQuickViewImage(quickViewImageIndex + 1);
            });
        }

        if (quickViewMinusQty) {
            quickViewMinusQty.addEventListener("click", decreaseQuickViewQuantity);
        }

        if (quickViewPlusQty) {
            quickViewPlusQty.addEventListener("click", increaseQuickViewQuantity);
        }

        if (quickViewQuantityInput) {
            quickViewQuantityInput.addEventListener("change", updateQuickViewQuantityFromInput);
        }

        if (quickViewBuyBtn) {
            quickViewBuyBtn.addEventListener("click", handleQuickViewBuy);
        }

        if (cartDrawerCloseBtn) {
            cartDrawerCloseBtn.addEventListener("click", closeCartDrawer);
        }

        if (cartDrawerOverlay) {
            cartDrawerOverlay.addEventListener("click", closeCartDrawer);
        }

        if (cartDrawerList) {
            cartDrawerList.addEventListener("click", handleCartDrawerClick);
        }

        if (cartDrawerCheckoutBtn) {
            cartDrawerCheckoutBtn.addEventListener("click", handleCartDrawerCheckout);
        }

        document.addEventListener("keydown", handleEscapeKey);
    }


    // 40. Khởi tạo trang Flash Sale
    async function initFlashSalePage() {
        bindEvents();
        renderCartDrawer();
        applyViewMode("grid");
        startCountdown();

        await loadFlashProductsFromApi();
    }

    initFlashSalePage();


    // 41. Dọn interval khi rời trang
    window.addEventListener("beforeunload", function () {
        if (countdownTimer) {
            clearInterval(countdownTimer);
        }
    });
});