import { API, request, getAdminUser, loadAdminProducts, createAdminProduct, loadAdminOrders, loadAdminCustomers, checkServiceHealth } from "./api.js";

const $ = (id) => document.getElementById(id);
const state = { user: null, products: [], orders: [], customers: [], page: "overview" };
const money = (value) => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const safe = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
function notice(message) { const node=$("notice"); node.textContent=message; node.hidden=false; }
function clearNotice() { $("notice").hidden=true; }
function setValue(id,value) { $(id).textContent=value; }

async function authorize() {
  try {
    state.user = await getAdminUser();
    if (!["owner", "product_manager"].includes(state.user.role)) throw new Error("This account does not have Admin Panel access.");
    setValue("userName", state.user.username || state.user.fullName || state.user.email || "Administrator");
    setValue("userRole", state.user.role === "owner" ? "Store owner" : "Product manager");
    setValue("userAvatar", (state.user.username || state.user.email || "A").slice(0,1).toUpperCase());
    setValue("authStatus", "Authenticated");
    if (state.user.role !== "owner") document.querySelector('[data-page="customers"]').hidden = true;
  } catch (error) {
    notice("Admin access unavailable: " + error.message);
    setValue("authStatus", "Not authenticated");
    setTimeout(() => { window.location.href = "/account.html?next=%2Fadmin-panel%2F"; }, 1200);
    throw error;
  }
}

function navigate(page) {
  state.page=page;
  document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("active",button.dataset.page===page));
  document.querySelectorAll(".page").forEach(section => section.classList.toggle("active",section.id===`page-${page}`));
  setValue("pageTitle", ({overview:"Overview",products:"Products",orders:"Orders",customers:"Customers",inventory:"Inventory",payments:"Payments",notifications:"Notifications"})[page] || "Overview");
  if(page==="products") refreshProducts();
  if(page==="orders") refreshOrders();
  if(page==="customers") refreshCustomers();
}
document.querySelectorAll(".nav-link").forEach(button=>button.addEventListener("click",()=>navigate(button.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(button=>button.addEventListener("click",()=>navigate(button.dataset.goto)));

function renderProducts() {
  const search=$("productSearch").value.trim().toLowerCase();
  const list=state.products.filter(p=>String(p.name||"").toLowerCase().includes(search)||String(p.brand||"").toLowerCase().includes(search));
  $("productCount").textContent=`${list.length} products`;
  $("productsTable").innerHTML=list.length?list.map(p=>`<tr><td><b>${safe(p.name)}</b><br><span class="subtle">#${safe(p.id)}</span></td><td>${safe(p.category)}</td><td>${money(p.price)}</td><td>${Number(p.stock||0)}</td><td><span class="pill">${p.is_active===false?"Inactive":"Active"}</span></td></tr>`).join(""):'<tr><td colspan="5" class="empty">No matching products found.</td></tr>';
  setValue("statProducts",state.products.length);
  setValue("statInventory",state.products.reduce((sum,p)=>sum+Number(p.stock||0),0));
}
async function refreshProducts() {
  $("productsTable").innerHTML='<tr><td colspan="5" class="empty">Loading products…</td></tr>';
  try { state.products=await loadAdminProducts(); renderProducts(); }
  catch(error) { $("productsTable").innerHTML=`<tr><td colspan="5" class="empty">Product service unavailable: ${safe(error.message)}</td></tr>`; notice("Products could not be loaded. Check Product Service and Nginx routing."); }
}
$("productSearch").addEventListener("input",renderProducts);
$("addProductButton").addEventListener("click",()=>{ $("productFormCard").hidden=false; $("productForm").reset(); $("productFormTitle").textContent="Add product"; $("productFormCard").scrollIntoView({behavior:"smooth"}); });
$("cancelProduct").addEventListener("click",()=>{$("productFormCard").hidden=true;});
$("productForm").addEventListener("submit",async event=>{
  event.preventDefault(); clearNotice();
  const form=new FormData(event.currentTarget);
  const product={name:String(form.get("name")).trim(),brand:String(form.get("brand")).trim(),category:String(form.get("category")).trim(),price:Number(form.get("price")),stock:Number(form.get("stock")),description:String(form.get("description")||"").trim()};
  if(!product.name||!product.category||!Number.isFinite(product.price)||product.price<0||!Number.isSafeInteger(product.stock)||product.stock<0){notice("Enter valid product details.");return;}
  const button=event.currentTarget.querySelector('button[type="submit"]');button.disabled=true;
  try{await createAdminProduct(product);event.currentTarget.reset();$("productFormCard").hidden=true;await refreshProducts();notice("Product created successfully.");}
  catch(error){notice("Product was not saved: "+error.message);}
  finally{button.disabled=false;}
});

function renderOrders() {
  $("ordersTable").innerHTML=state.orders.length?state.orders.map(o=>`<tr><td><b>#${safe(o.id)}</b></td><td>${safe(o.username||o.customer_id||"—")}</td><td>${money(o.total_amount)}</td><td><span class="pill">${safe(o.status||"unknown")}</span></td><td>${safe(o.created_at?new Date(o.created_at).toLocaleString():"—")}</td></tr>`).join(""):'<tr><td colspan="5" class="empty">No orders returned by Order Service.</td></tr>';
  setValue("statOrders",state.orders.length);
  $("recentOrders").innerHTML=state.orders.slice(0,5).map(o=>`<div class="compact-row"><span><b>Order #${safe(o.id)}</b><small>${safe(o.status||"—")}</small></span><b>${money(o.total_amount)}</b></div>`).join("")||'<p class="empty">No recent orders.</p>';
}
async function refreshOrders(){try{state.orders=await loadAdminOrders();renderOrders();}catch(error){$("ordersTable").innerHTML=`<tr><td colspan="5" class="empty">Order Service unavailable: ${safe(error.message)}</td></tr>`;setValue("statOrders","—");}}
async function refreshCustomers(){try{state.customers=await loadAdminCustomers();$("customersTable").innerHTML=state.customers.map(u=>`<tr><td>#${safe(u.id)}</td><td><b>${safe(u.username||u.email||"—")}</b></td><td>${safe(u.role||"customer")}</td><td>${safe(u.created_at?new Date(u.created_at).toLocaleDateString():"—")}</td></tr>`).join("")||'<tr><td colspan="4" class="empty">No customer records.</td></tr>';setValue("statCustomers",state.customers.length);}catch(error){$("customersTable").innerHTML=`<tr><td colspan="4" class="empty">Customer API unavailable: ${safe(error.message)}</td></tr>`;setValue("statCustomers","—");}}
async function refreshServices(){
  const results=await Promise.all(API.services.map(checkServiceHealth));
  $("serviceList").innerHTML=results.map(s=>`<div class="service-row"><span><b>${safe(s.name)}</b> <span class="subtle">:${s.port}</span></span><span class="service-state ${s.online===true?"online":s.online===false?"offline":""}">${safe(s.detail)}</span></div>`).join("");
}
async function refreshAll(){clearNotice();await Promise.allSettled([refreshProducts(),refreshOrders(),refreshCustomers(),refreshServices()]);}
$("refreshButton").addEventListener("click",refreshAll);
$("logoutButton").addEventListener("click",async()=>{try{await request(API.authLogout,{method:"POST"});}catch(error){notice("Sign out request failed: "+error.message);return;}window.location.href="/account.html";});
$("todayLabel").textContent=new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
try{await authorize();await refreshAll();}catch{/* Access guard already displayed the reason. */}