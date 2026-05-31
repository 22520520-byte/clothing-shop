// 1. Chờ HTML tải xong

document.addEventListener("DOMContentLoaded", function () {
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

    // 3. Dữ liệu sản phẩm tạm thời

    const products = [
        {
            id: "hd001",
            category: "hoodie",
            categoryName: "Áo dài tay",
            categoryLink: "../html/ao-tay-dai.html",
            name: "Áo Hoodie Basic Cotton",
            shortDesc: "Áo hoodie basic dễ phối đồ, chất vải mềm, giữ form tốt, phù hợp mặc hằng ngày.",
            description: `
                <p>Thiết kế tối giản, hiện đại, phù hợp cho nhiều phong cách khác nhau.</p>
                <p>Form rộng thoải mái, dễ phối cùng quần jean, quần jogger hoặc quần short.</p>
                <ul>
                    <li>Form: Oversize</li>
                    <li>Phong cách: Basic / Daily wear</li>
                    <li>Phù hợp: Đi học, đi chơi, mặc hằng ngày</li>
                </ul>
            `,
            material: `
                <p>Chất liệu cotton pha nỉ nhẹ, mềm tay, thoáng và giữ ấm vừa phải.</p>
                <ul>
                    <li>Co giãn nhẹ</li>
                    <li>Ít nhăn</li>
                    <li>Dễ giặt, nhanh khô</li>
                </ul>
            `,
            price: 329000,
            oldPrice: 399000,
            image: "../img/hoodie-1.jpg",
            images: [
                "../img/hoodie-1.jpg",
                "../img/hoodie-1.jpg",
                "../img/hoodie-1.jpg"
            ],
            rating: 4.8,
            reviewCount: 12,
            sold: 120,
            inStock: true,
            colors: [
                { name: "Đen", value: "#111111" },
                { name: "Xám", value: "#888888" }
            ],
            sizes: ["M", "L", "XL"],
            reviews: [
                { author: "Nguyễn Minh", content: "Form đẹp, mặc khá thoải mái." },
                { author: "Trần Phúc", content: "Chất vải ổn, giao hàng nhanh." }
            ]
        },
        {
            id: "hd002",
            category: "hoodie",
            categoryName: "Áo dài tay",
            categoryLink: "../html/ao-tay-dai.html",
            name: "Áo Hoodie Urban Style",
            shortDesc: "Mẫu hoodie trẻ trung, dễ mặc, tông màu trung tính phù hợp nhiều phong cách.",
            description: `
                <p>Thiết kế hướng streetwear hiện đại, form vừa, dễ mặc.</p>
                <p>Phần mũ và thân áo giữ cấu trúc tốt, tạo cảm giác gọn gàng.</p>
            `,
            material: `
                <p>Cotton pha polyester giúp áo đứng form và bền hơn trong quá trình sử dụng.</p>
            `,
            price: 289000,
            oldPrice: 0,
            image: "../img/hoodie-2.jpg",
            images: [
                "../img/hoodie-2.jpg",
                "../img/hoodie-2.jpg"
            ],
            rating: 4.5,
            reviewCount: 8,
            sold: 80,
            inStock: true,
            colors: [
                { name: "Xám", value: "#888888" }
            ],
            sizes: ["S", "M", "L"],
            reviews: [
                { author: "Khánh", content: "Áo đẹp, đúng hình." }
            ]
        },
        {
            id: "hd003",
            category: "hoodie",
            categoryName: "Áo dài tay",
            categoryLink: "../html/ao-tay-dai.html",
            name: "Áo Hoodie Local Street",
            shortDesc: "Thiết kế đậm chất local street, form rộng, phù hợp phong cách năng động.",
            description: `
                <p>Chi tiết đơn giản nhưng nổi bật, phù hợp với phong cách trẻ trung.</p>
            `,
            material: `
                <p>Chất vải dày vừa, mềm và có độ bền tốt.</p>
            `,
            price: 359000,
            oldPrice: 429000,
            image: "../img/hoodie-3.jpg",
            images: [
                "../img/hoodie-3.jpg",
                "../img/hoodie-3.jpg"
            ],
            rating: 4.9,
            reviewCount: 15,
            sold: 95,
            inStock: true,
            colors: [
                { name: "Kem", value: "#e9dcc7" },
                { name: "Nâu", value: "#6f4e37" }
            ],
            sizes: ["M", "L"],
            reviews: [
                { author: "Anh Tú", content: "Rất ưng form áo." }
            ]
        },
        {
            id: "hd004",
            category: "hoodie",
            categoryName: "Áo dài tay",
            categoryLink: "../html/ao-tay-dai.html",
            name: "Áo Hoodie Minimal",
            shortDesc: "Hoodie phong cách tối giản, dễ phối đồ và thích hợp sử dụng hằng ngày.",
            description: `
                <p>Mẫu hoodie tối giản, ưu tiên sự gọn gàng và tiện dụng.</p>
            `,
            material: `
                <p>Vải mềm, co giãn nhẹ, thoải mái khi mặc.</p>
            `,
            price: 259000,
            oldPrice: 0,
            image: "../img/hoodie-4.jpg",
            images: [
                "../img/hoodie-4.jpg"
            ],
            rating: 4.3,
            reviewCount: 5,
            sold: 60,
            inStock: true,
            colors: [
                { name: "Navy", value: "#243b6b" }
            ],
            sizes: ["S", "M", "L"],
            reviews: []
        },
        {
            id: "hd005",
            category: "hoodie",
            categoryName: "Áo dài tay",
            categoryLink: "../html/ao-tay-dai.html",
            name: "Áo Hoodie Zipper Classic",
            shortDesc: "Phiên bản hoodie khóa kéo tiện dụng, phù hợp thời tiết se lạnh.",
            description: `
                <p>Thiết kế khóa kéo trước giúp dễ mặc, dễ phối layer.</p>
            `,
            material: `
                <p>Chất vải pha cotton giữ ấm tốt, bề mặt mềm.</p>
            `,
            price: 315000,
            oldPrice: 375000,
            image: "../img/hoodie-5.jpg",
            images: [
                "../img/hoodie-5.jpg"
            ],
            rating: 4.6,
            reviewCount: 10,
            sold: 140,
            inStock: true,
            colors: [
                { name: "Trắng", value: "#f3f3f3" }
            ],
            sizes: ["M", "L", "XL"],
            reviews: []
        },
        {
            id: "hd006",
            category: "hoodie",
            categoryName: "Áo dài tay",
            categoryLink: "../html/ao-tay-dai.html",
            name: "Áo Hoodie Sport Daily",
            shortDesc: "Mẫu hoodie thể thao, mặc hằng ngày thoải mái và gọn gàng.",
            description: `
                <p>Thiết kế hướng thể thao nhẹ, dễ dùng trong sinh hoạt hằng ngày.</p>
            `,
            material: `
                <p>Vải thoáng, nhẹ, phù hợp mặc thường xuyên.</p>
            `,
            price: 219000,
            oldPrice: 0,
            image: "../img/hoodie-6.jpg",
            images: [
                "../img/hoodie-6.jpg"
            ],
            rating: 4.2,
            reviewCount: 4,
            sold: 72,
            inStock: false,
            colors: [
                { name: "Nâu", value: "#7b5a45" }
            ],
            sizes: ["M", "L"],
            reviews: []
        }
    ];

    // 4. Biến trạng thái

    let currentProduct = null;
    let selectedColor = "";
    let selectedSize = "";
    let quantity = 1;

    // 5. Lấy DOM trạng thái trang

    const productDetailContent = document.getElementById("productDetailContent");
    const productDetailLoadingState = document.getElementById("productDetailLoadingState");
    const productDetailErrorState = document.getElementById("productDetailErrorState");

    // 6. Lấy DOM tìm kiếm

    const searchForm = document.getElementById("searchForm");
    const searchKeyword = document.getElementById("searchKeyword");

    // 7. Lấy DOM breadcrumb

    const breadcrumbCategoryLink = document.getElementById("breadcrumbCategoryLink");
    const breadcrumbProductName = document.getElementById("breadcrumbProductName");

    // 8. Lấy DOM gallery

    const galleryThumbs = document.getElementById("galleryThumbs");
    const galleryThumbTemplate = document.getElementById("galleryThumbTemplate");
    const mainProductImage = document.getElementById("mainProductImage");

    // 9. Lấy DOM thông tin sản phẩm

    const productStatus = document.getElementById("productStatus");
    const productName = document.getElementById("productName");
    const productStars = document.getElementById("productStars");
    const productRatingText = document.getElementById("productRatingText");
    const productCurrentPrice = document.getElementById("productCurrentPrice");
    const productOldPrice = document.getElementById("productOldPrice");
    const productSalePercent = document.getElementById("productSalePercent");
    const productShortDesc = document.getElementById("productShortDesc");

    // 10. Lấy DOM lựa chọn sản phẩm

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

    // 11. Lấy DOM mô tả / đánh giá

    const productDescription = document.getElementById("productDescription");
    const productMaterial = document.getElementById("productMaterial");
    const productReviewSummary = document.getElementById("productReviewSummary");
    const reviewList = document.getElementById("reviewList");

    const tabButtons = document.querySelectorAll(".tabBtn");
    const tabContents = document.querySelectorAll(".tabContent");

    // 12. Lấy DOM sản phẩm liên quan

    const relatedLoadingState = document.getElementById("relatedLoadingState");
    const relatedEmptyState = document.getElementById("relatedEmptyState");
    const relatedErrorState = document.getElementById("relatedErrorState");
    const relatedProductsList = document.getElementById("relatedProductsList");
    const relatedProductTemplate = document.getElementById("relatedProductTemplate");

    // 13. Lấy DOM size guide

    const openSizeGuide = document.getElementById("openSizeGuide");
    const closeSizeGuide = document.getElementById("closeSizeGuide");
    const sizeGuideOverlay = document.getElementById("sizeGuideOverlay");
    const sizeGuidePopup = document.getElementById("sizeGuidePopup");

    // 14. Hàm tiện ích

    function formatPrice(price) {
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

    function getProductById(productId) {
        return products.find(function (product) {
            return product.id === productId;
        });
    }

    function getCurrentProduct() {
        const productId = getProductIdFromUrl();

        if (!productId) {
            return products[0];
        }

        return getProductById(productId);
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
                return item === productId;
            }

            return item.productId === productId || item.id === productId;
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
            category: product.category,
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
                return item === product.id;
            }

            return item.productId === product.id || item.id === product.id;
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

    // 18. Render breadcrumb

    function renderBreadcrumb(product) {
        if (breadcrumbCategoryLink) {
            breadcrumbCategoryLink.href = product.categoryLink;
            breadcrumbCategoryLink.textContent = product.categoryName;
        }

        if (breadcrumbProductName) {
            breadcrumbProductName.textContent = product.name;
        }
    }

    // 19. Render gallery

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

        const images = product.images && product.images.length > 0
            ? product.images
            : [product.image];

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

    // 20. Render rating

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

    // 21. Render màu sắc

    function createColorButton(color, index) {
        let button;

        if (colorItemTemplate) {
            const clone = colorItemTemplate.content.cloneNode(true);
            button = clone.querySelector(".colorItem");
        } else {
            button = document.createElement("button");
            button.className = "colorItem";
            button.type = "button";
        }

        if (!button) {
            return null;
        }

        button.title = color.name;
        button.setAttribute("aria-label", color.name);
        button.dataset.colorName = color.name;
        button.dataset.colorValue = color.value;
        button.style.background = color.value;

        if (index === 0) {
            button.classList.add("active");
        }

        return button;
    }

    function renderColors(product) {
        if (!colorList) {
            return;
        }

        const colors = product.colors && product.colors.length > 0
            ? product.colors
            : [{ name: "Mặc định", value: "#111111" }];

        selectedColor = colors[0].name;
        colorList.innerHTML = "";

        const fragment = document.createDocumentFragment();

        colors.forEach(function (color, index) {
            const button = createColorButton(color, index);

            if (button) {
                fragment.appendChild(button);
            }
        });

        colorList.appendChild(fragment);
    }

    // 22. Render size

    function createSizeButton(size, index) {
        let button;

        if (sizeItemTemplate) {
            const clone = sizeItemTemplate.content.cloneNode(true);
            button = clone.querySelector(".sizeItem");
        } else {
            button = document.createElement("button");
            button.className = "sizeItem";
            button.type = "button";
        }

        if (!button) {
            return null;
        }

        button.textContent = size;
        button.dataset.size = size;

        if (index === 0) {
            button.classList.add("active");
        }

        return button;
    }

    function renderSizes(product) {
        if (!sizeList) {
            return;
        }

        const sizes = product.sizes && product.sizes.length > 0
            ? product.sizes
            : ["M"];

        selectedSize = sizes[0];
        sizeList.innerHTML = "";

        const fragment = document.createDocumentFragment();

        sizes.forEach(function (size, index) {
            const button = createSizeButton(size, index);

            if (button) {
                fragment.appendChild(button);
            }
        });

        sizeList.appendChild(fragment);
    }

    // 23. Render thông tin sản phẩm

    function renderProductInfo(product) {
        const discountPercent = calculateDiscountPercent(product.price, product.oldPrice);

        if (productDetailContainer) {
            productDetailContainer.dataset.productId = product.id;
        }

        if (productStatus) {
            productStatus.textContent = product.inStock ? "Còn hàng" : "Hết hàng";
            productStatus.classList.toggle("outOfStock", !product.inStock);
        }

        if (productName) {
            productName.textContent = product.name;
        }

        if (productRatingText) {
            productRatingText.textContent =
                Number(product.rating || 0).toFixed(1) +
                " • " +
                Number(product.reviewCount || 0) +
                " đánh giá";
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
            if (discountPercent > 0) {
                productSalePercent.textContent = "-" + discountPercent + "%";
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
            productDescription.innerHTML = product.description;
        }

        if (productMaterial) {
            productMaterial.innerHTML = product.material;
        }

        if (addToCartBtn) {
            addToCartBtn.disabled = !product.inStock;
        }

        if (buyNowBtn) {
            buyNowBtn.disabled = !product.inStock;
        }

        updateWishlistButtonState(product);

        document.title = product.name;
    }

    // 24. Render đánh giá

    function renderReviews(product) {
        if (productReviewSummary) {
            if (product.reviews && product.reviews.length > 0) {
                productReviewSummary.innerHTML =
                    "<p>" +
                    Number(product.rating || 0).toFixed(1) +
                    " / 5 • " +
                    Number(product.reviewCount || 0) +
                    " đánh giá</p>";
            } else {
                productReviewSummary.innerHTML = "<p>Chưa có đánh giá nào cho sản phẩm này.</p>";
            }
        }

        if (!reviewList) {
            return;
        }

        reviewList.innerHTML = "";

        if (!product.reviews || product.reviews.length === 0) {
            return;
        }

        product.reviews.forEach(function (review) {
            const reviewItem = document.createElement("div");
            reviewItem.className = "reviewItem";

            reviewItem.innerHTML = `
                <strong>${review.author}</strong>
                <p>${review.content}</p>
            `;

            reviewList.appendChild(reviewItem);
        });
    }

    // 25. Render sản phẩm liên quan

    function createRelatedProductElement(product) {
        if (!relatedProductTemplate) {
            return null;
        }

        const clone = relatedProductTemplate.content.cloneNode(true);

        const article = clone.querySelector(".relatedCard");
        const thumbLink = clone.querySelector('[data-role="related-link"]');
        const image = clone.querySelector('[data-role="related-image"]');
        const nameLink = clone.querySelector('[data-role="related-link-text"]');
        const currentPrice = clone.querySelector('[data-role="related-price-current"]');
        const oldPrice = clone.querySelector('[data-role="related-price-old"]');

        const detailUrl = getProductDetailUrl(product.id);

        if (article) {
            article.dataset.productId = product.id;
        }

        if (thumbLink) {
            thumbLink.href = detailUrl;
        }

        if (image) {
            image.src = product.image;
            image.alt = product.name;
        }

        if (nameLink) {
            nameLink.href = detailUrl;
            nameLink.textContent = product.name;
        }

        if (currentPrice) {
            currentPrice.textContent = formatPrice(product.price);
        }

        if (oldPrice) {
            if (product.oldPrice && product.oldPrice > product.price) {
                oldPrice.textContent = formatPrice(product.oldPrice);
                oldPrice.hidden = false;
            } else {
                oldPrice.textContent = "";
                oldPrice.hidden = true;
            }
        }

        return clone;
    }

    function renderRelatedProducts(product) {
        if (!relatedProductsList || !relatedProductTemplate) {
            return;
        }

        const relatedProducts = products
            .filter(function (item) {
                return item.category === product.category && item.id !== product.id;
            })
            .slice(0, 4);

        relatedProductsList.innerHTML = "";

        if (relatedProducts.length === 0) {
            showRelatedEmpty();
            return;
        }

        const fragment = document.createDocumentFragment();

        relatedProducts.forEach(function (item) {
            const relatedProductElement = createRelatedProductElement(item);

            if (relatedProductElement) {
                fragment.appendChild(relatedProductElement);
            }
        });

        relatedProductsList.appendChild(fragment);
        showRelatedContent();
    }

    // 26. Render toàn bộ sản phẩm

    function resetProductSelection() {
        quantity = 1;

        if (quantityInput) {
            quantityInput.value = quantity;
        }
    }

    function renderProductDetail(product) {
        renderBreadcrumb(product);
        renderGallery(product);
        renderRatingStars(product.rating);
        renderColors(product);
        renderSizes(product);
        renderProductInfo(product);
        renderReviews(product);
        renderRelatedProducts(product);
        resetProductSelection();
    }

    // 27. Tạo dữ liệu giỏ hàng / checkout

    function createOrderItem(product) {
        return {
            cartItemId: createCartItemId(product.id, selectedSize, selectedColor),
            id: product.id,
            name: product.name,
            price: Number(product.price || 0),
            oldPrice: Number(product.oldPrice || 0),
            image: product.image,
            meta: "Màu: " + selectedColor + " / Size: " + selectedSize,
            color: selectedColor,
            size: selectedSize,
            quantity: normalizeQuantity(quantity),
            selected: true
        };
    }

    function addProductToCart(product) {
        const cartItems = getCartItemsFromStorage();
        const newItem = createOrderItem(product);

        const existingItem = cartItems.find(function (item) {
            return item.id === newItem.id &&
                item.size === newItem.size &&
                item.color === newItem.color;
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
    }

    function buyProductNow(product) {
        const checkoutItem = createOrderItem(product);

        saveCheckoutItemsToStorage([checkoutItem]);

        window.location.href = "../html/checkout.html?mode=buy-now";
    }

    // 28. Xử lý chọn màu / size / số lượng

    function handleGalleryClick(event) {
        const thumb = event.target.closest(".thumb");

        if (!thumb || !mainProductImage || !galleryThumbs) {
            return;
        }

        const imageUrl = thumb.dataset.image;

        if (!imageUrl) {
            return;
        }

        mainProductImage.src = imageUrl;
        mainProductImage.alt = currentProduct.name;

        galleryThumbs.querySelectorAll(".thumb").forEach(function (item) {
            item.classList.remove("active");
        });

        thumb.classList.add("active");
    }

    function handleColorClick(event) {
        const button = event.target.closest(".colorItem");

        if (!button || button.classList.contains("disabled")) {
            return;
        }

        selectedColor = button.dataset.colorName || "";

        colorList.querySelectorAll(".colorItem").forEach(function (item) {
            item.classList.remove("active");
        });

        button.classList.add("active");
    }

    function handleSizeClick(event) {
        const button = event.target.closest("button");

        if (!button || button.classList.contains("disabled")) {
            return;
        }

        selectedSize = button.dataset.size || "";

        sizeList.querySelectorAll("button").forEach(function (item) {
            item.classList.remove("active");
        });

        button.classList.add("active");
    }

    function renderQuantityInput() {
        if (quantityInput) {
            quantityInput.value = quantity;
        }
    }

    function decreaseQuantity() {
        if (quantity <= 1) {
            return;
        }

        quantity -= 1;
        renderQuantityInput();
    }

    function increaseQuantity() {
        quantity += 1;
        renderQuantityInput();
    }

    function handleQuantityInputChange() {
        quantity = normalizeQuantity(quantityInput?.value || 1);
        renderQuantityInput();
    }

    // 29. Xử lý thêm giỏ hàng / mua ngay

    function handleAddToCart() {
        if (!currentProduct || !currentProduct.inStock) {
            alert("Sản phẩm hiện đã hết hàng.");
            return;
        }

        addProductToCart(currentProduct);

        alert("Đã thêm sản phẩm vào giỏ hàng.");
    }

    function handleBuyNow() {
        if (!currentProduct || !currentProduct.inStock) {
            alert("Sản phẩm hiện đã hết hàng.");
            return;
        }

        buyProductNow(currentProduct);
    }

    // 30. Xử lý tab

    function handleTabClick(event) {
        const button = event.target.closest(".tabBtn");

        if (!button) {
            return;
        }

        const targetTab = button.dataset.tab;

        if (!targetTab) {
            return;
        }

        tabButtons.forEach(function (item) {
            item.classList.remove("active");
        });

        tabContents.forEach(function (item) {
            item.classList.remove("active");
        });

        button.classList.add("active");

        const activeContent = document.getElementById(targetTab);

        if (activeContent) {
            activeContent.classList.add("active");
        }
    }

    // 31. Xử lý size guide

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

    function handleOpenSizeGuide(event) {
        event.preventDefault();
        openSizeGuidePopup();
    }

    function handleEscapeKey(event) {
        if (event.key === "Escape") {
            closeSizeGuidePopup();
        }
    }

    // 32. Xử lý yêu thích / chia sẻ

    function handleWishlist() {
        if (!currentProduct) {
            return;
        }

        if (!isUserLoggedIn()) {
            alert("Vui lòng đăng nhập để thêm sản phẩm vào yêu thích.");
            window.location.href = getLoginRedirectUrl();
            return;
        }

        addProductToWishlist(currentProduct);
    }

    async function handleShare() {
        if (!currentProduct) {
            return;
        }

        const shareUrl = window.location.href;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: currentProduct.name,
                    text: currentProduct.shortDesc,
                    url: shareUrl
                });

                return;
            }

            if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareUrl);
                alert("Đã sao chép liên kết sản phẩm.");
                return;
            }

            alert("Trình duyệt chưa hỗ trợ chia sẻ.");
        } catch (error) {
            console.error("Lỗi chia sẻ:", error);
        }
    }

    // 33. Xử lý tìm kiếm

    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword?.value.trim() || "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }

    // 34. Gắn sự kiện

    function bindEvents() {
        galleryThumbs?.addEventListener("click", handleGalleryClick);
        colorList?.addEventListener("click", handleColorClick);
        sizeList?.addEventListener("click", handleSizeClick);

        minusQty?.addEventListener("click", decreaseQuantity);
        plusQty?.addEventListener("click", increaseQuantity);
        quantityInput?.addEventListener("change", handleQuantityInputChange);

        addToCartBtn?.addEventListener("click", handleAddToCart);
        buyNowBtn?.addEventListener("click", handleBuyNow);
        wishlistBtn?.addEventListener("click", handleWishlist);
        shareBtn?.addEventListener("click", handleShare);

        openSizeGuide?.addEventListener("click", handleOpenSizeGuide);
        closeSizeGuide?.addEventListener("click", closeSizeGuidePopup);
        sizeGuideOverlay?.addEventListener("click", closeSizeGuidePopup);

        searchForm?.addEventListener("submit", handleSearchSubmit);

        document.addEventListener("click", handleTabClick);
        document.addEventListener("keydown", handleEscapeKey);
    }

    // 35. Khởi tạo trang

    function initProductDetailPage() {
        showProductLoading();

        currentProduct = getCurrentProduct();

        if (!currentProduct) {
            showProductError();
            return;
        }

        bindEvents();
        renderProductDetail(currentProduct);
        showProductContent();
    }

    initProductDetailPage();
});