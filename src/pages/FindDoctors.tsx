import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Clock } from 'lucide-react';
import api from '../services/api';

interface Doctor {
  id: string;
  user_id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  specialty?: string;
  experience_years?: number;
  consultation_fee?: number;
  rating?: number;
  profile_pic?: string;
  location?: string;
  available?: boolean;
}

export default function FindDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/providers')
      .then((r) => api.parseResponse<{ data?: Doctor[] }>(r))
      .then((result) => setDoctors(Array.isArray(result.data) ? result.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter((d) => {
    const name = d.full_name || `${d.first_name || ''} ${d.last_name || ''}`;
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || (d.specialty || '').toLowerCase().includes(q);
  });

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Doctors</h1>
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name or specialty..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-500">{search ? 'No doctors match your search.' : 'No doctors available.'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => {
            const name = d.full_name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Doctor';
            const pic = api.getProfilePicUrl(d.profile_pic);
            return (
              <Link key={d.id || d.user_id} to={`/doctors/${d.id || d.user_id}`} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-3">
                  {pic ? (
                    <img src={pic} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-lg">{name[0]}</div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{name}</p>
                    <p className="text-sm text-primary">{d.specialty || 'General Practitioner'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {d.experience_years && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {d.experience_years}y exp</span>}
                  {d.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {d.location}</span>}
                  {d.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {d.rating}</span>}
                </div>
                {d.consultation_fee != null && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">UGX {Number(d.consultation_fee).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.available !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {d.available !== false ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
