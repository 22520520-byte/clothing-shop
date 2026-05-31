// 1. Chờ HTML tải xong

document.addEventListener("DOMContentLoaded", function () {
    const wishlistPage = document.querySelector('[data-page="wishlist"]');

    if (!wishlistPage) {
        return;
    }

    // 2. Key localStorage

    const USERS_STORAGE_KEY = "users";
    const CURRENT_USER_STORAGE_KEY = "current_user";
    const IS_LOGIN_STORAGE_KEY = "is_login";
    const REMEMBER_LOGIN_STORAGE_KEY = "remember_login";
    const USER_POINTS_STORAGE_KEY = "user_points";
    const CART_STORAGE_KEY = "cart_items";
    const WISHLIST_STORAGE_PREFIX = "wishlist_";

    // 3. Dữ liệu sản phẩm mẫu

    const products = [
        {
            id: "hd001",
            category: "hoodie",
            name: "Áo Hoodie Basic Cotton",
            price: 329000,
            oldPrice: 399000,
            image: "../img/hoodie-1.jpg",
            inStock: true
        },
        {
            id: "hd002",
            category: "hoodie",
            name: "Áo Hoodie Urban Style",
            price: 289000,
            oldPrice: 0,
            image: "../img/hoodie-2.jpg",
            inStock: true
        },
        {
            id: "at001",
            category: "ao-thun",
            name: "Áo Thun Basic Oversize",
            price: 159000,
            oldPrice: 199000,
            image: "../img/ao-thun-1.jpg",
            inStock: true
        },
        {
            id: "ap001",
            category: "ao-polo",
            name: "Áo Polo Daily Wear",
            price: 219000,
            oldPrice: 269000,
            image: "../img/ao-polo-1.jpg",
            inStock: true
        },
        {
            id: "qd001",
            category: "quan-dai",
            name: "Quần Dài Kaki Basic",
            price: 299000,
            oldPrice: 359000,
            image: "../img/quan-dai-1.jpg",
            inStock: true
        },
        {
            id: "pk001",
            category: "mu",
            name: "Mũ Lưỡi Trai Basic",
            price: 99000,
            oldPrice: 0,
            image: "../img/mu-1.jpg",
            inStock: false
        }
    ];

    // 4. Biến dữ liệu

    let currentUser = null;
    let fullCurrentUser = null;
    let currentUserPoints = 0;
    let wishlistItems = [];
    let wishlistProducts = [];

    // 5. Lấy DOM sidebar

    const profileUserName = document.getElementById("profileUserName");
    const profileUserRank = document.getElementById("profileUserRank");
    const logoutBtn = document.getElementById("logoutBtn");

    // 6. Lấy DOM wishlist

    const wishlistLoadingState = document.getElementById("wishlistLoadingState");
    const wishlistEmptyState = document.getElementById("wishlistEmptyState");
    const wishlistErrorState = document.getElementById("wishlistErrorState");
    const wishlistContent = document.getElementById("wishlistContent");
    const wishlistCount = document.getElementById("wishlistCount");
    const wishlistList = document.getElementById("wishlistList");
    const wishlistItemTemplate = document.getElementById("wishlistItemTemplate");

    // 7. Lấy DOM tìm kiếm

    const searchForm = document.getElementById("searchForm");
    const searchKeyword = document.getElementById("searchKeyword");

    // 8. Hàm tiện ích

    function formatPrice(price) {
        return Number(price || 0).toLocaleString("vi-VN") + "đ";
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

    function getDisplayName(user) {
        if (!user) {
            return "Khách hàng";
        }

        return (
            user.fullName ||
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

    function isSameUser(userA, userB) {
        if (!userA || !userB) {
            return false;
        }

        return (
            Boolean(userA.id && userB.id && userA.id === userB.id) ||
            Boolean(userA.userId && userB.userId && userA.userId === userB.userId) ||
            Boolean(userA.email && userB.email && userA.email === userB.email) ||
            Boolean(userA.phone && userB.phone && userA.phone === userB.phone) ||
            Boolean(userA.username && userB.username && userA.username === userB.username)
        );
    }

    function normalizeQuantity(quantity) {
        const value = Number(quantity || 1);

        if (Number.isNaN(value) || value < 1) {
            return 1;
        }

        return Math.floor(value);
    }

    // 9. Đọc ghi localStorage

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

    // 10. Kiểm tra tài khoản

    function getCurrentUserFromStorage() {
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

    function isLoggedIn() {
        return Boolean(getCurrentUserFromStorage());
    }

    function getUsersFromStorage() {
        return getArrayFromStorage(USERS_STORAGE_KEY);
    }

    function getFullCurrentUser() {
        const users = getUsersFromStorage();

        if (!currentUser) {
            return null;
        }

        const foundUser = users.find(function (user) {
            return isSameUser(user, currentUser);
        });

        return foundUser || currentUser;
    }

    // 11. Đồng bộ điểm

    function getUserPointMap() {
        return getObjectFromStorage(USER_POINTS_STORAGE_KEY);
    }

    function saveUserPointMap(pointMap) {
        saveDataToStorage(USER_POINTS_STORAGE_KEY, pointMap);
    }

    function getCurrentUserPoints() {
        const userKey = getUserKey(fullCurrentUser || currentUser);

        if (!userKey) {
            return 0;
        }

        const pointMap = getUserPointMap();

        if (typeof pointMap[userKey] === "number") {
            return pointMap[userKey];
        }

        const fallbackPoints = Number(fullCurrentUser?.points || currentUser?.points || 0);
        pointMap[userKey] = fallbackPoints;
        saveUserPointMap(pointMap);

        return fallbackPoints;
    }

    // 12. Wishlist storage

    function getWishlistStorageKeyByUser(user) {
        const userKey = getUserKey(user);

        if (!userKey) {
            return "";
        }

        return WISHLIST_STORAGE_PREFIX + userKey;
    }

    function getLegacyWishlistStorageKeys() {
        const keys = [];
        const primaryKey = getWishlistStorageKeyByUser(fullCurrentUser || currentUser);

        if (primaryKey) {
            keys.push(primaryKey);
        }

        if (currentUser?.id) {
            keys.push(WISHLIST_STORAGE_PREFIX + currentUser.id);
        }

        if (fullCurrentUser?.id) {
            keys.push(WISHLIST_STORAGE_PREFIX + fullCurrentUser.id);
        }

        if (currentUser?.email) {
            keys.push(WISHLIST_STORAGE_PREFIX + currentUser.email);
        }

        return [...new Set(keys.filter(Boolean))];
    }

    function normalizeWishlistItem(item) {
        if (typeof item === "string") {
            return {
                productId: item,
                name: "",
                price: 0,
                oldPrice: 0,
                image: "",
                inStock: true,
                createdAt: ""
            };
        }

        return {
            productId: item.productId || item.id || "",
            name: item.name || item.productName || "",
            price: Number(item.price || item.currentPrice || 0),
            oldPrice: Number(item.oldPrice || 0),
            image: item.image || item.img || item.thumbnail || "",
            inStock: item.inStock === false ? false : true,
            createdAt: item.createdAt || item.savedAt || ""
        };
    }

    function getWishlistFromStorage() {
        const keys = getLegacyWishlistStorageKeys();
        const wishlistMap = {};

        keys.forEach(function (key) {
            const items = getArrayFromStorage(key);

            items.forEach(function (item) {
                const normalizedItem = normalizeWishlistItem(item);

                if (!normalizedItem.productId) {
                    return;
                }

                wishlistMap[normalizedItem.productId] = normalizedItem;
            });
        });

        return Object.values(wishlistMap);
    }

    function saveWishlistToStorage(items) {
        const primaryKey = getWishlistStorageKeyByUser(fullCurrentUser || currentUser);

        if (!primaryKey) {
            return;
        }

        saveDataToStorage(primaryKey, items);
    }

    // 13. Sản phẩm

    function getProductById(productId) {
        return products.find(function (product) {
            return product.id === productId;
        });
    }

    function normalizeProduct(product) {
        return {
            id: product.id || product.productId || "",
            name: product.name || product.productName || "Sản phẩm",
            price: Number(product.price || product.currentPrice || 0),
            oldPrice: Number(product.oldPrice || 0),
            image: product.image || product.img || product.thumbnail || "",
            inStock: product.inStock === false ? false : true
        };
    }

    function buildWishlistProducts() {
        wishlistProducts = wishlistItems
            .map(function (wishlistItem) {
                const product = getProductById(wishlistItem.productId);

                if (product) {
                    return normalizeProduct(product);
                }

                if (wishlistItem.name || wishlistItem.image || wishlistItem.price) {
                    return normalizeProduct({
                        id: wishlistItem.productId,
                        name: wishlistItem.name,
                        price: wishlistItem.price,
                        oldPrice: wishlistItem.oldPrice,
                        image: wishlistItem.image,
                        inStock: wishlistItem.inStock
                    });
                }

                return null;
            })
            .filter(function (product) {
                return product !== null && product.id !== "";
            });
    }

    function removeMissingProductsFromWishlist() {
        const validProductIds = wishlistProducts.map(function (product) {
            return product.id;
        });

        wishlistItems = wishlistItems.filter(function (item) {
            return validProductIds.includes(item.productId);
        });

        saveWishlistToStorage(wishlistItems);
    }

    // 14. Trạng thái hiển thị

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

    // 15. Render sidebar

    function renderUserBox() {
        if (profileUserName) {
            profileUserName.textContent = getDisplayName(fullCurrentUser || currentUser);
        }

        if (profileUserRank) {
            profileUserRank.textContent = getRankNameByPoints(currentUserPoints);
        }
    }

    // 16. Render wishlist item

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

    // 17. Load dữ liệu wishlist

    function loadWishlistData() {
        currentUser = getCurrentUserFromStorage();
        fullCurrentUser = getFullCurrentUser();
        currentUserPoints = getCurrentUserPoints();

        if (fullCurrentUser) {
            fullCurrentUser.points = currentUserPoints;
        }

        wishlistItems = getWishlistFromStorage();

        buildWishlistProducts();
        removeMissingProductsFromWishlist();
    }

    // 18. Xóa sản phẩm yêu thích

    function removeWishlistItem(productId) {
        const confirmRemove = confirm("Bạn muốn xóa sản phẩm này khỏi danh sách yêu thích?");

        if (!confirmRemove) {
            return;
        }

        wishlistItems = wishlistItems.filter(function (item) {
            return item.productId !== productId;
        });

        saveWishlistToStorage(wishlistItems);

        buildWishlistProducts();
        renderWishlistPage();
    }

    // 19. Thêm vào giỏ hàng

    function getCartItemsFromStorage() {
        return getArrayFromStorage(CART_STORAGE_KEY);
    }

    function saveCartItemsToStorage(items) {
        saveDataToStorage(CART_STORAGE_KEY, items);
    }

    function createCartItem(product) {
        const defaultSize = "M";
        const defaultColor = "Mặc định";

        return {
            cartItemId: createCartItemId(product.id, defaultSize, defaultColor),
            id: product.id,
            name: product.name,
            price: Number(product.price || 0),
            oldPrice: Number(product.oldPrice || 0),
            image: product.image,
            meta: "Màu: " + defaultColor + " / Size: " + defaultSize,
            color: defaultColor,
            size: defaultSize,
            quantity: 1,
            selected: true
        };
    }

    function addProductToCart(productId) {
        const product = wishlistProducts.find(function (item) {
            return item.id === productId;
        });

        if (!product) {
            alert("Không tìm thấy sản phẩm.");
            return;
        }

        if (!product.inStock) {
            alert("Sản phẩm hiện đã hết hàng.");
            return;
        }

        const cartItems = getCartItemsFromStorage();
        const newItem = createCartItem(product);

        const existingItem = cartItems.find(function (item) {
            return item.cartItemId === newItem.cartItemId ||
                (
                    item.id === newItem.id &&
                    item.size === newItem.size &&
                    item.color === newItem.color
                );
        });

        if (existingItem) {
            existingItem.quantity = normalizeQuantity(existingItem.quantity) + 1;
            existingItem.selected = true;
        } else {
            cartItems.push(newItem);
        }

        saveCartItemsToStorage(cartItems);

        alert("Đã thêm sản phẩm vào giỏ hàng.");
    }

    // 20. Xem chi tiết sản phẩm

    function viewProductDetail(productId) {
        window.location.href = getProductDetailUrl(productId);
    }

    // 21. Đăng xuất

    function handleLogout() {
        const confirmLogout = confirm("Bạn có chắc muốn đăng xuất không?");

        if (!confirmLogout) {
            return;
        }

        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        localStorage.removeItem(REMEMBER_LOGIN_STORAGE_KEY);
        localStorage.setItem(IS_LOGIN_STORAGE_KEY, "false");

        window.location.href = "../html/login.html";
    }

    // 22. Tìm kiếm

    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword?.value.trim() || "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }

    // 23. Bảo vệ trang wishlist

    function redirectToLoginIfNeeded() {
        if (isLoggedIn()) {
            return false;
        }

        alert("Vui lòng đăng nhập để xem sản phẩm yêu thích.");

        const redirectUrl = encodeURIComponent("../html/wishlist.html");
        window.location.href = "../html/login.html?redirect=" + redirectUrl;

        return true;
    }

    // 24. Bắt sự kiện

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

    function bindEvents() {
        wishlistList?.addEventListener("click", handleWishlistListClick);
        logoutBtn?.addEventListener("click", handleLogout);
        searchForm?.addEventListener("submit", handleSearchSubmit);
    }

    // 25. Khởi tạo trang wishlist

    function initWishlistPage() {
        if (redirectToLoginIfNeeded()) {
            return;
        }

        showWishlistLoading();

        try {
            loadWishlistData();
            renderUserBox();
            bindEvents();
            renderWishlistPage();
        } catch (error) {
            console.error("Lỗi wishlist:", error);
            showWishlistError();
        }
    }

    initWishlistPage();
});