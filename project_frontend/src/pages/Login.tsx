import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleToggle = (type: 'user' | 'admin') => {
    setLoginType(type);
    setPassword('');
    setError('');
    setEmail('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // Optional: Verify role match if desired, but backend login already works
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-black tracking-tight">coRide</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Share journey • Save planet</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-white/20 backdrop-blur-sm">
          {/* Login Type Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
            <button
              onClick={() => handleToggle('user')}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-wider rounded-xl transition-all ${
                loginType === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              User Login
            </button>
            <button
              onClick={() => handleToggle('admin')}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-wider rounded-xl transition-all ${
                loginType === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Admin Login
            </button>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {loginType === 'admin' ? 'Admin Access' : 'Welcome Back'}
          </h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">
            {loginType === 'admin' ? 'Authorized Personnel Only' : 'Sign in to continue'}
          </p>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl mb-6 text-xs font-bold flex items-center animate-shake">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                {loginType === 'admin' ? 'Admin Email' : 'Email Address'}
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold"
                  placeholder={loginType === 'admin' ? 'admin@coride.com' : 'you@example.com'}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl disabled:opacity-50 ${
                loginType === 'admin' ? 'bg-gray-900 hover:bg-black shadow-gray-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
              }`}
            >
              {loading ? 'Authenticating...' : loginType === 'admin' ? 'Verify Identity' : 'Secure Sign In'}
            </button>
          </form>

          {loginType === 'user' && (
            <div className="mt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                  <span className="px-4 bg-white text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="flex justify-center transition-all hover:scale-[1.02]">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed')}
                  useOneTap
                  theme="outline"
                  shape="pill"
                  width="100%"
                />
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              {loginType === 'admin' ? 'Forgot admin password?' : "Don't have an account?"}{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-black">
                {loginType === 'admin' ? 'Contact IT' : 'Sign up'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
