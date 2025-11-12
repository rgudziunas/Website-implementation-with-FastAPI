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
          console.log('Initial user data from /auth/me:', userData);
          
          // If user is a patient, fetch full patient details
          if (userData.role === 'patient') {
            const patientResponse = await api.get(`/api/patients/${userData.id}`);
            console.log('Full patient data:', patientResponse.data);
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
          // Don't call logout here - just clear local state
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_role');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    console.log('AuthContext - Login called');
    try {
      const data = await authService.login(username, password);
      console.log('AuthContext - Login data received:', data);
      
      const userData = await authService.getCurrentUser();
      console.log('AuthContext - User data received:', userData);
      
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
      console.error('AuthContext - Login error:', error);
      console.error('AuthContext - Error response:', error?.response);
      
      // Don't call logout on login failure - just throw the error
      const message = error.response?.data?.detail || 'Invalid username or password';
      toast.error(message);
      
      // Re-throw the error so Login.jsx can catch it
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
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      toast.info('Logged out successfully');
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