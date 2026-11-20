"use strict";

const grid = document.getElementById("audio-grid");
const empty = document.getElementById("audio-empty");
const count = document.getElementById("audio-count");

function escapeAudio(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));
}
function audioCategory(value) {
  return /^(audio|headphone|headphones|earbuds|earphones|speaker|speakers)$/i.test(String(value || "").trim());
}
function audioMoney(value) {
  return new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(value)||0);
}
async function renderAudio() {
  try {
    const products = await loadTechStoreProducts();
    const items = products.filter(product => audioCategory(product.category) ||
      /^(audio|headphone|headphones|earbuds|earphones|speaker|speakers)$/i.test(String(product.raw_category || "")));
    count.textContent = items.length + (items.length === 1 ? " product" : " products");
    if (!items.length) {
      grid.replaceChildren();
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    grid.innerHTML = items.map(product => {
      const image = product.image_url
        ? '<img class="product-image" src="' + escapeAudio(product.image_url) + '" alt="' + escapeAudio(product.name) + '" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">'
        : "";
      const stock = Number(product.stock);
      const soldOut = Number.isFinite(stock) && stock <= 0;
      return `
        <article class="product-card apple-product-card audio-product-card" data-audio-product="${escapeAudio(product.id)}" tabindex="0" role="link" aria-label="View ${escapeAudio(product.name)} details">
          <div class="product-art apple-product-art">
            ${image}
            <span class="product-emoji" aria-hidden="true" ${image ? "hidden" : ""}>🎧</span>
          </div>
          <div class="product-info apple-product-info">
            <span class="product-category">AUDIO</span>
            <h3>${escapeAudio(product.name)}</h3>
            <p class="product-description">${escapeAudio(product.description || "Discover this audio product at TechStore.")}</p>
            <div class="apple-product-footer"><span class="product-price">${audioMoney(product.price)}</span><span class="audio-stock">${soldOut ? "Out of stock" : "View details"}</span></div>
            <button class="apple-buy-button" type="button" data-audio-view="${escapeAudio(product.id)}">View product</button>
          </div>
        </article>`;
    }).join("");
  } catch (error) {
    count.textContent = "Unable to load products";
    grid.innerHTML = '<p class="detail-error">Unable to load audio products. Please refresh the page.</p>';
    console.error("Audio catalogue error:", error);
  }
}
grid.addEventListener("click", event => {
  const card = event.target.closest("[data-audio-product]");
  if (!card) return;
  window.location.href = "/product.html?id=" + encodeURIComponent(card.dataset.audioProduct);
});
grid.addEventListener("keydown", event => {
  const card = event.target.closest("[data-audio-product]");
  if (card && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    window.location.href = "/product.html?id=" + encodeURIComponent(card.dataset.audioProduct);
  }
});
renderAudio();
