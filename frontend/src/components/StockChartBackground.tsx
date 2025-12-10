import React, { useMemo } from 'react';
import './StockChartBackground.css';

interface Point {
  x: number;
  y: number;
  type: 'blue' | 'red';
}

const StockChartBackground: React.FC = () => {
  // Generate a realistic stock price path
  const { pathData, points } = useMemo(() => {
    const width = 1200;
    const height = 200;
    const padding = 20;

    // Generate stock-like price movement
    const numPoints = 60;
    const prices: number[] = [];
    let price = 100;

    for (let i = 0; i < numPoints; i++) {
      // Random walk with slight upward bias
      const change = (Math.random() - 0.48) * 8;
      price = Math.max(60, Math.min(140, price + change));
      prices.push(price);
    }

    // Normalize prices to SVG coordinates
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const coordinates = prices.map((p, i) => ({
      x: padding + (i / (numPoints - 1)) * (width - 2 * padding),
      y: padding + ((maxPrice - p) / priceRange) * (height - 2 * padding)
    }));

    // Create SVG path
    let path = `M ${coordinates[0].x} ${coordinates[0].y}`;
    for (let i = 1; i < coordinates.length; i++) {
      path += ` L ${coordinates[i].x} ${coordinates[i].y}`;
    }

    // Select 10 points along the path for dots (must be ON the line)
    const dotIndices = [5, 12, 18, 24, 30, 36, 42, 48, 52, 57];
    const selectedPoints: Point[] = dotIndices.map((idx, i) => ({
      x: coordinates[idx].x,
      y: coordinates[idx].y,
      // Alternate blue and red, with some randomness
      type: i % 3 === 0 ? 'red' : 'blue'
    }));

    return { pathData: path, points: selectedPoints };
  }, []);

  // Generate grid lines
  const gridLines = useMemo(() => {
    const horizontal = [];
    const vertical = [];

    // Horizontal lines
    for (let i = 0; i <= 5; i++) {
      horizontal.push(20 + i * 32);
    }

    // Vertical lines
    for (let i = 0; i <= 12; i++) {
      vertical.push(20 + i * 96.67);
    }

    return { horizontal, vertical };
  }, []);

  return (
    <div className="stock-chart-background">
      <svg
        viewBox="0 0 1200 200"
        preserveAspectRatio="xMidYMid slice"
        className="chart-svg"
      >
        {/* Grid lines */}
        <g className="grid-lines">
          {gridLines.horizontal.map((y, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={y}
              x2="1200"
              y2={y}
              className="grid-line"
            />
          ))}
          {gridLines.vertical.map((x, i) => (
            <line
              key={`v-${i}`}
              x1={x}
              y1="0"
              x2={x}
              y2="200"
              className="grid-line"
            />
          ))}
        </g>

        {/* Stock price line with drawing animation */}
        <path
          d={pathData}
          className="stock-line"
          fill="none"
        />

        {/* Dots on the line with pop animation */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="6"
            className={`chart-dot ${point.type}-dot dot-${index}`}
          />
        ))}
      </svg>
    </div>
  );
};

export default StockChartBackground;
