import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService } from '../../services/database';

export default function WelcomePage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      navigate('/login');
      return;
    }

    try {
      const user = await userService.getByEmail(currentUserEmail);
      if (user) {
        setUserName(user.display_name || 'there');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  return (
    <OnboardingLayout currentStep={1} totalSteps={3} stepLabel="Welcome to Ad Genie">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >

          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-slate-900 mb-4"
            >
              Welcome to Ad Genie, {userName}! 👋
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-slate-600"
            >
              Let's set up your campaign in just a few minutes
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 mb-12"
          >
            {[
              'Choose content type and target market',
              'Complete your brand profile and preferences',
              'Review and generate your campaign'
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="text-[#10B981]" size={24} />
                <span className="text-lg text-slate-700">{item}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center mb-8"
          >
            <p className="text-slate-600">Estimated time: 5-7 minutes</p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/onboarding/content-selection')}
            className="w-full px-8 py-4 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] transition-all text-lg"
          >
            Let's Get Started →
          </motion.button>
        </motion.div>
    </OnboardingLayout>
  );
}
