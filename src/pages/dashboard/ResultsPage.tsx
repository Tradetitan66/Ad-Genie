import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Download, Share2, Home, RefreshCw, CheckCircle } from 'lucide-react';

export default function ResultsPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [campaignType, setCampaignType] = useState<string>('');

  useEffect(() => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      navigate('/login');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[currentUserEmail];
    setUserData(user);

    if (user.campaigns && user.campaigns.length > 0) {
      const latestCampaign = user.campaigns[user.campaigns.length - 1];
      setCampaignType(latestCampaign.contentType);
    }
  }, [navigate]);

  const getOutputCount = () => {
    switch (campaignType) {
      case 'image-only':
        return { images: 6, videos: 0 };
      case 'ugc-only':
        return { images: 0, videos: 3 };
      case 'image-ugc':
        return { images: 6, videos: 3 };
      default:
        return { images: 6, videos: 3 };
    }
  };

  const { images, videos } = getOutputCount();

  const mockImages = Array(images).fill(null).map((_, i) => ({
    id: `img-${i}`,
    url: 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg',
    title: `Product Image ${i + 1}`
  }));

  const mockVideos = Array(videos).fill(null).map((_, i) => ({
    id: `vid-${i}`,
    thumbnail: 'https://images.pexels.com/photos/4439444/pexels-photo-4439444.jpeg',
    title: `UGC Video ${i + 1}`
  }));

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#10B981] bg-opacity-20 border border-[#10B981] rounded-full mb-6"
          >
            <CheckCircle className="text-[#10B981]" size={24} />
            <span className="text-[#10B981] font-semibold">Campaign Generated Successfully!</span>
          </motion.div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Your Campaign is Ready
          </h1>
          <p className="text-xl text-slate-600">
            Download your assets and launch your campaign
          </p>
        </motion.div>

        {images > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-slate-900">Product Images ({images})</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-[#2563EB] text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-[#1d4ed8]"
              >
                <Download size={20} />
                Download All Images
              </motion.button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {mockImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group relative bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                >
                  <div className="aspect-square bg-slate-200">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-white rounded-full shadow-lg"
                      >
                        <Download size={20} className="text-slate-900" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-white rounded-full shadow-lg"
                      >
                        <Share2 size={20} className="text-slate-900" />
                      </motion.button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-slate-900">{image.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {videos > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-slate-900">UGC Videos ({videos})</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-[#8B5CF6] text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-[#7c3aed]"
              >
                <Download size={20} />
                Download All Videos
              </motion.button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="group relative bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                >
                  <div className="aspect-video bg-slate-200 relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[20px] border-l-slate-900 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-white rounded-full shadow-lg"
                      >
                        <Download size={20} className="text-slate-900" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-white rounded-full shadow-lg"
                      >
                        <Share2 size={20} className="text-slate-900" />
                      </motion.button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-slate-900">{video.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/campaign-hub')}
            className="px-8 py-4 bg-[#2563EB] text-white font-bold rounded-lg shadow-lg flex items-center gap-3 hover:bg-[#1d4ed8]"
          >
            <RefreshCw size={20} />
            Create New Campaign
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-white text-slate-700 font-bold rounded-lg shadow-lg border-2 border-slate-300 flex items-center gap-3 hover:bg-slate-50"
          >
            <Home size={20} />
            Back to Home
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
