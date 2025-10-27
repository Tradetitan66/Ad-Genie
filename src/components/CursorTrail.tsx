import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Sparkle {
  id: number;
  x: number;
  y: number;
}

export default function CursorTrail() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    let counter = 0;
    let lastTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      if (currentTime - lastTime < 50) return;

      lastTime = currentTime;
      counter++;

      const newSparkle: Sparkle = {
        id: counter,
        x: e.clientX,
        y: e.clientY,
      };

      setSparkles((prev) => [...prev.slice(-8), newSparkle]);

      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id));
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute',
              left: sparkle.x - 4,
              top: sparkle.y - 4,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" fill="#F59E0B" opacity="0.8" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
