import React, { useEffect, useRef } from 'react';

export function Starfield({ count = 200, className = '' }: { count?: number, className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: { x: number, y: number, z: number, o: number, size: number }[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    const init = () => {
      canvas.width = width;
      canvas.height = height;
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width - width / 2,
          y: Math.random() * height - height / 2,
          z: Math.random() * width,
          o: Math.random(),
          size: Math.random() * 1.5 + 0.5
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.z -= 0.5;

        if (star.z <= 0) {
          star.x = Math.random() * width - width / 2;
          star.y = Math.random() * height - height / 2;
          star.z = width;
        }

        const x = (star.x / star.z) * width + width / 2;
        const y = (star.y / star.z) * height + height / 2;
        const radius = (1 - star.z / width) * star.size;

        if (x < 0 || x > width || y < 0 || y > height) continue;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      init();
    };

    window.addEventListener('resize', resize);
    init();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
