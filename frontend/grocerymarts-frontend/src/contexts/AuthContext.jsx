import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password }, {
        withCredentials: true
      });
      const data = res.data;
      console.log('Login response:', data); // Debug log
      if (data.user) {
        const userData = { ...data.user, role: data.role }; // Include role explicitly
        console.log('Storing user:', userData); // Debug log
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        // Store token if provided
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        return { success: true, user: userData, role: data.role };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      setLoading(false);
      if (data.token) {
        const user = { ...data.user, token: data.token };
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true, user };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (err) {
      setLoading(false);
      return { success: false, message: 'Network error' };
    }
  };

  const sendOtp = async ({ email }) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, message: 'Network error' };
    }
  };

  const verifyOtp = async ({ email, otp }) => {
    try {
      const res = await fetch('http://localhost:5000/api/otp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, message: 'Network error' };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put('http://localhost:5000/api/auth/me', profileData, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.user) {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      return { success: false, message: 'Update failed' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Update failed' };
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  
  console.log('AuthContext state:', { isAuthenticated, isAdmin, userRole: user?.role });

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    register,
    loading,
    sendOtp,
    verifyOtp,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
