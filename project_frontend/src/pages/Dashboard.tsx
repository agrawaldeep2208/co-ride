import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Search, PlusCircle, Star, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    ridesCreated: 0,
    ridesJoined: 0,
    rating: 0,
    requestsReceived: 0,
    requestsSent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5001/api/user/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          setDashboardStats(data);
        } else {
          setError(data.message || 'Failed to fetch dashboard stats');
          console.error('Stats fetch failed:', data);
        }
      } catch (err) {
        setError('Error connecting to the server');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your rides today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 mb-1">
                {loading ? '...' : stat.value}
              </p>
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/rides/search"
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <Search className="w-10 h-10 mb-4" />
            <h3 className="text-xl font-bold mb-2">Find a Ride</h3>
            <p className="text-blue-100">Search for available rides in your area</p>
          </Link>

          <Link
            to="/rides/create"
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <PlusCircle className="w-10 h-10 mb-4" />
            <h3 className="text-xl font-bold mb-2">Create a Ride</h3>
            <p className="text-green-100">Share your journey with others</p>
          </Link>

          <Link
            to="/rides/my-rides"
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <Car className="w-10 h-10 mb-4" />
            <h3 className="text-xl font-bold mb-2">My Rides</h3>
            <p className="text-purple-100">Manage your rides and requests</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
