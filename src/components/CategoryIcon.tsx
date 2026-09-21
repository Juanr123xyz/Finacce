import React from 'react';
import {
  Briefcase,
  TrendingUp,
  Utensils,
  Home,
  Car,
  Laptop,
  Compass,
  HeartPulse,
  ArrowLeftRight,
  CreditCard,
  LucideIcon,
} from 'lucide-react';
import { TransactionCategory } from '../types';
import { CATEGORIES } from '../data/initialData';

interface CategoryIconProps {
  category: TransactionCategory;
  className?: string;
  size?: number;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  TrendingUp,
  Utensils,
  Home,
  Car,
  Laptop,
  Compass,
  HeartPulse,
  ArrowLeftRight,
  CreditCard,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  className = 'w-5 h-5',
  size = 20,
}) => {
  const cat = CATEGORIES[category] || CATEGORIES.other;
  const IconComponent = ICON_MAP[cat.iconName] || CreditCard;

  return <IconComponent size={size} className={className} />;
};
