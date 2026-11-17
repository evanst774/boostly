// src/app/sitemap.ts
import { MetadataRoute } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://boostly.buzz').replace(/\/$/, '');

/** Public, indexable pages only (app and admin screens need a login). */
const PAGES: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/register', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/login', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/help', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/resources', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/resources/faq', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.5, changeFrequency: 'weekly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.2, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date().toISOString();
  return PAGES.map((p) => ({
    url: `${baseUrl}${p.path}`,
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
