
import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  goal: number;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data, goal }) => {
  if (data.length === 0) return null;

  const height = 200;
  const width = 100; // percentages
  const padding = 20;

  const maxValue = Math.max(goal * 1.2, ...data.map(d => d.value));
  
  const normalizeY = (val: number) => {
    const availHeight = height - padding * 2;
    return height - padding - (val / maxValue) * availHeight;
  };

  // Create points for the path
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (100) + '%'; // Distribute horizontally
    const y = normalizeY(d.value);
    return { x, y, val: d.value, label: d.label };
  });

  // Generate SVG Path command
  const pathD = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${parseFloat(p.x) * 4} ${p.y}` // Rough width multiplier for path logic, usually handled by viewBox
  ).join(' ');

  // Since we are using percentages for X in a responsive container, standard SVG paths are tricky.
  // Instead, we'll use a polyline where X is calculated based on fixed viewBox width.
  
  const viewBoxWidth = 400;
  const polyPoints = data.map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * viewBoxWidth;
      const y = normalizeY(d.value);
      return `${x},${y}`;
  }).join(' ');

  // Goal Line Y
  const goalY = normalizeY(goal);

  return (
    <div className="w-full h-[240px] relative select-none">
        <svg width="100%" height="100%" viewBox={`0 0 ${viewBoxWidth} ${height}`} preserveAspectRatio="none" className="overflow-visible">
            
            {/* Grid Lines (Optional) */}
            <line x1="0" y1={goalY} x2={viewBoxWidth} y2={goalY} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

            {/* Goal Label */}
            <text x="0" y={goalY - 5} fill="#64748b" fontSize="10" fontWeight="bold">Goal: {goal}</text>

            {/* Area Fill (Gradient) */}
            <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={`0,${height} ${polyPoints} ${viewBoxWidth},${height}`} fill="url(#chartGradient)" />

            {/* The Line */}
            <polyline points={polyPoints} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data Points */}
            {points.map((_, i) => {
                const x = (i / (data.length - 1 || 1)) * viewBoxWidth;
                const y = normalizeY(data[i].value);
                return (
                    <g key={i}>
                        <circle cx={x} cy={y} r="4" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                        {/* Tooltip/Label on top of point */}
                        {/* Only show label for active points or create interaction later. For now showing labels below */}
                    </g>
                );
            })}
        </svg>
        
        {/* X Axis Labels */}
        <div className="flex justify-between mt-2 px-0 text-xs text-slate-500 font-medium">
            {data.map((d, i) => (
                <div key={i} className="text-center w-8">{d.label}</div>
            ))}
        </div>
    </div>
  );
};

export default AnalyticsChart;
