"use strict";

const grid = document.getElementById("category-grid");
const empty = document.getElementById("category-empty");
const count = document.getElementById("category-count");
const search = document.getElementById("category-search");
const params = new URLSearchParams(window.location.search);

const categoryAliases = {
  "phones": "Phones", "laptops": "Laptops", "tablets": "Tablets",
  "audio": "Audio", "smartwatches": "Smartwatches",
  "accessories": "Accessories", "all": "All"
};
const categoryDescriptions = {
  Phones: "Discover smartphones for work, creativity and everyday life.",
  Laptops: "Explore laptops for productivity, study and creative projects.",
  Tablets: "Find a tablet for entertainment, learning and getting things done.",
  Smartwatches: "Explore smartwatches and wearable technology.",
  Accessories: "Complete your setup with useful technology accessories.",
  All: "Explore the complete TechStore collection."
};
const requested = String(params.get("category") || "All").trim().toLowerCase();
const activeCategory = categoryAliases[requested] || "All";
let categoryProducts = [];

function escapeCategory(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));
}
function categoryMoney(value) {
  return new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(value)||0);
}
function renderCategory() {
  const term = search.value.trim().toLowerCase();
  const visible = categoryProducts.filter(product =>
    !term || [product.name, product.brand, product.description, product.category]
      .some(value => String(value || "").toLowerCase().includes(term))
  );
  count.textContent = visible.length + (visible.length === 1 ? " product" : " products");
  if (!visible.length) {
    grid.replaceChildren();
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  grid.innerHTML = visible.map(product => {
    const hasImage = Boolean(product.image_url);
    const stock = Number(product.stock);
    const soldOut = Number.isFinite(stock) && stock <= 0;
    return `
      <article class="product-card apple-product-card audio-product-card" data-category-product="${escapeCategory(product.id)}" tabindex="0" role="link" aria-label="View ${escapeCategory(product.name)} details">
        <div class="product-art apple-product-art">
          ${hasImage ? '<img class="product-image" src="' + escapeCategory(product.image_url) + '" alt="' + escapeCategory(product.name) + '" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">' : ""}
          <span class="product-emoji" aria-hidden="true" ${hasImage ? "hidden" : ""}>${escapeCategory(product.emoji || "📦")}</span>
        </div>
        <div class="product-info apple-product-info">
          <span class="product-category">${escapeCategory(product.category)}</span>
          <h3>${escapeCategory(product.name)}</h3>
          <p class="product-description">${escapeCategory(product.description || "Discover this product at TechStore.")}</p>
          <div class="apple-product-footer"><span class="product-price">${categoryMoney(product.price)}</span><span class="audio-stock">${soldOut ? "Out of stock" : "View details"}</span></div>
          <button class="apple-buy-button" type="button" data-category-view="${escapeCategory(product.id)}">View product</button>
        </div>
      </article>`;
  }).join("");
}
function openProduct(card) {
  if (!card) return;
  window.location.href = "/product.html?id=" + encodeURIComponent(card.dataset.categoryProduct);
}
grid.addEventListener("click", event => openProduct(event.target.closest("[data-category-product]")));
grid.addEventListener("keydown", event => {
  const card = event.target.closest("[data-category-product]");
  if (card && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    openProduct(card);
  }
});
search.addEventListener("input", renderCategory);

async function loadCategory() {
  document.getElementById("category-title").textContent = activeCategory === "All" ? "Shop all." : activeCategory + ".";
  document.getElementById("category-heading").textContent = activeCategory === "All" ? "Explore all products" : "Explore " + activeCategory.toLowerCase();
  document.getElementById("category-description").textContent = categoryDescriptions[activeCategory] || "Explore products in this collection.";
  document.title = (activeCategory === "All" ? "Shop all" : activeCategory) + " — TechStore";
  try {
    const products = await loadTechStoreProducts();
    categoryProducts = activeCategory === "All"
      ? products
      : products.filter(product => String(product.category || "").toLowerCase() === activeCategory.toLowerCase());
    renderCategory();
  } catch (error) {
    count.textContent = "Unable to load products";
    grid.innerHTML = '<p class="detail-error">Unable to load products. Please refresh the page.</p>';
    console.error("Category catalogue error:", error);
  }
}
loadCategory();
