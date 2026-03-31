'use client';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: LucideIcon;
}

export function StatCard({ title, value, change, changeType, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-semibold mt-2">{value}</p>
          <div className="flex items-center gap-2 mt-3">
            <span
              className={`text-sm font-medium ${
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change}
            </span>
            <span className="text-gray-500 text-sm">vs last month</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  );
}
