# GitHub Setup Guide

Follow these steps to push your Transport Management System to GitHub.

## Step 1: Create a .gitignore File (If Not Already Present)

Make sure you have a `.gitignore` file that excludes sensitive files and dependencies:

```gitignore
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/
/build
.next
.vercel

# Production
/dist

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env*.local
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Prisma
prisma/migrations/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
Thumbs.db
```

## Step 2: Create a GitHub Repository

1. **Go to GitHub**: https://github.com
2. **Click the "+" icon** in the top right corner
3. **Select "New repository"**
4. **Fill in the details**:
   - **Repository name**: `transport-management-system` (or your preferred name)
   - **Description**: "Transport Management System - MVP for managing trips, shipments, drivers, and clients"
   - **Visibility**: Choose **Private** (recommended) or **Public**
   - **DO NOT** initialize with README, .gitignore, or license (you already have these)
5. **Click "Create repository"**

## Step 3: Prepare Your Local Repository

### 3.1. Check Current Status
```bash
git status
```

### 3.2. Add All Files
```bash
git add .
```

### 3.3. Commit Your Changes
```bash
git commit -m "Initial commit: Transport Management System MVP

- Complete user authentication with Clerk
- Admin panels for users, vehicles, trips, shipments, expenses
- Driver portal with trip management and issue reporting
- Client portal with shipment requests and tracking
- Image upload with Cloudinary
- Issue reporting system
- Role-based access control
- Modern UI with shadcn/ui components"
```

## Step 4: Connect to GitHub Repository

### 4.1. Add Remote Repository
Replace `YOUR_USERNAME` with your GitHub username and `YOUR_REPO_NAME` with your repository name:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Example:**
```bash
git remote add origin https://github.com/johndoe/transport-management-system.git
```

### 4.2. Verify Remote
```bash
git remote -v
```

You should see:
```
origin  https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git (fetch)
origin  https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git (push)
```

## Step 5: Push to GitHub

### 5.1. Push to Main Branch
```bash
git branch -M main
git push -u origin main
```

**Note:** If you're already on `master` branch and want to keep it:
```bash
git push -u origin master
```

### 5.2. Enter Credentials
- If prompted, enter your GitHub username
- For password, use a **Personal Access Token** (not your GitHub password)
  - Go to: https://github.com/settings/tokens
  - Generate new token (classic)
  - Select scopes: `repo` (full control)
  - Copy the token and use it as your password

## Step 6: Verify Upload

1. **Refresh your GitHub repository page**
2. **Check that all files are uploaded**
3. **Verify the commit message appears**

## Step 7: Create a README.md (Optional but Recommended)

Create a `README.md` file in your project root:

```markdown
# Transport Management System

A comprehensive transport management system built with Next.js, TypeScript, Prisma, and Clerk.

## Features

- 🔐 User Authentication & Role-Based Access Control (Admin, Driver, Client)
- 👥 User Management (CRUD operations)
- 🚛 Vehicle Management
- 🗺️ Trip Management with Smart Suggestions
- 📦 Shipment Management
- 💰 Expense Tracking
- 🚨 Issue Reporting System
- 📸 Image Upload (Cloudinary)
- 📊 Dashboard Analytics
- 🔔 Notifications System (In Progress)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **UI**: shadcn/ui + Tailwind CSS
- **Image Storage**: Cloudinary
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL (Docker or hosted)
- Clerk account
- Cloudinary account (for image uploads)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/transport-management-system.git
cd transport-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/tms_db"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_key"
CLERK_SECRET_KEY="your_clerk_secret"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_UPLOAD_PRESET="your_preset_name"
```

5. Set up the database:
```bash
npx prisma db push
npx prisma generate
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
transport-management-system/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js app router pages
│   ├── components/            # React components
│   │   ├── admin/            # Admin-specific components
│   │   ├── driver/           # Driver-specific components
│   │   └── client/           # Client-specific components
│   ├── lib/                   # Utilities and server actions
│   └── types/                 # TypeScript types
└── docs/                      # Documentation
```

## Documentation

- [Roadmap](./docs/ROADMAP.md) - Development roadmap and milestones
- [Requirements](./docs/REQUIREMENTS.md) - System requirements
- [Testing Guide](./docs/ISSUE_REPORTING_TESTING_GUIDE.md) - Testing procedures

## Current Status

- ✅ Milestone 0-6: Complete
- 🔄 Milestone 7: Notifications & Emails (In Progress)
- ⏳ Milestone 8: MVP Polish & Launch Prep

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]
```

Then commit and push:
```bash
git add README.md
git commit -m "Add README.md"
git push
```

## Troubleshooting

### Issue: "remote origin already exists"
**Solution:**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Issue: "Authentication failed"
**Solution:**
- Use Personal Access Token instead of password
- Generate token at: https://github.com/settings/tokens

### Issue: "Large file upload fails"
**Solution:**
- Check `.gitignore` excludes `node_modules/`
- Use Git LFS for large files if needed

### Issue: "Branch name mismatch"
**Solution:**
```bash
# If GitHub uses 'main' but you're on 'master'
git branch -M main
git push -u origin main
```

## Next Steps After Pushing

1. **Set up branch protection** (Settings → Branches)
2. **Add collaborators** (Settings → Collaborators)
3. **Enable GitHub Actions** (if using CI/CD)
4. **Set up Vercel deployment** (connect GitHub repo)
5. **Add environment variables** in Vercel dashboard

---

**You're all set!** Your code is now on GitHub. 🎉

