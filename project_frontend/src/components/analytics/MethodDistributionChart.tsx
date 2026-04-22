import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

interface Props {
  data: any[];
}

export default function MethodDistributionChart({ data }: Props) {
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2 text-orange-600" />
            Payment Methods
          </h3>
        </div>
      </div>
      <div className="h-[200px] w-full flex items-center justify-center">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-gray-400">
            <PieChartIcon className="w-8 h-8 mb-2 mx-auto opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest">Awaiting data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
