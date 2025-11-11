import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUserMd, FaCalendarCheck, FaClock, FaCheckCircle } from 'react-icons/fa';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const stats = isAdmin
    ? [
        
      ]
    : [
        
      ];

  return (
    <div className="min-h-[calc(100vh-64px-200px)] py-12 bg-gray-50">
      <div className="container-custom">
        <div className="card mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name || user?.username}!
          </h1>
          <p className="text-gray-600">
            {isAdmin ? 'Here\'s an overview of your system' : 'Here\'s your appointment overview'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="card hover:shadow-xl transition-shadow animate-slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} text-white p-4 rounded-lg text-2xl`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isAdmin ? (
              <>
                <button 
                  onClick={() => navigate('/admin/patients')}
                  className="btn btn-primary"
                >
                  Manage Patients
                </button>
                <button 
                  onClick={() => navigate('/admin/doctors')}
                  className="btn btn-primary"
                >
                  Manage Doctors
                </button>
                <button 
                  onClick={() => navigate('/admin/appointments')}
                  className="btn btn-primary"
                >
                  View Appointments
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/doctors')}
                  className="btn btn-primary"
                >
                  Book Appointment
                </button>
                <button 
                  onClick={() => navigate('/appointments')}  
                  className="btn btn-primary"  
                >
                  My Appointments  {/* ← CHANGED TEXT */}
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="btn btn-secondary"
                >
                  My Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;