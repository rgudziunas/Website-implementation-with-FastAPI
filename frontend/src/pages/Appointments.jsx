import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCalendarAlt, FaClock, FaUserMd, FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaBan, FaNotesMedical, FaEdit, FaSave, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import api from '../services/api';

// AppointmentCard component with services and edit functionality
const AppointmentCard = ({ appointment, index, onCancel, onUpdate }) => {
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState(null);
  const [editData, setEditData] = useState({
    date: '',
    time: '',
  });

  useEffect(() => {
    fetchDoctorsAndServices();
  }, [appointment.id]);

  useEffect(() => {
    // Initialize edit data when appointment changes
    const startDate = new Date(appointment.start_at);
    
    setEditData({
      date: startDate.toISOString().split('T')[0],
      time: startDate.toTimeString().slice(0, 5),
    });
  }, [appointment]);

  // Check availability when date or time changes in edit mode
  useEffect(() => {
    if (isEditing && editData.date && editData.time) {
      checkAvailability();
    }
  }, [editData.date, editData.time, isEditing]);

  const fetchDoctorsAndServices = async () => {
    try {
      const doctorsResponse = await api.get(`/api/appointments/${appointment.id}/doctors`);
      setDoctors(doctorsResponse.data);

      const servicesResponse = await api.get(`/api/appointments/${appointment.id}/services`);
      setServices(servicesResponse.data);
    } catch (error) {
      console.error(`Error fetching data for appointment ${appointment.id}:`, error);
    } finally {
      setLoadingData(false);
    }
  };

  const checkAvailability = async () => {
    setCheckingAvailability(true);
    setAvailabilityMessage(null);

    try {
      // Create UTC datetime directly from the input values
      const dateTimeParts = editData.date.split('-'); // [YYYY, MM, DD]
      const timeParts = editData.time.split(':'); // [HH, MM]
      
      const startDateTime = new Date(Date.UTC(
        parseInt(dateTimeParts[0]), // year
        parseInt(dateTimeParts[1]) - 1, // month (0-indexed)
        parseInt(dateTimeParts[2]), // day
        parseInt(timeParts[0]), // hours
        parseInt(timeParts[1]), // minutes
        0, // seconds
        0 // milliseconds
      ));
      
      const endDateTime = new Date(Date.UTC(
        parseInt(dateTimeParts[0]), // year
        parseInt(dateTimeParts[1]) - 1, // month (0-indexed)
        parseInt(dateTimeParts[2]), // day
        parseInt(timeParts[0]) + 1, // hours + 1
        parseInt(timeParts[1]), // minutes
        0, // seconds
        0 // milliseconds
      ));

      console.log('Checking availability:', {
        input_date: editData.date,
        input_time: editData.time,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString()
      });

      // Get all doctor IDs from this appointment
      const allDoctorIds = doctors.map(d => d.doctor_id);

      for (const checkDoctorId of allDoctorIds) {
        const doctorAppointmentsResponse = await api.get(`/api/doctors/${checkDoctorId}/appointments`);
        const doctorAppointments = doctorAppointmentsResponse.data;

        const doctorResponse = await api.get(`/api/doctors/${checkDoctorId}`);
        const doctorName = doctorResponse.data.full_name;

        for (const existingApt of doctorAppointments) {
          if (existingApt.id === appointment.id || 
              existingApt.status === 'canceled' || 
              existingApt.status === 'rejected') {
            continue;
          }

          const existingStart = new Date(existingApt.start_at);
          const existingEnd = new Date(existingApt.end_at);

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

      setAvailabilityMessage({
        type: 'success',
        text: 'All doctors are available at this time! ✓'
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

  const handleEdit = () => {
    setIsEditing(true);
    setAvailabilityMessage(null);
  };

  const handleCancelEdit = () => {
    // Reset to original values
    const startDate = new Date(appointment.start_at);
    
    setEditData({
      date: startDate.toISOString().split('T')[0],
      time: startDate.toTimeString().slice(0, 5),
    });
    setIsEditing(false);
    setAvailabilityMessage(null);
  };

  const handleSaveEdit = async () => {
    if (availabilityMessage?.type === 'error') {
      alert('Cannot reschedule: ' + availabilityMessage.text);
      return;
    }

    try {
      // Create UTC datetime directly from the input values
      const dateTimeParts = editData.date.split('-'); // [YYYY, MM, DD]
      const timeParts = editData.time.split(':'); // [HH, MM]
      
      const startDateTime = new Date(Date.UTC(
        parseInt(dateTimeParts[0]), // year
        parseInt(dateTimeParts[1]) - 1, // month (0-indexed)
        parseInt(dateTimeParts[2]), // day
        parseInt(timeParts[0]), // hours
        parseInt(timeParts[1]), // minutes
        0, // seconds
        0 // milliseconds
      ));
      
      const endDateTime = new Date(Date.UTC(
        parseInt(dateTimeParts[0]), // year
        parseInt(dateTimeParts[1]) - 1, // month (0-indexed)
        parseInt(dateTimeParts[2]), // day
        parseInt(timeParts[0]) + 1, // hours + 1
        parseInt(timeParts[1]), // minutes
        0, // seconds
        0 // milliseconds
      ));

      console.log('Saving:', {
        input_date: editData.date,
        input_time: editData.time,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString()
      });

      await onUpdate(appointment.id, {
        start_at: startDateTime.toISOString(),
        end_at: endDateTime.toISOString(),
        status: 'pending',
      });

      setIsEditing(false);
      setAvailabilityMessage(null);
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return <FaCheckCircle className="text-green-500" />;
      case 'approved':
        return <FaCheckCircle className="text-blue-500" />;
      case 'pending':
        return <FaHourglassHalf className="text-yellow-500" />;
      case 'canceled':
        return <FaBan className="text-red-500" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaHourglassHalf className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      done: 'bg-green-100 text-green-800',
      approved: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      canceled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels = {
      done: 'Completed',
      approved: 'Approved',
      pending: 'Pending',
      canceled: 'Cancelled',
      rejected: 'Rejected',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const canEdit = appointment.status === 'pending' || appointment.status === 'approved';

  return (
    <div
      className="card hover:shadow-xl transition-shadow animate-slide-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">
              {getStatusIcon(appointment.status)}
            </div>
            {getStatusBadge(appointment.status)}
          </div>

          <div className="space-y-2">
            {/* Multiple Doctors Section */}
            <div className="flex items-start text-gray-700">
              <FaUserMd className="mr-2 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold block mb-1">
                  {doctors.length > 1 ? 'Doctors:' : 'Doctor:'}
                </span>
                {loadingData ? (
                  <span className="text-sm text-gray-500">Loading doctors...</span>
                ) : doctors.length > 0 ? (
                  <div className="space-y-1">
                    {doctors.map((doc, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">Dr. {doc.doctor_name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No doctors assigned</span>
                )}
              </div>
            </div>

            {/* Date and Time - Editable when in edit mode */}
            {isEditing ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Date:
                  </label>
                  <input
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={getMinDate()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Time:
                  </label>
                  <select
                    value={editData.time}
                    onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
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

                {/* Availability Check Message */}
                {(checkingAvailability || availabilityMessage) && (
                  <div
                    className={`p-3 rounded-lg border ${
                      checkingAvailability
                        ? 'bg-blue-50 border-blue-200'
                        : availabilityMessage.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {checkingAvailability ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm text-blue-700">Checking availability...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {availabilityMessage.type === 'success' ? (
                          <span className="text-sm text-green-700 font-medium">{availabilityMessage.text}</span>
                        ) : (
                          <div className="flex items-center">
                            <FaExclamationTriangle className="text-red-600 mr-2" />
                            <span className="text-sm text-red-700 font-medium">{availabilityMessage.text}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-600 italic">
                  Note: Rescheduling will reset the appointment status to "Pending". Appointment duration is 1 hour.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center text-gray-700">
                  <FaCalendarAlt className="mr-2 text-blue-600" />
                  <span>{new Date(appointment.start_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <FaClock className="mr-2 text-blue-600" />
                  <span>
                    {new Date(appointment.start_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {' - '}
                    {new Date(appointment.end_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </>
            )}

            {/* Services Section */}
            {!loadingData && services.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <FaNotesMedical className="mr-2 text-blue-600" />
                  Services:
                </p>
                <div className="space-y-1">
                  {services.map((service, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {service.service_name} {service.quantity > 1 && `x${service.quantity}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {appointment.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-1">Notes:</p>
                <p className="text-gray-600">{appointment.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex md:flex-col gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                disabled={checkingAvailability || availabilityMessage?.type === 'error'}
                className="btn bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="btn bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center space-x-1"
              >
                <FaTimes />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              {canEdit && (
                <button
                  onClick={handleEdit}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-1"
                >
                  <FaEdit />
                  <span>Edit</span>
                </button>
              )}
              {appointment.status === 'pending' && (
                <button
                  onClick={() => onCancel(appointment.id)}
                  className="btn bg-red-600 hover:bg-red-700 text-white"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Appointments component
const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await api.get(`/api/patients/${user.id}/appointments`);
      
      const appointmentsWithDoctors = await Promise.all(
        response.data.map(async (apt) => {
          try {
            const doctorsResponse = await api.get(`/api/appointments/${apt.id}/doctors`);
            const doctors = doctorsResponse.data;
            
            return {
              ...apt,
              doctor_name: doctors && doctors.length > 0 ? doctors[0].doctor_name : 'Not assigned',
              doctor_id: doctors && doctors.length > 0 ? doctors[0].doctor_id : null
            };
          } catch (error) {
            console.error(`Error fetching doctors for appointment ${apt.id}:`, error);
            return {
              ...apt,
              doctor_name: 'Not assigned',
              doctor_id: null
            };
          }
        })
      );
      
      setAppointments(appointmentsWithDoctors);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async (appointmentId, updateData) => {
    try {
      await api.put(`/api/appointments/${appointmentId}`, updateData);
      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await api.put(`/api/appointments/${appointmentId}`, {
        status: 'canceled'
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error canceling appointment:', error);
      alert('Failed to cancel appointment');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    if (filter === 'completed') return apt.status === 'done';
    if (filter === 'cancelled') return apt.status === 'canceled' || apt.status === 'rejected';
    return apt.status === filter;
  });

  const sortedAppointments = filteredAppointments.sort((a, b) => {
    const dateA = new Date(a.start_at);
    const dateB = new Date(b.start_at);
    return dateB - dateA;
  });

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px-200px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px-200px)] py-12 bg-gray-50">
      <div className="container-custom">
        <div className="card mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
          <p className="text-gray-600">View and manage your appointments</p>
        </div>

        <div className="card mb-8 animate-slide-in">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'approved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {sortedAppointments.map((appointment, index) => (
            <AppointmentCard 
              key={appointment.id} 
              appointment={appointment} 
              index={index}
              onCancel={handleCancelAppointment}
              onUpdate={handleUpdateAppointment}
            />
          ))}
        </div>

        {sortedAppointments.length === 0 && (
          <div className="card text-center py-12">
            <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No {filter !== 'all' ? filter : ''} appointments found
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all'
                ? "You haven't booked any appointments yet"
                : `You don't have any ${filter} appointments`}
            </p>
            <button
              onClick={() => window.location.href = '/doctors'}
              className="btn btn-primary"
            >
              Book an Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;