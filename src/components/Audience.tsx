import { Rocket, User, Users } from 'lucide-react';

const audiences = [
  {
    icon: Rocket,
    title: 'Bootstrapped Founders',
    description: 'Launch your brand without burning your budget',
    gradient: 'from-teal-500 to-cyan-600',
    bgPattern: 'opacity-10'
  },
  {
    icon: User,
    title: 'Solopreneurs',
    description: 'Focus on your craft, let the Genie handle marketing',
    gradient: 'from-purple-500 to-pink-600',
    bgPattern: 'opacity-10'
  },
  {
    icon: Users,
    title: 'Small Marketing Teams',
    description: '10x your output without 10x your headcount',
    gradient: 'from-amber-500 to-orange-600',
    bgPattern: 'opacity-10'
  }
];

export default function Audience() {
  return (
    <section className="py-20 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #F59E0B 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Built for India's Dreamers
          </h2>
          <p className="text-xl text-slate-300">Empowering businesses of all sizes</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {audiences.map((audience, index) => (
            <div
              key={index}
              className="group relative bg-slate-800 rounded-2xl p-8 hover:bg-slate-750 transition-all duration-300 hover:-translate-y-2 border border-slate-700 hover:border-teal-500"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${audience.gradient} ${audience.bgPattern} group-hover:opacity-20 transition-opacity duration-300`}></div>

              <div className="relative">
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${audience.gradient} mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <audience.icon className="text-white" size={36} />
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">
                  {audience.title}
                </h3>

                <p className="text-slate-300 text-lg leading-relaxed">
                  {audience.description}
                </p>
              </div>

              <div className="absolute bottom-4 right-4">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${audience.gradient} group-hover:scale-150 transition-transform duration-300`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
