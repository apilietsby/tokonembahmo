const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co';
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const db = supabase.createClient(supabaseUrl, supabaseKey);

// PASSWORD ADMIN (Silakan Ganti)
const ADMIN_PASS = "admin123"; 

// 1. LOGIN
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

    if(!name || !price || !file) return alert("Mohon lengkapi Nama, Harga, dan Foto!");

    btn.innerText = "Sedang Upload..."; btn.disabled = true;

    // Upload Gambar
    const fileName = `img_${Date.now()}`;
    const { error: upErr } = await db.storage.from('product-images').upload(fileName, file);
    
    if(upErr) {
        alert("Gagal upload gambar: " + upErr.message); 
        btn.innerText = "Upload Produk"; btn.disabled = false;
        return;
    }

    const { data: urlData } = db.storage.from('product-images').getPublicUrl(fileName);

    // Simpan Data
    const { error: dbErr } = await db.from('products').insert([{
        name: name,
        price: Number(price),
        description: desc,
        image_url: urlData.publicUrl,
        is_active: true
    }]);

    if(dbErr) {
        alert("Gagal simpan database: " + dbErr.message);
    } else {
        alert("Produk Berhasil Ditambahkan!");
        location.reload();
    }
    btn.disabled = false;
}

// 3. LOAD & APPROVE MITRA
async function loadMitra() {
    const { data } = await db.from('affiliates').select('*').order('created_at', {ascending: false});
    
    if(data.length === 0) {
        document.getElementById('mitra-list').innerHTML = "<p>Belum ada pendaftar.</p>";
        return;
    }

    document.getElementById('mitra-list').innerHTML = data.map(m => `
        <div style="border-bottom:1px solid #eee; padding:15px 0; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <b style="font-size:16px;">${m.full_name}</b> <br>
                <span style="font-size:13px; color:#666;">WA: ${m.phone_number} | Kode: <b>${m.referral_code}</b></span><br>
                Status: ${m.approved ? '<span style="color:green; font-weight:bold;">Aktif</span>' : '<span style="color:orange; font-weight:bold;">Menunggu</span>'}
            </div>
            ${!m.approved ? `<button onclick="approve('${m.id}')" style="background:green; color:white; padding:8px 15px; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">Setujui</button>` : ''}
        </div>
    `).join('');
}

window.approve = async (id) => {
    if(confirm("Setujui mitra ini?")) {
        await db.from('affiliates').update({approved: true}).eq('id', id);
        loadMitra();
    }
};
