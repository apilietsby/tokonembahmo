// affiliate.js

// Tab switching logic
function switchTab(tabName) {
    // Logic to show and hide tabs in the dashboard
}

// Data fetching
async function fetchData(endpoint) {
    const response = await fetch(endpoint);
    const data = await response.json();
    return data;
}

// Commission calculations
function calculateCommission(sales) {
    return sales.reduce((total, sale) => total + sale.amount * sale.commissionRate, 0);
}

// Payout requests
async function requestPayout(amount) {
    const response = await fetch('/api/request-payout', {
        method: 'POST',
        body: JSON.stringify({ amount }),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.json();
}

// WhatsApp integration
function sendWhatsAppMessage(phoneNumber, message) {
    const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Export functions as needed
export {
    switchTab,
    fetchData,
    calculateCommission,
    requestPayout,
    sendWhatsAppMessage,
};
