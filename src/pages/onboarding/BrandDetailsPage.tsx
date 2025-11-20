import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const industries = [
  'E-commerce', 'Fashion & Apparel', 'Technology & Software', 'Food & Beverage',
  'Health & Wellness', 'Finance & Banking', 'Real Estate', 'Education & E-learning',
  'Entertainment & Media', 'Beauty & Cosmetics', 'Travel & Hospitality', 'Automotive',
  'Home & Garden', 'Sports & Fitness', 'Other'
];

export default function BrandDetailsPage() {
  const navigate = useNavigate();
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
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      navigate('/login');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[currentUserEmail];
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactEmail: user.email
      }));
    }
  }, [navigate]);

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

  const handleContinue = () => {
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

    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) return;

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users[currentUserEmail].brandProfile) {
      users[currentUserEmail].brandProfile = {};
    }
    users[currentUserEmail].brandProfile = {
      ...users[currentUserEmail].brandProfile,
      ...formData
    };
    localStorage.setItem('users', JSON.stringify(users));

    navigate('/onboarding/visual-assets');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
              <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-[#2563EB] h-full w-3/6 rounded-full transition-all"></div>
              </div>
              <span className="font-semibold">Step 3 of 6</span>
            </div>
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
                className="flex-1 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] transition-all"
              >
                Continue →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
