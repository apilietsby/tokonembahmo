# 🌿 Tokonembahmo v2 - System Overview

## Quick Start

1. **Customer:** https://your-domain.com/index.html
2. **Admin:** https://your-domain.com/admin-v2.html
3. **Affiliate:** https://your-domain.com/affiliate.html
4. **Product Management:** https://your-domain.com/admin.html

## Architecture

```
┌─────────────────┐
│   Customer      │
│   (index.html)  │
└────────┬────────┘
         │
         ├─> Browse Products
         ├─> Add to Cart
         └─> Checkout → WhatsApp → Order Created
                                         │
                                         ▼
┌─────────────────────────────────────────────────────┐
│              Supabase Database                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ orders   │  │ products │  │affiliates│          │
│  └──────────┘  └──────────┘  └──────────┘          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │order_items│ │ bindings │  │ payouts  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│   Admin Panel   │          │ Affiliate Panel │
│ (admin-v2.html) │          │(affiliate.html) │
└─────────────────┘          └─────────────────┘
         │                              │
         ├─> Process Orders             ├─> View Stats
         ├─> Add Shipping              ├─> Generate Links
         ├─> Send Invoice              ├─> Track Sales
         ├─> Print Labels              └─> Request Payouts
         └─> Approve Payouts
                 │
                 ▼
         ┌──────────────┐
         │ Fonnte API   │
         │ (WhatsApp)   │
         └──────────────┘
```

## Key Flows

### 1. Customer Purchase Flow

```
Customer → Browse Products → Add to Cart → Checkout Form
    ↓
Fill: Name, WhatsApp, Address
    ↓
Click "Lanjut ke WhatsApp"
    ↓
Order Saved (status: WAITING_CONFIRMATION)
    ↓
WhatsApp opens with order details to admin
    ↓
Admin receives notification
```

### 2. Admin Order Processing Flow

```
Receive WhatsApp → Check Dashboard → View Order Details
    ↓
Add Shipping Cost + Select Courier
    ↓
Click "Konfirmasi & Kirim Invoice"
    ↓
Status: SHIPPING_ADDED
Invoice sent to customer via Fonnte
    ↓
Wait for payment confirmation
    ↓
Click "Proses Pesanan"
    ↓
Status: PROCESSED
- Commission credited to affiliate
- Customer binding extended +90 days
- Affiliate notified via WhatsApp
    ↓
Ship goods → Input tracking number
    ↓
Status: COMPLETED
Tracking sent to customer via Fonnte
```

### 3. Affiliate Marketing Flow

```
Affiliate Login → Dashboard
    ↓
Generate Referral Link for Product
    ↓
Optional: Add Custom TikTok URL
    ↓
Share Links:
├─> Referral Link → Tokonembahmo Commission
└─> TikTok Link → TikTok Commission (Double Cuan)
    ↓
Customer clicks link (ref=AFFILIATE_CODE)
    ↓
Customer makes purchase
    ↓
Order created with affiliate_code
    ↓
Customer bound to affiliate for 90 days
    ↓
Admin processes order
    ↓
Commission added to affiliate balance
    ↓
Affiliate notified via WhatsApp
    ↓
Affiliate requests payout (min Rp 50k)
    ↓
Admin approves payout
    ↓
Transfer money to affiliate
    ↓
Affiliate notified via WhatsApp
```

## Database Schema Summary

### Core Tables

1. **products** (21 columns)
   - Product catalog with variants
   - Commission settings
   - Wholesale pricing

2. **orders** (17 columns)
   - Main order records
   - Status tracking
   - Commission tracking

3. **order_items** (10 columns)
   - Order line items
   - Individual product details

4. **affiliates** (12 columns)
   - Partner information
   - Balance tracking
   - Bank details

5. **customer_bindings** (6 columns)
   - 90-day customer locks
   - Auto-renewal

6. **affiliate_links** (8 columns)
   - Custom referral links
   - TikTok URL integration

7. **payouts** (10 columns)
   - Payout requests
   - Approval tracking

8. **notifications** (7 columns)
   - WhatsApp queue
   - Delivery status

## API Client Methods

### Orders
- `createOrder(orderData)` - Create new order
- `getOrders(filters)` - List orders with filters
- `getOrderById(orderId)` - Get single order
- `updateOrder(orderId, updates)` - Update order
- `addShippingCost(orderId, cost, courier)` - Add shipping
- `addResiNumber(orderId, resi, courier)` - Add tracking

### Affiliates
- `getAffiliateByCode(code)` - Get affiliate
- `getAffiliateByWA(phone)` - Find by phone
- `updateAffiliateBalance(code, amount, isAdd)` - Update balance
- `getAffiliateStats(code, days)` - Get statistics

### Customer Bindings
- `getCustomerBinding(customerWA)` - Check active binding
- `createOrUpdateBinding(customerWA, affiliateCode, days)` - Create/update
- `extendBinding(customerWA, days)` - Extend validity

