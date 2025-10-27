import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '1',
    title: 'Upload & Describe',
    image: '/Screenshot 2025-10-26 at 10.32.49.png',
    description: 'Upload your product photo and describe your target audience',
  },
  {
    number: '2',
    title: 'AI Genie Analyzes',
    image: '/Screenshot 2025-10-26 at 10.39.20.png',
    description: 'Our AI understands your product, market, and cultural context',
  },
  {
    number: '3',
    title: 'Campaigns Generated',
    image: '/Screenshot 2025-10-26 at 10.40.09.png',
    description: 'Get professional photos and videos ready to launch',
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            How Ad-Genie Works
          </h2>
          <p className="text-xl text-slate-600">From product photo to perfect campaign in minutes</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 items-start mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="relative overflow-hidden bg-slate-100">
                  <img
                    src={step.image}
                    alt={step.title}
                    className={`w-full ${index === 2 ? 'h-full object-cover' : 'object-contain'} group-hover:scale-105 transition-transform duration-500`}
                  />
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">{step.number}</span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <motion.div
                  className="hidden md:flex absolute top-1/3 -right-4 z-10 items-center justify-center"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (index * 0.15) + 0.5 }}
                >
                  <ArrowRight className="text-amber-500" size={32} strokeWidth={3} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="inline-block bg-gradient-to-r from-teal-50 to-purple-50 rounded-2xl px-8 py-6 shadow-md">
            <p className="text-2xl font-bold text-slate-900">
              Marketing Made Simple -
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 text-transparent bg-clip-text"> Minutes, Not Months</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
