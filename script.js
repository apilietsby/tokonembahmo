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
    // 1. Cek Kode Referral
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref')) {
        sessionStorage.setItem('referral_code', params.get('ref'));
    }

    // 2. Load Produk
    fetchProducts();
    updateBadge();   
});

// ================= 1. FUNGSI NAVIGASI TAB (PERBAIKAN UTAMA DI SINI) =================
window.switchTab = function(tabName) {
    // Ambil semua elemen halaman
    const storeView = document.getElementById('store-view');
    const cartView = document.getElementById('cart-view');
    const mitraView = document.getElementById('mitra-view');

    // Sembunyikan SEMUA halaman dulu (Reset)
    if (storeView) storeView.style.display = 'none';
    if (cartView) cartView.style.display = 'none';
    if (mitraView) mitraView.style.display = 'none';
    
    // Matikan warna aktif di semua tombol bawah
    document.querySelectorAll('.b-nav-item').forEach(el => el.classList.remove('active'));

    // Tampilkan halaman yang dipilih
    if (tabName === 'store') {
        if (storeView) storeView.style.display = 'block';
        document.getElementById('nav-store').classList.add('active');
    } 
    else if (tabName === 'cart') {
        if (cartView) cartView.style.display = 'block';
        document.getElementById('nav-cart').classList.add('active');
        renderCart(); // Render ulang keranjang saat dibuka
    } 
    else if (tabName === 'mitra') {
        if (mitraView) mitraView.style.display = 'block';
        document.getElementById('nav-mitra').classList.add('active');
    }
};

// ================= 2. PRODUK & STORE =================
async function fetchProducts() {
    const { data, error } = await db.from('products').select('*').eq('is_active', true).order('name');
    if (data) {
        products = data;
        renderProducts(data);
    }
}

