// ================= SETUP SUPABASE =================
const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co';
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const noAdmin = '6285700800278'; 
const db = supabase.createClient(supabaseUrl, supabaseKey);

// Global Variables
let products = [];
let cart = [];

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref')) {
        sessionStorage.setItem('referral_code', params.get('ref'));
    }
    fetchProducts();
    loadProvinces();
    updateBadge(); // Reset badge saat load
});

// ================= TAB NAVIGATION =================
window.switchTab = function(tab) {
    document.getElementById('store-view').style.display = 'none';
    document.getElementById('cart-view').style.display = 'none';
    document.getElementById('mitra-view').style.display = 'none';
    
    document.querySelectorAll('.b-nav-item').forEach(b => b.classList.remove('active'));

    if(tab === 'store') {
        document.getElementById('store-view').style.display = 'block';
        document.getElementById('nav-store').classList.add('active');
    } else if(tab === 'cart') {
        document.getElementById('cart-view').style.display = 'block';
        document.getElementById('nav-cart').classList.add('active');
        renderCart();
    } else {
        document.getElementById('mitra-view').style.display = 'block';
        document.getElementById('nav-mitra').classList.add('active');
    }
};

// ================= PRODUCT & STORE =================
async function fetchProducts() {
    const { data, error } = await db.from('products').select('*').eq('is_active', true).order('name');
    if(data) {
        products = data;
        renderProducts(data);
    }
}

