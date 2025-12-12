# Ad Genie - Quick Completion Guide

## Overview
This guide provides step-by-step instructions to complete the remaining onboarding and dashboard pages. All the infrastructure is in place - you just need to apply the established patterns.

---

## Pattern #1: Update Onboarding Pages

### Files to Update:
1. `PreferencesPage.tsx`
2. `BrandDetailsPage.tsx`
3. `VisualAssetsPage.tsx`
4. `ContentSelectionPage.tsx`
5. `ReviewPage.tsx`

### Steps for Each File:

#### 1. Add Imports
```typescript
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, preferencesService, brandProfileService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';
```

#### 2. Update State Management
Replace localStorage reads with database calls:

**Before:**
```typescript
const users = JSON.parse(localStorage.getItem('users') || '{}');
const user = users[currentUserEmail];
```

**After:**
```typescript
const { success, error } = useToast();
const [loading, setLoading] = useState(true);

const loadData = async () => {
  try {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) return;

    const user = await userService.getByEmail(currentUserEmail);
    if (user) {
      // Load additional data as needed
      const preferences = await preferencesService.getByUserId(user.id);
      // Set state with loaded data
    }
  } catch (err) {
    error('Failed to load data');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadData();
}, []);
```

#### 3. Update Save Logic
Replace localStorage writes with database calls:

**Before:**
```typescript
const users = JSON.parse(localStorage.getItem('users') || '{}');
users[currentUserEmail].preferences = formData;
localStorage.setItem('users', JSON.stringify(users));
```

