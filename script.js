// KONFIGURASI SUPABASE
const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co';
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const noAdmin = '6285700800278'; // NOMOR WA ADMIN (Ganti jika perlu)

const db = supabase.createClient(supabaseUrl, supabaseKey);

// VARIABLES
let products = [];
let cart = [];
let currentProduct = null; 
let currentQty = 1;

// LOAD AWAL
document.addEventListener('DOMContentLoaded', () => {
    // Cek Referral
    const params = new URLSearchParams(window.location.search);
    if(params.get('ref')) sessionStorage.setItem('ref', params.get('ref'));
    
    fetchProducts();
});

// 1. NAVIGASI TAB
window.switchTab = (tab) => {
    document.getElementById('view-store').style.display = 'none';
    document.getElementById('view-cart').style.display = 'none';
    document.getElementById('view-mitra').style.display = 'none';
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    if(tab === 'store') {
        document.getElementById('view-store').style.display = 'block';
        document.getElementById('nav-store').classList.add('active');
    } else if(tab === 'cart') {
        document.getElementById('view-cart').style.display = 'block';
        document.getElementById('nav-cart').classList.add('active');
        renderCart();
    } else {
        document.getElementById('view-mitra').style.display = 'block';
        document.getElementById('nav-mitra').classList.add('active');
    }
};

// 2. PRODUK & POPUP DETAIL
async function fetchProducts() {
    const { data } = await db.from('products').select('*').eq('is_active', true);
    if(data) {
        products = data;
        renderProducts(data);
    }
}

