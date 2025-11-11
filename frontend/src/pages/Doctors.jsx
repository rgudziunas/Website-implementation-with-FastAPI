import { useState, useEffect } from 'react';
import { FaUserMd, FaCalendarPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Add this import
import api from '../services/api';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Add this

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/api/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const specialties = ['all', ...new Set(doctors.map(doc => doc.specialization))];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialization === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleBookAppointment = (doctorId) => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
    navigate(`/book-appointment/${doctorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px-200px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px-200px)] py-12 bg-gray-50">
      <div className="container-custom">
        <div className="card mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Doctors</h1>
          <p className="text-gray-600">Find and book appointments with our qualified doctors</p>
        </div>

        <div className="card mb-8 animate-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="input"
            >
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>
                  {specialty === 'all' ? 'All Specialties' : specialty}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor, index) => (
            <div
              key={doctor.id}
              className="card hover:shadow-xl transition-all animate-slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-600 p-4 rounded-full text-3xl mr-4">
                  <FaUserMd />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{doctor.full_name}</h3>
                  <p className="text-gray-600">{doctor.specialization}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {doctor.email && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Email:</span> {doctor.email}
                  </p>
                )}
                {doctor.phone && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Phone:</span> {doctor.phone}
                  </p>
                )}
                <p className="text-gray-700">
                  <span className="font-semibold">Status:</span>{' '}
                  <span className={doctor.active ? 'text-green-600' : 'text-red-600'}>
                    {doctor.active ? 'Available' : 'Not Available'}
                  </span>
                </p>
              </div>

              <button
                onClick={() => handleBookAppointment(doctor.id)}
                disabled={!doctor.active}
                className={`btn w-full flex items-center justify-center ${
                  doctor.active ? 'btn-primary' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <FaCalendarPlus className="mr-2" />
                {doctor.active ? 'Book Appointment' : 'Unavailable'}
              </button>
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="card text-center py-12">
            <FaUserMd className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No doctors found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctors;