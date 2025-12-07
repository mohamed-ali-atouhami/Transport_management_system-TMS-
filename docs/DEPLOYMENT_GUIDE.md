# Deployment Guide - Transport Management System

This guide walks you through deploying the Transport Management System to production.

## 🎯 Deployment Options

### Recommended: Vercel + Managed PostgreSQL

**Why Vercel?**
- One-click deployment from GitHub
- Automatic preview deployments
- Built-in CI/CD
- Edge network for fast performance
- Free tier available

**PostgreSQL Options:**
- **Vercel Postgres** (easiest, integrated)
- **Supabase** (free tier, great features)
- **Neon** (serverless, auto-scaling)
- **Railway** (simple setup)

---

## 📋 Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] Environment variables documented
- [ ] Database schema finalized
- [ ] Clerk webhook configured
- [ ] Cloudinary account set up
- [ ] Resend account set up (if using emails)
- [ ] GitHub repository ready

---

## 🚀 Step-by-Step Deployment

### 1. Prepare Your Code

```bash
# Ensure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Set Up Managed PostgreSQL

Choose one of these options:

#### Option A: Vercel Postgres (Recommended for Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or select existing
3. Go to **Storage** → **Create Database** → **Postgres**
4. Copy the connection string (will be used as `DATABASE_URL`)

#### Option B: Supabase

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the connection string (use "Connection pooling" for serverless)

#### Option C: Neon

1. Go to [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string from dashboard

### 3. Deploy to Vercel

#### Method 1: Via Vercel Dashboard

1. **Import Project:**
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

2. **Configure Project:**
   - Framework Preset: **Next.js**
   - Root Directory: `./` (default)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)
   - Install Command: `npm install`

3. **Add Environment Variables:**
   Click "Environment Variables" and add:

   ```env
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   CLERK_WEBHOOK_SECRET=whsec_...
   CLOUDINARY_URL=cloudinary://...
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_UPLOAD_PRESET=transport_management_uploads
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=Transport Management System <noreply@yourdomain.com>
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

#### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name? transport-management-system
# - Directory? ./
# - Override settings? No
```

### 4. Run Database Migrations

After deployment, run Prisma migrations:

```bash
# Option 1: Via Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Option 2: Via Vercel Dashboard
# Go to your project → Settings → Environment Variables
# Add DATABASE_URL, then run migrations locally with production URL
```

**Or use Vercel's built-in migration:**

1. Go to Vercel project settings
2. Add a build command that includes migrations:
   ```bash
   npm run build && npx prisma migrate deploy
   ```

### 5. Configure Clerk Webhook

1. **Get Webhook URL:**
   - Your webhook URL: `https://your-app.vercel.app/api/webhook/clerk`

2. **Configure in Clerk:**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Navigate to **Webhooks**
   - Click "Add Endpoint"
   - Enter your webhook URL
   - Subscribe to events:
     - `user.created`
     - `user.updated`
     - `user.deleted`
   - Copy the **Signing Secret** (starts with `whsec_`)
   - Add to Vercel environment variables as `CLERK_WEBHOOK_SECRET`

3. **Update Environment Variables:**
   - Go to Vercel project → Settings → Environment Variables
   - Update `CLERK_WEBHOOK_SECRET` with the signing secret
   - Redeploy if needed

### 6. Configure Cloudinary

