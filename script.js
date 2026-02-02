// ==========================================
// SCRIPT.JS - KHUSUS HALAMAN TOKO (PEMBELI)
// ==========================================

const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co/'; 
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const noAdmin = '6285700800278';
const db = supabase.createClient(supabaseUrl, supabaseKey);

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('tokonembahmo_cart')) || [];
let selectedVariant = null; // Menyimpan varian yang dipilih di modal

// --- 1. KERANJANG & BADGE ---
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    if(badge) badge.innerText = total;
}

function saveCart() {
    localStorage.setItem('tokonembahmo_cart', JSON.stringify(cart));
    updateCartBadge();
}

// --- 2. AMBIL DATA PRODUK ---
async function fetchProducts() {
    const list = document.getElementById('product-list');
    if (!list) return;

    list.innerHTML = '<p style="text-align:center; width:100%; padding:20px;">Memuat koleksi...</p>';

    const { data, error } = await db
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Gagal ambil data:", error.message);
        list.innerHTML = '<p style="text-align:center; width:100%;">Gagal memuat produk.</p>';
        return;
    }

    allProducts = data;
    renderProducts(allProducts);
}

// --- 3. RENDER PRODUK KE HALAMAN UTAMA ---
function renderProducts(products) {
    const list = document.getElementById('product-list');
    if (!list) return;
    list.innerHTML = '';

    products.forEach((p, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        let displayPrice = p.price;
        if (p.variants && p.variants.length > 0) {
            displayPrice = Math.min(...p.variants.map(v => v.price));
        }

        card.innerHTML = `
            <img src="${p.image_url || 'https://via.placeholder.com/150'}" onclick="openModalDetail(${index})">
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-sku">${p.sku || ''}</div>
                <div class="product-price">Rp ${displayPrice.toLocaleString()}</div>
                
                <div class="product-desc-short">${p.description || 'Tidak ada deskripsi'}</div>
            </div>
            <div class="card-actions-product">
                <button onclick="openModalDetail(${index})" class="btn-mini btn-mini-wa">
                    <i class="ri-shopping-cart-2-line"></i> Order WA
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
    const p = allProducts[index];
    if (!p) return;

    selectedVariant = null; // Reset pilihan varian
    const modal = document.getElementById('product-modal');
    const imgEl = document.getElementById('modal-img');
    const titleEl = document.getElementById('modal-title');
    const priceEl = document.getElementById('modal-price');
    const descEl = document.getElementById('modal-desc');
    const btnWA = modal.querySelector('.btn-wa');

    // Tampilan Awal
    imgEl.src = p.image_url || 'https://via.placeholder.com/150';
    titleEl.innerText = p.name;
    descEl.innerText = p.description || "-";

    // Bersihkan dropdown varian lama jika ada
    const oldSelect = document.getElementById('variant-select');
    if(oldSelect) oldSelect.remove();

    // Cek jika produk punya varian
    if (p.variants && p.variants.length > 0) {
        const select = document.createElement('select');
        select.id = 'variant-select';
        select.className = 'input-field';
        select.style.marginBottom = '15px';
        
        let options = '<option value="">-- Pilih Varian --</option>';
        p.variants.forEach((v, i) => {
            options += `<option value="${i}">${v.name} - Rp ${v.price.toLocaleString()}</option>`;
        });
        select.innerHTML = options;

        select.onchange = function() {
            const idx = this.value;
            if(idx === "") {
                selectedVariant = null;
                imgEl.src = p.image_url;
                priceEl.innerText = `Rp ${p.price.toLocaleString()}`;
            } else {
                selectedVariant = p.variants[idx];
                priceEl.innerText = `Rp ${selectedVariant.price.toLocaleString()}`;
                if(selectedVariant.image) imgEl.src = selectedVariant.image;
            }
        };
        btnWA.parentNode.insertBefore(select, btnWA);
        priceEl.innerText = "Pilih varian di bawah";
    } else {
        priceEl.innerText = `Rp ${p.price.toLocaleString()}`;
    }

    modal.style.display = 'block';
    
    btnWA.onclick = function() {
        if (p.variants && p.variants.length > 0 && !selectedVariant) {
            alert("Harap pilih varian terlebih dahulu!");
            return;
        }
        
        const finalName = selectedVariant ? `${p.name} [${selectedVariant.name}]` : p.name;
        const finalPrice = selectedVariant ? selectedVariant.price : p.price;
        
        addToCart(finalName, p.sku, finalPrice);
        modal.style.display = 'none';
    };
}

// --- 5. LOGIKA KERANJANG ---
function addToCart(name, sku, price) {
    const existing = cart.find(item => item.name === name);
    if(existing) {
        existing.qty++;
    } else {
        cart.push({ name, sku, price, qty: 1 });
    }
    saveCart();
    alert("Berhasil ditambah ke keranjang!");
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
        container.innerHTML = '<p style="text-align:center; color:#999;">Keranjang kosong</p>';
        totalEl.innerText = 'Rp 0';
        return;
    }

    cart.forEach((item, i) => {
        total += item.price * item.qty;
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">Rp ${item.price.toLocaleString()} x ${item.qty}</div>
            </div>
            <div class="cart-actions">
                <div class="qty-control">
                    <button class="btn-qty" onclick="changeQty(${i}, -1)">-</button>
                    <span class="qty-display">${item.qty}</span>
                    <button class="btn-qty" onclick="changeQty(${i}, 1)">+</button>
                </div>
                <button class="btn-trash" onclick="removeItem(${i})"><i class="ri-delete-bin-line"></i></button>
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
    if(confirm("Hapus barang?")) cart.splice(index, 1);
    saveCart();
    renderCartItems();
}

// --- 6. API WILAYAH & CHECKOUT ---
const apiBase = 'https://www.emsifa.com/api-wilayah-indonesia/api';

async function loadProvinsi() {
    const resp = await fetch(`${apiBase}/provinces.json`);
    const data = await resp.json();
    let opt = '<option value="">Pilih Provinsi...</option>';
    data.forEach(p => opt += `<option value="${p.id}">${p.name}</option>`);
    document.getElementById('cart-prov').innerHTML = opt;
}

async function loadKota(provId) {
    const citySelect = document.getElementById('cart-city');
    citySelect.disabled = true;
    const resp = await fetch(`${apiBase}/regencies/${provId}.json`);
    const data = await resp.json();
    let opt = '<option value="">Pilih Kota/Kab...</option>';
    data.forEach(c => opt += `<option value="${c.id}">${c.name}</option>`);
    citySelect.innerHTML = opt;
    citySelect.disabled = false;
    citySelect.style.background = "#fff";
}

async function loadKecamatan(cityId) {
    const distSelect = document.getElementById('cart-dist');
    distSelect.disabled = true;
    const resp = await fetch(`${apiBase}/districts/${cityId}.json`);
    const data = await resp.json();
    let opt = '<option value="">Pilih Kecamatan...</option>';
    data.forEach(d => opt += `<option value="${d.id}">${d.name}</option>`);
    distSelect.innerHTML = opt;
    distSelect.disabled = false;
    distSelect.style.background = "#fff";
}

function checkoutWhatsApp() {
    if(cart.length === 0) return alert("Keranjang kosong!");
    
    const nama = document.getElementById('cart-name').value;
    const hp = document.getElementById('cart-phone').value;
    const prov = document.getElementById('cart-prov');
    const kota = document.getElementById('cart-city');
    const kec = document.getElementById('cart-dist');
    const alamat = document.getElementById('cart-address').value;

    if(!nama || !hp || !prov.value || !kota.value || !kec.value || !alamat) {
        return alert("Mohon lengkapi data pengiriman!");
    }

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
                 `Alamat: ${alamat}, ${kec.options[kec.selectedIndex].text}, ${kota.options[kota.selectedIndex].text}, ${prov.options[prov.selectedIndex].text}`;

    window.open(`https://wa.me/${noAdmin}?text=${encodeURIComponent(teks)}`, '_blank');
}

// --- 7. NAVIGASI TAB ---
function switchTab(tab) {
    const home = document.getElementById('home-view');
    const mitra = document.getElementById('mitra-view');
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(i => i.classList.remove('active'));

    if(tab === 'home') {
        home.style.display = 'block';
        mitra.style.display = 'none';
        navItems[0].classList.add('active');
    } else if(tab === 'mitra') {
        home.style.display = 'none';
        mitra.style.display = 'block';
        navItems[3].classList.add('active');
    }
}

// --- 8. GLOBAL EVENT & INIT ---
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartBadge();
    loadProvinsi();
    
    // Close modal jika klik tanda silang
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.onclick = () => btn.closest('.modal').style.display = 'none';
    });
    
    // Close modal jika klik di luar area modal
    window.onclick = (e) => {
        if(e.target.className === 'modal') e.target.style.display = 'none';
    };
});

