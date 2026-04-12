import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, Car, IndianRupee, AlertCircle, CheckCircle, Plus, Navigation } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Vehicle } from '../types';
import ErrorBoundary from '../components/ErrorBoundary';
import { ShieldAlert } from 'lucide-react';

// Lazy load the Map component to handle browser-globals safely
const MapComponent = lazy(() => import('../components/MapComponent'));

export default function CreateRide() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    date: '',
    time: '',
    totalSeats: '',
    vehicle_id: '',
    pricePerSeat: '',
  });

  // Map Integration States
  const [startPos, setStartPos] = useState<[number, number] | null>(null);
  const [endPos, setEndPos] = useState<[number, number] | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<any[]>([]);
  const [distanceInfo, setDistanceInfo] = useState<{distance: number, duration: number} | null>(null);
  const [settingMarker, setSettingMarker] = useState<'start' | 'end' | null>(null);

  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/vehicle/my-vehicles', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setVehicles(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, vehicle_id: data[0]._id }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!startPos || !endPos) {
      setError('Please select valid start and destination locations using the autocomplete or map.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/ride', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          totalSeats: Number(formData.totalSeats),
          pricePerSeat: Number(formData.pricePerSeat),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create ride');
      }

      setSuccess(true);
      setTimeout(() => navigate('/rides/my-rides'), 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const searchLocation = async (query: string, type: 'start' | 'end') => {
    if (!query) {
      type === 'start' ? setStartSuggestions([]) : setEndSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=10&countrycodes=in&viewbox=68.1,35.5,97.4,6.7&addressdetails=1&extratags=1&namedetails=1&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      type === 'start' ? setStartSuggestions(data) : setEndSuggestions(data);
    } catch (e) {
      console.error("Geocoding error", e);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const value = e.target.value;
    setFormData({ ...formData, [type === 'start' ? 'source' : 'destination']: value });
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value, type);
    }, 500);
  };

  const handleSuggestionClick = (suggestion: any, type: 'start' | 'end') => {
    const pos: [number, number] = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    const name = suggestion.display_name.split(',').slice(0, 5).join(',').trim();
    
    setFormData({ ...formData, [type === 'start' ? 'source' : 'destination']: name });
    
    if (type === 'start') {
      setStartPos(pos);
      setStartSuggestions([]);
    } else {
      setEndPos(pos);
      setEndSuggestions([]);
    }
  };

  useEffect(() => {
    if (startPos && endPos) {
      calculateRoute(startPos, endPos);
    }
  }, [startPos, endPos]);

  const calculateRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distKm = route.distance / 1000;
        setDistanceInfo({
          distance: distKm,
          duration: route.duration / 60,
        });
        
        const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]]);
        setRouteGeometry(coords);

        // Suggest Price if not set
        const selectedVehicle = vehicles.find(v => v._id === formData.vehicle_id);
        const rate = selectedVehicle ? selectedVehicle.ratePerKm : 5;
        const suggestedPrice = Math.round(distKm * rate);
        
        if (!formData.pricePerSeat || parseInt(formData.pricePerSeat) === 0) {
          setFormData(prev => ({ ...prev, pricePerSeat: suggestedPrice.toString() }));
        }
      }
    } catch (error) {
      console.error("Routing error", error);
    }
  };

  // Recalculate price when vehicle changes
  useEffect(() => {
     if (distanceInfo) {
        const selectedVehicle = vehicles.find(v => v._id === formData.vehicle_id);
        const rate = selectedVehicle ? selectedVehicle.ratePerKm : 5;
        const suggestedPrice = Math.round(distanceInfo.distance * rate);
        setFormData(prev => ({ ...prev, pricePerSeat: suggestedPrice.toString() }));
     }
  }, [formData.vehicle_id]);

  const handleMapClick = async (lat: number, lng: number) => {
    if (!settingMarker) return;
    
    const pos: [number, number] = [lat, lng];
    try {
      // Reverse Geocode
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en&addressdetails=1&extratags=1`);
      const data = await res.json();
      const name = data.display_name ? data.display_name.split(',').slice(0, 5).join(',').trim() : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      if (settingMarker === 'start') {
        setStartPos(pos);
        setFormData(prev => ({ ...prev, source: name }));
        setSettingMarker(null);
      } else {
        setEndPos(pos);
        setFormData(prev => ({ ...prev, destination: name }));
        setSettingMarker(null);
      }
    } catch (error) {
       console.error("Reverse geocoding error", error);
    }
  };

  if (success) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20 text-center p-8 bg-white rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ride Created!</h2>
          <p className="text-gray-600">Your ride has been successfully published.</p>
          <p className="text-sm text-gray-400 mt-4">Redirecting to your rides...</p>
        </div>
      </Layout>
    );
  }

  return (
    <ErrorBoundary>
      <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a Ride</h1>
          <p className="text-gray-600 mb-6">Share your journey and help others travel</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!user?.drivingLicenseNumber ? (
            <div className="text-center py-16 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border-2 border-dashed border-red-200">
               <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldAlert className="w-10 h-10 text-red-600" />
               </div>
               <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification Required</h2>
               <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  To ensure safety on our platform, you must upload your driving license before you can create or host a ride.
               </p>
               <Link
                 to="/profile"
                 className="inline-flex items-center space-x-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-red-200"
               >
                 <span>Verify License Now</span>
               </Link>
            </div>
          ) : loadingVehicles ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your vehicles...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
              <Car className="w-12 h-12 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Vehicles Registered</h3>
              <p className="text-gray-600 mb-6 px-8 text-sm">
                You need to register at least one vehicle before you can create a ride.
              </p>
              <Link
                to="/vehicles/register"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Register Vehicle</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Form Side */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Locations Section */}
                <div className="space-y-4">
                  <div className="relative z-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                      <span><MapPin className="w-4 h-4 inline mr-1 text-green-600" /> Starting Point</span>
                      <button 
                         type="button" 
                         onClick={() => setSettingMarker(settingMarker === 'start' ? null : 'start')}
                         className={`text-xs px-2 py-1 object-right rounded-md border ${settingMarker === 'start' ? 'bg-green-100 border-green-400 text-green-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                         📍 Select on Map
                      </button>
                    </label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => handleLocationChange(e, 'start')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search pickup location..."
                      required
                    />
                    {startSuggestions.length > 0 && (
                      <ul className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[100] max-h-60 overflow-auto">
                        {startSuggestions.map((s, i) => (
                          <li key={i} className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm truncate" onClick={() => handleSuggestionClick(s, 'start')}>
                            {s.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="relative z-40">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                      <span><MapPin className="w-4 h-4 inline mr-1 text-red-600" /> Destination</span>
                      <button 
                         type="button" 
                         onClick={() => setSettingMarker(settingMarker === 'end' ? null : 'end')}
                         className={`text-xs px-2 py-1 rounded-md border ${settingMarker === 'end' ? 'bg-red-100 border-red-400 text-red-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                         📍 Select on Map
                      </button>
                    </label>
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => handleLocationChange(e, 'end')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search drop-off location..."
                      required
                    />
                    {endSuggestions.length > 0 && (
                      <ul className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[100] max-h-60 overflow-auto">
                        {endSuggestions.map((s, i) => (
                          <li key={i} className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm truncate" onClick={() => handleSuggestionClick(s, 'end')}>
                            {s.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Seats
                    </label>
                    <input
                      type="number"
                      name="totalSeats"
                      value={formData.totalSeats}
                      onChange={handleChange}
                      min="1"
                      max={vehicles.find(v => v._id === formData.vehicle_id)?.seatingCapacity || 8}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 3"
                      required
                    />
                  </div>

                   <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <IndianRupee className="w-4 h-4 inline mr-1" />
                      Price / Seat
                    </label>
                    <input
                      type="number"
                      name="pricePerSeat"
                      value={formData.pricePerSeat}
                      readOnly
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed font-semibold"
                      placeholder="Select route & vehicle"
                      required
                    />
                    {formData.vehicle_id && (
                       <p className="text-[10px] text-blue-600 mt-1 font-bold">
                          Rate: ₹{vehicles.find(v => v._id === formData.vehicle_id)?.ratePerKm || 0}/km
                       </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Car className="w-4 h-4 inline mr-1" />
                    Select Vehicle
                  </label>
                  <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-1">
                    {vehicles.map((vehicle) => (
                      <label
                        key={vehicle._id}
                        className={`relative flex items-center p-3 cursor-pointer rounded-xl border-2 transition-all ${formData.vehicle_id === vehicle._id
                          ? 'border-blue-600 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name="vehicle_id"
                          value={vehicle._id}
                          checked={formData.vehicle_id === vehicle._id}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                               <p className="font-bold text-gray-900 text-sm">{vehicle.vehicleModel}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-blue-600 uppercase">{vehicle.vehicleNumber}</p>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !startPos || !endPos}
                    className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Publish Ride'}
                  </button>
                </div>
              </form>

              {/* Map & Distance Info Side */}
              <div className="space-y-6">
                 {settingMarker && (
                    <div className={`p-3 rounded-lg text-sm font-semibold flex items-center justify-center animate-pulse ${settingMarker === 'start' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                       Click on the map to set the {settingMarker === 'start' ? 'Start' : 'Destination'} location
                    </div>
                 )}
                 <div className={settingMarker ? 'ring-4 ring-blue-300 rounded-xl transition-all' : ''}>
                   <Suspense fallback={<div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 border border-dashed border-gray-300 animate-pulse">Loading Interactive Map...</div>}>
                    <MapComponent 
                      startPos={startPos} 
                      endPos={endPos} 
                      routeGeometry={routeGeometry} 
                      onMapClick={handleMapClick} 
                    />
                   </Suspense>
                 </div>

                 {distanceInfo && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                       <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center">
                          <Navigation className="w-5 h-5 mr-2 text-blue-600" />
                          Trip Estimate
                       </h3>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-center">
                             <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Distance</p>
                             <p className="text-xl font-bold text-gray-800">{distanceInfo.distance.toFixed(1)} <span className="text-sm font-normal">km</span></p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-center">
                             <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Travel Time</p>
                             <p className="text-xl font-bold text-gray-800">{Math.round(distanceInfo.duration)} <span className="text-sm font-normal">min</span></p>
                          </div>
                       </div>
                       <p className="text-xs text-center text-gray-400 mt-4">
                       </p>
                    </div>
                 )}
              </div>

            </div>
          )}
        </div>
      </div>
    </Layout>
    </ErrorBoundary>
  );
}
