import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronRight, ChevronDown, ChevronUp, Video, Wallet, ShieldCheck, Stethoscope, Globe, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const SIGNUP_STATE_KEY = 'signup_state';

/* ─── Static data ─────────────────────────────────────── */

const COUNTRIES = [
  { flag: '🇺🇬', name: 'Uganda',   iso: 'UG', dial: '+256' },
  { flag: '🇰🇪', name: 'Kenya',    iso: 'KE', dial: '+254' },
];

const EXPERIENCE = ['< 1 yr', '1–3 yrs', '3–5 yrs', '5–10 yrs', '10+ yrs'];

function getRoleFromUrl(): 'provider' | 'client' {
  const role = new URLSearchParams(window.location.search).get('role')?.toLowerCase();
  return role === 'client' ? 'client' : 'provider';
}

const PROVIDER_STEPS = ['Your identity', 'Verify', 'Specialisation', 'Professional background', 'Security'];
const CLIENT_STEPS = ['Your identity', 'Verify', 'Security'];

/* ─── Panel content per step ─────────────────────────── */

const PROVIDER_PANELS = [
  {
    label: 'Step 1 of 5',
    headline: 'Welcome to\nCanoe Health',
    sub: 'Provider Registration',
    body: 'Tell us who you are and where you practice. We\'ll send a verification code to your phone to confirm your account.',
    items: [
      { flag: '🇺🇬', text: 'Uganda'   },
      { flag: '🇰🇪', text: 'Kenya'    },
      { flag: '🇹🇿', text: 'Tanzania' },
      { flag: '🇷🇼', text: 'Rwanda'   },
      { flag: '🇧🇮', text: 'Burundi'  },
      { flag: '🇸🇸', text: 'S. Sudan' },
    ] as { flag: string; text: string }[],
    gradient: 'from-[#1B5E20] via-[#256829] to-[#2E7D32]',
    useFlags: true,
  },
  {
    label: 'Step 2 of 5',
    headline: 'Verify your\nphone number',
    sub: 'Verification',
    body: 'We sent a 4-digit code to your phone. Enter it below to confirm your account and continue.',
    items: [
      { Icon: ShieldCheck, text: 'Secure verification' },
      { Icon: Video, text: 'Quick process' },
    ],
    gradient: 'from-[#1a6b2e] via-[#2a8038] to-[#3daa4a]',
  },
  {
    label: 'Step 3 of 5',
    headline: 'Choose your\nspecialisation',
    sub: 'Specialisation',
    body: 'Choose one or more categories and specialties so patients can find you.',
    items: [
      { Icon: Stethoscope,   text: 'Category + specialty selection' },
      { Icon: Globe,         text: 'Better patient matching' },
      { Icon: ShieldCheck,   text: 'Clear verification pathway' },
    ],
    gradient: 'from-[#155d25] via-[#1d7530] to-[#2E7D32]',
  },
  {
    label: 'Step 4 of 5',
    headline: 'Your credentials\nbuild patient trust',
    sub: 'Professional background',
    body: 'Patients feel safer consulting verified professionals. Your license, certification, and specialty help us match you with the right cases and build your reputation on the platform.',
    items: [
      { Icon: ShieldCheck,   text: 'License verification'     },
      { Icon: Stethoscope,   text: 'Specialty-matched patients'},
      { Icon: Globe,         text: 'Pan-Africa reach'          },
    ],
    gradient: 'from-[#155d25] via-[#1d7530] to-[#2E7D32]',
  },
  {
    label: 'Step 5 of 5',
    headline: "Almost there —\nwelcome aboard!",
    sub: 'Account security',
    body: "After registration, our team reviews your profile within 1–2 business days. Once approved, you're live and can start accepting patient bookings.",
    items: [
      { Icon: Lock, text: 'Submit registration'        },
      { Icon: ShieldCheck, text: 'Profile review (1–2 days)'  },
      { Icon: Video, text: 'Go live & start consulting' },
    ],
    gradient: 'from-[#1B5E20] via-[#256829] to-[#34913a]',
  },
];

