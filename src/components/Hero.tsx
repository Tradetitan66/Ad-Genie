import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, ArrowDown } from 'lucide-react';

export default function Hero() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-purple-950 via-purple-900 to-purple-800">
      {/* Light purple circles pattern background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
        style={{
          backgroundImage: `radial-gradient(circle, rgba(196, 181, 253, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      ></motion.div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-32"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-800/50 backdrop-blur-sm rounded-full border border-purple-400/30 mb-8">
            <Sparkles className="text-amber-400 w-4 h-4" />
            <span className="text-white text-sm font-medium">AI-Powered Ad Creation</span>
            <Sparkles className="text-amber-400 w-4 h-4" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight"
        >
          <span className="text-white">You Don't Need a Designer</span>
          <span className="block bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 text-transparent bg-clip-text">
            When You Have Ad-Genie
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl sm:text-2xl text-white mb-12 max-w-3xl mx-auto"
        >
          Professional ads for India. Ready in minutes. No design skills needed.
        </motion.p>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <motion.a
            href="#how-it-works"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-purple-700 text-white font-bold rounded-full text-lg shadow-lg hover:bg-purple-600 transition-all"
          >
            See the Magic Happen
          </motion.a>
          
          <motion.a
            href="/waitlist"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-full text-lg shadow-2xl hover:shadow-orange-500/50 transition-all"
          >
            Join VIP Waitlist
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-8 py-4 bg-purple-800/50 backdrop-blur-sm rounded-full border border-purple-400/30">
            <Sparkles className="text-amber-400 w-5 h-5" />
            <span className="text-xl font-bold text-white">
              Ad-Genie: Make Your Marketing Wishes Real ✨
            </span>
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
