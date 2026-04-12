import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Star, Users, DollarSign, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';
import { Ride, User, Vehicle } from '../types';

const API_URL = 'http://localhost:5001/api';

export default function SearchRides() {
  const [searchParams, setSearchParams] = useState({
    source: '',
    destination: '',
    date: '',
  });
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [seatsRequested, setSeatsRequested] = useState(1);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/ride`);
      if (response.ok) {
        const data = await response.json();
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const otherRides = data.filter((r: any) => {
          const creatorId = typeof r.creator_id === 'string' ? r.creator_id : r.creator_id ? r.creator_id._id : null;
          return currentUser ? creatorId !== currentUser.id && creatorId !== currentUser._id : true;
        });
        setRides(otherRides);
        setFilteredRides(otherRides);
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let result = rides;
    if (searchParams.source) {
      result = result.filter(r => r.source.toLowerCase().includes(searchParams.source.toLowerCase()));
    }
    if (searchParams.destination) {
      result = result.filter(r => r.destination.toLowerCase().includes(searchParams.destination.toLowerCase()));
    }
    if (searchParams.date) {
      result = result.filter(r => r.date.startsWith(searchParams.date));
    }
    setFilteredRides(result);
  };

  const handleRequestRide = (ride: Ride) => {
    setSelectedRide(ride);
    setSeatsRequested(1);
  };

  const submitRequest = async () => {
    if (!selectedRide) return;
    try {
      setRequesting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ride/${selectedRide._id}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ seatsRequested })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Ride requested successfully!');
        setSelectedRide(null);
        fetchRides(); // Refresh to update available seats if auto-approved, or just to have fresh data
      } else {
        alert(data.message || 'Failed to request ride');
      }
    } catch (error) {
      console.error('Error requesting ride:', error);
      alert('An error occurred while requesting the ride');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Find Your Ride</h1>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <input
                type="text"
                value={searchParams.source}
                onChange={(e) => setSearchParams({ ...searchParams, source: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City or location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <input
                type="text"
                value={searchParams.destination}
                onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City or location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={searchParams.date}
                onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading rides...</div>
        ) : filteredRides.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm text-gray-500">
            No rides found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRides.map((ride) => {
              const creator = ride.creator_id as User;
              const vehicle = ride.vehicle_id as Vehicle;
              const creatorName = creator?.fullName || creator?.name || 'Unknown';
              
              return (
                <div key={ride._id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-lg uppercase">
                            {creatorName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{creatorName}</h3>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">{creator?.rating || 'New'}</span>
                            <span className="text-sm text-gray-400 ml-2">{vehicle?.vehicleType || 'Vehicle'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{ride.source}</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{ride.destination}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(ride.date).toLocaleDateString()} at {ride.time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{ride.availableSeats} seats available</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>₹{ride.pricePerSeat} per seat</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRequestRide(ride)}
                      disabled={ride.availableSeats === 0}
                      className={`ml-4 px-6 py-2.5 font-medium rounded-lg transition-colors ${
                        ride.availableSeats === 0 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {ride.availableSeats === 0 ? 'Full' : 'Request'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedRide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Ride</h2>
              <p className="text-gray-600 mb-4">
                Request to join {(selectedRide.creator_id as User)?.fullName || 'the driver'}'s ride from {selectedRide.source} to {selectedRide.destination}
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Seats
                </label>
                <input
                  type="number"
                  value={seatsRequested}
                  onChange={(e) => setSeatsRequested(parseInt(e.target.value))}
                  min="1"
                  max={selectedRide.availableSeats}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Total cost: ₹{selectedRide.pricePerSeat * seatsRequested}
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setSelectedRide(null)}
                  disabled={requesting}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRequest}
                  disabled={requesting}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {requesting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
