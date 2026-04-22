import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface Props {
  data: any[];
  title?: string;
}

export default function EarningsTrajectoryChart({ data, title = "Earnings Trajectory" }: Props) {
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            {title}
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Growth insight</p>
        </div>
      </div>
      <div className="h-[200px] w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis hide dataKey="date" />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#10b981"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorEarnings)"
                name="Earnings"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-[10px] font-black uppercase tracking-widest">Awaiting data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
