import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    question: 'Why Ad-Genie?',
    answer: 'Stop explaining your brand over and over. Like a genie who knows its owner, Ad-Genie gets your vision instantly. One upload, one description - done. No iterations, no revisions, just perfect campaigns in minutes.'
  },
  {
    question: 'How does it work so fast?',
    answer: 'Our AI reads your product image and brief like a mind reader. It understands your audience, culture, and goals automatically. Assamese tea for Mumbaikars? Done. Handmade jewelry as luxury gifts? Done. Your wish, instant reality.'
  },
  {
    question: 'Better than agencies?',
    answer: 'Agencies = Weeks + ₹₹₹₹₹\nAd-Genie = Minutes + One simple price\nYou keep creative control. We give you professional ads instantly.'
  },
  {
    question: 'Need marketing skills?',
    answer: 'Nope. Just tell us what you want in plain words. "Introduce my tea to rich Mumbaikars" - that\'s it. Our genie handles the rest.'
  },
  {
    question: 'What if I don\'t like it?',
    answer: 'Rarely happens - our genie nails it first try. But if needed, adjust and regenerate. Your genie serves until you\'re happy.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Questions? We Have Answers
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 px-4">Everything you need to know about Ad-Genie</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-4 py-4 sm:px-8 sm:py-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors duration-200 min-h-[44px]"
              >
                <span className="text-lg sm:text-xl font-bold text-slate-900 pr-4 flex-1">
                  {faq.question}
                </span>
                <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center transition-transform duration-300 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}>
                  {openIndex === index ? (
                    <Minus className="text-white" size={18} style={{ width: '18px', height: '18px' }} />
                  ) : (
                    <Plus className="text-white" size={18} style={{ width: '18px', height: '18px' }} />
                  )}
                </div>
              </button>

              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-4 sm:px-8 sm:pb-6 text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="text-slate-600 mb-4">Still have questions?</p>
          <Link
            to="/waitlist"
            className="inline-flex items-center gap-2 text-amber-600 font-semibold hover:text-amber-700 transition-colors text-sm sm:text-base px-4 py-2 min-h-[44px]"
          >
            Join the waitlist and we'll answer them personally
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
