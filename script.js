// ================= SETUP SUPABASE =================
const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co';
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const noAdmin = '6285700800278'; 
const db = supabase.createClient(supabaseUrl, supabaseKey);

// Global Variables
let products = [];
let cart = [];

// ================= LOAD AWAL =================
document.addEventListener('DOMContentLoaded', () => {
    // Cek Link Referral
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref')) {
        sessionStorage.setItem('referral_code', params.get('ref'));
    }

    fetchProducts();
    loadProvinces(); // API Wilayah
    updateBadge();   // Reset Badge 0
});

// ================= FUNGSI NAVIGASI & POPUP =================

// 1. Ganti Tab (Beranda / Mitra)
window.switchTab = function(tab) {
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('mitra-view').style.display = 'none';
    
    // Matikan semua tombol aktif
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    if (tab === 'home') {
        document.getElementById('home-view').style.display = 'block';
        // Set tombol pertama jadi aktif
        document.querySelector('.bottom-nav a:nth-child(1)').classList.add('active');
    } else if (tab === 'mitra') {
        document.getElementById('mitra-view').style.display = 'block';
        document.querySelector('.bottom-nav a:nth-child(4)').classList.add('active');
    }
};

// 2. Buka/Tutup Keranjang (INI YANG KEMARIN ERROR)
window.toggleCart = function(show) {
    const modal = document.getElementById('cart-modal');
    modal.style.display = show ? 'flex' : 'none';
    if (show) renderCart(); // Render saat dibuka
};

// ================= PRODUK & KERANJANG =================

// 1. Ambil Produk dari Database
async function fetchProducts() {
    const { data, error } = await db.from('products').select('*').eq('is_active', true).order('name');
    if (data) {
        products = data;
        renderProducts(data);
    }
}

