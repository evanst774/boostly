// src/app/(dashboard)/earn/layout.tsx
//
// The Earn tab: one screen with a Videos / Games / Surveys switcher, so the
// three task types feel like one place to earn.
import { EarnSwitcher } from '@/components/app/EarnSwitcher';

export default function EarnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <EarnSwitcher />
      {children}
    </div>
  );
}
