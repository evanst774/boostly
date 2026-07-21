// app/error.tsx
'use client';

import ErrorLayout from '@/components/ErrorLayout';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <ErrorLayout
          code={500}
          title="System Error"
          message="Something went wrong. Our team has been notified."
          showReset
          onReset={reset}
        />
      </body>
    </html>
  );
}
