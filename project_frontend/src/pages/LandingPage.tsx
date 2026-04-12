import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Users, MapPin, DollarSign, Clock, Star, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Safe & Secure',
      description: 'Verified drivers and riders with real-time safety features and emergency support available 24/7.',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Lightning Fast',
      description: 'Quick ride matching algorithm ensures you find the perfect ride in seconds.',
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Affordable Pricing',
      description: 'Transparent pricing with no hidden charges. Share rides and save up to 50% on travel costs.',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Community Driven',
      description: 'Join thousands of commuters in our growing community and make new connections.',
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: 'Real-time Tracking',
      description: 'Track your ride in real-time with GPS integration and live driver location updates.',
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Reliable Service',
      description: 'Scheduled rides, instant bookings, and a 99.5% on-time arrival guarantee.',
    },
  ];

  const stats = [
    { number: '50K+', label: 'Active Users' },
    { number: '100K+', label: 'Rides Completed' },
    { number: '4.8/5', label: 'Average Rating' },
    { number: '24/7', label: 'Support' },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Daily Commuter',
      text: 'This app has saved me so much money on my daily commute. The drivers are always professional and friendly!',
      rating: 5,
    },
    {
      name: 'James Wilson',
      role: 'Frequent Traveler',
      text: 'The reliability and safety features give me peace of mind. Best ride-sharing app I\'ve used.',
      rating: 5,
    },
    {
      name: 'Priya Patel',
      role: 'College Student',
      text: 'Affordable, convenient, and I\'ve made some great friends through this platform.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            coRide
          </div>
          <div className="flex gap-4">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="px-6 py-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Share Your <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Journey</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Connect with riders going your way. Save money, reduce traffic, and build community one ride at a time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Get Started
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={handleSignIn}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Sign In
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-200">
              {stats.map((stat, index) => (
                <div key={index}>
                  <p className="text-3xl font-bold text-blue-600">{stat.number}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur-3xl opacity-20"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-semibold text-gray-900">Downtown Center</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-semibold text-gray-900">Tech Park</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Available Rides</span>
                  <span className="text-blue-600 font-bold">12</span>
                </div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-white rounded cursor-pointer transition-colors">
                      <span className="text-gray-700">Driver {i + 1} • {5 + i} mins</span>
                      <span className="text-blue-600 font-semibold">${12 + i}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose RideHub?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of ride-sharing with features designed for your comfort and safety.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Loved by Our Community
            </h2>
            <p className="text-xl text-gray-600">
              See what thousands of happy riders are saying about us.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">&quot;{testimonial.text}&quot;</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white space-y-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                {user ? 'Ready for Your Next Ride?' : 'Ready to Join Our Community?'}
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                {user ? 'Find rides, save money, and connect with your community.' : 'Get your first ride at a special introductory price. Sign up today and start saving!'}
              </p>
            </div>

            <button
              onClick={handleGetStarted}
              className="px-10 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2 group text-lg"
            >
              {user ? 'Go to Dashboard' : 'Get Started Now'}
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="text-white font-bold text-lg mb-4">RideHub</p>
              <p className="text-sm">Sharing rides, sharing community, sharing sustainability.</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-4">Product</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety</a></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-4">Company</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-4">Legal</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 RideHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
