// src/app/robots.ts
import { MetadataRoute } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://boostly.buzz').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/admin/',
                '/dashboard',
                '/earn/',
                '/wallet',
                '/plans',
                '/settings',
                '/_next/',
                '/*.json$',
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}