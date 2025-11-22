import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, LogOut } from 'lucide-react';
import { userService } from '../../services/database';

export default function CampaignHubPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [navigate]);

  const loadUser = async () => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      navigate('/login');
      return;
    }

    try {
      const user = await userService.getByEmail(currentUserEmail);
      if (user) {
        setUserData({
          email: user.email,
          displayName: user.display_name || 'User',
        });
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user'); // Also clear AuthContext user
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Welcome back, {userData.displayName}! 👋
            </h1>
            <p className="text-xl text-slate-600">
              Ready to create your next campaign?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg shadow-lg p-8 cursor-pointer"
              onClick={() => navigate('/dashboard/content-selection')}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    Use Existing Brand Profile
                  </h2>
                  {userData.brandProfile && (
                    <div className="mt-4">
                      <div className="flex items-center gap-3">
                        {userData.brandProfile.logo && (
                          <img
                            src={userData.brandProfile.logo}
                            alt="Logo"
                            className="w-12 h-12 object-contain rounded border"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">
                            {userData.brandProfile.brandName}
                          </p>
                          <p className="text-sm text-slate-500">
                            {userData.brandProfile.industry}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Last used: {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-slate-600 mb-6">
                Use your saved preferences
              </p>
              <button className="w-full px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1d4ed8] transition-all">
                Continue with {userData.brandProfile?.brandName} →
              </button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg shadow-lg p-8 cursor-pointer"
              onClick={() => navigate('/onboarding/preferences')}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#10B981] to-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    Start Fresh Campaign
                  </h2>
                </div>
              </div>
              <p className="text-slate-600 mb-6">
                New brand or different direction
              </p>
              <button className="w-full px-6 py-3 bg-white text-[#2563EB] font-semibold rounded-lg border-2 border-[#2563EB] hover:bg-blue-50 transition-all">
                Set Up New Campaign
              </button>
            </motion.div>
          </div>

          <div className="text-center space-y-3">
            <button
              onClick={() => navigate('/onboarding/brand-details')}
              className="text-[#2563EB] hover:text-[#1d4ed8] font-medium"
            >
              Edit Brand Profile
            </button>
            <span className="mx-4 text-slate-300">•</span>
            <button
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
