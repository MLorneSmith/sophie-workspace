
'use client';

import Image from 'next/image';
import React, { useState } from 'react';

/**
 * Component that provides fallbacks for media files
 * with automatic fallback to placeholder images
 */
export const MediaFallback: React.FC<{
  src: string;
  alt: string;
  width: number;
  height: number;
  fallbackSrc?: string;
  className?: string;
}> = ({ 
  src, 
  alt, 
  width, 
  height, 
  fallbackSrc = '/assets/fallbacks/image-placeholder.webp',
  className = '' 
}) => {
  const [error, setError] = useState(false);
  
  // Use the original source if no error, otherwise use fallback
  const imageSrc = !error ? src : fallbackSrc;
  
  return (
    <div className={`relative ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        onError={() => setError(true)}
        className={`${error ? 'opacity-70' : ''} transition-opacity`}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm text-gray-500 bg-white/80 px-2 py-1 rounded">
            Image unavailable
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Component that provides fallbacks for downloadable files
 * with automatic fallback to placeholder content
 */
export const DownloadFallback: React.FC<{
  href: string;
  filename: string;
  fallbackHref?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ 
  href, 
  filename, 
  fallbackHref = '/assets/fallbacks/download-placeholder.pdf',
  children,
  className = ''
}) => {
  const [error, setError] = useState(false);
  
  // Use the original href if no error, otherwise use fallback
  const downloadHref = !error ? href : fallbackHref;
  
  // Check if the file exists before download
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (error) return; // Already using fallback
    
    e.preventDefault();
    
    try {
      // Attempt a HEAD request to check if file exists
      const response = await fetch(href, { method: 'HEAD' });
      
      if (!response.ok) {
        // File doesn't exist, use fallback
        setError(true);
        window.location.href = fallbackHref;
      } else {
        // File exists, proceed with download
        window.location.href = href;
      }
    } catch {
      // Network error, use fallback
      setError(true);
      window.location.href = fallbackHref;
    }
  };
  
  return (
    <a
      href={downloadHref}
      download={filename}
      onClick={!error ? handleClick : undefined}
      className={`${className} ${error ? 'opacity-70' : ''}`}
    >
      {children}
      {error && (
        <span className="ml-2 text-sm text-gray-500 bg-white/80 px-2 py-1 rounded">
          Using fallback
        </span>
      )}
    </a>
  );
};
