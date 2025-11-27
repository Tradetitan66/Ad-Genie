# What are Supabase Edge Functions?

## Overview
**Supabase Edge Functions** are serverless functions that run on Deno runtime at the edge (close to your users). They're perfect for:
- Image processing
- API integrations
- Background jobs
- Server-side operations

## Key Features

### 1. **Serverless & Scalable**
- Automatically scales based on demand
- No server management needed
- Pay only for what you use

### 2. **Edge Runtime (Deno)**
- Runs on Deno (modern JavaScript/TypeScript runtime)
- Fast cold starts
- Built-in security features
- TypeScript support out of the box

### 3. **Integrated with Supabase**
- Direct access to your Supabase project
- Can use Supabase Storage, Database, Auth
- Same security model (RLS, service role keys)

### 4. **How It Works**
```
Your App → Calls Edge Function → Function Processes → Returns Result
```

## Your Current Edge Function: `remove-background`

**Location:** `supabase/functions/remove-background/index.ts`

**What it does:**
1. Receives image (base64 or URL)
2. Calls remove.bg API to remove background
3. Returns processed image as base64

**Current Flow:**
```
App → Edge Function → remove.bg API → Returns base64 image
```

**What we need to add:**
```
App → Edge Function → remove.bg API → Save to Supabase Storage → Return public URL
```

## Benefits of Using Edge Functions

### ✅ **Better than n8n Webhook:**
- **Lower latency** - Same infrastructure as your database
- **More secure** - No external webhook exposure
- **Integrated** - Direct access to Supabase Storage
- **Simpler** - One less external dependency

### ✅ **Better than Client-Side Processing:**
- **Server-side** - Keeps API keys secure
- **No client limits** - Can process large images
- **Consistent** - Same processing for all users

## How to Use Edge Functions

### From Your App:
```typescript
const { data, error } = await supabase.functions.invoke('remove-background', {
  body: { imageBase64: base64String }
});

if (data?.imageBase64) {
  // Use processed image
}
```

### Edge Function Structure:
```
supabase/
  functions/
    remove-background/
      index.ts          # Main function code
      deno.json         # Dependencies (optional)
```

## Current Status

✅ **Edge Function is deployed and working!**
- Function exists: `remove-background`
- Can be invoked from your app
- Uses remove.bg API for background removal

⚠️ **What needs improvement:**
- Currently returns base64 (large payload)
- Should save to Supabase Storage and return public URL
- Better error handling needed

## Next Steps

1. **Update Edge Function** to save processed images to Supabase Storage
2. **Update imageService.ts** to use Edge Function instead of n8n webhook
3. **Return public URLs** instead of base64 for better performance













