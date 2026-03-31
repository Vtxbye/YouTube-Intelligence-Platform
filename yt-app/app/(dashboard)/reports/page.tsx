'use client';
import { Download, Filter, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const monthlyData = [
  { month: 'Jan', sales: 42000, expenses: 28000, profit: 14000 },
  { month: 'Feb', sales: 51000, expenses: 32000, profit: 19000 },
  { month: 'Mar', sales: 48000, expenses: 30000, profit: 18000 },
  { month: 'Apr', sales: 63000, expenses: 38000, profit: 25000 },
  { month: 'May', sales: 72000, expenses: 42000, profit: 30000 },
  { month: 'Jun', sales: 81000, expenses: 48000, profit: 33000 },
];

const topProducts = [
  { id: 1, name: 'Premium Headphones', sales: 1248, revenue: '$124,800', change: '+12%' },
  { id: 2, name: 'Smart Watch Series 5', sales: 1087, revenue: '$108,700', change: '+8%' },
  { id: 3, name: 'Wireless Earbuds', sales: 956, revenue: '$95,600', change: '+15%' },
  { id: 4, name: 'Laptop Stand Pro', sales: 834, revenue: '$83,400', change: '+5%' },
  { id: 5, name: 'USB-C Hub', sales: 723, revenue: '$72,300', change: '-3%' },
];

const topRegions = [
  { region: 'North America', sales: '$248,500', percentage: 35 },
  { region: 'Europe', sales: '$187,200', percentage: 26 },
  { region: 'Asia Pacific', sales: '$156,800', percentage: 22 },
  { region: 'Latin America', sales: '$78,400', percentage: 11 },
  { region: 'Middle East', sales: '$42,100', percentage: 6 },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view detailed performance reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Calendar className="w-4 h-4" />
            <span>Date Range</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">Total Sales</p>
          <p className="text-2xl font-semibold mt-2">$357,000</p>
          <p className="text-green-600 text-sm mt-2">+18.2% YoY</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">Total Expenses</p>
          <p className="text-2xl font-semibold mt-2">$218,000</p>
          <p className="text-red-600 text-sm mt-2">+12.4% YoY</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">Net Profit</p>
          <p className="text-2xl font-semibold mt-2">$139,000</p>
          <p className="text-green-600 text-sm mt-2">+28.5% YoY</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">Profit Margin</p>
          <p className="text-2xl font-semibold mt-2">38.9%</p>
          <p className="text-green-600 text-sm mt-2">+3.2% YoY</p>
        </div>
      </div>

      {/* Financial Overview Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Financial Overview</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Top Products</h3>
          <div className="space-y-4">
            {topProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.sales} units sold</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{product.revenue}</p>
                  <p
                    className={`text-sm ${
                      product.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {product.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Region */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Sales by Region</h3>
          <div className="space-y-4">
            {topRegions.map((region) => (
              <div key={region.region}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{region.region}</span>
                  <span className="text-sm text-gray-600">{region.sales}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${region.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
