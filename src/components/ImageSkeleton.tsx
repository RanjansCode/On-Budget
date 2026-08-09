import React, { useState } from 'react';

export function getOptimizedImageUrl(url: string, width = 600): string {
  if (!url) return url;
  if (url.includes('images.unsplash.com')) {
    if (url.includes('w=')) {
      return url.replace(/w=\d+/, `w=${width}`);
    }
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}w=${width}&auto=format&fit=crop&q=80`;
  }
  return url;
}

interface ImageSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  title?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  priority?: boolean;
}

export default function ImageSkeleton({
  src,
  alt,
  title,
  loading,
  fetchPriority,
  className = '',
  containerClassName = '',
  aspectRatio,
  priority = false,
  ...props
}: ImageSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(priority);
  const [hasError, setHasError] = useState(false);

  const imgTitle = title || alt;
  const optimizedSrc = getOptimizedImageUrl(src, priority ? 800 : 600);
  const effectiveLoading = priority ? 'eager' : (loading || 'lazy');
  const effectiveFetchPriority = priority ? 'high' : (fetchPriority || 'auto');

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${containerClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Shimmer Placeholder while loading */}
      {!isLoaded && !hasError && !priority && (
        <div className="absolute inset-0 skeleton-shimmer z-0 rounded-inherit" />
      )}

      {/* Actual Image with smooth opacity transition */}
      <img
        src={optimizedSrc}
        alt={alt}
        title={imgTitle}
        data-caption={imgTitle}
        loading={effectiveLoading}
        fetchPriority={effectiveFetchPriority}
        decoding={priority ? 'sync' : 'async'}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setIsLoaded(true);
          setHasError(true);
        }}
        className={`transition-opacity duration-300 ease-in-out ${
          isLoaded || priority ? 'opacity-100 z-10' : 'opacity-0 z-0 absolute'
        } ${className}`}
        {...props}
      />

      {/* Fallback Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-[10px] font-bold">
          <span>Image unavailable</span>
        </div>
      )}
    </div>
  );
}
