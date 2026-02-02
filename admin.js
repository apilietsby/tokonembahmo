// SETUP SUPABASE
const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co/'; 
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const noAdmin = '6285700800278';
const db = supabase.createClient(supabaseUrl, supabaseKey);

// Variabel Global
let fileToUpload = null;
let tempVariants = []; 

// 2. FUNGSI NAVIGASI
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

// 3. LOGIKA PREVIEW & VARIAN
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

async function addVariantItem() {
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

function removeVariant(index) {
    tempVariants.splice(index, 1);
    renderVariantList();
}

// 4. LOAD & SAVE PRODUK
async function loadProducts() {
    const container = document.getElementById('admin-product-list');
    container.innerHTML = "Memuat...";
    
    const search = document.getElementById('search-input').value;
    let query = db.from('products').select('*').order('created_at', { ascending: false });
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

loadProducts();