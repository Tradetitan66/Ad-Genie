import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, brandProfileService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';

const industries = [
  'E-commerce', 'Fashion & Apparel', 'Technology & Software', 'Food & Beverage',
  'Health & Wellness', 'Finance & Banking', 'Real Estate', 'Education & E-learning',
  'Entertainment & Media', 'Beauty & Cosmetics', 'Travel & Hospitality', 'Automotive',
  'Home & Garden', 'Sports & Fitness', 'Other'
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
    websiteUrl: '',
    contactEmail: ''
  });
  const [errors, setErrors] = useState({
    brandName: '',
    industry: '',
    websiteUrl: '',
    contactEmail: ''
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
        setFormData({
          brandName: existingProfile.brand_name,
          industry: existingProfile.industry,
          audience: existingProfile.audience || '',
          websiteUrl: existingProfile.website_url,
          contactEmail: existingProfile.contact_email
        });
      } else {
        setFormData(prev => ({
          ...prev,
          contactEmail: user.email || currentUserEmail
        }));
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

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleContinue = async () => {
    const newErrors = {
      brandName: '',
      industry: '',
      websiteUrl: '',
      contactEmail: ''
    };

    if (!formData.brandName.trim()) {
      newErrors.brandName = 'Brand name is required';
    }

    if (!formData.industry) {
      newErrors.industry = 'Please select an industry';
    }

    if (!formData.websiteUrl.trim()) {
      newErrors.websiteUrl = 'Website URL is required';
    } else if (!validateUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!validateEmail(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email';
    }

    if (Object.values(newErrors).some(error => error !== '')) {
      setErrors(newErrors);
      return;
    }

    if (!userId) return;

    setSaving(true);
    try {
      if (brandProfileId) {
        await brandProfileService.update(brandProfileId, {
          brand_name: formData.brandName,
          industry: formData.industry,
          audience: formData.audience,
          website_url: formData.websiteUrl,
          contact_email: formData.contactEmail
        });
      } else {
        await brandProfileService.create({
          user_id: userId,
          brand_name: formData.brandName,
          industry: formData.industry,
          audience: formData.audience,
          website_url: formData.websiteUrl,
          contact_email: formData.contactEmail
        });
      }

      success('Brand details saved!');
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
      <OnboardingLayout currentStep={3} totalSteps={6} stepLabel="Loading brand details...">
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
    <OnboardingLayout currentStep={3} totalSteps={6} stepLabel="Tell us about your brand">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Tell Us About Your Brand
          </h1>
        </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Brand Name <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => {
                  setFormData({ ...formData, brandName: e.target.value });
                  setErrors({ ...errors, brandName: '' });
                }}
                maxLength={100}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.brandName ? 'border-[#EF4444]' : 'border-slate-300'
                } focus:outline-none focus:border-[#2563EB] transition-colors`}
                placeholder="Enter your brand name"
              />
              {errors.brandName && (
                <p className="text-[#EF4444] text-sm mt-1">{errors.brandName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Industry <span className="text-[#EF4444]">*</span>
              </label>
              <select
                value={formData.industry}
                onChange={(e) => {
                  setFormData({ ...formData, industry: e.target.value });
                  setErrors({ ...errors, industry: '' });
                }}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.industry ? 'border-[#EF4444]' : 'border-slate-300'
                } focus:outline-none focus:border-[#2563EB] transition-colors`}
              >
                <option value="">Select an industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              {errors.industry && (
                <p className="text-[#EF4444] text-sm mt-1">{errors.industry}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Target Audience (Optional)
              </label>
              <textarea
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:border-[#2563EB] transition-colors"
                placeholder="e.g., Young professionals aged 25-35, health-conscious consumers"
              />
              <p className="text-xs text-slate-400 mt-1">{formData.audience.length}/200</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Website URL <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => {
                  setFormData({ ...formData, websiteUrl: e.target.value });
                  setErrors({ ...errors, websiteUrl: '' });
                }}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.websiteUrl ? 'border-[#EF4444]' : 'border-slate-300'
                } focus:outline-none focus:border-[#2563EB] transition-colors`}
                placeholder="https://yourbrand.com"
              />
              {errors.websiteUrl && (
                <p className="text-[#EF4444] text-sm mt-1">{errors.websiteUrl}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Contact Email <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => {
                  setFormData({ ...formData, contactEmail: e.target.value });
                  setErrors({ ...errors, contactEmail: '' });
                }}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.contactEmail ? 'border-[#EF4444]' : 'border-slate-300'
                } focus:outline-none focus:border-[#2563EB] transition-colors`}
                placeholder="contact@yourbrand.com"
              />
              {errors.contactEmail && (
                <p className="text-[#EF4444] text-sm mt-1">{errors.contactEmail}</p>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/onboarding/preferences')}
                className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all"
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