### Affiliate Links
- `getAffiliateLink(affiliateCode, productCode)` - Get link
- `createOrUpdateAffiliateLink(affiliateCode, productCode, tiktokUrl)` - Create/update
- `getAffiliateLinks(affiliateCode)` - List all links

### Payouts
- `requestPayout(affiliateCode, amount)` - Request payout
- `getPayouts(affiliateCode)` - List payouts
- `approvePayout(payoutId, proofUrl, notes)` - Approve payout

## Commission Rules

### Regular Sale
```
Commission = quantity × commission_per_unit
```

### Wholesale Sale
```
If price === price_wholesale:
    Commission = 0
Else:
    Commission = quantity × commission_per_unit
```

### Self-Referral
```
If customer_wa === affiliate_wa:
    is_self_referral = true
    Commission = 0
```

## Security Features

1. **Self-Referral Detection**
   - Prevents affiliates from earning commission on own purchases

2. **Customer Binding**
   - 90-day lock prevents affiliate hopping
   - Auto-extends on new orders

3. **Admin Authentication**
   - Password protection on admin panels
   - Configurable password

4. **Input Validation**
   - WhatsApp number formatting
   - Email validation for affiliates
   - Minimum payout enforcement

5. **Database Constraints**
   - Foreign keys for data integrity
   - Unique constraints on codes
   - NOT NULL on critical fields

## Configuration

All configuration in `config.js`:

```javascript
CONFIG = {
    SUPABASE_URL: 'your_url',
    SUPABASE_ANON_KEY: 'your_key',
    FONNTE_API_KEY: 'your_key',
    ADMIN_WA: '6285700800278',
    ADMIN_PASSWORD: 'admin123',
    CUSTOMER_BINDING_DAYS: 90,
    MIN_PAYOUT_AMOUNT: 50000,
    ORDER_STATUS: {...},
    PAYOUT_STATUS: {...},
    COMMISSION_RULES: {...},
    WA_TEMPLATES: {...},
    BANK_INFO: '...'
}
```

## File Structure

```
tokonembahmo/
├── index.html              # Customer storefront
├── script.js               # Customer logic
├── style.css               # Main styles
├── admin.html              # Product management
├── admin.js                # Product management logic
├── admin-v2.html           # Order management
├── admin-new.js            # Order management logic
├── affiliate.html          # Affiliate dashboard
├── affiliate.js            # Affiliate logic
├── print.html              # Shipping label
├── print.js                # Print logic
├── config.js               # Configuration
├── api-client.js           # API wrapper
├── supabase-migrations.sql # Fresh install
├── supabase-update-migration.sql # Update existing
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── README.md               # Main documentation
├── DEPLOYMENT.md           # Deployment guide
└── OVERVIEW.md             # This file
```

## Technology Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **UI:** RemixIcon, Custom CSS
- **Charts:** Chart.js
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Auth:** Simple password (can upgrade to Supabase Auth)
- **WhatsApp:** Fonnte API
- **Hosting:** Cloudflare Pages (recommended)

## Performance Considerations

- Local storage for cart (no server calls)
- Indexed database queries
- Lazy loading for images
- Minimal dependencies
- CDN for libraries
- Static site (fast loading)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS, Android)

## Limitations

1. **No Authentication**
   - Anyone can access admin with password
   - Consider adding Supabase Auth for production

2. **No Email Notifications**
   - Only WhatsApp via Fonnte
   - Can be extended

3. **Manual Shipping Cost**
   - Admin enters manually
   - Can integrate shipping APIs

4. **Single Admin**
   - No multi-admin support
   - Can be extended

5. **Basic Analytics**
   - 7-day stats only
   - Can integrate Google Analytics

## Future Enhancements

1. **Authentication**
   - Supabase Auth integration
   - Role-based access control

2. **Automated Shipping**
   - JNE/J&T API integration
   - Auto-calculate shipping cost

3. **Advanced Analytics**
   - Monthly/yearly reports
   - Export to Excel
   - Sales forecasting

4. **Customer Portal**
   - Order tracking
   - Order history
   - Repeat orders

5. **Inventory Management**
   - Stock tracking
   - Low stock alerts
   - Supplier management

6. **Email Integration**
   - Order confirmations
   - Invoice emails
   - Newsletter

7. **Payment Gateway**
   - Midtrans integration
   - Auto-confirmation
   - Multiple payment methods

8. **Mobile Apps**
   - React Native apps
   - Push notifications
   - Offline support

## Support & Maintenance

### Regular Backups
- Supabase auto-backups daily
- Manual export monthly recommended

### Monitoring
- Check admin panel daily
- Review affiliate payouts weekly
- Analyze sales monthly

### Updates
- Keep dependencies updated
- Review security patches
- Test before deploying

---

**Version:** 2.0.0  
**Last Updated:** 2024  
**Status:** Production Ready ✅
