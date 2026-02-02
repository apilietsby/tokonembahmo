// ================= 1. KONFIGURASI SUPABASE =================
const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co';
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const noAdmin = '6285700800278'; // Ganti dengan nomor WA Admin (Format 628...)

const db = supabase.createClient(supabaseUrl, supabaseKey);

// Variabel Global
let products = [];
let cart = [];

// ================= 2. LOAD AWAL (SAAT WEBSITE DIBUKA) =================
document.addEventListener('DOMContentLoaded', () => {
    // Cek apakah ada kode referral (Link Affiliate)
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref')) {
        sessionStorage.setItem('referral_code', params.get('ref'));
        console.log("Referral terdeteksi:", params.get('ref'));
    }

    // Ambil data produk dan siapkan wilayah
    fetchProducts();
    loadProvinces(); // API Wilayah (Opsional, aman jika gagal)
    updateBadge();   
});

// ================= 3. SISTEM NAVIGASI (TAB PINDAH HALAMAN) =================
// Ini memperbaiki error "Cannot read properties of null"
window.switchTab = function(tabName) {
    // Definisi ID Halaman
    const storeView = document.getElementById('store-view');
    const cartView = document.getElementById('cart-view');
    const mitraView = document.getElementById('mitra-view');

    // 1. Sembunyikan SEMUA halaman
    if (storeView) storeView.style.display = 'none';
    if (cartView) cartView.style.display = 'none';
    if (mitraView) mitraView.style.display = 'none';
    
    // 2. Matikan warna aktif di semua tombol bawah
    document.querySelectorAll('.b-nav-item').forEach(el => el.classList.remove('active'));

    // 3. Tampilkan halaman yang dipilih
    if (tabName === 'store') {
        if (storeView) storeView.style.display = 'block';
        const btn = document.getElementById('nav-store');
        if (btn) btn.classList.add('active');
    } 
    else if (tabName === 'cart') {
        if (cartView) cartView.style.display = 'block';
        const btn = document.getElementById('nav-cart');
        if (btn) btn.classList.add('active');
        renderCart(); // Render ulang keranjang saat dibuka
    } 
    else if (tabName === 'mitra') {
        if (mitraView) mitraView.style.display = 'block';
        const btn = document.getElementById('nav-mitra');
        if (btn) btn.classList.add('active');
    }
};

// ================= 4. PRODUK & TOKO =================
async function fetchProducts() {
    // Ambil produk aktif dari Supabase
    const { data, error } = await db.from('products').select('*').eq('is_active', true).order('name');
    
    if (error) {
        console.error("Error ambil produk:", error);
        return;
    }

    if (data) {
        products = data;
        renderProducts(data);
    }
}

