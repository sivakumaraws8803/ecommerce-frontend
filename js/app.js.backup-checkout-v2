"use strict";

let products = [];

const fallbackProducts = [
    {
        id: "demo-1",
        name: "iPhone 17",
        category: "Phones",
        price: 79900,
        description: "A beautiful smartphone for everyday life.",
        emoji: "📱",
        color: "#e9e4f5",
        tag: "Featured",
        image_url: ""
    },
    {
        id: "demo-2",
        name: "Studio Headphones",
        category: "Audio",
        price: 14990,
        description: "Enjoy your music in comfort and clarity.",
        emoji: "🎧",
        color: "#e8e1f2",
        tag: "Popular",
        image_url: ""
    }
];

const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.getElementById("filterButtons");
const emptyMessage = document.getElementById("emptyMessage");

const cartOpenButton = document.getElementById("cartOpen");
const cartCloseButton = document.getElementById("cartClose");
const cartDrawer = document.getElementById("cartDrawer");
const cartBackdrop = document.getElementById("cartBackdrop");
const cartItemsElement = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const cartFooter = document.getElementById("cartFooter");
const cartCountElement = document.getElementById("cartCount");
const drawerCountElement = document.getElementById("drawerCount");
const cartSubtotalElement = document.getElementById("cartSubtotal");
const toastElement = document.getElementById("toast");

let activeCategory = "All";
let searchTerm = "";
let toastTimer;
const favorites = new Set();

let cart = {};

try {
    const savedCart = localStorage.getItem("techstore-cart");

    if (savedCart) {
        const parsedCart = JSON.parse(savedCart);

        if (parsedCart && typeof parsedCart === "object" && !Array.isArray(parsedCart)) {
            cart = parsedCart;
        }
    }
} catch (error) {
    console.warn("Unable to restore the saved cart.", error);
    cart = {};
}

function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(price);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return replacements[character];
    });
}

function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function () {
        toastElement.classList.remove("show");
    }, 2400);
}

function getVisibleProducts() {
    return products.filter(function (product) {
        const matchesCategory =
            activeCategory === "All" ||
            product.category === activeCategory;

        const searchContent = (
            product.name + " " +
            product.category + " " +
            product.description
        ).toLowerCase();

        const matchesSearch = searchContent.includes(searchTerm);

        return matchesCategory && matchesSearch;
    });
}

