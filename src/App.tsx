import Navigation from './components/Navigation';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Audience from './components/Audience';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import CursorTrail from './components/CursorTrail';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <CursorTrail />
      <Navigation />
      <Hero />
      <HowItWorks />
      <Features />
      <Audience />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

export default App;
