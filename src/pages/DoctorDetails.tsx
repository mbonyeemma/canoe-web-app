import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, MapPin, Users, Award, Calendar } from 'lucide-react';
import api from '../services/api';

export default function DoctorDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/providers/${id}`)
      .then((r) => api.parseResponse<{ data?: any }>(r))
      .then((result) => setDoctor(result.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!doctor) return <div className="text-center py-12"><p className="text-gray-500">Doctor not found</p><Link to="/doctors" className="text-primary text-sm mt-2 inline-block">Back to doctors</Link></div>;

  const name = doctor.full_name || `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || 'Doctor';
  const pic = api.getProfilePicUrl(doctor.profile_pic);

  return (
    <div className="w-full">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-dark to-primary p-6 text-white">
          <div className="flex items-center gap-4">
            {pic ? (
              <img src={pic} alt="" className="w-20 h-20 rounded-full object-cover border-3 border-white/30" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">{name[0]}</div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{name}</h1>
              <p className="text-white/80">{doctor.specialty || 'General Practitioner'}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Clock, val: `${doctor.experience_years || 0}y`, label: 'Experience' },
              { icon: Users, val: doctor.total_patients || '0', label: 'Patients' },
              { icon: Star, val: doctor.rating || '0', label: 'Rating' },
              { icon: Award, val: doctor.total_reviews || '0', label: 'Reviews' },
            ].map((s) => (
              <div key={s.label} className="bg-surface rounded-xl p-3 text-center">
                <s.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{s.val}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {doctor.bio && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
            </div>
          )}

          {doctor.location && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <MapPin className="w-4 h-4" /> {doctor.location}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Consultation Fee</p>
              <p className="text-xl font-bold text-gray-900">UGX {Number(doctor.consultation_fee || 0).toLocaleString()}</p>
            </div>
            <Link to={`/doctors/${id}/book`} className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 rounded-lg transition">
              <Calendar className="w-5 h-5" /> Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
