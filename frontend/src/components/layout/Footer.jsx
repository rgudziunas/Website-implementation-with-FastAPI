import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaPhone, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">MediCare</h3>
            <p className="text-sm">Your trusted healthcare partner.</p>
            <div className="flex space-x-4 mt-4">
              <FaFacebook className="hover:text-primary-400 cursor-pointer" />
              <FaTwitter className="hover:text-primary-400 cursor-pointer" />
              <FaInstagram className="hover:text-primary-400 cursor-pointer" />
            </div>
          </div>
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400">Home</Link></li>
              <li><Link to="/doctors" className="hover:text-primary-400">Doctors</Link></li>
              <li><Link to="/services" className="hover:text-primary-400">Services</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Contact</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <FaPhone />
                <span>+370 600 12345</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaEnvelope />
                <span>info@medicare.lt</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} MediCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;