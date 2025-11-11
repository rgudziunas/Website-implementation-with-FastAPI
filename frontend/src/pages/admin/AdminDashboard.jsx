import { useState, useEffect } from 'react';
import { FaUsers, FaUserMd, FaCalendarAlt, FaHospital } from 'react-icons/fa';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalServices: 0,
    pendingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [patients, doctors, appointments, services] = await Promise.all([
        api.get('/api/patients'),
        api.get('/api/doctors'),
        api.get('/api/appointments'),
        api.get('/api/services'),
      ]);

      const pendingCount = appointments.data.filter(
        (apt) => apt.status === 'pending'
      ).length;

      setStats({
        totalPatients: patients.data.length,
        totalDoctors: doctors.data.length,
        totalAppointments: appointments.data.length,
        totalServices: services.data.length,
        pendingAppointments: pendingCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: <FaUsers />,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Doctors',
      value: stats.totalDoctors,
      icon: <FaUserMd />,
      color: 'bg-green-500',
    },
    {
      title: 'Total Appointments',
      value: stats.totalAppointments,
      icon: <FaCalendarAlt />,
      color: 'bg-purple-500',
    },
    {
      title: 'Pending Appointments',
      value: stats.pendingAppointments,
      icon: <FaCalendarAlt />,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Services',
      value: stats.totalServices,
      icon: <FaHospital />,
      color: 'bg-pink-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-2">{stat.title}</p>
                <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} text-white p-4 rounded-lg text-3xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;