function renderProducts(list) {
    const container = document.getElementById('product-list');
    
    if (list.length === 0) {
        container.innerHTML = '<p style="grid-column:span 2; text-align:center; padding:20px;">Belum ada produk.</p>';
        return;
    }

    container.innerHTML = list.map(p => `
        <div class="product-card" onclick="openDetail('${p.id}')">
            <div class="img-wrapper">
                <img src="${p.image_url || 'https://via.placeholder.com/150'}">
            </div>
            <div class="card-info">
                <div class="p-name">${p.name}</div>
                <div class="p-price">Rp ${Number(p.price).toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

window.searchProduct = () => {
    const key = document.getElementById('search').value.toLowerCase();
    renderProducts(products.filter(p => p.name.toLowerCase().includes(key)));
};

// --- LOGIKA POPUP DETAIL ---
window.openDetail = (id) => {
    currentProduct = products.find(p => p.id === id);
    currentQty = 1; 

    document.getElementById('d-img').src = currentProduct.image_url;
    document.getElementById('d-name').innerText = currentProduct.name;
    document.getElementById('d-price').innerText = "Rp " + Number(currentProduct.price).toLocaleString();
    document.getElementById('d-desc').innerText = currentProduct.description || "Tidak ada deskripsi";
    document.getElementById('d-qty').innerText = currentQty;

    document.getElementById('modal-detail').style.display = 'flex';
};

window.modalQty = (change) => {
    currentQty += change;
    if(currentQty < 1) currentQty = 1;
    document.getElementById('d-qty').innerText = currentQty;
};

window.addToCartFromModal = () => {
    const exist = cart.find(c => c.id === currentProduct.id);
    if(exist) {
        exist.qty += currentQty;
    } else {
        cart.push({...currentProduct, qty: currentQty});
    }
    
    document.getElementById('modal-detail').style.display = 'none';
    updateBadge();
    
    // Feedback visual
    const btn = document.querySelector('.cart-icon-top i');
    btn.style.color = '#e63946';
    setTimeout(() => btn.style.color = 'white', 300);
};

window.closeModal = (e) => {
    if(e.target.id === 'modal-detail') document.getElementById('modal-detail').style.display = 'none';
};

// 3. KERANJANG BELANJA
function updateBadge() {
    document.getElementById('badge-count').innerText = cart.reduce((a,b)=>a+b.qty, 0);
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if(cart.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#999; padding:30px; border: 2px dashed #ddd; border-radius: 10px;'>Keranjang Kosong 🛒<br>Yuk isi dengan produk favoritmu!</p>";
        document.getElementById('cart-total').innerText = "Rp 0";
        return;
    }

    let total = 0;
    container.innerHTML = cart.map((item, idx) => {
        total += item.price * item.qty;
        return `
        <div style="display:flex; gap:15px; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:15px; align-items:center;">
            <img src="${item.image_url}" style="width:70px; height:70px; object-fit:cover; border-radius:10px;">
            <div style="flex:1;">
                <div style="font-weight:bold; font-size: 14px; margin-bottom: 5px;">${item.name}</div>
                <div style="color:var(--primary); font-weight:bold;">Rp ${Number(item.price).toLocaleString()}</div>
                <div style="font-size:12px; color:#666; margin-top: 5px;">Jumlah: ${item.qty}</div>
            </div>
            <button onclick="hapusItem(${idx})" style="background:#fff0f0; color:#e63946; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-size: 12px; font-weight: bold;">Hapus</button>
        </div>`;
    }).join('');
    document.getElementById('cart-total').innerText = "Rp " + total.toLocaleString();
}

window.hapusItem = (idx) => {
    cart.splice(idx, 1);
    renderCart();
    updateBadge();
};

window.checkoutWA = async () => {
    if(cart.length === 0) return alert("Keranjang kosong!");
    
    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const loc = document.getElementById('c-loc').value;
    const addr = document.getElementById('c-addr').value;

    if(!name || !phone || !loc || !addr) return alert("Mohon lengkapi Nama, WA, Kota, dan Alamat!");

    const btn = document.querySelector('#view-cart .btn-wa');
    const oldText = btn.innerHTML;
    btn.innerHTML = "Memproses..."; btn.disabled = true;

    const total = cart.reduce((a,b) => a + (b.price * b.qty), 0);
    const fullAddr = `${addr}, ${loc}`;
    const items = cart.map(c => `- ${c.name} (${c.qty}x)`).join('\n');
    const ref = sessionStorage.getItem('ref') || '-';

    const msg = `*ORDER BARU*\nNama: ${name}\nWA: ${phone}\nAlamat: ${fullAddr}\n\n*Pesanan:*\n${items}\n\n*Total Estimasi: Rp ${total.toLocaleString()}*\nKode Mitra: ${ref}`;

    try {
        await db.from('orders').insert([{
            customer_name: name, customer_phone: phone, shipping_address: fullAddr,
            total_amount: total, order_items: cart, referral_code: ref
        }]);
    } catch(e) { console.log("DB skip"); }

    window.open(`https://wa.me/${noAdmin}?text=${encodeURIComponent(msg)}`, '_blank');
    cart = []; updateBadge(); switchTab('store');
    
    btn.innerHTML = oldText; btn.disabled = false;
};

// 4. MITRA SYSTEM
window.mitraMode = (mode) => {
    document.getElementById('panel-daftar').style.display = mode === 'daftar' ? 'block' : 'none';
    document.getElementById('panel-login').style.display = mode === 'login' ? 'block' : 'none';
    
    const btnDaftar = document.getElementById('btn-daftar');
    const btnLogin = document.getElementById('btn-login');

    if (mode === 'daftar') {
        btnDaftar.style.background = '#0f5132'; btnDaftar.style.color = 'white';
        btnLogin.style.background = '#e9ecef'; btnLogin.style.color = '#333';
    } else {
        btnDaftar.style.background = '#e9ecef'; btnDaftar.style.color = '#333';
        btnLogin.style.background = '#0f5132'; btnLogin.style.color = 'white';
    }
};

window.daftarMitra = async (e) => {
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
    else { alert("Pendaftaran Berhasil! Tunggu persetujuan Admin."); e.target.reset(); }
    
    btn.innerText = "Kirim Pendaftaran"; btn.disabled = false;
};

window.cekMitra = async () => {
    const hp = document.getElementById('cek-hp').value;
    const resDiv = document.getElementById('mitra-result');
    resDiv.innerText = "Mengecek...";
    
    const { data } = await db.from('affiliates').select('*').eq('phone_number', hp).single();
    if(!data) {
        resDiv.innerText = "Nomor tidak ditemukan."; resDiv.style.color = "red";
    } else if (!data.approved) {
        resDiv.innerText = "Akun masih menunggu persetujuan Admin."; resDiv.style.color = "orange";
    } else {
        const link = window.location.origin + window.location.pathname + "?ref=" + data.referral_code;
        resDiv.innerHTML = `✅ Akun Aktif!<br><div style="margin-top:5px; padding:10px; background:#e8f5e9; border:1px dashed green; font-size:12px; word-break:break-all;">${link}</div><p style="font-size:11px; margin-top:5px; color:#666;">Salin link di atas dan bagikan.</p>`;
        resDiv.style.color = "green";
    }
};
