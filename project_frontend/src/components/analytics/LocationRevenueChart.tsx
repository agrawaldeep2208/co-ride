import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { MapPin } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Props {
  data: any[];
}

export default function LocationRevenueChart({ data }: Props) {
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-red-600" />
            Revenue by Location
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Top performing regions</p>
        </div>
      </div>
      <div className="flex-1 min-h-[300px] w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 40, right: 30, top: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="location"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#4b5563' }}
                width={80}
              />
              <Tooltip
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" radius={[0, 10, 10, 0]} barSize={30}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
            <MapPin className="w-12 h-12 mb-2" />
            <p className="text-xs font-black uppercase tracking-widest">Awaiting spatial data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