function cariProduk(keyword) {
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()));
    renderProducts(filtered);

}

async function daftarMitra(event) {
    event.preventDefault();

    // Mengambil data dari elemen input HTML
    const nama = document.getElementById('m-nama').value;
    const hp = document.getElementById('m-hp').value;
    const bank = document.getElementById('m-bank').value;
    const tiktok = document.getElementById('m-tiktok').value;
    const code = document.getElementById('m-code').value;
    // Karena di form tidak ada input alamat, kita isi default dulu atau ambil dari input jika ada
    const alamat = "-"; 

    const btn = event.target.querySelector('button');
    btn.innerText = "Sedang Mendaftar...";
    btn.disabled = true;

    try {
        // SIMPAN KE TABEL affiliates
        const { error } = await db
            .from('affiliates')
            .insert([
                { 
                    full_name: nama, 
                    phone_number: hp, 
                    address: alamat,
                    bank_account: bank, 
                    tiktok_account: tiktok, 
                    referral_code: code,
                    approved: false // Default sesuai gambar Anda
                }
            ]);

        if (error) throw error;

        // Buka WhatsApp untuk notifikasi ke Admin
        const pesan = `*PENDAFTARAN MITRA BARU*\n\nNama: ${nama}\nWA: ${hp}\nTikTok: ${tiktok}\nRequest Kode: ${code}\n\nData sudah tersimpan di database.`;
        window.open(`https://wa.me/${noAdmin}?text=${encodeURIComponent(pesan)}`, '_blank');

        alert("Pendaftaran Berhasil Tersimpan!");
        document.getElementById('form-mitra').reset();

    } catch (error) {
        alert("Gagal daftar: " + error.message);
    } finally {
        btn.innerText = "Kirim Pendaftaran via WA";
        btn.disabled = false;
    }
}

