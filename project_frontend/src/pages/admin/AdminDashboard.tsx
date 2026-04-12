import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, TrendingUp, Users, Star, AlertCircle, Loader2 } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

interface Activity {
  id: string;
  type: 'ride' | 'request';
  action: string;
  route: string;
  time: string;
}

const iconMap = {
  Car,
  Users,
  TrendingUp,
  Star
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        
        // Map icon strings to components
        const mappedStats = data.stats.map((stat: any) => ({
          ...stat,
          icon: iconMap[stat.icon as keyof typeof iconMap] || Car
        }));

        setStats(mappedStats);
        setRecentActivity(data.recentActivity);
      } catch (err: any) {
        console.error('Error fetching admin stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading Dashboard Data...</p>
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Here's a snapshot of the platform's performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Link
            to="/admin/users"
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white hover:scale-[1.02] transition-all group"
          >
            <Users className="w-12 h-12 mb-4 group-hover:rotate-12 transition-transform" />
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">User Management</h3>
            <p className="text-blue-100 font-bold opacity-80 uppercase text-xs tracking-widest">Monitor, verify & manage platform users</p>
          </Link>

          <Link
            to="/admin/rides"
            className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl shadow-xl p-8 text-white hover:scale-[1.02] transition-all group"
          >
            <Car className="w-12 h-12 mb-4 group-hover:rotate-12 transition-transform" />
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Ride Oversight</h3>
            <p className="text-purple-100 font-bold opacity-80 uppercase text-xs tracking-widest">Review, moderate & analyze system-wide rides</p>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 pb-6 border-b last:border-0 last:pb-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'ride' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    {activity.type === 'ride' ? (
                      <Car className={`w-5 h-5 ${activity.type === 'ride' ? 'text-blue-600' : 'text-purple-600'}`} />
                    ) : (
                      <Users className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{activity.action}</p>
                    <p className="text-gray-600 text-sm">{activity.route}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(activity.time)}</p>
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600 uppercase">
                    {activity.type}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent activity to show
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
