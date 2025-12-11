import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building2, Briefcase, Users, Globe } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, brandProfileService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';

const industries = [
  'E-commerce', 'Fashion & Apparel', 'Technology & Software', 'Food & Beverage',
  'Health & Wellness', 'Finance & Banking', 'Real Estate', 'Education & E-learning',
  'Entertainment & Media', 'Beauty & Cosmetics', 'Travel & Hospitality', 'Automotive',
  'Home & Garden', 'Sports & Fitness', 'Other'
];

const targetAudienceOptions = [
  'Young Professionals (25-35)',
  'Health-Conscious Consumers',
  'Tech Enthusiasts',
  'Small Business Owners',
  'Students',
  'Parents/Families',
  'Seniors (55+)',
  'Others'
];

export default function BrandDetailsPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [brandProfileId, setBrandProfileId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    brandName: '',
    industry: '',
    audience: '',
    websiteUrl: ''
  });
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [customAudience, setCustomAudience] = useState<string>('');
  const [errors, setErrors] = useState({
    brandName: '',
    industry: '',
    websiteUrl: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUserEmail = localStorage.getItem('currentUser');
      if (!currentUserEmail) {
        navigate('/login');
        return;
      }

      const user = await userService.getByEmail(currentUserEmail);
      if (!user) {
        navigate('/login');
        return;
      }

      setUserId(user.id);

      const existingProfile = await brandProfileService.getByUserId(user.id);
      if (existingProfile) {
        setBrandProfileId(existingProfile.id);
        const audience = existingProfile.audience || '';
        setFormData({
          brandName: existingProfile.brand_name,
          industry: existingProfile.industry,
          audience: audience,
          websiteUrl: existingProfile.website_url
        });
        
        // Check if audience is one of the predefined options
        if (targetAudienceOptions.includes(audience)) {
          setSelectedAudience(audience);
        } else if (audience) {
          // It's a custom audience
          setSelectedAudience('Others');
          setCustomAudience(audience);
        }
      }
    } catch (err) {
      console.error('Error loading brand details:', err);
      error('Failed to load brand details');
    } finally {
      setLoading(false);
    }
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleContinue = async () => {
    const newErrors = {
      brandName: '',
      industry: '',
      websiteUrl: ''
    };

    if (!formData.brandName.trim()) {
      newErrors.brandName = 'Brand name is required';
    }

    if (!formData.industry) {
      newErrors.industry = 'Please select an industry';
    }

    if (formData.websiteUrl.trim() && !validateUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL';
    }

    if (!selectedAudience) {
      error('Please select a target audience');
      return;
    }

    if (selectedAudience === 'Others' && !customAudience.trim()) {
      error('Please enter your target audience');
      return;
    }

    if (Object.values(newErrors).some(error => error !== '')) {
      setErrors(newErrors);
      return;
    }

    if (!userId) return;

    setSaving(true);
    try {
      // Get user email for contact_email (required by database)
      const currentUserEmail = localStorage.getItem('currentUser');
      const user = await userService.getByEmail(currentUserEmail || '');
      const contactEmail = user?.email || currentUserEmail || '';

      // Determine the final audience value
      const finalAudience = selectedAudience === 'Others' ? customAudience.trim() : (selectedAudience || formData.audience);

      if (brandProfileId) {
        await brandProfileService.update(brandProfileId, {
          brand_name: formData.brandName,
          industry: formData.industry,
          audience: finalAudience,
          website_url: formData.websiteUrl.trim() || '',
          contact_email: contactEmail
        });
      } else {
        await brandProfileService.create({
          user_id: userId,
          brand_name: formData.brandName,
          industry: formData.industry,
          audience: finalAudience,
          website_url: formData.websiteUrl.trim() || '',
          contact_email: contactEmail,
          logo: null,
          product_images: [],
          brand_colors: {}
        });
      }

      // In edit mode, visual assets page will navigate to preferences after saving
      navigate('/onboarding/visual-assets');
    } catch (err) {
      console.error('Error saving brand details:', err);
      error('Failed to save brand details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OnboardingLayout currentStep={3} totalSteps={5} stepLabel="Loading brand details...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout currentStep={3} totalSteps={5} stepLabel="Tell us about your brand">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Tell Us About Your Brand
          </h1>
          <p className="text-slate-600">Help us understand your business</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => {
                  setFormData({ ...formData, brandName: e.target.value });
                  setErrors({ ...errors, brandName: '' });
                }}
                maxLength={100}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder="Enter your brand name"
              />
            </div>
            {errors.brandName && (
              <p className="text-red-500 text-sm mt-1">{errors.brandName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Industry <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <select
                value={formData.industry}
                onChange={(e) => {
                  setFormData({ ...formData, industry: e.target.value });
                  setErrors({ ...errors, industry: '' });
                }}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white text-slate-900"
              >
                <option value="">Select an industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            {errors.industry && (
              <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Target Audience <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">Who is your target audience for this campaign?</p>
            <div className="space-y-2 mb-3">
              {targetAudienceOptions.map(audience => (
                <label key={audience} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="audience"
                    value={audience}
                    checked={selectedAudience === audience}
                    onChange={(e) => {
                      setSelectedAudience(e.target.value);
                      if (e.target.value !== 'Others') {
                        setCustomAudience('');
                        setFormData({ ...formData, audience: e.target.value });
                      }
                    }}
                    className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span className="text-slate-700 font-medium">{audience}</span>
                </label>
              ))}
            </div>
            
            {selectedAudience === 'Others' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
            <div className="relative">
              <Users className="absolute left-3 top-4 text-slate-400" size={20} />
              <textarea
                    value={customAudience}
                    onChange={(e) => {
                      setCustomAudience(e.target.value);
                      setFormData({ ...formData, audience: e.target.value });
                    }}
                maxLength={200}
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
                placeholder="e.g., Young professionals aged 25-35, health-conscious consumers"
              />
            </div>
                <p className="text-xs text-slate-500 mt-1">{customAudience.length}/200</p>
              </motion.div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => {
                  setFormData({ ...formData, websiteUrl: e.target.value });
                  setErrors({ ...errors, websiteUrl: '' });
                }}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder="https://yourbrand.com"
              />
            </div>
            {errors.websiteUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.websiteUrl}</p>
            )}
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/onboarding/content-selection')}
              className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all text-slate-700"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        </div>
      </motion.div>
    </OnboardingLayout>
  );
}
