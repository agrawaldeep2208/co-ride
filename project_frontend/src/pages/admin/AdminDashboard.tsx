import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, TrendingUp, Users, Star, AlertCircle, Loader2, ShieldCheck, IndianRupee } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import EarningsTrajectoryChart from '../../components/analytics/EarningsTrajectoryChart';
import MethodDistributionChart from '../../components/analytics/MethodDistributionChart';
import LocationRevenueChart from '../../components/analytics/LocationRevenueChart';

const iconMap = {
  Car,
  Users,
  TrendingUp,
  Star,
  ShieldCheck: ShieldCheck
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<{ chartData: any[], pieData: any[], locationData: any[] }>({
    chartData: [],
    pieData: [],
    locationData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // 1. Fetch Basic Stats
        const statsRes = await fetch('http://localhost:5001/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        const statsData = await statsRes.json();
        
        const mappedStats = statsData.stats.map((stat: any) => ({
          ...stat,
          icon: iconMap[stat.icon as keyof typeof iconMap] || Car
        }));
        setStats(mappedStats);

        // 2. Fetch Analytics
        const analyticsRes = await fetch('http://localhost:5001/api/admin/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (analyticsRes.ok) {
           const analyticsData = await analyticsRes.json();
           setAnalytics(analyticsData);
        }

      } catch (err: any) {
        console.error('Error fetching admin dashboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Analyzing Platform Performance...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">
              Admin Control Center
            </h1>
            <p className="text-gray-500 font-medium tracking-tight">System-wide health and performance metrics</p>
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
            <div className="p-2 bg-blue-50 rounded-xl">
              <IndianRupee className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform GMV</p>
              <p className="text-sm font-black text-gray-900">
                ₹{analytics.chartData.reduce((acc, curr) => acc + curr.earnings, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1">
              <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-gray-100`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900 mb-1 leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <EarningsTrajectoryChart 
                data={analytics.chartData} 
                title="Platform Growth Trajectory" 
            />
            <LocationRevenueChart data={analytics.locationData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-1">
                <MethodDistributionChart data={analytics.pieData} />
            </div>
            <div className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[40px] p-8 border border-blue-100 flex flex-col justify-center">
                <h4 className="text-xl font-black text-blue-900 mb-2">Expansion Insight</h4>
                <p className="text-blue-700 font-medium">
                    Your platform is performing strongest in <span className="font-black underline">{analytics.locationData[0]?.location || 'N/A'}</span>. 
                    Consider running targeted promotions in <span className="font-black">{analytics.locationData[1]?.location || 'surrounding areas'}</span> to boost regional density.
                </p>
            </div>
        </div>

        {/* Quick Admin Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Link
            to="/admin/users"
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white hover:scale-[1.02] transition-all group"
          >
            <Users className="w-12 h-12 mb-4 group-hover:rotate-12 transition-transform" />
            <h3 className="text-xl font-black mb-1 uppercase tracking-tighter">User Base</h3>
            <p className="text-blue-100 font-bold opacity-80 uppercase text-[10px] tracking-widest">Verify & manage accounts</p>
          </Link>

          <Link
            to="/admin/rides"
            className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl shadow-xl p-8 text-white hover:scale-[1.02] transition-all group"
          >
            <Car className="w-12 h-12 mb-4 group-hover:rotate-12 transition-transform" />
            <h3 className="text-xl font-black mb-1 uppercase tracking-tighter">Ride Oversight</h3>
            <p className="text-purple-100 font-bold opacity-80 uppercase text-[10px] tracking-widest">System-wide monitoring</p>
          </Link>

          <Link
            to="/admin/verifications"
            className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-8 text-white hover:scale-[1.02] transition-all group"
          >
            <ShieldCheck className="w-12 h-12 mb-4 group-hover:rotate-12 transition-transform" />
            <h3 className="text-xl font-black mb-1 uppercase tracking-tighter">Verifications</h3>
            <p className="text-orange-100 font-bold opacity-80 uppercase text-[10px] tracking-widest">Approve driver documents</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
