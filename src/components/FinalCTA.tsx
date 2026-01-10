import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-purple-900 to-slate-900"></div>

      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <Sparkles className="inline-block text-amber-400 animate-pulse" size={48} />
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-4">
          Ready to Make Your Marketing Wishes Come True?
        </h2>

        <p className="text-base sm:text-lg md:text-xl text-teal-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
          Be among the first to experience Ad-Genie magic
        </p>

        <Link
          to="/waitlist"
          className="group relative inline-flex items-center gap-2 sm:gap-3 px-6 py-3 sm:px-10 sm:py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-base sm:text-lg md:text-xl rounded-full shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 hover:scale-110 min-h-[44px] sm:min-h-[56px]"
        >
          <span className="relative z-10 flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline">Join Waitlist - Ad-Genie Magic</span>
            <span className="sm:hidden">Join Waitlist</span>
            <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} style={{ width: '20px', height: '20px' }} />
          </span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300"></div>
        </Link>

        <div className="mt-12">
          <p className="text-teal-200 text-sm">
            Limited early access spots available
          </p>
        </div>
      </div>
    </section>
  );
}
