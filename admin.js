// ==========================================
// ADMIN.JS - PANEL ADMIN LENGKAP & FINAL
// ==========================================

// 1. SETUP SUPABASE
const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co/'; 
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const db = supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// BAGIAN 1: FITUR LOGIN
// ==========================================

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
        passInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") checkLogin();
        });
    }
});

// ==========================================
// BAGIAN 2: LOGIKA FORM & GAMBAR
// ==========================================

let fileToUpload = null;
let tempVariants = []; 

function showAddForm() {
    document.getElementById('view-product-list').style.display = 'none';
    document.getElementById('view-product-form').style.display = 'block';
    
    document.getElementById('product-form').reset();
    document.getElementById('edit-id').value = '';
    
    const preview = document.getElementById('preview-img');
    if(preview) {
        preview.src = '';
        preview.style.display = 'none';
    }
    
    fileToUpload = null;
    tempVariants = [];
    renderVariantList();
}

function cancelForm() {
    document.getElementById('view-product-list').style.display = 'block';
    document.getElementById('view-product-form').style.display = 'none';
    fileToUpload = null;
    tempVariants = [];
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

async function addVariantItem() {
    const vName = document.getElementById('v-name').value.trim();
    const vPrice = document.getElementById('v-price').value;
    const vFile = document.getElementById('v-image').files[0];
    const btnAdd = document.querySelector('button[onclick="addVariantItem()"]');

    if (!vName || !vPrice) return alert("Isi Nama & Harga Varian!");

    btnAdd.innerText = "Uploading..."; btnAdd.disabled = true;

    let vImageUrl = "";
    if (vFile) {
        const fileName = `var_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const { error } = await db.storage.from('product-images').upload(fileName, vFile);
        if (!error) {
            const { data } = db.storage.from('product-images').getPublicUrl(fileName);
            vImageUrl = data.publicUrl;
        }
    }

    tempVariants.push({ name: vName, price: parseInt(vPrice), image: vImageUrl });
    
    document.getElementById('v-name').value = '';
    document.getElementById('v-price').value = '';
    document.getElementById('v-image').value = '';
    btnAdd.innerText = "+ Tambah Varian"; btnAdd.disabled = false;
    
    renderVariantList();
}

function renderVariantList() {
    const container = document.getElementById('variant-list-container');
    if(!container) return;

    // PERHATIKAN: DI SINI MENGGUNAKAN BACKTICK (`) BUKAN PETIK (' atau ")
    container.innerHTML = tempVariants.map((v, i) => `
        <div class="admin-item" style="margin-bottom:5px; background:#f9f9f9; padding:10px;">
            <img src="${v.image || 'https://placehold.co/50'}" style="width:40px; height:40px; object-fit:cover;">
            <div class="item-info" style="margin-left:10px;">
                <strong>${v.name}</strong> - Rp ${v.price.toLocaleString()}
            </div>
            <button type="button" onclick="removeVariant(${i})" style="color:red; border:none; background:none; cursor:pointer;">Hapus</button>
        </div>
    `).join('');
}

function removeVariant(index) {
    tempVariants.splice(index, 1);
    renderVariantList();
}

// ==========================================
// BAGIAN 3: DATABASE
// ==========================================

async function loadProducts() {
    const container = document.getElementById('admin-product-list');
    container.innerHTML = '<p style="text-align:center;">Memuat data...</p>';
    
    const search = document.getElementById('search-input') ? document.getElementById('search-input').value : '';
    let query = db.from('products').select('*').order('created_at', { ascending: false });
    
    if(search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query;
    
    if (error || !data) return container.innerHTML = "Gagal memuat data.";
    if (data.length === 0) return container.innerHTML = "Tidak ada produk.";

    // PERHATIKAN: DI SINI MENGGUNAKAN BACKTICK (`) JUGA
    container.innerHTML = data.map(p => `
        <div class="admin-item">
            <img src="${p.image_url || 'https://placehold.co/60'}" onerror="this.src='https://placehold.co/60'">
            <div class="item-info">
                <strong>${p.name}</strong> <br>
                <small>${p.sku || '-'} | Rp ${p.price.toLocaleString()}</small>
            </div>
            <div>
                <button onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})' class="btn" style="background:#ff9800; color:white;">✏️</button>
                <button onclick="deleteProduct(${p.id})" class="btn" style="background:#f44336; color:white;">🗑️</button>
            </div>
        </div>
    `).join('');
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

        if (!pName || isNaN(pPrice)) throw new Error("Nama dan Harga wajib diisi!");

        let imageUrl = null;
        if (fileToUpload) {
            const fileName = `main_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const { error } = await db.storage.from('product-images').upload(fileName, fileToUpload);
            if (error) throw new Error("Gagal upload gambar.");
            
            const { data } = db.storage.from('product-images').getPublicUrl(fileName);
            imageUrl = data.publicUrl;
        }

        const payload = {
            name: pName,
            sku: document.getElementById('p-sku').value,
            price: pPrice,
            description: document.getElementById('p-desc').value,
            default_tiktok_link: document.getElementById('p-tiktok').value,
            is_active: document.getElementById('p-status').value === 'true',
            variants: tempVariants
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
    
    tempVariants = p.variants || [];
    renderVariantList();
    
    if(p.image_url) {
        const preview = document.getElementById('preview-img');
        if(preview) {
            preview.src = p.image_url;
            preview.style.display = 'block';
        }
    }
};

window.deleteProduct = async (id) => {
    if(confirm("Hapus produk ini?")) {
        await db.from('products').delete().eq('id', id);
        loadProducts();
    }
};
