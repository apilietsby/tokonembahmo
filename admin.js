const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co';
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const db = supabase.createClient(supabaseUrl, supabaseKey);

// PASSWORD ADMIN SEDERHANA
const ADMIN_PASS = "admin123"; // <--- GANTI PASSWORD DISINI

// 1. SISTEM LOGIN
function checkLogin() {
    const input = document.getElementById('admin-pass').value;
    if(input === ADMIN_PASS) {
        document.getElementById('login-overlay').style.display = 'none';
        loadMitra();
    } else {
        document.getElementById('login-msg').innerText = "Password Salah!";
    }
}

// 2. UPLOAD PRODUK
async function uploadProduct() {
    const name = document.getElementById('p-name').value;
    const price = document.getElementById('p-price').value;
    const desc = document.getElementById('p-desc').value;
    const file = document.getElementById('p-img').files[0];
    const btn = document.querySelector('button');

    if(!name || !price || !file) return alert("Lengkapi data!");

    btn.innerText = "Mengupload..."; btn.disabled = true;

    // Upload Gambar
    const fileName = `img_${Date.now()}`;
    const { error: upErr } = await db.storage.from('product-images').upload(fileName, file);
    
    if(upErr) {
        alert("Gagal upload gambar!"); 
        btn.innerText = "Upload Produk"; btn.disabled = false;
        return;
    }

    const { data: urlData } = db.storage.from('product-images').getPublicUrl(fileName);

    // Simpan Data
    await db.from('products').insert([{
        name: name,
        price: Number(price),
        description: desc,
        image_url: urlData.publicUrl,
        is_active: true
    }]);

    alert("Produk Berhasil Ditambahkan!");
    location.reload();
}

// 3. LOAD & APPROVE MITRA
async function loadMitra() {
    const { data } = await db.from('affiliates').select('*').order('created_at', {ascending: false});
    
    document.getElementById('mitra-list').innerHTML = data.map(m => `
        <div style="border-bottom:1px solid #eee; padding:10px 0; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <b>${m.full_name}</b> (${m.phone_number})<br>
                Kode: ${m.referral_code} | Status: ${m.approved ? '<span style="color:green">Aktif</span>' : '<span style="color:orange">Menunggu</span>'}
            </div>
            ${!m.approved ? `<button onclick="approve('${m.id}')" style="background:green; color:white; padding:5px 10px; border:none; cursor:pointer;">Setujui</button>` : ''}
        </div>
    `).join('');
}

window.approve = async (id) => {
    if(confirm("Setujui mitra ini?")) {
        await db.from('affiliates').update({approved: true}).eq('id', id);
        loadMitra();
    }
};
