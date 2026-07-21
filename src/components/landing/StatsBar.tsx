// src/components/landing/StatsBar.tsx

const STATS = [
  { icon: '👥', value: '500K+', label: 'Active Users', color: 'bg-primary' },
  {
    icon: '💰',
    value: '$25M+',
    label: 'Rewards Paid Out',
    color: 'bg-success',
  },
  { icon: '▶️', value: '1.2M+', label: 'Videos Watched', color: 'bg-purple' },
  { icon: '🎮', value: '850K+', label: 'Games Played', color: 'bg-warning' },
  { icon: '⭐', value: '98%', label: 'User Satisfaction', color: 'bg-pink' },
];

export function StatsBar() {
  return (
    <section className="bg-white border-b border-border-light">
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-5 gap-6">
        {STATS.map(({ icon, value, label, color }) => (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0 text-white text-lg`}
            >
              {icon}
            </div>
            <div>
              <p className="text-xl font-black leading-none">{value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
