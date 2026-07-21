// app/unauthorized/page.tsx
'use client';

import ErrorLayout from '@/components/ErrorLayout';

export default function Unauthorized() {
  return (
    <ErrorLayout
      code={401}
      title="Authentication Required"
      message="Please log in to access this page. If you don't have an account, contact your administrator."
    />
  );
}
