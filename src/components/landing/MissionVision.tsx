// src/components/landing/MissionVision.tsx

export function MissionVision() {
  return (
    <section className="bg-navy py-16">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl font-black text-white mb-8">
            Our Mission &amp; Vision
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-2xl">
                🎯
              </div>
              <div>
                <p className="font-bold text-white mb-1">Our Mission</p>
                <p className="text-white/60 text-sm">
                  To create the most trusted and rewarding platform where
                  anyone, anywhere can earn real income by doing simple, fun and
                  valuable activities online.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 text-2xl">
                🌍
              </div>
              <div>
                <p className="font-bold text-white mb-1">Our Vision</p>
                <p className="text-white/60 text-sm">
                  To build a world where digital opportunities empower people
                  financially and create a fairer future for communities
                  globally.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative rounded-2xl overflow-hidden h-72 bg-navy-lighter flex items-center justify-center">
          <span className="text-white/20 text-sm">Community photo</span>
          <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg p-3 text-xs w-48">
            <p className="font-semibold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center text-[10px] text-success">
                ✓
              </span>{' '}
              Payment Received
            </p>
            <p className="text-text-muted mt-0.5">
              You received $25.00 from Boostly · 2m ago
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
