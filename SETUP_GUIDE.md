# 🏨 HostelOS - Premium SaaS Hostel Management System

HostelOS is a modern, production-ready, multi-tenant SaaS application specifically built for Hostel and PG owners. It streamlines hostel operations, student tracking, room mapping, fee collection, and complaint management via a pristine, Stripe-level premium interface.

## ✨ Features

- **Multi-Tenant Architecture:** Secure isolation between hostels with strict authorization checks
- **Strict Role-Based Access Control (RBAC):** Super Admin, Admin (Hostel Owner), and Student roles with React Router structural guards
- **Premium Interface:** Modern Tailwind CSS design inspired by Stripe and Linear
- **Comprehensive Functionalities:**
  - Centralized Dashboard Analytics
  - Students & Rooms/Beds Management
  - Dynamic Custom Food Menus
  - Complaints & Ticket System
  - Fee Generation & Billing Receipts
  - Attendance Tracking
  - Announcements

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lorklup
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

### Database Setup

1. **Create MySQL database and tables**
   ```bash
   cd backend
   mysql -u root -p < schema.sql
   ```

2. **Create `.env` file in the backend directory**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=hostel_management
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRES_IN=7d
   PORT=5000
   ```

3. **Seed default superadmin account**
   ```bash
   npm run seed
   ```

   This creates:
   - **Email:** `admin@hostel.com`
   - **Password:** `Bhanu@2006`
   - **Role:** Super Admin

   Alternatively, run SQL seed directly:
   ```bash
   mysql -u root -p hostel_management < seed.sql
   ```

### Running the Application

**Terminal 1 - Backend Server**
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend Dev Server**
```bash
npm run dev
# Frontend runs on http://localhost:5175
```

### Access the Application

1. Open browser: `http://localhost:5175`
2. Login with default superadmin credentials:
   - Email: `admin@hostel.com`
   - Password: `Bhanu@2006`

---

## 📁 Project Structure

```
lorklup/
├── src/                          # Frontend (React + TypeScript)
│   ├── admin/                    # Admin dashboard
│   ├── student/                  # Student portal
│   ├── super-admin/              # Superadmin panel
│   ├── auth/                     # Authentication pages
│   ├── pages/                    # Page components
│   ├── components/               # Reusable components
│   ├── lib/                      # Utilities & APIs
│   └── types/                    # TypeScript types
│
├── backend/                      # Backend (Node.js + Express)
│   ├── controllers/              # Route handlers
│   ├── routes/                   # API routes
│   ├── middleware/               # Express middleware
│   ├── config/                   # Database configuration
│   ├── schema.sql                # Database schema
│   ├── seed.js                   # Seed script
│   ├── server.js                 # Main server file
│   └── package.json
│
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite config
└── tailwind.config.js            # Tailwind CSS config
```

---

## 🔐 Default Superadmin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@hostel.com` |
| Password | `Bhanu@2006` |
| Role | Superadmin |

**⚠️ Important:** Change these credentials in production!

---

## 📚 Available Scripts

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend
```bash
cd backend
npm start        # Start server
npm run dev      # Start with auto-reload
npm run seed     # Seed default superadmin
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register admin account
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Admin Operations
- `GET /api/admin/hostels` - List hostels
- `POST /api/admin/hostels` - Create hostel
- `GET /api/admin/students` - List students
- `GET /api/admin/rooms` - List rooms

---

## 🎨 Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Data fetching
- **Lucide Icons** - Icons
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime
- **Express 5** - Web framework
- **MySQL 8** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **dotenv** - Environment variables

---

## 👤 User Roles

1. **Superadmin** - Platform administrator
   - Manage hostels and hostel owners
   - Monitor system-wide analytics
   - Handle subscriptions

2. **Admin** - Hostel owner
   - Manage their hostel operations
   - Manage students and rooms
   - Generate fees and track payments
   - Post announcements

3. **Student** - Hostel resident
   - View room assignments
   - Check fees and payment status
   - Submit complaints
   - View announcements

---

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts (super_admin, admin, student)
- **hostels** - Hostel information
- **rooms** - Room details
- **beds** - Individual beds
- **students** - Student records

### Operations Tables
- **fees** - Fee management
- **payments** - Payment tracking
- **announcements** - Announcements
- **complaints** - Complaint tickets
- **attendance** - Attendance tracking
- **food_menu** - Food menu items

---

## 🐛 Troubleshooting

### MySQL Connection Failed
```bash
# Check if MySQL is running
sudo service mysql status

# Start MySQL if stopped
sudo service mysql start
```

### Port Already in Use
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env: PORT=5001
```

### Frontend won't connect to backend
- Verify backend is running on `http://localhost:5000`
- Check `VITE_API_URL` in frontend `.env`
- Check CORS settings in `backend/server.js`

---

## 📝 License

ISC - See LICENSE file for details

---

## 🤝 Support

For issues and questions, please open a GitHub issue or contact the development team.

**Happy hosting! 🎉**
