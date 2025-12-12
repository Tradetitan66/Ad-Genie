import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
}

export default function Card({
  children,
  className = '',
  hover = false,
  onClick,
  variant = 'default',
}: CardProps) {
  const baseClasses = 'bg-white rounded-lg';
  
  const variantClasses = {
    default: 'shadow-md',
    outlined: 'border-2 border-genie-neutral-200 shadow-sm',
    elevated: 'shadow-lg',
  };

  const hoverClasses = hover || onClick ? 'hover:shadow-xl transition-shadow cursor-pointer' : '';

  const Component = onClick ? motion.div : 'div';
  const motionProps = onClick
    ? {
        whileHover: { scale: 1.02, y: -2 },
        whileTap: { scale: 0.98 },
        onClick,
      }
    : {};

  return (
    <Component
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      {...motionProps}
    >
      {children}
    </Component>
  );
}

