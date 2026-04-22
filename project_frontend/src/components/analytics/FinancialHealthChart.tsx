import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BarChart3, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';

interface Props {
  data: any[];
  title?: string;
  subtitle?: string;
}

export default function FinancialHealthChart({ data, title = "Financial Health", subtitle = "Earnings vs. Spending (30D)" }: Props) {
  const totalEarnings = data.reduce((acc, curr) => acc + (curr.earnings || 0), 0);
  const totalSpending = data.reduce((acc, curr) => acc + (curr.spending || 0), 0);
  const netEarnings = totalEarnings - totalSpending;

  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 h-full flex flex-col justify-start">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              {title}
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{subtitle}</p>
          </div>
        </div>
        <div className="h-[320px] w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={4} margin={{ bottom: 0, top: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                  dy={10}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}
                />
                <Legend
                  iconType="circle"
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: '0px', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Bar dataKey="earnings" fill="#10b981" radius={[10, 10, 10, 10]} name="Earnings" />
                <Bar dataKey="spending" fill="#ef4444" radius={[10, 10, 10, 10]} name="Spending" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">No transaction data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Footer Section - Restructured for emphasis */}
      <div className="pt-6 border-t border-gray-50 space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
              Total Earned
            </p>
            <p className="text-xl font-black text-gray-900 leading-none">₹{totalEarnings.toLocaleString()}</p>
          </div>
          <div className="space-y-1 border-l border-gray-50 pl-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
              <ArrowDownLeft className="w-3 h-3 mr-1 text-red-500" />
              Total Spent
            </p>
            <p className="text-xl font-black text-gray-900 leading-none">₹{totalSpending.toLocaleString()}</p>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-dashed border-gray-100">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center mb-2">
            <Wallet className="w-4 h-4 mr-2 text-blue-500" />
            Net Earnings
          </p>
          <p className={`text-4xl font-black leading-none tracking-tighter ${netEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{netEarnings.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
