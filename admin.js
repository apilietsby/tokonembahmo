// ==========================================
// ADMIN.JS - SISTEM VARIAN CERDAS
// ==========================================

const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co/'; 
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const db = supabase.createClient(supabaseUrl, supabaseKey);

// LOGIN
const ADMIN_PASS = "admin123"; 

function checkLogin() {
    const input = document.getElementById('admin-pass').value;
    const overlay = document.getElementById('login-overlay');
    if (input === ADMIN_PASS) {
        if(overlay) overlay.style.display = 'none';
        loadProducts(); 
    } else {
        alert("Password Salah!");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const passInput = document.getElementById("admin-pass");
    if(passInput) {
        passInput.addEventListener("keypress", (e) => { if (e.key === "Enter") checkLogin(); });
    }
});

// LOGIKA PRODUK
let fileToUpload = null;
let tempVariants = []; 

function showAddForm() {
    document.getElementById('view-product-list').style.display = 'none';
    document.getElementById('view-product-form').style.display = 'block';
    
    document.getElementById('product-form').reset();
    document.getElementById('edit-id').value = '';
    
    const preview = document.getElementById('preview-img');
    if(preview) { preview.src = ''; preview.style.display = 'none'; }
    
    fileToUpload = null;
    clearVariants(); // Reset varian saat buka form baru
}

function cancelForm() {
    document.getElementById('view-product-list').style.display = 'block';
    document.getElementById('view-product-form').style.display = 'none';
    fileToUpload = null;
    clearVariants();
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) return alert("File terlalu besar! Max 2MB");
        fileToUpload = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('preview-img');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// --- LOGIKA VARIAN (Disederhanakan) ---

function addVariantItem() {
    const vName = document.getElementById('v-name').value.trim();
    const vPrice = document.getElementById('v-price').value;

    if (!vName || !vPrice) return alert("Isi Nama & Harga Varian!");

    tempVariants.push({ name: vName, price: parseInt(vPrice) });
    
    document.getElementById('v-name').value = '';
    document.getElementById('v-price').value = '';
    
    renderVariantList();
}

function renderVariantList() {
    const container = document.getElementById('variant-list-container');
    if(!container) return;

    if (tempVariants.length === 0) {
        container.innerHTML = '<p style="font-size:12px; color:#888;">Belum ada varian (Produk Tunggal)</p>';
    } else {
        container.innerHTML = tempVariants.map((v, i) => `
            <div class="admin-item" style="margin-bottom:5px; background:white; padding:8px; border:1px solid #eee; border-radius:6px; display:flex; justify-content:space-between;">
                <span style="font-size:13px;"><strong>${v.name}</strong> (Rp ${v.price.toLocaleString()})</span>
                <button type="button" onclick="removeVariant(${i})" style="color:red; border:none; background:none; cursor:pointer;">✕</button>
            </div>
        `).join('');
    }
}

function removeVariant(index) {
    tempVariants.splice(index, 1);
    renderVariantList();
}

function clearVariants() {
    tempVariants = [];
    renderVariantList();
}

// --- DATABASE CRUD ---

