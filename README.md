# 🚨 Blotter Management System - Backend API

A modern, high-performance REST API for the Blotter Management System built with **Elysia.js**, **Drizzle ORM**, and **Supabase**.

## 📋 Overview

The Blotter Management System Backend API provides a comprehensive solution for managing police blotter records, incident reports, officer assignments, hearings, resolutions, and more. Built with modern TypeScript technologies for optimal performance and developer experience.

### ✨ Key Features

- 🔐 **Authentication & Authorization** - Secure JWT-based auth with role-based access control (Admin, Officer, User)
- 📝 **Report Management** - Complete CRUD operations for incident reports with status tracking
- 👮 **Officer Management** - Officer profiles, assignments, and activity tracking
- 📅 **Hearing Scheduling** - Schedule and manage hearings with notifications
- ⚖️ **Resolution Tracking** - Track case resolutions and outcomes
- 📊 **Dashboard Analytics** - Real-time statistics and insights
- 🔔 **Push Notifications** - Firebase Cloud Messaging (FCM) integration
- 📧 **Email Notifications** - SendGrid integration for email delivery
- 📱 **SMS Notifications** - SMS delivery for critical updates
- 📤 **File Upload** - Cloudinary integration for evidence and document storage
- 🔍 **Investigation Management** - Track investigation progress and updates
- 👥 **Witness & Suspect Management** - Manage persons of interest
- 📜 **Activity Logging** - Comprehensive audit trail
- 🌐 **CORS Support** - Configurable cross-origin resource sharing
- 📚 **API Documentation** - Auto-generated Swagger/OpenAPI docs

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/) - Fast all-in-one JavaScript runtime
- **Framework**: [Elysia.js](https://elysiajs.com/) - Ergonomic web framework with end-to-end type safety
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM with SQL-like syntax
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL) - Open source Firebase alternative
- **Authentication**: Supabase Auth with JWT
- **File Storage**: [Cloudinary](https://cloudinary.com/) - Cloud-based image and video management
- **Email**: [SendGrid](https://sendgrid.com/) - Email delivery service
- **Push Notifications**: [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- **API Docs**: Swagger/OpenAPI

## 📁 Project Structure

```
backend-elysia/
├── src/
│   ├── db/              # Database schema and configuration
│   ├── lib/             # Shared libraries and utilities
│   ├── routes/          # API route handlers
│   │   ├── auth.ts
│   │   ├── admin.ts
│   │   ├── reports.ts
│   │   ├── officers.ts
│   │   ├── hearings.ts
│   │   ├── resolutions.ts
│   │   ├── notifications.ts
│   │   └── ... (18+ route modules)
│   ├── utils/           # Helper functions
│   └── index.ts         # Application entry point
├── config/              # Configuration files
├── migrations/          # Database migrations
├── .env.example         # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0+ installed
- [Supabase](https://supabase.com/) account and project
- [Cloudinary](https://cloudinary.com/) account (for file uploads)
- [SendGrid](https://sendgrid.com/) account (for emails)
- [Firebase](https://firebase.google.com/) project (for push notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JherosjaY/blotter-backend-api.git
   cd blotter-backend-api
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure the following:

   ```env
   # Database
   DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

   # Supabase
   SUPABASE_URL=https://[project-ref].supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Server
   PORT=3000
   NODE_ENV=development

   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # CORS
   ALLOWED_ORIGINS=*

   # SendGrid
   SENDGRID_API_KEY=SG.your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   SENDGRID_FROM_NAME=Blotter Management System

   # Firebase
   FIREBASE_PROJECT_ID=your-firebase-project-id
   ```

4. **Set up the database**
   ```bash
   # Push schema to database
   bun run db:push

   # (Optional) Run migrations
   bun run db:migrate
   ```

5. **Set up admin account**
   ```bash
   # Windows PowerShell
   .\setup-admin.ps1

   # Or manually run
   bun src/db/setup-admin.ts
   ```

### Running the Server

**Development mode** (with auto-reload):
```bash
bun run dev
```

**Production mode**:
```bash
bun run start
```

The server will start at `http://localhost:3000`

### Verify Installation

Visit these endpoints to verify the API is running:

- **Health Check**: http://localhost:3000/health
- **API Info**: http://localhost:3000/
- **Swagger Docs**: http://localhost:3000/swagger

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Available Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| **Authentication** | `/api/auth/*` | Login, register, password reset, email verification |
| **Admin** | `/api/admin/*` | Admin-only operations and management |
| **Admin Officers** | `/api/admin/officers/*` | Officer management by admin |
| **Officer** | `/api/officer/*` | Officer-specific operations |
| **Reports** | `/api/reports/*` | Incident report CRUD operations |
| **Users** | `/api/users/*` | User profile and management |
| **Officers** | `/api/officers/*` | Officer profiles and listings |
| **Witnesses** | `/api/witnesses/*` | Witness management |
| **Suspects** | `/api/suspects/*` | Suspect management |
| **Respondents** | `/api/respondents/*` | Respondent management |
| **Persons** | `/api/persons/*` | General person records |
| **Dashboard** | `/api/dashboard/*` | Statistics and analytics |
| **Evidence** | `/api/evidence/*` | Evidence file management |
| **Hearings** | `/api/hearings/*` | Hearing scheduling and management |
| **Resolutions** | `/api/resolutions/*` | Case resolution tracking |
| **Activity Logs** | `/api/activity-logs/*` | Audit trail and activity history |
| **Notifications** | `/api/notifications/*` | Push and in-app notifications |
| **Investigation** | `/api/investigation/*` | Investigation tracking |
| **SMS** | `/api/sms/*` | SMS notification delivery |
| **Upload** | `/api/upload/*` | File upload to Cloudinary |

### Interactive API Documentation

Full interactive API documentation is available via Swagger UI:

```
http://localhost:3000/swagger
```

## 🗄️ Database Management

### Available Scripts

```bash
# Generate migration files
bun run db:generate

# Run migrations
bun run db:migrate

# Push schema changes to database
bun run db:push

# Open Drizzle Studio (database GUI)
bun run db:studio

# Seed database with sample data
bun run db:seed
```

### Drizzle Studio

Launch the visual database browser:
```bash
bun run db:studio
```

Access at: http://localhost:4983

## 🧪 Testing

Run the API test suite:

```bash
# Windows PowerShell
bun run test

# Or directly
.\test-api.ps1
```

## 🐳 Docker Deployment

### Using Docker Compose

**Development**:
```bash
docker-compose -f docker-compose.dev.yml up
```

**Production**:
```bash
docker-compose up -d
```

### Build Docker Image

```bash
docker build -t blotter-api .
```

## 🌐 Deployment

### Deploy to Render

This project includes a `render.yaml` configuration for easy deployment to [Render](https://render.com/).

1. Push your code to GitHub
2. Connect your repository to Render
3. Configure environment variables in Render dashboard
4. Deploy!

### Environment Variables for Production

Ensure all environment variables are properly configured in your production environment:

- ✅ `DATABASE_URL` - Production database connection string
- ✅ `SUPABASE_URL` - Production Supabase URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep secret!)
- ✅ `JWT_SECRET` - Strong, unique secret for production
- ✅ `ALLOWED_ORIGINS` - Specific origins (not `*`)
- ✅ `SENDGRID_API_KEY` - SendGrid API key
- ✅ `FIREBASE_PROJECT_ID` - Firebase project ID
- ✅ `NODE_ENV=production`

## 🔒 Security Best Practices

- 🔑 Never commit `.env` files to version control
- 🔐 Use strong, unique `JWT_SECRET` in production
- 🌐 Configure `ALLOWED_ORIGINS` to specific domains (not `*`)
- 🔒 Use HTTPS in production
- 🛡️ Keep dependencies updated
- 📝 Implement rate limiting for production
- 🔍 Monitor and log security events

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **JherosjaY** - [GitHub](https://github.com/JherosjaY)

## 🙏 Acknowledgments

- [Elysia.js](https://elysiajs.com/) - Amazing web framework
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe ORM
- [Supabase](https://supabase.com/) - Backend as a Service
- [Bun](https://bun.sh/) - Fast JavaScript runtime

## 📞 Support

For issues, questions, or contributions, please:
- Open an issue on [GitHub](https://github.com/JherosjaY/blotter-backend-api/issues)
- Contact the development team

---

**Made with ❤️ for efficient blotter management**
