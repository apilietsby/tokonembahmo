# Deployment Guide - Tokonembahmo v2

This guide will help you deploy Tokonembahmo v2 to production.

## Prerequisites

- Supabase account ([supabase.com](https://supabase.com))
- Fonnte account for WhatsApp API ([fonnte.com](https://fonnte.com))
- Cloudflare account for deployment (optional but recommended)
- Git installed on your machine

## Step 1: Set Up Supabase

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details:
   - Name: tokonembahmo
   - Database Password: (choose a strong password)
   - Region: (choose closest to your location)
4. Click "Create new project"
5. Wait for the project to be created (~2 minutes)

### 1.2 Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire content of `supabase-migrations.sql`
4. Paste it into the SQL Editor
5. Click "Run"
6. You should see success messages for all table creations

**If you already have an existing database:**
- Run `supabase-update-migration.sql` instead to add missing columns

### 1.3 Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click "New Bucket"
3. Name it: `product-images`
4. Make it **public**
5. Click "Create bucket"

### 1.4 Configure Row Level Security (RLS)

For production, you should enable RLS policies. Here are recommended policies:

```sql
-- Products: Public read access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON products
FOR SELECT USING (is_active = true);

-- Orders: Users can only see their own orders (in future with auth)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create orders" ON orders
FOR INSERT WITH CHECK (true);

-- Affiliates: Can read their own data
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can read own data" ON affiliates
FOR SELECT USING (true);
```

**Note:** For the current implementation without authentication, you can leave RLS disabled or use service role key carefully.

### 1.5 Get Credentials

1. Go to **Settings** → **API**
2. Copy the following:
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_ANON_KEY)
3. Save these for later

## Step 2: Set Up Fonnte WhatsApp API

### 2.1 Register and Get API Key

1. Go to [fonnte.com](https://fonnte.com) and register
2. Verify your WhatsApp number
3. Go to **Dashboard** → **API**
4. Copy your **API Token**
5. Save this for later

### 2.2 Top Up Balance

1. Go to **Balance** → **Top Up**
2. Add credits (recommended: at least Rp 50,000)
3. WhatsApp messages cost ~Rp 200-300 per message

### 2.3 Test Your Device

1. Send a test message from the dashboard
2. Ensure your WhatsApp is online and receiving messages
3. Keep your WhatsApp device online for notifications to work

## Step 3: Configure Application

### 3.1 Update config.js

Open `config.js` and update the following values:

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your_supabase_anon_key',
    FONNTE_API_KEY: 'your_fonnte_api_key',
    ADMIN_WA: '6285700800278', // Your admin WhatsApp number
    ADMIN_PASSWORD: 'your_secure_admin_password', // Change this!
    
    // ... rest of config
};
```

**Security Note:** In production, use environment variables instead of hardcoding credentials.

### 3.2 Update Bank Information

In `config.js`, update the BANK_INFO section:

```javascript
BANK_INFO: `*BCA*\n` +
           `*No. Rek:* YOUR_BCA_NUMBER\n` +
           `*A/N:* YOUR_NAME\n\n` +
           `*Mandiri*\n` +
           `*No. Rek:* YOUR_MANDIRI_NUMBER\n` +
           `*A/N:* YOUR_NAME`
```

## Step 4: Deploy to Cloudflare Pages

### 4.1 Push to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/tokonembahmo.git

# Push
git push -u origin main
```

### 4.2 Connect to Cloudflare Pages

1. Go to [Cloudflare Pages](https://pages.cloudflare.com)
2. Click "Create a project"
3. Connect your GitHub account
4. Select your repository
5. Configure build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Build output directory:** `/`
   - **Root directory:** (leave as `/`)
6. Click "Save and Deploy"

### 4.3 Configure Environment Variables (Optional)

If you want to use environment variables instead of hardcoding:

1. In Cloudflare Pages, go to **Settings** → **Environment variables**
2. Add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_FONNTE_API_KEY` = your Fonnte API key
3. Redeploy your site

### 4.4 Get Your Domain

After deployment:
1. Your site will be available at: `https://tokonembahmo.pages.dev`
2. You can add a custom domain in **Custom domains** section

## Step 5: Initial Setup

### 5.1 Add Sample Products

1. Go to `https://your-site.pages.dev/admin.html`
2. Login with your admin password
3. Add at least one product with:
   - Name
   - SKU (will be used as product code)
   - Price
   - Commission per unit (for affiliates)
   - Description
   - Image
4. Save the product

### 5.2 Create Test Affiliate

Add directly to Supabase:

1. Go to Supabase → **Table Editor** → **affiliates**
2. Click "Insert row"
3. Fill in:
   ```
   code: TEST01
   name: Test Affiliate
   email: test@example.com
   whatsapp_number: 6281234567890
   bank_name: BCA
   bank_account: 1234567890
   bank_holder_name: Test User
   is_active: true
   ```
4. Save

### 5.3 Test the System

**Customer Flow:**
1. Go to `https://your-site.pages.dev`
2. Browse products and add to cart
3. Checkout with test data
4. Verify WhatsApp message is sent

**Affiliate Flow:**
1. Go to `https://your-site.pages.dev/affiliate.html`
2. Login with code: `TEST01`
3. Generate a referral link
4. Open the link in incognito mode
5. Make a purchase
6. Verify commission is tracked

**Admin Flow:**
1. Go to `https://your-site.pages.dev/admin-v2.html`
2. Login with admin password
3. View orders, add shipping, send invoice
4. Process orders and approve payouts

## Step 6: Production Checklist

### Security

- [ ] Change default admin password
- [ ] Enable HTTPS (Cloudflare does this automatically)
- [ ] Enable Supabase RLS policies
- [ ] Don't expose sensitive keys in client-side code
- [ ] Regularly backup your database

### Performance

- [ ] Optimize images (compress before upload)
- [ ] Monitor Supabase usage limits
- [ ] Set up Cloudflare caching rules
- [ ] Test on mobile devices

### Monitoring

- [ ] Set up Supabase alerts for errors
- [ ] Monitor Fonnte balance
- [ ] Check order processing daily
- [ ] Review affiliate payouts weekly

### Business

- [ ] Update bank information
- [ ] Set appropriate commission rates
- [ ] Configure minimum payout amount
- [ ] Prepare customer support process

## Step 7: Maintenance

### Daily Tasks

- Check new orders in admin panel
- Process payments and confirmations
- Add tracking numbers for shipped items

### Weekly Tasks

- Review affiliate performance
- Approve payout requests
- Add new products if needed

### Monthly Tasks

- Backup database (Supabase does this automatically)
- Review and optimize commission rates
- Analyze sales data

## Troubleshooting

### Orders Not Saving

**Problem:** Orders don't appear in admin panel

**Solutions:**
1. Check browser console for errors
2. Verify Supabase credentials in config.js
3. Ensure tables exist in Supabase
4. Check if orders table has all required columns

### WhatsApp Not Sending

**Problem:** WhatsApp notifications not received

**Solutions:**
1. Verify Fonnte API key is correct
2. Check Fonnte balance
3. Ensure phone numbers are in correct format (62xxx)
4. Verify admin WhatsApp device is online
5. Check Fonnte device status in dashboard

### Affiliate Login Fails

**Problem:** Can't login to affiliate dashboard

**Solutions:**
1. Verify affiliate exists in Supabase
2. Check `is_active` field is true
3. Ensure code matches exactly (case-sensitive)
4. Check browser console for errors

### Images Not Uploading

**Problem:** Product images fail to upload

**Solutions:**
1. Verify storage bucket `product-images` exists
2. Check bucket is set to public
3. Ensure image size is under 2MB
4. Verify Supabase storage permissions

## Support

For technical support:
- Check logs in browser console
- Review Supabase logs
- Test with sample data first
- Verify all credentials are correct

## Scaling Considerations

As your business grows:

1. **Database:** Supabase free tier supports up to 500MB. Upgrade if needed.
2. **Storage:** Monitor storage usage and upgrade plan accordingly.
3. **WhatsApp:** Consider multiple Fonnte devices for redundancy.
4. **Hosting:** Cloudflare Pages handles millions of requests per month.

## Next Steps

- Set up analytics (Google Analytics)
- Add custom domain
- Configure email notifications (optional)
- Implement advanced features as needed

---

🎉 **Congratulations!** Your e-commerce system is now live!