const CLIENT_PANELS = [
  {
    label: 'Step 1 of 3',
    headline: 'Welcome to\nCanoe Health',
    sub: 'Patient Registration',
    body: 'Add your details and phone number. We\'ll send a verification code to confirm your account.',
    items: [
      { flag: '🇺🇬', text: 'Uganda'   },
      { flag: '🇰🇪', text: 'Kenya'    },
      { flag: '🇹🇿', text: 'Tanzania' },
      { flag: '🇷🇼', text: 'Rwanda'   },
      { flag: '🇬🇭', text: 'Ghana'    },
      { flag: '🇳🇬', text: 'Nigeria'  },
    ] as { flag: string; text: string }[],
    gradient: 'from-[#1B5E20] via-[#256829] to-[#2E7D32]',
    useFlags: true,
  },
  {
    label: 'Step 2 of 3',
    headline: 'Verify your\nphone number',
    sub: 'Verification',
    body: 'We sent a 4-digit code to your phone. Enter it below to confirm your account.',
    items: [
      { Icon: ShieldCheck, text: 'Secure verification' },
    ],
    gradient: 'from-[#1a6b2e] via-[#2a8038] to-[#3daa4a]',
  },
  {
    label: 'Step 3 of 3',
    headline: 'Create your\nsecure account',
    sub: 'Security',
    body: 'Choose a strong password and accept the terms to finish registration.',
    items: [
      { Icon: Lock,       text: 'Secure sign-in' },
      { Icon: ShieldCheck,text: 'Protected data' },
      { Icon: Wallet,     text: 'Simple payments' },
    ],
    gradient: 'from-[#1B5E20] via-[#256829] to-[#34913a]',
  },
];

/* ─── Component ──────────────────────────────────────── */

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '••••••••';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '••••••••';
  const last3 = digits.slice(-3);
  const first4 = digits.slice(0, 4);
  return phone.startsWith('+') ? '+' + first4 + '••••••' + last3 : first4 + '••••••' + last3;
}

