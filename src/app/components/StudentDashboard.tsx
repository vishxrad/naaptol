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
  MessageSquare,
  Sparkles,      // Added for Wrapped Banner
  ArrowRight     // Added for Wrapped Banner
} from 'lucide-react';
import clsx from 'clsx';
import { useThreadActions } from "@crayonai/react-core";
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import * as apiClient from "@/apiClient";

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

// --- Components ---

const WrappedBanner = ({ onWatchNow, isGenerating }: { onWatchNow: () => void, isGenerating: boolean }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 p-6 shadow-lg text-white mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
          <span className="font-bold tracking-wide uppercase text-xs opacity-90">2025 Wrapped</span>
        </div>
        <h2 className="text-2xl font-bold mb-1">Your Spending Year in Review</h2>
        <p className="text-white/90 text-sm max-w-md">
          Discover your top cravings, wildest weekends, and where all that money actually went.
        </p>
      </div>
      <button onClick={onWatchNow} disabled={isGenerating} className="group px-5 py-2.5 bg-white text-indigo-600 font-bold rounded-full hover:bg-indigo-50 transition-all shadow-md active:scale-95 text-sm whitespace-nowrap flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
        {isGenerating ? "Generating..." : "Watch Now"}
        <ArrowRight size={16} className={`group-hover:translate-x-1 transition-transform ${isGenerating ? 'animate-spin' : ''}`} />
      </button>
    </div>
    
    {/* Decorative Elements */}
    <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl pointer-events-none" />
  </div>
);

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
    
    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[150px] bg-gray-50/30 dark:bg-gray-800/20 border border-dashed border-gray-100 dark:border-gray-800" />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${monthStr}/${dayStr}/${currentDate.getFullYear()}`;
      
      const dayTx = txByDate[dateKey] || [];
      const totalSpent = dayTx.reduce((sum: number, t: { amount: number }) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);
      const totalIncome = dayTx.reduce((sum: number, t: { amount: number }) => t.amount > 0 ? sum + t.amount : sum, 0);

      // Limit to 4 icons now since they are larger
      const displayTx = dayTx.slice(0, 4); 
      const remainingTx = dayTx.length - 4;
      const hasActivity = dayTx.length > 0;

      cells.push(
        <div 
          key={day} 
          onClick={() => onDateClick(dateKey)}
          className={clsx(
            "min-h-[150px] p-3 border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 transition-all duration-300 relative group flex flex-col justify-between overflow-hidden",
            hasActivity 
              ? "cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-800 hover:z-10 rounded-2xl" 
              : "opacity-60 hover:opacity-100"
          )}
        >
          {/* Top Row: Date & Sparkle */}
          <div className="flex justify-between items-start z-10">
            <span className={clsx(
              "text-sm font-bold flex items-center justify-center rounded-full w-8 h-8 transition-colors", 
              hasActivity 
                ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white group-hover:bg-indigo-600 group-hover:text-white" 
                : "text-gray-400"
            )}>
              {day}
            </span>

            {/* AI Analyze Hint */}
            {hasActivity && (
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full text-indigo-600 dark:text-indigo-400 shadow-sm">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
              </div>
            )}
          </div>

          {/* Middle: HERO DATA - Centered & Large */}
          <div className="flex flex-col items-center justify-center gap-1 my-2 z-10">
            {totalSpent > 0 && (
              <div className="flex items-start">
                 <span className="text-gray-400 font-medium text-xs mt-1 mr-0.5">$</span>
                 <span className="text-3xl font-black text-gray-800 dark:text-white tracking-tighter shadow-sm">
                   {totalSpent.toFixed(0)}
                 </span>
              </div>
            )}
            
            {totalIncome > 0 && (
               <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                 +{totalIncome.toFixed(0)} Income
               </span>
            )}

            {!totalSpent && !totalIncome && hasActivity && (
              <span className="text-xs text-gray-400 italic">No Impact</span>
            )}
          </div>
          
          {/* Bottom: Stacked Logos/Icons (ENHANCED SIZE) */}
          {hasActivity && (
            <div className="h-10 flex items-end justify-center z-10 pb-1">
              <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300">
                {displayTx.map((tx: any, idx: number) => {
                  const IconComponent = tx.icon;
                  return (
                    <div 
                      key={idx} 
                      className={clsx(
                        "w-9 h-9 rounded-full flex items-center justify-center border-[2.5px] border-white dark:border-gray-800 transition-transform hover:scale-110 hover:z-20 shadow-sm",
                        tx.amount > 0 ? "bg-green-100 text-green-700" : "bg-indigo-50 text-indigo-600"
                      )}
                      title={`${tx.title} ($${tx.amount})`}
                    >
                      <IconComponent size={16} strokeWidth={2.5} />
                    </div>
                  );
                })}
                {remainingTx > 0 && (
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 border-[2.5px] border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-extrabold text-gray-500 z-0">
                    +{remainingTx}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Decorative Gradient Background on Hover */}
          {hasActivity && (
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-indigo-50/40 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          )}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard size={24} className="text-indigo-600"/> 
            Transaction Calendar
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review your daily spending habits</p>
        </div>
        
        <div className="flex items-center gap-6 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-2xl">
          <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-all shadow-sm hover:shadow">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-gray-900 dark:text-white w-32 text-center select-none text-lg">{monthYearString}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-all shadow-sm hover:shadow">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      {/* Grid */}
      <div className="p-6 bg-gray-50/50 dark:bg-gray-900/20">
        <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-widest">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {renderCalendarCells()}
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard ---

export const StudentDashboard = ({ onOpenChat }: { onOpenChat?: () => void }) => {
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [dailyAvg, setDailyAvg] = useState(0);
  const [artifact, setArtifact] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [artifactUrl, setArtifactUrl] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { processMessage } = useThreadActions();

  const handleWatchNow = async () => {
    setIsGenerating(true);
    setArtifact("");
    setArtifactUrl(null);
    try {
      const response = await apiClient.generateSpendingWrapped();
      const reader = response.body?.getReader();
      if (!reader) {
        setIsGenerating(false);
        return;
      }
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setArtifact(accumulated);
      }
      console.log("Full Artifact Response:", accumulated);
      const urlMatch = accumulated.match(/https?:\/\/[^\s]+/);
      setArtifactUrl(urlMatch ? urlMatch[0] : null);
    } catch (error) {
      console.error("Error generating spending wrapped:", error);
    } finally {
      setIsGenerating(false);
    }
    
  };

  useEffect(() => {
    fetch(`https://backend-thesys-0169bda04883.herokuapp.com/transactions`)
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
        setRecentTransactions([...processedTx].reverse().slice(0, 50)); 
        
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
    const txForDate = allTransactions.filter(t => t.date === dateStr);
    
    let prompt = `Analyze my financial activity on ${dateStr}.`;
    if (txForDate.length > 0) {
      prompt += ` I had ${txForDate.length} transactions:\n`;
      prompt += txForDate.map(t => `- ${t.title}: ${t.amount > 0 ? '+' : ''}$${t.amount}`).join('\n');
    } else {
      prompt += " I don't see any transactions for this specific day.";
    }

    processMessage({
      type: 'prompt',
      role: 'user',
      message: prompt
    });

    if (onOpenChat) onOpenChat();
  };

  const handleKpiClick = (metric: string, value: string, context?: string) => {
    let prompt = `Analyze my ${metric}. The value is ${value}.`;
    if (context) prompt += ` ${context}`;
    
    processMessage({
      type: 'prompt',
      role: 'user',
      message: prompt
    });

    if (onOpenChat) onOpenChat();
  };

  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const fullDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeString = currentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <p className="text-[24px] text-gray-500 dark:text-gray-400 font-medium">Welcome back,</p>
            <h1 className="text-[80px] leading-none font-black text-gray-900 dark:text-white tracking-tight mt-1">
              Alex
            </h1>
          </div>
          <div className="mb-4 text-right">
             <p className="text-[40px] font-black text-white-600 dark:text-white-400">{dayName}</p>
             <p className="text-xl font-medium text-gray-500 dark:text-gray-400 pb-2">{fullDate}</p>
             <p className="text-xl font-medium text-gray-400 dark:text-gray-500">{timeString}</p>
          </div>
        </div>

        {/* 1. Cosmetic Spend Wrapped Banner */}
        <WrappedBanner onWatchNow={handleWatchNow} isGenerating={isGenerating} />

        {/* Artifact Display */}
        {(isGenerating || artifact) && (
  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Spending Wrapped</h3>
    
    {/* Update this block */}
    <ThemeProvider mode="dark">
      <C1Component c1Response={artifact} isStreaming={isGenerating} />
    </ThemeProvider>

  </div>
)}

        {/* 2. Refined KPI Cards (Top 4 Buttons) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xl">
          <KpiCard 
            title={`INR ${(balance * 91.5).toFixed(2)}`}
            amount={`USD ${balance.toFixed(2)}`} 
            subtext="Current Balance" 
            icon={Wallet} 
            trend="Fixed" 
            trendUp={true} 
            accentColor="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            description="Your total available balance across all accounts converted to USD."
            onClick={() => handleKpiClick("Current Balance", `USD ${balance.toFixed(2)}`, "Review if this balance is sufficient for upcoming expenses.")}
          />
          <KpiCard 
            title={`INR ${(totalSpent * 91.5).toFixed(2)}`} 
            amount={`USD ${totalSpent.toFixed(2)}`} 
            subtext={`Total Budget`} 
            icon={CreditCard} 
            trend={`${ totalSpent > 0 ? ((totalSpent/2000)*100).toFixed(0) : 0 }% used`} 
            trendUp={false} 
            accentColor="bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
            description="Total amount spent in the current billing cycle compared to your budget limit."
            onClick={() => handleKpiClick("Total Spending", `USD ${totalSpent.toFixed(2)}`, "Break down my spending categories and suggest where I can save.")}
          />
          <KpiCard 
            title={`INR ${(dailyAvg * 91.5).toFixed(2)}`} 
            amount={`USD ${dailyAvg.toFixed(2)}`} 
            subtext="Daily Average" 
            icon={TrendingUp} 
            trend="Stable" 
            trendUp={true} 
            accentColor="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            description="Average daily spending calculated over the last 30 days of activity."
            onClick={() => handleKpiClick("Daily Average Spending", `USD ${dailyAvg.toFixed(2)}`, "Is my daily spending sustainable?")}
          />
          <KpiCard 
            title={`vs ~${(dailyAvg).toFixed(0)} in US`} 
            amount={`🍌 ${(dailyAvg * 12).toFixed(0)} in India`} 
            subtext="Banana Index (PPP)" 
            icon={TrendingUp} 
            trend="12.0x" 
            trendUp={true} 
            accentColor="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
            description="Visualizes the Purchasing Power Parity (PPP) gap. Your daily budget buys ~12x more real goods (bananas) in India than in the US."
            onClick={() => handleKpiClick("Banana Index (PPP)", `${(dailyAvg * 12).toFixed(0)} Bananas (IND) vs ${(dailyAvg).toFixed(0)} Bananas (US)`, "Explain the huge Purchasing Power Parity gap between INR and USD using the 'Banana Index'. Why does my money go so much further in India?")}
          />
        </div>

        {/* 3. Calendar Section (Unchanged logic) */}
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <CalendarView transactions={allTransactions} onDateClick={handleDateClick} />
        </div> 
      </div>
    </div>
  );
};

const KpiCard = ({ title, amount, subtext, icon: Icon, trend, trendUp, accentColor, description, onClick }: any) => {
  return (
    <div 
      onClick={onClick}
      className={clsx(
        "group bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all relative overflow-hidden h-full min-h-[160px]",
        onClick ? "cursor-pointer active:scale-95" : ""
      )}
    >
      
      {/* Default View */}
      <div className="transition-opacity duration-300 group-hover:opacity-0">
          <div className="flex justify-between items-start mb-4">
            <div className={clsx("p-3 rounded-xl", accentColor)}>
              <Icon size={22} /> 
            </div>
            <div className={clsx("px-2.5 py-1 rounded-full text-xs font-semibold", trendUp ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400")}>
              {trend}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{amount}</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{title}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50 flex items-center gap-2">
             <span className="text-xs text-gray-400 dark:text-gray-500">{subtext}</span>
          </div>
      </div>

      {/* Hover View (Explanation) */}
      <div className="absolute inset-0 p-6 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white dark:bg-gray-800 text-center">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{subtext}</h4>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
           {description || "This metric helps track your financial health by monitoring key indicators over time."}
        </p>
      </div>
      
    </div>
  );
};