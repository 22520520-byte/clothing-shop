// =========================================================
// File: Frontend/js/product-detail.js
// Mục đích: Trang chi tiết sản phẩm lấy dữ liệu thật từ API
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang chi tiết sản phẩm
    const productDetailPage = document.querySelector('[data-page="product-detail"]');
    const productDetailContainer = document.getElementById("productDetailPage");

    if (!productDetailPage && !productDetailContainer) {
        return;
    }


    // 2. Key localStorage
    const CART_STORAGE_KEY = "cart_items";
    const OLD_CART_STORAGE_KEY = "cart";
    const CHECKOUT_STORAGE_KEY = "checkout_items";
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const IS_LOGIN_STORAGE_KEY = "is_login";
    const WISHLIST_STORAGE_PREFIX = "wishlist_";


    // 3. Biến trạng thái
    let currentProduct = null;
    let selectedColor = "";
    let selectedColorId = "";
    let selectedSize = "";
    let selectedSizeId = "";
    let selectedVariant = null;
    let quantity = 1;


    // 4. Lấy DOM trạng thái trang
    const productDetailContent = document.getElementById("productDetailContent");
    const productDetailLoadingState = document.getElementById("productDetailLoadingState");
    const productDetailErrorState = document.getElementById("productDetailErrorState");


    // 5. Lấy DOM tìm kiếm
    const searchForm = document.getElementById("searchForm");
    const searchKeyword = document.getElementById("searchKeyword");


    // 6. Lấy DOM breadcrumb
    const breadcrumbCategoryLink = document.getElementById("breadcrumbCategoryLink");
    const breadcrumbProductName = document.getElementById("breadcrumbProductName");


    // 7. Lấy DOM gallery
    const galleryThumbs = document.getElementById("galleryThumbs");
    const galleryThumbTemplate = document.getElementById("galleryThumbTemplate");
    const mainProductImage = document.getElementById("mainProductImage");


    // 8. Lấy DOM thông tin sản phẩm
    const productStatus = document.getElementById("productStatus");
    const productName = document.getElementById("productName");
    const productStars = document.getElementById("productStars");
    const productRatingText = document.getElementById("productRatingText");
    const productCurrentPrice = document.getElementById("productCurrentPrice");
    const productOldPrice = document.getElementById("productOldPrice");
    const productSalePercent = document.getElementById("productSalePercent");
    const productShortDesc = document.getElementById("productShortDesc");


    // 9. Lấy DOM lựa chọn sản phẩm
    const colorList = document.getElementById("colorList");
    const colorItemTemplate = document.getElementById("colorItemTemplate");
    const sizeList = document.getElementById("sizeList");
    const sizeItemTemplate = document.getElementById("sizeItemTemplate");

    const minusQty = document.getElementById("minusQty");
    const plusQty = document.getElementById("plusQty");
    const quantityInput = document.getElementById("quantityInput");

    const addToCartBtn = document.getElementById("addToCartBtn");
    const buyNowBtn = document.getElementById("buyNowBtn");
    const wishlistBtn = document.getElementById("wishlistBtn");
    const shareBtn = document.getElementById("shareBtn");


    // 10. Lấy DOM mô tả / đánh giá
    const productDescription = document.getElementById("productDescription");
    const productMaterial = document.getElementById("productMaterial");
    const productReviewSummary = document.getElementById("productReviewSummary");
    const reviewList = document.getElementById("reviewList");
    const tabButtons = document.querySelectorAll(".tabBtn");
    const tabContents = document.querySelectorAll(".tabContent");


    // 11. Lấy DOM sản phẩm liên quan
    const relatedLoadingState = document.getElementById("relatedLoadingState");
    const relatedEmptyState = document.getElementById("relatedEmptyState");
    const relatedErrorState = document.getElementById("relatedErrorState");
    const relatedProductsList = document.getElementById("relatedProductsList");
    const relatedProductTemplate = document.getElementById("relatedProductTemplate");


    // 12. Lấy DOM size guide
    const openSizeGuide = document.getElementById("openSizeGuide");
    const closeSizeGuide = document.getElementById("closeSizeGuide");
    const sizeGuideOverlay = document.getElementById("sizeGuideOverlay");
    const sizeGuidePopup = document.getElementById("sizeGuidePopup");


    // 13. Gọi API
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


    // 14. Hàm tiện ích
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

    function getProductIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get("id") || "";
    }

    function getProductDetailUrl(productId) {
        if (!productId) {
            return "#";
        }

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

    function getLoginRedirectUrl() {
        const currentPath = "../html/product-detail.html?id=" + encodeURIComponent(currentProduct?.id || "");

        return "../html/login.html?redirect=" + encodeURIComponent(currentPath);
    }


    // 15. Đọc ghi localStorage
    function getDataFromStorage(key, fallbackValue) {
        const rawData = localStorage.getItem(key);

        if (!rawData) {
            return fallbackValue;
        }

        try {
            return JSON.parse(rawData);
        } catch (error) {
            console.error("Lỗi đọc localStorage:", error);
            return fallbackValue;
        }
    }

    function saveDataToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function getArrayFromStorage(key) {
        const data = getDataFromStorage(key, []);

        if (!Array.isArray(data)) {
            return [];
        }

        return data;
    }

    function getCartItemsFromStorage() {
        const cartItems = getArrayFromStorage(CART_STORAGE_KEY);

        if (cartItems.length > 0) {
            return cartItems;
        }

        const oldCartItems = getArrayFromStorage(OLD_CART_STORAGE_KEY);

        if (oldCartItems.length > 0) {
            saveDataToStorage(CART_STORAGE_KEY, oldCartItems);
            localStorage.removeItem(OLD_CART_STORAGE_KEY);
        }

        return oldCartItems;
    }

    function saveCartItemsToStorage(cartItems) {
        saveDataToStorage(CART_STORAGE_KEY, cartItems);
    }

    function saveCheckoutItemsToStorage(items) {
        saveDataToStorage(CHECKOUT_STORAGE_KEY, items);
    }


    // 16. Tài khoản và wishlist
    function getCurrentUser() {
        if (window.CustomerApi && typeof window.CustomerApi.getCurrentCustomerFromLocal === "function") {
            return window.CustomerApi.getCurrentCustomerFromLocal();
        }

        const isLogin = localStorage.getItem(IS_LOGIN_STORAGE_KEY) === "true";
        const userData = getDataFromStorage(CURRENT_USER_STORAGE_KEY, null);

        if (!isLogin || !userData) {
            return null;
        }

        if (typeof userData === "string") {
            return {
                id: userData,
                fullName: userData
            };
        }

        return userData;
    }

    function isUserLoggedIn() {
        return Boolean(getCurrentUser());
    }

    function getUserKey(user) {
        if (!user) {
            return "";
        }

        return (
            user.id ||
            user.userId ||
            user.email ||
            user.phone ||
            user.username ||
            user.fullName ||
            user.name ||
            "member"
        );
    }

    function getWishlistStorageKey() {
        const currentUser = getCurrentUser();
        const userKey = getUserKey(currentUser);

        if (!userKey) {
            return "";
        }

        return WISHLIST_STORAGE_PREFIX + userKey;
    }

    function getWishlistItemsFromStorage() {
        const wishlistKey = getWishlistStorageKey();

        if (!wishlistKey) {
            return [];
        }

        return getArrayFromStorage(wishlistKey);
    }

    function saveWishlistItemsToStorage(items) {
        const wishlistKey = getWishlistStorageKey();

        if (!wishlistKey) {
            return;
        }

        saveDataToStorage(wishlistKey, items);
    }

    function isProductInWishlist(productId) {
        const wishlistItems = getWishlistItemsFromStorage();

        return wishlistItems.some(function (item) {
            if (typeof item === "string") {
                return String(item) === String(productId);
            }

            return String(item.productId) === String(productId) || String(item.id) === String(productId);
        });
    }

    function createWishlistItem(product) {
        return {
            productId: product.id,
            id: product.id,
            name: product.name,
            price: Number(product.price || 0),
            oldPrice: Number(product.oldPrice || 0),
            image: product.image,
            inStock: product.inStock === false ? false : true,
            category: product.categorySlug,
            createdAt: new Date().toISOString()
        };
    }

    function updateWishlistButtonState(product) {
        if (!wishlistBtn || !product) {
            return;
        }

        const active = isUserLoggedIn() && isProductInWishlist(product.id);

        wishlistBtn.classList.toggle("active", active);
        wishlistBtn.dataset.active = active ? "true" : "false";
        wishlistBtn.title = active ? "Đã có trong yêu thích" : "Thêm vào yêu thích";

        const icon = wishlistBtn.querySelector("i");

        if (icon) {
            icon.className = active ? "fa-solid fa-heart" : "fa-regular fa-heart";
        }
    }

    function addProductToWishlist(product) {
        const wishlistItems = getWishlistItemsFromStorage();

        const existed = wishlistItems.some(function (item) {
            if (typeof item === "string") {
                return String(item) === String(product.id);
            }

            return String(item.productId) === String(product.id) || String(item.id) === String(product.id);
        });

        if (existed) {
            alert("Sản phẩm này đã có trong danh sách yêu thích.");
            updateWishlistButtonState(product);
            return;
        }

        wishlistItems.unshift(createWishlistItem(product));
        saveWishlistItemsToStorage(wishlistItems);
        updateWishlistButtonState(product);

        alert("Đã thêm \"" + product.name + "\" vào danh sách yêu thích.");
    }


    // 17. Trạng thái hiển thị
    function hideProductDetailStates() {
        if (productDetailLoadingState) productDetailLoadingState.hidden = true;
        if (productDetailErrorState) productDetailErrorState.hidden = true;
        if (productDetailContent) productDetailContent.hidden = true;
    }

    function showProductLoading() {
        hideProductDetailStates();

        if (productDetailLoadingState) {
            productDetailLoadingState.hidden = false;
        }
    }

    function showProductError() {
        hideProductDetailStates();

        if (productDetailErrorState) {
            productDetailErrorState.hidden = false;
        }
    }

    function showProductContent() {
        hideProductDetailStates();

        if (productDetailContent) {
            productDetailContent.hidden = false;
        }
    }

    function hideRelatedStates() {
        if (relatedLoadingState) relatedLoadingState.hidden = true;
        if (relatedEmptyState) relatedEmptyState.hidden = true;
        if (relatedErrorState) relatedErrorState.hidden = true;
        if (relatedProductsList) relatedProductsList.hidden = true;
    }

    function showRelatedLoading() {
        hideRelatedStates();

        if (relatedLoadingState) {
            relatedLoadingState.hidden = false;
        }
    }

    function showRelatedContent() {
        hideRelatedStates();

        if (relatedProductsList) {
            relatedProductsList.hidden = false;
        }
    }

    function showRelatedEmpty() {
        hideRelatedStates();

        if (relatedEmptyState) {
            relatedEmptyState.hidden = false;
        }
    }

    function showRelatedError() {
        hideRelatedStates();

        if (relatedErrorState) {
            relatedErrorState.hidden = false;
        }
    }


    // 18. Chuẩn hóa sản phẩm từ API
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

        const category = product.category || {};
        const parentCategory = product.parent_category || {};

        return {
            id: String(product.id),

            name: product.name || "Sản phẩm",
            brand: product.brand || "DUHU Shop",

            categoryId: category.id || product.category_id || "",
            categoryName: category.name || product.category_name || "Danh mục",
            categorySlug: category.slug || product.category_slug || "",
            categoryLink: "../html/category.html",

            parentCategoryName: parentCategory.name || "",

            shortDesc: product.short_description || "Chưa có mô tả ngắn.",
            description: product.description || product.short_description || "Nội dung mô tả sản phẩm sẽ được cập nhật tại đây.",
            material: product.material || "Nội dung chất liệu sẽ được cập nhật tại đây.",

            price: price,
            oldPrice: oldPrice,

            image: mainImage,
            images: imageList.length > 0 ? imageList : [mainImage],

            rating: Number(product.rating || 0),
            reviewCount: Number(product.review_count || 0),
            sold: Number(product.sold_quantity || product.sold || 0),

            inStock: Number(product.total_stock || 0) > 0,
            totalStock: Number(product.total_stock || 0),

            colors: colors,
            sizes: sizes,
            variants: variants,
            reviews: Array.isArray(product.reviews) ? product.reviews : [],

            raw: product
        };
    }

    function normalizeProductListItemFromApi(product) {
        const image = product.main_image || product.image_url || product.image || "../img/products/default.jpg";
        const price = Number(product.base_price || product.price || 0);
        const oldPrice = product.old_price !== null && product.old_price !== undefined
            ? Number(product.old_price || 0)
            : 0;

        return {
            id: String(product.id),
            name: product.name || "Sản phẩm",
            price: price,
            oldPrice: oldPrice,
            image: image,
            categoryName: product.category_name || "",
            categorySlug: product.category_slug || "",
            inStock: Number(product.total_stock || 0) > 0
        };
    }


    // 19. Render breadcrumb
    function renderBreadcrumb(product) {
        if (breadcrumbCategoryLink) {
            breadcrumbCategoryLink.href = product.categoryLink || "../html/home.html";
            breadcrumbCategoryLink.textContent = product.categoryName || "Danh mục";
        }

        if (breadcrumbProductName) {
            breadcrumbProductName.textContent = product.name;
        }
    }


    // 20. Render gallery
    function createGalleryThumb(imageUrl, product, index) {
        if (!galleryThumbTemplate) {
            return null;
        }

        const clone = galleryThumbTemplate.content.cloneNode(true);
        const button = clone.querySelector(".thumb");
        const image = clone.querySelector("img");

        if (button) {
            button.dataset.image = imageUrl;

            if (index === 0) {
                button.classList.add("active");
            }
        }

        if (image) {
            image.src = imageUrl;
            image.alt = product.name + " " + (index + 1);
        }

        return clone;
    }

    function renderGallery(product) {
        if (!galleryThumbs || !galleryThumbTemplate || !mainProductImage) {
            return;
        }

        const images = product.images && product.images.length > 0 ? product.images : [product.image];

        galleryThumbs.innerHTML = "";

        const fragment = document.createDocumentFragment();

        images.forEach(function (imageUrl, index) {
            const thumb = createGalleryThumb(imageUrl, product, index);

            if (thumb) {
                fragment.appendChild(thumb);
            }
        });

        galleryThumbs.appendChild(fragment);

        mainProductImage.src = images[0];
        mainProductImage.alt = product.name;
    }


    // 21. Render rating
    function renderRatingStars(rating) {
        if (!productStars) {
            return;
        }

        const roundedRating = Math.round(Number(rating || 0));

        productStars.innerHTML = "";

        for (let i = 1; i <= 5; i += 1) {
            const icon = document.createElement("i");

            if (i <= roundedRating) {
                icon.className = "fa-solid fa-star";
            } else {
                icon.className = "fa-regular fa-star";
            }

            productStars.appendChild(icon);
        }
    }


    // 22. Render thông tin chính
    function renderProductInfo(product) {
        const discount = calculateDiscountPercent(product.price, product.oldPrice);

        if (productStatus) {
            productStatus.textContent = product.inStock ? "Còn hàng" : "Hết hàng";
        }

        if (productName) {
            productName.textContent = product.name;
        }

        renderRatingStars(product.rating);

        if (productRatingText) {
            productRatingText.textContent = Number(product.rating || 0).toFixed(1) + " • " + Number(product.reviewCount || 0) + " đánh giá";
        }

        if (productCurrentPrice) {
            productCurrentPrice.textContent = formatPrice(product.price);
        }

        if (productOldPrice) {
            if (product.oldPrice && product.oldPrice > product.price) {
                productOldPrice.textContent = formatPrice(product.oldPrice);
                productOldPrice.hidden = false;
            } else {
                productOldPrice.textContent = "";
                productOldPrice.hidden = true;
            }
        }

        if (productSalePercent) {
            if (discount > 0) {
                productSalePercent.textContent = "Giảm " + discount + "%";
                productSalePercent.hidden = false;
            } else {
                productSalePercent.textContent = "";
                productSalePercent.hidden = true;
            }
        }

        if (productShortDesc) {
            productShortDesc.textContent = product.shortDesc;
        }

        if (productDescription) {
            productDescription.textContent = product.description;
        }

        if (productMaterial) {
            productMaterial.textContent = product.material;
        }

        if (productReviewSummary) {
            productReviewSummary.textContent = product.reviewCount > 0
                ? "Có " + product.reviewCount + " đánh giá cho sản phẩm này."
                : "Chưa có đánh giá nào cho sản phẩm này.";
        }
    }


    // 23. Render màu sắc
    function renderColors(product) {
        if (!colorList || !colorItemTemplate) {
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

        selectedColor = colors[0].name;
        selectedColorId = colors[0].id || "";

        colorList.innerHTML = "";

        const fragment = document.createDocumentFragment();

        colors.forEach(function (color, index) {
            const clone = colorItemTemplate.content.cloneNode(true);
            const button = clone.querySelector(".colorItem");

            if (button) {
                button.dataset.colorId = color.id || "";
                button.dataset.colorName = color.name;
                button.dataset.colorValue = color.value || "#111111";
                button.title = color.name;
                button.setAttribute("aria-label", color.name);
                button.style.background = color.value || "#111111";

                if (index === 0) {
                    button.classList.add("active");
                }
            }

            fragment.appendChild(clone);
        });

        colorList.appendChild(fragment);
    }


    // 24. Render size
    function renderSizes(product) {
        if (!sizeList || !sizeItemTemplate) {
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

        selectedSize = sizes[0].name;
        selectedSizeId = sizes[0].id || "";

        sizeList.innerHTML = "";

        const fragment = document.createDocumentFragment();

        sizes.forEach(function (size, index) {
            const clone = sizeItemTemplate.content.cloneNode(true);
            const button = clone.querySelector(".sizeItem");

            if (button) {
                button.dataset.sizeId = size.id || "";
                button.dataset.size = size.name;
                button.textContent = size.name;

                if (index === 0) {
                    button.classList.add("active");
                }
            }

            fragment.appendChild(clone);
        });

        sizeList.appendChild(fragment);
    }


    // 25. Tìm biến thể đang chọn
    function getSelectedVariant() {
        if (!currentProduct || !Array.isArray(currentProduct.variants)) {
            return null;
        }

        return currentProduct.variants.find(function (variant) {
            return (
                String(variant.colorId || "") === String(selectedColorId || "") &&
                String(variant.sizeId || "") === String(selectedSizeId || "")
            );
        }) || null;
    }

    function updateSelectedVariantState() {
        selectedVariant = getSelectedVariant();

        const hasVariants = currentProduct && currentProduct.variants.length > 0;
        const isAvailable = !hasVariants || (selectedVariant && selectedVariant.stockQuantity > 0);

        if (productStatus) {
            productStatus.textContent = isAvailable ? "Còn hàng" : "Hết hàng";
        }

        if (addToCartBtn) {
            addToCartBtn.disabled = !isAvailable;
        }

        if (buyNowBtn) {
            buyNowBtn.disabled = !isAvailable;
        }
    }


    // 26. Render đánh giá
    function renderReviews(product) {
        if (!reviewList) {
            return;
        }

        const reviews = product.reviews || [];

        reviewList.innerHTML = "";

        if (reviews.length === 0) {
            const emptyText = document.createElement("p");

            emptyText.textContent = "Chưa có đánh giá nào cho sản phẩm này.";
            reviewList.appendChild(emptyText);
            return;
        }

        reviews.forEach(function (review) {
            const item = document.createElement("div");

            item.className = "reviewItem";
            item.innerHTML = `
                <strong>${review.author || "Khách hàng"}</strong>
                <p>${review.content || ""}</p>
            `;

            reviewList.appendChild(item);
        });
    }


    // 27. Render toàn bộ chi tiết
    function renderProductDetail(product) {
        currentProduct = product;
        quantity = 1;

        if (quantityInput) {
            quantityInput.value = "1";
        }

        renderBreadcrumb(product);
        renderGallery(product);
        renderProductInfo(product);
        renderColors(product);
        renderSizes(product);
        renderReviews(product);
        updateWishlistButtonState(product);
        updateSelectedVariantState();
        showProductContent();
    }


    // 28. Render sản phẩm liên quan
    function createRelatedProductItem(product) {
        if (!relatedProductTemplate) {
            return null;
        }

        const clone = relatedProductTemplate.content.cloneNode(true);

        const productLink = clone.querySelector('[data-role="related-product-link"]');
        const productImage = clone.querySelector('[data-role="related-product-image"]');
        const productNameElement = clone.querySelector('[data-role="related-product-name"]');
        const productPrice = clone.querySelector('[data-role="related-product-price"]');
        const productOldPrice = clone.querySelector('[data-role="related-product-old-price"]');

        const detailUrl = getProductDetailUrl(product.id);

        if (productLink) {
            productLink.href = detailUrl;
        }

        if (productImage) {
            productImage.src = product.image;
            productImage.alt = product.name;
        }

        if (productNameElement) {
            productNameElement.textContent = product.name;
        }

        if (productPrice) {
            productPrice.textContent = formatPrice(product.price);
        }

        if (productOldPrice) {
            if (product.oldPrice && product.oldPrice > product.price) {
                productOldPrice.textContent = formatPrice(product.oldPrice);
                productOldPrice.hidden = false;
            } else {
                productOldPrice.textContent = "";
                productOldPrice.hidden = true;
            }
        }

        return clone;
    }

    async function loadRelatedProducts(product) {
        if (!relatedProductsList || !relatedProductTemplate) {
            return;
        }

        showRelatedLoading();

        try {
            let endpoint = "products/get-products.php?page=1&limit=8&sort=latest";

            if (product.categoryId) {
                endpoint += "&category_id=" + encodeURIComponent(product.categoryId);
            }

            const response = await getApi(endpoint);
            const data = response.data || {};

            const relatedProducts = Array.isArray(data.products)
                ? data.products
                    .map(normalizeProductListItemFromApi)
                    .filter(function (item) {
                        return String(item.id) !== String(product.id);
                    })
                    .slice(0, 4)
                : [];

            relatedProductsList.innerHTML = "";

            if (relatedProducts.length === 0) {
                showRelatedEmpty();
                return;
            }

            const fragment = document.createDocumentFragment();

            relatedProducts.forEach(function (item) {
                const relatedItem = createRelatedProductItem(item);

                if (relatedItem) {
                    fragment.appendChild(relatedItem);
                }
            });

            relatedProductsList.appendChild(fragment);
            showRelatedContent();
        } catch (error) {
            console.error(error);
            showRelatedError();
        }
    }


    // 29. Load sản phẩm từ API
    async function loadProductDetailFromApi() {
        const productId = getProductIdFromUrl();

        if (!productId) {
            showProductError();
            return;
        }

        showProductLoading();

        try {
            const response = await getApi(
                "products/get-product-detail.php?id=" + encodeURIComponent(productId)
            );

            const product = response.data && response.data.product
                ? normalizeProductDetailFromApi(response.data.product)
                : null;

            if (!product) {
                showProductError();
                return;
            }

            renderProductDetail(product);
            await loadRelatedProducts(product);
        } catch (error) {
            console.error(error);
            showProductError();
        }
    }


    // 30. Tạo item giỏ hàng
    function createCartItem(product) {
        const variant = selectedVariant || getSelectedVariant();

        return {
            cartItemId: createCartItemId(product.id, selectedSize, selectedColor),

            id: product.id,
            productId: product.id,
            product_id: product.id,

            variantId: variant ? variant.id : null,
            productVariantId: variant ? variant.id : null,
            product_variant_id: variant ? variant.id : null,

            name: product.name,
            price: variant && variant.price ? Number(variant.price) : Number(product.price || 0),
            oldPrice: Number(product.oldPrice || 0),

            image: product.image,

            meta: "Màu: " + selectedColor + " / Size: " + selectedSize,
            color: selectedColor,
            colorId: selectedColorId,
            size: selectedSize,
            sizeId: selectedSizeId,

            quantity: normalizeQuantity(quantity),
            selected: true
        };
    }

    function addCurrentProductToCart() {
        if (!currentProduct) {
            return false;
        }

        const hasVariants = currentProduct.variants.length > 0;
        const variant = selectedVariant || getSelectedVariant();

        if (hasVariants && !variant) {
            alert("Vui lòng chọn đúng màu và size còn tồn tại.");
            return false;
        }

        if (variant && variant.stockQuantity <= 0) {
            alert("Phân loại này hiện đã hết hàng.");
            return false;
        }

        const cartItems = getCartItemsFromStorage();
        const newItem = createCartItem(currentProduct);

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


    // 31. Xử lý nút thêm vào giỏ / mua ngay
    function handleAddToCart() {
        const isAdded = addCurrentProductToCart();

        if (!isAdded) {
            return;
        }

        alert("Đã thêm \"" + currentProduct.name + "\" vào giỏ hàng.");
    }

    function handleBuyNow() {
        if (!currentProduct) {
            return;
        }

        const hasVariants = currentProduct.variants.length > 0;
        const variant = selectedVariant || getSelectedVariant();

        if (hasVariants && !variant) {
            alert("Vui lòng chọn đúng màu và size còn tồn tại.");
            return;
        }

        if (variant && variant.stockQuantity <= 0) {
            alert("Phân loại này hiện đã hết hàng.");
            return;
        }

        const checkoutItem = createCartItem(currentProduct);

        saveCheckoutItemsToStorage([checkoutItem]);

        window.location.href = "../html/checkout.html?mode=buy-now";
    }


    // 32. Xử lý wishlist
    function handleWishlist() {
        if (!currentProduct) {
            return;
        }

        if (!isUserLoggedIn()) {
            const isConfirm = confirm("Bạn cần đăng nhập để thêm sản phẩm yêu thích. Chuyển đến trang đăng nhập?");

            if (isConfirm) {
                window.location.href = getLoginRedirectUrl();
            }

            return;
        }

        addProductToWishlist(currentProduct);
    }


    // 33. Xử lý chia sẻ
    function handleShare() {
        const shareUrl = window.location.href;

        if (navigator.share) {
            navigator.share({
                title: currentProduct ? currentProduct.name : "Sản phẩm",
                url: shareUrl
            });

            return;
        }

        navigator.clipboard?.writeText(shareUrl);
        alert("Đã sao chép liên kết sản phẩm.");
    }


    // 34. Xử lý chọn ảnh / màu / size
    function handleGalleryClick(event) {
        const thumbButton = event.target.closest(".thumb");

        if (!thumbButton || !mainProductImage) {
            return;
        }

        const imageUrl = thumbButton.dataset.image;

        galleryThumbs.querySelectorAll(".thumb").forEach(function (thumb) {
            thumb.classList.remove("active");
        });

        thumbButton.classList.add("active");

        mainProductImage.src = imageUrl;
    }

    function handleColorClick(event) {
        const colorButton = event.target.closest(".colorItem");

        if (!colorButton) {
            return;
        }

        selectedColor = colorButton.dataset.colorName || "";
        selectedColorId = colorButton.dataset.colorId || "";

        colorList.querySelectorAll(".colorItem").forEach(function (button) {
            button.classList.remove("active");
        });

        colorButton.classList.add("active");

        updateSelectedVariantState();
    }

    function handleSizeClick(event) {
        const sizeButton = event.target.closest(".sizeItem");

        if (!sizeButton) {
            return;
        }

        selectedSize = sizeButton.dataset.size || "";
        selectedSizeId = sizeButton.dataset.sizeId || "";

        sizeList.querySelectorAll(".sizeItem").forEach(function (button) {
            button.classList.remove("active");
        });

        sizeButton.classList.add("active");

        updateSelectedVariantState();
    }


    // 35. Xử lý số lượng
    function renderQuantity() {
        if (quantityInput) {
            quantityInput.value = String(quantity);
        }
    }

    function decreaseQuantity() {
        if (quantity <= 1) {
            return;
        }

        quantity -= 1;
        renderQuantity();
    }

    function increaseQuantity() {
        quantity += 1;
        renderQuantity();
    }

    function updateQuantityFromInput() {
        quantity = normalizeQuantity(quantityInput?.value || 1);
        renderQuantity();
    }


    // 36. Xử lý tab
    function handleTabClick(event) {
        const button = event.currentTarget;
        const tabName = button.dataset.tab;

        tabButtons.forEach(function (tabButton) {
            tabButton.classList.remove("active");
        });

        tabContents.forEach(function (tabContent) {
            tabContent.classList.remove("active");
        });

        button.classList.add("active");

        const activeContent = document.querySelector('[data-tab-content="' + tabName + '"]');

        if (activeContent) {
            activeContent.classList.add("active");
        }
    }


    // 37. Size guide
    function openSizeGuidePopup() {
        if (sizeGuideOverlay) {
            sizeGuideOverlay.hidden = false;
            sizeGuideOverlay.classList.add("show");
        }

        if (sizeGuidePopup) {
            sizeGuidePopup.hidden = false;
            sizeGuidePopup.classList.add("show");
        }

        document.body.style.overflow = "hidden";
    }

    function closeSizeGuidePopup() {
        if (sizeGuideOverlay) {
            sizeGuideOverlay.classList.remove("show");
            sizeGuideOverlay.hidden = true;
        }

        if (sizeGuidePopup) {
            sizeGuidePopup.classList.remove("show");
            sizeGuidePopup.hidden = true;
        }

        document.body.style.overflow = "";
    }


    // 38. Tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword ? searchKeyword.value.trim() : "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 39. Gắn sự kiện
    function bindEvents() {
        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }

        if (galleryThumbs) {
            galleryThumbs.addEventListener("click", handleGalleryClick);
        }

        if (colorList) {
            colorList.addEventListener("click", handleColorClick);
        }

        if (sizeList) {
            sizeList.addEventListener("click", handleSizeClick);
        }

        if (minusQty) {
            minusQty.addEventListener("click", decreaseQuantity);
        }

        if (plusQty) {
            plusQty.addEventListener("click", increaseQuantity);
        }

        if (quantityInput) {
            quantityInput.addEventListener("change", updateQuantityFromInput);
        }

        if (addToCartBtn) {
            addToCartBtn.addEventListener("click", handleAddToCart);
        }

        if (buyNowBtn) {
            buyNowBtn.addEventListener("click", handleBuyNow);
        }

        if (wishlistBtn) {
            wishlistBtn.addEventListener("click", handleWishlist);
        }

        if (shareBtn) {
            shareBtn.addEventListener("click", handleShare);
        }

        tabButtons.forEach(function (button) {
            button.addEventListener("click", handleTabClick);
        });

        if (openSizeGuide) {
            openSizeGuide.addEventListener("click", openSizeGuidePopup);
        }

        if (closeSizeGuide) {
            closeSizeGuide.addEventListener("click", closeSizeGuidePopup);
        }

        if (sizeGuideOverlay) {
            sizeGuideOverlay.addEventListener("click", closeSizeGuidePopup);
        }

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeSizeGuidePopup();
            }
        });
    }


    // 40. Khởi tạo trang chi tiết sản phẩm
    async function initProductDetailPage() {
        bindEvents();
        await loadProductDetailFromApi();
    }

    initProductDetailPage();
});