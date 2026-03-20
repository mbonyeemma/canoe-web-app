import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '••••••••';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '••••••••';
  const last3 = digits.slice(-3);
  const first4 = digits.slice(0, 4);
  const masked = first4 + '••••••' + last3;
  return phone.startsWith('+') ? '+' + masked : masked;
}

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as any) || {};
  const phone = state.phone || '';
  const role = state.role || 'provider';
  const totalSteps = role === 'provider' ? 5 : 3;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 4) { toast.error('Enter the 4-digit code'); return; }
    setLoading(true);
    try {
      const res = await api.post(
        '/auth/verify-account',
        { type: 'phone', value: phone, otp: code },
        { useAuth: false }
      );
      await api.parseResponse(res);
      toast.success('Verified');
      navigate('/signup', { state: { fromVerify: true, step: 1 }, replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (resendCooldown <= 0) {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
      return;
    }
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await api.post('/auth/resend-otp', { phone }, { useAuth: false });
      await api.parseResponse(res);
      setResendCooldown(60);
      toast.success('Code resent');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i <= 1 ? 'w-6 bg-primary' : 'w-1.5 bg-gray-200'}`}
            />
          ))}
        </div>
        <p className="text-center text-xs font-semibold text-primary uppercase tracking-widest mb-2">Step 2 of {totalSteps}</p>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Verify your account</h1>
            <p className="text-sm text-gray-500 mt-1">We sent a 4-digit code to your phone</p>
            {phone && (
              <p className="text-sm font-medium text-gray-600 mt-2">{maskPhone(phone)}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-center gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-14 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & continue'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Didn't get it?{' '}
              <button
                type="button"
                className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleResend}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
              </button>
            </p>
          </form>
        </div>

        <p className="text-center mt-6">
          <Link to="/signup" className="text-sm text-gray-500 hover:text-primary transition">← Back to signup</Link>
        </p>
      </div>
    </div>
  );
}
