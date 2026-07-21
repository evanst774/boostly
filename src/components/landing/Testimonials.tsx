// src/components/landing/Testimonials.tsx

const TESTIMONIALS = [
  {
    name: 'Sarah J.',
    loc: 'New York, USA',
    initials: 'SJ',
    text: 'I love Boostly! I earn extra money every day just by watching videos and playing games. Payouts are super fast!',
  },
  {
    name: 'Michael T.',
    loc: 'Toronto, Canada',
    initials: 'MT',
    text: "The best rewards platform I've used. The offers are great and I really appreciate the instant withdrawals.",
  },
  {
    name: 'Aisha R.',
    loc: 'Nairobi, Kenya',
    initials: 'AR',
    text: 'Boostly changed the way I earn online. Simple, legit and pays real money. Highly recommended!',
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[220px_1fr] gap-10">
          <div>
            <h2 className="text-2xl font-black mb-2">What Our Users Say</h2>
            <p className="text-sm text-text-secondary mb-4">
              Trusted by thousands of satisfied users worldwide.
            </p>
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-gold text-sm">
                  ★
                </span>
              ))}
            </div>
            <p className="text-xs text-text-muted">
              4.8 out of 5 based on 12,350 reviews
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="border border-border-light rounded-2xl p-5"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-gold text-sm">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm text-text-secondary mb-4">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-xs font-bold text-primary">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
