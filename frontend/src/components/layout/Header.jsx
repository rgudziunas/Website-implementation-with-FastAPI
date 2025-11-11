import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUserMd, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navLinks = isAuthenticated
    ? isAdmin
      ? [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/doctors', label: 'Doctors' },
        ]
      : [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/doctors', label: 'Doctors' },
          { to: '/services', label: 'Services' },
        ]
    : [
        { to: '/', label: 'Home' },
        { to: '/doctors', label: 'Doctors' },
        { to: '/services', label: 'Services' },
      ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <FaUserMd className="text-3xl text-primary-600 group-hover:text-primary-700 transition-colors" />
            <span className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
              MediCare
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{user?.username}</span>
                <button onClick={handleLogout} className="btn btn-primary flex items-center space-x-2">
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="btn btn-secondary">Login</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </div>
            )}
          </div>

          <button onClick={toggleMenu} className="md:hidden text-gray-700 p-2">
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className="block px-4 py-2 text-gray-700 hover:bg-primary-50 rounded-lg"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600">
                Logout
              </button>
            ) : (
              <div className="px-4 space-y-2 mt-2">
                <Link to="/login" onClick={closeMenu} className="block btn btn-secondary w-full text-center">
                  Login
                </Link>
                <Link to="/register" onClick={closeMenu} className="block btn btn-primary w-full text-center">
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;