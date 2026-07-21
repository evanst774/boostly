// app/not-found.tsx
'use client';

import ErrorLayout from '@/components/ErrorLayout';

export default function NotFound() {
  return (
    <ErrorLayout
      code={404}
      title="Page Not Found"
      message="The page you're looking for doesn't exist or may have been moved."
    />
  );
}
