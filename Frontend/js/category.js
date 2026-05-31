// 1. Chờ HTML tải xong

document.addEventListener("DOMContentLoaded", function () {
    const categoryPage = document.querySelector(".categoryPage");

    if (!categoryPage) {
        return;
    }

    // 2. Key localStorage

    const CART_STORAGE_KEY = "cart_items";
    const CHECKOUT_STORAGE_KEY = "checkout_items";

    // 3. Biến trạng thái category

    let currentCategory = categoryPage.dataset.category || "";
    let currentView = "grid";
    let currentKeyword = "";

    // 4. Biến trạng thái quick view

    let quickViewProduct = null;
    let quickViewImageIndex = 0;
    let quickViewSelectedColor = "";
    let quickViewSelectedSize = "";
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

    // 6. Lấy phần tử DOM quick view giống home

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

    // 7. Lấy phần tử DOM cart drawer giống home

    const cartDrawerOverlay = document.getElementById("cartDrawerOverlay");
    const cartDrawer = document.getElementById("cartDrawer");
    const cartDrawerCloseBtn = document.getElementById("cartDrawerCloseBtn");

    const cartDrawerCount = document.getElementById("cartDrawerCount");
    const cartDrawerEmptyState = document.getElementById("cartDrawerEmptyState");
    const cartDrawerList = document.getElementById("cartDrawerList");
    const cartDrawerSubtotal = document.getElementById("cartDrawerSubtotal");
    const cartDrawerCheckoutBtn = document.getElementById("cartDrawerCheckoutBtn");
    const cartDrawerItemTemplate = document.getElementById("cartDrawerItemTemplate");

    // 8. Danh mục cha và danh mục con

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
            description: "Thiết kế tối giản, form regular dễ mặc, phù hợp đi học, đi chơi hoặc mặc ở nhà.",
            price: 159000,
            oldPrice: 199000,
            image: "../img/ao-thun-1.jpg",
            images: [
                "../img/ao-thun-1.jpg",
                "../img/ao-thun-1.jpg"
            ],
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
            shortDesc: "Áo thun form oversize trẻ trung, dễ phối với quần jean hoặc short.",
            material: "Cotton pha nhẹ, giữ form tốt và thoáng khi mặc.",
            description: "Thiết kế basic phong cách local brand, phù hợp phong cách năng động.",
            price: 189000,
            oldPrice: 0,
            image: "../img/ao-thun-2.jpg",
            images: [
                "../img/ao-thun-2.jpg",
                "../img/ao-thun-2.jpg"
            ],
            isNew: false,
            isSale: false,
            inStock: true,
            sold: 98,
            colors: [
                { name: "Đen", value: "#111111" }
            ],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "at003",
            category: "ao-thun",
            name: "Áo Thun Graphic Street",
            brand: "DUHU Shop",
            meta: "Áo thun · Form rộng · Màu xám",
            shortDesc: "Áo thun graphic nổi bật, phù hợp phong cách streetwear.",
            material: "Cotton dày vừa, bề mặt vải mềm và ít nhăn.",
            description: "Họa tiết graphic tạo điểm nhấn, dễ phối cùng quần dài hoặc quần short.",
            price: 219000,
            oldPrice: 259000,
            image: "../img/ao-thun-3.jpg",
            images: [
                "../img/ao-thun-3.jpg",
                "../img/ao-thun-3.jpg"
            ],
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
            shortDesc: "Áo polo basic lịch sự, phù hợp đi học, đi làm hoặc đi chơi.",
            material: "Vải cá sấu co giãn nhẹ, thoáng và giữ form tốt.",
            description: "Mẫu polo cổ bẻ dễ mặc, tạo cảm giác gọn gàng và lịch sự.",
            price: 229000,
            oldPrice: 279000,
            image: "../img/ao-polo-1.jpg",
            images: [
                "../img/ao-polo-1.jpg",
                "../img/ao-polo-1.jpg"
            ],
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
            shortDesc: "Áo polo cổ bẻ đơn giản, dễ phối và ít lỗi mốt.",
            material: "Vải thun cá sấu mềm, co giãn nhẹ.",
            description: "Thiết kế classic phù hợp nhiều hoàn cảnh, từ đi học đến đi chơi.",
            price: 249000,
            oldPrice: 0,
            image: "../img/ao-polo-2.jpg",
            images: [
                "../img/ao-polo-2.jpg",
                "../img/ao-polo-2.jpg"
            ],
            isNew: false,
            isSale: false,
            inStock: true,
            sold: 73,
            colors: [
                { name: "Đen", value: "#111111" }
            ],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "ap003",
            category: "ao-polo",
            name: "Áo Polo Premium Cotton",
            brand: "DUHU Shop",
            meta: "Áo polo · Chất cotton · Màu be",
            shortDesc: "Áo polo chất cotton cao cấp, mềm và thoải mái.",
            material: "Cotton pha spandex, co giãn nhẹ và giữ dáng tốt.",
            description: "Màu sắc trung tính, dễ phối quần kaki hoặc quần jean.",
            price: 319000,
            oldPrice: 379000,
            image: "../img/ao-polo-3.jpg",
            images: [
                "../img/ao-polo-3.jpg",
                "../img/ao-polo-3.jpg"
            ],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 62,
            colors: [
                { name: "Be", value: "#d8c3a5" },
                { name: "Xanh", value: "#3f6f5f" }
            ],
            sizes: ["M", "L"]
        },

        {
            id: "asm001",
            category: "ao-so-mi",
            name: "Áo Sơ Mi Trắng Công Sở",
            brand: "DUHU Shop",
            meta: "Áo sơ mi · Form regular · Màu trắng",
            shortDesc: "Áo sơ mi trắng thanh lịch, phù hợp môi trường học tập và công sở.",
            material: "Vải kate cotton mềm, thoáng và ít nhăn.",
            description: "Thiết kế tối giản, dễ phối cùng quần tây hoặc quần kaki.",
            price: 259000,
            oldPrice: 319000,
            image: "../img/ao-so-mi-1.jpg",
            images: [
                "../img/ao-so-mi-1.jpg",
                "../img/ao-so-mi-1.jpg"
            ],
            isNew: false,
            isSale: true,
            inStock: true,
            sold: 91,
            colors: [
                { name: "Trắng", value: "#f5f5f5" }
            ],
            sizes: ["S", "M", "L", "XL"]
        },
        {
            id: "asm002",
            category: "ao-so-mi",
            name: "Áo Sơ Mi Oxford Basic",
            brand: "DUHU Shop",
            meta: "Áo sơ mi · Chất oxford · Màu xanh nhạt",
            shortDesc: "Áo sơ mi Oxford basic, đứng form và lịch sự.",
            material: "Vải Oxford dày vừa, thoáng và bền.",
            description: "Màu xanh nhạt dễ mặc, phù hợp đi học, đi làm hoặc đi chơi.",
            price: 299000,
            oldPrice: 0,
            image: "../img/ao-so-mi-2.jpg",
            images: [
                "../img/ao-so-mi-2.jpg",
                "../img/ao-so-mi-2.jpg"
            ],
            isNew: true,
            isSale: false,
            inStock: true,
            sold: 67,
            colors: [
                { name: "Xanh nhạt", value: "#b7d7e8" }
            ],
            sizes: ["M", "L", "XL"]
        },
        {
            id: "asm003",
            category: "ao-so-mi",
            name: "Áo Sơ Mi Linen Mùa Hè",
            brand: "DUHU Shop",
            meta: "Áo sơ mi · Chất linen · Màu kem",
            shortDesc: "Áo sơ mi linen nhẹ, thoáng và hợp thời tiết nóng.",
            material: "Vải linen pha cotton, thoáng khí và mềm hơn linen thường.",
            description: "Mẫu sơ mi phong cách tối giản, phù hợp đi chơi hoặc du lịch.",
            price: 349000,
            oldPrice: 399000,
            image: "../img/ao-so-mi-3.jpg",
            images: [
                "../img/ao-so-mi-3.jpg",
                "../img/ao-so-mi-3.jpg"
            ],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 58,
            colors: [
                { name: "Kem", value: "#e9dcc7" },
                { name: "Nâu", value: "#8b6f47" }
            ],
            sizes: ["M", "L"]
        },

        {
            id: "sw001",
            category: "ao-sweater",
            name: "Áo Sweater Basic Nỉ",
            brand: "DUHU Shop",
            meta: "Áo sweater · Form rộng · Màu xám",
            shortDesc: "Áo sweater nỉ mềm, dễ phối và giữ ấm vừa phải.",
            material: "Nỉ cotton mềm, mặt trong êm và giữ form tốt.",
            description: "Thiết kế basic, phù hợp mặc đi học, đi chơi hoặc dạo phố.",
            price: 279000,
            oldPrice: 339000,
            image: "../img/ao-sweater-1.jpg",
            images: [
                "../img/ao-sweater-1.jpg",
                "../img/ao-sweater-1.jpg"
            ],
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
            shortDesc: "Áo sweater logo nhỏ, đơn giản và dễ mặc.",
            material: "Nỉ da cá nhẹ, thoáng và phù hợp thời tiết mát.",
            description: "Màu be trung tính, dễ phối với quần dài hoặc quần short.",
            price: 309000,
            oldPrice: 0,
            image: "../img/ao-sweater-2.jpg",
            images: [
                "../img/ao-sweater-2.jpg",
                "../img/ao-sweater-2.jpg"
            ],
            isNew: false,
            isSale: false,
            inStock: true,
            sold: 74,
            colors: [
                { name: "Be", value: "#d8c3a5" }
            ],
            sizes: ["S", "M", "L"]
        },
        {
            id: "sw003",
            category: "ao-sweater",
            name: "Áo Sweater Streetwear",
            brand: "DUHU Shop",
            meta: "Áo sweater · Form oversize · Màu navy",
            shortDesc: "Áo sweater oversize phong cách streetwear.",
            material: "Nỉ cotton pha polyester giúp áo đứng form hơn.",
            description: "Thiết kế trẻ trung, phù hợp phối layer hoặc mặc riêng.",
            price: 369000,
            oldPrice: 429000,
            image: "../img/ao-sweater-3.jpg",
            images: [
                "../img/ao-sweater-3.jpg",
                "../img/ao-sweater-3.jpg"
            ],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 52,
            colors: [
                { name: "Navy", value: "#243b6b" }
            ],
            sizes: ["M", "L", "XL"]
        },

        {
            id: "hd001",
            category: "hoodie",
            name: "Áo Hoodie Basic Cotton",
            brand: "DUHU Shop",
            meta: "Áo hoodie · Form rộng · Màu đen",
            shortDesc: "Áo hoodie basic dễ phối đồ, chất vải mềm, giữ form tốt.",
            material: "Chất liệu cotton pha nỉ nhẹ, mềm tay, thoáng và giữ ấm vừa phải.",
            description: "Thiết kế tối giản, hiện đại, phù hợp đi học, đi chơi và mặc hằng ngày.",
            price: 329000,
            oldPrice: 399000,
            image: "../img/hoodie-1.jpg",
            images: [
                "../img/hoodie-1.jpg",
                "../img/hoodie-1.jpg",
                "../img/hoodie-1.jpg"
            ],
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
            shortDesc: "Mẫu hoodie trẻ trung, dễ mặc, tông màu trung tính.",
            material: "Cotton pha polyester giúp áo đứng form và bền hơn.",
            description: "Thiết kế hướng streetwear hiện đại, form vừa, dễ phối đồ.",
            price: 289000,
            oldPrice: 0,
            image: "../img/hoodie-2.jpg",
            images: [
                "../img/hoodie-2.jpg",
                "../img/hoodie-2.jpg"
            ],
            isNew: false,
            isSale: false,
            inStock: true,
            sold: 80,
            colors: [
                { name: "Xám", value: "#888888" }
            ],
            sizes: ["S", "M", "L"]
        },
        {
            id: "hd003",
            category: "hoodie",
            name: "Áo Hoodie Local Street",
            brand: "DUHU Shop",
            meta: "Áo hoodie · Form rộng · Màu kem",
            shortDesc: "Áo hoodie local street form rộng, trẻ trung và nổi bật.",
            material: "Nỉ cotton pha, mặt vải mềm, mặc ấm vừa phải.",
            description: "Phù hợp phong cách streetwear, phối tốt với quần jean và sneaker.",
            price: 359000,
            oldPrice: 429000,
            image: "../img/hoodie-3.jpg",
            images: [
                "../img/hoodie-3.jpg",
                "../img/hoodie-3.jpg"
            ],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 95,
            colors: [
                { name: "Kem", value: "#e9dcc7" },
                { name: "Nâu", value: "#6f4e37" }
            ],
            sizes: ["M", "L"]
        },

        {
            id: "ak001",
            category: "ao-khoac",
            name: "Áo Khoác Dù Chống Nắng",
            brand: "DUHU Shop",
            meta: "Áo khoác · Chất dù · Màu đen",
            shortDesc: "Áo khoác dù nhẹ, tiện lợi khi đi nắng hoặc đi mưa nhẹ.",
            material: "Vải dù nhẹ, bề mặt trơn, dễ vệ sinh.",
            description: "Thiết kế đơn giản, có thể mặc ngoài áo thun hoặc polo.",
            price: 299000,
            oldPrice: 359000,
            image: "../img/ao-khoac-1.jpg",
            images: [
                "../img/ao-khoac-1.jpg",
                "../img/ao-khoac-1.jpg"
            ],
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
            id: "ak002",
            category: "ao-khoac",
            name: "Áo Khoác Bomber Basic",
            brand: "DUHU Shop",
            meta: "Áo khoác · Form regular · Màu xanh",
            shortDesc: "Áo khoác bomber basic, năng động và dễ phối.",
            material: "Vải polyester dày vừa, lớp trong mềm.",
            description: "Mẫu bomber phù hợp đi chơi, dạo phố hoặc mặc hằng ngày.",
            price: 389000,
            oldPrice: 459000,
            image: "../img/ao-khoac-2.jpg",
            images: [
                "../img/ao-khoac-2.jpg",
                "../img/ao-khoac-2.jpg"
            ],
            isNew: false,
            isSale: true,
            inStock: true,
            sold: 69,
            colors: [
                { name: "Xanh", value: "#3f6f5f" }
            ],
            sizes: ["M", "L"]
        },
        {
            id: "ak003",
            category: "ao-khoac",
            name: "Áo Khoác Jean Street",
            brand: "DUHU Shop",
            meta: "Áo khoác · Chất jean · Màu xanh denim",
            shortDesc: "Áo khoác jean cá tính, phù hợp phong cách street.",
            material: "Jean cotton dày vừa, bền và đứng form.",
            description: "Dễ phối với áo thun basic, hoodie hoặc sweater.",
            price: 429000,
            oldPrice: 499000,
            image: "../img/ao-khoac-3.jpg",
            images: [
                "../img/ao-khoac-3.jpg",
                "../img/ao-khoac-3.jpg"
            ],
            isNew: true,
            isSale: true,
            inStock: true,
            sold: 57,
            colors: [
                { name: "Denim", value: "#4f6f8f" }
            ],
            sizes: ["M", "L", "XL"]
        }
    ];

    // 10. Hàm tiện ích

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

    // 11. LocalStorage

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

    // 12. Lấy danh sách category cần hiển thị

    function getAllowedCategories() {
        if (categoryChildrenMap[currentCategory]) {
            return categoryChildrenMap[currentCategory];
        }

        return [currentCategory];
    }

    function getProductsByCategory() {
        const allowedCategories = getAllowedCategories();

        return allProducts.filter(function (product) {
            return allowedCategories.includes(product.category);
        });
    }

    // 13. Lấy filter

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

    // 14. Lọc sản phẩm

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

        return products.filter(function (product) {
            return product.category === typeValue;
        });
    }

    function filterByKeyword(products, keyword) {
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

    // 15. Sắp xếp sản phẩm

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

    // 16. Hiển thị trạng thái

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

    // 17. Tạo card sản phẩm

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

    // 18. Render danh sách sản phẩm

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

        if (categoryGrid) {
            categoryGrid.appendChild(fragment);
        }
    }

    function renderPagination() {
        if (!pagination) {
            return;
        }

        pagination.innerHTML = "";
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
        let products = getProductsByCategory();

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
            const finalProducts = getFilteredAndSortedProducts();

            renderProducts(finalProducts);
            renderPagination();
            applyViewMode(currentView);
        } catch (error) {
            console.error("Lỗi khi render sản phẩm:", error);
            clearProductGrid();
            updateProductCount(0);
            showState("error");
        }
    }

    // 19. Render quick view

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

                if (index === quickViewImageIndex) {
                    button.classList.add("active");
                }
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

    // 20. Mở đóng quick view

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

    // 21. Xử lý chọn trong quick view

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

    // 22. Tạo item giỏ hàng từ quick view

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
            existingItem.quantity = Number(existingItem.quantity || 0) + Number(newItem.quantity || 1);
            existingItem.selected = true;
        } else {
            cartItems.push(newItem);
        }

        saveCartItemsToStorage(cartItems);
    }

    // 23. Render cart drawer

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

    // 24. Mở đóng cart drawer

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

    // 25. Xử lý sở hữu ngay và thanh toán

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

    // 26. Xử lý sự kiện category

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

        renderPage();
    });

    sortSelect?.addEventListener("change", function () {
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

    // 27. Xử lý sự kiện quick view

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

    // 28. Xử lý sự kiện cart drawer

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

    // 29. Xử lý phím ESC

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        closeQuickView();
        closeCartDrawer();
    });

    // 30. Khởi tạo trang category

    function initCategoryPage() {
        showState("loading");
        clearProductGrid();
        updateProductCount(0);
        renderCartDrawer();

        setTimeout(function () {
            renderPage();
        }, 300);
    }

    initCategoryPage();
});