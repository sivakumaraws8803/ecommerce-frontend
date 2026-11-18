const API = {
  authMe: "/api/auth/me",
  authLogout: "/api/auth/logout",
  products: "/api/products",
  productsAdmin: "/api/products/admin",
  orders: "/api/orders",
  customers: "/api/users",
  services: [
    { name: "Auth", port: 3001, health: "/api/auth/health" },
    { name: "Product", port: 3002, health: "/api/products/health" },
    { name: "Cart", port: 3003, health: "/api/cart/health" },
    { name: "Order", port: 3004, health: "/api/orders/health" },
    { name: "Payment", port: 3005, health: "/api/payments/health" },
    { name: "Inventory", port: 3006, health: "/api/inventory/health" },
    { name: "Image", port: 3007, health: "/api/images/health" },
    { name: "Notification", port: 3008, health: "/api/notifications/health" }
  ]
};

export async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: { Accept: "application/json", ...(options.headers || {}) }
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) {
    const error = new Error(data.error || data.message || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function getAdminUser() {
  const data = await request(API.authMe);
  return data.user || data.data?.user || data;
}

export async function loadAdminProducts() {
  const data = await request(API.productsAdmin);
  return Array.isArray(data.products) ? data.products : [];
}

export async function createAdminProduct(product) {
  return request(API.products, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  });
}

export async function loadAdminOrders() {
  const data = await request(API.orders);
  return Array.isArray(data.orders) ? data.orders : [];
}

export async function loadAdminCustomers() {
  const data = await request(API.customers);
  return Array.isArray(data.users) ? data.users : [];
}

export async function checkServiceHealth(service) {
  try {
    await request(service.health, { method: "GET" });
    return { ...service, online: true, detail: "Responding" };
  } catch (error) {
    // A health route may not exist yet; distinguish this from a confirmed outage.
    if (error.status === 404) return { ...service, online: null, detail: "Health endpoint not configured" };
    return { ...service, online: false, detail: error.status === 502 ? "Upstream unavailable" : error.message };
  }
}

export { API };