import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, Star, CheckCircle, XCircle, Shield, Car, Phone, Mail, ChevronLeft, Key, CreditCard } from 'lucide-react';
import Layout from '../components/Layout';
import { Ride, RideRequest, User, Payment } from '../types';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5001/api';

export default function RideInfo() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [givenRatings, setGivenRatings] = useState<string[]>([]);
  const [ratingTarget, setRatingTarget] = useState<User | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [feedbackValue, setFeedbackValue] = useState('');
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPaying, setIsPaying] = useState(false);

  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/ride/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRide(data.ride);
        setRequests(data.requests);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to fetch ride details');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGivenRatings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/rating/ride/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGivenRatings(data.map((r: any) => r.toUserId));
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/payment/ride/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  useEffect(() => {
    fetchRideDetails();
    fetchGivenRatings();
    fetchPayments();
  }, [id]);

  const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ride/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchRideDetails();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update request');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleStartRide = async () => {
    if (!window.confirm('Are you sure you want to start this ride?')) return;
    
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ride/${id}/start`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchRideDetails();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to start ride');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleFinishRide = async () => {
    if (!window.confirm('Are you sure you want to finish this ride? Notifications will be sent to all participants.')) return;
    
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ride/${id}/finish`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchRideDetails();
        await fetchPayments();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to finish ride');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleJoinRide = async () => {
    if (joinCodeInput.length !== 4) {
      alert('Please enter a 4-digit code');
      return;
    }

    try {
      setJoining(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ride/${id}/join`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: joinCodeInput })
      });

      if (response.ok) {
        alert('Successfully joined the ride!');
        await fetchRideDetails();
      } else {
        const data = await response.json();
        alert(data.message || 'Invalid join code');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!ratingTarget) return;

    try {
      setIsRatingLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          toUserId: ratingTarget._id || ratingTarget.id,
          rideId: id,
          rating: ratingValue,
          feedback: feedbackValue
        })
      });

      if (response.ok) {
        alert(`Rating submitted for ${ratingTarget.fullName || ratingTarget.name}`);
        setGivenRatings([...givenRatings, (ratingTarget._id || ratingTarget.id) as string]);
        setRatingTarget(null);
        setRatingValue(5);
        setFeedbackValue('');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to submit rating');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRatingLoading(false);
    }
  };

  const handlePayment = async (paymentId: string, method: string) => {
    try {
      setIsPaying(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/payment/${paymentId}/pay`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ paymentMethod: method })
      });

      if (response.ok) {
        alert(`Payment via ${method} completed successfully!`);
        await fetchPayments();
      } else {
        const data = await response.json();
        alert(data.message || 'Payment failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !ride) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-xl shadow-sm">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Ride not found'}</p>
          <button 
            onClick={() => navigate('/rides/my-rides')}
            className="text-blue-600 font-medium hover:underline flex items-center justify-center mx-auto"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to My Rides
          </button>
        </div>
      </Layout>
    );
  }

  const currentUserId = user?._id || user?.id;
  const isCreator = currentUserId === (typeof ride.creator_id === 'string' ? ride.creator_id : ride.creator_id?._id);
  const myRequest = requests.find(r => {
    const pId = typeof r.passengerId === 'string' ? r.passengerId : r.passengerId?._id;
    return pId === currentUserId;
  });
  const isApproved = myRequest?.status === 'approved' || myRequest?.status === 'joined';
  const hasJoined = myRequest?.status === 'joined';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Ride Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    ride.status === 'active' ? 'bg-green-100 text-green-700' :
                    ride.status === 'started' ? 'bg-blue-100 text-blue-700' :
                    ride.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {ride.status}
                  </span>
                  {isCreator && ride.status === 'started' && (
                    <span className="flex items-center space-x-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold ring-1 ring-amber-200">
                      <Key className="w-3.5 h-3.5" />
                      <span>CODE: {ride.joinCode}</span>
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-gray-900">₹{ride.pricePerSeat}</p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-tight">per seat</p>
                </div>
              </div>

              <div className="relative pl-8 space-y-12 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-gray-200 before:to-emerald-500">
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-600 shadow-sm shadow-blue-200"></div>
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Pick up</h4>
                  <p className="text-lg font-bold text-gray-900 leading-tight">{ride.source}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full border-4 border-white bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Drop off</h4>
                  <p className="text-lg font-bold text-gray-900 leading-tight">{ride.destination}</p>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-6 pt-8 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date & Time</p>
                    <p className="font-bold text-gray-900">
                      {new Date(ride.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {ride.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Availability</p>
                    <p className="font-bold text-gray-900">{ride.availableSeats} / {ride.totalSeats} seats</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center">
                <Car className="w-4 h-4 mr-2 text-blue-600" />
                Vehicle Information
              </h3>
              {ride.vehicle_id && typeof ride.vehicle_id !== 'string' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <Car className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-gray-900">{(ride.vehicle_id as any).vehicleModel}</p>
                      <p className="text-sm font-bold text-gray-500">{(ride.vehicle_id as any).vehicleNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black uppercase tracking-wider">
                      {(ride.vehicle_id as any).vehicleType}
                    </span>
                    <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-tight">{(ride.vehicle_id as any).fuelType}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Request Management or Joining UI */}
            {isCreator ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Manage Requests</h3>
                <div className="space-y-4">
                  {requests.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-500">No requests for this ride yet</p>
                    </div>
                  ) : (
                    requests.map((request) => {
                      const passenger = request.passengerId as User;
                      const passengerName = passenger?.fullName || passenger?.name || 'Unknown';
                      return (
                        <div key={request._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50 rounded-2xl transition-all hover:bg-white hover:shadow-md hover:shadow-gray-100 border border-transparent hover:border-gray-100">
                          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                            <div className="relative">
                              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center ring-1 ring-gray-100">
                                <span className="text-blue-600 font-black text-lg">
                                  {passengerName.charAt(0)}
                                </span>
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                              <p className="font-black text-gray-900">{passengerName}</p>
                              <div className="flex items-center space-x-3 mt-0.5">
                                <div className="flex items-center space-x-1 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-black text-amber-700">
                                  <Star className="w-3 h-3 fill-current" />
                                  <span>{passenger?.rating || 'NEW'}</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{request.seatsRequested} seats</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {request.status === 'pending' ? (
                              <>
                                <button
                                  disabled={updating}
                                  onClick={() => handleRequestAction(request._id, 'approved')}
                                  className="flex-1 sm:flex-none py-2 px-4 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={updating}
                                  onClick={() => handleRequestAction(request._id, 'rejected')}
                                  className="flex-1 sm:flex-none py-2 px-4 bg-white text-rose-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 border border-rose-100 transition-all disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </>
                            ) : (
                              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                request.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                request.status === 'joined' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100' :
                                'bg-rose-50 text-rose-600'
                              }`}>
                                {request.status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : isApproved ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Verification</h3>
                </div>
                
                {ride.status === 'active' ? (
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <p className="text-sm font-bold text-blue-800 leading-relaxed">
                      Your request is approved! Once the driver starts the journey, you'll need to enter the 4-digit code provided by them to join.
                    </p>
                  </div>
                ) : ride.status === 'started' && !hasJoined ? (
                  <div className="space-y-5">
                    <p className="text-sm font-bold text-gray-900">Enter the 4-digit code provided by the driver to start your journey:</p>
                    <div className="flex space-x-4">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="0 0 0 0"
                        className="flex-1 h-14 text-center text-2xl font-black tracking-[1em] bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.replace(/\D/g, ''))}
                      />
                      <button
                        onClick={handleJoinRide}
                        disabled={joining || joinCodeInput.length !== 4}
                        className="h-14 px-8 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-50"
                      >
                        {joining ? 'Joining...' : 'JOIN RIDE'}
                      </button>
                    </div>
                  </div>
                ) : hasJoined ? (
                  <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center space-x-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-emerald-800">Joined successfully!</p>
                      <p className="text-xs font-bold text-emerald-600 mt-0.5 italic">"Enjoy your journey with coRide"</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Payment Section - Visible when ride is completed */}
            {ride.status === 'completed' && (
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                <div className="flex items-center space-x-3 mb-8">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Payment Status</h3>
                </div>

                {isCreator ? (
                  /* Driver View: List of all payments */
                  <div className="space-y-4">
                    {payments.map(payment => {
                      const req = requests.find(r => {
                        const pId = typeof r.passengerId === 'string' ? r.passengerId : (r.passengerId as any)?._id;
                        return pId === payment.passengerId;
                      });
                      const passenger = req?.passengerId as User;
                      const passengerName = passenger?.fullName || passenger?.name || 'Passenger';
                      
                      return (
                        <div key={payment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-blue-600">
                              {passengerName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{passengerName}</p>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {payment.status === 'completed' ? `${payment.paymentMethod} • ${new Date(payment.completedAt!).toLocaleDateString()}` : 'Payment Pending'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-gray-900">₹{payment.amount}</p>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${payment.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Passenger View: Their own payment */
                  (() => {
                    const myPayment = payments.find(p => p.passengerId === currentUserId);
                    if (!myPayment) return <p className="text-sm font-bold text-gray-500 italic text-center">No payment record found.</p>;

                    return (
                      <div className="bg-gray-50 rounded-2xl p-6 text-center border-2 border-dashed border-gray-200">
                        {myPayment.status === 'completed' ? (
                          <div className="space-y-3">
                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-100">
                              <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            <h4 className="text-xl font-black text-gray-900">Payment Successful!</h4>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{myPayment.paymentMethod} • ID: {myPayment.transactionId}</p>
                            <p className="text-xs font-bold text-emerald-600">You can now provide feedback for the ride.</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Amount Due</p>
                              <p className="text-4xl font-black text-gray-900">₹{myPayment.amount}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center mb-1">Select Payment Method</p>
                              
                              <button
                                onClick={() => handlePayment(myPayment._id, 'UPI')}
                                disabled={isPaying}
                                className="w-full py-4 bg-white border-2 border-blue-100 text-blue-600 font-black uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-all flex items-center justify-center space-x-2 shadow-sm"
                              >
                                <Shield className="w-4 h-4" />
                                <span>{isPaying ? 'Processing...' : 'Pay via UPI'}</span>
                              </button>

                              <button
                                onClick={() => handlePayment(myPayment._id, 'Wallet')}
                                disabled={isPaying}
                                className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center space-x-2"
                              >
                                <CreditCard className="w-4 h-4" />
                                <span>{isPaying ? 'Processing...' : 'Simulated Wallet'}</span>
                              </button>

                              <button
                                onClick={() => handlePayment(myPayment._id, 'Cash')}
                                disabled={isPaying}
                                className="w-full py-4 bg-white border-2 border-emerald-100 text-emerald-600 font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-50 transition-all flex items-center justify-center space-x-2 shadow-sm"
                              >
                                <span>₹</span>
                                <span>{isPaying ? 'Processing...' : 'Pay via Cash'}</span>
                              </button>
                            </div>

                            <p className="text-[10px] font-bold text-gray-400 leading-relaxed text-center px-4">
                              Your payment choice will be visible to the driver to confirm the transaction.
                            </p>
                          </div>
                        )
                      }
                    </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* Rating Section - Visible when ride is completed AND payment is done */}
            {ride.status === 'completed' && (isCreator || hasJoined) && (
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                <div className="flex items-center space-x-3 mb-8">
                  <Star className="w-6 h-6 text-amber-500 fill-current" />
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Rate Participants</h3>
                </div>

                <div className="space-y-6">
                  {(() => {
                    const joinedPassengers = requests
                      .filter(r => r.status === 'joined')
                      .map(r => r.passengerId as User);
                    
                    let targets: User[] = [];
                    if (isCreator) {
                      targets = joinedPassengers;
                    } else if (hasJoined) {
                      const creator = ride.creator_id as User;
                      targets = [creator, ...joinedPassengers.filter(p => {
                        const pId = typeof p === 'string' ? p : ((p as any)._id || (p as any).id);
                        return pId !== currentUserId;
                      })];
                    }

                    if (targets.length === 0) {
                      return <p className="text-sm font-bold text-gray-500 italic text-center py-4">No other participants to rate.</p>;
                    }

                    return targets.map(target => {
                      const targetId = (target._id || target.id) as string;
                      const isRated = givenRatings.includes(targetId);
                      const targetName = target.fullName || target.name || 'Unknown';
                      
                      const myPayment = payments.find(p => p.passengerId === currentUserId);
                      const targetPayment = payments.find(p => p.passengerId === targetId);
                      const rideCreatorId = typeof ride.creator_id === 'string' ? ride.creator_id : ride.creator_id?._id;
                      const isCreatorTarget = targetId === rideCreatorId;
                      
                      const canRate = isCreator 
                        ? (targetPayment?.status === 'completed')
                        : (myPayment?.status === 'completed');
                      
                      return (
                        <div key={targetId} className={`flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent transition-all ${!canRate && 'opacity-50 grayscale'}`}>
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 shadow-sm border border-gray-100">
                              {targetName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-gray-900">{targetName}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {isCreatorTarget ? 'Driver' : 'Passenger'}
                              </p>
                            </div>
                          </div>

                          {isRated ? (
                            <div className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest">
                              <CheckCircle className="w-4 h-4" />
                              <span>Rated</span>
                            </div>
                          ) : !canRate ? (
                            <div className="px-4 py-2 bg-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                              Waiting for Payment
                            </div>
                          ) : (
                            <button
                              onClick={() => setRatingTarget(target)}
                              className="px-6 py-2 bg-white text-blue-600 border-2 border-blue-50 hover:border-blue-100 hover:bg-blue-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                              Rate
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Creator Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">{isCreator ? 'Your Profile' : 'The Driver'}</h3>
              {ride.creator_id && typeof ride.creator_id !== 'string' && (
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-xl shadow-blue-100 rotate-3">
                    <span className="text-white text-4xl font-black -rotate-3">
                      {(ride.creator_id as any).fullName?.charAt(0) || (ride.creator_id as any).name?.charAt(0)}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-gray-900 leading-tight">{(ride.creator_id as any).fullName || (ride.creator_id as any).name}</h4>
                  <div className="flex items-center justify-center space-x-1 mt-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    <span className="text-sm font-black text-amber-600">{(ride.creator_id as any).rating || '4.8'}</span>
                  </div>
                  
                  <div className="mt-8 space-y-3">
                    <div className="flex items-center p-3 bg-gray-50 rounded-xl transition-colors hover:bg-blue-50 group">
                      <Phone className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      <span className="ml-3 text-sm font-bold text-gray-600 group-hover:text-blue-700">{(ride.creator_id as any).phone}</span>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 rounded-xl transition-colors hover:bg-blue-50 group overflow-hidden">
                      <Mail className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      <span className="ml-3 text-xs font-bold text-gray-600 group-hover:text-blue-700 truncate">{(ride.creator_id as any).email}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lifecycle Controls for Creator */}
            {isCreator && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Controls</h3>
                <div className="space-y-4">
                  {ride.status === 'active' && (
                    <button
                      disabled={updating}
                      onClick={handleStartRide}
                      className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center"
                    >
                      {updating ? 'Processing...' : 'Start Ride'}
                    </button>
                  )}
                  {ride.status === 'started' && (
                    <button
                      disabled={updating}
                      onClick={handleFinishRide}
                      className="w-full py-4 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center"
                    >
                      {updating ? 'Processing...' : 'Finish Ride'}
                    </button>
                  )}
                  {ride.status === 'completed' && (
                    <div className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                      <p className="text-sm font-black text-gray-900">Ride Completed</p>
                      <p className="text-xs font-bold text-gray-400 mt-1">Status: Archived</p>
                    </div>
                  )}
                  {ride.status !== 'completed' && (
                    <button
                      disabled={updating}
                      onClick={() => alert('Feature coming soon')}
                      className="w-full py-3 bg-white text-rose-500 font-black uppercase tracking-widest rounded-xl border-2 border-rose-50 transition-all hover:bg-rose-50"
                    >
                      Cancel Ride
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {ratingTarget && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Rate {ratingTarget.fullName || ratingTarget.name}</h2>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">Share your experience</p>

            <div className="space-y-8">
              {/* Stars */}
              <div className="flex justify-center space-x-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingValue(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= ratingValue ? 'text-amber-400 fill-current' : 'text-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Feedback Textarea */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Feedback (Optional)</label>
                <textarea
                  value={feedbackValue}
                  onChange={(e) => setFeedbackValue(e.target.value)}
                  placeholder="How was the journey? Any feedback helps us build a better community."
                  className="w-full h-32 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-medium resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-4 pt-2">
                <button
                  onClick={() => setRatingTarget(null)}
                  disabled={isRatingLoading}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRatingSubmit}
                  disabled={isRatingLoading}
                  className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-50"
                >
                  {isRatingLoading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
