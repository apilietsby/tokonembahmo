// admin.js - VERSI DISEMPURNAKAN

// SETUP SUPABASE
const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co/'; 
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
// const noAdmin = '6285700800278'; // Tidak dipakai di admin.js, hanya di script.js toko
// ... kode supabase di atas tetap biarkan ...
const db = supabase.createClient(supabaseUrl, supabaseKey);

// --- TAMBAHKAN KODE INI (MULAI) ---

// 1. KONFIGURASI PASSWORD
const ADMIN_PASS = "admin123"; // <--- Ganti Password Disini

// 2. FUNGSI CEK LOGIN
function checkLogin() {
    // Ambil password yang diketik user
    const input = document.getElementById('admin-pass').value;
    const msg = document.getElementById('login-msg');

    // Cek apakah password benar?
    if (input === ADMIN_PASS) {
        // Jika benar, hilangkan layar login
        document.getElementById('login-overlay').style.display = 'none';
    } else {
        // Jika salah, munculkan pesan error
        if(msg) msg.innerText = "Password Salah!";
        else alert("Password Salah!");
    }
}

// Agar bisa tekan Enter untuk login
document.addEventListener("DOMContentLoaded", () => {
    const passInput = document.getElementById("admin-pass");
    if(passInput) {
        passInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                checkLogin();
            }
        });
    }
});

// --- TAMBAHKAN KODE INI (SELESAI) ---

// Variabel Global (lanjutan kode lama Anda...)
let fileToUpload = null;
// ... dst

// Variabel Global
let fileToUpload = null;
let tempVariants = []; 

// 2. FUNGSI NAVIGASI
function showAddForm() {
    document.getElementById('view-product-list').style.display = 'none';
    document.getElementById('view-product-form').style.display = 'block';
    
    // Reset Form Total
    document.getElementById('product-form').reset();
    document.getElementById('edit-id').value = '';
    
    // Reset Preview Image
    const preview = document.getElementById('preview-img');
    preview.src = '';
    preview.style.display = 'none';
    
    // Reset Variabel Global
    fileToUpload = null;
    tempVariants = [];
    renderVariantList();
}

function cancelForm() {
    document.getElementById('view-product-list').style.display = 'block';
    document.getElementById('view-product-form').style.display = 'none';
    
    // Reset variabel untuk keamanan
    fileToUpload = null;
    tempVariants = [];
}

// 3. LOGIKA PREVIEW & VARIAN
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        // Validasi Ukuran File (Max 2MB) - Opsional tapi disarankan
        if (file.size > 2 * 1024 * 1024) {
            alert("Ukuran file terlalu besar! Maksimal 2MB.");
            event.target.value = ""; // Reset input file
            return;
        }

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
    if (vPrice < 0) return alert("Harga varian tidak boleh negatif!");

    btnAdd.innerText = "Uploading...";
    btnAdd.disabled = true;

    let vImageUrl = "";
    if (vFile) {
        // Validasi Ukuran File Varian
        if (vFile.size > 2 * 1024 * 1024) {
             alert("Ukuran file varian terlalu besar! Maksimal 2MB.");
             btnAdd.innerText = "+ Tambah ke List Varian";
             btnAdd.disabled = false;
             return;
        }

        const fileName = `var_${Date.now()}_${Math.random().toString(36).substring(7)}`; // Nama file unik
        const { data, error } = await db.storage.from('product-images').upload(fileName, vFile);
        
        if (error) {
            console.error("Gagal upload gambar varian:", error);
            alert("Gagal upload gambar varian. Coba lagi.");
            btnAdd.innerText = "+ Tambah ke List Varian";
            btnAdd.disabled = false;
            return;
        }

        const { data: urlData } = db.storage.from('product-images').getPublicUrl(fileName);
        vImageUrl = urlData.publicUrl;
    }

    tempVariants.push({ name: vName, price: parseInt(vPrice), image: vImageUrl });
    
    // Reset input varian
    document.getElementById('v-name').value = '';
    document.getElementById('v-price').value = '';
    document.getElementById('v-image').value = '';
    btnAdd.innerText = "+ Tambah ke List Varian";
    btnAdd.disabled = false;
    
    renderVariantList();
}

function renderVariantList() {
    const container = document.getElementById('variant-list-container');
    if (tempVariants.length === 0) {
        container.innerHTML = '<p style="font-size:12px; color:#888; text-align:center;">Belum ada varian ditambahkan.</p>';
        return;
    }

    container.innerHTML = tempVariants.map((v, i) => `
        <div class="admin-item" style="margin-bottom:5px; background:#f9f9f9; padding:10px; border-radius:5px;">
            <img src="${v.image || 'https://via.placeholder.com/50?text=No+Img'}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid #ddd;">
            <div class="item-info" style="margin-left: 10px;">
                <strong>${v.name}</strong><br>Rp ${v.price.toLocaleString()}
            </div>
            <button type="button" onclick="removeVariant(${i})" style="color:red; border:none; background:none; cursor:pointer; font-weight:bold;">Hapus</button>
        </div>
    `).join('');
}

function removeVariant(index) {
    // Opsional: Bisa tambahkan logika hapus gambar dari storage jika dihapus dari list (Advanced)
    tempVariants.splice(index, 1);
    renderVariantList();
}