// Panggil fungsi ini saat halaman admin dimuat (di dalam DOMContentLoaded)
async function fetchAffiliates() {
    const list = document.getElementById('affiliate-list-admin');
    if (!list) return;

    const { data, error } = await db
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Gagal ambil data mitra:", error.message);
        return;
    }

    list.innerHTML = '';
    data.forEach(m => {
        const row = document.createElement('tr');
        row.style.borderBottom = "1px solid #eee";
        
        row.innerHTML = `
            <td style="padding: 12px;"><b>${m.full_name}</b><br><small>${m.tiktok_account}</small></td>
            <td style="padding: 12px;">${m.phone_number}</td>
            <td style="padding: 12px;"><code style="background:#e0f2f1; color:#00796b; padding:2px 5px; border-radius:4px;">${m.referral_code}</code></td>
            <td style="padding: 12px;">
                ${m.approved ? 
                    '<span style="color: #42b549; font-weight: bold;">Aktif</span>' : 
                    '<span style="color: #f44336;">Menunggu</span>'}
            </td>
            <td style="padding: 12px;">
                ${!m.approved ? 
                    `<button onclick="approveAffiliate('${m.id}')" style="background:#42b549; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:11px;">Setujui</button>` : 
                    `<button disabled style="background:#ccc; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:11px;">Approved</button>`}
            </td>
        `;
        list.appendChild(row);
    });
}

// Fungsi untuk mengubah status approved dari false menjadi true
async function approveAffiliate(id) {
    if (!confirm("Setujui mitra ini?")) return;

    const { error } = await db
        .from('affiliates')
        .update({ approved: true })
        .eq('id', id);

    if (error) {
        alert("Gagal menyetujui: " + error.message);
    } else {
        alert("Mitra berhasil disetujui!");
        fetchAffiliates(); // Refresh daftar
    }
}

// Jangan lupa panggil fetchAffiliates() di bagian inisialisasi script