function renderProducts(list) {
    const container = document.getElementById('product-list');
    if (!container) return; // Cegah error jika elemen tidak ada
    
    container.innerHTML = list.map(p => {
        // Tombol TikTok (Hanya muncul jika ada link)
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

// ================= 5. KERANJANG BELANJA =================
window.addToCart = function(id) {
    const product = products.find(p => p.id === id);
    const exist = cart.find(c => c.id === id);
    
    if (exist) {
        exist.qty++;
    } else {
        cart.push({...product, qty: 1});
    }
    
    updateBadge();
    
    // Efek visual tombol berubah teks sebentar
    const btn = event.target;
    if(btn.tagName === 'BUTTON') {
        const oldText = btn.innerText;
        btn.innerText = "✔ Masuk";
        setTimeout(() => btn.innerText = oldText, 800);
    }
};

function updateBadge() {
    const count = cart.reduce((a,b) => a + b.qty, 0);
    
    // Coba update badge di header atas & bawah
    const badgeTop = document.getElementById('cart-badge-top');
    const badgeBottom = document.getElementById('cart-badge');
    
    if (badgeTop) { 
        badgeTop.innerText = count; 
        badgeTop.style.display = count > 0 ? 'block' : 'none'; 
    }
    if (badgeBottom) { 
        badgeBottom.innerText = count; 
        badgeBottom.style.display = count > 0 ? 'block' : 'none'; 
    }
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;

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
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    renderCart();
    updateBadge();
};

// ================= 6. CHECKOUT WHATSAPP =================
window.checkoutWhatsApp = async function() {
    if(cart.length === 0) return alert("Keranjang kosong!");
    
    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const addr = document.getElementById('c-addr').value;

    // Ambil Data Wilayah (Mendukung Input Manual atau Select)
    const provEl = document.getElementById('c-prov');
    const cityEl = document.getElementById('c-city');
    const distEl = document.getElementById('c-dist');
    
    // Jika dropdown ada & dipilih, ambil teksnya. Jika tidak, kosongkan.
    const prov = (provEl && provEl.selectedIndex > 0) ? provEl.options[provEl.selectedIndex].text : '';
    const city = (cityEl && cityEl.selectedIndex > 0) ? cityEl.options[cityEl.selectedIndex].text : '';
    const dist = (distEl && distEl.selectedIndex > 0) ? distEl.options[distEl.selectedIndex].text : '';

    if(!name || !phone || !addr) return alert("Mohon lengkapi Nama, WA, dan Alamat!");

    // Ubah tombol jadi loading
    const btn = document.querySelector('#cart-view .btn-wa');
    const oldText = btn.innerHTML;
    btn.innerHTML = "Memproses...";
    btn.disabled = true;

    // Siapkan Data
    const total = cart.reduce((a,b) => a + (b.price * b.qty), 0);
    const ref = sessionStorage.getItem('referral_code') || '-';
    
    // Gabung Alamat Lengkap
    let fullAddr = addr;
    if (prov && city && dist) {
        fullAddr += `, ${dist}, ${city}, ${prov}`;
    }
    
    const items = cart.map(c => `- ${c.name} x${c.qty}`).join('\n');
    const msg = `*ORDER BARU*\nNama: ${name}\nWA: ${phone}\nAlamat: ${fullAddr}\n\n*Pesanan:*\n${items}\n\n*Total Estimasi: Rp ${total.toLocaleString()}*\nKode Mitra: ${ref}`;
    
    // Kirim ke Database Supabase (Background Process)
    try {
        await db.from('orders').insert([{
            customer_name: name, 
            customer_phone: phone, 
            shipping_address: fullAddr,
            total_amount: total, 
            order_items: cart, 
            referral_code: ref
        }]);
    } catch(e) { 
        console.log("Database skip, lanjut WA"); 
    }

    // Buka WhatsApp
    window.open(`https://wa.me/${noAdmin}?text=${encodeURIComponent(msg)}`, '_blank');
    
    // Reset Cart
    cart = []; 
    updateBadge(); 
    renderCart();
    btn.innerHTML = oldText;
    btn.disabled = false;
};

// ================= 7. SISTEM MITRA / AFFILIATE =================
window.showMitraTab = function(type) {
    document.getElementById('panel-daftar').style.display = type === 'daftar' ? 'block' : 'none';
    document.getElementById('panel-cek').style.display = type === 'cek' ? 'block' : 'none';
    
    // Update warna tombol
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
    btn.innerText = "Mengirim..."; 
    btn.disabled = true;

    const data = {
        full_name: document.getElementById('m-nama').value,
        phone_number: document.getElementById('m-hp').value,
        bank_account: document.getElementById('m-bank').value,
        tiktok_account: document.getElementById('m-tiktok').value,
        referral_code: document.getElementById('m-code').value,
        approved: false
    };
    
    const { error } = await db.from('affiliates').insert([data]);
    
    if(error) {
        alert("Gagal: " + error.message);
    } else { 
        alert("Pendaftaran Berhasil! Silakan tunggu persetujuan Admin."); 
        e.target.reset(); 
    }
    
    btn.innerText = "Kirim Pendaftaran"; 
    btn.disabled = false;
};

window.cekStatusMitra = async function() {
    const hp = document.getElementById('cek-hp').value;
    const msg = document.getElementById('msg-status');
    
    if(!hp) return alert("Masukkan nomor WA!");

    msg.innerText = "Mengecek Database...";
    
    const { data, error } = await db.from('affiliates').select('*').eq('phone_number', hp).single();
    
    if(error || !data) {
        msg.innerText = "Nomor tidak ditemukan! Pastikan sudah mendaftar."; 
        msg.style.color = "red";
    } else if (!data.approved) {
        msg.innerText = "Akun Anda masih MENUNGGU persetujuan Admin."; 
        msg.style.color = "orange";
    } else {
        msg.innerText = "";
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('mitra-dash').style.display = 'block';
        document.getElementById('dash-nama').innerText = data.full_name;
        document.getElementById('dash-code').innerText = data.referral_code;
        // Generate link otomatis berdasarkan domain saat ini (localhost / github.io)
        document.getElementById('dash-link').value = window.location.origin + window.location.pathname + "?ref=" + data.referral_code;
    }
};

window.copyLink = function() {
    const link = document.getElementById('dash-link');
    link.select(); 
    link.setSelectionRange(0, 99999); // Untuk Mobile
    navigator.clipboard.writeText(link.value);
    alert("Link berhasil disalin!");
};

// ================= 8. API WILAYAH (OPSIONAL / PELENGKAP) =================
// Fungsi ini aman: Jika elemen HTML-nya dihapus/tidak ada, dia diam saja (tidak error).
async function loadProvinces() {
    try {
        const el = document.getElementById('c-prov');
        if(!el) return; // Stop jika elemen input manual yang dipakai
        
        const r = await fetch('https://kanglerian.github.io/api-wilayah-indonesia/api/provinces.json');
        const d = await r.json();
        el.innerHTML = '<option value="">Pilih Provinsi</option>' + d.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
        el.onchange = () => loadRegencies(el.value);
    } catch(e) { console.log("API Wilayah Skip/Error"); }
}
async function loadRegencies(id) {
    try {
        const r = await fetch(`https://kanglerian.github.io/api-wilayah-indonesia/api/regencies/${id}.json`);
        const d = await r.json();
        const el = document.getElementById('c-city'); el.disabled=false;
        el.innerHTML = '<option value="">Pilih Kota</option>' + d.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
        el.onchange = () => loadDistricts(el.value);
    } catch(e) {}
}
async function loadDistricts(id) {
    try {
        const r = await fetch(`https://kanglerian.github.io/api-wilayah-indonesia/api/districts/${id}.json`);
        const d = await r.json();
        const el = document.getElementById('c-dist'); el.disabled=false;
        el.innerHTML = '<option value="">Pilih Kecamatan</option>' + d.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
    } catch(e) {}
}
