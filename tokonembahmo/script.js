// script.js - VERSI DISEMPURNAKAN (FRONTEND TOKO)

// KONFIGURASI SUPABASE
const supabaseUrl = 'https://apskbihwpbgvooiskrel.supabase.co/'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2tiaWh3cGJndm9vaXNrcmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjU5ODMsImV4cCI6MjA4NjQwMTk4M30.Cvq-1GWPvOroJjGIVFsI3P9EQRUW7XR7Q_1fnaPyQow';
const noAdmin = '6285700800278';
const db = supabase.createClient(supabaseUrl, supabaseKey);

// STATE APLIKASI
let allProducts = [];
let cart = [];
let selectedVariant = null; 

// Load Cart dengan Error Handling
try {
    cart = JSON.parse(localStorage.getItem('tokonembahmo_cart')) || [];
} catch (e) {
    console.error("Cart data corrupted, resetting.", e);
    cart = [];
    localStorage.removeItem('tokonembahmo_cart');
}

// --- 1. KERANJANG & BADGE ---
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

// --- 2. AMBIL DATA PRODUK ---
async function fetchProducts() {
    const list = document.getElementById('product-list');
    if (!list) return;

    list.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888;">
            <i class="ri-loader-4-line ri-spin" style="font-size: 24px;"></i><br>
            Sedang memuat koleksi terbaik...
        </div>`;

    try {
        const { data, error } = await db
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allProducts = data;
        
        if (allProducts.length === 0) {
            list.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888;">
                    <i class="ri-inbox-line" style="font-size: 32px;"></i><br>
                    Belum ada produk tersedia.
                </div>`;
            return;
        }

        renderProducts(allProducts);

    } catch (err) {
        console.error("Gagal ambil data:", err.message);
        list.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: #d32f2f; padding: 20px;">
                <i class="ri-error-warning-line"></i><br>
                Gagal memuat produk. Periksa koneksi internet Anda.<br>
                <button onclick="fetchProducts()" style="margin-top:10px; padding:5px 10px; cursor:pointer;">Coba Lagi</button>
            </div>`;
    }
}

// --- 3. RENDER PRODUK KE HALAMAN UTAMA ---
function renderProducts(products) {
    const list = document.getElementById('product-list');
    if (!list) return;
    list.innerHTML = '';

    products.forEach((p, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Logika Harga: Jika ada varian, tampilkan harga terendah dengan prefix "Mulai"
        let displayPriceStr = `Rp ${p.price.toLocaleString()}`;
        if (p.variants && p.variants.length > 0) {
            const minPrice = Math.min(...p.variants.map(v => v.price));
            displayPriceStr = `Mulai Rp ${minPrice.toLocaleString()}`;
        }

        card.innerHTML = `
            <div style="position: relative; overflow: hidden;">
                <img src="${p.image_url || 'https://via.placeholder.com/300x300?text=No+Image'}" 
                     alt="${p.name}" 
                     loading="lazy"
                     onclick="openModalDetail(${index})">
            </div>
            <div class="product-info">
                <div class="product-name" onclick="openModalDetail(${index})" style="cursor:pointer">${p.name}</div>
                
                <div class="product-desc-short">${p.description || 'Deskripsi produk tersedia di detail.'}</div>

                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="product-price">${displayPriceStr}</div>
                    ${p.sku ? `<div class="product-sku">${p.sku}</div>` : ''}
                </div>
            </div>
            <div class="card-actions-product">
                <button onclick="openModalDetail(${index})" class="btn-mini btn-mini-wa">
                    <i class="ri-shopping-cart-2-line"></i> Beli
                </button>
                ${p.default_tiktok_link ? `
                <a href="${p.default_tiktok_link}" target="_blank" class="btn-mini btn-mini-tiktok">
                    <i class="ri-tiktok-fill"></i> TikTok
                </a>` : ''}
            </div>
        `;
        list.appendChild(card);
    });
}

// --- 4. MODAL DETAIL & LOGIKA VARIAN ---
function openModalDetail(index) {
    // Cari produk berdasarkan index di array allProducts (bukan index DOM)
    // Pastikan saat search, index ini tetap valid atau gunakan ID produk
    const p = allProducts[index]; 
    if (!p) return;

    selectedVariant = null; // Reset pilihan varian
    const modal = document.getElementById('product-modal');
    const imgEl = document.getElementById('modal-img');
    const titleEl = document.getElementById('modal-title');
    const skuEl = document.getElementById('modal-sku');
    const priceEl = document.getElementById('modal-price');
    const descEl = document.getElementById('modal-desc');
    const btnWA = modal.querySelector('.btn-wa');

    // Tampilan Awal
    imgEl.src = p.image_url || 'https://via.placeholder.com/300x300?text=No+Image';
    titleEl.innerText = p.name;
    skuEl.innerText = p.sku ? `SKU: ${p.sku}` : '';
    descEl.innerText = p.description || "Tidak ada deskripsi detail.";

    // Bersihkan dropdown varian lama
    const oldSelect = document.getElementById('variant-select');
    if(oldSelect) oldSelect.remove();

    // Logic Varian
    if (p.variants && p.variants.length > 0) {
        // Buat Container Varian
        const select = document.createElement('select');
        select.id = 'variant-select';
        select.className = 'input-field';
        select.style.marginBottom = '15px';
        select.style.cursor = 'pointer';
        
        let options = '<option value="">-- Pilih Varian (Wajib) --</option>';
        p.variants.forEach((v, i) => {
            options += `<option value="${i}">${v.name} - Rp ${v.price.toLocaleString()}</option>`;
        });
        select.innerHTML = options;

        select.onchange = function() {
            const idx = this.value;
            if(idx === "") {
                selectedVariant = null;
                imgEl.src = p.image_url || 'https://via.placeholder.com/300x300';
                priceEl.innerText = `Rp ${p.price.toLocaleString()}`; // Kembali ke harga dasar
            } else {
                selectedVariant = p.variants[idx];
                priceEl.innerText = `Rp ${selectedVariant.price.toLocaleString()}`;
                
                // Ganti gambar jika varian punya gambar khusus
                if(selectedVariant.image) {
                    imgEl.src = selectedVariant.image;
                } else {
                    // Jika varian tidak punya gambar, kembali ke gambar utama
                     imgEl.src = p.image_url || 'https://via.placeholder.com/300x300';
                }
            }
        };
        
        // Sisipkan dropdown sebelum tombol beli
        btnWA.parentNode.insertBefore(select, btnWA);
        
        // Set harga range atau text instruksi
        const minPrice = Math.min(...p.variants.map(v => v.price));
        priceEl.innerText = `Mulai Rp ${minPrice.toLocaleString()}`; 
    } else {
        // Produk Tanpa Varian
        priceEl.innerText = `Rp ${p.price.toLocaleString()}`;
    }

    modal.style.display = 'block';
    
    // Override onclick tombol beli di modal
    btnWA.onclick = function() {
        if (p.variants && p.variants.length > 0 && !selectedVariant) {
            alert("Harap pilih varian terlebih dahulu!");
            // Highlight dropdown
            const select = document.getElementById('variant-select');
            if(select) {
                select.focus();
                select.style.borderColor = "red";
                setTimeout(() => select.style.borderColor = "#ddd", 2000);
            }
            return;
        }
        
        const finalName = selectedVariant ? `${p.name} [${selectedVariant.name}]` : p.name;
        const finalPrice = selectedVariant ? selectedVariant.price : p.price;
        // Gunakan gambar varian jika ada untuk thumbnail di keranjang
        const finalImage = (selectedVariant && selectedVariant.image) ? selectedVariant.image : p.image_url;
        
        addToCart(finalName, p.sku, finalPrice, finalImage);
        modal.style.display = 'none';
    };
}

// --- 5. LOGIKA KERANJANG ---
function addToCart(name, sku, price, image) {
    // Kunci unik produk di keranjang (Nama + SKU + Harga) untuk membedakan varian
    const existing = cart.find(item => item.name === name && item.price === price);
    
    if(existing) {
        existing.qty++;
    } else {
        cart.push({ 
            name, 
            sku: sku || '-', 
            price, 
            qty: 1,
            image: image || 'https://via.placeholder.com/50' // Simpan url gambar untuk thumbnail keranjang
        });
    }
    saveCart();
    
    // Feedback User (Toast Sederhana)
    const btnCart = document.querySelector('.header-icon .ri-shopping-cart-2-line');
    if(btnCart) {
        btnCart.style.color = "#42b549"; // Flash green
        setTimeout(() => btnCart.style.color = "#fff", 300);
    }
    // alert("Berhasil ditambah ke keranjang!"); // Optional: Bisa diganti toast custom
}

function toggleCart(show) {
    const modal = document.getElementById('cart-modal');
    if(show) {
        renderCartItems();
        modal.style.display = 'block';
    } else {
        modal.style.display = 'none';
    }
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-price');
    container.innerHTML = '';
    let total = 0;

    if(cart.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 40px 20px; color:#999;">
                <i class="ri-shopping-cart-line" style="font-size: 48px; opacity: 0.5;"></i>
                <p style="margin-top:10px;">Keranjang belanja Anda kosong</p>
                <button onclick="toggleCart(false)" style="margin-top:15px; padding:8px 16px; border:1px solid #ddd; background:white; border-radius:20px; cursor:pointer;">Mulai Belanja</button>
            </div>`;
        totalEl.innerText = 'Rp 0';
        return;
    }

    cart.forEach((item, i) => {
        total += item.price * item.qty;
        const row = document.createElement('div');
        row.className = 'cart-item';
        // Tambahkan thumbnail gambar di keranjang
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; width:100%;">
                <img src="${item.image}" style="width:50px; height:50px; object-fit:cover; border-radius:6px; border:1px solid #eee;">
                
                <div style="flex-grow:1;">
                    <div class="cart-item-title" style="font-weight:600; font-size:13px; line-height:1.2;">${item.name}</div>
                    <div class="cart-item-price" style="color:#42b549; font-size:12px;">Rp ${item.price.toLocaleString()}</div>
                </div>

                <div class="cart-actions">
                    <div class="qty-control">
                        <button class="btn-qty" onclick="changeQty(${i}, -1)">-</button>
                        <span class="qty-display" style="font-size:13px; min-width:20px; text-align:center;">${item.qty}</span>
                        <button class="btn-qty" onclick="changeQty(${i}, 1)">+</button>
                    </div>
                    <button class="btn-trash" onclick="removeItem(${i})"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>
        `;
        container.appendChild(row);
    });
    totalEl.innerText = `Rp ${total.toLocaleString()}`;
}

function changeQty(index, delta) {
    if(cart[index].qty + delta > 0) {
        cart[index].qty += delta;
    } else {
        if(confirm("Hapus barang dari keranjang?")) cart.splice(index, 1);
    }
    saveCart();
    renderCartItems();
}

function removeItem(index) {
    // if(confirm("Hapus barang?")) { // Opsional konfirmasi
        cart.splice(index, 1);
        saveCart();
        renderCartItems();
    // }
}

// --- 6. API WILAYAH & CHECKOUT ---
const apiBase = 'https://www.emsifa.com/api-wilayah-indonesia/api';

async function loadProvinsi() {
    try {
        const resp = await fetch(`${apiBase}/provinces.json`);
        if(!resp.ok) throw new Error("API Error");
        const data = await resp.json();
        let opt = '<option value="">Pilih Provinsi...</option>';
        data.forEach(p => opt += `<option value="${p.id}">${p.name}</option>`);
        const el = document.getElementById('cart-prov');
        if(el) el.innerHTML = opt;
    } catch (e) {
        console.error("Gagal load provinsi:", e);
        // Fallback jika API mati?
    }
}

async function loadKota(provId) {
    if(!provId) return;
    const citySelect = document.getElementById('cart-city');
    citySelect.innerHTML = '<option>Loading...</option>';
    citySelect.disabled = true;
    
    try {
        const resp = await fetch(`${apiBase}/regencies/${provId}.json`);
        const data = await resp.json();
        let opt = '<option value="">Pilih Kota/Kab...</option>';
        data.forEach(c => opt += `<option value="${c.id}">${c.name}</option>`);
        citySelect.innerHTML = opt;
        citySelect.disabled = false;
        citySelect.style.background = "#fff";
    } catch(e) {
        citySelect.innerHTML = '<option>Gagal memuat</option>';
    }
}

async function loadKecamatan(cityId) {
    if(!cityId) return;
    const distSelect = document.getElementById('cart-dist');
    distSelect.innerHTML = '<option>Loading...</option>';
    distSelect.disabled = true;
    
    try {
        const resp = await fetch(`${apiBase}/districts/${cityId}.json`);
        const data = await resp.json();
        let opt = '<option value="">Pilih Kecamatan...</option>';
        data.forEach(d => opt += `<option value="${d.id}">${d.name}</option>`);
        distSelect.innerHTML = opt;
        distSelect.disabled = false;
        distSelect.style.background = "#fff";
    } catch(e) {
        distSelect.innerHTML = '<option>Gagal memuat</option>';
    }
}

function checkoutWhatsApp() {
    if(cart.length === 0) return alert("Keranjang kosong!");
    
    const nama = document.getElementById('cart-name').value.trim();
    const hp = document.getElementById('cart-phone').value.trim();
    const prov = document.getElementById('cart-prov');
    const kota = document.getElementById('cart-city');
    const kec = document.getElementById('cart-dist');
    const alamat = document.getElementById('cart-address').value.trim();

    // Validasi Sederhana
    if(!nama || !hp || !alamat) {
        return alert("Mohon lengkapi Nama, No HP, dan Alamat Jalan!");
    }
    
    // Validasi Wilayah (jika dropdown ada isinya / API load sukses)
    if(prov.options.length > 1 && (!prov.value || !kota.value || !kec.value)) {
         return alert("Mohon pilih Provinsi, Kota, dan Kecamatan!");
    }
    
    // Ambil nama wilayah jika terpilih, jika tidak strip aja (antisipasi API gagal)
    const provName = prov.selectedIndex > 0 ? prov.options[prov.selectedIndex].text : '';
    const kotaName = kota.selectedIndex > 0 ? kota.options[kota.selectedIndex].text : '';
    const kecName = kec.selectedIndex > 0 ? kec.options[kec.selectedIndex].text : '';
    const fullAddress = `${alamat}${kecName ? `, ${kecName}` : ''}${kotaName ? `, ${kotaName}` : ''}${provName ? `, ${provName}` : ''}`;

    let listProduk = "";
    let totalHarga = 0;
    cart.forEach((item, i) => {
        listProduk += `${i+1}. ${item.name} (${item.qty}x) - Rp ${(item.price * item.qty).toLocaleString()}\n`;
        totalHarga += item.price * item.qty;
    });

    const teks = `*ORDER BARU - TOKONEMBAHMO*\n\n` +
                 `*Daftar Belanja:*\n${listProduk}\n` +
                 `*Total Harga: Rp ${totalHarga.toLocaleString()}*\n` +
                 `_(Belum termasuk ongkir)_\n\n` +
                 `*Data Penerima:*\n` +
                 `Nama: ${nama}\n` +
                 `WhatsApp: ${hp}\n` +
                 `Alamat Lengkap:\n${fullAddress}`;

    // Encode URI Component agar karakter khusus (&, +, dll) aman di URL
    const waUrl = `https://wa.me/${noAdmin}?text=${encodeURIComponent(teks)}`;
    window.open(waUrl, '_blank');
}

// --- 7. NAVIGASI TAB & PENCARIAN ---
function switchTab(tab) {
    const home = document.getElementById('home-view');
    const mitra = document.getElementById('mitra-view');
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(i => i.classList.remove('active'));

    // Reset scroll ke atas saat pindah tab
    window.scrollTo(0,0);

    if(tab === 'home') {
        home.style.display = 'block';
        mitra.style.display = 'none';
        // Select nav-item pertama
        const navHome = document.querySelector('.nav-item[onclick*="home"]');
        if(navHome) navHome.classList.add('active');
    } else if(tab === 'mitra') {
        home.style.display = 'none';
        mitra.style.display = 'block';
        const navMitra = document.querySelector('.nav-item[onclick*="mitra"]');
        if(navMitra) navMitra.classList.add('active');
    }
}

function cariProduk(keyword) {
    if(!keyword) {
        renderProducts(allProducts);
        return;
    }
    const lowerKey = keyword.toLowerCase();
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(lowerKey) || 
        (p.description && p.description.toLowerCase().includes(lowerKey))
    );
    
    if (filtered.length === 0) {
        const list = document.getElementById('product-list');
        list.innerHTML = '<p style="text-align:center; width:100%; padding:20px; color:#999;">Produk tidak ditemukan.</p>';
    } else {
        renderProducts(filtered);
    }
}

// --- 8. GLOBAL EVENT & INIT ---
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartBadge();
    loadProvinsi();
    
    // Setup Modal Close Logic
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => {
        // Klik tombol X
        const closeBtn = m.querySelector('.close-btn');
        if(closeBtn) {
            closeBtn.onclick = () => m.style.display = 'none';
        }
        
        // Klik area gelap di luar modal
        m.onclick = (e) => {
            if(e.target === m) m.style.display = 'none';
        };
    });
});
