import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          console.log('Initial user data from /auth/me:', userData); // DEBUG
          
          // If user is a patient, fetch full patient details
          if (userData.role === 'patient') {
            const patientResponse = await api.get(`/api/patients/${userData.id}`);
            console.log('Full patient data:', patientResponse.data); // DEBUG
            const fullUserData = {
              ...userData,
              ...patientResponse.data
            };
            setUser(fullUserData);
          } else {
            setUser(userData);
          }
          
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to get user data:', error);
          authService.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authService.login(username, password);
      const userData = await authService.getCurrentUser();
      
      // Fetch full patient data if patient
      if (userData.role === 'patient') {
        const patientResponse = await api.get(`/api/patients/${userData.id}`);
        const fullUserData = {
          ...userData,
          ...patientResponse.data
        };
        setUser(fullUserData);
      } else {
        setUser(userData);
      }
      
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const registerPatient = async (userData) => {
    try {
      const data = await authService.registerPatient(userData);
      const user = await authService.getCurrentUser();
      
      // Fetch full patient data
      const patientResponse = await api.get(`/api/patients/${user.id}`);
      const fullUserData = {
        ...user,
        ...patientResponse.data
      };
      setUser(fullUserData);
      
      setIsAuthenticated(true);
      toast.success('Registration successful!');
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      toast.info('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    loading,
    login,
    registerPatient,
    logout,
    isAdmin: authService.isAdmin(),
    isPatient: authService.isPatient(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};