function renderProducts() {
    const visibleProducts = getVisibleProducts();

    productGrid.innerHTML = visibleProducts.map(function (product) {
        const isFavorite = favorites.has(product.id);

        return `
            <article class="product-card">
                <div class="product-art" style="--art-bg: ${product.color}">
                    <span class="product-emoji" aria-hidden="true">${product.emoji}</span>

                    ${product.tag ? `
                        <span class="product-tag">${escapeHTML(product.tag)}</span>
                    ` : ""}

                    <button
                        class="favorite-button ${isFavorite ? "selected" : ""}"
                        data-favorite="${product.id}"
                        aria-label="${isFavorite ? "Remove from" : "Add to"} favourites"
                        aria-pressed="${isFavorite}"
                        type="button"
                    >${isFavorite ? "♥" : "♡"}</button>
                </div>

                <div class="product-info">
                    <span class="product-category">${escapeHTML(product.category)}</span>
                    <h3>${escapeHTML(product.name)}</h3>
                    <p class="product-description">${escapeHTML(product.description)}</p>

                    <div class="product-bottom">
                        <span class="product-price">${formatPrice(product.price)}</span>
                        <button
                            class="add-button"
                            data-add="${product.id}"
                            aria-label="Add ${escapeHTML(product.name)} to bag"
                            type="button"
                        >+</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    emptyMessage.hidden = visibleProducts.length !== 0;
}

function setActiveCategory(category) {
    activeCategory = category;

    document.querySelectorAll(".filter-button").forEach(function (button) {
        const active = button.dataset.category === category;

        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });

    renderProducts();
}

function saveCart() {
    try {
        localStorage.setItem("techstore-cart", JSON.stringify(cart));
    } catch (error) {
        console.warn("Unable to save the cart in this browser.", error);
    }
}

function getCartQuantity() {
    return Object.values(cart).reduce(function (total, quantity) {
        return total + quantity;
    }, 0);
}

function getCartSubtotal() {
    return Object.entries(cart).reduce(function (total, entry) {
        const productId = String(entry[0]);
        const quantity = Number(entry[1]);
        const product = products.find(function (item) {
            return item.id === productId;
        });

        if (!product || !Number.isInteger(quantity) || quantity <= 0) {
            return total;
        }

        return total + product.price * quantity;
    }, 0);
}

function addToCart(productId) {
    const product = products.find(function (item) {
        return item.id === productId;
    });

    if (!product) {
        return;
    }

    cart[productId] = (Number(cart[productId]) || 0) + 1;

    saveCart();
    renderCart();
    showToast(product.name + " added to your bag.");
}

function changeQuantity(productId, change) {
    if (!products.some(function (product) {
        return product.id === productId;
    })) {
        return;
    }

    const nextQuantity = (Number(cart[productId]) || 0) + change;

    if (nextQuantity <= 0) {
        delete cart[productId];
    } else {
        cart[productId] = nextQuantity;
    }

    saveCart();
    renderCart();
}

function removeFromCart(productId) {
    delete cart[productId];

    saveCart();
    renderCart();
    showToast("Item removed from your bag.");
}

function renderCart() {
    const validEntries = Object.entries(cart).filter(function (entry) {
        const productId = String(entry[0]);
        const quantity = Number(entry[1]);

        return products.some(function (product) {
            return product.id === productId;
        }) && Number.isInteger(quantity) && quantity > 0;
    });

    cart = Object.fromEntries(validEntries);

    const itemCount = getCartQuantity();
    const subtotal = getCartSubtotal();

    cartCountElement.textContent = itemCount;
    drawerCountElement.textContent = "(" + itemCount + ")";
    cartSubtotalElement.textContent = formatPrice(subtotal);

    cartEmpty.hidden = itemCount > 0;
    cartFooter.hidden = itemCount === 0;

    cartItemsElement.innerHTML = validEntries.map(function (entry) {
        const productId = String(entry[0]);
        const quantity = Number(entry[1]);
        const product = products.find(function (item) {
            return item.id === productId;
        });

        return `
            <div class="cart-row">
                <div class="cart-product-art" style="--art-bg: ${product.color}">
                    ${product.emoji}
                </div>

                <div>
                    <p class="cart-product-name">${escapeHTML(product.name)}</p>
                    <span class="cart-product-price">${formatPrice(product.price)} each</span>

                    <div class="quantity-control">
                        <button type="button" data-decrease="${productId}" aria-label="Decrease quantity">−</button>
                        <span>${quantity}</span>
                        <button type="button" data-increase="${productId}" aria-label="Increase quantity">+</button>
                    </div>
                </div>

                <div class="cart-line-total">
                    ${formatPrice(product.price * quantity)}
                    <br>
                    <button type="button" class="remove-button" data-remove="${productId}">Remove</button>
                </div>
            </div>
        `;
    }).join("");

    saveCart();
}

function openCart() {
    cartDrawer.classList.add("open");
    cartBackdrop.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    cartCloseButton.focus();
}

function closeCart() {
    cartDrawer.classList.remove("open");
    cartBackdrop.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    cartOpenButton.focus();
}

function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.dataset.theme || "light";
    const nextTheme = currentTheme === "light" ? "dark" : "light";

    root.dataset.theme = nextTheme;

    try {
        localStorage.setItem("techstore-theme", nextTheme);
    } catch (error) {
        console.warn("Unable to save theme preference.", error);
    }
}

function restoreTheme() {
    try {
        const savedTheme = localStorage.getItem("techstore-theme");

        if (savedTheme === "dark" || savedTheme === "light") {
            document.documentElement.dataset.theme = savedTheme;
        } else {
            document.documentElement.dataset.theme = "light";
        }
    } catch (error) {
        document.documentElement.dataset.theme = "light";
    }
}

productGrid.addEventListener("click", function (event) {
    const addButton = event.target.closest("[data-add]");
    const favoriteButton = event.target.closest("[data-favorite]");

    if (addButton) {
        addToCart(String(addButton.dataset.add));
        return;
    }

    if (favoriteButton) {
        const productId = String(favoriteButton.dataset.favorite);

        if (favorites.has(productId)) {
            favorites.delete(productId);
            showToast("Removed from favourites.");
        } else {
            favorites.add(productId);
            showToast("Added to favourites.");
        }

        renderProducts();
    }
});

filterButtons.addEventListener("click", function (event) {
    const button = event.target.closest("[data-category]");

    if (button) {
        setActiveCategory(button.dataset.category);
    }
});

document.querySelectorAll(".category-card").forEach(function (button) {
    button.addEventListener("click", function () {
        setActiveCategory(button.dataset.category);
        searchInput.value = "";
        searchTerm = "";

        document.getElementById("products").scrollIntoView({
            behavior: "smooth"
        });
    });
});

searchInput.addEventListener("input", function () {
    searchTerm = searchInput.value.trim().toLowerCase();
    renderProducts();
});

cartItemsElement.addEventListener("click", function (event) {
    const increaseButton = event.target.closest("[data-increase]");
    const decreaseButton = event.target.closest("[data-decrease]");
    const removeButton = event.target.closest("[data-remove]");

    if (increaseButton) {
        changeQuantity(String(increaseButton.dataset.increase), 1);
    } else if (decreaseButton) {
        changeQuantity(String(decreaseButton.dataset.decrease), -1);
    } else if (removeButton) {
        removeFromCart(String(removeButton.dataset.remove));
    }
});

cartOpenButton.addEventListener("click", openCart);
cartCloseButton.addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);

document.getElementById("continueShopping").addEventListener("click", function () {
    closeCart();

    document.getElementById("products").scrollIntoView({
        behavior: "smooth"
    });
});

document.getElementById("themeToggle").addEventListener("click", toggleTheme);

document.getElementById("menuToggle").addEventListener("click", function () {
    const mobileNav = document.getElementById("mobileNav");
    const isOpen = mobileNav.classList.toggle("open");

    this.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll("#mobileNav a").forEach(function (link) {
    link.addEventListener("click", function () {
        document.getElementById("mobileNav").classList.remove("open");
        document.getElementById("menuToggle").setAttribute("aria-expanded", "false");
    });
});

document.getElementById("checkoutButton").addEventListener("click", function () {
    showToast("Demo storefront only. Checkout is not connected yet.");
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && cartDrawer.classList.contains("open")) {
        closeCart();
    }
});

document.getElementById("currentYear").textContent = new Date().getFullYear();

restoreTheme();

// Load products from the backend before rendering the storefront.
loadTechStoreProducts()
    .then(function (loadedProducts) {
        products = loadedProducts;

        renderProducts();
        renderCart();

        console.log(
            "TechStore products loaded successfully:",
            products.length
        );
    })
    .catch(function (error) {
        console.error("Unable to load TechStore products:", error);

        products = fallbackProducts;
        renderProducts();
        renderCart();
    });
