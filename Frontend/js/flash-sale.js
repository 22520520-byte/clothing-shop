// 1. Chờ HTML tải xong

document.addEventListener("DOMContentLoaded", function () {
    const flashSalePage = document.querySelector(".flashSalePage");

    if (!flashSalePage) {
        return;
    }

    // 2. Key localStorage

    const CART_STORAGE_KEY = "cart_items";
    const CHECKOUT_STORAGE_KEY = "checkout_items";
    const FLASH_END_TIME_KEY = "flash_sale_end_time";

    // 3. Biến trạng thái flash sale

    let currentFilter = "all";
    let currentSort = "default";
    let currentView = "grid";
    let currentKeyword = "";
    let countdownTimer = null;

    // 4. Biến trạng thái quick view

    let quickViewProduct = null;
    let quickViewImageIndex = 0;
    let quickViewSelectedColor = "";
    let quickViewSelectedSize = "";
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

    // 8. Dữ liệu sản phẩm flash sale

    const flashProducts = [
        {
            id: "hd001",
            category: "hoodie",
            flashType: "shirt",
            name: "Áo Hoodie Basic Cotton",
            brand: "DUHU Shop",
            meta: "Áo hoodie · Form rộng · Màu đen",
            material: "Chất liệu cotton pha nỉ nhẹ, mềm tay, thoáng và giữ ấm vừa phải.",
            description: "Thiết kế tối giản, hiện đại, phù hợp đi học, đi chơi và mặc hằng ngày.",
            price: 329000,
            oldPrice: 399000,
            image: "../img/hoodie-1.jpg",
            images: ["../img/hoodie-1.jpg", "../img/hoodie-1.jpg"],
            sold: 120,
            totalStock: 160,
            inStock: true,
            colors: [
                { name: "Đen", value: "#111111" },
                { name: "Xám", value: "#888888" }
            ],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "sw001",
            category: "ao-sweater",
            flashType: "shirt",
            name: "Áo Sweater Basic Nỉ",
            brand: "DUHU Shop",
            meta: "Áo sweater · Form rộng · Màu xám",
            material: "Nỉ cotton mềm, mặt trong êm và giữ form tốt.",
            description: "Thiết kế basic, phù hợp mặc đi học, đi chơi hoặc dạo phố.",
            price: 279000,
            oldPrice: 339000,
            image: "../img/ao-sweater-1.jpg",
            images: ["../img/ao-sweater-1.jpg", "../img/ao-sweater-1.jpg"],
            sold: 88,
            totalStock: 120,
            inStock: true,
            colors: [
                { name: "Xám", value: "#888888" },
                { name: "Đen", value: "#111111" }
            ],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "at001",
            category: "ao-thun",
            flashType: "shirt",
            name: "Áo Thun Basic Cotton",
            brand: "DUHU Shop",
            meta: "Áo thun · Form regular · Màu trắng",
            material: "Cotton mềm, thấm hút tốt và tạo cảm giác thoải mái.",
            description: "Thiết kế tối giản, form regular dễ mặc, phù hợp đi học, đi chơi hoặc mặc ở nhà.",
            price: 159000,
            oldPrice: 199000,
            image: "../img/ao-thun-1.jpg",
            images: ["../img/ao-thun-1.jpg", "../img/ao-thun-1.jpg"],
            sold: 126,
            totalStock: 180,
            inStock: true,
            colors: [
                { name: "Trắng", value: "#f5f5f5" },
                { name: "Đen", value: "#111111" }
            ],
            sizes: ["S", "M", "L", "XL"]
        },
        {
            id: "ap001",
            category: "ao-polo",
            flashType: "shirt",
            name: "Áo Polo Nam Basic",
            brand: "DUHU Shop",
            meta: "Áo polo · Form regular · Màu navy",
            material: "Vải cá sấu co giãn nhẹ, thoáng và giữ form tốt.",
            description: "Mẫu polo cổ bẻ dễ mặc, tạo cảm giác gọn gàng và lịch sự.",
            price: 229000,
            oldPrice: 279000,
            image: "../img/ao-polo-1.jpg",
            images: ["../img/ao-polo-1.jpg", "../img/ao-polo-1.jpg"],
            sold: 105,
            totalStock: 150,
            inStock: true,
            colors: [
                { name: "Navy", value: "#243b6b" },
                { name: "Trắng", value: "#f5f5f5" }
            ],
            sizes: ["S", "M", "L", "XL"]
        },
        {
            id: "qd001",
            category: "quan-dai",
            flashType: "pants",
            name: "Quần Dài Kaki Basic",
            brand: "DUHU Shop",
            meta: "Quần dài · Form regular · Màu đen",
            material: "Chất kaki mềm, đứng form, ít nhăn.",
            description: "Thiết kế dáng straight đơn giản, phù hợp mặc hằng ngày.",
            price: 289000,
            oldPrice: 349000,
            image: "../img/quan-dai-1.jpg",
            images: ["../img/quan-dai-1.jpg", "../img/quan-dai-1.jpg"],
            sold: 108,
            totalStock: 150,
            inStock: true,
            colors: [
                { name: "Đen", value: "#111111" },
                { name: "Be", value: "#d8c3a5" }
            ],
            sizes: ["29", "30", "31", "32"]
        },
        {
            id: "qn001",
            category: "quan-ngan",
            flashType: "pants",
            name: "Quần Short Kaki Basic",
            brand: "DUHU Shop",
            meta: "Quần ngắn · Chất kaki · Màu be",
            material: "Kaki cotton mềm, thoáng và đứng form.",
            description: "Phù hợp đi chơi, dạo phố hoặc mặc hằng ngày.",
            price: 189000,
            oldPrice: 229000,
            image: "../img/quan-ngan-1.jpg",
            images: ["../img/quan-ngan-1.jpg", "../img/quan-ngan-1.jpg"],
            sold: 116,
            totalStock: 160,
            inStock: true,
            colors: [
                { name: "Be", value: "#d8c3a5" },
                { name: "Đen", value: "#111111" }
            ],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "vn001",
            category: "vay-ngan",
            flashType: "shirt",
            name: "Váy Ngắn Chữ A",
            brand: "DUHU Shop",
            meta: "Váy ngắn · Form chữ A · Màu đen",
            material: "Vải kaki mềm, đứng form vừa phải.",
            description: "Phù hợp đi chơi, đi học hoặc phối cùng áo thun, áo sơ mi.",
            price: 249000,
            oldPrice: 299000,
            image: "../img/vay-ngan-1.jpg",
            images: ["../img/vay-ngan-1.jpg", "../img/vay-ngan-1.jpg"],
            sold: 72,
            totalStock: 100,
            inStock: true,
            colors: [
                { name: "Đen", value: "#111111" },
                { name: "Nâu", value: "#6f4e37" }
            ],
            sizes: ["S", "M", "L"]
        },
        {
            id: "mu001",
            category: "mu",
            flashType: "accessory",
            name: "Mũ Lưỡi Trai Basic",
            brand: "DUHU Shop",
            meta: "Mũ · Chất kaki · Màu đen",
            material: "Vải kaki cotton, thoáng và giữ form tốt.",
            description: "Phụ kiện đơn giản, phù hợp sử dụng hằng ngày.",
            price: 99000,
            oldPrice: 129000,
            image: "../img/mu-1.jpg",
            images: ["../img/mu-1.jpg"],
            sold: 145,
            totalStock: 200,
            inStock: true,
            colors: [
                { name: "Đen", value: "#111111" },
                { name: "Trắng", value: "#f5f5f5" }
            ],
            sizes: ["Free size"]
        },
        {
            id: "tat003",
            category: "tat",
            flashType: "accessory",
            name: "Combo Tất 5 Đôi",
            brand: "DUHU Shop",
            meta: "Tất · Combo tiết kiệm · Nhiều màu",
            material: "Cotton pha, mềm và thoáng.",
            description: "Combo 5 đôi giúp tiết kiệm chi phí và dễ thay đổi.",
            price: 159000,
            oldPrice: 199000,
            image: "../img/tat-3.jpg",
            images: ["../img/tat-3.jpg"],
            sold: 101,
            totalStock: 140,
            inStock: true,
            colors: [
                { name: "Trắng", value: "#f5f5f5" },
                { name: "Xám", value: "#888888" }
            ],
            sizes: ["Free size"]
        },
        {
            id: "ql003",
            category: "quan-lot",
            flashType: "accessory",
            name: "Combo Quần Lót 3 Chiếc",
            brand: "DUHU Shop",
            meta: "Quần lót · Combo tiết kiệm · Nhiều màu",
            material: "Cotton co giãn, mềm và thấm hút tốt.",
            description: "Combo phù hợp nhu cầu sử dụng thường xuyên.",
            price: 199000,
            oldPrice: 249000,
            image: "../img/quan-lot-3.jpg",
            images: ["../img/quan-lot-3.jpg"],
            sold: 98,
            totalStock: 130,
            inStock: true,
            colors: [
                { name: "Đen", value: "#111111" },
                { name: "Trắng", value: "#f5f5f5" }
            ],
            sizes: ["M", "L", "XL"]
        }
    ];

    // 9. Hàm tiện ích

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
        return flashProducts.find(function (product) {
            return product.id === productId;
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

    function getSoldPercent(product) {
        if (!product.totalStock || product.totalStock <= 0) {
            return 0;
        }

        return Math.min(Math.round((product.sold / product.totalStock) * 100), 100);
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

    function getDataFromStorage(key) {
        const data = localStorage.getItem(key);

        if (!data) {
            return null;
        }

        try {
            return JSON.parse(data);
        } catch (error) {
            console.error("Lỗi đọc localStorage:", error);
            return null;
        }
    }

    function saveDataToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function getCartItemsFromStorage() {
        const data = getDataFromStorage(CART_STORAGE_KEY);

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

    // 11. Countdown flash sale

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
        const endTime = getFlashSaleEndTime();

        return Date.now() >= endTime;
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

        if (distance <= 0) {
            flashSalePage.classList.add("is-ended");
        } else {
            flashSalePage.classList.remove("is-ended");
        }
    }

    function startCountdown() {
        updateCountdown();

        countdownTimer = setInterval(function () {
            updateCountdown();
            renderPage();
        }, 1000);
    }

    // 12. Cập nhật giảm giá lớn nhất

    function updateMaxDiscount() {
        const maxDiscount = flashProducts.reduce(function (maxValue, product) {
            const discount = calculateDiscountPercent(product.price, product.oldPrice);
            return Math.max(maxValue, discount);
        }, 0);

        if (maxDiscountText) {
            maxDiscountText.textContent = maxDiscount + "%";
        }
    }

    // 13. Lọc sản phẩm

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

    // 14. Sắp xếp sản phẩm

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

    // 15. Hiển thị trạng thái

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

    // 16. Tạo card sản phẩm flash sale

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

    // 17. Render danh sách flash sale

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

    // 18. Render quick view

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

        quickViewImage.src = images[quickViewImageIndex];
        quickViewImage.alt = product.name;
    }

    function renderQuickViewColors(product) {
        if (!quickViewColorList || !quickViewColorTemplate) {
            return;
        }

        const colors = Array.isArray(product.colors) && product.colors.length
            ? product.colors
            : [{ name: "Mặc định", value: "#111111" }];

        quickViewSelectedColor = colors[0].name;
        quickViewColorList.innerHTML = "";

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

        const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ["M"];

        quickViewSelectedSize = sizes[0];
        quickViewSizeList.innerHTML = "";

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

    // 19. Mở đóng quick view

    function openQuickView(productId) {
        const product = getProductById(productId);

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

    // 20. Xử lý chọn quick view

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

    // 21. Thêm sản phẩm vào cart drawer

    function createCartItemFromQuickView() {
        return {
            cartItemId: createCartItemId(
                quickViewProduct.id,
                quickViewSelectedSize,
                quickViewSelectedColor
            ),
            id: quickViewProduct.id,
            name: quickViewProduct.name,
            price: quickViewProduct.price,
            oldPrice: quickViewProduct.oldPrice,
            image: quickViewProduct.image,
            meta: quickViewSelectedColor + " · Size " + quickViewSelectedSize,
            color: quickViewSelectedColor,
            size: quickViewSelectedSize,
            quantity: quickViewQuantity,
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

        const cartItems = getCartItemsFromStorage();
        const newItem = createCartItemFromQuickView();

        const existingItem = cartItems.find(function (item) {
            return item.cartItemId === newItem.cartItemId;
        });

        if (existingItem) {
            existingItem.quantity = Number(existingItem.quantity || 0) + Number(newItem.quantity || 1);
            existingItem.selected = true;
        } else {
            cartItems.push(newItem);
        }

        saveCartItemsToStorage(cartItems);

        return true;
    }

    // 22. Render cart drawer

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

    // 23. Mở đóng cart drawer

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

    // 24. Xử lý sở hữu ngay và thanh toán

    function handleQuickViewBuy() {
        const added = addQuickViewProductToCart();

        if (!added) {
            return;
        }

        closeQuickView();
        openCartDrawer();
        showToast("Đã thêm sản phẩm flash sale vào giỏ hàng.", "success");
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
                selected: true
            };
        });

        saveCheckoutItemsToStorage(checkoutItems);

        window.location.href = "../html/checkout.html?mode=cart";
    }

    // 25. Xử lý sự kiện flash sale

    flashFilterBar?.addEventListener("click", function (event) {
        const tab = event.target.closest(".flashTab");

        if (!tab) {
            return;
        }

        currentFilter = tab.dataset.filter || "all";

        flashFilterBar.querySelectorAll(".flashTab").forEach(function (item) {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        renderPage();
    });

    sortSelect?.addEventListener("change", function () {
        currentSort = sortSelect.value || "default";
        renderPage();
    });

    searchForm?.addEventListener("submit", function (event) {
        event.preventDefault();

        currentKeyword = searchKeywordInput?.value || "";

        renderPage();
    });

    viewMode?.addEventListener("click", function (event) {
        const button = event.target.closest(".viewModeBtn");

        if (!button) {
            return;
        }

        const selectedView = button.dataset.view;

        if (!selectedView) {
            return;
        }

        applyViewMode(selectedView);
    });

    flashProductList?.addEventListener("click", function (event) {
        const quickBuyBtn = event.target.closest('[data-role="quick-buy-btn"]');

        if (!quickBuyBtn) {
            return;
        }

        const productId = quickBuyBtn.dataset.productId;

        if (!productId) {
            return;
        }

        openQuickView(productId);
    });

    // 26. Xử lý sự kiện quick view

    quickViewCloseBtn?.addEventListener("click", closeQuickView);
    quickViewOverlay?.addEventListener("click", closeQuickView);

    quickViewThumbs?.addEventListener("click", function (event) {
        const thumbButton = event.target.closest(".quickViewThumb");

        if (!thumbButton) {
            return;
        }

        const imageIndex = Number(thumbButton.dataset.imageIndex || 0);

        updateQuickViewImage(imageIndex);
    });

    quickViewColorList?.addEventListener("click", function (event) {
        const colorButton = event.target.closest(".quickViewColorItem");

        if (!colorButton) {
            return;
        }

        selectQuickViewColor(colorButton);
    });

    quickViewSizeList?.addEventListener("click", function (event) {
        const sizeButton = event.target.closest(".quickViewSizeItem");

        if (!sizeButton) {
            return;
        }

        selectQuickViewSize(sizeButton);
    });

    quickViewPopup?.addEventListener("click", function (event) {
        const toggleButton = event.target.closest(".quickViewToggleBtn");

        if (!toggleButton) {
            return;
        }

        const action = toggleButton.dataset.action || "";

        toggleQuickViewContent(action);
    });

    quickViewPrevImageBtn?.addEventListener("click", function () {
        updateQuickViewImage(quickViewImageIndex - 1);
    });

    quickViewNextImageBtn?.addEventListener("click", function () {
        updateQuickViewImage(quickViewImageIndex + 1);
    });

    quickViewMinusQty?.addEventListener("click", decreaseQuickViewQuantity);
    quickViewPlusQty?.addEventListener("click", increaseQuickViewQuantity);
    quickViewBuyBtn?.addEventListener("click", handleQuickViewBuy);

    // 27. Xử lý sự kiện cart drawer

    cartDrawerCloseBtn?.addEventListener("click", closeCartDrawer);
    cartDrawerOverlay?.addEventListener("click", closeCartDrawer);
    cartDrawerCheckoutBtn?.addEventListener("click", handleCartDrawerCheckout);

    cartDrawerList?.addEventListener("click", function (event) {
        const removeButton = event.target.closest('[data-role="drawer-remove-item-btn"]');

        if (!removeButton) {
            return;
        }

        const cartItemId = removeButton.dataset.cartItemId;

        if (!cartItemId) {
            return;
        }

        removeCartDrawerItem(cartItemId);
    });

    // 28. Xử lý phím ESC

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        closeQuickView();
        closeCartDrawer();
    });

    // 29. Khởi tạo trang flash sale

    function initFlashSalePage() {
        showState("loading");
        clearProductList();
        updateResultCount(0);
        updateMaxDiscount();
        renderCartDrawer();
        startCountdown();

        setTimeout(function () {
            renderPage();
        }, 300);
    }

    initFlashSalePage();

    // 30. Dọn interval khi rời trang

    window.addEventListener("beforeunload", function () {
        if (countdownTimer) {
            clearInterval(countdownTimer);
        }
    });
});