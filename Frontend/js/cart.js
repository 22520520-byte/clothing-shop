// 1. Chờ HTML tải xong

document.addEventListener("DOMContentLoaded", function () {
    const cartPage = document.querySelector(".cartPage");

    if (!cartPage) {
        return;
    }

    // 2. Key localStorage

    const CART_STORAGE_KEY = "cart_items";
    const CHECKOUT_STORAGE_KEY = "checkout_items";

    // 3. Dữ liệu gợi ý sản phẩm liên quan

    const suggestedProducts = [
        {
            id: "hd001",
            name: "Áo Hoodie Basic Cotton",
            image: "../img/hoodie-1.jpg",
            price: 329000
        },
        {
            id: "at001",
            name: "Áo Thun Basic Oversize",
            image: "../img/ao-thun-1.jpg",
            price: 159000
        },
        {
            id: "qd001",
            name: "Quần Dài Kaki Basic",
            image: "../img/quan-dai-1.jpg",
            price: 299000
        },
        {
            id: "pk001",
            name: "Mũ Lưỡi Trai Basic",
            image: "../img/mu-1.jpg",
            price: 99000
        }
    ];

    // 4. Biến dữ liệu

    let cartItems = [];

    // 5. Lấy DOM giỏ hàng

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

    // 6. Lấy DOM sản phẩm gợi ý

    const suggestLoadingState = document.getElementById("suggestLoadingState");
    const suggestEmptyState = document.getElementById("suggestEmptyState");
    const suggestErrorState = document.getElementById("suggestErrorState");
    const suggestGrid = document.getElementById("suggestGrid");
    const suggestProductTemplate = document.getElementById("suggestProductTemplate");

    // 7. Lấy DOM tìm kiếm

    const searchForm = document.getElementById("searchForm");
    const searchKeyword = document.getElementById("searchKeyword");

    // 8. Hàm tiện ích

    function formatPrice(price) {
        return Number(price || 0).toLocaleString("vi-VN") + "đ";
    }

    function createCartItemId(item) {
        const productId = item.id || item.productId || "";
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
            return item.cartItemId === cartItemId;
        });
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

    function getCartItemsFromStorage() {
        const data = getDataFromStorage(CART_STORAGE_KEY, []);

        if (!Array.isArray(data)) {
            return [];
        }

        return data;
    }

    function saveCartItemsToStorage() {
        saveDataToStorage(CART_STORAGE_KEY, cartItems);
    }

    function saveCheckoutItemsToStorage(items) {
        saveDataToStorage(CHECKOUT_STORAGE_KEY, items);
    }

    // 10. Chuẩn hóa dữ liệu giỏ hàng

    function normalizeCartItem(item) {
        const color = item.color || item.selectedColor || "";
        const size = item.size || item.selectedSize || "";
        const id = item.id || item.productId || "";
        const cartItemId = item.cartItemId || createCartItemId({
            id: id,
            size: size,
            color: color
        });

        return {
            cartItemId: cartItemId,
            id: id,
            name: item.name || item.productName || "Sản phẩm",
            image: item.image || item.img || item.thumbnail || "",
            price: Number(item.price || item.currentPrice || 0),
            oldPrice: Number(item.oldPrice || 0),
            size: size,
            color: color,
            meta: item.meta || "",
            quantity: normalizeQuantity(item.quantity || item.qty || 1),
            selected: item.selected === false ? false : true
        };
    }

    function normalizeCartItems(items) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items.map(function (item) {
            return normalizeCartItem(item);
        });
    }

    // 11. Trạng thái hiển thị giỏ hàng

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

    // 12. Render giỏ hàng

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
        }

        if (checkbox) {
            checkbox.id = checkboxId;
            checkbox.checked = item.selected;
            checkbox.dataset.cartItemId = item.cartItemId;
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
            productVariant.textContent =
                "Màu: " + (item.color || "Chưa chọn") +
                " | Size: " + (item.size || "Chưa chọn");
        }

        if (productMeta) {
            productMeta.textContent = item.meta || "";
        }

        if (unitPrice) {
            unitPrice.textContent = formatPrice(item.price);
        }

        if (decreaseBtn) {
            decreaseBtn.dataset.cartItemId = item.cartItemId;
        }

        if (increaseBtn) {
            increaseBtn.dataset.cartItemId = item.cartItemId;
        }

        if (quantityInput) {
            quantityInput.value = item.quantity;
            quantityInput.min = "1";
            quantityInput.dataset.cartItemId = item.cartItemId;
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

        if (cartItems.length === 0) {
            selectAllCartItems.checked = false;
            selectAllCartItems.indeterminate = false;
            return;
        }

        const selectedItems = getSelectedItems();

        selectAllCartItems.checked = selectedItems.length === cartItems.length;
        selectAllCartItems.indeterminate =
            selectedItems.length > 0 && selectedItems.length < cartItems.length;
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

    // 13. Xử lý chọn / số lượng / xóa

    function updateCartItemSelected(cartItemId, selected) {
        const itemIndex = findCartItemIndex(cartItemId);

        if (itemIndex === -1) {
            return;
        }

        cartItems[itemIndex].selected = selected;

        saveCartItemsToStorage();
        updateSelectAllCheckbox();
        updateSummary();
    }

    function increaseCartItemQuantity(cartItemId) {
        const itemIndex = findCartItemIndex(cartItemId);

        if (itemIndex === -1) {
            return;
        }

        cartItems[itemIndex].quantity += 1;

        saveCartItemsToStorage();
        renderCartPage();
    }

    function decreaseCartItemQuantity(cartItemId) {
        const itemIndex = findCartItemIndex(cartItemId);

        if (itemIndex === -1) {
            return;
        }

        if (cartItems[itemIndex].quantity <= 1) {
            return;
        }

        cartItems[itemIndex].quantity -= 1;

        saveCartItemsToStorage();
        renderCartPage();
    }

    function updateCartItemQuantity(cartItemId, quantity) {
        const itemIndex = findCartItemIndex(cartItemId);

        if (itemIndex === -1) {
            return;
        }

        cartItems[itemIndex].quantity = normalizeQuantity(quantity);

        saveCartItemsToStorage();
        renderCartPage();
    }

    function removeCartItem(cartItemId) {
        const confirmRemove = confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng không?");

        if (!confirmRemove) {
            return;
        }

        cartItems = cartItems.filter(function (item) {
            return item.cartItemId !== cartItemId;
        });

        saveCartItemsToStorage();
        renderCartPage();
    }

    function selectAllCartItemsByChecked(checked) {
        cartItems = cartItems.map(function (item) {
            return {
                ...item,
                selected: checked
            };
        });

        saveCartItemsToStorage();
        renderCartPage();
    }

    // 14. Xử lý thanh toán

    function handleCheckout() {
        const selectedItems = getSelectedItems();

        if (selectedItems.length === 0) {
            alert("Vui lòng chọn ít nhất một sản phẩm để đặt hàng.");
            return;
        }

        const checkoutItems = selectedItems.map(function (item) {
            return normalizeCartItem({
                ...item,
                selected: true
            });
        });

        saveCheckoutItemsToStorage(checkoutItems);

        window.location.href = "../html/checkout.html?mode=cart";
    }

    // 15. Trạng thái sản phẩm gợi ý

    function hideSuggestStates() {
        if (suggestLoadingState) suggestLoadingState.hidden = true;
        if (suggestEmptyState) suggestEmptyState.hidden = true;
        if (suggestErrorState) suggestErrorState.hidden = true;
        if (suggestGrid) suggestGrid.hidden = true;
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

    // 16. Render sản phẩm gợi ý

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

    function renderSuggestProducts() {
        if (!suggestGrid || !suggestProductTemplate) {
            return;
        }

        suggestGrid.innerHTML = "";

        if (suggestedProducts.length === 0) {
            showSuggestEmpty();
            return;
        }

        const fragment = document.createDocumentFragment();

        suggestedProducts.forEach(function (product) {
            const suggestProductElement = createSuggestProductElement(product);

            if (suggestProductElement) {
                fragment.appendChild(suggestProductElement);
            }
        });

        suggestGrid.appendChild(fragment);
        showSuggestContent();
    }

    // 17. Xử lý tìm kiếm

    function handleSearchSubmit(event) {
        event.preventDefault();

        const keyword = searchKeyword?.value.trim() || "";

        if (!keyword) {
            alert("Vui lòng nhập từ khóa tìm kiếm.");
            return;
        }

        window.location.href = "../html/search.html?keyword=" + encodeURIComponent(keyword);
    }

    // 18. Gắn sự kiện

    function handleCartClick(event) {
        const increaseBtn = event.target.closest('[data-role="increase-qty-btn"]');
        const decreaseBtn = event.target.closest('[data-role="decrease-qty-btn"]');
        const removeBtn = event.target.closest('[data-role="remove-cart-item-btn"]');

        if (increaseBtn) {
            const cartItemId = increaseBtn.dataset.cartItemId;
            increaseCartItemQuantity(cartItemId);
            return;
        }

        if (decreaseBtn) {
            const cartItemId = decreaseBtn.dataset.cartItemId;
            decreaseCartItemQuantity(cartItemId);
            return;
        }

        if (removeBtn) {
            const cartItemId = removeBtn.dataset.cartItemId;
            removeCartItem(cartItemId);
        }
    }

    function handleCartChange(event) {
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

            updateCartItemQuantity(cartItemId, quantity);
        }
    }

    function handleSelectAllChange() {
        if (!selectAllCartItems) {
            return;
        }

        selectAllCartItemsByChecked(selectAllCartItems.checked);
    }

    function bindEvents() {
        cartItemList?.addEventListener("click", handleCartClick);
        cartItemList?.addEventListener("change", handleCartChange);

        selectAllCartItems?.addEventListener("change", handleSelectAllChange);
        checkoutBtn?.addEventListener("click", handleCheckout);
        searchForm?.addEventListener("submit", handleSearchSubmit);
    }

    // 19. Load dữ liệu cart

    function loadCartData() {
        const storedCartItems = getCartItemsFromStorage();

        cartItems = normalizeCartItems(storedCartItems);

        saveCartItemsToStorage();
    }

    // 20. Khởi tạo trang cart

    function initCartPage() {
        showCartLoading();

        try {
            loadCartData();
            bindEvents();
            renderCartPage();
            renderSuggestProducts();
        } catch (error) {
            console.error("Lỗi khởi tạo trang giỏ hàng:", error);
            showCartError();
            showSuggestError();
        }
    }

    initCartPage();
});