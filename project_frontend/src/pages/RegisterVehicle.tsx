import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Hash, Info, Fuel, Settings, Users, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';

const vehicleData: Record<string, { capacity: number; rates: Record<string, number> }> = {
  bike: {
    capacity: 1,
    rates: {
      Petrol: 2.5,
      EV: 1.5
    }
  },
  hatchback: {
    capacity: 4,
    rates: {
      Petrol: 6,
      CNG: 4,
      Diesel: 5,
      EV: 3
    }
  },
  sedan: {
    capacity: 4,
    rates: {
      Petrol: 7,
      Diesel: 6,
      EV: 4
    }
  },
  suv: {
    capacity: 6,
    rates: {
      Petrol: 9,
      Diesel: 8,
      EV: 5
    }
  }
};

export default function RegisterVehicle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    vehicleModel: '',
    vehicleNumber: '',
    vehicleType: 'Hatchback',
    fuelType: 'Petrol',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If vehicle type changes, ensure fuel type is valid for new type
    if (name === 'vehicleType') {
      const typeKey = value.toLowerCase();
      const availableFuels = Object.keys(vehicleData[typeKey].rates);
      if (!availableFuels.includes(formData.fuelType)) {
        setFormData(prev => ({ ...prev, vehicleType: value, fuelType: availableFuels[0] }));
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const currentTypeData = vehicleData[formData.vehicleType.toLowerCase()];
  const currentRate = currentTypeData.rates[formData.fuelType] || 0;
  const currentCapacity = currentTypeData.capacity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation for Indian Vehicle Number
    const cleanNumber = formData.vehicleNumber.replace(/\s+/g, '').toUpperCase();
    const standardRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    const bhRegex = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

    if (!standardRegex.test(cleanNumber) && !bhRegex.test(cleanNumber)) {
      setError('Invalid vehicle number format. Should be like MH12AB1234 or 22BH1234A.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          vehicleNumber: cleanNumber,
          ratePerKm: currentRate,
          seatingCapacity: currentCapacity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register vehicle');
      }

      setSuccess(true);
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20 text-center p-8 bg-white rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Registered!</h2>
          <p className="text-gray-600">Your vehicle has been successfully added to your profile.</p>
          <p className="text-sm text-gray-400 mt-4">Redirecting you back...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Register Vehicle</h1>
              <p className="text-gray-600">Add your vehicle details for ride sharing</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Info className="w-4 h-4 inline mr-1" />
                  Vehicle Model
                </label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Maruti Swift"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Vehicle Number
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., MH12AB1234"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Settings className="w-4 h-4 inline mr-1" />
                  Vehicle Type
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Bike">Bike</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Fuel className="w-4 h-4 inline mr-1" />
                  Fuel Type
                </label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Object.keys(currentTypeData.rates).map(fuel => (
                    <option key={fuel} value={fuel}>{fuel}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auto-calculated Details Preview */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 flex justify-around items-center">
               <div className="text-center">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Seating Capacity</p>
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="w-5 h-5 text-blue-700" />
                    <span className="text-2xl font-bold text-gray-900">{currentCapacity} Seats</span>
                  </div>
               </div>
               <div className="w-px h-12 bg-blue-200"></div>
               <div className="text-center">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Rate per KM</p>
                  <div className="flex items-center justify-center space-x-1">
                    <span className="text-blue-700 font-bold">₹</span>
                    <span className="text-2xl font-bold text-gray-900">{currentRate.toFixed(2)}</span>
                  </div>
               </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
