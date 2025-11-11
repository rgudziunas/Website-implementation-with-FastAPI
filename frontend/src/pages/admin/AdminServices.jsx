import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaTimes, FaUserMd } from 'react-icons/fa';
import api from '../../services/api';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceDoctors, setServiceDoctors] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  });

  useEffect(() => {
    fetchServices();
    fetchDoctors();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/api/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/api/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchServiceDoctors = async (serviceId) => {
    try {
      const response = await api.get(`/api/services/${serviceId}/doctors`);
      setServiceDoctors(response.data);

      // Filter available doctors (not yet assigned)
      const assignedIds = response.data.map((d) => d.id);
      const available = doctors.filter(
        (d) => !assignedIds.includes(d.id) && d.active && d.role === 'main'
      );
      setAvailableDoctors(available);
    } catch (error) {
      console.error('Error fetching service doctors:', error);
    }
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        price: service.price.toString(),
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        price: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
    };

    try {
      if (editingService) {
        await api.put(`/api/services/${editingService.id}`, payload);
      } else {
        await api.post('/api/services', payload);
      }
      handleCloseModal();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      alert(error.response?.data?.detail || 'Failed to save service');
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await api.delete(`/api/services/${serviceId}`);
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
  };

  const handleManageDoctors = (service) => {
    setSelectedService(service);
    fetchServiceDoctors(service.id);
    setShowDoctorsModal(true);
  };

  const handleAddDoctor = async (doctorId) => {
    try {
      await api.post(`/api/doctors/${doctorId}/services/link`, {
        service_id: selectedService.id,
      });
      fetchServiceDoctors(selectedService.id);
    } catch (error) {
      console.error('Error adding doctor:', error);
      alert('Failed to add doctor to service');
    }
  };

  const handleRemoveDoctor = async (doctorId) => {
    try {
      await api.delete(`/api/doctors/${doctorId}/services/${selectedService.id}`);
      fetchServiceDoctors(selectedService.id);
    } catch (error) {
      console.error('Error removing doctor:', error);
      alert('Failed to remove doctor from service');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 font-medium transition-colors"
        >
          <FaPlus />
          <span>Add Service</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services
          .filter((service) => !service.name.toLowerCase().includes('asistavimas'))
          .map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                  )}
                  <p className="text-3xl font-bold text-blue-600">
                    €{parseFloat(service.price).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleManageDoctors(service)}
                  className="text-purple-600 hover:text-purple-900 flex items-center space-x-1"
                  title="Manage Doctors"
                >
                  <FaUserMd className="text-lg" />
                  <span className="text-sm">Doctors</span>
                </button>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleOpenModal(service)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                  >
                    <FaEdit className="text-lg" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <FaTrash className="text-lg" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {services.filter((s) => !s.name.toLowerCase().includes('asistavimas')).length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No services available</p>
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Teeth Cleaning"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Brief description of the service..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (€) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {editingService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Doctors Modal */}
      {showDoctorsModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Manage Doctors for {selectedService.name}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Price: €{parseFloat(selectedService.price).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setShowDoctorsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Assigned Doctors */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Assigned Doctors ({serviceDoctors.length})
                  </h3>
                  <div className="space-y-2">
                    {serviceDoctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">Dr. {doctor.full_name}</p>
                          <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveDoctor(doctor.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                    {serviceDoctors.length === 0 && (
                      <p className="text-gray-500 text-sm">No doctors assigned yet</p>
                    )}
                  </div>
                </div>

                {/* Available Doctors */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Available Doctors ({availableDoctors.length})
                  </h3>
                  <div className="space-y-2">
                    {availableDoctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">Dr. {doctor.full_name}</p>
                          <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        </div>
                        <button
                          onClick={() => handleAddDoctor(doctor.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    ))}
                    {availableDoctors.length === 0 && (
                      <p className="text-gray-500 text-sm">All doctors assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDoctorsModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;