import api from './api';

const appointmentService = {
  // Get all appointments
  getAllAppointments: async () => {
    const response = await api.get('/api/appointments');
    return response.data;
  },

  // Get single appointment
  getAppointment: async (id) => {
    const response = await api.get(`/api/appointments/${id}`);
    return response.data;
  },

  // Create appointment
  createAppointment: async (appointmentData) => {
    const response = await api.post('/api/appointments', appointmentData);
    return response.data;
  },

  // Update appointment
  updateAppointment: async (id, appointmentData) => {
    const response = await api.put(`/api/appointments/${id}`, appointmentData);
    return response.data;
  },

  // Get doctors for appointment
  getAppointmentDoctors: async (appointmentId) => {
    const response = await api.get(`/api/appointments/${appointmentId}/doctors`);
    return response.data;
  },

  // Assign single doctor to appointment
  assignDoctor: async (appointmentId, doctorId) => {
    const response = await api.post(`/api/appointments/${appointmentId}/doctors`, {
      doctor_id: doctorId
    });
    return response.data;
  },

  // Assign multiple doctors to appointment
  assignMultipleDoctors: async (appointmentId, doctorIds) => {
    const response = await api.post(
      `/api/appointments/${appointmentId}/doctors/bulk`,
      { doctors: doctorIds }
    );
    return response.data;
  },

  // Get services for appointment
  getAppointmentServices: async (appointmentId) => {
    const response = await api.get(`/api/appointments/${appointmentId}/services`);
    return response.data;
  },

  // Add service to appointment
  addServiceToAppointment: async (appointmentId, doctorId, serviceId, quantity = 1) => {
    const response = await api.post(
      `/api/appointments/${appointmentId}/doctors/${doctorId}/services`,
      {
        service_id: serviceId,
        quantity: quantity
      }
    );
    return response.data;
  },
};

export default appointmentService;