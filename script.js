// ================= 1. KONFIGURASI SUPABASE =================
const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co';
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const noAdmin = '6285700800278'; // Nomor WA Admin

const db = supabase.createClient(supabaseUrl, supabaseKey);

// Variabel Global
let products = [];
let cart = [];

// ================= 2. LOAD AWAL =================
document.addEventListener('DOMContentLoaded', () => {
    // Cek Referral
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref')) {
        sessionStorage.setItem('referral_code', params.get('ref'));
    }

    fetchProducts();
    updateBadge();   
});

// ================= 3. NAVIGASI TAB =================
window.switchTab = function(tabName) {
    const storeView = document.getElementById('store-view');
    const cartView = document.getElementById('cart-view');
    const mitraView = document.getElementById('mitra-view');

    // Reset Tampilan
    if (storeView) storeView.style.display = 'none';
    if (cartView) cartView.style.display = 'none';
    if (mitraView) mitraView.style.display = 'none';
    
    // Reset Tombol Aktif
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // Buka Halaman
    if (tabName === 'store') {
        if (storeView) storeView.style.display = 'block';
        const btn = document.getElementById('nav-store');
        if (btn) btn.classList.add('active');
    } 
    else if (tabName === 'cart') {
        if (cartView) cartView.style.display = 'block';
        const btn = document.getElementById('nav-cart');
        if (btn) btn.classList.add('active');
        renderCart(); // Render ulang agar data terbaru muncul
    } 
    else if (tabName === 'mitra') {
        if (mitraView) mitraView.style.display = 'block';
        const btn = document.getElementById('nav-mitra');
        if (btn) btn.classList.add('active');
    }
};

// ================= 4. PRODUK & TOKO =================
async function fetchProducts() {
    const { data, error } = await db.from('products').select('*').eq('is_active', true).order('name');
    
    if (data) {
        products = data;
        renderProducts(data);
    }
}

