# HostelOS Backend Setup Guide

## Prerequisites
- Node.js 16+
- MySQL 8.0+

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=hostel_management

   # JWT
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRES_IN=7d

   # Server
   PORT=5000
   ```

3. **Create the database and tables:**
   ```bash
   mysql -u root -p < schema.sql
   ```

4. **Seed default superadmin account:**
   ```bash
   npm run seed
   ```

   This creates a default superadmin account:
   - **Email:** admin@hostel.com
   - **Password:** Bhanu@2006
   - **Role:** Super Admin

   **Alternative:** Run SQL seed directly:
   ```bash
   mysql -u root -p hostel_management < seed.sql
   ```

## Running the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/register` - Register new admin account
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Example Login Request
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hostel.com",
    "password": "Bhanu@2006"
  }'
```

## Database Schema

The database includes tables for:
- **users** - User accounts (super_admin, admin, student)
- **hostels** - Hostel information
- **rooms** - Room details
- **beds** - Individual beds
- **students** - Student records
- **fees** - Fee management
- **payments** - Payment history
- **announcements** - Announcements
- **complaints** - Student complaints
- **attendance** - Attendance tracking
- **food_menu** - Food menu items

## Troubleshooting

**MySQL Connection Failed:**
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database tables are created: `npm run db:init`

**Port Already in Use:**
- Change `PORT` in `.env`
- Or kill the process: `lsof -ti:5000 | xargs kill -9`

**JWT Errors:**
- Make sure `JWT_SECRET` is set in `.env`
- Token expires after `JWT_EXPIRES_IN` duration (default: 7d)
