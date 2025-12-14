# 🚀 Complete Deployment Guide: Vercel + Supabase

**Step-by-step guide to deploy your Transport Management System to production.**

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] GitHub account with your code pushed
- [ ] Clerk account (for authentication)
- [ ] Cloudinary account (for image uploads)
- [ ] Email account (for Supabase signup)
- [ ] All code committed and pushed to GitHub

**Estimated time:** 30-45 minutes

---

## Step 1: Set Up Supabase Database (10 minutes)

### 1.1 Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign up"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

### 1.2 Create New Project

1. Click **"New Project"** in the dashboard
2. Fill in the form:
   - **Name:** `transport-management-system` (or any name)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to your users (e.g., `US East`, `Europe West`)
   - **Pricing Plan:** Select **"Free"** (500 MB database, perfect for MVP)
3. Click **"Create new project"**
4. Wait 2-3 minutes for project to initialize

### 1.3 Get Database Connection String

1. Once project is ready, go to **Settings** → **Database**
2. Scroll down to **"Connection string"** section
3. **IMPORTANT:** Select **"Connection pooling"** tab (not "URI" or "Session")
4. Copy the connection string (it looks like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`)
5. **Save this somewhere safe** - you'll need it in Step 4
 
**Why Connection Pooling?**
- Vercel uses serverless functions
- Each function needs a database connection
- Connection pooling reuses connections (faster, more efficient)
- Without pooling, you'll hit connection limits quickly

### 1.4 (Optional) Test Connection Locally

You can test the connection before deploying:

```bash
# In your project root, create a temporary .env.test file
echo "DATABASE_URL=your_supabase_connection_string_here" > .env.test

# Test connection
npx prisma db pull --schema=./prisma/schema.prisma
```

If it works, you're good to go!

---

## Step 2: Run Database Migrations (5 minutes)

### 2.1 Update Your .env File

1. Open your `.env` file in the project root
2. Find the `DATABASE_URL` line
3. Replace it with your Supabase connection string (from Step 1.3):

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Important:** 
- Use the **Connection pooling** URL (not the direct connection) for production/Vercel
- For local migration, you can use the direct connection (port 5432)
- **If your password contains special characters** (`/`, `!`, `@`, `#`, `$`, `%`, `&`, `*`, etc.), you must URL-encode them:
  - `/` → `%2F`
  - `!` → `%21`
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`
  - `&` → `%26`
  - `*` → `%2A`
- Keep the quotes around the connection string
- Make sure there are no extra spaces

**Example:** If your password is `6JtzvHW/tpes!s4`, encode it as `6JtzvHW%2Ftpes%21s4`

### 2.2 Push Schema to Supabase

You have two options:

**Option A: Using Prisma db push (Easiest)**
```bash
# Push schema to database (reads from .env file)
npx prisma db push

# Generate Prisma client
npx prisma generate
```

**Option B: Using Prisma Migrate (Recommended for Production)**
```bash
# Create and apply migration (reads from .env file)
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

**What this does:**
- Creates all tables in your Supabase database
- Sets up relationships and indexes
- Generates Prisma client for your app

### 2.2 Verify Tables Created

1. Go to Supabase dashboard → **Table Editor**
2. You should see tables like:
   - `User`
   - `DriverProfile`
   - `ClientProfile`
   - `Vehicle`
   - `Trip`
   - `Shipment`
   - `Issue`
   - `Notification`
   - etc.

If you see all tables, ✅ **Step 2 Complete!**

---

## Step 3: Set Up Vercel (5 minutes)

### 3.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign up"**
3. Sign up with GitHub (recommended - easier integration)
4. Authorize Vercel to access your GitHub

### 3.2 Import Your Project

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find your `transport-management-system` repository
4. Click **"Import"**

### 3.3 Configure Project Settings

Vercel should auto-detect Next.js, but verify:

- **Framework Preset:** `Next.js` ✅
- **Root Directory:** `./` (default) ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅
- **Install Command:** `npm install` ✅

**Don't click Deploy yet!** We need to add environment variables first.

---

## Step 4: Configure Environment Variables (10 minutes)

### 4.1 Add Database URL

1. In Vercel project settings, scroll to **"Environment Variables"**
2. Click **"Add"** to add a new variable
3. Add these variables one by one:

**Variable 1: DATABASE_URL**
- **Key:** `DATABASE_URL`
- **Value:** Your Supabase connection pooling string (from Step 1.3)
- **Environment:** Select all (Production, Preview, Development)
- Click **"Save"**

### 4.2 Add Clerk Keys (Production)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Make sure you're in **Production** environment (toggle in top right)
3. Go to **API Keys**
4. Copy these values:

**Variable 2: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**
- **Key:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **Value:** `pk_live_...` (starts with `pk_live_`)
- **Environment:** All
- Click **"Save"**

**Variable 3: CLERK_SECRET_KEY**
- **Key:** `CLERK_SECRET_KEY`
- **Value:** `sk_live_...` (starts with `sk_live_`)
- **Environment:** All
- Click **"Save"**

**⚠️ Important:** Use **production keys** (`pk_live_` and `sk_live_`), not test keys!

### 4.3 Add Cloudinary Keys

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copy your credentials:

**Variable 4: CLOUDINARY_URL**
- **Key:** `CLOUDINARY_URL`
- **Value:** `cloudinary://api_key:api_secret@cloud_name`
  - Format: `cloudinary://[API_KEY]:[API_SECRET]@[CLOUD_NAME]`
  - Find these in Cloudinary Dashboard → Settings → Product Environment Credentials
- **Environment:** All
- Click **"Save"**

**Variable 5: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME**
- **Key:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- **Value:** Your cloud name (e.g., `dxyz123abc`)
- **Environment:** All
- Click **"Save"**

**Variable 6: CLOUDINARY_UPLOAD_PRESET**
- **Key:** `CLOUDINARY_UPLOAD_PRESET`
- **Value:** `transport_management_uploads` (or your preset name)
- **Environment:** All
- Click **"Save"**

**Create Upload Preset (if not done):**
1. In Cloudinary Dashboard → **Settings** → **Upload**
2. Click **"Add upload preset"**
3. Name: `transport_management_uploads`
4. Signing mode: **Signed** (recommended)
5. Click **"Save"**

### 4.4 Add App URL (Will Update After Deployment)

**Variable 7: NEXT_PUBLIC_APP_URL**
- **Key:** `NEXT_PUBLIC_APP_URL`
- **Value:** `https://your-app-name.vercel.app` (we'll update this after first deploy)
- **Environment:** All
- Click **"Save"**

**Note:** After first deployment, Vercel will give you a URL. Update this variable with the actual URL.

### 4.5 (Optional) Add Resend for Emails

If you want email notifications (optional for MVP):

1. Go to [resend.com](https://resend.com)
2. Sign up and create API key
3. Add variables:
   - `RESEND_API_KEY` = `re_...`
   - `RESEND_FROM_EMAIL` = `Transport Management System <noreply@yourdomain.com>`

**For MVP, you can skip this** - in-app notifications are enough.

---

## Step 5: Deploy to Vercel (5 minutes)

### 5.1 Initial Deployment

1. In Vercel project page, click **"Deploy"**
2. Wait 2-5 minutes for build to complete
3. Watch the build logs for any errors

**Common Build Issues:**
- **"Module not found"** → Check `package.json` has all dependencies
- **"Prisma Client not generated"** → Add to build command: `npm run prisma:generate && npm run build`
- **"Environment variable missing"** → Check all variables are added

### 5.2 Get Your App URL

After successful deployment:
1. Vercel will show: **"Congratulations! Your project has been deployed"**
2. Your app URL: `https://your-project-name.vercel.app`
3. **Copy this URL** - you'll need it for Clerk webhook

### 5.3 Update App URL Environment Variable

1. Go back to Vercel → **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_APP_URL`
3. Update value to your actual Vercel URL: `https://your-project-name.vercel.app`
4. Click **"Save"**
5. **Redeploy** (Vercel will ask if you want to redeploy after changing env vars)

---

## Step 6: Configure Clerk Webhook (5 minutes)

### 6.1 Get Webhook URL

Your webhook URL is:
```
https://your-project-name.vercel.app/api/webhook/clerk
```

Replace `your-project-name` with your actual Vercel project name.

### 6.2 Add Webhook in Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Make sure you're in **Production** environment
3. Go to **Webhooks** in sidebar
4. Click **"Add Endpoint"**
5. Enter your webhook URL: `https://your-project-name.vercel.app/api/webhook/clerk`
6. **Subscribe to events:**
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
7. Click **"Create"**

### 6.3 Get Webhook Secret

1. After creating webhook, Clerk will show a **"Signing Secret"**
2. Copy it (starts with `whsec_`)
3. Go back to Vercel → **Environment Variables**
4. Add new variable:
   - **Key:** `CLERK_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (the secret you copied)
   - **Environment:** All
   - Click **"Save"**
5. **Redeploy** your app

### 6.4 Test Webhook

1. In Clerk Dashboard → **Webhooks**, click on your webhook
2. Click **"Send test event"**
3. Select `user.created`
4. Check if it succeeds (green checkmark)

If it fails, check:
- Webhook URL is correct
- `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- App is deployed and running

---

## Step 7: Run Backfill Script (If You Have Existing Users) (5 minutes)

If you already have users in Clerk that need to be synced to Prisma:

### 7.1 Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 7.2 Pull Environment Variables

```bash
# In your project root
vercel login
vercel link  # Link to your Vercel project
vercel env pull .env.local
```

### 7.3 Run Backfill Script

```bash
# Make sure DATABASE_URL in .env.local points to Supabase
npm run backfill:users
```

This will sync all Clerk users to your Supabase database.

**If you're starting fresh, skip this step** - new users will be created automatically via webhook.

---

## Step 8: Test Your Deployment (10 minutes)

### 8.1 Basic Functionality Tests

Visit your app: `https://your-project-name.vercel.app`

Test these features:

1. **Sign In/Sign Up:**
   - [ ] Can sign up with email
   - [ ] Can sign in
   - [ ] Redirects to correct dashboard based on role

2. **Database Connection:**
   - [ ] Can view dashboard (loads data from Supabase)
   - [ ] Can create a trip (saves to database)
   - [ ] Can view trips list

3. **Image Upload:**
   - [ ] Can upload profile picture
   - [ ] Can upload vehicle image
   - [ ] Images appear correctly

4. **Notifications:**
   - [ ] Notification bell shows in header
   - [ ] Can view notifications page

5. **Role-Based Access:**
   - [ ] Admin sees admin dashboard
   - [ ] Driver sees driver dashboard
   - [ ] Client sees client dashboard

### 8.2 Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on latest deployment
3. Check **"Functions"** tab for any errors
4. Check **"Logs"** for runtime errors

### 8.3 Check Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. Verify data is being created:
   - Create a user → Check `User` table
   - Create a trip → Check `Trip` table

---

## Step 9: Set Up Custom Domain (Optional)

### 9.1 Add Domain in Vercel

1. Go to Vercel → Your Project → **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain (e.g., `tms.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-30 minutes)

### 9.2 Update Environment Variables

1. Update `NEXT_PUBLIC_APP_URL` to your custom domain
2. Update Clerk webhook URL to use custom domain
3. Redeploy

---

## 🎉 Deployment Complete!

Your app is now live! 🚀

### Quick Links:
- **App URL:** `https://your-project-name.vercel.app`
- **Vercel Dashboard:** [vercel.com/dashboard](https://vercel.com/dashboard)
- **Supabase Dashboard:** [supabase.com/dashboard](https://supabase.com/dashboard)
- **Clerk Dashboard:** [dashboard.clerk.com](https://dashboard.clerk.com)

### Next Steps:
1. ✅ Share your app with users
2. ✅ Monitor Vercel logs for errors
3. ✅ Check Supabase usage (free tier limits)
4. ✅ Set up custom domain (optional)
5. ✅ Enable Vercel Analytics (optional)

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Prisma Client not generated"**
- Add to Vercel build command: `npm run prisma:generate && npm run build`
- Or add `postinstall` script in `package.json`: `"postinstall": "prisma generate"`

**Error: "Module not found"**
- Check all dependencies are in `package.json`
- Run `npm install` locally to verify

### Database Connection Issues

**Error: "Can't reach database server"**
- Verify `DATABASE_URL` uses **Connection pooling** URL (not direct connection)
- Check Supabase project is active
- Verify connection string format

**Error: "Too many connections"**
- Make sure you're using **Connection pooling** URL from Supabase
- Check Supabase dashboard for connection limits

### Clerk Webhook Not Working

**Webhook not receiving events:**
- Verify webhook URL is correct
- Check `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- Test webhook in Clerk dashboard
- Check Vercel function logs for errors

### Image Upload Not Working

**Error: "Missing api_key"**
- Verify `CLOUDINARY_URL` format: `cloudinary://api_key:api_secret@cloud_name`
- Check Cloudinary credentials are correct
- Ensure upload preset exists in Cloudinary

---

## 📊 Monitoring Your App

### Vercel Analytics
1. Go to Vercel → Your Project → **Analytics**
2. Enable Analytics (free tier available)
3. Monitor page views, performance, errors

### Supabase Monitoring
1. Go to Supabase Dashboard → **Project Settings** → **Usage**
2. Monitor database size, bandwidth, API calls
3. Free tier: 500 MB database, 2 GB bandwidth

### Error Tracking
Consider adding Sentry for error tracking:
1. Sign up at [sentry.io](https://sentry.io)
2. Install: `npm install @sentry/nextjs`
3. Configure in your app

---

## 🔐 Security Checklist

Before going live, verify:
- [ ] Using production Clerk keys (`pk_live_`, `sk_live_`)
- [ ] Database connection string is secure (not exposed)
- [ ] Environment variables not in client code
- [ ] Webhook secret is set and verified
- [ ] Cloudinary URL is secure
- [ ] Custom domain has SSL (automatic with Vercel)

---

**Congratulations! Your Transport Management System is now live! 🎉**

*Last Updated: [Date]*

