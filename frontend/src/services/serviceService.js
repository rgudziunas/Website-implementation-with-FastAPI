import api from './api';

const serviceService = {
  // Get all services
  getAllServices: async () => {
    const response = await api.get('/api/services');
    return response.data;
  },

  // Get single service
  getService: async (id) => {
    const response = await api.get(`/api/services/${id}`);
    return response.data;
  },

  // Create service (admin only)
  createService: async (serviceData) => {
    const response = await api.post('/api/services', serviceData);
    return response.data;
  },

  // Update service (admin only)
  updateService: async (id, serviceData) => {
    const response = await api.put(`/api/services/${id}`, serviceData);
    return response.data;
  },

  // Delete service (admin only)
  deleteService: async (id) => {
    await api.delete(`/api/services/${id}`);
  },

  getDoctorsForService: async (serviceId) => {
    const response = await api.get(`/api/services/${serviceId}/doctors`);
    return response.data;
  },
};

export default serviceService;