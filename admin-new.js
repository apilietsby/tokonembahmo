// ==========================================
// ADMIN-NEW.JS - TOKONEMBAHMO V2
// ==========================================

// Initialize
const supabaseUrl = window.CONFIG?.SUPABASE_URL || 'https://klmocjsgssormjutrvvi.supabase.co/';
const supabaseKey = window.CONFIG?.SUPABASE_ANON_KEY || 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const db = supabase.createClient(supabaseUrl, supabaseKey);
const apiClient = new ApiClient(db);

const ADMIN_PASS = window.CONFIG?.ADMIN_PASSWORD || "admin123";

// Store all orders for filtering
let allOrders = [];

// ==========================================
// LOGIN
// ==========================================

function checkLogin() {
    const input = document.getElementById('admin-pass').value;
    const overlay = document.getElementById('login-overlay');
    
    if (input === ADMIN_PASS) {
        overlay.style.display = 'none';
        initAdmin();
    } else {
        alert("Password Salah!");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const passInput = document.getElementById("admin-pass");
    if (passInput) {
        passInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") checkLogin();
        });
    }
});

// ==========================================
// TAB SWITCHING
// ==========================================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById('tab-' + tabName).classList.add('active');
    
    // Add active to selected button - find by matching onclick attribute
    const targetBtn = document.querySelector(`.tab-btn[onclick*="'${tabName}'"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    // Load data for the tab
    switch(tabName) {
        case 'orders':
            loadOrders();
            break;
        case 'products':
            loadProductsAdmin();
            break;
        case 'affiliates':
            loadAffiliates();
            break;
        case 'payouts':
            loadPayouts();
            break;
    }
}

// ==========================================
// INIT ADMIN
// ==========================================

function initAdmin() {
    loadOrders();
    loadStats();
}

// ==========================================
// STATS
// ==========================================

async function loadStats() {
    try {
        // Get all orders
        const orders = await apiClient.getOrders();
        
        // Calculate stats
        const waiting = orders.filter(o => o.status === 'WAITING_CONFIRMATION').length;
        const processed = orders.filter(o => o.status === 'PROCESSED').length;
        
        // Today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(o => new Date(o.created_at) >= today).length;
        
        // Update UI
        document.getElementById('stat-waiting').textContent = waiting;
        document.getElementById('stat-processed').textContent = processed;
        document.getElementById('stat-today').textContent = todayOrders;
        
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// ==========================================
// ORDERS MANAGEMENT
// ==========================================

async function loadOrders() {
    const container = document.getElementById('orders-list');
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: #888;"><i class="ri-loader-4-line ri-spin"></i> Memuat pesanan...</p>';
    
    try {
        allOrders = await apiClient.getOrders();
        
        if (allOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="ri-inbox-line"></i>
                    <p>Belum ada pesanan</p>
                </div>
            `;
            return;
        }
        
        renderOrders(allOrders);
        loadStats();
        
    } catch (error) {
        console.error('Failed to load orders:', error);
        container.innerHTML = '<p style="text-align: center; color: #d32f2f;">Gagal memuat pesanan</p>';
    }
}

