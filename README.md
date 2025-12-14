# Transport Management System

A comprehensive transport management system built with Next.js, TypeScript, and PostgreSQL. Manage trips, shipments, drivers, vehicles, and clients with role-based access control.

## 🚀 Features

- **Role-Based Access Control**: Admin, Driver, and Client portals with distinct permissions
- **Trip Management**: Create, assign, and track trips with status updates
- **Shipment Management**: Request, assign, and track shipments end-to-end
- **Driver Portal**: View trips, update status, and report issues
- **Client Portal**: Request shipments, track deliveries, and view history
- **Admin Dashboard**: Comprehensive management interface with real-time stats
- **Notifications System**: In-app notifications for all important events
- **Image Upload**: Profile pictures and vehicle images via Cloudinary
- **Issue Reporting**: Drivers can report issues during trips
- **Expense Tracking**: Track trip-related expenses

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL (Docker or hosted)
- Clerk account (for authentication)
- Cloudinary account (for image uploads)
- Resend account (for emails - optional)

## 🛠️ Installation

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/transport-management-system.git
cd transport-management-system
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values (see [Environment Variables](#environment-variables) section).

4. **Set up the database:**
```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

5. **Run the development server:**
```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tms_db"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Cloudinary (Image Upload)
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_UPLOAD_PRESET="transport_management_uploads"

# Resend (Email - Optional)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Transport Management System <noreply@yourdomain.com>"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```


## 📁 Project Structure

```
transport-management-system/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js app router pages
│   │   ├── (dashboard)/      # Dashboard routes
│   │   │   ├── admin/        # Admin dashboard
│   │   │   ├── driver/       # Driver portal
│   │   │   ├── client/       # Client portal
│   │   │   └── list/         # List pages (users, trips, etc.)
│   │   └── api/              # API routes
│   ├── components/            # React components
│   │   ├── admin/           # Admin-specific components
│   │   ├── driver/          # Driver-specific components
│   │   ├── client/          # Client-specific components
│   │   └── ui/              # Reusable UI components
│   ├── lib/                  # Utilities and server actions
│   │   └── actions/         # Server actions
│   └── types/               # TypeScript types
├── docs/                     # Documentation
└── scripts/                  # Utility scripts
```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push schema to database
- `npm run prisma:migrate` - Run database migrations
- `npm run backfill:users` - Sync Clerk users to Prisma

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy
```

## 🚢 Deployment

See [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

Quick deployment to Vercel:

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## 📚 Documentation

- [Requirements](docs/REQUIREMENTS.md) - Project requirements and specifications
- [Roadmap](docs/ROADMAP.md) - Development roadmap and milestones
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [QA Testing Checklist](docs/QA_TESTING_CHECKLIST.md) - Pre-launch testing guide
- [GitHub Setup Guide](docs/GITHUB_SETUP_GUIDE.md) - Repository setup instructions

## 🎯 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **UI**: shadcn/ui + Tailwind CSS
- **Image Storage**: Cloudinary
- **Email**: Resend
- **Deployment**: Vercel

## 👥 Roles & Permissions

### Admin
- Full access to all features
- User management
- Trip and shipment management
- Vehicle management
- Issue resolution
- Expense management

### Driver
- View assigned trips
- Update trip status
- Report issues
- View notifications
- View own profile

### Client
- Request shipments
- Track shipments
- View shipment history
- View notifications
- View own profile

## 🔔 Notifications

The system automatically creates notifications for:
- Trip assignments
- Trip status changes
- Shipment updates
- Issue reports and resolutions

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database credentials

### Clerk Authentication Issues
- Verify Clerk keys are correct
- Check webhook secret is set
- Ensure webhook URL is configured in Clerk dashboard

### Image Upload Issues
- Verify `CLOUDINARY_URL` format is correct
- Check Cloudinary credentials
- Ensure upload preset exists

## 📧 HIRE ME 

[mohamedaliatouhami2002@gmail.com]

---

**Built with ❤️ using Next.js and TypeScript**
