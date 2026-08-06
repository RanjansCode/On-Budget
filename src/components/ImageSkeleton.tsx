import React, { useState } from 'react';

interface ImageSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  title?: string;
  loading?: 'lazy' | 'eager';
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

export default function ImageSkeleton({
  src,
  alt,
  title,
  loading = 'lazy',
  className = '',
  containerClassName = '',
  aspectRatio,
  ...props
}: ImageSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const imgTitle = title || alt;

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${containerClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Shimmer Placeholder while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 skeleton-shimmer z-0 rounded-inherit" />
      )}

      {/* Actual Image with smooth opacity transition */}
      <img
        src={src}
        alt={alt}
        title={imgTitle}
        data-caption={imgTitle}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setIsLoaded(true);
          setHasError(true);
        }}
        className={`transition-opacity duration-300 ease-in-out ${
          isLoaded ? 'opacity-100 z-10' : 'opacity-0 z-0 absolute'
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
