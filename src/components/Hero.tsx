import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, ArrowDown } from 'lucide-react';

export default function Hero() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-900 via-purple-900 to-slate-900">
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0c8.284 0 15 6.716 15 15 0 8.284-6.716 15-15 15-8.284 0-15-6.716-15-15C15 6.716 21.716 0 30 0zm0 2C22.82 2 17 7.82 17 15s5.82 13 13 13 13-5.82 13-13S37.18 2 30 2z' fill='%23F59E0B' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      ></motion.div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
            <Sparkles className="text-amber-400 w-5 h-5" />
            <span className="text-white font-medium">AI-Powered Ad Creation</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight"
        >
          Create Stunning Ads in
          <span className="block bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-transparent bg-clip-text">
            Minutes, Not Hours
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl sm:text-2xl text-slate-200 mb-12 max-w-3xl mx-auto"
        >
          Transform your marketing with AI-generated ads tailored for the Indian market. 
          No design skills needed.
        </motion.p>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.a
            href="/login"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-full text-lg shadow-2xl hover:shadow-orange-500/50 transition-all"
          >
            Start Creating Free
          </motion.a>
          
          <motion.a
            href="#how-it-works"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold rounded-full text-lg hover:bg-white/20 transition-all"
          >
            See How It Works
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400/20 to-orange-500/20 backdrop-blur-sm rounded-full border border-amber-400/30">
            <Sparkles className="text-amber-400 w-6 h-6" />
            <span className="text-2xl font-bold text-white">
              Ad-Genie: Make Your Marketing Wishes Real
            </span>
            <Sparkles className="text-amber-400 w-6 h-6" />
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <a href="#how-it-works" className="text-white/60 hover:text-white transition-colors">
          <ArrowDown size={32} />
        </a>
      </motion.div>
    </section>
  );
}
