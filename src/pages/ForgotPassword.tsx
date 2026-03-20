import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

type Step = 'email' | 'email_otp' | 'phone_otp' | 'new_password';

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '••••••••';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '••••••••';
  const last3 = digits.slice(-3);
  const first4 = digits.slice(0, 4);
  return phone.startsWith('+') ? `+${first4}••••••${last3}` : `${first4}••••••${last3}`;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState(['', '', '', '']);
  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const input =
    'w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition';

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password-request', { email: trimmed }, { useAuth: false });
      const result = await api.parseResponse<{ data?: { phone?: string } }>(res);
      const resData = (result as any)?.data ?? result;
      const userPhone = resData?.phone?.trim?.() || null;
      setPhone(userPhone);
      if (!userPhone) {
        toast.error('Your account does not have a phone number. Password reset requires both email and phone verification. Please contact support.');
        return;
      }
      setStep('email_otp');
      toast.success('Verification codes sent to your email and phone.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (arr: string[], setArr: (v: string[]) => void, index: number, value: string, refs: React.RefObject<(HTMLInputElement | null)[]>) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...arr];
    next[index] = value.slice(-1);
    setArr(next);
    if (value && index < 3) refs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (arr: string[], index: number, e: React.KeyboardEvent, refs: React.RefObject<(HTMLInputElement | null)[]>) => {
    if (e.key === 'Backspace' && !arr[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const handleEmailOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = emailOtp.join('');
    if (code.length !== 4) {
      toast.error('Enter the 4-digit code');
      return;
    }
    setStep('phone_otp');
  };

  const handlePhoneOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = phoneOtp.join('');
    if (code.length !== 4) {
      toast.error('Enter the 4-digit code');
      return;
    }
    setStep('new_password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!emailOtp.join('') || !phoneOtp.join('')) {
      toast.error('Please enter both verification codes.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post(
        '/auth/confirm-reset-password',
        {
          email: trimmed,
          email_otp: emailOtp.join(''),
          phone_otp: phoneOtp.join(''),
          newPassword,
        },
        { useAuth: false }
      );
      toast.success('Your password has been reset. You can now log in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = phone ? maskPhone(phone) : '';

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
          <h2 className="text-3xl font-bold text-white leading-snug">Reset your password.</h2>
          <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-xs">
            We&apos;ll send verification codes to your email and phone to confirm your identity.
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
          <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'email' && 'Enter your email to receive verification codes.'}
            {step === 'email_otp' && 'Enter the code sent to your email.'}
            {step === 'phone_otp' && 'Enter the code sent to your phone.'}
            {step === 'new_password' && 'Create your new password.'}
          </p>

          {step === 'email' && (
            <form onSubmit={handleRequestReset} className="mt-7 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={input} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Send code'}
              </button>
            </form>
          )}

          {step === 'email_otp' && (
            <form onSubmit={handleEmailOtpSubmit} className="mt-7 space-y-5">
              <p className="text-sm text-gray-500">We sent a 4-digit code to {email}</p>
              <div className="flex justify-center gap-3">
                {emailOtp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { emailOtpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(emailOtp, setEmailOtp, i, e.target.value, emailOtpRefs)}
                    onKeyDown={(e) => handleOtpKeyDown(emailOtp, i, e, emailOtpRefs)}
                    className="w-14 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                ))}
              </div>
              <button type="submit" disabled={emailOtp.join('').length !== 4} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm">
                Continue
              </button>
              <button type="button" onClick={() => setStep('email')} className="w-full text-sm text-gray-500 hover:text-primary transition">
                Use a different email
              </button>
            </form>
          )}

          {step === 'phone_otp' && (
            <form onSubmit={handlePhoneOtpSubmit} className="mt-7 space-y-5">
              <p className="text-sm text-gray-500">We sent a 4-digit code to {maskedPhone}</p>
              <div className="flex justify-center gap-3">
                {phoneOtp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { phoneOtpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(phoneOtp, setPhoneOtp, i, e.target.value, phoneOtpRefs)}
                    onKeyDown={(e) => handleOtpKeyDown(phoneOtp, i, e, phoneOtpRefs)}
                    className="w-14 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                ))}
              </div>
              <button type="submit" disabled={phoneOtp.join('').length !== 4} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm">
                Continue
              </button>
              <button type="button" onClick={() => setStep('email_otp')} className="w-full text-sm text-gray-500 hover:text-primary transition">
                Back to email code
              </button>
            </form>
          )}

          {step === 'new_password' && (
            <form onSubmit={handleResetPassword} className="mt-7 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New password (min 8 characters)</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" minLength={8} className={`${input} pr-12`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className={input} />
              </div>
              <button type="submit" disabled={loading || !newPassword || !confirmPassword || newPassword.length < 8 || newPassword !== confirmPassword} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Reset password'}
              </button>
              <button type="button" onClick={() => setStep('phone_otp')} className="w-full text-sm text-gray-500 hover:text-primary transition">
                Back to phone code
              </button>
            </form>
          )}

          <div className="mt-6">
            <Link to="/login" className="text-sm font-medium text-primary hover:text-primary-dark">
              ← Back to sign in
            </Link>
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
