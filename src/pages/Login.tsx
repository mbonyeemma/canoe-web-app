import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Login() {
  const { login, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSuccess = async (payload: { jwt?: string; token?: string; data?: any }) => {
    const token = payload.jwt || payload.token || payload.data?.jwt || payload.data?.token;
    if (!token) {
      throw new Error('No token received from social login');
    }
    api.setToken(token);
    localStorage.setItem('is_logged_in', 'true');
    if (payload.data?.role) {
      localStorage.setItem('user_role', payload.data.role);
    }
    await refreshProfile();
    navigate('/dashboard');
  };

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid profile email',
    onSuccess: async (tokenResponse) => {
      try {
        setSocialLoading('google');
        const accessToken = tokenResponse.access_token;
        if (!accessToken) {
          throw new Error('Google login failed: missing access token');
        }
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userInfo = await userInfoRes.json();
        const userEmail = (userInfo?.email || '').trim().toLowerCase();
        if (!userEmail) throw new Error('Could not get email from Google.');

        let action: 'login' | 'register' = 'login';
        let res = await api.post(
          '/auth/sso/google',
          { token: accessToken, email: userEmail, action },
          { useAuth: false },
        );
        let parsed = await res.json();
        if (res.status === 400 && parsed?.message?.toLowerCase().includes('not found')) {
          action = 'register';
          res = await api.post(
            '/auth/sso/google',
            { token: accessToken, email: userEmail, action },
            { useAuth: false },
          );
          parsed = await res.json();
        }
        if (!res.ok) {
          const msg = parsed?.message || 'Google Sign In failed';
          throw new Error(msg);
        }
        await handleSocialSuccess(parsed);
        toast.success('Signed in with Google');
      } catch (err: any) {
        const msg = err?.message || 'Google Sign In failed';
        toast.error(msg);
      } finally {
        setSocialLoading(null);
      }
    },
    onError: () => {
      toast.error('Google Sign In failed');
    },
  });

  const handleGoogleClick = () => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-In is not configured for this environment.');
      return;
    }
    if (socialLoading) return;
    googleLogin();
  };

  const handleAppleClick = async () => {
    toast.error('Sign in with Apple on web is not yet available.');
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
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back to Canoe Health</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
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

          <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
            <div className="flex-1 h-px bg-gray-200" />
            Or continue with
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="mt-4 flex gap-4">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={!!socialLoading}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary transition disabled:opacity-60"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white border border-gray-300">
                <span className="text-xs">G</span>
              </span>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={handleAppleClick}
              disabled={!!socialLoading}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary transition disabled:opacity-60"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-white text-xs">
                
              </span>
              Continue with Apple
            </button>
          </div>

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
