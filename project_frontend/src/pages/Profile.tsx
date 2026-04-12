import { useState, useEffect } from 'react';
import { User, Mail, Phone, Star, Car, Shield, Plus, Trash2, Users, Fuel, ShieldCheck, Upload, ExternalLink, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Vehicle } from '../types';

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  const [licenseData, setLicenseData] = useState({
    drivingLicenseNumber: user?.drivingLicenseNumber || '',
    licenseFile: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [stats, setStats] = useState({
    ridesCreated: 0,
    ridesJoined: 0,
    rating: user?.rating || 0,
    requestsReceived: 0,
    requestsSent: 0
  });

  const { updateUser } = useAuth();

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
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoadingVehicles(false);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/user/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchVehicles();
    fetchStats();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLicenseData({ ...licenseData, licenseFile: e.target.files[0] });
    }
  };

  const handleLicenseUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseData.licenseFile && !user?.drivingLicenseImage) {
      setUploadError('Please select a license image to upload');
      return;
    }
    if (!licenseData.drivingLicenseNumber) {
      setUploadError('Please enter your driving license number');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('drivingLicenseNumber', licenseData.drivingLicenseNumber);
      if (licenseData.licenseFile) {
        formData.append('licenseImage', licenseData.licenseFile);
      }

      const response = await fetch('http://localhost:5001/api/user/upload-license', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data?.message || `Server error: ${response.statusText}`);
      }

      updateUser({
        drivingLicenseNumber: data.drivingLicenseNumber,
        drivingLicenseImage: data.drivingLicenseImage,
      });

      setUploadSuccess(true);
      setLicenseData(prev => ({ ...prev, licenseFile: null }));
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name}</h2>
              <p className="text-gray-600 mb-4">{user?.email}</p>

              {user?.role !== 'admin' && (
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-2xl font-bold text-gray-900">{stats.rating > 0 ? stats.rating.toFixed(1) : (user?.rating || '0.0')}</span>
                </div>
              )}

              {user?.role === 'admin' && (
                <div className="flex items-center justify-center space-x-2 px-3 py-1 bg-purple-100 rounded-full">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Admin</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-900">{user?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-medium text-gray-900">{user?.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sections hidden for Admin */}
            {user?.role !== 'admin' && (
              <>
                {/* License Verification Section */}
                <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                 <div className="p-3 bg-green-100 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-gray-900">License Verification</h3>
                    <p className="text-sm text-gray-500">Required to create and host rides</p>
                 </div>
              </div>

              {uploadError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center space-x-2 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 flex items-center space-x-2 text-sm">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  <span>License details updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleLicenseUpload} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                       Driving License Number
                    </label>
                    <input
                       type="text"
                       value={licenseData.drivingLicenseNumber}
                       onChange={(e) => setLicenseData({ ...licenseData, drivingLicenseNumber: e.target.value.toUpperCase().replace(/\s/g, '') })}
                       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="e.g., GJ0120230012345"
                       pattern="^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$"
                       title="Please enter a valid 15-digit Indian Driving License number (e.g., GJ0120230012345)"
                       maxLength={15}
                       required
                    />
                    <p className="mt-1 text-[10px] text-gray-400">Format: GJ0120230012345 (15 characters)</p>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Image (JPG, PNG)
                     </label>
                     <div className="flex items-center space-x-4">
                        <label className="flex flex-1 items-center justify-center px-4 py-2.5 border border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                           <Upload className="w-5 h-5 text-gray-400 mr-2" />
                           <span className="text-sm text-gray-600">
                              {licenseData.licenseFile ? licenseData.licenseFile.name : 'Choose Image'}
                           </span>
                           <input type="file" className="hidden" accept="image/*" onChange={handleLicenseFileChange} />
                        </label>
                     </div>
                  </div>
                </div>

                {user?.drivingLicenseImage && (
                   <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-12 h-12 bg-white rounded border border-blue-200 overflow-hidden mr-3">
                         <img src={`http://localhost:5001/${user.drivingLicenseImage}`} alt="License" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                         <p className="text-xs font-bold text-blue-700 uppercase">Current Document</p>
                         <p className="text-[10px] text-blue-500">Last updated recently</p>
                      </div>
                      <a href={`http://localhost:5001/${user.drivingLicenseImage}`} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                         <ExternalLink className="w-4 h-4" />
                      </a>
                   </div>
                )}

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {uploading ? (
                     <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Uploading...
                     </>
                  ) : (
                     'Update License Details'
                  )}
                </button>
              </form>
            </div>

            {/* My Vehicles */}
            <div className="bg-white rounded-xl shadow-sm p-6 text-gray-900">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">My Vehicles</h3>
                <Link
                  to="/vehicles/register"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vehicle</span>
                </Link>
              </div>

              {loadingVehicles ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : vehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle._id} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors group relative">
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to remove this vehicle?')) {
                            try {
                              const response = await fetch(`http://localhost:5001/api/vehicle/${vehicle._id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                },
                              });
                              if (response.ok) {
                                setVehicles(vehicles.filter(v => v._id !== vehicle._id));
                              } else {
                                const data = await response.json();
                                alert(data.message || 'Failed to delete vehicle');
                              }
                            } catch (err) {
                              console.error('Error deleting vehicle:', err);
                              alert('An error occurred while deleting the vehicle');
                            }
                          }
                        }}
                        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Car className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{vehicle.vehicleModel}</h4>
                            <p className="text-xs text-gray-500">{vehicle.vehicleType}</p>
                          </div>
                        </div>
                        <div className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase">
                          {vehicle.vehicleNumber}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-blue-500" />
                          <span>{vehicle.seatingCapacity} seats</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Fuel className="w-3 h-3 text-green-500" />
                          <span>{vehicle.fuelType}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                           <span className="font-bold text-blue-600">₹</span>
                           <span>{vehicle.ratePerKm}/km</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No vehicles registered yet</p>
                  <Link to="/vehicles/register" className="text-blue-600 hover:underline text-sm font-semibold">
                    Register your first vehicle
                  </Link>
                </div>
              )}
            </div>

            {/* Ride Statistics */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Ride Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-gray-600">Total Rides</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.ridesCreated + stats.ridesJoined}</p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm text-gray-600">Average Rating</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.rating > 0 ? stats.rating.toFixed(1) : (user?.rating || '0.0')}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Car className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-gray-600">Rides Created</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.ridesCreated}</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-5 h-5 text-purple-600" />
                    <p className="text-sm text-gray-600">Rides Joined</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.ridesJoined}</p>
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
