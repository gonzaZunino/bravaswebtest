// ============================================================
// BRAVAS — lógica compartida v2
// Estado en memoria (no localStorage): este prototipo se ejecuta
// como referencia visual. En Tiendanube, carrito/cuenta/favoritos
// los maneja la plataforma de forma nativa.
// ============================================================

const state = {
  cart: [],      // { id, name, variant, price, qty }
  wishlist: new Set()
};

function money(n){ return '$' + Math.round(n).toLocaleString('es-AR'); }

// Ilustraciones de producto (mismas que en el HTML) para mostrar en el carrito
// sin depender de fotos externas.
const CART_ICONS = {
  cartera: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M32 40 Q32 20 50 20 Q68 20 68 40"/><rect x="22" y="40" width="56" height="42" rx="5"/><path d="M22 54 h56"/><circle cx="50" cy="60" r="2.4" fill="currentColor" stroke="none"/></svg>',
  bandolera: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12 L46 46"/><path d="M80 12 L54 46"/><rect x="30" y="46" width="40" height="34" rx="6"/><path d="M30 58 h40"/></svg>',
  mochila: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M36 32 Q36 16 50 16 Q64 16 64 32"/><rect x="26" y="32" width="48" height="52" rx="9"/><rect x="36" y="52" width="28" height="20" rx="4"/><path d="M31 32 v12"/><path d="M69 32 v12"/></svg>',
  rinonera: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 55 h84"/><rect x="24" y="38" width="52" height="34" rx="15"/><circle cx="50" cy="55" r="3" fill="currentColor" stroke="none"/></svg>',
  valija: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M42 28 v-6 q0-4 4-4 h8 q4 0 4 4 v6"/><rect x="22" y="28" width="56" height="50" rx="6"/><path d="M50 28 v50"/><circle cx="32" cy="82" r="2.6" fill="currentColor" stroke="none"/><circle cx="68" cy="82" r="2.6" fill="currentColor" stroke="none"/></svg>',
  tote: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M34 38 Q34 18 50 18 Q66 18 66 38"/><path d="M26 38 L20 82 h60 L74 38 Z"/></svg>'
};

// -------- Menú mobile (drawer, 2 niveles) --------
const menuDrawer = document.getElementById('menuDrawer');
const menuOverlay = document.getElementById('menuOverlay');
const openMenuBtn = document.getElementById('openMenu');
const closeMenuBtn = document.getElementById('closeMenu');
const cartDrawer = document.getElementById('cartDrawer');

function anyDrawerOpen(){
  return menuDrawer?.classList.contains('is-open') || cartDrawer?.classList.contains('is-open');
}
function openMenu(){ menuDrawer?.classList.add('is-open'); menuOverlay?.classList.add('is-open'); document.body.classList.add('body-lock'); }
function closeMenu(){ menuDrawer?.classList.remove('is-open'); if(!cartDrawer?.classList.contains('is-open')){ menuOverlay?.classList.remove('is-open'); document.body.classList.remove('body-lock'); } }
openMenuBtn?.addEventListener('click', openMenu);
closeMenuBtn?.addEventListener('click', closeMenu);

document.querySelectorAll('.menu-list-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const submenu = document.getElementById(toggle.dataset.target);
    const isOpen = toggle.classList.toggle('is-open');
    submenu?.classList.toggle('is-open', isOpen);
  });
});

// -------- Carrito (drawer) --------
const openCartBtns = document.querySelectorAll('[data-open-cart]');
const closeCartBtn = document.getElementById('closeCart');
const cartItemsEl = document.getElementById('cartItems');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartCountEls = document.querySelectorAll('[data-cart-count]');

function openCart(){ cartDrawer?.classList.add('is-open'); menuOverlay?.classList.add('is-open'); document.body.classList.add('body-lock'); }
function closeCart(){ cartDrawer?.classList.remove('is-open'); if(!menuDrawer?.classList.contains('is-open')){ menuOverlay?.classList.remove('is-open'); document.body.classList.remove('body-lock'); } }
openCartBtns.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openCart(); }));
closeCartBtn?.addEventListener('click', closeCart);
menuOverlay?.addEventListener('click', () => { closeMenu(); closeCart(); });

