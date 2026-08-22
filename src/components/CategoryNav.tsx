import React, { useRef, useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Category } from '../types';
import CategoryIcon from './CategoryIcon';

interface CategoryNavProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export default function CategoryNav({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Detect page scroll position.
  // When page is scrolled, ONLY category icons will hide.
  const [isPageScrolled, setIsPageScrolled] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 5
    );
  };

  useEffect(() => {
    checkScroll();

    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories]);

  // Detect vertical page scrolling.
  useEffect(() => {
    const handlePageScroll = () => {
      setIsPageScrolled(window.scrollY > 10);
    };

    // Set initial state
    handlePageScroll();

    window.addEventListener('scroll', handlePageScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handlePageScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollAmount = direction === 'left' ? -280 : 280;

    el.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  const isCategoryActive = (cat: Category) => {
    if (
      cat.id === 'all-categories' ||
      cat.name === 'All Categories'
    ) {
      return (
        !selectedCategory ||
        selectedCategory === '' ||
        selectedCategory === 'all-categories' ||
        selectedCategory.toLowerCase() === 'all categories'
      );
    }

    return (
      selectedCategory.toLowerCase() === cat.id.toLowerCase() ||
      selectedCategory.toLowerCase() === cat.name.toLowerCase()
    );
  };

  const handleCategoryClick = (cat: Category) => {
    if (
      cat.id === 'all-categories' ||
      cat.name === 'All Categories'
    ) {
      onSelectCategory('');
    } else {
      onSelectCategory(cat.id);
    }
  };

  return (
    <nav className="relative w-full z-10 bg-white dark:bg-slate-900">
      {/* Left Scroll Button (Desktop) */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll categories left"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer opacity-90 hover:opacity-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 sm:py-2.5 scrollbar-none scroll-smooth select-none px-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {categories.map((cat) => {
          const active = isCategoryActive(cat);

          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              aria-pressed={active}
              className={`group/item flex flex-col items-center justify-center min-w-[68px] sm:min-w-[84px] md:min-w-[92px] py-1 px-1.5 sm:px-2 rounded-xl transition-all duration-200 cursor-pointer shrink-0 border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00] ${
                active
                  ? 'text-[#FF5A00]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {/* Icon Container
                  ONLY THIS gets hidden while page is scrolled.
                  The actual icon is NOT removed/replaced. */}
              <div
                className={`flex items-center justify-center overflow-hidden rounded-xl transition-all duration-200 ${
                  isPageScrolled
                    ? 'w-0 h-0 max-w-0 max-h-0 opacity-0 scale-0 m-0 p-0'
                    : 'w-9 h-9 sm:w-10 sm:h-10 opacity-100 scale-100 mb-1'
                } ${
                  active
                    ? 'bg-[#FF5A00]/10 text-[#FF5A00] scale-105'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 group-hover/item:bg-slate-100 dark:group-hover/item:bg-slate-800 group-hover/item:text-slate-900 dark:group-hover/item:text-white'
                }`}
              >
                <CategoryIcon
                  iconKey={cat.icon}
                  className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform group-hover/item:scale-110"
                />
              </div>

              {/* Category Name
                  ALWAYS VISIBLE */}
              <span
                className={`text-[10px] sm:text-[12px] md:text-[13px] text-center whitespace-nowrap tracking-tight leading-tight max-w-[110px] sm:max-w-[130px] truncate transition-all duration-200 ${
                  active
                    ? 'font-extrabold text-[#FF5A00]'
                    : 'font-medium text-slate-700 dark:text-slate-300 group-hover/item:text-slate-900 dark:group-hover/item:text-white'
                }`}
              >
                {cat.name}
              </span>

              {/* Subtle Active Indicator Line */}
              <div
                className={`h-0.5 rounded-full transition-all duration-200 ${
                  active
                    ? 'w-6 sm:w-8 bg-[#FF5A00] mt-0.5'
                    : 'w-0 bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Right Scroll Button (Desktop) */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll categories right"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer opacity-90 hover:opacity-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </nav>
  );
}