import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Coffee, 
  Home, 
  BookOpen, 
  Plane 
} from 'lucide-react';
import clsx from 'clsx';

const spendingData = [
  { name: 'Sep', budget: 2000, spent: 1800 },
  { name: 'Oct', budget: 2000, spent: 2100 },
  { name: 'Nov', budget: 2000, spent: 1750 },
  { name: 'Dec', budget: 2500, spent: 2400 },
  { name: 'Jan', budget: 2000, spent: 1600 },
];

const categoryData = [
  { name: 'Rent', value: 1200, color: '#4F46E5' },
  { name: 'Food', value: 450, color: '#10B981' },
  { name: 'Transport', value: 150, color: '#F59E0B' },
  { name: 'Books', value: 200, color: '#EF4444' },
  { name: 'Entertainment', value: 300, color: '#8B5CF6' },
];

const transactions = [
  { id: 1, title: 'Grocery Store', category: 'Food', amount: -45.50, date: 'Today', icon: Coffee },
  { id: 2, title: 'Monthly Rent', category: 'Rent', amount: -1200.00, date: 'Yesterday', icon: Home },
  { id: 3, title: 'Textbooks', category: 'Books', amount: -120.00, date: 'Jan 15', icon: BookOpen },
  { id: 4, title: 'Flight Ticket', category: 'Travel', amount: -350.00, date: 'Jan 10', icon: Plane },
  { id: 5, title: 'Part-time Work', category: 'Income', amount: +600.00, date: 'Jan 05', icon: Wallet },
];

export const StudentDashboard = () => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Fund Tracker</h1>
            <p className="text-gray-500 dark:text-gray-400">Welcome back, Alex</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Current Balance:</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">$3,450.00</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Total Budget" 
            amount="$2,000" 
            subtext="Monthly Limit" 
            icon={Wallet} 
            trend="+0%" 
            trendUp={true} 
          />
          <KpiCard 
            title="Total Spent" 
            amount="$1,450" 
            subtext="72% of budget" 
            icon={CreditCard} 
            trend="+12%" 
            trendUp={false} 
            color="text-orange-600"
          />
          <KpiCard 
            title="Remaining" 
            amount="$550" 
            subtext="For 10 days" 
            icon={DollarSign} 
            trend="-5%" 
            trendUp={false} 
          />
          <KpiCard 
            title="Daily Avg" 
            amount="$48.33" 
            subtext="Target: $65.00" 
            icon={TrendingUp} 
            trend="-15%" 
            trendUp={true} 
            color="text-green-600"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart: Spending vs Budget */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget vs Spending</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="budget" name="Budget" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Spent" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Chart: Categories */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h3>
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="text-sm text-gray-500">Total</span>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">$2,300</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                  <div className={clsx("p-3 rounded-full", tx.amount > 0 ? "bg-green-100 text-green-600" : "bg-indigo-50 text-indigo-600")}>
                    <tx.icon size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{tx.title}</p>
                    <p className="text-sm text-gray-500">{tx.category} • {tx.date}</p>
                  </div>
                </div>
                <span className={clsx("font-semibold", tx.amount > 0 ? "text-green-600" : "text-gray-900 dark:text-white")}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

const KpiCard = ({ title, amount, subtext, icon: Icon, trend, trendUp, color }: any) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className={clsx("text-2xl font-bold mt-1 mb-1", color || "text-gray-900 dark:text-white")}>{amount}</h3>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Icon size={20} className="text-gray-600 dark:text-gray-300" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
          {trend}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{subtext}</span>
      </div>
    </div>
  );
};
