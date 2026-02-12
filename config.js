// ==========================================
// TOKONEMBAHMO V2 - CONFIGURATION
// ==========================================

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Configuration object
const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: isBrowser 
        ? (window.ENV?.VITE_SUPABASE_URL || 'https://klmocjsgssormjutrvvi.supabase.co/')
        : (process.env.VITE_SUPABASE_URL || 'https://klmocjsgssormjutrvvi.supabase.co/'),
    
    SUPABASE_ANON_KEY: isBrowser
        ? (window.ENV?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O')
        : (process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xptu-xifm5t1EmGHsaC7Og_XJ4e2E_O'),
    
    // Fonnte API Configuration
    FONNTE_API_KEY: isBrowser
        ? (window.ENV?.VITE_FONNTE_API_KEY || '')
        : (process.env.VITE_FONNTE_API_KEY || ''),
    
    FONNTE_API_URL: 'https://api.fonnte.com/send',
    
    // Admin Configuration
    ADMIN_WA: '6285700800278', // Format: 62xxx (country code + number)
    ADMIN_PASSWORD: 'admin123',
    
    // Business Rules
    CUSTOMER_BINDING_DAYS: 90, // Customer locked to affiliate for 90 days
    MIN_PAYOUT_AMOUNT: 50000, // Minimum payout: Rp 50,000
    
    // Order Status
    ORDER_STATUS: {
        WAITING_CONFIRMATION: 'WAITING_CONFIRMATION',
        SHIPPING_ADDED: 'SHIPPING_ADDED',
        PROCESSED: 'PROCESSED',
        COMPLETED: 'COMPLETED'
    },
    
    // Payout Status
    PAYOUT_STATUS: {
        REQUESTED: 'REQUESTED',
        PAID: 'PAID'
    },
    
    // Commission Rules
    COMMISSION_RULES: {
        // If price equals wholesale price, commission = 0
        isWholesale: (price, wholesalePrice) => price === wholesalePrice,
        calculateCommission: (quantity, commissionPerUnit, isWholesale) => {
            return isWholesale ? 0 : quantity * commissionPerUnit;
        }
    },
    
    // WhatsApp Templates
    WA_TEMPLATES: {
        ORDER_TO_ADMIN: (orderNumber, customerName, items, subtotal, customerWA, address) => {
            return `*🛍️ ORDER BARU - TOKONEMBAHMO*\n\n` +
                   `*Order ID:* #${orderNumber}\n` +
                   `*Customer:* ${customerName}\n` +
                   `*WhatsApp:* ${customerWA}\n\n` +
                   `*Daftar Belanja:*\n${items}\n` +
                   `*Subtotal: Rp ${subtotal.toLocaleString('id-ID')}*\n` +
                   `_(Belum termasuk ongkir)_\n\n` +
                   `*Alamat Pengiriman:*\n${address}\n\n` +
                   `Mohon segera diproses 🙏`;
        },
        
        INVOICE_TO_CUSTOMER: (orderNumber, items, subtotal, shippingCost, total, bankInfo) => {
            return `*🧾 INVOICE PEMBAYARAN*\n\n` +
                   `*Order ID:* #${orderNumber}\n` +
                   `*Tanggal:* ${new Date().toLocaleString('id-ID')}\n\n` +
                   `*Detail Pesanan:*\n${items}\n` +
                   `*Subtotal:* Rp ${subtotal.toLocaleString('id-ID')}\n` +
                   `*Ongkir:* Rp ${shippingCost.toLocaleString('id-ID')}\n` +
                   `*TOTAL:* Rp ${total.toLocaleString('id-ID')}\n\n` +
                   `*💳 Transfer ke:*\n${bankInfo}\n\n` +
                   `Kirim bukti transfer ke nomor ini. Terima kasih! 🙏`;
        },
        
        RESI_TO_CUSTOMER: (orderNumber, courier, resiNumber) => {
            return `*📦 PESANAN TELAH DIKIRIM*\n\n` +
                   `*Order ID:* #${orderNumber}\n` +
                   `*Kurir:* ${courier}\n` +
                   `*No. Resi:* ${resiNumber}\n\n` +
                   `Silakan lacak paket Anda.\n` +
                   `Terima kasih telah berbelanja! 🙏`;
        },
        
        SALE_TO_AFFILIATE: (affiliateCode, orderNumber, commission, customerName) => {
            return `*🎉 PENJUALAN BARU!*\n\n` +
                   `Halo Partner ${affiliateCode}!\n\n` +
                   `*Order ID:* #${orderNumber}\n` +
                   `*Customer:* ${customerName}\n` +
                   `*Komisi Anda:* Rp ${commission.toLocaleString('id-ID')}\n\n` +
                   `Cek dashboard untuk detail lengkap!\n` +
                   `Keep up the good work! 💪`;
        },
        
        PAYOUT_APPROVED: (affiliateCode, amount, payoutId) => {
            return `*✅ PENCAIRAN DANA DISETUJUI*\n\n` +
                   `Halo Partner ${affiliateCode}!\n\n` +
                   `*ID Pencairan:* #${payoutId}\n` +
                   `*Jumlah:* Rp ${amount.toLocaleString('id-ID')}\n\n` +
                   `Dana telah ditransfer ke rekening Anda.\n` +
                   `Terima kasih! 🙏`;
        }
    },
    
    // Bank Information
    BANK_INFO: `*BCA*\n` +
               `*No. Rek:* 1234567890\n` +
               `*A/N:* Tokonembahmo\n\n` +
               `*Mandiri*\n` +
               `*No. Rek:* 0987654321\n` +
               `*A/N:* Tokonembahmo`
};

// Export for both browser and Node.js
if (isBrowser) {
    window.CONFIG = CONFIG;
} else {
    module.exports = CONFIG;
}
