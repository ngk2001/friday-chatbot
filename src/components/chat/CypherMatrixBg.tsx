"use client";

import { useEffect, useRef } from "react";

interface CypherMatrixBgProps {
  enabled?: boolean;
}

export default function CypherMatrixBg({ enabled = true }: CypherMatrixBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    const chars = "01ABCDEF#$%@*&<>/{}[]アイウエオカキクケコ";
    const fontSize = 14;
    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () =>
        Math.floor(Math.random() * (canvas.height / fontSize))
      );
    };

    resize();
    window.addEventListener("resize", resize);

    let lastFrame = 0;
    const draw = (time: number) => {
      animationId = requestAnimationFrame(draw);
      if (document.hidden || time - lastFrame < 75) return;
      lastFrame = time;

      ctx.fillStyle = "rgba(2, 6, 13, 0.14)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const isCyan = Math.random() > 0.78;
        ctx.fillStyle = isCyan
          ? "rgba(34, 211, 238, 0.45)"
          : "rgba(16, 185, 129, 0.42)";
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-20"
    />
  );
}
