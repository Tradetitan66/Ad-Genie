import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GalleryGridProps {
  children: ReactNode;
  itemCount: number;
  className?: string;
}

export default function GalleryGrid({
  children,
  itemCount,
  className = '',
}: GalleryGridProps) {
  const gridClasses = (() => {
    if (itemCount === 1) {
      return 'grid-cols-1 max-w-md mx-auto';
    } else if (itemCount === 2) {
      return 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto';
    } else {
      return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  })();

  return (
    <div className={`grid gap-6 ${gridClasses} ${className}`}>
      {children}
    </div>
  );
}