export default function Signup() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const role = getRoleFromUrl();
  const isProvider = role === 'provider';
  const STEPS = isProvider ? PROVIDER_STEPS : CLIENT_STEPS;
  const PANELS = isProvider ? PROVIDER_PANELS : CLIENT_PANELS;
  const totalSteps = isProvider ? 5 : 3;

  const [step, setStep]         = useState(0);
  const [panelKey, setPanelKey] = useState(0);
  const [formKey, setFormKey]   = useState(0);

  // Step 0: Identity + Contact (merged)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone]     = useState('');
  const [city, setCity]       = useState('');

  // Step 1: OTP verification (stored phone after start-signup)
  const [verifyPhone, setVerifyPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 2 (provider only): category + specialisation
  const [categories, setCategories] = useState<{ id: number; category_name: string }[]>([]);
  const [specialisationsByCategoryId, setSpecialisationsByCategoryId] = useState<
    Record<number, { id: number; category_id: number; category_name: string; item_name: string }[]>
  >({});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedSpecialisationIds, setSelectedSpecialisationIds] = useState<number[]>([]);
  const [specialisationSearch, setSpecialisationSearch] = useState('');
  const [showSpecialisationDetails, setShowSpecialisationDetails] = useState(true);
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);

  // Step 3 (provider only): professional background
  const [experience, setExperience] = useState('');
  const [licensed, setLicensed]     = useState<'yes' | 'no' | ''>('');
  const [hasCert, setHasCert]       = useState<'yes' | 'no' | ''>('');

  // Step 4 (provider) / Step 2 (client): security
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]               = useState(false);
  const [agreedTerms, setAgreedTerms]         = useState(false);
  const [agreedAccurate, setAgreedAccurate]   = useState(false);
  const [agreedVerify, setAgreedVerify]       = useState(false);
  const [loading, setLoading]                 = useState(false);

  const can0 = firstName.trim() && lastName.trim() && email.trim().includes('@') && phone.trim().length >= 6;
  const canSpec = !isProvider || selectedSpecialisationIds.length > 0;
  const canProfessional = !isProvider || (licensed !== '' && hasCert !== '');
  const canSecurity = password.length >= 8 && password === confirmPassword && agreedTerms && agreedAccurate && agreedVerify;

  const goStep = (s: number) => {
    setStep(s);
    setPanelKey(s);
    setFormKey((k) => k + 1);
  };

  const handleStep0Continue = async () => {
    if (!can0) { toast.error('Fill in your name, email, and phone number'); return; }
    setLoading(true);
    try {
      const fullPhone = `${country.dial}${phone.trim().replace(/\D/g, '')}`;
      const res = await api.post(
        '/auth/start-signup',
        {
          email: email.trim().toLowerCase(),
          phone: fullPhone,
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          role,
          agreed_to_terms: true,
          iso_code: country.iso,
        },
        { useAuth: false }
      );
      const result = await api.parseResponse<{ data?: { jwt?: string; role?: string; user_id?: string } }>(res);
      const token = result.data?.jwt;
      const userId = result.data?.user_id;
      if (token) {
        api.setToken(token);
        localStorage.setItem('is_logged_in', 'true');
        localStorage.setItem('user_role', result.data?.role || role);
      }
      sessionStorage.setItem(SIGNUP_STATE_KEY, JSON.stringify({
        iso_code: country.iso,
        phone: fullPhone,
        city: city.trim(),
        role,
        user_id: userId,
      }));
      setVerifyPhone(fullPhone);
      setOtp(['', '', '', '']);
      toast.success('Verification code sent');
      goStep(1);
    } catch (err: any) {
      toast.error(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 4) { toast.error('Enter the 4-digit code'); return; }
    const stored = sessionStorage.getItem(SIGNUP_STATE_KEY);
    const signupState = stored ? JSON.parse(stored) : {};
    const userId = signupState.user_id;
    if (!userId) { toast.error('Session expired. Please start over.'); return; }
    setOtpLoading(true);
    try {
      const res = await api.post(
        '/auth/verify-account',
        { type: 'phone', value: verifyPhone, otp: code, user_id: userId },
        { useAuth: false }
      );
      await api.parseResponse(res);
      toast.success('Verified');
      goStep(2);
    } catch (err: any) {
      toast.error(err?.message || 'Invalid code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    const stored = sessionStorage.getItem(SIGNUP_STATE_KEY);
    const signupState = stored ? JSON.parse(stored) : {};
    const userId = signupState.user_id;
    try {
      await api.post('/auth/resend-otp', { phone: verifyPhone, user_id: userId }, { useAuth: false });
      setResendCooldown(60);
      toast.success('Code resent');
    } catch (err: any) {
      toast.error((err as any)?.message || 'Failed to resend');
    }
  };

  const next = () => {
    if (step === 0) { handleStep0Continue(); return; }
    if (isProvider && step === 2 && !canSpec) { toast.error('Choose at least one speciality'); return; }
    if (isProvider && step === 3 && !canProfessional) { toast.error('Complete all professional fields'); return; }
    goStep(step + 1);
  };

  useEffect(() => {
    if (!isProvider) return;
    (async () => {
      try {
        const r = await api.get('/providers/specialisation-categories', { useAuth: false });
        const res = await api.parseResponse<any>(r);
        const list = res?.data?.categories ?? res?.data ?? [];
        const safeCategories = Array.isArray(list) ? list : [];
        setCategories(safeCategories);

        // Preload specialisations for ALL categories so when a user taps a category,
        // the checkboxes are already available (no extra wait).
        const preloadResults: Record<
          number,
          { id: number; category_id: number; category_name: string; item_name: string }[]
        > = {};

        await Promise.all(
          safeCategories.map(async (c: any) => {
            if (!c?.id) return;
            const sr = await api.get(`/providers/specialisations?category_id=${c.id}`, { useAuth: false });
            const sres = await api.parseResponse<any>(sr);
            const sList = sres?.data?.specialisations ?? sres?.data ?? [];
            preloadResults[c.id] = Array.isArray(sList) ? sList : [];
          })
        );

        setSpecialisationsByCategoryId(preloadResults);
      } catch (e) {
        // Non-blocking; user can still select categories and we will fall back to empty states.
        console.warn('Failed to load specialisation categories/specialisations', e);
      }
    })();
  }, [isProvider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSecurity) {
      if (password.length < 8) toast.error('Password must be at least 8 characters');
      else if (password !== confirmPassword) toast.error('Passwords do not match');
      else toast.error('Please accept all statements to continue');
      return;
    }
    setLoading(true);
    try {
      const stored = sessionStorage.getItem(SIGNUP_STATE_KEY);
      const signupState = stored ? JSON.parse(stored) : {};
      const isoCode = signupState.iso_code || country.iso;
      const fullPhone = signupState.phone || `${country.dial}${phone.trim().replace(/\D/g, '')}`;
      const expMap: Record<string, number> = { '< 1 yr': 0, '1–3 yrs': 2, '3–5 yrs': 4, '5–10 yrs': 7, '10+ yrs': 10 };
      await api.post(
        '/auth/complete-signup',
        {
          password,
          iso_code: isoCode,
          phone: fullPhone,
          specialisation_ids: isProvider ? selectedSpecialisationIds : undefined,
          years_of_experience: isProvider && experience ? expMap[experience] : undefined,
        },
        { useAuth: true }
      );
      sessionStorage.removeItem(SIGNUP_STATE_KEY);
      localStorage.setItem('profile_complete', 'true');
      await refreshProfile();
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition bg-white';
  const toggle = (active: boolean) =>
    `flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition cursor-pointer select-none text-center ${
      active ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'
    }`;

  const panel = PANELS[step];

  return (
    <div className="min-h-screen flex w-full">
      {/* ── LEFT: Form ────────────────────────────────── */}
   
      <div className={`hidden lg:flex lg:w-[44%] bg-gradient-to-br ${panel.gradient} flex-col justify-between p-10 relative overflow-hidden shrink-0`}
        style={{ transition: 'background 0.7s ease' }}>
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-12 w-72 h-72 rounded-full bg-white/8 pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-20 right-8 w-64 h-64 rounded-full bg-black/10 pointer-events-none" />

        {/* Logo */}
        <Link to="/" className="relative z-10">
          <img src="/logo.png" alt="Canoe Health" className="h-20 w-auto" />
        </Link>

        {/* Animated content */}
        <div key={panelKey} className="relative z-10 panel-in">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.18em] mb-3">{panel.label}</p>
          <h2 className="text-[28px] font-bold text-white leading-[1.2] whitespace-pre-line">{panel.headline}</h2>
          <p className="text-white/60 text-sm mt-3 leading-relaxed max-w-[280px]">{panel.body}</p>

          {/* Items — icons or flags */}
          <div className="mt-7 space-y-2.5">
            {'useFlags' in panel && panel.useFlags
              ? (
                <div className="grid grid-cols-3 gap-2">
                  {(panel.items as { flag: string; text: string }[]).map((item) => (
                    <div key={item.text} className="bg-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
                      <span className="text-lg leading-none">{item.flag}</span>
                      <span className="text-xs text-white/80 font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              )
              : (panel.items as { Icon: React.ComponentType<{ className?: string }>; text: string }[]).map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <item.Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white/80 font-medium">{item.text}</span>
                </div>
              ))
            }
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-10">
            {STEPS.map((_, i) => (
              <div key={i}
                className={`rounded-full transition-all duration-500 ${i === step ? 'w-7 h-2 bg-white' : 'w-2 h-2 bg-white/30'}`} />
            ))}
          </div>
        </div>

        {/* Trust / value section */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/20">
          <p className="text-white/70 text-xs font-medium mb-2">
            {isProvider ? 'Why providers join Canoe Health' : 'Why patients choose Canoe Health'}
          </p>
          <div className="space-y-2">
            {isProvider ? (
              <>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                  <span>Reach patients across East Africa</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                  <span>Set your own schedule & rates</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                  <span>Secure payments & verified profiles</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                  <span>Book appointments anytime, anywhere</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                  <span>Video, phone & chat with licensed providers</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                  <span>Privacy-first, secure care</span>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-white/20 text-xs relative z-10 mt-6">&copy; {new Date().getFullYear()} Canoe Health Ltd.</p>
      </div>
      
         <div className="flex-1 flex items-center justify-center bg-white p-6 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden mb-5 inline-block">
            <img src="/logo.png" alt="Canoe Health" className="h-8 w-auto" />
          </Link>

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">
              {isProvider ? 'Provider Registration' : 'Patient Registration'}
            </p>
            <span className="text-xs text-gray-400">Step {step + 1} / {totalSteps}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{STEPS[step]}</h1>

          {/* Step bar */}
          <div className="flex gap-1.5 mt-4 mb-6">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary' : 'bg-gray-200'}`} />
            ))}
          </div>

          {/* ── Step 0: Identity + Contact (merged) ── */}
          {step === 0 && (
            <div key={`form-${formKey}`} className="form-step-in space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First" className={inp} autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last" className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                <select
                  value={country.iso}
                  onChange={(e) => setCountry(COUNTRIES.find((c) => c.iso === e.target.value) ?? COUNTRIES[0])}
                  className={`${inp} cursor-pointer`}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.iso} value={c.iso}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                <div className="flex gap-2">
                  <select
                    value={country.iso}
                    onChange={(e) => setCountry(COUNTRIES.find((c) => c.iso === e.target.value) ?? COUNTRIES[0])}
                    className="px-2 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white cursor-pointer shrink-0"
                    style={{ minWidth: 108 }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.iso} value={c.iso}>{c.flag} {c.dial}</option>
                    ))}
                  </select>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="700 000 000" className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  City / Town <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Kampala" className={inp} />
              </div>
              <button onClick={next} disabled={!can0 || loading} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-1.5 text-sm mt-2">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Continue <ChevronRight className="w-4 h-4" /></>}
              </button>
              <p className="text-center text-xs text-gray-500">
                Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* ── Step 1: OTP Verification ── */}
          {step === 1 && (
            <div key={`form-${formKey}`} className="form-step-in flex flex-col items-center justify-center w-full">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 text-center mb-2">We sent a 4-digit code to your phone</p>
              {verifyPhone && <p className="text-sm font-medium text-gray-600 mb-6">{maskPhone(verifyPhone)}</p>}
              <form onSubmit={handleOtpSubmit} className="w-full space-y-5">
                <div className="flex justify-center gap-3">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-14 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {otpLoading ? 'Verifying...' : 'Verify & continue'}
                </button>
                <p className="text-center text-sm text-gray-500">
                  Didn't get it?{' '}
                  <button
                    type="button"
                    className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                  </button>
                </p>
              </form>
              <button
                type="button"
                onClick={() => goStep(0)}
                className="mt-4 text-sm text-gray-500 hover:text-primary transition"
              >
                ← Back
              </button>
            </div>
          )}

          {/* ── Step 2: Specialisation (provider only) ── */}
          {isProvider && step === 2 && (
            <div key={`form-${formKey}`} className="form-step-in space-y-3.5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Category + specialisations
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSpecialisationDetails((prev) => !prev);
                      if (showSpecialisationDetails) setExpandedCategoryId(null);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition"
                    title={showSpecialisationDetails ? 'Hide specialisation details' : 'Show specialisation details'}
                  >
                    {showSpecialisationDetails ? (
                      <>
                        <ChevronUp className="w-4 h-4" /> Hide details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" /> Show details
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={specialisationSearch}
                      onChange={(e) => setSpecialisationSearch(e.target.value)}
                      placeholder="Search category or speciality"
                      className={inp}
                      autoFocus={false}
                    />
                  </div>

                  <div className="max-h-[280px] overflow-y-auto pr-1 -mr-1 space-y-3 border border-gray-100 rounded-xl p-2">
                  {(() => {
                    const q = specialisationSearch.trim().toLowerCase();
                    const cats = q
                      ? categories.filter((c) => {
                          const specs = specialisationsByCategoryId[c.id] ?? [];
                          const catMatch = c.category_name.toLowerCase().includes(q);
                          const specMatch = specs.some((s) => s.item_name.toLowerCase().includes(q));
                          return catMatch || specMatch;
                        })
                      : categories;

                    return (
                      <div className="space-y-3">
                        {cats.map((c) => {
                          const specs = specialisationsByCategoryId[c.id] ?? [];
                          const filteredSpecs = q
                            ? specs.filter((s) => s.item_name.toLowerCase().includes(q))
                            : specs;
                          const categoryChecked = selectedCategoryIds.includes(c.id);
                          const anySpecInCategorySelected = specs.some((s) => selectedSpecialisationIds.includes(s.id));

                          return (
                            <div
                              key={c.id}
                              className={`rounded-xl border-2 transition ${
                                categoryChecked ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="w-full px-3 py-2.5 flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={anySpecInCategorySelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    // Bulk select/deselect all specs in category (works in both collapsed and expanded)
                                    if (anySpecInCategorySelected) {
                                      setSelectedSpecialisationIds((prev) => prev.filter((id) => !specs.some((s) => s.id === id)));
                                      setSelectedCategoryIds((prev) => prev.filter((id) => id !== c.id));
                                    } else {
                                      setSelectedSpecialisationIds((prev) => Array.from(new Set([...prev, ...specs.map((s) => s.id)])));
                                      setSelectedCategoryIds((prev) => (prev.includes(c.id) ? prev : [...prev, c.id]));
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-4 w-4 accent-primary shrink-0"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!showSpecialisationDetails) {
                                      setExpandedCategoryId((prev) => (prev === c.id ? null : c.id));
                                    }
                                  }}
                                  className="flex-1 flex items-center justify-between gap-2 text-left min-w-0"
                                >
                                  <span className="text-sm font-semibold text-gray-800 truncate">{c.category_name}</span>
                                  {!showSpecialisationDetails && (
                                    <ChevronDown
                                      className={`w-4 h-4 shrink-0 text-gray-500 transition-transform ${expandedCategoryId === c.id ? 'rotate-180' : ''}`}
                                    />
                                  )}
                                </button>
                              </div>

                              {(showSpecialisationDetails || expandedCategoryId === c.id) && (
                              <div className="px-3 pb-3">
                                {specs.length === 0 ? (
                                  <div className="text-sm text-gray-500 mt-1">Loading specialities…</div>
                                ) : filteredSpecs.length === 0 ? (
                                  <div className="text-sm text-gray-500 mt-1">No matching specialities</div>
                                ) : (
                                  <>
                                   <p className="mt-2 text-xs text-gray-500">
                                      Choose one or more specialities (multi-select).
                                    </p>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                      {filteredSpecs.map((s) => {
                                        const selected = selectedSpecialisationIds.includes(s.id);
                                        return (
                                          <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                              setSelectedSpecialisationIds((prev) => {
                                                const isSelected = prev.includes(s.id);
                                                const next = isSelected
                                                  ? prev.filter((id) => id !== s.id)
                                                  : Array.from(new Set([...prev, s.id]));

                                                // Keep category checkbox in sync with selected specialisations.
                                                setSelectedCategoryIds((catPrev) => {
                                                  const anySelectedInCategory = (specs ?? []).some((sp) =>
                                                    next.includes(sp.id)
                                                  );

                                                  if (!anySelectedInCategory) {
                                                    return catPrev.filter((id) => id !== c.id);
                                                  }

                                                  // Category should be checked if at least one specialisation is selected.
                                                  return catPrev.includes(c.id) ? catPrev : [...catPrev, c.id];
                                                });

                                                return next;
                                              });
                                            }}
                                            className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition text-left ${
                                              selected
                                                ? 'border-primary bg-primary-light text-primary'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                          >
                                            <span className="inline-flex items-center gap-2">
                                              <span
                                                className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                                                  selected ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white'
                                                }`}
                                              >
                                                {selected ? '✓' : ''}
                                              </span>
                                              <span>{s.item_name}</span>
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                   
                                  </>
                                )}
                              </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => goStep(1)}
                  className="w-24 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition shrink-0"
                >
                  Back
                </button>
                <button onClick={next} disabled={!canSpec} className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-1.5 text-sm">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Professional background (provider only) ── */}
          {isProvider && step === 3 && (
            <div key={`form-${formKey}`} className="form-step-in space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of experience</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {EXPERIENCE.map((opt) => (
                    <button key={opt} type="button" onClick={() => setExperience(opt)}
                      className={`py-2 rounded-xl border-2 text-xs font-semibold transition ${experience === opt ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Licensed to practice?</label>
                <div className="flex gap-2">
                  <button onClick={() => setLicensed('yes')} className={toggle(licensed === 'yes')}>✓ Yes</button>
                  <button onClick={() => setLicensed('no')}  className={toggle(licensed === 'no')}>✗ No</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional certificate?</label>
                <div className="flex gap-2">
                  <button onClick={() => setHasCert('yes')} className={toggle(hasCert === 'yes')}>✓ Yes</button>
                  <button onClick={() => setHasCert('no')}  className={toggle(hasCert === 'no')}>✗ No</button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => goStep(2)} className="w-24 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition shrink-0">Back</button>
                <button onClick={next} disabled={!canProfessional} className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-1.5 text-sm">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Security + Terms (provider: step 4, client: step 2) ── */}
          {((isProvider && step === 4) || (!isProvider && step === 2)) && (
            <form key={`form-${formKey}`} onSubmit={handleSubmit} className="form-step-in space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password <span className="text-gray-400 font-normal">(min 8 chars)</span>
                </label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" minLength={8} className={`${inp} pr-12`} autoFocus />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className={inp} />
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
                )}
              </div>

              {/* Detailed terms block */}
              <div className="border-2 border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Before you submit</p>
                {[
                  {
                    id: 'terms',
                    checked: agreedTerms,
                    set: setAgreedTerms,
                    label: (
                      <>
                        I have read and agree to the{' '}
                        <Link to="/terms" className="text-primary font-semibold hover:underline" target="_blank">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-primary font-semibold hover:underline" target="_blank">Privacy Policy</Link>
                      </>
                    ),
                  },
                  {
                    id: 'accurate',
                    checked: agreedAccurate,
                    set: setAgreedAccurate,
                    label: 'I confirm that all information I have provided is accurate and complete',
                  },
                  {
                    id: 'verify',
                    checked: agreedVerify,
                    set: setAgreedVerify,
                    label: 'I understand my account is subject to verification before I can start accepting patients',
                  },
                ].map((item) => (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${item.checked ? 'border-primary bg-primary' : 'border-gray-300 bg-white'}`}
                      onClick={() => item.set(!item.checked)}>
                      {item.checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span className="text-xs text-gray-600 leading-relaxed">{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => goStep(isProvider ? 3 : 1)}
                  className="w-24 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition shrink-0"
                >
                  Back
                </button>
                <button type="submit" disabled={loading || !canSecurity} className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-40 text-sm">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    : 'Create my account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── RIGHT: Animated info panel ─────────────────── */}
     
    </div>
  );
}
