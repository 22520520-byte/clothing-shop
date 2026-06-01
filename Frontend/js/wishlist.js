// =========================================================
// File: Frontend/js/wishlist.js
// Mục đích: Trang sản phẩm yêu thích dùng dữ liệu sản phẩm thật từ API
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang wishlist
    const wishlistPage = document.querySelector('[data-page="wishlist"]');

    if (!wishlistPage) {
        return;
    }


    // 2. Key localStorage
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const IS_LOGIN_STORAGE_KEY = "is_login";
    const USER_POINTS_STORAGE_KEY = "user_points";
    const CART_STORAGE_KEY = "cart_items";
    const WISHLIST_STORAGE_PREFIX = "wishlist_";


    // 3. Biến trạng thái
    let currentUser = null;
    let currentUserPoints = 0;
    let wishlistItems = [];
    let wishlistProducts = [];


    // 4. Lấy DOM sidebar
    const profileUserName = document.getElementById("profileUserName");
    const profileUserEmail = document.getElementById("profileUserEmail");
    const profileUserRank = document.getElementById("profileUserRank");
    const profileUserAvatar = document.getElementById("profileUserAvatar");
    const logoutBtn = document.getElementById("logoutBtn");


    // 5. Lấy DOM wishlist
    const wishlistLoadingState = document.getElementById("wishlistLoadingState");
    const wishlistEmptyState = document.getElementById("wishlistEmptyState");
    const wishlistErrorState = document.getElementById("wishlistErrorState");
    const wishlistContent = document.getElementById("wishlistContent");
    const wishlistCount = document.getElementById("wishlistCount");
    const wishlistList = document.getElementById("wishlistList");
    const wishlistItemTemplate = document.getElementById("wishlistItemTemplate");


    // 6. Lấy DOM tìm kiếm
    const searchForm = document.getElementById("searchForm");
    const searchKeyword = document.getElementById("searchKeyword");


    // 7. Gọi API GET
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


    // 8. Gọi API POST
    async function postApi(endpoint, body) {
        if (window.CustomerApi && typeof window.CustomerApi.post === "function") {
            return await window.CustomerApi.post(endpoint, body);
        }

        const response = await fetch("../../BackEnd/php/api/" + endpoint, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body || {})
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

    function getApiErrorMessage(error, fallbackMessage) {
        if (window.CustomerApi && typeof window.CustomerApi.getApiErrorMessage === "function") {
            return window.CustomerApi.getApiErrorMessage(error, fallbackMessage);
        }

        return error && error.message ? error.message : fallbackMessage;
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

    function normalizeQuantity(quantity) {
        const value = Number(quantity || 1);

        if (Number.isNaN(value) || value < 1) {
            return 1;
        }

        return Math.floor(value);
    }

    function getFirstLetter(text) {
        if (!text) {
            return "K";
        }

        return String(text).trim().charAt(0).toUpperCase();
    }

    function getDisplayName(user) {
        if (!user) {
            return "Khách hàng";
        }

        return (
            user.fullName ||
            user.full_name ||
            user.name ||
            user.username ||
            user.email ||
            "Khách hàng"
        );
    }

    function getRankNameByPoints(points) {
        const currentPoints = Number(points || 0);

        if (currentPoints >= 3000) {
            return "Thành viên kim cương";
        }

        if (currentPoints >= 1500) {
            return "Thành viên vàng";
        }

        if (currentPoints >= 500) {
            return "Thành viên bạc";
        }

        return "Thành viên";
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


    // 10. Đọc ghi localStorage
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

    function getObjectFromStorage(key) {
        const data = getDataFromStorage(key, {});

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return {};
        }

        return data;
    }


    // 11. Kiểm tra đăng nhập
    function getCurrentUserFromLocal() {
        if (window.CustomerApi && typeof window.CustomerApi.getCurrentCustomerFromLocal === "function") {
            return window.CustomerApi.getCurrentCustomerFromLocal();
        }

        const isLogin = localStorage.getItem(IS_LOGIN_STORAGE_KEY) === "true";
        const currentUserData = getDataFromStorage(CURRENT_USER_STORAGE_KEY, null);

        if (!isLogin || !currentUserData) {
            return null;
        }

        if (typeof currentUserData === "string") {
            return {
                id: currentUserData,
                fullName: currentUserData
            };
        }

        return currentUserData;
    }

    async function requireLogin() {
        if (!window.CustomerApi) {
            currentUser = getCurrentUserFromLocal();

            if (!currentUser) {
                alert("Vui lòng đăng nhập để xem sản phẩm yêu thích.");
                window.location.href = "../html/login.html?redirect=" + encodeURIComponent("../html/wishlist.html");
                return false;
            }

            return true;
        }

        const localUser = window.CustomerApi.getCurrentCustomerFromLocal();

        if (!localUser) {
            alert("Vui lòng đăng nhập để xem sản phẩm yêu thích.");
            window.location.href = "../html/login.html?redirect=" + encodeURIComponent("../html/wishlist.html");
            return false;
        }

        try {
            currentUser = await window.CustomerApi.getCurrentCustomerFromSession();
            return true;
        } catch (error) {
            window.CustomerApi.clearCustomerLocalAuth();

            alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            window.location.href = "../html/login.html?redirect=" + encodeURIComponent("../html/wishlist.html");

            return false;
        }
    }


    // 12. Đồng bộ điểm
    function getUserPointMap() {
        return getObjectFromStorage(USER_POINTS_STORAGE_KEY);
    }

    function getCurrentUserPoints() {
        const userKey = getUserKey(currentUser);

        if (!userKey) {
            return 0;
        }

        const pointMap = getUserPointMap();

        if (typeof pointMap[userKey] === "number") {
            return pointMap[userKey];
        }

        return Number(currentUser.points || 0);
    }


    // 13. Wishlist localStorage
    function getWishlistStorageKey() {
        const userKey = getUserKey(currentUser);

        if (!userKey) {
            return "";
        }

        return WISHLIST_STORAGE_PREFIX + userKey;
    }

    function normalizeWishlistItem(item) {
        if (typeof item === "string" || typeof item === "number") {
            return {
                productId: String(item),
                name: "",
                price: 0,
                oldPrice: 0,
                image: "",
                inStock: true,
                createdAt: ""
            };
        }

        return {
            productId: String(item.productId || item.id || ""),
            name: item.name || item.productName || "",
            price: Number(item.price || item.currentPrice || 0),
            oldPrice: Number(item.oldPrice || 0),
            image: item.image || item.img || item.thumbnail || "",
            inStock: item.inStock === false ? false : true,
            createdAt: item.createdAt || item.savedAt || ""
        };
    }

    function getWishlistItemsFromStorage() {
        const wishlistKey = getWishlistStorageKey();

        if (!wishlistKey) {
            return [];
        }

        const items = getArrayFromStorage(wishlistKey);
        const wishlistMap = {};

        items.forEach(function (item) {
            const normalizedItem = normalizeWishlistItem(item);

            if (!normalizedItem.productId) {
                return;
            }

            wishlistMap[normalizedItem.productId] = normalizedItem;
        });

        return Object.values(wishlistMap);
    }

    function saveWishlistItemsToStorage(items) {
        const wishlistKey = getWishlistStorageKey();

        if (!wishlistKey) {
            return;
        }

        saveDataToStorage(wishlistKey, items);
    }


    // 14. Giỏ hàng localStorage
    function getCartItemsFromStorage() {
        return getArrayFromStorage(CART_STORAGE_KEY);
    }

    function saveCartItemsToStorage(items) {
        saveDataToStorage(CART_STORAGE_KEY, items);
    }


    // 15. Trạng thái hiển thị
    function hideWishlistStates() {
        if (wishlistLoadingState) wishlistLoadingState.hidden = true;
        if (wishlistEmptyState) wishlistEmptyState.hidden = true;
        if (wishlistErrorState) wishlistErrorState.hidden = true;
        if (wishlistContent) wishlistContent.hidden = true;
    }

    function showWishlistLoading() {
        hideWishlistStates();

        if (wishlistLoadingState) {
            wishlistLoadingState.hidden = false;
        }
    }

    function showWishlistEmpty() {
        hideWishlistStates();

        if (wishlistEmptyState) {
            wishlistEmptyState.hidden = false;
        }
    }

    function showWishlistError() {
        hideWishlistStates();

        if (wishlistErrorState) {
            wishlistErrorState.hidden = false;
        }
    }

    function showWishlistContent() {
        hideWishlistStates();

        if (wishlistContent) {
            wishlistContent.hidden = false;
        }
    }


    // 16. Render sidebar user
    function renderUserBox() {
        const displayName = getDisplayName(currentUser);
        currentUserPoints = getCurrentUserPoints();

        if (profileUserName) {
            profileUserName.textContent = displayName;
        }

        if (profileUserEmail) {
            profileUserEmail.textContent = currentUser.email || currentUser.phone || "";
        }

        if (profileUserRank) {
            profileUserRank.textContent = getRankNameByPoints(currentUserPoints);
        }

        if (profileUserAvatar) {
            profileUserAvatar.textContent = getFirstLetter(displayName);
        }
    }


    // 17. Chuẩn hóa sản phẩm từ API
    function normalizeProductDetailFromApi(product, fallbackItem) {
        const imageList = Array.isArray(product.images)
            ? product.images.map(function (image) {
                return image.image_url;
            }).filter(Boolean)
            : [];

        const mainImage =
            product.main_image ||
            imageList[0] ||
            fallbackItem.image ||
            "../img/products/default.jpg";

        const price = Number(product.base_price || product.price || fallbackItem.price || 0);

        const oldPrice = product.old_price !== null && product.old_price !== undefined
            ? Number(product.old_price || 0)
            : Number(fallbackItem.oldPrice || 0);

        const variants = Array.isArray(product.variants)
            ? product.variants.map(function (variant) {
                return {
                    id: variant.id,
                    colorId: variant.color ? variant.color.id : variant.color_id,
                    colorName: variant.color ? variant.color.name : "",
                    sizeId: variant.size ? variant.size.id : variant.size_id,
                    sizeName: variant.size ? variant.size.name : "",
                    price: variant.price !== null && variant.price !== undefined
                        ? Number(variant.price)
                        : price,
                    stockQuantity: Number(variant.stock_quantity || 0),
                    status: variant.status || "active"
                };
            })
            : [];

        return {
            id: String(product.id || fallbackItem.productId),
            name: product.name || fallbackItem.name || "Sản phẩm",
            price: price,
            oldPrice: oldPrice,
            image: mainImage,
            inStock: Number(product.total_stock || 0) > 0,
            totalStock: Number(product.total_stock || 0),
            variants: variants,
            raw: product
        };
    }

    function normalizeProductFromWishlistItem(item) {
        return {
            id: String(item.productId),
            name: item.name || "Sản phẩm",
            price: Number(item.price || 0),
            oldPrice: Number(item.oldPrice || 0),
            image: item.image || "../img/products/default.jpg",
            inStock: item.inStock === false ? false : true,
            totalStock: item.inStock === false ? 0 : 1,
            variants: []
        };
    }


    // 18. Load chi tiết một sản phẩm yêu thích
    async function getProductDetail(productId, fallbackItem) {
        try {
            const response = await getApi(
                "products/get-product-detail.php?id=" + encodeURIComponent(productId)
            );

            const product = response.data && response.data.product
                ? response.data.product
                : null;

            if (!product) {
                return normalizeProductFromWishlistItem(fallbackItem);
            }

            return normalizeProductDetailFromApi(product, fallbackItem);
        } catch (error) {
            console.warn("Không lấy được chi tiết sản phẩm yêu thích:", productId, error);
            return normalizeProductFromWishlistItem(fallbackItem);
        }
    }


    // 19. Load wishlist data
    async function loadWishlistData() {
        wishlistItems = getWishlistItemsFromStorage();

        if (wishlistItems.length === 0) {
            wishlistProducts = [];
            return;
        }

        const productPromises = wishlistItems.map(function (item) {
            return getProductDetail(item.productId, item);
        });

        wishlistProducts = await Promise.all(productPromises);

        wishlistProducts = wishlistProducts.filter(function (product) {
            return product && product.id;
        });

        const validIds = wishlistProducts.map(function (product) {
            return String(product.id);
        });

        wishlistItems = wishlistItems.filter(function (item) {
            return validIds.includes(String(item.productId));
        });

        saveWishlistItemsToStorage(wishlistItems);
    }


    // 20. Render một sản phẩm yêu thích
    function createWishlistItemElement(product) {
        if (!wishlistItemTemplate) {
            return null;
        }

        const clone = wishlistItemTemplate.content.cloneNode(true);

        const wishlistItem = clone.querySelector(".wishlistItem");
        const productLinks = clone.querySelectorAll('[data-role="product-link"]');
        const productImage = clone.querySelector('[data-role="product-image"]');
        const productName = clone.querySelector('[data-role="product-name"]');
        const currentPrice = clone.querySelector('[data-role="product-current-price"]');
        const oldPriceWrap = clone.querySelector('[data-role="product-old-price-wrap"]');
        const oldPrice = clone.querySelector('[data-role="product-old-price"]');
        const stockStatus = clone.querySelector('[data-role="product-stock-status"]');

        const removeWishlistBtn =
            clone.querySelector('[data-role="remove-wishlist-btn"]') ||
            clone.querySelector('[data-role="remove-wishlist"]');

        const viewDetailBtn =
            clone.querySelector('[data-role="view-detail-btn"]') ||
            clone.querySelector('[data-role="product-detail-btn"]');

        const addToCartBtn =
            clone.querySelector('[data-role="add-to-cart-btn"]') ||
            clone.querySelector('[data-role="add-cart-btn"]');

        const detailUrl = getProductDetailUrl(product.id);

        if (wishlistItem) {
            wishlistItem.dataset.productId = product.id;
            wishlistItem.dataset.stock = product.inStock ? "in-stock" : "out-stock";
        }

        productLinks.forEach(function (link) {
            link.href = detailUrl;
        });

        if (productImage) {
            productImage.src = product.image;
            productImage.alt = product.name;
        }

        if (productName) {
            productName.href = detailUrl;
            productName.textContent = product.name;
        }

        if (currentPrice) {
            currentPrice.textContent = formatPrice(product.price);
        }

        if (product.oldPrice && product.oldPrice > product.price) {
            if (oldPrice) {
                oldPrice.textContent = formatPrice(product.oldPrice);
            }

            if (oldPriceWrap) {
                oldPriceWrap.hidden = false;
            }
        } else {
            if (oldPrice) {
                oldPrice.textContent = "";
            }

            if (oldPriceWrap) {
                oldPriceWrap.hidden = true;
            }
        }

        if (stockStatus) {
            stockStatus.textContent = product.inStock ? "Còn hàng" : "Hết hàng";
            stockStatus.classList.toggle("inStock", product.inStock);
            stockStatus.classList.toggle("outStock", !product.inStock);
        }

        if (removeWishlistBtn) {
            removeWishlistBtn.dataset.productId = product.id;
        }

        if (viewDetailBtn) {
            viewDetailBtn.dataset.productId = product.id;
            viewDetailBtn.textContent = "Xem chi tiết";
        }

        if (addToCartBtn) {
            addToCartBtn.dataset.productId = product.id;
            addToCartBtn.disabled = !product.inStock;
            addToCartBtn.textContent = product.inStock ? "Thêm vào giỏ" : "Hết hàng";
        }

        return clone;
    }

    function renderWishlistCount() {
        if (wishlistCount) {
            wishlistCount.textContent = wishlistProducts.length;
        }
    }

    function renderWishlistItems() {
        if (!wishlistList || !wishlistItemTemplate) {
            return;
        }

        wishlistList.innerHTML = "";

        const fragment = document.createDocumentFragment();

        wishlistProducts.forEach(function (product) {
            const itemElement = createWishlistItemElement(product);

            if (itemElement) {
                fragment.appendChild(itemElement);
            }
        });

        wishlistList.appendChild(fragment);
    }

    function renderWishlistPage() {
        renderWishlistCount();

        if (wishlistProducts.length === 0) {
            showWishlistEmpty();
            return;
        }

        renderWishlistItems();
        showWishlistContent();
    }


    // 21. Xóa sản phẩm yêu thích
    function removeWishlistItem(productId) {
        const confirmRemove = confirm("Bạn muốn xóa sản phẩm này khỏi danh sách yêu thích?");

        if (!confirmRemove) {
            return;
        }

        wishlistItems = wishlistItems.filter(function (item) {
            return String(item.productId) !== String(productId);
        });

        wishlistProducts = wishlistProducts.filter(function (product) {
            return String(product.id) !== String(productId);
        });

        saveWishlistItemsToStorage(wishlistItems);
        renderWishlistPage();
    }


    // 22. Chọn biến thể mặc định để thêm vào giỏ
    function getDefaultVariant(product) {
        if (!product || !Array.isArray(product.variants)) {
            return null;
        }

        const availableVariant = product.variants.find(function (variant) {
            return variant.stockQuantity > 0 && variant.status === "active";
        });

        return availableVariant || product.variants[0] || null;
    }


    // 23. Tạo item giỏ hàng local
    function createCartItem(product) {
        const defaultVariant = getDefaultVariant(product);

        const color = defaultVariant && defaultVariant.colorName
            ? defaultVariant.colorName
            : "Mặc định";

        const size = defaultVariant && defaultVariant.sizeName
            ? defaultVariant.sizeName
            : "M";

        const price = defaultVariant && defaultVariant.price
            ? Number(defaultVariant.price)
            : Number(product.price || 0);

        return {
            cartItemId: createCartItemId(product.id, size, color),

            id: product.id,
            productId: product.id,
            product_id: product.id,

            variantId: defaultVariant ? defaultVariant.id : null,
            productVariantId: defaultVariant ? defaultVariant.id : null,
            product_variant_id: defaultVariant ? defaultVariant.id : null,

            name: product.name,
            price: price,
            oldPrice: Number(product.oldPrice || 0),
            image: product.image,

            meta: "Màu: " + color + " / Size: " + size,
            color: color,
            colorId: defaultVariant ? defaultVariant.colorId : "",
            size: size,
            sizeId: defaultVariant ? defaultVariant.sizeId : "",

            quantity: 1,
            selected: true
        };
    }


    // 24. Kiểm tra đang đăng nhập thật không
    async function isLoggedInByApi() {
        if (!window.CustomerApi) {
            return false;
        }

        const localUser = window.CustomerApi.getCurrentCustomerFromLocal();

        if (!localUser) {
            return false;
        }

        try {
            await window.CustomerApi.getCurrentCustomerFromSession();
            return true;
        } catch (error) {
            return false;
        }
    }


    // 25. Thêm vào giỏ bằng API
    async function addProductToApiCart(product) {
        const defaultVariant = getDefaultVariant(product);

        if (!defaultVariant || !defaultVariant.id) {
            throw {
                message: "Sản phẩm này chưa có phân loại mặc định để thêm vào giỏ. Vui lòng vào chi tiết sản phẩm để chọn màu/size."
            };
        }

        await postApi("cart/add-to-cart.php", {
            variant_id: Number(defaultVariant.id),
            quantity: 1
        });
    }


    // 26. Thêm vào giỏ localStorage
    function addProductToLocalCart(product) {
        const cartItems = getCartItemsFromStorage();
        const newItem = createCartItem(product);

        const existingItem = cartItems.find(function (item) {
            return item.cartItemId === newItem.cartItemId;
        });

        if (existingItem) {
            existingItem.quantity = normalizeQuantity(existingItem.quantity) + 1;
            existingItem.selected = true;
        } else {
            cartItems.push(newItem);
        }

        saveCartItemsToStorage(cartItems);
    }


    // 27. Xử lý thêm vào giỏ
    async function addProductToCart(productId) {
        const product = wishlistProducts.find(function (item) {
            return String(item.id) === String(productId);
        });

        if (!product) {
            alert("Không tìm thấy sản phẩm.");
            return;
        }

        if (!product.inStock) {
            alert("Sản phẩm hiện đã hết hàng.");
            return;
        }

        try {
            const loggedInByApi = await isLoggedInByApi();

            if (loggedInByApi) {
                await addProductToApiCart(product);
                alert("Đã thêm sản phẩm vào giỏ hàng.");
                return;
            }

            addProductToLocalCart(product);
            alert("Đã thêm sản phẩm vào giỏ hàng.");
        } catch (error) {
            alert(
                getApiErrorMessage(
                    error,
                    "Không thêm được sản phẩm vào giỏ. Vui lòng vào chi tiết sản phẩm để chọn màu/size."
                )
            );
        }
    }


    // 28. Xem chi tiết sản phẩm
    function viewProductDetail(productId) {
        window.location.href = getProductDetailUrl(productId);
    }


    // 29. Đăng xuất
    async function handleLogout(event) {
        if (event) {
            event.preventDefault();
        }

        const confirmLogout = confirm("Bạn có chắc muốn đăng xuất không?");

        if (!confirmLogout) {
            return;
        }

        if (window.CustomerApi && typeof window.CustomerApi.logoutCustomer === "function") {
            await window.CustomerApi.logoutCustomer();
            return;
        }

        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        localStorage.setItem(IS_LOGIN_STORAGE_KEY, "false");
        window.location.href = "../html/login.html";
    }


    // 30. Tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword ? searchKeyword.value.trim() : "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 31. Xử lý click wishlist
    function handleWishlistListClick(event) {
        const removeButton = event.target.closest(
            '[data-role="remove-wishlist-btn"], [data-role="remove-wishlist"]'
        );

        const detailButton = event.target.closest(
            '[data-role="view-detail-btn"], [data-role="product-detail-btn"]'
        );

        const addToCartButton = event.target.closest(
            '[data-role="add-to-cart-btn"], [data-role="add-cart-btn"]'
        );

        if (removeButton) {
            const productId = removeButton.dataset.productId;
            removeWishlistItem(productId);
            return;
        }

        if (detailButton) {
            const productId = detailButton.dataset.productId;
            viewProductDetail(productId);
            return;
        }

        if (addToCartButton && !addToCartButton.disabled) {
            const productId = addToCartButton.dataset.productId;
            addProductToCart(productId);
        }
    }


    // 32. Gắn sự kiện
    function bindEvents() {
        if (wishlistList) {
            wishlistList.addEventListener("click", handleWishlistListClick);
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", handleLogout);
        }

        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }
    }


    // 33. Khởi tạo trang wishlist
    async function initWishlistPage() {
        const isLogin = await requireLogin();

        if (!isLogin) {
            return;
        }

        showWishlistLoading();

        try {
            renderUserBox();
            bindEvents();

            await loadWishlistData();

            renderWishlistPage();
        } catch (error) {
            console.error("Lỗi wishlist:", error);
            showWishlistError();
        }
    }

    initWishlistPage();
});