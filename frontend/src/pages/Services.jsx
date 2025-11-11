import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHospital, FaCalendarPlus, FaUserMd } from 'react-icons/fa';
import api from '../services/api';
import serviceService from '../services/serviceService';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const servicesRes = await api.get('/api/services');
      
      // Filter out "Asistavimas" services from display
      const filteredServices = servicesRes.data.filter(
        service => !service.name.toLowerCase().includes('asistavimas')
      );
      
      setServices(filteredServices);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = async (service) => {
    setSelectedService(service);
    setShowDoctorModal(true);
    setLoadingDoctors(true);

    try {
      // Fetch only doctors who can perform THIS specific service
      const doctors = await serviceService.getDoctorsForService(service.id);
      setAvailableDoctors(doctors);
    } catch (error) {
      console.error('Error fetching doctors for service:', error);
      setAvailableDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleDoctorSelection = (doctorId) => {
    setShowDoctorModal(false);
    navigate(`/book-appointment/${doctorId}`, { 
      state: { preselectedService: selectedService.id } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h1>
          <p className="text-xl text-gray-600">
            Comprehensive healthcare services for all your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={service.id}
              className="card hover:shadow-xl transition-all animate-slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-600 p-4 rounded-full text-3xl mr-4">
                  <FaHospital />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    €{parseFloat(service.price).toFixed(2)}
                  </p>
                </div>
              </div>

              {service.description && (
                <p className="text-gray-600 mb-4">{service.description}</p>
              )}

              <button
                onClick={() => handleBookNow(service)}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                <FaCalendarPlus className="mr-2" />
                Book Now
              </button>
            </div>
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <FaHospital className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No services available</h3>
            <p className="text-gray-600">Please check back later</p>
          </div>
        )}
      </div>

      {/* Doctor Selection Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Select a Doctor</h2>
                <button
                  onClick={() => setShowDoctorModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Service:</p>
                <p className="text-lg font-semibold text-gray-900">{selectedService?.name}</p>
                <p className="text-xl font-bold text-blue-600 mt-1">
                  €{parseFloat(selectedService?.price || 0).toFixed(2)}
                </p>
              </div>

              {loadingDoctors ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : availableDoctors.length > 0 ? (
                <>
                  <p className="text-gray-600 mb-4">
                    {availableDoctors.length} qualified {availableDoctors.length === 1 ? 'doctor' : 'doctors'} available for this service:
                  </p>
                  <div className="space-y-3">
                    {availableDoctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        onClick={() => handleDoctorSelection(doctor.id)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
                              <FaUserMd className="text-xl" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Dr. {doctor.full_name}
                              </h3>
                              <p className="text-gray-600">{doctor.specialization}</p>
                              {doctor.email && (
                                <p className="text-sm text-gray-500">{doctor.email}</p>
                              )}
                            </div>
                          </div>
                          <FaCalendarPlus className="text-blue-600 text-2xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <FaUserMd className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-700 font-semibold mb-2">No available doctors</p>
                  <p className="text-gray-600">
                    Unfortunately, no doctors can perform this service at the moment.
                  </p>
                  <button
                    onClick={() => setShowDoctorModal(false)}
                    className="btn btn-secondary mt-4"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;