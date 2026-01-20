import React, { useEffect, useState } from 'react';
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

const inferCategory = (desc: string) => {
  const d = desc.toLowerCase();
  if (d.includes('uber') || d.includes('taxi') || d.includes('flight')) return 'Transport';
  if (d.includes('rent') || d.includes('apts')) return 'Rent';
  if (d.includes('target') || d.includes('walmart') || d.includes('chipotle') || d.includes('dominos') || d.includes('starbucks') || d.includes('panda') || d.includes('grocery')) return 'Food';
  if (d.includes('bookstore') || d.includes('textbooks')) return 'Books';
  if (d.includes('wire') || d.includes('deposit')) return 'Income';
  if (d.includes('ikea') || d.includes('h&m') || d.includes('amzn')) return 'Shopping';
  return 'Entertainment';
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Rent': return Home;
    case 'Food': return Coffee;
    case 'Transport': return Plane;
    case 'Books': return BookOpen;
    case 'Income': return Wallet;
    default: return CreditCard;
  }
};

const CATEGORY_COLORS: Record<string, string> = {
  Rent: '#4F46E5',
  Food: '#10B981',
  Transport: '#F59E0B',
  Books: '#EF4444',
  Entertainment: '#8B5CF6',
  Shopping: '#EC4899',
  Income: '#6B7280'
};

export const StudentDashboard = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [spendingData, setSpendingData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [dailyAvg, setDailyAvg] = useState(0);

  useEffect(() => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then((data: any[]) => {
        const processedTx = data.map((t, idx) => {
          const cat = inferCategory(t.Description);
          const credit = Number(t.Credit) || 0;
          const debit = Number(t.Debit) || 0;
          const amount = credit + debit;

          return {
             id: idx,
             title: t.Description,
             category: cat,
             amount: amount,
             date: t.Date,
             icon: getCategoryIcon(cat)
          };
        }).reverse();
        
        setTransactions(processedTx.slice(0, 50)); 

        const spendingMap = new Map();
        processedTx.forEach(t => {
           if (t.amount < 0) {
             const dateObj = new Date(t.date);
             const month = dateObj.toLocaleString('default', { month: 'short' });
             spendingMap.set(month, (spendingMap.get(month) || 0) + Math.abs(t.amount));
           }
        });
        
        const newSpendingData = Array.from(spendingMap.entries()).map(([name, spent]) => ({
            name,
            budget: 2000, 
            spent
        }));
        setSpendingData(newSpendingData);

        const catMap = new Map();
        processedTx.forEach(t => {
           if (t.amount < 0) {
              catMap.set(t.category, (catMap.get(t.category) || 0) + Math.abs(t.amount));
           }
        });
        const newCategoryData = Array.from(catMap.entries()).map(([name, value]) => ({
          name,
          value,
          color: CATEGORY_COLORS[name] || '#999'
        }));
        setCategoryData(newCategoryData);
        
        if (data.length > 0) {
           setBalance(data[data.length - 1].Balance);
           const totalS = processedTx.reduce((acc, t) => t.amount < 0 ? acc + Math.abs(t.amount) : acc, 0);
           setTotalSpent(totalS);
           const firstDate = new Date(data[0].Date);
           const lastDate = new Date(data[data.length -1].Date);
           const days = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24));
           setDailyAvg(totalS / days);
        }

      }).catch(e => console.error(e));
  }, []);

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
            <span className="text-lg font-bold text-gray-900 dark:text-white">${balance.toFixed(2)}</span>
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
            amount={`$${totalSpent.toFixed(2)}`} 
            subtext={`${ totalSpent > 0 ? ((totalSpent/2000)*100).toFixed(0) : 0 }% of budget`} 
            icon={CreditCard} 
            trend="" 
            trendUp={false} 
            color="text-orange-600"
          />
          <KpiCard 
            title="Remaining" 
            amount={`$${(2000 - totalSpent).toFixed(2)}`} 
            subtext="Remaining budget" 
            icon={DollarSign} 
            trend="" 
            trendUp={false} 
          />
          <KpiCard 
            title="Daily Avg" 
            amount={`$${dailyAvg.toFixed(2)}`} 
            subtext="Avg Spending" 
            icon={TrendingUp} 
            trend="" 
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
                  <div className="text-xl font-bold text-gray-900 dark:text-white">${totalSpent.toFixed(2)}</div>
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
