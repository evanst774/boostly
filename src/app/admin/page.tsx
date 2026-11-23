// src/app/admin/page.tsx — /admin opens the admin dashboard.
import { redirect } from 'next/navigation';

export default function AdminIndex() {
  redirect('/admin/dashboard');
}
