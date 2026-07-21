// app/forbidden/page.tsx
'use client';

import ErrorLayout from '@/components/ErrorLayout';

export default function Forbidden() {
  return (
    <ErrorLayout
      code={403}
      title="Access Denied"
      message="You don't have permission to access this page. Please contact your administrator."
    />
  );
}