1. **Get Cloudinary Credentials:**
   - Go to [Cloudinary Dashboard](https://cloudinary.com/console)
   - Copy your Cloud Name, API Key, and API Secret

2. **Create Upload Preset:**
   - Go to **Settings** → **Upload**
   - Click "Add upload preset"
   - Name: `transport_management_uploads`
   - Signing mode: **Signed** (recommended)
   - Save

3. **Format CLOUDINARY_URL:**
   ```
   cloudinary://api_key:api_secret@cloud_name
   ```

4. **Add to Vercel:**
   - Add `CLOUDINARY_URL` and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` to environment variables

### 7. Configure Resend (Optional)

1. **Get API Key:**
   - Go to [Resend](https://resend.com)
   - Create API key
   - Copy the key (starts with `re_`)

2. **Verify Domain (Recommended):**
   - Add your domain in Resend dashboard
   - Verify DNS records
   - Use verified domain in `RESEND_FROM_EMAIL`

3. **Add to Vercel:**
   - Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to environment variables

### 8. Update App URL

1. **Get Your Vercel URL:**
   - Your app URL: `https://your-app.vercel.app`

2. **Update Environment Variable:**
   - Go to Vercel → Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` to your production URL

### 9. Run Backfill Script (If Needed)

If you have existing Clerk users, sync them to Prisma:

```bash
# Pull production environment variables
vercel env pull .env.local

# Run backfill script
npm run backfill:users
```

---

## 🔄 Post-Deployment Steps

### 1. Test Production Deployment

- [ ] Sign in works
- [ ] Database connection works
- [ ] Image upload works
- [ ] Notifications work
- [ ] Webhooks receive events
- [ ] All routes accessible

### 2. Set Up Custom Domain (Optional)

1. **In Vercel:**
   - Go to project → Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables:**
   - Update `NEXT_PUBLIC_APP_URL` to custom domain
   - Update Clerk webhook URL if needed

### 3. Enable Production Clerk Keys

1. **Switch to Production:**
   - Go to Clerk Dashboard
   - Switch to production environment
   - Copy production keys

2. **Update Vercel:**
   - Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (use `pk_live_...`)
   - Update `CLERK_SECRET_KEY` (use `sk_live_...`)

### 4. Monitor & Optimize

- **Vercel Analytics:** Enable in project settings
- **Error Tracking:** Consider adding Sentry
- **Performance:** Monitor Core Web Vitals
- **Database:** Monitor connection pool usage

---

## 🐛 Troubleshooting

### Build Failures

**Error: "Module not found"**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: "Prisma Client not generated"**
- Add to build command: `npm run prisma:generate && npm run build`

### Database Connection Issues

**Error: "Can't reach database server"**
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- For Supabase/Neon, use connection pooling URL

**Error: "Too many connections"**
- Use connection pooling (Supabase/Neon provide this)
- Add `?pgbouncer=true` to connection string if available

### Clerk Webhook Issues

**Webhook not receiving events:**
- Verify webhook URL is correct
- Check `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- Test webhook in Clerk dashboard

### Image Upload Issues

**Error: "Missing api_key"**
- Verify `CLOUDINARY_URL` format is correct
- Check Cloudinary credentials are valid
- Ensure upload preset exists

---

## 📊 Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_live_...` |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret | `whsec_...` |
| `CLOUDINARY_URL` | Cloudinary connection URL | `cloudinary://key:secret@name` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` |

### Optional

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for emails | `re_...` |
| `RESEND_FROM_EMAIL` | Email sender address | `TMS <noreply@domain.com>` |
| `NEXT_PUBLIC_APP_URL` | Production app URL | `https://your-app.vercel.app` |
| `CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset | `transport_management_uploads` |

---

## 🔐 Security Checklist

- [ ] Use production Clerk keys (not test keys)
- [ ] Database connection string is secure
- [ ] Environment variables not exposed in client code
- [ ] Webhook secret is set and verified
- [ ] Cloudinary URL is secure (not exposed)
- [ ] Custom domain has SSL (automatic with Vercel)
- [ ] Database has proper access controls

---

## 📈 Monitoring & Maintenance

### Regular Tasks

1. **Monitor Database:**
   - Check connection pool usage
   - Monitor query performance
   - Review slow queries

2. **Monitor Vercel:**
   - Check build logs
   - Monitor function execution times
   - Review error logs

3. **Update Dependencies:**
   ```bash
   npm outdated
   npm update
   ```

4. **Database Backups:**
   - Most managed PostgreSQL providers auto-backup
   - Verify backup schedule
   - Test restore process

---

## 🆘 Support

If you encounter issues:

1. Check Vercel build logs
2. Check database connection
3. Verify all environment variables
4. Review error logs in Vercel dashboard
5. Check Clerk webhook logs

---

**Last Updated:** [Date]
**Version:** 1.0.0

