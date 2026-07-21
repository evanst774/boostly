// src/components/seo/JsonLd.tsx
'use client';

import Script from 'next/script';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

interface JsonLdProps {
  data: Record<string, JsonValue>; // Use Record instead of a separate JsonObject interface
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization Schema
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://schoolhubplatform.com/#organization',
    name: 'SchoolHub Platform',
    url: 'https://schoolhubplatform.com',
    logo: 'https://schoolhubplatform.com/logo.png',
    sameAs: [
      'https://www.facebook.com/schoolhubafrica',
      'https://www.twitter.com/schoolhubafrica',
      'https://www.linkedin.com/company/schoolhub-africa',
      'https://www.youtube.com/@schoolhubafrica',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+250-782-368-529',
        contactType: 'customer service',
        areaServed: ['RW', 'KE', 'UG', 'TZ', 'ET', 'NG', 'GH', 'ZA'],
        availableLanguage: ['English', 'French', 'Swahili'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'KG 7 Ave, Kigali Innovation City',
      addressLocality: 'Kigali',
      addressRegion: 'Kigali City',
      postalCode: '250',
      addressCountry: 'RW',
    },
  };

  return <JsonLd data={schema} />;
}

// Website Schema
export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://schoolhubplatform.com/#website',
    url: 'https://schoolhubplatform.com',
    name: 'SchoolHub Platform',
    description: 'Complete School Management System for African Schools',
    publisher: {
      '@id': 'https://schoolhubplatform.com/#organization',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate:
          'https://schoolhubplatform.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <JsonLd data={schema} />;
}

// Product Schema
export function ProductSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': 'https://schoolhubplatform.com/#product',
    name: 'SchoolHub School Management System',
    description:
      'Comprehensive cloud-based school management software for African institutions',
    brand: {
      '@type': 'Brand',
      name: 'SchoolHub',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: 'https://schoolhubplatform.com/pricing',
      priceValidUntil: '2025-12-31',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      reviewCount: '150',
    },
  };

  return <JsonLd data={schema} />;
}
