// 1. Chờ HTML tải xong

document.addEventListener("DOMContentLoaded", function () {
    const searchPage = document.querySelector('[data-page="search"]');

    if (!searchPage) {
        return;
    }

    // 2. Key localStorage

    const CART_STORAGE_KEY = "cart_items";
    const CHECKOUT_STORAGE_KEY = "checkout_items";

    // 3. Biến trạng thái search

    let currentView = "grid";
    let currentKeyword = getKeywordFromUrl();

    // 4. Biến trạng thái quick view

    let quickViewProduct = null;
    let quickViewImageIndex = 0;
    let quickViewSelectedColor = "";
    let quickViewSelectedSize = "";
    let quickViewQuantity = 1;

    // 5. Lấy DOM search

    const searchPageTitle = document.getElementById("searchPageTitle");

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

    // 8. Nhóm danh mục

    const categoryChildrenMap = {
        "ao-tay-ngan": ["ao-thun", "ao-polo", "ao-so-mi"],
        "ao-tay-dai": ["ao-sweater", "hoodie", "ao-khoac"],
        "quan": ["quan-dai", "quan-ngan"],
        "vay": ["vay-ngan", "vay-dai"],
        "phu-kien": ["mu", "quan-lot", "tat"]
    };

    // 9. Dữ liệu sản phẩm mẫu

    const allProducts = [
        {
            id: "at001",
            category: "ao-thun",
            name: "Áo Thun Basic Cotton",
            brand: "DUHU Shop",
            meta: "Áo thun · Form regular · Màu trắng",
            shortDesc: "Áo thun basic dễ phối đồ, phù hợp mặc hằng ngày.",
            material: "Cotton mềm, thấm hút tốt và tạo cảm giác thoải mái.",
            description: "Thiết kế tối giản, form regular dễ mặc.",
            price: 159000,
            oldPrice: 199000,
            image: "../img/ao-thun-1.jpg",
            images: ["../img/ao-thun-1.jpg", "../img/ao-thun-1.jpg"],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 126,
            colors: [
                { name: "Trắng", value: "#f5f5f5" },
                { name: "Đen", value: "#111111" }
            ],
            sizes: ["S", "M", "L", "XL"]
        },
        {
            id: "at002",
            category: "ao-thun",
            name: "Áo Thun Local Brand",
            brand: "DUHU Shop",
            meta: "Áo thun · Form oversize · Màu đen",
            shortDesc: "Áo thun form oversize trẻ trung.",
            material: "Cotton pha nhẹ, giữ form tốt.",
            description: "Thiết kế basic phong cách local brand.",
            price: 189000,
            oldPrice: 0,
            image: "../img/ao-thun-2.jpg",
            images: ["../img/ao-thun-2.jpg", "../img/ao-thun-2.jpg"],
            isNew: false,
            isSale: false,
            inStock: true,
            sold: 98,
            colors: [{ name: "Đen", value: "#111111" }],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "at003",
            category: "ao-thun",
            name: "Áo Thun Graphic Street",
            brand: "DUHU Shop",
            meta: "Áo thun · Form rộng · Màu xám",
            shortDesc: "Áo thun graphic nổi bật.",
            material: "Cotton dày vừa, bề mặt mềm.",
            description: "Họa tiết graphic tạo điểm nhấn.",
            price: 219000,
            oldPrice: 259000,
            image: "../img/ao-thun-3.jpg",
            images: ["../img/ao-thun-3.jpg", "../img/ao-thun-3.jpg"],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 84,
            colors: [
                { name: "Xám", value: "#888888" },
                { name: "Kem", value: "#e8dcc8" }
            ],
            sizes: ["M", "L"]
        },
        {
            id: "ap001",
            category: "ao-polo",
            name: "Áo Polo Nam Basic",
            brand: "DUHU Shop",
            meta: "Áo polo · Form regular · Màu navy",
            shortDesc: "Áo polo basic lịch sự.",
            material: "Vải cá sấu co giãn nhẹ.",
            description: "Mẫu polo cổ bẻ dễ mặc.",
            price: 229000,
            oldPrice: 279000,
            image: "../img/ao-polo-1.jpg",
            images: ["../img/ao-polo-1.jpg", "../img/ao-polo-1.jpg"],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 105,
            colors: [
                { name: "Navy", value: "#243b6b" },
                { name: "Trắng", value: "#f5f5f5" }
            ],
            sizes: ["S", "M", "L", "XL"]
        },
        {
            id: "ap002",
            category: "ao-polo",
            name: "Áo Polo Cổ Bẻ Classic",
            brand: "DUHU Shop",
            meta: "Áo polo · Form vừa · Màu đen",
            shortDesc: "Áo polo cổ bẻ đơn giản.",
            material: "Vải thun cá sấu mềm.",
            description: "Thiết kế classic phù hợp nhiều hoàn cảnh.",
            price: 249000,
            oldPrice: 0,
            image: "../img/ao-polo-2.jpg",
            images: ["../img/ao-polo-2.jpg", "../img/ao-polo-2.jpg"],
            isNew: false,
            isSale: false,
            inStock: true,
            sold: 73,
            colors: [{ name: "Đen", value: "#111111" }],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "asm001",
            category: "ao-so-mi",
            name: "Áo Sơ Mi Trắng Công Sở",
            brand: "DUHU Shop",
            meta: "Áo sơ mi · Form regular · Màu trắng",
            shortDesc: "Áo sơ mi trắng thanh lịch.",
            material: "Vải kate cotton mềm, thoáng.",
            description: "Thiết kế tối giản, dễ phối quần tây.",
            price: 259000,
            oldPrice: 319000,
            image: "../img/ao-so-mi-1.jpg",
            images: ["../img/ao-so-mi-1.jpg", "../img/ao-so-mi-1.jpg"],
            isNew: false,
            isSale: true,
            inStock: true,
            sold: 91,
            colors: [{ name: "Trắng", value: "#f5f5f5" }],
            sizes: ["S", "M", "L", "XL"]
        },
        {
            id: "sw001",
            category: "ao-sweater",
            name: "Áo Sweater Basic Nỉ",
            brand: "DUHU Shop",
            meta: "Áo sweater · Form rộng · Màu xám",
            shortDesc: "Áo sweater nỉ mềm, dễ phối.",
            material: "Nỉ cotton mềm, mặt trong êm.",
            description: "Thiết kế basic, phù hợp mặc đi học.",
            price: 279000,
            oldPrice: 339000,
            image: "../img/ao-sweater-1.jpg",
            images: ["../img/ao-sweater-1.jpg", "../img/ao-sweater-1.jpg"],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 88,
            colors: [
                { name: "Xám", value: "#888888" },
                { name: "Đen", value: "#111111" }
            ],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "sw002",
            category: "ao-sweater",
            name: "Áo Sweater Minimal Logo",
            brand: "DUHU Shop",
            meta: "Áo sweater · Form regular · Màu be",
            shortDesc: "Áo sweater logo nhỏ, đơn giản.",
            material: "Nỉ da cá nhẹ, thoáng.",
            description: "Màu be trung tính, dễ phối.",
            price: 309000,
            oldPrice: 0,
            image: "../img/ao-sweater-2.jpg",
            images: ["../img/ao-sweater-2.jpg", "../img/ao-sweater-2.jpg"],
            isNew: false,
            isSale: false,
            inStock: true,
            sold: 74,
            colors: [{ name: "Be", value: "#d8c3a5" }],
            sizes: ["S", "M", "L"]
        },
        {
            id: "hd001",
            category: "hoodie",
            name: "Áo Hoodie Basic Cotton",
            brand: "DUHU Shop",
            meta: "Áo hoodie · Form rộng · Màu đen",
            shortDesc: "Áo hoodie basic dễ phối đồ.",
            material: "Cotton pha nỉ nhẹ, mềm tay.",
            description: "Thiết kế tối giản, hiện đại.",
            price: 329000,
            oldPrice: 399000,
            image: "../img/hoodie-1.jpg",
            images: ["../img/hoodie-1.jpg", "../img/hoodie-1.jpg"],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 120,
            colors: [
                { name: "Đen", value: "#111111" },
                { name: "Xám", value: "#888888" }
            ],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "hd002",
            category: "hoodie",
            name: "Áo Hoodie Urban Style",
            brand: "DUHU Shop",
            meta: "Áo hoodie · Form vừa · Màu xám",
            shortDesc: "Mẫu hoodie trẻ trung, dễ mặc.",
            material: "Cotton pha polyester giúp áo đứng form.",
            description: "Thiết kế hướng streetwear hiện đại.",
            price: 289000,
            oldPrice: 0,
            image: "../img/hoodie-2.jpg",
            images: ["../img/hoodie-2.jpg", "../img/hoodie-2.jpg"],
            isNew: false,
            isSale: false,
            inStock: true,
            sold: 80,
            colors: [{ name: "Xám", value: "#888888" }],
            sizes: ["S", "M", "L"]
        },
        {
            id: "ak001",
            category: "ao-khoac",
            name: "Áo Khoác Dù Chống Nắng",
            brand: "DUHU Shop",
            meta: "Áo khoác · Chất dù · Màu đen",
            shortDesc: "Áo khoác dù nhẹ, tiện lợi.",
            material: "Vải dù nhẹ, dễ vệ sinh.",
            description: "Thiết kế đơn giản, mặc ngoài áo thun.",
            price: 299000,
            oldPrice: 359000,
            image: "../img/ao-khoac-1.jpg",
            images: ["../img/ao-khoac-1.jpg", "../img/ao-khoac-1.jpg"],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 112,
            colors: [
                { name: "Đen", value: "#111111" },
                { name: "Xám", value: "#888888" }
            ],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "qd001",
            category: "quan-dai",
            name: "Quần Dài Kaki Basic",
            brand: "DUHU Shop",
            meta: "Quần dài · Kaki · Màu đen",
            shortDesc: "Quần dài kaki basic dễ phối.",
            material: "Vải kaki mềm, giữ form tốt.",
            description: "Phù hợp đi học, đi chơi, đi làm.",
            price: 299000,
            oldPrice: 359000,
            image: "../img/quan-dai-1.jpg",
            images: ["../img/quan-dai-1.jpg", "../img/quan-dai-1.jpg"],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 90,
            colors: [
                { name: "Đen", value: "#111111" },
                { name: "Be", value: "#d8c3a5" }
            ],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "qn001",
            category: "quan-ngan",
            name: "Quần Short Basic",
            brand: "DUHU Shop",
            meta: "Quần ngắn · Short · Màu xám",
            shortDesc: "Quần short basic thoải mái.",
            material: "Vải cotton pha, mềm và thoáng.",
            description: "Phù hợp mặc ở nhà, đi chơi.",
            price: 179000,
            oldPrice: 219000,
            image: "../img/quan-ngan-1.jpg",
            images: ["../img/quan-ngan-1.jpg", "../img/quan-ngan-1.jpg"],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 66,
            colors: [{ name: "Xám", value: "#888888" }],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "vn001",
            category: "vay-ngan",
            name: "Váy Ngắn Chữ A",
            brand: "DUHU Shop",
            meta: "Váy ngắn · Chữ A · Màu đen",
            shortDesc: "Váy ngắn chữ A dễ phối.",
            material: "Vải mềm, đứng form nhẹ.",
            description: "Phù hợp đi chơi, dạo phố.",
            price: 249000,
            oldPrice: 299000,
            image: "../img/vay-ngan-1.jpg",
            images: ["../img/vay-ngan-1.jpg", "../img/vay-ngan-1.jpg"],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 50,
            colors: [{ name: "Đen", value: "#111111" }],
            sizes: ["S", "M", "L"]
        },
        {
            id: "vd001",
            category: "vay-dai",
            name: "Váy Dài Basic",
            brand: "DUHU Shop",
            meta: "Váy dài · Basic · Màu be",
            shortDesc: "Váy dài basic nhẹ nhàng.",
            material: "Vải mềm, rũ nhẹ.",
            description: "Phong cách nữ tính, dễ mặc.",
            price: 329000,
            oldPrice: 389000,
            image: "../img/vay-dai-1.jpg",
            images: ["../img/vay-dai-1.jpg", "../img/vay-dai-1.jpg"],
            isNew: false,
            isSale: true,
            inStock: true,
            sold: 42,
            colors: [{ name: "Be", value: "#d8c3a5" }],
            sizes: ["S", "M", "L"]
        },
        {
            id: "pk001",
            category: "mu",
            name: "Mũ Lưỡi Trai Basic",
            brand: "DUHU Shop",
            meta: "Phụ kiện · Mũ · Màu đen",
            shortDesc: "Mũ lưỡi trai basic dễ phối.",
            material: "Vải canvas nhẹ, bền.",
            description: "Phụ kiện phù hợp nhiều outfit.",
            price: 99000,
            oldPrice: 0,
            image: "../img/mu-1.jpg",
            images: ["../img/mu-1.jpg", "../img/mu-1.jpg"],
            isNew: false,
            isSale: false,
            inStock: true,
            sold: 75,
            colors: [{ name: "Đen", value: "#111111" }],
            sizes: ["F"]
        },
        {
            id: "ql001",
            category: "quan-lot",
            name: "Quần Lót Cotton Basic",
            brand: "DUHU Shop",
            meta: "Phụ kiện · Quần lót · Cotton",
            shortDesc: "Quần lót cotton mềm và thoáng.",
            material: "Cotton co giãn nhẹ.",
            description: "Thiết kế basic, thoải mái.",
            price: 79000,
            oldPrice: 99000,
            image: "../img/quan-lot-1.jpg",
            images: ["../img/quan-lot-1.jpg", "../img/quan-lot-1.jpg"],
            isNew: false,
            isSale: true,
            inStock: true,
            sold: 70,
            colors: [{ name: "Đen", value: "#111111" }],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "tat001",
            category: "tat",
            name: "Tất Cổ Cao Basic",
            brand: "DUHU Shop",
            meta: "Phụ kiện · Tất · Màu trắng",
            shortDesc: "Tất cổ cao basic dễ mang.",
            material: "Cotton pha co giãn.",
            description: "Phù hợp đi giày sneaker.",
            price: 49000,
            oldPrice: 69000,
            image: "../img/tat-1.jpg",
            images: ["../img/tat-1.jpg", "../img/tat-1.jpg"],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 110,
            colors: [{ name: "Trắng", value: "#f5f5f5" }],
            sizes: ["F"]
        }
    ];

    // 10. Hàm tiện ích

    function getKeywordFromUrl() {
        const params = new URLSearchParams(window.location.search);

        return params.get("keyword") || "";
    }

    function updateSearchUrl(keyword) {
        const nextUrl = "../html/search.html?keyword=" + encodeURIComponent(keyword);

        window.history.replaceState(null, "", nextUrl);
    }

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
        return allProducts.find(function (product) {
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

    function normalizeQuantity(value) {
        const numberValue = Number(value || 1);

        if (Number.isNaN(numberValue) || numberValue < 1) {
            return 1;
        }

        return Math.floor(numberValue);
    }

    // 11. LocalStorage

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

    function saveCartItemsToStorage(cartItems) {
        saveDataToStorage(CART_STORAGE_KEY, cartItems);
    }

    function saveCheckoutItemsToStorage(checkoutItems) {
        saveDataToStorage(CHECKOUT_STORAGE_KEY, checkoutItems);
    }

    // 12. Lấy filter

    function getSelectedPriceFilter() {
        const checkedPrice = filterForm?.querySelector('input[name="price"]:checked');

        if (!checkedPrice) {
            return "";
        }

        return checkedPrice.value;
    }

    function getSelectedTypeFilter() {
        const checkedType = filterForm?.querySelector('input[name="type"]:checked');

        if (!checkedType) {
            return "";
        }

        return checkedType.value;
    }

    // 13. Lọc sản phẩm

    function getAllowedCategoriesByType(typeValue) {
        if (!typeValue) {
            return [];
        }

        if (categoryChildrenMap[typeValue]) {
            return categoryChildrenMap[typeValue];
        }

        return [typeValue];
    }

    function filterByKeyword(products, keyword) {
        const normalizedKeyword = keyword.trim().toLowerCase();

        if (!normalizedKeyword) {
            return products;
        }

        return products.filter(function (product) {
            return (
                product.name.toLowerCase().includes(normalizedKeyword) ||
                product.meta.toLowerCase().includes(normalizedKeyword) ||
                product.category.toLowerCase().includes(normalizedKeyword) ||
                product.shortDesc.toLowerCase().includes(normalizedKeyword)
            );
        });
    }

    function filterByPrice(products, priceValue) {
        if (!priceValue) {
            return products;
        }

        return products.filter(function (product) {
            if (priceValue === "under-200") {
                return product.price < 200000;
            }

            if (priceValue === "200-300") {
                return product.price >= 200000 && product.price <= 300000;
            }

            if (priceValue === "over-300") {
                return product.price > 300000;
            }

            return true;
        });
    }

    function filterByType(products, typeValue) {
        if (!typeValue) {
            return products;
        }

        const allowedCategories = getAllowedCategoriesByType(typeValue);

        return products.filter(function (product) {
            return allowedCategories.includes(product.category);
        });
    }

    // 14. Sắp xếp sản phẩm

    function sortProducts(products, sortValue) {
        const clonedProducts = [...products];

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

        if (sortValue === "newest") {
            clonedProducts.sort(function (a, b) {
                return Number(b.isNew) - Number(a.isNew);
            });
        }

        if (sortValue === "best-seller") {
            clonedProducts.sort(function (a, b) {
                return Number(b.sold || 0) - Number(a.sold || 0);
            });
        }

        return clonedProducts;
    }

    // 15. Hiển thị trạng thái

    function showState(type) {
        loadingState?.classList.remove("show");
        emptyState?.classList.remove("show");
        errorState?.classList.remove("show");

        if (loadingState) loadingState.hidden = true;
        if (emptyState) emptyState.hidden = true;
        if (errorState) errorState.hidden = true;

        if (type === "loading" && loadingState) {
            loadingState.hidden = false;
            loadingState.classList.add("show");
        }

        if (type === "empty" && emptyState) {
            emptyState.hidden = false;
            emptyState.classList.add("show");
        }

        if (type === "error" && errorState) {
            errorState.hidden = false;
            errorState.classList.add("show");
        }
    }

    function clearProductGrid() {
        if (categoryGrid) {
            categoryGrid.innerHTML = "";
        }
    }

    function updateProductCount(count) {
        if (productCount) {
            productCount.textContent = String(count);
        }
    }

    function updateSearchTitle() {
        if (!searchPageTitle) {
            return;
        }

        if (currentKeyword.trim()) {
            searchPageTitle.textContent = 'KẾT QUẢ TÌM KIẾM: "' + currentKeyword.trim() + '"';
        } else {
            searchPageTitle.textContent = "TẤT CẢ SẢN PHẨM";
        }

        document.title = currentKeyword.trim()
            ? "Tìm kiếm: " + currentKeyword.trim()
            : "Tìm kiếm sản phẩm";
    }

    // 16. Tạo card sản phẩm

    function createProductCard(product) {
        if (!productCardTemplate) {
            return null;
        }

        const clone = productCardTemplate.content.cloneNode(true);

        const article = clone.querySelector(".productCard");
        const imageLink = clone.querySelector('[data-role="product-link"]');
        const image = clone.querySelector('[data-role="product-image"]');
        const nameLink = clone.querySelector('[data-role="product-link-text"]');
        const currentPrice = clone.querySelector('[data-role="product-price-current"]');
        const oldPrice = clone.querySelector('[data-role="product-price-old"]');
        const discountText = clone.querySelector('[data-role="product-discount"]');
        const quickBuyBtn = clone.querySelector('[data-role="quick-buy-btn"]');
        const viewDetailBtn = clone.querySelector('[data-role="view-detail-btn"]');

        const detailUrl = getProductDetailUrl(product.id);
        const discount = calculateDiscountPercent(product.price, product.oldPrice);

        if (article) {
            article.dataset.productId = product.id;
        }

        if (imageLink) {
            imageLink.href = detailUrl;
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

        if (discountText) {
            if (discount > 0) {
                discountText.textContent = "Giảm " + discount + "%";
                discountText.hidden = false;
            } else {
                discountText.textContent = "";
                discountText.hidden = true;
            }
        }

        if (quickBuyBtn) {
            quickBuyBtn.dataset.productId = product.id;
        }

        if (viewDetailBtn) {
            viewDetailBtn.href = detailUrl;
            viewDetailBtn.dataset.productId = product.id;
        }

        return clone;
    }

    // 17. Render sản phẩm

    function renderProducts(products) {
        clearProductGrid();
        updateProductCount(products.length);

        if (!products.length) {
            showState("empty");
            return;
        }

        showState("");

        const fragment = document.createDocumentFragment();

        products.forEach(function (product) {
            const productCard = createProductCard(product);

            if (productCard) {
                fragment.appendChild(productCard);
            }
        });

        categoryGrid?.appendChild(fragment);
    }

    function renderPagination() {
        if (pagination) {
            pagination.innerHTML = "";
        }
    }

    function applyViewMode(view) {
        currentView = view;

        if (!categoryGrid || !gridViewBtn || !listViewBtn) {
            return;
        }

        categoryGrid.classList.toggle("listView", view === "list");
        gridViewBtn.classList.toggle("active", view === "grid");
        listViewBtn.classList.toggle("active", view === "list");
    }

    function getFilteredAndSortedProducts() {
        let products = [...allProducts];

        const selectedPrice = getSelectedPriceFilter();
        const selectedType = getSelectedTypeFilter();
        const selectedSort = sortSelect?.value || "default";

        products = filterByKeyword(products, currentKeyword);
        products = filterByPrice(products, selectedPrice);
        products = filterByType(products, selectedType);
        products = sortProducts(products, selectedSort);

        return products;
    }

    function renderPage() {
        try {
            updateSearchTitle();

            const finalProducts = getFilteredAndSortedProducts();

            renderProducts(finalProducts);
            renderPagination();
            applyViewMode(currentView);
        } catch (error) {
            console.error("Lỗi search:", error);
            clearProductGrid();
            updateProductCount(0);
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

        const colors = Array.isArray(product.colors) && product.colors.length
            ? product.colors
            : [{ name: "Mặc định", value: "#111111" }];

        quickViewSelectedColor = colors[0].name;
        quickViewColorList.innerHTML = "";

        const fragment = document.createDocumentFragment();

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

        const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ["M"];

        quickViewSelectedSize = sizes[0];
        quickViewSizeList.innerHTML = "";

        const fragment = document.createDocumentFragment();

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

    // 19. Mở đóng quick view

    function openQuickView(productId) {
        const product = getProductById(productId);

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

    // 20. Chọn trong quick view

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

    // 21. Tạo item giỏ hàng

    function createCartItemFromQuickView() {
        return {
            cartItemId: createCartItemId(
                quickViewProduct.id,
                quickViewSelectedSize,
                quickViewSelectedColor
            ),
            id: quickViewProduct.id,
            name: quickViewProduct.name,
            price: Number(quickViewProduct.price || 0),
            oldPrice: Number(quickViewProduct.oldPrice || 0),
            image: quickViewProduct.image,
            meta: "Màu: " + quickViewSelectedColor + " / Size: " + quickViewSelectedSize,
            color: quickViewSelectedColor,
            size: quickViewSelectedSize,
            quantity: normalizeQuantity(quickViewQuantity),
            selected: true
        };
    }

    function addQuickViewProductToCart() {
        if (!quickViewProduct) {
            return;
        }

        if (!quickViewProduct.inStock) {
            alert("Sản phẩm hiện đã hết hàng.");
            return;
        }

        const cartItems = getCartItemsFromStorage();
        const newItem = createCartItemFromQuickView();

        const existingItem = cartItems.find(function (item) {
            return item.cartItemId === newItem.cartItemId;
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
            productVariant.textContent =
                "Màu: " + (item.color || "Chưa chọn") +
                " / Size: " + (item.size || "Chưa chọn");
        }

        if (productPriceQuantity) {
            productPriceQuantity.textContent =
                formatPrice(item.price) + " x " + Number(item.quantity || 0);
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

    // 24. Sở hữu ngay và checkout

    function handleQuickViewBuy() {
        addQuickViewProductToCart();
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
                selected: true
            };
        });

        saveCheckoutItemsToStorage(checkoutItems);

        window.location.href = "../html/checkout.html?mode=cart";
    }

    // 25. Sự kiện search/filter

    btnApplyFilter?.addEventListener("click", function () {
        renderPage();
    });

    btnResetFilter?.addEventListener("click", function () {
        filterForm?.reset();

        if (sortSelect) {
            sortSelect.value = "default";
        }

        currentKeyword = "";

        if (searchKeywordInput) {
            searchKeywordInput.value = "";
        }

        updateSearchUrl("");
        renderPage();
    });

    sortSelect?.addEventListener("change", function () {
        renderPage();
    });

    searchForm?.addEventListener("submit", function (event) {
        event.preventDefault();

        currentKeyword = searchKeywordInput?.value.trim() || "";

        updateSearchUrl(currentKeyword);
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

    categoryGrid?.addEventListener("click", function (event) {
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

    // 26. Sự kiện quick view

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
    quickViewQuantityInput?.addEventListener("change", updateQuickViewQuantityFromInput);
    quickViewBuyBtn?.addEventListener("click", handleQuickViewBuy);

    // 27. Sự kiện cart drawer

    cartDrawerCloseBtn?.addEventListener("click", closeCartDrawer);
    cartDrawerOverlay?.addEventListener("click", closeCartDrawer);

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

    cartDrawerCheckoutBtn?.addEventListener("click", handleCartDrawerCheckout);

    // 28. Phím ESC

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        closeQuickView();
        closeCartDrawer();
    });

    // 29. Khởi tạo search page

    function initSearchPage() {
        showState("loading");
        clearProductGrid();
        updateProductCount(0);
        renderCartDrawer();

        if (searchKeywordInput) {
            searchKeywordInput.value = currentKeyword;
        }

        setTimeout(function () {
            renderPage();
        }, 300);
    }

    initSearchPage();
});