async function loadProducts() {
    const container = document.getElementById('admin-product-list');
    container.innerHTML = '<p style="text-align:center;">Memuat data...</p>';
    
    const search = document.getElementById('search-input') ? document.getElementById('search-input').value : '';
    let query = db.from('products').select('*').order('created_at', { ascending: false });
    if(search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query;
    if (error || !data) return container.innerHTML = "Gagal memuat data.";
    if (data.length === 0) return container.innerHTML = "Tidak ada produk.";

    container.innerHTML = data.map(p => {
        // Cek apakah produk punya varian atau tunggal
        const isVariant = p.variants && p.variants.length > 0;
        const infoHarga = isVariant 
            ? `<span style="color:#e67e22; font-size:11px;">${p.variants.length} Varian</span>` 
            : `Rp ${p.price.toLocaleString()}`;

        return `
        <div class="admin-item">
            <img src="${p.image_url || 'https://placehold.co/60'}" onerror="this.src='https://placehold.co/60'">
            <div class="item-info">
                <strong>${p.name}</strong> <br>
                <small>${p.sku || '-'} | ${infoHarga}</small>
            </div>
            <div>
                <button onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})' class="btn" style="background:#ff9800; color:white;">✏️</button>
                <button onclick="deleteProduct(${p.id})" class="btn" style="background:#f44336; color:white;">🗑️</button>
            </div>
        </div>
        `;
    }).join('');
}

async function saveProduct(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save');
    const originalText = btn.innerText;
    
    btn.innerText = "Menyimpan..."; btn.disabled = true;

    try {
        const id = document.getElementById('edit-id').value;
        const pName = document.getElementById('p-name').value;
        const pPrice = parseInt(document.getElementById('p-price').value);

        if (!pName || isNaN(pPrice)) throw new Error("Nama dan Harga Utama wajib diisi!");

        let imageUrl = null;
        if (fileToUpload) {
            const fileName = `main_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const { error } = await db.storage.from('product-images').upload(fileName, fileToUpload);
            if (!error) {
                const { data } = db.storage.from('product-images').getPublicUrl(fileName);
                imageUrl = data.publicUrl;
            }
        }

        // PENTING: Jika tempVariants kosong, kirim null atau array kosong ke database
        // Supaya sistem tahu ini produk tunggal.
        const finalVariants = tempVariants.length > 0 ? tempVariants : null;

        // Generate code if not editing (for new products)
        // Use SKU if provided, otherwise generate a structured code
        let productCode;
        if (document.getElementById('p-sku').value) {
            productCode = document.getElementById('p-sku').value.toUpperCase().replace(/\s+/g, '-');
        } else {
            // Generate based on product name
            const namePrefix = pName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
            const timestamp = Date.now().toString().slice(-6);
            productCode = `${namePrefix}${timestamp}`;
        }
        
        const payload = {
            name: pName,
            code: productCode,
            sku: document.getElementById('p-sku').value,
            price: pPrice, // Harga utama tetap disimpan sebagai fallback atau harga dasar
            price_small: 0, // Can be updated later
            commission_per_unit: 0, // Default, can be updated in admin
            price_wholesale: 0, // Default, can be updated in admin
            description: document.getElementById('p-desc').value,
            default_tiktok_link: document.getElementById('p-tiktok').value,
            is_active: document.getElementById('p-status').value === 'true',
            variants: finalVariants // <--- Ini kuncinya
        };

        if (imageUrl) payload.image_url = imageUrl;

        const { error } = id 
            ? await db.from('products').update(payload).eq('id', id)
            : await db.from('products').insert([payload]);

        if (error) throw error;

        alert("Berhasil menyimpan!");
        cancelForm();
        loadProducts();

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btn.innerText = originalText; btn.disabled = false;
    }
}

window.editProduct = (p) => {
    showAddForm();
    document.getElementById('edit-id').value = p.id;
    document.getElementById('p-name').value = p.name || '';
    document.getElementById('p-sku').value = p.sku || '';
    document.getElementById('p-price').value = p.price || '';
    document.getElementById('p-desc').value = p.description || '';
    document.getElementById('p-tiktok').value = p.default_tiktok_link || '';
    document.getElementById('p-status').value = String(p.is_active);
    
    // Muat varian jika ada
    tempVariants = p.variants || [];
    renderVariantList();
    
    if(p.image_url) {
        const preview = document.getElementById('preview-img');
        if(preview) { preview.src = p.image_url; preview.style.display = 'block'; }
    }
};

window.deleteProduct = async (id) => {
    if(confirm("Hapus produk ini?")) {
        await db.from('products').delete().eq('id', id);
        loadProducts();
    }
};