function renderOrders(orders) {
    const container = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="ri-search-line"></i>
                <p>Tidak ada pesanan yang sesuai filter</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => {
        const statusClass = getStatusClass(order.status);
        const statusText = getStatusText(order.status);
        
        // Format items
        let itemsHtml = '';
        if (order.order_items && order.order_items.length > 0) {
            itemsHtml = order.order_items.map(item => `
                <div class="order-item">
                    <span>${item.product_name} (x${item.quantity})</span>
                    <span>Rp ${item.total_price.toLocaleString('id-ID')}</span>
                </div>
            `).join('');
        }
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-number">#${order.order_number}</span>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>
                
                <div class="order-details">
                    <strong>Customer:</strong> ${order.customer_name}<br>
                    <strong>WhatsApp:</strong> ${order.customer_wa}<br>
                    <strong>Alamat:</strong> ${order.address_full}<br>
                    ${order.affiliate_code ? `<strong>Affiliate:</strong> ${order.affiliate_code}<br>` : ''}
                    <strong>Tanggal:</strong> ${new Date(order.created_at).toLocaleString('id-ID')}
                </div>
                
                <div class="order-items">
                    <strong style="display: block; margin-bottom: 10px;">Detail Pesanan:</strong>
                    ${itemsHtml}
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e0e0e0;">
                        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px;">
                            <span>Subtotal:</span>
                            <span>Rp ${order.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        ${order.shipping_cost > 0 ? `
                        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px;">
                            <span>Ongkir (${order.courier_name}):</span>
                            <span>Rp ${order.shipping_cost.toLocaleString('id-ID')}</span>
                        </div>
                        ` : ''}
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; color: #42b549;">
                            <span>TOTAL:</span>
                            <span>Rp ${order.total.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
                
                ${order.resi_number ? `
                    <div style="background: #d4edda; padding: 10px; border-radius: 6px; margin-top: 10px;">
                        <strong>Resi:</strong> ${order.resi_number} (${order.courier_name})
                    </div>
                ` : ''}
                
                <div class="order-actions">
                    ${getOrderActions(order)}
                </div>
            </div>
        `;
    }).join('');
}

function getStatusClass(status) {
    const classes = {
        'WAITING_CONFIRMATION': 'status-waiting',
        'SHIPPING_ADDED': 'status-shipping',
        'PROCESSED': 'status-processed',
        'COMPLETED': 'status-completed'
    };
    return classes[status] || 'status-waiting';
}

function getStatusText(status) {
    const texts = {
        'WAITING_CONFIRMATION': 'Menunggu Konfirmasi',
        'SHIPPING_ADDED': 'Ongkir Ditambahkan',
        'PROCESSED': 'Diproses',
        'COMPLETED': 'Selesai'
    };
    return texts[status] || status;
}

function getOrderActions(order) {
    let actions = [];
    
    if (order.status === 'WAITING_CONFIRMATION') {
        actions.push(`
            <button class="btn btn-info" onclick="openShippingModal('${order.id}')">
                <i class="ri-truck-line"></i> Tambah Ongkir
            </button>
        `);
    }
    
    if (order.status === 'SHIPPING_ADDED') {
        actions.push(`
            <button class="btn btn-success" onclick="processOrder('${order.id}')">
                <i class="ri-check-double-line"></i> Proses Pesanan
            </button>
        `);
    }
    
    if (order.status === 'PROCESSED' && !order.resi_number) {
        actions.push(`
            <button class="btn btn-primary" onclick="openResiModal('${order.id}')">
                <i class="ri-send-plane-fill"></i> Input Resi
            </button>
        `);
    }
    
    actions.push(`
        <button class="btn btn-secondary" onclick="printLabel('${order.id}')">
            <i class="ri-printer-line"></i> Cetak Label
        </button>
    `);
    
    return actions.join('');
}

function filterOrders() {
    const searchTerm = document.getElementById('search-order').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    
    let filtered = allOrders;
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(order => 
            order.order_number.toLowerCase().includes(searchTerm) ||
            order.customer_name.toLowerCase().includes(searchTerm) ||
            order.customer_wa.includes(searchTerm)
        );
    }
    
    // Filter by status
    if (statusFilter) {
        filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    renderOrders(filtered);
}

// ==========================================
// ORDER ACTIONS
// ==========================================

function openShippingModal(orderId) {
    document.getElementById('shipping-order-id').value = orderId;
    document.getElementById('modal-shipping').style.display = 'flex';
}

async function confirmAndSendInvoice() {
    const orderId = document.getElementById('shipping-order-id').value;
    const courier = document.getElementById('shipping-courier').value;
    const shippingCost = parseInt(document.getElementById('shipping-cost').value);
    
    if (!shippingCost || shippingCost < 0) {
        alert('Masukkan ongkir yang valid!');
        return;
    }
    
    try {
        // Update order with shipping cost
        await apiClient.addShippingCost(orderId, shippingCost, courier);
        
        // Get updated order
        const order = await apiClient.getOrderById(orderId);
        
        // Prepare invoice message
        let itemsList = '';
        order.order_items.forEach((item, i) => {
            itemsList += `${i+1}. ${item.product_name} (${item.quantity}x) - Rp ${item.total_price.toLocaleString('id-ID')}\n`;
        });
        
        const invoiceText = window.CONFIG.WA_TEMPLATES.INVOICE_TO_CUSTOMER(
            order.order_number,
            itemsList,
            order.subtotal,
            shippingCost,
            order.total,
            window.CONFIG.BANK_INFO
        );
        
        // Send via Fonnte (if API key is configured)
        if (window.CONFIG.FONNTE_API_KEY) {
            await sendWhatsAppMessage(order.customer_wa, invoiceText);
        } else {
            // Fallback: Open WhatsApp Web
            const waUrl = `https://wa.me/${order.customer_wa}?text=${encodeURIComponent(invoiceText)}`;
            window.open(waUrl, '_blank');
        }
        
        alert('✅ Ongkir ditambahkan dan invoice dikirim!');
        closeModal('modal-shipping');
        loadOrders();
        
    } catch (error) {
        console.error('Failed to add shipping:', error);
        alert('Gagal menambahkan ongkir: ' + error.message);
    }
}

async function processOrder(orderId) {
    if (!confirm('Proses pesanan ini?')) return;
    
    try {
        await apiClient.updateOrderStatus(orderId, 'PROCESSED');
        
        // Get order details
        const order = await apiClient.getOrderById(orderId);
        
        // Extend customer binding if affiliate exists
        if (order.affiliate_code && !order.is_self_referral) {
            await apiClient.extendBinding(order.customer_wa, 90);
            
            // Update affiliate balance
            if (order.total_commission > 0) {
                await apiClient.updateAffiliateBalance(order.affiliate_code, order.total_commission, true);
                
                // Notify affiliate
                const affiliate = await apiClient.getAffiliateByCode(order.affiliate_code);
                const notifText = window.CONFIG.WA_TEMPLATES.SALE_TO_AFFILIATE(
                    order.affiliate_code,
                    order.order_number,
                    order.total_commission,
                    order.customer_name
                );
                
                if (window.CONFIG.FONNTE_API_KEY) {
                    await sendWhatsAppMessage(affiliate.whatsapp_number, notifText);
                }
            }
        }
        
        alert('✅ Pesanan berhasil diproses!');
        loadOrders();
        
    } catch (error) {
        console.error('Failed to process order:', error);
        alert('Gagal memproses pesanan: ' + error.message);
    }
}

function openResiModal(orderId) {
    document.getElementById('resi-order-id').value = orderId;
    document.getElementById('modal-resi').style.display = 'flex';
}

async function sendResiToCustomer() {
    const orderId = document.getElementById('resi-order-id').value;
    const resiNumber = document.getElementById('resi-number').value.trim();
    
    if (!resiNumber) {
        alert('Masukkan nomor resi!');
        return;
    }
    
    try {
        const order = await apiClient.getOrderById(orderId);
        
        // Update order with resi
        await apiClient.addResiNumber(orderId, resiNumber, order.courier_name);
        
        // Send notification to customer
        const resiText = window.CONFIG.WA_TEMPLATES.RESI_TO_CUSTOMER(
            order.order_number,
            order.courier_name,
            resiNumber
        );
        
        if (window.CONFIG.FONNTE_API_KEY) {
            await sendWhatsAppMessage(order.customer_wa, resiText);
        } else {
            const waUrl = `https://wa.me/${order.customer_wa}?text=${encodeURIComponent(resiText)}`;
            window.open(waUrl, '_blank');
        }
        
        alert('✅ Resi berhasil dikirim!');
        closeModal('modal-resi');
        loadOrders();
        
    } catch (error) {
        console.error('Failed to send resi:', error);
        alert('Gagal mengirim resi: ' + error.message);
    }
}

function printLabel(orderId) {
    window.open(`print.html?order=${orderId}`, '_blank');
}

// ==========================================
// WHATSAPP INTEGRATION
// ==========================================

async function sendWhatsAppMessage(phoneNumber, message) {
    const fonntKey = window.CONFIG.FONNTE_API_KEY;
    
    if (!fonntKey) {
        throw new Error('Fonnte API key not configured');
    }
    
    try {
        const response = await fetch(window.CONFIG.FONNTE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': fonntKey
            },
            body: JSON.stringify({
                target: phoneNumber,
                message: message
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send WhatsApp message');
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('WhatsApp send error:', error);
        throw error;
    }
}

// ==========================================
// PRODUCTS MANAGEMENT (Simplified)
// ==========================================

async function loadProductsAdmin() {
    const container = document.getElementById('product-list-admin');
    container.innerHTML = '<p style="text-align:center; color:#888;">Memuat produk...</p>';
    
    try {
        const { data, error } = await db
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="ri-inbox-line"></i><p>Belum ada produk</p></div>';
            return;
        }
        
        container.innerHTML = data.map(p => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-number">${p.name}</span>
                    <span class="order-status ${p.is_active ? 'status-completed' : 'status-waiting'}">
                        ${p.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
                <div class="order-details">
                    <strong>Code:</strong> ${p.code || '-'}<br>
                    <strong>Harga:</strong> Rp ${p.price.toLocaleString('id-ID')}<br>
                    ${p.price_wholesale > 0 ? `<strong>Harga Grosir:</strong> Rp ${p.price_wholesale.toLocaleString('id-ID')}<br>` : ''}
                    <strong>Komisi/Unit:</strong> Rp ${p.commission_per_unit.toLocaleString('id-ID')}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load products:', error);
        container.innerHTML = '<p style="text-align:center; color:#d32f2f;">Gagal memuat produk</p>';
    }
}

function showProductForm() {
    alert('Fitur ini akan ditambahkan. Sementara gunakan halaman admin.html untuk manage produk.');
}

// ==========================================
// AFFILIATES MANAGEMENT
// ==========================================

async function loadAffiliates() {
    const container = document.getElementById('affiliates-list');
    container.innerHTML = '<p style="text-align:center; color:#888;">Memuat afiliasi...</p>';
    
    try {
        const { data, error } = await db
            .from('affiliates')
            .select('*')
            .order('total_commission_earned', { ascending: false });
        
        if (error) throw error;
        
        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="ri-team-line"></i><p>Belum ada afiliasi</p></div>';
            return;
        }
        
        container.innerHTML = data.map(aff => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-number">${aff.name} (${aff.code})</span>
                    <span class="order-status ${aff.is_active ? 'status-completed' : 'status-waiting'}">
                        ${aff.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
                <div class="order-details">
                    <strong>WhatsApp:</strong> ${aff.whatsapp_number}<br>
                    <strong>Email:</strong> ${aff.email}<br>
                    <strong>Saldo Saat Ini:</strong> Rp ${aff.current_balance.toLocaleString('id-ID')}<br>
                    <strong>Total Komisi:</strong> Rp ${aff.total_commission_earned.toLocaleString('id-ID')}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load affiliates:', error);
        container.innerHTML = '<p style="text-align:center; color:#d32f2f;">Gagal memuat afiliasi</p>';
    }
}

// ==========================================
// PAYOUTS MANAGEMENT
// ==========================================

async function loadPayouts() {
    const container = document.getElementById('payouts-list');
    container.innerHTML = '<p style="text-align:center; color:#888;">Memuat pencairan...</p>';
    
    const statusFilter = document.getElementById('filter-payout-status').value;
    
    try {
        let query = db
            .from('payouts')
            .select('*, affiliates(*)')
            .order('created_at', { ascending: false });
        
        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="ri-wallet-3-line"></i><p>Belum ada pencairan</p></div>';
            return;
        }
        
        container.innerHTML = data.map(payout => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-number">${payout.affiliates.name} (${payout.affiliate_code})</span>
                    <span class="order-status ${payout.status === 'PAID' ? 'status-completed' : 'status-waiting'}">
                        ${payout.status === 'PAID' ? 'Sudah Dibayar' : 'Menunggu'}
                    </span>
                </div>
                <div class="order-details">
                    <strong>Jumlah:</strong> Rp ${payout.amount.toLocaleString('id-ID')}<br>
                    <strong>Tanggal Request:</strong> ${new Date(payout.request_date).toLocaleString('id-ID')}<br>
                    ${payout.paid_date ? `<strong>Tanggal Bayar:</strong> ${new Date(payout.paid_date).toLocaleString('id-ID')}<br>` : ''}
                    ${payout.admin_notes ? `<strong>Catatan:</strong> ${payout.admin_notes}<br>` : ''}
                </div>
                ${payout.status === 'REQUESTED' ? `
                    <div class="order-actions">
                        <button class="btn btn-success" onclick="approvePayout('${payout.id}')">
                            <i class="ri-check-line"></i> Setujui & Bayar
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load payouts:', error);
        container.innerHTML = '<p style="text-align:center; color:#d32f2f;">Gagal memuat pencairan</p>';
    }
}

async function approvePayout(payoutId) {
    const proofUrl = prompt('Masukkan URL bukti transfer (opsional):');
    const notes = prompt('Catatan admin (opsional):');
    
    if (!confirm('Setujui pencairan dana ini?')) return;
    
    try {
        const payout = await apiClient.approvePayout(payoutId, proofUrl || '', notes || '');
        
        // Notify affiliate
        const affiliate = await apiClient.getAffiliateByCode(payout.affiliate_code);
        const notifText = window.CONFIG.WA_TEMPLATES.PAYOUT_APPROVED(
            payout.affiliate_code,
            payout.amount,
            payoutId
        );
        
        if (window.CONFIG.FONNTE_API_KEY) {
            await sendWhatsAppMessage(affiliate.whatsapp_number, notifText);
        }
        
        alert('✅ Pencairan disetujui dan notifikasi dikirim!');
        loadPayouts();
        
    } catch (error) {
        console.error('Failed to approve payout:', error);
        alert('Gagal menyetujui pencairan: ' + error.message);
    }
}

// ==========================================
// MODAL HELPERS
// ==========================================

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}
