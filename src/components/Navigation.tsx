import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-900/95 backdrop-blur-lg shadow-2xl' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <motion.div
            className="relative group cursor-pointer flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>

            <div className="relative flex items-center gap-3">
              <motion.div
                className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 shadow-lg bg-white flex-shrink-0"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(251, 191, 36, 0.3)',
                    '0 0 40px rgba(251, 191, 36, 0.6)',
                    '0 0 20px rgba(251, 191, 36, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <img
                  src="/design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_w4ujab7xhe2kyd0v0ohh_1-removebg-preview.png"
                  alt="Ad-Genie"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </motion.div>

              <motion.div
                className="absolute -top-1 left-12"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="text-amber-400" size={16} />
              </motion.div>

              <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-transparent bg-clip-text">
                Ad-Genie
              </span>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white hover:text-amber-400 transition-colors font-medium">
              Features
            </a>
            <a href="#how-it-works" className="text-white hover:text-amber-400 transition-colors font-medium">
              How It Works
            </a>
            <a href="#faq" className="text-white hover:text-amber-400 transition-colors font-medium">
              FAQ
            </a>
            <motion.a
              href="https://n8n.srv1004168.hstgr.cloud/form/b61ef1a4-2c13-473f-8508-37a60678189c"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full shadow-lg hover:shadow-amber-500/50 transition-shadow"
            >
              Join Waitlist
            </motion.a>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
