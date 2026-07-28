import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  productTitle?: string;
}

export default function ImageLightboxModal({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  productTitle = 'Product Image Preview',
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Sync initialIndex when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, images.length]);

  // Reset zoom & pan when image changes
  const resetZoomPan = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetZoomPan();
  }, [images.length, resetZoomPan]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetZoomPan();
  }, [images.length, resetZoomPan]);

  const handleZoomIn = () => {
    setZoom((z) => Math.min(Number((z + 0.5).toFixed(1)), 4));
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const nextZoom = Math.max(Number((z - 0.5).toFixed(1)), 1);
      if (nextZoom === 1) setPan({ x: 0, y: 0 });
      return nextZoom;
    });
  };

  const toggleDoubleTapZoom = () => {
    if (zoom > 1) {
      resetZoomPan();
    } else {
      setZoom(2.5);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (zoom === 1) handlePrev();
      } else if (e.key === 'ArrowRight') {
        if (zoom === 1) handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, zoom]);

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Drag / Pan mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    e.preventDefault();
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for swipe & mobile pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      if (zoom > 1) {
        setIsDragging(true);
        dragStartRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoom > 1 && isDragging) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    if (!touchStartRef.current) return;

    if (zoom === 1 && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const timeElapsed = Date.now() - touchStartRef.current.time;

      // Swipe horizontal threshold
      if (timeElapsed < 400 && Math.abs(deltaX) > 40 && Math.abs(deltaY) < 60) {
        if (deltaX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      } else if (timeElapsed < 400 && deltaY > 100 && Math.abs(deltaX) < 60) {
        // Swipe down to close
        onClose();
      }
    }
    touchStartRef.current = null;
  };

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between select-none overflow-hidden p-3 sm:p-6"
        onClick={(e) => {
          // Close if backdrop clicked directly
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Top Header / Toolbar */}
        <div className="flex items-center justify-between gap-4 z-10 w-full max-w-7xl mx-auto text-white">
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold truncate text-slate-200">
              {productTitle}
            </span>
            {images.length > 1 && (
              <span className="text-[10px] text-slate-400 font-mono">
                Image {currentIndex + 1} of {images.length}
              </span>
            )}
          </div>

          {/* Zoom and Close Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg transition-all cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-bold px-2 text-slate-200 min-w-[42px] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 4}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg transition-all cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {zoom > 1 && (
                <button
                  type="button"
                  onClick={resetZoomPan}
                  className="p-1.5 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg transition-all cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-900/80 hover:bg-red-500/20 hover:text-red-400 text-slate-300 border border-slate-700/60 hover:border-red-500/40 rounded-xl transition-all cursor-pointer"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Stage with Image & Pan/Zoom */}
        <div
          className="relative flex-1 flex items-center justify-center my-2 sm:my-4 overflow-hidden cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={toggleDoubleTapZoom}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.img
            key={currentImage}
            src={currentImage}
            alt={productTitle}
            className="max-h-[75vh] sm:max-h-[82vh] max-w-[92vw] object-contain shadow-2xl rounded-xl transition-transform duration-100 ease-out pointer-events-auto"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            }}
            draggable={false}
            referrerPolicy="no-referrer"
          />

          {/* Previous Image Arrow */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-slate-900/80 hover:bg-[#FF5A00] text-white border border-slate-700/60 rounded-2xl backdrop-blur-md transition-all cursor-pointer shadow-lg z-20 group"
              title="Previous Image (Left Arrow)"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Next Image Arrow */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-slate-900/80 hover:bg-[#FF5A00] text-white border border-slate-700/60 rounded-2xl backdrop-blur-md transition-all cursor-pointer shadow-lg z-20 group"
              title="Next Image (Right Arrow)"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Bottom Thumbnails Strip (if multiple images exist) */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 z-10 py-1 overflow-x-auto max-w-full">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  resetZoomPan();
                }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 p-1 bg-slate-900/80 ${
                  idx === currentIndex
                    ? 'border-[#FF5A00] scale-105 shadow-md shadow-[#FF5A00]/20'
                    : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