// 4. LOAD & SAVE PRODUK
async function loadProducts() {
    const container = document.getElementById('admin-product-list');
    container.innerHTML = '<p style="text-align:center;">Memuat data...</p>';
    
    const search = document.getElementById('search-input').value;
    let query = db.from('products').select('*').order('created_at', { ascending: false });
    
    if(search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query;
    
    if (error) {
        console.error("Error load products:", error);
        return container.innerHTML = `<p style="color:red; text-align:center;">Gagal memuat data: ${error.message}</p>`;
    }

    if (data.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888;">Tidak ada produk ditemukan.</p>';
        return;
    }

    container.innerHTML = data.map(p => `
        <div class="admin-item">
            <img src="${p.image_url || 'https://via.placeholder.com/60?text=No+Img'}" onerror="this.src='https://via.placeholder.com/60?text=Error'">
            <div class="item-info">
                <strong>${p.name}</strong>
                ${!p.is_active ? '<span style="background:#ffcdd2; color:#c62828; font-size:10px; padding:2px 5px; border-radius:4px; margin-left:5px;">Arsip</span>' : ''}
                <br>
                <small style="color:#666;">SKU: ${p.sku || '-'} | Rp ${p.price.toLocaleString()}</small>
            </div>
            <div style="display:flex; gap:5px;">
                <button onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})' class="btn" style="background:#ff9800; color:white; padding:5px 10px;">✏️</button>
                <button onclick="deleteProduct(${p.id})" class="btn" style="background:#f44336; color:white; padding:5px 10px;">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function saveProduct(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save');
    const originalText = btn.innerText;
    
    btn.innerText = "Menyimpan...";
    btn.disabled = true;

    try {
        const id = document.getElementById('edit-id').value;
        const pName = document.getElementById('p-name').value.trim();
        const pPrice = parseInt(document.getElementById('p-price').value);

        // Validasi Dasar
        if (!pName || isNaN(pPrice)) {
            throw new Error("Nama dan Harga produk wajib diisi dengan benar!");
        }

        let imageUrl = null;
        
        // Cek jika sedang edit dan sudah ada gambar sebelumnya (tidak upload baru)
        // Kita perlu logic untuk mempertahankan gambar lama jika tidak ada upload baru
        // Namun di sini kita asumsikan jika fileToUpload null, berarti tidak update gambar utama (logic di bawah)

        if (fileToUpload) {
            const fileName = `main_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const { data, error } = await db.storage.from('product-images').upload(fileName, fileToUpload);
            
            if (error) throw new Error("Gagal upload gambar utama: " + error.message);
            
            const { data: urlData } = db.storage.from('product-images').getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
        }

        const payload = {
            name: pName,
            sku: document.getElementById('p-sku').value.trim(),
            price: pPrice,
            description: document.getElementById('p-desc').value.trim(),
            default_tiktok_link: document.getElementById('p-tiktok').value.trim(),
            is_active: document.getElementById('p-status').value === 'true',
            variants: tempVariants // Simpan array varian (JSONB di Supabase)
        };

        // Hanya update image_url jika ada upload baru
        if (imageUrl) payload.image_url = imageUrl;

        let result;
        if (id) {
            // Update
            result = await db.from('products').update(payload).eq('id', id);
        } else {
            // Insert Baru
            // Pastikan image_url ada jika produk baru (atau boleh null tergantung schema db)
            if (imageUrl) payload.image_url = imageUrl;
            result = await db.from('products').insert([payload]);
        }

        if (result.error) throw new Error(result.error.message);

        alert("Berhasil menyimpan produk!");
        cancelForm();
        loadProducts();

    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan: " + err.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

window.editProduct = (p) => {
    showAddForm();
    
    // Isi Form
    document.getElementById('edit-id').value = p.id;
    document.getElementById('p-name').value = p.name || '';
    document.getElementById('p-sku').value = p.sku || '';
    document.getElementById('p-price').value = p.price || '';
    document.getElementById('p-desc').value = p.description || '';
    document.getElementById('p-tiktok').value = p.default_tiktok_link || '';
    document.getElementById('p-status').value = p.is_active !== undefined ? String(p.is_active) : 'true';
    
    // Isi Varian
    tempVariants = p.variants || []; // Pastikan format kolom di DB adalah JSONB
    renderVariantList();
    
    // Preview Gambar Lama
    if(p.image_url) {
        const preview = document.getElementById('preview-img');
        preview.src = p.image_url;
        preview.style.display = 'block';
    }
    
    // Ubah judul form agar jelas
    document.querySelector('#view-product-form h3').innerText = "Edit Produk";
};

window.deleteProduct = async (id) => {
    if(confirm("Yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.")) {
        try {
            // Hapus dari DB
            const { error } = await db.from('products').delete().eq('id', id);
            if (error) throw error;
            
            // TODO (Advanced): Hapus gambar terkait di storage untuk menghemat ruang
            
            loadProducts();
            alert("Produk berhasil dihapus.");
        } catch (err) {
            console.error(err);
            alert("Gagal menghapus produk: " + err.message);
        }
    }
};

// Initial Load
loadProducts();

