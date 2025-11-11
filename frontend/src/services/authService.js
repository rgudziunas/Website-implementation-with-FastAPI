import api from './api';

const authService = {
  // Register new patient
  registerPatient: async (userData) => {
    const response = await api.post('/api/auth/register/patient', userData);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('user_role', response.data.role);
    }
    return response.data;
  },

  // Login
  // Login
login: async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await api.post('/api/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  console.log('Login response:', response.data); // DEBUG LINE

  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    localStorage.setItem('user_role', response.data.role);
    
    console.log('Stored tokens:', {  // DEBUG LINE
      access: localStorage.getItem('access_token'),
      refresh: localStorage.getItem('refresh_token'),
      role: localStorage.getItem('user_role')
    });
  }

  return response.data;
},

  // Logout
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/api/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Get user role
  getUserRole: () => {
    return localStorage.getItem('user_role');
  },

  // Check if user is admin
  isAdmin: () => {
    return localStorage.getItem('user_role') === 'admin';
  },

  // Check if user is patient
  isPatient: () => {
    return localStorage.getItem('user_role') === 'patient';
  },
};

export default authService;