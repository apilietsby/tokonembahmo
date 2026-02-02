// ================= SETUP SUPABASE =================
const supabaseUrl = 'https://klmocjsgssormjutrvvi.supabase.co';
const supabaseKey = 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const noAdmin = '6285700800278'; 
const db = supabase.createClient(supabaseUrl, supabaseKey);

// Global Variables
let products = [];
let cart = [];

// ================= LOAD AWAL =================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek Kode Referral
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref')) {
        sessionStorage.setItem('referral_code', params.get('ref'));
    }

    // 2. Load Produk
    fetchProducts();
    updateBadge();   
});

// ================= 1. FUNGSI NAVIGASI TAB (PERBAIKAN UTAMA) =================
window.switchTab = function(tabName) {
    // Ambil elemen
    const storeView = document.getElementById('store-view');
    const cartView = document.getElementById('cart-view');
    const mitraView = document.getElementById('mitra-view');

    // Sembunyikan SEMUA halaman
    if(storeView) storeView.style.display = 'none';
    if(cartView) cartView.style.display = 'none';
    if(mitraView) mitraView.style.display = 'none';
    
    // Matikan warna aktif tombol bawah
    document.querySelectorAll('.b-nav-item').forEach(el => el.classList.remove('active'));

    // Tampilkan halaman yang dipilih
    if (tabName === 'store') {
        if(storeView) storeView.style.display = 'block';
        document.getElementById('nav-store').classList.add('active');
    } 
    else if (tabName === 'cart') {
        if(cartView) cartView.style.display = 'block';
        document.getElementById('nav-cart').classList.add('active');
        renderCart(); // Render ulang saat dibuka
    } 
    else if (tabName === 'mitra') {
        if(mit
