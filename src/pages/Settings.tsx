import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, FileText, Shield, Phone, Trash2, LogOut, ChevronRight, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      toast.error('Account deletion is not yet available. Please contact support.');
    }
  };

  const items = [
    { to: '/settings/password', icon: Key, label: 'Change Password' },
    { to: '/settings/payment-methods', icon: CreditCard, label: 'Payment methods' },
    { to: '/terms', icon: FileText, label: 'Terms of Service' },
    { to: '/privacy', icon: Shield, label: 'Privacy Policy' },
    { to: '/contact', icon: Phone, label: 'Contact Us' },
  ];

  return (
    <div className="w-full">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition">
            <item.icon className="w-5 h-5 text-gray-400" />
            <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 mt-4">
        <button onClick={handleDelete} className="flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition w-full">
          <Trash2 className="w-5 h-5 text-red-500" />
          <span className="flex-1 text-sm font-medium text-red-600 text-left">Delete Account</span>
        </button>
        <button onClick={handleLogout} className="flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition w-full">
          <LogOut className="w-5 h-5 text-red-500" />
          <span className="flex-1 text-sm font-medium text-red-600 text-left">Logout</span>
        </button>
      </div>
    </div>
  );
}
