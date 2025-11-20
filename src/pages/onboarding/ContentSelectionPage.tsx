import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Image, Video, Sparkles } from 'lucide-react';

const contentTypes = [
  {
    id: 'image-only',
    title: 'Image Only',
    subtitle: '6x Image Generations',
    description: 'Product photos & lifestyle shots',
    icon: Image,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'ugc-only',
    title: 'UGC Only',
    subtitle: '3x User-Generated Content Ads',
    description: 'Authentic video style ads',
    icon: Video,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'image-ugc',
    title: 'Images + UGC',
    subtitle: '6x Images + 3x UGC Ads',
    description: 'Complete campaign package',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600',
    recommended: true
  }
];

export default function ContentSelectionPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      navigate('/login');
    }
  }, [navigate]);

  const handleContinue = () => {
    if (!selectedType) return;

    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) return;

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    users[currentUserEmail].contentType = selectedType;
    localStorage.setItem('users', JSON.stringify(users));

    navigate('/onboarding/review');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
              <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-[#2563EB] h-full w-5/6 rounded-full transition-all"></div>
              </div>
              <span className="font-semibold">Step 5 of 6</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Choose Your Content Type
            </h1>
            <p className="text-slate-600">Based on your preferences, we recommend Images + UGC</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {contentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <motion.div
                  key={type.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedType(type.id)}
                  className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
                    selectedType === type.id
                      ? 'border-[#2563EB] bg-blue-50 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300 shadow'
                  }`}
                >
                  {type.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                        RECOMMENDED
                      </span>
                    </div>
                  )}

                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center mb-4 mx-auto`}>
                    <Icon size={32} className="text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 text-center mb-1">
                    {type.title}
                  </h3>
                  <p className="text-sm font-semibold text-slate-600 text-center mb-3">
                    {type.subtitle}
                  </p>
                  <p className="text-sm text-slate-500 text-center">
                    {type.description}
                  </p>

                  {selectedType === type.id && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-[#2563EB] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/onboarding/visual-assets')}
                className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedType}
                className="flex-1 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
