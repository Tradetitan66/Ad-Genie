import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

export default function ReviewPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState({
    preferences: true,
    brand: true,
    assets: true,
    content: true
  });

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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const handleGenerate = () => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) return;

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    users[currentUserEmail].hasCompletedOnboarding = true;
    localStorage.setItem('users', JSON.stringify(users));

    navigate('/dashboard/generating');
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
              <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-[#2563EB] h-full w-full rounded-full transition-all"></div>
              </div>
              <span className="font-semibold">Step 6 of 6</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Review & Launch Your First Campaign
            </h1>
            <p className="text-slate-600">Almost done! Review your information below</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('preferences')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <h3 className="font-bold text-slate-900">Your Preferences</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/onboarding/preferences');
                    }}
                    className="text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-1 text-sm"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {expandedSections.preferences ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              {expandedSections.preferences && userData.preferences && (
                <div className="p-4 space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-slate-700">Campaign Goal:</span>
                    <p className="text-slate-600 mt-1">{userData.preferences.campaignGoal}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Brand Voice:</span>
                    <span className="ml-2 text-slate-600">{userData.preferences.brandVoice}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Visual Styles:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {userData.preferences.visualStyles.map((style: string) => (
                        <span key={style} className="px-3 py-1 bg-blue-100 text-[#2563EB] rounded-full text-xs">
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Campaign Timing:</span>
                    <span className="ml-2 text-slate-600">{userData.preferences.campaignTiming}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('brand')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <h3 className="font-bold text-slate-900">Brand Details</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/onboarding/brand-details');
                    }}
                    className="text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-1 text-sm"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {expandedSections.brand ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              {expandedSections.brand && userData.brandProfile && (
                <div className="p-4 space-y-3 text-sm">
                  <div><span className="font-semibold text-slate-700">Brand Name:</span> <span className="text-slate-600">{userData.brandProfile.brandName}</span></div>
                  <div><span className="font-semibold text-slate-700">Industry:</span> <span className="text-slate-600">{userData.brandProfile.industry}</span></div>
                  {userData.brandProfile.audience && (
                    <div><span className="font-semibold text-slate-700">Target Audience:</span> <p className="text-slate-600 mt-1">{userData.brandProfile.audience}</p></div>
                  )}
                  <div><span className="font-semibold text-slate-700">Website:</span> <a href={userData.brandProfile.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] ml-2">{userData.brandProfile.websiteUrl}</a></div>
                  <div><span className="font-semibold text-slate-700">Email:</span> <span className="text-slate-600">{userData.brandProfile.contactEmail}</span></div>
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('assets')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <h3 className="font-bold text-slate-900">Visual Assets</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/onboarding/visual-assets');
                    }}
                    className="text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-1 text-sm"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {expandedSections.assets ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              {expandedSections.assets && userData.brandProfile && (
                <div className="p-4 space-y-3">
                  <div>
                    <span className="font-semibold text-slate-700 text-sm">Logo:</span>
                    <img src={userData.brandProfile.logo} alt="Logo" className="w-24 h-24 object-contain mt-2 border rounded" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 text-sm">Product Images ({userData.brandProfile.productImages.length}):</span>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {userData.brandProfile.productImages.map((img: string, i: number) => (
                        <img key={i} src={img} alt={`Product ${i + 1}`} className="w-full h-20 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('content')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <h3 className="font-bold text-slate-900">Content Type</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/onboarding/content-selection');
                    }}
                    className="text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-1 text-sm"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {expandedSections.content ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              {expandedSections.content && (
                <div className="p-4">
                  <p className="text-sm text-slate-600 capitalize">{userData.contentType?.replace('-', ' ')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-slate-700 text-center">
              Estimated delivery: <span className="font-semibold">5-10 minutes</span>
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleGenerate}
              className="flex-1 px-8 py-4 bg-[#2563EB] text-white font-bold rounded-lg shadow-lg hover:bg-[#1d4ed8] transition-all text-lg"
            >
              Generate Campaign Assets
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
