import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { sendBrandDataToWebhook, parseWebhookResponse, BrandWebhookData } from '../../services/webhookService';
import { campaignService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';
import RotatingText from '../../components/RotatingText';
import { tokenService } from '../../services/tokenService';

const steps = [
  'Analyzing preferences',
  'Creating images',
  'Generating UGC ads',
  'Finalizing campaign'
];

export default function GeneratingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [webhookPayload, setWebhookPayload] = useState<BrandWebhookData | null>(null);
  const webhookCalledRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate webhook calls (React StrictMode runs effects twice in development)
    if (webhookCalledRef.current) {
      console.log('⚠️ Webhook already called, skipping duplicate call');
      return;
    }

    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      navigate('/login');
      return;
    }

    // Get campaign ID and webhook payload from location state
    const state = location.state as { campaignId?: string; webhookPayload?: BrandWebhookData } | null;
    if (!state?.campaignId || !state?.webhookPayload) {
      showError('Missing campaign information. Please try again.');
      navigate('/dashboard/campaign-hub');
      return;
    }

    setCampaignId(state.campaignId);
    setWebhookPayload(state.webhookPayload);

    // Mark webhook as called to prevent duplicate calls
    webhookCalledRef.current = true;

    // Start generation process
    generateCampaign(state.campaignId, state.webhookPayload);
  }, [navigate, location, showError]);

  const generateCampaign = async (campId: string, payload: BrandWebhookData) => {
    try {
      // Simulate progress steps
    const stepDuration = 2000;
      let stepIndex = 0;
    const stepInterval = setInterval(() => {
        setCurrentStep(stepIndex);
        stepIndex++;
        if (stepIndex >= steps.length) {
          clearInterval(stepInterval);
        }
    }, stepDuration);

      // Simulate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; // Stop at 90% until webhook responds
          }
          return prev + 2;
        });
      }, 100);

      // Call webhook
      try {
        const webhookResponse = await sendBrandDataToWebhook(payload);
        
        // Parse images from response
        const images = parseWebhookResponse(webhookResponse);
        
        // Update progress to 100%
        setProgress(100);
          clearInterval(progressInterval);
          clearInterval(stepInterval);
        setCurrentStep(steps.length - 1);

        // Update campaign with generated assets
        await campaignService.update(campId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          generated_assets: {
            webhook_payload: payload,
            images: images,
            webhook_response: webhookResponse,
          },
        });

        // Deduct Magic Tokens for campaign generation
        try {
          const campaignCost = tokenService.calculateCampaignCost(
            payload.content_type || 'image-only',
            { images: images, videos: [] }
          );
          
          // Deduct base cost (2 tokens)
          await tokenService.deductTokens(
            payload.user_id,
            2,
            'campaign_generation',
            campId,
            `Campaign generation (${payload.content_type || 'image-only'})`
          );
          
          // Deduct tokens for each image (1 token per image)
          if (images.length > 0) {
            await tokenService.deductTokens(
              payload.user_id,
              images.length,
              'image',
              campId,
              `${images.length} image(s) generated`
            );
          }
          
          console.log(`✨ Deducted ${campaignCost} Magic Tokens for campaign generation`);
        } catch (tokenError) {
          console.error('Error deducting Magic Tokens:', tokenError);
          // Don't block the flow - test mode allows negative tokens
        }

        // Navigate to results page
          setTimeout(() => {
          navigate('/dashboard/results', {
            state: {
              campaignId: campId,
              images: images,
              webhookPayload: payload,
            },
          });
          }, 500);
      } catch (webhookError: any) {
        clearInterval(progressInterval);
      clearInterval(stepInterval);
        console.error('Webhook error:', webhookError);
        
        // Update campaign status to failed
        try {
          await campaignService.update(campId, {
            status: 'failed',
          });
        } catch (updateError) {
          console.error('Failed to update campaign status:', updateError);
        }

        setError(`Failed to generate campaign: ${webhookError.message}`);
        showError(`Failed to generate campaign: ${webhookError.message}`);
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'An unexpected error occurred');
      showError(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-genie-primary via-genie-secondary to-genie-accent flex items-center justify-center p-4 pt-24">
      <PageHeader />
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
          <div className="mb-2">
            <RotatingText
              texts={[
                'Ad-Genie Making your wish',
                'Ad-Genie Making your wish real',
                'Ad-Genie Making your dreams',
                'Ad-Genie Making your dreams come true',
                'Ad-Genie Creating your vision',
                'Ad-Genie Bringing your ideas to life'
              ]}
              mainClassName="text-2xl font-bold text-slate-900"
              staggerFrom="last"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-120%' }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5"
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </div>
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

        {error ? (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertCircle size={20} />
              <span className="font-semibold">Generation Failed</span>
            </div>
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => {
                if (campaignId && webhookPayload) {
                  setError(null);
                  setProgress(0);
                  setCurrentStep(0);
                  // Reset ref to allow retry
                  webhookCalledRef.current = false;
                  generateCampaign(campaignId, webhookPayload);
                } else {
                  navigate('/dashboard/campaign-hub');
                }
              }}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        ) : (
        <p className="text-center text-sm text-slate-500">
            {progress < 90 
              ? `Time remaining: ${Math.max(0, Math.ceil((100 - progress) * 0.08))} seconds`
              : 'Processing your images...'}
        </p>
        )}
      </motion.div>
    </div>
  );
}