function addToCart(item){
  const existing = state.cart.find(i => i.id === item.id && i.variant === item.variant);
  if(existing){ existing.qty += 1; } else { state.cart.push({ ...item, qty:1 }); }
  renderCart();
  showToast(`Agregado: ${item.name}`);
  openCart();
}
function changeQty(index, delta){
  const item = state.cart[index]; if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){ state.cart.splice(index,1); }
  renderCart();
}
function removeItem(index){ state.cart.splice(index,1); renderCart(); }

function renderCart(){
  if(!cartItemsEl) return;
  const totalCount = state.cart.reduce((a,i)=>a+i.qty,0);
  cartCountEls.forEach(el => { el.textContent = totalCount; el.style.display = totalCount > 0 ? 'flex' : 'none'; });

  if(state.cart.length === 0){
    cartItemsEl.innerHTML = `<div class="cart-empty">Tu carrito está vacío.<br><br><a href="index.html#mas-vendidas" class="btn btn-outline btn-sm">Ver más vendidas</a></div>`;
    if(cartSubtotalEl) cartSubtotalEl.textContent = money(0);
    return;
  }
  cartItemsEl.innerHTML = state.cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-media"><div class="bag-illo ${item.tint || 'tint-beige'}">${CART_ICONS[item.icon] || CART_ICONS.cartera}</div></div>
      <div class="cart-item-info">
        <div class="cart-item-top">
          <div><div class="cart-item-name">${item.name}</div><div class="cart-item-variant">${item.variant}</div></div>
          <div class="cart-item-price">${money(item.price * item.qty)}</div>
        </div>
        <div class="cart-qty">
          <button aria-label="Restar" onclick="changeQty(${idx},-1)">–</button>
          <span>${item.qty}</span>
          <button aria-label="Sumar" onclick="changeQty(${idx},1)">+</button>
        </div>
        <button class="cart-remove" onclick="removeItem(${idx})">Quitar</button>
      </div>
    </div>
  `).join('');
  const subtotal = state.cart.reduce((a,i)=>a + i.price*i.qty, 0);
  if(cartSubtotalEl) cartSubtotalEl.textContent = money(subtotal);
}

// -------- Favoritos --------
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.product-wish');
  if(!btn) return;
  e.preventDefault();
  const id = btn.dataset.id;
  btn.classList.toggle('active');
  if(state.wishlist.has(id)) state.wishlist.delete(id); else state.wishlist.add(id);
  showToast(state.wishlist.has(id) ? 'Guardado en favoritos' : 'Quitado de favoritos');
});

// -------- Toast --------
let toastTimer;
function showToast(msg){
  const toast = document.getElementById('toast');
  if(!toast) return;
  toast.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> ${msg}`;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

// -------- Bind de "Agregar" --------
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add-to-cart]');
  if(!btn) return;
  e.preventDefault();
  addToCart({
    id: btn.dataset.id,
    name: btn.dataset.name,
    variant: btn.dataset.variant || 'Color único',
    price: Number(btn.dataset.price),
    icon: btn.dataset.icon || 'cartera',
    tint: btn.dataset.tint || 'tint-beige'
  });
});

// -------- Bottom tab bar: estado activo + abrir carrito/menú --------
document.querySelectorAll('.tab-item[data-tab-action]').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const action = tab.dataset.tabAction;
    if(action === 'cart'){ e.preventDefault(); openCart(); }
    if(action === 'menu'){ e.preventDefault(); openMenu(); }
  });
});

// -------- Fade-in al hacer scroll --------
const revealEls = document.querySelectorAll('.reveal');
if('IntersectionObserver' in window && revealEls.length){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){ entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

// Init
renderCart();
