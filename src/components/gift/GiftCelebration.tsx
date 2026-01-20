'use client';

import { useEffect, useState } from 'react';

interface GiftCelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

export function GiftCelebration({ show, onComplete }: GiftCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; top: number; color: string; rotation: number }>>([]);

  useEffect(() => {
    if (!show) {
      setConfetti([]);
      return;
    }

    // Generate confetti particles
    const colors = ['#ff0080', '#00ffff', '#b300ff', '#ccff00', '#ff6600'];
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: -20 - Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
    }));

    setConfetti(newConfetti);

    // Clean up after animation
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Confetti particles */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="fixed w-3 h-3"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            backgroundColor: particle.color,
            animation: 'confettiFall 3s ease-out forwards',
            transform: `rotate(${particle.rotation}deg)`,
          }}
        />
      ))}

      {/* Celebration message */}
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-center">
          {/* Gift emoji */}
          <div
            className="text-8xl mb-4 animate-bounce"
            style={{ animationDuration: '0.5s' }}
          >
            🎁
          </div>
          
          {/* Celebration text */}
          <p className="font-display text-4xl text-neon-pink font-bold text-glow">
            축하합니다!
          </p>
          <p className="text-xl text-soft-white mt-2">
            선물이 도착했어요! ✨
          </p>
        </div>
      </div>

      {/* Sparkles */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 text-neon-cyan text-2xl"
            style={{
              left: `${50 + Math.cos(i * 45 * Math.PI / 180) * 60}%`,
              top: `${50 + Math.sin(i * 45 * Math.PI / 180) * 60}%`,
              animation: `sparkle 1.5s ease-in-out ${i * 0.1}s infinite`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-bounce {
          animation: bounce 0.5s ease-in-out infinite;
        }

        .text-glow {
          text-shadow:
            0 0 10px rgba(255, 0, 128, 0.5),
            0 0 20px rgba(255, 0, 128, 0.3),
            0 0 40px rgba(255, 0, 128, 0.1);
        }
      `}</style>
    </div>
  );
}
