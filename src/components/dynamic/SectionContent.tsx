// src/components/dynamic/SectionContent.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface SectionContentProps {
  sectionKey: string;
  defaultContent?: string;
  className?: string;
}

export default function SectionContent({
  sectionKey,
  defaultContent = '',
  className = '',
}: SectionContentProps) {
  // const { dark } = useTheme();
  const [content, setContent] = useState(defaultContent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`/api/public/section/${sectionKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data.content) {
            setContent(data.content);
          }
        }
      } catch (error) {
        console.error(`Error fetching section ${sectionKey}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [sectionKey]);

  if (isLoading && !content) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className={className}>
      {content.split('\n').map(
        (paragraph, index) =>
          paragraph.trim() && (
            <p key={index} className="mb-4 text-gray-600 dark:text-gray-300">
              {paragraph}
            </p>
          ),
      )}
    </div>
  );
}
