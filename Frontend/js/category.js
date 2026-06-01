// =========================================================
// File: Frontend/js/category.js
// Mục đích: Trang danh mục lấy sản phẩm thật từ API backend
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang category
    const categoryPage = document.querySelector(".categoryPage");

    if (!categoryPage) {
        return;
    }


    // 2. Key localStorage
    const CART_STORAGE_KEY = "cart_items";
    const CHECKOUT_STORAGE_KEY = "checkout_items";


    // 3. Biến trạng thái category
    let currentCategory = categoryPage.dataset.category || "";
    let currentPage = 1;
    let currentLimit = 12;
    let currentView = "grid";
    let currentKeyword = "";

    let products = [];
    let productDetailCache = {};
    let paginationData = {
        page: 1,
        limit: 12,
        total_products: 0,
        total_pages: 1
    };


    // 4. Biến trạng thái quick view
    let quickViewProduct = null;
    let quickViewImageIndex = 0;
    let quickViewSelectedColor = "";
    let quickViewSelectedColorId = "";
    let quickViewSelectedSize = "";
    let quickViewSelectedSizeId = "";
    let quickViewQuantity = 1;


    // 5. Lấy phần tử DOM category
    const searchForm = document.getElementById("searchForm");
    const searchKeywordInput = document.getElementById("searchKeyword");

    const filterForm = document.getElementById("filterForm");
    const btnApplyFilter = document.getElementById("btnApplyFilter");
    const btnResetFilter = document.getElementById("btnResetFilter");

    const sortSelect = document.getElementById("sort");
    const viewMode = document.getElementById("viewMode");
    const gridViewBtn = document.getElementById("gridViewBtn");
    const listViewBtn = document.getElementById("listViewBtn");

    const productCount = document.getElementById("productCount");
    const categoryGrid = document.getElementById("categoryGrid");
    const pagination = document.getElementById("pagination");

    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const errorState = document.getElementById("errorState");

    const productCardTemplate = document.getElementById("productCardTemplate");


    // 6. Lấy phần tử DOM quick view
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


    // 7. Lấy phần tử DOM cart drawer
    const cartDrawerOverlay = document.getElementById("cartDrawerOverlay");
    const cartDrawer = document.getElementById("cartDrawer");
    const cartDrawerCloseBtn = document.getElementById("cartDrawerCloseBtn");
    const cartDrawerCount = document.getElementById("cartDrawerCount");
    const cartDrawerEmptyState = document.getElementById("cartDrawerEmptyState");
    const cartDrawerList = document.getElementById("cartDrawerList");
    const cartDrawerSubtotal = document.getElementById("cartDrawerSubtotal");
    const cartDrawerCheckoutBtn = document.getElementById("cartDrawerCheckoutBtn");
    const cartDrawerItemTemplate = document.getElementById("cartDrawerItemTemplate");


    // 8. Map slug dự phòng nếu DB và HTML đặt slug khác nhau
    const categorySlugAliasMap = {
        "hoodie": ["hoodie", "ao-hoodie"],
        "ao-hoodie": ["ao-hoodie", "hoodie"]
    };


    // 9. Gọi API
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


    // 10. Hàm tiện ích
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

    function getProductDetailUrl(productId) {
        return "../html/product-detail.html?id=" + encodeURIComponent(productId);
    }

    function createCartItemId(productId, size, color) {
        return productId + "_" + size + "_" + color;
    }

    function normalizeQuantity(value) {
        const numberValue = Number(value || 1);

        if (Number.isNaN(numberValue) || numberValue < 1) {
            return 1;
        }

        return Math.floor(numberValue);
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


    // 11. LocalStorage
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


    // 12. Trạng thái hiển thị category
    function hideCategoryStates() {
        if (loadingState) {
            loadingState.hidden = true;
            loadingState.classList.remove("show");
        }

        if (emptyState) {
            emptyState.hidden = true;
            emptyState.classList.remove("show");
        }

        if (errorState) {
            errorState.hidden = true;
            errorState.classList.remove("show");
        }

        if (categoryGrid) {
            categoryGrid.hidden = true;
        }

        if (pagination) {
            pagination.hidden = true;
        }
    }

    function showLoadingState() {
        hideCategoryStates();

        if (loadingState) {
            loadingState.hidden = false;
            loadingState.classList.add("show");
        }
    }

    function showEmptyState() {
        hideCategoryStates();

        if (emptyState) {
            emptyState.hidden = false;
            emptyState.classList.add("show");
        }
    }

    function showErrorState() {
        hideCategoryStates();

        if (errorState) {
            errorState.hidden = false;
            errorState.classList.add("show");
        }
    }

    function showProductContent() {
        hideCategoryStates();

        if (categoryGrid) {
            categoryGrid.hidden = false;
        }

        if (pagination) {
            pagination.hidden = false;
        }
    }


    // 13. Lấy filter giá
    function getSelectedPriceFilter() {
        const checkedPrice = filterForm
            ? filterForm.querySelector('input[name="price"]:checked')
            : null;

        return checkedPrice ? checkedPrice.value : "";
    }

    function getPriceFilterParams() {
        const priceValue = getSelectedPriceFilter();

        if (priceValue === "under-200") {
            return {
                minPrice: "",
                maxPrice: 199999
            };
        }

        if (priceValue === "200-300") {
            return {
                minPrice: 200000,
                maxPrice: 300000
            };
        }

        if (priceValue === "over-300") {
            return {
                minPrice: 300001,
                maxPrice: ""
            };
        }

        return {
            minPrice: "",
            maxPrice: ""
        };
    }


    // 14. Map sort UI sang API
    function getSortParam() {
        const sortValue = sortSelect ? sortSelect.value : "default";

        if (sortValue === "price-asc") {
            return "price_asc";
        }

        if (sortValue === "price-desc") {
            return "price_desc";
        }

        if (sortValue === "best-seller") {
            return "featured";
        }

        return "";
    }


    // 15. Lấy slug category
    function getCategorySlugCandidates() {
        if (!currentCategory) {
            return [""];
        }

        if (categorySlugAliasMap[currentCategory]) {
            return categorySlugAliasMap[currentCategory];
        }

        return [currentCategory];
    }


    // 16. Tạo endpoint danh sách sản phẩm
    function buildProductListEndpoint(categorySlug) {
        const priceParams = getPriceFilterParams();
        const sortParam = getSortParam();

        let endpoint = "products/get-products.php?";
        endpoint += "page=" + encodeURIComponent(currentPage);
        endpoint += "&limit=" + encodeURIComponent(currentLimit);

        if (categorySlug) {
            endpoint += "&category_slug=" + encodeURIComponent(categorySlug);
        }

        if (currentKeyword) {
            endpoint += "&keyword=" + encodeURIComponent(currentKeyword);
        }

        if (priceParams.minPrice !== "") {
            endpoint += "&min_price=" + encodeURIComponent(priceParams.minPrice);
        }

        if (priceParams.maxPrice !== "") {
            endpoint += "&max_price=" + encodeURIComponent(priceParams.maxPrice);
        }

        if (sortParam) {
            endpoint += "&sort=" + encodeURIComponent(sortParam);
        }

        return endpoint;
    }


    // 17. Chuẩn hóa sản phẩm từ API danh sách
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


    // 18. Chuẩn hóa sản phẩm từ API chi tiết
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


    // 19. Load danh sách sản phẩm từ API
    async function loadProductsFromApi() {
        showLoadingState();

        const slugCandidates = getCategorySlugCandidates();

        let responseData = null;

        for (let i = 0; i < slugCandidates.length; i += 1) {
            const endpoint = buildProductListEndpoint(slugCandidates[i]);
            const response = await getApi(endpoint);
            const data = response.data || {};
            const productList = Array.isArray(data.products) ? data.products : [];

            responseData = data;

            if (productList.length > 0 || i === slugCandidates.length - 1) {
                break;
            }
        }

        const productList = responseData && Array.isArray(responseData.products)
            ? responseData.products
            : [];

        products = productList.map(normalizeProductFromApi);

        paginationData = responseData && responseData.pagination
            ? responseData.pagination
            : {
                page: currentPage,
                limit: currentLimit,
                total_products: products.length,
                total_pages: 1
            };

        renderCategoryProducts();
    }


    // 20. Render card sản phẩm
    function createProductCard(product) {
        if (!productCardTemplate) {
            return null;
        }

        const clone = productCardTemplate.content.cloneNode(true);

        const productCard = clone.querySelector(".productCard");
        const productImage = clone.querySelector('[data-role="product-image"]');
        const productLinks = clone.querySelectorAll('[data-role="product-link"], [data-role="product-link-text"]');
        const productName = clone.querySelector('[data-role="product-link-text"]');
        const productPrice = clone.querySelector('[data-role="product-price-current"]');
        const productOldPrice = clone.querySelector('[data-role="product-price-old"]');
        const productDiscount = clone.querySelector('[data-role="product-discount"]');
        const quickBuyBtn = clone.querySelector('[data-role="quick-buy-btn"]');
        const viewDetailBtn = clone.querySelector('[data-role="view-detail-btn"]');

        const detailUrl = getProductDetailUrl(product.id);
        const discountPercent = calculateDiscountPercent(product.price, product.oldPrice);

        if (productCard) {
            productCard.dataset.productId = product.id;
            productCard.classList.toggle("outOfStock", !product.inStock);
        }

        if (productImage) {
            productImage.src = product.image;
            productImage.alt = product.name;
        }

        productLinks.forEach(function (link) {
            link.href = detailUrl;
        });

        if (productName) {
            productName.textContent = product.name;
        }

        if (productPrice) {
            productPrice.textContent = formatPrice(product.price);
        }

        if (productOldPrice) {
            if (product.oldPrice > product.price) {
                productOldPrice.textContent = formatPrice(product.oldPrice);
                productOldPrice.hidden = false;
            } else {
                productOldPrice.textContent = "";
                productOldPrice.hidden = true;
            }
        }

        if (productDiscount) {
            if (discountPercent > 0) {
                productDiscount.textContent = "Giảm " + discountPercent + "%";
                productDiscount.hidden = false;
            } else {
                productDiscount.textContent = "";
                productDiscount.hidden = true;
            }
        }

        if (quickBuyBtn) {
            quickBuyBtn.dataset.productId = product.id;
            quickBuyBtn.disabled = !product.inStock;
        }

        if (viewDetailBtn) {
            viewDetailBtn.href = detailUrl;
            viewDetailBtn.dataset.productId = product.id;
        }

        return clone;
    }


    // 21. Render danh sách sản phẩm
    function renderProductCount() {
        if (!productCount) {
            return;
        }

        productCount.textContent = Number(paginationData.total_products || products.length);
    }

    function renderProductGrid() {
        if (!categoryGrid || !productCardTemplate) {
            return;
        }

        categoryGrid.innerHTML = "";

        products.forEach(function (product) {
            const card = createProductCard(product);

            if (card) {
                categoryGrid.appendChild(card);
            }
        });

        categoryGrid.classList.toggle("listView", currentView === "list");
        categoryGrid.classList.toggle("gridView", currentView === "grid");
    }

    function renderPagination() {
        if (!pagination) {
            return;
        }

        const totalPages = Number(paginationData.total_pages || 1);

        pagination.innerHTML = "";

        if (totalPages <= 1) {
            pagination.hidden = true;
            return;
        }

        const prevButton = document.createElement("button");
        prevButton.type = "button";
        prevButton.className = "paginationBtn";
        prevButton.textContent = "Trước";
        prevButton.disabled = currentPage <= 1;
        prevButton.dataset.page = String(currentPage - 1);
        pagination.appendChild(prevButton);

        for (let page = 1; page <= totalPages; page += 1) {
            const pageButton = document.createElement("button");

            pageButton.type = "button";
            pageButton.className = "paginationBtn";

            if (page === currentPage) {
                pageButton.classList.add("active");
            }

            pageButton.textContent = String(page);
            pageButton.dataset.page = String(page);

            pagination.appendChild(pageButton);
        }

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.className = "paginationBtn";
        nextButton.textContent = "Sau";
        nextButton.disabled = currentPage >= totalPages;
        nextButton.dataset.page = String(currentPage + 1);
        pagination.appendChild(nextButton);
    }

    function renderCategoryProducts() {
        renderProductCount();

        if (products.length === 0) {
            if (categoryGrid) {
                categoryGrid.innerHTML = "";
            }

            if (pagination) {
                pagination.innerHTML = "";
            }

            showEmptyState();
            return;
        }

        renderProductGrid();
        renderPagination();
        showProductContent();
    }


    // 22. Load chi tiết sản phẩm cho quick view
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
            }

            return product;
        } catch (error) {
            console.error(error);
            return getProductById(productId);
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
        const imageUrl = images[quickViewImageIndex] || images[0];

        quickViewImage.src = imageUrl;
        quickViewImage.alt = product.name;
    }

    function renderQuickViewColors(product) {
        if (!quickViewColorList || !quickViewColorTemplate) {
            return;
        }

        const colors = product.colors.length > 0
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

            if (button) {
                button.dataset.colorId = color.id || "";
                button.dataset.colorName = color.name;
                button.dataset.colorValue = color.value || "#111111";
                button.title = color.name;
                button.setAttribute("aria-label", color.name);
                button.style.background = color.value || "#111111";
                button.classList.toggle("active", index === 0);
            }

            quickViewColorList.appendChild(clone);
        });

        if (quickViewSelectedColorText) {
            quickViewSelectedColorText.textContent = quickViewSelectedColor;
        }
    }

    function renderQuickViewSizes(product) {
        if (!quickViewSizeList || !quickViewSizeTemplate) {
            return;
        }

        const sizes = product.sizes.length > 0
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

            if (button) {
                button.dataset.sizeId = size.id || "";
                button.dataset.size = size.name;
                button.textContent = size.name;
                button.classList.toggle("active", index === 0);
            }

            quickViewSizeList.appendChild(clone);
        });
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
            if (product.oldPrice > product.price) {
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


    // 24. Mở đóng quick view
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


    // 25. Xử lý chọn trong quick view
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


    // 27. Tạo item giỏ hàng
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


    // 31. Xử lý sản phẩm / filter / view
    function handleProductClick(event) {
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

    function handleApplyFilter() {
        currentPage = 1;

        loadProductsFromApi().catch(function (error) {
            console.error(error);
            showErrorState();
        });
    }

    function handleResetFilter() {
        if (filterForm) {
            filterForm.reset();
        }

        if (sortSelect) {
            sortSelect.value = "default";
        }

        currentKeyword = "";
        currentPage = 1;

        loadProductsFromApi().catch(function (error) {
            console.error(error);
            showErrorState();
        });
    }

    function handleSortChange() {
        currentPage = 1;

        loadProductsFromApi().catch(function (error) {
            console.error(error);
            showErrorState();
        });
    }

    function setViewMode(view) {
        currentView = view;

        if (gridViewBtn) {
            gridViewBtn.classList.toggle("active", view === "grid");
        }

        if (listViewBtn) {
            listViewBtn.classList.toggle("active", view === "list");
        }

        if (categoryGrid) {
            categoryGrid.classList.toggle("listView", view === "list");
            categoryGrid.classList.toggle("gridView", view === "grid");
        }
    }

    function handlePaginationClick(event) {
        const button = event.target.closest(".paginationBtn");

        if (!button || button.disabled) {
            return;
        }

        const page = Number(button.dataset.page || 1);

        if (page < 1 || page === currentPage) {
            return;
        }

        currentPage = page;

        loadProductsFromApi().catch(function (error) {
            console.error(error);
            showErrorState();
        });

        categoryPage.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    // 32. Xử lý quick view
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


    // 33. Xử lý cart drawer
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


    // 34. Xử lý tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeywordInput ? searchKeywordInput.value.trim() : "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 35. Phím ESC
    function handleEscapeKey(event) {
        if (event.key !== "Escape") {
            return;
        }

        closeQuickView();
        closeCartDrawer();
    }


    // 36. Gắn sự kiện
    function bindEvents() {
        document.addEventListener("click", handleProductClick);
        document.addEventListener("keydown", handleEscapeKey);

        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }

        if (btnApplyFilter) {
            btnApplyFilter.addEventListener("click", handleApplyFilter);
        }

        if (btnResetFilter) {
            btnResetFilter.addEventListener("click", handleResetFilter);
        }

        if (sortSelect) {
            sortSelect.addEventListener("change", handleSortChange);
        }

        if (gridViewBtn) {
            gridViewBtn.addEventListener("click", function () {
                setViewMode("grid");
            });
        }

        if (listViewBtn) {
            listViewBtn.addEventListener("click", function () {
                setViewMode("list");
            });
        }

        if (pagination) {
            pagination.addEventListener("click", handlePaginationClick);
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
            quickViewMinusQty.addEventListener("click", function () {
                if (quickViewQuantity <= 1) {
                    return;
                }

                quickViewQuantity -= 1;

                if (quickViewQuantityInput) {
                    quickViewQuantityInput.value = String(quickViewQuantity);
                }
            });
        }

        if (quickViewPlusQty) {
            quickViewPlusQty.addEventListener("click", function () {
                quickViewQuantity += 1;

                if (quickViewQuantityInput) {
                    quickViewQuantityInput.value = String(quickViewQuantity);
                }
            });
        }

        if (quickViewQuantityInput) {
            quickViewQuantityInput.addEventListener("change", function () {
                quickViewQuantity = normalizeQuantity(quickViewQuantityInput.value);
                quickViewQuantityInput.value = String(quickViewQuantity);
            });
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
    }


    // 37. Khởi tạo trang danh mục
    async function initCategoryPage() {
        bindEvents();
        setViewMode("grid");
        renderCartDrawer();

        try {
            await loadProductsFromApi();
        } catch (error) {
            console.error(error);
            showErrorState();
        }
    }

    initCategoryPage();
});