**After:**
```typescript
const handleSave = async () => {
  setLoading(true);
  try {
    const currentUserEmail = localStorage.getItem('currentUser');
    const user = await userService.getByEmail(currentUserEmail);

    await preferencesService.upsert({
      user_id: user.id,
      campaign_goal: formData.campaignGoal,
      brand_voice: formData.brandVoice,
      // ... other fields
    });

    success('Saved successfully!');
    navigate('/next-step');
  } catch (err) {
    error('Failed to save. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

#### 4. Wrap with OnboardingLayout
Replace the outer wrapper:

**Before:**
```typescript
return (
  <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
    <div className="max-w-3xl mx-auto">
      <motion.div className="bg-white rounded-lg shadow-lg p-8">
        {/* Progress bar and content */}
      </motion.div>
    </div>
  </div>
);
```

**After:**
```typescript
return (
  <OnboardingLayout
    currentStep={2}
    totalSteps={6}
    stepLabel="Your Preferences"
  >
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      {/* Remove the progress bar - it's in the layout */}
      {/* Keep all your form content */}
    </motion.div>
  </OnboardingLayout>
);
```

#### 5. Add Loading State
```typescript
if (loading) {
  return (
    <OnboardingLayout currentStep={X} totalSteps={6} stepLabel="Loading...">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin" />
      </div>
    </OnboardingLayout>
  );
}
```

---

## Pattern #2: Update Dashboard Pages

### Files to Update:
1. `CampaignHubPage.tsx`
2. `ContentSelectionDashboard.tsx`
3. `GeneratingPage.tsx`
4. `ResultsPage.tsx`

### Steps for Each File:

#### 1. Add Imports
```typescript
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../contexts/ToastContext';
import { userService, brandProfileService, campaignService } from '../../services/database';
```

#### 2. Add Breadcrumbs
```typescript
const breadcrumbs = [
  { label: 'Page Name' }
  // or with navigation:
  // { label: 'Campaigns', href: '/dashboard/campaigns' },
  // { label: 'Details' }
];
```

#### 3. Wrap with DashboardLayout
**Before:**
```typescript
return (
  <div className="min-h-screen bg-[#F9FAFB] py-12 px-4">
    <div className="max-w-7xl mx-auto">
      {/* content */}
    </div>
  </div>
);
```

**After:**
```typescript
return (
  <DashboardLayout breadcrumbs={breadcrumbs}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* content - no need for outer containers */}
    </motion.div>
  </DashboardLayout>
);
```

#### 4. Replace localStorage with Database
Follow same pattern as onboarding pages

#### 5. Add Loading States
```typescript
if (loading) {
  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

---

## Specific Page Instructions

### PreferencesPage.tsx (Onboarding Step 2)
```typescript
// Save preferences
await preferencesService.upsert({
  user_id: user.id,
  campaign_goal: formData.campaignGoal,
  brand_voice: formData.brandVoice,
  visual_styles: formData.visualStyles,
  campaign_timing: formData.campaignTiming,
  seasonal_events: {
    local: formData.seasonalEvents.local,
    international: formData.seasonalEvents.international
  },
  enable_auto_suggestions: formData.enableAutoSuggestions
});
```

### BrandDetailsPage.tsx (Onboarding Step 3)
```typescript
// Save or update brand profile
const brandProfile = await brandProfileService.getByUserId(user.id);
if (brandProfile) {
  await brandProfileService.update(brandProfile.id, {
    brand_name: formData.brandName,
    industry: formData.industry,
    audience: formData.audience,
    website_url: formData.websiteUrl,
    contact_email: formData.contactEmail
  });
} else {
  await brandProfileService.create({
    user_id: user.id,
    brand_name: formData.brandName,
    industry: formData.industry,
    audience: formData.audience,
    website_url: formData.websiteUrl,
    contact_email: formData.contactEmail,
    logo: null,
    product_images: [],
    brand_colors: { primary: '#2563EB' }
  });
}
```

### VisualAssetsPage.tsx (Onboarding Step 4)
```typescript
// Update brand profile with visual assets
const brandProfile = await brandProfileService.getByUserId(user.id);
await brandProfileService.update(brandProfile.id, {
  logo: logo,
  product_images: productImages,
  brand_colors: brandColors
});
```

### ReviewPage.tsx (Onboarding Step 6)
```typescript
// Complete onboarding
await userService.completeOnboarding(currentUserEmail);
// Then navigate to generating page
navigate('/dashboard/generating');
```

### CampaignHubPage.tsx
```typescript
// Load user data with brand profile
const user = await userService.getByEmail(currentUserEmail);
const brandProfile = await brandProfileService.getByUserId(user.id);
const campaigns = await campaignService.getByUserId(user.id);
```

### ContentSelectionDashboard.tsx
```typescript
// Create new campaign
const campaign = await campaignService.create({
  user_id: user.id,
  brand_profile_id: brandProfile.id,
  content_type: selectedType,
  status: 'generating',
  generated_assets: []
});
```

### GeneratingPage.tsx
```typescript
// Update campaign status
useEffect(() => {
  const updateCampaign = async () => {
    if (progress === 100) {
      const campaigns = await campaignService.getByUserId(user.id);
      const latestCampaign = campaigns[0]; // Most recent
      await campaignService.update(latestCampaign.id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    }
  };

  updateCampaign();
}, [progress]);
```

### ResultsPage.tsx
```typescript
// Load campaign results
const user = await userService.getByEmail(currentUserEmail);
const campaigns = await campaignService.getByUserId(user.id);
const latestCampaign = campaigns[0];
// Use latestCampaign.generated_assets for displaying results
```

---

## Testing Checklist

After updating each page, verify:

### Functionality
- [ ] Page loads without errors
- [ ] Data saves to database
- [ ] Navigation works correctly
- [ ] Toast notifications appear
- [ ] Loading states show appropriately
- [ ] Error states handled gracefully

### Accessibility
- [ ] All buttons have labels
- [ ] Form inputs have associated labels
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Progress bar has proper ARIA attributes

### Mobile
- [ ] Layout responsive on mobile
- [ ] Touch targets at least 44x44px
- [ ] Forms usable on mobile
- [ ] Navigation menu works

### Visual
- [ ] Colors match design system
- [ ] Spacing consistent
- [ ] Animations smooth
- [ ] Loading states clear

---

## Quick Commands

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Type Check
```bash
npm run typecheck
```

### Lint Code
```bash
npm run lint
```

---

## Common Patterns Reference

### Error Handling
```typescript
try {
  await someOperation();
  success('Operation successful!');
} catch (err) {
  console.error('Operation failed:', err);
  error('Failed to complete operation. Please try again.');
}
```

### Loading Pattern
```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    // operation
  } finally {
    setLoading(false);
  }
};
```

### Navigation Pattern
```typescript
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();

// Navigate to route
navigate('/dashboard/campaign-hub');

// Navigate with state
navigate('/dashboard/results', { state: { campaignId: id } });
```

---

## File Structure Reference

```
src/
├── components/
│   ├── DashboardLayout.tsx       ✅ Complete
│   ├── OnboardingLayout.tsx      ✅ Complete
│   ├── ProtectedRoute.tsx        ✅ Complete
│   └── [other components]
├── contexts/
│   ├── AuthContext.tsx           ✅ Complete
│   └── ToastContext.tsx          ✅ Complete
├── lib/
│   ├── supabase.ts               ✅ Complete
│   └── utils.ts
├── pages/
│   ├── dashboard/
│   │   ├── CampaignHubPage.tsx          ⚠️ Needs update
│   │   ├── CampaignsPage.tsx            ✅ Complete
│   │   ├── ContentSelectionDashboard.tsx ⚠️ Needs update
│   │   ├── GeneratingPage.tsx           ⚠️ Needs update
│   │   ├── ResultsPage.tsx              ⚠️ Needs update
│   │   └── SettingsPage.tsx             ✅ Complete
│   ├── onboarding/
│   │   ├── BrandDetailsPage.tsx         ⚠️ Needs update
│   │   ├── ContentSelectionPage.tsx     ⚠️ Needs update
│   │   ├── PreferencesPage.tsx          ⚠️ Needs update
│   │   ├── ReviewPage.tsx               ⚠️ Needs update
│   │   ├── VisualAssetsPage.tsx         ⚠️ Needs update
│   │   └── WelcomePage.tsx              ✅ Complete
│   ├── LandingPage.tsx           ✅ Complete
│   └── LoginPage.tsx             ✅ Complete
├── services/
│   └── database.ts               ✅ Complete
└── App.tsx                       ✅ Complete
```

---

## Estimated Time

- **Per onboarding page**: 15-20 minutes
- **Per dashboard page**: 20-25 minutes
- **Total remaining work**: 3-4 hours
- **Testing and polish**: 1-2 hours

**Grand total**: 4-6 hours to complete everything

---

## Support

If you encounter issues:

1. Check the console for errors
2. Verify database connection in Supabase dashboard
3. Check network tab for failed requests
4. Refer to working examples: SettingsPage.tsx, CampaignsPage.tsx, WelcomePage.tsx
5. Follow the patterns exactly as shown in this guide

**The foundation is solid. Just follow the patterns!** 🚀
