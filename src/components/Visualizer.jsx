import { useEffect, useRef } from "react";

export default function Visualizer({
  analyser,
  colors = ["#8b5cf6", "#ec4899"]
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let rafId;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(
        1,
        canvas.clientWidth * dpr
      );

      canvas.height = Math.max(
        1,
        canvas.clientHeight * dpr
      );
    };

    resize();

    window.addEventListener("resize", resize);

    const data = analyser
      ? new Uint8Array(analyser.frequencyBinCount)
      : null;

    const BARS = 56;

    const draw = () => {
      rafId = requestAnimationFrame(draw);

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (analyser && data) {
        analyser.getByteFrequencyData(data);
      }

      const gradient = ctx.createLinearGradient(
        0,
        h,
        0,
        0
      );

      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);

      ctx.fillStyle = gradient;

      const slot = w / BARS;
      const barWidth = slot * 0.55;

      for (let i = 0; i < BARS; i++) {

        const index = data
          ? Math.floor(
              (i * data.length * 0.72) / BARS
            )
          : 0;

        const value = data
          ? data[index] / 255
          : 0.08 +
            Math.abs(
              Math.sin(Date.now() / 380 + i * 0.42)
            ) * 0.12;

        const barHeight = Math.max(
          3,
          value * h * 0.92
        );

        const x =
          i * slot + (slot - barWidth) / 2;

        ctx.beginPath();

        ctx.roundRect(
          x,
          h - barHeight,
          barWidth,
          barHeight,
          barWidth / 2
        );

        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(rafId);

      window.removeEventListener(
        "resize",
        resize
      );
    };

  }, [analyser, colors]);

  return (
    <canvas
      ref={canvasRef}
      className="visualizer"
      aria-label="Audio visualizer"
    />
  );
}