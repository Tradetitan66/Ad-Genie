import { Sparkles, Shapes, Video, Calendar, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Sparkles,
    title: 'Cultural Intelligence',
    description: 'Indian festivals, regional aesthetics, local context - not generic Western templates',
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    icon: Shapes,
    title: 'One Upload, Infinite Possibilities',
    description: '4-6 professional variations from a single product photo',
    gradient: 'from-teal-500 to-emerald-500'
  },
  {
    icon: Video,
    title: 'Video & Image Magic',
    description: 'Choose your format - static ads or engaging videos tailored to your audience',
    gradient: 'from-purple-500 to-indigo-500'
  },
  {
    icon: Calendar,
    title: 'Smart Season Detection',
    description: 'Automatically adapts to Diwali, Holi, weddings, or your custom campaigns',
    gradient: 'from-amber-500 to-yellow-500'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Minutes, not weeks. No design skills needed.',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    icon: Languages,
    title: 'Multi-Language Support',
    description: 'Create ads in Hindi, Tamil, Bengali, and 10+ Indian languages - reach every audience',
    gradient: 'from-orange-500 to-red-500'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Why Our Genie Outshines the Rest
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 px-4">Built for India, powered by cutting-edge AI</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative bg-white rounded-xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative">
                <div className={`inline-flex p-2 sm:p-3 rounded-lg bg-gradient-to-br ${feature.gradient} mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="text-white" size={24} style={{ width: '24px', height: '24px' }} />
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">
                  {feature.title}
                </h3>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Sparkles className="text-amber-400" size={20} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
