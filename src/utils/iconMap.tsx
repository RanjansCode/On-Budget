import React from 'react';
import {
  Flame,
  Star,
  DollarSign,
  Sparkles,
  TrendingUp,
  Heart,
  Tag,
  ShoppingBag,
  Video,
  FlaskConical,
  Target,
  Smartphone,
  Laptop,
  Gamepad2,
  Home,
  Gift,
  Package,
  Zap,
  ShieldCheck,
  Diamond,
  Layers,
  LayoutGrid,
  Percent,
  CheckCircle2,
  Tv,
  Camera,
  Headphones,
  Watch,
  Award,
  Bookmark
} from 'lucide-react';

export const POPULAR_SECTION_ICONS = [
  { icon: '🔥', label: 'Flame / Hot' },
  { icon: '⭐', label: 'Star / Top Rated' },
  { icon: '💰', label: 'Money / Budget' },
  { icon: '🎯', label: 'Target / Top Picks' },
  { icon: '🆕', label: 'New / Fresh' },
  { icon: '📱', label: 'Phone / Mobile' },
  { icon: '💻', label: 'Laptop / Tech' },
  { icon: '🎮', label: 'Gaming' },
  { icon: '🏠', label: 'Smart Home' },
  { icon: '🎥', label: 'Reel / Video' },
  { icon: '❤️', label: 'Heart / Wishlist' },
  { icon: '🏷️', label: 'Tag / Discount' },
  { icon: '🛒', label: 'Cart / Best Selling' },
  { icon: '⚡', label: 'Lightning / Flash' },
  { icon: '💎', label: 'Diamond / Premium' },
  { icon: '📦', label: 'Package / Finds' },
  { icon: '🧪', label: 'Tested / Lab' },
  { icon: '🎁', label: 'Gift / Special' },
  { icon: '🎧', label: 'Headphones / Audio' },
  { icon: '⌚', label: 'Watch / Wearables' },
];

export function renderSectionIcon(iconStr?: string, className: string = 'w-5 h-5'): React.ReactNode {
  if (!iconStr) return <Layers className={className} />;

  // If it is an emoji or non-ascii string
  const isEmoji = /\p{Extended_Pictographic}/u.test(iconStr) || iconStr.length <= 4;
  if (isEmoji && iconStr.length <= 4) {
    return <span className="text-base leading-none select-none">{iconStr}</span>;
  }

  // Lucide icon name mapping
  const normalized = iconStr.toLowerCase().replace(/[-_]/g, '');

  switch (normalized) {
    case 'flame':
    case 'fire':
      return <Flame className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'dollarsign':
    case 'dollar':
    case 'money':
      return <DollarSign className={className} />;
    case 'sparkles':
    case 'sparkle':
      return <Sparkles className={className} />;
    case 'trendingup':
    case 'trending':
      return <TrendingUp className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'tag':
      return <Tag className={className} />;
    case 'shoppingbag':
    case 'cart':
      return <ShoppingBag className={className} />;
    case 'video':
    case 'camera':
      return <Video className={className} />;
    case 'flaskconical':
    case 'flask':
    case 'test':
      return <FlaskConical className={className} />;
    case 'target':
      return <Target className={className} />;
    case 'smartphone':
    case 'phone':
    case 'mobile':
      return <Smartphone className={className} />;
    case 'laptop':
    case 'computer':
      return <Laptop className={className} />;
    case 'gamepad2':
    case 'gamepad':
    case 'gaming':
      return <Gamepad2 className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'gift':
      return <Gift className={className} />;
    case 'package':
      return <Package className={className} />;
    case 'zap':
    case 'lightning':
      return <Zap className={className} />;
    case 'shieldcheck':
    case 'shield':
      return <ShieldCheck className={className} />;
    case 'diamond':
      return <Diamond className={className} />;
    case 'headphones':
      return <Headphones className={className} />;
    case 'watch':
      return <Watch className={className} />;
    case 'percent':
      return <Percent className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'bookmark':
      return <Bookmark className={className} />;
    default:
      return <span className="text-base leading-none select-none">{iconStr}</span>;
  }
}
