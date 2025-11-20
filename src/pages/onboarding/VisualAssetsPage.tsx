import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader2 } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, brandProfileService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';

export default function VisualAssetsPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleLogoUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be less than 5MB');
      return;
    }

    const base64 = await handleFileToBase64(file);
    setLogo(base64);
  };

  const handleProductImagesUpload = async (files: FileList) => {
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      if (productImages.length + newImages.length >= 6) break;

      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is 10MB`);
        continue;
      }

      const base64 = await handleFileToBase64(file);
      newImages.push(base64);
    }

    setProductImages([...productImages, ...newImages]);
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

  const handleContinue = async () => {
    if (!brandProfileId) {
      error('Brand profile not found. Please complete previous steps.');
      return;
    }

    setSaving(true);
    try {
      await brandProfileService.update(brandProfileId, {
        logo,
        product_images: productImages,
        brand_colors: brandColors
      });

      success('Visual assets saved!');
      navigate('/onboarding/content-selection');
    } catch (err) {
      console.error('Error saving visual assets:', err);
      error('Failed to save visual assets. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!brandProfileId) {
      navigate('/onboarding/content-selection');
      return;
    }

    setSaving(true);
    try {
      await brandProfileService.update(brandProfileId, {
        logo: null,
        product_images: [],
        brand_colors: brandColors
      });

      navigate('/onboarding/content-selection');
    } catch (err) {
      console.error('Error skipping visual assets:', err);
      navigate('/onboarding/content-selection');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OnboardingLayout currentStep={4} totalSteps={6} stepLabel="Loading visual assets...">
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
    <OnboardingLayout currentStep={4} totalSteps={6} stepLabel="Upload your brand assets">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Upload Your Brand Assets
          </h1>
        </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Logo Upload <span className="text-[#EF4444]">*</span>
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
                  <img src={logo} alt="Logo" className="w-24 h-24 object-contain rounded" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Logo uploaded</p>
                    <p className="text-sm text-slate-600">Click buttons to modify</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLogo(null)}
                      className="px-3 py-2 text-sm bg-white border border-slate-300 rounded hover:bg-slate-50"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => document.getElementById('logo-input')?.click()}
                      className="px-3 py-2 text-sm bg-white border border-slate-300 rounded hover:bg-slate-50"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Product Images <span className="text-[#EF4444]">*</span> (4-6 required)
              </label>
              <p className="text-sm text-slate-500 mb-3">{productImages.length} of 6 images uploaded</p>

              {productImages.length < 6 && (
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
                  <p className="text-slate-600 mb-2">Drag & drop images here or click to browse</p>
                  <p className="text-xs text-slate-400">Upload multiple images at once | JPG, PNG | Max 10MB per file</p>
                  <input
                    id="products-input"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    multiple
                    onChange={(e) => e.target.files && handleProductImagesUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
              )}

              {productImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {productImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setProductImages(productImages.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 p-1 bg-[#EF4444] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                Brand Colors (Optional)
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Primary</label>
                  <input
                    type="color"
                    value={brandColors.primary}
                    onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                    className="w-full h-12 rounded-lg cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-1">{brandColors.primary}</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Secondary</label>
                  <input
                    type="color"
                    value={brandColors.secondary}
                    onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                    className="w-full h-12 rounded-lg cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-1">{brandColors.secondary || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Accent</label>
                  <input
                    type="color"
                    value={brandColors.accent}
                    onChange={(e) => setBrandColors({ ...brandColors, accent: e.target.value })}
                    className="w-full h-12 rounded-lg cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-1">{brandColors.accent || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-4">
              {!logo || productImages.length < 4
                ? 'Upload assets now or skip and add them later from your dashboard'
                : 'All required assets uploaded! You can continue.'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/onboarding/brand-details')}
                className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              {(!logo || productImages.length < 4) && (
                <button
                  onClick={handleSkip}
                  disabled={saving}
                  className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-600"
                >
                  Skip for Now
                </button>
              )}
              <button
                onClick={handleContinue}
                disabled={(!logo && productImages.length === 0) || saving}
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
