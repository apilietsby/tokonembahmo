<<<<<<< HEAD
// KONFIGURASI SUPABASE
const supabaseUrl = 'https://apskbihwpbgvooiskrel.supabase.co/'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2tiaWh3cGJndm9vaXNrcmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjU5ODMsImV4cCI6MjA4NjQwMTk4M30.Cvq-1GWPvOroJjGIVFsI3P9EQRUW7XR7Q_1fnaPyQow';
const db = supabase.createClient(supabaseUrl, supabaseKey);

// STATE APLIKASI
let allProducts = [];
let cart = [];

// Load Cart
try {
    cart = JSON.parse(localStorage.getItem('tokonembahmo_cart')) || [];
} catch (e) {
    cart = [];
}

// Update Cart Badge
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
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
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">Rp ${product.price.toLocaleString('id-ID')}</p>
            <button onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
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

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    fetchProducts();
});
=======
function fetchProducts() {
    return supabase
        .from('products')
        .select('*');
}
>>>>>>> b21287dd8c47a3c3c96bf27af2654403fb4656a8
