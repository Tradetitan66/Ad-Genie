import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building2, Briefcase, Users, Globe, Upload, X, Target, Mic, RefreshCw, Plus, ChevronDown, ChevronUp, CheckCircle, Image as ImageIcon, Palette } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, brandProfileService, preferencesService } from '../../services/database';
import { imageService } from '../../services/imageService';
import { useToast } from '../../contexts/ToastContext';
import { generateEventSuggestions } from '../../services/openaiService';

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

const brandVoices = ['Professional', 'Casual', 'Playful', 'Authoritative', 'Inspirational'];
const visualStyles = ['Minimalist', 'Bold', 'Elegant', 'Vintage', 'Modern', 'Colorful'];

export default function CombinedBrandAndPreferencesPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [userId, setUserId] = useState('');
  const [brandProfileId, setBrandProfileId] = useState<string | null>(null);
  
  // Brand Information Section
  const [brandData, setBrandData] = useState({
    brandName: '',
    industry: '',
    audience: '',
    websiteUrl: ''
  });
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [customAudience, setCustomAudience] = useState<string>('');
  const [brandErrors, setBrandErrors] = useState({
    brandName: '',
    industry: '',
    websiteUrl: ''
  });

  // Visual Assets Section
  const [productImages, setProductImages] = useState<string[]>([]);
  const [brandColors, setBrandColors] = useState({
    primary: '#2563EB',
    secondary: '',
    accent: ''
  });
  const [dragActive, setDragActive] = useState(false);

  // Campaign Preferences Section
  const [preferencesData, setPreferencesData] = useState({
    campaignGoal: '',
    brandVoice: '',
    visualStyles: [] as string[],
    seasonalEvents: [] as string[],
    enableAutoSuggestions: true
  });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [manualEventInput, setManualEventInput] = useState('');
  const hasLoadedSuggestionsRef = useRef(false);

  // Section collapse/expand state
  const [expandedSections, setExpandedSections] = useState({
    brand: true,
    visual: false,
    preferences: false
  });

  // Define fetchAISuggestions before useEffect that uses it
  const fetchAISuggestions = useCallback(async () => {
    if (!userId) {
      console.log('⚠️ No userId, skipping AI suggestions');
      return;
    }

    console.log('🚀 Starting AI suggestions fetch...');
    setLoadingSuggestions(true);
    setSuggestionError(null);

    try {
      // Use brandData.industry if available, otherwise fetch from database
      let industry = brandData.industry;
      if (!industry) {
        const brandProfile = await brandProfileService.getByUserId(userId);
        if (!brandProfile || !brandProfile.industry) {
          console.log('⚠️ No industry found, skipping AI suggestions');
          setLoadingSuggestions(false);
          hasLoadedSuggestionsRef.current = true;
          return;
        }
        industry = brandProfile.industry;
      }

      console.log('📊 Using industry:', industry);

      const preferences = await preferencesService.getByUserId(userId);
      const marketOptions = ['Local (India)', 'International', 'Global'];
      const market = preferences?.campaign_market || 
        (preferences?.campaign_goal && marketOptions.includes(preferences.campaign_goal)
          ? preferences.campaign_goal
          : 'Local (India)');

      console.log('🌍 Using market:', market);

      let suggestions: string[] = [];
      
      if (market === 'Local (India)') {
        console.log('🇮🇳 Fetching local (India) events...');
        suggestions = await generateEventSuggestions(industry, market, 'local');
      } else if (market === 'International') {
        console.log('🌐 Fetching international events...');
        suggestions = await generateEventSuggestions(industry, market, 'international');
      } else if (market === 'Global') {
        console.log('🌍 Fetching global events...');
        suggestions = await generateEventSuggestions(industry, market, 'global');
      } else {
        console.log('🔄 Using fallback: Local (India)');
        suggestions = await generateEventSuggestions(industry, 'Local (India)', 'local');
      }

      console.log('✅ AI suggestions received:', suggestions.length, 'events');
      setAiSuggestions(suggestions);
      hasLoadedSuggestionsRef.current = true;
    } catch (err: any) {
      console.error('❌ Error fetching AI suggestions:', err);
      setSuggestionError(err.message || 'Failed to load AI suggestions');
      hasLoadedSuggestionsRef.current = true;
    } finally {
      setLoadingSuggestions(false);
    }
  }, [userId, brandData.industry]);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-load AI suggestions when preferences section is expanded and industry is available
  useEffect(() => {
    const shouldLoad = expandedSections.preferences && 
                       userId && 
                       brandData.industry && 
                       !loadingSuggestions && 
                       !hasLoadedSuggestionsRef.current;
    
    if (shouldLoad) {
      console.log('🔄 Auto-loading AI suggestions:', { 
        userId, 
        industry: brandData.industry, 
        expanded: expandedSections.preferences,
        hasLoaded: hasLoadedSuggestionsRef.current
      });
      fetchAISuggestions();
    }
  }, [expandedSections.preferences, userId, brandData.industry, fetchAISuggestions, loadingSuggestions]);

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

      const [brandProfile, preferences] = await Promise.all([
        brandProfileService.getByUserId(user.id),
        preferencesService.getByUserId(user.id)
      ]);

      if (brandProfile) {
        setBrandProfileId(brandProfile.id);
        const audience = brandProfile.audience || '';
        setBrandData({
          brandName: brandProfile.brand_name,
          industry: brandProfile.industry,
          audience: audience,
          websiteUrl: brandProfile.website_url || ''
        });
        
        if (targetAudienceOptions.includes(audience)) {
          setSelectedAudience(audience);
        } else if (audience) {
          setSelectedAudience('Others');
          setCustomAudience(audience);
        }

        if (brandProfile.product_images && Array.isArray(brandProfile.product_images)) {
          setProductImages(brandProfile.product_images);
        }
        if (brandProfile.brand_colors) {
          setBrandColors({
            primary: brandProfile.brand_colors.primary || '#2563EB',
            secondary: brandProfile.brand_colors.secondary || '',
            accent: brandProfile.brand_colors.accent || ''
          });
        }
      }

      if (preferences) {
        const marketOptions = ['Local (India)', 'International', 'Global'];
        const isMarketValue = preferences.campaign_goal && marketOptions.includes(preferences.campaign_goal);
        
        setPreferencesData({
          campaignGoal: isMarketValue ? '' : (preferences.campaign_goal || ''),
          brandVoice: preferences.brand_voice || '',
          visualStyles: preferences.visual_styles || [],
          seasonalEvents: Array.isArray(preferences.seasonal_events)
            ? preferences.seasonal_events
            : (preferences.seasonal_events?.local || preferences.seasonal_events?.international)
              ? [
                  ...(preferences.seasonal_events.local || []),
                  ...(preferences.seasonal_events.international || [])
                ]
              : [],
          enableAutoSuggestions: preferences.enable_auto_suggestions ?? true
        });
      }
    } catch (err) {
      console.error('Error loading data:', err);
      error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: 'brand' | 'visual' | 'preferences') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleProductImagesUpload = async (files: FileList) => {
    if (!userId) {
      error('User not found');
      return;
    }

    if (productImages.length >= 1) {
      error('Only 1 product image is allowed. Please remove the existing image first.');
      return;
    }

    const filesToProcess: File[] = [];
    for (let i = 0; i < files.length; i++) {
      if (productImages.length + filesToProcess.length >= 1) break;
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        error(`File ${file.name} is too large. Max size is 10MB`);
        continue;
      }
      filesToProcess.push(file);
    }

    if (filesToProcess.length === 0) return;

    setUploading(true);
    setProcessingCount(filesToProcess.length);

    try {
      const uploadPromises = filesToProcess.map(async (file) => {
        try {
          const url = await imageService.uploadToStorage(userId, file, 'product', true);
          setProcessingCount(prev => prev - 1);
          return url;
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err);
          setProcessingCount(prev => prev - 1);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url): url is string => url !== null);

      if (successfulUploads.length > 0) {
        setProductImages([...productImages, ...successfulUploads]);
        success(`${successfulUploads.length} image(s) uploaded successfully!`);
      }

      if (results.length !== successfulUploads.length) {
        error(`${results.length - successfulUploads.length} image(s) failed to process`);
      }
    } catch (err) {
      console.error('Error uploading product images:', err);
      error('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
      setProcessingCount(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProductImagesUpload(e.dataTransfer.files);
    }
  };

  const handleRemoveProductImage = async (index: number) => {
    const imageUrl = productImages[index];
    try {
      await imageService.deleteFromStorage(imageUrl);
      setProductImages(productImages.filter((_, i) => i !== index));
      success('Image removed');
    } catch (err) {
      console.error('Error removing image:', err);
      setProductImages(productImages.filter((_, i) => i !== index));
    }
  };

  const handleVisualStyleToggle = (style: string) => {
    if (preferencesData.visualStyles.includes(style)) {
      setPreferencesData({
        ...preferencesData,
        visualStyles: preferencesData.visualStyles.filter(s => s !== style)
      });
    } else if (preferencesData.visualStyles.length < 3) {
      setPreferencesData({
        ...preferencesData,
        visualStyles: [...preferencesData.visualStyles, style]
      });
    }
  };

  const handleSeasonalEventToggle = (event: string) => {
    if (preferencesData.seasonalEvents.includes(event)) {
      setPreferencesData({
        ...preferencesData,
        seasonalEvents: []
      });
    } else {
      setPreferencesData({
        ...preferencesData,
        seasonalEvents: [event]
      });
    }
  };

  const handleAddManualEvent = () => {
    const eventName = manualEventInput.trim();
    if (!eventName) return;

    if (preferencesData.seasonalEvents.includes(eventName)) {
      error('This event is already selected');
      return;
    }

    setPreferencesData({
      ...preferencesData,
      seasonalEvents: [eventName]
    });

    setManualEventInput('');
    success(`Selected "${eventName}"`);
  };

  const handleRemoveEvent = (event: string) => {
    setPreferencesData({
      ...preferencesData,
      seasonalEvents: preferencesData.seasonalEvents.filter(e => e !== event)
    });
  };

  const isSectionComplete = (section: 'brand' | 'visual' | 'preferences') => {
    switch (section) {
      case 'brand':
        return brandData.brandName.trim() !== '' && 
               brandData.industry !== '' && 
               selectedAudience !== '' && 
               (selectedAudience !== 'Others' || customAudience.trim() !== '');
      case 'visual':
        return productImages.length >= 1 && brandColors.primary !== '';
      case 'preferences':
        return preferencesData.campaignGoal.trim() !== '' &&
               preferencesData.brandVoice !== '' &&
               preferencesData.visualStyles.length >= 1 &&
               preferencesData.visualStyles.length <= 3 &&
               preferencesData.seasonalEvents.length >= 1;
      default:
        return false;
    }
  };

  const handleContinue = async () => {
    // Validate all sections
    const newErrors = {
      brandName: '',
      industry: '',
      websiteUrl: ''
    };

    if (!brandData.brandName.trim()) {
      newErrors.brandName = 'Brand name is required';
    }
    if (!brandData.industry) {
      newErrors.industry = 'Please select an industry';
    }
    if (brandData.websiteUrl.trim() && !validateUrl(brandData.websiteUrl)) {
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
    if (productImages.length < 1) {
      error('Please upload at least 1 product image');
      return;
    }
    if (!preferencesData.campaignGoal.trim()) {
      error('Please enter a campaign goal');
      return;
    }
    if (!preferencesData.brandVoice) {
      error('Please select a brand voice');
      return;
    }
    if (preferencesData.visualStyles.length < 1) {
      error('Please select at least 1 visual style');
      return;
    }
    if (preferencesData.seasonalEvents.length < 1) {
      error('Please select at least 1 seasonal event');
      return;
    }

    if (Object.values(newErrors).some(error => error !== '')) {
      setBrandErrors(newErrors);
      return;
    }

    if (!userId) return;

    setSaving(true);
    try {
      const currentUserEmail = localStorage.getItem('currentUser');
      const user = await userService.getByEmail(currentUserEmail || '');
      const contactEmail = user?.email || currentUserEmail || '';

      const finalAudience = selectedAudience === 'Others' ? customAudience.trim() : selectedAudience;

      // Save brand profile
      if (brandProfileId) {
        await brandProfileService.update(brandProfileId, {
          brand_name: brandData.brandName,
          industry: brandData.industry,
          audience: finalAudience,
          website_url: brandData.websiteUrl.trim() || '',
          contact_email: contactEmail,
          product_images: productImages,
          brand_colors: brandColors
        });
      } else {
        const newProfile = await brandProfileService.create({
          user_id: userId,
          brand_name: brandData.brandName,
          industry: brandData.industry,
          audience: finalAudience,
          website_url: brandData.websiteUrl.trim() || '',
          contact_email: contactEmail,
          logo: null,
          product_images: productImages,
          brand_colors: brandColors
        });
        setBrandProfileId(newProfile.id);
      }

      // Save preferences
      const existingPreferences = await preferencesService.getByUserId(userId);
      const contentType = existingPreferences?.content_type || localStorage.getItem('selectedContentType') || null;
      const marketOptions = ['Local (India)', 'International', 'Global'];
      const currentMarket = existingPreferences?.campaign_goal && marketOptions.includes(existingPreferences.campaign_goal)
        ? existingPreferences.campaign_goal
        : null;
      const finalCampaignGoal = preferencesData.campaignGoal.trim() || currentMarket || '';

      await preferencesService.upsert({
        user_id: userId,
        campaign_goal: finalCampaignGoal,
        brand_voice: preferencesData.brandVoice,
        visual_styles: preferencesData.visualStyles,
        campaign_timing: null,
        seasonal_events: preferencesData.seasonalEvents,
        enable_auto_suggestions: preferencesData.enableAutoSuggestions,
        content_type: contentType
      });

      success('All information saved!');
      navigate('/onboarding/review');
    } catch (err) {
      console.error('Error saving data:', err);
      error('Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OnboardingLayout currentStep={3} totalSteps={3} stepLabel="Loading...">
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
    <OnboardingLayout currentStep={3} totalSteps={3} stepLabel="Complete your brand profile">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Complete Your Brand Profile
          </h1>
          <p className="text-slate-600">Fill in all sections to continue</p>
        </div>

        <div className="space-y-4">
          {/* Section 1: Brand Information */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('brand')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 className="text-[#2563EB]" size={20} />
                <h3 className="font-bold text-slate-900">Section 1: Brand Information</h3>
                {isSectionComplete('brand') && <CheckCircle className="text-[#10B981]" size={20} />}
              </div>
              {expandedSections.brand ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.brand && (
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      value={brandData.brandName}
                      onChange={(e) => {
                        setBrandData({ ...brandData, brandName: e.target.value });
                        setBrandErrors({ ...brandErrors, brandName: '' });
                      }}
                      maxLength={100}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                      placeholder="Enter your brand name"
                    />
                  </div>
                  {brandErrors.brandName && (
                    <p className="text-red-500 text-sm mt-1">{brandErrors.brandName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select
                      value={brandData.industry}
                      onChange={(e) => {
                        setBrandData({ ...brandData, industry: e.target.value });
                        setBrandErrors({ ...brandErrors, industry: '' });
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white text-slate-900"
                    >
                      <option value="">Select an industry</option>
                      {industries.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                  {brandErrors.industry && (
                    <p className="text-red-500 text-sm mt-1">{brandErrors.industry}</p>
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
                              setBrandData({ ...brandData, audience: e.target.value });
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
                            setBrandData({ ...brandData, audience: e.target.value });
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
                      value={brandData.websiteUrl}
                      onChange={(e) => {
                        setBrandData({ ...brandData, websiteUrl: e.target.value });
                        setBrandErrors({ ...brandErrors, websiteUrl: '' });
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                      placeholder="https://yourbrand.com"
                    />
                  </div>
                  {brandErrors.websiteUrl && (
                    <p className="text-red-500 text-sm mt-1">{brandErrors.websiteUrl}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Visual Assets */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('visual')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ImageIcon className="text-[#2563EB]" size={20} />
                <h3 className="font-bold text-slate-900">Section 2: Visual Assets</h3>
                {isSectionComplete('visual') && <CheckCircle className="text-[#10B981]" size={20} />}
              </div>
              {expandedSections.visual ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.visual && (
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Product Image <span className="text-[#EF4444]">*</span> <span className="text-slate-600 text-sm">(Required)</span>
                  </label>
                  <p className="text-sm text-slate-500 mb-3">
                    {productImages.length === 0
                      ? 'No image uploaded - 1 image required'
                      : '1 image uploaded'
                    }
                  </p>

                  {productImages.length < 1 && (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer mb-4 transition-all ${
                        dragActive ? 'border-[#2563EB] bg-blue-50' : 'border-slate-300 hover:border-slate-400'
                      }`}
                      onClick={() => document.getElementById('products-input')?.click()}
                    >
                      <Upload className="mx-auto mb-4 text-slate-400" size={40} />
                      <p className="text-slate-600 mb-2">Drag & drop image here or click to browse</p>
                      <p className="text-xs text-slate-400">JPG, PNG | Max 10MB</p>
                      <input
                        id="products-input"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => e.target.files && handleProductImagesUpload(e.target.files)}
                        className="hidden"
                      />
                    </div>
                  )}

                  {uploading && processingCount > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-[#2563EB] animate-spin" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            Uploading {processingCount} image{processingCount > 1 ? 's' : ''}...
                          </p>
                          <p className="text-xs text-slate-600">Removing background & saving</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {productImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {productImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-slate-200"
                          />
                          <button
                            onClick={() => handleRemoveProductImage(index)}
                            disabled={uploading}
                            className="absolute top-2 right-2 p-1 bg-[#EF4444] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Brand Colors <span className="text-slate-400 text-xs">(Primary required)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 mb-2">Primary <span className="text-red-500">*</span></label>
                      <input
                        type="color"
                        value={brandColors.primary}
                        onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                        className="w-full h-12 rounded-lg cursor-pointer border border-slate-300"
                      />
                      <p className="text-xs text-slate-500 mt-1">{brandColors.primary}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-2">Secondary</label>
                      <input
                        type="color"
                        value={brandColors.secondary}
                        onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                        className="w-full h-12 rounded-lg cursor-pointer border border-slate-300"
                      />
                      <p className="text-xs text-slate-500 mt-1">{brandColors.secondary || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-2">Accent</label>
                      <input
                        type="color"
                        value={brandColors.accent}
                        onChange={(e) => setBrandColors({ ...brandColors, accent: e.target.value })}
                        className="w-full h-12 rounded-lg cursor-pointer border border-slate-300"
                      />
                      <p className="text-xs text-slate-500 mt-1">{brandColors.accent || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Campaign Preferences */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('preferences')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Palette className="text-[#2563EB]" size={20} />
                <h3 className="font-bold text-slate-900">Section 3: Campaign Preferences</h3>
                {isSectionComplete('preferences') && <CheckCircle className="text-[#10B981]" size={20} />}
              </div>
              {expandedSections.preferences ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.preferences && (
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Campaign Goal <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-2">What's your main campaign goal?</p>
                  <div className="relative">
                    <Target className="absolute left-3 top-4 text-slate-400" size={20} />
                    <textarea
                      value={preferencesData.campaignGoal}
                      onChange={(e) => setPreferencesData({ ...preferencesData, campaignGoal: e.target.value })}
                      maxLength={300}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
                      placeholder="e.g., Increase brand awareness, drive sales, promote new products"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{preferencesData.campaignGoal.length}/300</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Brand Voice <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mic className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select
                      value={preferencesData.brandVoice}
                      onChange={(e) => setPreferencesData({ ...preferencesData, brandVoice: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white text-slate-900"
                    >
                      <option value="">Select a brand voice</option>
                      {brandVoices.map(voice => (
                        <option key={voice} value={voice}>{voice}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Visual Style <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-3">Select 1-3 styles</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {visualStyles.map(style => (
                      <motion.button
                        key={style}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleVisualStyleToggle(style)}
                        className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          preferencesData.visualStyles.includes(style)
                            ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                            : 'border-slate-300 hover:border-slate-400 text-slate-700 bg-white'
                        }`}
                      >
                        {style}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      Seasonal Interest <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        console.log('🔄 Manual refresh triggered');
                        hasLoadedSuggestionsRef.current = false;
                        setAiSuggestions([]);
                        setSuggestionError(null);
                        await fetchAISuggestions();
                      }}
                      disabled={loadingSuggestions || !userId}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#2563EB] bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      title={!userId ? 'Please complete brand information first' : 'Refresh AI suggestions'}
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                      {loadingSuggestions ? 'Loading...' : 'Refresh Suggestions'}
                    </button>
                  </div>

                  {!brandData.industry && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        ⚠️ Please select an industry in Section 1 (Brand Information) to enable AI suggestions.
                      </p>
                    </div>
                  )}

                  {suggestionError && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        ⚠️ {suggestionError}. You can still add events manually below.
                      </p>
                    </div>
                  )}

                  {loadingSuggestions && aiSuggestions.length === 0 ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-slate-500 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                      <span>Loading AI suggestions based on your industry and market...</span>
                    </div>
                  ) : !loadingSuggestions && aiSuggestions.length === 0 && !suggestionError && hasLoadedSuggestionsRef.current ? (
                    <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-xs text-slate-600">
                        No suggestions available. Please add events manually below or click "Refresh Suggestions" to try again.
                      </p>
                    </div>
                  ) : aiSuggestions.length > 0 ? (
                    <div className="mb-6">
                      <p className="text-xs text-slate-500 mb-3">AI Suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.map(event => (
                          <motion.button
                            key={event}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSeasonalEventToggle(event)}
                            className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                              preferencesData.seasonalEvents.includes(event)
                                ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                                : 'border-slate-300 hover:border-slate-400 text-slate-700 bg-white'
                            }`}
                          >
                            {event}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-500 mb-2">
                      Add Custom Event {preferencesData.seasonalEvents.length >= 1 && <span className="text-red-500">(Event already selected)</span>}:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualEventInput}
                        onChange={(e) => setManualEventInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddManualEvent();
                          }
                        }}
                        placeholder="Enter event name"
                        disabled={preferencesData.seasonalEvents.length >= 1}
                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={handleAddManualEvent}
                        disabled={!manualEventInput.trim() || preferencesData.seasonalEvents.length >= 1}
                        className="px-3 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {preferencesData.seasonalEvents.length === 0 ? 'No event selected' : '1 event selected'}
                    </p>
                  </div>

                  {preferencesData.seasonalEvents.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 mb-2">Selected Events:</p>
                      <div className="flex flex-wrap gap-2">
                        {preferencesData.seasonalEvents.map(event => (
                          <span
                            key={event}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                          >
                            {event}
                            <button
                              type="button"
                              onClick={() => handleRemoveEvent(event)}
                              className="hover:text-blue-900 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <input
                    type="checkbox"
                    id="autoSuggestions"
                    checked={preferencesData.enableAutoSuggestions}
                    onChange={(e) => setPreferencesData({ ...preferencesData, enableAutoSuggestions: e.target.checked })}
                    className="w-5 h-5 text-[#2563EB] focus:ring-[#2563EB] rounded border-slate-300"
                  />
                  <label htmlFor="autoSuggestions" className="text-sm text-slate-700 cursor-pointer">
                    Enable automatic seasonal suggestions
                  </label>
                </div>
              </div>
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
              disabled={saving || uploading || !isSectionComplete('brand') || !isSectionComplete('visual') || !isSectionComplete('preferences')}
              className="flex-1 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Saving...' : uploading ? 'Processing...' : 'Continue →'}
            </button>
          </div>
        </div>
      </motion.div>
    </OnboardingLayout>
  );
}


