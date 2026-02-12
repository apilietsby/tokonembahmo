// KONFIGURASI SUPABASE
const { createClient } = supabase;
const supabaseUrl = 'https://your_supabase_url';
const supabaseKey = 'your_supabase_key';
const supabase = createClient(supabaseUrl, supabaseKey);

// STATE APLIKASI
let cart = [];
let products = [];

// Load Cart
function loadCart() {
    const storedCart = localStorage.getItem('cart');
    cart = storedCart ? JSON.parse(storedCart) : [];
}

// Update Cart Badge
function updateCartBadge() {
    const cartCount = cart.length;
    document.getElementById('cart-badge').innerText = cartCount > 0 ? cartCount : '';
}

// Save Cart
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

// Fetch Products
async function fetchProducts() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) console.error('Error fetching products:', error);
    else products = data;
}

// Render Products
function renderProducts() {
    const productContainer = document.getElementById('product-list');
    productContainer.innerHTML = products.map(product => `
        <div class="product">
            <img src="${product.image || 'default-image.png'}" alt="${product.name || 'Product'}" />
            <h3>${product.name || 'No Name'}</h3>
            <p>${product.price ? `$${product.price.toFixed(2)}` : 'Price not available'}</p>
            <button onclick="addToCart(${product.id})">Add to Cart</button>
        </div>
    `).join('');
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        saveCart();
    }
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

// Update Cart Quantity
function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        saveCart();
    }
}

// DOMContentLoaded initialization
document.addEventListener('DOMContentLoaded', async () => {
    loadCart();
    await fetchProducts();
    renderProducts();
});

// Null safety checks included for price and image fields