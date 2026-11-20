"use strict";

const root = document.getElementById("productDetail");
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
let productRecord = null;
let colorVariants = [];
let selectedColorVariant = null;
let variants = [];
let selectedVariant = null;
let stockTimer = null;

function money(value) {
  return new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(Number(value)||0);
}
function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}

function renderColorVariants(product) {
  colorVariants = Array.isArray(product.color_variants)
    ? product.color_variants.filter(v => v && v.name && v.image_url)
    : [];
  if (!colorVariants.length) return "";
  selectedColorVariant = colorVariants[0];
  return `<div class="detail-color-picker">
    <div class="detail-color-heading"><strong>Color</strong><span id="selectedColorName">${safe(selectedColorVariant.name)}</span></div>
    <div class="detail-color-options" role="group" aria-label="Choose product color">
      ${colorVariants.map((variant, index) => `<button type="button" class="detail-color-option ${index === 0 ? "selected" : ""}" data-color-index="${index}" aria-label="${safe(variant.name)}" aria-pressed="${index === 0}" title="${safe(variant.name)}" style="--variant-color:${safe(variant.hex || variant.color || "#d8d8dc")}"><span></span></button>`).join("")}
    </div>
  </div>`;
}
function selectColorVariant(variant) {
  selectedColorVariant = variant;
  const image = document.getElementById("detailProductImage");
  const name = document.getElementById("selectedColorName");
  if (image && variant.image_url) image.src = variant.image_url;
  if (name) name.textContent = variant.name;
  root.querySelectorAll("[data-color-index]").forEach(button => {
    const active = colorVariants[Number(button.dataset.colorIndex)] === variant;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (!variants.length) {
    const price = document.getElementById("detailPrice");
    const stock = document.getElementById("detailStock");
    const add = document.getElementById("detailAddToCart");
    if (price && variant.price != null) price.textContent = money(variant.price);
    if (stock && variant.stock != null) {
      stock.textContent = Number(variant.stock) > 0 ? "In stock · " + variant.stock + " available" : "Currently out of stock";
      stock.classList.toggle("out-of-stock", Number(variant.stock) <= 0);
    }
    if (add && variant.stock != null) add.disabled = Number(variant.stock) <= 0;
  }
}

function saveSelectedVariantToBag() {
  if (!selectedVariant || !productRecord) return;
  let cart = {};
  let meta = {};
  try { cart = JSON.parse(localStorage.getItem("techstore-cart") || "{}") || {}; } catch (_) {}
  try { meta = JSON.parse(localStorage.getItem("techstore-cart-meta") || "{}") || {}; } catch (_) {}
  const key = "variant-" + String(selectedVariant.id);
  cart[key] = (Number(cart[key]) || 0) + 1;
  meta[key] = {
    productId: String(productRecord.id),
    variantId: String(selectedVariant.id),
    name: productRecord.name,
    variantName: selectedVariant.name,
    sku: selectedVariant.sku,
    price: Number(selectedVariant.price),
    stock: Number(selectedVariant.stock),
    image_url: selectedVariant.image_url || productRecord.image_url || "",
    attributes: selectedVariant.attributes || {}
  };
  localStorage.setItem("techstore-cart", JSON.stringify(cart));
  localStorage.setItem("techstore-cart-meta", JSON.stringify(meta));
  const button = document.getElementById("detailAddToCart");
  if (button) {
    button.textContent = "Added to Bag";
    button.disabled = true;
    window.setTimeout(() => { button.textContent = "Add to Bag"; button.disabled = Number(selectedVariant?.stock || 0) <= 0; }, 1200);
  }
}
function updateSelectedVariant(variant) {
  selectedVariant = variant;
  const price = document.getElementById("detailPrice");
  const stock = document.getElementById("detailStock");
  const image = document.getElementById("detailProductImage");
  const button = document.getElementById("detailAddToCart");
  if (price) price.textContent = money(variant.price);
  if (stock) {
    stock.textContent = Number(variant.stock) > 0 ? "In stock · " + variant.stock + " available" : "Currently out of stock";
    stock.classList.toggle("out-of-stock", Number(variant.stock) <= 0);
  }
  if (image && variant.image_url) image.src = variant.image_url;
  if (button) button.disabled = Number(variant.stock) <= 0;
}
function resetProductOptionSelection() {
  selectedVariant = null;
  const price = document.getElementById("detailPrice");
  const stock = document.getElementById("detailStock");
  const button = document.getElementById("detailAddToCart");
  if (price) price.textContent = money(productRecord.price);
  if (stock) {
    const available = Number(productRecord.stock);
    stock.textContent = Number.isFinite(available)
      ? (available > 0 ? "In stock · " + available + " available" : "Currently out of stock")
      : "Availability confirmed at checkout";
    stock.classList.toggle("out-of-stock", Number.isFinite(available) && available <= 0);
  }
  if (button) button.disabled = true;
}
function renderVariants() {
  const host = document.getElementById("detailVariantOptions");
  if (!host || !variants.length) return;
  const selectedId = selectedVariant ? String(selectedVariant.id) : "";
  host.innerHTML = '<label class="detail-variant-field"><span>Choose an option</span><select id="detailVariantSelect" required>' +
    '<option value="" disabled' + (selectedId ? "" : " selected") + '>Select an option</option>' +
    variants.map(v => {
      const attributes = Object.entries(v.attributes || {}).map(([k,val]) => k + ": " + val).join(" · ");
      const label = [v.name, attributes, money(v.price), Number(v.stock) > 0 ? "In stock" : "Out of stock"].filter(Boolean).join(" — ");
      return '<option value="' + safe(v.id) + '"' + (selectedId === String(v.id) ? " selected" : "") + '>' + safe(label) + '</option>';
    }).join("") + '</select></label>';
  document.getElementById("detailVariantSelect").addEventListener("change", event => {
    const match = variants.find(v => String(v.id) === event.target.value);
    if (match) updateSelectedVariant(match);
  });
  if (selectedId) {
    const current = variants.find(v => String(v.id) === selectedId);
    if (current) updateSelectedVariant(current);
    else resetProductOptionSelection();
  } else {
    resetProductOptionSelection();
  }
}
async function refreshVariantStock() {
  if (!productRecord) return;
  try {
    const response = await fetch("/api/products/variants/product/" + encodeURIComponent(productRecord.id), {
      headers: { Accept:"application/json" }, cache:"no-store"
    });
    if (!response.ok) throw new Error("Variant API returned HTTP " + response.status);
    const data = await response.json();
    if (!Array.isArray(data.variants)) throw new Error("Unexpected variant API response");
    variants = data.variants;
    if (!variants.length) {
      selectedVariant = null;
      const button = document.getElementById("detailAddToCart");
      if (button) button.disabled = Number(productRecord.stock) <= 0;
      return;
    }
    const previousId = selectedVariant ? String(selectedVariant.id) : "";
    selectedVariant = variants.find(v => String(v.id) === previousId) || null;
    renderVariants();
  } catch (error) {
    console.warn("Variant availability refresh failed:", error);
    const button = document.getElementById("detailAddToCart");
    if (button) button.disabled = true;
    const stock = document.getElementById("detailStock");
    if (stock) stock.textContent = "Unable to verify product options. Please refresh and try again.";
  }
}
async function loadProduct() {
  if (!productId || !/^\d+$/.test(productId)) {
    root.innerHTML = '<div class="detail-error"><h1>Product not found</h1><p>The product link is invalid.</p><a href="/">Return to TechStore</a></div>';
    return;
  }
  try {
    const response = await fetch("/api/products/" + encodeURIComponent(productId), { headers:{Accept:"application/json"}, cache:"no-store" });
    if (!response.ok) throw new Error(response.status === 404 ? "Product not found." : "Unable to load this product.");
    const data = await response.json();
    const product = data.product || data;
    if (!product || String(product.id) !== String(productId)) throw new Error("Product not found.");
    productRecord = product;
    document.title = safe(product.name) + " — TechStore";
    const stock = Number(product.stock);
    const image = product.image_url
      ? '<img id="detailProductImage" class="detail-product-image" src="' + safe(product.image_url) + '" alt="' + safe(product.name) + '" onerror="this.style.display=\'none\';document.getElementById(\'detailImageFallback\').hidden=false">'
      : "";
    root.innerHTML = `
      <section class="detail-gallery"><div class="detail-image-stage">${image}<div id="detailImageFallback" class="detail-image-fallback" ${image ? "hidden" : ""}>${safe(product.category || "TechStore")}</div></div></section>
      <section class="detail-product-copy">
        <span class="detail-eyebrow">${safe(product.category || "TECHSTORE")}</span>
        <h1>${safe(product.name)}</h1>
        ${product.brand ? '<p class="detail-brand">' + safe(product.brand) + '</p>' : ""}
        <div class="detail-price-row"><strong id="detailPrice">${money(product.price)}</strong>${Number(product.discount_percent) > 0 ? '<span class="detail-discount">' + Number(product.discount_percent) + '% OFF</span>' : ""}</div>
        <p class="detail-tax-note">Inclusive of applicable taxes.</p>
        ${renderColorVariants(product)}
        <p class="detail-description">${safe(product.description || "Discover more about this product at TechStore.")}</p>
        <div id="detailVariantOptions" class="detail-variant-options"></div>
        <div id="detailStock" class="detail-stock ${Number.isFinite(stock) && stock <= 0 ? "out-of-stock" : ""}">${Number.isFinite(stock) ? (stock > 0 ? "In stock · " + stock + " available" : "Currently out of stock") : "Availability confirmed at checkout"}</div>
        <button id="detailAddToCart" class="detail-add-button" type="button" disabled>Add to Bag</button>
        <div class="detail-specs"><h2>Product details</h2><dl>
          <div><dt>Product</dt><dd>${safe(product.name)}</dd></div>
          <div><dt>Brand</dt><dd>${safe(product.brand || "—")}</dd></div>
          <div><dt>Category</dt><dd>${safe(product.category || "—")}</dd></div>
          <div><dt>Product ID</dt><dd>${safe(product.id)}</dd></div>
        </dl></div>
      </section>`;
    root.querySelectorAll("[data-color-index]").forEach(button => {
      button.addEventListener("click", function () {
        const choice = colorVariants[Number(this.dataset.colorIndex)];
        if (choice) selectColorVariant(choice);
      });
    });
    document.getElementById("detailAddToCart").addEventListener("click", () => {
      if (selectedVariant) saveSelectedVariantToBag();
      else {
        let cart = {};
        try { cart = JSON.parse(localStorage.getItem("techstore-cart") || "{}") || {}; } catch (_) {}
        const key = String(product.id);
        cart[key] = (Number(cart[key]) || 0) + 1;
        localStorage.setItem("techstore-cart", JSON.stringify(cart));
        const button = document.getElementById("detailAddToCart");
        button.textContent = "Added to Bag";
        button.disabled = true;
        window.setTimeout(() => {
          button.textContent = "Add to Bag";
          button.disabled = Number(product.stock) <= 0;
        }, 1200);
      }
    });
    if (selectedColorVariant) selectColorVariant(selectedColorVariant);
    await refreshVariantStock();
    if (variants.length) stockTimer = window.setInterval(refreshVariantStock, 10000);
  } catch (error) {
    root.innerHTML = '<div class="detail-error"><h1>Unable to load product</h1><p>' + safe(error.message) + '</p><a href="/">Return to TechStore</a></div>';
  }
}
window.addEventListener("pagehide", () => { if (stockTimer) window.clearInterval(stockTimer); });
loadProduct();
