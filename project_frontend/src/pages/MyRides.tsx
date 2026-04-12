import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { MapPin, Calendar, Users, Star } from 'lucide-react';
import Layout from '../components/Layout';
import { Ride, RideRequest, User } from '../types';

const API_URL = 'http://localhost:5001/api';

export default function MyRides() {
  const [activeTab, setActiveTab] = useState<'created' | 'booked'>('created');
  const [createdRides, setCreatedRides] = useState<Ride[]>([]);
  const [bookedRequests, setBookedRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRidesData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      const [createdRes, bookedRes] = await Promise.all([
        fetch(`${API_URL}/ride/created`, { headers }),
        fetch(`${API_URL}/ride/booked`, { headers })
      ]);

      if (createdRes.ok) {
        const data = await createdRes.json();
        console.log('Fetched created rides:', data);
        setCreatedRides(data);
      } else {
        console.error('Failed to fetch created rides:', await createdRes.text());
      }
      
      if (bookedRes.ok) {
        const data = await bookedRes.json();
        console.log('Fetched booked reqs:', data);
        setBookedRequests(data);
      } else {
        console.error('Failed to fetch booked reqs:', await bookedRes.text());
      }

    } catch (error) {
      console.error('Error fetching rides data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRidesData();
  }, []);

  // Request action moved to RideInfo page

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Rides</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('created')}
            className={`px-6 py-2.5 font-medium rounded-lg transition-colors ${
              activeTab === 'created'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rides I Created
          </button>
          <button
            onClick={() => setActiveTab('booked')}
            className={`px-6 py-2.5 font-medium rounded-lg transition-colors ${
              activeTab === 'booked'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rides I Booked
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading rides...</div>
        ) : (
          <>
            {activeTab === 'created' && (
              <div className="space-y-6">
                {createdRides.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl shadow-sm text-gray-500">
                    You haven't created any rides yet.
                  </div>
                ) : (
                  createdRides.map((ride) => (
                    <div key={ride._id} className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{ride.source}</p>
                              <p className="text-sm text-gray-500">to {ride.destination}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>{ride.date ? new Date(ride.date).toLocaleDateString() : 'N/A'} at {ride.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>{ride.availableSeats}/{ride.totalSeats} seats available</span>
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium capitalize">
                          {ride.status || 'active'}
                        </span>
                      </div>

                      <div className="border-t pt-6 flex justify-end">
                        <Link
                          to={`/rides/${ride._id}`}
                          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Ride Details
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'booked' && (
              <div className="space-y-4">
                {bookedRequests.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl shadow-sm text-gray-500">
                    You haven't booked any rides yet.
                  </div>
                ) : (
                  bookedRequests.map((request) => {
                    const ride = request.rideId as Ride;
                    if (!ride) return null;
                    const creator = ride.creator_id as User;
                    const creatorName = creator?.fullName || creator?.name || 'Unknown';

                    return (
                      <div key={request._id} className="bg-white rounded-xl shadow-sm p-6">
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
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 mb-4">
                              <MapPin className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="font-semibold text-gray-900">{ride.source}</p>
                                <p className="text-sm text-gray-500">to {ride.destination}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{ride.date ? new Date(ride.date).toLocaleDateString() : 'N/A'} at {ride.time}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium capitalize ${
                                  request.status === 'approved' ? 'text-green-600' : 
                                  request.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {request.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex flex-col justify-between">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">₹{ride.pricePerSeat}</p>
                              <p className="text-sm text-gray-500">per seat</p>
                              <p className="text-xs text-gray-400 mt-1">{request.seatsRequested} seat(s) requested</p>
                            </div>
                            <Link
                              to={`/rides/${ride._id}`}
                              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
