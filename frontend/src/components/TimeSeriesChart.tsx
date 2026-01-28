import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimeSeriesDataPoint } from '../types';

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No time series data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
          formatter={(value: number) => [value, '']}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="approved" 
          stroke="#10b981" 
          strokeWidth={2}
          name="Approved"
          dot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="monitor" 
          stroke="#f59e0b" 
          strokeWidth={2}
          name="Monitor"
          dot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="flagged" 
          stroke="#ef4444" 
          strokeWidth={2}
          name="Flagged"
          dot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke="#3b82f6" 
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Total"
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
