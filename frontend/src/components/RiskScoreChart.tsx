import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RiskScoreChartProps {
  data: Array<{ name: string; value: number }>;
}

const COLORS = {
  APPROVED: '#10b981',
  MONITOR: '#f59e0b',
  FLAGGED: '#ef4444',
};

// Convert category names to user-friendly labels
const getLabel = (name: string) => {
  switch (name) {
    case 'APPROVED':
      return 'Approved';
    case 'MONITOR':
      return 'Monitor';
    case 'FLAGGED':
      return 'Flagged';
    default:
      return name;
  }
};

export const RiskScoreChart: React.FC<RiskScoreChartProps> = ({ data }) => {
  // Filter out zero values for cleaner chart display
  const filteredData = data.filter((d) => d.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available yet
      </div>
    );
  }

  // Calculate total from filtered data
  const total = filteredData.reduce((sum, item) => sum + item.value, 0);

  // Transform data with user-friendly labels
  const chartData = filteredData.map((item) => ({
    ...item,
    displayName: getLabel(item.name),
  }));

  // Custom tooltip - defined inside component to access total
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = total > 0 ? (data.value / total) : 0;
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{getLabel(data.name)}</p>
          <p className="text-sm">
            <span className="font-medium">Count:</span> {data.value}
          </p>
          <p className="text-sm">
            <span className="font-medium">Percentage:</span>{' '}
            {(percent * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ displayName, percent }) =>
            `${displayName}: ${(percent * 100).toFixed(1)}%`
          }
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => {
            const item = chartData.find((d) => d.name === value);
            return item ? getLabel(value) : value;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
