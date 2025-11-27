# Supabase Admin Access Setup Guide

This guide will help you set up full admin database access using the `service_role` key.

## ⚠️ IMPORTANT SECURITY WARNING

**NEVER expose the `service_role` key in:**
- Frontend code (React, Vue, etc.)
- Public repositories
- Client-side JavaScript
- Browser console

**ONLY use it in:**
- Backend/server-side scripts
- Node.js scripts (like this guide)
- Server-side API endpoints
- Private, secure environments

---

## Step 1: Get Your Service Role Key from Supabase Dashboard

### 1.1 Navigate to Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Log in with your account
3. Select your **AdGenie** project (`aciqulnrrllslassbgox`)

### 1.2 Access Project Settings
1. Click on **Settings** (gear icon) in the left sidebar
2. Click on **API** in the settings menu

### 1.3 Find Service Role Key
1. Scroll down to the **Project API keys** section
2. You'll see two keys:
   - **`anon` `public`** - This is what you're currently using (safe for frontend)
   - **`service_role` `secret`** - This is what you need (admin access)

### 1.4 Copy the Service Role Key
1. Click the **eye icon** or **reveal** button next to `service_role` key
2. **Copy the entire key** (it's a long JWT token starting with `eyJ...`)
3. **Keep it secure** - this key has full database access!

---

## Step 2: Add Service Role Key to .env File

### 2.1 Open Your .env File
Open the `.env` file in your project root.

### 2.2 Add the Service Role Key
Add this line to your `.env` file:

```env
# Supabase Service Role Key (BACKEND ONLY - NEVER USE IN FRONTEND!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-service-role-key-here
```

**Replace** `your-actual-service-role-key-here` with the actual key you copied.

### 2.3 Verify .env File
Your `.env` should now have:
```env
# GitHub Personal Access Token
GITHUB_TOKEN=ghp_...

# Supabase Configuration (Frontend - Safe)
VITE_SUPABASE_URL=https://aciqulnrrllslassbgox.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Management API
SUPABASE_ACCESS_TOKEN=sbp_...

# Supabase Service Role Key (Backend Only - Admin Access)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.4 Update .gitignore (IMPORTANT!)
Make sure your `.gitignore` includes `.env`:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

**Never commit your `.env` file to Git!**

---

## Step 3: Create Admin Script Template

I'll create a safe admin script template for you to use.

---

## Step 4: Test Admin Access

Run the test script to verify admin access works.

---

## Step 5: Common Admin Operations

Examples of what you can do with admin access:
- Query all data (bypass RLS)
- Update any record
- Delete records
- Manage users
- Bulk operations
- Database maintenance

---

## Security Best Practices

1. ✅ **Keep service_role key secret** - Never expose it
2. ✅ **Use only in backend scripts** - Never in frontend
3. ✅ **Rotate keys regularly** - Change keys if compromised
4. ✅ **Use least privilege** - Only use when necessary
5. ✅ **Log admin operations** - Track what you do
6. ✅ **Review RLS policies** - Understand your security setup

---

## Next Steps

After completing these steps, you'll be able to:
- Perform admin database operations
- Bypass RLS when needed
- Manage data directly
- Run maintenance scripts

**Ready to proceed?** Follow the steps above, then we'll create the admin scripts!













