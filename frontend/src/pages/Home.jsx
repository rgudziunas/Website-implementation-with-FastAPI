import { Link } from 'react-router-dom';
import { FaUserMd, FaCalendarAlt, FaHospital, FaArrowRight } from 'react-icons/fa';

const Home = () => {
  const features = [
    {
      icon: <FaUserMd className="text-4xl" />,
      title: 'Expert Doctors',
      description: 'Experienced medical professionals ready to help you',
    },
    {
      icon: <FaCalendarAlt className="text-4xl" />,
      title: 'Easy Booking',
      description: 'Schedule appointments online in just a few clicks',
    },
    {
      icon: <FaHospital className="text-4xl" />,
      title: 'Modern Facilities',
      description: 'State-of-the-art equipment and comfortable environment',
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container-custom relative z-10 py-20 md:py-32">
          <div className="max-w-3xl animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Your Health is Our
              <span className="block text-yellow-300">Priority</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Book appointments with the best doctors. Quality healthcare at your fingertips.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              
                
              
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose MediCare?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide comprehensive healthcare services with modern technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card text-center hover:shadow-xl transition-shadow animate-slide-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Matching Hero Gradient */}
      <section className="relative bg-gradient-to-r from-primary-600 to-blue-700 text-white overflow-hidden py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container-custom text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied patients who trust us with their healthcare
          </p>
          <Link
            to="/register"
            className="btn bg-yellow-300 text-gray-900 hover:bg-yellow-400 hover:shadow-lg text-lg px-8 py-3 inline-flex items-center space-x-2 transition-all font-semibold"
          >
            <span>Book Your Appointment</span>
            <FaArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;