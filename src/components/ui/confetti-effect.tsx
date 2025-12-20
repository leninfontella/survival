import { useEffect } from "react";
import confetti from "canvas-confetti";

interface ConfettiEffectProps {
  trigger: boolean;
  type?: "basic" | "stars" | "fireworks" | "cannon" | "realistic";
  duration?: number;
  onComplete?: () => void;
}

// Tipo para as opções customizadas do confetti
interface ConfettiOptions {
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  particleCount?: number;
}

export function ConfettiEffect({
  trigger,
  type = "basic",
  duration = 3000,
  onComplete,
}: ConfettiEffectProps) {
  useEffect(() => {
    if (!trigger) return;

    const end = Date.now() + duration;

    const runConfetti = () => {
      if (Date.now() > end) {
        onComplete?.();
        return;
      }

      switch (type) {
        case "basic":
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          break;

        case "stars":
          confetti({
            particleCount: 15,
            spread: 360,
            startVelocity: 30,
            ticks: 60,
            shapes: ["star"],
            colors: ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"],
          });
          requestAnimationFrame(runConfetti);
          break;

        case "fireworks":
          confetti({
            particleCount: 100,
            startVelocity: 30,
            spread: 360,
            origin: {
              x: Math.random(),
              y: Math.random() - 0.2,
            },
          });
          requestAnimationFrame(runConfetti);
          break;

        case "cannon": {
          const count = 200;
          const defaults = {
            origin: { y: 0.7 },
          };

          function fire(particleRatio: number, opts: ConfettiOptions) {
            confetti({
              ...defaults,
              ...opts,
              particleCount: Math.floor(count * particleRatio),
            });
          }

          fire(0.25, { spread: 26, startVelocity: 55 });
          fire(0.2, { spread: 60 });
          fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
          fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2,
          });
          fire(0.1, { spread: 120, startVelocity: 45 });
          break;
        }

        case "realistic": {
          const count = 200;
          const defaults = {
            origin: { y: 0.7 },
            zIndex: 9999,
          };

          function fire(particleRatio: number, opts: ConfettiOptions) {
            confetti({
              ...defaults,
              ...opts,
              particleCount: Math.floor(count * particleRatio),
            });
          }

          fire(0.25, {
            spread: 26,
            startVelocity: 55,
          });
          fire(0.2, {
            spread: 60,
          });
          fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8,
          });
          fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2,
          });
          fire(0.1, {
            spread: 120,
            startVelocity: 45,
          });

          requestAnimationFrame(runConfetti);
          break;
        }
      }
    };

    runConfetti();

    return () => {
      confetti.reset();
    };
  }, [trigger, type, duration, onComplete]);

  return null;
}
