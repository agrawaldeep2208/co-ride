import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

const API_URL = 'http://localhost:5001/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string, phone: string, otp: string) => Promise<User>;
  logout: () => void;
  sendOTP: (email: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<User>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const { token, ...userData } = data;

      const userObj: User = {
        id: userData._id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        status: userData.status,
        totalRides: userData.totalRides || 0,
        rating: userData.rating || 0,
        drivingLicenseNumber: userData.drivingLicenseNumber || null,
        drivingLicenseImage: userData.drivingLicenseImage || null,
        createdAt: userData.createdAt,
      };

      setUser(userObj);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
      return userObj;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const sendOTP = async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, phone: string, otp: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, phone, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const { token, ...userData } = data;

      const userObj: User = {
        id: userData._id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        status: userData.status,
        totalRides: userData.totalRides || 0,
        rating: userData.rating || 0,
        drivingLicenseNumber: userData.drivingLicenseNumber || null,
        drivingLicenseImage: userData.drivingLicenseImage || null,
        createdAt: userData.createdAt,
      };

      setUser(userObj);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
      return userObj;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const googleLogin = async (idToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google login failed');
      }

      const { token, ...userData } = data;

      const userObj: User = {
        id: userData._id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        status: userData.status,
        totalRides: userData.totalRides || 0,
        rating: userData.rating || 0,
        drivingLicenseNumber: userData.drivingLicenseNumber || null,
        drivingLicenseImage: userData.drivingLicenseImage || null,
        createdAt: userData.createdAt,
      };

      setUser(userObj);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
      return userObj;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, sendOTP, googleLogin, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
