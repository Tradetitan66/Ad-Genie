import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';

const steps = [
  'Analyzing preferences',
  'Creating images',
  'Generating UGC ads',
  'Finalizing campaign'
];

export default function GeneratingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      navigate('/login');
      return;
    }

    const stepDuration = 2000;
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, stepDuration);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(stepInterval);
          setTimeout(() => {
            navigate('/dashboard/results');
          }, 500);
          return 100;
        }
        return prev + 1;
      });
    }, 80);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="inline-flex w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] rounded-full items-center justify-center mb-4"
          >
            <Loader2 className="text-white" size={32} />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Generating Your Campaign Assets...
          </h2>
          <p className="text-slate-600">This will only take a few moments</p>
        </div>

        <div className="space-y-4 mb-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="flex items-center gap-3"
            >
              {index < currentStep ? (
                <CheckCircle className="text-[#10B981]" size={24} />
              ) : index === currentStep ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="text-[#2563EB]" size={24} />
                </motion.div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
              )}
              <span className={`${
                index <= currentStep ? 'text-slate-900 font-semibold' : 'text-slate-400'
              }`}>
                {step}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#2563EB] to-[#8B5CF6]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <p className="text-center text-sm text-slate-500">
          Time remaining: {Math.max(0, Math.ceil((100 - progress) * 0.08))} seconds
        </p>
      </motion.div>
    </div>
  );
}