// 2. Tampilkan Produk ke Grid HTML
function renderProducts(list) {
    const container = document.getElementById('product-list');
    
    container.innerHTML = list.map(p => {
        // Logika Tombol TikTok
        const tiktokBtn = p.default_tiktok_link 
            ? `<a href="${p.default_tiktok_link}" target="_blank" class="btn-tiktok"><i class="ri-music-fill"></i></a>` 
            : '';

        // Potong deskripsi biar rapi
        const desc = p.description ? p.description.substring(0, 35) + '...' : 'Produk berkualitas';

        return `
        <div class="product-card">
            <div class="img-wrapper">
                <img src="${p.image_url || 'https://via.placeholder.com/150'}" alt="${p.name}">
            </div>
            <div class="card-info">
                <div class="p-name">${p.name}</div>
                <div class="p-desc">${desc}</div>
                <div class="p-price">Rp ${p.price.toLocaleString()}</div>
                
                <div class="card-actions">
                    <button class="btn-add" onclick="addToCart('${p.id}')">+ Keranjang</button>
                    ${tiktokBtn}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// 3. Cari Produk
window.cariProduk = function(keyword) {
    const filtered = products.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()));
    renderProducts(filtered);
};

// 4. Masukkan ke Keranjang
window.addToCart = function(id) {
    const product = products.find(p => p.id === id);
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    updateBadge();
    
    // Efek Getar tombol
    const btn = event.target;
    if(btn.tagName === 'BUTTON') {
        btn.innerHTML = "✔ Masuk";
        setTimeout(() => btn.innerHTML = "+ Keranjang", 1000);
    }
};

// 5. Render Isi Keranjang
function renderCart() {
    const container = document.getElementById('cart-items-container');
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px; color:#999;'>Keranjang masih kosong.</p>";
        document.getElementById('cart-total-price').innerText = "Rp 0";
        return;
    }

    container.innerHTML = cart.map((item, idx) => {
        total += item.price * item.qty;
        return `
        <div class="cart-item">
            <img src="${item.image_url}" alt="${item.name}">
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:13px;">${item.name}</div>
                <div style="color:#42b549; font-weight:bold;">Rp ${item.price.toLocaleString()}</div>
                
                <div class="qty-control">
                    <button class="qty-btn" onclick="ubahQty(${idx}, -1)">-</button>
                    <span style="font-size:13px; min-width:20px; text-align:center;">${item.qty}</span>
                    <button class="qty-btn" onclick="ubahQty(${idx}, 1)">+</button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    document.getElementById('cart-total-price').innerText = "Rp " + total.toLocaleString();
}

// 6. Ubah Jumlah Item
window.ubahQty = function(index, change) {
    cart[index].qty += change;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    renderCart();
    updateBadge();
};

function updateBadge() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cart-badge').innerText = count;
}

// ================= CHECKOUT SYSTEM =================

// ================= CHECKOUT SYSTEM (VERSI BARU ANTI-CORS) =================

window.checkoutWhatsApp = async function() {
    if (cart.length === 0) return alert("Keranjang kosong!");

    const name = document.getElementById('cart-name').value;
    const phone = document.getElementById('cart-phone').value;
    
    // Alamat Jalan
    const addr = document.getElementById('cart-address').value;
    
    // Wilayah (Manual Input)
    const location = document.getElementById('cart-location').value;

    if (!name || !phone || !addr || !location) {
        return alert("Mohon lengkapi Nama, WA, Alamat, dan Kota!");
    }

    // Button Loading
    const btn = document.querySelector('#cart-modal .btn-wa');
    const oldTxt = btn.innerHTML;
    btn.innerHTML = "Memproses...";
    btn.disabled = true;

    // Siapkan Data
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const ref = sessionStorage.getItem('referral_code') || '-';
    const itemsList = cart.map(i => `- ${i.name} (${i.qty}x)`).join('\n');
    
    // Gabungkan Alamat
    const fullAddress = `${addr}, ${location}`;

    // Pesan WA
    const msg = `*ORDER BARU*\nNama: ${name}\nWA: ${phone}\nAlamat: ${fullAddress}\n\n*Pesanan:*\n${itemsList}\n\n*Total Estimasi: Rp ${total.toLocaleString()}*\nKode Mitra: ${ref}`;
    const linkWA = `https://wa.me/${noAdmin}?text=${encodeURIComponent(msg)}`;

    try {
        // Simpan ke Database
        await db.from('orders').insert([{
            customer_name: name,
            customer_phone: phone,
            shipping_address: fullAddress,
            total_amount: total,
            order_items: cart,
            referral_code: ref
        }]);
    } catch (e) {
        console.log("Error DB, lanjut WA");
    }

    // Buka WA
    window.open(linkWA, '_blank');
    
    // Reset
    cart = []; updateBadge(); toggleCart(false);
    btn.innerHTML = oldTxt; btn.disabled = false;
};

// ================= LOGIKA MITRA =================

window.daftarMitra = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "Mengirim..."; btn.disabled = true;

    const data = {
        full_name: document.getElementById('m-nama').value,
        phone_number: document.getElementById('m-hp').value,
        bank_account: document.getElementById('m-bank').value,
        tiktok_account: document.getElementById('m-tiktok').value,
        referral_code: document.getElementById('m-code').value,
        approved: false
    };

    const { error } = await db.from('affiliates').insert([data]);
    
    const msgEl = document.getElementById('mitra-msg');
    if (error) {
        msgEl.innerText = "Gagal: " + error.message; msgEl.style.color = "red";
    } else {
        msgEl.innerText = "Berhasil! Admin akan segera menghubungi Anda."; 
        msgEl.style.color = "green";
        e.target.reset();
    }
    btn.innerText = "Kirim Pendaftaran via WA"; btn.disabled = false;
};

// ================= API WILAYAH =================
async function loadProvinces() {
    try {
        const res = await fetch('https://kanglerian.github.io/api-wilayah-indonesia/api/provinces.json');
        const data = await res.json();
        const el = document.getElementById('cart-prov');
        el.innerHTML = '<option value="">Pilih Provinsi...</option>' + data.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    } catch(e) {}
}

window.loadKota = async function(id) {
    const res = await fetch(`https://kanglerian.github.io/api-wilayah-indonesia/api/regencies/${id}.json`);
    const data = await res.json();
    const el = document.getElementById('cart-city');
    el.disabled = false; el.style.background = "white";
    el.innerHTML = '<option value="">Pilih Kota/Kab...</option>' + data.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
};

window.loadKecamatan = async function(id) {
    const res = await fetch(`https://kanglerian.github.io/api-wilayah-indonesia/api/districts/${id}.json`);
    const data = await res.json();
    const el = document.getElementById('cart-dist');
    el.disabled = false; el.style.background = "white";
    el.innerHTML = '<option value="">Pilih Kecamatan...</option>' + data.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
};

