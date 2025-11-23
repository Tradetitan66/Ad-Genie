# Edge Function Setup Guide

## ⚠️ Important: API Key Location

The `REMOVE_BG_API_KEY` must be set in **Supabase Dashboard**, NOT in your local `.env` file!

### Why?
Edge Functions run on Supabase's servers, so they read environment variables from Supabase Dashboard, not from your local `.env` file.

## 📋 Setup Steps

### 1. Get Your remove.bg API Key
- Sign up at https://www.remove.bg/api
- Get your API key from the dashboard

### 2. Set API Key in Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to: **Edge Functions** → **remove-background**
3. Click **Settings** (or **Environment Variables**)
4. Add new variable:
   - **Name:** `REMOVE_BG_API_KEY`
   - **Value:** Your remove.bg API key
5. Save

### 3. Verify Edge Function is Deployed
- Check that `remove-background` function exists
- Status should show as "Active" or "Deployed"

## 🧪 Testing

Once the API key is set, test with:

```bash
node test-edge-function-full.mjs <path-to-image>
```

## ✅ What Works Now

- ✅ Edge Function code is ready
- ✅ Integration in `imageService.ts` is complete
- ✅ Full flow: Edge Function → Storage → Public URL

## ❌ What's Missing

- ⚠️ `REMOVE_BG_API_KEY` needs to be set in Supabase Dashboard
- ⚠️ Need a valid test image (not corrupted)

## 🎯 Next Steps

1. Set `REMOVE_BG_API_KEY` in Supabase Dashboard
2. Provide a valid test image path
3. Run the test script
4. If successful, enable in app!



