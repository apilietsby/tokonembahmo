// ================= SETUP SUPABASE =================
const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co';
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const db = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadMitra();
});

// ================= FUNGSI PRODUK (CRUD) =================

// 1. Load Produk
async function loadProducts() {
    const { data, error } = await db.from('products').select('*').order('created_at', {ascending: false});
    const container = document.getElementById('product-list-admin');
    
    if (error) return console.error(error);

    container.innerHTML = data.map(p => `
        <div class="product-card" style="position: relative;">
            <div class="img-wrapper">
                <img src="${p.image_url || 'https://via.placeholder.com/150'}" alt="${p.name}">
            </div>
            <div class="card-info">
                <div class="p-name">${p.name}</div>
                <div class="p-price">Rp ${p.price.toLocaleString()}</div>
                <div style="margin-top:auto; display:flex; gap:5px;">
                    <button onclick="deleteProduct('${p.id}')" style="background:#ff4d4d; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:12px; cursor:pointer; width:100%;">Hapus</button>
                </div>
            </div>
            ${p.is_active ? '' : '<div style="position:absolute; top:0; left:0; background:rgba(0,0,0,0.7); color:white; padding:2px 8px; font-size:10px;">Non-Aktif</div>'}
        </div>
    `).join('');
}

// 2. Buka Form Tambah
window.openForm = () => {
    document.getElementById('p-name').value = '';
    document.getElementById('p-price').value = '';
    document.getElementById('p-tiktok').value = '';
    document.getElementById('p-img').value = '';
    document.getElementById('form-overlay').style.display = 'flex';
};

// 3. Simpan Produk Baru
window.saveProduct = async function() {
    const name = document.getElementById('p-name').value;
    const price = document.getElementById('p-price').value;
    const tiktok = document.getElementById('p-tiktok').value;
    const file = document.getElementById('p-img').files[0];
    const btn = document.querySelector('#form-overlay button:last-child'); // Tombol simpan

    if(!name || !price || !file) return alert("Wajib isi Nama, Harga, dan Foto!");

    btn.innerText = "Mengupload...";
    btn.disabled = true;

    try {
        // Upload Gambar
        const fileName = `prod_${Date.now()}`;
        const { error: uploadError } = await db.storage.from('product-images').upload(fileName, file);
        if(uploadError) throw uploadError;

        const { data: urlData } = db.storage.from('product-images').getPublicUrl(fileName);
        
        // Insert Data ke Database
        const { error: dbError } = await db.from('products').insert([{
            name: name,
            price: parseInt(price),
            image_url: urlData.publicUrl,
            default_tiktok_link: tiktok,
            is_active: true
        }]);

        if(dbError) throw dbError;

        alert("Produk Berhasil Ditambahkan!");
        document.getElementById('form-overlay').style.display = 'none';
        loadProducts(); // Refresh list

    } catch (err) {
        alert("Gagal: " + err.message);
    } finally {
        btn.innerText = "Simpan Produk";
        btn.disabled = false;
    }
};

// 4. Hapus Produk
window.deleteProduct = async (id) => {
    if(confirm("Yakin ingin menghapus produk ini?")) {
        await db.from('products').delete().eq('id', id);
        loadProducts();
    }
};

// ================= FUNGSI MITRA (APPROVAL) =================

// 1. Load Daftar Mitra
async function loadMitra() {
    const { data, error } = await db.from('affiliates').select('*').order('created_at', {ascending: false});
    const list = document.getElementById('mitra-list');
    
    if (error) return console.error(error);

    list.innerHTML = data.map(m => `
        <tr>
            <td>
                <b>${m.full_name}</b><br>
                <small style="color:#666;">Tiktok: ${m.tiktok_account || '-'}</small>
            </td>
            <td>${m.phone_number}</td>
            <td>
                <span style="background:#eee; padding:2px 6px; border-radius:4px; font-family:monospace; font-weight:bold;">
                    ${m.referral_code}
                </span>
            </td>
            <td>
                ${m.approved 
                    ? '<span class="status-badge active">Aktif</span>' 
                    : '<span class="status-badge pending">Menunggu</span>'}
            </td>
            <td>
                ${!m.approved 
                    ? `<button onclick="approveMitra('${m.id}')" style="background:#42b549; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Setujui</button>` 
                    : '<button disabled style="background:#ddd; border:none; padding:5px 10px; border-radius:4px; color:#888;">Approved</button>'}
            </td>
        </tr>
    `).join('');
}

// 2. Approve Mitra
window.approveMitra = async (id) => {
    if(confirm("Setujui pendaftaran mitra ini? Mereka akan bisa langsung melihat kode referral di dashboard.")) {
        const { error } = await db.from('affiliates').update({approved: true}).eq('id', id);
        
        if(error) alert("Gagal update: " + error.message);
        else {
            alert("Mitra Disetujui!");
            loadMitra();
        }
    }
};
