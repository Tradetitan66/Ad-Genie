import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="relative py-12 overflow-hidden bg-gradient-to-b from-purple-800 to-purple-950">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-8 py-4 bg-purple-800/50 backdrop-blur-sm rounded-full border border-purple-400/30">
          <Sparkles className="text-amber-400 w-5 h-5" />
          <span className="text-xl font-bold text-white">
            Ad-Genie: Make Your Marketing Wishes Real ✨
          </span>
        </div>
      </div>
    </section>
  );
}
