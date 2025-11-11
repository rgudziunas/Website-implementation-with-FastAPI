import { useState, useEffect } from 'react';
import { FaEye, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';
import api from '../../services/api';

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/api/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientAppointments = async (patientId) => {
    setLoadingAppointments(true);
    try {
      const response = await api.get(`/api/patients/${patientId}/appointments`);
      
      // Enrich appointments with doctor info
      const enrichedAppointments = await Promise.all(
        response.data.map(async (apt) => {
          try {
            const doctors = await api.get(`/api/appointments/${apt.id}/doctors`);
            const services = await api.get(`/api/appointments/${apt.id}/services`);
            return {
              ...apt,
              doctors: doctors.data,
              services: services.data,
            };
          } catch (error) {
            return {
              ...apt,
              doctors: [],
              services: [],
            };
          }
        })
      );
      
      setAppointments(enrichedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    fetchPatientAppointments(patient.id);
  };

  const handleCloseModal = () => {
    setSelectedPatient(null);
    setAppointments([]);
    setEditingAppointmentId(null);
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await api.put(`/api/appointments/${appointmentId}`, {
        status: newStatus,
      });
      setEditingAppointmentId(null);
      fetchPatientAppointments(selectedPatient.id);
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment status');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      await api.delete(`/api/appointments/${appointmentId}`);
      fetchPatientAppointments(selectedPatient.id);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment');
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

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold text-gray-900">Patients Management</h1>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Full Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  #{patient.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {patient.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {patient.full_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {patient.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {patient.phone || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleViewPatient(patient)}
                    className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                  >
                    <FaEye className="text-lg" />
                    <span>View Appointments</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow mt-6">
          <p className="text-gray-500">No patients found</p>
        </div>
      )}

      {/* Patient Appointments Modal */}
      {/* Patient Appointments Modal */}
{selectedPatient && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg w-full max-w-6xl flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
      {/* Modal Header - Fixed */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedPatient.full_name}'s Appointments
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {selectedPatient.email} • {selectedPatient.phone || 'No phone'}
          </p>
        </div>
        <button
          onClick={handleCloseModal}
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-colors"
          title="Close"
        >
          <FaTimes className="text-2xl" />
        </button>
      </div>

      {/* Modal Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6">
        {loadingAppointments ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg font-semibold text-gray-900">
                        Appointment #{appointment.id}
                      </span>
                      {editingAppointmentId === appointment.id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="canceled">Canceled</option>
                          <option value="done">Done</option>
                        </select>
                      ) : (
                        getStatusBadge(appointment.status)
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <span className="font-semibold">Date & Time:</span>{' '}
                        {new Date(appointment.start_at).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {appointment.doctors.length > 0 && (
                        <p>
                          <span className="font-semibold">Doctors:</span>{' '}
                          {appointment.doctors.map((d) => d.doctor_name).join(', ')}
                        </p>
                      )}

                      {appointment.services.length > 0 && (
                        <div>
                          <span className="font-semibold">Services:</span>
                          <ul className="list-disc list-inside ml-2">
                            {appointment.services.map((service) => (
                              <li key={service.id}>
                                {service.service_name} (x{service.quantity})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {appointment.notes && (
                        <p>
                          <span className="font-semibold">Notes:</span> {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 ml-4 flex-shrink-0">
                    {editingAppointmentId === appointment.id ? (
                      <>
                        <button
                          onClick={() =>
                            handleStatusUpdate(appointment.id, editStatus)
                          }
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Save"
                        >
                          <FaCheckCircle className="text-xl" />
                        </button>
                        <button
                          onClick={() => setEditingAppointmentId(null)}
                          className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <FaTimesCircle className="text-xl" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingAppointmentId(appointment.id);
                            setEditStatus(appointment.status);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Status"
                        >
                          <FaEdit className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDeleteAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrash className="text-lg" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">This patient has no appointments yet</p>
          </div>
        )}
      </div>

      {/* Modal Footer - Fixed */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={handleCloseModal}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
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

export default AdminPatients;