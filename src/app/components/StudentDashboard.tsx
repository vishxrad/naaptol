import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Coffee, 
  Home, 
  BookOpen, 
  Plane,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import clsx from 'clsx';
// Import the action hook from crayon core
import { useThreadActions } from "@crayonai/react-core";

// --- Utility Functions ---

const inferCategory = (desc: string) => {
  const d = desc.toLowerCase();
  if (d.includes('uber') || d.includes('taxi') || d.includes('flight')) return 'Transport';
  if (d.includes('rent') || d.includes('apts')) return 'Rent';
  if (d.includes('target') || d.includes('walmart') || d.includes('chipotle') || d.includes('dominos') || d.includes('starbucks') || d.includes('panda') || d.includes('grocery') || d.includes('trader') || d.includes('whole foods')) return 'Food';
  if (d.includes('bookstore') || d.includes('textbooks') || d.includes('chegg')) return 'Books';
  if (d.includes('wire') || d.includes('deposit')) return 'Income';
  if (d.includes('ikea') || d.includes('h&m') || d.includes('amzn') || d.includes('nike')) return 'Shopping';
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

// --- Calendar Component ---

const CalendarView = ({ transactions, onDateClick }: { transactions: any[], onDateClick: (date: string) => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && transactions.length > 0) {
      const latestTx = transactions.reduce((latest, tx) => {
        const txDate = new Date(tx.date);
        return !latest || txDate > latest ? txDate : latest;
      }, null as Date | null);

      if (latestTx) {
        setCurrentDate(latestTx);
      }
      setIsInitialized(true);
    }
  }, [transactions, isInitialized]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthYearString = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const txByDate = transactions.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {} as Record<string, any[]>);

  const renderCalendarCells = () => {
    const cells = [];
    
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[100px] bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${monthStr}/${dayStr}/${currentDate.getFullYear()}`;
      
      const dayTx = txByDate[dateKey] || [];
      const totalSpent = dayTx.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);
      const totalIncome = dayTx.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0);

      cells.push(
        <div 
          key={day} 
          onClick={() => onDateClick(dateKey)}
          className="min-h-[100px] p-2 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700/80 transition-all cursor-pointer relative group"
        >
          <div className="flex justify-between items-start mb-1">
            <span className={clsx("text-sm font-semibold h-6 w-6 flex items-center justify-center rounded-full transition-colors", 
              dayTx.length > 0 ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white group-hover:bg-blue-100 dark:group-hover:bg-blue-900" : "text-gray-500")}>
              {day}
            </span>
            {dayTx.length > 0 && (
              <div className="text-[10px] font-medium flex flex-col items-end">
                {totalIncome > 0 && <span className="text-green-600">+{totalIncome.toFixed(0)}</span>}
                {totalSpent > 0 && <span className="text-red-500">-{totalSpent.toFixed(0)}</span>}
              </div>
            )}
          </div>
          
          <div className="space-y-1 mt-1">
            {dayTx.map((tx, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-300 truncate" title={`${tx.title} ($${tx.amount})`}>
                <div className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", tx.amount > 0 ? "bg-green-500" : "bg-indigo-500")} />
                <span className="truncate">{tx.title}</span>
              </div>
            ))}
          </div>
          
           {/* Hover Action Hint */}
           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-white/60 dark:bg-black/40 backdrop-blur-[1px]">
            <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-sm flex items-center gap-1">
               <MessageSquare size={12} />
               <span>Ask Copilot</span>
            </div>
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard size={20} className="text-indigo-500"/> 
          Transaction Calendar
        </h3>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-gray-900 dark:text-white w-32 text-center select-none">{monthYearString}</span>
          <div className="flex bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-0.5">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md text-gray-600 dark:text-gray-300 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="w-px bg-gray-200 dark:bg-gray-600 mx-0.5" />
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md text-gray-600 dark:text-gray-300 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div className="grid grid-cols-7 border-t border-l border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
          {renderCalendarCells()}
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard ---

export const StudentDashboard = ({ onOpenChat }: { onOpenChat?: () => void }) => {
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [dailyAvg, setDailyAvg] = useState(0);

  // Hook to control the chat
  const { processMessage } = useThreadActions();

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
        });
        
        setAllTransactions(processedTx);
        
        if (data.length > 0) {
           setBalance(data[data.length - 1].Balance);
           const totalS = processedTx.reduce((acc, t) => t.amount < 0 ? acc + Math.abs(t.amount) : acc, 0);
           setTotalSpent(totalS);
           const firstDate = new Date(data[0].Date);
           const lastDate = new Date(data[data.length -1].Date);
           const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
           const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))); 
           setDailyAvg(totalS / diffDays);
        }

      }).catch(e => console.error("Failed to load transactions", e));
  }, []);

  const handleDateClick = (dateStr: string) => {
    // 1. Filter data for context
    const txForDate = allTransactions.filter(t => t.date === dateStr);
    
    // 2. Construct Prompt
    let prompt = `Analyze my financial activity on ${dateStr}.`;
    if (txForDate.length > 0) {
      prompt += ` I had ${txForDate.length} transactions:\n`;
      prompt += txForDate.map(t => `- ${t.title}: ${t.amount > 0 ? '+' : ''}$${t.amount}`).join('\n');
    } else {
      prompt += " I don't see any transactions for this specific day.";
    }

    // 3. Send to Chatbot
    processMessage({
      type: 'prompt',
      role: 'user',
      message: prompt
    });

    // 4. Open the Chat Tray
    if (onOpenChat) onOpenChat();
  };

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

        {/* Calendar Section */}
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CalendarView transactions={allTransactions} onDateClick={handleDateClick} />
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