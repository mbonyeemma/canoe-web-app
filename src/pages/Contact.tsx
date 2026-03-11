import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Globe, Clock } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="w-full px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
        <p className="text-gray-500 mt-2">We'd love to hear from you. Reach out anytime.</p>

        <div className="mt-8 grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900">Email</h3>
            <a href="mailto:support@canoehealthcare.com" className="text-sm text-primary hover:underline mt-1 block">support@canoehealthcare.com</a>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mb-3">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900">Phone</h3>
            <a href="tel:+256700000000" className="text-sm text-primary hover:underline mt-1 block">+256 700 000 000</a>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900">Address</h3>
            <p className="text-sm text-gray-600 mt-1">Kampala, Uganda</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mb-3">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900">Website</h3>
            <a href="https://www.canoehealthcare.com" target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline mt-1 block">www.canoehealthcare.com</a>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900">Support Hours</h3>
          </div>
          <p className="text-sm text-gray-600">Monday - Friday: 8:00 AM - 6:00 PM (EAT)</p>
          <p className="text-sm text-gray-600">Saturday: 9:00 AM - 1:00 PM (EAT)</p>
          <p className="text-sm text-gray-500 mt-2">For emergencies, please call emergency services directly.</p>
        </div>
      </div>
    </div>
  );
}
