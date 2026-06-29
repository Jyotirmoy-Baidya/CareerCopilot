'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ProgressChartProps {
  doneSkills:  number;
  totalSkills: number;
}

// Build a simple synthetic weekly progress history from the current numbers
function buildChartData(done: number, total: number) {
  if (total === 0) return [];
  const pct = Math.round((done / total) * 100);
  return [
    { day: 'Mon', progress: Math.max(0, pct - 15) },
    { day: 'Tue', progress: Math.max(0, pct - 12) },
    { day: 'Wed', progress: Math.max(0, pct - 8) },
    { day: 'Thu', progress: Math.max(0, pct - 5) },
    { day: 'Fri', progress: Math.max(0, pct - 2) },
    { day: 'Sat', progress: Math.max(0, pct - 1) },
    { day: 'Today', progress: pct },
  ];
}

export function ProgressChart({ doneSkills, totalSkills }: ProgressChartProps) {
  const data = buildChartData(doneSkills, totalSkills);

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Weekly progress</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip formatter={(v: number) => `${v}%`} />
          <Line
            type="monotone"
            dataKey="progress"
            stroke="#1D9E75"
            strokeWidth={2}
            dot={{ fill: '#1D9E75', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