function renderProducts(list) {
    const container = document.getElementById('product-list');
    container.innerHTML = list.map(p => {
        // Cek apakah ada link tiktok
        const tiktokBtn = p.default_tiktok_link 
            ? `<a href="${p.default_tiktok_link}" target="_blank" class="btn-tiktok"><i class="ri-music-fill"></i></a>` 
            : '';

        return `
        <div class="product-card">
            <div class="img-wrapper" onclick="addToCart('${p.id}')">
                <img src="${p.image_url || 'https://via.placeholder.com/150'}" alt="${p.name}">
            </div>
            <div class="card-info">
                <div class="p-name" onclick="addToCart('${p.id}')">${p.name}</div>
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

function searchProduct() {
    const key = document.getElementById('search-input').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(key));
    renderProducts(filtered);
}

// ================= CART SYSTEM =================
window.addToCart = function(id) {
    const product = products.find(p => p.id === id);
    const exist = cart.find(c => c.id === id);
    if(exist) exist.qty++;
    else cart.push({...product, qty: 1});
    
    updateBadge();
    
    // Animasi kecil (Opsional)
    const btn = event.target;
    const oldText = btn.innerText;
    if(btn.tagName === 'BUTTON') {
        btn.innerText = "✔ Masuk";
        setTimeout(() => btn.innerText = oldText, 1000);
    }
};

function updateBadge() {
    const count = cart.reduce((a,b) => a + b.qty, 0);
    
    // Update Badge Bawah
    const badgeBottom = document.getElementById('cart-badge');
    if(badgeBottom) {
        badgeBottom.innerText = count;
        badgeBottom.style.display = count > 0 ? 'block' : 'none';
    }

    // Update Badge Atas (Header Baru)
    const badgeTop = document.getElementById('cart-badge-top');
    if(badgeTop) {
        badgeTop.innerText = count;
        badgeTop.style.display = count > 0 ? 'block' : 'none';
    }
}

function renderCart() {
    const container = document.getElementById('cart-items');
    let total = 0;
    
    if(cart.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#888; padding:20px;'>Keranjang Kosong</p>";
        document.getElementById('cart-total').innerText = "Rp 0";
        return;
    }

    container.innerHTML = cart.map((item, idx) => {
        total += item.price * item.qty;
        return `
        <div style="display:flex; gap:10px; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <img src="${item.image_url}" style="width:60px; height:60px; object-fit:cover; border-radius:6px;">
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:13px; margin-bottom:4px;">${item.name}</div>
                <div style="color:#42b549; font-weight:bold;">Rp ${item.price.toLocaleString()}</div>
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
    if(cart[idx].qty <= 0) cart.splice(idx, 1);
    renderCart();
    updateBadge();
};

window.checkoutWhatsApp = async function() {
    if(cart.length === 0) return alert("Keranjang kosong!");
    
    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const addr = document.getElementById('c-addr').value;
    const prov = document.getElementById('c-prov').selectedOptions[0]?.text;
    const city = document.getElementById('c-city').selectedOptions[0]?.text;
    const dist = document.getElementById('c-dist').selectedOptions[0]?.text;

    if(!name || !phone || !addr) return alert("Lengkapi data pengiriman!");

    const btn = document.querySelector('#cart-view .btn-wa');
    btn.innerHTML = "Memproses...";
    btn.disabled = true;

    // Simpan ke Supabase Order
    const total = cart.reduce((a,b) => a + (b.price * b.qty), 0);
    const ref = sessionStorage.getItem('referral_code') || '-';
    const fullAddr = `${addr}, ${dist}, ${city}, ${prov}`;

    await db.from('orders').insert([{
        customer_name: name, customer_phone: phone, shipping_address: fullAddr,
        total_amount: total, order_items: cart, referral_code: ref
    }]);

    // Kirim WA
    const items = cart.map(c => `- ${c.name} x${c.qty}`).join('\n');
    const msg = `*ORDER BARU*\nNama: ${name}\nWA: ${phone}\nAlamat: ${fullAddr}\n\n*Pesanan:*\n${items}\n\n*Total: Rp ${total.toLocaleString()}*\nKode Ref: ${ref}`;
    
    window.open(`https://wa.me/${noAdmin}?text=${encodeURIComponent(msg)}`, '_blank');
    
    cart = []; updateBadge(); renderCart();
    btn.innerHTML = "Order via WhatsApp";
    btn.disabled = false;
};

// ================= MITRA LOGIC =================
window.showMitraTab = function(type) {
    document.getElementById('panel-daftar').style.display = type === 'daftar' ? 'block' : 'none';
    document.getElementById('panel-cek').style.display = type === 'cek' ? 'block' : 'none';
    document.getElementById('mt-daftar').style.background = type === 'daftar' ? '#42b549' : '#ccc';
    document.getElementById('mt-cek').style.background = type === 'cek' ? '#42b549' : '#ccc';
};

window.daftarMitra = async function(e) {
    e.preventDefault();
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
    else { alert("Berhasil! Tunggu persetujuan admin."); e.target.reset(); }
};

window.cekStatusMitra = async function() {
    const hp = document.getElementById('cek-hp').value;
    const { data, error } = await db.from('affiliates').select('*').eq('phone_number', hp).single();
    const msg = document.getElementById('msg-status');
    
    if(error || !data) {
        msg.innerText = "Nomor tidak ditemukan!"; msg.style.color = "red";
    } else if (!data.approved) {
        msg.innerText = "Akun masih MENUNGGU persetujuan."; msg.style.color = "orange";
    } else {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('mitra-dash').style.display = 'block';
        document.getElementById('dash-nama').innerText = data.full_name;
        document.getElementById('dash-code').innerText = data.referral_code;
        document.getElementById('dash-link').value = window.location.origin + "/?ref=" + data.referral_code;
    }
};

window.copyLink = function() {
    const link = document.getElementById('dash-link');
    link.select(); navigator.clipboard.writeText(link.value);
    alert("Link tersalin!");
};

// ================= API WILAYAH =================
async function loadProvinces() {
    try {
        const r = await fetch('https://kanglerian.github.io/api-wilayah-indonesia/api/provinces.json');
        const d = await r.json();
        const s = document.getElementById('c-prov');
        s.innerHTML = '<option value="">Pilih Provinsi</option>' + d.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
        s.onchange = () => loadRegencies(s.value);
    } catch(e) {}
}
async function loadRegencies(id) {
    const r = await fetch(`https://kanglerian.github.io/api-wilayah-indonesia/api/regencies/${id}.json`);
    const d = await r.json();
    const s = document.getElementById('c-city'); s.disabled=false;
    s.innerHTML = '<option value="">Pilih Kota</option>' + d.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
    s.onchange = () => loadDistricts(s.value);
}
async function loadDistricts(id) {
    const r = await fetch(`https://kanglerian.github.io/api-wilayah-indonesia/api/districts/${id}.json`);
    const d = await r.json();
    const s = document.getElementById('c-dist'); s.disabled=false;
    s.innerHTML = '<option value="">Pilih Kecamatan</option>' + d.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
}
