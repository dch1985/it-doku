/**
 * StatsCard Component
 * Wiederverwendbare Statistik-Karte mit Dark Mode
 */

import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    gradient: 'from-green-500 to-green-600 dark:from-green-400 dark:to-green-500',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    gradient: 'from-yellow-500 to-yellow-600 dark:from-yellow-400 dark:to-yellow-500',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    gradient: 'from-red-500 to-red-600 dark:from-red-400 dark:to-red-500',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-600',
    gradient: 'from-gray-500 to-gray-600 dark:from-gray-400 dark:to-gray-500',
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
}) => {
  const colors = colorClasses[color];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
            <span className="text-3xl">{icon}</span>
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              <svg
                className={`w-4 h-4 ${trend.isPositive ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${colors.gradient}`} />
    </div>
  );
};

export default StatsCard;
