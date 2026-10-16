import React from 'react';
import {
  Smartphone,
  Utensils,
  Car,
  Zap,
  Home,
  ShoppingBag,
  HeartPulse,
  Tv,
  Users,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Store,
  TrendingUp,
  Gift,
  Coffee,
  Fuel,
  GraduationCap,
  Plane,
  Dumbbell,
  Tag,
  Wifi,
  Phone,
  Droplets,
  CreditCard,
  Shield,
  Film
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export const AVAILABLE_ICONS = [
  { name: 'Smartphone', label: 'Airtime & Phone', icon: Smartphone },
  { name: 'Phone', label: 'Calls & Telco', icon: Phone },
  { name: 'Wifi', label: 'Internet & WiFi', icon: Wifi },
  { name: 'Utensils', label: 'Food & Meals', icon: Utensils },
  { name: 'Coffee', label: 'Café & Drinks', icon: Coffee },
  { name: 'Car', label: 'Transport & Cab', icon: Car },
  { name: 'Fuel', label: 'Fuel & Gas', icon: Fuel },
  { name: 'Zap', label: 'Electricity & Power', icon: Zap },
  { name: 'Droplets', label: 'Water & Utilities', icon: Droplets },
  { name: 'Home', label: 'Rent & Housing', icon: Home },
  { name: 'ShoppingBag', label: 'Shopping', icon: ShoppingBag },
  { name: 'CreditCard', label: 'Subscriptions', icon: CreditCard },
  { name: 'HeartPulse', label: 'Health & Medical', icon: HeartPulse },
  { name: 'Tv', label: 'Entertainment', icon: Tv },
  { name: 'Film', label: 'Movies & Media', icon: Film },
  { name: 'Users', label: 'Family & Transfers', icon: Users },
  { name: 'Briefcase', label: 'Salary & Job', icon: Briefcase },
  { name: 'Laptop', label: 'Freelance & Remote', icon: Laptop },
  { name: 'Store', label: 'Business & Commerce', icon: Store },
  { name: 'TrendingUp', label: 'Investments', icon: TrendingUp },
  { name: 'Gift', label: 'Gifts & Rewards', icon: Gift },
  { name: 'GraduationCap', label: 'Education & Fees', icon: GraduationCap },
  { name: 'Plane', label: 'Travel & Trips', icon: Plane },
  { name: 'Dumbbell', label: 'Fitness & Sports', icon: Dumbbell },
  { name: 'Shield', label: 'Insurance & Taxes', icon: Shield },
  { name: 'MoreHorizontal', label: 'General / Other', icon: MoreHorizontal },
];

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4', color }) => {
  const item = AVAILABLE_ICONS.find(i => i.name.toLowerCase() === name.toLowerCase());
  const IconComponent = item ? item.icon : Tag;
  
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};
