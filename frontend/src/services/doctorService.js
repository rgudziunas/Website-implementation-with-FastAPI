import api from './api';

const doctorService = {
  // Get all doctors
  getAllDoctors: async () => {
    const response = await api.get('/api/doctors');
    return response.data;
  },

  // Get single doctor
  getDoctor: async (id) => {
    const response = await api.get(`/api/doctors/${id}`);
    return response.data;
  },

  // Get doctor's appointments
  getDoctorAppointments: async (id) => {
    const response = await api.get(`/api/doctors/${id}/appointments`);
    return response.data;
  },

  // Get doctor's services
  getDoctorServices: async (id) => {
    const response = await api.get(`/api/doctors/${id}/services`);
    return response.data;
  },

  // Create doctor (admin only)
  createDoctor: async (doctorData) => {
    const response = await api.post('/api/doctors', doctorData);
    return response.data;
  },

  // Update doctor (admin only)
  updateDoctor: async (id, doctorData) => {
    const response = await api.put(`/api/doctors/${id}`, doctorData);
    return response.data;
  },

  // Delete doctor (admin only)
  deleteDoctor: async (id) => {
    await api.delete(`/api/doctors/${id}`);
  },

  getAssistantDoctors: async () => {
    const response = await api.get('/api/doctors');
    // Filter doctors with role 'assistant'
    return response.data.filter(doctor => doctor.role === 'assistant');
  },

  // Get all doctors except assistants
  getMainDoctors: async () => {
    const response = await api.get('/api/doctors');
    return response.data.filter(doctor => doctor.role === 'main');
  },
};

export default doctorService;