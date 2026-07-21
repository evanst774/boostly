// src/app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SchoolHub Platform',
        short_name: 'SchoolHub',
        description: 'Complete School Management System for African Schools',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4ab848',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}