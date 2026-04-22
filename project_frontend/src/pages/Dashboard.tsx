import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Search, PlusCircle, Star, ArrowUpRight, ArrowDownLeft, IndianRupee } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import FinancialHealthChart from '../components/analytics/FinancialHealthChart';
import EarningsTrajectoryChart from '../components/analytics/EarningsTrajectoryChart';
import MethodDistributionChart from '../components/analytics/MethodDistributionChart';

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    ridesCreated: 0,
    ridesJoined: 0,
    rating: 0,
    requestsReceived: 0,
    requestsSent: 0
  });
  const [analytics, setAnalytics] = useState<{ chartData: any[], pieData: any[] }>({
    chartData: [],
    pieData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        // Fetch Stats
        const statsRes = await fetch('http://localhost:5001/api/user/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const statsData = await statsRes.json();
        if (statsRes.ok) setDashboardStats(statsData);

        // Fetch Analytics
        const analyticsRes = await fetch('http://localhost:5001/api/payment/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const analyticsData = await analyticsRes.json();
        if (analyticsRes.ok) setAnalytics(analyticsData);

      } catch (err) {
        setError('Error connecting to the server');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const stats = [
    { label: 'Rides Created', value: dashboardStats.ridesCreated, icon: Car, color: 'bg-blue-500' },
    { label: 'Rides Joined', value: dashboardStats.ridesJoined, icon: PlusCircle, color: 'bg-purple-500' },
    { label: 'Rating', value: dashboardStats.rating.toFixed(1), icon: Star, color: 'bg-yellow-500' },
    { label: 'Requests Received', value: dashboardStats.requestsReceived, icon: ArrowDownLeft, color: 'bg-green-500' },
    { label: 'Requests Sent', value: dashboardStats.requestsSent, icon: ArrowUpRight, color: 'bg-orange-500' },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">
              Welcome Back, {user?.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-500 font-medium">Your ride-sharing overview for the last 30 days</p>
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
            <div className="p-2 bg-green-50 rounded-xl">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Earnings</p>
              <p className="text-sm font-black text-gray-900">₹{analytics.chartData.reduce((acc, curr) => acc + curr.earnings, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center shadow-sm">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-4 animate-pulse"></div>
            <p className="font-bold">{error}</p>
          </div>
        )}

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1">
              <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-gray-100`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900 mb-1 leading-none">
                {loading ? '...' : stat.value}
              </p>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/rides/search" className="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Search className="w-24 h-24 text-blue-600" />
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Find a Ride</h3>
            <p className="text-xs text-gray-500 font-bold mt-1 tracking-tight">Browse available journeys nearby</p>
          </Link>

          <Link to="/rides/create" className="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <PlusCircle className="w-24 h-24 text-green-600" />
            </div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Create a Ride</h3>
            <p className="text-xs text-gray-500 font-bold mt-1 tracking-tight">Post your journey and earn money</p>
          </Link>

          <Link to="/rides/my-rides" className="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Car className="w-24 h-24 text-purple-600" />
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900">My Rides</h3>
            <p className="text-xs text-gray-500 font-bold mt-1 tracking-tight">Active bookings and requests</p>
          </Link>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FinancialHealthChart data={analytics.chartData} />
          <div className="grid grid-cols-1 gap-8">
            <EarningsTrajectoryChart data={analytics.chartData} />
            <MethodDistributionChart data={analytics.pieData} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
