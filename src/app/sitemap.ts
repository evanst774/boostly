// src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://schoolhub.rw';
    const currentDate = new Date().toISOString();

    // All pages from footer and mega menu
    const pages = [
        // Main pages
        '', '/features', '/solutions', '/pricing', '/about', '/contact', '/blog', '/demo', '/login',

        // Features
        '/features/student-management',
        '/features/guardians',
        '/features/attendance',
        '/features/academic',
        '/features/finance',
        '/features/clearance',
        '/features/billing',
        '/features/final-clearance',
        '/features/student-affairs',
        '/features/staff',
        '/features/library',
        '/features/communication',

        // Solutions
        '/solutions/primary',
        '/solutions/secondary',
        '/solutions/tvet',
        '/solutions/multi-school',
        '/solutions/multi-campus',
        '/solutions/parent-portal',
        '/solutions/mobile-payments',

        // Resources
        '/docs',
        '/api-docs',
        '/integrations',
        '/help',
        '/status',
        '/security',

        // Company
        '/story',
        '/careers',
        '/press',

        // Legal
        '/privacy',
        '/terms',
        '/dpa',
        '/gdpr',
        '/cookies',
        '/security-policy',
    ];

    return pages.map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: currentDate,
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1.0 : 0.8,
    }));
}