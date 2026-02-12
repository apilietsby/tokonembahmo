// ==========================================
// PRINT.JS - TOKONEMBAHMO V2
// ==========================================

// Initialize
const supabaseUrl = window.CONFIG?.SUPABASE_URL || 'https://klmocjsgssormjutrvvi.supabase.co/';
const supabaseKey = window.CONFIG?.SUPABASE_ANON_KEY || 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O';
const db = supabase.createClient(supabaseUrl, supabaseKey);
const apiClient = new ApiClient(db);

// Get order ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('order');

// Load order on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!orderId) {
        document.getElementById('loading').textContent = 'Error: Order ID tidak ditemukan';
        return;
    }
    
    loadOrderForPrint();
});

async function loadOrderForPrint() {
    try {
        const order = await apiClient.getOrderById(orderId);
        
        if (!order) {
            throw new Error('Order tidak ditemukan');
        }
        
        // Populate label section
        document.getElementById('label-order-number').textContent = '#' + order.order_number;
        document.getElementById('label-customer-name').textContent = order.customer_name;
        document.getElementById('label-address').textContent = order.address_full;
        document.getElementById('label-phone').textContent = order.customer_wa;
        document.getElementById('label-courier').textContent = order.courier_name || 'Belum ditentukan';
        document.getElementById('label-total').textContent = 'Rp ' + order.total.toLocaleString('id-ID');
        
        // Populate packing list
        const packingItemsContainer = document.getElementById('packing-items');
        packingItemsContainer.innerHTML = '';
        
        if (order.order_items && order.order_items.length > 0) {
            order.order_items.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'packing-item';
                itemDiv.innerHTML = `
                    <div class="item-name">${index + 1}. ${item.product_name}</div>
                    <div class="item-qty">x${item.quantity}</div>
                `;
                packingItemsContainer.appendChild(itemDiv);
            });
        }
        
        // Populate summary
        document.getElementById('summary-subtotal').textContent = 'Rp ' + order.subtotal.toLocaleString('id-ID');
        document.getElementById('summary-shipping').textContent = 'Rp ' + order.shipping_cost.toLocaleString('id-ID');
        document.getElementById('summary-total').textContent = 'Rp ' + order.total.toLocaleString('id-ID');
        
        // Hide loading and show content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('print-content').style.display = 'block';
        
    } catch (error) {
        console.error('Failed to load order:', error);
        document.getElementById('loading').textContent = 'Error: ' + error.message;
    }
}