function renderProducts(list) {
    const container = document.getElementById('product-list');
    if (!container) return;
    
    container.innerHTML = list.map(p => {
        // Safe check harga
        const safePrice = p.price ? p.price.toLocaleString() : '0';
        
        const tiktokBtn = p.default_tiktok_link 
            ? `<a href="${p.default_tiktok_link}" target="_blank" class="btn-tiktok"><i class="ri-tiktok-fill"></i></a>` 
            : '';

        const desc = p.description ? p.description.substring(0, 40) + '...' : '';

        return `
        <div class="product-card">
            <div class="img-wrapper" onclick="addToCart('${p.id}')">
                <img src="${p.image_url || 'https://via.placeholder.com/150'}" alt="${p.name}">
            </div>
            <div class="card-info">
                <div class="p-name" onclick="addToCart('${p.id}')">${p.name}</div>
                <div class="p-desc">${desc}</div>
                <div class="p-price">Rp ${safePrice}</div>
                
                <div class="card-actions">
                    <button class="btn-add" onclick="addToCart('${p.id}')">+ Keranjang</button>
                    ${tiktokBtn}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

window.searchProduct = function() {
    const key = document.getElementById('search-input').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(key));
    renderProducts(filtered);
};

// ================= 5. KERANJANG (FIX ERROR DI SINI) =================
window.addToCart = function(id) {
    const product = products.find(p => p.id === id);
    
    // Safety Check: Jika produk tidak ditemukan, batalkan agar tidak error
    if (!product) return console.error("Produk tidak ditemukan ID:", id);

    const exist = cart.find(c => c.id === id);
    if (exist) {
        exist.qty++;
    } else {
        cart.push({...product, qty: 1});
    }
    
    updateBadge();
    
    // Efek Tombol
    const btn = event.target;
    if(btn.tagName === 'BUTTON') {
        const oldText = btn.innerText;
        btn.innerText = "✔ Masuk";
        setTimeout(() => btn.innerText = oldText, 800);
    }
};

function updateBadge() {
    const count = cart.reduce((a,b) => a + b.qty, 0);
    const badgeTop = document.getElementById('cart-badge-top');
    const badgeBottom = document.getElementById('cart-badge');
    
    if (badgeTop) { badgeTop.innerText = count; badgeTop.style.display = count > 0 ? 'block' : 'none'; }
    if (badgeBottom) { badgeBottom.innerText = count; badgeBottom.style.display = count > 0 ? 'block' : 'none'; }
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    if(cart.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#888; padding:30px;'>Keranjang Kosong.</p>";
        document.getElementById('cart-total').innerText = "Rp 0";
        return;
    }

    let total = 0;

    container.innerHTML = cart.map((item, idx) => {
        // PENGAMAN UTAMA: Jika harga undefined, anggap 0
        const itemPrice = item.price || 0;
        
        total += itemPrice * item.qty;
        
        return `
        <div style="display:flex; gap:10px; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <img src="${item.image_url}" style="width:60px; height:60px; object-fit:cover; border-radius:6px;">
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:13px; margin-bottom:4px;">${item.name}</div>
                <div style="color:#42b549; font-weight:bold;">Rp ${itemPrice.toLocaleString()}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button onclick="changeQty(${idx}, -1)" style="padding:4px 10px; border:1px solid #ddd; background:white; border-radius:4px;">-</button>
                <span style="font-weight:bold; font-size:14px;">${item.qty}</span>
                <button onclick="changeQty(${idx}, 1)" style="padding:4px 10px; border:1px solid #ddd; background:white; border-radius:4px;">+</button>
            </div>
        </div>`;
    }).join('');
    
    document.getElementById('cart-total').innerText = "Rp " + total.toLocaleString();
}

window.changeQty = function(idx, delta) {
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    renderCart();
    updateBadge();
};

// ================= 6. CHECKOUT WHATSAPP =================
window.checkoutWhatsApp = async function() {
    if(cart.length === 0) return alert("Keranjang kosong!");
    
    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const location = document.getElementById('c-location').value;
    const addr = document.getElementById('c-addr').value;

    if(!name || !phone || !location || !addr) return alert("Mohon lengkapi semua data!");

    const btn = document.querySelector('#cart-view .btn-wa');
    const oldText = btn.innerHTML;
    btn.innerHTML = "Memproses...";
    btn.disabled = true;

    // Hitung Total (Safe Calculation)
    const total = cart.reduce((a,b) => a + ((b.price || 0) * b.qty), 0);
    const ref = sessionStorage.getItem('referral_code') || '-';
    
    const fullAddr = `${addr}, ${location}`;
    const items = cart.map(c => `- ${c.name} x${c.qty}`).join('\n');
    const msg = `*ORDER BARU*\nNama: ${name}\nWA: ${phone}\nAlamat: ${fullAddr}\n\n*Pesanan:*\n${items}\n\n*Total Estimasi: Rp ${total.toLocaleString()}*\nKode Mitra: ${ref}`;
    
    try {
        await db.from('orders').insert([{
            customer_name: name, customer_phone: phone, shipping_address: fullAddr,
            total_amount: total, order_items: cart, referral_code: ref
        }]);
    } catch(e) {}

    window.open(`https://wa.me/${noAdmin}?text=${encodeURIComponent(msg)}`, '_blank');
    
    cart = []; updateBadge(); renderCart();
    btn.innerHTML = oldText; btn.disabled = false;
};

// ================= 7. MITRA SYSTEM =================
window.showMitraTab = function(type) {
    document.getElementById('panel-daftar').style.display = type === 'daftar' ? 'block' : 'none';
    document.getElementById('panel-cek').style.display = type === 'cek' ? 'block' : 'none';
    
    const btnDaftar = document.getElementById('mt-daftar');
    const btnCek = document.getElementById('mt-cek');

    if (type === 'daftar') {
        btnDaftar.style.background = '#42b549'; btnDaftar.style.color = 'white';
        btnCek.style.background = '#f0f0f0'; btnCek.style.color = '#333';
    } else {
        btnDaftar.style.background = '#f0f0f0'; btnDaftar.style.color = '#333';
        btnCek.style.background = '#42b549'; btnCek.style.color = 'white';
    }
};

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
    if(error) alert("Gagal: " + error.message);
    else { alert("Berhasil! Tunggu persetujuan Admin."); e.target.reset(); }
    
    btn.innerText = "Kirim Pendaftaran"; btn.disabled = false;
};

window.cekStatusMitra = async function() {
    const hp = document.getElementById('cek-hp').value;
    const msg = document.getElementById('msg-status');
    
    if(!hp) return alert("Masukkan nomor WA!");
    msg.innerText = "Mengecek Database...";
    
    const { data, error } = await db.from('affiliates').select('*').eq('phone_number', hp).single();
    
    if(error || !data) {
        msg.innerText = "Nomor tidak ditemukan."; msg.style.color = "red";
    } else if (!data.approved) {
        msg.innerText = "Akun masih MENUNGGU persetujuan."; msg.style.color = "orange";
    } else {
        msg.innerText = "";
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('mitra-dash').style.display = 'block';
        document.getElementById('dash-nama').innerText = data.full_name;
        document.getElementById('dash-link').value = window.location.origin + window.location.pathname + "?ref=" + data.referral_code;
    }
};

window.copyLink = function() {
    const link = document.getElementById('dash-link');
    link.select(); navigator.clipboard.writeText(link.value);
    alert("Link tersalin!");
};
