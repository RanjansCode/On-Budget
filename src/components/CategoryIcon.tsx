import React from 'react';
import {
  LayoutGrid,
  Smartphone,
  Cpu,
  Laptop,
  Tv,
  CookingPot,
  Home,
  Lamp,
  Armchair,
  Refrigerator,
  Baby,
  Footprints,
  Luggage,
  Gem,
  Dumbbell,
  BookOpen,
  Car,
  HeartPulse,
  ShoppingBasket,
  PawPrint,
  Gamepad2,
  Camera,
  Music2,
  Flower2,
  Wrench,
  MoreHorizontal,
  Layout,
  Utensils,
  Sparkles,
  Shirt,
  User
} from 'lucide-react';

export const CATEGORY_ICON_OPTIONS = [
  { label: 'LayoutGrid (All Categories)', key: 'LayoutGrid' },
  { label: 'Smartphone (Mobiles & Accessories)', key: 'Smartphone' },
  { label: 'Cpu (Electronics)', key: 'Cpu' },
  { label: 'Laptop (Computers & Accessories)', key: 'Laptop' },
  { label: 'Tv (TV, Audio & Video)', key: 'Tv' },
  { label: 'CookingPot (Home & Kitchen)', key: 'CookingPot' },
  { label: 'Home & Lamp (Home Decor)', key: 'HomeLamp' },
  { label: 'Armchair (Furniture)', key: 'Armchair' },
  { label: 'Refrigerator (Appliances)', key: 'Refrigerator' },
  { label: 'Lipstick (Beauty & Personal Care)', key: 'Lipstick' },
  { label: 'Women (Women\'s Fashion)', key: 'Women' },
  { label: 'Men (Men\'s Fashion)', key: 'Men' },
  { label: 'Baby (Kids & Baby)', key: 'Baby' },
  { label: 'Footprints (Footwear)', key: 'Footprints' },
  { label: 'Luggage (Bags & Luggage)', key: 'Luggage' },
  { label: 'Gem (Jewellery & Accessories)', key: 'Gem' },
  { label: 'Dumbbell (Sports & Fitness)', key: 'Dumbbell' },
  { label: 'BookOpen (Books & Stationery)', key: 'BookOpen' },
  { label: 'Car (Automotive)', key: 'Car' },
  { label: 'HeartPulse (Health & Wellness)', key: 'HeartPulse' },
  { label: 'ShoppingBasket (Grocery & Food)', key: 'ShoppingBasket' },
  { label: 'PawPrint (Pet Supplies)', key: 'PawPrint' },
  { label: 'Gamepad2 (Toys & Games)', key: 'Gamepad2' },
  { label: 'Camera (Cameras & Photography)', key: 'Camera' },
  { label: 'Music2 (Musical Instruments)', key: 'Music2' },
  { label: 'Flower2 (Garden & Outdoor)', key: 'Flower2' },
  { label: 'Wrench (Tools & Home Improvement)', key: 'Wrench' },
  { label: 'MoreHorizontal (Others)', key: 'MoreHorizontal' },
];

// Custom Icon for Home Decor combining BOTH Home and Lamp icons
export const HomeLampIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <div className={`flex items-center justify-center gap-0.5 ${className}`}>
    <Home className="w-3.5 h-3.5 shrink-0" />
    <Lamp className="w-3.5 h-3.5 shrink-0" />
  </div>
);

// Custom SVG icon for Lipstick (Beauty & Personal Care)
export const LipstickIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 11l3-7 3 2-3 7" />
    <rect x="7" y="11" width="10" height="5" rx="1" />
    <rect x="6" y="16" width="12" height="6" rx="1" />
  </svg>
);

// Custom SVG icon for Women's Fashion
export const WomenIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="4" r="2.5" />
    <path d="M12 6.5L8.5 14h7L12 6.5z" />
    <path d="M10 14v6" />
    <path d="M14 14v6" />
  </svg>
);

// Custom SVG icon for Men's Fashion
export const MenIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="4" r="2.5" />
    <path d="M8.5 7.5h7v6.5h-7z" />
    <path d="M10 14v6" />
    <path d="M14 14v6" />
  </svg>
);

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  Smartphone,
  Cpu,
  Laptop,
  Tv,
  CookingPot,
  HomeLamp: HomeLampIcon,
  'Home and Lamp': HomeLampIcon,
  'Home & Lamp': HomeLampIcon,
  Home: HomeLampIcon,
  Lamp: HomeLampIcon,
  Armchair,
  Refrigerator,
  Lipstick: LipstickIcon,
  Women: WomenIcon,
  Men: MenIcon,
  Baby,
  Footprints,
  Luggage,
  Gem,
  Dumbbell,
  BookOpen,
  Car,
  HeartPulse,
  ShoppingBasket,
  PawPrint,
  Gamepad2,
  Camera,
  Music2,
  Music: Music2,
  Flower2,
  Wrench,
  MoreHorizontal,
  Layout,
  Utensils: CookingPot,
  Sparkles: LipstickIcon,
  Shirt,
  User
};

interface CategoryIconProps {
  iconKey: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconKey, className = 'w-5 h-5' }) => {
  const IconComponent = ICON_MAP[iconKey] || ICON_MAP[iconKey?.trim()] || LayoutGrid;
  return <IconComponent className={className} />;
};

export default CategoryIcon;
