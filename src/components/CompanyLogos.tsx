import { motion } from 'framer-motion';
import LogoLoop from './LogoLoop';

const companyLogos = [
  {
    node: <div className="text-2xl font-bold text-slate-700 whitespace-nowrap">Freshworks</div>,
    alt: 'Freshworks',
    title: 'Freshworks'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700 whitespace-nowrap">HubSpot</div>,
    alt: 'HubSpot',
    title: 'HubSpot'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700 whitespace-nowrap">UrbanPiper</div>,
    alt: 'UrbanPiper',
    title: 'UrbanPiper'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700 whitespace-nowrap">Lenskart</div>,
    alt: 'Lenskart',
    title: 'Lenskart'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700 whitespace-nowrap">Notion</div>,
    alt: 'Notion',
    title: 'Notion'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700 whitespace-nowrap">CRED</div>,
    alt: 'CRED',
    title: 'CRED'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700 whitespace-nowrap">Figma</div>,
    alt: 'Figma',
    title: 'Figma'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700 whitespace-nowrap">Zoho</div>,
    alt: 'Zoho',
    title: 'Zoho'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700 whitespace-nowrap">Razorpay</div>,
    alt: 'Razorpay',
    title: 'Razorpay'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700 whitespace-nowrap">Nykaa</div>,
    alt: 'Nykaa',
    title: 'Nykaa'
  }
];

export default function CompanyLogos() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Companies Waiting on Our Early Join List
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Join hundreds of leading brands already in line to revolutionize their ad campaigns with Ad Genie
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative py-8"
          style={{ minHeight: '100px' }}
        >
          <LogoLoop
            logos={companyLogos}
            speed={80}
            direction="left"
            logoHeight={48}
            gap={96}
            hoverSpeed={0}
            scaleOnHover={true}
            fadeOut={true}
            fadeOutColor="rgb(248, 250, 252)"
            ariaLabel="Companies on our early join list"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-slate-500 text-sm">
            Employees from these companies and more are waiting to access Ad Genie
          </p>
        </motion.div>
      </div>
    </section>
  );
}
