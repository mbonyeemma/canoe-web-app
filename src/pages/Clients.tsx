import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Calendar, ChevronRight, Clock } from 'lucide-react';
import api from '../services/api';

interface Appointment {
  appointment_id: string;
  id?: string;
  client_id?: string;
  client_name?: string;
  client_pic?: string;
  appointment_date?: string;
  appointment_time?: string;
  status?: string;
  purpose?: string;
}

interface Client {
  id: string;
  name: string;
  pic?: string;
  totalAppointments: number;
  lastVisit?: string;
  lastStatus?: string;
  conditions: string[];
}

function deriveClients(appointments: Appointment[]): Client[] {
  const map: Record<string, Client> = {};
  for (const a of appointments) {
    const cid = a.client_id || a.client_name || 'unknown';
    if (!map[cid]) {
      map[cid] = {
        id: cid,
        name: a.client_name || 'Unknown Patient',
        pic: a.client_pic,
        totalAppointments: 0,
        conditions: [],
      };
    }
    const c = map[cid];
    c.totalAppointments++;
    const d = (a.appointment_date || '').split('T')[0];
    if (!c.lastVisit || d > c.lastVisit) {
      c.lastVisit = d;
      c.lastStatus = a.status;
    }
    if (a.purpose && !c.conditions.includes(a.purpose)) {
      c.conditions.push(a.purpose);
    }
  }
  return Object.values(map).sort((a, b) => (b.lastVisit || '').localeCompare(a.lastVisit || ''));
}

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  canceled:  'bg-red-100 text-red-700',
  no_show:   'bg-gray-100 text-gray-600',
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/appointments')
      .then((r) => api.parseResponse<{ data?: any }>(r))
      .then((res) => {
        const list: Appointment[] = Array.isArray(res.data) ? res.data : (res.data?.appointments || []);
        setClients(deriveClients(list));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : clients;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} patient{clients.length !== 1 ? 's' : ''} in your care</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patients by name..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
          <User className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">{search ? 'No patients match your search' : 'No clients yet'}</p>
          <p className="text-gray-300 text-xs mt-1">Clients appear here once you have accepted appointments</p>
        </div>
      ) : (
        <>
          {/* Table header (desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-4">Patient</div>
            <div className="col-span-3">Last Visit</div>
            <div className="col-span-2 text-center">Consultations</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1" />
          </div>

          <div className="space-y-2">
            {filtered.map((client) => {
              const status = (client.lastStatus || '').toLowerCase();
              const pic = api.getProfilePicUrl(client.pic);
              return (
                <Link
                  key={client.id}
                  to={`/clients/${encodeURIComponent(client.id)}`}
                  className="flex md:grid md:grid-cols-12 items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3.5 hover:shadow-md hover:border-primary/20 transition"
                >
                  {/* Avatar + Name */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    {pic ? (
                      <img src={pic} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold shrink-0">
                        {client.name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-sm">{client.name}</p>
                      {client.conditions[0] && (
                        <p className="text-xs text-gray-400 truncate">{client.conditions[0]}</p>
                      )}
                    </div>
                  </div>

                  {/* Last visit */}
                  <div className="col-span-3 hidden md:flex items-center gap-1.5 text-sm text-gray-500">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {client.lastVisit || 'Never'}
                  </div>

                  {/* Total */}
                  <div className="col-span-2 hidden md:flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-700">{client.totalAppointments}</span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 hidden md:flex items-center">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>
                      {status.replace('_', ' ') || 'N/A'}
                    </span>
                  </div>

                  {/* Mobile summary */}
                  <div className="md:hidden flex-1 text-right">
                    <span className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />{client.lastVisit || 'Never'}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{client.totalAppointments} visits</span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 col-span-1 shrink-0" />
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
