import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      await refreshProfile().catch(() => {});
      const role = (localStorage.getItem('user_role') || '').toLowerCase();
      if (role === 'client') {
        toast(
          'For the best experience, please download the Canoe Health mobile app to chat and join calls.',
          { duration: 9000 },
        );
      }
      navigate('/dashboard');
    } catch (err: any) {
      const requiresVerification = err?.data?.data?.requiresVerification || err?.data?.requiresVerification;
      if (requiresVerification) {
        toast.error(err?.message || 'Please verify your email to continue.');
        navigate('/signup');
      } else {
        toast.error(err?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const input =
    'w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition';

  return (
    <div className="min-h-screen flex w-full">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary-dark via-primary to-[#2d8a3e] flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5" />
        <Link to="/">
          <img src="/logo.png" alt="Canoe Health" className="h-10 w-auto relative z-10" />
        </Link>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white leading-snug">Healthcare at your fingertips.</h2>
          <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-xs">
            Connect with patients, manage consultations, and grow your practice — all in one place.
          </p>
       
        </div>
        <p className="text-white/30 text-xs relative z-10">&copy; {new Date().getFullYear()} Canoe Health Ltd.</p>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden mb-6 inline-block">
            <img src="/web_logo.jpeg" alt="Canoe Health" className="h-8 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Provider Sign in</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back to Canoe Health</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={input} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-dark">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required className={`${input} pr-16`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
            <div className="flex-1 h-px bg-gray-200" />No account?<div className="flex-1 h-px bg-gray-200" />
          </div>
          <Link to="/signup" className="mt-3 flex items-center justify-center w-full border-2 border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-primary hover:text-primary transition text-sm">
            Register as a provider
          </Link>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <Link to="/terms" className="hover:text-primary">Terms</Link>
            <Link to="/privacy" className="hover:text-primary">Privacy</Link>
            <Link to="/contact" className="hover:text-primary">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
