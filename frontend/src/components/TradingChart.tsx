import React, { useEffect, useRef, useState } from "react";

interface HistoryBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingChartProps {
  symbol: string;
  history: HistoryBar[];
  currentPrice: number;
}

export const TradingChart: React.FC<TradingChartProps> = ({ symbol, history, currentPrice }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays (retina screens)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear Canvas
    ctx.fillStyle = "#0c1322"; // Midnight blue background matching theme
    ctx.fillRect(0, 0, width, height);

    // Padding parameters
    const paddingLeft = 10;
    const paddingRight = 60; // Space for price scale
    const paddingTop = 25;
    const paddingBottom = 25; // Space for time scale
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find Price Limits (Min / Max)
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    history.forEach((bar) => {
      if (bar.low < minPrice) minPrice = bar.low;
      if (bar.high > maxPrice) maxPrice = bar.high;
    });

    // Add small buffer to top and bottom
    const priceRange = maxPrice - minPrice;
    minPrice -= priceRange * 0.05 || minPrice * 0.01;
    maxPrice += priceRange * 0.05 || maxPrice * 0.01;

    const priceSpan = maxPrice - minPrice;

    // Drawing Helper Functions
    const getX = (index: number) => {
      return paddingLeft + (index / (history.length - 1)) * chartWidth;
    };

    const getY = (val: number) => {
      return paddingTop + chartHeight - ((val - minPrice) / priceSpan) * chartHeight;
    };

    // Draw Grid Lines (Horizontal & Vertical)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    ctx.font = "10px Outfit, sans-serif";
    ctx.fillStyle = "#64748b";

    // 4 Horizontal gridlines
    for (let i = 0; i <= 4; i++) {
      const p = minPrice + (i / 4) * priceSpan;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + chartWidth, y);
      ctx.stroke();

      // Right-aligned Price text
      ctx.fillText(p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), paddingLeft + chartWidth + 6, y + 3);
    }

    // 5 Vertical gridlines
    const step = Math.floor(history.length / 4);
    for (let i = 0; i < history.length; i += step) {
      if (i >= history.length) break;
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, paddingTop + chartHeight);
      ctx.stroke();

      // Date stamp text
      const date = new Date(history[i].time * 1000);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
      ctx.fillText(timeStr, x - 18, paddingTop + chartHeight + 15);
    }

    if (chartType === "line") {
      // LINE CHART MODE
      // Glowing bottom gradient
      const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.25)");
      gradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(history[0].close));
      for (let i = 1; i < history.length; i++) {
        ctx.lineTo(getX(i), getY(history[i].close));
      }
      // Close path for gradient fills
      ctx.lineTo(getX(history.length - 1), getY(minPrice));
      ctx.lineTo(getX(0), getY(minPrice));
      ctx.fillStyle = gradient;
      ctx.fill();

      // Bold Neon Line
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(history[0].close));
      for (let i = 1; i < history.length; i++) {
        ctx.lineTo(getX(i), getY(history[i].close));
      }
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      // CANDLESTICK CHART MODE
      const candleWidth = (chartWidth / history.length) * 0.7;

      history.forEach((bar, idx) => {
        const x = getX(idx);
        const yOpen = getY(bar.open);
        const yClose = getY(bar.close);
        const yHigh = getY(bar.high);
        const yLow = getY(bar.low);

        const isUp = bar.close >= bar.open;
        ctx.strokeStyle = isUp ? "#10b981" : "#ef4444";
        ctx.fillStyle = isUp ? "#10b981" : "#ef4444";
        ctx.lineWidth = 1.2;

        // Draw wick line
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        // Draw body rectangle
        const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1.5);
        const bodyY = Math.min(yOpen, yClose);
        
        ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
      });
    }

    // Draw Live horizontal indicator dotted line
    const liveY = getY(currentPrice);
    if (liveY >= paddingTop && liveY <= paddingTop + chartHeight) {
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
      ctx.moveTo(paddingLeft, liveY);
      ctx.lineTo(paddingLeft + chartWidth, liveY);
      ctx.stroke();
      ctx.setLineDash([]); // clear dash

      // Price Tag indicator
      ctx.fillStyle = "#10b981";
      ctx.fillRect(paddingLeft + chartWidth + 2, liveY - 9, 54, 18);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px Outfit, sans-serif";
      ctx.fillText(currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), paddingLeft + chartWidth + 6, liveY + 3);
    }

    // Draw Hover Details
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < history.length) {
      const hBar = history[hoverIndex];
      const hX = getX(hoverIndex);
      const hY = getY(hBar.close);

      // Draw crosshair vertical line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hX, paddingTop);
      ctx.lineTo(hX, paddingTop + chartHeight);
      ctx.stroke();

      // Draw crosshair point
      ctx.fillStyle = chartType === "line" ? "#3b82f6" : (hBar.close >= hBar.open ? "#10b981" : "#ef4444");
      ctx.beginPath();
      ctx.arc(hX, hY, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.stroke();

      // Floating Tooltip HUD at the top-left
      ctx.fillStyle = "rgba(13, 21, 39, 0.9)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.fillRect(paddingLeft + 10, paddingTop + 5, 230, 60);
      ctx.strokeRect(paddingLeft + 10, paddingTop + 5, 230, 60);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px Outfit, sans-serif";
      const timeDate = new Date(hBar.time * 1000).toLocaleString();
      ctx.fillText(timeDate, paddingLeft + 18, paddingTop + 18);

      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`O:`, paddingLeft + 18, paddingTop + 34);
      ctx.fillText(`H:`, paddingLeft + 18, paddingTop + 48);
      ctx.fillText(`L:`, paddingLeft + 120, paddingTop + 34);
      ctx.fillText(`C:`, paddingLeft + 120, paddingTop + 48);

      ctx.fillStyle = hBar.close >= hBar.open ? "#10b981" : "#ef4444";
      ctx.fillText(hBar.open.toFixed(2), paddingLeft + 35, paddingTop + 34);
      ctx.fillText(hBar.high.toFixed(2), paddingLeft + 35, paddingTop + 48);
      ctx.fillText(hBar.low.toFixed(2), paddingLeft + 135, paddingTop + 34);
      ctx.fillText(hBar.close.toFixed(2), paddingLeft + 135, paddingTop + 48);
    }

  }, [history, chartType, currentPrice, hoverIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 10;
    const paddingRight = 60;
    const chartWidth = rect.width - paddingLeft - paddingRight;

    // Calculate which index is closest to the mouse X
    const relativeX = x - paddingLeft;
    const pct = relativeX / chartWidth;
    let idx = Math.round(pct * (history.length - 1));

    if (idx < 0) idx = 0;
    if (idx >= history.length) idx = history.length - 1;

    setHoverIndex(idx);
    setHoverPos({ x, y });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setHoverPos(null);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Chart controls */}
      <div style={{
        position: "absolute",
        top: "8px",
        right: "68px",
        display: "flex",
        gap: "6px",
        zIndex: 5
      }}>
        <button
          onClick={() => setChartType("candle")}
          className={`nav-item ${chartType === "candle" ? "active" : ""}`}
          style={{ padding: "4px 8px", fontSize: "0.75rem", minHeight: "auto", border: "1px solid var(--border-subtle)" }}
        >
          Candle
        </button>
        <button
          onClick={() => setChartType("line")}
          className={`nav-item ${chartType === "line" ? "active" : ""}`}
          style={{ padding: "4px 8px", fontSize: "0.75rem", minHeight: "auto", border: "1px solid var(--border-subtle)" }}
        >
          Line
        </button>
      </div>

      <div style={{
        position: "absolute",
        top: "8px",
        left: "12px",
        zIndex: 5,
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>{symbol} Real-time Ticker</span>
        <span className={history[history.length - 1]?.close >= history[history.length - 2]?.close ? "bg-up-pill" : "bg-down-pill"}>
          {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};
