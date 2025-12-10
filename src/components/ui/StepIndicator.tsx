import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
  showLabel?: boolean;
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  stepLabel,
  showLabel = true,
}: StepIndicatorProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-genie-neutral-200 h-2 rounded-full overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-genie-primary via-genie-secondary to-genie-accent h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                role="progressbar"
                aria-valuenow={currentStep}
                aria-valuemin={0}
                aria-valuemax={totalSteps}
                aria-label={`Step ${currentStep} of ${totalSteps}`}
              />
            </div>
            {showLabel && (
              <span className="text-sm font-semibold text-genie-neutral-600 whitespace-nowrap">
                Step {currentStep} of {totalSteps}
              </span>
            )}
          </div>
        </div>
      </div>
      {stepLabel && (
        <p className="text-sm text-genie-neutral-500 mt-1" aria-live="polite">
          {stepLabel}
        </p>
      )}
    </div>
  );
}

