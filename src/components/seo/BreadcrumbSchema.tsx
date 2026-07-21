// src/components/seo/BreadcrumbSchema.tsx
'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

interface BreadcrumbItem {
  name: string;
  item: string;
  position: number;
}

export default function BreadcrumbSchema() {
  const pathname = usePathname();
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', item: 'https://schoolhubplatform.com', position: 1 }
    ];
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      
      // Format the name (remove hyphens, capitalize)
      let name = path.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      // Special cases
      if (path === 'api-docs') name = 'API Documentation';
      if (path === 'tvet') name = 'TVET Institutions';
      
      breadcrumbs.push({
        name,
        item: `https://schoolhubplatform.com${currentPath}`,
        position: index + 2
      });
    });
    
    return breadcrumbs;
  };

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `https://schoolhubplatform.com${pathname}#breadcrumb`,
    itemListElement: generateBreadcrumbs().map(item => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: item.item,
    })),
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}