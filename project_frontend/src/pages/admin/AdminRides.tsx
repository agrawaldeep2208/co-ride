import { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, IndianRupee, Loader2, AlertCircle } from 'lucide-react';
import Layout from '../../components/Layout';

export default function AdminRides() {
  const [rides, setRides] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/admin/rides', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch rides data');
        }

        const data = await response.json();
        
        const formattedRides = data.map((r: any) => ({
          ...r,
          id: r._id,
          creatorName: r.creator_id ? r.creator_id.fullName : 'Unknown User',
          creatorRating: r.creator_id ? r.creator_id.rating : 0,
          vehicleModel: r.vehicle_id ? r.vehicle_id.vehicleModel : 'Unknown',
          vehicleNumber: r.vehicle_id ? r.vehicle_id.vehicleNumber : 'N/A',
          date: new Date(r.date).toLocaleDateString(),
          time: r.time,
        }));
        setRides(formattedRides);
      } catch (err: any) {
        console.error('Error fetching admin rides:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  const filteredRides =
    filterStatus === 'all'
      ? rides
      : rides.filter((ride) => ride.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'started':
      case 'ongoing':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading Rides List...</p>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ride Monitoring</h1>
            <p className="text-gray-600">Overview of all rides on the platform</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {['all', 'active', 'started', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredRides.length > 0 ? (
            filteredRides.map((ride) => (
              <div key={ride.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">
                          {ride.creatorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{ride.creatorName}</p>
                        <p className="text-sm text-gray-500">Ride ID: {ride.id?.slice(-6)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">From</p>
                          <p className="font-medium text-gray-900">{ride.source}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">To</p>
                          <p className="font-medium text-gray-900">{ride.destination}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{ride.date} at {ride.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>
                          {ride.availableSeats}/{ride.totalSeats} seats available
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="w-4 h-4" />
                        <span>{ride.pricePerSeat}/seat</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ride.status)} uppercase tracking-wider text-xs`}>
                      {ride.status || 'unknown'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Vehicle: <span className="font-medium">{ride.vehicleModel}</span> ({ride.vehicleNumber})
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-500 font-medium">No rides found matching this status.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
