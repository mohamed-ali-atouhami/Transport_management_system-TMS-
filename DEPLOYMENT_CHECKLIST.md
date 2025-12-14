# 🚀 Deployment Checklist

Quick checklist for deploying to Vercel + Supabase.

## Pre-Deployment
- [ ] Code committed and pushed to GitHub
- [ ] All features tested locally
- [ ] Environment variables documented

## Step 1: Supabase Setup
- [ ] Created Supabase account
- [ ] Created new project
- [ ] Copied **Connection pooling** URL (not direct connection)
- [ ] Saved connection string securely

## Step 2: Database Migration
- [ ] Ran `npx prisma db push` or `npx prisma migrate dev`
- [ ] Verified tables created in Supabase dashboard
- [ ] Generated Prisma client: `npx prisma generate`

## Step 3: Vercel Setup
- [ ] Created Vercel account
- [ ] Imported GitHub repository
- [ ] Verified Next.js auto-detection

## Step 4: Environment Variables
Add these in Vercel → Settings → Environment Variables:

- [ ] `DATABASE_URL` = Supabase connection pooling URL
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_...` (production)
- [ ] `CLERK_SECRET_KEY` = `sk_live_...` (production)
- [ ] `CLERK_WEBHOOK_SECRET` = `whsec_...` (add after webhook setup)
- [ ] `CLOUDINARY_URL` = `cloudinary://api_key:api_secret@cloud_name`
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = your cloud name
- [ ] `CLOUDINARY_UPLOAD_PRESET` = `transport_management_uploads`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app` (update after first deploy)

## Step 5: First Deployment
- [ ] Clicked "Deploy" in Vercel
- [ ] Build completed successfully
- [ ] Got app URL: `https://your-app.vercel.app`
- [ ] Updated `NEXT_PUBLIC_APP_URL` with actual URL
- [ ] Redeployed after updating URL

## Step 6: Clerk Webhook
- [ ] Switched Clerk to Production environment
- [ ] Created webhook endpoint: `https://your-app.vercel.app/api/webhook/clerk`
- [ ] Subscribed to events: `user.created`, `user.updated`, `user.deleted`
- [ ] Copied webhook signing secret (`whsec_...`)
- [ ] Added `CLERK_WEBHOOK_SECRET` to Vercel environment variables
- [ ] Tested webhook in Clerk dashboard
- [ ] Redeployed app

## Step 7: Cloudinary Setup
- [ ] Created upload preset: `transport_management_uploads`
- [ ] Set preset to "Signed" mode
- [ ] Verified Cloudinary credentials are correct

## Step 8: Testing
- [ ] Can sign up/sign in
- [ ] Database connection works (can create/view data)
- [ ] Image upload works (profile, vehicle)
- [ ] Notifications appear
- [ ] Role-based access works (admin/driver/client)
- [ ] No errors in Vercel logs

## Step 9: (Optional) Custom Domain
- [ ] Added domain in Vercel
- [ ] Configured DNS records
- [ ] Updated `NEXT_PUBLIC_APP_URL`
- [ ] Updated Clerk webhook URL
- [ ] SSL certificate active

## ✅ Deployment Complete!
- [ ] App is live and accessible
- [ ] All features working
- [ ] Monitoring set up (Vercel Analytics)

---

**Need help?** See `docs/DEPLOYMENT_STEP_BY_STEP.md` for detailed instructions.

