// src/app/ref/[code]/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ReferralRedirectPageProps {
  params: {
    code: string;
  };
}

export default function ReferralRedirectPage({
  params,
}: ReferralRedirectPageProps) {
  const router = useRouter();
  const { code } = params;

  useEffect(() => {
    // Redirect to registration with referral code
    if (code) {
      router.push(`/register?ref=${code}`);
    } else {
      router.push('/register');
    }
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">
          Redirecting you to join Boostly...
        </p>
      </div>
    </div>
  );
}
