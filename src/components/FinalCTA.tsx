import { Sparkles, ArrowRight } from 'lucide-react';

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

        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Ready to Make Your Marketing Wishes Come True?
        </h2>

        <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
          Be among the first to experience Ad-Genie magic
        </p>

        <a
          href="/waitlist"
          className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xl rounded-full shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 hover:scale-110"
        >
          <span className="relative z-10 flex items-center gap-3">
            Join Waitlist - Ad-Genie Magic
            <ArrowRight className="group-hover:translate-x-2 transition-transform" size={24} />
          </span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300"></div>
        </a>

        <div className="mt-12">
          <p className="text-teal-200 text-sm">
            Limited early access spots available
          </p>
        </div>
      </div>
    </section>
  );
}
