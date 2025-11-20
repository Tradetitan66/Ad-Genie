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

export default function ContentSelectionDashboard() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>('');
  const [useExistingPreferences, setUseExistingPreferences] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      navigate('/login');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[currentUserEmail];
    setUserData(user);
  }, [navigate]);

  const handleGenerate = () => {
    if (!selectedType) return;

    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) return;

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const newCampaign = {
      campaignId: Date.now().toString(),
      contentType: selectedType,
      status: 'generating',
      createdAt: new Date().toISOString(),
      assets: {}
    };

    if (!users[currentUserEmail].campaigns) {
      users[currentUserEmail].campaigns = [];
    }
    users[currentUserEmail].campaigns.push(newCampaign);
    localStorage.setItem('users', JSON.stringify(users));

    navigate('/dashboard/generating');
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <div className="mb-8">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                {userData.brandProfile?.logo && (
                  <img src={userData.brandProfile.logo} alt="Logo" className="w-10 h-10 object-contain rounded" />
                )}
                <div>
                  <p className="font-bold text-slate-900">{userData.brandProfile?.brandName}</p>
                  <p className="text-sm text-slate-600">{userData.brandProfile?.industry}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/campaign-hub')}
                className="text-[#2563EB] hover:text-[#1d4ed8] text-sm font-semibold"
              >
                Change Profile
              </button>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Choose Your Content Type
            </h1>
            <p className="text-slate-600">Select the campaign format for this project</p>
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

          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useExistingPreferences}
                onChange={(e) => setUseExistingPreferences(e.target.checked)}
                className="w-5 h-5 text-[#2563EB]"
              />
              <span className="text-slate-700">Use existing seasonal preferences</span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/dashboard/campaign-hub')}
              className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedType}
              className="flex-1 px-8 py-4 bg-[#2563EB] text-white font-bold rounded-lg shadow-lg hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
            >
              Generate Campaign
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
