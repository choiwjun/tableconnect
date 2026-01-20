'use client';

import { useState, useEffect, useRef } from 'react';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number; opacity: number }>>([]);
  const [isClicking, setIsClicking] = useState(false);
  const trailIdRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      if (isClicking) {
        // Add trail point on click
        setTrail((prev) => [
          ...prev,
          { x: e.clientX, y: e.clientY, id: trailIdRef.current++, opacity: 0.8 },
        ]);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const animate = () => {
      setTrail((prevTrail) => {
        let needsUpdate = false;

        const newTrail = prevTrail
          .map((point) => {
            const newPoint = { ...point, opacity: point.opacity - 0.02 };
            if (newPoint.opacity <= 0) {
              needsUpdate = true;
              return null; // Remove faded points
            }
            return newPoint;
          })
          .filter((point): point is { x: number; y: number; id: number; opacity: number } => point !== null);

        if (needsUpdate) {
          return newTrail;
        }
        return prevTrail;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isClicking]);

  return (
    <>
      {/* Custom cursor */}
      <div
        className="fixed pointer-events-none z-[9999] hidden md:block"
        style={{
          left: position.x - 12,
          top: position.y - 12,
        }}
      >
        <div className="w-6 h-6 relative">
          {/* Main cursor */}
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff0080"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
          
          {/* Glow effect */}
          <div
            className="absolute inset-0 blur-sm opacity-50"
            style={{
              background: 'radial-gradient(circle, #ff0080 0%, transparent 70%)',
              animation: 'cursorPulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Trail */}
      {trail.map((point) => (
        <div
          key={point.id}
          className="fixed pointer-events-none z-[9998] hidden md:block"
          style={{
            left: point.x - 10,
            top: point.y - 10,
            opacity: point.opacity,
            transition: 'opacity 0.3s ease-out',
          }}
        >
          <div
            className="w-4 h-4"
            style={{
              background: 'radial-gradient(circle, #ff0080 0%, transparent 70%)',
              animation: 'trailFade 0.5s ease-out forwards',
            }}
          />
        </div>
      ))}

      {/* Cursor trail click effect */}
      {trail.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[9997] hidden md:block" />
      )}

      <style jsx>{`
        @keyframes cursorPulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes trailFade {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
