import React from 'react';

type Props = {
  labels: string[];
  values: number[]; // 0-100
  width?: number;
  height?: number;
};

const BarChart: React.FC<Props> = ({ labels, values, width = 520, height = 160 }) => {
  const max = 100;
  const barWidth = Math.floor(width / values.length) - 12;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Distribución por dimensiones">
      {values.map((v, i) => {
        const barHeight = (v / max) * (height - 40);
        const x = 12 + i * (barWidth + 12);
        const y = height - barHeight - 24;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={6} fill="var(--btn-primary-bg)" />
            <text x={x + barWidth / 2} y={height - 6} fontSize={12} fill="var(--muted)" textAnchor="middle">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
};

export default BarChart;
