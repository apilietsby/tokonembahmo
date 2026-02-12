// ==========================================
// AFFILIATE.JS - TOKONEMBAHMO V2
// ==========================================

// Initialize
const supabaseUrl = window.CONFIG?.SUPABASE_URL || 'https://klmocjsgssormjutrvvi.supabase.co/';
const supabaseKey = window.CONFIG?.SUPABASE_ANON_KEY || 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const db = supabase.createClient(supabaseUrl, supabaseKey);
const apiClient = new ApiClient(db);

// State
let currentAffiliate = null;
let allProducts = [];
let salesChart = null;

// ==========================================
// LOGIN
// ==========================================

async function loginAffiliate() {
    const code = document.getElementById('login-code').value.trim().toUpperCase();
    const errorDiv = document.getElementById('login-error');
    
    if (!code) {
        errorDiv.textContent = 'Masukkan kode afiliasi!';
        return;
    }
    
    try {
        const affiliate = await apiClient.getAffiliateByCode(code);
        
        if (!affiliate) {
            errorDiv.textContent = 'Kode afiliasi tidak ditemukan atau tidak aktif!';
            return;
        }
        
        // Store in session
        currentAffiliate = affiliate;
        sessionStorage.setItem('affiliate_code', affiliate.code);
        
        // Hide login, show app
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        
        // Update header
        document.getElementById('header-affiliate-code').textContent = affiliate.code;
        
        // Load data
        initAffiliateDashboard();
        
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
    }
}

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
    const savedCode = sessionStorage.getItem('affiliate_code');
    
    if (savedCode) {
        document.getElementById('login-code').value = savedCode;
        loginAffiliate();
    }
    
    // Enter key on login
    document.getElementById('login-code').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginAffiliate();
    });
});

// ==========================================
// TAB SWITCHING
// ==========================================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById('tab-' + tabName).classList.add('active');
    
    // Add active to selected nav item
    event.target.closest('.nav-item').classList.add('active');
    
    // Load data for specific tabs
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'links':
            loadLinks();
            break;
        case 'sales':
            loadSales();
            break;
        case 'commission':
            loadCommissionLog();
            break;
        case 'payout':
            loadPayoutTab();
            break;
    }
}

// ==========================================
// INIT DASHBOARD
// ==========================================

async function initAffiliateDashboard() {
    // Load products first
    await loadProducts();
    
    // Then load dashboard
    loadDashboard();
}

// ==========================================
// DASHBOARD TAB
// ==========================================

