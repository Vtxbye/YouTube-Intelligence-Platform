'use client';

import { StatCard } from './StatCard';
import { TrendingUp, Users, ShoppingCart, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';


const revenueData = [
  { month: 'Jan', Ozempic: 4200, Steroids: 2400 },
  { month: 'Feb', Ozempic: 5100, Steroids: 2800 },
  { month: 'Mar', Ozempic: 4800, Steroids: 2600 },
  { month: 'Apr', Ozempic: 6300, Steroids: 3400 },
  { month: 'May', Ozempic: 7200, Steroids: 4100 },
  { month: 'Jun', Ozempic: 8100, Steroids: 4800 },
  { month: 'Jul', Ozempic: 10300, Steroids: 4500 },
];

// Calculate current month (last item) and last month (second to last item)
const currentMonthData = revenueData[revenueData.length - 1];
const lastMonthData = revenueData[revenueData.length - 2];

const topicGrowth = [
  { 
    topic: 'Exercise Routine', 
    lastMonth: lastMonthData.Ozempic, 
    currentMonth: currentMonthData.Ozempic, 
    change: currentMonthData.Ozempic - lastMonthData.Ozempic, 
    percentage: parseFloat((((currentMonthData.Ozempic - lastMonthData.Ozempic) / lastMonthData.Ozempic) * 100).toFixed(1)),
    color: '#3b82f6'
  },
  { 
    topic: 'Mental Health', 
    lastMonth: lastMonthData.Steroids, 
    currentMonth: currentMonthData.Steroids, 
    change: currentMonthData.Steroids - lastMonthData.Steroids, 
    percentage: parseFloat((((currentMonthData.Steroids - lastMonthData.Steroids) / lastMonthData.Steroids) * 100).toFixed(1)),
    color: '#10b981'
  },
];

const trendingTopics = [
  {
    name: 'Exercise Routine',
    color: 'bg-blue-600',
    description: 'Structured physical activity to improve fitness and overall health.',
    slug: 'exercise-routine'
  },
  {
    name: 'Mental Health',
    color: 'bg-green-600',
    description: 'Emotional wellbeing, mood regulation, and cognitive function.',
    slug: 'mental-health'
  },
  {
    name: 'Stress Management',
    color: 'bg-orange-600',
    description: 'Techniques for reducing physical and psychological stress.',
    slug: 'stress-management'
  },
  {
    name: 'Sleep Hygiene',
    color: 'bg-red-600',
    description: 'Habits that improve sleep quality and recovery.',
    slug: 'sleep-hygiene'
  },
  {
    name: 'Healthy Diet',
    color: 'bg-indigo-600',
    description: 'Balanced eating patterns that support overall health.',
    slug: 'healthy-diet'
  },
  {
    name: 'Nutrition Tips',
    color: 'bg-pink-600',
    description: 'Nutrients and dietary strategies that support body function.',
    slug: 'nutrition-tips'
  },
  {
    name: 'Weight Loss Tips',
    color: 'bg-yellow-600',
    description: 'Strategies for reducing body fat and improving metabolism.',
    slug: 'weight-loss-tips'
  },
  {
    name: 'Gut Health',
    color: 'bg-teal-600',
    description: 'Digestive health and microbiome balance.',
    slug: 'gut-health'
  },
  {
    name: 'Immune System',
    color: 'bg-purple-600',
    description: 'Supporting the body’s ability to fight illness.',
    slug: 'immune-system'
  },
  {
    name: 'Wellness Habits',
    color: 'bg-cyan-600',
    description: 'Daily behaviors that support long-term health.',
    slug: 'wellness-habits'
  },
];



export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-black font-semibold">Dashboard Overview</h1>
        <p className="text-black mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column - Trends */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-black">Trending Topics</h2>
              <p className="text-black text-sm">Controversial & experimental health topics</p>
            </div>
          </div>

          <ul className="space-y-3">
            {trendingTopics.map((topic) => (
              <li key={topic.name}>
                <Link 
                  href={`/topic/${topic.slug}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors block"
                >
                  <div className={`w-2 h-2 rounded-full ${topic.color} mt-2 flex-shrink-0`}></div>
                  <div>
                    <span className="text-gray-700 font-medium">{topic.name}</span>
                    <p className="text-gray-500 text-sm">{topic.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column - Line graph and growth rate */}
        <div className="space-y-6">
          {/* Line Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 text-black">Topics over time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Ozempic"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Steroids"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Topic Growth Rate */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg text-black">Topic Growth Rate</h2>
                <p className="text-black text-sm">Month-over-month comparison</p>
              </div>
            </div>

            <div className="space-y-6">
              {topicGrowth.map((item) => (
                <div key={item.topic} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <h3 className="font-semibold">{item.topic}</h3>
                    </div>
                    <div className={`flex items-center gap-1 ${item.percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.percentage >= 0 ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                      <span className="font-semibold">{Math.abs(item.percentage)}%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-black mb-1">Last Month</p>
                      <p className="text-xl font-semibold">{item.lastMonth.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-black mb-1">Current Month</p>
                      <p className="text-xl font-semibold">{item.currentMonth.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-black mb-1">Change</p>
                      <p className={`text-xl font-semibold ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}