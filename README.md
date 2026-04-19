# 🏨 HostelOS - Premium SaaS Hostel Management System

HostelOS is a modern, production-ready, multi-tenant SaaS application specifically built for Hostel and PG owners. It streamlines hostel operations, student tracking, room mapping, fee collection, and complaint management via a pristine, Stripe-level premium interface.

## ✨ Features

- **Multi-Tenant Architecture:** Built with Supabase Row Level Security (RLS) offering strict boundary isolation between hostels.
- **Strict Role-Based Access Control (RBAC):** Super Admin, Admin (Hostel Owner), and Student roles perfectly isolated using React Router structural guards. 
- **Serverless Admin Operations:** Edge Functions securely power elevated operations like user creation without exposing Service Role Keys strictly mitigating risk. 
- **Premium Interface:** Redesigned utilizing an aesthetics-forward Tailwind CSS theme mapping inspired by industry leaders like Stripe and Linear.
- **Comprehensive Functionalities:** 
  - Centralized Dashboard Analytics
  - Students & Rooms/Beds Management 
  - Dynamic Custom Food Menus 
  - Complaints & Ticket System
  - Fee Generation & Billing Receipts

---

## 🚀 Quick Setup & Deployment

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Supabase Local Development**
   Boot up the local Supabase container to test everything securely offline:
   ```bash
   npx supabase start
   ```

3. **Required Environment Variables (`.env.local`)**
   Make sure to point the vars to your local or remote deployed Supabase instance:
   ```env
   VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
   VITE_SUPABASE_ANON_KEY="YOUR_API_KEY"
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

---

## 🔒 Deploying Edge Functions (Mandatory)

The system relies on a secure Supabase Edge Function (`admin-operations`) to create Hostel Owner and Student authentication credentials.

**If you encounter the "Server connection failed" error during Student or Hostel creation, it means the Edge Function is not deployed.**

Deploy the function to your remote project using the Supabase CLI:

1. **Login to your Supabase account:**
   ```bash
   npx supabase login
   ```
2. **Deploy the specific Edge Function:**
   ```bash
   npx supabase functions deploy admin-operations
   ```
3. **Configure the Service Role Key Secret** (Replace `<your_service_role_key>` with the physical key from your dashboard):
   ```bash
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
   ```

---

## 🛠 Project Structure

- `src/` - Core source structure.
  - `admin/` - Portal components tailored for Hostel Owners.
  - `student/` - End-user portal for the hostel's students.
  - `super-admin/` - Global SaaS management application (requires super-admin role).
  - `components/` - Global reusable UI components.
  - `lib/` - API, Authentication, route guards, and utility libraries.
  - `types/` - Application-wide TypeScript interfaces.
- `supabase/` - Contains the `admin-operations` edge function and configuration bounds.

## 🤝 Contributing

Ensure code adheres to the defined `.eslintrc.cjs` constraints and always execute `npm run build` before pushing to guarantee zero type errors.

*Crafted with precision for next-generation Hostel Management.*
