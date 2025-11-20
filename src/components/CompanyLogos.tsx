import { motion } from 'framer-motion';
import LogoLoop from './LogoLoop';

const companyLogos = [
  {
    src: 'https://logo.clearbit.com/google.com',
    alt: 'Google',
    title: 'Google'
  },
  {
    src: 'https://logo.clearbit.com/microsoft.com',
    alt: 'Microsoft',
    title: 'Microsoft'
  },
  {
    src: 'https://logo.clearbit.com/apple.com',
    alt: 'Apple',
    title: 'Apple'
  },
  {
    src: 'https://logo.clearbit.com/amazon.com',
    alt: 'Amazon',
    title: 'Amazon'
  },
  {
    src: 'https://logo.clearbit.com/meta.com',
    alt: 'Meta',
    title: 'Meta'
  },
  {
    src: 'https://logo.clearbit.com/netflix.com',
    alt: 'Netflix',
    title: 'Netflix'
  },
  {
    src: 'https://logo.clearbit.com/tesla.com',
    alt: 'Tesla',
    title: 'Tesla'
  },
  {
    src: 'https://logo.clearbit.com/spotify.com',
    alt: 'Spotify',
    title: 'Spotify'
  },
  {
    src: 'https://logo.clearbit.com/airbnb.com',
    alt: 'Airbnb',
    title: 'Airbnb'
  },
  {
    src: 'https://logo.clearbit.com/uber.com',
    alt: 'Uber',
    title: 'Uber'
  },
  {
    src: 'https://logo.clearbit.com/stripe.com',
    alt: 'Stripe',
    title: 'Stripe'
  },
  {
    src: 'https://logo.clearbit.com/shopify.com',
    alt: 'Shopify',
    title: 'Shopify'
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
          style={{ minHeight: '80px' }}
        >
          <LogoLoop
            logos={companyLogos}
            speed={50}
            direction="left"
            logoHeight={50}
            gap={80}
            pauseOnHover={true}
            fadeOut={true}
            fadeOutColor="rgb(248, 250, 252)"
            scaleOnHover={true}
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