async function loadDashboard() {
    try {
        // Update balance
        document.getElementById('balance-value').textContent = 
            'Rp ' + currentAffiliate.current_balance.toLocaleString('id-ID');
        document.getElementById('total-commission').textContent = 
            'Rp ' + currentAffiliate.total_commission_earned.toLocaleString('id-ID');
        
        // Get 7-day stats
        const stats = await apiClient.getAffiliateStats(currentAffiliate.code, 7);
        
        document.getElementById('stat-orders-7d').textContent = stats.totalOrders;
        document.getElementById('stat-commission-7d').textContent = 
            'Rp ' + stats.totalCommission.toLocaleString('id-ID');
        
        // Load chart data
        await loadSalesChart();
        
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

async function loadSalesChart() {
    try {
        // Get last 7 days data
        const days = 7;
        const labels = [];
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            // Get orders for this day
            const { data: orders } = await db
                .from('orders')
                .select('*')
                .eq('affiliate_code', currentAffiliate.code)
                .gte('created_at', date.toISOString())
                .lt('created_at', nextDate.toISOString());
            
            const dayCommission = orders ? orders.reduce((sum, o) => sum + (o.total_commission || 0), 0) : 0;
            
            // Format label
            const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
            labels.push(dayName);
            data.push(dayCommission);
        }
        
        // Create or update chart
        const ctx = document.getElementById('sales-chart');
        
        if (salesChart) {
            salesChart.destroy();
        }
        
        salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Komisi (Rp)',
                    data: data,
                    borderColor: '#42b549',
                    backgroundColor: 'rgba(66, 181, 73, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + value.toLocaleString('id-ID');
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Failed to load chart:', error);
    }
}

// ==========================================
// LINKS TAB
// ==========================================

async function loadProducts() {
    try {
        allProducts = await apiClient.getActiveProducts();
        
        const select = document.getElementById('link-product-select');
        select.innerHTML = '<option value="">-- Pilih Produk --</option>';
        
        allProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.code;
            option.textContent = product.name;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

async function generateLink() {
    const productCode = document.getElementById('link-product-select').value;
    const tiktokUrl = document.getElementById('link-tiktok-url').value.trim();
    
    if (!productCode) {
        alert('Pilih produk terlebih dahulu!');
        return;
    }
    
    try {
        // Create or update affiliate link
        await apiClient.createOrUpdateAffiliateLink(
            currentAffiliate.code,
            productCode,
            tiktokUrl || null
        );
        
        alert('✅ Link berhasil di-generate!');
        
        // Clear form
        document.getElementById('link-tiktok-url').value = '';
        
        // Reload links
        loadLinks();
        
    } catch (error) {
        console.error('Failed to generate link:', error);
        alert('Gagal generate link: ' + error.message);
    }
}

async function loadLinks() {
    const container = document.getElementById('active-links');
    container.innerHTML = '<p style="text-align: center; color: #999;">Memuat...</p>';
    
    try {
        const links = await apiClient.getAffiliateLinks(currentAffiliate.code);
        
        if (links.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="ri-link"></i><p>Belum ada link referral</p></div>';
            return;
        }
        
        // Get product details
        const { data: products } = await db
            .from('products')
            .select('*')
            .in('code', links.map(l => l.product_code));
        
        container.innerHTML = links.map(link => {
            const product = products.find(p => p.code === link.product_code);
            const referralUrl = `${window.location.origin}/index.html?ref=${currentAffiliate.code}`;
            
            return `
                <div class="link-item">
                    <h4>${product ? product.name : link.product_code}</h4>
                    
                    <div style="margin-bottom: 10px;">
                        <strong style="font-size: 11px; color: #666;">Link Toko (Komisi Tokonembahmo):</strong>
                        <div class="link-url">
                            <input type="text" value="${referralUrl}" readonly>
                            <button class="btn-copy" onclick="copyToClipboard('${referralUrl}')">
                                <i class="ri-file-copy-line"></i> Copy
                            </button>
                        </div>
                    </div>
                    
                    ${link.custom_tiktok_url ? `
                    <div>
                        <strong style="font-size: 11px; color: #666;">Link TikTok (Komisi TikTok):</strong>
                        <div class="link-url">
                            <input type="text" value="${link.custom_tiktok_url}" readonly>
                            <button class="btn-copy" onclick="copyToClipboard('${link.custom_tiktok_url}')">
                                <i class="ri-file-copy-line"></i> Copy
                            </button>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="link-stats">
                        <span><i class="ri-eye-line"></i> ${link.click_count || 0} klik</span>
                        <span><i class="ri-time-line"></i> ${new Date(link.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Failed to load links:', error);
        container.innerHTML = '<p style="text-align: center; color: #d32f2f;">Gagal memuat link</p>';
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show toast or feedback
        const btn = event.target.closest('.btn-copy');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="ri-check-line"></i> Copied!';
        btn.style.background = '#28a745';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '#42b549';
        }, 2000);
    });
}

// ==========================================
// SALES TAB
// ==========================================

async function loadSales() {
    const container = document.getElementById('sales-list');
    container.innerHTML = '<p style="text-align: center; color: #999;">Memuat...</p>';
    
    try {
        const orders = await apiClient.getOrders({
            affiliateCode: currentAffiliate.code
        });
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="ri-shopping-bag-line"></i><p>Belum ada penjualan</p></div>';
            return;
        }
        
        container.innerHTML = orders.map(order => {
            const statusClass = order.status === 'COMPLETED' ? 'status-completed' : 'status-processed';
            const statusText = order.status === 'COMPLETED' ? 'Selesai' : getStatusText(order.status);
            
            return `
                <div class="order-item">
                    <div class="order-header">
                        <span class="order-number">#${order.order_number}</span>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="order-details">
                        <strong>Customer:</strong> ${order.customer_name}<br>
                        <strong>Total:</strong> Rp ${order.total.toLocaleString('id-ID')}<br>
                        <strong>Tanggal:</strong> ${new Date(order.created_at).toLocaleString('id-ID')}
                    </div>
                    ${order.total_commission > 0 ? `
                        <div class="commission-badge">
                            💰 Komisi: Rp ${order.total_commission.toLocaleString('id-ID')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Failed to load sales:', error);
        container.innerHTML = '<p style="text-align: center; color: #d32f2f;">Gagal memuat penjualan</p>';
    }
}

function getStatusText(status) {
    const texts = {
        'WAITING_CONFIRMATION': 'Menunggu',
        'SHIPPING_ADDED': 'Ongkir OK',
        'PROCESSED': 'Diproses',
        'COMPLETED': 'Selesai'
    };
    return texts[status] || status;
}

// ==========================================
// COMMISSION TAB
// ==========================================

async function loadCommissionLog() {
    const container = document.getElementById('commission-log');
    container.innerHTML = '<p style="text-align: center; color: #999;">Memuat...</p>';
    
    try {
        const orders = await apiClient.getOrders({
            affiliateCode: currentAffiliate.code
        });
        
        // Filter orders with commission
        const commissionsOrders = orders.filter(o => o.total_commission > 0);
        
        if (commissionsOrders.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="ri-money-dollar-circle-line"></i><p>Belum ada komisi</p></div>';
            return;
        }
        
        container.innerHTML = commissionsOrders.map(order => {
            return `
                <div class="order-item">
                    <div class="order-header">
                        <span class="order-number">#${order.order_number}</span>
                        <span class="commission-badge" style="margin-top: 0;">
                            Rp ${order.total_commission.toLocaleString('id-ID')}
                        </span>
                    </div>
                    <div class="order-details">
                        <strong>Customer:</strong> ${order.customer_name}<br>
                        <strong>Subtotal Order:</strong> Rp ${order.subtotal.toLocaleString('id-ID')}<br>
                        <strong>Status:</strong> ${getStatusText(order.status)}<br>
                        <strong>Tanggal:</strong> ${new Date(order.created_at).toLocaleString('id-ID')}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Failed to load commission log:', error);
        container.innerHTML = '<p style="text-align: center; color: #d32f2f;">Gagal memuat log komisi</p>';
    }
}

// ==========================================
// PAYOUT TAB
// ==========================================

async function loadPayoutTab() {
    // Refresh affiliate data
    try {
        currentAffiliate = await apiClient.getAffiliateByCode(currentAffiliate.code);
        document.getElementById('payout-balance').textContent = 
            'Rp ' + currentAffiliate.current_balance.toLocaleString('id-ID');
    } catch (error) {
        console.error('Failed to refresh balance:', error);
    }
    
    // Load payout history
    await loadPayoutHistory();
}

async function loadPayoutHistory() {
    const container = document.getElementById('payout-history');
    container.innerHTML = '<p style="text-align: center; color: #999;">Memuat...</p>';
    
    try {
        const payouts = await apiClient.getPayouts(currentAffiliate.code);
        
        if (payouts.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="ri-wallet-3-line"></i><p>Belum ada pencairan</p></div>';
            return;
        }
        
        container.innerHTML = payouts.map(payout => {
            const statusClass = payout.status === 'PAID' ? 'status-completed' : 'status-processed';
            const statusText = payout.status === 'PAID' ? '✅ Sudah Dibayar' : '⏳ Menunggu';
            
            return `
                <div class="order-item">
                    <div class="order-header">
                        <span class="order-number">Rp ${payout.amount.toLocaleString('id-ID')}</span>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="order-details">
                        <strong>Tanggal Request:</strong> ${new Date(payout.request_date).toLocaleString('id-ID')}<br>
                        ${payout.paid_date ? `<strong>Tanggal Bayar:</strong> ${new Date(payout.paid_date).toLocaleString('id-ID')}<br>` : ''}
                        ${payout.admin_notes ? `<strong>Catatan:</strong> ${payout.admin_notes}` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Failed to load payout history:', error);
        container.innerHTML = '<p style="text-align: center; color: #d32f2f;">Gagal memuat riwayat</p>';
    }
}

async function requestPayout() {
    const amount = parseInt(document.getElementById('payout-amount').value);
    const minAmount = window.CONFIG?.MIN_PAYOUT_AMOUNT || 50000;
    
    if (!amount || amount < minAmount) {
        alert(`Minimal pencairan Rp ${minAmount.toLocaleString('id-ID')}`);
        return;
    }
    
    if (amount > currentAffiliate.current_balance) {
        alert('Saldo tidak mencukupi!');
        return;
    }
    
    if (!confirm(`Ajukan pencairan sebesar Rp ${amount.toLocaleString('id-ID')}?`)) {
        return;
    }
    
    try {
        await apiClient.requestPayout(currentAffiliate.code, amount);
        
        alert('✅ Permintaan pencairan berhasil diajukan!\nMohon tunggu konfirmasi dari admin.');
        
        // Clear form
        document.getElementById('payout-amount').value = '';
        
        // Reload payout tab
        loadPayoutTab();
        
    } catch (error) {
        console.error('Failed to request payout:', error);
        alert('Gagal mengajukan pencairan: ' + error.message);
    }
}
