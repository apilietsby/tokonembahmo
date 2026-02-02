// SETUP SUPABASE
const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co/'; 
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const noAdmin = '6285700800278';
const db = supabase.createClient(supabaseUrl, supabaseKey);

// Variabel Global
let fileToUpload = null;
let tempVariants = []; 

// ==========================================
// 1. FUNGSI NAVIGASI & UI
// ==========================================
function showAddForm() {
    document.getElementById('view-product-list').style.display = 'none';
    document.getElementById('view-product-form').style.display = 'block';
    document.getElementById('product-form').reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('preview-img').style.display = 'none';
    tempVariants = [];
    renderVariantList();
}

function cancelForm() {
    document.getElementById('view-product-list').style.display = 'block';
    document.getElementById('view-product-form').style.display = 'none';
}

// ==========================================
// 2. LOGIKA MANAJEMEN MITRA (AFFILIATE)
// ==========================================

// Fungsi untuk mengambil data mitra dari Supabase
async function fetchAffiliates() {
    const list = document.getElementById('affiliate-list-admin');
    if (!list) return;

    // Mengambil data dari tabel 'affiliates'
    const { data, error } = await db
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Gagal ambil data mitra:", error.message);
        list.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat data</td></tr>`;
        return;
    }

    if (data.length === 0) {
        list.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada pendaftar mitra</td></tr>`;
        return;
    }

    list.innerHTML = data.map(m => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px;">
                <b>${m.full_name}</b><br>
                <small style="color:#666;">@${m.tiktok_account || '-'}</small>
            </td>
            <td style="padding: 12px;">${m.phone_number}</td>
            <td style="padding: 12px;">
                <code style="background:#e0f2f1; color:#00796b; padding:2px 5px; border-radius:4px; font-weight:bold;">
                    ${m.referral_code}
                </code>
            </td>
            <td style="padding: 12px;">
                ${m.approved ? 
                    '<span class="status-badge status-active">Aktif</span>' : 
                    '<span class="status-badge status-pending">Menunggu</span>'}
            </td>
            <td style="padding: 12px;">
                ${!m.approved ? 
                    `<button onclick="approveAffiliate('${m.id}')" style="background:#42b549; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">Setujui</button>` : 
                    `<button disabled style="background:#ccc; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:11px;">Approved</button>`}
            </td>
        </tr>
    `).join('');
}

// Fungsi untuk menyetujui mitra (Update status approved ke true)
window.approveAffiliate = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menyetujui mitra ini?")) return;

    const { error } = await db
        .from('affiliates')
        .update({ approved: true })
        .eq('id', id);

    if (error) {
        alert("Gagal menyetujui: " + error.message);
    } else {
        alert("Mitra telah disetujui dan diaktifkan!");
        fetchAffiliates(); // Refresh daftar mitra
    }
};

// ==========================================
// 3. LOGIKA PRODUK & VARIAN (SUDAH ADA)
// ==========================================
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
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

window.addVariantItem = async () => {
    const vName = document.getElementById('v-name').value;
    const vPrice = document.getElementById('v-price').value;
    const vFile = document.getElementById('v-image').files[0];
    const btnAdd = document.querySelector('button[onclick="addVariantItem()"]');

    if (!vName || !vPrice) return alert("Isi Nama & Harga Varian!");

    btnAdd.innerText = "Uploading...";
    btnAdd.disabled = true;

    let vImageUrl = "";
    if (vFile) {
        const fileName = `var_${Date.now()}`;
        const { data, error } = await db.storage.from('product-images').upload(fileName, vFile);
        if (!error) {
            const { data: urlData } = db.storage.from('product-images').getPublicUrl(fileName);
            vImageUrl = urlData.publicUrl;
        }
    }

    tempVariants.push({ name: vName, price: parseInt(vPrice), image: vImageUrl });
    
    document.getElementById('v-name').value = '';
    document.getElementById('v-price').value = '';
    document.getElementById('v-image').value = '';
    btnAdd.innerText = "+ Tambah ke List Varian";
    btnAdd.disabled = false;
    
    renderVariantList();
}

function renderVariantList() {
    const container = document.getElementById('variant-list-container');
    container.innerHTML = tempVariants.map((v, i) => `
        <div class="admin-item" style="margin-bottom:5px; background:#f9f9f9; padding:10px; border-radius:5px;">
            <img src="${v.image || 'https://via.placeholder.com/50'}" style="width:40px; height:40px; object-fit:cover;">
            <div class="item-info">
                <strong>${v.name}</strong><br>Rp ${v.price.toLocaleString()}
            </div>
            <button type="button" onclick="removeVariant(${i})" style="color:red; border:none; background:none; cursor:pointer;">Hapus</button>
        </div>
    `).join('');
}

window.removeVariant = (index) => {
    tempVariants.splice(index, 1);
    renderVariantList();
}

async function loadProducts() {
    const container = document.getElementById('admin-product-list');
    container.innerHTML = "Memuat...";
    
    const search = document.getElementById('search-input').value;
    let query = db.from('products').select('*').order('name', { ascending: true }); // Diurutkan berdasarkan nama agar klaster rapi
    if(search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query;
    if (error) return container.innerHTML = "Gagal memuat.";

    container.innerHTML = data.map(p => `
        <div class="admin-item">
            <img src="${p.image_url || 'https://via.placeholder.com/60'}">
            <div class="item-info">
                <strong>${p.name}</strong><br>
                <small>${p.sku} | Rp ${p.price.toLocaleString()}</small>
            </div>
            <div>
                <button onclick='editProduct(${JSON.stringify(p)})'>✏️</button>
                <button onclick="deleteProduct(${p.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function saveProduct(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save');
    btn.innerText = "Menyimpan...";
    btn.disabled = true;

    const id = document.getElementById('edit-id').value;
    let imageUrl = null;

    if (fileToUpload) {
        const fileName = `main_${Date.now()}`;
        await db.storage.from('product-images').upload(fileName, fileToUpload);
        const { data } = db.storage.from('product-images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
    }

    const payload = {
        name: document.getElementById('p-name').value,
        sku: document.getElementById('p-sku').value,
        price: parseInt(document.getElementById('p-price').value),
        description: document.getElementById('p-desc').value,
        default_tiktok_link: document.getElementById('p-tiktok').value,
        is_active: document.getElementById('p-status').value === 'true',
        variants: tempVariants
    };
    if (imageUrl) payload.image_url = imageUrl;

    const { error } = id 
        ? await db.from('products').update(payload).eq('id', id)
        : await db.from('products').insert([payload]);

    if (error) alert("Gagal simpan!");
    else {
        alert("Berhasil!");
        cancelForm();
        loadProducts();
    }
    btn.innerText = "Simpan Produk";
    btn.disabled = false;
}

window.editProduct = (p) => {
    showAddForm();
    document.getElementById('edit-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-sku').value = p.sku;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-desc').value = p.description;
    document.getElementById('p-tiktok').value = p.default_tiktok_link;
    document.getElementById('p-status').value = String(p.is_active);
    tempVariants = p.variants || [];
    renderVariantList();
    if(p.image_url) {
        const preview = document.getElementById('preview-img');
        preview.src = p.image_url;
        preview.style.display = 'block';
    }
};

window.deleteProduct = async (id) => {
    if(confirm("Hapus produk?")) {
        await db.from('products').delete().eq('id', id);
        loadProducts();
    }
};

// ==========================================
// 4. INISIALISASI SAAT HALAMAN DIMUAT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    fetchAffiliates(); // Memuat daftar mitra saat admin dibuka
});
