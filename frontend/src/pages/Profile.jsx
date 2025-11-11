import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaSave, FaEdit } from 'react-icons/fa';
import api from '../services/api';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    birth_date: '',
  });

  useEffect(() => {
    if (user) {
      console.log('User data:', user); // DEBUG
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        birth_date: user.birth_date || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      setMessage({ type: 'error', text: 'Full name must be at least 2 characters long' });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return false;
    }

    if (formData.phone && formData.phone.trim() !== '') {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(formData.phone) || formData.phone.replace(/\D/g, '').length < 7) {
        setMessage({ type: 'error', text: 'Please enter a valid phone number (at least 7 digits)' });
        return false;
      }
    }

    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (birthDate > today) {
        setMessage({ type: 'error', text: 'Birth date cannot be in the future' });
        return false;
      }
      
      if (age > 150) {
        setMessage({ type: 'error', text: 'Please enter a valid birth date' });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const dataToSubmit = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone.trim() === '' ? null : formData.phone,
        birth_date: formData.birth_date === '' ? null : formData.birth_date,
      };

      console.log('Submitting data:', dataToSubmit); // DEBUG

      const response = await api.put(`/api/patients/${user.id}`, dataToSubmit);
      console.log('Update response:', response.data); // DEBUG

      if (response.status === 200) {
        const updatedUserResponse = await api.get(`/api/patients/${user.id}`);
        console.log('Fetched updated user:', updatedUserResponse.data); // DEBUG
        
        const updatedUser = {
          ...user,
          ...updatedUserResponse.data
        };
        
        console.log('Final updated user:', updatedUser); // DEBUG
        
        setUser(updatedUser);
        
        const token = localStorage.getItem('token');
        if (token) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('Saved to localStorage'); // DEBUG
        }

        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setEditing(false);
        
        // Force re-render by updating formData
        setFormData({
          full_name: updatedUserResponse.data.full_name || '',
          email: updatedUserResponse.data.email || '',
          phone: updatedUserResponse.data.phone || '',
          birth_date: updatedUserResponse.data.birth_date || '',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error response:', error.response); // DEBUG
      const errorMessage = error.response?.data?.detail || 'Failed to update profile';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setMessage({ type: '', text: '' });
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        birth_date: user.birth_date || '',
      });
    }
  };

  const getMaxBirthDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinBirthDate = () => {
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 150);
    return minDate.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-[calc(100vh-64px-200px)] py-12 bg-gray-50">
      <div className="container-custom max-w-4xl">
        <div className="card mb-8 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">View and manage your personal information</p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn btn-primary flex items-center"
              >
                <FaEdit className="mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

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
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaUser className="inline mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      disabled={!editing}
                      required
                      minLength={2}
                      maxLength={100}
                      className="input"
                      placeholder="Enter your full name"
                    />
                    {editing && (
                      <p className="text-xs text-gray-500 mt-1">At least 2 characters</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaEnvelope className="inline mr-2" />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!editing}
                      required
                      className="input"
                      placeholder="your.email@example.com"
                    />
                    {editing && (
                      <p className="text-xs text-gray-500 mt-1">Valid email address required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaPhone className="inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!editing}
                      className="input"
                      placeholder="+370 600 00000"
                    />
                    {editing && (
                      <p className="text-xs text-gray-500 mt-1">Optional - at least 7 digits</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaBirthdayCake className="inline mr-2" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleChange}
                      disabled={!editing}
                      min={getMinBirthDate()}
                      max={getMaxBirthDate()}
                      className="input"
                    />
                    {editing && (
                      <p className="text-xs text-gray-500 mt-1">Optional</p>
                    )}
                  </div>
                </div>
              </div>

              {editing && (
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex-1 flex items-center justify-center"
                  >
                    <FaSave className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="card mt-6 bg-gray-50 animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <span className="font-semibold">Username:</span> {user?.username}
            </p>
            <p>
              <span className="font-semibold">Account Type:</span> Patient
            </p>
            <p>
              <span className="font-semibold">Member Since:</span>{' '}
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;