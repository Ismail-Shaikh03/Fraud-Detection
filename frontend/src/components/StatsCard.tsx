import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'green' | 'yellow' | 'red' | 'blue';
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  color = 'blue',
  icon,
}) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-sm mt-1 opacity-70">{subtitle}</p>}
        </div>
        {icon && <div className="text-4xl opacity-50">{icon}</div>}
      </div>
    </div>
  );
};
