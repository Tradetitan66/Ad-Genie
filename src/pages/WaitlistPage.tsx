import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { waitlistService, WaitlistFormData } from '../services/waitlistService';
import { useToast } from '../contexts/ToastContext';

export default function WaitlistPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState<WaitlistFormData>({
    fullName: '',
    mobileNumber: '',
    email: '',
    inspiration: '',
    linkedinProfile: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof WaitlistFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WaitlistFormData, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile Number is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.inspiration.trim()) {
      newErrors.inspiration = 'This field is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await waitlistService.submitWaitlistForm(formData);

      if (result.success) {
        setIsSubmitted(true);
        success('Thank you for joining the waitlist!');
        
        // Redirect to landing page after 2-3 seconds
        setTimeout(() => {
          navigate('/');
        }, 2500);
      } else {
        showError(result.message || 'Failed to submit form. Please try again.');
      }
    } catch (err: any) {
      console.error('Error submitting form:', err);
      showError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof WaitlistFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mb-6"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Thank you for trusting Ad-Genie's magic!
          </h2>
          <p className="text-slate-600 mb-6">
            We'll review your waitlist submission and get back to you.
          </p>
          <div className="flex items-center justify-center gap-2 text-amber-500">
            <Sparkles size={20} />
            <span className="text-sm font-medium">Redirecting you back...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full"
      >
        {/* Minimal Ad-Genie branding */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="text-amber-400" size={20} />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text">
              Ad-Genie
            </h1>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Wish List – Join the Queue</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.fullName ? 'border-red-500' : 'border-slate-300'
              } focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
              placeholder="Enter your full name"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label htmlFor="mobileNumber" className="block text-sm font-medium text-slate-700 mb-2">
              Mobile Number with Country code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="mobileNumber"
              value={formData.mobileNumber}
              onChange={(e) => handleChange('mobileNumber', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.mobileNumber ? 'border-red-500' : 'border-slate-300'
              } focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
              placeholder="+1 234 567 8900"
            />
            {errors.mobileNumber && (
              <p className="mt-1 text-sm text-red-500">{errors.mobileNumber}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.email ? 'border-red-500' : 'border-slate-300'
              } focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Inspiration */}
          <div>
            <label htmlFor="inspiration" className="block text-sm font-medium text-slate-700 mb-2">
              What inspired you to join the Ad-Genie waiting list? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="inspiration"
              value={formData.inspiration}
              onChange={(e) => handleChange('inspiration', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.inspiration ? 'border-red-500' : 'border-slate-300'
              } focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors`}
              placeholder="Tell us what inspired you..."
            />
            {errors.inspiration && (
              <p className="mt-1 text-sm text-red-500">{errors.inspiration}</p>
            )}
          </div>

          {/* LinkedIn Profile */}
          <div>
            <label htmlFor="linkedinProfile" className="block text-sm font-medium text-slate-700 mb-2">
              LinkedIn Profile <span className="text-slate-400 text-xs">(Optional)</span>
            </label>
            <input
              type="url"
              id="linkedinProfile"
              value={formData.linkedinProfile}
              onChange={(e) => handleChange('linkedinProfile', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-4 bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Submitting...</span>
              </>
            ) : (
              'Submit'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