function renderProducts(list) {
    const container = document.getElementById('product-list');
    
    container.innerHTML = list.map(p => {
        // Tombol TikTok
        const tiktokBtn = p.default_tiktok_link 
            ? `<a href="${p.default_tiktok_link}" target="_blank" class="btn-tiktok"><i class="ri-tiktok-fill"></i></a>` 
            : '';

        // Deskripsi Singkat
        const desc = p.description ? p.description.substring(0, 40) + '...' : '';

        return `
        <div class="product-card">
            <div class="img-wrapper" onclick="addToCart('${p.id}')">
                <img src="${p.image_url || 'https://via.placeholder.com/150'}" alt="${p.name}">
            </div>
            <div class="card-info">
                <div class="p-name" onclick="addToCart('${p.id}')">${p.name}</div>
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

window.searchProduct = function() {
    const key = document.getElementById('search-input').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(key));
    renderProducts(filtered);
};

// ================= 3. KERANJANG & CHECKOUT =================
window.addToCart = function(id) {
    const product = products.find(p => p.id === id);
    const exist = cart.find(c => c.id === id);
    if(exist) exist.qty++;
    else cart.push({...product, qty: 1});
    
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
    
    // Update Badge di Header Atas & Bawah
    const badgeTop = document.getElementById('cart-badge-top');
    const badgeBottom = document.getElementById('cart-badge');
    
    if (badgeTop) { badgeTop.innerText = count; badgeTop.style.display = count > 0 ? 'block' : 'none'; }
    if (badgeBottom) { badgeBottom.innerText = count; badgeBottom.style.display = count > 0 ? 'block' : 'none'; }
}

function renderCart() {
    const container = document.getElementById('cart-items');
    let total = 0;
    
    if(cart.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#888; padding:30px;'>Keranjang Kosong.<br>Yuk belanja dulu!</p>";
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

// CHECKOUT VIA WHATSAPP (Input Manual)
window.checkoutWhatsApp = async function() {
    if(cart.length === 0) return alert("Keranjang kosong!");
    
    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const addr = document.getElementById('c-addr').value;

    // Ambil Data Wilayah (Yang Select Manual)
    const provEl = document.getElementById('c-prov');
    const cityEl = document.getElementById('c-city');
    const distEl = document.getElementById('c-dist');
    
    // Cek apakah elemen select ada? Jika tidak, mungkin pakai input manual.
    // Kode ini aman: Jika tidak dipilih, dia akan mengisi '-'
    const prov = provEl && provEl.selectedIndex > 0 ? provEl.options[provEl.selectedIndex].text : '';
    const city = cityEl && cityEl.selectedIndex > 0 ? cityEl.options[cityEl.selectedIndex].text : '';
    const dist = distEl && distEl.selectedIndex > 0 ? distEl.options[distEl.selectedIndex].text : '';

    if(!name || !phone || !addr) return alert("Mohon lengkapi Nama, WA, dan Alamat!");

    const btn = document.querySelector('#cart-view .btn-wa');
    btn.innerHTML = "Memproses...";
    btn.disabled = true;

    // Siapkan Data
    const total = cart.reduce((a,b) => a + (b.price * b.qty), 0);
    const ref = sessionStorage.getItem('referral_code') || '-';
    
    // Gabung Alamat
    let fullAddr = addr;
    if (prov && city && dist) fullAddr += `, ${dist}, ${city}, ${prov}`;
    
    const items = cart.map(c => `- ${c.name} x${c.qty}`).join('\n');
    const msg = `*ORDER BARU*\nNama: ${name}\nWA: ${phone}\nAlamat: ${fullAddr}\n\n*Pesanan:*\n${items}\n\n*Total Estimasi: Rp ${total.toLocaleString()}*\nKode Mitra: ${ref}`;
    
    // Kirim ke DB (Background)
    try {
        await db.from('orders').insert([{
            customer_name: name, customer_phone: phone, shipping_address: fullAddr,
            total_amount: total, order_items: cart, referral_code: ref
        }]);
    } catch(e) { console.log("DB Error/Skip"); }

    // Buka WA
    window.open(`https://wa.me/${noAdmin}?text=${encodeURIComponent(msg)}`, '_blank');
    
    // Reset
    cart = []; updateBadge(); renderCart();
    btn.innerHTML = '<i class="ri-whatsapp-line"></i> Checkout via WhatsApp';
    btn.disabled = false;
};

// ================= 4. MITRA SYSTEM =================
window.showMitraTab = function(type) {
    document.getElementById('panel-daftar').style.display = type === 'daftar' ? 'block' : 'none';
    document.getElementById('panel-cek').style.display = type === 'cek' ? 'block' : 'none';
    
    // Atur Warna Tombol
    document.getElementById('mt-daftar').style.background = type === 'daftar' ? '#42b549' : '#f0f0f0';
    document.getElementById('mt-daftar').style.color = type === 'daftar' ? 'white' : '#333';
    
    document.getElementById('mt-cek').style.background = type === 'cek' ? '#42b549' : '#f0f0f0';
    document.getElementById('mt-cek').style.color = type === 'cek' ? 'white' : '#333';
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
    else { alert("Berhasil! Tunggu persetujuan admin."); e.target.reset(); }
    
    btn.innerText = "Kirim Pendaftaran"; btn.disabled = false;
};

window.cekStatusMitra = async function() {
    const hp = document.getElementById('cek-hp').value;
    const msg = document.getElementById('msg-status');
    msg.innerText = "Mengecek...";
    
    const { data, error } = await db.from('affiliates').select('*').eq('phone_number', hp).single();
    
    if(error || !data) {
        msg.innerText = "Nomor tidak ditemukan!"; msg.style.color = "red";
    } else if (!data.approved) {
        msg.innerText = "Akun masih MENUNGGU persetujuan."; msg.style.color = "orange";
    } else {
        msg.innerText = "";
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

// ================= API WILAYAH (OPSIONAL) =================
// Fungsi ini hanya akan jalan jika elemen select ada di HTML
async function loadProvinces() {
    try {
        const el = document.getElementById('c-prov');
        if(!el) return; // Stop jika elemen tidak ada (input manual)
        
        const r = await fetch('https://kanglerian.github.io/api-wilayah-indonesia/api/provinces.json');
        const d = await r.json();
        el.innerHTML = '<option value="">Pilih Provinsi</option>' + d.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
        el.onchange = () => loadRegencies(el.value);
    } catch(e) {}
}
async function loadRegencies(id) {
    const r = await fetch(`https://kanglerian.github.io/api-wilayah-indonesia/api/regencies/${id}.json`);
    const d = await r.json();
    const el = document.getElementById('c-city'); el.disabled=false;
    el.innerHTML = '<option value="">Pilih Kota</option>' + d.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
    el.onchange = () => loadDistricts(el.value);
}
async function loadDistricts(id) {
    const r = await fetch(`https://kanglerian.github.io/api-wilayah-indonesia/api/districts/${id}.json`);
    const d = await r.json();
    const el = document.getElementById('c-dist'); el.disabled=false;
    el.innerHTML = '<option value="">Pilih Kecamatan</option>' + d.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
}
