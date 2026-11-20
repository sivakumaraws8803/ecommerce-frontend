"use strict";

const grid = document.getElementById("category-grid");
const empty = document.getElementById("category-empty");
const count = document.getElementById("category-count");
const search = document.getElementById("category-search");
const params = new URLSearchParams(window.location.search);
let categoryProducts = [];
let activeCategory = null;

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
    !term || [product.name, product.brand, product.description, product.raw_category]
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
          <span class="product-category">${escapeCategory(product.raw_category || product.category)}</span>
          <h3>${escapeCategory(product.name)}</h3>
          <p class="product-description">${escapeCategory(product.description || "Discover this product at TechStore.")}</p>
          <div class="apple-product-footer"><span class="product-price">${categoryMoney(product.price)}</span><span class="audio-stock">${soldOut ? "Out of stock" : "View details"}</span></div>
          <button class="apple-buy-button" type="button" data-category-view="${escapeCategory(product.id)}">View product</button>
        </div>
      </article>`;
  }).join("");
}
function openProduct(card) {
  if (card) window.location.href = "/product.html?id=" + encodeURIComponent(card.dataset.categoryProduct);
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
  try {
    const categories = await loadActiveTechStoreCategories();
    const allProducts = await loadTechStoreProducts();
    const showAll = params.get("all") === "1";
    if (showAll) {
      activeCategory = { name: "All products", slug: "all", product_count: allProducts.length };
      categoryProducts = allProducts;
    } else {
      const requestedSlug = String(params.get("slug") || "").trim().toLowerCase();
      activeCategory = categories.find(category => String(category.slug).toLowerCase() === requestedSlug);
      if (!activeCategory) {
        document.getElementById("category-title").textContent = "Category not found.";
        document.getElementById("category-heading").textContent = "This category is unavailable";
        document.getElementById("category-description").textContent = "It may have been deactivated or renamed in the Admin Portal.";
        count.textContent = "0 products";
        grid.replaceChildren();
        empty.hidden = false;
        return;
      }
      categoryProducts = allProducts.filter(product =>
        String(product.raw_category || "").trim().toLowerCase() === String(activeCategory.name).trim().toLowerCase()
      );
    }

    const title = activeCategory.name;
    document.getElementById("category-title").textContent = title + ".";
    document.getElementById("category-heading").textContent = "Explore " + title;
    document.getElementById("category-description").textContent = activeCategory.description ||
      (showAll ? "Explore the complete TechStore collection." : "Explore products in the " + title + " category.");
    document.title = title + " — TechStore";
    renderCategory();
    if (!search.value) {
      const total = Number(activeCategory.product_count ?? categoryProducts.length);
      count.textContent = total + (total === 1 ? " product" : " products");
    }
  } catch (error) {
    count.textContent = "Unable to load products";
    grid.innerHTML = '<p class="detail-error">Unable to load categories or products. Please refresh the page.</p>';
    console.error("Category catalogue error:", error);
  }
}
loadCategory();
