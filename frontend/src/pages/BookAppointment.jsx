import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCalendarAlt, FaClock, FaNotesMedical, FaArrowLeft, FaCheckSquare, FaSquare, FaUserMd, FaExclamationTriangle } from 'react-icons/fa';
import appointmentService from '../services/appointmentService';
import doctorService from '../services/doctorService';
import api from '../services/api';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const preselectedServiceId = location.state?.preselectedService;

  const [doctor, setDoctor] = useState(null);
  const [services, setServices] = useState([]);
  const [assistantDoctors, setAssistantDoctors] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedAssistants, setSelectedAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Appointment duration in minutes
  const [appointmentDuration, setAppointmentDuration] = useState(60);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    notes: '',
  });

  useEffect(() => {
    if (doctorId) {
      fetchDoctorAndServices();
      fetchAssistantDoctors();
    }
  }, [doctorId]);

  // Check availability when date and time are selected
  useEffect(() => {
    if (formData.date && formData.time) {
      checkAvailability();
    } else {
      setAvailabilityMessage(null);
    }
  }, [formData.date, formData.time, selectedAssistants, appointmentDuration]);

  const fetchDoctorAndServices = async () => {
    try {
      const doctorResponse = await doctorService.getDoctor(doctorId);
      setDoctor(doctorResponse);

      const servicesResponse = await doctorService.getDoctorServices(doctorId);
      const filteredServices = servicesResponse.filter(
        service => !service.name.toLowerCase().includes('asistavimas')
      );
      setServices(filteredServices);

      if (preselectedServiceId) {
        const serviceExists = filteredServices.find(s => s.id === preselectedServiceId);
        if (serviceExists) {
          setSelectedServices([preselectedServiceId]);
        }
      }
    } catch (error) {
      console.error('Error fetching doctor/services:', error);
      setMessage({ type: 'error', text: 'Failed to load doctor information' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssistantDoctors = async () => {
    try {
      const response = await doctorService.getAssistantDoctors();
      setAssistantDoctors(response);
    } catch (error) {
      console.error('Error fetching assistant doctors:', error);
    }
  };

  const checkAvailability = async () => {
    setCheckingAvailability(true);
    setAvailabilityMessage(null);

    try {
      const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + appointmentDuration * 60000);

      // Check all doctors (main + assistants)
      const allDoctorIds = [parseInt(doctorId), ...selectedAssistants];

      for (const checkDoctorId of allDoctorIds) {
        // Get all appointments for this doctor
        const doctorAppointmentsResponse = await api.get(`/api/doctors/${checkDoctorId}/appointments`);
        const doctorAppointments = doctorAppointmentsResponse.data;

        // Get doctor name
        const doctorResponse = await api.get(`/api/doctors/${checkDoctorId}`);
        const doctorName = doctorResponse.data.full_name;

        // Check for conflicts
        for (const existingApt of doctorAppointments) {
          // Skip cancelled/rejected appointments
          if (existingApt.status === 'canceled' || existingApt.status === 'rejected') {
            continue;
          }

          const existingStart = new Date(existingApt.start_at);
          const existingEnd = new Date(existingApt.end_at);

          // Check for time overlap
          const hasOverlap = (
            (startDateTime >= existingStart && startDateTime < existingEnd) ||
            (endDateTime > existingStart && endDateTime <= existingEnd) ||
            (startDateTime <= existingStart && endDateTime >= existingEnd)
          );

          if (hasOverlap) {
  setAvailabilityMessage({
    type: 'error',
    text: `Dr. ${doctorName} is not available at this time.`,
    doctor: doctorName
  });
  setCheckingAvailability(false);
  return;
}
        }
      }

      // All doctors are available
      setAvailabilityMessage({
        type: 'success',
        text: 'All selected doctors are available at this time! ✓'
      });

    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityMessage({
        type: 'error',
        text: 'Failed to check availability. Please try again.'
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDurationChange = (e) => {
    setAppointmentDuration(parseInt(e.target.value));
  };

  const toggleService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const toggleAssistant = (assistantId) => {
    setSelectedAssistants(prev => {
      if (prev.includes(assistantId)) {
        return prev.filter(id => id !== assistantId);
      } else {
        return [...prev, assistantId];
      }
    });
  };

  const requiresAssistant = () => {
    return true;
  };

  const calculateTotalPrice = () => {
    return services
      .filter(service => selectedServices.includes(service.id))
      .reduce((total, service) => total + parseFloat(service.price), 0)
      .toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Validation: Every appointment needs at least one assistant
      if (selectedAssistants.length === 0) {
        setMessage({ 
          type: 'error', 
          text: 'Please select at least one assistant doctor for this appointment' 
        });
        setSubmitting(false);
        return;
      }

      // Check if doctors are available (final check)
      if (availabilityMessage?.type === 'error') {
        setMessage({ 
          type: 'error', 
          text: 'Cannot book appointment: ' + availabilityMessage.text 
        });
        setSubmitting(false);
        return;
      }

      // Create appointment
      const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + appointmentDuration * 60000);

      const appointmentData = {
        patient_id: user.id,
        start_at: startDateTime.toISOString(),
        end_at: endDateTime.toISOString(),
        notes: formData.notes,
        status: 'pending'
      };

      console.log('Creating appointment...', appointmentData);
      const appointment = await appointmentService.createAppointment(appointmentData);
      console.log('Appointment created:', appointment);

      // Assign all doctors
      const allDoctorIds = [parseInt(doctorId), ...selectedAssistants];
      console.log('Assigning doctors:', allDoctorIds);
      await appointmentService.assignMultipleDoctors(appointment.id, allDoctorIds);
      console.log('Doctors assigned successfully');

      // Add services
      if (selectedServices.length > 0) {
        console.log('Adding services:', selectedServices);
        await Promise.all(
          selectedServices.map(serviceId =>
            appointmentService.addServiceToAppointment(
              appointment.id,
              parseInt(doctorId),
              serviceId,
              1
            )
          )
        );
        console.log('Services added successfully');
      }

      setMessage({ type: 'success', text: 'Appointment booked successfully!' });
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);

    } catch (error) {
      console.error('Error booking appointment:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to book appointment';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px-200px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px-200px)] py-12 bg-gray-50">
      <div className="container-custom max-w-2xl">
        <button
          onClick={() => navigate('/doctors')}
          className="btn btn-secondary mb-6 flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          Back to Doctors
        </button>

        <div className="card mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Appointment</h1>
          <p className="text-gray-600">Schedule an appointment with {doctor?.full_name}</p>
        </div>

        {doctor && (
          <div className="card mb-6 bg-blue-50 border-blue-200 animate-slide-in">
            <div className="flex items-center">
              <div className="bg-blue-600 text-white p-4 rounded-full text-2xl mr-4">
                <FaNotesMedical />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{doctor.full_name}</h3>
                <p className="text-gray-700">{doctor.specialization}</p>
                {doctor.email && <p className="text-gray-600 text-sm">{doctor.email}</p>}
              </div>
            </div>
          </div>
        )}

        {message.text && (
          <div
            className={`card mb-6 animate-fade-in ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="card animate-slide-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Appointment Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={getMinDate()}
                max={getMaxDate()}
                required
                className="input"
              />
              <p className="text-sm text-gray-500 mt-1">
                Select a date within the next 3 months
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaClock className="inline mr-2" />
                Appointment Time
              </label>
              <select
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="">Select a time</option>
                <option value="09:00">09:00 AM</option>
                <option value="09:30">09:30 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="10:30">10:30 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="14:00">02:00 PM</option>
                <option value="14:30">02:30 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="15:30">03:30 PM</option>
                <option value="16:00">04:00 PM</option>
                <option value="16:30">04:30 PM</option>
              </select>
            </div>

            {/* Appointment Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaClock className="inline mr-2" />
                Appointment Duration
              </label>
              
            </div>

            {/* Availability Check Message */}
            {(checkingAvailability || availabilityMessage) && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  checkingAvailability
                    ? 'bg-blue-50 border-blue-200'
                    : availabilityMessage.type === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {checkingAvailability ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-blue-700">Checking availability...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    {availabilityMessage.type === 'success' ? (
                      <span className="text-green-700 font-medium">{availabilityMessage.text}</span>
                    ) : (
                      <div>
                        <div className="flex items-center text-red-700 font-medium mb-1">
                          <FaExclamationTriangle className="mr-2" />
                          Not Available
                        </div>
                        <p className="text-red-600 text-sm">{availabilityMessage.text}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Services Selection */}
            {services.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaNotesMedical className="inline mr-2" />
                  Select Services (Optional)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {services.map(service => (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center flex-1">
                        <div className="text-blue-600 text-xl mr-3">
                          {selectedServices.includes(service.id) ? <FaCheckSquare /> : <FaSquare />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-gray-600">{service.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="text-lg font-bold text-blue-600">
                          €{parseFloat(service.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedServices.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700">
                      Total Cost: <span className="text-xl text-blue-600">€{calculateTotalPrice()}</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedServices.length} service(s) selected
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Assistant Doctors Selection */}
            {requiresAssistant() && assistantDoctors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaUserMd className="inline mr-2" />
                  Select Assistant Doctor(s) <span className="text-red-600">*Required</span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-orange-200 rounded-lg p-3 bg-orange-50">
                  <p className="text-sm text-orange-700 mb-2">
                    Surgical procedures require at least one assistant doctor
                  </p>
                  {assistantDoctors.map(assistant => (
                    <div
                      key={assistant.id}
                      onClick={() => toggleAssistant(assistant.id)}
                      className="flex items-center p-3 hover:bg-orange-100 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="text-orange-600 text-xl mr-3">
                        {selectedAssistants.includes(assistant.id) ? <FaCheckSquare /> : <FaSquare />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{assistant.full_name}</p>
                        <p className="text-sm text-gray-600">{assistant.specialization}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedAssistants.length > 0 && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ {selectedAssistants.length} assistant(s) selected
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaNotesMedical className="inline mr-2" />
                Reason for Visit
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Please describe your symptoms or reason for the appointment..."
                className="input"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting || availabilityMessage?.type === 'error' || checkingAvailability}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Booking...' : 'Book Appointment'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/doctors')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;