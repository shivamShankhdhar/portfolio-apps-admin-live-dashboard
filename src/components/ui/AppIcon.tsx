import React from 'react';
import { FaDiceD6, FaChessKnight, FaGamepad } from 'react-icons/fa6';
import { FiZap, FiCpu, FiSmartphone } from 'react-icons/fi';

interface AppIconProps {
  title?: string;
  category?: string;
  className?: string;
  iconString?: string;
}

export default function AppIcon({
  title = '',
  category = '',
  className = 'h-6 w-6',
  iconString = '',
}: AppIconProps) {
  const lowerTitle = title.toLowerCase();
  const lowerCat = category.toLowerCase();
  const lowerIcon = iconString.toLowerCase();

  if (
    lowerTitle.includes('ludo') ||
    lowerIcon.includes('dice') ||
    iconString === '🎲'
  ) {
    return <FaDiceD6 className={`${className} text-amber-400`} />;
  }

  if (
    lowerTitle.includes('chess') ||
    lowerIcon.includes('chess') ||
    iconString === '♟️' ||
    iconString === '♟'
  ) {
    return <FaChessKnight className={`${className} text-rose-400`} />;
  }

  if (
    lowerTitle.includes('flow') ||
    lowerTitle.includes('task') ||
    iconString === '⚡'
  ) {
    return <FiZap className={`${className} text-amber-400`} />;
  }

  if (
    lowerTitle.includes('lens') ||
    lowerTitle.includes('dev') ||
    iconString === '🔍'
  ) {
    return <FiCpu className={`${className} text-cyan-400`} />;
  }

  if (lowerCat === 'games' || lowerIcon.includes('game') || iconString === '🎮') {
    return <FaGamepad className={`${className} text-red-400`} />;
  }

  return <FiSmartphone className={`${className} text-red-400`} />;
}
