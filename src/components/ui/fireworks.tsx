import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface FireworksProps {
  active: boolean;
  count?: number;
  duration?: number;
}

export function Fireworks({
  active,
  count = 5,
  duration = 5000,
}: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
    }> = [];

    const colors = [
      "#FF0080",
      "#00FF80",
      "#8000FF",
      "#FF8000",
      "#00FFFF",
      "#FFFF00",
      "#FF0080",
    ];

    function createFirework(x: number, y: number) {
      const particleCount = 50 + Math.random() * 50;
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 2 + Math.random() * 3;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 1,
          maxLife: 0.8 + Math.random() * 0.4,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 2,
        });
      }
    }

    let frameCount = 0;
    const startTime = Date.now();

    function animate() {
      if (!ctx || !canvas) return;

      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Criar novos fogos periodicamente
      if (frameCount % 60 === 0 && Date.now() - startTime < duration) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.5);
        createFirework(x, y);
      }

      // Atualizar e desenhar partículas
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.life -= 0.01;
        p.vy += 0.05; // gravidade
        p.x += p.vx;
        p.y += p.vy;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      frameCount++;

      if (Date.now() - startTime < duration || particles.length > 0) {
        requestAnimationFrame(animate);
      }
    }

    // Criar fogos iniciais
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.5);
        createFirework(x, y);
      }, i * 500);
    }

    animate();

    return () => {
      particles.length = 0;
    };
  }, [active, count, duration]);

  if (!active) return null;

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  );
}
