# How to Find Service Role Key in Supabase Dashboard

## Step-by-Step Instructions

### Current Location
You're on the **Settings** page. You can see "API Keys" in the PROJECT SETTINGS section.

### Steps to Find Service Role Key

1. **Click on "API Keys"** 
   - It's in the PROJECT SETTINGS section
   - Located between "Data API" and "JWT Keys"

2. **On the API Keys page, you'll see:**
   - **Project API keys** section
   - Two keys will be displayed:
     - `anon` `public` - This is your current frontend key (safe to expose)
     - `service_role` `secret` - This is what you need (admin key)

3. **To reveal the service_role key:**
   - Look for an **eye icon** 👁️ or **"Reveal"** button next to `service_role`
   - Click it to show the full key
   - The key will be a long JWT token starting with `eyJ...`

4. **Copy the entire key**
   - Select and copy the whole token
   - It's very long (hundreds of characters)

### Visual Guide

```
Settings Page
├── PROJECT SETTINGS
│   ├── General
│   ├── Compute and Disk
│   ├── Infrastructure
│   ├── Integrations
│   ├── Data API
│   ├── **API Keys** ← CLICK HERE!
│   ├── JWT Keys
│   └── ...
```

### After Clicking "API Keys"

You'll see a page with:

```
Project API keys

┌─────────────────────────────────────┐
│ anon         public                  │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
│ [Copy] [Reveal]                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ service_role  secret                 │
│ 👁️ [Reveal] ← Click this!            │
│ After clicking:                      │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
│ [Copy]                               │
└─────────────────────────────────────┘
```

### Important Notes

- The `service_role` key is marked as **"secret"** - this means it has admin access
- It's hidden by default for security
- You need to click "Reveal" to see it
- Copy the entire key (it's very long)

### Alternative: If You Don't See "API Keys"

If "API Keys" is not visible:
1. Make sure you're the project owner/admin
2. Try refreshing the page
3. Check if you have the correct permissions
4. The key might be under "JWT Keys" section instead

---

## Next Step

After you find and copy the service_role key:
1. Add it to your `.env` file as: `SUPABASE_SERVICE_ROLE_KEY=your_key_here`
2. Run: `node test-admin-access.mjs` to verify it works





















