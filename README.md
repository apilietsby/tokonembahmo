# 🌿 Tokonembahmo v2 - Complete E-Commerce System

A comprehensive e-commerce platform with affiliate marketing system, order management, and WhatsApp integration.

## Features

### 🛒 Customer Features
- Browse products with variants support
- Shopping cart with local storage
- Checkout with WhatsApp integration
- Referral code support for affiliate tracking
- Automatic affiliate binding (90 days)

### 👨‍💼 Admin Features
- Order management dashboard
- Shipping cost calculator
- Invoice generation via WhatsApp (Fonnte API)
- Order status tracking
- Print shipping labels (A5 format)
- Affiliate management
- Payout approval system

### 🤝 Affiliate Features ("Pasukan Mbahmo")
- Personal dashboard with statistics
- Sales chart (7-day analytics)
- Link generator for products
- Custom TikTok URL support ("Double Cuan")
- Commission tracking
- Payout requests (min Rp 50,000)
- Real-time balance updates

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Charts**: Chart.js
- **Icons**: RemixIcon
- **WhatsApp**: Fonnte API
- **Deployment**: Cloudflare Pages (recommended)

## Setup Instructions

### 1. Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration SQL from `supabase-migrations.sql` in the SQL Editor
3. Enable Row Level Security (RLS) if needed
4. Create a storage bucket named `product-images` with public access

### 2. Environment Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_FONNTE_API_KEY=your_fonnte_api_key
   VITE_ADMIN_WA=6285700800278
   ```

3. Update `config.js` with your actual values if not using environment variables

### 3. Fonnte WhatsApp API Setup

1. Sign up at [Fonnte.com](https://fonnte.com)
2. Get your API key from the dashboard
3. Add the API key to your environment variables

### 4. Local Development

Simply open `index.html` in a web browser. For better development experience, use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then visit:
- Customer: `http://localhost:8000/index.html`
- Admin: `http://localhost:8000/admin-v2.html`
- Affiliate: `http://localhost:8000/affiliate.html`
- Old Admin (Product Management): `http://localhost:8000/admin.html`

### 5. Deploy to Cloudflare Pages

1. Push your code to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com)
3. Connect your repository
4. Set build settings:
   - Build command: (leave empty)
   - Build output directory: `/`
5. Add environment variables in Cloudflare dashboard
6. Deploy!

## Database Schema

### Tables

1. **products** - Product catalog with variants support
2. **affiliates** - Affiliate partners
3. **customer_bindings** - 90-day customer-affiliate binding
4. **orders** - Main order transactions
5. **order_items** - Order line items
6. **affiliate_links** - Custom referral links with TikTok URLs
7. **payouts** - Affiliate payout requests
8. **notifications** - WhatsApp notification queue

## User Flows

### Customer Flow
1. Browse products → Add to cart
2. Checkout (enter: name, WA, address)
3. Click "Lanjut ke WhatsApp"
4. Order saved with status: WAITING_CONFIRMATION
5. WhatsApp opens with order details to admin

### Admin Flow
1. Receive WhatsApp notification
2. Check dashboard for new orders
3. Add shipping cost manually
4. Click "Konfirmasi & Kirim Invoice"
5. Invoice sent via Fonnte API
6. Wait for payment confirmation
7. Click "Proses Pesanan" (status: PROCESSED)
8. Print A5 shipping label
9. Ship goods & input tracking number
10. System sends tracking via Fonnte

### Affiliate Flow
1. Login to affiliate dashboard
2. Generate referral links for products
3. Share links (with optional TikTok URLs)
4. Customer orders via referral link
5. Commission automatically calculated
6. View real-time stats and balance
7. Request payout (min Rp 50,000)
8. Admin approves and transfers

## Commission Rules

- **Regular Sale**: Affiliate gets `commission_per_unit` × quantity
- **Wholesale Sale**: Commission = 0 (when price = price_wholesale)
- **Self-Referral**: Order marked as self-referral, commission = 0
- **Customer Binding**: Lasts 90 days, auto-extends on new orders

## Anti-Fraud Features

- Self-referral detection (customer WA = affiliate WA)
- Email validation for affiliate registration
- Encrypted referral codes
- Minimum payout threshold (Rp 50,000)

## File Structure

```
tokonembahmo/
├── index.html              # Customer storefront
├── script.js               # Customer logic
├── style.css               # Main styles
├── admin.html              # Old admin (product management)
├── admin.js                # Old admin logic
├── admin-v2.html           # New admin (order management)
├── admin-new.js            # New admin logic
├── affiliate.html          # Affiliate dashboard
├── affiliate.js            # Affiliate logic
├── print.html              # Print label page
├── print.js                # Print logic
├── config.js               # Configuration
├── api-client.js           # API client wrapper
├── supabase-migrations.sql # Database schema
├── .env.example            # Environment template
└── README.md               # This file
```

## API Endpoints (Future: Cloudflare Workers)

The current implementation uses direct Supabase client calls. For production, consider implementing these as Cloudflare Workers:

- `POST /api/orders/create` - Create order
- `PUT /api/orders/:id/shipping` - Add shipping cost
- `PUT /api/orders/:id/confirm` - Confirm & send invoice
- `PUT /api/orders/:id/process` - Process order
- `PUT /api/orders/:id/resi` - Add tracking number
- `GET /api/affiliate/:code/stats` - Get affiliate stats
- `POST /api/affiliate/:code/payout` - Request payout
- `PUT /api/affiliate/:code/payout/:id/pay` - Approve payout

## Customization

### Bank Information
Edit `config.js` → `BANK_INFO` section

### WhatsApp Templates
Edit `config.js` → `WA_TEMPLATES` section

### Commission Rules
Edit product data in Supabase:
- `commission_per_unit`: Commission for regular sales
- `price_wholesale`: Price for wholesale (commission = 0)

### Minimum Payout
Edit `config.js` → `MIN_PAYOUT_AMOUNT`

## Troubleshooting

### Orders not saving
- Check Supabase credentials in config.js
- Ensure `products` table has required columns
- Check browser console for errors

### WhatsApp not sending
- Verify Fonnte API key is correct
- Check Fonnte account balance
- Ensure phone numbers are in correct format (62xxx)

### Affiliate login fails
- Ensure affiliate exists in database
- Check `is_active` = true
- Verify code matches exactly (case-sensitive)

## Support

For issues and questions:
- Check browser console for errors
- Verify Supabase connection
- Review database schema matches migration file

## License

Proprietary - Tokonembahmo

## Credits

Developed for Tokonembahmo by Copilot
