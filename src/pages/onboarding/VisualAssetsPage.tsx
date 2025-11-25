import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader2 } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, brandProfileService } from '../../services/database';
import { imageService } from '../../services/imageService';
import { useToast } from '../../contexts/ToastContext';

export default function VisualAssetsPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [userId, setUserId] = useState('');
  const [brandProfileId, setBrandProfileId] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [brandColors, setBrandColors] = useState({
    primary: '#2563EB',
    secondary: '',
    accent: ''
  });
  const [dragActive, setDragActive] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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
      
      // Check if user has completed onboarding (edit mode)
      setIsEditMode(user.has_completed_onboarding || false);

      const existingProfile = await brandProfileService.getByUserId(user.id);
      if (existingProfile) {
        setBrandProfileId(existingProfile.id);
        if (existingProfile.logo) {
          setLogo(existingProfile.logo);
        }
        if (existingProfile.product_images && Array.isArray(existingProfile.product_images)) {
          setProductImages(existingProfile.product_images);
        }
        if (existingProfile.brand_colors) {
          setBrandColors({
            primary: existingProfile.brand_colors.primary || '#2563EB',
            secondary: existingProfile.brand_colors.secondary || '',
            accent: existingProfile.brand_colors.accent || ''
          });
        }
      }
    } catch (err) {
      console.error('Error loading visual assets:', err);
      error('Failed to load visual assets');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      error('Logo file size must be less than 5MB');
      return;
    }

    if (!userId) {
      error('User not found');
      return;
    }

    setUploading(true);
    try {
      const url = await imageService.uploadToStorage(userId, file, 'logo', true);
      setLogo(url);
      success('Logo uploaded with background removed!');
    } catch (err) {
      console.error('Error uploading logo:', err);
      error('Failed to upload logo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProductImagesUpload = async (files: FileList) => {
    if (!userId) {
      error('User not found');
      return;
    }

    // Only allow 1 image maximum - if already have 1, show error
    if (productImages.length >= 1) {
      error('Only 1 product image is allowed. Please remove the existing image first.');
      return;
    }

    const filesToProcess: File[] = [];

    for (let i = 0; i < files.length; i++) {
      // Only allow 1 image maximum
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
          // Use Edge Function to remove background and upload to Supabase
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

  const handleDrop = (e: React.DragEvent, type: 'logo' | 'products') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (type === 'logo') {
        handleLogoUpload(e.dataTransfer.files[0]);
      } else {
        handleProductImagesUpload(e.dataTransfer.files);
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!logo) return;

    try {
      await imageService.deleteFromStorage(logo);
      setLogo(null);
      success('Logo removed');
    } catch (err) {
      console.error('Error removing logo:', err);
      setLogo(null);
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

  const handleContinue = async () => {
    // Check if user has completed onboarding (edit mode)
    const currentUserEmail = localStorage.getItem('currentUser');
    let user = null;
    let isEditMode = false;
    
    if (currentUserEmail) {
      try {
        user = await userService.getByEmail(currentUserEmail);
        isEditMode = user?.has_completed_onboarding || false;
      } catch (err) {
        console.error('Error checking user:', err);
      }
    }

    // For new onboarding: require exactly 1 image
    // For edit mode: allow saving with any number of images (including 0)
    if (!isEditMode && productImages.length !== 1) {
      error('Please upload exactly 1 product image to continue');
      return;
    }

    if (!brandProfileId) {
      error('Brand profile not found. Please complete previous steps.');
      return;
    }

    setSaving(true);
    try {
      // Update brand profile with visual assets
      await brandProfileService.update(brandProfileId, {
        logo,
        product_images: productImages,
        brand_colors: brandColors
      });

      // Webhook will be triggered from ReviewPage when user clicks "Generate Campaign Assets"
      // Do NOT trigger webhook here - only save visual assets

      success('Visual assets saved!');
      
      // Navigate based on mode: edit mode goes to preferences (campaign selection), new onboarding continues to preferences
      navigate('/onboarding/preferences');
    } catch (err) {
      console.error('Error saving visual assets:', err);
      error('Failed to save visual assets. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <OnboardingLayout currentStep={4} totalSteps={5} stepLabel="Loading visual assets...">
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
    <OnboardingLayout currentStep={4} totalSteps={5} stepLabel={isEditMode ? "Edit your brand assets" : "Upload your brand assets"}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isEditMode ? 'Edit Your Brand Assets' : 'Upload Your Brand Assets'}
          </h1>
          <p className="text-slate-600">{isEditMode ? 'Update your logo and product images' : 'Add your logo and product images'}</p>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Logo Upload <span className="text-slate-400 text-xs">(Optional)</span>
            </label>
            {!logo ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => handleDrop(e, 'logo')}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  dragActive ? 'border-[#2563EB] bg-blue-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                onClick={() => document.getElementById('logo-input')?.click()}
              >
                <Upload className="mx-auto mb-4 text-slate-400" size={48} />
                <p className="text-slate-600 mb-2">Drag & drop your logo here</p>
                <p className="text-sm text-slate-400 mb-2">or click to browse</p>
                <p className="text-xs text-slate-400">Accepted: PNG, SVG, JPG | Max size: 5MB</p>
                <input
                  id="logo-input"
                  type="file"
                  accept=".png,.svg,.jpg,.jpeg"
                  onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 border border-[#10B981] bg-green-50 rounded-lg">
                <img src={logo} alt="Logo" className="w-24 h-24 object-contain rounded bg-white" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Logo uploaded</p>
                  <p className="text-sm text-slate-600">Click buttons to modify</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRemoveLogo}
                    disabled={uploading}
                    className="px-3 py-2 text-sm bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => document.getElementById('logo-input')?.click()}
                    disabled={uploading}
                    className="px-3 py-2 text-sm bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700"
                  >
                    Replace
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Product Image {!isEditMode && <span className="text-[#EF4444]">*</span>} {isEditMode ? '(Optional)' : '(Required)'}
            </label>
            <p className="text-sm text-slate-500 mb-3">
              {isEditMode 
                ? `${productImages.length} image${productImages.length !== 1 ? 's' : ''} uploaded`
                : productImages.length === 0
                ? 'No image uploaded'
                : '1 image uploaded'
              }
            </p>

            {productImages.length < 1 && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => handleDrop(e, 'products')}
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
              Brand Colors <span className="text-slate-400 text-xs">(Optional)</span>
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-2">Primary</label>
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

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4">
            {isEditMode ? (
              productImages.length === 0 
                ? 'No product image uploaded. You can upload 1 image.'
                : 'Product image uploaded. You can save changes.'
            ) : (
              productImages.length < 1
                ? 'Please upload 1 product image to continue'
                : 'Product image uploaded! You can continue.'
            )}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                if (isEditMode) {
                  navigate('/dashboard/campaign-hub');
                } else {
                  navigate('/onboarding/brand-details');
                }
              }}
              className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all text-slate-700"
            >
              {isEditMode ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={handleContinue}
              disabled={(!isEditMode && productImages.length !== 1) || saving || uploading}
              className="flex-1 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Saving...' : uploading ? 'Processing...' : isEditMode ? 'Save Changes' : 'Continue →'}
            </button>
          </div>
        </div>
      </motion.div>
    </OnboardingLayout>
  );
}
