// Cloudflare Workers backend API

// Order CRUD operations
const orders = [];

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === 'POST' && pathname === '/orders') {
        const orderData = await request.json();
        orders.push(orderData);
        return new Response(JSON.stringify(orderData), { status: 201 });
    }
    
    if (request.method === 'GET' && pathname.startsWith('/orders')) {
        const orderId = pathname.split('/')[2];
        if (orderId) {
            // return specific order
            const order = orders.find(o => o.id === orderId);
            return new Response(JSON.stringify(order), { status: order ? 200 : 404 });
        }
        // return all orders
        return new Response(JSON.stringify(orders), { status: 200 });
    }
    
    if (request.method === 'PUT' && pathname.startsWith('/orders')) {
        const orderId = pathname.split('/')[2];
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex >= 0) {
            const updatedOrder = await request.json();
            orders[orderIndex] = updatedOrder;
            return new Response(JSON.stringify(updatedOrder), { status: 200 });
        }
        return new Response('Order not found', { status: 404 });
    }
    
    if (request.method === 'DELETE' && pathname.startsWith('/orders')) {
        const orderId = pathname.split('/')[2];
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex >= 0) {
            orders.splice(orderIndex, 1);
            return new Response('Order deleted', { status: 204 });
        }
        return new Response('Order not found', { status: 404 });
    }
    
    return new Response('Not Found', { status: 404 });
}

// Affiliate stats endpoint
async function getAffiliateStats(affiliateId) {
    // Dummy implementation
    return { affiliateId, earnings: 100, conversions: 10 };
}

// Payout request handling
const payoutRequests = [];

async function handlePayoutRequest(request) {
    const payoutData = await request.json();
    payoutRequests.push(payoutData);
    return new Response(JSON.stringify(payoutData), { status: 201 });
}

// Fonnte WhatsApp integration
async function sendWhatsAppMessage(message) {
    // This should be replaced with actual API call
    return `Message sent to WhatsApp: ${message}`;
}