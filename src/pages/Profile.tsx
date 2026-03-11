import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Settings, Shield, FileText, HelpCircle, LogOut, ChevronRight,
  Star, Users, Camera, Save, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface ProviderProfile {
  full_name?: string;
  email?: string;
  phone?: string;
  profile_pic?: string;
  bio?: string;
  specialization?: string;
  clinic_name?: string;
  consultation_fee?: number;
  is_available?: boolean;
  years_of_experience?: number;
  license_number?: string;
  average_rating?: number;
  total_reviews?: number;
  total_patients?: number;
  status?: string;
}

const MENU_ITEMS = [
  { to: '/settings',  icon: Settings,    label: 'Settings'           },
  { to: '/privacy',   icon: Shield,      label: 'Privacy Policy'     },
  { to: '/terms',     icon: FileText,    label: 'Terms of Service'   },
  { to: '/contact',   icon: HelpCircle,  label: 'Help & Support'     },
];

export default function Profile() {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // Edit form state
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [fee, setFee] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [yearsExp, setYearsExp] = useState('');

  useEffect(() => {
    api.get('/providers/profile')
      .then((r) => api.parseResponse<{ data?: { provider?: ProviderProfile } }>(r))
      .then((res) => {
        const p = res.data?.provider;
        if (p) {
          setProvider(p);
          setIsAvailable(!!p.is_available);
          setBio(p.bio || '');
          setSpecialization(p.specialization || '');
          setClinicName(p.clinic_name || '');
          setFee(p.consultation_fee !== undefined ? String(p.consultation_fee) : '');
          setLicenseNumber(p.license_number || '');
          setYearsExp(p.years_of_experience !== undefined ? String(p.years_of_experience) : '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleAvailability = async () => {
    const next = !isAvailable;
    setIsAvailable(next);
    try {
      await api.put('/providers/profile', { is_available: next ? 1 : 0 });
      toast.success(next ? 'Now accepting bookings' : 'Bookings paused');
    } catch {
      setIsAvailable(!next);
      toast.error('Failed to update availability');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/providers/profile', {
        bio,
        specialization,
        clinic_name: clinicName,
        consultation_fee: fee ? Number(fee) : undefined,
        license_number: licenseNumber,
        years_of_experience: yearsExp ? Number(yearsExp) : undefined,
      });
      setProvider((p) => p ? { ...p, bio, specialization, clinic_name: clinicName, consultation_fee: fee ? Number(fee) : p.consultation_fee, license_number: licenseNumber, years_of_experience: yearsExp ? Number(yearsExp) : p.years_of_experience } : p);
      toast.success('Profile updated');
      setEditing(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setUploading(true);
      try {
        await api.parseResponse(await api.post('/auth/upload-profile-pic', { profile_pic_base64: base64 }));
        await refreshProfile();
        toast.success('Profile picture updated');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to upload picture');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const pic = api.getProfilePicUrl(user?.profile_pic || provider?.profile_pic);
  const name = provider?.full_name || user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Provider';
  const rating = provider?.average_rating;
  const reviews = provider?.total_reviews || 0;
  const patients = provider?.total_patients || 0;

  const inp = 'w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition bg-white';

  return (
    <div className="w-full">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex items-start gap-5">
          {/* Avatar with upload */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-light">
              {pic ? (
                <img src={pic} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary text-3xl font-bold">
                  {name[0]}
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-dark transition disabled:opacity-50"
            >
              {uploading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{name}</h1>
                {provider?.specialization && <p className="text-sm text-primary font-medium mt-0.5">{provider.specialization}</p>}
                {provider?.clinic_name && <p className="text-sm text-gray-500">{provider.clinic_name}</p>}
              </div>
              <button onClick={() => setEditing(!editing)}
                className="shrink-0 flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
                <Edit3 className="w-3.5 h-3.5" /> {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {/* Stats row */}
            {!loading && (
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {rating !== undefined && (
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold">{rating.toFixed(1)}</span>
                    <span className="text-gray-400 text-xs">({reviews} reviews)</span>
                  </div>
                )}
                {patients > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-bold">{patients}</span>
                    <span className="text-gray-400 text-xs">patients</span>
                  </div>
                )}
                {provider?.years_of_experience !== undefined && (
                  <span className="text-sm text-gray-500">{provider.years_of_experience} yrs experience</span>
                )}
                {provider?.consultation_fee !== undefined && (
                  <span className="text-sm font-semibold text-primary">UGX {Number(provider.consultation_fee).toLocaleString()} / session</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Availability toggle */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">Accepting bookings</p>
            <p className="text-xs text-gray-500">Toggle to pause or resume patient bookings</p>
          </div>
          <button
            onClick={toggleAvailability}
            className={`w-12 h-6 rounded-full transition-colors relative ${isAvailable ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isAvailable ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
        {isAvailable && (
          <p className="text-xs text-green-600 font-medium mt-1.5">● You are currently accepting bookings</p>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white rounded-2xl shadow-sm border border-primary/30 p-6 mb-5">
          <h2 className="font-bold text-gray-900 mb-4">Edit Professional Profile</h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialization</label>
                <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. General Practitioner" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Clinic / Practice Name</label>
                <input type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="e.g. City Health Clinic" className={inp} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Consultation Fee (UGX)</label>
                <input type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="e.g. 50000" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of Experience</label>
                <input type="number" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} placeholder="e.g. 5" className={inp} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number</label>
              <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="Medical license number" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio / About</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell patients about yourself, your expertise, and your approach to care..." rows={4} className={`${inp} resize-none`} />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Profile</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact info */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Info</h2>
          <div className="space-y-2">
            {[
              { label: 'Email', value: user?.email || provider?.email },
              { label: 'Phone', value: user?.phone || provider?.phone },
              { label: 'License', value: provider?.license_number },
              { label: 'Status', value: provider?.status },
            ].filter((r) => r.value).map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-700">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bio display */}
      {provider?.bio && !editing && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{provider.bio}</p>
        </div>
      )}

      {/* Menu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {MENU_ITEMS.map((item) => (
          <Link key={item.to} to={item.to} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition">
            <item.icon className="w-5 h-5 text-gray-400" />
            <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        ))}
        <button onClick={handleLogout} className="flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition w-full">
          <LogOut className="w-5 h-5 text-red-500" />
          <span className="flex-1 text-sm font-medium text-red-600 text-left">Logout</span>
        </button>
      </div>
    </div>
  );
}
