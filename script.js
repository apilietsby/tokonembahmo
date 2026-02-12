// KONFIGURASI SUPABASE
const supabaseUrl = 'https://apskbihwpbgvooiskrel.supabase.co/'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2tiaWh3cGJndm9vaXNrcmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjU5ODMsImV4cCI6MjA4NjQwMTk4M30.Cvq-1GWPvOroJjGIVFsI3P9EQRUW7XR7Q_1fnaPyQow';
const db = supabase.createClient(supabaseUrl, supabaseKey);

// STATE APLIKASI
let allProducts = [];
let cart = [];
let modalQtyCount = 1;

// Load Cart from LocalStorage
try {
    cart = JSON.parse(localStorage.getItem('tokonembahmo_cart')) || [];
} catch (e) {
    cart = [];
}

// Update Cart Badge
function updateCartBadge() {
    const badge = document.getElementById('badge-count');
    if (!badge) return;
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.innerText = total > 99 ? '99+' : total;
    badge.style.display = total === 0 ? 'none' : 'block';
}

function saveCart() {
    localStorage.setItem('tokonembahmo_cart', JSON.stringify(cart));
    updateCartBadge();
}

// Fetch Products
async function fetchProducts() {
    const list = document.getElementById('product-list');
    if (!list) return;

    list.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px;"><i class="ri-loader-4-line ri-spin"></i><br>Memuat produk...</div>';

    try {
        const { data, error } = await db
            .from('products')
            .select('*');

        if (error) throw error;

        allProducts = data || [];
        
        if (allProducts.length === 0) {
            list.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px;">Belum ada produk.</div>';
            return;
        }

        renderProducts(allProducts);

    } catch (err) {
        console.error('Error fetching products:', err.message);
        list.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: red;">Error: ${err.message}</div>`;
    }
}

// Render Products
function renderProducts(products) {
    const list = document.getElementById('product-list');
    if (!list) return;

    list.innerHTML = products.map(product => `
        <div class="product-card" onclick="showDetail(${product.id})">
            <img src="${product.image || 'https://via.placeholder.com/200'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">Rp ${(product.price || 0).toLocaleString('id-ID')}</p>
            <button onclick="event.stopPropagation(); addToCart(${product.id}, '${product.name}', ${product.price || 0})">
                <i class="ri-shopping-cart-line"></i> Tambah
            </button>
        </div>
    `).join('');
}

// Add to Cart
function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }
    saveCart();
    alert(`${name} ditambahkan ke keranjang!`);
}

// Remove from Cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
}

// Update Cart Quantity
function updateCartQty(id, qty) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.qty = Math.max(1, qty);
        saveCart();
        renderCart();
    }
}

// Render Cart
function renderCart() {
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align:center; padding:40px; color:#999;">Keranjang kosong</p>';
        document.getElementById('cart-total').innerText = 'Rp 0';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div style="background:white; padding:15px; border-radius:10px; margin-bottom:10px; box-shadow:var(--shadow); display:flex; gap:15px;">
            <div style="flex:1;">
                <h4>${item.name}</h4>
                <p style="color:var(--primary); font-weight:bold;">Rp ${(item.price || 0).toLocaleString('id-ID')}</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button class="qty-btn" onclick="updateCartQty(${item.id}, ${item.qty - 1})">-</button>
                <span style="min-width:30px; text-align:center;">${item.qty}</span>
                <button class="qty-btn" onclick="updateCartQty(${item.id}, ${item.qty + 1})">+</button>
                <button onclick="removeFromCart(${item.id})" style="background:#ff6b6b; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);
    document.getElementById('cart-total').innerText = 'Rp ' + total.toLocaleString('id-ID');
}

// Show Product Detail
function showDetail(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('d-img').src = product.image || 'https://via.placeholder.com/300';
    document.getElementById('d-name').innerText = product.name;
    document.getElementById('d-price').innerText = 'Rp ' + (product.price || 0).toLocaleString('id-ID');
    document.getElementById('d-desc').innerText = product.description || 'Deskripsi tidak tersedia';
    document.getElementById('d-qty').innerText = 1;
    modalQtyCount = 1;

    document.getElementById('modal-detail').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close Modal
function closeModal(event) {
    if (event.target.id === 'modal-detail') {
        document.getElementById('modal-detail').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Modal Quantity
function modalQty(change) {
    modalQtyCount = Math.max(1, modalQtyCount + change);
    document.getElementById('d-qty').innerText = modalQtyCount;
}

// Add to Cart from Modal
function addToCartFromModal() {
    const name = document.getElementById('d-name').innerText;
    const priceText = document.getElementById('d-price').innerText;
    const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
    const product = allProducts.find(p => p.name === name);

    if (product) {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.qty += modalQtyCount;
        } else {
            cart.push({ id: product.id, name, price, qty: modalQtyCount });
        }
        saveCart();
        alert(`${modalQtyCount}x ${name} ditambahkan ke keranjang!`);
        closeModal({ target: { id: 'modal-detail' } });
    }
}

// Search Product
function searchProduct() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm))
    );
    renderProducts(filtered);
}

// Switch Tab
function switchTab(tab) {
    document.querySelectorAll('main').forEach(el => el.style.display = 'none');
    document.getElementById('view-' + tab).style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + tab).classList.add('active');

    if (tab === 'cart') renderCart();
}

// Checkout WhatsApp
function checkoutWA() {
    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const loc = document.getElementById('c-loc').value;
    const addr = document.getElementById('c-addr').value;

    if (!name || !phone || !loc || !addr) {
        alert('Semua data wajib diisi!');
        return;
    }

    if (cart.length === 0) {
        alert('Keranjang kosong!');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);
    const message = `Halo, saya ingin pesan:\n\n${cart.map(item => `- ${item.name} (${item.qty}x) = Rp ${(item.price * item.qty).toLocaleString('id-ID')}`).join('\n')}\n\nTotal: Rp ${total.toLocaleString('id-ID')}\n\nNama: ${name}\nAlamat: ${addr}, ${loc}`;
    
    const waUrl = `https://wa.me/62${phone.replace(/^0/, '')}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
}

// Daftar Mitra
function daftarMitra(event) {
    event.preventDefault();
    alert('Pendaftaran mitra dikirim ke admin!');
}

// Cek Mitra
function cekMitra() {
    alert('Fitur cek status sedang dikembangkan');
}

// Mitra Mode
function mitraMode(mode) {
    document.getElementById('panel-daftar').style.display = mode === 'daftar' ? 'block' : 'none';
    document.getElementById('panel-login').style.display = mode === 'login' ? 'block' : 'none';
    
    document.getElementById('btn-daftar').style.background = mode === 'daftar' ? 'var(--primary)' : '#e9ecef';
    document.getElementById('btn-daftar').style.color = mode === 'daftar' ? 'white' : '#333';
    document.getElementById('btn-login').style.background = mode === 'login' ? 'var(--primary)' : '#e9ecef';
    document.getElementById('btn-login').style.color = mode === 'login' ? 'white' : '#333';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    fetchProducts();
});