// ==========================================
// TOKONEMBAHMO V2 - API CLIENT
// ==========================================

class ApiClient {
    constructor(supabaseClient) {
        this.db = supabaseClient;
    }

    // ==========================================
    // PRODUCTS API
    // ==========================================
    
    async getActiveProducts() {
        const { data, error } = await this.db
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        
        if (error) throw new Error(`Failed to fetch products: ${error.message}`);
        return data;
    }

    async getProductByCode(code) {
        const { data, error } = await this.db
            .from('products')
            .select('*')
            .eq('code', code)
            .single();
        
        if (error) throw new Error(`Failed to fetch product: ${error.message}`);
        return data;
    }

    // ==========================================
    // CUSTOMER BINDINGS API
    // ==========================================
    
    async getCustomerBinding(customerWA) {
        const now = new Date().toISOString();
        const { data, error } = await this.db
            .from('customer_bindings')
            .select('*')
            .eq('customer_wa', customerWA)
            .gte('valid_until', now)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw new Error(`Failed to fetch binding: ${error.message}`);
        }
        return data;
    }

    async createOrUpdateBinding(customerWA, affiliateCode, days = 90) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + days);
        
        const { data, error } = await this.db
            .from('customer_bindings')
            .upsert({
                customer_wa: customerWA,
                affiliate_code: affiliateCode,
                valid_until: validUntil.toISOString()
            }, {
                onConflict: 'customer_wa'
            })
            .select()
            .single();
        
        if (error) throw new Error(`Failed to create/update binding: ${error.message}`);
        return data;
    }

    async extendBinding(customerWA, days = 90) {
        const binding = await this.getCustomerBinding(customerWA);
        if (!binding) return null;
        
        const newValidUntil = new Date();
        newValidUntil.setDate(newValidUntil.getDate() + days);
        
        const { data, error } = await this.db
            .from('customer_bindings')
            .update({ valid_until: newValidUntil.toISOString() })
            .eq('customer_wa', customerWA)
            .select()
            .single();
        
        if (error) throw new Error(`Failed to extend binding: ${error.message}`);
        return data;
    }

    // ==========================================
    // ORDERS API
    // ==========================================
    
    async createOrder(orderData) {
        // Generate order number with better uniqueness
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const orderNumber = `ORD${timestamp}${random}`;
        
        const { data, error } = await this.db
            .from('orders')
            .insert([{
                ...orderData,
                order_number: orderNumber
            }])
            .select()
            .single();
        
        if (error) throw new Error(`Failed to create order: ${error.message}`);
        return data;
    }

    async createOrderItems(items) {
        const { data, error } = await this.db
            .from('order_items')
            .insert(items)
            .select();
        
        if (error) throw new Error(`Failed to create order items: ${error.message}`);
        return data;
    }

    async getOrders(filters = {}) {
        let query = this.db
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false });
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        
        if (filters.affiliateCode) {
            query = query.eq('affiliate_code', filters.affiliateCode);
        }
        
        if (filters.limit) {
            query = query.limit(filters.limit);
        }
        
        const { data, error } = await query;
        if (error) throw new Error(`Failed to fetch orders: ${error.message}`);
        return data;
    }

    async getOrderById(orderId) {
        const { data, error } = await this.db
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single();
        
        if (error) throw new Error(`Failed to fetch order: ${error.message}`);
        return data;
    }

    async updateOrder(orderId, updates) {
        const { data, error } = await this.db
            .from('orders')
            .update(updates)
            .eq('id', orderId)
            .select()
            .single();
        
        if (error) throw new Error(`Failed to update order: ${error.message}`);
        return data;
    }

    async updateOrderStatus(orderId, status) {
        return await this.updateOrder(orderId, { status });
    }

    async addShippingCost(orderId, shippingCost, courierName) {
        const order = await this.getOrderById(orderId);
        const total = order.subtotal + shippingCost;
        
        return await this.updateOrder(orderId, {
            shipping_cost: shippingCost,
            courier_name: courierName,
            total: total,
            status: 'SHIPPING_ADDED'
        });
    }

    async addResiNumber(orderId, resiNumber, courierName) {
        return await this.updateOrder(orderId, {
            resi_number: resiNumber,
            courier_name: courierName,
            status: 'COMPLETED'
        });
    }

    // ==========================================
    // AFFILIATES API
    // ==========================================
    
    async getAffiliateByCode(code) {
        const { data, error } = await this.db
            .from('affiliates')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();
        
        if (error) throw new Error(`Failed to fetch affiliate: ${error.message}`);
        return data;
    }

    async getAffiliateByWA(whatsappNumber) {
        const { data, error } = await this.db
            .from('affiliates')
            .select('*')
            .eq('whatsapp_number', whatsappNumber)
            .eq('is_active', true)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to fetch affiliate: ${error.message}`);
        }
        return data;
    }

    async updateAffiliateBalance(affiliateCode, amount, isAdd = true) {
        const affiliate = await this.getAffiliateByCode(affiliateCode);
        const newBalance = isAdd 
            ? affiliate.current_balance + amount
            : affiliate.current_balance - amount;
        
        const updates = { current_balance: newBalance };
        if (isAdd) {
            updates.total_commission_earned = affiliate.total_commission_earned + amount;
        }
        
        const { data, error } = await this.db
            .from('affiliates')
            .update(updates)
            .eq('code', affiliateCode)
            .select()
            .single();
        
        if (error) throw new Error(`Failed to update balance: ${error.message}`);
        return data;
    }

    async getAffiliateStats(affiliateCode, days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const { data, error } = await this.db
            .from('orders')
            .select('*')
            .eq('affiliate_code', affiliateCode)
            .gte('created_at', startDate.toISOString());
        
        if (error) throw new Error(`Failed to fetch stats: ${error.message}`);
        
        return {
            totalOrders: data.length,
            totalCommission: data.reduce((sum, order) => sum + (order.total_commission || 0), 0),
            completedOrders: data.filter(o => o.status === 'COMPLETED').length
        };
    }

    // ==========================================
    // AFFILIATE LINKS API
    // ==========================================
    
    async getAffiliateLink(affiliateCode, productCode) {
        const { data, error } = await this.db
            .from('affiliate_links')
            .select('*')
            .eq('affiliate_code', affiliateCode)
            .eq('product_code', productCode)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to fetch affiliate link: ${error.message}`);
        }
        return data;
    }

    async createOrUpdateAffiliateLink(affiliateCode, productCode, customTiktokUrl) {
        const referralCode = `${affiliateCode}_${productCode}_${Date.now()}`;
        
        const { data, error } = await this.db
            .from('affiliate_links')
            .upsert({
                affiliate_code: affiliateCode,
                product_code: productCode,
                custom_tiktok_url: customTiktokUrl,
                referral_code: referralCode
            }, {
                onConflict: 'affiliate_code,product_code'
            })
            .select()
            .single();
        
        if (error) throw new Error(`Failed to create/update link: ${error.message}`);
        return data;
    }

    async getAffiliateLinks(affiliateCode) {
        const { data, error } = await this.db
            .from('affiliate_links')
            .select('*')
            .eq('affiliate_code', affiliateCode);
        
        if (error) throw new Error(`Failed to fetch links: ${error.message}`);
        return data;
    }

    // ==========================================
    // PAYOUTS API
    // ==========================================
    
    async requestPayout(affiliateCode, amount) {
        const affiliate = await this.getAffiliateByCode(affiliateCode);
        
        if (affiliate.current_balance < amount) {
            throw new Error('Insufficient balance');
        }
        
        const { data, error } = await this.db
            .from('payouts')
            .insert([{
                affiliate_code: affiliateCode,
                amount: amount,
                status: 'REQUESTED'
            }])
            .select()
            .single();
        
        if (error) throw new Error(`Failed to request payout: ${error.message}`);
        return data;
    }

    async getPayouts(affiliateCode) {
        const { data, error } = await this.db
            .from('payouts')
            .select('*')
            .eq('affiliate_code', affiliateCode)
            .order('created_at', { ascending: false });
        
        if (error) throw new Error(`Failed to fetch payouts: ${error.message}`);
        return data;
    }

    async approvePayout(payoutId, proofUrl, adminNotes = '') {
        const payout = await this.db
            .from('payouts')
            .select('*')
            .eq('id', payoutId)
            .single();
        
        if (payout.error) throw new Error(`Failed to fetch payout: ${payout.error.message}`);
        
        // Deduct from affiliate balance
        await this.updateAffiliateBalance(payout.data.affiliate_code, payout.data.amount, false);
        
        // Update payout status
        const { data, error } = await this.db
            .from('payouts')
            .update({
                status: 'PAID',
                paid_date: new Date().toISOString(),
                proof_url: proofUrl,
                admin_notes: adminNotes
            })
            .eq('id', payoutId)
            .select()
            .single();
        
        if (error) throw new Error(`Failed to approve payout: ${error.message}`);
        return data;
    }

    // ==========================================
    // NOTIFICATIONS API
    // ==========================================
    
    async createNotification(type, recipientWA, message) {
        const { data, error } = await this.db
            .from('notifications')
            .insert([{
                type: type,
                recipient_wa: recipientWA,
                message: message,
                status: 'PENDING'
            }])
            .select()
            .single();
        
        if (error) throw new Error(`Failed to create notification: ${error.message}`);
        return data;
    }

    async updateNotificationStatus(notificationId, status, sentAt = null) {
        const updates = { status };
        if (sentAt) {
            updates.sent_at = sentAt;
        }
        
        const { data, error } = await this.db
            .from('notifications')
            .update(updates)
            .eq('id', notificationId)
            .select()
            .single();
        
        if (error) throw new Error(`Failed to update notification: ${error.message}`);
        return data;
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.ApiClient = ApiClient;
} else {
    module.exports = ApiClient;
}
