// =========================================================
// File: Frontend/js/cart.js
// Mục đích: Trang giỏ hàng dùng API thật nếu đã đăng nhập,
//           dùng localStorage nếu là khách vãng lai
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Kiểm tra đúng trang giỏ hàng
    const cartPage = document.querySelector(".cartPage");

    if (!cartPage) {
        return;
    }


    // 2. Key localStorage
    const CART_STORAGE_KEY = "cart_items";
    const OLD_CART_STORAGE_KEY = "cart";
    const CHECKOUT_STORAGE_KEY = "checkout_items";


    // 3. Biến dữ liệu
    let cartItems = [];
    let isCustomerLoggedIn = false;
    let isUsingApiCart = false;


    // 4. Lấy DOM giỏ hàng
    const cartCount = document.getElementById("cartCount");
    const selectedCartCount = document.getElementById("selectedCartCount");
    const selectAllCartItems = document.getElementById("selectAllCartItems");

    const cartLoadingState = document.getElementById("cartLoadingState");
    const cartEmptyState = document.getElementById("cartEmptyState");
    const cartErrorState = document.getElementById("cartErrorState");
    const cartItemList = document.getElementById("cartItemList");
    const cartItemTemplate = document.getElementById("cartItemTemplate");

    const summarySelectedCount = document.getElementById("summarySelectedCount");
    const subtotalPrice = document.getElementById("subtotalPrice");
    const shippingFee = document.getElementById("shippingFee");
    const totalPrice = document.getElementById("totalPrice");
    const checkoutBtn = document.getElementById("checkoutBtn");


    // 5. Lấy DOM sản phẩm gợi ý
    const suggestLoadingState = document.getElementById("suggestLoadingState");
    const suggestEmptyState = document.getElementById("suggestEmptyState");
    const suggestErrorState = document.getElementById("suggestErrorState");
    const suggestGrid = document.getElementById("suggestGrid");
    const suggestProductTemplate = document.getElementById("suggestProductTemplate");


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

    function createCartItemId(item) {
        const productId = item.id || item.productId || item.product_id || "";
        const size = item.size || item.selectedSize || "";
        const color = item.color || item.selectedColor || "";

        return productId + "_" + size + "_" + color;
    }

    function getProductDetailUrl(productId) {
        if (!productId) {
            return "#";
        }

        return "../html/product-detail.html?id=" + encodeURIComponent(productId);
    }

    function getTotalQuantity(items) {
        return items.reduce(function (total, item) {
            return total + Number(item.quantity || 0);
        }, 0);
    }

    function getSelectedItems() {
        return cartItems.filter(function (item) {
            return item.selected === true;
        });
    }

    function getSelectedQuantity() {
        return getTotalQuantity(getSelectedItems());
    }

    function calculateSubtotal() {
        return getSelectedItems().reduce(function (total, item) {
            return total + Number(item.price || 0) * Number(item.quantity || 0);
        }, 0);
    }

    function findCartItemIndex(cartItemId) {
        return cartItems.findIndex(function (item) {
            return String(item.cartItemId) === String(cartItemId);
        });
    }

    function normalizeQuantity(quantity) {
        const value = Number(quantity || 1);

        if (Number.isNaN(value) || value < 1) {
            return 1;
        }

        if (value > 99) {
            return 99;
        }

        return Math.floor(value);
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

    function getCartItemsFromStorage() {
        const cartItemsData = getDataFromStorage(CART_STORAGE_KEY, []);

        if (Array.isArray(cartItemsData) && cartItemsData.length > 0) {
            return cartItemsData;
        }

        const oldCartItemsData = getDataFromStorage(OLD_CART_STORAGE_KEY, []);

        if (Array.isArray(oldCartItemsData) && oldCartItemsData.length > 0) {
            saveDataToStorage(CART_STORAGE_KEY, oldCartItemsData);
            localStorage.removeItem(OLD_CART_STORAGE_KEY);
            return oldCartItemsData;
        }

        return [];
    }

    function saveCartItemsToStorage() {
        saveDataToStorage(CART_STORAGE_KEY, cartItems);
    }

    function saveCheckoutItemsToStorage(items) {
        saveDataToStorage(CHECKOUT_STORAGE_KEY, items);
    }

    function clearLocalCartItems() {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(OLD_CART_STORAGE_KEY);
    }


    // 11. Kiểm tra trạng thái đăng nhập khách hàng
    async function checkCustomerLoginState() {
        if (!window.CustomerApi) {
            isCustomerLoggedIn = false;
            isUsingApiCart = false;
            return false;
        }

        const localUser = window.CustomerApi.getCurrentCustomerFromLocal();

        if (!localUser) {
            isCustomerLoggedIn = false;
            isUsingApiCart = false;
            return false;
        }

        try {
            await window.CustomerApi.getCurrentCustomerFromSession();

            isCustomerLoggedIn = true;
            isUsingApiCart = true;

            return true;
        } catch (error) {
            isCustomerLoggedIn = false;
            isUsingApiCart = false;

            return false;
        }
    }


    // 12. Chuẩn hóa item localStorage
    function normalizeLocalCartItem(item) {
        const color = item.color || item.selectedColor || "";
        const size = item.size || item.selectedSize || "";
        const productId = item.id || item.productId || item.product_id || "";
        const variantId = item.variantId || item.productVariantId || item.product_variant_id || null;

        const cartItemId = item.cartItemId || createCartItemId({
            id: productId,
            size: size,
            color: color
        });

        return {
            source: "local",

            cartItemId: cartItemId,
            apiCartItemId: null,

            id: String(productId),
            productId: String(productId),
            product_id: String(productId),

            variantId: variantId,
            productVariantId: variantId,
            product_variant_id: variantId,

            name: item.name || item.productName || "Sản phẩm",
            image: item.image || item.img || item.thumbnail || "../img/products/default.jpg",

            price: Number(item.price || item.currentPrice || 0),
            oldPrice: Number(item.oldPrice || 0),

            size: size,
            sizeId: item.sizeId || item.size_id || "",
            color: color,
            colorId: item.colorId || item.color_id || "",

            meta: item.meta || "",
            quantity: normalizeQuantity(item.quantity || item.qty || 1),
            selected: item.selected === false ? false : true,

            isAvailable: item.isAvailable !== false,
            stockQuantity: item.stockQuantity || item.stock_quantity || null
        };
    }

    function normalizeLocalCartItems(items) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items.map(function (item) {
            return normalizeLocalCartItem(item);
        });
    }


    // 13. Chuẩn hóa item API
    function normalizeApiCartItem(item) {
        const product = item.product || {};
        const color = item.color || {};
        const size = item.size || {};

        const productId = product.id || item.product_id || item.id || "";
        const cartItemId = item.cart_item_id || item.id || "";

        return {
            source: "api",

            cartItemId: String(cartItemId),
            apiCartItemId: Number(cartItemId),

            id: String(productId),
            productId: String(productId),
            product_id: String(productId),

            variantId: item.variant_id || item.variantId || null,
            productVariantId: item.variant_id || item.variantId || null,
            product_variant_id: item.variant_id || item.variantId || null,

            name: product.name || item.product_name || "Sản phẩm",
            image: product.image_url || item.image_url || "../img/products/default.jpg",

            price: Number(item.price_at_time || item.current_price || product.base_price || 0),
            oldPrice: product.old_price !== null && product.old_price !== undefined
                ? Number(product.old_price || 0)
                : 0,

            size: size.name || item.size_name || "",
            sizeId: size.id || item.size_id || "",
            color: color.name || item.color_name || "",
            colorId: color.id || item.color_id || "",

            meta: "Màu: " + (color.name || item.color_name || "Chưa chọn") +
                " | Size: " + (size.name || item.size_name || "Chưa chọn"),

            quantity: normalizeQuantity(item.quantity || 1),
            selected: true,

            isAvailable: item.is_available !== false,
            stockStatus: item.stock_status || "available",
            stockQuantity: item.stock_quantity !== undefined ? Number(item.stock_quantity || 0) : null
        };
    }

    function normalizeApiCartItems(items) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items.map(function (item) {
            return normalizeApiCartItem(item);
        });
    }


    // 14. Đồng bộ giỏ localStorage lên API sau khi đăng nhập
    async function syncLocalCartToApiIfNeeded() {
        if (!isUsingApiCart) {
            return;
        }

        const localCartItems = normalizeLocalCartItems(getCartItemsFromStorage());

        if (localCartItems.length === 0) {
            return;
        }

        for (let i = 0; i < localCartItems.length; i += 1) {
            const item = localCartItems[i];
            const variantId = item.productVariantId || item.variantId || item.product_variant_id;

            if (!variantId) {
                continue;
            }

            try {
                await postApi("cart/add-to-cart.php", {
                    variant_id: Number(variantId),
                    quantity: normalizeQuantity(item.quantity)
                });
            } catch (error) {
                console.warn("Không đồng bộ được item local lên API:", item, error);
            }
        }

        clearLocalCartItems();
    }


    // 15. Load giỏ hàng từ API
    async function loadApiCartData() {
        const response = await getApi("cart/get-cart.php");
        const data = response.data || {};
        const items = Array.isArray(data.items) ? data.items : [];

        cartItems = normalizeApiCartItems(items);
    }


    // 16. Load giỏ hàng localStorage
    function loadLocalCartData() {
        const storedCartItems = getCartItemsFromStorage();

        cartItems = normalizeLocalCartItems(storedCartItems);
        saveCartItemsToStorage();
    }


    // 17. Trạng thái hiển thị giỏ hàng
    function hideCartStates() {
        if (cartLoadingState) cartLoadingState.hidden = true;
        if (cartEmptyState) cartEmptyState.hidden = true;
        if (cartErrorState) cartErrorState.hidden = true;
        if (cartItemList) cartItemList.hidden = true;
    }

    function showCartLoading() {
        hideCartStates();

        if (cartLoadingState) {
            cartLoadingState.hidden = false;
        }
    }

    function showCartEmpty() {
        hideCartStates();

        if (cartEmptyState) {
            cartEmptyState.hidden = false;
        }
    }

    function showCartContent() {
        hideCartStates();

        if (cartItemList) {
            cartItemList.hidden = false;
        }
    }

    function showCartError() {
        hideCartStates();

        if (cartErrorState) {
            cartErrorState.hidden = false;
        }
    }


    // 18. Render giỏ hàng
    function createCartItemElement(item, index) {
        if (!cartItemTemplate) {
            return null;
        }

        const clone = cartItemTemplate.content.cloneNode(true);

        const cartItem = clone.querySelector(".cartItem");
        const checkboxLabel = clone.querySelector(".cartCheckbox");
        const checkbox = clone.querySelector('[data-role="cart-item-checkbox"]');

        const productLink = clone.querySelector('[data-role="cart-product-link"]');
        const productImage = clone.querySelector('[data-role="cart-product-image"]');
        const productName = clone.querySelector('[data-role="cart-product-name"]');
        const productVariant = clone.querySelector('[data-role="cart-product-variant"]');
        const productMeta = clone.querySelector('[data-role="cart-product-meta"]');

        const unitPrice = clone.querySelector('[data-role="cart-unit-price"]');

        const decreaseBtn = clone.querySelector('[data-role="decrease-qty-btn"]');
        const increaseBtn = clone.querySelector('[data-role="increase-qty-btn"]');
        const quantityInput = clone.querySelector('[data-role="quantity-input"]');

        const lineTotal = clone.querySelector('[data-role="cart-line-total"]');
        const removeBtn = clone.querySelector('[data-role="remove-cart-item-btn"]');

        const productDetailUrl = getProductDetailUrl(item.id);
        const checkboxId = "cartItemCheckbox_" + index;

        if (cartItem) {
            cartItem.dataset.cartItemId = item.cartItemId;

            if (!item.isAvailable) {
                cartItem.classList.add("cartItemUnavailable");
            }
        }

        if (checkbox) {
            checkbox.id = checkboxId;
            checkbox.checked = item.selected;
            checkbox.dataset.cartItemId = item.cartItemId;
            checkbox.disabled = !item.isAvailable;
        }

        if (checkboxLabel) {
            checkboxLabel.setAttribute("for", checkboxId);
        }

        if (productLink) {
            productLink.href = productDetailUrl;
        }

        if (productImage) {
            productImage.src = item.image;
            productImage.alt = item.name;
        }

        if (productName) {
            productName.href = productDetailUrl;
            productName.textContent = item.name;
        }

        if (productVariant) {
            productVariant.textContent = "Màu: " + (item.color || "Chưa chọn") +
                " | Size: " + (item.size || "Chưa chọn");
        }

        if (productMeta) {
            if (!item.isAvailable) {
                productMeta.textContent = "Sản phẩm hiện không đủ điều kiện mua.";
            } else if (item.stockQuantity !== null && item.stockQuantity !== undefined) {
                productMeta.textContent = "Tồn kho: " + item.stockQuantity;
            } else {
                productMeta.textContent = item.meta || "";
            }
        }

        if (unitPrice) {
            unitPrice.textContent = formatPrice(item.price);
        }

        if (decreaseBtn) {
            decreaseBtn.dataset.cartItemId = item.cartItemId;
            decreaseBtn.disabled = !item.isAvailable || item.quantity <= 1;
        }

        if (increaseBtn) {
            increaseBtn.dataset.cartItemId = item.cartItemId;
            increaseBtn.disabled = !item.isAvailable;
        }

        if (quantityInput) {
            quantityInput.value = item.quantity;
            quantityInput.min = "1";
            quantityInput.max = "99";
            quantityInput.dataset.cartItemId = item.cartItemId;
            quantityInput.disabled = !item.isAvailable;
        }

        if (lineTotal) {
            lineTotal.textContent = formatPrice(item.price * item.quantity);
        }

        if (removeBtn) {
            removeBtn.dataset.cartItemId = item.cartItemId;
        }

        return clone;
    }

    function renderCartItems() {
        if (!cartItemList || !cartItemTemplate) {
            return;
        }

        cartItemList.innerHTML = "";

        const fragment = document.createDocumentFragment();

        cartItems.forEach(function (item, index) {
            const cartItemElement = createCartItemElement(item, index);

            if (cartItemElement) {
                fragment.appendChild(cartItemElement);
            }
        });

        cartItemList.appendChild(fragment);
    }

    function updateCartHeader() {
        const totalQuantity = getTotalQuantity(cartItems);

        if (cartCount) {
            cartCount.textContent = totalQuantity;
        }
    }

    function updateSelectAllCheckbox() {
        if (!selectAllCartItems) {
            return;
        }

        const availableItems = cartItems.filter(function (item) {
            return item.isAvailable !== false;
        });

        if (availableItems.length === 0) {
            selectAllCartItems.checked = false;
            selectAllCartItems.indeterminate = false;
            return;
        }

        const selectedAvailableItems = availableItems.filter(function (item) {
            return item.selected === true;
        });

        selectAllCartItems.checked = selectedAvailableItems.length === availableItems.length;
        selectAllCartItems.indeterminate =
            selectedAvailableItems.length > 0 &&
            selectedAvailableItems.length < availableItems.length;
    }

    function updateSummary() {
        const selectedQuantity = getSelectedQuantity();
        const subtotal = calculateSubtotal();

        if (selectedCartCount) {
            selectedCartCount.textContent = selectedQuantity;
        }

        if (summarySelectedCount) {
            summarySelectedCount.textContent = selectedQuantity;
        }

        if (subtotalPrice) {
            subtotalPrice.textContent = formatPrice(subtotal);
        }

        if (shippingFee) {
            shippingFee.textContent = "Tính khi thanh toán";
        }

        if (totalPrice) {
            totalPrice.textContent = formatPrice(subtotal);
        }

        if (checkoutBtn) {
            checkoutBtn.disabled = selectedQuantity === 0;
        }
    }

    function renderCartPage() {
        updateCartHeader();
        updateSelectAllCheckbox();
        updateSummary();

        if (cartItems.length === 0) {
            showCartEmpty();
            return;
        }

        renderCartItems();
        showCartContent();
    }


    // 19. Cập nhật local nếu đang là giỏ local
    function saveLocalCartIfNeeded() {
        if (!isUsingApiCart) {
            saveCartItemsToStorage();
        }
    }


    // 20. Reload cart sau thao tác API
    async function reloadCartAfterApiAction() {
        if (!isUsingApiCart) {
            renderCartPage();
            return;
        }

        await loadApiCartData();
        renderCartPage();
    }


    // 21. Xử lý chọn item
    function updateCartItemSelected(cartItemId, selected) {
        const itemIndex = findCartItemIndex(cartItemId);

        if (itemIndex === -1) {
            return;
        }

        cartItems[itemIndex].selected = selected;

        saveLocalCartIfNeeded();
        updateSelectAllCheckbox();
        updateSummary();
    }


    // 22. Cập nhật số lượng item
    async function updateCartItemQuantity(cartItemId, quantity) {
        const itemIndex = findCartItemIndex(cartItemId);

        if (itemIndex === -1) {
            return;
        }

        const newQuantity = normalizeQuantity(quantity);

        if (isUsingApiCart) {
            try {
                await postApi("cart/update-cart-item.php", {
                    cart_item_id: Number(cartItemId),
                    quantity: newQuantity
                });

                await reloadCartAfterApiAction();
            } catch (error) {
                alert(
                    window.CustomerApi
                        ? window.CustomerApi.getApiErrorMessage(error, "Cập nhật số lượng thất bại.")
                        : "Cập nhật số lượng thất bại."
                );

                await reloadCartAfterApiAction();
            }

            return;
        }

        cartItems[itemIndex].quantity = newQuantity;
        saveCartItemsToStorage();
        renderCartPage();
    }

    async function increaseCartItemQuantity(cartItemId) {
        const itemIndex = findCartItemIndex(cartItemId);

        if (itemIndex === -1) {
            return;
        }

        const newQuantity = normalizeQuantity(cartItems[itemIndex].quantity + 1);

        await updateCartItemQuantity(cartItemId, newQuantity);
    }

    async function decreaseCartItemQuantity(cartItemId) {
        const itemIndex = findCartItemIndex(cartItemId);

        if (itemIndex === -1) {
            return;
        }

        if (cartItems[itemIndex].quantity <= 1) {
            return;
        }

        const newQuantity = normalizeQuantity(cartItems[itemIndex].quantity - 1);

        await updateCartItemQuantity(cartItemId, newQuantity);
    }


    // 23. Xóa item
    async function removeCartItem(cartItemId) {
        const confirmRemove = confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng không?");

        if (!confirmRemove) {
            return;
        }

        if (isUsingApiCart) {
            try {
                await postApi("cart/remove-cart-item.php", {
                    cart_item_id: Number(cartItemId)
                });

                await reloadCartAfterApiAction();
            } catch (error) {
                alert(
                    window.CustomerApi
                        ? window.CustomerApi.getApiErrorMessage(error, "Xóa sản phẩm khỏi giỏ hàng thất bại.")
                        : "Xóa sản phẩm khỏi giỏ hàng thất bại."
                );
            }

            return;
        }

        cartItems = cartItems.filter(function (item) {
            return String(item.cartItemId) !== String(cartItemId);
        });

        saveCartItemsToStorage();
        renderCartPage();
    }


    // 24. Chọn tất cả
    function selectAllCartItemsByChecked(checked) {
        cartItems = cartItems.map(function (item) {
            if (item.isAvailable === false) {
                return {
                    ...item,
                    selected: false
                };
            }

            return {
                ...item,
                selected: checked
            };
        });

        saveLocalCartIfNeeded();
        renderCartPage();
    }


    // 25. Xử lý thanh toán
    function normalizeCheckoutItem(item) {
        return {
            cartItemId: item.cartItemId,

            id: item.id,
            productId: item.productId || item.id,
            product_id: item.product_id || item.id,

            variantId: item.variantId || item.productVariantId || item.product_variant_id,
            productVariantId: item.productVariantId || item.variantId || item.product_variant_id,
            product_variant_id: item.product_variant_id || item.variantId || item.productVariantId,

            apiCartItemId: item.apiCartItemId || null,

            name: item.name,
            image: item.image,

            price: Number(item.price || 0),
            oldPrice: Number(item.oldPrice || 0),

            color: item.color,
            colorId: item.colorId || "",
            size: item.size,
            sizeId: item.sizeId || "",

            meta: item.meta || "",
            quantity: normalizeQuantity(item.quantity),
            selected: true,

            source: item.source
        };
    }

    function handleCheckout() {
        const selectedItems = getSelectedItems().filter(function (item) {
            return item.isAvailable !== false;
        });

        if (selectedItems.length === 0) {
            alert("Vui lòng chọn ít nhất một sản phẩm để đặt hàng.");
            return;
        }

        const checkoutItems = selectedItems.map(function (item) {
            return normalizeCheckoutItem(item);
        });

        saveCheckoutItemsToStorage(checkoutItems);

        window.location.href = "../html/checkout.html?mode=cart";
    }


    // 26. Trạng thái sản phẩm gợi ý
    function hideSuggestStates() {
        if (suggestLoadingState) suggestLoadingState.hidden = true;
        if (suggestEmptyState) suggestEmptyState.hidden = true;
        if (suggestErrorState) suggestErrorState.hidden = true;
        if (suggestGrid) suggestGrid.hidden = true;
    }

    function showSuggestLoading() {
        hideSuggestStates();

        if (suggestLoadingState) {
            suggestLoadingState.hidden = false;
        }
    }

    function showSuggestContent() {
        hideSuggestStates();

        if (suggestGrid) {
            suggestGrid.hidden = false;
        }
    }

    function showSuggestEmpty() {
        hideSuggestStates();

        if (suggestEmptyState) {
            suggestEmptyState.hidden = false;
        }
    }

    function showSuggestError() {
        hideSuggestStates();

        if (suggestErrorState) {
            suggestErrorState.hidden = false;
        }
    }


    // 27. Chuẩn hóa sản phẩm gợi ý từ API
    function normalizeSuggestProduct(product) {
        return {
            id: String(product.id || ""),
            name: product.name || "Sản phẩm",
            image: product.main_image || product.image_url || product.image || "../img/products/default.jpg",
            price: Number(product.base_price || product.price || 0)
        };
    }


    // 28. Load sản phẩm gợi ý từ API
    async function loadSuggestProductsFromApi() {
        if (!suggestGrid || !suggestProductTemplate) {
            return;
        }

        showSuggestLoading();

        try {
            const response = await getApi("products/get-products.php?page=1&limit=4&sort=latest");
            const data = response.data || {};
            const products = Array.isArray(data.products)
                ? data.products.map(normalizeSuggestProduct)
                : [];

            renderSuggestProducts(products);
        } catch (error) {
            console.error("Lỗi tải sản phẩm gợi ý:", error);
            showSuggestError();
        }
    }


    // 29. Render sản phẩm gợi ý
    function createSuggestProductElement(product) {
        if (!suggestProductTemplate) {
            return null;
        }

        const clone = suggestProductTemplate.content.cloneNode(true);

        const suggestCard = clone.querySelector(".suggestCard");
        const suggestLink = clone.querySelector('[data-role="suggest-link"]');
        const suggestImage = clone.querySelector('[data-role="suggest-image"]');
        const suggestName = clone.querySelector('[data-role="suggest-name"]');
        const suggestPrice = clone.querySelector('[data-role="suggest-price"]');

        const productDetailUrl = getProductDetailUrl(product.id);

        if (suggestCard) {
            suggestCard.dataset.productId = product.id;
        }

        if (suggestLink) {
            suggestLink.href = productDetailUrl;
        }

        if (suggestImage) {
            suggestImage.src = product.image;
            suggestImage.alt = product.name;
        }

        if (suggestName) {
            suggestName.href = productDetailUrl;
            suggestName.textContent = product.name;
        }

        if (suggestPrice) {
            suggestPrice.textContent = formatPrice(product.price);
        }

        return clone;
    }

    function renderSuggestProducts(products) {
        if (!suggestGrid || !suggestProductTemplate) {
            return;
        }

        suggestGrid.innerHTML = "";

        if (!Array.isArray(products) || products.length === 0) {
            showSuggestEmpty();
            return;
        }

        const fragment = document.createDocumentFragment();

        products.forEach(function (product) {
            const suggestProductElement = createSuggestProductElement(product);

            if (suggestProductElement) {
                fragment.appendChild(suggestProductElement);
            }
        });

        suggestGrid.appendChild(fragment);
        showSuggestContent();
    }


    // 30. Xử lý tìm kiếm
    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword ? searchKeyword.value.trim() : "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }


    // 31. Xử lý click giỏ hàng
    async function handleCartClick(event) {
        const increaseBtn = event.target.closest('[data-role="increase-qty-btn"]');
        const decreaseBtn = event.target.closest('[data-role="decrease-qty-btn"]');
        const removeBtn = event.target.closest('[data-role="remove-cart-item-btn"]');

        if (increaseBtn) {
            const cartItemId = increaseBtn.dataset.cartItemId;
            await increaseCartItemQuantity(cartItemId);
            return;
        }

        if (decreaseBtn) {
            const cartItemId = decreaseBtn.dataset.cartItemId;
            await decreaseCartItemQuantity(cartItemId);
            return;
        }

        if (removeBtn) {
            const cartItemId = removeBtn.dataset.cartItemId;
            await removeCartItem(cartItemId);
        }
    }


    // 32. Xử lý thay đổi giỏ hàng
    async function handleCartChange(event) {
        const cartItemCheckbox = event.target.closest('[data-role="cart-item-checkbox"]');
        const quantityInput = event.target.closest('[data-role="quantity-input"]');

        if (cartItemCheckbox) {
            const cartItemId = cartItemCheckbox.dataset.cartItemId;
            const selected = cartItemCheckbox.checked;

            updateCartItemSelected(cartItemId, selected);
            return;
        }

        if (quantityInput) {
            const cartItemId = quantityInput.dataset.cartItemId;
            const quantity = quantityInput.value;

            await updateCartItemQuantity(cartItemId, quantity);
        }
    }


    // 33. Xử lý chọn tất cả
    function handleSelectAllChange() {
        if (!selectAllCartItems) {
            return;
        }

        selectAllCartItemsByChecked(selectAllCartItems.checked);
    }


    // 34. Gắn sự kiện
    function bindEvents() {
        if (cartItemList) {
            cartItemList.addEventListener("click", function (event) {
                handleCartClick(event);
            });

            cartItemList.addEventListener("change", function (event) {
                handleCartChange(event);
            });
        }

        if (selectAllCartItems) {
            selectAllCartItems.addEventListener("change", handleSelectAllChange);
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener("click", handleCheckout);
        }

        if (searchForm) {
            searchForm.addEventListener("submit", handleSearchSubmit);
        }
    }


    // 35. Load dữ liệu cart
    async function loadCartData() {
        showCartLoading();

        await checkCustomerLoginState();

        if (isUsingApiCart) {
            await syncLocalCartToApiIfNeeded();
            await loadApiCartData();
            return;
        }

        loadLocalCartData();
    }


    // 36. Khởi tạo trang cart
    async function initCartPage() {
        try {
            bindEvents();

            await loadCartData();

            renderCartPage();

            await loadSuggestProductsFromApi();
        } catch (error) {
            console.error("Lỗi khởi tạo trang giỏ hàng:", error);

            showCartError();
            showSuggestError();
        }
    }

    initCartPage();
});