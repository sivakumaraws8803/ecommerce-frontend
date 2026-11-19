"use strict";

const root = document.getElementById("productDetail");
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (char) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char];
  });
}

function addProductToCart(product) {
  let cart = {};
  try {
    const stored = JSON.parse(localStorage.getItem("techstore-cart") || "{}");
    if (stored && typeof stored === "object" && !Array.isArray(stored)) cart = stored;
  } catch (_) {}
  const id = String(product.id);
  cart[id] = (Number(cart[id]) || 0) + 1;
  localStorage.setItem("techstore-cart", JSON.stringify(cart));
  const button = document.getElementById("detailAddToCart");
  if (button) {
    button.textContent = "Added to bag";
    button.disabled = true;
    setTimeout(function () {
      button.textContent = "Add to Bag";
      button.disabled = false;
    }, 1400);
  }
}

async function loadProduct() {
  if (!productId || !/^\d+$/.test(productId)) {
    root.innerHTML = '<div class="detail-error"><h1>Product not found</h1><p>The product link is invalid.</p><a href="/">Return to TechStore</a></div>';
    return;
  }

  try {
    const response = await fetch("/api/products/" + encodeURIComponent(productId), {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(response.status === 404 ? "Product not found." : "Unable to load this product.");
    const data = await response.json();
    const product = data.product || data;
    if (!product || String(product.id) !== String(productId)) throw new Error("Product not found.");

    document.title = safe(product.name) + " — TechStore";
    const imageUrl = String(product.image_url || "");
    const image = imageUrl
      ? '<img class="detail-product-image" src="' + safe(imageUrl) + '" alt="' + safe(product.name) + '" onerror="this.style.display=\'none\';document.getElementById(\'detailImageFallback\').hidden=false">'
      : "";
    const discount = Math.max(0, Number(product.discount_percent) || 0);
    const price = Number(product.price) || 0;
    const stock = Number(product.stock);
    root.innerHTML = `
      <section class="detail-gallery">
        <div class="detail-image-stage">
          ${image}
          <div id="detailImageFallback" class="detail-image-fallback" ${image ? "hidden" : ""}> ${safe(product.category || "TechStore")} </div>
        </div>
      </section>
      <section class="detail-product-copy">
        <span class="detail-eyebrow">${safe(product.category || "TECHSTORE")}</span>
        <h1>${safe(product.name)}</h1>
        ${product.brand ? '<p class="detail-brand">' + safe(product.brand) + '</p>' : ""}
        <div class="detail-price-row">
          <strong>${money(price)}</strong>
          ${discount ? '<span class="detail-discount">' + discount + '% OFF</span>' : ""}
        </div>
        <p class="detail-tax-note">Inclusive of applicable taxes.</p>
        <p class="detail-description">${safe(product.description || "Discover more about this product at TechStore.")}</p>
        <div class="detail-stock ${Number.isFinite(stock) && stock <= 0 ? "out-of-stock" : ""}">
          ${Number.isFinite(stock) ? (stock > 0 ? "In stock · " + stock + " available" : "Currently out of stock") : "Availability confirmed at checkout"}
        </div>
        <button id="detailAddToCart" class="detail-add-button" type="button" ${Number.isFinite(stock) && stock <= 0 ? "disabled" : ""}>Add to Bag</button>
        <div class="detail-specs">
          <h2>Product details</h2>
          <dl>
            <div><dt>Product</dt><dd>${safe(product.name)}</dd></div>
            <div><dt>Brand</dt><dd>${safe(product.brand || "—")}</dd></div>
            <div><dt>Category</dt><dd>${safe(product.category || "—")}</dd></div>
            <div><dt>Availability</dt><dd>${Number.isFinite(stock) ? (stock > 0 ? "In stock" : "Out of stock") : "Check at checkout"}</dd></div>
            <div><dt>Product ID</dt><dd>${safe(product.id)}</dd></div>
          </dl>
        </div>
      </section>`;
    document.getElementById("detailAddToCart")?.addEventListener("click", function () {
      addProductToCart(product);
    });
  } catch (error) {
    root.innerHTML = '<div class="detail-error"><h1>Unable to load product</h1><p>' + safe(error.message) + '</p><a href="/">Return to TechStore</a></div>';
  }
}

loadProduct();