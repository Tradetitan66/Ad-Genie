import { motion } from 'framer-motion';
import LogoLoop from './LogoLoop';

const companyLogos = [
  {
    node: <div className="text-2xl font-bold text-slate-700">Google</div>,
    alt: 'Google',
    title: 'Google'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Microsoft</div>,
    alt: 'Microsoft',
    title: 'Microsoft'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Apple</div>,
    alt: 'Apple',
    title: 'Apple'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Amazon</div>,
    alt: 'Amazon',
    title: 'Amazon'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Meta</div>,
    alt: 'Meta',
    title: 'Meta'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Netflix</div>,
    alt: 'Netflix',
    title: 'Netflix'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Tesla</div>,
    alt: 'Tesla',
    title: 'Tesla'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Spotify</div>,
    alt: 'Spotify',
    title: 'Spotify'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Airbnb</div>,
    alt: 'Airbnb',
    title: 'Airbnb'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Uber</div>,
    alt: 'Uber',
    title: 'Uber'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Stripe</div>,
    alt: 'Stripe',
    title: 'Stripe'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Shopify</div>,
    alt: 'Shopify',
    title: 'Shopify'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Adobe</div>,
    alt: 'Adobe',
    title: 'Adobe'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Salesforce</div>,
    alt: 'Salesforce',
    title: 'Salesforce'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Nike</div>,
    alt: 'Nike',
    title: 'Nike'
  },
  {
    node: <div className="text-2xl font-bold text-slate-700">Coca-Cola</div>,
    alt: 'Coca-Cola',
    title: 'Coca-Cola'
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
            gap={64}
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
