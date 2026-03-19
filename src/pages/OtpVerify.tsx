import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = (location.state as any)?.phone || '';
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
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
      navigate('/personal-details');
    } catch (err: any) {
      toast.error(err?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900">Verify account</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Code sent to {phone || 'your phone'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center gap-2.5">
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
                className="w-12 h-12 text-center text-xl font-bold border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded-lg transition text-[13px] disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>

          <p className="text-center text-[12px] text-gray-400">
            Didn't get it?{' '}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => toast.success('Code resent')}
            >
              Resend
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
