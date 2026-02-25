'use client';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

const trafficData = [
  { date: '01/02', organic: 2400, direct: 1400, social: 800, referral: 600 },
  { date: '01/03', organic: 2800, direct: 1600, social: 950, referral: 700 },
  { date: '01/04', organic: 2600, direct: 1500, social: 900, referral: 650 },
  { date: '01/05', organic: 3200, direct: 1800, social: 1100, referral: 800 },
  { date: '01/06', organic: 3800, direct: 2100, social: 1300, referral: 950 },
  { date: '01/07', organic: 3400, direct: 1900, social: 1200, referral: 850 },
  { date: '01/08', organic: 4100, direct: 2300, social: 1500, referral: 1100 },
];

const deviceData = [
  { name: 'Desktop', value: 4800, color: '#3b82f6' },
  { name: 'Mobile', value: 3200, color: '#8b5cf6' },
  { name: 'Tablet', value: 1200, color: '#10b981' },
];

const conversionData = [
  { month: 'Jan', rate: 2.4 },
  { month: 'Feb', rate: 2.8 },
  { month: 'Mar', rate: 3.1 },
  { month: 'Apr', rate: 2.9 },
  { month: 'May', rate: 3.5 },
  { month: 'Jun', rate: 3.8 },
  { month: 'Jul', rate: 4.2 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-gray-600 mt-1">Detailed insights into your data performance.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Page Views</p>
              <p className="text-2xl font-semibold mt-1">127,459</p>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-medium">15.3%</span>
            </div>
          </div>
          <div className="mt-4 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData}>
                <Line type="monotone" dataKey="organic" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg. Session</p>
              <p className="text-2xl font-semibold mt-1">4:32</p>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-medium">8.1%</span>
            </div>
          </div>
          <div className="mt-4 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData}>
                <Line type="monotone" dataKey="direct" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Bounce Rate</p>
              <p className="text-2xl font-semibold mt-1">42.8%</p>
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <ArrowDown className="w-4 h-4" />
              <span className="text-sm font-medium">3.2%</span>
            </div>
          </div>
          <div className="mt-4 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData}>
                <Line type="monotone" dataKey="social" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Sources */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="organic" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="direct" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="social" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="referral" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Device Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Device Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3 mt-4">
            {deviceData.map((device) => (
              <div key={device.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: device.color }}
                  ></div>
                  <span className="text-sm">{device.name}</span>
                </div>
                <span className="text-sm font-medium">{device.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion Rate */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Conversion Rate Trend</h3>
          <div className="flex items-center gap-2 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">+0.8% this month</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={conversionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
